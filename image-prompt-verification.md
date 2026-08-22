# AI Image Prompt Verification

The visual-source workflow now displays **Copy AI image prompt** beside the existing built-in image choices and upload controls. It does not restore an in-app AI image-generation control.

A sample flood-repair rail-service brief was entered into the news description, and the copy control was activated to verify the contextual prompt workflow.

The rendered editor remained stable after activating the copy control. Direct browser clipboard reading did not return within the automation timeout, so the prompt’s content requirements are additionally covered by focused unit tests.

An isolated copy-call verification intercepted the generated text before it reached the system clipboard. It confirmed that the prompt included the current rail-service story, selected headline, `1:1 square composition`, and the explicit no-text constraint.

At a 375 px mobile viewport, the expanded visual-source step displayed the prompt panel cleanly below image upload controls. Its explanatory copy remained readable and the **Copy AI image prompt** button remained visible and reachable without overlapping the headline-shade slider.
