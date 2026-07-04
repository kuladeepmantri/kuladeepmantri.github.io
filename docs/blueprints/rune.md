# Blueprint: rune

- **id:** KM-2026-0005
- **status:** shipped, live
- **tint:** warm steel (cool contrast, still muted)
- **depth:** full
- **links:** live + src (kuladeepmantri/rune)
- **subdomain:** rune.kuladeepmantri.com

## What it actually is (honest)
Real-time diagnostics for a 2026 Honda Accord. A Raspberry Pi 4B in the armrest streams OBD-II data through three layers of health analysis (threshold checks, streaming anomaly detection, trend forecasting) to a React PWA on a dash-mounted phone.

One honest note: the repo at `sites/rune` is the case-study site about the app, not the car app's own source. The underlying app predates this repo. Say that plainly rather than implying the repo is the app.

## Page shape
1. Eyebrow: rune · KM-2026-0005 · shipped.
2. "open live site" callout near the top → rune.kuladeepmantri.com.
3. Hero: the Honda 3D model with health-zone overlays (poster-first).
4. The data path: Pi in the armrest → OBD-II → three analysis layers → phone.
5. Band: the anomaly-detection waveform with the adjustable threshold (reuse the existing canvas widget).
6. Band: the OBD-II-to-phone pipeline diagram (click-to-expand).
7. Honest engineering notes: the safety gate that validates every CAN command, Honda-specific PID work, why he keeps adding sensors.

## 3D + diagrams
- Reuse the existing React Three Fiber Honda model and health-zone overlays. This is the flagship 3D and it already works on a static export — copy the setup.
- Wireframe diagram for the data pipeline (desktop + portrait).

## Copy notes
- Rewrite from the current spec-dump third person into the first-person narrative voice. Lead with what it does in the car day to day, not a feature list.
- It's genuinely shipped and running; it can sound confident, just not markety.
