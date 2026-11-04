# Experiment 2: selected-pair focus

Saved version for the requested graph revision. Existing historical content, 24 relationships and category controls are preserved.

- Only the selected portrait/symbol and Li Chengsan's central portrait enlarge. Other graph nodes stay at their original size.
- Unselected nodes are dimmed and lightly blurred on desktop. Mobile uses dimming without blur.
- Closing the evidence panel restores the previous zoom/pan and keyboard focus.
- The selected relationship remains stable while hovering other nodes. Keyboard-focused nodes stay readable.
- The mobile evidence dialog contains keyboard focus and supports Escape.

Validation: 113 Node tests and 36 real Chromium cases passed in Actions run https://github.com/Ppzh-Wick/normal/actions/runs/41803628565 . Cases include all 24 nodes, four categories, repeat selection, restoration, search, keyboard, reduced motion and 390px mobile. Desktop person/school/project and mobile screenshots were reviewed.

The deployed files are the exact CI-produced build. No ongoing animation loop was added. Headless Chromium is not a real-device frame-rate benchmark; Safari, physical phones and GPU performance have not been measured for this revision.

This Git branch is retained before the independent animation exploration.
