export function initializeTheme() {
  // Verifica se existe uma preferência salva
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme) {
    // Aplica o tema salvo
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  } else {
    // Verifica a preferência do sistema
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
    localStorage.setItem("theme", prefersDark ? "dark" : "light");
  }
}

// Observa mudanças na preferência do sistema
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  const currentTheme = localStorage.getItem("theme");
  // Só atualiza automaticamente se não houver preferência salva
  if (!currentTheme) {
    document.documentElement.classList.toggle("dark", e.matches);
    localStorage.setItem("theme", e.matches ? "dark" : "light");
  }
}); 