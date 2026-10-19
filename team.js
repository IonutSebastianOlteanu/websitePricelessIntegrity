const DEFAULT_ABOUT_CONTENT = {
    storyLabel: 'Our Story',
    storyTitle: 'Luxury beauty, thoughtfully tailored to you.',
    storyIntro: 'PRICELESS Integrity brings together advanced aesthetic care, elevated service, and a calm, polished experience designed to help you feel confident in your skin.',
    storyExpanded1: 'From skin rituals to signature treatments, every detail is curated to balance expertise, comfort, and lasting results.',
    teamLabel: 'Our Team',
    teamDescription: 'Skilled professionals devoted to delivering a refined and memorable experience.'
};

const TEAM_MEMBER_SECTIONS = [
    { field: 'training', title: 'Professional Training' },
    { field: 'experience', title: 'Career & Experience' },
    { field: 'philosophy', title: 'Philosophy & Approach' },
    { field: 'passion', title: 'Passion & Inspiration' }
];

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
    const teamLabel = document.getElementById('aboutTeamLabel');
    const teamDescription = document.getElementById('aboutTeamDescription');

    if (storyLabel) storyLabel.textContent = about.storyLabel || 'Our Story';
    if (storyTitle) storyTitle.textContent = about.storyTitle || DEFAULT_ABOUT_CONTENT.storyTitle;
    if (storyIntro) storyIntro.textContent = about.storyIntro || DEFAULT_ABOUT_CONTENT.storyIntro;
    if (storyExpanded1) storyExpanded1.textContent = about.storyExpanded1 || DEFAULT_ABOUT_CONTENT.storyExpanded1;
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
            <div style="grid-column: 1 / -1; text-align: center; color: var(--light-text); padding: 20px 10px;">
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
        const sectionsHtml = TEAM_MEMBER_SECTIONS
            .filter(section => String(member[section.field] || '').trim())
            .map(section => `
                <div class="team-detail">
                    <h5>${section.title}</h5>
                    <p>${member[section.field]}</p>
                </div>
            `).join('');

        return `
            <div class="team-card">
                <div class="team-photo-wrap">
                    ${imageHtml}
                </div>
                <div class="team-info">
                    <h4>${name}</h4>
                    <div class="team-role">${member.role || 'Team Member'}</div>
                    <p class="team-bio">${member.bio || ''}</p>
                    ${sectionsHtml ? `<div class="team-details">${sectionsHtml}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}
