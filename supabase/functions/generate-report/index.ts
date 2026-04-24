// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#ea580c";
  return "#dc2626";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Moderate Match";
  if (score >= 40) return "Partial Match";
  return "Low Match";
}

function buildHtml(data: {
  projectName: string;
  proposalType: string;
  cloudProvider: string;
  generatedAt: string;
  requirementsResult?: {
    requirements: { id: string; type: string; text: string; section?: string; supportingText?: string }[];
    totalShall: number;
    totalMust: number;
    summary: string;
  } | null;
  evaluationResult?: {
    overallScore: number;
    categories: { name: string; score: number; maxScore: number }[];
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    summary: string;
    techStack?: { name: string; category: string; required: boolean; context?: string }[];
  } | null;
  solutionResult?: {
    solutionTitle: string;
    solutionOverview: string;
    keyComponents: { name: string; description: string; cloudProvider: string; rfpQuotes?: string[] }[];
  } | null;
}): string {
  const { projectName, proposalType, cloudProvider, generatedAt, requirementsResult, evaluationResult, solutionResult } = data;
  const score = evaluationResult?.overallScore ?? null;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = score !== null ? circumference * (1 - score / 100) : circumference;

  // ── TOC items ─────────────────────────────────────────────────────────────
  const tocItems: string[] = [];
  if (requirementsResult) tocItems.push(`<li><a href="#requirements">Requirements Analysis</a><span class="toc-dots"></span><span class="toc-pg">2</span></li>`);
  if (evaluationResult)   tocItems.push(`<li><a href="#evaluation">Evaluation Results</a><span class="toc-dots"></span><span class="toc-pg">${requirementsResult ? 3 : 2}</span></li>`);
  if (solutionResult)     tocItems.push(`<li><a href="#solution">Solution Architecture</a><span class="toc-dots"></span><span class="toc-pg">${[requirementsResult, evaluationResult].filter(Boolean).length + 2}</span></li>`);

  // ── Requirements table rows ──────────────────────────────────────────────
  const reqRows = (requirementsResult?.requirements ?? []).map((r) => `
    <tr>
      <td class="req-id">${esc(r.id)}</td>
      <td><span class="badge badge-${r.type === "must" ? "must" : "shall"}">${esc(r.type.toUpperCase())}</span></td>
      <td class="req-text">
        ${esc(r.text)}
        ${r.section ? `<div class="req-section">§ ${esc(r.section)}</div>` : ""}
        ${r.supportingText ? `<div class="req-support">${esc(r.supportingText)}</div>` : ""}
      </td>
    </tr>`).join("");

  // ── Category bars ────────────────────────────────────────────────────────
  const catBars = (evaluationResult?.categories ?? []).map((c) => {
    const pct = Math.round((c.score / c.maxScore) * 100);
    const col = scoreColor(pct);
    return `
      <div class="cat-row">
        <div class="cat-label">${esc(c.name)}</div>
        <div class="cat-bar-wrap">
          <div class="cat-bar" style="width:${pct}%;background:${col}"></div>
        </div>
        <div class="cat-score" style="color:${col}">${c.score}/${c.maxScore}</div>
      </div>`;
  }).join("");

  // ── Tech stack groups ────────────────────────────────────────────────────
  const tsGroups: Record<string, typeof evaluationResult.techStack> = {};
  for (const ts of (evaluationResult?.techStack ?? [])) {
    (tsGroups[ts.category] ??= []).push(ts);
  }
  const tsHtml = Object.entries(tsGroups).map(([cat, items]) => `
    <div class="ts-group">
      <div class="ts-cat">${esc(cat)}</div>
      <div class="ts-chips">
        ${items.map(t => `<span class="ts-chip ${t.required ? "required" : "optional"}">${esc(t.name)}</span>`).join("")}
      </div>
    </div>`).join("");

  // ── Solution components ──────────────────────────────────────────────────
  const compCards = (solutionResult?.keyComponents ?? []).map((c) => `
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-name">${esc(c.name)}</span>
        <span class="comp-cloud">${esc(c.cloudProvider)}</span>
      </div>
      <p class="comp-desc">${esc(c.description)}</p>
      ${(c.rfpQuotes?.length) ? `<div class="comp-quotes">${c.rfpQuotes.map(q => `<blockquote>${esc(q)}</blockquote>`).join("")}</div>` : ""}
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Proposal Evaluation — ${esc(projectName)}</title>
<style>
  /* ── Force all backgrounds/colors to print exactly ──────────────────── */
  *, *::before, *::after {
    box-sizing: border-box; margin: 0; padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  html { font-size: 14px; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1e293b;
    background: #f8fafc;
    line-height: 1.6;
  }
  a { color: inherit; text-decoration: none; }

  /* ── Page wrapper ────────────────────────────────────────────────────── */
  .page { max-width: 900px; margin: 0 auto; padding: 0 0 60px; }

  /* ── Print toolbar ───────────────────────────────────────────────────── */
  .print-bar {
    position: sticky; top: 0; z-index: 100;
    background: #1e1b4b; color: #e0e7ff;
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 24px; gap: 12px;
    font-size: 13px;
  }
  .print-bar strong { font-size: 14px; color: #fff; }
  .print-btn {
    background: #6366f1; color: #fff; border: none;
    padding: 8px 22px; border-radius: 6px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
  }
  .print-btn:hover { background: #4f46e5; }

  /* ── Cover page ──────────────────────────────────────────────────────── */
  .cover {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1d4ed8 100%);
    color: #fff;
    padding: 80px 60px 70px;
    position: relative;
    overflow: hidden;
    min-height: 420px;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .cover::before {
    content: '';
    position: absolute; top: -80px; right: -80px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
  .cover::after {
    content: '';
    position: absolute; bottom: -60px; left: 200px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(99,102,241,0.25);
  }
  .cover-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: #a5b4fc; margin-bottom: 16px;
  }
  .cover-title {
    font-size: 38px; font-weight: 800; line-height: 1.15;
    margin-bottom: 10px;
  }
  .cover-project {
    font-size: 18px; color: #c7d2fe; margin-bottom: 28px; font-weight: 500;
  }
  .cover-meta {
    display: flex; gap: 20px; flex-wrap: wrap;
  }
  .cover-pill {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px; padding: 5px 16px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  }

  /* ── Executive summary bar ───────────────────────────────────────────── */
  .exec-bar {
    display: grid; grid-template-columns: repeat(3, 1fr);
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .exec-cell {
    padding: 24px 20px; text-align: center;
    border-right: 1px solid #e2e8f0;
  }
  .exec-cell:last-child { border-right: none; }
  .exec-number {
    font-size: 36px; font-weight: 800; line-height: 1;
    margin-bottom: 4px;
  }
  .exec-label {
    font-size: 11px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; color: #64748b;
  }

  /* ── Section wrapper ─────────────────────────────────────────────────── */
  .section {
    background: #fff;
    margin: 28px 0;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .section-header {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 28px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .section-num {
    width: 30px; height: 30px; border-radius: 50%;
    background: #6366f1; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; flex-shrink: 0;
  }
  .section-title { font-size: 16px; font-weight: 700; color: #1e293b; }
  .section-body { padding: 24px 28px; }

  /* ── TOC ─────────────────────────────────────────────────────────────── */
  .toc {
    background: #fff; margin: 28px 0;
    border-radius: 12px; border: 1px solid #e2e8f0;
    padding: 24px 28px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .toc h3 { font-size: 14px; font-weight: 700; margin-bottom: 14px; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
  .toc ul { list-style: none; }
  .toc li {
    display: flex; align-items: baseline; gap: 6px;
    padding: 7px 0; border-bottom: 1px dashed #e2e8f0;
    font-size: 13px;
  }
  .toc li:last-child { border-bottom: none; }
  .toc-dots { flex: 1; border-bottom: 2px dotted #cbd5e1; margin: 0 6px; position: relative; top: -3px; }
  .toc-pg { color: #6366f1; font-weight: 700; white-space: nowrap; }
  .toc a:hover { color: #6366f1; }

  /* ── Requirements ────────────────────────────────────────────────────── */
  .req-summary {
    display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .req-stat {
    background: #f1f5f9; border-radius: 8px; padding: 12px 20px;
    flex: 1; min-width: 120px; text-align: center;
  }
  .req-stat-num { font-size: 28px; font-weight: 800; }
  .req-stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
  .req-summary-text { color: #475569; font-size: 13px; line-height: 1.7; margin-bottom: 20px; }

  .req-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .req-table thead th {
    background: #f1f5f9; padding: 10px 14px; text-align: left;
    font-weight: 700; font-size: 11px; letter-spacing: 0.8px;
    text-transform: uppercase; color: #64748b;
    border-bottom: 2px solid #e2e8f0;
  }
  .req-table tbody tr { border-bottom: 1px solid #f1f5f9; }
  .req-table tbody tr:hover { background: #fafbff; }
  .req-table td { padding: 10px 14px; vertical-align: top; }
  .req-id { font-family: monospace; color: #6366f1; font-weight: 700; white-space: nowrap; }
  .req-text { line-height: 1.55; }
  .req-section { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  .req-support { font-size: 11px; color: #64748b; font-style: italic; margin-top: 4px; background: #f8fafc; padding: 4px 8px; border-left: 2px solid #e2e8f0; border-radius: 2px; }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; }
  .badge-shall { background: #ede9fe; color: #5b21b6; }
  .badge-must  { background: #fee2e2; color: #b91c1c; }

  /* ── Evaluation ──────────────────────────────────────────────────────── */
  .score-hero {
    display: flex; align-items: center; gap: 32px; margin-bottom: 28px; flex-wrap: wrap;
  }
  .score-gauge { flex-shrink: 0; position: relative; width: 130px; height: 130px; }
  .score-gauge svg { transform: rotate(-90deg); }
  .score-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .score-num { font-size: 30px; font-weight: 800; line-height: 1; }
  .score-pct { font-size: 12px; color: #64748b; font-weight: 600; }
  .score-label-text {
    font-size: 22px; font-weight: 800; margin-bottom: 6px;
  }
  .score-summary { color: #475569; font-size: 13px; line-height: 1.7; max-width: 520px; }

  .cat-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .cat-row { display: flex; align-items: center; gap: 12px; }
  .cat-label { width: 180px; font-size: 12.5px; font-weight: 600; color: #334155; flex-shrink: 0; }
  .cat-bar-wrap { flex: 1; height: 10px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
  .cat-bar { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
  .cat-score { width: 52px; text-align: right; font-size: 12px; font-weight: 700; flex-shrink: 0; }

  .sw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .sw-card { border-radius: 8px; overflow: hidden; }
  .sw-card-header {
    padding: 10px 16px; font-size: 12px; font-weight: 700;
    letter-spacing: 0.8px; text-transform: uppercase;
  }
  .sw-card-header.strengths { background: #dcfce7; color: #166534; }
  .sw-card-header.weaknesses { background: #fee2e2; color: #991b1b; }
  .sw-card ul { list-style: none; padding: 12px 16px; background: #f8fafc; }
  .sw-card ul li { font-size: 12.5px; padding: 5px 0; border-bottom: 1px solid #f1f5f9; display: flex; gap: 8px; }
  .sw-card ul li:last-child { border-bottom: none; }
  .sw-card ul li::before { content: '•'; flex-shrink: 0; font-size: 14px; }
  .sw-card.strengths ul li::before { color: #22c55e; }
  .sw-card.weaknesses ul li::before { color: #ef4444; }

  .rec-list { list-style: none; margin-bottom: 24px; }
  .rec-list li {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;
  }
  .rec-list li:last-child { border-bottom: none; }
  .rec-num {
    width: 22px; height: 22px; border-radius: 50%;
    background: #6366f1; color: #fff; display: flex; align-items: center;
    justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;
    margin-top: 1px;
  }

  .ts-section-title { font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 14px; }
  .ts-group { margin-bottom: 14px; }
  .ts-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px; }
  .ts-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .ts-chip { padding: 4px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 600; }
  .ts-chip.required { background: #ede9fe; color: #5b21b6; border: 1px solid #c4b5fd; }
  .ts-chip.optional { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

  /* ── Solution ────────────────────────────────────────────────────────── */
  .sol-overview {
    color: #475569; font-size: 13px; line-height: 1.8;
    margin-bottom: 24px; white-space: pre-wrap;
  }
  .comp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .comp-card {
    border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
    background: #fff;
  }
  .comp-header {
    background: linear-gradient(135deg, #1e1b4b, #312e81);
    padding: 12px 16px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .comp-name { font-size: 13px; font-weight: 700; color: #fff; }
  .comp-cloud { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #a5b4fc; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; }
  .comp-desc { font-size: 12.5px; color: #475569; padding: 12px 16px; line-height: 1.6; }
  .comp-quotes { padding: 0 16px 12px; }
  .comp-quotes blockquote {
    font-size: 11.5px; color: #64748b; font-style: italic;
    border-left: 3px solid #c7d2fe; padding-left: 10px; margin-top: 6px;
    line-height: 1.5;
  }

  /* ── Footer ──────────────────────────────────────────────────────────── */
  .footer {
    text-align: center; padding: 28px 40px;
    font-size: 11px; color: #94a3b8;
    border-top: 1px solid #e2e8f0; margin-top: 20px;
  }
  .footer strong { color: #6366f1; }

  /* ── Print styles ────────────────────────────────────────────────────── */
  @media print {
    @page { size: letter portrait; margin: 14mm 12mm; }

    html, body { background: #fff !important; font-size: 10.5pt; }
    .print-bar { display: none !important; }
    .page { max-width: 100% !important; padding: 0 !important; }

    /* Cover — force gradient to print */
    .cover {
      break-after: page;
      min-height: 220px;
      padding: 50px 40px 40px;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1d4ed8 100%) !important;
    }
    .cover-eyebrow { color: #a5b4fc !important; }
    .cover-project  { color: #c7d2fe !important; }
    .cover-pill {
      background: rgba(255,255,255,0.15) !important;
      border: 1px solid rgba(255,255,255,0.25) !important;
    }

    /* Executive bar */
    .exec-bar { break-inside: avoid; box-shadow: none !important; }

    /* TOC */
    .toc { break-after: page; break-inside: avoid; box-shadow: none !important; }

    /* Section wrappers — allow internal breaks, keep header attached */
    .section {
      box-shadow: none !important;
      border-radius: 0 !important;
      border: 1px solid #e2e8f0 !important;
      margin: 14px 0 !important;
      overflow: visible !important;
    }
    .section-header {
      break-after: avoid;
      background: #f1f5f9 !important;
    }
    .section-body { break-before: avoid; }

    /* Section number circles */
    .section-num { background: #6366f1 !important; color: #fff !important; }

    /* Requirements */
    .req-table { font-size: 8.5pt; }
    .req-table thead { display: table-header-group; }
    .req-table tr  { break-inside: avoid; }
    .req-table thead th { background: #f1f5f9 !important; }
    .req-stat { background: #f1f5f9 !important; }
    .req-support { background: #f8fafc !important; }

    /* Badges */
    .badge-shall { background: #ede9fe !important; color: #5b21b6 !important; }
    .badge-must  { background: #fee2e2 !important; color: #b91c1c !important; }

    /* Evaluation */
    .score-hero { break-inside: avoid; }
    .cat-bar-wrap { background: #f1f5f9 !important; }

    .sw-grid { grid-template-columns: 1fr 1fr !important; break-inside: avoid; }
    .sw-card  { break-inside: avoid; }
    .sw-card-header.strengths  { background: #dcfce7 !important; color: #166534 !important; }
    .sw-card-header.weaknesses { background: #fee2e2 !important; color: #991b1b !important; }
    .sw-card ul { background: #f8fafc !important; }

    .rec-num { background: #6366f1 !important; color: #fff !important; }

    /* Tech stack chips */
    .ts-chip.required { background: #ede9fe !important; border-color: #c4b5fd !important; color: #5b21b6 !important; }
    .ts-chip.optional { background: #f1f5f9 !important; border-color: #e2e8f0 !important; }

    /* Solution components */
    .comp-grid { grid-template-columns: 1fr 1fr !important; }
    .comp-card { break-inside: avoid; }
    .comp-header {
      background: linear-gradient(135deg, #1e1b4b, #312e81) !important;
    }
    .comp-name  { color: #fff !important; }
    .comp-cloud {
      color: #a5b4fc !important;
      background: rgba(255,255,255,0.12) !important;
    }

    a { color: inherit !important; text-decoration: none !important; }
  }
</style>
</head>
<body>

<!-- Print toolbar (hidden on print) -->
<div class="print-bar">
  <div>
    <strong>Proposal Evaluation Report</strong>
    <span style="margin-left:12px;color:#a5b4fc">${esc(projectName)}</span>
  </div>
  <button class="print-btn" onclick="window.print()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
    Save as PDF
  </button>
</div>

<div class="page">

<!-- Cover -->
<div class="cover">
  <div class="cover-eyebrow">EZShield AI — Proposal Intelligence</div>
  <div class="cover-title">Proposal Evaluation<br>Report</div>
  <div class="cover-project">${esc(projectName)}</div>
  <div class="cover-meta">
    <span class="cover-pill">${esc(proposalType.charAt(0).toUpperCase() + proposalType.slice(1))}</span>
    <span class="cover-pill">${esc(cloudProvider.toUpperCase())}</span>
    <span class="cover-pill">${esc(generatedAt)}</span>
  </div>
</div>

<!-- Executive bar -->
${(requirementsResult || evaluationResult || solutionResult) ? `
<div class="exec-bar">
  <div class="exec-cell">
    <div class="exec-number" style="color:#6366f1">${requirementsResult ? requirementsResult.totalShall + requirementsResult.totalMust : "—"}</div>
    <div class="exec-label">Total Requirements</div>
  </div>
  <div class="exec-cell">
    <div class="exec-number" style="color:${score !== null ? scoreColor(score) : "#94a3b8"}">${score !== null ? score + "%" : "—"}</div>
    <div class="exec-label">Overall Fit Score</div>
  </div>
  <div class="exec-cell">
    <div class="exec-number" style="color:#0891b2">${solutionResult ? solutionResult.keyComponents.length : "—"}</div>
    <div class="exec-label">Solution Components</div>
  </div>
</div>` : ""}

<!-- TOC -->
${tocItems.length > 0 ? `
<div class="toc">
  <h3>Table of Contents</h3>
  <ul>${tocItems.join("")}</ul>
</div>` : ""}

<!-- Requirements -->
${requirementsResult ? `
<div class="section" id="requirements">
  <div class="section-header">
    <div class="section-num">1</div>
    <div class="section-title">Requirements Analysis</div>
  </div>
  <div class="section-body">
    <div class="req-summary">
      <div class="req-stat">
        <div class="req-stat-num" style="color:#5b21b6">${requirementsResult.totalShall}</div>
        <div class="req-stat-label">Shall Requirements</div>
      </div>
      <div class="req-stat">
        <div class="req-stat-num" style="color:#b91c1c">${requirementsResult.totalMust}</div>
        <div class="req-stat-label">Must Requirements</div>
      </div>
      <div class="req-stat">
        <div class="req-stat-num" style="color:#0891b2">${requirementsResult.totalShall + requirementsResult.totalMust}</div>
        <div class="req-stat-label">Total</div>
      </div>
    </div>
    <p class="req-summary-text">${esc(requirementsResult.summary)}</p>
    <table class="req-table">
      <thead>
        <tr>
          <th style="width:70px">ID</th>
          <th style="width:60px">Type</th>
          <th>Requirement</th>
        </tr>
      </thead>
      <tbody>${reqRows}</tbody>
    </table>
  </div>
</div>` : ""}

<!-- Evaluation -->
${evaluationResult ? `
<div class="section" id="evaluation">
  <div class="section-header">
    <div class="section-num">${requirementsResult ? 2 : 1}</div>
    <div class="section-title">Evaluation Results</div>
  </div>
  <div class="section-body">
    <div class="score-hero">
      <div class="score-gauge">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="54" fill="none" stroke="#f1f5f9" stroke-width="12"/>
          <circle cx="65" cy="65" r="54" fill="none"
            stroke="${scoreColor(evaluationResult.overallScore)}" stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"/>
        </svg>
        <div class="score-center">
          <div class="score-num" style="color:${scoreColor(evaluationResult.overallScore)}">${evaluationResult.overallScore}</div>
          <div class="score-pct">/ 100</div>
        </div>
      </div>
      <div>
        <div class="score-label-text" style="color:${scoreColor(evaluationResult.overallScore)}">${scoreLabel(evaluationResult.overallScore)}</div>
        <div class="score-summary">${esc(evaluationResult.summary)}</div>
      </div>
    </div>

    <div class="cat-list">${catBars}</div>

    <div class="sw-grid">
      <div class="sw-card strengths">
        <div class="sw-card-header strengths">Strengths</div>
        <ul>${(evaluationResult.strengths ?? []).map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      </div>
      <div class="sw-card weaknesses">
        <div class="sw-card-header weaknesses">Weaknesses</div>
        <ul>${(evaluationResult.weaknesses ?? []).map(w => `<li>${esc(w)}</li>`).join("")}</ul>
      </div>
    </div>

    ${(evaluationResult.recommendations?.length) ? `
    <div class="ts-section-title" style="margin-bottom:12px">Recommendations</div>
    <ul class="rec-list">
      ${(evaluationResult.recommendations ?? []).map((r, i) => `
        <li><div class="rec-num">${i + 1}</div><span>${esc(r)}</span></li>`).join("")}
    </ul>` : ""}

    ${tsHtml ? `
    <div class="ts-section-title">Recommended Tech Stack</div>
    ${tsHtml}` : ""}
  </div>
</div>` : ""}

<!-- Solution -->
${solutionResult ? `
<div class="section" id="solution">
  <div class="section-header">
    <div class="section-num">${[requirementsResult, evaluationResult].filter(Boolean).length + 1}</div>
    <div class="section-title">Solution Architecture</div>
  </div>
  <div class="section-body">
    <h2 style="font-size:18px;font-weight:800;margin-bottom:12px;color:#1e1b4b">${esc(solutionResult.solutionTitle)}</h2>
    <p class="sol-overview">${esc(solutionResult.solutionOverview.replace(/[#*`]/g, ""))}</p>
    <div class="ts-section-title">Key Components</div>
    <div class="comp-grid">${compCards}</div>
  </div>
</div>` : ""}

<!-- Footer -->
<div class="footer">
  Generated by <strong>EZShield AI</strong> &nbsp;·&nbsp; ${esc(generatedAt)} &nbsp;·&nbsp; ${esc(projectName)}
</div>

</div><!-- /page -->
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const html = buildHtml({
      projectName: body.projectName ?? "Unknown Project",
      proposalType: body.proposalType ?? "enterprise",
      cloudProvider: body.cloudProvider ?? "aws",
      generatedAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      requirementsResult: body.requirementsResult ?? null,
      evaluationResult: body.evaluationResult ?? null,
      solutionResult: body.solutionResult ?? null,
    });

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
