# Blueprint: deid (DeID-Anonymizer)

- **id:** new — assign next KM id; dateFirst 2023-04-26 (oldest project)
- **status:** 2023 prototype, unmaintained
- **tint:** TBD (pick a warm-family tint during build)
- **depth:** short
- **links:** src only
- **subdomain:** none

## What it actually is (honest)
A PII/PHI de-identification platform: it detects sensitive data in text and files and masks, tokenizes, or anonymizes it by policy, with a REST API, background batch jobs, and a React UI. Backend is FastAPI + Celery + Redis + PostgreSQL + MinIO; frontend is React + Vite + MUI.

Honest scope, and this matters: it's the oldest project (first commit April 2023) and unmaintained. The README frames it as "enterprise-grade," but that's aspirational. In reality the detection is rule/policy-driven (regex-class); the AI/ML NER (spaCy/Presidio) was only ever a roadmap item behind a feature flag and was never built. One backend test. Present it as an early prototype from 2023, not a finished platform.

## Page shape (keep it short)
1. Eyebrow: deid · 2023 prototype, unmaintained.
2. Hero: a simple de-identification visual — text with PII getting masked (poster-first, lighter than the flagships).
3. One honest paragraph on what it does and how (policy-driven de-id, batch jobs, object storage).
4. Small band: the architecture (FastAPI routers, Celery worker, MinIO storage).
5. Honest note: oldest thing here, ML detection never shipped, left as-is.

## 3D + diagrams
- Keep 3D minimal — a light hero is enough at this depth.
- One wireframe of the request → queue → worker → storage flow.

## Copy notes
- Short and plain. The honesty (2023, unmaintained, ML never built) is the point and is more credible than propping it up.
- Don't repeat the "enterprise-grade" README language.
