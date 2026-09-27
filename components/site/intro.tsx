import Link from 'next/link'
import { projectRefs } from '@/app/signals'
import { LiveSentence } from './live-sentence'
import { TweetCard } from './tweet-card'
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
          <span>
            I’m <Token href="/about">Kuladeep</Token>.
          </span>{' '}
          <span className="s1-role">Security Engineer, Michigan.</span>
        </p>
        <LiveSentence projects={projects} />
      </div>

      <div className="bottom">
        <TweetCard />
        <nav className="work-phone" aria-label="Work">
          <h2 className="work-phone-head">Work</h2>
          <WorkList projects={projects} />
        </nav>
      </div>
    </section>
  )
}
