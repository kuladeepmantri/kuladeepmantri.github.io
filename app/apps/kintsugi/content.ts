// Single source for the kintsugi page. A private, on-device iOS app I use daily.
// Quiet and restrained: the subject is personal, the writeup stays on the
// engineering. Facts verified against the repo.

export const HERO = {
  eyebrow: 'kintsugi · KM-2026-0004 · personal, in use',
  headline: 'A recovery tracker that never leaves the phone',
  sub: 'Kintsugi is a personal iOS app I built for myself and use every day. Streaks, journaling, and a mode for riding out a hard moment. All of it on device, single user, no accounts and no analytics. It is named for the Japanese repair that mends a break with gold.',
  meta: ['Swift 6', 'SwiftUI · iOS 26', 'SwiftData', 'on device'],
}

export const INTRO = {
  paragraphs: [
    'This is the one project here I did not build to show anyone. I built it because I wanted it, and the design follows from that. It is for one person, it runs entirely on the phone, and nothing about me leaves the device unless I explicitly send it somewhere I own.',
    'That constraint shaped every technical choice. There is no account to make, no server to trust, no analytics counting anything. The only network call in the whole app is an optional backup to a private GitHub repo, and even that only happens if I turn it on.',
  ],
}

export const PRIVACY = {
  intro:
    'The interesting engineering is in keeping the data both safe and private at the same time, which usually pull against each other. Kintsugi does it with three layers of backup that all stay on device or in a repo I own.',
  layers: [
    {
      tag: 'keychain',
      text: 'The one value that must never be lost, the date a streak began, lives in the Keychain, because Keychain entries survive even a full uninstall.',
    },
    {
      tag: 'json snapshot',
      text: 'Every time the app goes to the background it writes a full snapshot to disk with a SHA256 hash, and keeps the previous one as a fallback. On import it verifies the hash before trusting the file.',
    },
    {
      tag: 'optional github',
      text: 'If I want off-device redundancy, it can push an encrypted backup to a private repo over the GitHub Contents API, skipping the write when nothing changed.',
    },
  ],
  note: 'No HealthKit, no CloudKit, no CoreML, no third-party SDK. The sentiment scoring on journal entries runs on Apple\'s on-device NaturalLanguage framework, so even the analysis of what I write stays on the phone.',
}

export const PANIC = {
  intro:
    'The mode I am most careful about is the one for a hard moment. There are two. One is a three-level escalation for a crisis, from box breathing up through personal anchors. The other is urge surfing.',
  surf: 'Urge surfing is a fifteen-minute timer, but the visual is not a countdown. It is a wave whose height follows an envelope that rises, crests around the two-thirds mark, and falls, because that is the shape an urge actually has. You watch it build and pass instead of fighting it. The math on screen mirrors the thing you are riding out.',
}

export const CLOSE = {
  paragraphs: [
    'Built in Swift 6 with the strictest concurrency checking on and the newest SwiftUI. It is private on purpose. There is no repo to link and no live site, because it holds my own data and only ever needed to work for one person.',
    'It does that. It has for months.',
  ],
}

export const SECTIONS = [
  { id: 'what', label: 'What it is' },
  { id: 'privacy', label: 'On device' },
  { id: 'panic', label: 'A hard moment' },
  { id: 'close', label: 'Private on purpose' },
]
