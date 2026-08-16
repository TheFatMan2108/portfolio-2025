import { computed, ref } from "vue";
import rawPortfolioData from "./portfolio-data.json";
import thumbnailCubeWar from "../assets/thumbnails/cubewar.webp";
import thumbnailPokedex from "../assets/thumbnails/pokedex.webp";
import thumbnailQuibbo from "../assets/thumbnails/quibbo.webp";
import thumbnailSharkie from "../assets/thumbnails/sharkie.webp";
import thumbnailStreakon from "../assets/thumbnails/streakon.webp";

import type { Locale } from "../i18n/types";
import type {
  LocalizedPortfolioData,
  LocalizedFooterTextData,
  FontGroupData,
  LocalizedProjectData,
  PortfolioData,
  PortfolioLanguageData,
  PortfolioProjectData,
  ProjectThemeColorsData,
  PortfolioTypographyData,
  SocialLinkData,
  TechnologyTagData,
  TextFontAssignmentData,
} from "./portfolio.types";
import type { ProjectContent, ProjectPreview } from "./types";

export const PORTFOLIO_STORAGE_KEY = "portfolio-content-v1";

const defaultPortfolioData = rawPortfolioData as unknown as PortfolioData;
const defaultTypography = {
  bodyFontFamily: '"Urbanist", Arial, sans-serif',
  displayFontFamily: '"ProFontWindows", "Courier New", monospace',
};
export const PORTFOLIO_TEXT_FONT_TARGETS = [
  { key: "hero-name", label: "Tên chính ở Hero", defaultGroup: "content" },
  { key: "job-title", label: "Chức danh trên Hero", defaultGroup: "display" },
  { key: "location", label: "Địa điểm", defaultGroup: "display" },
  { key: "about-intro", label: "Giới thiệu chi tiết", defaultGroup: "display" },
  { key: "about-tagline", label: "Tagline phần About", defaultGroup: "display" },
  { key: "skills", label: "Danh sách kỹ năng", defaultGroup: "display" },
  { key: "projects-title", label: "Tiêu đề Projects", defaultGroup: "content" },
  { key: "project-card-title", label: "Tiêu đề card dự án", defaultGroup: "content" },
  { key: "project-card-description", label: "Mô tả card dự án", defaultGroup: "content" },
  { key: "contact-title", label: "Tiêu đề Contact", defaultGroup: "content" },
  { key: "project-title", label: "Tiêu đề trang dự án", defaultGroup: "content" },
  { key: "project-description", label: "Mô tả trang dự án", defaultGroup: "content" },
  { key: "buttons", label: "Nội dung Button", defaultGroup: "content" },
  { key: "navigation", label: "Menu điều hướng", defaultGroup: "content" },
  { key: "footer-links", label: "Liên kết Footer", defaultGroup: "content" },
  { key: "footer-credits", label: "Credit Footer", defaultGroup: "content" },
  { key: "footer-copyright", label: "Dòng bản quyền Footer", defaultGroup: "content" },
] as const;

export type PortfolioTextFontKey = (typeof PORTFOLIO_TEXT_FONT_TARGETS)[number]["key"];

const createDefaultFontGroups = (bodyFontFamily: string, displayFontFamily: string): FontGroupData[] => [
  { id: "content", name: "Nội dung", fontFamily: bodyFontFamily },
  { id: "display", name: "Trang trí", fontFamily: displayFontFamily },
];
const defaultFooterTextByLocale: Record<Locale, LocalizedFooterTextData> = {
  en: {
    privacyLabel: "Privacy",
    legalLabel: "Legal notice",
    conceptCreditLabel: "Originally created by",
    musicCreditLabel: "Music produced by",
    copyrightText: "© {year} {name}",
  },
  de: {
    privacyLabel: "Datenschutz",
    legalLabel: "Impressum",
    conceptCreditLabel: "Ursprünglich erstellt von",
    musicCreditLabel: "Musik produziert von",
    copyrightText: "© {year} {name}",
  },
  vi: {
    privacyLabel: "Quyền riêng tư",
    legalLabel: "Pháp lý",
    conceptCreditLabel: "Khái niệm ban đầu bởi",
    musicCreditLabel: "Âm nhạc được sản xuất bởi",
    copyrightText: "© {year} {name}",
  },
};
const builtInThumbnails: Record<string, string> = {
  streakon: thumbnailStreakon,
  cubewar: thumbnailCubeWar,
  quibbo: thumbnailQuibbo,
  sharkie: thumbnailSharkie,
  pokedex: thumbnailPokedex,
};
export const PROJECT_THEME_COLOR_PRESETS: Record<PortfolioProjectData["theme"], ProjectThemeColorsData> = {
  dark: {
    pageBackground: "#0d1521",
    contentBackground: "#172130",
    titleColor: "#ffffff",
    descriptionColor: "#ffffff",
    textColor: "#ffffff",
    mutedTextColor: "#bfc8d8",
    accentColor: "#79f2c0",
    accentTextColor: "#07110d",
  },
  light: {
    pageBackground: "#ffffff",
    contentBackground: "#eef3f8",
    titleColor: "#14202d",
    descriptionColor: "#14202d",
    textColor: "#14202d",
    mutedTextColor: "#667283",
    accentColor: "#1677ff",
    accentTextColor: "#ffffff",
  },
};

