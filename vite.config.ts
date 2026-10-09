import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function parseDevServerHost(value: string | undefined): string | boolean {
  const host = value?.trim();
  if (!host) return "localhost";
  if (host === "true") return true;
  if (host === "false") return false;
  return host;
}

function parseDevServerPort(value: string | undefined): number {
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : 3030;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (mode === "production") {
    const apiBaseUrl = env.VITE_API_BASE_URL?.trim();
    if (!apiBaseUrl) {
      throw new Error(
        "VITE_API_BASE_URL is required for production builds (e.g. https://api.example.com)."
      );
    }
    if (!apiBaseUrl.startsWith("https://")) {
      throw new Error(
        `VITE_API_BASE_URL must use HTTPS in production builds (got "${apiBaseUrl}"). Use an https:// origin, e.g. https://api.example.com.`
      );
    }
  }

  return {
    server: {
      host: parseDevServerHost(env.VITE_DEV_SERVER_HOST),
      port: parseDevServerPort(env.VITE_DEV_SERVER_PORT),
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
