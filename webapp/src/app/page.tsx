import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowRight, Bot, Target, BookMarked, Download } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-20">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/40 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Open Source v1.1
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Formula tu perfil de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-500">
              Investigación Académica
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Plataforma metodológica impulsada por IA. Desde el diagnóstico del problema hasta el documento completo en formato APA 7.
          </p>

          <Link href="/register" className="glow-btn text-lg px-8 py-4 inline-flex items-center gap-2">
            Comenzar mi perfil <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full z-10">
          
          <FeatureCard 
            icon={<Target className="text-orange-400" />}
            title="Validación Bloom"
            desc="Tus objetivos son validados estrictamente contra la Taxonomía de Bloom con ayuda de inteligencia artificial."
          />
          <FeatureCard 
            icon={<Bot className="text-brand-400" />}
            title="Apoyo Socrático"
            desc="Un asistente virtual analiza tus apuntes de campo y sugiere el enfoque metodológico correcto."
          />
          <FeatureCard 
            icon={<BookMarked className="text-green-400" />}
            title="Matriz de Consistencia"
            desc="Estructura garantizada conectando el problema, objetivos, literatura y enfoque metodológico."
          />
          <FeatureCard 
            icon={<Download className="text-purple-400" />}
            title="Documento APA 7"
            desc="Exportación a DOCX estructurado listo para ser presentado en tu institución."
          />

        </div>
      </main>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-panel p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
      <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
