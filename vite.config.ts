import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// سياسة أمان المحتوى (CSP) تُحقن في نسخة الإنتاج فقط حتى لا تعطّل بيئة التطوير.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const injectCsp = (): Plugin => ({
  name: "inject-csp",
  apply: "build",
  transformIndexHtml(html) {
    return html.replace("<!--CSP-->", `<meta http-equiv="Content-Security-Policy" content="${csp}" />`)
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), injectCsp()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
