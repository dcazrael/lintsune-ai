const THEME_KEY = "lintsune-theme";
const DEFAULT_THEME: "light" | "dark" = "light";

const themeState = $state({ value: DEFAULT_THEME as "light" | "dark" });

if (typeof window !== "undefined") {
  const saved = window.localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
  if (saved === "light" || saved === "dark") {
    themeState.value = saved;
  } else {
    themeState.value = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
}

$effect(() => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, themeState.value);
  document.documentElement.classList.toggle("dark", themeState.value === "dark");
});

export function useTheme() {
  return {
    get theme() {
      return themeState.value;
    },
    set theme(next: "light" | "dark") {
      themeState.value = next;
    },
    toggle() {
      themeState.value = themeState.value === "dark" ? "light" : "dark";
    },
  };
}