/** Tạo bản sao bảng màu preset để editor có thể chỉnh độc lập cho từng dự án. */
export const createProjectThemeColors = (theme: PortfolioProjectData["theme"]): ProjectThemeColorsData => ({
  ...PROJECT_THEME_COLOR_PRESETS[theme],
});

const projectDefaults: Record<string, Pick<PortfolioProjectData, "theme" | "themeColors" | "tags">> = {
  streakon: {
    theme: "dark",
    themeColors: {
      pageBackground: "#090909",
      contentBackground: "#141414",
      titleColor: "#ffffff",
      descriptionColor: "#ffffff",
      textColor: "#ffffff",
      mutedTextColor: "#c5c5c5",
      accentColor: "#fec600",
      accentTextColor: "#2c2c2c",
    },
    tags: ["next", "node", "postgresql", "redis"],
  },
  cubewar: {
    theme: "dark",
    themeColors: {
      pageBackground: "#1c2f4f",
      contentBackground: "#364e7c",
      titleColor: "#ffffff",
      descriptionColor: "#ffffff",
      textColor: "#ffffff",
      mutedTextColor: "#c3ccdb",
      accentColor: "#008dff",
      accentTextColor: "#ffffff",
    },
    tags: ["three", "node", "websockets", "redis"],
  },
  quibbo: {
    theme: "light",
    themeColors: {
      pageBackground: "#ffffff",
      contentBackground: "#f3f7fa",
      titleColor: "#141d25",
      descriptionColor: "#141d25",
      textColor: "#141d25",
      mutedTextColor: "#485561",
      accentColor: "#1f81f9",
      accentTextColor: "#ffffff",
    },
    tags: ["three", "node", "kubernetes", "redis", "postgresql"],
  },
  sharkie: {
    theme: "light",
    themeColors: {
      pageBackground: "#16295e",
      contentBackground: "#263e82",
      titleColor: "#ffffff",
      descriptionColor: "#ffffff",
      textColor: "#ffffff",
      mutedTextColor: "#c6d2f2",
      accentColor: "#176cfe",
      accentTextColor: "#ffffff",
    },
    tags: ["javascript", "html", "css"],
  },
  pokedex: {
    theme: "light",
    themeColors: {
      pageBackground: "#f9fbfe",
      contentBackground: "#e9edf6",
      titleColor: "#0c1b3a",
      descriptionColor: "#0c1b3a",
      textColor: "#0c1b3a",
      mutedTextColor: "#696f74",
      accentColor: "#ff5350",
      accentTextColor: "#ffffff",
    },
    tags: ["javascript", "html", "css"],
  },
};
const cloneData = (data: PortfolioData): PortfolioData => JSON.parse(JSON.stringify(data)) as PortfolioData;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const migrateLanguages = (value: unknown): void => {
  if (!isRecord(value)) return;
  const languages = Array.isArray(value.languages)
    ? value.languages
    : [
        { code: "en", label: "EN", name: "English", enabled: true, baseLocale: "en", translationMode: "manual" },
        { code: "de", label: "DE", name: "Deutsch", enabled: true, baseLocale: "de", translationMode: "manual" },
        { code: "vi", label: "VI", name: "Tiếng Việt", enabled: false, baseLocale: "vi", translationMode: "manual" },
      ];
  value.languages = languages;

  for (const language of languages) {
    if (isRecord(language) && language.translationMode !== "manual" && language.translationMode !== "ai") {
      language.translationMode = "manual";
    }
  }

  if (typeof value.version === "number" && value.version < 7) value.version = 7;
};

