import { useState, useRef } from "react";
import { Sparkles, ImagePlus, X, ChevronUp, ChevronDown, Send, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type FilePreview = {
  dataUrl: string;
  name: string;
  type: string;
};

type Props = {
  onSubmit: (prompt: string, fileDataUrls: string[]) => void;
  isLoading?: boolean;
};

const AIPromptPanel = ({ onSubmit, isLoading = false }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = (fileList: FileList | null) => {
    if (!fileList) return;
    const validFiles = Array.from(fileList).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles((prev) => [
          ...prev,
          { dataUrl: e.target?.result as string, name: file.name, type: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (!prompt.trim() && files.length === 0) return;
    onSubmit(prompt, files.map((f) => f.dataUrl));
    setPrompt("");
    setFiles([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileAdd(e.dataTransfer.files);
  };

  return (
    <div className="border-t border-border bg-background shrink-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span>AI Prompt</span>
        <span className="text-xs text-muted-foreground/60 ml-1">(generate or modify)</span>
        {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin text-primary" />}
        {expanded ? (
          <ChevronDown className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronUp className="w-4 h-4 ml-auto" />
        )}
      </button>

      {expanded && (
        <div
          className="px-4 pb-3 space-y-3"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDrop}
        >
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe changes: 'Add a Redis cache between API and DB' or generate new: 'Create a 3-tier web app...'"
            className="min-h-[80px] resize-none bg-muted/40 text-sm"
            disabled={isLoading}
          />

          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {files.map((file, i) => (
                <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border">
                  {file.type === "application/pdf" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/60 gap-0.5">
                      <FileText className="w-5 h-5 text-destructive" />
                      <span className="text-[8px] text-muted-foreground truncate max-w-full px-1">PDF</span>
                    </div>
                  ) : (
                    <img src={file.dataUrl} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFileAdd(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs"
              disabled={isLoading}
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Add Image / PDF
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isLoading || (!prompt.trim() && files.length === 0)}
              className="ml-auto gap-1.5 text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Generate Diagram
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPromptPanel;
