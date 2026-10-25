// Dormi — the Kilala dormitory owl mascot, drawn as pure SVG so she can emote.
// `mood` comes from real system state in DormiChat (application status, an
// in-flight question, quota/errors). Colors are the repo's own theme tokens;
// the gold circle of the wrapper is her body. Animations live in index.css
// (.dormi-*) and are disabled under prefers-reduced-motion there.

const PUPIL_FOR = {
  idle: [0, 0],
  thinking: [-1.2, -1.7], // glancing up, "hmm…"
  worried: [0, 1.9], // looking down
  sad: [0, 2.3], // drooped
};
const CLOSED_EYES = { happy: "up", sleepy: "down" };

export default function DormiAvatar({ size = 32, className = "", mood = "idle" }) {
  const closed = CLOSED_EYES[mood];
  const [pdx, pdy] = PUPIL_FOR[mood] ?? [0, 0];
  const bodyAnim = mood === "happy" ? "dormi-bounce" : mood === "idle" || mood === "wave" ? "dormi-bob" : "";
  const headAnim = mood === "thinking" || mood === "sleepy" ? "dormi-nod" : "";

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-visible rounded-full bg-[#10B981] text-[#0B2A6B] shadow-sm ${bodyAnim} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 48 48" className={headAnim}>
        {/* ear tufts */}
        <path d="M13.2 9.6 Q12.6 3.4 18.2 6.4 Q15.7 8.3 13.2 9.6 Z" fill="#059669" />
        <path d="M34.8 9.6 Q35.4 3.4 29.8 6.4 Q32.3 8.3 34.8 9.6 Z" fill="#059669" />
        {/* belly */}
        <ellipse cx="24" cy="36.8" rx="8.8" ry="6.2" fill="#D1FAE5" opacity="0.9" />
        {/* wings — resting tilt lives in CSS (.dormi-wing-*) so the right one can wave */}
        <ellipse cx="7.4" cy="30.6" rx="3.1" ry="6.6" fill="#059669" className="dormi-wing dormi-wing-l" />
        <ellipse cx="40.6" cy="30.6" rx="3.1" ry="6.6" fill="#059669" className={`dormi-wing dormi-wing-r ${mood === "wave" ? "dormi-wing-wave" : ""}`} />

        {/* eyes: open with movable pupils, or closed arcs for happy/sleepy */}
        {!closed && (
          <g className="dormi-eyes">
            <ellipse cx="17.4" cy="21.6" rx="6.6" ry="7" fill="#FFFFFF" />
            <ellipse cx="30.6" cy="21.6" rx="6.6" ry="7" fill="#FFFFFF" />
            <circle cx={17.4 + pdx} cy={21.6 + pdy} r="3" fill="#0B2A6B" />
            <circle cx={30.6 + pdx} cy={21.6 + pdy} r="3" fill="#0B2A6B" />
            <circle cx={17.4 + pdx - 1.1} cy={21.6 + pdy - 1.1} r="1" fill="#FFFFFF" />
            <circle cx={30.6 + pdx - 1.1} cy={21.6 + pdy - 1.1} r="1" fill="#FFFFFF" />
          </g>
        )}
        {closed === "up" && (
          <>
            <path d="M11.9 21.4 Q17.4 15.9 22.9 21.4" stroke="#0B2A6B" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M25.1 21.4 Q30.6 15.9 36.1 21.4" stroke="#0B2A6B" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </>
        )}
        {closed === "down" && (
          <>
            <path d="M12.6 20.6 Q17.4 25 22.2 20.6" stroke="#0B2A6B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M25.8 20.6 Q30.6 25 35.4 20.6" stroke="#0B2A6B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </>
        )}

        {mood === "worried" && (
          <>
            <path d="M12.8 12.9 L21.2 15.4" stroke="#0B2A6B" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M35.2 12.9 L26.8 15.4" stroke="#0B2A6B" strokeWidth="1.7" strokeLinecap="round" />
          </>
        )}

        {/* beak (warm accent, kept dark-mode safe on gold) */}
        <path d="M24 25 L26.5 28 Q24 31.2 21.5 28 Z" fill="#E68A2E" />
      </svg>
    </span>
  );
}
