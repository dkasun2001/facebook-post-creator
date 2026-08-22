import { postColorSchemes, type PostColorScheme } from "./colorSchemes";
import { templateData, type Template } from "./templateConfig";

export const POST_PRESETS_STORAGE_KEY = "soori-post-studio-presets-v1";

export type PostPreset = {
  id: string;
  name: string;
  template: Template;
  colorScheme: PostColorScheme["id"];
};

const templates = new Set(templateData.map((item) => item.id));
const schemes = new Set(postColorSchemes.map((item) => item.id));

export function parsePostPresets(value: string | null): PostPreset[] {
  if (!value) return [];
  try {
    const raw = JSON.parse(value);
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item): PostPreset[] => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      if (typeof record.id !== "string" || !name || name.length > 40 || !templates.has(record.template as Template) || !schemes.has(record.colorScheme as PostColorScheme["id"])) return [];
      return [{ id: record.id, name, template: record.template as Template, colorScheme: record.colorScheme as PostColorScheme["id"] }];
    });
  } catch {
    return [];
  }
}
