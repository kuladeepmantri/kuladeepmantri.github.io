import { sortedByStart, sortedByRelevance } from './signals'
import { Masthead } from '@/components/home/masthead'
import { Direction } from '@/components/home/direction'
import { LabTimeline } from '@/components/home/lab-timeline'
import { SignalLog } from '@/components/signal-log'

export default function Home() {
  const timeline = sortedByStart()
  const log = sortedByRelevance()

  return (
    <div className="mx-auto max-w-reading px-5 pb-24">
      <Masthead />

      <div className="mt-10">
        <Direction />
      </div>

      {/* Signature figure: the whole body of work as a timeline. Full-bleed. */}
      <section className="my-14 ml-[calc(-50vw+50%)] w-screen overflow-x-hidden px-4 md:px-8">
        <LabTimeline signals={timeline} />
      </section>

      <SignalLog signals={log} />
    </div>
  )
}
