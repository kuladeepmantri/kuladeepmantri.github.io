import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-reading flex-col justify-center px-5 py-24">
      <div className="text-[11px] tracking-[0.2em] text-[color:var(--accent)] uppercase">
        404
      </div>
      <h1
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-3 text-[23px] font-bold tracking-[-0.01em] text-[var(--text)]"
      >
        signal not found
      </h1>
      <p
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-4 max-w-[60ch] text-[16px] leading-[1.7] text-[var(--text-secondary)]"
      >
        This page moved or never existed. Nothing is broken; the link just does
        not point anywhere anymore.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1 text-[13px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        [&larr; back home]
      </Link>
    </div>
  )
}
