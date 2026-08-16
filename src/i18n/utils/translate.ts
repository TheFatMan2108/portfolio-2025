import { compileTemplate } from "./template";
import { locale, translations } from "../store";
import { getLocalizedPortfolio } from "../../content/portfolio";

const getPortfolioTranslation = (key: string): string | undefined => {
  const localized = getLocalizedPortfolio(locale.value);
  const overrides: Record<string, string> = {
    "job-title": localized.jobTitle,
    germany: localized.location,
    "about-intro": localized.aboutIntro,
    "about-tagline": localized.aboutTagline,
    "lets-work-together": localized.contactHeadline,
  };

  return overrides[key];
};

export const t = (key: string, props: { [key: string]: any } = {}) => {
  const translation = getPortfolioTranslation(key) ?? translations.value[key];
  if (!translation) return "";

  const render = compileTemplate(translation);
  return render(props);
};
