# AFSigiri Default Font Verification

The uploaded `AFSigiri.ttf` was identified as the **AF Sigiri** regular TrueType family and contains Unicode Sinhala glyph coverage (U+0D82–U+0DF3). It was uploaded as the managed static asset `/manus-storage/AFSigiri_7ad71838.ttf`.

In the editor, Sinhala mode displayed the built-in Sinhala headline successfully. The font panel reported **AF Sigiri is active by default**, and the live post preview rendered the Unicode Sinhala headline without a custom upload selected.

Browser font inspection confirmed the live Sinhala headline resolves to `"AF Sigiri", "Abhaya Libre", "Noto Sans Sinhala", serif` and that `document.fonts.check` reports AFSigiri as loaded. The Sinhala post then initiated a PNG download successfully through the standard export action.

Browser download history confirmed the completed `soori-square-post (3).png` file created from the Sinhala AFSigiri composition.
