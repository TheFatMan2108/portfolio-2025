<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Github from "../../components/icons/Github.vue";
import Instagram from "../../components/icons/Instagram.vue";
import Linkedin from "../../components/icons/Linkedin.vue";
import Mail from "../../components/icons/Mail.vue";
import X from "../../components/icons/X.vue";
import ColorField from "./components/ColorField.vue";
import { resolveProjectMediaType } from "../projects/utils/mediaSource";
import {
  clonePortfolioData,
  createProjectThemeColors,
  getProjectThumbnail,
  isPortfolioData,
  PORTFOLIO_TEXT_FONT_TARGETS,
  resetPortfolioData,
  resolveTextFontFamily,
  savePortfolioData,
} from "../../content/portfolio";
import { translateTextMap } from "./translationService";

import type { Component } from "vue";
import type {
  LocalizedPortfolioData,
  LocalizedProjectData,
  PortfolioProjectData,
  ProjectMediaType,
  SocialIconName,
  TextFontAssignmentData,
} from "../../content/portfolio.types";

const baseLocaleOptions = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "vi", label: "Tiếng Việt" },
] as const;

const fontPresets = [
  { label: "Urbanist", value: '"Urbanist", Arial, sans-serif' },
  { label: "Pro Font Windows", value: '"ProFontWindows", "Courier New", monospace' },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Font hệ thống", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
] as const;

const iconComponents: Record<SocialIconName, Component> = {
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
  x: X,
  instagram: Instagram,
};

const iconNames = Object.keys(iconComponents) as SocialIconName[];
const activeAdminTab = ref<"portfolio" | "projects">("portfolio");
const activeLocale = ref("en");
const translationSourceLocale = ref("de");
const isTranslating = ref(false);
const draft = ref(clonePortfolioData());
const importInput = ref<HTMLInputElement | null>(null);
const status = ref("");
const statusType = ref<"success" | "error">("success");
const activeLocalized = computed<LocalizedPortfolioData>(
  () =>
    draft.value.localized[activeLocale.value] ??
    draft.value.localized.en ??
    (Object.values(draft.value.localized)[0] as LocalizedPortfolioData),
);
const activeLanguage = computed(() => draft.value.languages.find((language) => language.code === activeLocale.value));
const translationMode = computed(() => activeLanguage.value?.translationMode ?? "manual");
const translationSourceOptions = computed(() =>
  draft.value.languages.filter((language) => language.code !== activeLocale.value),
);

const getLanguageName = (languageCode: string): string =>
  draft.value.languages.find((language) => language.code === languageCode)?.name ?? languageCode.toUpperCase();

const getEditableProjectContent = (project: PortfolioProjectData): LocalizedProjectData =>
  project.localized[activeLocale.value] ??
  project.localized.en ??
  (Object.values(project.localized)[0] as LocalizedProjectData);

const projectMediaTypeLabels = {
  image: "Ảnh",
  video: "Video",
  youtube: "YouTube",
} as const;
const getProjectMediaTypeLabel = (type: ProjectMediaType, source: string): string =>
  projectMediaTypeLabels[resolveProjectMediaType(type, source)];
const getExternalMediaHref = (source: string): string | undefined => {
  const normalizedSource = source.trim();
  return /^https?:\/\//i.test(normalizedSource) ? normalizedSource : undefined;
};

const applyProjectThemePreset = (project: PortfolioProjectData): void => {
  project.themeColors = createProjectThemeColors(project.theme);
};

document.title = "Portfolio CMS";

const setStatus = (message: string, type: "success" | "error" = "success"): void => {
  status.value = message;
  statusType.value = type;
};

const cloneValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const sanitizeFontGroupId = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "font-group";

const getUniqueFontGroupId = (value: string, excludedIndex = -1): string => {
  const baseId = sanitizeFontGroupId(value);
  const usedIds = new Set(
    activeLocalized.value.typography.fontGroups.filter((_, index) => index !== excludedIndex).map((group) => group.id),
  );
  if (!usedIds.has(baseId)) return baseId;

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) suffix++;
  return `${baseId}-${suffix}`;
};

const addFontGroup = (): void => {
  activeLocalized.value.typography.fontGroups.push({
    id: getUniqueFontGroupId("font-group-new"),
    name: "Font Group mới",
    fontFamily: activeLocalized.value.typography.bodyFontFamily,
  });
  setStatus(`Đã thêm Font Group cho ${getLanguageName(activeLocale.value)}.`);
};

const renameFontGroup = (event: Event, groupIndex: number): void => {
  const group = activeLocalized.value.typography.fontGroups[groupIndex];
  const input = event.target as HTMLInputElement;
  if (!group) return;

  const oldId = group.id;
  const nextId = getUniqueFontGroupId(input.value, groupIndex);
  input.value = nextId;
  if (oldId === nextId) return;

  group.id = nextId;
  for (const assignment of Object.values(activeLocalized.value.typography.textFontAssignments)) {
    if (assignment.groupId === oldId) assignment.groupId = nextId;
  }
};

const removeFontGroup = (groupIndex: number): void => {
  const typography = activeLocalized.value.typography;
  const group = typography.fontGroups[groupIndex];
  if (!group || !window.confirm(`Xóa Font Group “${group.name}”? Các đoạn text sẽ chuyển sang font riêng.`)) return;

  for (const assignment of Object.values(typography.textFontAssignments)) {
    if (assignment.groupId !== group.id) continue;
    assignment.groupId = "";
    assignment.fontFamily = group.fontFamily;
  }
  typography.fontGroups.splice(groupIndex, 1);
  setStatus("Đã xóa Font Group và giữ nguyên font hiện tại dưới dạng font riêng.");
};

const getResolvedDraftTextFont = (targetKey: string): string =>
  resolveTextFontFamily(activeLocalized.value.typography, targetKey);

const getDraftTextFontAssignment = (targetKey: string): TextFontAssignmentData => {
  const assignments = activeLocalized.value.typography.textFontAssignments;
  const existingAssignment = assignments[targetKey];
  if (existingAssignment) return existingAssignment;

  const assignment: TextFontAssignmentData = {
    groupId: "",
    fontFamily: activeLocalized.value.typography.bodyFontFamily,
  };
  assignments[targetKey] = assignment;
  return assignment;
};

const getTranslationSourceLocale = (): string | null => {
  const sourceExists = translationSourceOptions.value.some(
    (language) => language.code === translationSourceLocale.value,
  );
  if (!sourceExists) translationSourceLocale.value = translationSourceOptions.value[0]?.code ?? "";
  return translationSourceLocale.value || null;
};

watch(activeLocale, () => {
  getTranslationSourceLocale();
});

type TranslationScope = "portfolio" | "projects" | "all";

