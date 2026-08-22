export type PostColorScheme = {
  id: "navy" | "ruby" | "teal" | "violet" | "forest";
  label: string;
  detail: string;
  ink: string;
  inkMid: string;
  accent: string;
  signal: string;
  text: string;
};

export const postColorSchemes: PostColorScheme[] = [
  { id: "navy", label: "Signal navy", detail: "Saffron + midnight", ink: "#091323", inkMid: "#243448", accent: "#F6C400", signal: "#E94750", text: "#FFFFFF" },
  { id: "ruby", label: "Ruby report", detail: "Coral + wine", ink: "#260A15", inkMid: "#542030", accent: "#FF7E98", signal: "#FF4E6A", text: "#FFF7F8" },
  { id: "teal", label: "Ocean pulse", detail: "Aqua + deep teal", ink: "#06262B", inkMid: "#16494F", accent: "#47E8C4", signal: "#E55F6F", text: "#F2FFFC" },
  { id: "violet", label: "Violet lens", detail: "Lilac + ink", ink: "#1B1030", inkMid: "#3B285B", accent: "#B99BFF", signal: "#ED6DA5", text: "#FBF8FF" },
  { id: "forest", label: "Forest brief", detail: "Lime + evergreen", ink: "#10251A", inkMid: "#2D5037", accent: "#C7F05A", signal: "#EF795F", text: "#F6FFE7" },
];

export function toRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
