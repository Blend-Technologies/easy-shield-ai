import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, User, Bell, RefreshCw, CreditCard, Pencil, Eye, EyeOff, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import MembersManagementPanel from "@/components/settings/MembersManagementPanel";

const USER_SIDEBAR_ITEMS = [
  {
    section: "User Settings",
    items: [
      { label: "My Account", icon: User, id: "account" },
      { label: "Notifications", icon: Bell, id: "notifications" },
    ],
  },
  {
    section: "Billing Settings",
    items: [
      { label: "Subscriptions", icon: RefreshCw, id: "subscriptions" },
      { label: "Billing", icon: CreditCard, id: "billing" },
    ],
  },
];

const ADMIN_SIDEBAR_ITEMS = [
  {
    section: "Admin Settings",
    items: [
      { label: "My Account", icon: User, id: "account" },
      { label: "Members", icon: Users, id: "members" },
      { label: "Notifications", icon: Bell, id: "notifications" },
    ],
  },
  {
    section: "Billing Settings",
    items: [
      { label: "Subscriptions", icon: RefreshCw, id: "subscriptions" },
      { label: "Billing", icon: CreditCard, id: "billing" },
    ],
  },
];

const AccountSettings = () => {
  const { isAdmin } = useIsAdmin();
  const sidebarItems = isAdmin ? ADMIN_SIDEBAR_ITEMS : USER_SIDEBAR_ITEMS;
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("account");
  const [activeTab, setActiveTab] = useState("security");
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null; email: string }>({
    full_name: "",
    avatar_url: null,
    email: "",
  });
  const [emailRevealed, setEmailRevealed] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
      setProfile({
        full_name: data?.full_name || user.user_metadata?.full_name || "User",
        avatar_url: data?.avatar_url || null,
        email: user.email || "",
      });
    };
    load();
  }, []);

  const maskedEmail = profile.email
    ? profile.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(Math.max(b.length, 6)) + c)
    : "";

  const username = profile.full_name?.toLowerCase().replace(/\s+/g, "") || "user";

  return (
    <div className="fixed inset-0 z-50 bg-white flex">
      {/* Left Sidebar */}
      <aside className="w-[260px] border-r border-gray-200 flex flex-col h-full overflow-y-auto">
        {/* User Identity */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=5865F2&color=fff&size=44`}
              alt="avatar"
              className="w-11 h-11 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{profile.full_name}</p>
              <button className="text-xs text-[#5865F2] hover:underline flex items-center gap-1">
                Edit Profiles <Pencil className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 mx-4" />

        {/* Search */}
        <div className="p-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 w-full"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Nav Sections */}
        {sidebarItems.map((section) => (
          <div key={section.section} className="px-4 mb-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{section.section}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeItem === item.id
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {activeItem === "account" && (
          <div className="max-w-3xl mx-auto py-8 px-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">My Account</h1>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
              {["security", "standing"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "text-[#5865F2] border-b-2 border-[#5865F2]"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Profile Preview Card */}
                <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="h-[120px] bg-gradient-to-r from-gray-200 to-gray-300" />
                  <div className="px-5 pb-5 flex items-center gap-4 -mt-9">
                    <img
                      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=5865F2&color=fff&size=72`}
                      alt="avatar"
                      className="w-[72px] h-[72px] rounded-full border-4 border-white object-cover shadow"
                    />
                    <div className="flex-1 pt-10">
                      <p className="font-bold text-gray-900">{profile.full_name}</p>
                    </div>
                    <button className="mt-10 px-4 py-2 bg-[#5865F2] text-white text-sm font-medium rounded-lg hover:bg-[#4752C4] transition-colors">
                      Edit User Profile
                    </button>
                  </div>
                </div>

                {/* Account Details Card */}
                <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
                  {[
                    { label: "Display Name", value: profile.full_name, action: "Edit" },
                    { label: "Username", value: username, action: "Edit" },
                    {
                      label: "Email",
                      value: (
                        <span className="flex items-center gap-2">
                          {emailRevealed ? profile.email : maskedEmail}
                          <button
                            onClick={() => setEmailRevealed(!emailRevealed)}
                            className="text-[#5865F2] text-xs hover:underline flex items-center gap-1"
                          >
                            {emailRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {emailRevealed ? "Hide" : "Reveal"}
                          </button>
                        </span>
                      ),
                      action: "Edit",
                    },
                    {
                      label: "Phone Number",
                      value: <span className="italic text-gray-400">You haven't added a phone number yet.</span>,
                      action: "Add",
                    },
                  ].map((row, i, arr) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{row.value}</p>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                          {row.action}
                        </button>
                      </div>
                      {i < arr.length - 1 && <div className="border-b border-gray-100 mx-5" />}
                    </div>
                  ))}
                </div>

                {/* Password and Authentication */}
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-4">Password and Authentication</h2>
                  <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
                    <div className="flex items-center justify-between px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">Change Password</p>
                      <button className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                    </div>
                    <div className="border-b border-gray-100 mx-5" />
                    <div className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
                      </div>
                      <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                    </div>
                    {twoFactorEnabled && (
                      <>
                        <div className="border-b border-gray-100 mx-5" />
                        <div className="px-5 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700">Authenticator App</p>
                            <button className="px-3 py-1.5 text-xs font-medium bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors">
                              Enable
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700">SMS Authentication</p>
                            <button className="px-3 py-1.5 text-xs font-medium bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors">
                              Enable
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "standing" && (
              <div className="text-gray-500 text-sm py-12 text-center">
                Account standing information will appear here.
              </div>
            )}
          </div>
        )}

        {activeItem === "members" && isAdmin && <MembersManagementPanel />}

        {activeItem === "notifications" && (
          <div className="max-w-3xl mx-auto py-8 px-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Notifications</h1>
            <p className="text-sm text-gray-500">Notification settings will appear here.</p>
          </div>
        )}

        {activeItem === "subscriptions" && (
          <div className="max-w-3xl mx-auto py-8 px-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Subscriptions</h1>
            <p className="text-sm text-gray-500">Subscription management will appear here.</p>
          </div>
        )}

        {activeItem === "billing" && (
          <div className="max-w-3xl mx-auto py-8 px-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Billing</h1>
            <p className="text-sm text-gray-500">Billing information will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
