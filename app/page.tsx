import { sortedByStart } from './signals'
import { IdentityBlock } from '@/components/identity-block'
import { SignalLog } from '@/components/signal-log'

export default function Home() {
  const signals = sortedByStart()

  return (
    <div className="mx-auto max-w-[680px] px-5 pb-12">
      <IdentityBlock />
      <SignalLog signals={signals} />
    </div>
  )
}
