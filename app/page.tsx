import { projectRefs } from './signals'
import { WorkList } from '@/components/site/work-list'

export default function Home() {
  return <WorkList projects={projectRefs()} />
}
