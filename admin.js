const GITHUB_REPO = 'IonutSebastianOlteanu/websitePricelessIntegrity';
const GITHUB_BRANCH = 'main';
const GITHUB_FILE_PATH = 'services.json';

function getAuthHeaders(token) {
    const prefix = localStorage.getItem('gh_token_prefix') || 'token';
    return {
        'Authorization': `${prefix} ${token}`,
        'Accept': 'application/vnd.github.v3+json'
    };
}

async function validateGitHubToken(token) {
    try {
        let prefix = 'token';
        let response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 401) {
            prefix = 'Bearer';
            // Fallback to Bearer token format if 'token' prefix isn't accepted
            response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
        }

        if (response.ok) {
            localStorage.setItem('gh_token_prefix', prefix);
            return { isValid: true, status: response.status, message: "OK" };
        } else {
            let errorMsg = response.statusText;
            try {
                const data = await response.json();
                if (data && data.message) errorMsg = data.message;
            } catch (_) {}
            return { isValid: false, status: response.status, message: errorMsg };
        }
    } catch (e) {
        return { isValid: false, status: 0, message: e.message || "Network Error" };
    }
}

async function accessOwnerPortal() {
    let token = localStorage.getItem('gh_token');
    if (!token) {
        token = prompt("Please enter your admin password:");
        if (!token) return;
        token = token.trim();
    }

    const result = await validateGitHubToken(token);
    if (result.isValid) {
        localStorage.setItem('gh_token', token);
        renderAdminPanel();
        const panel = document.getElementById('adminPanelSection');
        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth' });
    } else {
        localStorage.removeItem('gh_token');
        let errorHint = "";
        if (result.status === 404) {
            errorHint = "\n\nError 404: Repository not found. If your repository is private, make sure your token has the 'repo' scope checked.";
        } else if (result.status === 401) {
            errorHint = "\n\nError 401: Unauthorized. The token is invalid, expired, or has been revoked.";
        } else {
            errorHint = `\n\nDetails: ${result.message} (Status Code: ${result.status})`;
        }
        alert("Invalid or unauthorized GitHub token. Access Denied." + errorHint);
    }
}

function logoutAdmin(quiet = false) {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_token_prefix');
    const panel = document.getElementById('adminPanelSection');
    if (panel) panel.style.display = 'none';
    if (!quiet) {
        alert("Logged out successfully.");
    }
}

function updatePrice(categoryIndex, itemIndex, newPrice) {
    SERVICES_DATA[categoryIndex].details[itemIndex].price = newPrice;
    renderServices();
    renderAdminPanel();
}

function updateOriginalPrice(categoryIndex, itemIndex, newOriginalPrice) {
    SERVICES_DATA[categoryIndex].details[itemIndex].originalPrice = newOriginalPrice;
    renderServices();
    renderAdminPanel();
}

function updateDuration(categoryIndex, itemIndex, newDuration) {
    SERVICES_DATA[categoryIndex].details[itemIndex].duration = newDuration;
    renderServices();
    renderAdminPanel();
}

function updateVariantDuration(categoryIndex, itemIndex, variantIndex, newDuration) {
    SERVICES_DATA[categoryIndex].details[itemIndex].variants[variantIndex].duration = newDuration;
    renderServices();
    renderAdminPanel();
}

function updateVariantPrice(categoryIndex, itemIndex, variantIndex, newPrice) {
    SERVICES_DATA[categoryIndex].details[itemIndex].variants[variantIndex].price = newPrice;
    renderServices();
    renderAdminPanel();
}

function updateVariantOriginalPrice(categoryIndex, itemIndex, variantIndex, newOriginalPrice) {
    SERVICES_DATA[categoryIndex].details[itemIndex].variants[variantIndex].originalPrice = newOriginalPrice;
    renderServices();
    renderAdminPanel();
}

let pendingVariant = null;

function addVariant(categoryIndex, itemIndex) {
    pendingVariant = {
        catIdx: categoryIndex,
        itemIdx: itemIndex,
        duration: "",
        originalPrice: "",
        price: ""
    };
    renderAdminPanel();
}

function updatePendingVariantDuration(newDuration) {
    if (pendingVariant) {
        pendingVariant.duration = newDuration;
    }
}

function updatePendingVariantOriginalPrice(newOriginalPrice) {
    if (pendingVariant) {
        pendingVariant.originalPrice = newOriginalPrice;
    }
}

