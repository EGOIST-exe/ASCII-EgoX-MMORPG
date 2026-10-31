import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "three/examples/jsm/objects/Reflector.js"],
        },
      },
    },
  },
});
