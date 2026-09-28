let SERVICES_DATA = [];

async function loadServicesData() {
    try {
        const response = await fetch('services.json');
        SERVICES_DATA = await response.json();
        renderServices();
    } catch (error) {
        console.error('Error loading services data:', error);
    }
}

function toggleServiceDetails(event, cardElement) {
    if (event && event.target.closest('.service-details')) {
        return;
    }
    const details = cardElement.querySelector('.service-details');
    const indicator = cardElement.querySelector('.expand-indicator');
    
    if (details.style.display === 'none' || !details.style.display) {
        details.style.display = 'block';
        indicator.innerText = '−';
    } else {
        details.style.display = 'none';
        indicator.innerText = '+';
    }
}

function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
}

function highlightText(text, term) {
    if (text === undefined || text === null) return '';
    const stringText = String(text);
    if (!term.trim()) return stringText;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return stringText.replace(regex, '<mark style="background-color: rgba(223, 183, 108, 0.4); color: inherit; padding: 0 2px; border-radius: 2px;">$1</mark>');
}

function clearSearch() {
    const input = document.getElementById('serviceSearch');
    if (input) {
        input.value = '';
        updateSearchUI('');
        renderServices('');
    }
}

function updateSearchUI(value) {
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.style.display = value ? 'inline-block' : 'none';
    }
}

const debouncedRender = debounce(renderServices, 300);

function handleSearch(event) {
    const value = event.target.value;
    updateSearchUI(value);
    debouncedRender(value);
}

function renderServices(searchTerm = "") {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    // Normalize data: Move single "price" values to "originalPrice"
    SERVICES_DATA.forEach(cat => {
        if (cat.details) {
            cat.details.forEach(d => {
                if (d.price && !d.originalPrice) {
                    d.originalPrice = d.price;
                    d.price = '';
                }
                if (d.variants) {
                    d.variants.forEach(v => {
                        if (v.price && !v.originalPrice) {
                            v.originalPrice = v.price;
                            v.price = '';
                        }
                    });
                }
            });
        }
    });

    const filtered = SERVICES_DATA.filter(service => 
        (service.title && service.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        service.details.some(d => 
            (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.description && String(d.description).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.duration && String(d.duration).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.price && String(d.price).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.originalPrice && String(d.originalPrice).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.variants && d.variants.some(v => 
                (v.duration && String(v.duration).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (v.price && String(v.price).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (v.originalPrice && String(v.originalPrice).toLowerCase().includes(searchTerm.toLowerCase()))
            ))
        )
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">No services found matching your search.</p>';
        return;
    }

    const isSearching = searchTerm.trim().length > 0;
    const displayStyle = isSearching ? 'block' : 'none';
    const indicatorText = isSearching ? '−' : '+';

    grid.innerHTML = filtered.map(service => {
        const hasVariants = service.details.some(d => d.variants && d.variants.length > 0);
        const hasDiscounts = service.details.some(d => {
            const itemHasVariants = d.variants && d.variants.length > 0;
            if (itemHasVariants) {
                return d.variants.some(v => v.price && v.originalPrice);
            }
            return d.price && d.originalPrice;
        });

        const highlightStyle = hasDiscounts
            ? 'border: 1px solid rgba(255, 77, 77, 0.4); box-shadow: 0 4px 20px rgba(255, 77, 77, 0.15);'
            : hasVariants
                ? 'border: 1px solid rgba(223, 183, 108, 0.4); box-shadow: 0 4px 20px rgba(223, 183, 108, 0.1);'
                : '';

        return `
        <div class="service-card" onclick="toggleServiceDetails(event, this)" style="${highlightStyle}">
            <h3 style="display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap;">
                ${highlightText(service.title, searchTerm)}
                <span class="expand-indicator" style="color: var(--primary-gold); font-size: 1.2rem;">${indicatorText}</span>
            </h3>
            <p>${service.description}</p>
            <div class="service-details" style="display: ${displayStyle}; margin-top: 20px;">
                <ul style="list-style: none; padding: 0; font-size: 0.85rem; color: #ccc;">
                    ${service.details.map(detail => {
                        const hasVariants = detail.variants && detail.variants.length > 0;

                        const isPromo = detail.price && detail.originalPrice;
                        const displayPrice = detail.price || detail.originalPrice || '';

                        return `
                        <li style="margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 12px; padding-left: 12px; border-left: 2px solid rgba(223, 183, 108, 0.2); transition: border-left-color 0.3s;" onmouseenter="this.style.borderLeftColor='var(--primary-gold)'" onmouseleave="this.style.borderLeftColor='rgba(223, 183, 108, 0.2)'">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 4px;">
                                <span style="font-weight: 600; color: #fff; font-size: 0.95rem; letter-spacing: 0.5px;">${highlightText(detail.name, searchTerm)}</span>
                                <div style="text-align: right; display: flex; align-items: center; gap: 6px; justify-content: flex-end; flex-wrap: wrap;">
                                    ${detail.duration ? `<span style="color: #888; font-size: 0.8rem; margin-right: 4px;">${highlightText(detail.duration, searchTerm)}</span>` : ''}
                                    ${isPromo ? `
                                        <span style="background: #ff4d4d; color: #fff; font-size: 0.6rem; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">Special Offer</span>
                                        <span style="color: #888; text-decoration: line-through; font-size: 0.8rem; margin-right: 4px;">${highlightText(detail.originalPrice, searchTerm)}</span>
                                    ` : ''}
                                    ${displayPrice ? `<span style="${isPromo ? 'color: #ff4d4d;' : 'color: var(--primary-gold);'} font-weight: 600; font-size: 0.95rem; white-space: nowrap; letter-spacing: 0.5px;">${highlightText(displayPrice, searchTerm)}</span>` : ''}
                                </div>
                            </div>
                            ${hasVariants && detail.variants.length > 0 ? `
                                ${detail.variants.map(v => {
                                    const isVariantPromo = v.price && v.originalPrice;
                                    const displayVariantPrice = v.price || v.originalPrice || '';
                                    return `
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-top: 10px; margin-bottom: 4px;">
                                        <span style="font-weight: 600; color: #fff; font-size: 0.95rem; letter-spacing: 0.5px;"></span>
                                        <div style="text-align: right; display: flex; align-items: center; gap: 6px; justify-content: flex-end; flex-wrap: wrap;">
                                            ${v.duration ? `<span style="color: #888; font-size: 0.8rem; margin-right: 4px;">${highlightText(v.duration, searchTerm)}</span>` : ''}
                                            ${isVariantPromo ? `
                                                <span style="background: #ff4d4d; color: #fff; font-size: 0.6rem; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">Special Offer</span>
                                                <span style="color: #888; text-decoration: line-through; font-size: 0.8rem; margin-right: 4px;">${highlightText(v.originalPrice, searchTerm)}</span>
                                            ` : ''}
                                            <span style="${isVariantPromo ? 'color: #ff4d4d;' : 'color: var(--primary-gold);'} font-weight: 600; font-size: 0.95rem; white-space: nowrap; letter-spacing: 0.5px;">${highlightText(displayVariantPrice, searchTerm)}</span>
                                        </div>
                                    </div>`;
                                }).join('')}
                            ` : ''}
                            ${detail.description ? `<p style="margin: 0; font-size: 0.8rem; color: #a5a5a5; text-align: left; line-height: 1.5; font-style: italic; font-weight: 300;">${highlightText(detail.description, searchTerm)}</p>` : ''}
                        </li>`;
                    }).join('')}
                </ul>
            </div>
        </div>
        `;
    }).join('');
}