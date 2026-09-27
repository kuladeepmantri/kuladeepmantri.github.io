import Link from 'next/link'
import { projectRefs } from '@/app/signals'
import { LiveSentence } from './live-sentence'
import { BuiltLine } from './built-line'
import { LatestPost } from './latest-post'
import { TopNav } from './top-nav'
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
        <TopNav />
      </div>

      <div className="sentences">
        <p className="sentence s1">
          I’m <Token href="/about">Kuladeep</Token>, a cybersecurity engineer in Michigan. I also
          build whatever I get curious about: apps, AI tools, and the infrastructure behind them.
        </p>
        <LiveSentence projects={projects} />
      </div>

      <div className="bottom">
        <LatestPost />
        <nav className="work-phone" aria-label="Work">
          <h2 className="work-phone-head">
            <span>Work</span>
            <span>{projects.length} projects · latest push first</span>
          </h2>
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
