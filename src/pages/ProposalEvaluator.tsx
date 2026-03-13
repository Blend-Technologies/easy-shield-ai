import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Loader2, X, FileText, BarChart3, ArrowLeft, ListChecks, ChevronDown, ChevronUp, Lightbulb, Cloud, Bot, CheckCircle2, Sparkles, AlertCircle, Database, Send, MessageSquare, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { EvaluatorDashboard, type EvaluationResult } from "@/components/proposal/EvaluatorDashboard";
import { SolutionDashboard, type SolutionResult } from "@/components/proposal/SolutionDashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { readFileAsText } from "@/lib/fileReader";
import { extractShallMust, extractSectionHeadings } from "@/lib/requirementsExtractor";
import awsIcon from "@/assets/aws.svg";
import azureIcon from "@/assets/azure.svg";
import gcpIcon from "@/assets/gcp.svg";

type UploadedFile = {
  file: File;
  content: string;
  status: "reading" | "uploading" | "done" | "error";
  blobUrl?: string;
};

type Requirement = {
  id: string;
  type: "shall" | "must";
  text: string;
  section: string;
  supportingText?: string;
};

type RequirementsResult = {
  requirements: Requirement[];
  totalShall: number;
  totalMust: number;
  summary: string;
};

const ProposalEvaluator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proposalType, setProposalType] = useState("enterprise");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [supplementaryFile, setSupplementaryFile] = useState<UploadedFile | null>(null);
  const [requirementsResult, setRequirementsResult] = useState<RequirementsResult | null>(null);
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [solutionResult, setSolutionResult] = useState<SolutionResult | null>(null);
  const [cloudProvider, setCloudProvider] = useState<string>("aws");
  const [diagramId, setDiagramId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supplementaryFileRef = useRef<HTMLInputElement>(null);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentLog, setAgentLog] = useState<Array<{ type: string; message: string; tool?: string; timestamp: number }>>([]);
  const agentLogRef = useRef<HTMLDivElement>(null);
  const agentAbortRef = useRef<AbortController | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedChunks, setIndexedChunks] = useState<number | null>(null);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  // Document chat
  type ChatMessage = { role: "user" | "assistant"; content: string };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const readFileContent = (file: File): Promise<string> => readFileAsText(file);

  const indexDocuments = useCallback(async (uploadedFiles: UploadedFile[]) => {
    const documents = uploadedFiles
      .filter((f) => f.status === "done" && f.content)
      .map((f) => ({ name: f.file.name, content: f.content }));

    if (documents.length === 0) return;

    setIsIndexing(true);
    setIndexedChunks(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/index-documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ sessionId, documents }),
        }
      );
      if (resp.ok) {
        const result = await resp.json();
        setIndexedChunks(result.totalChunks ?? 0);
      } else {
        console.warn("Indexing request failed:", await resp.text());
      }
    } catch (e) {
      console.warn("Document indexing failed:", e);
    } finally {
      setIsIndexing(false);
    }
  }, [sessionId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = selectedFiles.map((f) => ({
      file: f, content: "", status: "reading" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    const completedFiles: UploadedFile[] = [];

    for (const sf of selectedFiles) {
      try {
        const content = await readFileContent(sf);
        const completed: UploadedFile = { file: sf, content, status: "done" };
        setFiles((prev) => prev.map((f) => f.file === sf ? completed : f));
        completedFiles.push(completed);
      } catch {
        setFiles((prev) => prev.map((f) =>
          f.file === sf ? { ...f, content: "", status: "error" as const } : f
        ));
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";

    if (completedFiles.length > 0) {
      indexDocuments(completedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setRequirementsResult(null);
    setEvaluationResult(null);
  };

  useEffect(() => {
    agentLogRef.current?.scrollTo({ top: agentLogRef.current.scrollHeight, behavior: "smooth" });
  }, [agentLog.length]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChatMessage = useCallback(async () => {
    const question = chatInput.trim();
    if (!question || isChatLoading) return;

    const userMessage: ChatMessage = { role: "user", content: question };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    // Placeholder for streaming answer
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };
    setChatMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/document-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            question,
            sessionId,
            history: chatMessages.slice(-6),
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Chat request failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          let evt: any;
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }
          if (evt.token) {
            setChatMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + evt.token,
              };
              return updated;
            });
          }
        }
      }
    } catch (e: any) {
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, I couldn't process that question. Please try again." };
        return updated;
      });
    } finally {
      setIsChatLoading(false);
      chatInputRef.current?.focus();
    }
  }, [chatInput, isChatLoading, chatMessages, sessionId]);

  const runAgent = useCallback(async () => {
    if (files.length === 0) {
      toast({ title: "Missing documents", description: "Upload at least one RFP document first.", variant: "destructive" });
      return;
    }

    setIsAgentRunning(true);
    setAgentLog([]);
    setRequirementsResult(null);
    setEvaluationResult(null);
    setSolutionResult(null);
    setDiagramId(null);

    const doneDocs = files.filter((f) => f.status === "done");

    // Full content for deterministic extraction (no truncation)
    const rfpDocsFullContent = doneDocs.map((f) => ({ name: f.file.name, content: f.content }));

    // Truncated content for LLM eval/solution steps
    const rfpDocuments = doneDocs.map((f) => ({ name: f.file.name, content: f.content.slice(0, 15000) }));

    const supplementaryDocument = supplementaryFile?.status === "done"
      ? { name: supplementaryFile.file.name, content: supplementaryFile.content.slice(0, 15000) }
      : null;

    // Deterministic client-side extraction across ALL documents (no LLM, no truncation)
    const preExtractedRequirements = extractShallMust(rfpDocsFullContent);
    const sectionHeadings = extractSectionHeadings(rfpDocsFullContent);

    const appendLog = (entry: { type: string; message: string; tool?: string }) => {
      setAgentLog((prev) => [...prev, { ...entry, timestamp: Date.now() }]);
    };

    appendLog({ type: "tool_start", tool: "extract_requirements", message: `Found ${preExtractedRequirements.filter(r => r.type === "shall").length} shall and ${preExtractedRequirements.filter(r => r.type === "must").length} must requirements across ${doneDocs.length} document(s). Assigning sections...` });

    const controller = new AbortController();
    agentAbortRef.current = controller;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proposal-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ rfpDocuments, supplementaryDocument, proposalType, cloudProvider, sessionId, preExtractedRequirements, sectionHeadings }),
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
              } else if (event.tool === "evaluate_rfp" && event.data) {
                setEvaluationResult(event.data);
              } else if (event.tool === "generate_solution" && event.data) {
                setSolutionResult(event.data);
                try {
                  const { data: userData } = await supabase.auth.getUser();
                  if (userData?.user) {
                    const result = event.data;
                    const diagramNodes = (result.nodes || []).map((n: any) => ({
                      id: n.id, type: "custom",
                      position: { x: n.x, y: n.y },
                      data: { label: n.label, icon: n.abbr, description: n.description, color: n.color, textColor: n.textColor },
                    }));
                    const diagramEdges = (result.edges || []).map((e: any) => ({
                      id: e.id, source: e.source, target: e.target, animated: e.animated,
                      style: { stroke: "hsl(196 86% 62%)" }, type: "smoothstep", label: e.label,
                    }));
                    const { data: diagramData } = await supabase
                      .from("diagrams")
                      .insert({ user_id: userData.user.id, title: result.solutionTitle || "Solution Architecture", nodes: diagramNodes as any, edges: diagramEdges as any, source: "proposal-evaluator" })
                      .select("id").single();
                    if (diagramData) setDiagramId(diagramData.id);
                  }
                } catch (saveErr) { console.error("Failed to save diagram:", saveErr); }
              }
              break;

            case "agent_done":
              appendLog({ type: "agent_done", message: event.message });
              toast({ title: "Agent complete!", description: "All 3 steps finished successfully." });
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
      agentAbortRef.current = null;
      setIsAgentRunning(false);
    }
  }, [files, supplementaryFile, proposalType, cloudProvider, sessionId, toast]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/spark/Testing")} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Proposal Evaluator</h1>
            <p className="text-muted-foreground mt-1">
              Evaluate your fit against an RFP before writing a proposal.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Configuration & Upload */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Proposal Type</Label>
                  <RadioGroup value={proposalType} onValueChange={setProposalType} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="enterprise" id="eval-enterprise" />
                      <Label htmlFor="eval-enterprise" className="cursor-pointer">Enterprise</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="government" id="eval-government" />
                      <Label htmlFor="eval-government" className="cursor-pointer">Government</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Cloud className="w-4 h-4 text-primary" />
                    Cloud Provider
                  </Label>
                  <Select value={cloudProvider} onValueChange={setCloudProvider} disabled={isAgentRunning}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">
                        <span className="flex items-center gap-2">
                          <img src={awsIcon} alt="AWS" className="w-5 h-5" />
                          Amazon Web Services (AWS)
                        </span>
                      </SelectItem>
                      <SelectItem value="azure">
                        <span className="flex items-center gap-2">
                          <img src={azureIcon} alt="Azure" className="w-5 h-5" />
                          Microsoft Azure
                        </span>
                      </SelectItem>
                      <SelectItem value="gcp">
                        <span className="flex items-center gap-2">
                          <img src={gcpIcon} alt="GCP" className="w-5 h-5" />
                          Google Cloud Platform (GCP)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                        {supplementaryFile.status === "reading" && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Reading...
                          </span>
                        )}
                        {supplementaryFile.status === "done" && isIndexing && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Indexing...
                          </span>
                        )}
                        {supplementaryFile.status === "done" && !isIndexing && indexedChunks !== null && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Indexed
                          </span>
                        )}
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
                            ? "Upload your resume to tailor the evaluation"
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
                          const completed: UploadedFile = { file: f, content, status: "done" };
                          setSupplementaryFile(completed);
                          indexDocuments([completed]);
                        } catch {
                          setSupplementaryFile({ file: f, content: "", status: "error" });
                        }
                        if (supplementaryFileRef.current) supplementaryFileRef.current.value = "";
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">RFP Documents</CardTitle>
                <CardDescription>Upload RFPs, SOWs, or other reference materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload PDF, Word, or text files
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
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate flex-1">{f.file.name}</span>
                    {f.status === "reading" && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Reading...
                      </span>
                    )}
                    {f.status === "error" && <span className="text-xs text-destructive">Error</span>}
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {isIndexing && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pl-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Indexing documents into pgvector...
                  </p>
                )}
                {!isIndexing && indexedChunks !== null && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 pl-1">
                    <CheckCircle2 className="w-3 h-3" /> {indexedChunks} chunks indexed in Azure PostgreSQL
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Agent: Run All Steps */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground">AI Agent — Run All Steps</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically runs requirements extraction, fit evaluation, and solution generation in sequence.
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={runAgent}
                disabled={isAgentRunning || files.length === 0}
              >
                {isAgentRunning ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Agent Running...</>
                ) : (
                  <><Bot className="w-4 h-4 mr-2" /> Run AI Agent (All Steps)</>
                )}
              </Button>
              {isAgentRunning && (
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => agentAbortRef.current?.abort()}
                >
                  <X className="w-4 h-4 mr-2" /> Stop Agent
                </Button>
              )}
              {agentLog.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agent Activity</p>
                  <div
                    ref={agentLogRef}
                    className="max-h-[220px] overflow-y-auto space-y-1.5 rounded-lg bg-background border border-border p-3"
                  >
                    {agentLog.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        {entry.type === "tool_start" && (
                          <><Loader2 className="w-3 h-3 animate-spin text-primary mt-0.5 shrink-0" /><span className="text-foreground">{entry.message}</span></>
                        )}
                        {entry.type === "tool_result" && (
                          <><CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /><span className="text-green-600 dark:text-green-400">{entry.message}</span></>
                        )}
                        {entry.type === "agent_done" && (
                          <><Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" /><span className="text-primary font-medium">{entry.message}</span></>
                        )}
                        {entry.type === "agent_error" && (
                          <><AlertCircle className="w-3 h-3 text-destructive mt-0.5 shrink-0" /><span className="text-destructive">{entry.message}</span></>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Chat */}
          {(indexedChunks !== null || files.some(f => f.status === "done")) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Ask the Documents</CardTitle>
                </div>
                <CardDescription>
                  Ask follow-up questions about the uploaded RFP and capability documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Message thread */}
                {chatMessages.length > 0 && (
                  <div className="max-h-[400px] overflow-y-auto space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-border text-foreground"
                        }`}>
                          {msg.content || (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                            </span>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                )}
                {/* Input row */}
                <div className="flex gap-2 items-end">
                  <Textarea
                    ref={chatInputRef}
                    placeholder="Ask a question about the uploaded documents… e.g. 'What are the security requirements?' or 'Summarize the scope of work.'"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    className="min-h-[60px] max-h-[120px] text-sm resize-none"
                    disabled={isChatLoading}
                  />
                  <Button
                    size="icon"
                    className="shrink-0 h-10 w-10"
                    onClick={sendChatMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                  >
                    {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Requirements Result */}
          {requirementsResult && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Shall &amp; Must Requirements</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-xs">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {requirementsResult.totalShall} Shall
                      </span>
                      <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                        {requirementsResult.totalMust} Must
                      </span>
                    </div>
                    <button onClick={() => setRequirementsExpanded(!requirementsExpanded)} className="text-muted-foreground hover:text-foreground">
                      {requirementsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{requirementsResult.summary}</p>
              </CardHeader>
              {requirementsExpanded && (
                <CardContent className="pt-0">
                  <div className="max-h-[560px] overflow-y-auto space-y-3 pr-1">
                    {requirementsResult.requirements.map((req) => (
                      <div key={req.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                        {/* Header row */}
                        <div className="flex items-start gap-3 px-3 py-2.5">
                          <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5 w-12">{req.id}</span>
                          <span className={`text-xs font-bold uppercase shrink-0 mt-0.5 px-1.5 py-0.5 rounded ${req.type === "must" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                            {req.type}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-snug">{req.text}</p>
                            {req.section && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Section:</span> {req.section}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Supporting text */}
                        {req.supportingText && (
                          <div className="border-t border-border/60 bg-background/50 px-3 py-2 mx-0">
                            <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">Supporting Context</p>
                            <p className="text-xs text-foreground/70 italic leading-relaxed">{req.supportingText}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Step 2: Evaluation Result */}
          {evaluationResult && <EvaluatorDashboard result={evaluationResult} />}

          {/* Step 3: Solution Result */}
          {solutionResult && <SolutionDashboard result={solutionResult} diagramId={diagramId ?? undefined} />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProposalEvaluator;
