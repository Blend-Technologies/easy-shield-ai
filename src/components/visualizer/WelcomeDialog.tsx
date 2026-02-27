import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onLoadExample: () => void;
};

const features = [
  "Drag & drop integration components onto the canvas",
  "Connect nodes to visualize data flow & security layers",
  "AI-powered feedback on design & integration patterns",
  "Export diagrams for stakeholder communication",
];

const WelcomeDialog = ({ open, onClose, onLoadExample }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            <span className="text-gradient-primary">EZShield+AI</span>{" "}
            <span className="text-foreground">Design Visualizer</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base mt-1">
            Build comprehensive visual designs of your application pipeline, illustrating data flow, security layers, and integration points.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 my-4">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="w-5 h-5 text-ai-cyan-400 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex gap-3 mt-2">
          <Button onClick={onLoadExample} className="bg-electric-blue-500 hover:bg-electric-blue-600 text-white">
            Load Example
          </Button>
          <Button variant="outline" onClick={onClose}>
            Blank Canvas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
