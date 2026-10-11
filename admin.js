const GITHUB_REPO = 'IonutSebastianOlteanu/websitePricelessIntegrity';
const GITHUB_BRANCH = 'main';
const GITHUB_FILE_PATH = 'services.json';
const TEAM_FILE_PATH = 'team.json';

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

async function getNextVersionNumber(token, filePath) {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?path=${filePath}&sha=${GITHUB_BRANCH}&per_page=100`, {
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

async function publishJsonToGitHub(filePath, data, label) {
    const token = localStorage.getItem('gh_token');
    if (!token) {
        throw new Error('Authentication token missing. Please refresh and log in again.');
    }

    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
    let sha = null;
    const getResponse = await fetch(url, {
        headers: getAuthHeaders(token)
    });

    if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
    } else if (getResponse.status !== 404) {
        throw new Error(`Failed to fetch ${label} metadata: ${getResponse.statusText}`);
    }

    const content = JSON.stringify(data, null, 4);
    const base64Content = btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));

    const versionNum = await getNextVersionNumber(token, filePath);
    const commitMsg = versionNum ? `Update ${filePath} (v${versionNum})` : `Update ${filePath} - ${new Date().toISOString()}`;

    const body = {
        message: commitMsg,
        content: base64Content,
        branch: GITHUB_BRANCH
    };
    if (sha) {
        body.sha = sha;
    }

    const putHeaders = getAuthHeaders(token);
    putHeaders['Content-Type'] = 'application/json';

    const putResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
        method: 'PUT',
        headers: putHeaders,
        body: JSON.stringify(body)
    });

    if (!putResponse.ok) {
        const errData = await putResponse.json();
        throw new Error(errData.message || `Failed to commit ${label}.`);
    }
}

async function syncToGitHub() {
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
        await prepareTeamImagesForSync();

        await Promise.all([
            publishJsonToGitHub(GITHUB_FILE_PATH, SERVICES_DATA, 'services'),
            publishJsonToGitHub(TEAM_FILE_PATH, TEAM_DATA, 'team')
        ]);

        alert("Successfully published your updates!\n\nYou have been logged out automatically for security.");
        if (statusIndicator) statusIndicator.innerText = "Sync Successful!";
        logoutAdmin(true);
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

function updateTeamMemberName(index, value) {
    const members = getTeamMembers();
    if (!members[index]) return;
    members[index].name = value;
    renderTeamMembers();
    renderAdminPanel();
}

function updateTeamMemberRole(index, value) {
    const members = getTeamMembers();
    if (!members[index]) return;
    members[index].role = value;
    renderTeamMembers();
    renderAdminPanel();
}

function updateTeamMemberBio(index, value) {
    const members = getTeamMembers();
    if (!members[index]) return;
    members[index].bio = value;
    renderTeamMembers();
    renderAdminPanel();
}

function updateTeamMemberImage(index, value) {
    const members = getTeamMembers();
    if (!members[index]) return;
    members[index].image = value.trim();
    renderTeamMembers();
    renderAdminPanel();
}

function updateAboutField(field, value) {
    if (!TEAM_DATA || typeof TEAM_DATA !== 'object' || Array.isArray(TEAM_DATA)) {
        TEAM_DATA = {
            about: { ...DEFAULT_ABOUT_CONTENT },
            members: []
        };
    }
    if (!TEAM_DATA.about) TEAM_DATA.about = { ...DEFAULT_ABOUT_CONTENT };
    TEAM_DATA.about[field] = value;
    renderAboutContent();
    renderAdminPanel();
}

function addTeamMember(name, role, bio, image) {
    const members = getTeamMembers();
    members.push({ name, role, bio, image: image || '' });
    renderTeamMembers();
    renderAdminPanel();
}

function deleteTeamMember(index) {
    const members = getTeamMembers();
    const member = members[index];
    if (!member) return;
    if (confirm(`Are you sure you want to delete "${member.name || 'this team member'}"?`)) {
        members.splice(index, 1);
        renderTeamMembers();
        renderAdminPanel();
    }
}

function readFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
}

function slugify(value) {
    return String(value || 'member')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'member';
}

async function uploadDataUrlToGitHub(filePath, dataUrl, label) {
    const token = localStorage.getItem('gh_token');
    if (!token) {
        throw new Error('Authentication token missing. Please refresh and log in again.');
    }

    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
    let sha = null;
    const getResponse = await fetch(url, {
        headers: getAuthHeaders(token)
    });

    if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
    } else if (getResponse.status !== 404) {
        throw new Error(`Failed to fetch ${label} metadata: ${getResponse.statusText}`);
    }

    const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (!matches) {
        throw new Error(`Invalid image data for ${label}.`);
    }

    const content = matches[2];
    const versionNum = await getNextVersionNumber(token, filePath);
    const commitMsg = versionNum ? `Upload ${filePath} (v${versionNum})` : `Upload ${filePath} - ${new Date().toISOString()}`;

    const body = {
        message: commitMsg,
        content,
        branch: GITHUB_BRANCH
    };
    if (sha) {
        body.sha = sha;
    }

    const putHeaders = getAuthHeaders(token);
    putHeaders['Content-Type'] = 'application/json';

    const putResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
        method: 'PUT',
        headers: putHeaders,
        body: JSON.stringify(body)
    });

    if (!putResponse.ok) {
        const errData = await putResponse.json();
        throw new Error(errData.message || `Failed to upload ${label}.`);
    }
}

async function prepareTeamImagesForSync() {
    const members = getTeamMembers();
    for (let index = 0; index < members.length; index += 1) {
        const member = members[index];
        const image = (member.image || '').trim();

        if (!image || image.startsWith('http') || image.startsWith('images/') || image.startsWith('/')) {
            continue;
        }

        if (!image.startsWith('data:')) {
            continue;
        }

        const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const extension = mimeType.includes('png') ? 'png'
            : mimeType.includes('webp') ? 'webp'
            : mimeType.includes('gif') ? 'gif'
            : 'jpg';

        const fileName = `${slugify(member.name || `member-${index}`)}-${Date.now()}-${index}.${extension}`;
        const filePath = `images/team/${fileName}`;

        await uploadDataUrlToGitHub(filePath, image, `${member.name || 'Team member'} photo`);
        member.image = filePath;
    }
}

function updateImagePreview(value, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;

    const imageValue = (value || '').trim();
    if (!imageValue) {
        preview.innerHTML = '<span style="font-size: 0.7rem; color: #aaa; letter-spacing: 0.5px;">No photo</span>';
        preview.style.borderStyle = 'dashed';
        return;
    }

    preview.style.borderStyle = 'solid';
    preview.innerHTML = `
        <img src="${imageValue}" alt="Team member preview" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\'font-size: 0.7rem; color: #aaa; letter-spacing: 0.5px;\'>No photo</span>';">
    `;
}

function handleTeamMemberImageUpload(input, targetIndex) {
    const file = input && input.files && input.files[0];
    if (!file) return;

    readFileAsDataUrl(file, (dataUrl) => {
        if (targetIndex === 'new') {
            const imageField = document.getElementById('newTeamMemberImage');
            if (imageField) imageField.value = dataUrl;
            updateImagePreview(dataUrl, 'newTeamMemberPreview');
            return;
        }
        updateTeamMemberImage(targetIndex, dataUrl);
    });
}

function handleCreateTeamMember() {
    const nameEl = document.getElementById('newTeamMemberName');
    const roleEl = document.getElementById('newTeamMemberRole');
    const bioEl = document.getElementById('newTeamMemberBio');
    const imageEl = document.getElementById('newTeamMemberImage');

    const name = (nameEl?.value || '').trim();
    const role = (roleEl?.value || '').trim();
    const bio = (bioEl?.value || '').trim();
    const image = (imageEl?.value || '').trim();

    if (!name) {
        alert('Please enter a team member name.');
        return;
    }

    addTeamMember(name, role || 'Team Member', bio || '', image);
    if (nameEl) nameEl.value = '';
    if (roleEl) roleEl.value = '';
    if (bioEl) bioEl.value = '';
    if (imageEl) imageEl.value = '';
    const fileInput = document.getElementById('newTeamMemberImageFile');
    if (fileInput) fileInput.value = '';
}

function moveTeamMember(index, direction) {
    const members = getTeamMembers();
    if (direction === 'up' && index > 0) {
        [members[index - 1], members[index]] = [members[index], members[index - 1]];
    }
    if (direction === 'down' && index < members.length - 1) {
        [members[index], members[index + 1]] = [members[index + 1], members[index]];
    }
    renderTeamMembers();
    renderAdminPanel();
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

    const aboutContent = TEAM_DATA && TEAM_DATA.about ? TEAM_DATA.about : DEFAULT_ABOUT_CONTENT;
    const members = getTeamMembers();

    let html = `
        <div style="margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span id="githubSyncStatus" style="font-size: 0.9rem; color: #dfb76c;"></span>
            <div style="display: flex; gap: 10px;">
                <button id="publishBtn" onclick="syncToGitHub()" style="background: #007bff; border-color: #007bff;">🚀 Publish Changes</button>
                <button onclick="logoutAdmin()" style="background: #555; border-color: #555;">🔒 Lock Panel</button>
            </div>
        </div>
        <div style="margin-bottom: 30px; padding: 20px; background: #222; border-radius: 4px; border: 1px solid #444;">
            <h4 style="color: var(--primary-gold); margin-top: 0;">About Section Content</h4>
            <div style="display: grid; gap: 12px;">
                <div>
                    <label style="display: block; font-size: 0.7rem; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Story label</label>
                    <input type="text" value="${aboutContent.storyLabel || ''}" oninput="updateAboutField('storyLabel', this.value)" class="form-control">
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Story title</label>
                    <input type="text" value="${aboutContent.storyTitle || ''}" oninput="updateAboutField('storyTitle', this.value)" class="form-control">
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Story intro</label>
                    <textarea rows="3" oninput="updateAboutField('storyIntro', this.value)" class="form-control">${aboutContent.storyIntro || ''}</textarea>
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Expanded story paragraph 1</label>
                    <textarea rows="2" oninput="updateAboutField('storyExpanded1', this.value)" class="form-control">${aboutContent.storyExpanded1 || ''}</textarea>
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Expanded story paragraph 2</label>
                    <textarea rows="2" oninput="updateAboutField('storyExpanded2', this.value)" class="form-control">${aboutContent.storyExpanded2 || ''}</textarea>
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Team label</label>
                    <input type="text" value="${aboutContent.teamLabel || ''}" oninput="updateAboutField('teamLabel', this.value)" class="form-control">
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Team description</label>
                    <textarea rows="2" oninput="updateAboutField('teamDescription', this.value)" class="form-control">${aboutContent.teamDescription || ''}</textarea>
                </div>
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
        <div style="margin-bottom: 30px; padding: 20px; background: #222; border-radius: 4px; border: 1px solid #444;">
            <h4 style="color: var(--primary-gold); margin-top: 0;">Add New Team Member</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                <input type="text" id="newTeamMemberName" class="form-control" placeholder="Full name">
                <input type="text" id="newTeamMemberRole" class="form-control" placeholder="Role">
                <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 12px;">
                    <input type="text" id="newTeamMemberImage" class="form-control" placeholder="Photo URL or data URL" oninput="updateImagePreview(this.value, 'newTeamMemberPreview')" style="flex: 1; min-width: 0;">
                    <div id="newTeamMemberPreview" style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 0.7rem; text-align: center; flex-shrink: 0;">
                        <span style="font-size: 0.7rem; color: #aaa; letter-spacing: 0.5px;">No photo</span>
                    </div>
                </div>
                <div style="grid-column: 1 / -1; display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 0.7rem; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;">Upload photo</label>
                    <input type="file" id="newTeamMemberImageFile" accept="image/*" onchange="handleTeamMemberImageUpload(this, 'new')" style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                </div>
                <input type="text" id="newTeamMemberBio" class="form-control" placeholder="Short bio" style="grid-column: 1 / -1;">
                <button onclick="handleCreateTeamMember()" style="width: fit-content; padding: 8px 20px;">Add Team Member</button>
            </div>
        </div>
        <h3 style="color: var(--primary-gold); margin-bottom: 15px;">Manage Team Members</h3>
        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px;">
    `;

    members.forEach((member, index) => {
        html += `
            <div style="padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button onclick="moveTeamMember(${index}, 'up')" ${index === 0 ? 'disabled style="background: #252525; color: #555; border: 1px solid #333; cursor: not-allowed; padding: 6px 12px; font-size: 0.8rem; border-radius: 4px;"' : 'style="background: #333; border: 1px solid #555; color: white; cursor: pointer; padding: 6px 12px; font-size: 0.8rem; border-radius: 4px;"'}>▲</button>
                        <button onclick="moveTeamMember(${index}, 'down')" ${index === members.length - 1 ? 'disabled style="background: #252525; color: #555; border: 1px solid #333; cursor: not-allowed; padding: 6px 12px; font-size: 0.8rem; border-radius: 4px;"' : 'style="background: #333; border: 1px solid #555; color: white; cursor: pointer; padding: 6px 12px; font-size: 0.8rem; border-radius: 4px;"'}>▼</button>
                    </div>
                    <button onclick="deleteTeamMember(${index})" style="background: #d9534f; border-color: #d9534f; color: white; padding: 6px 12px; font-size: 0.8rem; border-radius: 4px;">Delete</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Name</span>
                        <input type="text" value="${member.name || ''}" onchange="updateTeamMemberName(${index}, this.value)" class="form-control" style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                    </div>
                    <div>
                        <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Role</span>
                        <input type="text" value="${member.role || ''}" onchange="updateTeamMemberRole(${index}, this.value)" class="form-control" style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                    </div>
                    <div style="grid-column: 1 / -1; display: flex; flex-direction: column; gap: 6px;">
                        <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Photo URL</span>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="text" value="${member.image || ''}" onchange="updateTeamMemberImage(${index}, this.value)" oninput="updateImagePreview(this.value, 'teamMemberPreview-${index}')" class="form-control" placeholder="https://... or data URL" style="flex: 1; min-width: 0; padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                            <div id="teamMemberPreview-${index}" style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                ${member.image ? `<img src="${member.image}" alt="${(member.name || 'Team member').replace(/"/g, '&quot;')}" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=&quot;font-size: 0.7rem; color: #aaa; letter-spacing: 0.5px;&quot;>No photo</span>'">` : '<span style="font-size: 0.7rem; color: #aaa; letter-spacing: 0.5px;">No photo</span>'}
                            </div>
                        </div>
                        <label style="font-size: 0.7rem; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;">Upload new photo</label>
                        <input type="file" accept="image/*" onchange="handleTeamMemberImageUpload(this, ${index})" style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <span style="font-size: 0.7rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Bio</span>
                        <input type="text" value="${member.bio || ''}" onchange="updateTeamMemberBio(${index}, this.value)" class="form-control" style="padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff;">
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div><h3 style="color: var(--primary-gold); margin-bottom: 15px;">Manage Existing Services</h3>
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