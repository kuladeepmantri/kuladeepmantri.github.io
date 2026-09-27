"use client";

import { useEffect, useRef } from "react";
import { TIMEZONE } from "@/lib/constants";
import { DAY, YEAR_DAYS, dailyHeat, fbm } from "@/lib/field";
import type { Source } from "../field";
import {
  colourTween,
  css,
  loop,
  openLeft,
  reduceMotion,
  trackPointer,
  vivid,
} from "./common";

const WEEKS = 52;
const M = 96; // samples along each ridge

const WEEK_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: TIMEZONE,
});

/**
 * Background 5: the last year as a ridgeline in perspective. One ridge per
 * week, oldest at the back; each ridge rises over the days that had activity.
 * The camera drifts, the pointer turns it, and hovering a ridge names its week.
 */
export function Ridges({
  palette,
  heat,
  sources,
}: {
  palette: string;
  heat: string | null;
  sources: Record<string, Source>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const want = useRef({ palette, heat });
  want.current = { palette, heat };

  useEffect(() => {
    const canvas = ref.current!;
    const tip = tipRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const reduce = reduceMotion();
    let W = 0;
    let H = 0;
    let key = want.current.palette;
    let heatKey: string | null | undefined;
    const colours = colourTween(vivid(key));
    const ptr = trackPointer();
    const now0 = Date.now();
    const start = now0 - YEAR_DAYS * DAY;
    // Per week: seven day counts, and the ridge heights (current and target).
    let weeks = new Float32Array(WEEKS * 7);
    const cur = new Float32Array(WEEKS * M);
    const goal = new Float32Array(WEEKS * M);
    let t = 0;
    let yaw = 0;

    function setHeat(k: string | null) {
      heatKey = k;
      const raw =
        k && sources[k]
          ? dailyHeat(sources[k].days, now0)
          : new Float32Array(YEAR_DAYS);
      weeks = raw.slice(YEAR_DAYS - WEEKS * 7);
      const peak = Math.max(1, ...weeks);
      for (let w = 0; w < WEEKS; w++)
        for (let s = 0; s < M; s++) {
          const x = s / (M - 1);
          let h = 0;
          for (let d = 0; d < 7; d++) {
            const n = weeks[w * 7 + d];
            if (!n) continue;
            const z = (x - (d + 0.5) / 7) * 7;
            h += Math.sqrt(n / peak) * Math.exp(-(z * z) / (2 * 0.5 * 0.5));
          }
          goal[w * M + s] = Math.min(1.3, h);
        }
      if (reduce) cur.set(goal);
    }

    function measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    measure();
    setHeat(want.current.heat);
    window.addEventListener("resize", measure);

    const stop = loop((dt) => {
      if (want.current.palette !== key) {
        key = want.current.palette;
        colours.set(vivid(key));
      }
      if (want.current.heat !== heatKey) setHeat(want.current.heat);
      colours.step(dt);
      if (!reduce) t += dt;
      ptr.ease(dt, 2.5);
      const k = Math.min(1, dt * 2.4);
      for (let i = 0; i < cur.length; i++) cur[i] += (goal[i] - cur[i]) * k;

      const [c0, c1, c2, c3] = colours.now();
      ctx.fillStyle = css(c0);
      ctx.fillRect(0, 0, W, H);

      const x0 = openLeft(W);
      const span = W - x0;
      const cx = W < 640 ? W / 2 : x0 + span * 0.52;
      const glow = ctx.createRadialGradient(
        cx,
        H * 0.55,
        0,
        cx,
        H * 0.55,
        Math.max(span, H) * 0.7,
      );
      glow.addColorStop(0, css(c1, 0.35));
      glow.addColorStop(1, css(c1, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Camera: drifts on its own, and turns toward the pointer.
      const wantYaw =
        0.22 * Math.sin(t * 0.06) + (ptr.p.on ? (ptr.p.sx / W - 0.5) * 0.5 : 0);
      yaw += (wantYaw - yaw) * Math.min(1, dt * 1.5);
      const pitch = 0.42 + (ptr.p.on ? (ptr.p.sy / H - 0.5) * 0.25 : 0);
      const cyaw = Math.cos(yaw);
      const syaw = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const width = 4.4;
      const depth = 4.2;
      const amp = 0.95;
      const focal = Math.min(span * 1.1, H * 1.4);
      const camZ = 5.4;
      const project = (X: number, Y: number, Z: number) => {
        const rx = X * cyaw - Z * syaw;
        const rz = X * syaw + Z * cyaw;
        const ry = Y * cp - rz * sp;
        const zz = Y * sp + rz * cp + camZ;
        return [cx + (rx / zz) * focal, H * 0.6 - (ry / zz) * focal] as const;
      };

      // Hover: the ridge whose line passes nearest the pointer.
      let hover = -1;
      let best = 14;

      const pts = new Float32Array(M * 2);
      ctx.lineJoin = "round";
      for (let w = 0; w < WEEKS; w++) {
        const Z = -depth / 2 + (w / (WEEKS - 1)) * depth;
        for (let s = 0; s < M; s++) {
          const x = s / (M - 1);
          const env = Math.sin(Math.PI * x) ** 0.6;
          const n = 0.035 * fbm(x * 7 + t * 0.15, w * 0.35, t * 0.05);
          const Y = (cur[w * M + s] * amp + n) * env;
          const [sx, sy] = project((x - 0.5) * width, Y, Z);
          pts[s * 2] = sx;
          pts[s * 2 + 1] = sy;
        }
        if (ptr.p.on) {
          const s = Math.round(
            ((ptr.p.sx - pts[0]) / (pts[(M - 1) * 2] - pts[0])) * (M - 1),
          );
          if (s >= 0 && s < M) {
            const d = Math.abs(pts[s * 2 + 1] - ptr.p.sy);
            if (d < best) {
              best = d;
              hover = w;
            }
          }
        }
        // Fill under the ridge so nearer ridges hide farther ones.
        const [bx0, by0] = project(-width / 2, 0, Z);
        const [bx1, by1] = project(width / 2, 0, Z);
        ctx.beginPath();
        ctx.moveTo(bx0, by0);
        for (let s = 0; s < M; s++) ctx.lineTo(pts[s * 2], pts[s * 2 + 1]);
        ctx.lineTo(bx1, by1);
        ctx.closePath();
        ctx.fillStyle = css(c0);
        ctx.fill();
        const near = w / (WEEKS - 1);
        ctx.beginPath();
        for (let s = 0; s < M; s++)
          ctx[s ? "lineTo" : "moveTo"](pts[s * 2], pts[s * 2 + 1]);
        ctx.strokeStyle = css(
          w === hover ? c2 : c3,
          w === hover ? 1 : 0.18 + 0.62 * near,
        );
        ctx.lineWidth = w === hover ? 1.8 : 1;
        ctx.stroke();
      }

      // Name the hovered week.
      const src = heatKey ? sources[heatKey] : null;
      if (hover >= 0 && src) {
        let total = 0;
        for (let d = 0; d < 7; d++) total += weeks[hover * 7 + d];
        const first =
          start + (YEAR_DAYS - WEEKS * 7 + hover * 7) * DAY + DAY / 2;
        tip.textContent = `Week of ${WEEK_FMT.format(first)} · ${total} ${src.noun[total === 1 ? 0 : 1]}`;
        tip.dataset.show = "true";
        tip.style.transform = `translate(${Math.min(ptr.p.x + 16, W - tip.offsetWidth - 12)}px, ${Math.max(12, ptr.p.y - 38)}px)`;
      } else tip.dataset.show = "false";
    });

    return () => {
      stop();
      ptr.stop();
      window.removeEventListener("resize", measure);
    };
  }, [sources]);

  return (
    <>
      <canvas ref={ref} className="field" aria-hidden="true" />
      <div
        ref={tipRef}
        className="field-tip"
        data-show="false"
        aria-hidden="true"
      />
    </>
  );
}
