import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardList, BarChart3, Share2, Shield, ArrowRight } from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Editor visual",
    description: "Crea encuestas con un editor intuitivo de arrastrar y soltar",
  },
  {
    icon: BarChart3,
    title: "Resultados en tiempo real",
    description: "Visualiza respuestas con gráficos interactivos",
  },
  {
    icon: Share2,
    title: "Comparte fácilmente",
    description: "Enlaces, QR, iframe y más formas de distribución",
  },
  {
    icon: Shield,
    title: "Gratuito y open source",
    description: "Sin límites de respuestas. Tu código, tu control",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            SurveyApp
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-24 text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Crea encuestas profesionales
            <span className="text-primary block">sin pagar un centavo</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Alternativa gratuita y open source a Typeform y Google Forms.
            Sin límites de respuestas, sin anuncios, sin trampas.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Comenzar gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border bg-card">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        SurveyApp - Proyecto open source
      </footer>
    </div>
  );
}
