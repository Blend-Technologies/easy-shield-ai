import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Cloud, Layers, ArrowRight, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CustomNode from "@/components/visualizer/CustomNode";

export type SolutionResult = {
  solutionTitle: string;
  solutionOverview: string;
  keyComponents: { name: string; description: string; cloudProvider: string; rfpQuotes?: string[] }[];
  nodes: {
    id: string;
    label: string;
    abbr: string;
    description: string;
    x: number;
    y: number;
    color: string;
    textColor: string;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    animated: boolean;
    label?: string;
  }[];
};

const providerIcon = (provider: string) => {
  switch (provider) {
    case "aws": return "🟠";
    case "azure": return "🔵";
    case "gcp": return "🟢";
    default: return "⚙️";
  }
};

const providerLabel = (provider: string) => {
  switch (provider) {
    case "aws": return "AWS";
    case "azure": return "Azure";
    case "gcp": return "GCP";
    default: return "Generic";
  }
};

const nodeTypes = { custom: CustomNode };

export const SolutionDashboard = ({ result, diagramId }: { result: SolutionResult; diagramId?: string }) => {
  const navigate = useNavigate();
  const flowNodes: Node[] = useMemo(
    () =>
      result.nodes.map((n) => ({
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
      })),
    [result.nodes]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      result.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated,
        label: e.label || undefined,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        labelStyle: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
      })),
    [result.edges]
  );

  return (
    <div className="space-y-4">
      {/* Solution Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">{result.solutionTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground leading-relaxed">
            <ReactMarkdown>{result.solutionOverview}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Key Components */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Key Solution Components</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.keyComponents.map((comp, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-lg shrink-0">{providerIcon(comp.cloudProvider)}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{comp.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {providerLabel(comp.cloudProvider)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{comp.description}</p>
                  {comp.rfpQuotes && comp.rfpQuotes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {comp.rfpQuotes.map((quote, qi) => (
                        <blockquote key={qi} className="border-l-2 border-primary/40 pl-2 text-[11px] italic text-muted-foreground leading-relaxed">
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Solution Architecture Diagram</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full rounded-b-lg overflow-hidden border-t border-border">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnScroll={true}
              panOnScroll={true}
            >
              <Background gap={20} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
