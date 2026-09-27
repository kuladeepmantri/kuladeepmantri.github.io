"use client";

import { useEffect, useRef } from "react";
import { on } from "@/lib/bus";
import {
  colourTween,
  loop,
  openLeft,
  reduceMotion,
  shaderCanvas,
  trackPointer,
  vivid,
} from "./common";

// Domain-warped noise (fbm fed through itself twice) gives the flow. The same
// field is read as a height map: its slope makes a normal, which is lit like a
// sheet of satin, so the colour has folds and a moving sheen instead of flat blends.
const FRAG = `
uniform vec2 uRes; uniform float uT; uniform vec2 uPtr; uniform float uOn; uniform float uX0;
uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { s += a * vn(p); p = m * p; a *= 0.5; }
  return s;
}
float field(vec2 p, out vec2 q, out vec2 r){
  q = vec2(fbm(p + vec2(0.0, uT * 0.04)), fbm(p + vec2(5.2, 1.3) - uT * 0.035));
  r = vec2(fbm(p + 1.8 * q + vec2(1.7, 9.2) + uT * 0.025), fbm(p + 1.8 * q + vec2(8.3, 2.8) - uT * 0.02));
  return fbm(p + 1.6 * r);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y) * 0.62;
  vec2 pp = vec2(uPtr.x * asp, uPtr.y) * 0.62;
  vec2 d = p - pp;
  float fall = exp(-dot(d, d) * 14.0) * uOn;
  p += vec2(-d.y, d.x) * fall * 0.5;

  vec2 q, r, q2, r2;
  float f = field(p, q, r);
  float e = 0.02;
  float fx = field(p + vec2(e, 0.0), q2, r2);
  float fy = field(p + vec2(0.0, e), q2, r2);
  vec3 n = normalize(vec3((f - fx) / e * 0.55, (f - fy) / e * 0.55, 1.0));

  vec3 col = mix(c0, c1, smoothstep(0.3, 0.7, f));
  col = mix(col, c2, smoothstep(0.5, 0.75, r.y) * 0.95);
  col = mix(col, c3, smoothstep(0.58, 0.8, q.x) * smoothstep(0.4, 0.7, f) * 0.7);

  vec3 L = normalize(vec3(-0.45, 0.55, 0.75));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(n, normalize(L + vec3(0, 0, 1))), 0.0, 1.0), 22.0);
  float rim = pow(1.0 - n.z, 1.5);
  col *= 0.5 + 0.65 * diff;
  col += mix(c3, vec3(1.0), 0.4) * spec * 0.35 + c2 * rim * 0.35;

  // Quieter under the panes, fuller in the open part of the screen.
  float open = smoothstep(uX0 - 0.04, uX0 + 0.3, uv.x);
  col = mix(mix(c0, col, 0.35), col, open);
  col *= 1.0 - 0.45 * pow(length((uv - vec2(0.62, 0.5)) * vec2(1.0, 1.2)), 2.2);
  col += (h21(gl_FragCoord.xy + fract(uT * 7.0) * 91.0) - 0.5) * 0.03;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

/** Background 1: a lit, flowing gradient in the page's colours. */
export function Silk({ palette }: { palette: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const want = useRef(palette);
  want.current = palette;

  useEffect(() => {
    const s = shaderCanvas(ref.current!, FRAG, 0.5);
    if (!s) return;
    const reduce = reduceMotion();
    const colours = colourTween(vivid(want.current));
    let key = want.current;
    let t = 20;
    let surge = 0;
    const ptr = trackPointer();
    let on01 = 0;
    s.resize();
    window.addEventListener("resize", s.resize);
    const off = on("open", () => (surge = 1));
    const stop = loop((dt) => {
      if (want.current !== key) {
        key = want.current;
        colours.set(vivid(key));
        surge = 1;
      }
      colours.step(dt, 1.4);
      // A page change makes the flow surge briefly while the colours blend.
      surge = Math.max(0, surge - dt / 1.4);
      if (!reduce) t += dt * (1 + 5 * surge * surge);
      ptr.ease(dt, 3);
      on01 += ((ptr.p.on ? 1 : 0) - on01) * Math.min(1, dt * 2);
      const { W, H, w, h } = s.size();
      const [c0, c1, c2, c3] = colours.now();
      s.f2("uRes", w, h);
      s.f1("uT", t);
      s.f2("uPtr", ptr.p.sx / W, 1 - ptr.p.sy / H);
      s.f1("uOn", on01);
      s.f1("uX0", openLeft(W) / W);
      s.f3("c0", c0);
      s.f3("c1", c1);
      s.f3("c2", c2);
      s.f3("c3", c3);
      s.draw();
    });
    return () => {
      stop();
      off();
      ptr.stop();
      window.removeEventListener("resize", s.resize);
    };
  }, []);

  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
