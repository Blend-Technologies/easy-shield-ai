import { Download, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onClear: () => void;
  title: string;
  onTitleChange: (t: string) => void;
};

const VisualizerToolbar = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onClear,
  title,
  onTitleChange,
}: Props) => {
  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-electric-sapphire-400 to-indigo-bloom-400 flex items-center justify-center">
          <span className="text-white text-xs font-bold">EZ</span>
        </div>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-transparent border-none text-sm font-medium text-foreground focus:outline-none focus:ring-0 w-48"
          placeholder="Untitled Diagram"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFitView}>
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onClear}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default VisualizerToolbar;
