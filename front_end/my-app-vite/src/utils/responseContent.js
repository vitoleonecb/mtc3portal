export function normalizeResponseItems(rawContent) {
  let content = rawContent;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch { /* Plain text response. */ }
  }

  const values = Array.isArray(content) ? content : content == null ? [] : [content];
  return values
    .filter((value) => value != null)
    .map((value) => typeof value === 'object' ? value : { answer: String(value) });
}
