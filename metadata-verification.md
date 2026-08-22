# Editable Metadata Verification

The editor exposes placeholder guidance for badge, page name, and Poll template labels stating that blank values will be hidden. A browser bulk-clear attempt emptied the visual input fields, but the preview retained its prior labels, so the controlled React inputs will be rechecked with individual updates before final verification.

An individual native-input-event attempt also left the existing preview metadata unchanged in the browser automation session. The implementation conditionally renders metadata with `hasPostText`; a direct typed-value test will confirm the React event path used by the browser harness.

The browser automation’s direct typing path did not update the controlled fields. The editor’s own `onChange` handlers were invoked for the badge and page-name fields; the next visual pass will confirm their rendered result after React processes the state update.

The subsequent rendered pass confirmed the blank-field behavior: the `POST BRIEF` and `Soori Daily` metadata row disappeared entirely from the live post while the poll reactions remained visible.

The Signal alert template was selected successfully. Its dedicated Signal label input appeared, and the live post displayed the `DEVELOPING STORY` label while the blank global badge and page-name fields remained hidden.

Updating the Signal label to `LIVE UPDATE` through the template control changed the live post label accordingly. This confirms the template-specific labels are editable independently of the global metadata fields.

The editor was then cycled through every applicable template. Each displayed its intended editable field: Heart label (Poll), Breaking label, Feature label, Signal label, Spotlight label, Frame label, and Bulletin number. This confirms all visible template-specific text has an editor control.

With the global badge and page-name fields blank and Quick bulletin active, the PNG export action completed successfully. The same blank-state conditional used by the live preview is applied in the export renderer, so no global metadata row is drawn into the downloaded post.
