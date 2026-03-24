import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
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
import CustomNode from "@/components/visualizer/CustomNode";
import AIPromptPanel from "@/components/visualizer/AIPromptPanel";

const nodeTypes = { custom: CustomNode };

let nodeId = 200;

const DiagramEditorInner = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState("Untitled Diagram");
  const [diagramSource, setDiagramSource] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  // Load diagram from DB
  useEffect(() => {
    if (!diagramId) return;
    const load = async () => {
      // Wait for auth session to be ready
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Please log in to view this diagram");
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("diagrams")
        .select("*")
        .eq("id", diagramId)
        .single();

      if (error || !data) {
        console.error("Failed to load diagram:", error);
        toast.error("Failed to load diagram");
        navigate("/dashboard/proposal-evaluator");
        return;
      }

      const loadedNodes: Node[] = ((data.nodes as any[]) || []).map((n: any) => ({
        id: n.id,
        type: "custom",
        position: n.position || { x: n.x || 0, y: n.y || 0 },
        data: n.data || {
          label: n.label,
          icon: n.abbr || n.icon,
          description: n.description,
          color: n.color,
          textColor: n.textColor,
        },
      }));

      const loadedEdges: Edge[] = ((data.edges as any[]) || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated ?? true,
        style: e.style || { stroke: "hsl(196 86% 62%)" },
        type: e.type || "smoothstep",
        label: e.label,
      }));

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setTitle(data.title || "Untitled Diagram");
      setDiagramSource((data as any).source ?? null);
      setLoaded(true);
      setTimeout(() => fitView({ padding: 0.3 }), 200);
    };
    load();
  }, [diagramId]);

  // Save diagram to DB
  const saveDiagram = useCallback(async () => {
    if (!diagramId) return;
    setIsSaving(true);
    try {
      const serializedNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }));
      const serializedEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated,
        style: e.style,
        type: e.type,
        label: e.label,
      }));

      const { error } = await supabase
        .from("diagrams")
        .update({
          title,
          nodes: serializedNodes as any,
          edges: serializedEdges as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", diagramId);

      if (error) throw error;
      toast.success("Diagram saved!");
    } catch (err: any) {
      toast.error("Failed to save diagram");
    } finally {
      setIsSaving(false);
    }
  }, [diagramId, nodes, edges, title]);

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
          color: item.color,
          textColor: item.textColor,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
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
      try {
        const existingNodes = nodes.map((n) => ({
          id: n.id,
          label: (n.data as any)?.label,
          abbr: (n.data as any)?.icon,
          description: (n.data as any)?.description,
          x: n.position.x,
          y: n.position.y,
          color: (n.data as any)?.color,
          textColor: (n.data as any)?.textColor,
        }));
        const existingEdges = edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: e.animated,
        }));

        const { data, error } = await supabase.functions.invoke("generate-diagram", {
          body: {
            prompt,
            imageDataUrls,
            existingNodes: existingNodes.length > 0 ? existingNodes : undefined,
            existingEdges: existingEdges.length > 0 ? existingEdges : undefined,
          },
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
        toast.error("Failed to generate diagram. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [nodes, edges, setNodes, setEdges, fitView]
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
        onBack={() =>
          diagramSource === "proposal-evaluator"
            ? navigate("/dashboard/proposal-evaluator")
            : navigate(-1)
        }
      />
      {/* Save bar */}
      <div className="h-10 border-b border-border bg-muted/30 flex items-center justify-between px-4 gap-2 shrink-0">
        <a
          href="https://azurediagrams.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Finalize Azure Diagrams
        </a>
        <button
          onClick={saveDiagram}
          disabled={isSaving}
          className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving..." : "Save Diagram"}
        </button>
      </div>
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
            panOnScroll
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            nodesDraggable
            nodesConnectable
            minZoom={0.1}
            maxZoom={4}
            translateExtent={[[-Infinity, -Infinity], [Infinity, Infinity]]}
            nodeExtent={[[-Infinity, -Infinity], [Infinity, Infinity]]}
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
    </div>
  );
};

const DiagramEditor = () => (
  <ReactFlowProvider>
    <DiagramEditorInner />
  </ReactFlowProvider>
);

export default DiagramEditor;
