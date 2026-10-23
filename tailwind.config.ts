import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { gac: "#961514", green: "#00703C", ink: "#0B0C0C", canvas: "#F3F2F1", line: "#B1B4B6", link: "#1D70B8" }, maxWidth: { shell: "1200px" } } }, plugins: [] };
export default config;