const migrateTypography = (value: unknown): void => {
  if (!isRecord(value) || !isRecord(value.localized)) return;

  const languageCodes = Array.isArray(value.languages)
    ? value.languages
        .filter((language) => isRecord(language) && typeof language.code === "string")
        .map((language) => (language as Record<string, unknown>).code as string)
    : ["vi", "en", "de"];

  for (const languageCode of languageCodes) {
    const localized = value.localized[languageCode];
    if (!isRecord(localized)) continue;
    if (!isRecord(localized.typography)) localized.typography = { ...defaultTypography };
    const typography = localized.typography;
    if (!isRecord(typography)) continue;

    const bodyFontFamily =
      typeof typography.bodyFontFamily === "string" ? typography.bodyFontFamily : defaultTypography.bodyFontFamily;
    const displayFontFamily =
      typeof typography.displayFontFamily === "string"
        ? typography.displayFontFamily
        : defaultTypography.displayFontFamily;
    typography.bodyFontFamily = bodyFontFamily;
    typography.displayFontFamily = displayFontFamily;
    if (!Array.isArray(typography.fontGroups)) {
      typography.fontGroups = createDefaultFontGroups(bodyFontFamily, displayFontFamily);
    }
    const textFontAssignments = isRecord(typography.textFontAssignments) ? typography.textFontAssignments : {};
    typography.textFontAssignments = textFontAssignments;

    for (const target of PORTFOLIO_TEXT_FONT_TARGETS) {
      const assignment = textFontAssignments[target.key];
      if (isRecord(assignment) && typeof assignment.groupId === "string" && typeof assignment.fontFamily === "string") {
        continue;
      }
      textFontAssignments[target.key] = {
        groupId: target.defaultGroup,
        fontFamily: target.defaultGroup === "display" ? displayFontFamily : bodyFontFamily,
      };
    }
  }

  if (typeof value.version === "number" && value.version < 9) value.version = 9;
};

const migrateLocalizedFooterText = (value: unknown): void => {
  if (!isRecord(value) || !isRecord(value.localized) || !Array.isArray(value.languages)) return;

  for (const language of value.languages) {
    if (!isRecord(language) || typeof language.code !== "string") continue;
    const localized = value.localized[language.code];
    if (!isRecord(localized) || isRecord(localized.footerText)) continue;
    const baseLocale = language.baseLocale === "de" || language.baseLocale === "vi" ? language.baseLocale : "en";
    localized.footerText = { ...defaultFooterTextByLocale[baseLocale] };
  }

  if (typeof value.version === "number" && value.version < 8) value.version = 8;
};

const migrateProjects = (value: unknown): void => {
  if (!isRecord(value) || !Array.isArray(value.projects)) return;

  for (const project of value.projects) {
    if (!isRecord(project) || typeof project.slug !== "string") continue;
    const defaults = projectDefaults[project.slug] ?? {
      theme: "dark",
      themeColors: createProjectThemeColors(project.theme === "light" ? "light" : "dark"),
      tags: ["javascript"],
    };

    if (project.contentMode !== "built-in" && project.contentMode !== "data") project.contentMode = "built-in";
    if (typeof project.enabled !== "boolean") project.enabled = true;
    if (project.theme !== "light" && project.theme !== "dark") project.theme = defaults.theme;
    const normalizedTheme: PortfolioProjectData["theme"] = project.theme === "light" ? "light" : "dark";
    const presetColors = defaults.themeColors ?? createProjectThemeColors(normalizedTheme);
    const legacyBackgroundColor =
      typeof project.backgroundColor === "string" && project.backgroundColor.trim()
        ? project.backgroundColor.trim()
        : presetColors.pageBackground;
    const themeColors: Record<string, unknown> = isRecord(project.themeColors) ? project.themeColors : {};
    project.themeColors = themeColors;
    for (const [colorKey, fallbackColor] of Object.entries(presetColors)) {
      if (typeof themeColors[colorKey] !== "string" || !(themeColors[colorKey] as string).trim()) {
        themeColors[colorKey] = colorKey === "pageBackground" ? legacyBackgroundColor : fallbackColor;
      }
    }
    delete project.backgroundColor;
    if (!Array.isArray(project.tags)) project.tags = [...defaults.tags];
    if (typeof project.thumbnail !== "string") project.thumbnail = "";
    const mediaItems = Array.isArray(project.media) ? project.media : [];
    project.media = mediaItems;
    for (const media of mediaItems) {
      if (
        isRecord(media) &&
        media.type !== "auto" &&
        media.type !== "image" &&
        media.type !== "video" &&
        media.type !== "youtube"
      ) {
        media.type = "auto";
      }
    }
  }

  if (typeof value.version === "number" && value.version < 11) value.version = 11;
};

