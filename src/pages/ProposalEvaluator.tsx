import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Loader2, X, FileText, BarChart3, ArrowLeft, ListChecks, ChevronDown, ChevronUp, Badge, Lightbulb, Cloud, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { EvaluatorDashboard, type EvaluationResult } from "@/components/proposal/EvaluatorDashboard";
import { SolutionDashboard, type SolutionResult } from "@/components/proposal/SolutionDashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type UploadedFile = {
  file: File;
  content: string;
  status: "reading" | "done" | "error";
};

type Requirement = {
  id: string;
  type: "shall" | "must";
  text: string;
  section: string;
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [requirementsResult, setRequirementsResult] = useState<RequirementsResult | null>(null);
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [solutionResult, setSolutionResult] = useState<SolutionResult | null>(null);
  const [cloudProvider, setCloudProvider] = useState<string>("aws");
  const [diagramId, setDiagramId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supplementaryFileRef = useRef<HTMLInputElement>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

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
      file: f, content: "", status: "reading" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    for (const sf of selectedFiles) {
      try {
        const content = await readFileContent(sf);
        setFiles((prev) => prev.map((f) => f.file === sf ? { ...f, content, status: "done" as const } : f));
      } catch {
        setFiles((prev) => prev.map((f) => f.file === sf ? { ...f, content: "", status: "error" as const } : f));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    // Reset requirements when files change
    setRequirementsResult(null);
    setEvaluationResult(null);
  };

  const extractRequirements = useCallback(async (followUp?: string) => {
    if (files.length === 0) {
      toast({ title: "Missing documents", description: "Upload at least one RFP document first.", variant: "destructive" });
      return;
    }

    const isFollowUp = !!followUp;
    if (isFollowUp) {
      setIsAskingFollowUp(true);
    } else {
      setIsExtracting(true);
      setRequirementsResult(null);
      setEvaluationResult(null);
    }

    const rfpDocuments = files
      .filter((f) => f.status === "done")
      .map((f) => ({ name: f.file.name, content: f.content.slice(0, 15000) }));

    const previousRequirements = isFollowUp && requirementsResult ? requirementsResult : undefined;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-requirements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ rfpDocuments, followUpQuestion: followUp, previousRequirements }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Extraction failed");
      }

      const result = await resp.json();
      setRequirementsResult(result);
      if (isFollowUp) {
        setFollowUpQuestion("");
        toast({ title: "Requirements updated!", description: `Now showing ${result.requirements?.length || 0} requirements.` });
      } else {
        toast({ title: "Requirements extracted!", description: `Found ${result.totalShall} shall + ${result.totalMust} must requirements.` });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
      setIsAskingFollowUp(false);
    }
  }, [files, requirementsResult, toast]);

  const evaluateRFP = useCallback(async () => {
    if (files.length === 0 && !supplementaryFile) {
      toast({ title: "Missing documents", description: "Upload an RFP and your resume/capability statement to evaluate.", variant: "destructive" });
      return;
    }

    setIsEvaluating(true);
    setEvaluationResult(null);

    const rfpDocuments = files
      .filter((f) => f.status === "done")
      .map((f) => ({ name: f.file.name, content: f.content.slice(0, 15000) }));

    const supplementaryDocument = supplementaryFile?.status === "done"
      ? { name: supplementaryFile.file.name, content: supplementaryFile.content.slice(0, 15000) }
      : null;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-rfp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ rfpDocuments, supplementaryDocument, proposalType }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Evaluation failed");
      }

      const result = await resp.json();
      setEvaluationResult(result);
      toast({ title: "Evaluation complete!", description: `Match score: ${result.overallScore}/100` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  }, [files, supplementaryFile, proposalType, toast]);

  const generateSolution = useCallback(async () => {
    if (files.length === 0) {
      toast({ title: "Missing documents", description: "Upload at least one RFP document first.", variant: "destructive" });
      return;
    }

    setIsGeneratingSolution(true);
    setSolutionResult(null);

    const rfpDocuments = files
      .filter((f) => f.status === "done")
      .map((f) => ({ name: f.file.name, content: f.content.slice(0, 15000) }));

    const supplementaryDocument = supplementaryFile?.status === "done"
      ? { name: supplementaryFile.file.name, content: supplementaryFile.content.slice(0, 15000) }
      : null;

    const evaluationSummary = evaluationResult
      ? `Score: ${evaluationResult.overallScore}/100. ${evaluationResult.summary}`
      : "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-solution`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ rfpDocuments, supplementaryDocument, proposalType, evaluationSummary, cloudProvider }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Solution generation failed");
      }

      const result = await resp.json();
      setSolutionResult(result);

      // Save diagram to database
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const diagramNodes = (result.nodes || []).map((n: any) => ({
            id: n.id,
            type: "custom",
            position: { x: n.x, y: n.y },
            data: {
              label: n.label,
              icon: n.abbr,
              description: n.description,
              color: n.color,
              textColor: n.textColor,
            },
          }));
          const diagramEdges = (result.edges || []).map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: e.animated,
            style: { stroke: "hsl(196 86% 62%)" },
            type: "smoothstep",
            label: e.label,
          }));

          const { data: diagramData, error: diagramError } = await supabase
            .from("diagrams")
            .insert({
              user_id: userData.user.id,
              title: result.solutionTitle || "Solution Architecture",
              nodes: diagramNodes as any,
              edges: diagramEdges as any,
              source: "proposal-evaluator",
            })
            .select("id")
            .single();

          if (!diagramError && diagramData) {
            setDiagramId(diagramData.id);
          }
        }
      } catch (saveErr) {
        console.error("Failed to save diagram:", saveErr);
      }

      toast({ title: "Solution generated!", description: `Architecture: ${result.solutionTitle}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGeneratingSolution(false);
    }
  }, [files, supplementaryFile, proposalType, evaluationResult, cloudProvider, toast]);

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
                          setSupplementaryFile({ file: f, content, status: "done" });
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
                    {f.status === "reading" && <Loader2 className="w-3 h-3 animate-spin" />}
                    {f.status === "error" && <span className="text-xs text-destructive">Error</span>}
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

            {/* Step 1: Generate Checklist Requirements (Government only) */}
            {proposalType === "government" && (
              <>
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      variant={requirementsResult ? "outline" : "default"}
                      onClick={() => extractRequirements()}
                      disabled={isExtracting || isAskingFollowUp || files.length === 0}
                    >
                      {isExtracting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Checklist Requirements...</>
                      ) : requirementsResult ? (
                        <><ListChecks className="w-4 h-4 mr-2" /> Re-generate Checklist Requirements</>
                      ) : (
                        <><ListChecks className="w-4 h-4 mr-2" /> Step 1: Generate Checklist Requirements</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Requirements Result */}
                {isExtracting ? (
                  <Card>
                    <CardContent className="py-12 flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground text-sm">Extracting Shall &amp; Must requirements from RFP...</p>
                    </CardContent>
                  </Card>
                ) : requirementsResult ? (
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
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                          {requirementsResult.requirements.map((req) => (
                            <div key={req.id} className="flex gap-3 p-2.5 rounded-lg bg-muted/40 text-sm">
                              <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">{req.id}</span>
                              <span className={`text-xs font-semibold uppercase shrink-0 mt-0.5 ${req.type === "must" ? "text-destructive" : "text-primary"}`}>
                                {req.type}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground">{req.text}</p>
                                {req.section && (
                                  <p className="text-xs text-muted-foreground mt-0.5">Section: {req.section}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ) : null}
              </>
            )}

            {/* Step 2: Evaluate Fit */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={evaluateRFP}
                  disabled={isEvaluating || (proposalType === "government" && !requirementsResult)}
                >
                  {isEvaluating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</>
                  ) : (
                    <><BarChart3 className="w-4 h-4 mr-2" /> {proposalType === "government" ? "Step 2: " : ""}Evaluate Fit</>
                  )}
                </Button>
                {proposalType === "government" && !requirementsResult && files.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Generate checklist requirements first before evaluating fit.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Evaluation Result */}
            {isEvaluating ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm">Analyzing RFP match with your qualifications...</p>
                </CardContent>
              </Card>
            ) : evaluationResult ? (
              <EvaluatorDashboard result={evaluationResult} />
            ) : !requirementsResult && !isExtracting ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Upload documents and extract requirements to get started</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Step 3: Generate Solution */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Cloud className="w-4 h-4 text-primary" />
                    Cloud Provider
                  </Label>
                  <Select value={cloudProvider} onValueChange={setCloudProvider} disabled={isGeneratingSolution}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">🟠 Amazon Web Services (AWS)</SelectItem>
                      <SelectItem value="azure">🔵 Microsoft Azure</SelectItem>
                      <SelectItem value="gcp">🟢 Google Cloud Platform (GCP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  variant={solutionResult ? "outline" : "default"}
                  onClick={generateSolution}
                  disabled={isGeneratingSolution || !evaluationResult}
                >
                  {isGeneratingSolution ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Solution &amp; Architecture...</>
                  ) : solutionResult ? (
                    <><Lightbulb className="w-4 h-4 mr-2" /> Re-generate Solution</>
                  ) : (
                    <><Lightbulb className="w-4 h-4 mr-2" /> {proposalType === "government" ? "Step 3: " : ""}Generate Solution &amp; Architecture</>
                  )}
                </Button>
                {!evaluationResult && files.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Evaluate fit first before generating a solution.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Solution Result */}
            {isGeneratingSolution ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm">Generating solution architecture and diagram...</p>
                </CardContent>
              </Card>
            ) : solutionResult ? (
              <SolutionDashboard result={solutionResult} diagramId={diagramId ?? undefined} />
            ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProposalEvaluator;
