// Subsequence matching for the event log filter.
//
// This runs in the browser rather than on the server because the log is a LiveView stream: rows are
// pushed to the DOM once and never re-rendered, so a server-side filter could only ever affect rows
// that had not arrived yet.

export function positions(text, query) {
  const needle = query.toLowerCase().replace(/\s+/g, "");
  if (needle === "") return [];

  const haystack = text.toLowerCase();
  const found = [];
  let at = 0;

  for (const char of needle) {
    at = haystack.indexOf(char, at);
    if (at === -1) return null;
    found.push(at);
    if (char.length === 2) found.push(at + 1);
    at += char.length;
  }

  return found;
}

export function matches(text, query) {
  return positions(text, query) !== null;
}

// Runs of {matched, text} so a hit can be marked up in place. Without this a fuzzy match is
// unexplainable: the row is on screen and the user cannot see why.
export function segments(text, query) {
  const found = positions(text, query);
  if (found === null || found.length === 0) return [{ matched: false, text }];

  const hit = new Set(found);
  const out = [];

  for (let i = 0; i < text.length; i++) {
    const matched = hit.has(i);
    const last = out[out.length - 1];
    if (last && last.matched === matched) last.text += text[i];
    else out.push({ matched, text: text[i] });
  }

  return out;
}
