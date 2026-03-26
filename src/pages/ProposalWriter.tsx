import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileUp, Sparkles, Download, Loader2, X, FileText, ArrowLeft,
  ImagePlus, Palette, Building2, BookOpen, OctagonX, CheckCircle2,
  Layers, LayoutTemplate, Users, TrendingUp, Database, Bot,
  AlertCircle, ListChecks, Library,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import { readFileAsText } from "@/lib/fileReader";
import { extractShallMust, extractSectionHeadings } from "@/lib/requirementsExtractor";

// ─── Color Palettes ───────────────────────────────────────────────────────────
const PALETTES = [
  {
    id: "gold-marine",
    name: "Gold & Marine Blue",
    desc: "Metallic gold meets deep navy — classic, distinguished",
    primary: "#B8962E",
    secondary: "#0A2F5E",
    accent: "#1E4D8C",
    bg: "#FFFDF5",
    border: "#D4AF6B",
    swatch: ["#B8962E", "#0A2F5E", "#1E4D8C"],
  },
  {
    id: "navy-ivory",
    name: "Navy & Ivory",
    desc: "Trusted government look — formal and authoritative",
    primary: "#1B2A4A",
    secondary: "#4A6FA5",
    accent: "#2E5090",
    bg: "#FAFAF7",
    border: "#B0BEC5",
    swatch: ["#1B2A4A", "#4A6FA5", "#C8B560"],
  },
  {
    id: "forest-slate",
    name: "Forest Green & Slate",
    desc: "Sophisticated and grounded — great for environmental/defense",
    primary: "#1B4D2E",
    secondary: "#3D4F6E",
    accent: "#2E7D4E",
    bg: "#F8FAF8",
    border: "#A8C5A0",
    swatch: ["#1B4D2E", "#3D4F6E", "#7FB069"],
  },
  {
    id: "crimson-charcoal",
    name: "Crimson & Charcoal",
    desc: "Bold and powerful — commands attention",
    primary: "#8B1A1A",
    secondary: "#2C2C2C",
    accent: "#C0392B",
    bg: "#FAFAFA",
    border: "#DBBCBC",
    swatch: ["#8B1A1A", "#2C2C2C", "#E8C0B0"],
  },
  {
    id: "royal-silver",
    name: "Royal Purple & Silver",
    desc: "Distinctive and innovative — tech-forward feel",
    primary: "#4A1A8C",
    secondary: "#5A6A7A",
    accent: "#7B35CC",
    bg: "#FAFAFF",
    border: "#C4B0E0",
    swatch: ["#4A1A8C", "#7B35CC", "#9E9E9E"],
  },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];

// ─── Types ────────────────────────────────────────────────────────────────────
type UploadedFile = { file: File; content: string; status: "reading" | "done" | "error" };
type AgentLogEntry = { type: string; message: string; tool?: string; timestamp: number };
type RequirementsResult = { requirements: any[]; totalShall: number; totalMust: number; summary: string };

// ─── localStorage helpers ─────────────────────────────────────────────────────
const SK = "proposal-writer";
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(`${SK}:${key}`); return v ? JSON.parse(v) as T : null; } catch { return null; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(`${SK}:${key}`, JSON.stringify(value)); } catch { /* quota */ }
}

// ─── Agent log icon helper ────────────────────────────────────────────────────
const TOOL_ICONS: Record<string, React.ElementType> = {
  extract_requirements: ListChecks,
  retrieve_context:     Database,
  build_outline:        LayoutTemplate,
  write_proposal:       Sparkles,
};

