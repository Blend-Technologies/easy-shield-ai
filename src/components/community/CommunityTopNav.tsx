import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, Bookmark, Search, X, ArrowLeft, Settings, LogOut } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface CommunityTopNavProps {
  communityName: string;
  logo?: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_TABS = ["Home", "Courses", "Calendar", "Members"];

const CommunityTopNav = ({ communityName, logo, activeTab, onTabChange }: CommunityTopNavProps) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
      {/* Logo + name */}
      <div className="flex items-center gap-2.5 w-[240px] flex-shrink-0">
        <button
          onClick={() => navigate("/community/create")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Back to communities"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary flex items-center justify-center">
          {logo ? (
            <img src={logo} alt="logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-foreground text-xs font-bold">
              {communityName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="font-semibold text-foreground text-sm truncate max-w-[160px]">
          {communityName}
        </span>
      </div>

      {/* Center nav */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {NAV_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Right icons */}
      <div className="flex items-center gap-1 w-[240px] justify-end flex-shrink-0">
        {/* Search */}
        {searchOpen ? (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              className="bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 w-32"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Chat */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <MessageCircle className="w-4 h-4" />
        </button>

        {/* Bookmark */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>

        {/* Avatar with dropdown */}
        <div className="relative" ref={avatarMenuRef}>
          <img
            src="https://ui-avatars.com/api/?name=Me&background=2563EB&color=fff&size=32"
            alt="avatar"
            className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
          />
          {avatarMenuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              {isAdmin && (
                <button
                  onClick={() => { setAvatarMenuOpen(false); navigate("/community/settings"); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
              )}
              <button
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CommunityTopNav;
