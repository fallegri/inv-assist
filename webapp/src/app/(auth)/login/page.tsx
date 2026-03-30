"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      // Redirigir y forzar recarga de Router y Context Auth (vía refresh)
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Credenciales inválidas. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-16 px-4">
        <div className="glass-panel p-8 w-full max-w-md relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-600 rounded-full blur-[80px] opacity-40"></div>
          
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl font-bold mb-2">Bienvenido</h1>
            <p className="text-gray-400">Ingresa a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Correo Electrónico</label>
              <input 
                type="email" 
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Contraseña</label>
                <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">¿Olvidaste tu contraseña?</Link>
              </div>
              <input 
                type="password" 
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="glow-btn flex justify-center items-center mt-4 w-full h-11"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Iniciar Sesión"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 relative z-10">
            ¿No tienes cuenta? <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">Regístrate</Link>
          </p>
        </div>
      </div>
    </>
  );
}
