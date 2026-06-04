"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Send, ShieldCheck, AlertCircle } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

const T = {
  surface:    "#ffffff",
  raised:     "#f8fafc",
  border:     "#e2e8f0",
  borderSub:  "#f1f5f9",
  text:       "#0f172a",
  textSub:    "#334155",
  textMuted:  "#64748b",
  green:      "#16a34a",
  greenLight: "#f0fdf4",
  greenBorder:"#bbf7d0",
};

const shadow = "0 1px 3px 0 rgba(0,0,0,0.06),0 1px 2px 0 rgba(0,0,0,0.04)";

interface Thread {
  counselor_id:   string;
  counselor_name: string;
  scope:          "summary" | "full";
}

interface Message {
  id:           string;
  sender_id:    string;
  recipient_id: string;
  body:         string;
  sent_at:      string;
  read_at:      string | null;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " +
         d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function AthleteMessagesPage() {
  const [userName,       setUserName]       = useState("...");
  const [profileId,      setProfileId]      = useState<string | null>(null);
  const [threads,        setThreads]        = useState<Thread[]>([]);
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [msgInput,       setMsgInput]       = useState("");
  const [sending,        setSending]        = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const supabaseRef  = useRef<SupabaseClient | null>(null);
  const profileIdRef = useRef<string | null>(null);
  const bottomRef    = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      supabaseRef.current = supabase;

      const { getMyProfile } = await import("@/lib/current-user");
      const { profile: prof } = await getMyProfile(supabase);
      if (!prof) { setError("Profile not found."); setLoadingThreads(false); return; }
      setUserName(prof.full_name);
      setProfileId(prof.id);
      profileIdRef.current = prof.id;

      // Get all counselors who have active consent for this athlete
      type ConsentRow = {
        target_profile_id: string; scope: "summary" | "full";
        counselor: { full_name: string }[] | { full_name: string } | null;
      };
      const { data: consents } = await supabase
        .from("consent_logs")
        .select("target_profile_id, scope, counselor:target_profile_id(full_name)")
        .eq("athlete_id", prof.id)
        .eq("is_active", true) as { data: ConsentRow[] | null };

      const threadList: Thread[] = (consents ?? []).map(c => {
        const obj = Array.isArray(c.counselor) ? c.counselor[0] : c.counselor;
        return { counselor_id: c.target_profile_id, counselor_name: obj?.full_name ?? "Counselor", scope: c.scope };
      });
      setThreads(threadList);

      // Auto-select if only one counselor
      if (threadList.length === 1) setSelectedId(threadList[0].counselor_id);

      setLoadingThreads(false);

      // Real-time: new messages from any counselor
      const channel = supabase
        .channel("athlete-messages-realtime")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const msg = payload.new as Message;
          if (msg.recipient_id === profileIdRef.current || msg.sender_id === profileIdRef.current) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    let cleanup: (() => void) | undefined;
    load().then(fn => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  // Load messages for selected thread
  useEffect(() => {
    if (!selectedId || !profileIdRef.current) return;
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setLoadingMsgs(true);
    setMessages([]);
    const myId = profileIdRef.current;
    supabase.from("messages")
      .select("id, sender_id, recipient_id, body, sent_at, read_at")
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${selectedId}),and(sender_id.eq.${selectedId},recipient_id.eq.${myId})`)
      .order("sent_at", { ascending: true })
      .then(({ data, error: msgErr }) => {
        if (msgErr) { setLoadingMsgs(false); return; } // messages table not yet migrated
        setMessages((data ?? []) as Message[]);
        setLoadingMsgs(false);
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
        // Mark unread
        const unread = (data ?? []).filter((m: Message) => m.recipient_id === myId && !m.read_at).map((m: Message) => m.id);
        if (unread.length) supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {});
      });
  }, [selectedId]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!msgInput.trim() || !selectedId || !profileIdRef.current) return;
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setSending(true);
    const body = msgInput.trim();
    setMsgInput("");
    const { error: sendErr } = await supabase.from("messages").insert({
      sender_id:    profileIdRef.current,
      recipient_id: selectedId,
      body,
      thread_id:    [profileIdRef.current, selectedId].sort().join("_"),
    });
    if (sendErr) setMsgInput(body);
    setSending(false);
  }

  const selected = threads.find(t => t.counselor_id === selectedId) ?? null;

  if (loadingThreads) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto mt-8 rounded-xl px-5 py-4 flex items-center gap-3"
           style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
        <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "#dc2626" }} />
        <p className="text-[13px]" style={{ color: "#991b1b" }}>{error}</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-2xl mx-auto space-y-4">

        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.text }}>Messages</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
            Secure, private messages from your support team
          </p>
        </div>

        {threads.length === 0 ? (
          /* Empty — no counselors have consent yet */
          <div className="rounded-2xl p-10 flex flex-col items-center text-center gap-3"
               style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: T.raised }}>
              <MessageCircle className="h-6 w-6" style={{ color: T.textMuted }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: T.textSub }}>No messages yet</p>
            <p className="text-[13px] max-w-xs leading-relaxed" style={{ color: T.textMuted }}>
              Messages appear here when a counselor reaches out after you share data with them in Privacy Settings.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow, minHeight: 480 }}>

            {/* Thread selector — only shown when multiple counselors */}
            {threads.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto" style={{ borderBottom: `1px solid ${T.border}` }}>
                {threads.map(t => (
                  <button key={t.counselor_id}
                          onClick={() => setSelectedId(t.counselor_id)}
                          className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                          style={selectedId === t.counselor_id
                            ? { background: T.green, color: "#fff" }
                            : { background: T.raised, color: T.textSub, border: `1px solid ${T.border}` }}>
                    {t.counselor_name}
                  </button>
                ))}
              </div>
            )}

            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-[13px]" style={{ color: T.textMuted }}>Select a counselor above</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${T.border}`, background: T.raised }}>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                       style={{ background: T.greenLight, color: T.green }}>
                    {selected?.counselor_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: T.text }}>{selected?.counselor_name}</p>
                    <p className="text-[11px]" style={{ color: T.textMuted }}>
                      {selected?.scope === "full" ? "Full access" : "Summary access"} · Secure & private
                    </p>
                  </div>
                </div>

