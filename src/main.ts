import { createApp } from "vue";
import "./assets/styles/index.scss";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { applyPortfolioSeo } from "./content/portfolio";
import { getAppPath } from "./utils/basePath";

gsap.registerPlugin(ScrollTrigger);

const normalizedPath = getAppPath(window.location.pathname);
const isAdminPath = normalizedPath === "/admin";
const isLocalAdminPage = import.meta.env.DEV && isAdminPath;

if (!import.meta.env.DEV && isAdminPath) {
  window.history.replaceState(null, "", import.meta.env.BASE_URL);
}

const rootModule = isLocalAdminPage ? await import("./features/admin/AdminApp.vue") : await import("./App.vue");

if (isLocalAdminPage) {
  document.body.classList.remove("is-loading");
  document.querySelector(".preloader")?.remove();
} else {
  applyPortfolioSeo();
}

createApp(rootModule.default).mount("#app");
