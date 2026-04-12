import { Navigate, Routes, Route } from "react-router-dom";
import useLayout from "../../hooks/useLayout";
import layoutRoutes from "./routes";

export default function AuthLayout() {
  const { routes } = useLayout(layoutRoutes)

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center relative overflow-hidden">
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

      <div className="relative z-10 w-full max-w-sm px-8 py-10 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 bg-orange-500 rounded-md flex items-center justify-center">
            <span className="text-black font-black text-base tracking-tighter">PY</span>
          </div>
          <span className="text-white font-black text-2xl tracking-widest uppercase">Pnyise</span>
        </div>

        <Routes>
          {routes}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>

      <div className="absolute bottom-6 text-xs text-zinc-700">
        © {new Date().getFullYear()} Zyket
      </div>

    </div>
  );
}
