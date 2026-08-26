/**
 * Soori Post Studio — Editorial Control Room
 * A reference-led production rail uses concise numbered steps and a focused live post plate.
 */
import { ChangeEvent, CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Bookmark,
  BookmarkPlus,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  FileImage,
  ImagePlus,
  KeyRound,
  Languages,
  LayoutPanelTop,
  LoaderCircle,
  Palette,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { parse as parseFont } from "opentype.js";
import { toast } from "sonner";
import { templateData, type Template } from "./templateConfig";
import { hasPostText } from "./postMetadata";
import { postColorSchemes, toRgba, type PostColorScheme } from "./colorSchemes";
import { readGeminiApiKey, writeGeminiApiKey } from "./geminiKeyStorage";
import { buildRelevantImagePrompt } from "./imagePrompt";
import { parsePostPresets, POST_PRESETS_STORAGE_KEY, type PostPreset } from "./postPresets";
import { colorsFromScheme, elementColorControls, setElementColor, type PostElementColorKey, type PostElementColors } from "./postElementColors";
import { drawViralTemplateCanvas } from "./viralTemplateCanvas";
import { assetUrl } from "../lib/assetUrl";
import { requestGeminiHeadlines } from "../lib/geminiHeadlineApi";

type Language = "english" | "sinhala";
type Format = "square" | "portrait";
type CustomSinhalaFont = { family: string; name: string };

const generatedImages = [
  assetUrl("manus-storage/soori-morning-railway_b9770c94.jpg"),
  assetUrl("manus-storage/soori-tea-estate_2e11bbf7.jpg"),
];

const englishHeadlines = [
  "The country is asking: where do we go from here?",
  "Five questions behind a story still unfolding",
  "What this moment means for every household",
  "The detail everyone should be watching now",
];

const sinhalaHeadlines = [
  "මේ කතාව ගැන අපි ඇත්තටම දැනගත යුත්තේ මොනවාද?",
  "අද සිදුවීම පිටුපස ඇති වැදගත් ප්‍රශ්න පහක්",
  "මේ තීරණය ඔබේ දෛනික ජීවිතයට බලපාන්නේ කොහොමද?",
  "මේ මොහොතේ අවධානය යොමු කළ යුතු කරුණ මෙන්න",
];

function StepCard({
  number,
  title,
  detail,
  open,
  complete,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  detail: string;
  open: boolean;
  complete?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`step-card ${open ? "is-open" : ""} ${complete ? "is-complete" : ""}`}>
      <button type="button" className="step-trigger" onClick={onToggle} aria-expanded={open}>
        <span className="step-number">{complete ? <Check size={13} strokeWidth={3} /> : number}</span>
        <span className="step-copy">
          <strong>{title}</strong>
          <small>{detail}</small>
        </span>
        <ChevronDown className="chevron" size={16} />
      </button>
      <div className="step-content" aria-hidden={!open}>
        <div className="step-content-inner">{children}</div>
      </div>
    </section>
  );
}

