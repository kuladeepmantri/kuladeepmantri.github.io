// Single source for the untilithappens page. A live, plain-language cyber-safety
// site for non-technical people. Facts from the live site (official-source-backed
// guidance, a four-step guided journey). Copy is the most accessible on the site.

export const HERO = {
  eyebrow: 'untilithappens.org · KM-2024-0001 · shipped',
  headline: 'Cyber safety for people who were never taught it',
  sub: 'Until It Happens walks someone with no security background through staying safe online, one calm step at a time. What to do now, what to avoid, and what to do next. Every claim is pinned to an official source.',
  meta: ['plain language', 'official sources', 'guided steps', 'shipped · live'],
  live: 'https://untilithappens.kuladeepmantri.com/',
}

export const INTRO = {
  paragraphs: [
    'Most security advice is written by people who already understand security, for people who already understand security. Everyone else gets scared, gets a wall of jargon, and closes the tab. The people who most need this are the ones the writing leaves behind.',
    'Until It Happens is my attempt at the opposite. It teaches cyber safety as a guided sequence, in plain words, with a calm tone on purpose. You always see the one thing to do right now, the thing to avoid, and the next step. No prior knowledge assumed, and nothing stated that is not backed by an official source like the FBI, the FTC, or CISA.',
  ],
}

// The four guided steps, from the live site.
export const STEPS = [
  { n: '01', title: 'Read what threat is active', time: '8 min' },
  { n: '02', title: 'Check what data is exposed', time: '12 min' },
  { n: '03', title: 'Harden your current device', time: '15 min' },
  { n: '04', title: 'Practice response habits', time: '10 min' },
]

export const HELP = {
  intro:
    'It also meets people at the worst moment, when something has already happened. Pick the situation, a suspicious message, an account that might be compromised, or just wanting prevention, and it opens the right response flow: what to preserve, who to report to, and the first-hour priorities. The reporting links go straight to the real channels, ReportFraud.ftc.gov, IC3.gov, and CISA.',
}

export const CLOSE = {
  paragraphs: [
    'Getting a non-technical person from scared to steady, without lying to them and without drowning them, is the whole design problem. Every claim is dated and linked to its source, so the advice ages honestly instead of hardening into folklore.',
    'It is written for the person most security advice leaves behind, and it meets them in plain language at the moment they actually need it.',
  ],
}

export const SECTIONS = [
  { id: 'what', label: 'What it is' },
  { id: 'steps', label: 'The journey' },
  { id: 'help', label: 'If it happened' },
  { id: 'close', label: 'Who it is for' },
]
