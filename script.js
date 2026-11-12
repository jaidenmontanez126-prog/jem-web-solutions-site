// Theme and navigation stay usable without animation or third-party libraries.
const isSpanish = document.documentElement.lang === 'es';
const themeToggle = document.getElementById('theme-toggle');
let storedTheme;
try { storedTheme = localStorage.getItem('theme'); } catch {}
function updateTheme(light) {
  document.body.classList.toggle('light-mode', light);
  if (themeToggle) themeToggle.textContent = isSpanish ? (light ? 'Oscuro' : 'Claro') : (light ? 'Dark' : 'Light');
}
updateTheme(storedTheme === 'light');
themeToggle?.addEventListener('click', () => {
  const light = !document.body.classList.contains('light-mode');
  updateTheme(light);
  try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch {}
});
const menuToggle = document.getElementById('menu-toggle-button');
const primaryNavigation = document.getElementById('primary-navigation');
const menuOverlay = document.getElementById('menu-overlay');
function setMenu(open) {
  if (!menuToggle || !primaryNavigation) return;
  primaryNavigation.classList.toggle('show', open);
  menuOverlay?.classList.toggle('show', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', isSpanish ? (open ? 'Cerrar menú' : 'Abrir menú') : (open ? 'Close navigation' : 'Open navigation'));
  document.body.style.overflow = open ? 'hidden' : '';
}
menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
menuOverlay?.addEventListener('click', () => setMenu(false));
primaryNavigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') { setMenu(false); menuToggle.focus(); }
  if (event.key === 'Tab' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    const items = [menuToggle, ...primaryNavigation.querySelectorAll('a, button')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.matchMedia('(max-width: 900px)').addEventListener('change', () => setMenu(false));
const phoneCard = document.getElementById('phoneContactCard');
const phonePopup = document.getElementById('phoneChoicePopup');
if (phoneCard && phonePopup) {
  phoneCard.addEventListener('click', () => {
    const open = phoneCard.getAttribute('aria-expanded') !== 'true';
    phoneCard.setAttribute('aria-expanded', String(open));
    phonePopup.hidden = !open;
    phonePopup.classList.toggle('show', open);
  });
}
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = contactForm.querySelector('button[type="submit"]');
    const status = document.getElementById('form-status');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = isSpanish ? 'Enviando…' : 'Sending…';
    status.textContent = '';
    try {
      const response = await fetch(contactForm.action, {method:'POST', body:new FormData(contactForm), headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Request failed');
      status.textContent = isSpanish ? '¡Gracias! Tu mensaje se envió correctamente.' : 'Thanks! Your message was sent successfully.';
      contactForm.reset();
    } catch {
      status.textContent = isSpanish ? 'No se pudo enviar tu mensaje. Intenta de nuevo o contáctame por teléfono o WhatsApp.' : 'Your message could not be sent. Please try again, or contact me by phone or WhatsApp.';
    } finally { button.disabled = false; button.textContent = label; }
  });
}