const migrateTechnologyTags = (value: unknown): void => {
  if (!isRecord(value)) return;
  if (!Array.isArray(value.technologyTags)) {
    value.technologyTags = defaultPortfolioData.technologyTags.map((tag) => ({ ...tag }));
  }
  if (typeof value.version === "number" && value.version < 5) value.version = 5;
};

const hasTypographyData = (value: unknown): boolean => {
  if (!isRecord(value) || !Array.isArray(value.fontGroups) || !isRecord(value.textFontAssignments)) return false;
  if (typeof value.bodyFontFamily !== "string" || typeof value.displayFontFamily !== "string") return false;
  const textFontAssignments = value.textFontAssignments;

  const hasValidGroups = value.fontGroups.every(
    (group) =>
      isRecord(group) &&
      typeof group.id === "string" &&
      /^[a-z0-9-]+$/.test(group.id) &&
      typeof group.name === "string" &&
      typeof group.fontFamily === "string" &&
      group.fontFamily.trim().length > 0,
  );
  if (!hasValidGroups) return false;
  const groupIds = new Set(
    value.fontGroups
      .filter((group): group is Record<string, unknown> => isRecord(group))
      .map((group) => group.id as string),
  );
  if (groupIds.size !== value.fontGroups.length) return false;

  return PORTFOLIO_TEXT_FONT_TARGETS.every((target) => {
    const assignment = textFontAssignments[target.key];
    if (!isRecord(assignment) || typeof assignment.groupId !== "string" || typeof assignment.fontFamily !== "string") {
      return false;
    }
    return assignment.groupId ? groupIds.has(assignment.groupId) : assignment.fontFamily.trim().length > 0;
  });
};

const hasLocalizedContent = (value: unknown, languageCodes: string[]): boolean => {
  if (!isRecord(value)) return false;

  return languageCodes.every((language) => {
    const localized = value[language];
    return (
      isRecord(localized) &&
      typeof localized.jobTitle === "string" &&
      typeof localized.location === "string" &&
      typeof localized.aboutIntro === "string" &&
      typeof localized.aboutTagline === "string" &&
      typeof localized.contactHeadline === "string" &&
      isRecord(localized.footerText) &&
      typeof localized.footerText.privacyLabel === "string" &&
      typeof localized.footerText.legalLabel === "string" &&
      typeof localized.footerText.conceptCreditLabel === "string" &&
      typeof localized.footerText.musicCreditLabel === "string" &&
      typeof localized.footerText.copyrightText === "string" &&
      hasTypographyData(localized.typography) &&
      Array.isArray(localized.skills) &&
      localized.skills.every((skill) => typeof skill === "string")
    );
  });
};

const hasLocalizedProjectContent = (value: unknown, languageCodes: string[]): boolean => {
  if (!isRecord(value)) return false;

  return languageCodes.every((language) => {
    const localized = value[language];
    return (
      isRecord(localized) &&
      typeof localized.title === "string" &&
      typeof localized.previewDescription === "string" &&
      typeof localized.description === "string"
    );
  });
};

const isSocialLink = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  const validIcons = ["mail", "github", "linkedin", "x", "instagram"];

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.url === "string" &&
    typeof value.icon === "string" &&
    validIcons.includes(value.icon) &&
    typeof value.customIcon === "string" &&
    typeof value.enabled === "boolean"
  );
};

const isLanguageData = (value: unknown): value is PortfolioLanguageData =>
  isRecord(value) &&
  typeof value.code === "string" &&
  /^[a-z0-9-]+$/.test(value.code) &&
  typeof value.label === "string" &&
  typeof value.name === "string" &&
  typeof value.enabled === "boolean" &&
  (value.baseLocale === "en" || value.baseLocale === "de" || value.baseLocale === "vi") &&
  (value.translationMode === "manual" || value.translationMode === "ai");

const isTechnologyTagData = (value: unknown): value is TechnologyTagData =>
  isRecord(value) &&
  typeof value.id === "string" &&
  /^[a-z0-9-]+$/.test(value.id) &&
  typeof value.label === "string" &&
  typeof value.backgroundColor === "string" &&
  typeof value.textColor === "string" &&
  typeof value.borderColor === "string";

