import { ProjectMember } from "@/hooks/useProjectMembers";

type Props = {
  members: ProjectMember[];
  value: string;
  onChange: (initials: string) => void;
  className?: string;
  darkMode?: boolean;
};

const AssigneePicker = ({ members, value, onChange, className = "", darkMode = false }: Props) => {
  const bgClass = darkMode ? "bg-white/5 text-white border-white/20" : "bg-[#F5F5F5] text-[#1A1A1A] border-[#E0E0E0]";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-[13px] px-2 py-1 rounded outline-none border cursor-pointer ${bgClass} ${className}`}
    >
      <option value="">Unassigned</option>
      {members.map((m) => (
        <option key={m.id} value={m.initials}>
          {m.full_name} ({m.initials})
        </option>
      ))}
    </select>
  );
};

export default AssigneePicker;
