// Hash routes work on static hosting, including GitHub Pages subdirectories.
export const personHref = id => `#/people/${encodeURIComponent(id)}`;

export function parsePersonRoute(hash) {
  if (!hash.startsWith('#/people')) return null;
  const match = /^#\/people\/([^/?#]+)\/?$/.exec(hash);
  if (!match) return { id: null };
  try { return { id: decodeURIComponent(match[1]) }; }
  catch { return { id: null }; }
}

export function isPlainClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
