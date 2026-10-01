// X returns post text HTML-escaped, with links shortened to t.co. Every post on
// the page links to itself on X, so drop the t.co links and decode the entities.
export function postText(text: string): string {
  return (
    text
      // A short line that only introduced a link ("Code and quickstart:") goes with it.
      .replace(/(^|\n)[^\n:]{0,40}:\s*https:\/\/t\.co\/\w+/g, '$1')
      .replace(/\s*https:\/\/t\.co\/\w+/g, '')
      // &amp; last: X escapes & first, so a literal "&lt;" arrives as "&amp;lt;".
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      // "@handle ." is typed that way so the mention ends; read it as "@handle.".
      .replace(/(@\w{1,15}) (?=[.,!?;:](\s|$))/g, '$1')
      .trim()
      .replace(/\n{3,}/g, '\n\n')
  )
}

/**
 * Posts with something to read. A post that is only a link (a video, an image, a
 * quote) has no text left once the t.co link is dropped, so the slider and the X
 * tab skip it rather than show an empty post.
 */
export function readable<T extends { text: string }>(posts: T[]): T[] {
  return posts.filter((p) => postText(p.text).length > 0)
}
