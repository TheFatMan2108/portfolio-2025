const normalizedBaseUrl = import.meta.env.BASE_URL.replace(/\/+$/, "");

/** Trả về pathname nội bộ của ứng dụng sau khi bỏ deployment base path. */
export const getAppPath = (pathname: string): string => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (!normalizedBaseUrl) return normalizedPath;
  if (normalizedPath === normalizedBaseUrl) return "/";
  if (normalizedPath.startsWith(`${normalizedBaseUrl}/`)) {
    return normalizedPath.slice(normalizedBaseUrl.length) || "/";
  }
  return normalizedPath;
};

/** Thêm deployment base path vào một URL nội bộ của ứng dụng. */
export const withBasePath = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedBaseUrl) return normalizedPath;
  return normalizedPath === "/" ? `${normalizedBaseUrl}/` : `${normalizedBaseUrl}${normalizedPath}`;
};
