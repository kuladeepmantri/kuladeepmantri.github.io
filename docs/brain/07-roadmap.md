# Roadmap

Ordered by what most moves the SPAR application forward. Dates assume the Fall
2026 window (mentee applications open **July 28, 2026**).

## 1. Make the dual claim true, not just stated (highest leverage)

The site reads dual, but the *evidence* today leans security. Two artifacts turn
the AI half from asserted into demonstrated. Both are mostly surfacing work that
already exists.

- **Local-LLM / fine-tune / RAG bench.** Document the real work with real numbers:
  exact base models + runtime (Ollama? llama.cpp / MLX / vLLM?), hardware and
  quantization, one before/after fine-tune metric from his own eval script, and
  one RAG retrieval failure actually hit.
- **A trusted-monitoring toy (build it).** A cheap local model classifying a bigger
  model's output for one behavior (jailbreak attempts / injected instructions /
  refusals), with an eval script that prints caught/missed and one logged example
  of the monitor being fooled. ~1 weekend. This is the single artifact that
  converts the AI-control angle from borrowed vocabulary into a built thing.

When these exist, add them as `signals.ts` entries (using `article[]` blocks +
the fallback `AppDetail`, or full immersive pages), and slot them into the home
log at `featureRank` 2 and 5. **Ship only with real numbers — never `[slot]`
text.**

## 2. Specifics still needed from Deepu (to fill copy / entries)

- Local models, fine-tune, RAG, NLP task details (as above).
- **Kintsugi:** what does its "sentiment" actually run (Apple NaturalLanguage /
  CoreML / heuristics)? This gates whether an on-device-NLP line is honest.
- **Auris `enforce`:** confirm from the C source what it does (register rewrite /
  errno / block) before any specific mechanism claim.
- **Kubereach:** one concrete reachable-blast-radius finding to state publicly
  (e.g. "S3 read allowed, IAM list denied").
- **Azure Government:** anything releasable, else keep it vague / omit.
- **Literature grounding:** has he read/reproduced the AI-control paper or RAND
  "Securing AI Model Weights"? Belongs in application answers, not site copy.
- **Availability:** hours/week Sept 14 - Dec 14.

## 3. UX items deferred pending review

From [06-ux-audit.md](06-ux-audit.md) "deferred": phone diagram portrait variants
(auris/kintsugi/deid), hoisting lenis site-wide, route view-transitions,
typography/rhythm standardization, arrow-key behavior, dark `--text-muted`
contrast, doubled footer divider, kintsugi video poster, theme-color sync. Each is
either a felt/visible change or needs a device/build check — walk through them with
Deepu before shipping.

## 4. Before each push to a live gate

- `npm run lint` and `npm run build` green.
- `npm run dev`, eyeball in both themes and at a phone width.
- Run `humanizer` on any changed public copy.
- Sanity-check every claim against the honesty rules
  ([04-spar-positioning.md](04-spar-positioning.md)) — nothing invented, nothing
  self-deprecating.

## 5. Application logistics (not site work, but adjacent)

- Apply to 6-10 SPAR projects, not 1-2 (acceptance scales with volume).
- Match each project's stated keywords in the application answers.
- Re-check the live SPAR project list around July 27-28 for the actual Fall 2026
  AI Security / agent-control mentors and their exact vocabulary.
