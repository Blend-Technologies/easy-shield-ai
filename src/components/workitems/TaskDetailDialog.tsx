import { useState, useEffect } from "react";
import { WorkItem } from "@/hooks/useWorkItems";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  CheckCircle2, Circle, Clock, User, Flag, Calendar,
  Timer, Target, Link2, Tag, FileText, X,
} from "lucide-react";
import { format } from "date-fns";

type StatusStyle = "shipped" | "testing" | "backlog";

const statusOptions: { value: StatusStyle; label: string; color: string; bg: string }[] = [
  { value: "shipped", label: "DONE", color: "text-white", bg: "bg-[#00BFA5]" },
  { value: "testing", label: "IN PROGRESS", color: "text-white", bg: "bg-[#8B6347]" },
  { value: "backlog", label: "BACKLOG", color: "text-[#888]", bg: "bg-transparent border border-[#CCC]" },
];

const priorityOptions = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
  { value: "none", label: "Empty" },
];

interface TaskDetailDialogProps {
  task: WorkItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Pick<WorkItem, "title" | "status" | "description" | "assignee_initials" | "due_date" | "priority">>) => Promise<void>;
}

export default function TaskDetailDialog({ task, open, onOpenChange, onUpdate }: TaskDetailDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("backlog");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("none");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setAssignee(task.assignee_initials || "");
      setDueDate(task.due_date || "");
      setPriority(task.priority);
    }
  }, [task]);

  if (!task) return null;

  const save = (updates: Partial<Pick<WorkItem, "title" | "status" | "description" | "assignee_initials" | "due_date" | "priority">>) => {
    onUpdate(task.id, updates);
  };

  const currentStatus = statusOptions.find((s) => s.value === status) || statusOptions[2];

  const DetailRow = ({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) => (
    <div className="flex items-center min-h-[36px]">
      <div className="flex items-center gap-2 w-[140px] text-[13px] text-[#999] flex-shrink-0">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[750px] p-0 gap-0 bg-white rounded-xl overflow-hidden border-none shadow-2xl [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2 text-[13px] text-[#999]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Task</span>
          </div>
          <span className="text-[11px] text-[#BBB] bg-[#F5F5F5] px-2 py-0.5 rounded font-mono">{task.id.slice(0, 8)}</span>
          <div className="ml-auto">
            <button onClick={() => onOpenChange(false)} className="text-[#999] hover:text-[#333] p-1 rounded hover:bg-[#F0F0F0]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="px-6 pt-4 pb-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { if (title !== task.title) save({ title }); }}
            className="text-2xl font-bold text-[#1A1A1A] w-full outline-none border-none bg-transparent"
          />
        </div>

        {/* Details grid */}
        <div className="px-6 py-3 grid grid-cols-2 gap-x-8 gap-y-1">
          {/* Left column */}
          <div className="space-y-1">
            <DetailRow icon={CheckCircle2} label="Status">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); save({ status: e.target.value }); }}
                className="text-[13px] font-bold px-2 py-1 rounded outline-none border-none bg-[#F5F5F5] cursor-pointer"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </DetailRow>

            <DetailRow icon={Calendar} label="Dates">
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-[#999]">→</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); save({ due_date: e.target.value || null }); }}
                  className="text-[13px] text-[#E53935] bg-transparent outline-none border-none cursor-pointer"
                />
              </div>
            </DetailRow>

            <DetailRow icon={Timer} label="Time Estimate">
              <span className="text-[13px] text-[#CCC]">Empty</span>
            </DetailRow>

            <DetailRow icon={Link2} label="Relationships">
              <span className="text-[13px] text-[#CCC]">Empty</span>
            </DetailRow>
          </div>

          {/* Right column */}
          <div className="space-y-1">
            <DetailRow icon={User} label="Assignees">
              <div className="flex items-center gap-2">
                <div className="w-[26px] h-[26px] rounded-full bg-[#8B5CF6] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{assignee || "?"}</span>
                </div>
                <input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value.toUpperCase().slice(0, 3))}
                  onBlur={() => { if (assignee !== task.assignee_initials) save({ assignee_initials: assignee }); }}
                  placeholder="Initials"
                  className="w-14 text-[13px] bg-transparent outline-none border-none text-[#1A1A1A]"
                />
              </div>
            </DetailRow>

            <DetailRow icon={Flag} label="Priority">
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value); save({ priority: e.target.value }); }}
                className="text-[13px] px-2 py-1 rounded outline-none border-none bg-[#F5F5F5] cursor-pointer"
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </DetailRow>

            <DetailRow icon={Target} label="Sprint Points">
              <span className="text-[13px] text-[#CCC]">Empty</span>
            </DetailRow>

            <DetailRow icon={Tag} label="Tags">
              <span className="text-[13px] text-[#CCC]">Empty</span>
            </DetailRow>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-t border-[#F0F0F0]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#999]" />
            <span className="text-[13px] text-[#999]">Description</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => { if (description !== (task.description || "")) save({ description: description || null }); }}
            placeholder="Add a description..."
            rows={3}
            className="w-full text-sm text-[#1A1A1A] outline-none border-none bg-[#FAFAFA] rounded-lg p-3 resize-none placeholder:text-[#CCC]"
          />
        </div>

        {/* Footer meta */}
        <div className="px-6 py-3 border-t border-[#F0F0F0] text-[11px] text-[#BBB]">
          Created {format(new Date(task.created_at), "MMM d, yyyy 'at' h:mm a")}
        </div>
      </DialogContent>
    </Dialog>
  );
}