function updatePendingVariantPrice(newPrice) {
    if (pendingVariant) {
        pendingVariant.price = newPrice;
    }
}

function confirmPendingVariant() {
    if (!pendingVariant) return;
    const { catIdx, itemIdx, duration, originalPrice, price } = pendingVariant;
    const item = SERVICES_DATA[catIdx].details[itemIdx];
    if (!item.variants) {
        item.variants = [];
    }
    item.variants.push({ duration, originalPrice, price });
    pendingVariant = null;
    renderServices();
    renderAdminPanel();
}

function cancelPendingVariant() {
    pendingVariant = null;
    renderAdminPanel();
}

function deleteVariant(categoryIndex, itemIndex, variantIndex) {
    const item = SERVICES_DATA[categoryIndex].details[itemIndex];
    const variant = item.variants[variantIndex];
    if (confirm(`Are you sure you want to delete the variant "${variant.duration} - ${variant.price}"?`)) {
        SERVICES_DATA[categoryIndex].details[itemIndex].variants.splice(variantIndex, 1);
        renderServices();
        renderAdminPanel();
    }
}

function updateItemName(categoryIndex, itemIndex, newName) {
    SERVICES_DATA[categoryIndex].details[itemIndex].name = newName;
    renderServices();
    renderAdminPanel();
}

function updateItemDescription(categoryIndex, itemIndex, newDescription) {
    SERVICES_DATA[categoryIndex].details[itemIndex].description = newDescription;
    renderServices();
    renderAdminPanel();
}

function addServiceItem(categoryIndex, name, description, duration, price, originalPrice) {
    SERVICES_DATA[categoryIndex].details.push({ name, description, duration, price, originalPrice, variants: [] });
    renderServices();
    renderAdminPanel();
}

function addCategory(title, description) {
    SERVICES_DATA.push({ title, description, details: [] });
    renderServices();
    renderAdminPanel();
}

function moveItem(categoryIndex, itemIndex, direction) {
    const items = SERVICES_DATA[categoryIndex].details;
    if (direction === 'up' && itemIndex > 0) {
        const temp = items[itemIndex];
        items[itemIndex] = items[itemIndex - 1];
        items[itemIndex - 1] = temp;
    } else if (direction === 'down' && itemIndex < items.length - 1) {
        const temp = items[itemIndex];
        items[itemIndex] = items[itemIndex + 1];
        items[itemIndex + 1] = temp;
    }
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
    const itemName = SERVICES_DATA[catIndex].details[itemIndex].name;
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
        SERVICES_DATA[catIndex].details.splice(itemIndex, 1);
        renderServices();
        renderAdminPanel();
    }
}

function handleCreateCategory() {
    const titleEl = document.getElementById('newCatTitle');
    const descEl = document.getElementById('newCatDesc');
    const title = titleEl.value.trim();
    const desc = descEl.value.trim();
    if (title) {
        addCategory(title, desc);
        titleEl.value = '';
        descEl.value = '';
    } else {
        alert("Please enter a category title.");
    }
}

function handleCreateItem(catIdx) {
    const nameEl = document.getElementById(`newItemName-${catIdx}`);
    const descEl = document.getElementById(`newItemDesc-${catIdx}`);
    const durationEl = document.getElementById(`newItemDuration-${catIdx}`);
    const priceEl = document.getElementById(`newItemPrice-${catIdx}`);
    const originalPriceEl = document.getElementById(`newItemOriginalPrice-${catIdx}`);
    const name = nameEl.value.trim();
    const desc = descEl.value.trim();
    const duration = durationEl.value.trim();
    const price = priceEl.value.trim();
    const originalPrice = originalPriceEl.value.trim();
    if (!name) {
        alert("Please enter a service name.");
        return;
    }
    if (!originalPrice && !price) {
        alert("Please enter a price for the service.");
        return;
    }
    if (name) {
        addServiceItem(catIdx, name, desc, duration, price, originalPrice);
        nameEl.value = '';
        descEl.value = '';
        durationEl.value = '';
        priceEl.value = '';
        originalPriceEl.value = '';
    }
}

