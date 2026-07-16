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

const menuToggle = document.getElementById("menu-toggle-button");
const primaryNavigation = document.getElementById("primary-navigation");
const menuOverlay = document.getElementById("menu-overlay");
if (menuToggle && primaryNavigation) {
  const closeMenu = () => {
    primaryNavigation.classList.remove("show");
    menuOverlay.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.innerHTML = "☰";
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = primaryNavigation.classList.toggle("show");
    menuOverlay.classList.toggle("show", isOpen);

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.innerHTML = isOpen ? "&times;" : "☰";
  });

  primaryNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
  menuOverlay.addEventListener("click", closeMenu);
}