import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: parseDevServerHost(env.VITE_DEV_SERVER_HOST),
      port: parseDevServerPort(env.VITE_DEV_SERVER_PORT),
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
