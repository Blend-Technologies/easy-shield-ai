import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Bell, Settings, LogOut, Grid3X3 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";

interface CommunityTopNavProps {
  communityName: string;
  logo?: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_TABS = [
  { label: "Community" },
  { label: "Programs" },
  { label: "Members" },
  { label: "Calendar" },
  { label: "Map" },
  { label: "Pods" },
  { label: "Support Center" },
];

const CommunityTopNav = ({ communityName, logo, activeTab, onTabChange }: CommunityTopNavProps) => {
  const navigate = useNavigate();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState("Me");
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data?.avatar_url) setUserAvatar(data.avatar_url);
        if (data?.full_name) setUserName(data.full_name);
      });
    });
  }, []);

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
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
      {/* Logo + community name */}
      <div className="flex items-center gap-2 w-[220px] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          {logo ? (
            <img src={logo} alt="logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xs font-bold">
              {communityName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="font-bold text-gray-900 text-sm truncate max-w-[170px]">
          {communityName}
        </span>
      </div>

      {/* Center nav tabs */}
      <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => onTabChange(tab.label)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-violet-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Chat */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <MessageCircle className="w-4 h-4" />
        </button>

        {/* Bell with badge */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            20
          </span>
        </button>

        {/* Grid/bookmarks */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <Grid3X3 className="w-4 h-4" />
        </button>

        {/* Avatar with dropdown */}
        <div className="relative" ref={avatarMenuRef}>
          <img
            src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff&size=32`}
            alt="avatar"
            className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all"
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
                onClick={async () => {
                  setAvatarMenuOpen(false);
                  await supabase.auth.signOut();
                  navigate("/login");
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
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
