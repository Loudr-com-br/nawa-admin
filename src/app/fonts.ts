import localFont from "next/font/local";

/**
 * AT Aero — fonte oficial da marca NAWA, auto-hospedada (licença: arillatype.studio).
 * `fallback` sans-serif garante que, se a fonte falhar ao carregar, o texto
 * nunca caia em serifa (Times). `display: swap` evita texto invisível.
 */
export const atAero = localFont({
  src: [
    { path: "../fonts/AtAero-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/AtAero-RegularItalic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/AtAero-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/AtAero-SemiboldItalic.woff2", weight: "600", style: "italic" },
    { path: "../fonts/AtAero-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/AtAero-BoldItalic.woff2", weight: "700", style: "italic" },
    { path: "../fonts/AtAero-Black.woff2", weight: "900", style: "normal" },
    { path: "../fonts/AtAero-BlackItalic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-ataero",
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});
