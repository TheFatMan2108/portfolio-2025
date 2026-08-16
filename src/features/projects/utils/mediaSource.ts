import type { ProjectMediaType } from "../../../content/portfolio.types";

export type ResolvedProjectMediaType = Exclude<ProjectMediaType, "auto">;

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const VIDEO_FILE_PATTERN = /\.(mp4|webm|ogv|ogg|mov|m4v)$/i;
const YOUTUBE_HOSTS = new Set(["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"]);

const normalizeYouTubeId = (value: string | null | undefined): string | null => {
  const videoId = value?.trim() ?? "";
  return YOUTUBE_ID_PATTERN.test(videoId) ? videoId : null;
};

/** Lấy video ID từ các định dạng URL YouTube phổ biến mà không cho phép host tùy ý. */
export const getYouTubeVideoId = (source: string): string | null => {
  try {
    const url = new URL(source.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return normalizeYouTubeId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (!YOUTUBE_HOSTS.has(hostname)) return null;

    if (url.pathname === "/watch") return normalizeYouTubeId(url.searchParams.get("v"));

    const pathMatch = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/i);
    return normalizeYouTubeId(pathMatch?.[1]);
  } catch {
    return null;
  }
};

/** Tạo URL nhúng ở chế độ tăng cường quyền riêng tư của YouTube. */
export const getYouTubeEmbedUrl = (source: string): string => {
  const videoId = getYouTubeVideoId(source);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : "";
};

/** Tự nhận diện media; link YouTube được ưu tiên trước phần mở rộng tệp. */
export const resolveProjectMediaType = (requestedType: ProjectMediaType, source: string): ResolvedProjectMediaType => {
  const hasYouTubeVideo = getYouTubeVideoId(source) !== null;
  if (hasYouTubeVideo && requestedType !== "image") return "youtube";
  if (requestedType !== "auto") return requestedType;

  const normalizedSource = source.trim();
  if (/^data:video\//i.test(normalizedSource)) return "video";

  try {
    if (VIDEO_FILE_PATTERN.test(new URL(normalizedSource).pathname)) return "video";
  } catch {
    if (VIDEO_FILE_PATTERN.test(normalizedSource.split(/[?#]/, 1)[0] ?? "")) return "video";
  }

  return "image";
};
