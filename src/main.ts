import { createApp } from "vue";
import "./assets/styles/index.scss";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { applyPortfolioSeo } from "./content/portfolio";

gsap.registerPlugin(ScrollTrigger);

const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isAdminPage = normalizedPath === "/admin";
const rootModule = isAdminPage ? await import("./features/admin/AdminApp.vue") : await import("./App.vue");

if (isAdminPage) {
  document.body.classList.remove("is-loading");
  document.querySelector(".preloader")?.remove();
} else {
  applyPortfolioSeo();
}

createApp(rootModule.default).mount("#app");
