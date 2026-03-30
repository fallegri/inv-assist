"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    institucion: "",
    carrera: "",
    area_estudio: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Registrar guardado seguro de base de datos e iniciar sesion
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar perfil en la base de datos.");

      // AuthProvider recargará usando la cookie devuelta automágicamente
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error durante el registro. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-24 px-4 pb-12">
        <div className="glass-panel p-8 w-full max-w-lg relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600 rounded-full blur-[80px] opacity-20"></div>
          
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl font-bold mb-2">Crear Cuenta</h1>
            <p className="text-gray-400">Plataforma Open Source de Investigación</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Nombre Completo</label>
                <input required type="text" name="nombre" value={form.nombre} onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-500" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Correo Electrónico</label>
                <input required type="email" name="email" value={form.email} onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-500" />
              </div>
              
              {/* This fulfills the explicit request to collect flexible institution data */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-300">Institución Universitaria / Académica</label>
                <input required type="text" name="institucion" placeholder="Ej: Universidad Autónoma Gabriel René Moreno" value={form.institucion} onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-500" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Carrera / Programa</label>
                <input required type="text" name="carrera" placeholder="Ej: Ing. Sistemas" value={form.carrera} onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-500" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Área de Estudio (Opcional)</label>
                <input type="text" name="area_estudio" placeholder="Ingeniería de Software" value={form.area_estudio} onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-500" />
              </div>
              
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-300">Contraseña</label>
                <input required type="password" name="password" minLength={6} value={form.password} onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-500" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="glow-btn flex justify-center items-center mt-4 w-full h-11">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Registrarse y Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 relative z-10">
            ¿Ya tienes cuenta? <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </>
  );
}
