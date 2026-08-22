# Custom Sinhala Font Upload Verification Notes

The browser exposes the custom Sinhala font input as the first file input. It accepts `.ttf`, `.otf`, `.woff`, and `.woff2` files. The image uploader remains the second file input and accepts images only.

The interface displays the upload control with the built-in Abhaya Libre Sinhala font as its default fallback.

The automated browser exposes the hidden font field in the DOM but cannot target it directly for file upload. The client-side `FontFace` loading path is covered by the production build; interactive upload remains ready for users through the visible “Upload Sinhala font” control.

An end-to-end client-side test injected a valid WOFF2 font fixture through the upload handler. The interface confirmed `NotoSinhala-Test` as active, demonstrating that custom font registration and visible selection feedback work correctly.

The custom font remained visibly active in Sinhala preview mode. A corrupt WOFF2 fixture followed the error path without clearing the existing active font, confirming the failure state is non-destructive.

For the Tharu Digital Mahee repair verification, the custom-font input was exposed temporarily in the test browser. It correctly retains the expected TTF, OTF, WOFF, and WOFF2 accept filter.

The attached `tharu_digital_mahee.ttf` was submitted through the repaired handler. The app correctly rejected it as a legacy non-Unicode font and retained the built-in Unicode Sinhala fallback, preventing incorrect glyph rendering.

The Words in Yellow control is present in the headline editor and accepts comma-separated terms for live headline highlighting verification.

Using the selected terms `country, here` produced exactly the matching live preview highlight spans, confirming the text matching and yellow rendering behavior.
