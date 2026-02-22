import { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
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

import ComponentSidebar from "@/components/visualizer/ComponentSidebar";
import VisualizerToolbar from "@/components/visualizer/VisualizerToolbar";
import WelcomeDialog from "@/components/visualizer/WelcomeDialog";
import CustomNode from "@/components/visualizer/CustomNode";

const nodeTypes = { custom: CustomNode };

const exampleNodes: Node[] = [
  { id: "1", type: "custom", position: { x: 50, y: 80 }, data: { label: "Salesforce", icon: "☁️", description: "CRM & Sales Cloud" } },
  { id: "2", type: "custom", position: { x: 350, y: 30 }, data: { label: "API Gateway", icon: "🚪", description: "Gateway & Rate Limiting" } },
  { id: "3", type: "custom", position: { x: 350, y: 180 }, data: { label: "OAuth / SSO", icon: "🔐", description: "Authentication" } },
  { id: "4", type: "custom", position: { x: 650, y: 80 }, data: { label: "REST API", icon: "🔗", description: "HTTP Endpoints" } },
  { id: "5", type: "custom", position: { x: 950, y: 30 }, data: { label: "Database", icon: "🗄️", description: "SQL / NoSQL Store" } },
  { id: "6", type: "custom", position: { x: 950, y: 180 }, data: { label: "Logging", icon: "📋", description: "Log Aggregation" } },
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <VisualizerToolbar
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={() => fitView({ padding: 0.3 })}
        onClear={clearCanvas}
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
