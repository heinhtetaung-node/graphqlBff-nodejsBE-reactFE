import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/graphql": "http://graphql-bff:4000",
      "/upload": "http://document-service:5000",
      "/documents": "http://document-service:5000",
    },
  },
});