                {/* Message thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 300 }}>
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <MessageCircle className="h-7 w-7" style={{ color: "#cbd5e1" }} />
                      <p className="text-[13px]" style={{ color: T.textMuted }}>No messages yet</p>
                      <p className="text-[11px] text-center max-w-[220px] leading-relaxed" style={{ color: T.textMuted }}>
                        Your counselor can send you a message here. You can also reach out to them first.
                      </p>
                    </div>
                  ) : messages.map(msg => {
                    const isMe = msg.sender_id === profileId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[78%] rounded-2xl px-3.5 py-2.5"
                             style={{ background: isMe ? T.green : T.raised, color: isMe ? "#fff" : T.text }}>
                          <p className="text-[13px] leading-relaxed">{msg.body}</p>
                          <p className="text-[10px] mt-1 opacity-60 text-right">{fmtTime(msg.sent_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Compose */}
                <div className="p-3" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
                       style={{ borderColor: T.border, background: T.raised }}>
                    <input
                      className="flex-1 bg-transparent text-[13px] outline-none"
                      style={{ color: T.text }}
                      placeholder={`Message ${selected?.counselor_name ?? "your counselor"}…`}
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      maxLength={2000}
                    />
                    <button onClick={send} disabled={!msgInput.trim() || sending}
                            className="flex items-center justify-center h-7 w-7 rounded-lg transition-opacity disabled:opacity-40"
                            style={{ background: T.green, color: "#fff" }}>
                      {sending
                        ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        : <Send className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center mt-1.5">
                    <ShieldCheck className="h-3 w-3" style={{ color: T.textMuted }} />
                    <p className="text-[10px]" style={{ color: T.textMuted }}>
                      Secure · FERPA-compliant · Only your counselor sees these messages
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
