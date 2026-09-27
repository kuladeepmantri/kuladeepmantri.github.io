// X returns post text HTML-escaped, with links shortened to t.co. The card
// itself links to the post, so drop the t.co links and decode the entities.
export function postText(text: string): string {
  return text
    .replace(/\s*https:\/\/t\.co\/\w+/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}