const handleAiTranslate = async (scope: TranslationScope): Promise<void> => {
  const sourceLocale = getTranslationSourceLocale();
  const targetLocale = activeLocale.value;
  if (!sourceLocale || sourceLocale === targetLocale) {
    setStatus("Cần có một ngôn ngữ nguồn khác ngôn ngữ đích.", "error");
    return;
  }

  const texts: Record<string, string> = {};
  const includesPortfolio = scope === "portfolio" || scope === "all";
  const includesProjects = scope === "projects" || scope === "all";
  const sourcePortfolio = draft.value.localized[sourceLocale];

  if (includesPortfolio && sourcePortfolio) {
    texts["portfolio.jobTitle"] = sourcePortfolio.jobTitle;
    texts["portfolio.location"] = sourcePortfolio.location;
    texts["portfolio.aboutIntro"] = sourcePortfolio.aboutIntro;
    texts["portfolio.aboutTagline"] = sourcePortfolio.aboutTagline;
    texts["portfolio.contactHeadline"] = sourcePortfolio.contactHeadline;
    texts["portfolio.footerText.privacyLabel"] = sourcePortfolio.footerText.privacyLabel;
    texts["portfolio.footerText.legalLabel"] = sourcePortfolio.footerText.legalLabel;
    texts["portfolio.footerText.conceptCreditLabel"] = sourcePortfolio.footerText.conceptCreditLabel;
    texts["portfolio.footerText.musicCreditLabel"] = sourcePortfolio.footerText.musicCreditLabel;
    texts["portfolio.footerText.copyrightText"] = sourcePortfolio.footerText.copyrightText;
    sourcePortfolio.skills.forEach((skill, index) => {
      texts[`portfolio.skills.${index}`] = skill;
    });
  }

  if (includesProjects) {
    draft.value.projects.forEach((project, index) => {
      const sourceProject = project.localized[sourceLocale] ?? project.localized.en;
      if (!sourceProject) return;
      texts[`projects.${index}.title`] = sourceProject.title;
      texts[`projects.${index}.previewDescription`] = sourceProject.previewDescription;
      texts[`projects.${index}.description`] = sourceProject.description;
    });
  }

  if (!Object.keys(texts).length) {
    setStatus("Không tìm thấy nội dung nguồn để dịch.", "error");
    return;
  }

  isTranslating.value = true;
  setStatus(`Đang dịch từ ${getLanguageName(sourceLocale)} sang ${getLanguageName(targetLocale)}...`);
  try {
    const translations = await translateTextMap({
      sourceLanguage: sourceLocale,
      targetLanguage: targetLocale,
      context: "Portfolio cá nhân của một lập trình viên. Giữ nguyên tên công nghệ, tên dự án và các HTML placeholder.",
      texts,
    });

    if (includesPortfolio) {
      const targetPortfolio = draft.value.localized[targetLocale];
      if (targetPortfolio) {
        targetPortfolio.jobTitle = translations["portfolio.jobTitle"] ?? targetPortfolio.jobTitle;
        targetPortfolio.location = translations["portfolio.location"] ?? targetPortfolio.location;
        targetPortfolio.aboutIntro = translations["portfolio.aboutIntro"] ?? targetPortfolio.aboutIntro;
        targetPortfolio.aboutTagline = translations["portfolio.aboutTagline"] ?? targetPortfolio.aboutTagline;
        targetPortfolio.contactHeadline = translations["portfolio.contactHeadline"] ?? targetPortfolio.contactHeadline;
        targetPortfolio.footerText.privacyLabel =
          translations["portfolio.footerText.privacyLabel"] ?? targetPortfolio.footerText.privacyLabel;
        targetPortfolio.footerText.legalLabel =
          translations["portfolio.footerText.legalLabel"] ?? targetPortfolio.footerText.legalLabel;
        targetPortfolio.footerText.conceptCreditLabel =
          translations["portfolio.footerText.conceptCreditLabel"] ?? targetPortfolio.footerText.conceptCreditLabel;
        targetPortfolio.footerText.musicCreditLabel =
          translations["portfolio.footerText.musicCreditLabel"] ?? targetPortfolio.footerText.musicCreditLabel;
        targetPortfolio.footerText.copyrightText =
          translations["portfolio.footerText.copyrightText"] ?? targetPortfolio.footerText.copyrightText;
        targetPortfolio.skills = (sourcePortfolio?.skills ?? targetPortfolio.skills).map(
          (skill, index) => translations[`portfolio.skills.${index}`] ?? skill,
        );
      }
    }

    if (includesProjects) {
      draft.value.projects.forEach((project, index) => {
        const targetProject = project.localized[targetLocale];
        if (!targetProject) return;
        targetProject.title = translations[`projects.${index}.title`] ?? targetProject.title;
        targetProject.previewDescription =
          translations[`projects.${index}.previewDescription`] ?? targetProject.previewDescription;
        targetProject.description = translations[`projects.${index}.description`] ?? targetProject.description;
      });
    }

    setStatus("AI đã điền bản dịch vào bản nháp. Hãy kiểm tra lại trước khi lưu.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Không thể dịch nội dung bằng AI.", "error");
  } finally {
    isTranslating.value = false;
  }
};

const sanitizeLanguageCode = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "lang";

const getUniqueLanguageCode = (value: string, excludedIndex = -1): string => {
  const baseCode = sanitizeLanguageCode(value);
  const usedCodes = new Set(
    draft.value.languages.filter((_, index) => index !== excludedIndex).map((language) => language.code),
  );
  if (!usedCodes.has(baseCode)) return baseCode;

  let suffix = 2;
  while (usedCodes.has(`${baseCode}-${suffix}`)) suffix++;
  return `${baseCode}-${suffix}`;
};

const addLanguage = (): void => {
  const sourceCode = activeLocale.value;
  const sourceContent =
    draft.value.localized[sourceCode] ??
    draft.value.localized.en ??
    (Object.values(draft.value.localized)[0] as LocalizedPortfolioData);
  const code = getUniqueLanguageCode("new-language");

  draft.value.languages.push({
    code,
    label: "NEW",
    name: "Ngôn ngữ mới",
    enabled: false,
    baseLocale: "en",
    translationMode: "manual",
  });
  draft.value.localized[code] = cloneValue(sourceContent);

  for (const project of draft.value.projects) {
    const sourceProject =
      project.localized[sourceCode] ??
      project.localized.en ??
      (Object.values(project.localized)[0] as LocalizedProjectData);
    project.localized[code] = cloneValue(sourceProject);
  }

  activeLocale.value = code;
  setStatus("Đã thêm ngôn ngữ mới từ nội dung hiện tại. Hãy đổi mã, tên và dịch lại nội dung.");
};

const renameLanguage = (event: Event, languageIndex: number): void => {
  const language = draft.value.languages[languageIndex];
  const input = event.target as HTMLInputElement;
  if (!language) return;

  const oldCode = language.code;
  const nextCode = getUniqueLanguageCode(input.value, languageIndex);
  input.value = nextCode;
  if (nextCode === oldCode) return;

  draft.value.localized[nextCode] = draft.value.localized[oldCode] as LocalizedPortfolioData;
  delete draft.value.localized[oldCode];
  for (const project of draft.value.projects) {
    project.localized[nextCode] = project.localized[oldCode] as LocalizedProjectData;
    delete project.localized[oldCode];
  }

  language.code = nextCode;
  if (activeLocale.value === oldCode) activeLocale.value = nextCode;
};

const removeLanguage = (languageIndex: number): void => {
  const language = draft.value.languages[languageIndex];
  if (!language || draft.value.languages.length <= 1) {
    setStatus("Portfolio phải giữ lại ít nhất một ngôn ngữ.", "error");
    return;
  }
  if (!window.confirm(`Xóa ngôn ngữ “${language.name}” và toàn bộ nội dung dịch tương ứng?`)) return;

  draft.value.languages.splice(languageIndex, 1);
  delete draft.value.localized[language.code];
  for (const project of draft.value.projects) delete project.localized[language.code];

  if (!draft.value.languages.some((item) => item.enabled)) draft.value.languages[0]!.enabled = true;
  if (activeLocale.value === language.code) activeLocale.value = draft.value.languages[0]!.code;
  setStatus("Đã xóa ngôn ngữ khỏi bản nháp. Bấm “Lưu thay đổi” để áp dụng.");
};

const handleSave = (): void => {
  if (!draft.value.languages.some((language) => language.enabled)) {
    setStatus("Cần bật ít nhất một ngôn ngữ để hiển thị ngoài Portfolio.", "error");
    return;
  }

  if (savePortfolioData(draft.value)) {
    setStatus("Đã lưu. Portfolio trên trình duyệt này đã dùng dữ liệu mới.");
    return;
  }

  setStatus("Không thể lưu. Hãy giảm dung lượng logo hoặc kiểm tra lại dữ liệu.", "error");
};

const handleReset = (): void => {
  if (!window.confirm("Khôi phục toàn bộ dữ liệu về portfolio-data.json?")) return;
  draft.value = resetPortfolioData();
  activeLocale.value = draft.value.languages[0]?.code ?? "en";
  setStatus("Đã khôi phục dữ liệu gốc.");
};

const handleDownload = (): void => {
  const json = JSON.stringify(draft.value, null, 2);
  const blobUrl = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = "portfolio-data.json";
  anchor.click();
  URL.revokeObjectURL(blobUrl);
  setStatus("Đã tải portfolio-data.json.");
};

const triggerImport = (): void => {
  importInput.value?.click();
};

const handleImport = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  try {
    const importedData: unknown = JSON.parse(await file.text());
    if (!isPortfolioData(importedData)) {
      setStatus("File JSON không đúng schema Portfolio.", "error");
      return;
    }

    draft.value = clonePortfolioData(importedData);
    activeLocale.value = draft.value.languages[0]?.code ?? "en";
    setStatus("Đã nhập JSON. Bấm “Lưu thay đổi” để áp dụng.");
  } catch {
    setStatus("Không thể đọc file JSON.", "error");
  }
};

const addSkill = (): void => {
  activeLocalized.value.skills.push("Kỹ năng mới");
};

const removeSkill = (index: number): void => {
  activeLocalized.value.skills.splice(index, 1);
};

const createSocialId = (): string =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `social-${Date.now()}`;

const addSocial = (): void => {
  draft.value.socials.push({
    id: createSocialId(),
    label: "Mạng xã hội mới",
    url: "https://",
    icon: "github",
    customIcon: "",
    enabled: true,
  });
};

const removeSocial = (index: number): void => {
  draft.value.socials.splice(index, 1);
};

const moveSocial = (index: number, direction: -1 | 1): void => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= draft.value.socials.length) return;

  const [social] = draft.value.socials.splice(index, 1);
  if (social) draft.value.socials.splice(targetIndex, 0, social);
};

