// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

const adapterName = process.env.ASTRO_ADAPTER ?? "vercel";
const adapter = adapterName === "node" ? node({ mode: "standalone" }) : vercel();

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "server",
  adapter,

  server: {
    port: 4321,
  },

  vite: {
    resolve: {
      dedupe: ["sileo", "react", "react-dom"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "@astrojs/react/client.js"],
      exclude: ["sileo"],
    },
    ssr: {
      noExternal: ["sileo"],
    },
    plugins: [
      // @ts-expect-error - Ignorando disparidad interna de tipos de Vite entre Astro y Tailwind
      tailwindcss(),
    ],
  },
});