const isProjectThemeColorsData = (value: unknown): value is ProjectThemeColorsData =>
  isRecord(value) &&
  typeof value.pageBackground === "string" &&
  value.pageBackground.trim().length > 0 &&
  typeof value.contentBackground === "string" &&
  value.contentBackground.trim().length > 0 &&
  typeof value.titleColor === "string" &&
  value.titleColor.trim().length > 0 &&
  typeof value.descriptionColor === "string" &&
  value.descriptionColor.trim().length > 0 &&
  typeof value.textColor === "string" &&
  value.textColor.trim().length > 0 &&
  typeof value.mutedTextColor === "string" &&
  value.mutedTextColor.trim().length > 0 &&
  typeof value.accentColor === "string" &&
  value.accentColor.trim().length > 0 &&
  typeof value.accentTextColor === "string" &&
  value.accentTextColor.trim().length > 0;

const isProjectData = (value: unknown, languageCodes: string[], technologyTagIds: Set<string>): boolean =>
  isRecord(value) &&
  typeof value.slug === "string" &&
  (value.contentMode === "built-in" || value.contentMode === "data") &&
  typeof value.enabled === "boolean" &&
  (value.theme === "light" || value.theme === "dark") &&
  isProjectThemeColorsData(value.themeColors) &&
  Array.isArray(value.tags) &&
  value.tags.every((tag) => typeof tag === "string" && technologyTagIds.has(tag)) &&
  typeof value.thumbnail === "string" &&
  typeof value.live === "string" &&
  typeof value.source === "string" &&
  Array.isArray(value.media) &&
  value.media.every(
    (media) =>
      isRecord(media) &&
      typeof media.id === "string" &&
      (media.type === "auto" || media.type === "image" || media.type === "video" || media.type === "youtube") &&
      typeof media.src === "string" &&
      typeof media.alt === "string" &&
      typeof media.caption === "string",
  ) &&
  hasLocalizedProjectContent(value.localized, languageCodes);

/** Kiểm tra dữ liệu import trước khi đưa vào giao diện Portfolio. */
export const isPortfolioData = (value: unknown): value is PortfolioData => {
  migrateLanguages(value);
  migrateTypography(value);
  migrateLocalizedFooterText(value);
  migrateProjects(value);
  migrateTechnologyTags(value);
  if (!isRecord(value) || !isRecord(value.profile) || !isRecord(value.footer) || !isRecord(value.seo)) return false;

  if (!Array.isArray(value.languages) || !value.languages.every(isLanguageData)) return false;
  const languageCodes = value.languages.map((language) => language.code);
  if (new Set(languageCodes).size !== languageCodes.length || !value.languages.some((language) => language.enabled)) {
    return false;
  }
  if (!Array.isArray(value.technologyTags) || !value.technologyTags.every(isTechnologyTagData)) return false;
  const technologyTagIds = new Set(value.technologyTags.map((tag) => tag.id));
  if (technologyTagIds.size !== value.technologyTags.length) return false;

  return (
    typeof value.version === "number" &&
    typeof value.profile.firstName === "string" &&
    typeof value.profile.lastName === "string" &&
    hasLocalizedContent(value.localized, languageCodes) &&
    Array.isArray(value.socials) &&
    value.socials.every(isSocialLink) &&
    Array.isArray(value.projects) &&
    value.projects.every((project) => isProjectData(project, languageCodes, technologyTagIds)) &&
    typeof value.footer.copyrightName === "string" &&
    typeof value.footer.conceptCreditName === "string" &&
    typeof value.footer.conceptCreditUrl === "string" &&
    typeof value.footer.musicCreditName === "string" &&
    typeof value.footer.musicCreditUrl === "string" &&
    typeof value.seo.title === "string" &&
    typeof value.seo.description === "string" &&
    typeof value.seo.canonicalUrl === "string" &&
    typeof value.seo.ogImage === "string" &&
    typeof value.seo.twitterImage === "string"
  );
};

const createDefaultData = (): PortfolioData => {
  const data = cloneData(defaultPortfolioData);
  isPortfolioData(data);
  return data;
};

