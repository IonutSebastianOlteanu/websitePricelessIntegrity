const OWNER_DATA_STORAGE_KEY = 'owner_contact_data';
const OWNER_CONTACT_FILE_PATH = 'contact.json';
const DEFAULT_OWNER_DATA = {
    description: "Madam Beauty is proudly managed by PRICELESS Integrity, dedicated to delivering a premium, elite beauty experience tailored completely to you.",
    phone: "+1 (347) 299-2782",
    email: "contact@priceless-integrity.com",
    address: "New York, USA",
    program: "Mon - Fri: 09:00 - 21:00 | Sat: 09:00 - 18:00 | Sun: Closed"
};

let OWNER_DATA = { ...DEFAULT_OWNER_DATA };

async function loadOwnerData() {
    try {
        const response = await fetch(OWNER_CONTACT_FILE_PATH, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const fileData = await response.json();
        OWNER_DATA = { ...DEFAULT_OWNER_DATA, ...fileData };
        localStorage.setItem(OWNER_DATA_STORAGE_KEY, JSON.stringify(OWNER_DATA));
        return OWNER_DATA;
    } catch (error) {
        console.error('Error loading contact data:', error);
    }

    try {
        const stored = JSON.parse(localStorage.getItem(OWNER_DATA_STORAGE_KEY) || 'null');
        if (stored && typeof stored === 'object') {
            OWNER_DATA = { ...DEFAULT_OWNER_DATA, ...stored };
            return OWNER_DATA;
        }
    } catch (error) {
        console.warn('Invalid owner contact data in localStorage.', error);
    }

    OWNER_DATA = { ...DEFAULT_OWNER_DATA };
    return OWNER_DATA;
}

function saveOwnerData() {
    localStorage.setItem(OWNER_DATA_STORAGE_KEY, JSON.stringify(OWNER_DATA));
}

function updateOwnerField(field, value) {
    OWNER_DATA[field] = value;
    saveOwnerData();
    renderOwnerDetails(OWNER_DATA);
}

function populateBookingServices() {
    const serviceSelect = document.getElementById('bookingService');
    if (!serviceSelect || typeof SERVICES_DATA === 'undefined') return;

    const selectedService = serviceSelect.value;
    serviceSelect.replaceChildren(new Option('Select a service', '', true, !selectedService));
    SERVICES_DATA.forEach(category => {
        const group = document.createElement('optgroup');
        group.label = category.title || 'Services';
        (Array.isArray(category.details) ? category.details : []).forEach(service => {
            const option = document.createElement('option');
            option.value = service.name;
            option.dataset.categoryTitle = group.label;
            option.textContent = service.name;
            option.selected = option.value === selectedService;
            group.appendChild(option);
        });
        if (group.childElementCount) serviceSelect.appendChild(group);
    });
}

function initializeBookingForm() {
    const form = document.getElementById('bookingForm');
    const dateInput = document.getElementById('bookingDate');
    if (!form || !dateInput) return;

    const today = new Date();
    dateInput.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const request = new FormData(form);
        const selectedService = document.getElementById('bookingService').selectedOptions[0];
        const submitButton = form.querySelector('[type="submit"]');
        const status = document.getElementById('bookingStatus');
        submitButton.disabled = true;
        status.textContent = 'Sending your request...';

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: request.get('name'),
                    email: request.get('email'),
                    phone: request.get('phone'),
                    categoryTitle: selectedService.dataset.categoryTitle,
                    serviceName: selectedService.value,
                    preferredDate: request.get('date'),
                    preferredTime: request.get('time'),
                    notes: request.get('notes'),
                    website: request.get('website')
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'Your request could not be sent. Please try again.');
            status.textContent = result.message || 'Your appointment request was received.';
            form.reset();
            populateBookingServices();
        } catch (error) {
            status.textContent = error.message;
        } finally {
            submitButton.disabled = false;
        }
    });
}

function escapeContactHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// One contact line (icon, label, value); the value is a link when href is given.
function renderContactRow(icon, label, value, href) {
    if (!String(value || '').trim()) return '';
    const text = escapeContactHtml(value);
    return `
        <li class="contact-row">
            <span class="contact-icon"><i class="fa-solid ${icon}" aria-hidden="true"></i></span>
            <span class="contact-row-text">
                <span class="contact-label">${label}</span>
                ${href ? `<a href="${escapeContactHtml(href)}">${text}</a>` : `<span>${text}</span>`}
            </span>
        </li>`;
}

async function renderOwnerDetails(ownerData) {
    const currentOwnerData = ownerData || await loadOwnerData();
    renderNavContact(currentOwnerData);
    renderSiteContactText(currentOwnerData);
    const card = document.getElementById('ownerCard');
    if (!card) return;
    const phoneHref = `tel:${String(currentOwnerData.phone || '').replace(/[^\d+]/g, '')}`;
    card.innerHTML = `
        <p class="section-kicker">Visit the Salon</p>
        <h3>Salon &amp; Owner Details</h3>
        ${currentOwnerData.description ? `<p class="contact-intro">${escapeContactHtml(currentOwnerData.description)}</p>` : ''}
        <ul class="contact-list">
            ${renderContactRow('fa-phone', 'Phone', currentOwnerData.phone, phoneHref)}
            ${renderContactRow('fa-envelope', 'Email', currentOwnerData.email, `mailto:${currentOwnerData.email}`)}
            ${renderContactRow('fa-location-dot', 'Address', currentOwnerData.address)}
            ${renderContactRow('fa-clock', 'Hours', currentOwnerData.program)}
        </ul>
        <div class="contact-actions">
            <button type="button" class="btn btn-gold" data-open-booking>Request an Appointment</button>
            ${currentOwnerData.phone ? `<a class="btn btn-outline" href="${escapeContactHtml(phoneHref)}"><i class="fa-solid fa-phone" aria-hidden="true"></i>Call Us</a>` : ''}
        </div>
    `;
}

// Fill the short contact text shown in the hero and the footer
function renderSiteContactText(ownerData) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value || '';
        const holder = el.closest('[data-contact-item]');
        if (holder) holder.hidden = !value;
    };
    setText('heroAddress', ownerData.address);
    setText('heroHours', ownerData.program);
    setText('footerAddress', ownerData.address);
    setText('footerHours', ownerData.program);
    const phone = String(ownerData.phone || '').replace(/[^\d+]/g, '');
    const footerPhone = document.getElementById('footerPhone');
    if (footerPhone) {
        footerPhone.textContent = ownerData.phone || '';
        footerPhone.href = `tel:${phone}`;
        footerPhone.closest('[data-contact-item]').hidden = !phone;
    }
    const footerEmail = document.getElementById('footerEmail');
    if (footerEmail) {
        footerEmail.textContent = ownerData.email || '';
        footerEmail.href = `mailto:${ownerData.email || ''}`;
        footerEmail.closest('[data-contact-item]').hidden = !ownerData.email;
    }
}

// Point the quick "Call" / "Email" buttons in the header menu at the owner's details
function renderNavContact(ownerData) {
    const phoneLink = document.getElementById('navPhone');
    const emailLink = document.getElementById('navEmail');
    const phone = String(ownerData.phone || '').replace(/[^\d+]/g, '');
    if (phoneLink) {
        phoneLink.hidden = !phone;
        if (phone) phoneLink.href = `tel:${phone}`;
    }
    if (emailLink) {
        emailLink.hidden = !ownerData.email;
        if (ownerData.email) emailLink.href = `mailto:${ownerData.email}`;
    }
}

function renderFooter() {
    const container = document.getElementById('footerCopyright');
    if (container) {
        container.innerHTML = `&copy; ${new Date().getFullYear()} Madam Beauty by Priceless Integrity. All rights reserved.`;
    }
}