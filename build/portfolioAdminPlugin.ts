import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const ADMIN_DATA_ENDPOINT = "/__portfolio-admin/portfolio-data";
const MAX_REQUEST_BYTES = 10 * 1024 * 1024;

interface PortfolioDataPayload {
  version: number;
  profile: unknown;
  languages: unknown[];
  localized: unknown;
  socials: unknown[];
  technologyTags: unknown[];
  projects: unknown[];
  footer: unknown;
  seo: unknown;
}

const sendJson = (response: ServerResponse, statusCode: number, payload: Record<string, unknown>): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
};

const isLoopbackAddress = (address: string | undefined): boolean =>
  address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";

const hasTrustedOrigin = (request: IncomingMessage): boolean => {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host && (originUrl.protocol === "http:" || originUrl.protocol === "https:");
  } catch {
    return false;
  }
};

const isPortfolioDataPayload = (value: unknown): value is PortfolioDataPayload => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Partial<PortfolioDataPayload>;

  return (
    typeof payload.version === "number" &&
    !!payload.profile &&
    typeof payload.profile === "object" &&
    Array.isArray(payload.languages) &&
    !!payload.localized &&
    typeof payload.localized === "object" &&
    Array.isArray(payload.socials) &&
    Array.isArray(payload.technologyTags) &&
    Array.isArray(payload.projects) &&
    !!payload.footer &&
    typeof payload.footer === "object" &&
    !!payload.seo &&
    typeof payload.seo === "object"
  );
};

const readRequestBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > MAX_REQUEST_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
};

/** Tạo API development-only để Admin local ghi dữ liệu Portfolio vào source JSON. */
export const createPortfolioAdminPlugin = (): Plugin => {
  const dataFilePath = resolve(process.cwd(), "src/content/portfolio-data.json");

  return {
    name: "portfolio-admin-data-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(ADMIN_DATA_ENDPOINT, async (request, response, next) => {
        if (request.method !== "PUT") {
          next();
          return;
        }

        if (!isLoopbackAddress(request.socket.remoteAddress) || !hasTrustedOrigin(request)) {
          sendJson(response, 403, { error: "Yêu cầu lưu dữ liệu không hợp lệ." });
          return;
        }

        if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
          sendJson(response, 415, { error: "Dữ liệu phải có định dạng JSON." });
          return;
        }

        try {
          const payload: unknown = JSON.parse(await readRequestBody(request));
          if (!isPortfolioDataPayload(payload)) {
            sendJson(response, 422, { error: "Dữ liệu Portfolio không đúng cấu trúc." });
            return;
          }

          await writeFile(dataFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
          sendJson(response, 200, { success: true });
        } catch (error) {
          const isPayloadTooLarge = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE";
          sendJson(response, isPayloadTooLarge ? 413 : 500, {
            error: isPayloadTooLarge
              ? "Dữ liệu vượt quá giới hạn 10 MB."
              : "Không thể ghi file src/content/portfolio-data.json.",
          });
        }
      });
    },
  };
};
