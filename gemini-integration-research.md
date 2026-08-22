# Gemini Integration Research Notes

## Official Sources

1. [Gemini API documentation](https://ai.google.dev/gemini-api/docs)
2. [Gemini native image generation documentation](https://ai.google.dev/gemini-api/docs/image-generation)

## Implementation-Relevant Findings

Google’s current Gemini API documentation recommends the Interactions API. Requests are sent to `POST https://generativelanguage.googleapis.com/v1beta/interactions` with the user’s key in the `x-goog-api-key` header. Text generation can use a Gemini Flash model and structured JSON output for predictable headline data.

The official image-generation guide describes the `gemini-3.1-flash-image` model for text-to-image requests through the same Interactions API. Its `output_image.data` result is base64-encoded image data. The image workflow should be run server-side, use an editorial photo prompt with no rendered text or logos, and include a loading state because generation can take several seconds.

## Project Decision

The Gemini key will be supplied per generation request through the encrypted HTTPS application request and used only by the server process for that request. It will not be persisted in the database, local storage, source code, or browser-visible configuration. The UI will explain that the key is session-only and provide a link to Google AI Studio for creating one.

The Interactions API can retain requests by default. The server implementation explicitly sends `store: false` so these one-off creator prompts are not retained by Gemini’s interaction storage.

## Browser Verification Notes

The post studio displays the Gemini connection panel, a masked API-key field with show/hide control, a Google AI Studio key link, an AI headline action, and a separate relevant-image action. A sample news description was entered successfully before checking the no-key validation state.

Both generation actions validate the missing-key state before making a network request. The headline action displayed the clear prompt “Add your Gemini API key to generate AI headlines.” The image action is protected by the corresponding missing-key guard.

## Live Verification Outcome

The configured Gemini credential passed Google’s model-list endpoint and created four live headline options through the server-side integration. The test credential currently has no allowance for `gemini-3.1-flash-image`; the application maps that provider response to a direct instruction to use a billing-enabled Google AI Studio project or a key with image-model access. This is an external key-quota limitation rather than an application error.
