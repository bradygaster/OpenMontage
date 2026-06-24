import { AbsoluteFill } from "remotion";

/**
 * Shared neo-brutalist design tokens + structure overlays for OpenMontage scenes.
 * Subtle brutalism: flat warm-dark grounds, purple + warm accents, hard edges,
 * exposed structure (hairline grid + registration ticks), one hard offset shadow.
 * No glows, no gradients, no soft drop-shadows, minimal radius.
 */

export const RADIUS = 3; // hard, intentional corners — never rounded "cards"

/** Subtle hard offset shadow (the brutalist signature). Solid, no blur. */
export const hardShadow = (color = "#0D0910", dx = 8, dy = 8) =>
  `${dx}px ${dy}px 0 ${color}`;

/** A faint exposed-structure grid + corner registration ticks behind a scene. */
export const BrutalGrid: React.FC<{
  ink: string;
  step?: number;
  opacity?: number;
  label?: string;
  accent?: string;
}> = ({ ink, step = 120, opacity = 0.05, label, accent }) => {
  const W = 1920;
  const H = 1080;
  const verticals = [];
  for (let x = step; x < W; x += step) verticals.push(x);
  const horizontals = [];
  for (let y = step; y < H; y += step) horizontals.push(y);
  const tick = 18;
  const m = 56; // margin for registration marks

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <g stroke={ink} strokeWidth={1} opacity={opacity}>
          {verticals.map((x) => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} />
          ))}
          {horizontals.map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} />
          ))}
        </g>
        {/* Corner registration crosshairs */}
        <g stroke={accent ?? ink} strokeWidth={2} opacity={0.5}>
          {[
            [m, m],
            [W - m, m],
            [m, H - m],
            [W - m, H - m],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <line x1={cx - tick} y1={cy} x2={cx + tick} y2={cy} />
              <line x1={cx} y1={cy - tick} x2={cx} y2={cy + tick} />
            </g>
          ))}
        </g>
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: m - 9,
            bottom: m - 26,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: ink,
            opacity: 0.35,
          }}
        >
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
};
