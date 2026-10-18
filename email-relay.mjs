import { EmailMessage } from 'cloudflare:email';

// Email relay for the salon address (contact@).
//
// Incoming mail to contact@ is rewritten and sent to the owner's personal inbox
// (OWNER_EMAIL secret) with a private Reply-To of contact+r-<code>@. When the owner
// replies, the message arrives back here and is sent to the original correspondent
// from contact@, so the owner's personal address is never shown.
//
// Requires Email Routing subaddressing and a rule sending contact@ to this Worker.

const RELAY_TAG_PREFIX = 'r-';
const RELAY_CODE_BYTES = 12;
const RELAY_THREAD_MAX_AGE_DAYS = 180;
const MAX_RELAY_BYTES = 4_500_000; // Email Service limit is 5 MiB per message.

// Headers that must not survive a rewrite: transport traces, signatures that the
// rewrite would invalidate, and addressing that we replace.
const STRIPPED_HEADERS = new Set([
    'from', 'sender', 'reply-to', 'return-path', 'received', 'dkim-signature',
    'arc-seal', 'arc-message-signature', 'arc-authentication-results',
    'authentication-results', 'received-spf', 'x-original-from', 'delivered-to'
]);

function bytesIndexOf(bytes, pattern) {
    outer: for (let i = 0; i <= bytes.length - pattern.length; i += 1) {
        for (let j = 0; j < pattern.length; j += 1) {
            if (bytes[i + j] !== pattern[j]) continue outer;
        }
        return i;
    }
    return -1;
}

function splitMessage(bytes) {
    let index = bytesIndexOf(bytes, [13, 10, 13, 10]);
    let separatorLength = 4;
    if (index === -1) {
        index = bytesIndexOf(bytes, [10, 10]);
        separatorLength = 2;
    }
    if (index === -1) throw new Error('Message has no header/body separator.');

    const headerText = new TextDecoder().decode(bytes.subarray(0, index));
    const headers = [];
    for (const line of headerText.split(/\r?\n/)) {
        if (/^[ \t]/.test(line) && headers.length) {
            headers[headers.length - 1].value += `\r\n${line}`;
            continue;
        }
        const colon = line.indexOf(':');
        if (colon <= 0) continue;
        headers.push({ name: line.slice(0, colon), value: line.slice(colon + 1).replace(/^ /, '') });
    }
    return { headers, body: bytes.subarray(index + separatorLength) };
}

function buildMessage(headers, body) {
    const headerBytes = new TextEncoder().encode(
        headers.map(header => `${header.name}: ${header.value}`).join('\r\n') + '\r\n\r\n'
    );
    const raw = new Uint8Array(headerBytes.length + body.length);
    raw.set(headerBytes);
    raw.set(body, headerBytes.length);
    return new Response(raw).body;
}

function getHeader(headers, name) {
    const header = headers.find(item => item.name.toLowerCase() === name);
    return header ? header.value.replace(/\r\n[ \t]+/g, ' ').trim() : '';
}

function parseMailbox(value) {
    const angle = value.match(/<\s*([^<>\s]+@[^<>\s]+)\s*>/);
    const email = (angle ? angle[1] : (value.match(/[^\s<>",;:]+@[^\s<>",;:]+/) || [''])[0]).toLowerCase();
    const name = angle ? value.slice(0, angle.index).trim().replace(/^"(.*)"$/, '$1').trim() : '';
    return { email, name };
}

