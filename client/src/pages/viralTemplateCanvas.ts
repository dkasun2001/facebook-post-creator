import type { Template } from "./templateConfig";

export type ViralTemplateFields = {
  countdownNumber: string;
  countdownLabel: string;
  factcheckLabel: string;
  watchLabel: string;
  takeawayLabel: string;
};

type CanvasColors = {
  accent: string;
  headline: string;
  label: string;
  overlay: string;
};

type RendererArguments = {
  context: CanvasRenderingContext2D;
  template: Template;
  width: number;
  height: number;
  colors: CanvasColors;
  fields: ViralTemplateFields;
  toRgba: (value: string, alpha: number) => string;
  drawTemplateLabel: (value: string, background: string, foreground: string, baseline: number) => void;
};

const hasValue = (value: string) => value.trim().length > 0;

/** Draws the editable template-specific layer used by the live preview and PNG export. */
export function drawViralTemplateCanvas({ context, template, width, height, colors, fields, toRgba, drawTemplateLabel }: RendererArguments) {
  if (template === "countdown") {
    context.fillStyle = colors.accent;
    context.font = "700 132px Oswald, sans-serif";
    context.textAlign = "right";
    if (hasValue(fields.countdownNumber)) context.fillText(fields.countdownNumber.trim(), width - 64, height * 0.19);
    context.textAlign = "left";
    if (hasValue(fields.countdownLabel)) drawTemplateLabel(fields.countdownLabel, colors.label, colors.headline, height * 0.49);
  }

  if (template === "factcheck") {
    context.fillStyle = colors.label;
    context.fillRect(0, height * 0.44, 13, height * 0.46);
    if (hasValue(fields.factcheckLabel)) drawTemplateLabel(fields.factcheckLabel, colors.label, colors.headline, height * 0.49);
  }

  if (template === "watch") {
    if (hasValue(fields.watchLabel)) drawTemplateLabel(fields.watchLabel, colors.label, colors.headline, height * 0.49);
    context.fillStyle = colors.accent;
    context.beginPath();
    context.moveTo(width - 122, height * 0.47);
    context.lineTo(width - 122, height * 0.52);
    context.lineTo(width - 76, height * 0.495);
    context.closePath();
    context.fill();
  }

  if (template === "takeaway") {
    context.fillStyle = toRgba(colors.overlay, 0.82);
    context.fillRect(48, height * 0.45, width - 96, height * 0.38);
    context.fillStyle = colors.accent;
    context.fillRect(48, height * 0.45, width - 96, 6);
    if (hasValue(fields.takeawayLabel)) drawTemplateLabel(fields.takeawayLabel, colors.label, colors.headline, height * 0.515);
  }
}
