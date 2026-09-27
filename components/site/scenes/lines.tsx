"use client";

import { useEffect, useRef } from "react";
import { fbm } from "@/lib/field";
import {
  colourTween,
  loop,
  openLeft,
  reduceMotion,
  trackPointer,
  vivid,
} from "./common";

// One animal per page, drawn from the system's emoji artwork and re-printed as
// a line screen: vertical lines whose width follows the brightness underneath.
const ANIMALS: Record<string, string> = {
  home: "🦁",
  about: "🦉",
  github: "🐙",
  x: "🦅",
  contact: "🕊️",
  kubereach: "🐳",
  rune: "🐎",
  shipcrew: "🐝",
  kintsugi: "🐢",
  auris: "🦇",
  untilithappens: "🐕",
  deid: "🦎",
};

const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

type Animal = { size: number; v: Float32Array; age: number; leaving: number };

function sampleAnimal(glyph: string, size: number): Animal {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `${Math.round(size * 0.82)}px ${EMOJI_FONT}`;
  x.fillText(glyph, size / 2, size * 0.54);
  const d = x.getImageData(0, 0, size, size).data;
  const v = new Float32Array(size * size);
  for (let i = 0; i < v.length; i++) {
    const a = d[i * 4 + 3] / 255;
    const l =
      (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) / 255;
    v[i] = a < 0.2 ? -1 : a * (0.12 + 0.95 * Math.pow(l, 0.85));
  }
  return { size, v, age: 0, leaving: 0 };
}

