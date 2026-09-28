import type { Metadata } from 'next'
import { ALIAS_OF_HOME } from '@/lib/meta'

// /verify was a page in an earlier design. It now shows home, like /now.
export const metadata: Metadata = ALIAS_OF_HOME

export default function Verify() {
  return null
}
