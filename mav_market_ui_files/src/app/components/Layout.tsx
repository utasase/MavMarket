import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, Compass, MessageCircle, User } from "lucide-react";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/swipe", icon: Compass, label: "Discover" },
  { path: "/messages", icon: MessageCircle, label: "Messages" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom Tab Bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const isActive =
              tab.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex items-center justify-center p-3 transition-colors ${
                  isActive
                    ? "text-black"
                    : "text-gray-300 hover:text-gray-500"
                }`}
              >
                <tab.icon
                  size={28}
                  strokeWidth={isActive ? 2 : 1.5}
                  fill="none"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}