const triggerIconUpload = (socialId: string): void => {
  document.getElementById(`social-icon-${socialId}`)?.click();
};

const handleIconUpload = (event: Event, index: number): void => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (file.size > 512 * 1024) {
    setStatus("Logo phải nhỏ hơn 512 KB để tránh đầy localStorage.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const social = draft.value.socials[index];
    if (!social || typeof reader.result !== "string") return;
    social.customIcon = reader.result;
    setStatus("Đã cập nhật logo. Bấm “Lưu thay đổi” để áp dụng.");
  };
  reader.onerror = () => setStatus("Không thể đọc file logo.", "error");
  reader.readAsDataURL(file);
};

const sanitizeSlug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "du-an-moi";

const getUniqueProjectSlug = (value: string, excludedIndex = -1): string => {
  const baseSlug = sanitizeSlug(value);
  const usedSlugs = new Set(
    draft.value.projects.filter((_, index) => index !== excludedIndex).map((project) => project.slug),
  );
  if (!usedSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) suffix++;
  return `${baseSlug}-${suffix}`;
};

const sanitizeTechnologyTagId = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "technology";

const getUniqueTechnologyTagId = (value: string, excludedIndex = -1): string => {
  const baseId = sanitizeTechnologyTagId(value);
  const usedIds = new Set(
    draft.value.technologyTags.filter((_, index) => index !== excludedIndex).map((tag) => tag.id),
  );
  if (!usedIds.has(baseId)) return baseId;

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) suffix++;
  return `${baseId}-${suffix}`;
};

const addTechnologyTag = (): void => {
  draft.value.technologyTags.push({
    id: getUniqueTechnologyTagId("technology-new"),
    label: "Technology mới",
    backgroundColor: "#253449",
    textColor: "#ffffff",
    borderColor: "transparent",
  });
  setStatus("Đã thêm Technology tag vào bản nháp.");
};

const renameTechnologyTag = (event: Event, tagIndex: number): void => {
  const tag = draft.value.technologyTags[tagIndex];
  const input = event.target as HTMLInputElement;
  if (!tag) return;

  const oldId = tag.id;
  const nextId = getUniqueTechnologyTagId(input.value, tagIndex);
  input.value = nextId;
  if (oldId === nextId) return;

  tag.id = nextId;
  for (const project of draft.value.projects) {
    project.tags = project.tags.map((projectTagId) => (projectTagId === oldId ? nextId : projectTagId));
  }
};

const removeTechnologyTag = (tagIndex: number): void => {
  const tag = draft.value.technologyTags[tagIndex];
  if (!tag || !window.confirm(`Xóa Technology tag “${tag.label}” khỏi tất cả dự án?`)) return;

  draft.value.technologyTags.splice(tagIndex, 1);
  for (const project of draft.value.projects) {
    project.tags = project.tags.filter((projectTagId) => projectTagId !== tag.id);
  }
  setStatus("Đã xóa Technology tag và gỡ tag khỏi các dự án liên quan.");
};

const addProject = (): void => {
  const slug = getUniqueProjectSlug("du-an-moi");
  const localized: Record<string, LocalizedProjectData> = {};
  for (const language of draft.value.languages) {
    localized[language.code] =
      language.code === "vi"
        ? {
            title: "Dự án mới",
            previewDescription: "Mô tả ngắn của dự án",
            description: "Mô tả chi tiết của dự án.",
          }
        : language.code === "de"
          ? {
              title: "Neues Projekt",
              previewDescription: "Kurze Projektbeschreibung",
              description: "Detaillierte Projektbeschreibung.",
            }
          : {
              title: "New project",
              previewDescription: "Short project description",
              description: "Detailed project description.",
            };
  }

  const project: PortfolioProjectData = {
    slug,
    contentMode: "data",
    enabled: true,
    theme: "dark",
    themeColors: createProjectThemeColors("dark"),
    tags: draft.value.technologyTags[0] ? [draft.value.technologyTags[0].id] : [],
    thumbnail: "",
    live: "",
    source: "",
    media: [],
    localized,
  };

  draft.value.projects.push(project);
  setStatus("Đã thêm dự án vào bản nháp. Hãy điền nội dung rồi lưu thay đổi.");
};

const removeProject = (index: number): void => {
  const project = draft.value.projects[index];
  if (!project || !window.confirm(`Xóa dự án “${getEditableProjectContent(project).title}” khỏi Portfolio?`)) return;
  draft.value.projects.splice(index, 1);
  setStatus("Đã xóa dự án khỏi bản nháp. Bấm “Lưu thay đổi” để áp dụng.");
};

const moveProject = (index: number, direction: -1 | 1): void => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= draft.value.projects.length) return;
  const [project] = draft.value.projects.splice(index, 1);
  if (project) draft.value.projects.splice(targetIndex, 0, project);
};

const normalizeProjectSlug = (index: number): void => {
  const project = draft.value.projects[index];
  if (!project || project.contentMode === "built-in") return;
  project.slug = getUniqueProjectSlug(project.slug, index);
};

const triggerProjectThumbnailUpload = (index: number): void => {
  document.getElementById(`project-thumbnail-${index}`)?.click();
};

const handleProjectThumbnailUpload = (event: Event, index: number): void => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (file.size > 1024 * 1024) {
    setStatus("Thumbnail phải nhỏ hơn 1 MB để tránh đầy localStorage.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const project = draft.value.projects[index];
    if (!project || typeof reader.result !== "string") return;
    project.thumbnail = reader.result;
    setStatus("Đã cập nhật thumbnail. Bấm “Lưu thay đổi” để áp dụng.");
  };
  reader.onerror = () => setStatus("Không thể đọc file thumbnail.", "error");
  reader.readAsDataURL(file);
};

const addProjectMedia = (projectIndex: number): void => {
  const project = draft.value.projects[projectIndex];
  if (!project) return;
  project.media.push({
    id: createSocialId(),
    type: "auto",
    src: "",
    alt: "",
    caption: "",
  });
};

