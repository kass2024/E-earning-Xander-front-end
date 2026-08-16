import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { applyBrandIcons } from "./lib/applyBrandIcons";
import { ensureFreshAppShell, startAppBuildWatcher } from "./lib/appBuildVersion";
import { migrateParrotSessionKeys } from "./lib/migrateSessionKeys";
import { HUB } from "@/lib/hubConfig";
import "./index.css";

migrateParrotSessionKeys();
ensureFreshAppShell();
startAppBuildWatcher();
applyBrandIcons();
document.title = `${HUB.name} – ${HUB.slogan}`;

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
