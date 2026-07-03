"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

// The real Kubernetes structure: an EKS cluster holding a worker node, a pod, and
// its containers. One container is compromised, and its token escapes the cluster
// to a laptop off-box, then to AWS. Two layouts (wide for desktop, stacked for
// phones so the labels stay legible), revealed as a sequence on scroll. Theme-aware
// via CSS vars, reduced-motion aware.

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const box: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};
const draw: Variants = {
  hidden: { opacity: 0, pathLength: 0 },
  show: {
    opacity: 0.55,
    pathLength: 1,
    transition: { duration: 0.7, ease: "easeInOut" },
  },
};

function Text({
  x,
  y,
  children,
  color = "var(--text-muted)",
  size = 12,
  weight = 500,
  anchor = "start",
}: {
  x: number;
  y: number;
  children: string;
  color?: string;
  size?: number;
  weight?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily="var(--font-mono), ui-monospace, monospace"
      fontSize={size}
      fontWeight={weight}
      letterSpacing="0.03em"
      textAnchor={anchor}
      fill={color}
    >
      {children}
    </text>
  );
}

function Key({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} stroke="var(--kr-rose)">
      <circle r={8} fill="none" strokeWidth={2.2} />
      <line x1={0} y1={8} x2={0} y2={23} strokeWidth={2.2} />
      <line x1={0} y1={18} x2={6} y2={18} strokeWidth={2.2} />
    </g>
  );
}

const DEFS = (
  <defs>
    <pattern id="kr-grid" width="17" height="17" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.55" />
    </pattern>
  </defs>
);

// ── Wide layout (desktop) ─────────────────────────────────────────────────
const WIDE_ESCAPE = "M 388 214 C 388 108, 486 96, 566 152";
const WIDE_REDEEM = "M 664 236 C 664 254, 664 262, 664 278";
const WIDE_CONTAINERS = [
  { x: 100, name: "app", image: "web:1.27", bad: false },
  { x: 214, name: "sidecar", image: "fluent-bit", bad: false },
  { x: 328, name: "shell", image: "/bin/sh -i", bad: true },
];

