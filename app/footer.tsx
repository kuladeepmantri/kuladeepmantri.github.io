import { SOCIAL_LINKS, EMAIL } from './signals'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border)]">
      <div className="mx-auto max-w-reading px-5 py-8 text-[12px] font-semibold text-[var(--text-muted)]">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          <a
            href={`mailto:${EMAIL}`}
            className="transition-colors hover:text-[var(--text)]"
          >
            {EMAIL}
          </a>
          {SOCIAL_LINKS.map((social) => (
            <span key={social.label} className="inline-flex items-center">
              <span className="mx-2 opacity-50">·</span>
              <a
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--text)]"
              >
                {social.label.toLowerCase()}
              </a>
            </span>
          ))}
          <span className="ml-auto opacity-60">
            &copy; {new Date().getFullYear()} kuladeep mantri
          </span>
        </div>
      </div>
    </footer>
  )
}
