/** @type {import('vite').UserConfig} */
import { dirname, resolve } from "node:path";

export default {
  base: "/ArchipelagoAlerts/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        alerts: resolve(__dirname, "alerts/index.html"),
      },
    },
  },
};