function WideDiagram({ anim }: { anim: RevealProps }) {
  return (
    <motion.svg
      className="hidden md:block"
      viewBox="0 0 860 400"
      role="img"
      aria-label="A Kubernetes cluster diagram: an EKS cluster contains a worker node, a pod, and three containers (app, sidecar, and a compromised shell). The compromised container's token escapes the cluster to a laptop off-box, then to the AWS account."
      style={{ width: "100%", height: "auto" }}
      variants={group}
      {...anim}
    >
      {DEFS}

      <motion.g variants={box}>
        <rect
          x={24}
          y={40}
          width={470}
          height={330}
          rx={14}
          fill="color-mix(in oklch, var(--accent) 4%, transparent)"
          stroke="var(--border)"
        />
        <rect x={40} y={76} width={438} height={280} fill="url(#kr-grid)" />
        <Text
          x={44}
          y={68}
          size={11}
          weight={600}
          color="var(--text-secondary)"
        >
          EKS CLUSTER
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <rect
          x={52}
          y={86}
          width={414}
          height={262}
          rx={11}
          fill="var(--bg-elevated)"
          stroke="var(--border)"
        />
        <Text x={68} y={110} size={11}>
          worker node
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <rect
          x={80}
          y={130}
          width={358}
          height={196}
          rx={9}
          fill="var(--bg-subtle)"
          stroke="var(--border)"
        />
        <Text x={96} y={152} size={11}>
          pod
        </Text>
      </motion.g>

      {WIDE_CONTAINERS.map((c) => (
        <motion.g key={c.name} variants={box}>
          <rect
            className={c.bad ? "kr-compromised" : undefined}
            x={c.x}
            y={168}
            width={100}
            height={132}
            rx={7}
            fill={
              c.bad
                ? "color-mix(in oklch, var(--kr-rose) 12%, var(--bg))"
                : "var(--bg-elevated)"
            }
            stroke={c.bad ? "var(--kr-rose)" : "var(--border-hover)"}          />
          <circle
            className={c.bad ? "kr-led" : undefined}
            cx={c.x + 16}
            cy={188}
            r={3.5}
            fill={c.bad ? "var(--kr-rose)" : "var(--status-active)"}
          />
          <Text
            x={c.x + 27}
            y={192}
            size={10.5}
            weight={600}
            color="var(--text)"
          >
            {c.name}
          </Text>
          <Text x={c.x + 14} y={214} size={9.5}>
            {c.image}
          </Text>
          {c.bad ? (
            <Key x={c.x + 50} y={238} />
          ) : (
            <Text x={c.x + 50} y={252} anchor="middle" size={9}>
              running
            </Text>
          )}
        </motion.g>
      ))}

      <motion.g variants={box}>
        <rect
          x={566}
          y={110}
          width={196}
          height={122}
          rx={10}
          fill="var(--bg-elevated)"
          stroke="var(--border)"
        />
        <Text x={586} y={140} size={11} weight={600} color="var(--text)">
          your laptop
        </Text>
        <Text x={586} y={160} size={11}>
          off-box
        </Text>
        <Text x={586} y={200} size={9.5}>
          no path back to cluster
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <rect
          x={566}
          y={274}
          width={196}
          height={96}
          rx={10}
          fill="var(--bg-elevated)"
          stroke="var(--border)"
        />
        <Text x={586} y={304} size={11} weight={600} color="var(--text)">
          AWS account
        </Text>
        <Text x={586} y={324} size={11}>
          warehouses across town
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <motion.path
          d={WIDE_ESCAPE}
          fill="none"
          stroke="var(--kr-rose)"
          strokeWidth={1.6}
          strokeDasharray="5 5"
          variants={draw}
        />
        <Text x={470} y={94} size={10}>
          1 · escapes the cluster
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <motion.path
          d={WIDE_REDEEM}
          fill="none"
          stroke="var(--kr-rose)"
          strokeWidth={1.6}
          strokeDasharray="5 5"
          variants={draw}
        />
        <Text x={676} y={260} size={10}>
          2 · redeemed at AWS
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <circle
          className="kr-token"
          r={4.5}
          fill="var(--kr-rose)"
          style={{
            offsetPath: `path("${WIDE_ESCAPE}")`,
            offsetDistance: "50%",
          }}
        />
        <circle
          className="kr-token kr-token-b"
          r={4.5}
          fill="var(--kr-rose)"
          style={{
            offsetPath: `path("${WIDE_REDEEM}")`,
            offsetDistance: "50%",
          }}
        />
      </motion.g>
    </motion.svg>
  );
}

// ── Portrait layout (mobile) ──────────────────────────────────────────────
const PORT_ESCAPE = "M 190 352 L 190 420";
const PORT_REDEEM = "M 190 496 L 190 514";
const PORT_ROWS = [
  { y: 122, name: "app", image: "web:1.27", bad: false },
  { y: 202, name: "sidecar", image: "fluent-bit", bad: false },
  { y: 282, name: "shell", image: "/bin/sh -i", bad: true },
];

