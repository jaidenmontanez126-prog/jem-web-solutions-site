const heroTitle = document.getElementById("hero-title");

if (heroTitle) {
  const fullText = heroTitle.textContent;
  heroTitle.textContent = "";

  let index = 0;

  function typeTitle() {
    if (index < fullText.length) {
      heroTitle.textContent += fullText.charAt(index);
      index++;
      setTimeout(typeTitle, 35);
    }
  }

  setTimeout(typeTitle, 300);
}

const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  const savedTheme = localStorage.getItem("theme");
  const isSpanishPage = document.documentElement.lang === "es";

  function getToggleLabel(isLightMode) {
    if (isSpanishPage) {
      return isLightMode ? "Oscuro" : "Claro";
    }
    return isLightMode ? "Dark" : "Light";
  }

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = getToggleLabel(true);
  } else {
    themeToggle.textContent = getToggleLabel(false);
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const isLightMode = document.body.classList.contains("light-mode");

    if (isLightMode) {
      localStorage.setItem("theme", "light");
    } else {
      localStorage.setItem("theme", "dark");
    }

    themeToggle.textContent = getToggleLabel(isLightMode);
  });
}