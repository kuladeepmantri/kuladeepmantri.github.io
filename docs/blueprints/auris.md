# Blueprint: auris

- **id:** KM-2024-0002 (note: git first commit is 2025-12-05 — reconcile the id/date during build)
- **status:** research prototype, one ~5-hour build session
- **tint:** ember (deeper orange-red)
- **depth:** full
- **links:** live + src (kuladeepmantri/auris)
- **subdomain:** auris.kuladeepmantri.com

## What it actually is (honest)
An ARM64 Linux syscall tracer and behavioral analyzer. It uses ptrace to intercept every syscall a program makes, builds behavioral profiles, detects anomalies against a baseline, and can generate and enforce syscall policies. A v2 adds an offensive toolkit (process injection, ROP gadget finder). Written in C, CMake build, Apache-2.0, userspace only, no kernel modules.

Honest scope: it was built in a single sitting (28 commits, one ~5-hour session, Dec 5–6 2025). It's research-grade, not production. Lead with the tracing engine, which is the real work.

## Page shape
1. Eyebrow: auris · status: research prototype.
2. "open live site" callout → auris.kuladeepmantri.com.
3. Hero: 3D of syscalls flowing from a traced process into the analyzer (poster-first).
4. The modes, plainly: learn, profile, compare, policy, enforce, analyze.
5. Band: an activity-graph visualization (process/file/network) with the anomaly-vs-baseline idea.
6. Band: how ptrace interception works (wireframe: target process → tracer → metadata).
7. Honest note on the offensive v2 and that this is a one-session research build.

## 3D + diagrams
- Hero 3D: syscall stream / activity graph.
- Wireframe: the ptrace intercept loop and the learn→profile→compare→enforce flow (desktop + portrait).

## Copy notes
- Rewrite the current catalog line ("Covers both defense and offense...") into first-person narrative. Explain what ptrace lets you see and why behavioral profiling is the interesting part.
- Don't imply production hardening. It's a sharp prototype; say so.
