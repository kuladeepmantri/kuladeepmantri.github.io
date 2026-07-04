# Blueprint: kubereach

- **id:** KM-2026-0006
- **status:** active — leads with the two bets it proved; still being shaped (the shipped site reversed a planning-time "shelve" call)
- **tint:** rose (the reference)
- **depth:** full
- **links:** src only (getnullpkg/kubereach). No separate live URL — do not duplicate the repo link as a fake "live."
- **subdomain:** none

## What it actually is (honest)
A post-foothold Kubernetes recon idea: from one compromised pod and its token, work out what that identity can actually reach, then follow the trail out to the AWS account behind the cluster. It was designed, not built as a product: two throwaway Go spikes proved the two riskiest claims.

## What was proven (this is the substance — lead here)
- **S1 — the correctness bet.** Behind a webhook authorizer (the norm on EKS/GKE/AKS), `SelfSubjectRulesReview` under-reports: it flags itself incomplete and misses webhook-granted access, while `SelfSubjectAccessReview` and the real API call agree. Proven on a real kind cluster wired with a webhook authorizer. Shown as a red diff between the three "lenses."
- **S2 — the pivot bet.** A projected IRSA token stolen from an EKS pod was redeemed off-box against real AWS STS (`AssumeRoleWithWebIdentity`, anonymous creds so it isn't SigV4-signed) for live temporary credentials. End-to-end container-to-cloud pivot, confirmed against real AWS, not just localstack.

## Why it's being reshaped, not expanded as-is (honest)
- k8scout (March 2026, MIT, single Go binary) already ships the same differentiators.
- The flagship cloud-pivot demo leans on IRSA, which is aging out as EKS Pod Identity (cluster-bound, not redeemable off-box) becomes default and node IMDS is closed by default.
- The partial-visibility engine is weakest exactly on the low-priv tokens you usually land with.
- So the plan is to lead with the durable correctness finding and push the parts that stay valuable, rather than expand the aging IRSA pivot.

## Page shape
Keep most of what the current immersive page already does well:
1. Eyebrow: kubereach · KM-2026-0006 · active.
2. Hero: "From one cracked room to the whole cloud account" + 3D cluster→cloud pivot scene (poster-first).
3. Intro: the one-room / one-stolen-key framing.
4. Band: the SAR vs SSRR comparison widget (keep).
5. Band: the attack-path / blast-radius widget (keep).
6. Band: the cluster wireframe diagram (keep desktop + portrait SVG).
7. The two proven bets, each with its real result.
8. Honest "so is it worth building" close and the shelve decision.

## 3D + diagrams
- Hero 3D: a cluster of pods with one compromised, a token traveling out to a cloud box. Lazy-load, Draco, poster fallback.
- Keep the existing hand-authored SVG cluster diagram and the motion-path token dots.

## Copy notes
- Voice already matches the target (first person, plain, honest). Copy lives in `app/apps/kubereach/content.ts`, framed as active and leading with the "what I proved" bets.
