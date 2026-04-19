import { SOCIAL_LINKS } from '@/app/signals'

const github = SOCIAL_LINKS.find((s) => s.label === 'GitHub')?.link ?? '#'

type EndpointLink = { href: string; label: string; external?: boolean }

const LINKS: EndpointLink[] = [
  { href: '/now', label: 'now' },
  { href: '/verify', label: 'verify' },
  { href: '/feed.xml', label: 'feed' },
  { href: github, label: 'github', external: true },
]

export function IdentityBlock() {
  return (
    <header className="space-y-4 border-b border-[var(--border)] pb-8">
      {/* h1 is the site name itself — no fluff, no tagline, no date.
          Visible and semantic at once. */}
      <h1 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        kuladeepmantri.com
      </h1>

      {/* Endpoint links — bracket syntax, flat, all same weight. */}
      <nav
        aria-label="Lab endpoints"
        className="flex flex-wrap items-center gap-x-1 text-[13px] font-semibold text-[var(--text-muted)]"
      >
        {LINKS.map(({ href, label, external }, i) => {
          const isExternal = Boolean(external)
          return (
            <span key={label} className="inline-flex items-center">
              {i > 0 && <span className="mx-2 opacity-50">·</span>}
              <a
                href={href}
                {...(isExternal
                  ? { target: '_blank', rel: 'noopener noreferrer' as const }
                  : {})}
                aria-label={label}
                className="transition-colors hover:text-[var(--text)]"
              >
                [{label}]
              </a>
            </span>
          )
        })}
      </nav>
    </header>
  )
}
