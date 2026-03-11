import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { FileUp, Sparkles, Download, Loader2, X, FileText, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import ReactMarkdown from "react-markdown";


type UploadedFile = {
  file: File;
  content: string;
  status: "reading" | "done" | "error";
};

const models = [
  { value: "gemini-flash", label: "Gemini Flash", description: "Fast & efficient" },
  { value: "gemini-pro", label: "Gemini Pro", description: "Best quality" },
  { value: "gpt-5", label: "GPT-5", description: "Powerful all-rounder" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Cost-effective" },
  { value: "gpt-5.2", label: "GPT-5.2", description: "Latest reasoning" },
];

const ProposalWriter = () => {
  const { toast } = useToast();
  const [model, setModel] = useState("gemini-flash");
  const [proposalType, setProposalType] = useState("enterprise");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [supplementaryFile, setSupplementaryFile] = useState<UploadedFile | null>(null);
  const [proposal, setProposal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supplementaryFileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = selectedFiles.map((f) => ({
      file: f,
      content: "",
      status: "reading" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const content = await readFileContent(selectedFiles[i]);
        setFiles((prev) =>
          prev.map((f) =>
            f.file === selectedFiles[i] ? { ...f, content, status: "done" as const } : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === selectedFiles[i]
              ? { ...f, content: "", status: "error" as const }
              : f
          )
        );
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateProposal = useCallback(async () => {
    if (!projectTitle.trim()) {
      toast({ title: "Missing title", description: "Please enter a project title.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setProposal("");
    abortRef.current = new AbortController();

    const documentTexts = files
      .filter((f) => f.status === "done")
      .map((f) => ({ name: f.file.name, content: f.content.slice(0, 15000) }));

    if (supplementaryFile?.status === "done") {
      const label = proposalType === "enterprise" ? "Resume" : "Capability Statement";
      documentTexts.unshift({ name: `${label}: ${supplementaryFile.file.name}`, content: supplementaryFile.content.slice(0, 15000) });
    }

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ model, documentTexts, projectTitle, projectDescription, proposalType }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to generate proposal");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setProposal(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      toast({ title: "Proposal generated!", description: "Your proposal is ready for review." });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [model, projectTitle, projectDescription, proposalType, files, supplementaryFile, toast]);

  const parseInlineRuns = (text: string): TextRun[] => {
    // Handle bold, italic, and bold-italic inline formatting
    const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.filter(Boolean).map((part) => {
      if (part.startsWith("***") && part.endsWith("***")) {
        return new TextRun({ text: part.slice(3, -3), bold: true, italics: true, font: "Calibri", size: 22 });
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return new TextRun({ text: part.slice(2, -2), bold: true, font: "Calibri", size: 22 });
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return new TextRun({ text: part.slice(1, -1), italics: true, font: "Calibri", size: 22 });
      }
      return new TextRun({ text: part, font: "Calibri", size: 22 });
    });
  };

  const downloadAsWord = useCallback(async () => {
    if (!proposal) return;

    const lines = proposal.split("\n");
    const paragraphs: Paragraph[] = [];

    // Title page
    paragraphs.push(new Paragraph({ text: "", spacing: { after: 600 } }));
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: projectTitle || "Proposal", bold: true, font: "Calibri", size: 52, color: "0066FF" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: proposalType === "government" ? "Government Contract Proposal" : "Enterprise Proposal", font: "Calibri", size: 28, color: "4A90D9", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, font: "Calibri", size: 22, color: "666666" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    for (const line of lines) {
      if (line.startsWith("---")) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: "─".repeat(60), color: "CCCCCC", font: "Calibri", size: 18 })],
          spacing: { before: 200, after: 200 },
        }));
      } else if (line.startsWith("# ")) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line.slice(2), bold: true, font: "Calibri", size: 36, color: "0066FF" })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );
      } else if (line.startsWith("## ")) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line.slice(3), bold: true, font: "Calibri", size: 30, color: "1A202C" })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
      } else if (line.startsWith("### ")) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line.slice(4), bold: true, font: "Calibri", size: 26, color: "4A90D9" })],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (line.startsWith("#### ")) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line.slice(5), bold: true, font: "Calibri", size: 24, color: "1A202C" })],
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 150, after: 80 },
          })
        );
      } else if (/^\d+\.\s/.test(line)) {
        const text = line.replace(/^\d+\.\s/, "");
        paragraphs.push(
          new Paragraph({
            children: parseInlineRuns(text),
            numbering: { reference: "default-numbering", level: 0 },
            spacing: { after: 80 },
            indent: { left: 360 },
          })
        );
      } else if (line.startsWith("  - ") || line.startsWith("  * ")) {
        paragraphs.push(
          new Paragraph({
            children: parseInlineRuns(line.slice(4)),
            bullet: { level: 1 },
            spacing: { after: 60 },
          })
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        paragraphs.push(
          new Paragraph({
            children: parseInlineRuns(line.slice(2)),
            bullet: { level: 0 },
            spacing: { after: 80 },
          })
        );
      } else if (line.trim() === "") {
        paragraphs.push(new Paragraph({ text: "", spacing: { after: 60 } }));
      } else {
        paragraphs.push(new Paragraph({ children: parseInlineRuns(line), spacing: { after: 100, line: 276 } }));
      }
    }

    const doc = new Document({
      numbering: {
        config: [{
          reference: "default-numbering",
          levels: [{
            level: 0,
            format: "decimal" as any,
            text: "%1.",
            alignment: AlignmentType.START,
          }],
        }],
      },
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: paragraphs,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${projectTitle || "proposal"}.docx`);
    toast({ title: "Downloaded!", description: "Your proposal has been saved as a Word document." });
  }, [proposal, projectTitle, proposalType, toast]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/spark/Testing")} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Proposal Writer</h1>
          <p className="text-muted-foreground mt-1">
            Evaluate RFP fit, then generate professional proposals powered by AI.
          </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Configuration */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model */}
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <span className="font-medium">{m.label}</span>
                          <span className="text-muted-foreground text-xs ml-2">— {m.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Proposal Type */}
                <div className="space-y-2">
                  <Label>Proposal Type</Label>
                  <RadioGroup value={proposalType} onValueChange={setProposalType} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="enterprise" id="enterprise" />
                      <Label htmlFor="enterprise" className="cursor-pointer">Enterprise</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="government" id="government" />
                      <Label htmlFor="government" className="cursor-pointer">Government</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Supplementary Document */}
                <div className="space-y-2">
                  <Label>
                    {proposalType === "enterprise" ? "Resume (optional)" : "Capability Statement (optional)"}
                  </Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => supplementaryFileRef.current?.click()}
                  >
                    {supplementaryFile ? (
                      <div className="flex items-center gap-2 justify-center">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm truncate">{supplementaryFile.file.name}</span>
                        {supplementaryFile.status === "reading" && <Loader2 className="w-3 h-3 animate-spin" />}
                        {supplementaryFile.status === "error" && <span className="text-xs text-destructive">Error</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSupplementaryFile(null); }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {proposalType === "enterprise"
                            ? "Upload your resume to tailor the proposal"
                            : "Upload your capability statement for compliance"}
                        </p>
                      </>
                    )}
                    <input
                      ref={supplementaryFileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setSupplementaryFile({ file: f, content: "", status: "reading" });
                        try {
                          const content = await readFileContent(f);
                          setSupplementaryFile({ file: f, content, status: "done" });
                        } catch {
                          setSupplementaryFile({ file: f, content: "", status: "error" });
                        }
                        if (supplementaryFileRef.current) supplementaryFileRef.current.value = "";
                      }}
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input
                    placeholder="e.g. Cloud Migration Services for DOD"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Project Description</Label>
                  <Textarea
                    placeholder="Describe the project scope, goals, and key requirements..."
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Reference Documents</CardTitle>
                <CardDescription>Upload RFPs, SOWs, or other reference materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload PDF, Word, Excel, PowerPoint, or text files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.pptx,.ppt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm"
                  >
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate flex-1">{f.file.name}</span>
                    {f.status === "reading" && <Loader2 className="w-3 h-3 animate-spin" />}
                    {f.status === "error" && (
                      <span className="text-xs text-destructive">Error</span>
                    )}
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={generateProposal}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Proposal</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="flex flex-col">
              <CardHeader className="pb-4 flex-row items-center justify-between">
                <CardTitle className="text-base">Generated Proposal</CardTitle>
                    {proposal && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadAsWord}>
                          <Download className="w-4 h-4 mr-1" /> Download .docx
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProposal("")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    {!proposal && !isGenerating ? (
                      <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Your generated proposal will appear here</p>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none min-h-[400px] text-foreground text-sm leading-relaxed prose-headings:text-foreground prose-h1:text-xl prose-h1:font-bold prose-h1:text-primary prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h1:mb-4 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-base prose-h3:font-semibold prose-h3:text-primary/80 prose-strong:text-foreground prose-ul:my-2 prose-li:my-0.5 prose-hr:my-4 prose-hr:border-border prose-p:my-2">
                        <ReactMarkdown>{proposal}</ReactMarkdown>
                        {isGenerating && (
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                        )}
                      </div>
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
