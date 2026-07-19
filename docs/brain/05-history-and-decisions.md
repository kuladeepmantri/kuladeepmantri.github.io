# History and decisions

The point of this file: capture how the thinking evolved, and the mistakes made
and corrected, so nobody (including future me) repeats them.

## The arc

1. **Public lab redesign.** The site was rebuilt from an older portfolio into a
   dated, versioned "signal log": one source of truth (`signals.ts`), immersive
   per-project pages, the mono/paper aesthetic. Development-transparency and
   "prototype/unmaintained" hedging language was stripped in favor of confident,
   capability-focused framing.

2. **SPAR pivot.** The site was retargeted at an AI-safety fellowship application.
   Deep research went into SPAR (tracks, timeline, selection), the AI control /
   model-weight-security / multi-agent-safety literature, and an honest
   research-bridge for each existing project.

3. **The identity correction (important).** An early pass framed Kuladeep as a
   security engineer *moving toward* AI. He corrected it: he is genuinely dual —
   AI and security, equal — and does real AI/ML work (NLP, Ollama, fine-tuning,
   RAG, multi-agent). The framing shifted to dual, with AI security as the
   intersection.

4. **The tone correction (more important).** A pass then over-rotated the other
   way and produced copy that was blunt and self-deprecating: it announced what he
   *hadn't* done ("no published research yet," "no AI in this one," "the honest
   gap…"), dumped low-level jargon into the hero, and mislabeled him a "systems
   engineer." This was wrong and he called it out. The fixes:
   - Title reverted to **"cybersecurity engineer"**; AI lives in the work, not the
     label.
   - Hero restored to his clean, high-level voice with AI folded in; jargon
     removed.
   - Every "what I haven't done" line deleted. Every forced per-project AI-safety
     bridge sentence removed.
   - Codified the rule: **honest means don't inflate; it does not mean confess
     gaps on your own portfolio.** (See [04-spar-positioning.md](04-spar-positioning.md).)

5. **Design + UX polish.** Direction chosen: refine the existing aesthetic, not
   revamp it. Then a whole-site UX audit for coherence, navigation, mobile, and
   accessibility, followed by incremental fixes (see
   [06-ux-audit.md](06-ux-audit.md)).

## Standing decisions

- **Voice:** plain, direct, professional, confident. No em dashes, no rule-of-three
  cadence, no hype adjectives, no self-deprecation. Lowercase for kickers/labels;
  sentence case for body prose (the site's body copy is sentence case — match it).
- **Balance is shown, not announced.** Never state a ratio ("50/50", "I care about
  both equally"); let project ordering and the work carry it. Announcing parity the
  page can't back reads as insecurity.
- **Email:** `mantrikuladeep@gmail.com` (matches the application).
- **Rune stays the 2026 Honda Accord** — that's what it was actually built on;
  it's the accurate historical fact, not the car currently driven.
- **Certifications (CEH) stay off** the home and focus surfaces to avoid the
  compliance-guy read.
- **New AI project entries ship only with real numbers.** No placeholder/slot text
  on a live page — a reviewer who opens a padded entry trusts nothing after it.
- **Run `humanizer` on shipped public copy before it goes live.** These brain docs
  are internal and exempt; the site's public strings are not.

## What NOT to do again

- Do not reframe the whole site off one instruction given in frustration. Confirm
  the direction, show a concrete example, then roll out.
- Do not put "moving toward AI" or gap-confessions on the site.
- Do not attach an AI angle to a project that doesn't have one (e.g. forcing a
  car-diagnostics project into an AI-safety story) — it reads as reaching.
- Do not ship AI capability claims that the honest project facts don't support.
