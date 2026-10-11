const services = [
  {
    title: 'Signature Facials',
    description: 'Premium skin rituals designed to restore balance and radiance.',
    details: [
      { name: 'Glow Renewal Facial', duration: '60 min', price: '$95', originalPrice: '$120', description: 'Deep cleanse, exfoliation, hydration, and brightening treatment.' },
      { name: 'Luxe Hydration Boost', duration: '45 min', price: '$80', originalPrice: '$100', description: 'A replenishing facial focused on long-lasting moisture and softness.' }
    ]
  },
  {
    title: 'Hair & Styling',
    description: 'Tailored looks that feel polished, modern, and effortlessly luxurious.',
    details: [
      { name: 'Signature Cut', duration: '60 min', price: '$70', originalPrice: '$90', description: 'Precision cut with shaping and style finishing.' },
      { name: 'Luxury Blowout', duration: '45 min', price: '$55', originalPrice: '$75', description: 'Smooth, glossy finish with added volume and movement.' }
    ]
  }
];

const team = [
  { name: 'Amelia Ross', role: 'Lead Aesthetician', bio: 'Specializes in personalized skin rituals and advanced facial treatments.', image: '' },
  { name: 'Jasmine Vale', role: 'Beauty Director', bio: 'Shapes the luxury experience with care, precision, and elevated style.', image: '' }
];

