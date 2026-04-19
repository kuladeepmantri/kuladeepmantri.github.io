import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Verify',
  description:
    'How to verify that the code, commits, and entries on this site came from Kuladeep Mantri.',
}

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-[680px] px-5 pb-12">
      <header className="space-y-3 border-b border-[var(--border)] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
          <Link
            href="/"
            className="transition-colors hover:text-[var(--text)]"
          >
            kuladeepmantri.com
          </Link>
          <span aria-hidden>·</span>
          <span>verify</span>
        </div>
        <h1 className="text-[18px] font-semibold text-[var(--text)]">
          provenance &amp; verification
        </h1>
      </header>

      <section className="mt-6 space-y-5 text-[15px] leading-[1.7] text-[var(--text-secondary)]">
        <p>
          Every entry in the log has a stable identifier in the format{' '}
          <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 text-[13px] text-[var(--text)]">
            KM-YYYY-NNNN
          </code>
          . The year is when the work started. The number is sequential.
          IDs never change once assigned.
        </p>
        <p>
          Project code is public on GitHub. Commit signatures are verified
          by GitHub&rsquo;s own infrastructure. Look for the
          &ldquo;Verified&rdquo; badge on any commit page. If a commit
          here looks suspect, open it on GitHub and read the signature
          state directly from the source of truth.
        </p>
        <p>
          This site itself is static, built from the{' '}
          <a
            href="https://github.com/kuladeepmantri/kuladeepmantri.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
          >
            kuladeepmantri/kuladeepmantri.github.io
          </a>{' '}
          repo and deployed to GitHub Pages via Actions. The build
          pipeline is visible and the deploy artifact is reproducible.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          contact channels
        </h2>
        <dl className="space-y-3 text-[14px]">
          <div className="flex items-baseline gap-x-4">
            <dt className="min-w-[90px] text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
              email
            </dt>
            <dd>
              <a
                href="mailto:mantrikuladeep@gmail.com"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
              >
                mantrikuladeep@gmail.com
              </a>
            </dd>
          </div>
          <div className="flex items-baseline gap-x-4">
            <dt className="min-w-[90px] text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
              github
            </dt>
            <dd>
              <a
                href="https://github.com/kuladeepmantri"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
              >
                github.com/kuladeepmantri
              </a>
            </dd>
          </div>
          <div className="flex items-baseline gap-x-4">
            <dt className="min-w-[90px] text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
              security.txt
            </dt>
            <dd>
              <a
                href="/.well-known/security.txt"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
              >
                /.well-known/security.txt
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <p className="mt-10 text-[12px] text-[var(--text-muted)]">
        this page will expand as the signing workflow matures. today it
        documents what&rsquo;s already verifiable; tomorrow it will
        include a published public key.
      </p>
    </div>
  )
}
