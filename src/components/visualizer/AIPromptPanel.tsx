import { useState, useRef } from "react";
import { Sparkles, ImagePlus, X, ChevronUp, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  onSubmit: (prompt: string, images: File[]) => void;
};

const AIPromptPanel = ({ onSubmit }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageAdd = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (newFiles.length === 0) return;

    setImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!prompt.trim() && images.length === 0) return;
    onSubmit(prompt, images);
    setPrompt("");
    setImages([]);
    setPreviews([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleImageAdd(e.dataTransfer.files);
  };

  return (
    <div className="border-t border-border bg-background shrink-0">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span>AI Prompt</span>
        <span className="text-xs text-muted-foreground/60 ml-1">(optional)</span>
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
          {/* Text prompt */}
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the architecture you want to build, e.g. 'Create a 3-tier web app with API Gateway, Lambda, and DynamoDB...'"
            className="min-h-[80px] resize-none bg-muted/40 text-sm"
          />

          {/* Image previews */}
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={src} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageAdd(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Add Reference Image
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!prompt.trim() && images.length === 0}
              className="ml-auto gap-1.5 text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Generate Diagram
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPromptPanel;
