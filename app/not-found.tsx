import Link from 'next/link'
import { PaneHead } from '@/components/site/pane-head'

export const metadata = { title: 'Not found', robots: { index: false } }

export default function NotFound() {
  return (
    <article>
      <PaneHead title="Not found" />
      <p>
        That page doesn’t exist, or it moved in the redesign. Everything that’s here opens from the
        home pane, or <Link href="/">start over</Link>.
      </p>
    </article>
  )
}
