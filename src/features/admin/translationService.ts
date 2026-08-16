export type TranslationTextMap = Record<string, string>;

export interface TranslateTextMapOptions {
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  texts: TranslationTextMap;
}

interface BrowserTranslator {
  translate(text: string): Promise<string>;
  destroy?: () => void;
}

interface BrowserTranslatorFactory {
  availability?: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<string>;
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<BrowserTranslator>;
}

const getBrowserTranslatorFactory = (): BrowserTranslatorFactory | undefined =>
  (globalThis as typeof globalThis & { Translator?: BrowserTranslatorFactory }).Translator;

const protectHtmlTags = (value: string): { text: string; tags: string[] } => {
  const tags: string[] = [];
  const text = value.replace(/<[^>]+>|\{[a-zA-Z0-9_-]+\}/g, (tag) => {
    const token = `⟦HTML${tags.length}⟧`;
    tags.push(tag);
    return token;
  });
  return { text, tags };
};

const restoreHtmlTags = (value: string, tags: string[]): string =>
  tags.reduce((result, tag, index) => result.replaceAll(`⟦HTML${index}⟧`, tag), value);

const translateWithBrowser = async (options: TranslateTextMapOptions): Promise<TranslationTextMap | null> => {
  const factory = getBrowserTranslatorFactory();
  if (!factory) return null;

  const languagePair = {
    sourceLanguage: options.sourceLanguage,
    targetLanguage: options.targetLanguage,
  };
  const availability = await factory.availability?.(languagePair);
  if (availability === "unavailable") return null;

  const translator = await factory.create(languagePair);
  try {
    const translations: TranslationTextMap = {};
    for (const [key, sourceText] of Object.entries(options.texts)) {
      if (!sourceText.trim()) {
        translations[key] = sourceText;
        continue;
      }

      const protectedValue = protectHtmlTags(sourceText);
      const translatedText = await translator.translate(protectedValue.text);
      translations[key] = restoreHtmlTags(translatedText, protectedValue.tags);
    }
    return translations;
  } finally {
    translator.destroy?.();
  }
};

const translateWithApi = async (options: TranslateTextMapOptions): Promise<TranslationTextMap | null> => {
  const endpoint = import.meta.env.VITE_TRANSLATION_API_URL?.trim();
  if (!endpoint) return null;

  const protectedTexts: TranslationTextMap = {};
  const htmlTagsByKey: Record<string, string[]> = {};
  for (const [key, sourceText] of Object.entries(options.texts)) {
    const protectedValue = protectHtmlTags(sourceText);
    protectedTexts[key] = protectedValue.text;
    htmlTagsByKey[key] = protectedValue.tags;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...options, texts: protectedTexts }),
  });
  if (!response.ok) throw new Error(`Dịch AI thất bại (HTTP ${response.status}).`);

  const payload = (await response.json()) as { translations?: unknown };
  if (!payload.translations || typeof payload.translations !== "object" || Array.isArray(payload.translations)) {
    throw new Error("API dịch AI trả về dữ liệu không đúng định dạng.");
  }

  const translations = payload.translations as Record<string, unknown>;
  const result: TranslationTextMap = {};
  for (const key of Object.keys(options.texts)) {
    if (typeof translations[key] !== "string") throw new Error(`API dịch AI thiếu nội dung “${key}”.`);
    result[key] = restoreHtmlTags(translations[key], htmlTagsByKey[key] ?? []);
  }
  return result;
};

/** Dịch một nhóm nội dung bằng Translator API của trình duyệt hoặc endpoint AI bảo mật phía server. */
export const translateTextMap = async (options: TranslateTextMapOptions): Promise<TranslationTextMap> => {
  try {
    const browserResult = await translateWithBrowser(options);
    if (browserResult) return browserResult;
  } catch {
    // Một số trình duyệt khai báo Translator nhưng không hỗ trợ cặp ngôn ngữ; thử endpoint phía server.
  }

  const apiResult = await translateWithApi(options);
  if (apiResult) return apiResult;

  throw new Error(
    "Trình duyệt chưa hỗ trợ AI Translator. Hãy cấu hình VITE_TRANSLATION_API_URL tới API dịch phía server.",
  );
};
