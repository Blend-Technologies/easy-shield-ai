import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Bell, LayoutGrid, X, ArrowLeft, User, RefreshCw, Settings, Mail, LogOut } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";

interface CommunityTopNavProps {
  communityName: string;
  logo?: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_TABS = ["Community", "Programs", "Members", "Calendar", "Map", "Pods", "Support Center"];

const CommunityTopNav = ({ communityName, logo, activeTab, onTabChange }: CommunityTopNavProps) => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);
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
    <>
      {/* Notification Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 h-10 bg-[#1a1a2e] flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-white text-sm">
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="font-medium">Stay in the loop!</span>
            <span className="text-gray-300">Enable desktop notifications for messages, comments, and announcements.</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-colors">
              Allow Notifications
            </button>
            <button onClick={() => setShowBanner(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Nav */}
      <header
        className={`fixed left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 ${showBanner ? "top-10" : "top-0"}`}
      >
        {/* Logo + name */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => navigate("/community/create")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Back to communities"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#6B4EFF] flex items-center justify-center">
            {logo ? (
              <img src={logo} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">
                {communityName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-semibold text-gray-900 text-sm truncate max-w-[160px]" title={communityName}>
            {communityName}
          </span>
        </div>

        {/* Center nav tabs */}
        <nav className="flex-1 flex items-center justify-center gap-0.5 overflow-x-auto">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#6B4EFF] text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>

          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0 rounded-full min-w-[16px] text-center leading-[16px]">
              20
            </span>
          </button>

          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Avatar with dropdown */}
          <div className="relative" ref={avatarMenuRef}>
            <img
              src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6B4EFF&color=fff&size=32`}
              alt="avatar"
              className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-[#6B4EFF]/40 transition-all object-cover"
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            />
            {avatarMenuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                <p className="px-4 py-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">My Account</p>
                <button
                  onClick={() => { setAvatarMenuOpen(false); navigate("/community/profile"); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Progress
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { setAvatarMenuOpen(false); navigate("/community/settings"); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                )}
                <button
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Support
                </button>
                <div className="border-t border-gray-100 my-1.5 mx-3" />
                <button
                  onClick={async () => {
                    setAvatarMenuOpen(false);
                    await supabase.auth.signOut();
                    navigate("/login");
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default CommunityTopNav;