const loadInitialData = (): PortfolioData => {
  if (typeof window === "undefined") return createDefaultData();

  try {
    const savedData = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!savedData) return createDefaultData();

    const parsedData: unknown = JSON.parse(savedData);
    return isPortfolioData(parsedData) ? cloneData(parsedData) : createDefaultData();
  } catch (error) {
    console.warn("Không thể đọc dữ liệu Portfolio đã lưu, sử dụng dữ liệu mặc định.", error);
    return createDefaultData();
  }
};

export const portfolioData = ref<PortfolioData>(loadInitialData());

export const enabledSocialLinks = computed<SocialLinkData[]>(() =>
  portfolioData.value.socials.filter((social) => social.enabled && social.url.trim().length > 0),
);

export const enabledLanguages = computed<PortfolioLanguageData[]>(() =>
  portfolioData.value.languages.filter((language) => language.enabled),
);

/** Tạo bản sao độc lập để editor chỉnh sửa an toàn. */
export const clonePortfolioData = (data: PortfolioData = portfolioData.value): PortfolioData => cloneData(data);

/** Lấy nội dung Portfolio theo ngôn ngữ, fallback về tiếng Anh. */
export const getLocalizedPortfolio = (selectedLocale: string | null | undefined): LocalizedPortfolioData =>
  portfolioData.value.localized[selectedLocale ?? ""] ??
  portfolioData.value.localized.en ??
  (Object.values(portfolioData.value.localized)[0] as LocalizedPortfolioData);

/** Lấy ngôn ngữ nền dùng cho các nhãn UI build-time. */
export const getLanguageBaseLocale = (languageCode: string | null | undefined): Locale =>
  portfolioData.value.languages.find((language) => language.code === languageCode)?.baseLocale ?? "en";

/** Giải quyết font của một đoạn text từ Font Group hoặc font riêng. */
export const resolveTextFontFamily = (typography: PortfolioTypographyData, targetKey: string): string => {
  const assignment: TextFontAssignmentData | undefined = typography.textFontAssignments[targetKey];
  const groupFont = assignment?.groupId
    ? typography.fontGroups.find((group) => group.id === assignment.groupId)?.fontFamily.trim()
    : "";
  return (
    groupFont || assignment?.fontFamily.trim() || typography.bodyFontFamily.trim() || defaultTypography.bodyFontFamily
  );
};

/** Áp dụng font nội dung và font hiển thị theo ngôn ngữ đang chọn. */
export const applyPortfolioTypography = (selectedLocale: string | null | undefined): void => {
  if (typeof document === "undefined") return;

  const { typography } = getLocalizedPortfolio(selectedLocale);
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty(
    "--portfolio-font-family",
    typography.bodyFontFamily.trim() || defaultTypography.bodyFontFamily,
  );
  rootStyle.setProperty(
    "--portfolio-display-font-family",
    typography.displayFontFamily.trim() || defaultTypography.displayFontFamily,
  );
  for (const target of PORTFOLIO_TEXT_FONT_TARGETS) {
    rootStyle.setProperty(`--portfolio-font-${target.key}`, resolveTextFontFamily(typography, target.key));
  }
};

/** Tìm cấu hình dự án theo slug. */
export const getPortfolioProject = (slug: string): PortfolioProjectData | undefined =>
  portfolioData.value.projects.find((project) => project.slug === slug);

/** Tạo toàn bộ CSS variable màu riêng cho trang dự án. */
export const getProjectThemeStyle = (slug: string | null | undefined): Record<string, string> => {
  const colors = slug ? getPortfolioProject(slug)?.themeColors : undefined;
  if (!colors) return {};

  return {
    "--color-background-300": colors.pageBackground,
    "--color-background-400": colors.contentBackground,
    "--color-text-400": colors.textColor,
    "--color-text-300": colors.mutedTextColor,
    "--color-accent-400": colors.accentColor,
    "--color-accent-text-400": colors.accentTextColor,
    "--project-title-color": colors.titleColor,
    "--project-description-color": colors.descriptionColor,
  };
};

/** Lấy cấu hình hiển thị của Technology tag theo ID. */
export const getTechnologyTag = (id: string): TechnologyTagData | undefined =>
  portfolioData.value.technologyTags.find((tag) => tag.id === id);

/** Lấy thumbnail tùy chỉnh hoặc asset mặc định của dự án. */
export const getProjectThumbnail = (project: PortfolioProjectData): string =>
  project.thumbnail.trim() || builtInThumbnails[project.slug] || "/meta/og-image.webp";

