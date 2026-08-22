export type ImagePromptInput = {
  story: string;
  headline: string;
  language: "english" | "sinhala";
  format: "square" | "portrait";
};

export function buildRelevantImagePrompt({ story, headline, language, format }: ImagePromptInput): string {
  const angle = headline.trim() || "the central news angle";
  const context = story.trim() || "Use the headline as the factual basis and avoid inventing details.";
  const ratio = format === "portrait" ? "4:5 vertical composition" : "1:1 square composition";
  const audience = language === "sinhala" ? "Sri Lankan Sinhala-language Facebook audience" : "English-language Facebook audience";

  return `Create a single, photorealistic editorial news image for a ${audience}.\n\nNews angle: ${angle}\nSource context: ${context}\n\nComposition: ${ratio}; one clear, believable focal subject that directly supports the news angle; authentic location, people, lighting, and details appropriate to the context; strong visual storytelling; leave calm, darker negative space in the lower third for a headline overlay.\n\nStyle: premium documentary photojournalism, natural cinematic light, realistic color, sharp focal detail, respectful and factual—not sensational.\n\nDo not include: any words, letters, captions, logos, watermarks, social-media UI, split panels, collages, borders, or fabricated charts.`;
}
