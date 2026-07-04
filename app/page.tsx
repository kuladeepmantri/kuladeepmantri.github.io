import { sortedByStart } from './signals'
import { Masthead } from '@/components/home/masthead'
import { LabTimeline } from '@/components/home/lab-timeline'
import { SignalLog } from '@/components/signal-log'

export default function Home() {
  const signals = sortedByStart()

  return (
    <div className="mx-auto max-w-reading px-5 pb-16">
      <Masthead />

      {/* Signature figure: the whole body of work as a timeline. Full-bleed. */}
      <section className="my-14 ml-[calc(-50vw+50%)] w-screen overflow-x-hidden px-4 md:px-8">
        <LabTimeline signals={signals} />
      </section>

      <SignalLog signals={signals} />
    </div>
  )
}
