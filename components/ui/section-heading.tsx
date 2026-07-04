// Numbered section break. Inter title; mono index tinted by the project signal.
export function SectionHeading({
  number,
  title,
  id,
}: {
  number: string
  title: string
  id: string
}) {
  return (
    <div id={id} className="mt-16 mb-6 scroll-mt-24">
      <div className="mb-2 text-[12px] font-semibold tracking-[0.2em] text-[color:var(--signal-color,var(--text-muted))]">
        {number}
      </div>
      <h2
        style={{ fontFamily: 'var(--font-inter)' }}
        className="text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-[var(--text)] md:text-[32px]"
      >
        {title}
      </h2>
    </div>
  )
}