// ─── Proposal Writer ──────────────────────────────────────────────────────────
const ProposalWriter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── inputs ──
  const [companyName,     setCompanyName]     = useState("");
  const [logoDataUrl,     setLogoDataUrl]     = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<PaletteId>("gold-marine");
  const [rfpFile,         setRfpFile]         = useState<UploadedFile | null>(null);
  const [capFiles,        setCapFiles]        = useState<UploadedFile[]>([]); // multiple company docs

  // ── agent state ──
  const [isAgentRunning,    setIsAgentRunning]    = useState(false);
  const [isIndexing,        setIsIndexing]        = useState(false);
  const [indexedChunks,     setIndexedChunks]     = useState<number | null>(null);
  const [isSeeding,         setIsSeeding]         = useState(false);
  const [seededChunks,      setSeededChunks]      = useState<number | null>(() => lsGet<number>("seededChunks"));
  const [agentLog,          setAgentLog]          = useState<AgentLogEntry[]>(() => lsGet<AgentLogEntry[]>("agentLog") ?? []);
  const [requirementsResult, setRequirementsResult] = useState<RequirementsResult | null>(() => lsGet<RequirementsResult>("requirementsResult"));
  const [proposal,          setProposal]          = useState<string>(() => lsGet<string>("proposal") ?? "");

  const rfpRef   = useRef<HTMLInputElement>(null);
  const capRef   = useRef<HTMLInputElement>(null);
  const logoRef  = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logRef   = useRef<HTMLDivElement>(null);

  // Stable session ID persisted to localStorage
  const sessionId = useMemo(() => {
    const stored = lsGet<string>("sessionId");
    if (stored) return stored;
    const id = crypto.randomUUID();
    lsSet("sessionId", id);
    return id;
  }, []);

  // Persist
  useEffect(() => { lsSet("agentLog", agentLog); }, [agentLog]);
  useEffect(() => { lsSet("requirementsResult", requirementsResult); }, [requirementsResult]);
  useEffect(() => { lsSet("proposal", proposal); }, [proposal]);
  useEffect(() => { if (seededChunks !== null) lsSet("seededChunks", seededChunks); }, [seededChunks]);

  // Auto-scroll agent log
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [agentLog.length]);

  const palette = PALETTES.find((p) => p.id === selectedPalette) ?? PALETTES[0];

  const appendLog = (entry: Omit<AgentLogEntry, "timestamp">) =>
    setAgentLog((prev) => [...prev, { ...entry, timestamp: Date.now() }]);

  // ── Index documents into pgvector ──────────────────────────────────────────
  const indexDocuments = useCallback(async (docs: { name: string; content: string }[]) => {
    if (docs.length === 0) return;
    setIsIndexing(true);
    setIndexedChunks(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1/index-documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ sessionId, documents: docs }),
        }
      );
      if (resp.ok) {
        const result = await resp.json();
        setIndexedChunks(result.totalChunks ?? 0);
      } else {
        console.warn("Indexing failed:", await resp.text());
      }
    } catch (e) {
      console.warn("Document indexing failed:", e);
    } finally {
      setIsIndexing(false);
    }
  }, [sessionId]);

  // ── Seed permanent knowledge base ─────────────────────────────────────────
  const seedKnowledgeBase = useCallback(async () => {
    setIsSeeding(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-knowledge-base`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await resp.json();
      if (result.success) {
        setSeededChunks(result.totalChunks ?? 0);
        toast({ title: "Style templates seeded!", description: `${result.totalChunks} chunks indexed from ${result.documents?.length ?? 3} reference documents.` });
      } else {
        throw new Error(result.error ?? "Seeding failed");
      }
    } catch (e: any) {
      toast({ title: "Seeding failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  }, [toast]);

  // ── File upload handlers ───────────────────────────────────────────────────
  const handleRfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRfpFile({ file: f, content: "", status: "reading" });
    try {
      const content = await readFileAsText(f);
      const done: UploadedFile = { file: f, content, status: "done" };
      setRfpFile(done);
      // Index RFP into pgvector too so it can be retrieved during writing
      indexDocuments([{ name: f.name, content }]);
    } catch {
      setRfpFile({ file: f, content: "", status: "error" });
      toast({ title: "Error reading RFP", variant: "destructive" });
    }
    if (rfpRef.current) rfpRef.current.value = "";
  };

  const handleCapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const newEntries: UploadedFile[] = selected.map((f) => ({ file: f, content: "", status: "reading" }));
    setCapFiles((prev) => [...prev, ...newEntries]);
    const completed: { name: string; content: string }[] = [];
    for (const f of selected) {
      try {
        const content = await readFileAsText(f);
        setCapFiles((prev) => prev.map((u) => u.file === f ? { ...u, content, status: "done" } : u));
        completed.push({ name: f.name, content });
      } catch {
        setCapFiles((prev) => prev.map((u) => u.file === f ? { ...u, content: "", status: "error" } : u));
      }
    }
    if (completed.length > 0) indexDocuments(completed);
    if (capRef.current) capRef.current.value = "";
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(f);
    if (logoRef.current) logoRef.current.value = "";
  };

  // ── Run Agent ──────────────────────────────────────────────────────────────
  const runAgent = useCallback(async () => {
    if (!rfpFile || rfpFile.status !== "done") {
      toast({ title: "RFP document required", description: "Upload the RFP before running the agent.", variant: "destructive" });
      return;
    }

    setIsAgentRunning(true);
    setAgentLog([]);
    setRequirementsResult(null);
    setProposal("");

    const rfpDocs = [{ name: rfpFile.file.name, content: rfpFile.content }];
    const capDocs = capFiles.filter((f) => f.status === "done").map((f) => ({ name: f.file.name, content: f.content }));

    // Client-side deterministic extraction
    const preExtracted = extractShallMust(rfpDocs);
    const sectionHeadings = extractSectionHeadings(rfpDocs);

    appendLog({
      type: "tool_start", tool: "extract_requirements",
      message: `Scanning RFP — found ${preExtracted.filter(r => r.type === "shall").length} SHALL and ${preExtracted.filter(r => r.type === "must").length} MUST requirements.`,
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1/write-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            rfpDocuments: rfpDocs.map((d) => ({ ...d, content: d.content.slice(0, 50_000) })),
            capabilityDocuments: capDocs.map((d) => ({ ...d, content: d.content.slice(0, 20_000) })),
            companyName: companyName.trim() || "Our Company",
            sessionId,
            preExtractedRequirements: preExtracted,
            sectionHeadings,
          }),
          signal: controller.signal,
        }
      );

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Agent request failed" }));
        throw new Error(err.error || "Agent request failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let proposalText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          let event: any;
          try { event = JSON.parse(jsonStr); } catch { continue; }

          switch (event.type) {
            case "tool_start":
              appendLog({ type: "tool_start", tool: event.tool, message: event.message });
              break;
            case "tool_result":
              appendLog({ type: "tool_result", tool: event.tool, message: `${event.tool.replace(/_/g, " ")} completed.` });
              if (event.tool === "extract_requirements" && event.data) {
                setRequirementsResult(event.data);
              }
              break;
            case "proposal_token":
              if (event.token) {
                proposalText += event.token;
                setProposal(proposalText);
              }
              break;
            case "agent_done":
              appendLog({ type: "agent_done", message: event.message });
              toast({ title: "Proposal complete!", description: event.message });
              break;
            case "agent_error":
              appendLog({ type: "agent_error", message: event.message });
              toast({ title: "Agent error", description: event.message, variant: "destructive" });
              break;
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        appendLog({ type: "agent_error", message: "Agent stopped by user." });
      } else {
        appendLog({ type: "agent_error", message: e.message });
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      abortRef.current = null;
      setIsAgentRunning(false);
    }
  }, [rfpFile, capFiles, companyName, sessionId, toast]);

  const stopAgent = () => { abortRef.current?.abort(); setIsAgentRunning(false); };

  // ── Download as DOCX ──────────────────────────────────────────────────────
  const downloadAsWord = useCallback(async () => {
    if (!proposal) return;
    const pHex = palette.primary.replace("#", "");
    const sHex = palette.secondary.replace("#", "");
    const aHex = palette.accent.replace("#", "");

    const parseInline = (text: string): TextRun[] =>
      text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g)
        .filter(Boolean)
        .map((part) => {
          if (part.startsWith("***") && part.endsWith("***")) return new TextRun({ text: part.slice(3, -3), bold: true, italics: true, font: "Calibri", size: 22, color: "1A1A1A" });
          if (part.startsWith("**") && part.endsWith("**")) return new TextRun({ text: part.slice(2, -2), bold: true, font: "Calibri", size: 22, color: "1A1A1A" });
          if (part.startsWith("*") && part.endsWith("*")) return new TextRun({ text: part.slice(1, -1), italics: true, font: "Calibri", size: 22, color: "1A1A1A" });
          return new TextRun({ text: part, font: "Calibri", size: 22, color: "1A1A1A" });
        });

    const paragraphs: Paragraph[] = [];

    if (logoDataUrl) {
      try {
        const base64 = logoDataUrl.split(",")[1];
        const ext = logoDataUrl.match(/data:image\/(\w+);/)?.[1]?.toUpperCase() as any;
        paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
        paragraphs.push(new Paragraph({
          children: [new ImageRun({ data: base64, transformation: { width: 150, height: 60 }, type: ext || "PNG" })],
          alignment: AlignmentType.CENTER, spacing: { after: 400 },
        }));
      } catch { /* skip */ }
    }

    paragraphs.push(new Paragraph({ text: "", spacing: { after: 400 } }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: companyName || "Our Company", bold: true, font: "Calibri", size: 56, color: pHex })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Technical Proposal", font: "Calibri", size: 34, color: sHex, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, font: "Calibri", size: 20, color: "777777" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "CONFIDENTIAL AND PROPRIETARY", font: "Calibri", size: 18, color: "999999", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }));

    for (const line of proposal.split("\n")) {
      if (line.startsWith("---")) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: "─".repeat(60), color: "DDDDDD", font: "Calibri", size: 18 })], spacing: { before: 240, after: 240 } }));
      } else if (line.startsWith("# ")) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(2), bold: true, font: "Calibri", size: 40, color: pHex })], heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 240 } }));
      } else if (line.startsWith("## ")) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(3), bold: true, font: "Calibri", size: 32, color: sHex })], heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 180 } }));
      } else if (line.startsWith("### ")) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(4), bold: true, font: "Calibri", size: 26, color: aHex })], heading: HeadingLevel.HEADING_3, spacing: { before: 280, after: 120 } }));
      } else if (line.startsWith("#### ")) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(5), bold: true, font: "Calibri", size: 22, color: "1A1A1A" })], heading: HeadingLevel.HEADING_4, spacing: { before: 200, after: 100 } }));
      } else if (/^\s*[-*]\s/.test(line)) {
        paragraphs.push(new Paragraph({ children: parseInline(line.replace(/^\s*[-*]\s/, "")), bullet: { level: line.startsWith("  ") ? 1 : 0 }, spacing: { after: 80 } }));
      } else if (/^\d+\.\s/.test(line)) {
        paragraphs.push(new Paragraph({ children: parseInline(line.replace(/^\d+\.\s/, "")), numbering: { reference: "default-numbering", level: 0 }, spacing: { after: 80 }, indent: { left: 360 } }));
      } else if (line.startsWith("> ")) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.slice(2), font: "Calibri", size: 20, color: "555555", italics: true })], indent: { left: 720 }, spacing: { after: 80 }, border: { left: { color: pHex, size: 24, space: 12, style: "single" } } }));
      } else if (line.trim() === "") {
        paragraphs.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      } else {
        paragraphs.push(new Paragraph({ children: parseInline(line), spacing: { after: 120, line: 280 } }));
      }
    }

    const doc = new Document({
      numbering: { config: [{ reference: "default-numbering", levels: [{ level: 0, format: "decimal" as any, text: "%1.", alignment: AlignmentType.START }] }] },
      sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1260 } } }, children: paragraphs }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${(companyName || "proposal").replace(/\s+/g, "_")}_proposal.docx`);
    toast({ title: "Downloaded!", description: "Proposal saved as Word document." });
  }, [proposal, companyName, palette, logoDataUrl, toast]);

  // ── Download as PDF ────────────────────────────────────────────────────────
  const downloadAsPdf = useCallback(async () => {
    if (!proposal) return;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const marginL = 72, marginR = 72, marginT = 72, marginB = 72;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const usableW = pageW - marginL - marginR;
    let y = marginT;

    const newPage = () => { doc.addPage(); y = marginT; };
    const checkSpace = (needed: number) => { if (y + needed > pageH - marginB) newPage(); };

    // Cover page
    if (logoDataUrl) {
      try {
        const ext = (logoDataUrl.match(/data:image\/(\w+);/)?.[1] ?? "PNG").toUpperCase();
        doc.addImage(logoDataUrl, ext as any, pageW / 2 - 60, y, 120, 48);
        y += 64;
      } catch { /* skip */ }
    }
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(palette.primary);
    doc.text(companyName || "Our Company", pageW / 2, y, { align: "center" });
    y += 32;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(16);
    doc.setTextColor(palette.secondary);
    doc.text("Technical Proposal", pageW / 2, y, { align: "center" });
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#777777");
    doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageW / 2, y, { align: "center" });
    y += 14;
    doc.text("CONFIDENTIAL AND PROPRIETARY", pageW / 2, y, { align: "center" });
    doc.addPage();
    y = marginT;

    // Body
    const lines = proposal.split("\n");
    for (const line of lines) {
      if (line.startsWith("# ")) {
        checkSpace(30);
        doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(palette.primary);
        const wrapped = doc.splitTextToSize(line.slice(2), usableW);
        doc.text(wrapped, marginL, y); y += wrapped.length * 20 + 8;
      } else if (line.startsWith("## ")) {
        checkSpace(24);
        doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(palette.secondary);
        const wrapped = doc.splitTextToSize(line.slice(3), usableW);
        doc.text(wrapped, marginL, y); y += wrapped.length * 17 + 6;
      } else if (line.startsWith("### ")) {
        checkSpace(20);
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(palette.accent);
        const wrapped = doc.splitTextToSize(line.slice(4), usableW);
        doc.text(wrapped, marginL, y); y += wrapped.length * 15 + 4;
      } else if (line.startsWith("---")) {
        checkSpace(10);
        doc.setDrawColor("#DDDDDD"); doc.line(marginL, y, pageW - marginR, y); y += 10;
      } else if (/^\s*[-*]\s/.test(line)) {
        const text = "• " + line.replace(/^\s*[-*]\s/, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor("#1A1A1A");
        const wrapped = doc.splitTextToSize(text, usableW - 12);
        checkSpace(wrapped.length * 13 + 3);
        doc.text(wrapped, marginL + 12, y); y += wrapped.length * 13 + 3;
      } else if (line.trim() === "") {
        y += 6;
      } else {
        const text = line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/^> /, "    ");
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor("#1A1A1A");
        const wrapped = doc.splitTextToSize(text, usableW);
        checkSpace(wrapped.length * 13 + 4);
        doc.text(wrapped, marginL, y); y += wrapped.length * 13 + 4;
      }
    }

    doc.save(`${(companyName || "proposal").replace(/\s+/g, "_")}_proposal.pdf`);
    toast({ title: "Downloaded!", description: "Proposal saved as PDF." });
  }, [proposal, companyName, palette, logoDataUrl, toast]);

  // ── Agent log entry renderer ───────────────────────────────────────────────
  const LogIcon = ({ type, tool }: { type: string; tool?: string }) => {
    if (type === "agent_done") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />;
    if (type === "agent_error") return <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
    if (type === "tool_result") return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />;
    const Icon = tool ? (TOOL_ICONS[tool] ?? Bot) : Bot;
    return <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />;
  };

  // ── Upload zone ────────────────────────────────────────────────────────────
  const UploadZone = ({ label, description, file, accept, inputRef, onChange, onClear, multiple = false }: {
    label: string; description: string; file?: UploadedFile | null; accept: string;
    inputRef: React.RefObject<HTMLInputElement>; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear?: () => void; multiple?: boolean;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div
        className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
        style={file?.status === "done" ? { borderColor: palette.primary } : {}}
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <div className="flex items-center gap-2 justify-center">
            <FileText className="w-4 h-4 shrink-0" style={{ color: palette.primary }} />
            <span className="text-xs truncate max-w-[160px]">{file.file.name}</span>
            {file.status === "reading" && <Loader2 className="w-3 h-3 animate-spin" />}
            {file.status === "done" && <Badge variant="outline" className="text-[10px] px-1 py-0" style={{ color: palette.primary, borderColor: palette.primary }}>Ready</Badge>}
            {onClear && <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-muted-foreground hover:text-destructive ml-auto"><X className="w-3 h-3" /></button>}
          </div>
        ) : (
          <div className="space-y-1">
            <FileUp className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} multiple={multiple} />
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/spark")} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">AI Proposal Writer</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Agentic proposal generation — indexes your knowledge base, extracts every SHALL &amp; MUST, then writes a complete compliant proposal.
            </p>
          </div>
        </div>

        <div className="flex gap-5 items-start">

          {/* ── Left Panel ── */}
          <div className="w-72 shrink-0 space-y-4">

            {/* Company + Logo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: palette.primary }} />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Name</Label>
                  <Input placeholder="e.g. Acme Federal Solutions LLC" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-8 text-sm" />
                </div>
                {/* Logo */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Logo (optional)</Label>
                  <div
                    className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                    onClick={() => logoRef.current?.click()}
                  >
                    {logoDataUrl ? (
                      <div className="flex items-center justify-between gap-2">
                        <img src={logoDataUrl} alt="Logo" className="h-8 object-contain max-w-[120px]" />
                        <button onClick={(e) => { e.stopPropagation(); setLogoDataUrl(null); }} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <ImagePlus className="w-5 h-5 mx-auto text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground">PNG / JPG / SVG</p>
                      </div>
                    )}
                    <input ref={logoRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" style={{ color: palette.primary }} />
                  Color Palette
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPalette(p.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg border p-2 text-left transition-all hover:bg-muted/30 ${selectedPalette === p.id ? "border-2 bg-muted/20" : "border-border"}`}
                    style={selectedPalette === p.id ? { borderColor: p.primary } : {}}
                  >
                    <div className="flex gap-0.5 shrink-0">
                      {p.swatch.map((color: string, i: number) => <span key={i} className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm" style={{ background: color }} />)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium truncate">{p.name}</p>
                    </div>
                    {selectedPalette === p.id && <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: p.primary }} />}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileUp className="w-4 h-4" style={{ color: palette.primary }} />
                  Documents
                </CardTitle>
                <CardDescription className="text-[11px]">RFP required. Company docs build the knowledge base.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <UploadZone
                  label="RFP / Solicitation *"
                  description="PDF, DOCX, or TXT"
                  file={rfpFile}
                  accept=".txt,.doc,.docx,.pdf,.rtf"
                  inputRef={rfpRef}
                  onChange={handleRfpUpload}
                  onClear={() => setRfpFile(null)}
                />

                {/* Multi-file capability docs */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Company Knowledge Base</Label>
                  <div
                    className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                    onClick={() => capRef.current?.click()}
                  >
                    <FileUp className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Capability statement, LOI, past proposals…</p>
                    <input ref={capRef} type="file" accept=".txt,.doc,.docx,.pdf,.rtf" className="hidden" onChange={handleCapUpload} multiple />
                  </div>
                  {capFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />
                      <span className="truncate flex-1">{f.file.name}</span>
                      {f.status === "reading" && <Loader2 className="w-3 h-3 animate-spin" />}
                      {f.status === "done" && <Badge variant="outline" className="text-[10px] px-1 py-0" style={{ color: palette.primary, borderColor: palette.primary }}>Ready</Badge>}
                      <button onClick={() => setCapFiles((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>

                {/* Indexing status */}
                {isIndexing && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Indexing into knowledge base…
                  </div>
                )}
                {indexedChunks !== null && !isIndexing && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <Database className="w-3 h-3" />
                    {indexedChunks} chunks indexed in PostgreSQL
                  </div>
                )}

                {/* Seed permanent knowledge base */}
                <div className="pt-1 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={seedKnowledgeBase}
                    disabled={isSeeding || capFiles.filter(f => f.status === "done").length === 0}
                  >
                    {isSeeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Library className="w-3 h-3" />}
                    {isSeeding ? "Seeding…" : "Seed Style Templates"}
                  </Button>
                  {seededChunks !== null && !isSeeding && (
                    <p className="text-[10px] text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {seededChunks} chunks in permanent KB
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Saves company docs as permanent style templates used by all future proposals.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Run / Stop */}
            {isAgentRunning ? (
              <Button
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={stopAgent}
              >
                <OctagonX className="w-4 h-4 mr-2" />
                Stop Agent
              </Button>
            ) : (
              <Button
                className="w-full font-semibold text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})` }}
                onClick={runAgent}
                disabled={!rfpFile || rfpFile.status !== "done"}
              >
                <Bot className="w-4 h-4 mr-2" />
                Run Agent
              </Button>
            )}

            {/* Agent Log */}
            {agentLog.length > 0 && (
              <Card className="border-dashed">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    Agent Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div ref={logRef} className="space-y-1.5 max-h-52 overflow-y-auto">
                    {agentLog.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <LogIcon type={entry.type} tool={entry.tool} />
                        <span className={`leading-relaxed ${entry.type === "agent_error" ? "text-destructive" : entry.type === "agent_done" ? "text-green-600" : "text-muted-foreground"}`}>
                          {entry.message}
                        </span>
                      </div>
                    ))}
                    {isAgentRunning && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: palette.primary }} />
                        <span>Agent running…</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements badge */}
            {requirementsResult && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1 text-[11px]" style={{ borderColor: palette.primary, color: palette.primary }}>
                  <ListChecks className="w-3 h-3" />
                  {requirementsResult.totalShall} SHALL
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]" style={{ borderColor: palette.secondary, color: palette.secondary }}>
                  <ListChecks className="w-3 h-3" />
                  {requirementsResult.totalMust} MUST
                </Badge>
              </div>
            )}
          </div>

          {/* ── Right Panel: Output ── */}
          <div className="flex-1 min-w-0">
            <Card className="flex flex-col h-full" style={proposal ? { borderColor: palette.border } : {}}>
              <CardHeader className="pb-3 flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Generated Proposal</CardTitle>
                  {proposal && (
                    <Badge variant="outline" className="text-[10px]" style={{ color: palette.primary, borderColor: palette.primary }}>
                      {palette.name}
                    </Badge>
                  )}
                </div>
                {proposal && !isAgentRunning && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})` }}
                      onClick={downloadAsWord}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      .docx
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shadow-sm"
                      style={{ borderColor: palette.primary, color: palette.primary }}
                      onClick={downloadAsPdf}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      .pdf
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 min-h-0 pb-4">
                {!proposal && !isAgentRunning ? (
                  <div className="h-[calc(100vh-250px)] min-h-[500px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `${palette.primary}15` }}>
                        <Sparkles className="w-8 h-8" style={{ color: palette.primary }} />
                      </div>
                      <p className="text-sm font-medium">Your proposal will stream here</p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Upload your RFP and company documents, then click <strong>Run Agent</strong>. The agent will index your knowledge base, extract every requirement, and write a complete compliant proposal.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-220px)] min-h-[500px] pr-2">
                    {/* Cover preview */}
                    {proposal && (
                      <div className="rounded-xl mb-6 p-5 text-center space-y-1.5 border" style={{ background: palette.bg, borderColor: palette.border }}>
                        {logoDataUrl && <img src={logoDataUrl} alt="Logo" className="h-10 object-contain mx-auto mb-2" />}
                        <h2 className="text-lg font-bold" style={{ color: palette.primary }}>{companyName || "Company Name"}</h2>
                        <p className="text-sm font-medium" style={{ color: palette.secondary }}>Technical Proposal</p>
                        <p className="text-[10px] text-muted-foreground pt-1">
                          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · CONFIDENTIAL
                        </p>
                      </div>
                    )}

                    {/* Proposal body */}
                    <style>{`
                      .proposal-output h1 { color: ${palette.primary}; border-color: ${palette.border}; }
                      .proposal-output h2 { color: ${palette.secondary}; }
                      .proposal-output h3 { color: ${palette.accent}; }
                      .proposal-output blockquote {
                        border-left: 4px solid ${palette.primary};
                        background: ${palette.bg};
                        border-radius: 0 8px 8px 0;
                        padding: 12px 16px;
                        font-family: monospace;
                        font-size: 12px;
                        white-space: pre-wrap;
                        color: #444;
                      }
                      .proposal-output hr { border-color: ${palette.border}; }
                      .proposal-output table { border-collapse: collapse; width: 100%; }
                      .proposal-output th { background: ${palette.primary}18; color: ${palette.secondary}; }
                      .proposal-output td, .proposal-output th { border: 1px solid ${palette.border}; padding: 6px 10px; }
                    `}</style>
                    <div className="proposal-output prose prose-sm max-w-none text-foreground leading-relaxed
                      prose-headings:text-foreground
                      prose-h1:text-xl prose-h1:font-bold prose-h1:pb-2 prose-h1:mb-4 prose-h1:border-b
                      prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
                      prose-h3:text-base prose-h3:font-semibold prose-h3:mt-5 prose-h3:mb-2
                      prose-strong:font-semibold prose-ul:my-2 prose-li:my-0.5
                      prose-hr:my-6 prose-p:my-2 prose-p:leading-7
                      prose-table:text-xs prose-blockquote:not-italic">
                      <ReactMarkdown>{proposal}</ReactMarkdown>
                      {isAgentRunning && proposal && (
                        <span className="inline-block w-2 h-4 ml-0.5 animate-pulse rounded-sm" style={{ background: palette.primary }} />
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProposalWriter;
