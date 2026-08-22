# Element Color Verification

The editor exposes nine native color controls covering the overlay, headline, highlighted words, accent rule, badge, page name, template label, and both poll reactions.

The Headline control was changed to `#00FFAA` through its native input event. The live artwork updated its `--post-text` variable to the same value and the panel status changed to **Custom overrides active**, confirming the detailed color override is wired into the preview.

The first coordinate-driven reset attempt did not change the rendered state. Direct activation of the reset button then restored the headline color to `#FFFFFF` and the status to **Using selected scheme**.

For a non-default Breaking line template, independent changes to headline, highlight, accent, template label, heart, and thumb colors all appeared on the live artwork as their matching CSS variables: `#00FFAA`, `#FF42C4`, `#A78BFA`, `#FF6B35`, `#E11D48`, and `#2563EB` respectively.

For the Poll panel, custom heart (`#E11D48`) and thumb (`#2563EB`) colors were applied before export. The browser download history confirmed the finished `soori-square-post.png` file, exercising the PNG renderer with the updated per-element export state and its reaction-row drawing.

The canvas renderer now also draws the editable Breaking, Feature, Signal, Spotlight, and Frame labels plus the Quote mark using their mapped element colors. A Feature template check set the Template label to `#34D399`; the live label computed to `rgb(52, 211, 153)`, and the completed `soori-square-post (1).png` download confirmed the updated template-label export path.