const removeProjectMedia = (projectIndex: number, mediaIndex: number): void => {
  draft.value.projects[projectIndex]?.media.splice(mediaIndex, 1);
};
</script>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div>
        <p class="admin-eyebrow">PORTFOLIO CMS</p>
        <h1>Quản lý nội dung</h1>
        <p class="admin-subtitle">Nguồn mặc định: <code>src/content/portfolio-data.json</code></p>
      </div>
      <a class="button button-secondary" href="/" target="_blank" rel="noopener noreferrer">Xem Portfolio ↗</a>
    </header>

    <div class="admin-notice">
      <strong>Cách xuất bản:</strong> “Lưu thay đổi” áp dụng ngay trên trình duyệt hiện tại. Để mọi người cùng thấy sau
      khi deploy, tải JSON rồi thay file <code>src/content/portfolio-data.json</code>.
    </div>

    <nav class="admin-tabs" aria-label="Khu vực quản trị">
      <button
        class="admin-tab"
        :class="{ active: activeAdminTab === 'portfolio' }"
        type="button"
        @click="activeAdminTab = 'portfolio'"
      >
        Thông tin Portfolio
      </button>
      <button
        class="admin-tab"
        :class="{ active: activeAdminTab === 'projects' }"
        type="button"
        @click="activeAdminTab = 'projects'"
      >
        Quản lý dự án
        <span>{{ draft.projects.length }}</span>
      </button>
    </nav>

    <form class="admin-form" @submit.prevent="handleSave">
      <section v-show="activeAdminTab === 'portfolio'" class="panel" id="profile">
        <div class="section-heading">
          <div>
            <span class="section-index">01</span>
            <h2>Thông tin cá nhân</h2>
          </div>
        </div>
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>Tên</span>
            <input v-model.trim="draft.profile.firstName" required />
          </label>
          <label class="field">
            <span>Họ</span>
            <input v-model.trim="draft.profile.lastName" required />
          </label>
        </div>
      </section>

      <section v-show="activeAdminTab === 'portfolio'" class="panel" id="content">
        <div class="section-heading section-heading-responsive">
          <div>
            <span class="section-index">02</span>
            <h2>Nội dung đa ngôn ngữ</h2>
            <p>Chỉ ngôn ngữ được bật mới xuất hiện trên website Portfolio.</p>
          </div>
          <button class="button button-secondary" type="button" @click="addLanguage">+ Thêm ngôn ngữ</button>
        </div>

        <div class="language-manager">
          <article v-for="(language, languageIndex) in draft.languages" :key="language.code" class="language-card">
            <div class="language-card-header">
              <label class="toggle-field">
                <input v-model="language.enabled" type="checkbox" />
                <span>{{ language.enabled ? "Hiển thị ngoài Portfolio" : "Đang ẩn ngoài Portfolio" }}</span>
              </label>
              <button
                class="icon-button danger"
                type="button"
                :aria-label="`Xóa ngôn ngữ ${language.name}`"
                :disabled="draft.languages.length <= 1"
                @click="removeLanguage(languageIndex)"
              >
                ×
              </button>
            </div>
            <div class="field-grid language-field-grid">
              <label class="field">
                <span>Mã ngôn ngữ</span>
                <input
                  :value="language.code"
                  pattern="[a-z0-9-]+"
                  required
                  @change="renameLanguage($event, languageIndex)"
                />
              </label>
              <label class="field">
                <span>Nhãn nút</span>
                <input v-model.trim="language.label" maxlength="8" required />
              </label>
              <label class="field">
                <span>Tên ngôn ngữ</span>
                <input v-model.trim="language.name" required />
              </label>
              <label class="field">
                <span>Ngôn ngữ nền UI</span>
                <select v-model="language.baseLocale">
                  <option v-for="option in baseLocaleOptions" :key="option.code" :value="option.code">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>Phương thức dịch</span>
                <select v-model="language.translationMode" @change="activeLocale = language.code">
                  <option value="manual">Tự dịch</option>
                  <option value="ai">AI dịch</option>
                </select>
              </label>
            </div>
          </article>
        </div>

        <div class="content-language-selector">
          <span>Đang sửa bản dịch:</span>
          <div class="locale-tabs" role="tablist" aria-label="Chọn ngôn ngữ nội dung">
            <button
              v-for="language in draft.languages"
              :key="language.code"
              class="locale-tab"
              :class="{ active: activeLocale === language.code }"
              type="button"
              @click="activeLocale = language.code"
            >
              {{ language.label }}
            </button>
          </div>
        </div>

        <div class="translation-mode-panel">
          <div class="translation-mode-header">
            <div>
              <strong>Cách tạo bản dịch · {{ getLanguageName(activeLocale) }}</strong>
              <p>Phương thức được chọn riêng cho ngôn ngữ này trong cấu hình phía trên.</p>
            </div>
            <span class="translation-mode-badge" :class="translationMode">
              {{ translationMode === "ai" ? "AI dịch" : "Tự dịch" }}
            </span>
          </div>

          <p v-if="translationMode === 'manual'" class="translation-manual-hint">
            Nhập trực tiếp vào các trường của ngôn ngữ <strong>{{ getLanguageName(activeLocale) }}</strong> bên dưới.
          </p>
          <div v-else class="translation-ai-controls">
            <label class="field translation-source-field">
              <span>Dịch từ</span>
              <select v-model="translationSourceLocale" :disabled="!translationSourceOptions.length || isTranslating">
                <option v-for="language in translationSourceOptions" :key="language.code" :value="language.code">
                  {{ language.name }} ({{ language.label }})
                </option>
              </select>
            </label>
            <div class="translation-target">
              <span>Dịch sang</span>
              <strong>{{ getLanguageName(activeLocale) }}</strong>
            </div>
            <div class="translation-actions">
              <button
                class="button button-secondary"
                type="button"
                :disabled="isTranslating"
                @click="handleAiTranslate('portfolio')"
              >
                Dịch Portfolio
              </button>
              <button
                class="button button-secondary"
                type="button"
                :disabled="isTranslating"
                @click="handleAiTranslate('projects')"
              >
                Dịch dự án
              </button>
              <button
                class="button button-primary"
                type="button"
                :disabled="isTranslating"
                @click="handleAiTranslate('all')"
              >
                {{ isTranslating ? "Đang dịch..." : "Dịch tất cả" }}
              </button>
            </div>
            <p class="field-hint translation-ai-hint">
              AI dùng Translator tích hợp của trình duyệt hoặc endpoint bảo mật cấu hình bằng
              <code>VITE_TRANSLATION_API_URL</code>. Không đặt API key trong mã frontend.
            </p>
          </div>
        </div>

        <div class="typography-editor">
          <div class="field-grid field-grid-2">
            <label class="field">
              <span>Font dự phòng nội dung</span>
              <input
                v-model.trim="activeLocalized.typography.bodyFontFamily"
                list="font-family-options"
                placeholder='"Urbanist", Arial, sans-serif'
                required
              />
            </label>
            <label class="field">
              <span>Font dự phòng trang trí</span>
              <input
                v-model.trim="activeLocalized.typography.displayFontFamily"
                list="font-family-options"
                placeholder='"ProFontWindows", monospace'
                required
              />
            </label>
          </div>
          <datalist id="font-family-options">
            <option v-for="font in fontPresets" :key="font.label" :value="font.value">{{ font.label }}</option>
          </datalist>

          <div class="font-group-heading">
            <div>
              <h3>Font Groups</h3>
              <p>Các đoạn cùng group sẽ tự dùng chung một font.</p>
            </div>
            <button class="button button-secondary" type="button" @click="addFontGroup">+ Tạo group</button>
          </div>
          <div v-if="activeLocalized.typography.fontGroups.length" class="font-group-list">
            <article
              v-for="(group, groupIndex) in activeLocalized.typography.fontGroups"
              :key="group.id"
              class="font-group-card"
            >
              <div class="field-grid font-group-fields">
                <label class="field">
                  <span>ID group</span>
                  <input
                    :value="group.id"
                    pattern="[a-z0-9-]+"
                    required
                    @change="renameFontGroup($event, groupIndex)"
                  />
                </label>
                <label class="field">
                  <span>Tên group</span>
                  <input v-model.trim="group.name" required />
                </label>
                <label class="field">
                  <span>Font của group</span>
                  <input v-model.trim="group.fontFamily" list="font-family-options" required />
                </label>
                <button
                  class="icon-button danger font-group-remove"
                  type="button"
                  :aria-label="`Xóa Font Group ${group.name}`"
                  @click="removeFontGroup(groupIndex)"
                >
                  ×
                </button>
              </div>
              <p class="font-group-preview" :style="{ fontFamily: group.fontFamily }">
                {{ group.name }} · Aa Bb Cc 0123456789
              </p>
            </article>
          </div>

          <div class="text-font-heading">
            <h3>Font cho từng đoạn text</h3>
            <p>Chọn group hoặc chọn “Font riêng” và nhập font bắt buộc cho đoạn đó.</p>
          </div>
          <div class="text-font-list">
            <article v-for="target in PORTFOLIO_TEXT_FONT_TARGETS" :key="target.key" class="text-font-row">
              <strong>{{ target.label }}</strong>
              <label class="field">
                <span>Font Group</span>
                <select v-model="getDraftTextFontAssignment(target.key).groupId">
                  <option value="">Font riêng</option>
                  <option v-for="group in activeLocalized.typography.fontGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </label>
              <label v-if="!getDraftTextFontAssignment(target.key).groupId" class="field">
                <span>Font riêng</span>
                <input
                  v-model.trim="getDraftTextFontAssignment(target.key).fontFamily"
                  list="font-family-options"
                  required
                />
              </label>
              <div v-else class="text-font-group-value">
                <span>Font đang dùng</span>
                <code>{{ getResolvedDraftTextFont(target.key) }}</code>
              </div>
              <span class="text-font-preview" :style="{ fontFamily: getResolvedDraftTextFont(target.key) }"
                >Preview Aa</span
              >
            </article>
          </div>

          <div class="font-preview" :style="{ fontFamily: activeLocalized.typography.bodyFontFamily }">
            <span>Preview · {{ getLanguageName(activeLocale) }}</span>
            <strong>{{ draft.profile.firstName }} {{ draft.profile.lastName }}</strong>
            <p>{{ activeLocalized.aboutTagline }}</p>
            <em :style="{ fontFamily: activeLocalized.typography.displayFontFamily }">DISPLAY FONT · 0123456789</em>
          </div>
          <p class="field-hint">
            Font dự phòng chỉ dùng khi cấu hình đoạn text bị thiếu. Font ngoài cần được khai báo trong
            <code>src/assets/styles/fonts.scss</code> trước khi sử dụng.
          </p>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>Chức danh</span>
            <input v-model="activeLocalized.jobTitle" required />
          </label>
          <label class="field">
            <span>Địa điểm</span>
            <input v-model="activeLocalized.location" required />
          </label>
        </div>
        <label class="field">
          <span>Giới thiệu chi tiết <small>Cho phép &lt;br/&gt;</small></span>
          <textarea v-model="activeLocalized.aboutIntro" rows="5" required></textarea>
        </label>
        <label class="field">
          <span>Tagline</span>
          <textarea v-model="activeLocalized.aboutTagline" rows="3" required></textarea>
        </label>
        <label class="field">
          <span>Tiêu đề liên hệ <small>Cho phép &lt;br/&gt;</small></span>
          <textarea v-model="activeLocalized.contactHeadline" rows="2" required></textarea>
        </label>

        <div class="repeater-header">
          <h3>Kỹ năng</h3>
          <button class="text-button" type="button" @click="addSkill">+ Thêm kỹ năng</button>
        </div>
        <div class="stack-list">
          <div v-for="(_, index) in activeLocalized.skills" :key="index" class="inline-field">
            <input v-model="activeLocalized.skills[index]" required />
            <button class="icon-button danger" type="button" aria-label="Xóa kỹ năng" @click="removeSkill(index)">
              ×
            </button>
          </div>
        </div>
      </section>

      <section v-show="activeAdminTab === 'portfolio'" class="panel" id="socials">
        <div class="section-heading">
          <div>
            <span class="section-index">03</span>
            <h2>Mạng xã hội</h2>
            <p>Click trực tiếp vào icon để upload logo PNG, JPG, WebP hoặc SVG.</p>
          </div>
          <button class="button button-secondary" type="button" @click="addSocial">+ Thêm mạng xã hội</button>
        </div>

        <div class="social-list">
          <article v-for="(social, index) in draft.socials" :key="social.id" class="social-card">
            <div class="social-preview-column">
              <button
                class="social-preview"
                type="button"
                :title="`Upload logo cho ${social.label}`"
                @click="triggerIconUpload(social.id)"
              >
                <img v-if="social.customIcon" :src="social.customIcon" alt="" />
                <component v-else :is="iconComponents[social.icon]" />
                <span class="upload-badge">↑</span>
              </button>
              <input
                :id="`social-icon-${social.id}`"
                class="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                @change="handleIconUpload($event, index)"
              />
              <button
                v-if="social.customIcon"
                class="text-button danger-text"
                type="button"
                @click="social.customIcon = ''"
              >
                Dùng icon mặc định
              </button>
            </div>

            <div class="social-fields">
              <div class="field-grid field-grid-2">
                <label class="field">
                  <span>Tên hiển thị</span>
                  <input v-model="social.label" required />
                </label>
                <label class="field">
                  <span>Icon mặc định</span>
                  <select v-model="social.icon">
                    <option v-for="iconName in iconNames" :key="iconName" :value="iconName">{{ iconName }}</option>
                  </select>
                </label>
              </div>
              <label class="field">
                <span>URL khi click icon</span>
                <input v-model.trim="social.url" placeholder="https://... hoặc mailto:..." required />
              </label>
              <label class="field">
                <span>URL logo tùy chỉnh <small>hoặc click icon để upload</small></span>
                <input v-model.trim="social.customIcon" placeholder="https://.../logo.svg" />
              </label>
              <label class="toggle-field">
                <input v-model="social.enabled" type="checkbox" />
                <span>Hiển thị trên Portfolio</span>
              </label>
            </div>

            <div class="social-actions">
              <button
                class="icon-button"
                type="button"
                aria-label="Đưa lên"
                :disabled="index === 0"
                @click="moveSocial(index, -1)"
              >
                ↑
              </button>
              <button
                class="icon-button"
                type="button"
                aria-label="Đưa xuống"
                :disabled="index === draft.socials.length - 1"
                @click="moveSocial(index, 1)"
              >
                ↓
              </button>
              <button
                class="icon-button danger"
                type="button"
                aria-label="Xóa mạng xã hội"
                @click="removeSocial(index)"
              >
                ×
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-show="activeAdminTab === 'projects'" class="panel projects-manager" id="projects">
        <div class="section-heading section-heading-responsive">
          <div>
            <span class="section-index">PROJECT CMS</span>
            <h2>Quản lý dự án</h2>
            <p>Thứ tự bên dưới cũng là thứ tự card và nút “Dự án tiếp theo” trên Portfolio.</p>
          </div>
          <button class="button button-primary" type="button" @click="addProject">+ Thêm dự án</button>
        </div>

        <div class="technology-manager">
          <div class="repeater-header technology-heading">
            <div>
              <h3>Technology tags</h3>
              <p>Quản lý tên và màu tag dùng chung cho tất cả dự án.</p>
            </div>
            <button class="button button-secondary" type="button" @click="addTechnologyTag">+ Thêm tag</button>
          </div>
          <div v-if="draft.technologyTags.length" class="technology-tag-list">
            <article v-for="(tag, tagIndex) in draft.technologyTags" :key="tag.id" class="technology-tag-card">
              <div class="technology-tag-card-header">
                <span
                  class="technology-tag-preview"
                  :style="{
                    backgroundColor: tag.backgroundColor,
                    color: tag.textColor,
                    borderColor: tag.borderColor,
                  }"
                >
                  {{ tag.label || tag.id }}
                </span>
                <button
                  class="icon-button danger"
                  type="button"
                  :aria-label="`Xóa tag ${tag.label}`"
                  @click="removeTechnologyTag(tagIndex)"
                >
                  ×
                </button>
              </div>
              <div class="field-grid technology-tag-fields">
                <label class="field">
                  <span>ID</span>
                  <input
                    :value="tag.id"
                    pattern="[a-z0-9-]+"
                    required
                    @change="renameTechnologyTag($event, tagIndex)"
                  />
                </label>
                <label class="field">
                  <span>Tên hiển thị</span>
                  <input v-model.trim="tag.label" required />
                </label>
                <ColorField v-model="tag.backgroundColor" label="Màu nền" default-color="#253449" allow-transparent />
                <ColorField v-model="tag.textColor" label="Màu chữ" default-color="#ffffff" />
                <ColorField v-model="tag.borderColor" label="Màu viền" default-color="#303949" allow-transparent />
              </div>
            </article>
          </div>
          <p v-else class="empty-inline-state">Chưa có Technology tag. Dự án vẫn có thể lưu với danh sách tag trống.</p>
        </div>

        <div class="project-locale-bar">
          <span>Đang sửa nội dung:</span>
          <div class="locale-tabs" role="tablist" aria-label="Ngôn ngữ dự án">
            <button
              v-for="language in draft.languages"
              :key="language.code"
              class="locale-tab"
              :class="{ active: activeLocale === language.code }"
              type="button"
              @click="activeLocale = language.code"
            >
              {{ language.label }}
            </button>
          </div>
        </div>

        <div v-if="draft.projects.length" class="project-list">
          <details
            v-for="(project, projectIndex) in draft.projects"
            :key="project.contentMode === 'built-in' ? project.slug : projectIndex"
            class="project-card"
            :open="project.contentMode === 'data'"
          >
            <summary>
              <span class="project-summary-title">
                {{ getEditableProjectContent(project).title }}
                <small :class="{ disabled: !project.enabled }">{{
                  project.enabled ? "Đang hiển thị" : "Đang ẩn"
                }}</small>
              </span>
              <code>/project/{{ project.slug }}</code>
            </summary>

            <div class="project-fields">
              <div class="project-toolbar">
                <div>
                  <button
                    class="icon-button"
                    type="button"
                    aria-label="Đưa dự án lên"
                    :disabled="projectIndex === 0"
                    @click="moveProject(projectIndex, -1)"
                  >
                    ↑
                  </button>
                  <button
                    class="icon-button"
                    type="button"
                    aria-label="Đưa dự án xuống"
                    :disabled="projectIndex === draft.projects.length - 1"
                    @click="moveProject(projectIndex, 1)"
                  >
                    ↓
                  </button>
                </div>
                <button class="button button-danger" type="button" @click="removeProject(projectIndex)">
                  Xóa dự án
                </button>
              </div>

              <div class="project-editor-grid">
                <div class="project-thumbnail-editor">
                  <button
                    class="project-thumbnail-button"
                    type="button"
                    @click="triggerProjectThumbnailUpload(projectIndex)"
                  >
                    <img :src="getProjectThumbnail(project)" :alt="getEditableProjectContent(project).title" />
                    <span>Đổi thumbnail</span>
                  </button>
                  <input
                    :id="`project-thumbnail-${projectIndex}`"
                    class="visually-hidden"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    @change="handleProjectThumbnailUpload($event, projectIndex)"
                  />
                  <button
                    v-if="project.thumbnail"
                    class="text-button danger-text"
                    type="button"
                    @click="project.thumbnail = ''"
                  >
                    Xóa thumbnail tùy chỉnh
                  </button>
                </div>

                <div>
                  <div class="field-grid field-grid-2">
                    <label class="field">
                      <span>Slug URL</span>
                      <input
                        v-model="project.slug"
                        :readonly="project.contentMode === 'built-in'"
                        pattern="[a-z0-9-]+"
                        required
                        @blur="normalizeProjectSlug(projectIndex)"
                      />
                      <small v-if="project.contentMode === 'built-in'"
                        >Slug dự án build-time được khóa để bảo toàn media.</small
                      >
                    </label>
                    <label class="field">
                      <span>Theme</span>
                      <select v-model="project.theme" @change="applyProjectThemePreset(project)">
                        <option value="dark">Tối</option>
                        <option value="light">Sáng</option>
                      </select>
                      <small>Chọn theme để áp dụng preset, sau đó có thể chỉnh từng màu bên dưới.</small>
                    </label>
                  </div>
                  <div class="project-theme-color-panel">
                    <div class="project-theme-color-heading">
                      <div>
                        <h3>Bảng màu trang dự án</h3>
                        <p>Màu được áp dụng cho mọi ngôn ngữ của dự án này.</p>
                      </div>
                      <button class="text-button" type="button" @click="applyProjectThemePreset(project)">
                        Áp dụng lại theme
                      </button>
                    </div>
                    <div class="field-grid field-grid-2 project-theme-color-grid">
                      <ColorField
                        v-model="project.themeColors.pageBackground"
                        label="Màu nền trang"
                        :default-color="project.theme === 'dark' ? '#0d1521' : '#ffffff'"
                      />
                      <ColorField
                        v-model="project.themeColors.contentBackground"
                        label="Màu nền khối nội dung"
                        :default-color="project.theme === 'dark' ? '#172130' : '#eef3f8'"
                      />
                      <ColorField
                        v-model="project.themeColors.titleColor"
                        label="Màu Title"
                        :default-color="project.theme === 'dark' ? '#ffffff' : '#14202d'"
                      />
                      <ColorField
                        v-model="project.themeColors.descriptionColor"
                        label="Màu mô tả"
                        :default-color="project.theme === 'dark' ? '#ffffff' : '#14202d'"
                      />
                      <ColorField
                        v-model="project.themeColors.textColor"
                        label="Màu chữ chung"
                        :default-color="project.theme === 'dark' ? '#ffffff' : '#14202d'"
                      />
                      <ColorField
                        v-model="project.themeColors.mutedTextColor"
                        label="Màu chữ phụ"
                        :default-color="project.theme === 'dark' ? '#bfc8d8' : '#667283'"
                      />
                      <ColorField
                        v-model="project.themeColors.accentColor"
                        label="Màu nhấn và Button"
                        :default-color="project.theme === 'dark' ? '#79f2c0' : '#1677ff'"
                      />
                      <ColorField
                        v-model="project.themeColors.accentTextColor"
                        label="Màu chữ trên màu nhấn"
                        :default-color="project.theme === 'dark' ? '#07110d' : '#ffffff'"
                      />
                    </div>
                  </div>
                  <label class="field">
                    <span>Thumbnail URL <small>hoặc click ảnh để upload</small></span>
                    <input v-model.trim="project.thumbnail" placeholder="https://.../thumbnail.webp" />
                  </label>
                  <label class="toggle-field">
                    <input v-model="project.enabled" type="checkbox" />
                    <span>Hiển thị dự án trên Portfolio</span>
                  </label>
                </div>
              </div>

              <div class="field-grid field-grid-2">
                <label class="field">
                  <span>Tiêu đề · {{ getLanguageName(activeLocale) }}</span>
                  <input v-model="getEditableProjectContent(project).title" required />
                </label>
                <label class="field">
                  <span>Mô tả card</span>
                  <input v-model="getEditableProjectContent(project).previewDescription" required />
                </label>
              </div>
              <label class="field">
                <span>Mô tả chi tiết <small>Cho phép &lt;br/&gt;</small></span>
                <textarea v-model="getEditableProjectContent(project).description" rows="5"></textarea>
              </label>

              <div class="field-grid field-grid-2">
                <label class="field">
                  <span>Live URL</span>
                  <input v-model.trim="project.live" placeholder="https://..." />
                </label>
                <label class="field">
                  <span>Source URL</span>
                  <input v-model.trim="project.source" placeholder="https://github.com/..." />
                </label>
              </div>

              <label class="field">
                <span>Technology tags <small>Giữ Ctrl/Cmd để chọn nhiều</small></span>
                <select v-model="project.tags" class="tag-select" multiple>
                  <option v-for="tag in draft.technologyTags" :key="tag.id" :value="tag.id">{{ tag.label }}</option>
                </select>
              </label>

              <div class="repeater-header media-heading">
                <div>
                  <h3>Gallery ảnh/video</h3>
                  <p>Gắn link YouTube, URL ảnh từ CDN/website hoặc video MP4/WebM. Có thể để hệ thống tự nhận diện.</p>
                </div>
                <button class="text-button" type="button" @click="addProjectMedia(projectIndex)">+ Thêm media</button>
              </div>
              <div v-if="project.media.length" class="media-list">
                <article v-for="(media, mediaIndex) in project.media" :key="media.id" class="media-row">
                  <div class="field-grid media-field-grid">
                    <label class="field">
                      <span>Loại</span>
                      <select v-model="media.type">
                        <option value="auto">Tự nhận diện</option>
                        <option value="image">Ảnh từ URL</option>
                        <option value="video">Video MP4/WebM</option>
                        <option value="youtube">YouTube</option>
                      </select>
                    </label>
                    <label class="field media-source-field">
                      <span>Media URL</span>
                      <input
                        v-model.trim="media.src"
                        placeholder="https://youtu.be/... hoặc https://cdn.../image.jpg"
                      />
                    </label>
                    <button
                      class="icon-button danger media-remove"
                      type="button"
                      aria-label="Xóa media"
                      @click="removeProjectMedia(projectIndex, mediaIndex)"
                    >
                      ×
                    </button>
                  </div>
                  <div v-if="media.src" class="media-url-status">
                    <span>
                      Nhận diện:
                      <strong>{{ getProjectMediaTypeLabel(media.type, media.src) }}</strong>
                    </span>
                    <a
                      v-if="getExternalMediaHref(media.src)"
                      :href="getExternalMediaHref(media.src)"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mở link ↗
                    </a>
                  </div>
                  <div class="field-grid field-grid-2">
                    <label class="field">
                      <span>Alt text</span>
                      <input v-model="media.alt" />
                    </label>
                    <label class="field">
                      <span>Caption</span>
                      <input v-model="media.caption" />
                    </label>
                  </div>
                </article>
              </div>
            </div>
          </details>
        </div>

        <div v-else class="empty-state">
          <strong>Chưa có dự án</strong>
          <p>Bấm “Thêm dự án” để tạo card và trang chi tiết đầu tiên.</p>
        </div>
      </section>

      <section v-show="activeAdminTab === 'portfolio'" class="panel" id="footer">
        <div class="section-heading">
          <div>
            <span class="section-index">05</span>
            <h2>Footer</h2>
          </div>
        </div>
        <div class="content-language-selector">
          <span>Đang sửa text Footer:</span>
          <div class="locale-tabs" role="tablist" aria-label="Chọn ngôn ngữ Footer">
            <button
              v-for="language in draft.languages"
              :key="language.code"
              class="locale-tab"
              :class="{ active: activeLocale === language.code }"
              type="button"
              @click="activeLocale = language.code"
            >
              {{ language.label }}
            </button>
          </div>
        </div>
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>Text liên kết Quyền riêng tư</span>
            <input v-model="activeLocalized.footerText.privacyLabel" required />
          </label>
          <label class="field">
            <span>Text liên kết Pháp lý</span>
            <input v-model="activeLocalized.footerText.legalLabel" required />
          </label>
          <label class="field">
            <span>Text trước tác giả concept</span>
            <input v-model="activeLocalized.footerText.conceptCreditLabel" required />
          </label>
          <label class="field">
            <span>Text trước credit âm nhạc</span>
            <input v-model="activeLocalized.footerText.musicCreditLabel" required />
          </label>
        </div>
        <label class="field">
          <span>Dòng bản quyền <small>Dùng {year} và {name} để chèn năm/tên tự động</small></span>
          <input v-model="activeLocalized.footerText.copyrightText" required />
        </label>
        <div class="repeater-header footer-shared-heading">
          <h3>Thông tin credit dùng chung</h3>
        </div>
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>Tên bản quyền</span>
            <input v-model="draft.footer.copyrightName" required />
          </label>
          <label class="field">
            <span>Tác giả concept</span>
            <input v-model="draft.footer.conceptCreditName" />
          </label>
          <label class="field">
            <span>URL tác giả concept</span>
            <input v-model.trim="draft.footer.conceptCreditUrl" />
          </label>
          <label class="field">
            <span>Nhà sản xuất âm nhạc</span>
            <input v-model="draft.footer.musicCreditName" />
          </label>
          <label class="field">
            <span>URL âm nhạc</span>
            <input v-model.trim="draft.footer.musicCreditUrl" />
          </label>
        </div>
      </section>

      <section v-show="activeAdminTab === 'portfolio'" class="panel" id="seo">
        <div class="section-heading">
          <div>
            <span class="section-index">06</span>
            <h2>SEO & chia sẻ</h2>
          </div>
        </div>
        <label class="field">
          <span>Tiêu đề website</span>
          <input v-model="draft.seo.title" required />
        </label>
        <label class="field">
          <span>Mô tả website</span>
          <textarea v-model="draft.seo.description" rows="3" required></textarea>
        </label>
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>Canonical URL</span>
            <input v-model.trim="draft.seo.canonicalUrl" />
          </label>
          <label class="field">
            <span>Open Graph image</span>
            <input v-model.trim="draft.seo.ogImage" />
          </label>
          <label class="field">
            <span>Twitter image</span>
            <input v-model.trim="draft.seo.twitterImage" />
          </label>
        </div>
      </section>

      <div class="action-bar">
        <p v-if="status" class="status" :class="statusType" role="status">{{ status }}</p>
        <div class="action-buttons">
          <input
            ref="importInput"
            class="visually-hidden"
            type="file"
            accept="application/json,.json"
            @change="handleImport"
          />
          <button class="button button-ghost" type="button" @click="triggerImport">Nhập JSON</button>
          <button class="button button-ghost" type="button" @click="handleDownload">Tải JSON</button>
          <button class="button button-danger" type="button" @click="handleReset">Khôi phục</button>
          <button class="button button-primary" type="submit">Lưu thay đổi</button>
        </div>
      </div>
    </form>
  </div>
