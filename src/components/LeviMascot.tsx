"use client";

import { useEffect, useRef, useState } from "react";

// Reimplementación del timeline de "Mascota Animación" (archivo compartido por el
// usuario) como componente SVG autocontenido — sin depender del runtime de
// autoría (CompositionStage/useComposition) que no forma parte de este stack.

const Easing = {
  easeInQuad: (t: number) => t * t,
  easeOutBack: (t: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

const MOTION = { fall: Easing.easeInQuad, settle: Easing.easeOutBack, swing: Easing.easeInOutSine };
const C = { cacao: "#4A2C1D", cacaoD: "#3A2216", crema: "#F2E6CC", pliegue: "#E0CCA4", oro: "#D6A23F", rojo: "#E2001A" };
const BODY = "M200 172 C282 172 322 258 322 330 C322 396 272 426 200 426 C128 426 78 396 78 330 C78 258 118 172 200 172 Z";

// Escenas (nombre, duración) tal como vinieron en el export: Entrada, Saludo,
// Curiosidad, VistoBueno, Salida — se reproducen en loop.
const CUES = { Entrada: 0, Saludo: 1.8, Curiosidad: 4.2, VistoBueno: 6.8, Salida: 9.2 };
const TOTAL = 10.6;
const STATIC_POSE = CUES.Saludo + 0.6; // pose fija (sonriendo) para prefers-reduced-motion

function keys(T: number, pts: number[][], ease: (t: number) => number = MOTION.swing): number {
  if (T <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [t1, v1] = pts[i];
    const [t0, v0] = pts[i - 1];
    if (T <= t1) return v0 + (v1 - v0) * ease((T - t0) / (t1 - t0 || 1));
  }
  return pts[pts.length - 1][1];
}
const blink = (T: number, at: number) => (T > at && T < at + 0.16 ? 0.12 : 1);

export default function LeviMascot() {
  const [T, setT] = useState(STATIC_POSE);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      setT(((now - startRef.current) / 1000) % TOTAL);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const E = CUES.Entrada, S = CUES.Saludo, Q = CUES.Curiosidad, V = CUES.VistoBueno, X = CUES.Salida;

  let y = 0;
  if (T < E + 0.8) y = keys(T, [[E + 0.15, -620], [E + 0.8, 0]], MOTION.fall);
  else if (T >= V + 0.6 && T < V + 1.2) y = keys(T, [[V + 0.6, 0], [V + 0.88, -70], [V + 1.16, 0]], MOTION.swing);
  else if (T >= X + 0.7) y = keys(T, [[X + 0.7, 0], [X + 1.25, -1000]], MOTION.fall);

  let sy = 1;
  if (T < E + 0.8) sy = T > E + 0.3 ? 1.08 : 1;
  else if (T < E + 1.5) sy = keys(T, [[E + 0.8, 0.84], [E + 1.5, 1]], MOTION.settle);
  else if (T >= V + 0.45 && T < V + 1.6) sy = keys(T, [[V + 0.45, 0.9], [V + 0.6, 1.06], [V + 1.16, 1.04], [V + 1.24, 0.9], [V + 1.6, 1]], MOTION.swing);
  else if (T >= X + 0.35) sy = keys(T, [[X + 0.35, 1], [X + 0.65, 0.86], [X + 0.8, 1.12]], MOTION.swing);
  const sx = 1 + (1 - sy) * 0.8;

  const lean = keys(T, [[Q + 0.2, 0], [Q + 0.6, -3], [Q + 1.1, -3], [Q + 1.6, 3], [Q + 2.1, 3], [Q + 2.45, 0]]);
  const faceX = keys(T, [[Q + 0.2, 0], [Q + 0.6, -18], [Q + 1.1, -18], [Q + 1.6, 18], [Q + 2.1, 18], [Q + 2.45, 0]]);
  const faceY = keys(T, [[Q + 0.2, 0], [Q + 0.6, -6], [Q + 2.1, -6], [Q + 2.45, 0]]);
  const eyes = Math.min(blink(T, S + 0.9), blink(T, Q + 1.3), blink(T, V + 1.9));

  const hatDy =
    (T < E + 0.8 ? (T > E + 0.3 ? -26 : 0) : keys(T, [[E + 0.8, 14], [E + 1.4, 0]], MOTION.settle)) +
    (T >= V + 0.6 && T < V + 1.6 ? keys(T, [[V + 0.6, 0], [V + 0.88, -18], [V + 1.2, 10], [V + 1.6, 0]]) : 0);
  const hatRot =
    -7 +
    keys(T, [[E + 0.8, 0], [E + 1.0, -5], [E + 1.4, 2], [E + 1.8, 0]]) +
    keys(T, [[S + 0.4, 0], [S + 0.8, 4], [S + 1.8, 4], [S + 2.2, 0]]) +
    lean * 1.4;

  const armRot = keys(T, [[S + 0.1, 0], [S + 0.5, -112], [S + 0.8, -88], [S + 1.1, -118], [S + 1.4, -88], [S + 1.7, -118], [S + 2.0, -100], [S + 2.35, 0]]);
  const armDx = keys(T, [[S + 0.1, 0], [S + 0.5, 16], [S + 2.0, 16], [S + 2.35, 0]]);

  const smile = keys(T, [[S + 0.2, 0], [S + 0.6, 4], [S + 2.2, 4], [S + 2.4, 0], [V + 0.4, 0], [V + 0.7, 8], [X + 0.3, 8], [X + 0.6, 2]]);

  const dot = (i: number) => {
    const a = Q + 1.7 + i * 0.16;
    return T < a ? 0 : T < Q + 2.4 ? keys(T, [[a, 0], [a + 0.25, 1]], MOTION.settle) : keys(T, [[Q + 2.4, 1], [Q + 2.6, 0]]);
  };

  const badge = T < X ? keys(T, [[V + 0.15, 0], [V + 0.55, 1]], MOTION.settle) : keys(T, [[X + 0.05, 1], [X + 0.35, 0]]);
  const check = keys(T, [[V + 0.4, 0], [V + 0.8, 1]]);

  const shadow = Math.max(0, 1 + y / 500);

  return (
    <svg viewBox="0 0 620 480" className="h-full w-full overflow-visible" aria-hidden="true">
      <ellipse cx="200" cy="432" rx={130 * shadow} ry={13 * shadow} fill="rgba(0,0,0,0.25)" opacity={shadow} />
      <g transform={`translate(0 ${y}) rotate(${lean} 200 430) translate(200 430) scale(${sx} ${sy}) translate(-200 -430)`}>
        <ellipse cx="164" cy="428" rx="28" ry="13" fill={C.cacaoD} />
        <ellipse cx="236" cy="428" rx="28" ry="13" fill={C.cacaoD} />
        <ellipse cx="80" cy="340" rx="15" ry="26" transform="rotate(18 80 340)" fill={C.cacaoD} />
        <g transform={`translate(${armDx} 0) rotate(${armRot} 310 318)`}>
          <ellipse cx="320" cy="340" rx="15" ry="26" transform="rotate(-18 320 340)" fill={C.cacaoD} />
        </g>
        <path d={BODY} fill={C.cacao} />
        <g transform={`translate(${faceX} ${faceY})`}>
          <circle cx="146" cy="318" r="10" fill={C.oro} opacity={0.5 + smile * 0.05} />
          <circle cx="254" cy="318" r="10" fill={C.oro} opacity={0.5 + smile * 0.05} />
          <g transform={`translate(0 292) scale(1 ${eyes}) translate(0 -292)`}>
            <circle cx="171" cy="292" r="10" fill={C.crema} />
            <circle cx="229" cy="292" r="10" fill={C.crema} />
          </g>
          <path d={`M${187 - smile * 0.5} 322 Q200 ${333 + smile} ${213 + smile * 0.5} 322`} stroke={C.crema} strokeWidth="5.5" strokeLinecap="round" fill="none" />
        </g>
        <g transform={`translate(0 ${hatDy}) rotate(${hatRot} 200 186)`}>
          <circle cx="150" cy="100" r="42" fill={C.crema} />
          <circle cx="250" cy="100" r="42" fill={C.crema} />
          <circle cx="200" cy="76" r="52" fill={C.crema} />
          <path d="M138 186 L143 108 L257 108 L262 186 Q200 196 138 186 Z" fill={C.crema} />
          <path d="M168 120 L166 168 M200 116 L200 170 M232 120 L234 168" stroke={C.pliegue} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M140 172 L260 172 L262 186 Q200 196 138 186 Z" fill={C.rojo} />
        </g>
      </g>
      {[[322, 150, 8], [344, 124, 10], [372, 94, 13]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r * dot(i)} fill={C.oro} />
      ))}
      <g transform={`translate(520 250) scale(${badge}) translate(-520 -250)`}>
        <circle cx="520" cy="250" r="72" fill={C.oro} />
        <path
          d="M488 252 L512 276 L554 228"
          stroke={C.crema}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="100"
          strokeDashoffset={100 * (1 - check)}
        />
      </g>
    </svg>
  );
}
