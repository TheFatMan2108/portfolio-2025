import { locale } from "../store";

export const changeLocale = (newLocale: string) => {
  locale.value = newLocale;
};
