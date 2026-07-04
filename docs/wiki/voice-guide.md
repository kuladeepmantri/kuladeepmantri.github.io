# Voice guide

One voice across the whole site. Right now every project reads differently: kubereach is a first-person narrative, rune is a spec dump, auris is a catalog line, the rest are short blurbs. Unify all of it to the kubereach voice.

## The voice
First person. Short declarative sentences. Plain words. Honest about what is proven and what is not. Technically deep, but never showing off. It should sound like Kuladeep explaining his own work to a sharp friend, not a press release.

Reference lines (from the current kubereach copy):
> "You get a shell in one container. That is the whole starting position."

> "It changed the question I was asking, from 'can I build this' (clearly yes) to 'is any of it actually real, or does it just read well in a README?'"

> "As a race to ship a slightly better version of a thing that already exists, it is not worth a month of my life, and pretending otherwise would just waste that month."

## Do
- Lead with what actually works or what was proven.
- Use concrete detail (a real number, a real command, a real failure) instead of adjectives.
- Admit limits plainly. "No product exists yet." "This is a two-day prototype." That honesty is the credibility.
- Keep a physical or plain-English metaphor when it clarifies, like kubereach's "one room in a building you can't see the rest of." Don't force one where it doesn't fit.
- Direct address ("you") is fine when walking through how something works.

## Don't
- No buzzwords, no "leverage / robust / seamless / cutting-edge / enterprise-grade."
- No rule-of-three lists for rhythm's sake.
- No em-dash overuse. No inflated symbolism. No vague "industry-leading" claims.
- No third-person spec-sheet voice ("A real-time diagnostic system that..."). Rewrite to first person.
- Don't oversell a prototype into a product.

## Per-project honesty notes
- **kubereach** — shelved. Lead with the two bets it proved, then be candid that no product was built and why it was shelved.
- **rune** — the repo is the case-study site about the car app; the app itself predates it. Say so.
- **auris** — one build session. Research prototype. Lead with the tracing engine, don't imply it's production.
- **shipcrew** — two-day prototype, built with Abhishek Manyam. Credit him explicitly for auth, the SQLite migration, onboarding, and the frontend redesign.
- **deid** — 2023, unmaintained. The "enterprise-grade" README was aspirational; the ML detection was never built. Say the real state.
- **kintsugi** — personal, in daily use, private. Honest that it's a personal app, not a product.

Run every shipped prose block through the `humanizer` skill before it lands.