const owner = {
  name: 'Madam Beauty Studio',
  phone: '(555) 123-4567',
  email: 'hello@madambeauty.com',
  address: '123 Luxury Avenue, New York, NY'
};

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MADAM BEAUTY | by PRICELESS Integrity</title>
  <style>
    :root {
      --primary-gold: #dfb76c;
      --light-text: #f5f5f5;
      --dark-bg: #0b0b0b;
      --card-bg: #161616;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: var(--dark-bg);
      color: var(--light-text);
      line-height: 1.6;
    }
    a { color: inherit; }
    header {
      background: #111111;
      padding: 1rem 5%;
      border-bottom: 1px solid rgba(223,183,108,.15);
    }
    .top-nav {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0;
    }
    .top-nav a {
      position: relative;
      color: rgba(245,245,245,.82);
      text-decoration: none;
      font-size: .74rem;
      letter-spacing: .18em;
      text-transform: uppercase;
      padding: 8px 18px;
      transition: color .2s ease;
    }
    .top-nav a + a { border-left: 1px solid rgba(223,183,108,.18); }
    .top-nav a::after {
      content: "";
      position: absolute;
      left: 18px; right: 18px; bottom: 4px;
      height: 1px; background: var(--primary-gold);
      transform: scaleX(0); transform-origin: center;
      transition: transform .2s ease;
    }
    .top-nav a:hover { color: var(--primary-gold); }
    .top-nav a:hover::after { transform: scaleX(1); }
    .hero {
      text-align: center;
      padding: 80px 20px 40px;
    }
    .hero h1 {
      margin: 0;
      color: var(--primary-gold);
      font-size: clamp(2.2rem, 6vw, 4rem);
      line-height: 1.15;
      font-family: "Segoe Print", "Bradley Hand", cursive;
      font-style: italic;
      font-weight: 600;
    }
    .container, .about-section, .contact-section {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 20px 40px;
    }
    h2 {
      color: var(--primary-gold);
      text-align: center;
      margin-bottom: 20px;
      font-size: 2rem;
    }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .service-card {
      background: var(--card-bg);
      padding: 20px;
      border-top: 3px solid var(--primary-gold);
      border-radius: 4px;
      box-shadow: 0 4px 15px rgba(0,0,0,.4);
      text-align: center;
    }
    .service-card h3 {
      margin: 0 0 10px;
      color: white;
      font-size: 1.2rem;
    }
    .service-card p {
      margin: 0;
      color: #d7d7d7;
    }
    .service-details {
      margin-top: 18px;
      text-align: left;
      border-top: 1px solid rgba(223,183,108,.15);
      padding-top: 12px;
    }
    .service-item {
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .service-item:last-child { border-bottom: none; margin-bottom: 0; }
    .service-meta {
      display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap;
      margin-top: 8px;
    }
    .price {
      color: var(--primary-gold);
      font-weight: bold;
    }
    .original-price {
      color: #888;
      text-decoration: line-through;
      font-size: .9rem;
    }
    .about-section { margin-top: 40px; }
    .about-section-inner {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 30px;
      background: var(--card-bg);
      border: 1px solid rgba(223,183,108,.18);
      border-top: 3px solid var(--primary-gold);
      padding: 30px;
      border-radius: 4px;
    }
    .about-header-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 30px;
    }
    .about-expand-btn {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: transparent;
      border: 1px solid rgba(223,183,108,.5);
      color: var(--primary-gold);
      font-size: 1.4rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .about-expanded-content {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height .4s ease, opacity .25s ease, margin-top .25s ease;
      margin-top: 0;
    }
    .about-section-inner.expanded .about-expanded-content {
      max-height: 220px;
      opacity: 1;
      margin-top: 16px;
    }
    .about-copy h2 {
      margin: 0 0 18px;
      color: var(--light-text);
      text-align: left;
      font-size: clamp(2rem, 4vw, 2.8rem);
    }
    .section-kicker {
      color: var(--primary-gold);
      letter-spacing: .18em;
      text-transform: uppercase;
      font-size: .72rem;
      margin: 0 0 12px;
      font-weight: 700;
    }
    .about-points {
      display: flex; flex-direction: column; justify-content: center; gap: 14px;
    }
    .about-points div {
      background: linear-gradient(135deg, rgba(223,183,108,.10), rgba(223,183,108,.04));
      border: 1px solid rgba(223,183,108,.18);
      color: var(--light-text);
      padding: 16px 18px;
      border-radius: 4px;
      font-weight: 600;
      letter-spacing: .04em;
    }
    .team-section {
      grid-column: 1 / -1;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(223,183,108,.15);
    }
    .team-header { margin-bottom: 18px; }
    .team-header h3 {
      margin: 0; color: var(--primary-gold); text-transform: uppercase; letter-spacing: .12em; font-size: 1.1rem;
      text-align: left;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 22px;
    }
    .team-card {
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
      border: 1px solid rgba(223,183,108,.18);
      padding: 18px;
      border-radius: 8px;
      text-align: center;
    }
    .team-photo-wrap {
      width: 90px; height: 90px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px;
      display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.05);
      color: var(--primary-gold); font-weight: bold;
    }
    .team-card h4 { margin: 0 0 6px; }
    .team-role {
      color: var(--primary-gold); font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 8px;
    }
    .team-card p { margin: 0; color: #d7d7d7; }
    .contact-section { margin-top: 25px; }
    .contact-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
    }
    .contact-card, .contact-map {
      background: var(--card-bg);
      border: 1px solid rgba(223,183,108,.18);
      border-radius: 4px;
      padding: 24px;
    }
    .contact-card p { color: #d7d7d7; }
    .contact-card strong { color: var(--primary-gold); }
    iframe {
      width: 100%; height: 220px; border: 0;
      border-radius: 4px;
      filter: grayscale(1) contrast(1.2) brightness(.9);
    }
    @media (max-width: 700px) {
      .about-section-inner, .contact-grid { grid-template-columns: 1fr; }
      .top-nav a { padding: 8px 12px; }
    }
  </style>
</head>
<body>
  <header>
    <nav class="top-nav" aria-label="Main navigation">
      <a href="#services">Our Services</a>
      <a href="#about">About Us</a>
      <a href="#contact">Contact Us</a>
    </nav>
  </header>

  <section class="hero">
    <h1>Expert beauty services tailored just for you!</h1>
  </section>

  <div id="services" class="container">
    <h2>Our Services</h2>
    <div id="servicesGrid" class="services-grid"></div>
  </div>

  <section id="about" class="about-section">
    <div class="about-header-row">
      <h2 style="margin:0; text-align:center;">About Us</h2>
      <button class="about-expand-btn" type="button" aria-expanded="false" aria-controls="aboutExpandedContent" title="Expand About Us">+</button>
    </div>
    <div id="aboutSectionInner" class="about-section-inner">
      <div class="about-copy">
        <p class="section-kicker">Our Story</p>
        <h2>Luxury beauty, thoughtfully tailored to you.</h2>
        <p>PRICELESS Integrity brings together advanced aesthetic care, elevated service, and a calm, polished experience designed to help you feel confident in your skin.</p>
        <div id="aboutExpandedContent" class="about-expanded-content">
          <p>From skin rituals to signature treatments, every detail is curated to balance expertise, comfort, and lasting results.</p>
          <p>We believe beauty should feel elevated, personal, and restorative — a moment of care that leaves you feeling polished from the inside out.</p>
        </div>
      </div>
      <div class="about-points">
        <div>Personalized care</div>
        <div>Luxury experience</div>
        <div>Expert treatments</div>
      </div>

      <div class="team-section">
        <div class="team-header">
          <p class="section-kicker">Our Team</p>
          <h3>Skilled professionals devoted to delivering a refined and memorable experience.</h3>
        </div>
        <div class="team-grid" id="teamGrid"></div>
      </div>
    </div>
  </section>

  <div id="contact" class="contact-section">
    <h2>Contact Us</h2>
    <div class="contact-grid">
      <div class="contact-card" id="ownerCard"></div>
      <div class="contact-map">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.206695871509!2d-73.9682854845943!3d40.78509157932219!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2589a018531e3%3A0xce62de4922a0961!2sCentral%20Park!5e0!3m2!1sen!2sus!4v1678888888888!5m2!1sen!2sus" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  </div>

  <script>
    function renderServices() {
      const grid = document.getElementById('servicesGrid');
      grid.innerHTML = services.map(category => `
        <div class="service-card">
          <h3>${category.title}</h3>
          <p>${category.description}</p>
          <div class="service-details">
            ${category.details.map(item => `
              <div class="service-item">
                <div><strong>${item.name}</strong></div>
                <div>${item.description}</div>
                <div class="service-meta">
                  <span>${item.duration}</span>
                  <div>
                    <span class="original-price">${item.originalPrice}</span>
                    <span class="price"> ${item.price}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    function renderTeamMembers() {
      const grid = document.getElementById('teamGrid');
      grid.innerHTML = team.map(member => `
        <div class="team-card">
          <div class="team-photo-wrap">${member.name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}</div>
          <h4>${member.name}</h4>
          <div class="team-role">${member.role}</div>
          <p>${member.bio}</p>
        </div>
      `).join('');
    }

    function renderOwnerDetails() {
      const ownerCard = document.getElementById('ownerCard');
      ownerCard.innerHTML = `
        <h3 style="margin-top:0; color: var(--primary-gold);">Owner</h3>
        <p><strong>Name:</strong> ${owner.name}</p>
        <p><strong>Phone:</strong> ${owner.phone}</p>
        <p><strong>Email:</strong> ${owner.email}</p>
        <p><strong>Address:</strong> ${owner.address}</p>
      `;
    }

    const aboutBtn = document.querySelector('.about-expand-btn');
    const aboutSection = document.getElementById('aboutSectionInner');
    if (aboutBtn && aboutSection) {
      aboutBtn.addEventListener('click', () => {
        const isExpanded = aboutSection.classList.toggle('expanded');
        aboutBtn.textContent = isExpanded ? '−' : '+';
        aboutBtn.setAttribute('aria-expanded', String(isExpanded));
      });
    }

    renderServices();
    renderTeamMembers();
    renderOwnerDetails();
  </script>
</body>
</html>`;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler;
