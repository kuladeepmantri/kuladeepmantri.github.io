"use client";

import { useEffect, useRef } from "react";
import {
  colourTween,
  css,
  loop,
  mix,
  openLeft,
  reduceMotion,
  trackPointer,
  vivid,
  type RGB,
} from "./common";

const N = 8; // circles in the chain

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const lift = (c: RGB, k: number): RGB => mix(c, [1, 1, 1], k);

/** Rotates a colour's hue by `deg`, keeping its lightness and saturation. */
function hue(c: RGB, deg: number): RGB {
  const [r, g, b] = c;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return c;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h =
    max === r
      ? ((g - b) / d) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  h = (h * 60 + deg + 360) % 360;
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  const [a, e, f] =
    h < 60
      ? [C, X, 0]
      : h < 120
        ? [X, C, 0]
        : h < 180
          ? [0, C, X]
          : h < 240
            ? [0, X, C]
            : h < 300
              ? [X, 0, C]
              : [C, 0, X];
  return [a + m, e + m, f + m];
}
const sink = (c: RGB, k: number): RGB => mix(c, [0, 0, 0], k);

/**
 * Background 3: two colour fields split by a seam, and a chain of translucent
 * circles arcing across it. Each circle takes a different gradient on either
 * side of the seam, and they mix where they overlap. A page change sweeps the
 * chain out again along a new arc.
 */
export function Orbit({ palette }: { palette: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const want = useRef(palette);
  want.current = palette;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const reduce = reduceMotion();
    let W = 0;
    let H = 0;
    let key = want.current;
    const colours = colourTween(vivid(key));
    const ptr = trackPointer();
    let t = 0;
    let sweep = reduce ? 1 : 0; // 0 to 1: how far the chain has run out along its arc
    // The arc: its turn (radians) and seam position, eased toward each page's own.
    const arc = { turn: 0, seam: 0.42 };
    const target = { turn: 0, seam: 0.42 };
    const setTarget = (k: string) => {
      const h = hash(k);
      target.turn = (h - 0.5) * 1.4;
      target.seam = 0.3 + 0.25 * hash(`${k}s`);
    };
    setTarget(key);
    arc.turn = target.turn;
    arc.seam = target.seam;

    // Film grain, drawn once and laid over every frame.
    const grain = document.createElement("canvas");
    grain.width = grain.height = 256;
    const g = grain.getContext("2d")!;
    const gd = g.createImageData(256, 256);
    for (let i = 0; i < gd.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v;
      gd.data[i + 3] = 255;
    }
    g.putImageData(gd, 0, 0);
    let grainPattern: CanvasPattern | null = null;

    function measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grainPattern = ctx.createPattern(grain, "repeat");
    }
    measure();
    window.addEventListener("resize", measure);

    const stop = loop((dt) => {
      if (want.current !== key) {
        key = want.current;
        colours.set(vivid(key));
        setTarget(key);
        if (!reduce) sweep = 0;
      }
      colours.step(dt, 1.1);
      if (!reduce) t += dt;
      sweep = Math.min(1, sweep + dt / 1.6);
      arc.turn += (target.turn - arc.turn) * Math.min(1, dt * 2.2);
      arc.seam += (target.seam - arc.seam) * Math.min(1, dt * 2.2);
      ptr.ease(dt, 2);

      const [c0, c1, c2, c3] = colours.now();
      const x0 = openLeft(W);
      const seam = x0 + (W - x0) * arc.seam;

      // Left field: a warm horizontal band. Right field: a cool diagonal.
      const gl = ctx.createLinearGradient(0, 0, seam, 0);
      gl.addColorStop(0, css(mix(c2, c3, 0.15)));
      gl.addColorStop(0.45, css(lift(c2, 0.22)));
      gl.addColorStop(1, css(mix(c2, c1, 0.35)));
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, seam, H);
      const gr = ctx.createLinearGradient(seam, H, W, 0);
      gr.addColorStop(0, css(sink(c1, 0.25)));
      gr.addColorStop(0.55, css(lift(c1, 0.18)));
      gr.addColorStop(1, css(sink(c1, 0.1)));
      ctx.fillStyle = gr;
      ctx.fillRect(seam, 0, W - seam, H);

      // The chain: circles growing along an arc that turns slowly.
      const span = W - x0;
      const px = ptr.p.on ? (ptr.p.sx / W - 0.5) * 40 : 0;
      const py = ptr.p.on ? (ptr.p.sy / H - 0.5) * 30 : 0;
      const acx = x0 + span * 0.62 + px;
      const acy = H * 0.98 + py;
      const AR = Math.min(span * 0.62, H * 0.78);
      const wob = Math.sin(t * 0.12) * 0.18;
      const a0 = -Math.PI * 0.95 + arc.turn * 0.4 + wob;
      const a1 = -Math.PI * 0.18 + arc.turn * 0.4 + wob;
      const rMax = Math.min(H * 0.27, span * 0.2);
      const circles: { x: number; y: number; r: number }[] = [];
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1);
        const on = Math.min(1, Math.max(0, sweep * (N + 2) - i * 1.1));
        if (on <= 0) continue;
        const a = a0 + (a1 - a0) * f * (0.7 + 0.3 * on);
        const breathe = 1 + 0.03 * Math.sin(t * 0.7 + i);
        circles.push({
          x: acx + Math.cos(a) * AR,
          y: acy + Math.sin(a) * AR * 0.9,
          r:
            rMax *
            (0.12 + 0.88 * Math.pow(f, 1.1)) *
            breathe *
            (0.3 + 0.7 * on),
        });
      }

      const drawSide = (x: number, w: number, stops: RGB[]) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, 0, w, H);
        ctx.clip();
        ctx.globalCompositeOperation = "hard-light";
        for (const c of circles) {
          const grd = ctx.createLinearGradient(c.x - c.r, 0, c.x + c.r, 0);
          stops.forEach((s, i) =>
            grd.addColorStop(i / (stops.length - 1), css(s)),
          );
          ctx.globalAlpha = 0.82;
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      const warm = hue(c2, 150);
      const hot = hue(c2, 115);
      drawSide(seam, W - seam, [
        sink(hue(c2, 190), 0.55),
        sink(warm, 0.2),
        hot,
        lift(hue(c3, 140), 0.1),
      ]);
      drawSide(0, seam, [lift(c2, 0.25), sink(c1, 0.2), sink(c1, 0.55), c2]);

      // Grain, and a darker field behind the panes so they sit on it cleanly.
      if (grainPattern) {
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = 0.09;
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (x0 > 0) {
        const shade = ctx.createLinearGradient(0, 0, x0 + 80, 0);
        shade.addColorStop(0, css(c0, 0.55));
        shade.addColorStop(1, css(c0, 0));
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, x0 + 80, H);
      }
    });

    return () => {
      stop();
      ptr.stop();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
