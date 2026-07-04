// Home identity. The full name appears here and only here (the header keeps a
// quiet monogram). One honest first-person line, no tagline theatre.
export function IdentityBlock() {
  return (
    <header className="space-y-4 border-b border-[var(--border)] pb-8">
      <h1 className="text-[15px] font-bold tracking-[0.02em] text-[var(--text)]">
        Kuladeep Bhushan Mantri
      </h1>
      <p
        style={{ fontFamily: 'var(--font-inter)' }}
        className="max-w-[56ch] text-[15px] leading-[1.7] text-[var(--text-secondary)]"
      >
        I take things apart to understand how they work, then build the ones
        worth keeping. Security and systems mostly, with a habit of wandering
        into whatever is new. This is where the work lives.
      </p>
    </header>
  )
}
