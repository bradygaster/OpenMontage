import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrutalGrid } from "./brutalist";

interface TextCardProps {
  text: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  accentColor?: string;
  mutedColor?: string;
  kicker?: string;
}

const DISPLAY = "Space Grotesk, Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, SFMono-Regular, Menlo, monospace";

export const TextCard: React.FC<TextCardProps> = ({
  text,
  fontSize = 88,
  color = "#F2E9E1",
  backgroundColor = "#181219",
  accentColor = "#9A5BE0",
  mutedColor = "#B3A4B8",
  kicker,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = text.split("\n").filter(Boolean);
  const lineIn = (i: number) =>
    spring({
      frame: frame - 6 - i * 5,
      fps,
      config: { damping: 200, stiffness: 140, mass: 0.7 },
    });
  const barH = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      <BrutalGrid ink={color} accent={accentColor} label="openmontage" />
      <div
        style={{
          position: "absolute",
          left: 200,
          top: "50%",
          transform: "translateY(-50%)",
          maxWidth: 1480,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: mutedColor,
            marginBottom: 26,
            opacity: spring({ frame, fps, config: { damping: 200 } }),
          }}
        >
          {kicker ?? "// the payoff"}
        </div>
        <div style={{ display: "flex" }}>
          {/* Thick structural left rule */}
          <div
            style={{
              width: 12,
              alignSelf: "stretch",
              background: accentColor,
              marginRight: 40,
              transform: `scaleY(${barH})`,
              transformOrigin: "top",
            }}
          />
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              color,
            }}
          >
            {lines.map((ln, i) => (
              <div
                key={i}
                style={{
                  opacity: lineIn(i),
                  transform: `translateX(${interpolate(lineIn(i), [0, 1], [-26, 0])}px)`,
                  color:
                    i === lines.length - 1 && lines.length > 1 ? accentColor : color,
                }}
              >
                {ln}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
