"use client";

/**
 * Dev-only preview of the psychiatrist dashboard workspace.
 * No auth required. Accessible at /dev/psych
 * Shows all 5 tabs with demo data so the UI can be verified without logging in.
 */

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { MessageCircle, Send, History, Activity, TrendingUp, ShieldCheck } from "lucide-react";

const T = {
  bg:         "#f8fafc",
  surface:    "#ffffff",
  raised:     "#f1f5f9",
  border:     "#e2e8f0",
  text:       "#0f172a",
  textSub:    "#334155",
  textMuted:  "#64748b",
  blue:       "#4f46e5",
  blueLight:  "#eef2ff",
  blueBorder: "#c7d2fe",
  green:      "#16a34a",
  greenLight: "#f0fdf4",
  amber:      "#d97706",
  amberLight: "#fefce8",
  red:        "#dc2626",
};

type TabId = "overview" | "assessment" | "history" | "messages" | "actions";

const PILLAR_CFG = [
  { key: "emotional",  label: "Emotional",  color: "#16a34a", track: "#dcfce7" },
  { key: "resilience", label: "Resilience", color: "#2563eb", track: "#dbeafe" },
  { key: "recovery",   label: "Recovery",   color: "#7c3aed", track: "#ede9fe" },
  { key: "support",    label: "Support",    color: "#0891b2", track: "#cffafe" },
];

const PILLAR_HISTORY = [
  { date: "May 20", emotional: 5.8, resilience: 6.0, recovery: 5.9, support: 5.7 },
  { date: "May 22", emotional: 5.2, resilience: 5.5, recovery: 5.3, support: 5.1 },
  { date: "May 25", emotional: 4.5, resilience: 5.0, recovery: 4.9, support: 4.8 },
];

const DEMO_MESSAGES = [
  { id: "m1", fromMe: true,  body: "Hi Jordan — I saw your recent check-in scores and wanted to reach out. How are you feeling heading into finals week?", time: "Mon 2:10 PM" },
  { id: "m2", fromMe: false, body: "Honestly pretty stressed. I have three exams back to back and practice hasn't let up at all. Sleep has been rough.", time: "Mon 4:32 PM" },
  { id: "m3", fromMe: true,  body: "That combination is tough. Have you been using any of the wind-down strategies we talked about last session?", time: "Mon 5:15 PM" },
  { id: "m4", fromMe: false, body: "I tried the breathing thing a couple nights but I kind of forgot. I'll try again tonight.", time: "Tue 9:05 AM" },
  { id: "m5", fromMe: true,  body: "That's a good start. Even 5 minutes before bed makes a difference. We're meeting Thursday at 10:30 — want to add sleep tracking to your check-in until then?", time: "Tue 10:22 AM" },
  { id: "m6", fromMe: false, body: "Yeah sure, that sounds helpful. Thanks for checking in.", time: "Tue 2:48 PM" },
];

const SCORE_HISTORY = [6.1, 5.8, 5.5, 5.2, 4.9, 4.8];