</template>

<style lang="scss">
:root {
  color-scheme: dark;
}

body {
  background: #0b0e13;
  color: #eff4ff;
  font-family: Urbanist, Arial, sans-serif;
}

.admin-shell {
  --admin-accent: #79f2c0;
  --admin-border: #29313f;
  --admin-panel: #121720;
  min-height: 100vh;
  padding: 44px clamp(18px, 4vw, 64px) 140px;
  background: radial-gradient(circle at 80% 0%, rgb(121 242 192 / 10%), transparent 32%), #0b0e13;

  * {
    box-sizing: border-box;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }
}

.admin-header,
.admin-form,
.admin-notice,
.admin-tabs {
  width: min(1120px, 100%);
  margin-inline: auto;
}

.admin-tabs {
  position: sticky;
  top: 12px;
  z-index: 15;
  display: flex;
  gap: 8px;
  padding: 6px;
  margin-bottom: 20px;
  background: rgb(12 17 24 / 90%);
  border: 1px solid var(--admin-border);
  border-radius: 15px;
  backdrop-filter: blur(18px);
}

.admin-tab {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  min-height: 46px;
  padding: 10px 18px;
  color: #8f9bad;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;

  span {
    display: grid;
    place-items: center;
    min-width: 24px;
    height: 24px;
    padding-inline: 6px;
    color: #c7d1df;
    background: #263141;
    border-radius: 12px;
    font-size: 12px;
  }

  &.active {
    color: #07110d;
    background: var(--admin-accent);

    span {
      color: #07110d;
      background: rgb(7 17 13 / 14%);
    }
  }
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 28px;

  h1 {
    margin: 6px 0 8px;
    font-size: clamp(36px, 6vw, 72px);
    line-height: 0.95;
    letter-spacing: -0.045em;
  }
}

