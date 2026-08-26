import { createRoot } from "react-dom/client";
import App from "./App";
import { installBrandAssets } from "./lib/assetUrl";
import "./index.css";

installBrandAssets();

createRoot(document.getElementById("root")!).render(
  <App />
);
