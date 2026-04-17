import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initGA } from "./lib/analytics";
import { getEnv } from "./lib/env";
import { initAuthFromUrl } from "./lib/queryClient";

// GA 초기화
const measurementId = getEnv("VITE_GA_MEASUREMENT_ID");
if (measurementId) {
  initGA(measurementId);
}

initAuthFromUrl();

createRoot(document.getElementById("root")!).render(<App />);
