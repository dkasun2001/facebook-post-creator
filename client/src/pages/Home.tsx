/**
 * Soori Post Studio — Editorial Control Room
 * A reference-led production rail uses concise numbered steps and a focused live post plate.
 */
import { ChangeEvent, ReactNode, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  FileImage,
  ImagePlus,
  Languages,
  LayoutPanelTop,
  LoaderCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

type Language = "english" | "sinhala";
type Template = "poll" | "breaking" | "quote" | "feature";
type Format = "square" | "portrait";

const generatedImages = [
  "/manus-storage/soori-morning-railway_b9770c94.jpg",
  "/manus-storage/soori-tea-estate_2e11bbf7.jpg",
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

const templateData: Array<{ id: Template; label: string; detail: string }> = [
  { id: "poll", label: "Poll panel", detail: "Reaction row + navy block" },
  { id: "breaking", label: "Breaking line", detail: "Red signal + headline" },
  { id: "quote", label: "Big question", detail: "Large quote framing" },
  { id: "feature", label: "Feature story", detail: "Quiet label + clean type" },
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

export default function Home() {
  const [expanded, setExpanded] = useState("story");
  const [language, setLanguage] = useState<Language>("english");
  const [story, setStory] = useState("");
  const [headlines, setHeadlines] = useState(englishHeadlines);
  const [selectedHeadline, setSelectedHeadline] = useState(englishHeadlines[0]);
  const [selectedImage, setSelectedImage] = useState(generatedImages[0]);
  const [template, setTemplate] = useState<Template>("poll");
  const [format, setFormat] = useState<Format>("square");
  const [badge, setBadge] = useState("POST BRIEF");
  const [pageName, setPageName] = useState("Soori Daily");
  const [contrast, setContrast] = useState(46);
  const [exporting, setExporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedTemplate = useMemo(
    () => templateData.find((item) => item.id === template) ?? templateData[0],
    [template],
  );

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    const options = next === "sinhala" ? sinhalaHeadlines : englishHeadlines;
    setHeadlines(options);
    setSelectedHeadline(options[0]);
  };

  const generateHeadlines = () => {
    const options = language === "sinhala" ? sinhalaHeadlines : englishHeadlines;
    const shortTopic = story.trim().split(/\s+/).slice(0, 4).join(" ");
    const refreshed = shortTopic
      ? options.map((item, index) =>
          index === 0
            ? language === "sinhala"
              ? `${shortTopic}: මෙය දැන් වැදගත් වෙන්නේ ඇයි?`
              : `${shortTopic}: why this matters now`
            : item,
        )
      : options;
    setHeadlines(refreshed);
    setSelectedHeadline(refreshed[0]);
    setExpanded("headline");
    toast.success("Four editorial angles are ready to choose from.");
  };

  const copyPrompt = async () => {
    const prompt = `Read this ${language === "sinhala" ? "Sinhala" : "English"} news story and write four concise Facebook-image headlines. Keep them factual, high-contrast, and under 12 words. STORY: ${story || "[Paste your news description here]"}`;
    await navigator.clipboard.writeText(prompt);
    toast.success("Writing prompt copied to your clipboard.");
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

  const startFresh = () => {
    setStory("");
    setHeadlines(language === "sinhala" ? sinhalaHeadlines : englishHeadlines);
    setSelectedHeadline(language === "sinhala" ? sinhalaHeadlines[0] : englishHeadlines[0]);
    setSelectedImage(generatedImages[0]);
    setTemplate("poll");
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

    context.fillStyle = "#091323";
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
      // A colour-only fallback is still a valid exported artwork when a remote image forbids canvas reads.
      const imageGradient = context.createLinearGradient(0, 0, 0, height * 0.55);
      imageGradient.addColorStop(0, "#243448");
      imageGradient.addColorStop(1, "#0b1730");
      context.fillStyle = imageGradient;
      context.fillRect(0, 0, width, height * 0.56);
    }
    const shade = context.createLinearGradient(0, height * 0.3, 0, height * 0.72);
    shade.addColorStop(0, "rgba(9,19,35,0)");
    shade.addColorStop(0.58, "rgba(9,19,35,0.48)");
    shade.addColorStop(1, "#091323");
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);
    await document.fonts.ready;
    const isSinhalaHeadline = language === "sinhala";
    const headlineSize = isSinhalaHeadline
      ? format === "square" ? 72 : 78
      : format === "square" ? 65 : 72;
    const lineHeight = isSinhalaHeadline
      ? format === "square" ? 85 : 92
      : 74;
    context.fillStyle = "#F6C400";
    context.fillRect(72, height * 0.55, 86, 9);
    context.font = isSinhalaHeadline
      ? `800 ${headlineSize}px "Abhaya Libre", "Noto Sans Sinhala", serif`
      : `700 ${headlineSize}px Oswald, sans-serif`;
    context.fillStyle = "#FFFFFF";
    context.textAlign = "left";
    const exportHeadline = isSinhalaHeadline ? selectedHeadline : selectedHeadline.toUpperCase();
    const lines = wrapCanvasText(context, exportHeadline, width - 144).slice(0, 5);
    lines.forEach((line, index) => context.fillText(line, 72, height * 0.63 + index * lineHeight));
    context.strokeStyle = "#F6C400";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(72, height - 148);
    context.lineTo(width - 72, height - 148);
    context.stroke();
    context.font = "700 28px DM Sans, sans-serif";
    context.fillStyle = "#F6C400";
    context.fillText(badge.toUpperCase(), 72, height - 94);
    context.fillStyle = "#FFFFFF";
    context.fillText(pageName.toUpperCase(), width - 270, height - 94);

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
          <img src="/manus-storage/soori-sunburst-mark_e75e01ee.png" alt="Soori sunburst logo" className="brand-mark" />
          <div>
            <p className="brand-name">SOORI <span>POST STUDIO</span></p>
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
            <div className="story-actions">
              <button className="signal-button" type="button" onClick={generateHeadlines}><WandSparkles size={16} /> Write 4 headlines</button>
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
            <div className="metadata-grid">
              <label>Badge / kicker<input className="text-input" value={badge} onChange={(event) => setBadge(event.target.value)} /></label>
              <label>Page name<input className="text-input" value={pageName} onChange={(event) => setPageName(event.target.value)} /></label>
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
            <div className={`post-art ${format === "portrait" ? "portrait" : "square"} template-${template}`}>
              <div className="post-photo" style={{ backgroundImage: `linear-gradient(to bottom, rgba(3, 12, 25, 0) 20%, rgba(9, 19, 35, ${contrast / 100}) 66%, #091323 88%), url(${selectedImage})` }}></div>
              <div className="post-grain"></div>
              <div className="post-content">
                {template === "breaking" && <span className="breaking-label">BREAKING NOTE</span>}
                {template === "quote" && <span className="quote-mark">“</span>}
                {template === "feature" && <span className="feature-label">FIELD NOTE · SRI LANKA</span>}
                <div className="headline-rule"></div>
                <h2 className={language === "sinhala" ? "sinhala-headline" : ""}>{selectedHeadline || "Your headline goes here"}</h2>
                {template !== "feature" && <p className="post-deck">A clear angle for the conversation people are already having.</p>}
                <div className="post-bottom">
                  <span className="post-badge">{badge || "POST BRIEF"}</span>
                  <span className="post-page">{pageName || "SOORI DAILY"}</span>
                </div>
                {template === "poll" && <div className="reaction-row"><span className="react yes">♥</span><b>YES</b><i></i><span className="react no">●</span><b>NO</b></div>}
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
