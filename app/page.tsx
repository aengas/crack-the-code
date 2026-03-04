"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

const COLORS = ["red", "yellow", "blue", "green", "black", "white"] as const;
type Color = (typeof COLORS)[number];
type Slot = Color | null;
type GameStatus = "playing" | "won" | "lost";

interface GuessResult {
  pegs: Color[];
  blacks: number; // rett farge + rett plass
  whites: number; // rett farge, feil plass
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CODE_LENGTH = 4;
const MAX_GUESSES = 10;

const PEG_FILL: Record<Color, string> = {
  red: "#EF4444",
  yellow: "#FBBF24",
  blue: "#3B82F6",
  green: "#22C55E",
  black: "#1e293b",
  white: "#F1F5F9",
};

const PEG_STROKE: Record<Color, string> = {
  red: "#DC2626",
  yellow: "#D97706",
  blue: "#2563EB",
  green: "#16A34A",
  black: "#475569",
  white: "#CBD5E1",
};

const PEG_LABEL: Record<Color, string> = {
  red: "Rød",
  yellow: "Gul",
  blue: "Blå",
  green: "Grønn",
  black: "Svart",
  white: "Hvit",
};

const LABEL_DARK: Record<Color, boolean> = {
  red: false,
  yellow: true,
  blue: false,
  green: false,
  black: false,
  white: true,
};

// ── Game logic ────────────────────────────────────────────────────────────────

function generateCode(): Color[] {
  return Array.from(
    { length: CODE_LENGTH },
    () => COLORS[Math.floor(Math.random() * COLORS.length)]
  );
}

function evaluate(
  guess: Color[],
  secret: Color[]
): { blacks: number; whites: number } {
  let blacks = 0;
  let whites = 0;
  const sLeft: (Color | null)[] = [...secret];
  const gLeft: (Color | null)[] = [...guess];

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (gLeft[i] === sLeft[i]) {
      blacks++;
      sLeft[i] = null;
      gLeft[i] = null;
    }
  }
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (gLeft[i] !== null) {
      const j = sLeft.findIndex((c) => c !== null && c === gLeft[i]);
      if (j !== -1) {
        whites++;
        sLeft[j] = null;
      }
    }
  }
  return { blacks, whites };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Peg({
  color,
  size = 44,
  selected = false,
  onClick,
}: {
  color: Color | null;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      aria-label={color ? PEG_LABEL[color] : "Tom plass"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color ? PEG_FILL[color] : "rgba(255,255,255,0.07)",
        border: `2.5px solid ${
          selected
            ? "#FBBF24"
            : color
            ? PEG_STROKE[color]
            : "rgba(255,255,255,0.12)"
        }`,
        boxShadow: selected
          ? "0 0 0 3px rgba(251,191,36,0.35), 0 2px 8px rgba(0,0,0,0.4)"
          : color
          ? "inset 0 2px 4px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.35)"
          : "none",
        transform: selected ? "scale(1.12)" : "scale(1)",
        transition: "transform 0.1s ease, box-shadow 0.1s ease, border 0.1s ease",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
      }}
    />
  );
}

function FeedbackGrid({ blacks, whites }: { blacks: number; whites: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 5,
        width: 50,
        flexShrink: 0,
      }}
    >
      {Array.from({ length: CODE_LENGTH }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background:
              i < blacks
                ? "#1e293b"
                : i < blacks + whites
                ? "#F1F5F9"
                : "rgba(255,255,255,0.06)",
            border:
              i < blacks
                ? "1.5px solid #475569"
                : i < blacks + whites
                ? "1.5px solid #CBD5E1"
                : "1.5px solid rgba(255,255,255,0.08)",
            boxShadow:
              i < blacks || i < blacks + whites
                ? "inset 0 1px 3px rgba(255,255,255,0.1)"
                : "none",
          }}
        />
      ))}
    </div>
  );
}

function CompletedRow({ result }: { result: GuessResult }) {
  return (
    <div
      className="row-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div style={{ display: "flex", gap: 8, flex: 1 }}>
        {result.pegs.map((c, i) => (
          <Peg key={i} color={c} size={44} />
        ))}
      </div>
      <FeedbackGrid blacks={result.blacks} whites={result.whites} />
    </div>
  );
}

