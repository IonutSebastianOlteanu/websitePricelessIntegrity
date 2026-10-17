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

async function renderOwnerDetails(ownerData) {
    const currentOwnerData = ownerData || await loadOwnerData();
    const card = document.getElementById('ownerCard');
    if (!card) return;
    card.innerHTML = `
        <h3>Salon & Owner Details</h3>
        <p style="color: var(--text-muted); margin-bottom: 25px;">${currentOwnerData.description}</p>
        <div class="contact-info-item">
            <p><strong>Phone:</strong> <a href="tel:${currentOwnerData.phone}" style="color: inherit; font-family: inherit; text-decoration: none; border-bottom: 1px dashed rgba(169, 125, 51, 0.4); padding-bottom: 2px; transition: color 0.2s, border-bottom-color 0.2s;" onmouseenter="this.style.color='var(--primary-gold)'; this.style.borderBottomColor='var(--primary-gold)'" onmouseleave="this.style.color='inherit'; this.style.borderBottomColor='rgba(169, 125, 51, 0.4)'">${currentOwnerData.phone}</a></p>
        </div>
        <div class="contact-info-item">
            <p><strong>Email:</strong> <a href="mailto:${currentOwnerData.email}" style="color: inherit; font-family: inherit; text-decoration: none; border-bottom: 1px dashed rgba(169, 125, 51, 0.4); padding-bottom: 2px; transition: color 0.2s, border-bottom-color 0.2s;" onmouseenter="this.style.color='var(--primary-gold)'; this.style.borderBottomColor='var(--primary-gold)'" onmouseleave="this.style.color='inherit'; this.style.borderBottomColor='rgba(169, 125, 51, 0.4)'">${currentOwnerData.email}</a></p>
        </div>
        <div class="contact-info-item">
            <p><strong>Address:</strong> ${currentOwnerData.address}</p>
        </div>
        <div class="contact-info-item" style="margin-top: 15px;">
            <p><strong>Program:</strong> ${currentOwnerData.program}</p>
        </div>
    `;
}

function renderFooter() {
    const container = document.getElementById('footerCopyright');
    if (container) {
        container.innerHTML = `Copyright &copy; ${new Date().getFullYear()} Madam Beauty. All rights reserved.`;
    }
}