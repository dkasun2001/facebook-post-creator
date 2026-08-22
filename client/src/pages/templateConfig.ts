export type Template = "poll" | "breaking" | "quote" | "feature" | "signal" | "spotlight" | "frame" | "bulletin";

export const templateData: Array<{ id: Template; label: string; detail: string }> = [
  { id: "poll", label: "Poll panel", detail: "Reaction row + navy block" },
  { id: "breaking", label: "Breaking line", detail: "Red signal + headline" },
  { id: "quote", label: "Big question", detail: "Large quote framing" },
  { id: "feature", label: "Feature story", detail: "Quiet label + clean type" },
  { id: "signal", label: "Signal alert", detail: "Developing tab + red line" },
  { id: "spotlight", label: "Spotlight", detail: "Centered key-point card" },
  { id: "frame", label: "Photo frame", detail: "Clean border + photo focus" },
  { id: "bulletin", label: "Quick bulletin", detail: "Numbered lower-third" },
];