.admin-eyebrow,
.section-index {
  color: var(--admin-accent);
  font-weight: 800;
  letter-spacing: 0.16em;
  font-size: 12px;
}

.admin-subtitle,
.section-heading p {
  color: #929daf;
}

.admin-notice {
  padding: 16px 18px;
  margin-bottom: 22px;
  color: #cbd3df;
  background: #101a1b;
  border: 1px solid #24413a;
  border-radius: 14px;
  line-height: 1.55;
}

.admin-form {
  display: grid;
  gap: 20px;
}

.panel {
  padding: clamp(22px, 4vw, 42px);
  background: color-mix(in srgb, var(--admin-panel) 94%, transparent);
  border: 1px solid var(--admin-border);
  border-radius: 24px;
  box-shadow: 0 24px 80px rgb(0 0 0 / 20%);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;

  h2 {
    margin: 5px 0 0;
    font-size: clamp(25px, 4vw, 36px);
    letter-spacing: -0.03em;
  }

  p {
    margin: 8px 0 0;
  }
}

.field-grid {
  display: grid;
  gap: 18px;
}

.typography-editor {
  padding: 18px;
  margin-bottom: 24px;
  background: #0c1118;
  border: 1px solid var(--admin-border);
  border-radius: 16px;
}

.font-group-heading,
.text-font-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin: 22px 0 12px;

  h3,
  p {
    margin: 0;
  }

  p {
    margin-top: 5px;
    color: #7f8b9d;
    font-size: 13px;
  }
}

