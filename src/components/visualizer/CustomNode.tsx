import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getServiceIcon } from "@/lib/cloudServiceIcons";

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
  const serviceIcon = getServiceIcon(data.label);

  return (
    <div
      className={`
        bg-background border-2 rounded-lg px-2.5 py-1.5 min-w-[120px] max-w-[180px] shadow-md
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${selected ? "border-electric-sapphire-400 shadow-electric-sapphire-400/20 shadow-lg" : "border-border hover:border-electric-sapphire-300/50"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-sky-aqua-400 !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-sky-aqua-400 !border-2 !border-background"
      />
      <div className="flex items-center gap-1.5">
        <div
          className={`w-6 h-6 rounded-md ${badgeColor} ${badgeText} flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm`}
        >
          {serviceIcon ? (
            <img src={serviceIcon} alt={data.label} className="w-3.5 h-3.5" />
          ) : (
            data.icon
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
            {data.label}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
            {data.description}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-neon-pink-400 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-neon-pink-400 !border-2 !border-background"
      />
    </div>
  );
});

CustomNode.displayName = "CustomNode";

export default CustomNode;