const createProjectMediaComponents = (project: PortfolioProjectData): NonNullable<ProjectContent["components"]> =>
  project.media
    .filter((media) => media.src.trim().length > 0)
    .map((media) => ({
      type: "media" as const,
      props: {
        type: media.type,
        src: media.src,
        alt: media.alt,
        caption: media.caption,
      },
    }));

const getLocalizedProject = (project: PortfolioProjectData, selectedLocale: string): LocalizedProjectData =>
  project.localized[selectedLocale] ??
  project.localized.en ??
  (Object.values(project.localized)[0] as LocalizedProjectData);

/** Tạo danh sách card dự án hoàn toàn từ Portfolio data. */
export const getProjectPreviews = (selectedLocale: string): ProjectPreview[] =>
  portfolioData.value.projects
    .filter((project) => project.enabled)
    .map((project) => {
      const localized = getLocalizedProject(project, selectedLocale);
      return {
        title: localized.title,
        slug: project.slug,
        thumbnail: getProjectThumbnail(project),
        description: localized.previewDescription,
      };
    });

/** Tạo nội dung trang chi tiết cho dự án được thêm trực tiếp từ CMS. */
export const createDataProjectContent = (project: PortfolioProjectData, selectedLocale: string): ProjectContent => {
  const localized = getLocalizedProject(project, selectedLocale);
  return {
    title: localized.title,
    theme: project.theme,
    tags: [...project.tags],
    description: localized.description,
    live: project.live.trim() || undefined,
    source: project.source.trim() || undefined,
    components: createProjectMediaComponents(project),
  };
};

/** Ghép text/link từ data store với media build-time của trang dự án. */
export const mergeProjectContent = (content: ProjectContent, slug: string, selectedLocale: string): ProjectContent => {
  const project = getPortfolioProject(slug);
  if (!project) return content;

  const localized = getLocalizedProject(project, selectedLocale);
  return {
    ...content,
    title: localized.title.trim() || content.title,
    theme: project.theme,
    tags: [...project.tags],
    description: localized.description.trim() || content.description,
    live: project.live.trim() || undefined,
    source: project.source.trim() || undefined,
    components: [...(content.components ?? []), ...createProjectMediaComponents(project)],
  };
};

/** Ghép tiêu đề và mô tả card dự án từ data store. */
export const mergeProjectPreviews = (previews: ProjectPreview[], selectedLocale: string): ProjectPreview[] =>
  previews.map((preview) => {
    const project = getPortfolioProject(preview.slug);
    if (!project) return preview;
    const localized = getLocalizedProject(project, selectedLocale);

    return {
      ...preview,
      title: localized.title.trim() || preview.title,
      description: localized.previewDescription.trim() || preview.description,
    };
  });

/** Lưu dữ liệu editor vào localStorage và cập nhật website trong tab hiện tại. */
export const savePortfolioData = (data: PortfolioData): boolean => {
  if (!isPortfolioData(data) || typeof window === "undefined") return false;

  try {
    const nextData = cloneData(data);
    window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(nextData));
    portfolioData.value = nextData;
    applyPortfolioSeo();
    return true;
  } catch (error) {
    console.error("Không thể lưu dữ liệu Portfolio.", error);
    return false;
  }
};

/** Khôi phục dữ liệu gốc trong portfolio-data.json. */
export const resetPortfolioData = (): PortfolioData => {
  if (typeof window !== "undefined") window.localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
  const nextData = createDefaultData();
  portfolioData.value = nextData;
  applyPortfolioSeo();
  return cloneData(nextData);
};

const setMetaContent = (selector: string, content: string): void => {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.content = content;
};

/** Đồng bộ title và meta SEO với dữ liệu đang dùng. */
export const applyPortfolioSeo = (): void => {
  if (typeof document === "undefined") return;

  const { seo } = portfolioData.value;
  document.title = seo.title;
  setMetaContent('meta[name="description"]', seo.description);
  setMetaContent('meta[property="og:title"]', seo.title);
  setMetaContent('meta[property="og:description"]', seo.description);
  setMetaContent('meta[property="og:url"]', seo.canonicalUrl);
  setMetaContent('meta[property="og:image"]', seo.ogImage);
  setMetaContent('meta[name="twitter:title"]', seo.title);
  setMetaContent('meta[name="twitter:description"]', seo.description);
  setMetaContent('meta[name="twitter:image"]', seo.twitterImage);

  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = seo.canonicalUrl;
};
