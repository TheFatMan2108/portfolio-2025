import type { Locale } from "../i18n/types";

export type SocialIconName = "mail" | "github" | "linkedin" | "x" | "instagram";

export interface PortfolioLanguageData {
  code: string;
  label: string;
  name: string;
  enabled: boolean;
  baseLocale: Locale;
  translationMode: "manual" | "ai";
}

export interface SocialLinkData {
  id: string;
  label: string;
  url: string;
  icon: SocialIconName;
  customIcon: string;
  enabled: boolean;
}

export interface LocalizedProjectData {
  title: string;
  previewDescription: string;
  description: string;
}

export interface LocalizedFooterTextData {
  privacyLabel: string;
  legalLabel: string;
  conceptCreditLabel: string;
  musicCreditLabel: string;
  copyrightText: string;
}

export type ProjectMediaType = "auto" | "image" | "video" | "youtube";

export interface ProjectMediaData {
  id: string;
  type: ProjectMediaType;
  src: string;
  alt: string;
  caption: string;
}

export interface TechnologyTagData {
  id: string;
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export interface FontGroupData {
  id: string;
  name: string;
  fontFamily: string;
}

export interface TextFontAssignmentData {
  groupId: string;
  fontFamily: string;
}

export interface PortfolioTypographyData {
  bodyFontFamily: string;
  displayFontFamily: string;
  fontGroups: FontGroupData[];
  textFontAssignments: Record<string, TextFontAssignmentData>;
}

export interface ProjectThemeColorsData {
  pageBackground: string;
  contentBackground: string;
  titleColor: string;
  descriptionColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  accentTextColor: string;
}

export interface PortfolioProjectData {
  slug: string;
  contentMode: "built-in" | "data";
  enabled: boolean;
  theme: "light" | "dark";
  themeColors: ProjectThemeColorsData;
  tags: string[];
  thumbnail: string;
  live: string;
  source: string;
  media: ProjectMediaData[];
  localized: Record<string, LocalizedProjectData>;
}

export interface LocalizedPortfolioData {
  jobTitle: string;
  location: string;
  aboutIntro: string;
  aboutTagline: string;
  contactHeadline: string;
  skills: string[];
  footerText: LocalizedFooterTextData;
  typography: PortfolioTypographyData;
}

export interface PortfolioData {
  version: number;
  profile: {
    firstName: string;
    lastName: string;
  };
  languages: PortfolioLanguageData[];
  localized: Record<string, LocalizedPortfolioData>;
  socials: SocialLinkData[];
  technologyTags: TechnologyTagData[];
  projects: PortfolioProjectData[];
  footer: {
    copyrightName: string;
    conceptCreditName: string;
    conceptCreditUrl: string;
    musicCreditName: string;
    musicCreditUrl: string;
  };
  seo: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage: string;
    twitterImage: string;
  };
}
