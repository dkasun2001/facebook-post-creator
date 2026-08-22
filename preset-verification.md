# Custom Preset Verification

The Template editor exposes the named preset field and Save current control beneath the color-scheme selector.

For the interaction test, the editor switched to `template-signal` with the Ruby palette accent `#FF7E98`. This non-default combination is ready to save, apply, remove, and verify for local persistence.

The visible preset name input and Save current button render correctly. Browser automation did not retain the first direct text-entry attempt in the controlled field, so the next verification step will exercise the component’s native input event before validating save, apply, removal, and persistence.

Using the component’s native input event, `Ruby signal` was saved with the Signal alert and Ruby report combination. The preset appeared in the editor and in browser storage, then remained visible after a fresh page reload, confirming local persistence.

After intentionally switching the editor to a different template and palette, applying `Ruby signal` restored `template-signal` and Ruby’s `#FF7E98` accent. Removing the preset then cleared both the visible list and the browser-storage value.
