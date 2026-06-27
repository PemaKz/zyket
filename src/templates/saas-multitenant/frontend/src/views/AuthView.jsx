import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function AuthView() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (key, type = "text", placeholder = "") => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-indigo-500"
      required
    />
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
        <h1 className="text-2xl font-bold text-center">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>

        {mode === "register" && field("name", "text", "Name")}
        {field("email", "email", "Email")}
        {field("password", "password", "Password")}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-indigo-500 text-white font-semibold disabled:opacity-50"
        >
          {loading ? "..." : mode === "login" ? "Sign in" : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full text-sm text-zinc-400 hover:text-white"
        >
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
