// X returns post text HTML-escaped, with links shortened to t.co. The card
// itself links to the post, so drop the t.co links and decode the entities.
export function postText(text: string): string {
  return text
    // A short line that only introduced a link ("Code and quickstart:") goes with it.
    .replace(/(^|\n)[^\n:]{0,40}:\s*https:\/\/t\.co\/\w+/g, '$1')
    .replace(/\s*https:\/\/t\.co\/\w+/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .replace(/\n{3,}/g, '\n\n')
}
