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
        bg-background border-2 rounded-lg px-2 py-1 min-w-[90px] max-w-[140px] shadow-md
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${selected ? "border-electric-sapphire-400 shadow-electric-sapphire-400/20 shadow-lg" : "border-border hover:border-electric-sapphire-300/50"}
      `}
      title={data.description}
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
          <p className="text-[10px] font-semibold text-foreground leading-tight truncate">
            {data.label}
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
