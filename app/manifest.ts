import type { MetadataRoute } from 'next'
import { SENTENCE_ONE } from './signals'

export const dynamic = 'force-static'

// The page background (--bg in app/globals.css, light).
const BG = '#fdfdfc'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kuladeep Mantri',
    short_name: 'Kuladeep',
    description: SENTENCE_ONE,
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
