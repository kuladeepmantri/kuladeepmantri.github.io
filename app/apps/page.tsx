import type { Metadata } from 'next'
import { ALIAS_OF_HOME } from '@/lib/meta'

// /apps was the old index of projects. It now shows home, like /now.
export const metadata: Metadata = ALIAS_OF_HOME

export default function Apps() {
  return null
}
