import { watch } from "vue";
import { loadTranslations } from "../utils/load";
import { locale, translations } from "../store";
import { onMounted } from "vue";
import {
  applyPortfolioTypography,
  enabledLanguages,
  getLanguageBaseLocale,
} from "../../content/portfolio";

export const useTranslations = () => {
  onMounted(() => {
    const availableLanguages = enabledLanguages.value;
    const savedLocale = window.localStorage.getItem("portfolio-locale");
    const preferredLocale = navigator.language.split("-")[0] ?? "en";
    locale.value =
      availableLanguages.find((language) => language.code === savedLocale)?.code ??
      availableLanguages.find((language) => language.code === preferredLocale)?.code ??
      availableLanguages[0]?.code ??
      "en";
  });

  watch(locale, () => {
    if (!locale.value) return;
    window.localStorage.setItem("portfolio-locale", locale.value);
  });

  watch(
    locale,
    async (newLocale) => {
      if (!newLocale) return;
      applyPortfolioTypography(newLocale);
      document.documentElement.lang = newLocale;
      translations.value = (await loadTranslations("common", getLanguageBaseLocale(newLocale))) ?? {};
    },
    { immediate: true },
  );
};
