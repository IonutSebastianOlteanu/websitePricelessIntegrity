let SERVICES_DATA = [];
let ACTIVE_SERVICE_CATEGORY = 0;

// Optional per-service sections; a section is shown only when its field has text.
const SERVICE_DETAIL_SECTIONS = [
    { field: 'includes', title: 'Includes' },
    { field: 'benefits', title: 'Benefits' },
    { field: 'results', title: 'Results' },
    { field: 'idealFor', title: 'Ideal For' }
];

// Removes a leading bullet ("●", "•", "-", "*") that was typed by hand.
function stripSectionBullet(line) {
    return String(line || '').replace(/^\s*[●•*\-]\s*/, '').trim();
}

// A section is stored as text with one entry per line.
function getSectionLines(value) {
    return String(value || '').split('\n').map(stripSectionBullet).filter(Boolean);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function loadServicesData() {
    try {
        const response = await fetch('services.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        SERVICES_DATA = await response.json();
        renderServices();
    } catch (error) {
        console.error('Error loading services data:', error);
    }
}

// Tidy price/duration text ("$ 750" -> "$750") and move single "price" values to "originalPrice",
// so "price" is only set when a service is on offer.
function normalizeServicesData() {
    const tidy = value => typeof value === 'string' ? value.trim().replace(/^\$\s+/, '$') : value;
    const normalize = item => {
        ['duration', 'price', 'originalPrice'].forEach(key => { item[key] = tidy(item[key]); });
        if (item.price && !item.originalPrice) {
            item.originalPrice = item.price;
            item.price = '';
        }
    };
    SERVICES_DATA.forEach(category => {
        (category.details || []).forEach(detail => {
            normalize(detail);
            (detail.variants || []).forEach(normalize);
        });
    });
}

// "60 minutes" -> "60 min"
function formatDuration(value) {
    return String(value || '').replace(/\bminutes?\b/i, 'min').trim();
}

function getLowestPrice(category) {
    const amounts = [];
    (category.details || []).forEach(detail => {
        [detail, ...(detail.variants || [])].forEach(option => {
            const match = String(option.price || option.originalPrice || '').replace(/,/g, '').match(/\d+(\.\d+)?/);
            if (match) amounts.push(Number(match[0]));
        });
    });
    return amounts.length ? Math.min(...amounts) : null;
}

function renderPrice(option) {
    const isOffer = option.price && option.originalPrice;
    if (isOffer) {
        return `<span class="badge-offer">Special Offer</span>
            <span class="price-was">${escapeHtml(option.originalPrice)}</span>
            <span class="price price-sale">${escapeHtml(option.price)}</span>`;
    }
    const price = option.price || option.originalPrice;
    return price ? `<span class="price">${escapeHtml(price)}</span>` : '';
}

function renderServiceSections(detail) {
    return SERVICE_DETAIL_SECTIONS
        .map(section => ({ section, lines: getSectionLines(detail[section.field]) }))
        .filter(({ lines }) => lines.length)
        .map(({ section, lines }) => `
            <div class="treatment-section">
                <h5>${section.title}</h5>
                <ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
            </div>`)
        .join('');
}

function renderTreatment(detail, index) {
    const options = [detail, ...(detail.variants || [])].filter(o => o.duration || o.price || o.originalPrice);
    const sections = renderServiceSections(detail);
    const description = String(detail.description || '').trim();
    const hasMore = Boolean(sections) || description.length > 150;
    const detailsId = `treatment-${ACTIVE_SERVICE_CATEGORY}-${index}`;

    return `
        <li class="treatment">
            <div class="treatment-main">
                <h4 class="treatment-name">${escapeHtml(detail.name)}</h4>
                ${description ? `<p class="treatment-desc${hasMore ? ' is-clamped' : ''}">${escapeHtml(description)}</p>` : ''}
                ${sections ? `<div class="treatment-sections" id="${detailsId}">${sections}</div>` : ''}
                ${hasMore ? `<button type="button" class="treatment-more" aria-expanded="false"${sections ? ` aria-controls="${detailsId}"` : ''} onclick="toggleTreatment(this)">View details</button>` : ''}
            </div>
            <div class="treatment-side">
                ${options.length ? `<ul class="treatment-options">
                    ${options.map(option => `
                        <li>
                            ${option.duration ? `<span class="duration"><i class="fa-regular fa-clock" aria-hidden="true"></i>${escapeHtml(formatDuration(option.duration))}</span>` : '<span class="duration"></span>'}
                            <span class="price-wrap">${renderPrice(option)}</span>
                        </li>`).join('')}
                </ul>` : ''}
                <button type="button" class="btn btn-outline btn-sm" data-open-booking data-service="${escapeHtml(detail.name)}">Book</button>
            </div>
        </li>`;
}

function toggleTreatment(button) {
    const treatment = button.closest('.treatment');
    const isOpen = treatment.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.textContent = isOpen ? 'Hide details' : 'View details';
}

function selectServiceCategory(index, focusTab) {
    ACTIVE_SERVICE_CATEGORY = index;
    renderServices();
    if (focusTab) {
        const tab = document.getElementById(`service-tab-${index}`);
        if (tab) tab.focus();
    }
}

function handleServiceTabKeydown(event, index) {
    const count = SERVICES_DATA.length;
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (event.key in moves) {
        event.preventDefault();
        selectServiceCategory((index + moves[event.key] + count) % count, true);
    } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        selectServiceCategory(event.key === 'Home' ? 0 : count - 1, true);
    }
}

function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    normalizeServicesData();
    if (!SERVICES_DATA.length) {
        grid.innerHTML = '<p class="menu-empty">Our treatment menu will be available soon.</p>';
        return;
    }
    if (ACTIVE_SERVICE_CATEGORY >= SERVICES_DATA.length) ACTIVE_SERVICE_CATEGORY = 0;

    const active = SERVICES_DATA[ACTIVE_SERVICE_CATEGORY];
    const details = Array.isArray(active.details) ? active.details : [];
    const lowest = getLowestPrice(active);
    const countLabel = `${details.length} ${details.length === 1 ? 'treatment' : 'treatments'}`;

    grid.innerHTML = `
        <div class="menu-tabs" role="tablist" aria-label="Service categories">
            ${SERVICES_DATA.map((category, index) => {
                const selected = index === ACTIVE_SERVICE_CATEGORY;
                const count = (category.details || []).length;
                return `
                <button type="button" role="tab" class="menu-tab" id="service-tab-${index}"
                    aria-selected="${selected}" aria-controls="service-panel" tabindex="${selected ? '0' : '-1'}"
                    onclick="selectServiceCategory(${index})" onkeydown="handleServiceTabKeydown(event, ${index})">
                    <span class="menu-tab-title">${escapeHtml(category.title || 'Services')}</span>
                    <span class="menu-tab-count">${count} ${count === 1 ? 'treatment' : 'treatments'}</span>
                </button>`;
            }).join('')}
        </div>
        <div class="menu-panel" id="service-panel" role="tabpanel" aria-labelledby="service-tab-${ACTIVE_SERVICE_CATEGORY}">
            <div class="menu-panel-head">
                <h3>${escapeHtml(active.title || 'Services')}</h3>
                <p class="menu-panel-meta">${countLabel}${lowest !== null ? ` · from $${lowest.toLocaleString('en-US')}` : ''}</p>
                ${active.description ? `<p class="menu-panel-desc">${escapeHtml(active.description)}</p>` : ''}
            </div>
            <ul class="treatment-list">
                ${details.map(renderTreatment).join('')}
            </ul>
        </div>`;
}
