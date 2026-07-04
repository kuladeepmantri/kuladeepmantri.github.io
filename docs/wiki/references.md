# References

Source material and reusable prior art for the build.

## Reference implementation (in this repo)
- **The kubereach page is the gold standard.** `components/apps/kubereach/` + `app/apps/kubereach/content.ts`. It already has: the full-bleed band pattern (`ml-[calc(-50vw+50%)] w-screen`), hand-authored SVG wireframe diagrams with desktop + portrait variants, reveal-on-scroll motion, smooth scroll (now shared in `components/ui/smooth-scroll.tsx`), and clean copy/data separation. Everything else on the site should rise to match it.

## External project sources (for blueprint facts)
- kubereach — `/Users/kmantri/workstation/projects/sites/kubereach` (Go spikes, shelved)
- rune — `/Users/kmantri/workstation/projects/sites/rune` (Next.js case-study site, R3F Honda model to reuse)
- auris — `/Users/kmantri/workstation/projects/sites/Auris` (C/CMake ARM64 syscall tracer)
- shipcrew — `/Users/kmantri/Local Machine/shipcrew` (TS monorepo, built with Abhishek Manyam)
- kintsugi — `/Users/kmantri/workstation/projects/sites/kintsugi` (Swift/SwiftUI iOS app)
- deid — `/Users/kmantri/Local Machine/DeID-Anonymizer` (FastAPI/Celery, 2023)

## People
- Abhishek Manyam — https://www.abhishekmanyam.com/ — collaborator on shipcrew.

## Live subdomains
- rune.kuladeepmantri.com
- auris.kuladeepmantri.com
- untilithappens.kuladeepmantri.com

## 3D / performance
- React Three Fiber + drei `useGLTF` with Draco/meshopt.
- `next/dynamic({ ssr: false })` + IntersectionObserver for lazy scene mount.
- Blender → compressed glTF + a hero poster PNG per project.
- rune's static-export R3F setup is the working template to copy.
