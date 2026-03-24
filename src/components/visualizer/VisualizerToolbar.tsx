import { Download, ZoomIn, ZoomOut, Maximize2, Trash2, FileImage, FileText, FileCode, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onClear: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportPDF: () => void;
  title: string;
  onTitleChange: (t: string) => void;
  onBack?: () => void;
};

const VisualizerToolbar = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onClear,
  onExportPNG,
  onExportSVG,
  onExportPDF,
  title,
  onTitleChange,
  onBack,
}: Props) => {
  const navigate = useNavigate();

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onBack ? onBack() : navigate(-1)}
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPNG}>
              <FileImage className="w-4 h-4 mr-2" /> Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSVG}>
              <FileCode className="w-4 h-4 mr-2" /> Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="w-4 h-4 mr-2" /> Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onClear}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default VisualizerToolbar;
