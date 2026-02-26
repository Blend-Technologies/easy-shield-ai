import { useState, useCallback, useRef } from "react";
import { toPng, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  ReactFlow,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import ComponentSidebar from "@/components/visualizer/ComponentSidebar";
import VisualizerToolbar from "@/components/visualizer/VisualizerToolbar";
import WelcomeDialog from "@/components/visualizer/WelcomeDialog";
import CustomNode from "@/components/visualizer/CustomNode";
import AIPromptPanel from "@/components/visualizer/AIPromptPanel";

const nodeTypes = { custom: CustomNode };

const exampleNodes: Node[] = [
  { id: "1", type: "custom", position: { x: 50, y: 80 }, data: { label: "Salesforce", icon: "SF", description: "CRM & Sales Cloud", color: "bg-[#00A1E0]", textColor: "text-white" } },
  { id: "2", type: "custom", position: { x: 350, y: 30 }, data: { label: "API Gateway", icon: "API", description: "API Management", color: "bg-[#FF9900]", textColor: "text-white" } },
  { id: "3", type: "custom", position: { x: 350, y: 180 }, data: { label: "Entra ID", icon: "EID", description: "Identity Platform", color: "bg-[#0078D4]", textColor: "text-white" } },
  { id: "4", type: "custom", position: { x: 650, y: 80 }, data: { label: "Cloud Run", icon: "RUN", description: "Serverless Containers", color: "bg-[#4285F4]", textColor: "text-white" } },
  { id: "5", type: "custom", position: { x: 950, y: 30 }, data: { label: "Aurora", icon: "AUR", description: "MySQL/Postgres", color: "bg-[#3B48CC]", textColor: "text-white" } },
  { id: "6", type: "custom", position: { x: 950, y: 180 }, data: { label: "Cloud Armor", icon: "ARM", description: "WAF & DDoS", color: "bg-[#4285F4]", textColor: "text-white" } },
];

const exampleEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "hsl(196 86% 62%)" } },
  { id: "e1-3", source: "1", target: "3", animated: true, style: { stroke: "hsl(196 86% 62%)" } },
  { id: "e2-4", source: "2", target: "4", style: { stroke: "hsl(229 83% 60%)" } },
  { id: "e3-4", source: "3", target: "4", style: { stroke: "hsl(229 83% 60%)" } },
  { id: "e4-5", source: "4", target: "5", style: { stroke: "hsl(275 90% 39%)" } },
  { id: "e4-6", source: "4", target: "6", style: { stroke: "hsl(275 90% 39%)" } },
];

let nodeId = 100;

const DesignVisualizerInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [title, setTitle] = useState("Untitled Diagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: "hsl(196 86% 62%)" } },
          eds
        )
      ),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/json");
      if (!raw) return;

      const item = JSON.parse(raw);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node-${nodeId++}`,
        type: "custom",
        position,
        data: {
          label: item.label,
          icon: item.icon,
          description: item.description,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  const loadExample = () => {
    setNodes(exampleNodes);
    setEdges(exampleEdges);
    setTitle("Enterprise Integration Pipeline");
    setShowWelcome(false);
    setTimeout(() => fitView({ padding: 0.3 }), 100);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setTitle("Untitled Diagram");
  };

  const getFlowElement = () =>
    reactFlowWrapper.current?.querySelector(".react-flow__viewport") as HTMLElement | null;

  const onExportPNG = useCallback(() => {
    const el = getFlowElement();
    if (!el) return;
    toPng(el, { backgroundColor: "#09090b", quality: 1, pixelRatio: 2 }).then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${title || "diagram"}.png`;
      a.click();
    });
  }, [title]);

  const onExportSVG = useCallback(() => {
    const el = getFlowElement();
    if (!el) return;
    toSvg(el, { backgroundColor: "#09090b" }).then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${title || "diagram"}.svg`;
      a.click();
    });
  }, [title]);

  const onExportPDF = useCallback(() => {
    const el = getFlowElement();
    if (!el) return;
    toPng(el, { backgroundColor: "#09090b", quality: 1, pixelRatio: 2 }).then((dataUrl) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const pdf = new jsPDF({
          orientation: img.width > img.height ? "landscape" : "portrait",
          unit: "px",
          format: [img.width, img.height],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${title || "diagram"}.pdf`);
      };
    });
  }, [title]);

  const handleAIGenerate = useCallback(
    async (prompt: string, imageDataUrls: string[]) => {
      setIsGenerating(true);
      setShowWelcome(false);
      try {
        const { data, error } = await supabase.functions.invoke("generate-diagram", {
          body: { prompt, imageDataUrls },
        });

        if (error) {
          toast.error(error.message || "Failed to generate diagram");
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          return;
        }

        const generatedNodes: Node[] = (data.nodes || []).map((n: any) => ({
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

        const generatedEdges: Edge[] = (data.edges || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: e.animated,
          style: { stroke: "hsl(196 86% 62%)" },
          type: "smoothstep",
        }));

        setNodes(generatedNodes);
        setEdges(generatedEdges);
        if (data.title) setTitle(data.title);
        toast.success("Diagram generated successfully!");
        setTimeout(() => fitView({ padding: 0.3 }), 200);
      } catch (err) {
        console.error("AI generation error:", err);
        toast.error("Failed to generate diagram. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, fitView]
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <VisualizerToolbar
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={() => fitView({ padding: 0.3 })}
        onClear={clearCanvas}
        onExportPNG={onExportPNG}
        onExportSVG={onExportSVG}
        onExportPDF={onExportPDF}
        title={title}
        onTitleChange={setTitle}
      />
      <div className="flex flex-1 overflow-hidden">
        <ComponentSidebar />
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/30"
            defaultEdgeOptions={{ type: "smoothstep" }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
            <MiniMap
              nodeColor="hsl(229 83% 60%)"
              maskColor="hsl(var(--background) / 0.8)"
              className="!bg-background !border-border"
            />
          </ReactFlow>
        </div>
      </div>

      <AIPromptPanel onSubmit={handleAIGenerate} isLoading={isGenerating} />

      <WelcomeDialog
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
        onLoadExample={loadExample}
      />
    </div>
  );
};

const DesignVisualizer = () => (
  <ReactFlowProvider>
    <DesignVisualizerInner />
  </ReactFlowProvider>
);

export default DesignVisualizer;
