import { Search, Sparkles, Bell, CalendarDays, Grid3X3, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpeg";

type Props = {
  userName: string;
};

const SparkTopNav = ({ userName }: Props) => {
  const navigate = useNavigate();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-12 bg-spark-nav flex items-center px-4 gap-3 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <img src={logo} alt="EZShield+AI" className="h-7 w-7 rounded-md" />
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 w-full max-w-md">
          <Search className="w-4 h-4 text-spark-nav-foreground/60" />
          <span className="text-sm text-spark-nav-foreground/50">Search</span>
          <span className="ml-auto bg-spark-accent-purple/30 text-spark-nav-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
            AI
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="bg-spark-accent-purple hover:bg-spark-accent-purple/80 text-white text-xs h-7 px-3 rounded-lg gap-1">
          <Sparkles className="w-3 h-3" />
          Upgrade
        </Button>
        <Button size="sm" className="bg-white/10 hover:bg-white/20 text-spark-nav-foreground text-xs h-7 px-3 rounded-lg gap-1">
          <Plus className="w-3 h-3" />
          New
        </Button>
        <div className="flex items-center gap-0.5 ml-1">
          <button className="p-1.5 rounded-md hover:bg-white/10 text-spark-nav-foreground/70">
            <CalendarDays className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-white/10 text-spark-nav-foreground/70">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-white/10 text-spark-nav-foreground/70">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <Avatar className="h-7 w-7 ml-1 cursor-pointer">
            <AvatarFallback className="bg-spark-accent-purple text-white text-xs font-medium">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default SparkTopNav;
