const DEFAULT_ABOUT_CONTENT = {
    storyLabel: 'Our Story',
    storyTitle: 'Luxury beauty, thoughtfully tailored to you.',
    storyIntro: 'PRICELESS Integrity brings together advanced aesthetic care, elevated service, and a calm, polished experience designed to help you feel confident in your skin.',
    storyExpanded1: 'From skin rituals to signature treatments, every detail is curated to balance expertise, comfort, and lasting results.',
    storyExpanded2: 'We believe beauty should feel elevated, personal, and restorative — a moment of care that leaves you feeling polished from the inside out.',
    teamLabel: 'Our Team',
    teamDescription: 'Skilled professionals devoted to delivering a refined and memorable experience.'
};

let TEAM_DATA = {
    about: { ...DEFAULT_ABOUT_CONTENT },
    members: []
};

function getMemberInitials(name) {
    if (!name) return 'T';
    const parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(part => part.charAt(0).toUpperCase()).join('') || 'T';
}

function getTeamMembers() {
    if (!TEAM_DATA || typeof TEAM_DATA !== 'object') {
        return [];
    }
    if (Array.isArray(TEAM_DATA)) {
        return TEAM_DATA;
    }
    return Array.isArray(TEAM_DATA.members) ? TEAM_DATA.members : [];
}

function normalizeTeamData(data) {
    if (Array.isArray(data)) {
        return {
            about: { ...DEFAULT_ABOUT_CONTENT },
            members: data
        };
    }

    if (data && typeof data === 'object') {
        return {
            about: {
                ...DEFAULT_ABOUT_CONTENT,
                ...(data.about || {})
            },
            members: Array.isArray(data.members) ? data.members : (Array.isArray(data.team) ? data.team : [])
        };
    }

    return {
        about: { ...DEFAULT_ABOUT_CONTENT },
        members: []
    };
}

function renderAboutContent() {
    const about = TEAM_DATA && TEAM_DATA.about ? TEAM_DATA.about : DEFAULT_ABOUT_CONTENT;
    const storyLabel = document.getElementById('aboutStoryLabel');
    const storyTitle = document.getElementById('aboutStoryTitle');
    const storyIntro = document.getElementById('aboutStoryIntro');
    const storyExpanded1 = document.getElementById('aboutStoryExpanded1');
    const storyExpanded2 = document.getElementById('aboutStoryExpanded2');
    const teamLabel = document.getElementById('aboutTeamLabel');
    const teamDescription = document.getElementById('aboutTeamDescription');

    if (storyLabel) storyLabel.textContent = about.storyLabel || 'Our Story';
    if (storyTitle) storyTitle.textContent = about.storyTitle || DEFAULT_ABOUT_CONTENT.storyTitle;
    if (storyIntro) storyIntro.textContent = about.storyIntro || DEFAULT_ABOUT_CONTENT.storyIntro;
    if (storyExpanded1) storyExpanded1.textContent = about.storyExpanded1 || DEFAULT_ABOUT_CONTENT.storyExpanded1;
    if (storyExpanded2) storyExpanded2.textContent = about.storyExpanded2 || DEFAULT_ABOUT_CONTENT.storyExpanded2;
    if (teamLabel) teamLabel.textContent = about.teamLabel || 'Our Team';
    if (teamDescription) teamDescription.textContent = about.teamDescription || DEFAULT_ABOUT_CONTENT.teamDescription;
}

async function loadTeamData() {
    try {
        const response = await fetch('team.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        TEAM_DATA = normalizeTeamData(data);
        renderAboutContent();
        renderTeamMembers();
    } catch (error) {
        console.error('Error loading team data:', error);
        TEAM_DATA = {
            about: { ...DEFAULT_ABOUT_CONTENT },
            members: []
        };
        renderAboutContent();
        renderTeamMembers();
    }
}

function renderTeamMembers() {
    const container = document.getElementById('teamGrid');
    if (!container) return;

    const members = getTeamMembers();
    if (!members.length) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #bbb; padding: 20px 10px;">
                Team details will appear here once the owner adds members.
            </div>
        `;
        return;
    }

    container.innerHTML = members.map(member => {
        const name = member.name || 'Team Member';
        const imageHtml = member.image
            ? `<img src="${member.image}" alt="${name}" class="team-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"> <div class="team-avatar team-avatar-fallback" style="display:none;">${getMemberInitials(name)}</div>`
            : `<div class="team-avatar">${getMemberInitials(name)}</div>`;

        return `
            <div class="team-card">
                <div class="team-photo-wrap">
                    ${imageHtml}
                </div>
                <h4>${name}</h4>
                <div class="team-role">${member.role || 'Team Member'}</div>
                <p>${member.bio || ''}</p>
            </div>
        `;
    }).join('');
}
