import { createApp } from "vue";
import "./assets/styles/index.scss";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { applyPortfolioSeo } from "./content/portfolio";
import { getAppPath } from "./utils/basePath";

gsap.registerPlugin(ScrollTrigger);

const normalizedPath = getAppPath(window.location.pathname);
const isAdminPage = normalizedPath === "/admin";
const rootModule = isAdminPage ? await import("./features/admin/AdminApp.vue") : await import("./App.vue");

if (isAdminPage) {
  document.body.classList.remove("is-loading");
  document.querySelector(".preloader")?.remove();
} else {
  applyPortfolioSeo();
}

createApp(rootModule.default).mount("#app");
