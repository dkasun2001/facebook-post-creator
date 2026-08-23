const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

/**
 * Resolves built-in artwork from a public asset host. On Manus it retains existing
 * paths; on Vercel set VITE_ASSET_BASE_URL to a Vercel Blob, S3, or CDN base URL.
 */
export function assetUrl(path: string, assetBase = import.meta.env.VITE_ASSET_BASE_URL ?? "") {
  const cleanPath = trimSlashes(path);
  const cleanBase = assetBase.trim().replace(/\/+$/, "");
  return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
}

export function installBrandAssets() {
  const fontUrl = assetUrl("manus-storage/AFSigiri_7ad71838.ttf");
  const fontStyle = document.createElement("style");
  fontStyle.dataset.dkAssetFont = "true";
  fontStyle.textContent = `@font-face{font-family:"AF Sigiri";src:url("${fontUrl}") format("truetype");font-style:normal;font-weight:400;font-display:swap;}`;
  document.head.append(fontStyle);

  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.href = assetUrl("manus-storage/soori-sunburst-mark_e75e01ee.png");
  if (!favicon.parentNode) document.head.append(favicon);
}
