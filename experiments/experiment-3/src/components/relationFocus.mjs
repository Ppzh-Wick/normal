// Pure presentation math. Node positions are reading layout, not historical coordinates.
export const SELECTED_PORTRAIT_SCALE = 1.55;
export const CENTER_PORTRAIT_SCALE = 1.22;
export function portraitScale(selectedId, nodeId) {
  return selectedId && selectedId === nodeId ? SELECTED_PORTRAIT_SCALE : 1;
}
export function centerPortraitScale(selectedId) {
  return selectedId ? CENTER_PORTRAIT_SCALE : 1;
}
export function portraitTransform(x, y, scale) {
  return `translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`;
}
export function pairCamera(x, y, overview) {
  const cx = overview ? 620 : 480, cy = overview ? 205 : 260;
  return { x: -(x - cx) / 2, y: (overview ? 20 : 0) - (y - cy) / 2, scale: 1 };
}

export function overviewLabelY(x, y, lineCount, selected, compact) {
  // Keep a selected top portrait's multiline name above it, away from Li's face.
  if (selected && compact && Math.abs(x - 620) < 80 && y < 205) {
    return y - 28 * SELECTED_PORTRAIT_SCALE - 12 - (lineCount - 1) * 17;
  }
  return y + 39 + (selected ? 18 : 0);
}