function PortraitDiagram({ anim }: { anim: RevealProps }) {
  return (
    <motion.svg
      className="block md:hidden"
      viewBox="0 0 380 606"
      role="img"
      aria-label="A Kubernetes cluster diagram: an EKS cluster contains a worker node and a pod with three containers (app, sidecar, and a compromised shell). The compromised container's token escapes the cluster down to a laptop off-box, then to the AWS account."
      style={{ width: "100%", height: "auto", maxWidth: 420, margin: "0 auto" }}
      variants={group}
      {...anim}
    >
      {DEFS}

      <motion.g variants={box}>
        <rect
          x={8}
          y={16}
          width={364}
          height={380}
          rx={14}
          fill="color-mix(in oklch, var(--accent) 4%, transparent)"
          stroke="var(--border)"
        />
        <rect x={24} y={52} width={332} height={330} fill="url(#kr-grid)" />
        <Text
          x={24}
          y={40}
          size={12}
          weight={600}
          color="var(--text-secondary)"
        >
          EKS CLUSTER
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <rect
          x={24}
          y={52}
          width={332}
          height={328}
          rx={11}
          fill="var(--bg-elevated)"
          stroke="var(--border)"
        />
        <Text x={38} y={74} size={12}>
          worker node
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <rect
          x={40}
          y={88}
          width={300}
          height={280}
          rx={9}
          fill="var(--bg-subtle)"
          stroke="var(--border)"
        />
        <Text x={54} y={110} size={12}>
          pod
        </Text>
      </motion.g>

      {PORT_ROWS.map((r) => (
        <motion.g key={r.name} variants={box}>
          <rect
            className={r.bad ? "kr-compromised" : undefined}
            x={56}
            y={r.y}
            width={268}
            height={66}
            rx={8}
            fill={
              r.bad
                ? "color-mix(in oklch, var(--kr-rose) 12%, var(--bg))"
                : "var(--bg-elevated)"
            }
            stroke={r.bad ? "var(--kr-rose)" : "var(--border-hover)"}          />
          <circle
            className={r.bad ? "kr-led" : undefined}
            cx={78}
            cy={r.y + 33}
            r={4.5}
            fill={r.bad ? "var(--kr-rose)" : "var(--status-active)"}
          />
          <Text x={96} y={r.y + 30} size={14} weight={600} color="var(--text)">
            {r.name}
          </Text>
          <Text x={96} y={r.y + 50} size={12}>
            {r.image}
          </Text>
          {r.bad ? (
            <Key x={300} y={r.y + 18} />
          ) : (
            <Text x={308} y={r.y + 38} anchor="end" size={11}>
              running
            </Text>
          )}
        </motion.g>
      ))}

      <motion.g variants={box}>
        <rect
          x={56}
          y={420}
          width={268}
          height={76}
          rx={10}
          fill="var(--bg-elevated)"
          stroke="var(--border)"
        />
        <Text x={76} y={450} size={13} weight={600} color="var(--text)">
          your laptop
        </Text>
        <Text x={76} y={472} size={12}>
          off-box · no path back
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <rect
          x={56}
          y={514}
          width={268}
          height={76}
          rx={10}
          fill="var(--bg-elevated)"
          stroke="var(--border)"
        />
        <Text x={76} y={544} size={13} weight={600} color="var(--text)">
          AWS account
        </Text>
        <Text x={76} y={566} size={12}>
          warehouses across town
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <motion.path
          d={PORT_ESCAPE}
          fill="none"
          stroke="var(--kr-rose)"
          strokeWidth={1.8}
          strokeDasharray="5 5"
          variants={draw}
        />
        <Text x={202} y={392} size={11}>
          1 · escapes the cluster
        </Text>
      </motion.g>

      <motion.g variants={box}>
        <motion.path
          d={PORT_REDEEM}
          fill="none"
          stroke="var(--kr-rose)"
          strokeWidth={1.8}
          strokeDasharray="5 5"
          variants={draw}
        />
      </motion.g>

      <motion.g variants={box}>
        <circle
          className="kr-token"
          r={5}
          fill="var(--kr-rose)"
          style={{
            offsetPath: `path("${PORT_ESCAPE}")`,
            offsetDistance: "50%",
          }}
        />
        <circle
          className="kr-token kr-token-b"
          r={5}
          fill="var(--kr-rose)"
          style={{
            offsetPath: `path("${PORT_REDEEM}")`,
            offsetDistance: "50%",
          }}
        />
      </motion.g>
    </motion.svg>
  );
}

type RevealProps = {
  initial: "hidden" | "show";
  whileInView: "show";
  viewport: { once: boolean; margin: string };
};

export function ClusterDiagram() {
  const reduce = useReducedMotion();
  const anim: RevealProps = {
    initial: reduce ? "show" : "hidden",
    whileInView: "show",
    viewport: { once: true, margin: "-60px" },
  };
  return (
    <>
      <WideDiagram anim={anim} />
      <PortraitDiagram anim={anim} />
    </>
  );
}
