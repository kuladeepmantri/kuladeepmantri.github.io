import { MapPin } from 'lucide-react'

// The home masthead, in the spirit of a paper's title block: name, the one line
// that frames the work, and where he is. Quiet, mono, no fashion hero. The
// figure below it carries the visual weight; the project counts live there.
export function Masthead() {
  return (
    <header className="border-b border-[var(--border)] pb-9">
      <div className="text-[11px] tracking-[0.22em] text-[color:var(--accent)] uppercase">
        cybersecurity engineer
      </div>

      <h1 className="mt-3 text-[23px] font-bold tracking-[-0.01em] text-[var(--text)]">
        Kuladeep Bhushan Mantri
      </h1>

      <p
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-4 max-w-[60ch] text-[16px] leading-[1.7] text-[var(--text-secondary)]"
      >
        I understand how applications, cloud, infrastructure, and the AI systems
        built on top of them are designed, where they run, what they trust, and
        how they fail, then build security that fits.
      </p>

      <div className="mt-6 flex items-center gap-1.5 text-[11.5px] tracking-[0.08em] text-[var(--text-muted)] uppercase">
        <MapPin size={12} className="text-[var(--text-muted)]" aria-hidden />
        Michigan, USA
      </div>
    </header>
  )
}