function displayName(name, suffix) {
    // RFC 2047 encoded words cannot sit inside a quoted string.
    if (name.includes('=?')) return `${name} ${suffix}`;
    const plain = name.replace(/["\\\r\n]/g, '').trim();
    return `"${plain ? `${plain} ${suffix}` : suffix}"`;
}

function parseAddress(address) {
    const at = address.lastIndexOf('@');
    const local = address.slice(0, at);
    const domain = address.slice(at + 1).toLowerCase();
    const plus = local.indexOf('+');
    return {
        base: `${(plus === -1 ? local : local.slice(0, plus)).toLowerCase()}@${domain}`,
        tag: plus === -1 ? '' : local.slice(plus + 1).toLowerCase(),
        domain
    };
}

async function readRaw(message) {
    return new Uint8Array(await new Response(message.raw).arrayBuffer());
}

function newRelayCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(RELAY_CODE_BYTES));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Mail from the outside world to contact@: deliver it to the owner with a private
// relay Reply-To. Falls back to plain forwarding so incoming mail is never lost.
async function relayToOwner(message, env, salonAddress, domain) {
    try {
        if (message.rawSize > MAX_RELAY_BYTES) throw new Error('Message is too large to relay.');
        const { headers, body } = splitMessage(await readRaw(message));
        const sender = parseMailbox(getHeader(headers, 'from'));
        const replyTarget = parseMailbox(getHeader(headers, 'reply-to') || getHeader(headers, 'from'));
        if (!replyTarget.email) throw new Error('Message has no sender address.');

        const code = newRelayCode();
        await env.DB.prepare('INSERT INTO relay_threads (code, correspondent_email, created_at) VALUES (?, ?, ?)')
            .bind(code, replyTarget.email, new Date().toISOString()).run();

        const salonLocal = salonAddress.slice(0, salonAddress.indexOf('@'));
        const rewritten = headers.filter(header => !STRIPPED_HEADERS.has(header.name.toLowerCase()));
        rewritten.unshift(
            { name: 'From', value: `${displayName(sender.name || sender.email, 'via Madam Beauty')} <${salonAddress}>` },
            { name: 'Reply-To', value: `<${salonLocal}+${RELAY_TAG_PREFIX}${code}@${domain}>` },
            { name: 'X-Original-From', value: getHeader(headers, 'from') }
        );
        await env.EMAIL.send(new EmailMessage(salonAddress, env.OWNER_EMAIL, buildMessage(rewritten, body)));
    } catch (error) {
        console.error('Email relay to owner failed, forwarding unchanged:', error);
        await message.forward(env.OWNER_EMAIL);
    }
}

// The owner's reply to contact+r-<code>@: send it to the original correspondent
// from contact@. Anything that is not a valid reply from the owner is rejected.
async function relayOwnerReply(message, env, salonAddress, code) {
    if (message.from.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) {
        message.setReject('This address only accepts replies from the salon.');
        return;
    }
    const thread = await env.DB.prepare(
        "SELECT correspondent_email FROM relay_threads WHERE code = ? AND datetime(created_at) >= datetime('now', ?)"
    ).bind(code, `-${RELAY_THREAD_MAX_AGE_DAYS} days`).first();
    if (!thread) {
        message.setReject('This reply address has expired. Please email the customer from a new message to the salon.');
        return;
    }
    if (message.rawSize > MAX_RELAY_BYTES) {
        message.setReject('The reply is larger than 4.5 MB. Please remove some attachments and send it again.');
        return;
    }

    try {
        const { headers, body } = splitMessage(await readRaw(message));
        if (parseMailbox(getHeader(headers, 'from')).email !== env.OWNER_EMAIL.toLowerCase()) {
            message.setReject('This address only accepts replies from the salon.');
            return;
        }
        // Drop the owner's mail-client headers (including X-*) so nothing personal leaks.
        const kept = headers.filter(header => {
            const name = header.name.toLowerCase();
            return !STRIPPED_HEADERS.has(name) && !name.startsWith('x-') && !['to', 'cc', 'bcc', 'message-id'].includes(name);
        });
        kept.unshift(
            { name: 'From', value: `"Madam Beauty" <${salonAddress}>` },
            { name: 'To', value: `<${thread.correspondent_email}>` },
            { name: 'Message-ID', value: `<${crypto.randomUUID()}@${salonAddress.slice(salonAddress.indexOf('@') + 1)}>` }
        );
        await env.EMAIL.send(new EmailMessage(salonAddress, thread.correspondent_email, buildMessage(kept, body)));
    } catch (error) {
        console.error('Email relay of owner reply failed:', error.code, error.message);
        message.setReject('Your reply could not be delivered to the customer. Please try again later.');
    }
}

export async function handleIncomingEmail(message, env) {
    if (!env.OWNER_EMAIL || !env.EMAIL || !env.DB) {
        console.error('Email relay is not configured (OWNER_EMAIL, EMAIL, and DB are required).');
        if (env.OWNER_EMAIL) await message.forward(env.OWNER_EMAIL);
        else message.setReject('Mailbox temporarily unavailable.');
        return;
    }

    const recipient = parseAddress(message.to);
    if (recipient.tag.startsWith(RELAY_TAG_PREFIX)) {
        await relayOwnerReply(message, env, recipient.base, recipient.tag.slice(RELAY_TAG_PREFIX.length));
        return;
    }
    if (message.from.toLowerCase() === env.OWNER_EMAIL.toLowerCase()) {
        await message.forward(env.OWNER_EMAIL);
        return;
    }
    await relayToOwner(message, env, recipient.base, recipient.domain);
}