/** Background 2: a line-screen animal per page, standing in a line-screen landscape. */
export function Lines({ palette }: { palette: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const want = useRef(palette);
  want.current = palette;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const reduce = reduceMotion();
    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d")!;
    let img: ImageData | null = null;
    let px: Uint32Array | null = null;
    let W = 0;
    let H = 0;
    let P = 6; // column pitch
    const R = 3; // cell height
    let cols = 0;
    let rows = 0;
    let widths = new Uint8Array(0);
    let shift = new Float32Array(0);
    let inkOf = new Uint8Array(0);
    let texture = new Float32Array(0); // ground grain, fixed per cell
    let backY = new Float32Array(0);
    let frontY = new Float32Array(0);
    let key = want.current;
    const colours = colourTween(vivid(key));
    let animals: { a: Animal; glyph: string }[] = [];
    let t = 0;
    const ptr = trackPointer();

    function animalSize() {
      const x0 = openLeft(W);
      return Math.round(Math.min(H * 0.62, (W - x0) * 0.62, 560));
    }

    function measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      P = W < 640 ? 5 : 6;
      cols = Math.ceil(W / P);
      rows = Math.ceil(H / R);
      widths = new Uint8Array(cols * rows);
      shift = new Float32Array(cols * rows);
      inkOf = new Uint8Array(cols * rows);
      backY = new Float32Array(cols);
      frontY = new Float32Array(cols);
      texture = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          texture[r * cols + c] = fbm(c * P * 0.01, r * R * 0.02, 0.5);
      buf.width = W;
      buf.height = H;
      img = bctx.createImageData(W, H);
      px = new Uint32Array(img.data.buffer);
      const size = animalSize();
      animals = animals.map(({ glyph, a }) => ({
        glyph,
        a: { ...sampleAnimal(glyph, size), age: a.age, leaving: a.leaving },
      }));
    }

    function arrive(k: string) {
      const glyph = ANIMALS[k] ?? ANIMALS.home;
      for (const x of animals) if (!x.a.leaving) x.a.leaving = 0.0001;
      animals.push({ glyph, a: sampleAnimal(glyph, animalSize()) });
      if (reduce)
        animals = animals
          .slice(-1)
          .map((x) => ({ ...x, a: { ...x.a, age: 9 } }));
    }

    measure();
    arrive(key);
    window.addEventListener("resize", measure);

    const pack = (c: number[]) =>
      (255 << 24) |
      (Math.round(c[2] * 255) << 16) |
      (Math.round(c[1] * 255) << 8) |
      Math.round(c[0] * 255);

    const stop = loop((dt) => {
      if (want.current !== key) {
        key = want.current;
        colours.set(vivid(key));
        arrive(key);
      }
      colours.step(dt);
      if (!reduce) t += dt;
      ptr.ease(dt, 8);
      const [c0, , c2, c3] = colours.now();
      const bg = pack(c0);
      const inkLand = pack(c2.map((v, i) => v * 0.55 + c0[i] * 0.45));
      const inkAnimal = pack(c3);

      const x0 = openLeft(W);
      const cx = W < 640 ? W / 2 : x0 + (W - x0) * 0.52;
      const ground = H * 0.7;

      // Age the animals: the new one drips in from the top, the old one thins out.
      for (const x of animals) {
        x.a.age += dt;
        if (x.a.leaving) x.a.leaving += dt;
      }
      animals = animals.filter((x) => x.a.leaving < 0.7);

      // Two ridges of hills that drift slowly.
      for (let c = 0; c < cols; c++) {
        const x = c * P + P / 2;
        backY[c] = H * (0.5 + 0.1 * fbm(x * 0.0022 + t * 0.012, 3.1, 0.4));
        frontY[c] = H * (0.63 + 0.08 * fbm(x * 0.0035 - t * 0.018, 7.7, 1.3));
      }
      const breathe = 1 + 0.015 * Math.sin(t * 1.3);
      const bob = Math.sin(t * 0.9) * 3;

      // Landscape and animal, cell by cell.
      const pr = ptr.p.on ? 1 : 0;
      for (let r = 0; r < rows; r++) {
        const y = r * R + R / 2;
        for (let c = 0; c < cols; c++) {
          const x = c * P + P / 2;
          const i = r * cols + c;
          let b = 0;
          let ink = 0;
          if (y > frontY[c]) b = 0.3 + 0.26 * texture[i];
          else if (y > backY[c]) b = 0.16 + 0.12 * texture[i];

          for (const { a } of animals) {
            const S = a.size;
            const ax =
              cx - (S * breathe) / 2 + Math.sin(y * 0.02 + t * 1.6) * 1.5;
            const ay = ground - S * breathe * 0.92 + bob;
            const u = ((x - ax) / breathe) | 0;
            const v = ((y - ay) / breathe) | 0;
            if (u < 0 || v < 0 || u >= S || v >= S) continue;
            // Arrival: each column drips down, left to right from the pane edge.
            const colDelay = Math.abs(u / S - 0.5) * 0.5;
            const grow = Math.min(
              1,
              Math.max(0, (a.age - 0.25 - colDelay) / 0.9),
            );
            if (v / S > grow * grow * (3 - 2 * grow)) continue;
            const val = a.v[v * S + u];
            if (val < 0) continue;
            const fade = a.leaving ? Math.max(0, 1 - a.leaving / 0.6) : 1;
            b = val * fade;
            ink = 1;
          }

          // The pointer parts the lines around it.
          let s = 0;
          if (pr) {
            const dx = x - ptr.p.sx;
            const dy = y - ptr.p.sy;
            const d2 = dx * dx + dy * dy;
            if (d2 < 140 * 140) {
              const d = Math.sqrt(d2) || 1;
              s = (dx / d) * 16 * Math.exp(-d2 / (2 * 60 * 60));
              b *= 1 - 0.5 * Math.exp(-d2 / (2 * 40 * 40));
            }
          }
          widths[i] = Math.max(0, Math.min(P - 1, Math.round(b * P)));
          shift[i] = s;
          inkOf[i] = ink;
        }
      }

      const out = px!;
      out.fill(bg);
      for (let y = 0; y < H; y++) {
        const r = (y / R) | 0;
        const row = y * W;
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const w = widths[i];
          if (!w) continue;
          const start = Math.round(c * P + (P - w) / 2 + shift[i]);
          const ink = inkOf[i] ? inkAnimal : inkLand;
          for (let k = Math.max(0, start); k < Math.min(W, start + w); k++)
            out[row + k] = ink;
        }
      }
      bctx.putImageData(img!, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
    });

    return () => {
      stop();
      ptr.stop();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
