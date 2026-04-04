import { SOCIAL_LINKS, EMAIL } from './data'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Kuladeep Mantri
            </p>
            <a
              href={`mailto:${EMAIL}`}
              className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              {EMAIL}
            </a>
          </div>

          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <p className="text-[11px] text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Kuladeep Mantri. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
