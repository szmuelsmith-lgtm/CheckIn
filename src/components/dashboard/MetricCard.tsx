"use client";

/**
 * MetricCard — reusable KPI card for all dashboards.
 *
 * Layout (top → bottom):
 *   [icon]  LABEL                    [trend chip / status badge]
 *   Large value + optional suffix
 *   Optional subtitle
 *   Optional progress bar
 *   Optional breakdown badges
 *
 * Styling tokens are passed as props so each dashboard can stay within
 * its own color palette while sharing the same structure.
 */

import React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface MetricBadge {
  label: string;
  /** Foreground text colour */
  color: string;
  /** Background colour */
  bg: string;
}

export interface MetricCardProps {
  /** Screen-reader label describing the whole card */
  ariaLabel: string;
  /** Short metric name shown next to the icon */
  label: string;
  /** Primary value (number or string) */
  value: string | number;
  /** Appended to value in a smaller weight, e.g. "%" */
  valueSuffix?: string;
  /** Colour override for the value text */
  valueColor?: string;
  /** Secondary line below the value */
  subtitle?: string;
  /** Lucide icon element (rendered at 16 × 16) */
  icon: React.ReactNode;
  /** Icon foreground colour */
  iconColor: string;
  /** Icon container background colour */
  iconBg: string;
  /**
   * Signed percentage change for the trend chip.
   * Positive → green arrow, negative → red arrow, near-zero → flat.
   * Omit to hide the chip entirely.
   */
  trendPct?: number;
  /**
   * Progress bar fill 0–100.
   * Omit to hide the bar.
   */
  progress?: number;
  /** Colour of the progress bar fill */
  progressColor?: string;
  /** Small coloured breakdown pills (e.g. "3 high", "2 moderate") */
  badges?: MetricBadge[];
  /**
   * Pill shown in the top-right instead of a trend chip.
   * Useful for discrete status labels like "4 available".
   */
  statusBadge?: MetricBadge & { label: string };
  /** Wraps the card in a Next.js <Link> and shows an arrow on hover */
  href?: string;
}

// ─── Trend chip ───────────────────────────────────────────────────────────────

function TrendChip({ pct }: { pct: number }) {
  const up   = pct >  2;
  const down = pct < -2;
  const color  = up ? "#16a34a" : down ? "#dc2626" : "#6b7280";
  const bg     = up ? "#f0fdf4" : down ? "#fef2f2" : "#f9fafb";
  const border = up ? "#bbf7d0" : down ? "#fecaca" : "#e5e7eb";

  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
      style={{ color, background: bg, border: `1px solid ${border}` }}
      aria-label={`${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% month-over-month`}
    >
      {up   ? <TrendingUp   className="h-3 w-3" aria-hidden /> :
       down ? <TrendingDown className="h-3 w-3" aria-hidden /> :
              <Minus        className="h-3 w-3" aria-hidden />}
      {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

// ─── Card body ────────────────────────────────────────────────────────────────

function CardBody({
  label, value, valueSuffix, valueColor, subtitle,
  icon, iconColor, iconBg,
  trendPct, progress, progressColor,
  badges, statusBadge, href,
}: MetricCardProps) {
  const hasRightSlot = trendPct != null || statusBadge != null || href != null;

  return (
    <>
      {/* ── Header row ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* Icon badge — circle instead of square avoids the "white square" look */}
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: iconBg, color: iconColor }}
            aria-hidden
          >
            {icon}
          </div>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.07em] leading-tight truncate"
            style={{ color: "#6b7280" }}
          >
            {label}
          </span>
        </div>

        {hasRightSlot && (
          <div className="shrink-0 flex items-center gap-1">
            {trendPct != null && <TrendChip pct={trendPct} />}
            {statusBadge != null && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: statusBadge.bg, color: statusBadge.color }}
              >
                {statusBadge.label}
              </span>
            )}
            {href != null && trendPct == null && statusBadge == null && (
              <ArrowRight
                className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
                aria-hidden
                style={{ color: "#6b7280" }}
              />
            )}
            {href != null && (trendPct != null || statusBadge != null) && (
              <ArrowRight
                className="h-3.5 w-3.5 opacity-30 group-hover:opacity-60 transition-opacity"
                aria-hidden
                style={{ color: "#6b7280" }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Value ────────────────────────────────────────────────── */}
      <p
        className="text-[32px] font-bold tracking-tight tabular-nums leading-none"
        style={{ color: valueColor ?? "#111827" }}
      >
        {value}
        {valueSuffix && (
          <span
            className="text-[18px] font-medium ml-1 tracking-normal"
            style={{ color: "#9ca3af" }}
          >
            {valueSuffix}
          </span>
        )}
      </p>

      {/* ── Subtitle ─────────────────────────────────────────────── */}
      {subtitle && (
        <p className="text-[11px] mt-1.5 leading-snug" style={{ color: "#9ca3af" }}>
          {subtitle}
        </p>
      )}

      {/* ── Progress bar ─────────────────────────────────────────── */}
      {progress != null && (
        <div className="mt-4" role="presentation">
          <div
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ background: "#f3f4f6" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
                background: progressColor ?? "#4f46e5",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Breakdown badges ─────────────────────────────────────── */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {badges.map((b, i) => (
            <span
              key={i}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: b.bg, color: b.color }}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

const cardBase: React.CSSProperties = {
  background:  "#ffffff",
  border:      "1px solid #e5e7eb",
  boxShadow:   "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
};

export function MetricCard(props: MetricCardProps) {
  const { href, ariaLabel } = props;

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl p-5 group transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        style={cardBase}
        aria-label={ariaLabel}
      >
        <CardBody {...props} />
      </Link>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={cardBase}
      role="region"
      aria-label={ariaLabel}
    >
      <CardBody {...props} />
    </div>
  );
}
