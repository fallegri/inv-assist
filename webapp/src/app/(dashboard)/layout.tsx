"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This strictly solves the Claude Hydration bug by verifying client-side securely. 
    // And prevents flashes of unauthenticated content.
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-brand-500 mb-4" />
        <p className="text-gray-400">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Don't render dashboard components while redirecting
  }

  return (
    <div className="min-h-screen bg-background relative isolate">
      {/* Subtle background glow */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-brand-800/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
