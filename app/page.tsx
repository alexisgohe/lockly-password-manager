"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-card flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Lado izquierdo - Hero */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground text-balance">Protege Tu Vida Digital</h1>
            <p className="text-xl text-muted-foreground">
              Gestión de contraseñas de grado empresarial. Mantén tus credenciales seguras con cifrado de grado militar.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/signup">Comenzar</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-transparent">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-foreground">256-bit</p>
              <p className="text-sm text-muted-foreground">Cifrado AES</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Cero</p>
              <p className="text-sm text-muted-foreground">Fugas de Datos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">99.9%</p>
              <p className="text-sm text-muted-foreground">Tiempo Activo</p>
            </div>
          </div>
        </div>

        {/* Lado derecho - Tarjeta de vista previa */}
        <div className="hidden lg:flex justify-center">
          <Card className="w-full max-w-sm p-8 space-y-6 bg-card border border-border shadow-2xl">
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">🔐</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Gestor de Contraseñas</h3>
              <p className="text-sm text-muted-foreground">Seguridad empresarial para todos</p>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-border rounded-full" />
              <div className="h-2 bg-border rounded-full w-3/4" />
              <div className="h-2 bg-border rounded-full w-1/2" />
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}