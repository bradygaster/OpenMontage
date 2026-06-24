import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrutalGrid, hardShadow } from "./brutalist";

interface HeroTitleProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedTextColor?: string;
}

const DISPLAY = "Space Grotesk, Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, SFMono-Regular, Menlo, monospace";

export const HeroTitle: React.FC<HeroTitleProps> = ({
  title,
  subtitle,
  kicker,
  accentColor = "#9A5BE0",
  backgroundColor = "#181219",
  textColor = "#F2E9E1",
  mutedTextColor = "#B3A4B8",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = title.split(" ");

  // Hard, deliberate entrance: a structural bar wipes from the left, then each
  // word snaps up on a tight stagger (no bounce — exponential settle).
  const barW = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wordIn = (i: number) =>
    spring({
      frame: frame - 8 - i * 4,
      fps,
      config: { damping: 200, stiffness: 140, mass: 0.7 },
    });
  const subIn = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  const kickIn = spring({ frame: frame - 2, fps, config: { damping: 200 } });

  const LEFT = 200;

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      <BrutalGrid ink={textColor} accent={accentColor} label="openmontage · hero" />

      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: "50%",
          transform: "translateY(-50%)",
          maxWidth: 1520,
        }}
      >
        {/* Mono kicker + accent rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 28,
            opacity: kickIn,
          }}
        >
          <div
            style={{
              width: interpolate(barW, [0, 1], [0, 64]),
              height: 10,
              background: accentColor,
            }}
          />
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: mutedTextColor,
            }}
          >
            {kicker ?? "SQUAD"}
          </div>
        </div>

        {/* Display title — flush left, first word in accent */}
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 132,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            color: textColor,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
          }}
        >
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginLeft: i === 0 ? 0 : 26,
                color: i === 0 ? accentColor : textColor,
                opacity: wordIn(i),
                transform: `translateY(${interpolate(wordIn(i), [0, 1], [26, 0])}px)`,
              }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Subtitle in a hard-edged mono tag with offset shadow */}
        {subtitle && (
          <div
            style={{
              marginTop: 40,
              display: "inline-block",
              opacity: subIn,
              transform: `translateX(${interpolate(subIn, [0, 1], [-20, 0])}px)`,
              background: backgroundColor,
              border: `2px solid ${accentColor}`,
              boxShadow: hardShadow("#0D0910", 7, 7),
              padding: "12px 22px",
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: "0.04em",
              color: textColor,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
