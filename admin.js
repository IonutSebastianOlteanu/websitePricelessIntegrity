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
        token = prompt("Please enter your GitHub Personal Access Token (PAT):");
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
    const titleEl = document.getElementById('newCatTitle');
    const descEl = document.getElementById('newCatDesc');
    const title = titleEl.value.trim();
    const desc = descEl.value.trim();
    if (title) {
        addCategory(title, desc);
        titleEl.value = '';
        descEl.value = '';
    }
}

function handleCreateItem(catIdx) {
    const nameEl = document.getElementById(`newItemName-${catIdx}`);
    const priceEl = document.getElementById(`newItemPrice-${catIdx}`);
    const name = nameEl.value.trim();
    const price = priceEl.value.trim();
    if (name && price) {
        addServiceItem(catIdx, name, price);
        nameEl.value = '';
        priceEl.value = '';
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