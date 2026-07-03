import type { ArticleBlock } from '@/app/signals'

// Renders a long-form writeup (see ArticleBlock in app/signals.ts). Server
// component, no client state. Diagrams are trusted inline SVG authored in-repo,
// so dangerouslySetInnerHTML is safe here (never pass user input through this).

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <section className="mt-8 border-t border-[var(--border)] pt-6">
      <div className="space-y-5">
        {blocks.map((block, i) => {
          switch (block.kind) {
            case 'heading':
              return (
                <h2
                  key={i}
                  className="pt-3 text-[15px] font-bold text-[var(--text)]"
                >
                  {block.text}
                </h2>
              )

            case 'prose':
              return (
                <p
                  key={i}
                  className="text-[15px] leading-[1.75] text-[var(--text-secondary)]"
                >
                  {block.text}
                </p>
              )

            case 'ascii':
              return (
                <figure key={i} className="my-2">
                  {block.title && (
                    <figcaption className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      {block.title}
                    </figcaption>
                  )}
                  <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
                    <code>{block.art}</code>
                  </pre>
                </figure>
              )

            case 'diagram':
              return (
                <figure key={i} className="my-4">
                  {block.title && (
                    <figcaption className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      {block.title}
                    </figcaption>
                  )}
                  <div
                    className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
                    // Trusted, in-repo SVG string. Not user input.
                    dangerouslySetInnerHTML={{ __html: block.svg }}
                  />
                </figure>
              )

            case 'callout':
              return (
                <aside
                  key={i}
                  className="rounded-md border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--bg-elevated)] px-4 py-3"
                >
                  <div className="mb-1 text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    {block.label}
                  </div>
                  <p className="text-[14px] leading-[1.7] text-[var(--text-secondary)]">
                    {block.text}
                  </p>
                </aside>
              )

            case 'steps':
              return (
                <ol
                  key={i}
                  className="space-y-2.5 text-[14.5px] leading-[1.65] text-[var(--text-secondary)]"
                >
                  {block.items.map((item, j) => (
                    <li key={j} className="grid grid-cols-[auto_1fr] gap-x-3">
                      <span className="font-semibold text-[var(--text-muted)]">
                        {String(j + 1).padStart(2, '0')}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              )
          }
        })}
      </div>
    </section>
  )
}
