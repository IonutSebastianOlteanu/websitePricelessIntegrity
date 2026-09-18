const SERVICES_DATA = [
    {
        title: "Hair Styling",
        description: "Cuts, coloring, and styling for any occasion.",
        details: [
            { name: "Precision Cuts & Trims", price: "$55 - $95" },
            { name: "Balayage & Highlights", price: "$180 - $350" },
            { name: "Bridal & Event Styling", price: "$120 - $250" },
            { name: "Deep Conditioning", price: "$45 - $80" }
        ]
    },
    {
        title: "Skincare",
        description: "Refreshing facials and professional treatments.",
        details: [
            { name: "HydraFacial Therapy", price: "$150 - $220" },
            { name: "Organic Chemical Peels", price: "$110 - $190" },
            { name: "Anti-Aging Collagen", price: "$140 - $200" },
            { name: "Deep Pore Cleansing", price: "$85 - $130" }
        ]
    },
    {
        title: "Nail Art",
        description: "Manicures and pedicures with a creative touch.",
        details: [
            { name: "Gel Extensions", price: "$75 - $120" },
            { name: "Luxury Spa Pedicure", price: "$65 - $95" },
            { name: "Hand-painted Art", price: "$20 - $60" },
            { name: "Repair & Strengthen", price: "$15 - $40" }
        ]
    }
];

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
        service.details.some(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                        <li style="margin-bottom: 10px; display: flex; justify-content: space-between; border-bottom: 1px dotted #444; padding-bottom: 5px;">
                            <span>${highlightText(detail.name, searchTerm)}</span>
                            <span style="color: var(--primary-gold); font-weight: bold;">${detail.price}</span>
                        </li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}