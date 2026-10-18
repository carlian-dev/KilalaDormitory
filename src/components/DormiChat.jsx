import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Send, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { askDormi, DORMI_MAX_HISTORY, DORMI_SUGGESTIONS, loadDormiContext } from "../lib/dormi";
import DormiAvatar from "./DormiAvatar";

// Dormi — the Kilala Dormitory AI assistant. Signed-in users only.
// Session-only history (no chat persistence by design); all context is
// built from data the user already sees through RLS. See docs/AI-integration.md.

const EMPTY_COPY = {
  student: "Hi! I'm Dormi. Ask me about your application — status, missing documents, fees, or next steps.",
  admin: "Hi! I'm Dormi. Ask me about the dormitory — pending counts, latest submissions, courses, or estimated revenue.",
};

// Mascot reactions are driven by system facts only: codes from dormi-chat and
// the student's real application status (never invented).
const SLEEPY_CODES = new Set(["user_quota", "global_quota", "provider_busy", "not_configured"]);
const MOOD_FOR_STATUS = { approved: "happy", rejected: "worried" };
const PENDING_QUESTION = "thinking";

function studentGreeting(status, label) {
  if (status === "approved") return "Yay — you're Approved! I'm still around if you need anything about your stay.";
  if (status === "rejected") return "Your application came back as Needs Resubmit. Ask me what to fix and I'll walk you through it.";
  return `Your application is ${label}. I can help with status, documents, fees, or next steps.`;
}

function adminGreeting(ctx) {
  const total = ctx.totalApplications ?? 0;
  const pending = ctx.byStatus?.pending ?? 0;
  return `Hi! The dorm has ${total} application${total === 1 ? "" : "s"} in right now — ${pending} pending review. What shall we check?`;
}

