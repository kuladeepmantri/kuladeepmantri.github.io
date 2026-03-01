export function Footer() {
  return (
    <footer className="py-6">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <span className="text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Kuladeep Mantri
        </span>
      </div>
    </footer>
  )
}
