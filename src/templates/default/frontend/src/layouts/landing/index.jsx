import { Navigate, Routes, Route, Link } from "react-router-dom";
import useLayout from "../../hooks/useLayout";
import layoutRoutes from "./routes";

export default function LandingLayout() {
  const { routes } = useLayout(layoutRoutes)
  

  return (
    <div className="min-h-screen bg-[#080808] text-white relative overflow-hidden">
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

      <div className="relative z-10">
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center">
              <span className="text-black font-black text-sm tracking-tighter">PY</span>
            </div>
            <span className="text-white font-black text-xl tracking-widest uppercase">Pnyise</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              to="/auth" 
              className="text-sm bg-orange-500 hover:bg-orange-600 text-black font-semibold px-4 py-2 rounded-md transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <main className="px-8 py-12">
          <Routes>
            {routes}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="absolute bottom-0 w-full py-6 text-center text-xs text-zinc-700 border-t border-zinc-900">
          © {new Date().getFullYear()} Zyket. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