async function getNextVersionNumber(token) {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?path=${GITHUB_FILE_PATH}&sha=${GITHUB_BRANCH}&per_page=100`, {
            headers: getAuthHeaders(token)
        });
        if (response.ok) {
            const commits = await response.json();
            return commits.length + 1;
        }
    } catch (e) {
        console.error("Error fetching commits:", e);
    }
    return null;
}

async function syncToGitHub() {
    const token = localStorage.getItem('gh_token');

    if (!token) {
        alert("Authentication token missing. Please refresh and log in again.");
        return;
    }

    const statusIndicator = document.getElementById('githubSyncStatus');
    if (statusIndicator) statusIndicator.innerText = "Syncing with GitHub...";

    const publishBtn = document.getElementById('publishBtn');
    const originalBtnHTML = publishBtn ? publishBtn.innerHTML : '🚀 Publish Changes';
    if (publishBtn) {
        publishBtn.disabled = true;
        publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
        publishBtn.style.opacity = '0.7';
        publishBtn.style.cursor = 'not-allowed';
    }

    try {
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`;
        
        // 1. Retrieve the existing file SHA (required by GitHub API to update a file)
        let sha = null;
        const getResponse = await fetch(url, {
            headers: getAuthHeaders(token)
        });

        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        } else if (getResponse.status !== 404) {
            throw new Error(`Failed to fetch file metadata: ${getResponse.statusText}`);
        }

        // 2. Prepare payload (Base64 encoded representation of services.json)
        const content = JSON.stringify(SERVICES_DATA, null, 4);
        // Safe UTF-8 Base64 encoding without deprecated unescape
        const base64Content = btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        }));

        const versionNum = await getNextVersionNumber(token);
        const commitMsg = versionNum ? `Update services.json (v${versionNum})` : `Update services.json - ${new Date().toISOString()}`;

        const body = {
            message: commitMsg,
            content: base64Content,
            branch: GITHUB_BRANCH
        };
        if (sha) {
            body.sha = sha;
        }

        // 3. Push file update back to GitHub
        const putHeaders = getAuthHeaders(token);
        putHeaders['Content-Type'] = 'application/json';

        const putResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
            method: 'PUT',
            headers: putHeaders,
            body: JSON.stringify(body)
        });

        if (putResponse.ok) {
            alert("Successfully published and updated services.json!\n\nYou have been logged out automatically for security.");
            if (statusIndicator) statusIndicator.innerText = "Sync Successful!";
            logoutAdmin(true);
        } else {
            const errData = await putResponse.json();
            throw new Error(errData.message || "Failed to commit changes.");
        }
    } catch (error) {
        console.error("GitHub Sync Error:", error);
        alert(`Error syncing with GitHub: ${error.message}`);
        if (statusIndicator) statusIndicator.innerText = "Sync failed.";
    } finally {
        if (publishBtn) {
            publishBtn.disabled = false;
            publishBtn.innerHTML = originalBtnHTML;
            publishBtn.style.opacity = '1';
            publishBtn.style.cursor = 'pointer';
        }
    }
}

