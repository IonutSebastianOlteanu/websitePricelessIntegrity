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

function updatePrice(categoryIndex, itemIndex, newPrice) {
    SERVICES_DATA[categoryIndex].details[itemIndex].price = newPrice;
    renderServices();
    renderAdminPanel();
}

function addServiceItem(categoryIndex, name, price) {
    SERVICES_DATA[categoryIndex].details.push({ name, price });
    renderServices();
    renderAdminPanel();
}

function addCategory(title, description) {
    SERVICES_DATA.push({ title, description, details: [] });
    renderServices();
    renderAdminPanel();
}

function deleteCategory(index) {
    if (confirm("Are you sure you want to delete this whole category?")) {
        SERVICES_DATA.splice(index, 1);
        renderServices();
        renderAdminPanel();
    }
}

function deleteItem(catIndex, itemIndex) {
    SERVICES_DATA[catIndex].details.splice(itemIndex, 1);
    renderServices();
    renderAdminPanel();
}

function handleCreateCategory() {
    const title = document.getElementById('newCatTitle').value.trim();
    const desc = document.getElementById('newCatDesc').value.trim();
    if (title) {
        addCategory(title, desc);
    }
}

function handleCreateItem(catIdx) {
    const name = document.getElementById(`newItemName-${catIdx}`).value.trim();
    const price = document.getElementById(`newItemPrice-${catIdx}`).value.trim();
    if (name && price) {
        addServiceItem(catIdx, name, price);
    }
}

function downloadServicesJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SERVICES_DATA, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "services.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // Close the owner control panel section automatically after saving
    const panel = document.getElementById('adminPanelSection');
    if (panel) {
        panel.style.display = 'none';
    }
}

function renderAdminPanel() {
    const container = document.getElementById('adminPanelContent');
    if (!container) return;

    let html = `
        <div style="margin-bottom: 25px; text-align: right;">
            <button onclick="downloadServicesJSON()" style="background: #28a745; border-color: #28a745;">💾 Save & Download services.json</button>
        </div>
        <div style="margin-bottom: 30px; padding: 20px; background: #222; border-radius: 4px; border: 1px solid #444;">
            <h4 style="color: var(--primary-gold); margin-top: 0;">Add New Service Category</h4>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="newCatTitle" class="form-control" placeholder="Category Title (e.g., Massage)">
                <input type="text" id="newCatDesc" class="form-control" placeholder="Category Description">
                <button onclick="handleCreateCategory()" style="width: fit-content; padding: 8px 20px;">Add Category</button>
            </div>
        </div>
        <h3 style="color: var(--primary-gold); margin-bottom: 15px;">Manage Existing Services</h3>
    `;

    SERVICES_DATA.forEach((cat, catIdx) => {
        html += `
            <div style="background: #1b1b1b; padding: 20px; border-radius: 4px; margin-bottom: 20px; border-left: 3px solid var(--primary-gold);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #fff;">${cat.title}</h4>
                    <button onclick="deleteCategory(${catIdx})" style="background: #d9534f; border-color: #d9534f; color: white; padding: 5px 10px; font-size: 0.8rem;">Delete Category</button>
                </div>
                <p style="font-size: 0.9rem; color: #888; margin-bottom: 15px;">${cat.description}</p>
                <div style="margin-left: 10px;">
                    <ul style="list-style: none; padding: 0; margin: 0;">
        `;

        cat.details.forEach((item, itemIdx) => {
            html += `
                <li style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px dashed #333;">
                    <span style="flex-grow: 1;">${item.name}</span>
                    <input type="text" value="${item.price}" onchange="updatePrice(${catIdx}, ${itemIdx}, this.value)" class="form-control" style="max-width: 150px; padding: 5px; font-size: 0.9rem; text-align: right;">
                    <button onclick="deleteItem(${catIdx}, ${itemIdx})" style="background: #d9534f; border-color: #d9534f; color: white; padding: 5px 10px; font-size: 0.8rem;">X</button>
                </li>
            `;
        });

        html += `
                    </ul>
                    <div style="display: flex; gap: 10px; margin-top: 15px; background: #252525; padding: 10px; border-radius: 4px;">
                        <input type="text" id="newItemName-${catIdx}" class="form-control" placeholder="New Item Name" style="padding: 6px;">
                        <input type="text" id="newItemPrice-${catIdx}" class="form-control" placeholder="Price (e.g., $50)" style="padding: 6px; max-width: 150px;">
                        <button onclick="handleCreateItem(${catIdx})" style="padding: 6px 15px; font-size: 0.85rem;">Add Item</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}