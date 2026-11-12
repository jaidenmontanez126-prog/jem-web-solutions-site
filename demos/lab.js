const es = document.documentElement.lang === 'es';
const preview = document.getElementById('site-preview');
const nameInput = document.getElementById('business-name');
const namePreview = document.getElementById('preview-name');
const personality = document.getElementById('personality');
const shell = document.getElementById('preview-shell');
const status = document.getElementById('preview-status');
const breakButton = document.getElementById('break-template');
let rebuildTimer;
const initialTitle = document.getElementById('sample-title').innerHTML;
function announce(message) { status.textContent = message; }
nameInput?.addEventListener('input', () => { namePreview.textContent = nameInput.value.trim() || 'Forma Studio'; });
document.querySelectorAll('[data-palette]').forEach(button => {
 if (button.tagName !== 'BUTTON') return;
 button.addEventListener('click', () => {
  preview.dataset.palette = button.dataset.palette;
  document.querySelectorAll('.swatch').forEach(other => { other.classList.toggle('selected',other===button); other.setAttribute('aria-pressed',String(other===button)); });
  announce((es ? 'Paleta actualizada: ' : 'Palette updated: ') + button.getAttribute('aria-label'));
 });
});
personality?.addEventListener('change', () => { preview.dataset.personality = personality.value; announce((es ? 'Personalidad: ' : 'Personality: ') + personality.selectedOptions[0].textContent); });
document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
 shell.classList.toggle('mobile',button.dataset.device==='mobile');
 document.querySelectorAll('[data-device]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
 announce(es ? 'Tamaño de vista previa actualizado.' : 'Preview size updated.');
}));
breakButton?.addEventListener('click', () => {
 breakButton.disabled = true;
 preview.classList.add('shattering');
 announce(es ? 'Reconstruyendo el diseño…' : 'Rebuilding the design…');
 const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 rebuildTimer = setTimeout(() => {
  preview.classList.remove('template','shattering'); preview.classList.add('rebuilt');
  namePreview.textContent = 'Forma Studio';
  document.getElementById('sample-title').innerHTML = es ? 'Menos genérico.<br>Más tú.' : 'Less ordinary.<br>More you.';
  breakButton.textContent = es ? 'Molde superado. ✓' : 'Template transformed. ✓';
  announce(es ? 'Transformación completa. Usa «Volver al comienzo» para repetir.' : 'Transformation complete. Use Start over to try again.');
 },reduce ? 0 : 600);
});
document.getElementById('reset').addEventListener('click', () => {
 clearTimeout(rebuildTimer);
 if (nameInput) { nameInput.value = 'Forma Studio'; namePreview.textContent = 'Forma Studio'; personality.value = 'editorial'; preview.dataset.personality = 'editorial'; preview.dataset.palette = 'sage'; shell.classList.remove('mobile'); document.querySelectorAll('.swatch').forEach(b=>{b.classList.toggle('selected',b.dataset.palette==='sage');b.setAttribute('aria-pressed',String(b.dataset.palette==='sage'));}); document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.device==='desktop'))); }
 if (breakButton) { preview.classList.remove('shattering','rebuilt'); preview.classList.add('template'); namePreview.textContent=es ? 'Tu negocio' : 'Your Business'; document.getElementById('sample-title').innerHTML=initialTitle; breakButton.disabled=false; breakButton.innerHTML=es ? 'Rompe el molde <span>↗</span>' : 'Break the template <span>↗</span>'; }
 announce(es ? 'Diseño restablecido.' : 'Design reset.');
});
