import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface PipelineStage {
  label: string;
  fn?: string;
  gloss?: string;
}

export interface PipelineAgent {
  name: string;
  role?: string;
}

interface RequestPipelineProps {
  title?: string;
  request?: string;
  stages: PipelineStage[];
  agents?: PipelineAgent[];
  accentColor?: string;
  colors?: string[];
  backgroundColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  fontFamily?: string;
  monoFamily?: string;
  /** Seconds the scene runs; passed by SceneRenderer. Drives pacing. */
  sceneDurationSeconds?: number;
}

const CANVAS_W = 1920;
const NODE_W = 280;
const NODE_H = 124;
const TRACK_Y = 432;

// Evenly spaced node centers within a 1600px band.
const stageCenters = (n: number): number[] => {
  if (n <= 1) return [CANVAS_W / 2];
  const left = 240;
  const right = CANVAS_W - 240;
  const span = (right - left) / (n - 1);
  return Array.from({ length: n }, (_, i) => left + i * span);
};

export const RequestPipeline: React.FC<RequestPipelineProps> = ({
  title,
  request = "refactor the auth system",
  stages,
  agents = [],
  accentColor = "#2F81F7",
  colors = ["#2F81F7", "#A371F7", "#3FB950", "#F778BA"],
  backgroundColor = "#0D1117",
  textColor = "#F0F6FC",
  mutedTextColor = "#8B949E",
  fontFamily = "Space Grotesk, Inter, system-ui, sans-serif",
  monoFamily = "JetBrains Mono, SFMono-Regular, Menlo, monospace",
  sceneDurationSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const total = sceneDurationSeconds ? sceneDurationSeconds * fps : durationInFrames;
  const n = stages.length;
  const centers = stageCenters(n);
  const firstC = centers[0];
  const lastC = centers[n - 1];

  // Phase budget: title in (0-8%), chip travels stages (10%-62%), fan-out (62%-92%).
  const travelStart = total * 0.1;
  const travelEnd = total * 0.62;
  const fanStart = total * 0.62;
  const fanEnd = total * 0.9;

  const titleIn = spring({ frame, fps, config: { damping: 22 } });

  // Request chip x-position as it travels the track.
  const chipP = interpolate(frame, [travelStart, travelEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipX = interpolate(chipP, [0, 1], [firstC - 150, lastC]);
  const chipVisible = frame >= travelStart - 6 && frame < fanStart + 4;

  // A stage is "active" once the chip has reached (or passed) its center.
  const stageActivation = (i: number): number => {
    const c = centers[i];
    const reachAt = interpolate(c, [firstC - 150, lastC], [travelStart, travelEnd]);
    return interpolate(frame, [reachAt - 6, reachAt + 8], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  const handColor = (i: number) => colors[(i % colors.length)] ?? accentColor;

  // Fan-out progress.
  const fanP = interpolate(frame, [fanStart, fanEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const agentCenters = stageCenters(Math.max(agents.length, 1)).map((x) =>
    // pull agent cards into the centre 1500 band
    interpolate(x, [240, CANVAS_W - 240], [330, CANVAS_W - 330])
  );
  const AGENT_Y = 820;
  const fanOrigin = { x: lastC, y: TRACK_Y + NODE_H / 2 };

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      {title && (
        <div
          style={{
            position: "absolute",
            top: 64,
            width: "100%",
            textAlign: "center",
            fontFamily: monoFamily,
            fontWeight: 600,
            fontSize: 40,
            color: textColor,
            opacity: titleIn,
            letterSpacing: "-0.01em",
          }}
        >
          <span style={{ color: accentColor }}>SquadCoordinator</span>
          <span style={{ color: mutedTextColor }}>.handleMessage()</span>
        </div>
      )}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 120,
            width: "100%",
            textAlign: "center",
            fontFamily,
            fontWeight: 500,
            fontSize: 24,
            color: mutedTextColor,
            opacity: interpolate(titleIn, [0, 1], [0, 1]),
          }}
        >
          {title}
        </div>
      )}

      {/* Edge layer: track + fan-out lines */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${CANVAS_W} 1080`}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Base track */}
        <line
          x1={firstC}
          y1={TRACK_Y}
          x2={lastC}
          y2={TRACK_Y}
          stroke={mutedTextColor}
          strokeOpacity={0.28}
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* Progress fill on the track */}
        <line
          x1={firstC}
          y1={TRACK_Y}
          x2={Math.max(firstC, Math.min(chipX + 150, lastC))}
          y2={TRACK_Y}
          stroke={accentColor}
          strokeWidth={4}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${accentColor})` }}
        />

        {/* Fan-out edges from last stage to each agent */}
        {agents.map((_, i) => {
          const ax = agentCenters[i];
          const len = Math.hypot(ax - fanOrigin.x, AGENT_Y - 90 - fanOrigin.y);
          const draw = interpolate(fanP, [0.0 + i * 0.06, 0.45 + i * 0.06], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <line
              key={`fan-${i}`}
              x1={fanOrigin.x}
              y1={fanOrigin.y}
              x2={ax}
              y2={AGENT_Y - 92}
              stroke={handColor(i)}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={len}
              strokeDashoffset={len * (1 - draw)}
              style={{ filter: `drop-shadow(0 0 5px ${handColor(i)}66)` }}
            />
          );
        })}
      </svg>

      {/* Stage nodes */}
      {stages.map((s, i) => {
        const act = stageActivation(i);
        const isActive = act > 0.5;
        const border = isActive ? accentColor : "rgba(139,148,158,0.45)";
        const appear = spring({
          frame: frame - (6 + i * 3),
          fps,
          config: { damping: 16, stiffness: 90 },
        });
        return (
          <div key={`stage-${i}`}>
            <div
              style={{
                position: "absolute",
                left: centers[i] - NODE_W / 2,
                top: TRACK_Y - NODE_H / 2,
                width: NODE_W,
                height: NODE_H,
                borderRadius: 16,
                background: isActive ? "rgba(47,129,247,0.12)" : "rgba(22,27,34,0.92)",
                border: `2px solid ${border}`,
                boxShadow: isActive
                  ? `0 0 0 1px ${accentColor}55, 0 18px 40px rgba(0,0,0,0.5), 0 0 30px ${accentColor}55`
                  : "0 12px 28px rgba(0,0,0,0.4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0 14px",
                opacity: interpolate(appear, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
                transform: `translateY(${interpolate(appear, [0, 1], [16, 0], {
                  extrapolateRight: "clamp",
                })}px) scale(${interpolate(act, [0, 1], [1, 1.05])})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  left: -16,
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: isActive ? accentColor : "#161B22",
                  border: `2px solid ${isActive ? accentColor : "rgba(139,148,158,0.5)"}`,
                  color: isActive ? "#0D1117" : mutedTextColor,
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 26,
                  color: textColor,
                  textAlign: "center",
                  lineHeight: 1.05,
                }}
              >
                {s.label}
              </div>
              {s.fn && (
                <div
                  style={{
                    fontFamily: monoFamily,
                    fontWeight: 500,
                    fontSize: 17,
                    color: isActive ? accentColor : mutedTextColor,
                    textAlign: "center",
                  }}
                >
                  {s.fn}
                </div>
              )}
            </div>
            {/* Gloss under each node */}
            {s.gloss && (
              <div
                style={{
                  position: "absolute",
                  left: centers[i] - NODE_W / 2,
                  top: TRACK_Y + NODE_H / 2 + 16,
                  width: NODE_W,
                  textAlign: "center",
                  fontFamily,
                  fontWeight: 500,
                  fontSize: 18,
                  lineHeight: 1.25,
                  color: mutedTextColor,
                  opacity: interpolate(act, [0, 1], [0.4, 1]),
                }}
              >
                {s.gloss}
              </div>
            )}
          </div>
        );
      })}

      {/* Travelling request chip */}
      {chipVisible && (
        <div
          style={{
            position: "absolute",
            left: chipX,
            top: TRACK_Y - 96,
            transform: "translateX(-50%)",
            padding: "12px 22px",
            borderRadius: 999,
            background: accentColor,
            color: "#0D1117",
            fontFamily: monoFamily,
            fontWeight: 700,
            fontSize: 22,
            whiteSpace: "nowrap",
            boxShadow: `0 10px 30px ${accentColor}88, 0 0 0 6px ${accentColor}22`,
          }}
        >
          “{request}”
        </div>
      )}

      {/* Fan-out agent cards */}
      {agents.map((a, i) => {
        const ax = agentCenters[i];
        const appear = interpolate(fanP, [0.25 + i * 0.07, 0.6 + i * 0.07], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const c = handColor(i);
        return (
          <div
            key={`agent-${i}`}
            style={{
              position: "absolute",
              left: ax - 150,
              top: AGENT_Y - 70,
              width: 300,
              height: 140,
              borderRadius: 16,
              background: "rgba(22,27,34,0.95)",
              border: `2px solid ${c}`,
              boxShadow: `0 16px 38px rgba(0,0,0,0.5), 0 0 26px ${c}44`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: appear,
              transform: `translateY(${interpolate(appear, [0, 1], [-26, 0])}px) scale(${interpolate(
                appear,
                [0, 1],
                [0.9, 1]
              )})`,
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 700,
                fontSize: 30,
                color: textColor,
              }}
            >
              {a.name}
            </div>
            {a.role && (
              <div
                style={{
                  fontFamily,
                  fontWeight: 500,
                  fontSize: 19,
                  color: mutedTextColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {a.role}
              </div>
            )}
            <div
              style={{
                fontFamily: monoFamily,
                fontSize: 15,
                color: c,
                opacity: interpolate(appear, [0.4, 1], [0, 1], { extrapolateLeft: "clamp" }),
              }}
            >
              session.sendMessage()
            </div>
          </div>
        );
      })}

      {/* Fan-out caption */}
      {agents.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: AGENT_Y + 96,
            width: "100%",
            textAlign: "center",
            fontFamily: monoFamily,
            fontWeight: 600,
            fontSize: 22,
            color: mutedTextColor,
            opacity: interpolate(fanP, [0.5, 0.8], [0, 1], { extrapolateLeft: "clamp" }),
          }}
        >
          spawnParallel() · Promise.allSettled · one failure doesn’t block others
        </div>
      )}
    </AbsoluteFill>
  );
};
