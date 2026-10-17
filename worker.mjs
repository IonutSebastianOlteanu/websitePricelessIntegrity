const GITHUB_REPO = 'IonutSebastianOlteanu/websitePricelessIntegrity';
const BUSINESS_TIME_ZONE = 'America/New_York';
const MAX_REQUEST_BYTES = 16_000;

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function isValidEmail(value) {
    return /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(value);
}

async function readJson(request) {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
        throw new Error('Request is too large.');
    }
    return JSON.parse(body);
}

function hasDatabase(env) {
    return Boolean(env.DB && env.ASSETS);
}

async function requireOwner(request) {
    const authorization = request.headers.get('Authorization') || '';
    const match = authorization.match(/^(token|bearer)\s+(.+)$/i);
    if (!match) return { error: jsonResponse({ error: 'Owner authentication required.' }, 401) };

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
        headers: {
            Authorization: `${match[1]} ${match[2]}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'Madam-Beauty-Booking-Portal'
        }
    });
    if (!response.ok) return { error: jsonResponse({ error: 'Owner authentication failed.' }, 401) };

    const repository = await response.json();
    if (!repository.permissions || repository.permissions.push !== true) {
        return { error: jsonResponse({ error: 'Repository write access is required.' }, 403) };
    }
    return { owner: true };
}

async function getSalonEmail(request, env) {
    const response = await env.ASSETS.fetch(new Request(new URL('/contact.json', request.url)));
    if (!response.ok) throw new Error('Salon contact details are unavailable.');
    const contact = await response.json();
    if (!contact.email || !isValidEmail(contact.email)) {
        throw new Error('A valid salon email address is required.');
    }
    return contact.email;
}

async function getService(request, env, categoryTitle, serviceName) {
    const response = await env.ASSETS.fetch(new Request(new URL('/services.json', request.url)));
    if (!response.ok) throw new Error('Service catalog is unavailable.');
    const categories = await response.json();
    const category = Array.isArray(categories) && categories.find(item => item.title === categoryTitle);
    const service = category && Array.isArray(category.details)
        ? category.details.find(item => item.name === serviceName)
        : null;
    if (!service) return null;

    const durationText = service.duration || service.variants?.[0]?.duration || '';
    const durationMinutes = Number.parseInt(durationText, 10) || 60;
    return { categoryTitle: category.title, serviceName: service.name, durationMinutes };
}

async function sendResendEmail(env, message, idempotencyKey) {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
        throw new Error('Email delivery is not configured.');
    }
    const headers = {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
    };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, ...message })
    });
    if (!response.ok) {
        console.error('Resend rejected an email:', response.status, await response.text());
        throw new Error('The email provider could not deliver the message.');
    }
    return response.json();
}

function formatLocalDateTimeAsUtc(date, time) {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIME_ZONE,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    let candidate = desiredUtc;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate))
            .filter(part => part.type !== 'literal')
            .map(part => [part.type, Number(part.value)]));
        const representedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
        const corrected = desiredUtc - (representedUtc - candidate);
        if (corrected === candidate) break;
        candidate = corrected;
    }
    const finalParts = Object.fromEntries(formatter.formatToParts(new Date(candidate))
        .filter(part => part.type !== 'literal')
        .map(part => [part.type, Number(part.value)]));
    if (finalParts.year !== year || finalParts.month !== month || finalParts.day !== day ||
        finalParts.hour !== hour || finalParts.minute !== minute) {
        throw new Error('The chosen time does not exist in New York because of daylight saving time.');
    }
    return new Date(candidate);
}

function formatIcsUtc(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcs(value) {
    return String(value ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')
        .replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

export function buildCalendarInvite(booking, salonEmail) {
    const startsAt = formatLocalDateTimeAsUtc(booking.preferred_date, booking.preferred_time);
    const endsAt = new Date(startsAt.getTime() + booking.duration_minutes * 60_000);
    const stamp = formatIcsUtc(new Date());
    const lines = [
        'BEGIN:VCALENDAR',
        'PRODID:-//Madam Beauty//Appointment Booking//EN',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${booking.id}@priceless-integrity.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${formatIcsUtc(startsAt)}`,
        `DTEND:${formatIcsUtc(endsAt)}`,
        `SUMMARY:${escapeIcs(`Madam Beauty - ${booking.service_name}`)}`,
        `DESCRIPTION:${escapeIcs(`Booking reference: ${booking.reference}\nService: ${booking.category_title} - ${booking.service_name}\nPlease contact the salon if you need to make a change.`)}`,
        `LOCATION:${escapeIcs('Madam Beauty, New York, USA')}`,
        `ORGANIZER;CN=Madam Beauty:mailto:${salonEmail}`,
        `ATTENDEE;CN=${escapeIcs(booking.customer_name)};RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${booking.customer_email}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
        ''
    ];
    return lines.join('\r\n');
}

async function notifySalonOfRequest(request, env, booking) {
    const salonEmail = await getSalonEmail(request, env);
    const detailRows = [
        ['Reference', booking.reference],
        ['Customer', booking.customer_name],
        ['Email', booking.customer_email],
        ['Phone', booking.customer_phone],
        ['Service', `${booking.category_title} - ${booking.service_name}`],
        ['Preferred date', booking.preferred_date],
        ['Preferred time', booking.preferred_time],
        ['Notes', booking.notes || 'None']
    ].map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join('');

    await sendResendEmail(env, {
        to: [salonEmail],
        reply_to: booking.customer_email,
        subject: `Appointment request ${booking.reference}: ${booking.service_name}`,
        html: `<h2>New appointment request</h2>${detailRows}<p>Review and respond in the owner portal.</p>`
    }, `booking-${booking.id}-request`);
}

function bookingRequestError(error) {
    if (error instanceof SyntaxError) return jsonResponse({ error: 'The booking request is not valid JSON.' }, 400);
    if (error.message === 'Request is too large.') return jsonResponse({ error: error.message }, 413);
    return jsonResponse({ error: 'The booking request could not be processed.' }, 500);
}

async function createBooking(request, env) {
    let data;
    try {
        data = await readJson(request);
    } catch (error) {
        return bookingRequestError(error);
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return jsonResponse({ error: 'The booking request must be an object.' }, 400);
    }
    if (data.website) return jsonResponse({ accepted: true }, 202);

    const customerName = String(data.name || '').trim();
    const customerEmail = String(data.email || '').trim().toLowerCase();
    const customerPhone = String(data.phone || '').trim();
    const categoryTitle = String(data.categoryTitle || '').trim();
    const serviceName = String(data.serviceName || '').trim();
    const preferredDate = String(data.preferredDate || '');
    const preferredTime = String(data.preferredTime || '');
    const notes = String(data.notes || '').trim().slice(0, 2_000);

    if (customerName.length < 2 || customerName.length > 120) return jsonResponse({ error: 'Enter a valid name.' }, 400);
    if (customerEmail.length > 254 || !isValidEmail(customerEmail)) return jsonResponse({ error: 'Enter a valid email address.' }, 400);
    if (customerPhone.length < 7 || customerPhone.length > 40) return jsonResponse({ error: 'Enter a valid phone number.' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || !/^\d{2}:\d{2}$/.test(preferredTime)) return jsonResponse({ error: 'Choose a valid preferred date and time.' }, 400);

    const date = new Date(`${preferredDate}T00:00:00Z`);
    const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    const todayInBusinessTimeZone = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== preferredDate || preferredDate < todayInBusinessTimeZone) {
        return jsonResponse({ error: 'Choose a valid date that is not in the past.' }, 400);
    }
    const [requestedHour, requestedMinute] = preferredTime.split(':').map(Number);
    if (requestedHour > 23 || requestedMinute > 59) return jsonResponse({ error: 'Choose a valid time.' }, 400);

    let service;
    try {
        service = await getService(request, env, categoryTitle, serviceName);
    } catch (error) {
        console.error('Unable to validate requested service:', error);
        return jsonResponse({ error: 'The service catalog is temporarily unavailable.' }, 503);
    }
    if (!service) return jsonResponse({ error: 'Choose a service from the current service list.' }, 400);

    const recentRequests = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM bookings WHERE customer_email = ? AND datetime(created_at) >= datetime('now', '-1 hour')"
    ).bind(customerEmail).first();
    if ((recentRequests?.total || 0) >= 5) return jsonResponse({ error: 'Too many requests. Please contact the salon directly.' }, 429);

    const id = crypto.randomUUID();
    const booking = {
        id,
        reference: id.replaceAll('-', '').slice(0, 12).toUpperCase(),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        category_title: service.categoryTitle,
        service_name: service.serviceName,
        duration_minutes: service.durationMinutes,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        notes,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    await env.DB.prepare(`
        INSERT INTO bookings (
            id, reference, customer_name, customer_email, customer_phone,
            category_title, service_name, duration_minutes, preferred_date,
            preferred_time, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
        booking.id, booking.reference, booking.customer_name, booking.customer_email,
        booking.customer_phone, booking.category_title, booking.service_name,
        booking.duration_minutes, booking.preferred_date, booking.preferred_time,
        booking.notes, booking.created_at
    ).run();

    let salonNotified = false;
    try {
        await notifySalonOfRequest(request, env, booking);
        salonNotified = true;
    } catch (error) {
        console.error('Booking saved but salon notification failed:', error);
    }

    return jsonResponse({
        accepted: true,
        reference: booking.reference,
        salonNotified,
        message: salonNotified
            ? 'Your request was sent. The salon will contact you to confirm.'
            : 'Your request was recorded, but the salon could not be notified. Please contact the salon directly.'
    }, 201);
}

async function listBookings(request, env) {
    const auth = await requireOwner(request);
    if (auth.error) return auth.error;
    const result = await env.DB.prepare(`
        SELECT id, reference, customer_name, customer_email, customer_phone,
               category_title, service_name, duration_minutes, preferred_date,
               preferred_time, notes, status, created_at, confirmed_at
        FROM bookings
        ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'processing' THEN 1 ELSE 2 END,
                 created_at DESC
        LIMIT 200
    `).all();
    return jsonResponse({ bookings: result.results || [] });
}

async function notifyCustomerOfDecision(request, env, booking, action) {
    const salonEmail = await getSalonEmail(request, env);
    if (action === 'confirm') {
        const calendarInvite = buildCalendarInvite(booking, salonEmail);
        await sendResendEmail(env, {
            to: [booking.customer_email],
            reply_to: salonEmail,
            subject: `Appointment confirmed ${booking.reference}: ${booking.service_name}`,
            html: `<h2>Your appointment is confirmed</h2><p>Hi ${escapeHtml(booking.customer_name)},</p><p>Your ${escapeHtml(booking.service_name)} appointment is confirmed for ${escapeHtml(booking.preferred_date)} at ${escapeHtml(booking.preferred_time)} (New York time).</p><p>Booking reference: <strong>${escapeHtml(booking.reference)}</strong></p><p>A calendar invitation is attached. Please contact <a href="mailto:${escapeHtml(salonEmail)}">the salon</a> if you need to make a change.</p>`,
            attachments: [{
                filename: `madam-beauty-${booking.reference}.ics`,
                content: encodeBase64(calendarInvite),
                content_type: 'text/calendar; method=REQUEST; charset=utf-8'
            }]
        }, `booking-${booking.id}-confirmation`);
        return;
    }

    await sendResendEmail(env, {
        to: [booking.customer_email],
        reply_to: salonEmail,
        subject: `Appointment request update ${booking.reference}`,
        html: `<h2>Appointment request update</h2><p>Hi ${escapeHtml(booking.customer_name)},</p><p>Unfortunately, the salon cannot accommodate your requested ${escapeHtml(booking.service_name)} appointment on ${escapeHtml(booking.preferred_date)} at ${escapeHtml(booking.preferred_time)}.</p><p>Please reply to this email or call the salon to find another time.</p><p>Booking reference: <strong>${escapeHtml(booking.reference)}</strong></p>`
    }, `booking-${booking.id}-declined`);
}

async function updateBooking(request, env, bookingId) {
    const auth = await requireOwner(request);
    if (auth.error) return auth.error;
    if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return jsonResponse({ error: 'Invalid booking reference.' }, 400);

    let data;
    try {
        data = await readJson(request);
    } catch (error) {
        return bookingRequestError(error);
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return jsonResponse({ error: 'The booking update must be an object.' }, 400);
    }
    if (!['confirm', 'decline'].includes(data.action)) return jsonResponse({ error: 'Choose confirm or decline.' }, 400);

    const booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(bookingId).first();
    if (!booking) return jsonResponse({ error: 'Booking request not found.' }, 404);
    if (booking.status !== 'pending') return jsonResponse({ error: 'Only pending requests can be updated.' }, 409);

    const claim = await env.DB.prepare("UPDATE bookings SET status = 'processing' WHERE id = ? AND status = 'pending'")
        .bind(bookingId).run();
    if (claim.meta.changes !== 1) return jsonResponse({ error: 'This request has already been updated.' }, 409);

    try {
        await notifyCustomerOfDecision(request, env, booking, data.action);
        const finalStatus = data.action === 'confirm' ? 'confirmed' : 'declined';
        await env.DB.prepare(`
            UPDATE bookings SET status = ?, confirmed_at = ?, updated_at = ? WHERE id = ? AND status = 'processing'
        `).bind(finalStatus, data.action === 'confirm' ? new Date().toISOString() : null, new Date().toISOString(), bookingId).run();
        return jsonResponse({ updated: true, status: finalStatus });
    } catch (error) {
        console.error('Could not deliver the booking decision email:', error);
        await env.DB.prepare("UPDATE bookings SET status = 'pending' WHERE id = ? AND status = 'processing'")
            .bind(bookingId).run();
        return jsonResponse({ error: 'The email could not be sent. The request remains pending; check the email configuration and retry.' }, 502);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
        if (!hasDatabase(env)) return jsonResponse({ error: 'Booking storage is not configured.' }, 503);
        if (request.method === 'POST' && url.pathname === '/api/bookings') return createBooking(request, env);
        if (request.method === 'GET' && url.pathname === '/api/bookings') return listBookings(request, env);

        const bookingMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)$/);
        if (request.method === 'PATCH' && bookingMatch) return updateBooking(request, env, decodeURIComponent(bookingMatch[1]));
        return jsonResponse({ error: 'Not found.' }, 404);
    }
};