function wrapCanvasText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function selectedYellowWords(value: string) {
  return value.split(/[;,\n]+/).map((word) => word.trim()).filter(Boolean);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitHeadlineForHighlight(headline: string, words: string[]) {
  if (!words.length) return [{ value: headline, highlighted: false }];
  const escapedWords = words.sort((a, b) => b.length - a.length).map(escapeRegex).join("|");
  const expression = new RegExp(`(?<![\\p{L}\\p{N}])(${escapedWords})(?![\\p{L}\\p{N}])`, "giu");
  return headline.split(expression).filter(Boolean).map((value) => ({
    value,
    highlighted: words.some((word) => word.toLocaleLowerCase() === value.toLocaleLowerCase()),
  }));
}

function wrapHighlightedCanvasText(context: CanvasRenderingContext2D, headline: string, words: string[], maxWidth: number) {
  const tokens = splitHeadlineForHighlight(headline, words).flatMap((segment) =>
    segment.value.split(/(\s+)/).filter(Boolean).map((value) => ({ value, highlighted: segment.highlighted })),
  );
  const lines: Array<Array<{ value: string; highlighted: boolean }>> = [];
  let line: Array<{ value: string; highlighted: boolean }> = [];
  let lineWidth = 0;

  tokens.forEach((token) => {
    const tokenWidth = context.measureText(token.value).width;
    if (line.length && !/^\s+$/.test(token.value) && lineWidth + tokenWidth > maxWidth) {
      lines.push(line);
      line = [];
      lineWidth = 0;
    }
    if (!line.length && /^\s+$/.test(token.value)) return;
    line.push(token);
    lineWidth += tokenWidth;
  });
  if (line.length) lines.push(line);
  return lines;
}

function supportsUnicodeSinhala(font: any) {
  const glyphCount = font?.glyphs?.length ?? 0;
  for (let index = 0; index < glyphCount; index += 1) {
    const glyph = font.glyphs.get(index);
    const codepoints = glyph?.unicodes ?? (typeof glyph?.unicode === "number" ? [glyph.unicode] : []);
    if (codepoints.some((codepoint: number) => codepoint >= 0x0d80 && codepoint <= 0x0dff)) return true;
  }
  return false;
}

export default function Home() {
  const [expanded, setExpanded] = useState("story");
  const [language, setLanguage] = useState<Language>("english");
  const [story, setStory] = useState("");
  const [headlines, setHeadlines] = useState(englishHeadlines);
  const [selectedHeadline, setSelectedHeadline] = useState(englishHeadlines[0]);
  const [selectedImage, setSelectedImage] = useState(generatedImages[0]);
  const [template, setTemplate] = useState<Template>("poll");
  const [colorScheme, setColorScheme] = useState<PostColorScheme["id"]>("navy");
  const [elementColors, setElementColors] = useState<PostElementColors>(() => colorsFromScheme(postColorSchemes[0]));
  const [hasCustomColors, setHasCustomColors] = useState(false);
  const [presets, setPresets] = useState<PostPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presetsReady, setPresetsReady] = useState(false);
  const [format, setFormat] = useState<Format>("square");
  const [badge, setBadge] = useState("POST BRIEF");
  const [pageName, setPageName] = useState("DK Daily");
  const [breakingLabel, setBreakingLabel] = useState("BREAKING NOTE");
  const [featureLabel, setFeatureLabel] = useState("FIELD NOTE · SRI LANKA");
  const [signalLabel, setSignalLabel] = useState("DEVELOPING STORY");
  const [spotlightLabel, setSpotlightLabel] = useState("THE KEY POINT");
  const [frameLabel, setFrameLabel] = useState("PHOTO ESSAY");
  const [bulletinNumber, setBulletinNumber] = useState("01");
  const [countdownNumber, setCountdownNumber] = useState("05");
  const [countdownLabel, setCountdownLabel] = useState("THINGS TO KNOW");
  const [factcheckLabel, setFactcheckLabel] = useState("FACT CHECK");
  const [watchLabel, setWatchLabel] = useState("WATCH NOW");
  const [takeawayLabel, setTakeawayLabel] = useState("WHY IT MATTERS");
  const [heartLabel, setHeartLabel] = useState("YES");
  const [thumbLabel, setThumbLabel] = useState("NO");
  const [contrast, setContrast] = useState(46);
  const [yellowWordsInput, setYellowWordsInput] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiKeyReady, setGeminiKeyReady] = useState(false);
  const [headlineModel, setHeadlineModel] = useState("");
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);
  const [generatingHeadlines, setGeneratingHeadlines] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [customSinhalaFont, setCustomSinhalaFont] = useState<CustomSinhalaFont | null>(null);
  const [fontLoading, setFontLoading] = useState(false);
  const [fontIssue, setFontIssue] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fontInput = useRef<HTMLInputElement>(null);

  const selectedTemplate = useMemo(
    () => templateData.find((item) => item.id === template) ?? templateData[0],
    [template],
  );
  const selectedColorScheme = useMemo(
    () => postColorSchemes.find((scheme) => scheme.id === colorScheme) ?? postColorSchemes[0],
    [colorScheme],
  );

  useEffect(() => {
    setPresets(parsePostPresets(window.localStorage.getItem(POST_PRESETS_STORAGE_KEY)));
    setPresetsReady(true);
    setGeminiApiKey(readGeminiApiKey(window.localStorage));
    setGeminiKeyReady(true);
  }, []);

  useEffect(() => {
    if (presetsReady) window.localStorage.setItem(POST_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [presets, presetsReady]);

  useEffect(() => {
    if (geminiKeyReady) writeGeminiApiKey(window.localStorage, geminiApiKey);
  }, [geminiApiKey, geminiKeyReady]);

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    const options = next === "sinhala" ? sinhalaHeadlines : englishHeadlines;
    setHeadlines(options);
    setSelectedHeadline(options[0]);
  };

  const generateHeadlines = async () => {
    if (story.trim().length < 12) {
      toast.error("Add a little more news detail before generating headlines.");
      return;
    }
    if (!geminiApiKey.trim()) {
      toast.error("Add your Gemini API key to generate AI headlines.");
      return;
    }
    setGeneratingHeadlines(true);
    try {
      const generated = await requestGeminiHeadlines({ apiKey: geminiApiKey.trim(), story, language, model: headlineModel.trim() || undefined });
      setHeadlines(generated);
      setSelectedHeadline(generated[0]);
      setExpanded("headline");
      toast.success("Gemini created four SEO-focused headline angles.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gemini could not generate headlines.");
    } finally {
      setGeneratingHeadlines(false);
    }
  };

  const clearGeminiApiKey = () => {
    setGeminiApiKey("");
    setShowGeminiApiKey(false);
    toast.message("Gemini key removed from this browser.");
  };

  const copyPrompt = async () => {
    const prompt = `Read this ${language === "sinhala" ? "Sinhala" : "English"} news story and write four concise Facebook-image headlines. Keep them factual, high-contrast, and under 12 words. STORY: ${story || "[Paste your news description here]"}`;
    await navigator.clipboard.writeText(prompt);
    toast.success("Writing prompt copied to your clipboard.");
  };

  const copyImagePrompt = async () => {
    const prompt = buildRelevantImagePrompt({ story, headline: selectedHeadline, language, format });
    await navigator.clipboard.writeText(prompt);
    toast.success("Relevant AI image prompt copied to your clipboard.");
  };

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (!chosen) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(String(reader.result));
      setExpanded("visual");
      toast.success(`${chosen.name} is now on the post canvas.`);
    };
    reader.readAsDataURL(chosen);
  };

  const uploadSinhalaFont = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (!chosen) return;

    const extension = chosen.name.split(".").pop()?.toLowerCase();
    if (!extension || !["ttf", "otf", "woff", "woff2"].includes(extension)) {
      toast.error("Choose a TTF, OTF, WOFF, or WOFF2 font file.");
      event.target.value = "";
      return;
    }

    if (chosen.size > 15 * 1024 * 1024) {
      toast.error("Please choose a font file smaller than 15 MB.");
      event.target.value = "";
      return;
    }

    const family = `SooriSinhala${Date.now()}`;
    setFontLoading(true);
    try {
      const fontBuffer = await chosen.arrayBuffer();
      let fontName = chosen.name.replace(/\.[^/.]+$/, "");
      let unicodeCheckPassed = true;

      if (extension !== "woff2") {
        try {
          const parsedFont = parseFont(fontBuffer.slice(0));
          fontName = parsedFont?.names?.fontFamily?.en ?? parsedFont?.names?.fullName?.en ?? fontName;
          unicodeCheckPassed = supportsUnicodeSinhala(parsedFont);
        } catch {
          // The browser remains the final authority for successfully loading uncommon but valid font files.
        }
      }

      if (!unicodeCheckPassed) {
        const message = `${fontName} is a legacy non-Unicode Sinhala font. It cannot render the Unicode Sinhala text used by this studio. Use a Unicode Sinhala font instead.`;
        setFontIssue(message);
        toast.error("This legacy font cannot render Unicode Sinhala text.");
        return;
      }

      const fontFace = new FontFace(family, fontBuffer, { style: "normal", weight: "400" });
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      setCustomSinhalaFont({ family, name: fontName });
      setFontIssue(null);
      toast.success(`${fontName} is ready for Sinhala headlines.`);
    } catch {
      toast.error("That font could not be loaded. Try a web-ready Sinhala font file.");
    } finally {
      setFontLoading(false);
      event.target.value = "";
    }
  };

  const resetSinhalaFont = () => {
    setCustomSinhalaFont(null);
    setFontIssue(null);
    toast.message("Reverted to the built-in AF Sigiri font.");
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return toast.error("Give this preset a short name first.");
    if (name.length > 40) return toast.error("Keep preset names under 40 characters.");
    if (presets.some((preset) => preset.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return toast.error("A preset with that name already exists.");
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `preset-${Date.now()}`;
    setPresets((current) => [...current, { id, name, template, colorScheme }]);
    setPresetName("");
    toast.success(`Saved ${name} to this device.`);
  };

  const applyPreset = (preset: PostPreset) => {
    const presetScheme = postColorSchemes.find((scheme) => scheme.id === preset.colorScheme) ?? postColorSchemes[0];
    setTemplate(preset.template);
    setColorScheme(preset.colorScheme);
    setElementColors(colorsFromScheme(presetScheme));
    setHasCustomColors(false);
    setExpanded("template");
    toast.success(`Applied ${preset.name}.`);
  };

  const removePreset = (id: string) => {
    setPresets((current) => current.filter((preset) => preset.id !== id));
    toast.message("Preset removed from this device.");
  };

  const selectColorScheme = (scheme: PostColorScheme) => {
    setColorScheme(scheme.id);
    setElementColors(colorsFromScheme(scheme));
    setHasCustomColors(false);
  };

  const changeElementColor = (key: PostElementColorKey, value: string) => {
    setElementColors((current) => setElementColor(current, key, value));
    setHasCustomColors(true);
  };

  const resetElementColors = () => {
    setElementColors(colorsFromScheme(selectedColorScheme));
    setHasCustomColors(false);
    toast.message("Element colors reset to the selected scheme.");
  };

  const startFresh = () => {
    setStory("");
    setHeadlines(language === "sinhala" ? sinhalaHeadlines : englishHeadlines);
    setSelectedHeadline(language === "sinhala" ? sinhalaHeadlines[0] : englishHeadlines[0]);
    setSelectedImage(generatedImages[0]);
    setTemplate("poll");
    setColorScheme("navy");
    setElementColors(colorsFromScheme(postColorSchemes[0]));
    setHasCustomColors(false);
    setFormat("square");
    setExpanded("story");
    toast.message("Fresh board, same bright point of view.");
  };

  const downloadPost = async () => {
    setExporting(true);
    const [width, height] = format === "square" ? [1080, 1080] : [1080, 1350];
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    const palette = selectedColorScheme;
    const colors = elementColors;
    context.fillStyle = colors.overlay;
    context.fillRect(0, 0, width, height);
    try {
      const source = new Image();
      source.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve();
        source.onerror = () => reject(new Error("Image could not be read"));
        source.src = selectedImage;
      });
      const crop = Math.max(width / source.width, (height * 0.56) / source.height);
      const drawWidth = source.width * crop;
      const drawHeight = source.height * crop;
      context.drawImage(source, (width - drawWidth) / 2, 0, drawWidth, drawHeight);
    } catch {
      const imageGradient = context.createLinearGradient(0, 0, 0, height * 0.55);
      imageGradient.addColorStop(0, palette.inkMid);
      imageGradient.addColorStop(1, colors.overlay);
      context.fillStyle = imageGradient;
      context.fillRect(0, 0, width, height * 0.56);
    }
    const shade = context.createLinearGradient(0, height * 0.3, 0, height * 0.72);
    shade.addColorStop(0, toRgba(colors.overlay, 0));
    shade.addColorStop(0.58, toRgba(colors.overlay, 0.48));
    shade.addColorStop(1, colors.overlay);
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);
    await document.fonts.ready;
    const isSinhalaHeadline = language === "sinhala";
    if (isSinhalaHeadline) await document.fonts.load('400 72px "AF Sigiri"');
    const headlineSize = isSinhalaHeadline ? format === "square" ? 72 : 78 : format === "square" ? 65 : 72;
    const lineHeight = isSinhalaHeadline ? format === "square" ? 85 : 92 : 74;
    const drawTemplateLabel = (value: string, background: string, foreground: string, baseline: number) => {
      const label = value.trim().toUpperCase();
      if (!label) return;
      context.font = "700 19px DM Sans, sans-serif";
      const labelWidth = context.measureText(label).width;
      context.fillStyle = background;
      context.fillRect(72, baseline - 31, labelWidth + 32, 42);
      context.fillStyle = foreground;
      context.fillText(label, 88, baseline - 3);
    };
    if (template === "quote") {
      context.fillStyle = colors.accent;
      context.font = "700 156px Georgia, serif";
      context.fillText("“", 70, height * 0.3);
    }
    if (template === "spotlight") {
      context.fillStyle = toRgba(colors.overlay, 0.84);
      context.fillRect(48, height * 0.46, width - 96, height * 0.36);
      context.strokeStyle = colors.accent;
      context.lineWidth = 3;
      context.strokeRect(48, height * 0.46, width - 96, height * 0.36);
      if (hasPostText(spotlightLabel)) drawTemplateLabel(spotlightLabel, colors.label, colors.overlay, height * 0.515);
    }
    if (template === "frame") {
      context.strokeStyle = toRgba(colors.accent, 0.88);
      context.lineWidth = 8;
      context.strokeRect(26, 26, width - 52, height - 52);
      if (hasPostText(frameLabel)) drawTemplateLabel(frameLabel, colors.label, colors.headline, height * 0.49);
    }
    if (template === "bulletin") {
      context.fillStyle = toRgba(colors.accent, 0.96);
      context.fillRect(0, height * 0.72, width, height * 0.28);
      context.fillStyle = colors.overlay;
      context.font = "700 46px Oswald, sans-serif";
      if (hasPostText(bulletinNumber)) context.fillText(bulletinNumber.trim(), 72, height * 0.79);
    }
    drawViralTemplateCanvas({
      context,
      template,
      width,
      height,
      colors,
      fields: { countdownNumber, countdownLabel, factcheckLabel, watchLabel, takeawayLabel },
      toRgba,
      drawTemplateLabel,
    });
    if (template === "breaking" && hasPostText(breakingLabel)) drawTemplateLabel(breakingLabel, colors.label, colors.headline, height * 0.489);
    if (template === "feature" && hasPostText(featureLabel)) drawTemplateLabel(featureLabel, colors.label, colors.overlay, height * 0.489);
    if (template === "signal") {
      if (hasPostText(signalLabel)) drawTemplateLabel(signalLabel, colors.label, colors.headline, height * 0.489);
    }
    context.fillStyle = colors.accent;
    context.fillRect(72, height * 0.55, 86, 9);
    const sinhalaHeadlineFamily = customSinhalaFont ? `"${customSinhalaFont.family}", "AF Sigiri", "Abhaya Libre", "Noto Sans Sinhala", serif` : '"AF Sigiri", "Abhaya Libre", "Noto Sans Sinhala", serif';
    context.font = isSinhalaHeadline ? `400 ${headlineSize}px ${sinhalaHeadlineFamily}` : `700 ${headlineSize}px Oswald, sans-serif`;
    context.textAlign = "left";
    const exportHeadline = isSinhalaHeadline ? selectedHeadline : selectedHeadline.toUpperCase();
    const yellowWords = selectedYellowWords(yellowWordsInput);
    const lines = wrapHighlightedCanvasText(context, exportHeadline, yellowWords, width - 144).slice(0, 5);
    lines.forEach((line, lineIndex) => {
      let x = 72;
      line.forEach((token) => {
        context.fillStyle = token.highlighted ? colors.highlight : colors.headline;
        context.fillText(token.value, x, height * 0.63 + lineIndex * lineHeight);
        x += context.measureText(token.value).width;
      });
    });
    if (hasPostText(badge) || hasPostText(pageName)) {
      context.strokeStyle = colors.accent;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(72, height - 148);
      context.lineTo(width - 72, height - 148);
      context.stroke();
      context.font = "700 28px DM Sans, sans-serif";
      if (hasPostText(badge)) {
        context.fillStyle = colors.badge;
        context.fillText(badge.trim().toUpperCase(), 72, height - 94);
      }
      if (hasPostText(pageName)) {
        context.fillStyle = colors.page;
        context.textAlign = "right";
        context.fillText(pageName.trim().toUpperCase(), width - 72, height - 94);
        context.textAlign = "left";
      }
    }
    if (template === "poll" && (hasPostText(heartLabel) || hasPostText(thumbLabel))) {
      const reactionY = height - 46;
      context.font = "700 23px Oswald, sans-serif";
      let reactionX = 72;
      if (hasPostText(heartLabel)) {
        context.fillStyle = colors.heart;
        context.beginPath();
        context.arc(reactionX + 10, reactionY - 8, 11, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = colors.headline;
        context.font = "700 16px Arial, sans-serif";
        context.fillText("♥", reactionX + 4.6, reactionY - 2.5);
        context.font = "700 23px Oswald, sans-serif";
        context.fillText(heartLabel.trim().toUpperCase(), reactionX + 29, reactionY);
        reactionX += 29 + context.measureText(heartLabel.trim().toUpperCase()).width + 26;
      }
      if (hasPostText(thumbLabel)) {
        context.strokeStyle = toRgba(colors.headline, 0.42);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(reactionX - 14, reactionY - 24);
        context.lineTo(reactionX - 14, reactionY + 2);
        context.stroke();
        context.fillStyle = colors.thumb;
        context.beginPath();
        context.arc(reactionX + 10, reactionY - 8, 11, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = colors.headline;
        context.font = "700 13px Arial, sans-serif";
        context.fillText("●", reactionX + 6.2, reactionY - 3.4);
        context.font = "700 23px Oswald, sans-serif";
        context.fillText(thumbLabel.trim().toUpperCase(), reactionX + 29, reactionY);
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `soori-${format}-post.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      setExporting(false);
      toast.success("Your PNG composition is downloading.");
    }, "image/png");
  };

  return (
    <div className="studio-shell">
      <header className="studio-header">
        <div className="brand-lockup">
          <img src={assetUrl("manus-storage/soori-sunburst-mark_e75e01ee.png")} alt="DK Post Studio sunburst logo" className="brand-mark" />
          <div>
            <p className="brand-name">DK <span>POST STUDIO</span></p>
            <p className="brand-tagline">News brief → headline → visual → Facebook post</p>
          </div>
        </div>
        <div className="header-tools">
          <button className="quiet-button" type="button" onClick={() => toast.message("Build the post from left to right; every choice updates the preview.")}>
            <CircleHelp size={15} /> How it works
          </button>
          <button className="new-post-button" type="button" onClick={startFresh}>
            <RotateCcw size={14} /> New post
          </button>
        </div>
      </header>

      <main className="studio-main">
        <section className="workbench" aria-label="Facebook post editor">
          <div className="workbench-intro">
            <div>
              <p className="eyebrow"><Sparkles size={13} /> Bilingual post desk</p>
              <h1>Make the story <em>stop the scroll.</em></h1>
            </div>
            <div className="language-switch" aria-label="Headline language">
              <button className={language === "english" ? "active" : ""} type="button" onClick={() => changeLanguage("english")}>English</button>
              <button className={language === "sinhala" ? "active" : ""} type="button" onClick={() => changeLanguage("sinhala")}>සිංහල</button>
            </div>
          </div>

          <StepCard number={1} title="News description" detail={story ? "Brief captured locally" : "Paste the story"} open={expanded === "story"} complete={Boolean(story)} onToggle={() => setExpanded(expanded === "story" ? "" : "story")}>
            <div className="field-heading"><label htmlFor="story">What happened?</label><span>{story.length}/650</span></div>
            <textarea id="story" className="story-area" value={story} maxLength={650} onChange={(event) => setStory(event.target.value)} placeholder={language === "sinhala" ? "කෙටියෙන් කතාව ලියන්න. සිංහල හෝ ඉංග්‍රීසි ඕනෑම භාෂාවක් භාවිතා කළ හැක." : "Paste the news text. Sinhala or English both work — the headlines stay in your chosen language."} />
            <div className={`gemini-panel ${geminiApiKey ? "is-ready" : ""}`}>
              <div className="gemini-heading"><div><KeyRound size={16} /><span><strong>Gemini AI connection</strong><small>{geminiApiKey ? "Key saved in this browser" : "Add your own Google Gemini API key"}</small></span></div><a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a key</a></div>
              <label className="gemini-key-label" htmlFor="gemini-api-key">Google Gemini API key</label>
              <div className="gemini-key-input"><input id="gemini-api-key" className="text-input" type={showGeminiApiKey ? "text" : "password"} autoComplete="off" value={geminiApiKey} onChange={(event) => setGeminiApiKey(event.target.value)} placeholder="AIza…" /><button type="button" aria-label={showGeminiApiKey ? "Hide API key" : "Show API key"} onClick={() => setShowGeminiApiKey((visible) => !visible)}>{showGeminiApiKey ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
              <div className="gemini-model-grid single">
                <label>Headline model<input className="text-input" value={headlineModel} onChange={(event) => setHeadlineModel(event.target.value)} placeholder="gemini-3.7-flash (default)" spellCheck={false} /></label>
              </div>
              <p className="gemini-model-help">Type any supported <code>gemini-…</code> headline model ID. Leave it blank to use the studio default and its safe fallback.</p>
              <p><KeyRound size={12} /> Your key is saved only in this browser. It is sent to the server only for headline requests and is never stored in this post or the project database.</p>
              {geminiApiKey && <button className="text-action gemini-key-remove" type="button" onClick={clearGeminiApiKey}>Remove key from this browser</button>}
            </div>
            <div className="story-actions">
              <button className="signal-button" type="button" onClick={generateHeadlines} disabled={generatingHeadlines}>{generatingHeadlines ? <LoaderCircle className="spin" size={16} /> : <WandSparkles size={16} />}{generatingHeadlines ? "Gemini is writing…" : "Generate 4 headlines"}</button>
              <button className="outline-button" type="button" onClick={() => setExpanded("headline")}>I’ll write my own <ChevronDown size={14} /></button>
            </div>
            <div className="copy-assist">
              <div className="assist-heading"><span><Plus size={13} /> Or write it in any chat</span><b>FREE, NO KEY</b></div>
              <p>Copy a compact editorial prompt for the writing assistant you already use, then paste the four options back here.</p>
              <button type="button" className="text-action" onClick={copyPrompt}><Copy size={13} /> Copy headline prompt</button>
            </div>
          </StepCard>

          <StepCard number={2} title="Pick a headline" detail={selectedHeadline ? `${selectedHeadline.slice(0, 48)}${selectedHeadline.length > 48 ? "…" : ""}` : "Choose an angle"} open={expanded === "headline"} complete={Boolean(selectedHeadline)} onToggle={() => setExpanded(expanded === "headline" ? "" : "headline")}>
            <p className="section-lead">Choose the strongest angle, or reshape it in the line below.</p>
            <div className="headline-list">
              {headlines.map((item, index) => (
                <button key={`${item}-${index}`} type="button" className={`headline-option ${selectedHeadline === item ? "selected" : ""}`} onClick={() => { setSelectedHeadline(item); setExpanded("visual"); }}>
                  <span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{selectedHeadline === item && <Check size={16} />}
                </button>
              ))}
            </div>
            <label className="inline-label" htmlFor="custom-headline">Or edit the chosen headline</label>
            <input id="custom-headline" className="text-input" value={selectedHeadline} onChange={(event) => setSelectedHeadline(event.target.value)} />
            <div className="field-heading"><label htmlFor="yellow-words">Words in yellow</label><span>Separate terms with commas</span></div>
            <input id="yellow-words" className="text-input" value={yellowWordsInput} onChange={(event) => setYellowWordsInput(event.target.value)} placeholder="e.g. life, five questions" />
            <div className={`font-upload-panel ${customSinhalaFont ? "is-ready" : ""}`}>
              <div className="font-upload-heading">
                <div><Type size={16} /><span><strong>Sinhala headline font</strong><small>{customSinhalaFont ? `${customSinhalaFont.name} is active` : "AF Sigiri is active by default"}</small></span></div>
                {customSinhalaFont && <button type="button" className="font-reset" onClick={resetSinhalaFont}><X size={13} /> Use built-in</button>}
              </div>
              <div className="font-upload-actions">
                <button type="button" className="outline-button" onClick={() => fontInput.current?.click()} disabled={fontLoading}>{fontLoading ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}{fontLoading ? "Loading font…" : "Upload Sinhala font"}</button>
                <p>TTF, OTF, WOFF, or WOFF2 · must support Unicode Sinhala · applies in this browser session.</p>
              </div>
              {fontIssue && <p className="font-warning" role="alert">{fontIssue}</p>}
              <input ref={fontInput} type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" hidden onChange={uploadSinhalaFont} />
            </div>
          </StepCard>

          <StepCard number={3} title="The picture" detail={selectedImage.startsWith("data") ? "Your uploaded image" : "Editorial photo selected"} open={expanded === "visual"} complete={Boolean(selectedImage)} onToggle={() => setExpanded(expanded === "visual" ? "" : "visual")}>
            <p className="section-lead">Lead with an image that has enough quiet space for the headline to breathe.</p>
            <div className="visual-source-grid">
              {generatedImages.map((image, index) => (
                <button type="button" key={image} className={`image-choice ${selectedImage === image ? "selected" : ""}`} onClick={() => setSelectedImage(image)}>
                  <img src={image} alt={index === 0 ? "Rainy city visual" : "Tea estate visual"} />
                  <span>{index === 0 ? "City story" : "Island feature"}</span>
                </button>
              ))}
              <button type="button" className="upload-choice" onClick={() => fileInput.current?.click()}>
                <Upload size={19} /><span>Upload<br />your own</span>
              </button>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={uploadImage} />
            </div>
            <div className="drop-strip" onClick={() => fileInput.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") fileInput.current?.click(); }}>
              <ImagePlus size={18} /><span><strong>Drop a picture here</strong><small>JPG, PNG, WEBP — crop stays live in the preview</small></span>
            </div>
            <div className="image-prompt-panel"><div><Sparkles size={16} /><span><strong>Need an AI-generated image?</strong><small>Copy a relevant, text-free editorial prompt for your preferred AI image tool.</small></span></div><button className="outline-button" type="button" onClick={copyImagePrompt}><Copy size={15} /> Copy AI image prompt</button></div>
            <div className="range-row"><span>Headline shade</span><input aria-label="Headline contrast shade" type="range" min="25" max="80" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} /></div>
          </StepCard>

          <StepCard number={4} title="Template" detail={selectedTemplate.label} open={expanded === "template"} complete onToggle={() => setExpanded(expanded === "template" ? "" : "template")}>
            <div className="template-grid">
              {templateData.map((item, index) => (
                <button key={item.id} type="button" className={`template-choice ${template === item.id ? "selected" : ""}`} onClick={() => setTemplate(item.id)}>
                  <span className={`mini-template mini-${item.id}`}><i></i><b>{index + 1}</b></span>
                  <strong>{item.label}</strong><small>{item.detail}</small>
                </button>
              ))}
            </div>
            <div className="color-scheme-panel">
              <p className="color-scheme-title"><Palette size={14} /> Post color scheme <span>Changes artwork accents and export</span></p>
              <div className="color-scheme-grid">
                {postColorSchemes.map((scheme) => <button type="button" key={scheme.id} className={`color-scheme-choice ${colorScheme === scheme.id ? "selected" : ""}`} onClick={() => selectColorScheme(scheme)}>
                  <span className="scheme-swatch" style={{ background: `linear-gradient(135deg, ${scheme.ink} 0 52%, ${scheme.accent} 52% 78%, ${scheme.signal} 78% 100%)` }}></span>
                  <span><strong>{scheme.label}</strong><small>{scheme.detail}</small></span>
                </button>)}
              </div>
            </div>
            <div className="element-color-panel">
              <div className="element-color-heading"><p><SlidersHorizontal size={14} /> Element colors <span>{hasCustomColors ? "Custom overrides active" : "Using selected scheme"}</span></p><button type="button" className="text-action" onClick={resetElementColors}>Reset to scheme</button></div>
              <div className="element-color-grid">
                {elementColorControls.map((control) => <label className="element-color-control" key={control.key}>
                  <span><i style={{ backgroundColor: elementColors[control.key] }}></i><strong>{control.label}</strong><small>{control.detail}</small></span>
                  <input type="color" aria-label={`Choose ${control.label} color`} value={elementColors[control.key]} onChange={(event) => changeElementColor(control.key, event.target.value)} />
                  <code>{elementColors[control.key].toUpperCase()}</code>
                </label>)}
              </div>
            </div>
            <div className="preset-panel">
              <p className="preset-title"><Bookmark size={14} /> Your saved presets <span>Stored only on this device</span></p>
              <div className="preset-save-row"><input className="text-input" value={presetName} onChange={(event) => setPresetName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") savePreset(); }} placeholder="Name this template + color pair" maxLength={40} /><button className="outline-button" type="button" onClick={savePreset}><BookmarkPlus size={14} /> Save current</button></div>
              {presets.length > 0 ? <div className="preset-list">{presets.map((preset) => {
                const scheme = postColorSchemes.find((item) => item.id === preset.colorScheme) ?? postColorSchemes[0];
                const presetTemplate = templateData.find((item) => item.id === preset.template) ?? templateData[0];
                return <div className="preset-item" key={preset.id}><button type="button" className="preset-apply" onClick={() => applyPreset(preset)}><i style={{ background: `linear-gradient(135deg, ${scheme.ink} 0 55%, ${scheme.accent} 55% 100%)` }}></i><span><strong>{preset.name}</strong><small>{presetTemplate.label} · {scheme.label}</small></span></button><button type="button" className="preset-remove" aria-label={`Remove ${preset.name}`} onClick={() => removePreset(preset.id)}><Trash2 size={14} /></button></div>;
              })}</div> : <p className="preset-empty">Save the current template and color combination to reuse it later.</p>}
            </div>
            <div className="metadata-grid">
              <label>Badge / kicker<input className="text-input" value={badge} onChange={(event) => setBadge(event.target.value)} placeholder="Leave blank to hide" /></label>
              <label>Page name<input className="text-input" value={pageName} onChange={(event) => setPageName(event.target.value)} placeholder="Leave blank to hide" /></label>
            </div>
            <div className="template-controls">
              <p className="template-controls-title">Editable template items <span>Leave any field blank to hide it</span></p>
              {template === "poll" && <div className="metadata-grid"><label>Heart label<input className="text-input" value={heartLabel} onChange={(event) => setHeartLabel(event.target.value)} placeholder="Leave blank to hide" /></label><label>Thumb label<input className="text-input" value={thumbLabel} onChange={(event) => setThumbLabel(event.target.value)} placeholder="Leave blank to hide" /></label></div>}
              {template === "breaking" && <label className="template-control-field">Breaking label<input className="text-input" value={breakingLabel} onChange={(event) => setBreakingLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "feature" && <label className="template-control-field">Feature label<input className="text-input" value={featureLabel} onChange={(event) => setFeatureLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "signal" && <label className="template-control-field">Signal label<input className="text-input" value={signalLabel} onChange={(event) => setSignalLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "spotlight" && <label className="template-control-field">Spotlight label<input className="text-input" value={spotlightLabel} onChange={(event) => setSpotlightLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "frame" && <label className="template-control-field">Frame label<input className="text-input" value={frameLabel} onChange={(event) => setFrameLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "bulletin" && <label className="template-control-field">Bulletin number<input className="text-input" value={bulletinNumber} onChange={(event) => setBulletinNumber(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "countdown" && <div className="metadata-grid"><label>Countdown number<input className="text-input" value={countdownNumber} onChange={(event) => setCountdownNumber(event.target.value)} placeholder="Leave blank to hide" /></label><label>Countdown label<input className="text-input" value={countdownLabel} onChange={(event) => setCountdownLabel(event.target.value)} placeholder="Leave blank to hide" /></label></div>}
              {template === "factcheck" && <label className="template-control-field">Fact-check label<input className="text-input" value={factcheckLabel} onChange={(event) => setFactcheckLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "watch" && <label className="template-control-field">Watch label<input className="text-input" value={watchLabel} onChange={(event) => setWatchLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
              {template === "takeaway" && <label className="template-control-field">Takeaway label<input className="text-input" value={takeawayLabel} onChange={(event) => setTakeawayLabel(event.target.value)} placeholder="Leave blank to hide" /></label>}
            </div>
          </StepCard>

          <StepCard number={5} title="Size & export" detail={format === "square" ? "1:1 feed format" : "4:5 portrait format"} open={expanded === "export"} complete onToggle={() => setExpanded(expanded === "export" ? "" : "export")}>
            <div className="format-grid">
              <button type="button" className={`format-choice ${format === "square" ? "selected" : ""}`} onClick={() => setFormat("square")}><span className="format-icon square"></span><span><strong>1:1 square</strong><small>1080 × 1080 · Facebook feed</small></span></button>
              <button type="button" className={`format-choice ${format === "portrait" ? "selected" : ""}`} onClick={() => setFormat("portrait")}><span className="format-icon portrait"></span><span><strong>4:5 portrait</strong><small>1080 × 1350 · more feed space</small></span></button>
            </div>
            <button className="signal-button full-width" type="button" onClick={downloadPost} disabled={exporting}>{exporting ? <LoaderCircle className="spin" size={16} /> : <ArrowDownToLine size={16} />}{exporting ? "Preparing PNG…" : "Download post as PNG"}</button>
          </StepCard>
        </section>

        <aside className="preview-column" aria-label="Live Facebook post preview">
          <div className="preview-topline"><span>LIVE PREVIEW</span><span className="preview-status"><i></i> SAVED LOCALLY</span></div>
          <div className="preview-stage">
            <div className={`post-art ${format === "portrait" ? "portrait" : "square"} template-${template} scheme-${colorScheme}`} style={{ "--post-ink": elementColors.overlay, "--post-accent": elementColors.accent, "--post-signal": elementColors.label, "--post-text": elementColors.headline, "--post-highlight": elementColors.highlight, "--post-badge": elementColors.badge, "--post-page": elementColors.page, "--post-heart": elementColors.heart, "--post-thumb": elementColors.thumb } as CSSProperties}>
              <div className="post-photo" style={{ backgroundImage: `linear-gradient(to bottom, ${toRgba(elementColors.overlay, 0)} 20%, ${toRgba(elementColors.overlay, contrast / 100)} 66%, ${elementColors.overlay} 88%), url(${selectedImage})` }}></div>
              <div className="post-grain"></div>
              <div className="post-content">
                {template === "breaking" && hasPostText(breakingLabel) && <span className="breaking-label">{breakingLabel}</span>}
                {template === "quote" && <span className="quote-mark">“</span>}
                {template === "feature" && hasPostText(featureLabel) && <span className="feature-label">{featureLabel}</span>}
                {template === "signal" && hasPostText(signalLabel) && <span className="signal-label">{signalLabel}</span>}
                {template === "spotlight" && hasPostText(spotlightLabel) && <span className="spotlight-label">{spotlightLabel}</span>}
                {template === "bulletin" && hasPostText(bulletinNumber) && <span className="bulletin-number">{bulletinNumber}</span>}
                {template === "frame" && hasPostText(frameLabel) && <span className="frame-label">{frameLabel}</span>}
                {template === "countdown" && hasPostText(countdownNumber) && <span className="countdown-number">{countdownNumber}</span>}
                {template === "countdown" && hasPostText(countdownLabel) && <span className="countdown-label">{countdownLabel}</span>}
                {template === "factcheck" && hasPostText(factcheckLabel) && <span className="factcheck-label">{factcheckLabel}</span>}
                {template === "watch" && hasPostText(watchLabel) && <span className="watch-label">{watchLabel}</span>}
                {template === "takeaway" && hasPostText(takeawayLabel) && <span className="takeaway-label">{takeawayLabel}</span>}
                <div className="headline-rule"></div>
                <h2 className={language === "sinhala" ? "sinhala-headline" : ""} style={language === "sinhala" && customSinhalaFont ? { fontFamily: `"${customSinhalaFont.family}", "AF Sigiri", "Abhaya Libre", "Noto Sans Sinhala", serif`, fontWeight: 400, letterSpacing: "-0.02em" } : undefined}>{splitHeadlineForHighlight(selectedHeadline || "Your headline goes here", selectedYellowWords(yellowWordsInput)).map((segment, index) => <span className={segment.highlighted ? "headline-yellow" : undefined} key={`${segment.value}-${index}`}>{segment.value}</span>)}</h2>
                {(hasPostText(badge) || hasPostText(pageName)) && <div className="post-bottom">
                  {hasPostText(badge) && <span className="post-badge">{badge}</span>}
                  {hasPostText(pageName) && <span className="post-page">{pageName}</span>}
                </div>}
                {template === "poll" && (hasPostText(heartLabel) || hasPostText(thumbLabel)) && <div className="reaction-row">{hasPostText(heartLabel) && <><span className="react yes">♥</span><b>{heartLabel}</b></>}{hasPostText(heartLabel) && hasPostText(thumbLabel) && <i></i>}{hasPostText(thumbLabel) && <><span className="react no">●</span><b>{thumbLabel}</b></>}</div>}
              </div>
            </div>
          </div>
          <div className="preview-actions">
            <button className="signal-button" type="button" onClick={downloadPost}><FileImage size={16} /> Download PNG</button>
            <button className="outline-button" type="button" onClick={() => toast.message("JPG export is coming next. PNG gives the sharpest headline edges.")}><LayoutPanelTop size={15} /> JPG</button>
          </div>
          <p className="preview-note">{selectedTemplate.label} · {format === "square" ? "1:1 exports at 2160 × 2160 px" : "4:5 exports at 2160 × 2700 px"}</p>
          <div className="tip-card"><Languages size={17} /><p><strong>Type in either script.</strong> Sinhala characters, English capitals, and mixed-language headlines remain live in the composition.</p></div>
        </aside>
      </main>
    </div>
  );
}
