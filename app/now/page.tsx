import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Notes',
  description:
    'The workbench: what Kuladeep Mantri is building now, what is next, what shipped, and what got shelved.',
}

// Hand-maintained. This page is written, not generated — I update it when the
// real state changes, which is the whole point of a /now page.
const UPDATED = 'July 2026'

type Item = { name: string; slug?: string; note: string }

const NOW: Item[] = [
  {
    name: 'Auris',
    slug: 'auris',
    note: 'ARM64 syscall tracing and ROP scanning. The tracer works; I keep pulling on what it can see.',
  },
  {
    name: 'Rune',
    slug: 'rune',
    note: 'Still running in the car. I add a sensor or a forecasting layer whenever a drive gets boring.',
  },
]

const NEXT: Item[] = [
  {
    name: 'ShipCrew',
    slug: 'shipcrew',
    note: 'The multi-agent dev crew works end to end. Deciding what the next layer of hardening buys.',
  },
  {
    name: 'Kintsugi',
    slug: 'kintsugi',
    note: 'A personal iOS app I use daily. Small, private, not trying to be a product.',
  },
]

const SHIPPED: Item[] = [
  {
    name: 'untilithappens.org',
    slug: 'untilithappens',
    note: 'Live and done. A real site that does its one job.',
  },
  {
    name: 'Rune',
    slug: 'rune',
    note: 'Shipped and in daily use, even as I keep extending it.',
  },
]

const SHELVED: Item[] = [
  {
    name: 'kubereach',
    slug: 'kubereach',
    note: 'Both bets proved against real infrastructure. Shelved once a competing tool covered most of the same ground.',
  },
  {
    name: 'DeID-Anonymizer',
    slug: 'deid',
    note: 'A PII masking service. Regex detection today, the queue and storage scaffolded for the model that replaces it.',
  },
]

function Group({ label, items }: { label: string; items: Item[] }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
        {label}
      </h2>
      <ul className="space-y-4">
        {items.map((it, i) => (
          <li key={`${it.name}-${i}`} className="grid grid-cols-1 gap-1">
            <div className="text-[15px] font-semibold text-[var(--text)]">
              {it.slug ? (
                <Link
                  href={`/apps/${it.slug}`}
                  className="transition-colors hover:text-[color:var(--accent)]"
                >
                  {it.name}
                </Link>
              ) : (
                it.name
              )}
            </div>
            <p
              style={{ fontFamily: 'var(--font-inter)' }}
              className="max-w-[60ch] text-[14px] leading-[1.65] text-[var(--text-secondary)]"
            >
              {it.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function NowPage() {
  return (
    <div className="mx-auto max-w-reading px-5 pt-4 pb-24">
      <header className="space-y-3 border-b border-[var(--border)] pb-6">
        <div className="text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
          the workbench &middot; updated {UPDATED}
        </div>
        <h1
          style={{ fontFamily: 'var(--font-inter)' }}
          className="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text)] md:text-[32px]"
        >
          What I am on right now
        </h1>
      </header>

      <p
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-6 max-w-[60ch] text-[15px] leading-[1.75] text-[var(--text-secondary)]"
      >
        Where my head is at right now. What I am building, what is next, what
        shipped, and what I stopped. I update it when it changes.
      </p>

      <Group label="now" items={NOW} />
      <Group label="next" items={NEXT} />
      <Group label="shipped" items={SHIPPED} />
      <Group label="shelved" items={SHELVED} />

      <p className="mt-12 text-[12px] text-[var(--text-muted)]">
        Format inspired by{' '}
        <a
          href="https://sive.rs/nowff"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
        >
          Derek Sivers&rsquo; /now movement
        </a>
        .
      </p>
    </div>
  )
}
