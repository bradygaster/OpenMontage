import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface FlowNode {
  title: string;
  subtitle?: string;
  badge?: string;
}

interface FlowDiagramProps {
  title?: string;
  brain: FlowNode;
  hands: FlowNode[];
  memory: FlowNode;
  accentColor?: string;
  colors?: string[];
  backgroundColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  fontFamily?: string;
}

// Fixed 1920x1080 layout coordinates so the SVG edge layer and the HTML node
// layer line up exactly.
const CANVAS_W = 1920;
const CANVAS_H = 1080;

const BRAIN = { cx: 960, cy: 260, w: 660, h: 170 };
const HAND_Y = 640;
const HAND_W = 540;
const HAND_H = 190;
const HAND_CX = [560, 1360];
const MEMORY = { cx: 960, cy: 910, w: 1420, h: 130 };

const brainBottom = { x: BRAIN.cx, y: BRAIN.cy + BRAIN.h / 2 };
const handTop = (i: number) => ({ x: HAND_CX[i], y: HAND_Y - HAND_H / 2 });
const handBottom = (i: number) => ({ x: HAND_CX[i], y: HAND_Y + HAND_H / 2 });
const memoryTopAt = (x: number) => ({ x, y: MEMORY.cy - MEMORY.h / 2 });

interface Pt {
  x: number;
  y: number;
}

const lineLen = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

const Edge: React.FC<{
  a: Pt;
  b: Pt;
  draw: number;
  color: string;
  flowFrame: number;
}> = ({ a, b, draw, color, flowFrame }) => {
  const len = lineLen(a, b);
  return (
    <g>
      {/* Base track */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeOpacity={0.22}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Draw-in stroke */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
      />
      {/* Flowing pulse — only after the edge has drawn */}
      {draw > 0.98 && (
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="16 40"
          strokeDashoffset={-((flowFrame * 4) % 56)}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
    </g>
  );
};

export const FlowDiagram: React.FC<FlowDiagramProps> = ({
  title,
  brain,
  hands,
  memory,
  accentColor = "#2F81F7",
  colors = ["#2F81F7", "#A371F7", "#3FB950", "#F778BA"],
  backgroundColor = "#0D1117",
  textColor = "#F0F6FC",
  mutedTextColor = "#8B949E",
  fontFamily = "Space Grotesk, Inter, system-ui, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 20 } });

  const brainIn = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 90 } });
  const brainEdgeDraw = interpolate(frame, [22, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const handsIn = (i: number) =>
    spring({ frame: frame - (30 + i * 6), fps, config: { damping: 14, stiffness: 90 } });
  const memEdgeDraw = interpolate(frame, [48, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const memIn = spring({ frame: frame - 60, fps, config: { damping: 16, stiffness: 80 } });

  // Squad badge pulse
  const badgePulse = 1 + Math.sin(frame / 8) * 0.04;

  const handColors = [colors[1] ?? accentColor, colors[2] ?? accentColor];

  const nodeBox = (
    node: FlowNode,
    opts: {
      cx: number;
      cy: number;
      w: number;
      h: number;
      appear: number;
      border: string;
      titleSize?: number;
    }
  ) => {
    const { cx, cy, w, h, appear, border, titleSize = 40 } = opts;
    return (
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          borderRadius: 18,
          background: "rgba(22,27,34,0.92)",
          border: `2px solid ${border}`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 18px 40px rgba(0,0,0,0.45), 0 0 28px ${border}33`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "0 28px",
          opacity: interpolate(appear, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(appear, [0, 1], [18, 0], {
            extrapolateRight: "clamp",
          })}px) scale(${interpolate(appear, [0, 1], [0.94, 1], {
            extrapolateRight: "clamp",
          })})`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: titleSize,
            color: textColor,
            textAlign: "center",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
          }}
        >
          {node.title}
        </div>
        {node.subtitle && (
          <div
            style={{
              fontFamily,
              fontWeight: 500,
              fontSize: 22,
              color: mutedTextColor,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {node.subtitle}
          </div>
        )}
        {node.badge && (
          <div
            style={{
              marginTop: 4,
              padding: "6px 18px",
              borderRadius: 999,
              background: border,
              color: "#0D1117",
              fontFamily,
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "0.02em",
              transform: `scale(${badgePulse})`,
              boxShadow: `0 0 20px ${border}AA`,
            }}
          >
            {node.badge}
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      {/* Title */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 70,
            width: "100%",
            textAlign: "center",
            fontFamily,
            fontWeight: 700,
            fontSize: 52,
            color: textColor,
            opacity: titleOpacity,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
      )}

      {/* Edge layer */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {hands.map((_, i) => (
          <Edge
            key={`b-${i}`}
            a={brainBottom}
            b={handTop(i)}
            draw={brainEdgeDraw}
            color={handColors[i] ?? accentColor}
            flowFrame={frame}
          />
        ))}
        {hands.map((_, i) => (
          <Edge
            key={`m-${i}`}
            a={handBottom(i)}
            b={memoryTopAt(HAND_CX[i])}
            draw={memEdgeDraw}
            color={colors[2] ?? accentColor}
            flowFrame={frame}
          />
        ))}
      </svg>

      {/* Brain */}
      {nodeBox(brain, {
        cx: BRAIN.cx,
        cy: BRAIN.cy,
        w: BRAIN.w,
        h: BRAIN.h,
        appear: brainIn,
        border: accentColor,
        titleSize: 46,
      })}

      {/* Hands */}
      {hands.slice(0, 2).map((h, i) =>
        nodeBox(h, {
          cx: HAND_CX[i],
          cy: HAND_Y,
          w: HAND_W,
          h: HAND_H,
          appear: handsIn(i),
          border: handColors[i] ?? accentColor,
        })
      )}

      {/* Memory */}
      <div
        style={{
          position: "absolute",
          left: MEMORY.cx - MEMORY.w / 2,
          top: MEMORY.cy - MEMORY.h / 2,
          width: MEMORY.w,
          height: MEMORY.h,
          borderRadius: 20,
          background: "linear-gradient(90deg, rgba(63,185,80,0.16), rgba(47,129,247,0.16))",
          border: `2px solid ${colors[2] ?? accentColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          opacity: interpolate(memIn, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(memIn, [0, 1], [18, 0], {
            extrapolateRight: "clamp",
          })}px)`,
          overflow: "hidden",
        }}
      >
        {/* moving evidence sheen */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 240,
            left: `${((frame * 1.1) % (MEMORY.w + 240)) - 240}px`,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
          }}
        />
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 38,
            color: textColor,
            textAlign: "center",
            zIndex: 1,
          }}
        >
          {memory.title}
          {memory.subtitle && (
            <span
              style={{
                fontWeight: 500,
                fontSize: 26,
                color: mutedTextColor,
                marginLeft: 16,
              }}
            >
              {memory.subtitle}
            </span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
