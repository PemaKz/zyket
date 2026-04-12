import { Navigate, Routes, Route, Link, useLocation } from "react-router-dom";
import useLayout from "../../hooks/useLayout";
import layoutRoutes from "./routes";

export default function PanelLayout() {
  const location = useLocation();
  const { routes } = useLayout(layoutRoutes);

  const navItems = [
    { name: "Dashboard", path: "/panel/dashboard", icon: "📊" },
    { name: "Settings", path: "/panel/settings", icon: "⚙️" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-zinc-900 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center">
              <span className="text-black font-black text-sm tracking-tighter">PY</span>
            </div>
            <span className="text-white font-black text-lg tracking-widest uppercase">Pnyise</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-orange-500 text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="px-4 py-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-zinc-500 truncate">user@example.com</p>
            </div>
          </div>
          <Link
            to="/auth"
            className="w-full mt-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors flex items-center justify-center"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(255,107,0,0.08),transparent_65%)]" />
        </div>

        {/* Header */}
        <header className="relative z-10 px-8 py-6 border-b border-zinc-900 bg-[#080808]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                🔔
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 overflow-auto">
          <div className="p-8">
            <Routes>
              {routes}
              <Route path="*" element={<Navigate to="/panel/dashboard" replace />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-4 text-center text-xs text-zinc-700 border-t border-zinc-900">
          © {new Date().getFullYear()} Zyket. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
