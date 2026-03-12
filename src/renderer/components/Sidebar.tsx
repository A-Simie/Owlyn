import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    icon: "dashboard",
    label: "Dashboard",
    role: ["ADMIN", "RECRUITER"],
  },
  {
    path: "/interviews",
    icon: "videocam",
    label: "Interviews",
    role: ["ADMIN", "RECRUITER"],
  },
  { path: "/agent", icon: "smart_toy", label: "AI Personas", role: ["ADMIN"] },
  { path: "/settings", icon: "settings", label: "Settings", role: ["ADMIN"] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { workspace, fetchWorkspace } = useWorkspaceStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);


  useEffect(() => {
    setImageError(false);
  }, [workspace?.logoUrl]);

  // Filter items based on role
  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.role || item.role.includes(user?.role || ""),
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col bg-[#0d0d0d] border-r border-primary/15 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        {workspace?.logoUrl && !imageError && workspace.logoUrl !== "null" && workspace.logoUrl.trim() !== "" ? (
          <img 
            key={workspace.logoUrl}
            src={workspace.logoUrl} 
            alt="Logo" 
            onError={() => {
              console.log("Sidebar logo load error");
              setImageError(true);
            }}
            className="w-10 h-10 rounded-lg object-cover border border-primary/20 shadow-lg"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="text-black font-black text-[11px] tracking-tighter">
              {workspace ? getInitials(workspace.name) : "OW"}
            </span>
          </div>
        )}
        <div className="flex flex-col leading-none overflow-hidden">
          <span className="text-sm font-bold tracking-tight text-white truncate">
            {workspace?.name || "OWLYN"}
          </span>
          <span className="text-[9px] font-semibold tracking-[0.25em] text-primary/60 uppercase">
            {user?.role === "ADMIN" ? "Enterprise" : "Recruiter"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 mt-4">
        {filteredItems.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <span
                  className="material-symbols-outlined text-lg"
                  style={
                    isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {icon}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* CTA & Logout */}
      <div className="p-4 space-y-2">
        <button
          onClick={() => navigate("/interviews?create=true")}
          className="w-full flex items-center justify-center gap-2 bg-primary text-black py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Interview
        </button>
        <button
          onClick={() => {
            clearAuth();
            navigate("/auth");
          }}
          className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
