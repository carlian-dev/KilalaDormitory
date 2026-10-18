import { Sparkles } from "lucide-react";

// Placeholder mascot for Dormi. When the final artwork is ready, drop it in
// src/assets/ and swap ONLY the inner node below — every surface (bubble,
// header, empty state) renders through this component.
export default function DormiAvatar({ size = 32, className = "" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-[#FFC72C] text-[#0A1F44] shadow-sm ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Sparkles size={Math.round(size * 0.55)} strokeWidth={2.25} />
    </span>
  );
}
