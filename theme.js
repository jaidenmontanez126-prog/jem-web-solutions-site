(() => {
  const storageKey = 'jem-color-theme';
  const root = document.documentElement;
  const themeColors = document.querySelectorAll('meta[name="theme-color"]');
  let choice = 'system';

  function applyTheme(value) {
    choice = value === 'light' || value === 'dark' ? value : 'system';

    if (choice === 'system') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = choice;
    }

    themeColors.forEach(meta => {
      const scheme = meta.content === '#f4f4ef' ? 'light' : 'dark';
      meta.media = choice === 'system'
        ? `(prefers-color-scheme: ${scheme})`
        : choice === scheme ? 'all' : 'not all';
    });
  }

  try {
    applyTheme(localStorage.getItem(storageKey));
  } catch {}

  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-theme-choice]');

    function updateButtons() {
      buttons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice));
      });
    }

    updateButtons();
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        applyTheme(button.dataset.themeChoice);
        updateButtons();
        try {
          if (choice === 'system') localStorage.removeItem(storageKey);
          else localStorage.setItem(storageKey, choice);
        } catch {}
      });
    });
  });
})();
