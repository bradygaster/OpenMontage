import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrutalGrid, hardShadow } from "./brutalist";

type CalloutType = "info" | "warning" | "tip" | "quote";

interface CalloutBoxProps {
  text: string;
  type?: CalloutType;
  title?: string;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  fontSize?: number;
  titleFontSize?: number;
  containerBackgroundColor?: string;
}

const DISPLAY = "Space Grotesk, Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, SFMono-Regular, Menlo, monospace";

// Typographic tag instead of an emoji icon (emoji is an AI tell).
const TAG: Record<CalloutType, string> = {
  info: "// NOTE",
  warning: "// HEADS UP",
  tip: "// TIP",
  quote: "“ ”",
};

export const CalloutBox: React.FC<CalloutBoxProps> = ({
  text,
  type = "info",
  title,
  borderColor = "#9A5BE0",
  backgroundColor = "#241A28",
  textColor = "#F2E9E1",
  mutedColor = "#B3A4B8",
  fontSize = 44,
  titleFontSize = 30,
  containerBackgroundColor = "#181219",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelIn = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.8 },
  });
  const shadowGrow = interpolate(panelIn, [0, 1], [0, 1]);
  const tagIn = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const textIn = spring({ frame: frame - 9, fps, config: { damping: 200 } });
  const isQuote = type === "quote";

  return (
    <AbsoluteFill
      style={{
        background: containerBackgroundColor,
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <BrutalGrid ink={textColor} accent={borderColor} label={`callout · ${type}`} />

      <div
        style={{
          position: "relative",
          marginLeft: 200,
          width: 1420,
          opacity: panelIn,
          transform: `translateX(${interpolate(panelIn, [0, 1], [-32, 0])}px)`,
        }}
      >
        {/* Mono tag sitting on the top border */}
        <div
          style={{
            position: "absolute",
            top: -20,
            left: 36,
            zIndex: 2,
            background: borderColor,
            color: "#181219",
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "0.12em",
            padding: "6px 16px",
            opacity: tagIn,
            transform: `translateY(${interpolate(tagIn, [0, 1], [8, 0])}px)`,
          }}
        >
          {TAG[type]}
        </div>

        <div
          style={{
            background: backgroundColor,
            border: `3px solid ${borderColor}`,
            boxShadow: hardShadow("#0D0910", 12 * shadowGrow, 12 * shadowGrow),
            padding: "56px 56px 52px",
          }}
        >
          {title && (
            <div
              style={{
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: titleFontSize,
                color: borderColor,
                letterSpacing: "0.04em",
                marginBottom: 18,
                opacity: textIn,
              }}
            >
              {title}
            </div>
          )}
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: isQuote ? 600 : 700,
              fontStyle: isQuote ? "italic" : "normal",
              fontSize,
              color: textColor,
              lineHeight: 1.28,
              letterSpacing: "-0.02em",
              opacity: textIn,
              transform: `translateY(${interpolate(textIn, [0, 1], [10, 0])}px)`,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
