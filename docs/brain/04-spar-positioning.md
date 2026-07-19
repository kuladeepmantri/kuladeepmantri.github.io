# SPAR positioning

## The goal

Convince a SPAR AI-safety mentor, in a 60-90 second skim, that Kuladeep can do
real research and belongs on an AI Security / AI control project. The audience is
researchers who spot a bluff in one sentence and then discount the whole page.

## The identity

A **cybersecurity engineer** who also builds AI. Equal weight, both real. The
label on the site is "cybersecurity engineer"; AI shows up in the *work*, not in
the job title. AI security is framed as the field where the security work and the
AI work are the same work. Explicitly **not**: "AI guy," "security-only guy," or
"GRC/NIST/compliance guy."

## The honesty rules (non-negotiable)

These govern all public copy. They came out of real mistakes (see
[05-history-and-decisions.md](05-history-and-decisions.md)).

1. **Do not fabricate.** No claimed AI/ML research, papers, or experience that
   didn't happen. No implying insider knowledge of how a frontier lab runs its
   infrastructure.
2. **Honest is not self-deprecating.** "Honest" means don't inflate. It does
   **not** mean confessing gaps on your own portfolio. No "no published research
   yet," no "no AI in this one," no "the honest gap is…" lines. A portfolio states
   what things *are*, confidently.
3. **Specificity over claims.** Name the actual model, the actual metric, the
   actual finding. SPAR's own advice page rewards this; "I have ML experience" is
   worthless, "fine-tuned [model] and measured [before]→[after]" lands.
4. **Terminology used correctly, or not at all.** Using "AI control" loosely is
   worse than not using it. Never use "alignment" as a synonym for "control."
5. **No hero jargon.** Low-level terms (ARM64, syscall, Kubernetes lateral
   movement) belong on project pages, not in the hero. The hero stays high-level
   and professional.

## What each surface says now

- **Hero (`masthead.tsx`):** kicker "cybersecurity engineer"; one line — "I
  understand how applications, cloud, infrastructure, and the AI systems built on
  top of them are designed, where they run, what they trust, and how they fail,
  then build security that fits." Clean, dual, no jargon.
- **Focus block (`direction.tsx`):** one confident sentence naming the current
  research focus — securing model weights and training infrastructure, runtime
  monitoring of agents, oversight of multi-agent systems — as where the security
  and AI work meet.
- **whoami (`about/page.tsx`):** the existing narrative, with AI woven into the
  learning arc (running/fine-tuning open-weight models, multi-agent systems) and a
  closing forward line ("the thing I most want to take apart is AI systems and the
  infrastructure that holds them").
- **Metadata:** title "Kuladeep Mantri · cybersecurity engineer"; description
  covers both sides.
- **Project pages:** clean and confident. The forced per-project "AI-safety
  bridge" sentences that were tried and removed are **not** to be reintroduced.
- **Email:** `mantrikuladeep@gmail.com`, matching the SPAR application (was
  `kuladeepbmantri@gmail.com`).

## Research landscape (for correct, non-bluffing copy)

Verified terminology the copy can lean on:
- **AI control (Redwood):** a system is "controlled" if an AI can't cause damage
  even if egregiously misaligned; control measures capability to subvert, not
  inclination. Vocabulary: trusted vs untrusted models, trusted/untrusted
  monitoring, control evaluations.
- **Model-weight security:** RAND "Securing AI Model Weights" (security levels
  SL1-SL5; ~38 attack vectors — insider, cloud misconfig, credential/token theft,
  lateral movement, exfiltration). Anthropic ASL-3 controls (two-party
  authorization for weight access, egress bandwidth controls, lateral-movement
  containment). Do not conflate ASL levels with RAND SL levels.
- **The honest bridge:** Kubernetes/cloud security maps to weight security via
  "the same containment, lateral-movement, and egress principles labs describe" —
  never "labs use Kubernetes."
- **Multi-agent safety:** collusion-resistant monitoring, oversight, control of
  untrusted agents — an active, not-yet-canonical area.

Keep specific external citations (arXiv ids, conference names) **out of site
copy** — one wrong id ends the read. They belong in application answers.

## SPAR facts

Run by Kairos (US 501(c)(3)). Six tracks; AI Safety and AI Security are separate —
do not blur them. Fall 2026: mentee applications July 28 - Aug 18, decisions
Sept 4, research Sept 14 - Dec 14. Applying to 6-10 projects markedly raises
acceptance odds over 1-2. Mentors may use a short interview or trial task.
