"use client";

import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-500" />
            <span className="font-bold text-lg hidden sm:block">Research Assistant API</span>
            <span className="font-bold text-lg sm:hidden">RA</span>
          </Link>

          {!loading && (
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium hover:text-white text-gray-300 transition-colors">
                    Mis Proyectos
                  </Link>
                  <div className="h-8 w-px bg-white/20 mx-2"></div>
                  <div className="flex items-center gap-2 group relative">
                    <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                    
                    {/* Tooltip / Modal Hover para Salir */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2">
                      <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10 mb-1 truncate">
                        {user.email}
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-black/50 rounded flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium hover:text-white text-gray-300 transition-colors">
                    Iniciar Sesión
                  </Link>
                  <Link href="/register" className="glow-btn text-sm">
                    Regístrate
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
