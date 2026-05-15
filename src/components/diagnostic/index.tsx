"use client";

/**
 * DIAGNOSTIC OVERLAY SYSTEM
 *
 * Provides:
 *  - useDiagnostic() hook  →  step(), success(), fail(), dismiss()
 *  - <DiagnosticToast />   →  renders the toast stack (bottom-right)
 *  - requireTeamId()       →  throws + logs if team_id is null
 *  - <DiagnosticButton />  →  turns BRIGHT RED if onClick is missing
 */

import { useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "start" | "success" | "fail";

export interface DiagToast {
  id:         string;
  type:       ToastType;
  message:    string;
  persistent: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDiagnostic() {
  const [toasts, setToasts] = useState<DiagToast[]>([]);
  const counter = useRef(0);

  const add = useCallback((type: ToastType, message: string, persistent = false): string => {
    const id = `diag-${++counter.current}`;
    setToasts(prev => [...prev, { id, type, message, persistent }]);

    // Also write to the browser console so Xcode logs pick it up
    const icon = type === "fail" ? "🔴" : type === "success" ? "✅" : "🔵";
    console.log(`${icon} [DIAG] ${message}`);

    if (!persistent) {
      const ttl = type === "start" ? 2500 : 4000;
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ttl);
    }
    return id;
  }, []);

  /** Signal the start of a numbered step */
  const step = useCallback(
    (num: number, label: string) => add("start", `Step ${num}: ${label}…`),
    [add]
  );

  /** Signal a successful DB write */
  const success = useCallback(
    (table: string, detail?: string) =>
      add("success", `Written to '${table}'${detail ? ` · ${detail}` : ""}`),
    [add]
  );

  /** Signal a failure — stays on screen until dismissed */
  const fail = useCallback(
    (num: number, err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
      console.error(`🔴 [DIAG FAIL] Step ${num}: ${msg}`, err);
      return add("fail", `FAILED Step ${num}: ${msg}`, true);
    },
    [add]
  );

  const dismiss = useCallback(
    (id: string) => setToasts(prev => prev.filter(t => t.id !== id)),
    []
  );

  const clear = useCallback(() => setToasts([]), []);

  return { toasts, step, success, fail, dismiss, clear };
}

// ─── Toast renderer ───────────────────────────────────────────────────────────

const STYLE: Record<ToastType, { bg: string; border: string }> = {
  start:   { bg: "#0f172a", border: "#3b82f6" },
  success: { bg: "#052e16", border: "#16a34a" },
  fail:    { bg: "#450a0a", border: "#dc2626" },
};

export function DiagnosticToast({
  toasts,
  dismiss,
}: {
  toasts: DiagToast[];
  dismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed", bottom: 16, right: 16, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8,
        maxWidth: 380, width: "100%", pointerEvents: "none",
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: STYLE[t.type].bg,
            border: `1px solid ${STYLE[t.type].border}`,
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            pointerEvents: "auto",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>
            {t.type === "fail" ? "🔴" : t.type === "success" ? "✅" : "🔵"}
          </span>
          <p
            style={{
              flex: 1, color: "#fff", fontSize: 12,
              fontFamily: "monospace", lineHeight: 1.5, margin: 0,
              wordBreak: "break-word",
            }}
          >
            {t.message}
          </p>
          {t.persistent && (
            <button
              onClick={() => dismiss(t.id)}
              style={{
                flexShrink: 0, color: "rgba(255,255,255,0.5)",
                background: "none", border: "none", fontSize: 18,
                lineHeight: 1, cursor: "pointer", padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── team_id guard ────────────────────────────────────────────────────────────

/**
 * Call this before any Supabase query that must be team-scoped.
 * Throws (and logs) if teamId is falsy.
 */
export function requireTeamId(teamId: string | null | undefined, context: string): string {
  if (!teamId) {
    const msg = `[DIAG] team_id is null/undefined in "${context}". Query halted.`;
    console.error(msg);
    throw new Error(`team_id missing in ${context} — data cannot be scoped to a team.`);
  }
  console.log(`[DIAG] team_id=${teamId} (${context})`);
  return teamId;
}

// ─── Hollow button detector ───────────────────────────────────────────────────

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

/**
 * Drop-in replacement for <button>.
 * If onClick is undefined/missing, renders the button with a bright red border
 * and a "HOLLOW" label so you can spot wiring gaps instantly.
 */
export function DiagnosticButton({ onClick, children, style, ...rest }: BtnProps) {
  const hollow = !onClick;
  const hollowStyle: React.CSSProperties = hollow
    ? {
        border: "3px solid #dc2626",
        boxShadow: "0 0 0 2px rgba(220,38,38,0.4)",
        position: "relative",
      }
    : {};

  return (
    <button
      onClick={onClick}
      style={{ ...style, ...hollowStyle }}
      {...rest}
    >
      {hollow && (
        <span
          style={{
            position: "absolute", top: -10, right: -2,
            background: "#dc2626", color: "#fff",
            fontSize: 8, fontWeight: 700, fontFamily: "monospace",
            padding: "1px 4px", borderRadius: 3, letterSpacing: 1,
            pointerEvents: "none",
          }}
        >
          HOLLOW
        </span>
      )}
      {children}
    </button>
  );
}
