import type { MetadataRoute } from 'next'
import { SENTENCE_ONE } from './signals'

export const dynamic = 'force-static'

// Home's sky colour, the same one app/layout.tsx gives the browser chrome on /.
const HOME_SKY = '#3b7fd6'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kuladeep Mantri',
    short_name: 'Kuladeep',
    description: SENTENCE_ONE,
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: HOME_SKY,
    theme_color: HOME_SKY,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
