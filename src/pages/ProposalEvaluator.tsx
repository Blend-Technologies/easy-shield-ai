import { useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Loader2, X, FileText, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EvaluatorDashboard, type EvaluationResult } from "@/components/proposal/EvaluatorDashboard";

type UploadedFile = {
  file: File;
  content: string;
  status: "reading" | "done" | "error";
};

const ProposalEvaluator = () => {
  const { toast } = useToast();
  const [proposalType, setProposalType] = useState("enterprise");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [supplementaryFile, setSupplementaryFile] = useState<UploadedFile | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supplementaryFileRef = useRef<HTMLInputElement>(null);

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
  };

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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Proposal Evaluator</h1>
          <p className="text-muted-foreground mt-1">
            Evaluate your fit against an RFP before writing a proposal.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Configuration & Upload */}
          <div className="lg:col-span-2 space-y-4">
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

                <Button
                  className="w-full"
                  size="lg"
                  onClick={evaluateRFP}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</>
                  ) : (
                    <><BarChart3 className="w-4 h-4 mr-2" /> Evaluate Fit</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3">
            {isEvaluating ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm">Analyzing RFP match with your qualifications...</p>
                </CardContent>
              </Card>
            ) : evaluationResult ? (
              <EvaluatorDashboard result={evaluationResult} />
            ) : (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Upload documents and click "Evaluate Fit" to see your RFP match score</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProposalEvaluator;
