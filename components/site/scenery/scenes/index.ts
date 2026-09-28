import type { Scene } from '../kit'
import aurora from './aurora'
import balloons from './balloons'
import causeway from './causeway'
import flamingos from './flamingos'
import lighthouse from './lighthouse'
import moonrise from './moonrise'
import pier from './pier'
import regatta from './regatta'
import port from './port'
import ship from './ship'
import skyline from './skyline'
import snowfall from './snowfall'
import valley from './valley'

/**
 * Which scene each page shows, keyed by the page's palette (lib/panes.ts).
 * A new project adds one line here and one file in this folder; DESIGN.md
 * says how to design it.
 */
export const SCENES: Record<string, Scene> = {
  home: flamingos,
  about: valley,
  contact: pier,
  github: aurora,
  x: moonrise,
  kubereach: port,
  rune: causeway,
  shipcrew: ship,
  kintsugi: balloons,
  auris: snowfall,
  untilithappens: lighthouse,
  deid: skyline,
  evalcore: regatta,
}

// Own keys only: a path like /apps/constructor must not reach Object.prototype.
export const sceneFor = (key: string) => (Object.hasOwn(SCENES, key) ? SCENES[key] : SCENES.home)