function renderAdminPanel() {
    const container = document.getElementById('adminPanelContent');
    if (!container) return;

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

    let html = `
        <div style="margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span id="githubSyncStatus" style="font-size: 0.9rem; color: #dfb76c;"></span>
            <div style="display: flex; gap: 10px;">
                <button id="publishBtn" onclick="syncToGitHub()" style="background: #007bff; border-color: #007bff;">🚀 Publish Changes</button>
                <button onclick="logoutAdmin()" style="background: #555; border-color: #555;">🔒 Lock Panel</button>
            </div>
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
            const hasVariants = item.variants && item.variants.length > 0;
            html += `
                <li style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; padding: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap;">
                        <div style="flex: 2; min-width: 200px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Service Name</span>
                            <input type="text" value="${item.name}" onchange="updateItemName(${catIdx}, ${itemIdx}, this.value)" class="form-control" style="padding: 8px; font-size: 0.95rem; font-weight: bold; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                        </div>
                        <div style="max-width: 130px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Duration</span>
                            <input type="text" value="${item.duration || ''}" onchange="updateDuration(${catIdx}, ${itemIdx}, this.value)" class="form-control" placeholder="e.g. 60 min" style="padding: 8px; font-size: 0.9rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                        </div>
                        <div style="max-width: 140px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Original Price</span>
                            <input type="text" value="${item.originalPrice || ''}" onchange="updateOriginalPrice(${catIdx}, ${itemIdx}, this.value)" class="form-control" placeholder="e.g. $120" style="padding: 8px; font-size: 0.9rem; text-align: right; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                        </div>
                        <div style="max-width: 120px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Promo Price</span>
                            <input type="text" value="${item.price || ''}" onchange="updatePrice(${catIdx}, ${itemIdx}, this.value)" class="form-control" placeholder="e.g. $100" style="padding: 8px; font-size: 0.9rem; text-align: right; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                        </div>
                        <div style="display: flex; gap: 4px; align-self: flex-end; height: 38px;">
                            <button onclick="moveItem(${catIdx}, ${itemIdx}, 'up')" ${itemIdx === 0 ? 'disabled style="background: #252525; color: #555; border: 1px solid #333; cursor: not-allowed; padding: 8px 12px; font-size: 0.85rem; border-radius: 4px;"' : 'style="background: #333; border: 1px solid #555; color: white; cursor: pointer; padding: 8px 12px; font-size: 0.85rem; border-radius: 4px;"'}>▲</button>
                            <button onclick="moveItem(${catIdx}, ${itemIdx}, 'down')" ${itemIdx === cat.details.length - 1 ? 'disabled style="background: #252525; color: #555; border: 1px solid #333; cursor: not-allowed; padding: 8px 12px; font-size: 0.85rem; border-radius: 4px;"' : 'style="background: #333; border: 1px solid #555; color: white; cursor: pointer; padding: 8px 12px; font-size: 0.85rem; border-radius: 4px;"'}>▼</button>
                            <button onclick="deleteItem(${catIdx}, ${itemIdx})" style="background: #d9534f; border-color: #d9534f; color: white; padding: 8px 12px; font-size: 0.85rem; border-radius: 4px; cursor: pointer;">✕</button>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Service Description</span>
                        <input type="text" value="${item.description || ''}" onchange="updateItemDescription(${catIdx}, ${itemIdx}, this.value)" class="form-control" placeholder="Service description (optional)" style="padding: 8px; font-size: 0.85rem; color: #ccc; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;">
                    </div>
                    <div style="padding: 12px; background: rgba(0,0,0,0.25); border-radius: 6px; border-left: 3px solid var(--primary-gold); margin-top: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
                            <span style="font-size: 0.8rem; font-weight: bold; color: var(--primary-gold); letter-spacing: 0.5px; text-transform: uppercase;">
                                🏷️ Variants (Multiple Prices / Durations)
                            </span>
                            <button onclick="addVariant(${catIdx}, ${itemIdx})" style="padding: 4px 10px; font-size: 0.75rem; background: #28a745; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: 600;">+ Add Variant</button>
                        </div>
                        ${(hasVariants || (pendingVariant && pendingVariant.catIdx === catIdx && pendingVariant.itemIdx === itemIdx)) ? `
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${item.variants ? item.variants.map((v, vIdx) => `
                                    <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; background: rgba(255,255,255,0.01); padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.03);">
                                        <div style="flex: 1; min-width: 120px; display: flex; flex-direction: column; gap: 2px;">
                                            <span style="font-size: 0.65rem; color: #777; font-weight: bold;">DURATION</span>
                                            <input type="text" value="${v.duration}" onchange="updateVariantDuration(${catIdx}, ${itemIdx}, ${vIdx}, this.value)" class="form-control" placeholder="Duration" style="padding: 6px; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;">
                                        </div>
                                        <div style="width: 110px; display: flex; flex-direction: column; gap: 2px;">
                                            <span style="font-size: 0.65rem; color: #777; font-weight: bold;">ORIGINAL PRICE</span>
                                            <input type="text" value="${v.originalPrice || ''}" onchange="updateVariantOriginalPrice(${catIdx}, ${itemIdx}, ${vIdx}, this.value)" class="form-control" placeholder="e.g. $120" style="padding: 6px; font-size: 0.8rem; max-width: 110px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;">
                                        </div>
                                        <div style="width: 110px; display: flex; flex-direction: column; gap: 2px;">
                                            <span style="font-size: 0.65rem; color: #777; font-weight: bold;">PROMO PRICE</span>
                                            <input type="text" value="${v.price}" onchange="updateVariantPrice(${catIdx}, ${itemIdx}, ${vIdx}, this.value)" class="form-control" placeholder="e.g. $100" style="padding: 6px; font-size: 0.8rem; max-width: 110px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;">
                                        </div>
                                        <button onclick="deleteVariant(${catIdx}, ${itemIdx}, ${vIdx})" style="background: #d9534f; border: none; color: white; padding: 6px 10px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; height: 28px;">✕</button>
                                    </div>
                                `).join('') : ''}
                                ${pendingVariant && pendingVariant.catIdx === catIdx && pendingVariant.itemIdx === itemIdx ? `
                                    <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 6px; border: 1px dashed #28a745; margin-top: 5px;">
                                        <div style="flex: 1; min-width: 120px; display: flex; flex-direction: column; gap: 2px;">
                                            <span style="font-size: 0.65rem; color: #28a745; font-weight: bold;">NEW VARIANT DURATION</span>
                                            <input type="text" value="${pendingVariant.duration}" oninput="updatePendingVariantDuration(this.value)" class="form-control" placeholder="Duration" style="padding: 6px; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #28a745; border-radius: 4px; color: #fff;">
                                        </div>
                                        <div style="width: 110px; display: flex; flex-direction: column; gap: 2px;">
                                            <span style="font-size: 0.65rem; color: #28a745; font-weight: bold;">ORIGINAL PRICE</span>
                                            <input type="text" value="${pendingVariant.originalPrice}" oninput="updatePendingVariantOriginalPrice(this.value)" class="form-control" placeholder="e.g. $120" style="padding: 6px; font-size: 0.8rem; max-width: 110px; background: rgba(0,0,0,0.2); border: 1px solid #28a745; border-radius: 4px; color: #fff;">
                                        </div>
                                        <div style="width: 110px; display: flex; flex-direction: column; gap: 2px;">
                                            <span style="font-size: 0.65rem; color: #28a745; font-weight: bold;">PROMO PRICE</span>
                                            <input type="text" value="${pendingVariant.price}" oninput="updatePendingVariantPrice(this.value)" class="form-control" placeholder="e.g. $100" style="padding: 6px; font-size: 0.8rem; max-width: 110px; background: rgba(0,0,0,0.2); border: 1px solid #28a745; border-radius: 4px; color: #fff;">
                                        </div>
                                        <div style="display: flex; gap: 6px;">
                                            <button onclick="confirmPendingVariant()" style="background: #28a745; border: none; color: white; padding: 6px 12px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; height: 28px; font-weight: bold;">Confirm ✔</button>
                                            <button onclick="cancelPendingVariant()" style="background: #6c757d; border: none; color: white; padding: 6px 12px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; height: 28px;">Cancel</button>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div style="display: flex; align-items: center; gap: 8px; padding: 6px; background: rgba(223, 183, 108, 0.05); border-radius: 4px;">
                                <span style="font-size: 0.75rem; color: var(--primary-gold); font-style: italic;">No variants created yet. Single duration and price values specified above will represent this service.</span>
                            </div>
                        `}
                    </div>
                </li>
            `;
        });

        html += `
                    </ul>
                    <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 25px; background: rgba(0, 0, 0, 0.3); padding: 18px; border-radius: 8px; border: 1px solid rgba(223, 183, 108, 0.2);">
                        <span style="font-size: 0.8rem; font-weight: bold; color: var(--primary-gold); text-transform: uppercase; letter-spacing: 0.5px;">
                            ✨ Add New Service Item
                        </span>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
                            <div style="display: flex; flex-direction: column; gap: 4px; grid-column: span 2;">
                                <span style="font-size: 0.7rem; color: #aaa;">Service Name *</span>
                                <input type="text" id="newItemName-${catIdx}" class="form-control" placeholder="e.g. Microneedling Therapy" style="padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.7rem; color: #aaa;">Duration</span>
                                <input type="text" id="newItemDuration-${catIdx}" class="form-control" placeholder="e.g. 60 min" style="padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; color: #aaa;">Original Price *</span>
                                <input type="text" id="newItemOriginalPrice-${catIdx}" class="form-control" placeholder="e.g. $150" style="padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.7rem; color: #aaa;">Promo Price</span>
                                <input type="text" id="newItemPrice-${catIdx}" class="form-control" placeholder="e.g. $120" style="padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; color: #aaa;">Item Description (optional)</span>
                            <textarea id="newItemDesc-${catIdx}" class="form-control" placeholder="Write a short enticing description of what this service entails..." style="padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; height: 60px; resize: vertical; font-family: inherit; font-size: 0.85rem; color: #fff;"></textarea>
                        </div>
                        <button onclick="handleCreateItem(${catIdx})" style="padding: 10px 20px; font-size: 0.85rem; font-weight: bold; background: var(--primary-gold); color: #111; border: none; border-radius: 4px; cursor: pointer; align-self: flex-start; transition: transform 0.2s, opacity 0.2s;" onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">+ Add Item to ${cat.title}</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}