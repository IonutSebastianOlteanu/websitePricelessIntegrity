const OWNER_DATA = {
    description: "Madam Beauty is proudly managed by PRICELESS Integrity, dedicated to delivering a premium, elite beauty experience tailored completely to you.",
    phone: "+1 (347) 299-2782",
    email: "madalina.iamandi@aol.com",
    address: "Bucharest, Romania",
    program: "Mon - Fri: 09:00 - 21:00 | Sat: 09:00 - 18:00 | Sun: Closed"
};

function renderOwnerDetails() {
    const card = document.getElementById('ownerCard');
    if (!card) return;
    card.innerHTML = `
        <h3>Salon & Owner Details</h3>
        <p style="color: #aaa; margin-bottom: 25px;">${OWNER_DATA.description}</p>
        <div class="contact-info-item">
            <p><strong>Phone:</strong> ${OWNER_DATA.phone}</p>
        </div>
        <div class="contact-info-item">
            <p><strong>Email:</strong> ${OWNER_DATA.email}</p>
        </div>
        <div class="contact-info-item">
            <p><strong>Address:</strong> ${OWNER_DATA.address}</p>
        </div>
        <div class="contact-info-item" style="margin-top: 15px;">
            <p><strong>Program:</strong> ${OWNER_DATA.program}</p>
        </div>
    `;
}

function renderFooter() {
    const container = document.getElementById('footerCopyright');
    if (container) {
        container.innerHTML = `Copyright &copy; ${new Date().getFullYear()} Madam Beauty. All rights reserved.`;
    }
}