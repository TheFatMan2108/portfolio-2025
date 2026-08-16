import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import glsl from "vite-plugin-glsl";
import { createPortfolioAdminPlugin } from "./build/portfolioAdminPlugin";

export default defineConfig({
  base: process.env.BASE_PATH?.trim() || "/",
  plugins: [
    createPortfolioAdminPlugin(),
    vue(),
    glsl({
      include: ["**/*.glsl", "**/*.vert", "**/*.frag"],
      defaultExtension: "glsl",
      warnDuplicatedImports: false,
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    host: "127.0.0.1",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".ogg", ".wav", ".glsl", ".ktx2"],
  },
  assetsInclude: ["**/*.svg", "**/*.gltf", "**/*.glb", "**/*.png", "**/*.jpg", "**/*.ktx2"],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "/src/assets/styles/mixins.scss";`,
      },
    },
  },
  build: {
    outDir: "./dist",
    sourcemap: false,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        assetFileNames: "assets/[hash].[ext]",
        entryFileNames: "chunks/[name]-[hash].js",
        chunkFileNames: "chunks/[hash].js",
      },
    },
  },
});
