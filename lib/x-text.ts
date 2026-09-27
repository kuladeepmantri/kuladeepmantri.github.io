// X returns post text HTML-escaped and with t.co links appended for media and
// quotes. Decode the entities and drop a trailing t.co link.
export function postText(text: string): string {
  return text
    .replace(/\s*https:\/\/t\.co\/\w+\s*$/, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}
