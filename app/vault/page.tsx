"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import AddPasswordDialog from "@/components/add-password-dialog"
import PasswordRow from "@/components/password-row"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { logoutUser } from "@/lib/authService"
import { getPasswords } from "@/lib/passwordService"
import type { UIPassword } from "@/lib/passwordTypes"
import ImportPasswordsDialog from "../import/page"

export default function VaultPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [passwords, setPasswords] = useState<UIPassword[]>([])
  const [filteredPasswords, setFilteredPasswords] = useState<UIPassword[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log("❌ No hay sesión, redirigiendo a login")
        router.push("/login")
        return
      }

      const userData = {
        id: session.user.id,
        email: session.user.email!
      }
      
      console.log(session)
      setCurrentUser(userData)

      try {
        const loadedPasswords = await getPasswords(userData.id)
        console.log("Contraseñas cargadas:", loadedPasswords)
        setPasswords(loadedPasswords)
        setFilteredPasswords(loadedPasswords)
      } catch (error) {
        console.error("Error cargando contraseñas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las contraseñas",
          variant: "destructive"
        })
      }
      
      setIsLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, toast])

  const filterPasswords = (list: UIPassword[], term: string, favoritesOnly: boolean) => {
    const normalize = (str: any) =>
      String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .replace(/[\n\r]/g, "")
        .trim()
        .toLowerCase();

    const normalizedTerm = normalize(term);

    return list.filter((p) => {
      const service = normalize(p.service);
      const username = normalize(p.username);
      const notes = normalize(p.notes);

      const matchesSearch = service.includes(normalizedTerm) || username.includes(normalizedTerm) || notes.includes(normalizedTerm);
      const matchesFavorite = favoritesOnly ? p.es_favorita : true;

      return matchesSearch && matchesFavorite;
    });
  };

  useEffect(() => {
    setFilteredPasswords(filterPasswords(passwords, searchTerm, showFavoritesOnly));
  }, [searchTerm, passwords, showFavoritesOnly]);

  const handleAddPassword = (newPassword: UIPassword) => {
    const updated = [...passwords, newPassword]
    setPasswords(updated)
    setFilteredPasswords(updated)
    toast({
      title: "Éxito",
      description: "Contraseña añadida a la bóveda",
    })
  }

  const handleUpdatePassword = (updatedPassword: UIPassword) => {
    const updatedPasswords = passwords.map(p =>
      p.id === updatedPassword.id ? updatedPassword : p
    );
    setPasswords(updatedPasswords);

    // Recalcular filtrado completo
    setFilteredPasswords(filterPasswords(updatedPasswords, searchTerm, showFavoritesOnly));

    toast({
      title: "Actualizado",
      description: "Contraseña actualizada correctamente",
    });
  };

  const handleDeletePassword = (id: string) => {
    const updated = passwords.filter((p) => p.id !== id)
    setPasswords(updated)
    
    const filteredUpdated = filteredPasswords.filter((p) => p.id !== id)
    setFilteredPasswords(filteredUpdated)
    
    toast({
      title: "Eliminado",
      description: "Contraseña eliminada de la bóveda",
    })
  }

  const handleLogout = async () => {
    await logoutUser()
    sessionStorage.removeItem("masterKeyHash")
    router.push("/")
  }

  const handleAddMultiplePasswords = (newPasswords: UIPassword[]) => {
    const updated = [...passwords, ...newPasswords]
    setPasswords(updated)
    setFilteredPasswords(filterPasswords(updated, searchTerm, showFavoritesOnly))
    toast({
      title: "Éxito",
      description: `${newPasswords.length} contraseñas añadidas a la bóveda`,
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header responsivo */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Gestión de Contraseñas
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Bienvenido {currentUser?.email}
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="sm:hidden">
                <AddPasswordDialog onAdd={handleAddPassword} />
              </div>
              <div className="hidden sm:block">
                <AddPasswordDialog onAdd={handleAddPassword} />
              </div>
              {currentUser && (
                <ImportPasswordsDialog 
                  onAddMultiple={handleAddMultiplePasswords} 
                  usuarioId={currentUser.id} 
                />
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <span className="text-sm">⋮</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href="/settings" className="cursor-pointer">
                      Configuración
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal responsivo */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Input
            type="text"
            placeholder="Buscar contraseñas por servicio o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm sm:text-base"
          />
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            className="ml-2"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            {showFavoritesOnly ? "Mostrando favoritos" : "Solo favoritos"}
          </Button>
        </div>

        {/* Estado vacío o resultados */}
        {filteredPasswords.length === 0 ? (
          <Card className="p-6 sm:p-8 lg:p-12 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {searchTerm ? "No se encontraron contraseñas" : "Tu bóveda está vacía"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              {searchTerm ? "Intenta ajustar tu búsqueda" : "Añade tu primera contraseña para comenzar"}
            </p>
            {!searchTerm && (
              <AddPasswordDialog onAdd={handleAddPassword}>
                <Button size="sm" className="text-xs sm:text-sm">
                  Añadir Primera Contraseña
                </Button>
              </AddPasswordDialog>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredPasswords.map((pwd) => (
              <PasswordRow 
                key={pwd.id} 
                password={pwd} 
                onDelete={handleDeletePassword}
                onUpdate={handleUpdatePassword}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante para móviles */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <AddPasswordDialog onAdd={handleAddPassword}>
          <Button 
            size="lg" 
            className="rounded-full w-14 h-14 shadow-lg"
          >
            <span className="text-lg">+</span>
          </Button>
        </AddPasswordDialog>
      </div>
    </main>
  )
}