.text-font-heading {
  display: block;
  margin-top: 28px;
}

.font-group-list,
.text-font-list {
  display: grid;
  gap: 10px;
}

.font-group-card,
.text-font-row {
  padding: 14px;
  background: #101721;
  border: 1px solid #293647;
  border-radius: 13px;
}

.font-group-fields {
  grid-template-columns: 150px minmax(160px, 1fr) minmax(260px, 2fr) auto;
  align-items: end;

  .field {
    margin-bottom: 0;
  }
}

.font-group-remove {
  margin-bottom: 1px;
}

.font-group-preview {
  margin: 12px 0 0;
  padding: 11px 13px;
  color: #e9f0fa;
  background: #0a0f16;
  border-radius: 9px;
  font-size: 18px;
}

.text-font-row {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) minmax(160px, 0.8fr) minmax(240px, 1.4fr) 120px;
  align-items: end;
  gap: 12px;

  > strong {
    align-self: center;
    color: #e8eef8;
  }

  .field {
    margin-bottom: 0;
  }
}

.text-font-group-value {
  display: grid;
  gap: 8px;
  min-width: 0;

  span {
    color: #b7c0ce;
    font-size: 14px;
    font-weight: 700;
  }

  code {
    overflow: hidden;
    padding: 12px 14px;
    background: #0c1118;
    border: 1px solid #303949;
    border-radius: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.text-font-preview {
  overflow: hidden;
  padding: 12px;
  color: #07110d;
  background: var(--admin-accent);
  border-radius: 10px;
  text-align: center;
  white-space: nowrap;
}

.font-preview {
  display: grid;
  gap: 7px;
  padding: 18px;
  color: #eaf1fb;
  background: linear-gradient(135deg, #18232b, #10161e);
  border: 1px solid #32404d;
  border-radius: 12px;

  span {
    color: var(--admin-accent);
    font-family: Urbanist, Arial, sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  strong {
    font-size: clamp(28px, 5vw, 46px);
    line-height: 1;
  }

  p {
    max-width: 720px;
    margin: 0;
    color: #aeb8c6;
    line-height: 1.45;
  }

  em {
    margin-top: 5px;
    color: #d8e2ee;
    font-style: normal;
  }
}

.field-hint {
  margin: 12px 0 0;
  color: #788496;
  font-size: 13px;
  line-height: 1.5;
}

.field-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;

  > span {
    color: #b7c0ce;
    font-size: 14px;
    font-weight: 700;
  }

  small {
    color: #697587;
    font-weight: 500;
  }
}

.field input,
.field textarea,
.field select,
.inline-field input {
  width: 100%;
  color: #eff4ff;
  background: #0c1118;
  border: 1px solid #303949;
  border-radius: 11px;
  padding: 12px 14px;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus {
    border-color: var(--admin-accent);
    box-shadow: 0 0 0 3px rgb(121 242 192 / 12%);
  }
}

.field textarea {
  resize: vertical;
  line-height: 1.55;
}

.locale-tabs {
  display: flex;
  flex-wrap: wrap;
  padding: 4px;
  background: #090d12;
  border: 1px solid var(--admin-border);
  border-radius: 12px;
}

.language-manager {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.language-card {
  padding: 16px;
  background: #0c1118;
  border: 1px solid var(--admin-border);
  border-radius: 14px;
}

.language-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.language-field-grid {
  grid-template-columns: 120px 100px minmax(160px, 1fr) 170px 160px;

  .field {
    margin-bottom: 0;
  }
}

.content-language-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  margin-bottom: 18px;
  color: #aeb8c6;
  background: #101821;
  border: 1px solid #304052;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 800;
}

.translation-mode-panel {
  padding: 16px;
  margin-bottom: 22px;
  background: #0c1118;
  border: 1px solid var(--admin-border);
  border-radius: 14px;
}

.translation-mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;

  strong {
    color: #eef4fd;
  }

  p {
    margin: 4px 0 0;
    color: #7f8b9d;
    font-size: 13px;
  }
}

.translation-mode-badge {
  flex-shrink: 0;
  padding: 8px 13px;
  color: #d9e2ef;
  background: #222c3a;
  border: 1px solid #39475a;
  border-radius: 999px;
  font-weight: 800;

  &.ai {
    color: #07110d;
    background: var(--admin-accent);
    border-color: var(--admin-accent);
  }
}

.translation-manual-hint {
  margin: 14px 0 0;
  color: #aab4c3;
  font-size: 14px;
}

.translation-ai-controls {
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(130px, auto) auto;
  align-items: end;
  gap: 14px;
  margin-top: 16px;
}

.translation-source-field {
  margin-bottom: 0;
}

.translation-target {
  display: grid;
  gap: 8px;
  min-height: 70px;
  padding: 10px 14px;
  background: #101821;
  border: 1px solid #303949;
  border-radius: 11px;

  span {
    color: #7f8b9d;
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    color: #eaf1fb;
  }
}

.translation-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.translation-ai-hint {
  grid-column: 1 / -1;
  margin: 0;
}

.locale-tab {
  padding: 8px 13px;
  color: #8490a1;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;

  &.active {
    color: #07110d;
    background: var(--admin-accent);
    font-weight: 800;
  }
}

.repeater-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.stack-list {
  display: grid;
  gap: 10px;
}

.inline-field {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.button,
.icon-button,
.text-button,
.social-preview {
  border: 0;
  cursor: pointer;
}

.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
  padding: 10px 17px;
  border-radius: 11px;
  text-decoration: none;
  font-weight: 800;
  white-space: nowrap;
}

.button-primary {
  color: #07110d;
  background: var(--admin-accent);
}

.button-secondary,
.button-ghost {
  color: #eaf0fa;
  background: #1c2430;
  border: 1px solid #344052;
}

.button-danger {
  color: #ffb8c0;
  background: #32151b;
  border: 1px solid #612631;
}

.text-button {
  padding: 6px;
  color: var(--admin-accent);
  background: transparent;
  font-weight: 800;
}

.danger-text {
  color: #ff8995;
  font-size: 12px;
}

.icon-button {
  width: 42px;
  height: 42px;
  color: #dce4f0;
  background: #202936;
  border-radius: 10px;
  font-size: 20px;

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.icon-button.danger {
  color: #ff8995;
  background: #35181d;
}

.social-list,
.project-list {
  display: grid;
  gap: 14px;
}

.social-card {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 22px;
  padding: 20px;
  background: #0c1118;
  border: 1px solid var(--admin-border);
  border-radius: 16px;
}

.social-preview-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.social-preview {
  position: relative;
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  color: #eef4ff;
  background: #19212c;
  border: 1px dashed #536175;
  border-radius: 22px;

  svg,
  img {
    width: 34px;
    height: 34px;
    object-fit: contain;
  }
}

.upload-badge {
  position: absolute;
  right: -5px;
  bottom: -5px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  color: #07110d;
  background: var(--admin-accent);
  border-radius: 50%;
  font-weight: 900;
}

.social-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-field {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #b7c0ce;
  font-weight: 700;

  input {
    width: 18px;
    height: 18px;
    accent-color: var(--admin-accent);
  }
}

.project-card {
  overflow: hidden;
  background: #0c1118;
  border: 1px solid var(--admin-border);
  border-radius: 14px;

  summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 800;
  }

  summary code {
    color: #7d899a;
    font-size: 12px;
    font-weight: 500;
  }
}

.technology-manager {
  padding: 16px;
  margin-bottom: 18px;
  background: #0c1118;
  border: 1px solid var(--admin-border);
  border-radius: 14px;
}

.technology-heading {
  margin: 0 0 14px;

  h3,
  p {
    margin: 0;
  }

  p {
    margin-top: 5px;
    color: #788496;
    font-size: 13px;
  }
}

.technology-tag-list {
  display: grid;
  gap: 10px;
}

.technology-tag-card {
  padding: 14px;
  background: #101721;
  border: 1px solid #293647;
  border-radius: 13px;
}

.technology-tag-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.technology-tag-preview {
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
}

.technology-tag-fields {
  grid-template-columns: repeat(2, minmax(0, 1fr));

  .field {
    margin-bottom: 0;
  }
}

.empty-inline-state {
  margin: 0;
  padding: 18px;
  color: #8490a1;
  border: 1px dashed #364357;
  border-radius: 11px;
  text-align: center;
}

.project-locale-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 12px 14px;
  margin-bottom: 18px;
  color: #aeb8c6;
  background: #0c1118;
  border: 1px solid var(--admin-border);
  border-radius: 13px;
  font-size: 14px;
  font-weight: 700;
}

.project-summary-title {
  display: flex;
  align-items: center;
  gap: 10px;

  small {
    padding: 4px 8px;
    color: #7af2c0;
    background: #10271f;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;

    &.disabled {
      color: #9ba5b3;
      background: #232b36;
    }
  }
}

.project-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding-block: 16px;

  > div {
    display: flex;
    gap: 8px;
  }
}

