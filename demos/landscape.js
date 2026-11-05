const menu = document.querySelector('.land-menu');
const navigation = document.getElementById('land-nav');
const narrow = window.matchMedia('(max-width: 800px)');
function syncMenu() {
  menu.hidden = !narrow.matches;
  navigation.hidden = narrow.matches;
  menu.setAttribute('aria-expanded', String(!navigation.hidden));
}
syncMenu();
narrow.addEventListener('change', syncMenu);
menu.addEventListener('click', () => {
  navigation.hidden = !navigation.hidden;
  menu.setAttribute('aria-expanded', String(!navigation.hidden));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && narrow.matches && !navigation.hidden) {
    navigation.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});
const estimate = document.getElementById('estimate-demo');
if (estimate) {
  // This is a local preview. Never send or persist entered values.
  estimate.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.getElementById('estimate-status');
    status.textContent = document.documentElement.lang === 'es'
      ? 'Vista previa completada. En un sitio real, tu solicitud se enviaría al negocio. Esta demostración no envió ni guardó tus datos.'
      : 'Preview complete. On a live website, your request would go to the business. This demo did not send or save your details.';
    estimate.reset();
    status.focus();
  });
}
