import { ProjectShell } from '@/components/apps/project-shell'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { AsideNote as Aside } from '@/components/ui/aside-note'
import { Prose } from '@/components/ui/prose'
import { SsrrVsSar } from './SsrrVsSar'
import { AttackPath } from './AttackPath'
import { ClusterDiagram } from './ClusterDiagram'
import {
  HERO,
  INTRO,
  SSRR_SAR,
  ATTACK_INTRO,
  REAL_RUN,
  METHOD,
  CONCLUSION,
  SECTIONS,
} from '@/app/apps/kubereach/content'

// kubereach shares the same immersive scaffold as every other project page
// (nav + smooth scroll + hero + footer) via ProjectShell. Only the body — the
// cluster diagram and the story sections — is kubereach-specific.
export function KubereachExperience() {
  return (
    <ProjectShell
      name="kubereach"
      tint="var(--kr-rose)"
      sections={SECTIONS}
      hero={{
        eyebrow: HERO.eyebrow,
        headline: HERO.headline,
        sub: HERO.sub,
        meta: HERO.meta,
      }}
      footer={{ src: 'https://github.com/getnullpkg/kubereach' }}
    >
      {/* Architecture diagram, full-bleed band */}
      <Band max={900}>
        <ClusterDiagram />
        <p className="mt-6 text-center text-[11px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
          one container is compromised &middot; its token escapes the cluster to
          your laptop, then to AWS
        </p>
      </Band>

      {/* ── 01 · Start ── */}
      <SectionHeading id="start" number="01" title="The starting point" />
      <Reveal>
        <Prose>
          {INTRO.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>

      {/* ── 02 · The front desk lies (SSRR vs SAR) ── */}
      <SectionHeading
        id="front-desk"
        number="02"
        title="Bet one: the front desk lies"
      />
      <Reveal>
        <Prose>
          <p>{SSRR_SAR.intro}</p>
        </Prose>
      </Reveal>
      <Band hint="interactive · try both calls">
        <SsrrVsSar />
      </Band>
      <Reveal>
        <Prose>
          <p>{SSRR_SAR.takeaway}</p>
        </Prose>
      </Reveal>

      {/* ── 03 · Carrying the key out (attack path) ── */}
      <SectionHeading
        id="carry-out"
        number="03"
        title="Bet two: carrying the key out"
      />
      <Reveal>
        <Prose>
          <p>{ATTACK_INTRO}</p>
        </Prose>
      </Reveal>
      <Band hint="interactive · click any hop">
        <AttackPath />
      </Band>

      {/* ── 04 · The real run ── */}
      <SectionHeading id="real-run" number="04" title="The real run" />
      <Reveal>
        <Prose>
          <p>{REAL_RUN.intro}</p>
        </Prose>
      </Reveal>

      <Reveal delay={0.05}>
        <dl className="my-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {REAL_RUN.setup.map((row) => (
            <div key={row.k} className="bg-[var(--bg-elevated)] px-4 py-3">
              <dt className="text-[10.5px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
                {row.k}
              </dt>
              <dd className="mt-1 text-[13.5px] text-[var(--text-secondary)]">
                {row.v}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <ol className="my-6 space-y-3">
        {REAL_RUN.steps.map((s, i) => (
          <Reveal
            as="li"
            key={s.text}
            delay={i * 0.05}
            className="flex gap-4 rounded-lg border border-[var(--border)] p-4"
          >
            <span className="mt-0.5 text-[13px] tabular-nums text-[var(--text-muted)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <div className="text-[10.5px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
                {s.hat}
              </div>
              <p
                style={{ fontFamily: 'var(--font-inter)' }}
                className="mt-1 text-[14px] leading-[1.6] text-[var(--text-secondary)]"
              >
                {s.text}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>

      <Aside label="the assumption that turned out wrong">
        My local test signed the request to AWS with my own credentials, and real
        AWS rejects that outright. The whole point is that the{' '}
        <strong>stolen token is the credential</strong>, so the request has to go
        out unsigned. A four-line fix, and exactly the kind of detail that decides
        whether the attack works or quietly fails. I only found it by doing it for
        real instead of trusting the mock.
      </Aside>

      <Reveal>
        <Prose>
          <p>{REAL_RUN.close}</p>
        </Prose>
      </Reveal>

      {/* ── 05 · How I worked ── */}
      <SectionHeading id="how" number="05" title="How I worked" />
      <Reveal>
        <Prose>
          <p>{METHOD.intro}</p>
        </Prose>
      </Reveal>
      <ol className="my-6 space-y-0">
        {METHOD.stages.map((st, i) => (
          <Reveal
            as="li"
            key={st.tag}
            delay={i * 0.06}
            className="grid grid-cols-[auto_1fr] gap-x-4"
          >
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                {i + 1}
              </span>
              {i < METHOD.stages.length - 1 && (
                <span className="my-1 w-px flex-1 bg-[var(--border)]" />
              )}
            </div>
            <div className="pb-6">
              <div className="text-[10.5px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
                {st.tag}
              </div>
              <h3 className="mt-0.5 text-[15px] font-semibold text-[var(--text)]">
                {st.title}
              </h3>
              <p
                style={{ fontFamily: 'var(--font-inter)' }}
                className="mt-1 max-w-[58ch] text-[14px] leading-[1.65] text-[var(--text-secondary)]"
              >
                {st.text}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>

      {/* ── 06 · In progress ── */}
      <SectionHeading id="worth" number="06" title="Work in progress" />
      <Reveal>
        <Prose>
          {CONCLUSION.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>
      <Aside label="where this belongs">{CONCLUSION.scope}</Aside>
    </ProjectShell>
  )
}