.project-editor-grid {
  display: grid;
  grid-template-columns: minmax(200px, 280px) 1fr;
  gap: 22px;
  margin-bottom: 20px;
}

.project-thumbnail-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.project-thumbnail-button {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 0;
  background: #151d28;
  border: 1px solid #344154;
  border-radius: 14px;
  cursor: pointer;
  aspect-ratio: 16 / 9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    position: absolute;
    right: 8px;
    bottom: 8px;
    padding: 6px 9px;
    color: #07110d;
    background: var(--admin-accent);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 900;
  }
}

.tag-select {
  min-height: 154px;
}

.media-heading {
  align-items: flex-end;
  margin-top: 24px;

  h3,
  p {
    margin: 0;
  }

  p {
    margin-top: 5px;
    color: #788496;
    font-size: 13px;
  }
}

.project-theme-color-panel {
  margin: 2px 0 20px;
  padding: 16px;
  background: #101721;
  border: 1px solid #293647;
  border-radius: 13px;
}

.project-theme-color-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h3,
  p {
    margin: 0;
  }

  p {
    margin-top: 5px;
    color: #788496;
    font-size: 13px;
  }
}

.project-theme-color-grid {
  align-items: start;

  :deep(.color-field) {
    margin-bottom: 0;
  }
}

.media-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.media-row {
  padding: 16px;
  background: #101721;
  border: 1px solid #293647;
  border-radius: 13px;
}

.media-field-grid {
  grid-template-columns: 140px minmax(0, 1fr) auto;
}

.media-remove {
  align-self: center;
  margin-top: 6px;
}

.media-url-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0 14px;
  color: #8d99aa;
  font-size: 13px;

  strong,
  a {
    color: #dbe8f9;
  }

  a {
    text-underline-offset: 3px;
  }
}

.empty-state {
  padding: 54px 20px;
  color: #8d99aa;
  background: #0c1118;
  border: 1px dashed #3b485a;
  border-radius: 16px;
  text-align: center;

  strong {
    color: #edf3fc;
    font-size: 22px;
  }
}

.project-fields {
  padding: 4px 20px 8px;
  border-top: 1px solid var(--admin-border);
}

.action-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 14px max(18px, calc((100vw - 1120px) / 2));
  background: rgb(10 14 20 / 92%);
  border-top: 1px solid var(--admin-border);
  backdrop-filter: blur(18px);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-left: auto;
}

.status {
  margin: 0;
  color: var(--admin-accent);
  font-weight: 700;
}

.status.error {
  color: #ff8995;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

code {
  color: #a6f5d2;
}

@media (max-width: 760px) {
  .admin-header,
  .section-heading-responsive,
  .action-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .field-grid-2 {
    grid-template-columns: 1fr;
  }

  .project-editor-grid,
  .media-field-grid,
  .language-field-grid,
  .technology-tag-fields,
  .translation-ai-controls,
  .font-group-fields,
  .text-font-row {
    grid-template-columns: 1fr;
  }

  .project-locale-bar,
  .content-language-selector,
  .translation-mode-header,
  .project-theme-color-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .translation-ai-hint {
    grid-column: auto;
  }

  .translation-actions {
    justify-content: flex-start;
  }

  .media-remove {
    margin: 0 0 12px;
  }

  .social-card {
    grid-template-columns: 84px 1fr;
  }

  .social-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: flex-end;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-left: 0;
  }

  .action-bar {
    gap: 10px;
  }

  .status {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .admin-shell {
    padding-inline: 12px;
  }

  .panel {
    border-radius: 18px;
  }

  .admin-tabs {
    top: 6px;
  }

  .admin-tab {
    flex: 1;
    padding-inline: 8px;
    font-size: 13px;
  }

  .project-toolbar,
  .media-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .social-card {
    grid-template-columns: 1fr;
  }

  .social-actions {
    grid-column: auto;
  }

  .project-card summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
