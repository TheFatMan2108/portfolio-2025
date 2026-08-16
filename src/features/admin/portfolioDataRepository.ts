import type { PortfolioData } from "../../content/portfolio.types";

const ADMIN_DATA_ENDPOINT = "/__portfolio-admin/portfolio-data";

interface SavePortfolioResponse {
  error?: string;
  success?: boolean;
}

/** Repository ghi dữ liệu Portfolio thông qua API chỉ tồn tại trên Vite development server. */
export const writePortfolioDataFile = async (data: PortfolioData): Promise<void> => {
  if (!import.meta.env.DEV) throw new Error("Chỉ có thể ghi dữ liệu khi chạy Admin local.");

  const response = await fetch(ADMIN_DATA_ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = (await response.json().catch(() => ({}))) as SavePortfolioResponse;
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Không thể ghi file src/content/portfolio-data.json.");
  }
};
