import Link from 'next/link'
import { NOW, projectRefs } from '@/app/signals'
import { LiveSentence } from './live-sentence'
import { BuiltLine } from './built-line'
import { Clock } from './rel-time'
import { ThemeToggle } from './theme-toggle'
import { Token } from './token'
import { WorkList } from './work-list'

/** The left column: who I am, what I'm doing right now, and the menu. */
export function Intro() {
  const projects = projectRefs()
  return (
    <section className="intro" aria-label="Introduction">
      <div className="topbar">
        <h1>
          <Link href="/" scroll={false}>
            Kuladeep Mantri
          </Link>
        </h1>
        <div className="topbar-right">
          <span className="live-label">
            <span className="dot beat" />
            <span className="desk-only">Live</span>
            <span className="phone-only">
              <Clock />
            </span>
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="sentences">
        <p className="sentence s1">
          I’m <Token href="/about">Kuladeep</Token>, a cybersecurity engineer in Michigan. I build
          security tools, and lately I’ve been studying how AI systems fail.
        </p>
        <LiveSentence projects={projects} />
      </div>

      <div className="bottom">
        <p className="now">
          <b>Now</b>
          {NOW}
        </p>
        <nav className="work-phone" aria-label="Work">
          <span className="lab" style={{ paddingBottom: 4 }}>
            Work
          </span>
          <WorkList projects={projects} />
        </nav>
        <div className="foot">
          <BuiltLine />
          <span className="desk-only">Every underlined word opens something</span>
        </div>
      </div>
    </section>
  )
}
