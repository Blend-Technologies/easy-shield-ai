import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

type CustomNodeData = {
  label: string;
  icon: string;
  description: string;
  color?: string;
  textColor?: string;
};

const CustomNode = memo(({ data, selected }: NodeProps & { data: CustomNodeData }) => {
  const badgeColor = data.color || "bg-electric-sapphire-400";
  const badgeText = data.textColor || "text-white";

  return (
    <div
      className={`
        bg-background border-2 rounded-xl px-4 py-3 min-w-[160px] shadow-md
        transition-all duration-200
        ${selected ? "border-electric-sapphire-400 shadow-electric-sapphire-400/20 shadow-lg" : "border-border hover:border-electric-sapphire-300/50"}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-sky-aqua-400 !border-2 !border-background"
      />
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-lg ${badgeColor} ${badgeText} flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm`}
        >
          {data.icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">
            {data.label}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data.description}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-neon-pink-400 !border-2 !border-background"
      />
    </div>
  );
});

CustomNode.displayName = "CustomNode";

export default CustomNode;