function ScoreLine() {
  const W = 120, H = 32, pad = 3;
  const pts = SCORE_HISTORY.map((v, i) => ({
    x: pad + (i / (SCORE_HISTORY.length - 1)) * (W - pad * 2),
    y: H - pad - (v / 10) * (H - pad * 2),
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={T.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={T.amber} />
    </svg>
  );
}

export default function DevPsychPreview() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 8, background: T.amberLight, border: `1px solid #fcd34d`, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
          DEV PREVIEW — /dev/psych — No auth required. Psychiatrist dashboard demo.
        </div>

        <div style={{ display: "flex", gap: 16 }}>

          {/* Sidebar patient list */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ borderRadius: 12, overflow: "hidden", background: T.surface, border: `1px solid ${T.border}` }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.textMuted }}>Patient Queue · 5</div>
              {[
                { name: "Sam Rivera", risk: "red", badge: "High Risk" },
                { name: "Jordan Williams", risk: "yellow", active: true, badge: "Moderate" },
                { name: "Morgan Lee", risk: "yellow", badge: "Moderate" },
                { name: "Alex Johnson", risk: "green", badge: "Stable" },
                { name: "Taylor Brooks", risk: "green", badge: "Stable" },
              ].map((a, i) => (
                <div key={a.name} style={{
                  padding: "10px 14px",
                  borderTop: i > 0 ? `1px solid ${T.border}` : undefined,
                  background: a.active ? T.blueLight : undefined,
                  cursor: "pointer",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{a.name}</div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                    background: a.risk === "red" ? "#fee2e2" : a.risk === "yellow" ? T.amberLight : T.greenLight,
                    color: a.risk === "red" ? T.red : a.risk === "yellow" ? T.amber : T.green,
                  }}>{a.badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace */}
          <div style={{ flex: 1, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", minHeight: 560 }}>

            {/* Patient header */}
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.amberLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: T.amber }}>J</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Jordan Williams</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: T.amberLight, color: T.amber }}>Moderate</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: T.blueLight, color: T.blue }}>Arrived</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Summary access · Last check-in: 3 days ago · Today 10:30 AM</div>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 8px" }}>
              {(["overview", "assessment", "history", "messages", "actions"] as TabId[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 14px", fontSize: 12, fontWeight: 600, border: "none", background: "none",
                    cursor: "pointer", textTransform: "capitalize", color: activeTab === tab ? T.blue : T.textMuted,
                    position: "relative",
                  }}>
                  {tab === "history" && <History style={{ width: 11, height: 11, marginRight: 4, display: "inline" }} />}
                  {tab === "messages" && <MessageCircle style={{ width: 11, height: 11, marginRight: 4, display: "inline" }} />}
                  {tab}
                  {activeTab === tab && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: T.blue, borderRadius: "2px 2px 0 0" }} />}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: "auto", padding: activeTab === "messages" ? 0 : 24, display: "flex", flexDirection: "column" }}>

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ borderRadius: 12, padding: 16, background: T.raised, border: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Activity style={{ width: 14, height: 14, color: T.blue }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted }}>Latest Score</span>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: T.amber, lineHeight: 1 }}>4.8<span style={{ fontSize: 16, fontWeight: 500, color: T.textMuted }}>/10</span></div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>5 check-ins in last 14 days</div>
                    </div>
                    <div style={{ borderRadius: 12, padding: 16, background: T.raised, border: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TrendingUp style={{ width: 14, height: 14, color: T.blue }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted }}>14-Day Trend</span>
                      </div>
                      <ScoreLine />
                      <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>↓ Declining</div>
                    </div>
                  </div>
                  <div style={{ borderRadius: 12, padding: 14, background: T.raised, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, marginBottom: 8 }}>Session Tags</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["Academic pressure", "Follow-up needed"].map(tag => (
                        <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: T.blueLight, color: T.blue, border: `1px solid ${T.blueBorder}` }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderRadius: 12, padding: 14, background: T.raised, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, marginBottom: 6 }}>Most Recent Note</div>
                    <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>Reported increased academic stress ahead of finals. Sleep duration averaging 5.5 hrs. Recommended wind-down breathing routine.</div>
                  </div>
                </div>
              )}

              {/* ASSESSMENT */}
              {activeTab === "assessment" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, marginBottom: 16 }}>Pillar Scores — Latest Check-In</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {[
                        { label: "Emotional",  score: 4.5, color: "#16a34a", track: "#dcfce7" },
                        { label: "Resilience", score: 5.0, color: "#2563eb", track: "#dbeafe" },
                        { label: "Recovery",   score: 4.9, color: "#7c3aed", track: "#ede9fe" },
                        { label: "Support",    score: 4.8, color: "#0891b2", track: "#cffafe" },
                      ].map(({ label, score, color, track }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, width: 72, flexShrink: 0, color: T.textMuted }}>{label}</span>
                          <div style={{ flex: 1, height: 6, borderRadius: 99, background: track, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(score / 10) * 100}%`, background: color, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, width: 32, textAlign: "right", color }}>{score.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderRadius: 12, padding: 14, background: T.raised, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, marginBottom: 8 }}>Overall Composite</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: T.amber }}>4.8<span style={{ fontSize: 14, color: T.textMuted }}>/10</span></div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Moderate concern — trending downward over 14 days</div>
                  </div>

                </div>
              )}

              {/* HISTORY */}
              {activeTab === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted }}>Wellness Trends — Last 14 Days</div>
                  <div style={{ borderRadius: 12, padding: 16, background: T.raised, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textSub }}>All Pillars</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={PILLAR_HISTORY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textMuted }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: T.textMuted }} tickLine={false} axisLine={false} ticks={[0, 5, 10]} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {PILLAR_CFG.map(p => (
                          <Line key={p.key} type="monotone" dataKey={p.key} name={p.label} stroke={p.color} strokeWidth={2} dot={false} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {PILLAR_CFG.map(p => {
                      const vals = PILLAR_HISTORY.map(h => (h as Record<string, unknown>)[p.key] as number);
                      const latest = vals[vals.length - 1];
                      const prev   = vals[vals.length - 2];
                      const delta  = latest - prev;
                      return (
                        <div key={p.key} style={{ borderRadius: 10, padding: 12, background: T.surface, border: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: p.color, marginBottom: 4 }}>{p.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: p.color }}>{latest.toFixed(1)}<span style={{ fontSize: 12, color: T.textMuted }}>/10</span></div>
                          <div style={{ fontSize: 10, color: delta >= 0 ? T.green : T.red, marginTop: 2 }}>
                            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)} vs prev
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MESSAGES */}
              {activeTab === "messages" && (
                <>
                  <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    {DEMO_MESSAGES.map(msg => (
                      <div key={msg.id} style={{ display: "flex", justifyContent: msg.fromMe ? "flex-end" : "flex-start" }}>
                        <div style={{
                          maxWidth: "75%", borderRadius: 16, padding: "10px 14px",
                          background: msg.fromMe ? T.blue : T.raised,
                          color: msg.fromMe ? "#fff" : T.text,
                        }}>
                          <div style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.body}</div>
                          <div style={{ fontSize: 10, opacity: 0.6, textAlign: "right", marginTop: 4 }}>{msg.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 12, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 10, border: `1px solid ${T.border}`, background: T.raised, padding: "8px 12px" }}>
                      <input style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: T.text }} placeholder="Message Jordan Williams…" />
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Send style={{ width: 13, height: 13, color: "#fff" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
                      <ShieldCheck style={{ width: 11, height: 11, color: T.textMuted }} />
                      <span style={{ fontSize: 10, color: T.textMuted }}>Secure · FERPA-compliant · Logged for compliance</span>
                    </div>
                  </div>
                </>
              )}

              {/* ACTIONS */}
              {activeTab === "actions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, marginBottom: 12 }}>Clinical Actions</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 10, background: `linear-gradient(135deg, #3730a3, ${T.blue})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                        📞 Contact
                      </button>
                      <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 10, background: T.surface, color: T.textSub, border: `1px solid ${T.border}`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        📅 Schedule follow-up
                      </button>
                    </div>
                  </div>
                  <div style={{ borderRadius: 12, padding: 16, background: T.blueLight, border: `1px solid ${T.blueBorder}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <ShieldCheck style={{ width: 16, height: 16, color: T.blue }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>FERPA-Compliant Referral</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5, marginBottom: 12 }}>Send a referral summary to this athlete&apos;s primary care team. Only aggregate scores and risk level are included — no verbatim responses.</div>
                    <button style={{ padding: "8px 16px", borderRadius: 8, background: T.blue, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      Send Referral Summary
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
