# Blueprint: kintsugi

- **id:** KM-2026-0004
- **status:** personal, in daily use (private)
- **tint:** soft gold (gentle, matches the recovery theme)
- **depth:** medium
- **links:** none — no repo link, it's a private personal app. Be honest that it's personal, not a product.
- **subdomain:** none

## What it actually is (honest)
An on-device iPhone recovery tracker: streaks, journaling, a panic/urge-surfing mode, achievements. Swift 6 (strict concurrency), SwiftUI with iOS 26 Liquid Glass, SwiftData for on-device storage. MV architecture (no view-model layer). 100% on device, single user, no analytics, no third-party services.

Honest scope: personal software, built for himself, actively used. The most developed of the projects by commit count (235 commits, Feb–Mar 2026), but it's private and personal by design.

## Page shape
1. Eyebrow: kintsugi · personal, in use.
2. Hero: a soft-gold phone / Liquid-Glass streak visual (poster-first). Calmer than the other heroes.
3. What it does and why it's personal: streaks, journaling with on-device sentiment, panic mode.
4. Band: the data-safety story — triple-redundant backup (Keychain + JSON on background + optional GitHub), all on device.
5. Band: the panic mode / urge-surfing wave timer (the scientific "envelope" idea).
6. Honest, understated close: it's a private tool that does its job for him.

## 3D + diagrams
- Hero 3D: gentle, gold, phone-centric. Keep it soft, not flashy — the subject is sensitive.
- Wireframe: the on-device data flow (Keychain / SwiftData / backups), desktop + portrait.

## Copy notes
- Handle with care and restraint. This is a recovery app. First person, quiet, honest. No dramatization, no oversharing.
- Emphasize the engineering choices (on-device, privacy, redundancy) without turning the personal subject into a pitch.
