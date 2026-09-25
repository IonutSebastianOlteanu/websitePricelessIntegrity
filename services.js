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

function toggleServiceDetails(cardElement) {
    const details = cardElement.querySelector('.service-details');
    const indicator = cardElement.querySelector('.expand-indicator');
    
    if (details.style.display === 'none') {
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
    if (!term.trim()) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.replace(regex, '<mark style="background-color: rgba(223, 183, 108, 0.4); color: inherit; padding: 0 2px; border-radius: 2px;">$1</mark>');
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

    const filtered = SERVICES_DATA.filter(service => 
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.details.some(d => 
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">No services found matching your search.</p>';
        return;
    }

    const isSearching = searchTerm.trim().length > 0;
    const displayStyle = isSearching ? 'block' : 'none';
    const indicatorText = isSearching ? '−' : '+';

    grid.innerHTML = filtered.map(service => `
        <div class="service-card" onclick="toggleServiceDetails(this)">
            <h3 style="display: flex; justify-content: center; align-items: center; gap: 10px;">
                ${highlightText(service.title, searchTerm)}
                <span class="expand-indicator" style="color: var(--primary-gold); font-size: 1.2rem;">${indicatorText}</span>
            </h3>
            <p>${service.description}</p>
            <div class="service-details" style="display: ${displayStyle}; margin-top: 20px;">
                <ul style="list-style: none; padding: 0; font-size: 0.85rem; color: #ccc;">
                    ${service.details.map(detail => `
                        <li style="margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 12px; padding-left: 12px; border-left: 2px solid rgba(223, 183, 108, 0.2); transition: border-left-color 0.3s;" onmouseenter="this.style.borderLeftColor='var(--primary-gold)'" onmouseleave="this.style.borderLeftColor='rgba(223, 183, 108, 0.2)'">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 4px;">
                                <span style="font-weight: 600; color: #fff; font-size: 0.95rem; letter-spacing: 0.5px;">${highlightText(detail.name, searchTerm)}</span>
                                <span style="color: var(--primary-gold); font-weight: 600; font-size: 0.95rem; white-space: nowrap; letter-spacing: 0.5px;">${detail.price}</span>
                            </div>
                            ${detail.description ? `<p style="margin: 0; font-size: 0.8rem; color: #a5a5a5; text-align: left; line-height: 1.5; font-style: italic; font-weight: 300;">${highlightText(detail.description, searchTerm)}</p>` : ''}
                        </li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}