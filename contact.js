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

async function renderOwnerDetails(ownerData) {
    const currentOwnerData = ownerData || await loadOwnerData();
    const card = document.getElementById('ownerCard');
    if (!card) return;
    card.innerHTML = `
        <h3>Salon & Owner Details</h3>
        <p style="color: #aaa; margin-bottom: 25px;">${currentOwnerData.description}</p>
        <div class="contact-info-item">
            <p><strong>Phone:</strong> <a href="tel:${currentOwnerData.phone}" style="color: inherit; font-family: inherit; text-decoration: none; border-bottom: 1px dashed rgba(255, 255, 255, 0.3); padding-bottom: 2px; transition: color 0.2s, border-bottom-color 0.2s;" onmouseenter="this.style.color='var(--primary-gold)'; this.style.borderBottomColor='var(--primary-gold)'" onmouseleave="this.style.color='inherit'; this.style.borderBottomColor='rgba(255, 255, 255, 0.3)'">${currentOwnerData.phone}</a></p>
        </div>
        <div class="contact-info-item">
            <p><strong>Email:</strong> <a href="mailto:${currentOwnerData.email}" style="color: inherit; font-family: inherit; text-decoration: none; border-bottom: 1px dashed rgba(255, 255, 255, 0.3); padding-bottom: 2px; transition: color 0.2s, border-bottom-color 0.2s;" onmouseenter="this.style.color='var(--primary-gold)'; this.style.borderBottomColor='var(--primary-gold)'" onmouseleave="this.style.color='inherit'; this.style.borderBottomColor='rgba(255, 255, 255, 0.3)'">${currentOwnerData.email}</a></p>
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