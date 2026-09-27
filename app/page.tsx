import { projectRefs } from './signals'
import { WorkList } from '@/components/site/work-list'

export default function Home() {
  return (
    <section className="work-pane" aria-labelledby="work-title">
      <h2 className="p-title" id="work-title">
        Work
      </h2>
      <p className="p-lead">Things I’ve built, newest commit first.</p>
      <WorkList projects={projectRefs()} />
    </section>
  )
}