function ActiveRow({
  slots,
  selectedSlot,
  onSlotClick,
}: {
  slots: Slot[];
  selectedSlot: number;
  onSlotClick: (i: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 18,
        background: "rgba(251,191,36,0.07)",
        border: "1.5px solid rgba(251,191,36,0.35)",
      }}
    >
      <div style={{ display: "flex", gap: 8, flex: 1 }}>
        {slots.map((c, i) => (
          <Peg
            key={i}
            color={c}
            size={44}
            selected={selectedSlot === i}
            onClick={() => onSlotClick(i)}
          />
        ))}
      </div>
      <div style={{ width: 50 }} />
    </div>
  );
}

function EmptyRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        opacity: 0.45,
      }}
    >
      <div style={{ display: "flex", gap: 8, flex: 1 }}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.07)",
            }}
          />
        ))}
      </div>
      <div style={{ width: 50 }} />
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 18,
        padding: "8px 0 0",
        fontSize: 11,
        color: "rgba(255,255,255,0.35)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span
          style={{
            display: "inline-block",
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "#1e293b",
            border: "1px solid #475569",
          }}
        />
        Rett farge + plass
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span
          style={{
            display: "inline-block",
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "#F1F5F9",
            border: "1px solid #CBD5E1",
          }}
        />
        Rett farge
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CrackTheCode() {
  const [secret, setSecret] = useState<Color[]>(() => generateCode());
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [slots, setSlots] = useState<Slot[]>(Array(CODE_LENGTH).fill(null));
  const [status, setStatus] = useState<GameStatus>("playing");
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [shake, setShake] = useState(false);

  const activeRowRef = useRef<HTMLDivElement>(null);

  const isPlaying = status === "playing";
  const canSubmit = isPlaying && slots.every((s) => s !== null);

  // Auto-scroll so active row stays visible
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [guesses]);

  const handleSlotClick = useCallback(
    (i: number) => {
      if (!isPlaying) return;
      setSelectedSlot(i);
    },
    [isPlaying]
  );

  const handleColorPick = useCallback(
    (color: Color) => {
      if (!isPlaying) return;
      setSlots((prev) => {
        const next = [...prev];
        next[selectedSlot] = color;

        // Auto-advance to next empty slot
        let nextEmpty = -1;
        for (let i = selectedSlot + 1; i < CODE_LENGTH; i++) {
          if (next[i] === null) {
            nextEmpty = i;
            break;
          }
        }
        if (nextEmpty === -1) {
          for (let i = 0; i < selectedSlot; i++) {
            if (next[i] === null) {
              nextEmpty = i;
              break;
            }
          }
        }
        if (nextEmpty !== -1) setSelectedSlot(nextEmpty);
        return next;
      });
    },
    [isPlaying, selectedSlot]
  );

  const handleClear = useCallback(() => {
    setSlots(Array(CODE_LENGTH).fill(null));
    setSelectedSlot(0);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    const pegs = slots as Color[];
    const { blacks, whites } = evaluate(pegs, secret);
    const result: GuessResult = { pegs, blacks, whites };
    const newGuesses = [...guesses, result];

    setGuesses(newGuesses);
    setSlots(Array(CODE_LENGTH).fill(null));
    setSelectedSlot(0);

    if (blacks === CODE_LENGTH) {
      setStatus("won");
    } else if (newGuesses.length >= MAX_GUESSES) {
      setStatus("lost");
    }
  }, [canSubmit, slots, secret, guesses]);

  const handleNewGame = useCallback(() => {
    setSecret(generateCode());
    setGuesses([]);
    setSlots(Array(CODE_LENGTH).fill(null));
    setStatus("playing");
    setSelectedSlot(0);
  }, []);

  return (
    <div
      className="game-board"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "linear-gradient(160deg, #0b0b18 0%, #0f0f22 100%)",
        paddingTop: "var(--sat)",
        paddingBottom: "var(--sab)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          flexShrink: 0,
          padding: "14px 20px 12px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(11,11,24,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "0.18em",
            background: "linear-gradient(90deg, #FBBF24, #F59E0B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
          }}
        >
          CRACK THE CODE
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            marginTop: 3,
            letterSpacing: "0.04em",
          }}
        >
          {isPlaying
            ? `Forsøk ${guesses.length + 1} av ${MAX_GUESSES}`
            : status === "won"
            ? `Koden knekt på ${guesses.length} forsøk! 🎉`
            : "Koden ble ikke knekt denne gangen 😓"}
        </p>
      </header>

      {/* ── Board (scrollable) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {guesses.map((g, i) => (
          <CompletedRow key={i} result={g} />
        ))}

        {isPlaying && (
          <div ref={activeRowRef} className={shake ? "shake" : ""}>
            <ActiveRow
              slots={slots}
              selectedSlot={selectedSlot}
              onSlotClick={handleSlotClick}
            />
          </div>
        )}

        {/* Reveal secret on loss */}
        {status === "lost" && (
          <div
            className="row-in"
            style={{
              padding: "14px 16px",
              borderRadius: 18,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.22)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(239,68,68,0.75)" }}>
              Koden var:
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {secret.map((c, i) => (
                <Peg key={i} color={c} size={44} />
              ))}
            </div>
          </div>
        )}

        {/* Placeholder empty rows */}
        {isPlaying &&
          Array.from({ length: MAX_GUESSES - guesses.length - 1 }).map(
            (_, i) => <EmptyRow key={i} />
          )}
      </div>

      {/* ── Controls ── */}
      <div
        style={{
          flexShrink: 0,
          background: "rgba(13,13,26,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 16px",
        }}
      >
        {isPlaying ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Slot preview bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                paddingBottom: 2,
              }}
            >
              {slots.map((c, i) => (
                <Peg
                  key={i}
                  color={c}
                  size={46}
                  selected={selectedSlot === i}
                  onClick={() => handleSlotClick(i)}
                />
              ))}
            </div>

            {/* Color picker grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {COLORS.map((color) => (
                <ColorButton
                  key={color}
                  color={color}
                  onPick={handleColorPick}
                />
              ))}
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleClear}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  fontFamily: "inherit",
                }}
              >
                Slett
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 2,
                  height: 50,
                  borderRadius: 14,
                  background: canSubmit
                    ? "linear-gradient(135deg, #FBBF24, #F59E0B)"
                    : "rgba(251,191,36,0.12)",
                  border: "none",
                  color: canSubmit ? "#1a1100" : "rgba(251,191,36,0.25)",
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: "0.03em",
                  cursor: canSubmit ? "pointer" : "default",
                  boxShadow: canSubmit
                    ? "0 4px 16px rgba(251,191,36,0.35)"
                    : "none",
                  transition: "all 0.15s ease",
                  WebkitTapHighlightColor: "transparent",
                  fontFamily: "inherit",
                }}
              >
                Gjett
              </button>
            </div>

            <Legend />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p
              style={{
                textAlign: "center",
                fontSize: 16,
                fontWeight: 700,
                color: status === "won" ? "#22C55E" : "#EF4444",
              }}
            >
              {status === "won" ? "Gratulerer!" : "Bedre lykke neste gang!"}
            </p>
            <button
              onClick={handleNewGame}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 16,
                background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                border: "none",
                color: "#1a1100",
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: "0.04em",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(251,191,36,0.4)",
                WebkitTapHighlightColor: "transparent",
                fontFamily: "inherit",
              }}
            >
              Nytt spill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ColorButton ───────────────────────────────────────────────────────────────

function ColorButton({
  color,
  onPick,
}: {
  color: Color;
  onPick: (c: Color) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false);
        onPick(color);
      }}
      onPointerLeave={() => setPressed(false)}
      aria-label={PEG_LABEL[color]}
      style={{
        height: 52,
        borderRadius: 14,
        background: PEG_FILL[color],
        border: `2px solid ${PEG_STROKE[color]}`,
        boxShadow: pressed
          ? "inset 0 2px 6px rgba(0,0,0,0.25)"
          : "inset 0 2px 5px rgba(255,255,255,0.15), 0 3px 10px rgba(0,0,0,0.3)",
        color: LABEL_DARK[color]
          ? "rgba(0,0,0,0.65)"
          : "rgba(255,255,255,0.92)",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.02em",
        cursor: "pointer",
        transform: pressed ? "scale(0.94)" : "scale(1)",
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
        WebkitTapHighlightColor: "transparent",
        fontFamily: "inherit",
      }}
    >
      {PEG_LABEL[color]}
    </button>
  );
}
