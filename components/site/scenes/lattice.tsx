"use client";

import { useEffect, useRef } from "react";
import {
  colourTween,
  loop,
  openLeft,
  reduceMotion,
  shaderCanvas,
  trackPointer,
  vivid,
} from "./common";

// A gyroid sheet (sin x cos y + sin y cos z + sin z cos x = 0, the minimal
// surface used for engineered lattices) cut to a sphere, found by sphere
// tracing its signed distance. Shading: diffuse, a specular highlight, a
// Fresnel term that brings in a thin-film sheen in the page's colours, and the
// glow accumulated by rays that pass close to the surface.
const FRAG = `
uniform vec2 uRes; uniform float uT; uniform vec2 uPtr; uniform float uCx; uniform float uSpin;
uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float map(vec3 p){
  p.xz *= rot(uSpin + uPtr.x * 0.7);
  p.yz *= rot(0.4 + uT * 0.04 + uPtr.y * 0.5);
  float sph = length(p) - 1.3;
  float sc = 3.1 + 0.2 * sin(uT * 0.25);
  vec3 q = p * sc;
  float g = abs(dot(sin(q), cos(q.zxy))) / sc - 0.03;
  return max(sph, g * 0.75);
}

vec3 normal(vec3 p){
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

void main(){
  vec2 uv = (gl_FragCoord.xy - vec2(uCx * uRes.x, 0.5 * uRes.y)) / uRes.y;
  vec3 ro = vec3(0.0, 0.0, 5.4);
  vec3 rd = normalize(vec3(uv, -1.7));
  float t = 0.0, d = 1.0, glow = 0.0;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t;
    d = map(p);
    glow += exp(-d * 22.0) * 0.010;
    if (d < 0.0012) { hit = true; break; }
    t += d * 0.85;
    if (t > 9.0) break;
  }

  vec2 s = gl_FragCoord.xy / uRes;
  vec3 col = c0 + c1 * 0.22 * exp(-2.6 * length(uv)) + c2 * 0.05 * exp(-6.0 * length(uv - vec2(0.3, 0.25)));
  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = normal(p);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    float film = 0.5 + 0.5 * cos(6.2831 * (fres * 1.4 + dot(n, vec3(0.3, 0.5, 0.2)) + uT * 0.03));
    vec3 sheen = mix(c2, c3, film);
    vec3 L = normalize(vec3(0.55, 0.7, 0.45));
    float dif = clamp(dot(n, L), 0.0, 1.0);
    float spec = pow(clamp(dot(reflect(rd, n), L), 0.0, 1.0), 48.0);
    float ao = clamp(map(p + n * 0.09) / 0.09, 0.0, 1.0);
    vec3 base = mix(c1, c2, 0.5 + 0.5 * n.y);
    col = base * (0.12 + 0.55 * dif) * (0.35 + 0.65 * ao) + sheen * fres * 0.95 + spec * mix(c3, vec3(1.0), 0.5) * 0.7;
    col = mix(col, c0, smoothstep(4.2, 6.4, t) * 0.7);
  }
  col += glow * mix(c2, c3, 0.3) * 0.55;
  col *= 1.0 - 0.3 * pow(length((s - vec2(uCx, 0.5)) * vec2(1.2, 1.0)), 2.0);
  col += (h21(gl_FragCoord.xy + fract(uT * 7.0) * 91.0) - 0.5) * 0.025;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

/** Background 4: a slowly turning gyroid lattice, lit, in the page's colours. */
export function Lattice({ palette }: { palette: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const want = useRef(palette);
  want.current = palette;

  useEffect(() => {
    const s = shaderCanvas(ref.current!, FRAG, 0.5);
    if (!s) return;
    const reduce = reduceMotion();
    let key = want.current;
    const colours = colourTween(vivid(key));
    const ptr = trackPointer();
    let t = 0;
    let spin = 0.6;
    let kick = 0;
    let cx = 0.6;
    let tilt = { x: 0, y: 0 };
    s.resize();
    window.addEventListener("resize", s.resize);
    const stop = loop((dt) => {
      if (want.current !== key) {
        key = want.current;
        colours.set(vivid(key));
        kick = 1;
      }
      colours.step(dt, 1.2);
      if (!reduce) {
        t += dt;
        // A page change gives it a half turn that eases out.
        spin += dt * (0.12 + 2.6 * kick * kick);
      }
      kick = Math.max(0, kick - dt / 1.3);
      ptr.ease(dt, 2);
      const { W, H, w, h } = s.size();
      const x0 = openLeft(W);
      const wantCx = W < 640 ? 0.5 : (x0 + (W - x0) * 0.5) / W;
      cx += (wantCx - cx) * Math.min(1, dt * 3);
      const tx = ptr.p.on ? ptr.p.sx / W - cx : 0;
      const ty = ptr.p.on ? 0.5 - ptr.p.sy / H : 0;
      tilt = {
        x: tilt.x + (tx - tilt.x) * Math.min(1, dt * 2),
        y: tilt.y + (ty - tilt.y) * Math.min(1, dt * 2),
      };
      const [c0, c1, c2, c3] = colours.now();
      s.f2("uRes", w, h);
      s.f1("uT", t);
      s.f1("uSpin", spin);
      s.f2("uPtr", tilt.x, tilt.y);
      s.f1("uCx", cx);
      s.f3("c0", c0);
      s.f3("c1", c1);
      s.f3("c2", c2);
      s.f3("c3", c3);
      s.draw();
    });
    return () => {
      stop();
      ptr.stop();
      window.removeEventListener("resize", s.resize);
    };
  }, []);

  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