function noticeFor(res) {
  switch (res?.code) {
    case "user_quota": {
      const at = res.resetAt
        ? new Date(res.resetAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : null;
      return `That's all my free messages for you today${at ? ` — they come back around ${at}` : ""}. I'll take a nap until then.`;
    }
    case "global_quota":
      return "My free daily messages are used up for everyone today. I'll rest and be back tomorrow.";
    case "provider_busy":
      return "My free AI brain is busy right now. Give me a minute and try again.";
    case "timeout":
    case "provider_error":
    case "empty_reply":
      return "Hmm, I couldn't answer that one. Please try asking again.";
    case "not_configured":
      return "I'm still waking up — an admin needs to finish my setup.";
    case "unreachable":
      return "I can't be reached — the chat function may not be deployed yet. Ask an admin to check setup.";
    default:
      return res?.message || "Something ruffled my feathers. Please try again.";
  }
}

export default function DormiChat() {
  const { user, isAdmin } = useAuth();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [mood, setMood] = useState("idle");
  const [greet, setGreet] = useState(null);

  const contextRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const idRef = useRef(0);
  const nid = () => String(++idRef.current);

  const mode = isAdmin ? "admin" : "student";
  const suggestions = useMemo(() => DORMI_SUGGESTIONS[mode], [mode]);

  // Refresh the (minimal, RLS-visible) context each time the panel opens,
  // and let the mascot + greeting reflect what was actually found.
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    loadDormiContext({ userId: user.id, isAdmin })
      .then((ctx) => {
        if (cancelled) return;
        contextRef.current = ctx;
        setMood(!isAdmin && ctx?.hasApplication ? (MOOD_FOR_STATUS[ctx.status] ?? "idle") : "idle");
        setGreet(
          !ctx ? null
            : isAdmin
              ? adminGreeting(ctx)
              : ctx.hasApplication
                ? studentGreeting(ctx.status, ctx.statusLabel)
                : "Hi, I'm Dormi! You haven't applied yet — start your application and I'll help with documents, fees, and status."
        );
      })
      .catch(() => {
        if (cancelled) return;
        contextRef.current = null;
        setMood("idle");
        setGreet(null);
      });
    return () => { cancelled = true; };
  }, [open, user, isAdmin]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  const append = (role, text) => setMessages((prev) => [...prev, { id: nid(), role, text }]);

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      append("notice", "I can't fly without internet. Reconnect and try again.");
      return;
    }
    setInput("");
    append("user", text);
    setBusy(true);
    setMood(PENDING_QUESTION);
    const history = [...messages, { role: "user", text }]
      .filter((m) => m.role === "user" || m.role === "model")
      .slice(-DORMI_MAX_HISTORY)
      .map((m) => ({ role: m.role, text: m.text }));
    const res = await askDormi({ messages: history, context: contextRef.current });
    setBusy(false);
    setMood(res.ok ? "idle" : SLEEPY_CODES.has(res.code) ? "sleepy" : "sad");
    if (typeof res.remaining === "number") setRemaining(res.remaining);
    if (res.ok) append("model", res.reply);
    else append("notice", noticeFor(res));
  };

  if (!user) return null;
  const empty = messages.length === 0;
  const spring = reduce ? { duration: 0.12 } : { type: "spring", bounce: 0, duration: 0.42 };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="dormi-bubble"
            type="button"
            onClick={() => {
              setMood("idle");
              setGreet(null);
              setOpen(true);
            }}
            aria-label="Open Dormi chat"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={reduce ? { duration: 0.12 } : { type: "spring", bounce: 0.35, duration: 0.5 }}
            className="pressable fixed bottom-4 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0A2456] dark:ring-white/15"
          >
            <DormiAvatar size={46} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="dormi-panel"
            role="dialog"
            aria-label="Dormi chat"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={spring}
            className="fixed bottom-4 right-4 z-50 flex h-[min(78vh,580px)] w-[min(92vw,384px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-[#0A2456] dark:ring-white/15"
          >
            <header className="flex items-center gap-2.5 bg-[#0B2A6B] px-4 py-3 dark:bg-[#081f52]">
              <DormiAvatar size={34} mood={mood} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-sm font-bold text-white">Dormi</p>
                <p className="text-[11px] font-medium text-[#FFD120]">The dorm owl</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Dormi chat"
                className="pressable grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X size={15} />
              </button>
            </header>

            <div ref={listRef} className="nice-scroll flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3.5">
              {empty && (
                <div className="pt-4 text-center">
                  <div className="flex justify-center">
                    <DormiAvatar size={56} mood={mood === "idle" ? "wave" : mood} />
                  </div>
                  <p className="mx-auto mt-3 max-w-[260px] text-[13px] leading-relaxed text-slate-500 dark:text-slate-300">
                    {greet ?? EMPTY_COPY[mode]}
                  </p>
                  <div className="mt-4 grid gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="pressable rounded-full bg-white px-3.5 py-2 text-left text-[12px] font-semibold text-[#0B2A6B] ring-1 ring-[#0B2A6B]/10 hover:bg-[#FFD120]/20 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                if (m.role === "notice") {
                  return (
                    <motion.p
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mx-auto max-w-[92%] rounded-xl bg-[#FFF8E1] px-3 py-2 text-center text-[12px] text-[#0B2A6B] ring-1 ring-[#FFD120]/50 dark:bg-[#FFD120]/10 dark:text-[#FFE9A8] dark:ring-[#FFD120]/30"
                    >
                      {m.text}
                    </motion.p>
                  );
                }
                const mine = m.role === "user";
                return (
                  <div key={m.id} className={`flex gap-1.5 ${mine ? "justify-end" : "items-end"}`}>
                    {!mine && <DormiAvatar size={24} className="mb-0.5 shrink-0" />}
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        mine
                          ? "rounded-br-md bg-[#0B2A6B] text-white dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                          : "rounded-bl-md bg-slate-100 text-[#0B2A6B] dark:bg-white/10 dark:text-white"
                      }`}
                    >
                      {m.text}
                    </motion.p>
                  </div>
                );
              })}

              {busy && (
                <div className="flex items-end gap-1.5">
                  <DormiAvatar size={24} mood="thinking" className="mb-0.5 shrink-0" />
                  <p className="w-fit rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-[13px] text-slate-400 dark:bg-white/10 dark:text-slate-300">
                    <span className="animate-pulse">Dormi is thinking…</span>
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-3 dark:border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Dormi…"
                  aria-label="Message Dormi"
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-[13px] text-[#0B2A6B] outline-none placeholder:text-slate-400 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="pressable grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFD120] text-[#0B2A6B] shadow-sm hover:bg-[#F0BB00] disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
                Free AI (Google Gemini) · avoid sensitive info
                {remaining != null ? ` · ${remaining} left today` : ""}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
