"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { decryptPassword } from "@/utils/encryption"

interface SettingsData {
  twoFaEnabled: boolean
  autoLockTimeout: number
  biometricEnabled: boolean
  passwordExpiryDays: number
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [settings, setSettings] = useState<SettingsData>({
    twoFaEnabled: false,
    autoLockTimeout: 15,
    biometricEnabled: false,
    passwordExpiryDays: 90,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const supabase = createClient()
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

        setCurrentUser(userData)

        // Cargar configuración del usuario
        const savedSettings = localStorage.getItem(`settings_${userData.id}`)
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Error obteniendo sesión:", error)
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [router])

  const handleSaveSettings = () => {
    if (currentUser) {
      localStorage.setItem(`settings_${currentUser.id}`, JSON.stringify(settings))
      toast({
        title: "Éxito",
        description: "Configuración guardada correctamente",
      })
    }
  }

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      return
    }

    // Actualizar contraseña en localStorage
    const users = JSON.parse(localStorage.getItem("users") || "{}")
    if (currentUser && users[currentUser.email]) {
      users[currentUser.email].password = newPassword
      localStorage.setItem("users", JSON.stringify(users))

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      })

      setNewPassword("")
      setConfirmPassword("")
    }
  }

  const handleExportCSV = async () => {
    if (!currentUser) return;

    // Confirmar acción
    const confirmed = window.confirm(
      "⚠️ ADVERTENCIA DE SEGURIDAD\n\n" +
      "Estás a punto de exportar tus contraseñas en texto plano a un archivo CSV. " +
      "Este archivo NO estará encriptado y cualquiera que lo abra podrá ver tus contraseñas.\n\n" +
      "¿Estás seguro de que deseas continuar?"
    );

    if (!confirmed) return;

    try {
      const masterKeyHash = sessionStorage.getItem("masterKeyHash");
      if (!masterKeyHash) {
        toast({
          title: "Error",
          description: "No se encontró la contraseña. Por favor, vuelve a iniciar sesión.",
          variant: "destructive"
        });
        return;
      }

      const supabase = createClient()
      const { data: passwords, error } = await supabase
        .from("passwords")
        .select("*")
        .eq("usuario_id", currentUser.id);

      if (error) throw error;
      if (!passwords || passwords.length === 0) {
        toast({ 
          title: "Sin contraseñas", 
          description: "No se encontraron registros para exportar" 
        });
        return;
      }

      const decryptedPasswords = await Promise.all(
        passwords.map(async (p) => {
          try {
            const encryptedObj = typeof p.password_encriptada === 'string' 
              ? JSON.parse(p.password_encriptada)
              : p.password_encriptada;

            const decryptedPassword = await decryptPassword(masterKeyHash, encryptedObj);

            return {
              nombre_servicio: p.nombre_servicio,
              nombre_usuario: p.nombre_usuario,
              password: decryptedPassword,
              url: p.url ?? "",
              notas: p.notas ?? "",
            };
          } catch (err) {
            console.error(`Error desencriptando contraseña para ${p.nombre_servicio}:`, err);
            return {
              nombre_servicio: p.nombre_servicio,
              nombre_usuario: p.nombre_usuario,
              password: "[Error al desencriptar]",
              url: p.url ?? "",
              notas: p.notas ?? "",
            };
          }
        })
      );

      // ✅ Sin comillas dobles
      const header = ["nombre_servicio","nombre_usuario","password_encriptada","url","notas"];
      const rows = decryptedPasswords.map(p => [
        p.nombre_servicio,
        p.nombre_usuario,
        p.password,
        p.url,
        p.notas,
      ]);

      const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contraseñas_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ 
        title: "Exportación completa", 
        description: `${passwords.length} contraseñas exportadas correctamente` 
      });
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: "No se pudo exportar el CSV", 
        variant: "destructive" 
      });
    }
  };

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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/vault">
              <Button variant="outline" size="icon">
                ←
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Sección de Cuenta */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Cuenta</h2>
            <p className="text-sm text-muted-foreground">Gestiona la configuración de tu cuenta</p>
          </div>
          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Correo Electrónico</Label>
              <div className="mt-2 p-3 bg-muted rounded text-foreground">{currentUser?.email}</div>
            </div>
          </div>

          <Button onClick={handleExportCSV} variant="outline">
            Exportar Contraseñas CSV
          </Button>
        </Card>

        {/* Sección de Seguridad */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Seguridad</h2>
            <p className="text-sm text-muted-foreground">Gestiona tus preferencias de seguridad</p>
          </div>
          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Autenticación de Dos Factores</Label>
                <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
              </div>
              <Switch
                checked={settings.twoFaEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFaEnabled: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Inicio de Sesión Biométrico</Label>
                <p className="text-sm text-muted-foreground">Usa huella dactilar o reconocimiento facial</p>
              </div>
              <Switch
                checked={settings.biometricEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, biometricEnabled: checked })}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="autolock" className="text-foreground">
                Tiempo de Auto-bloqueo (minutos)
              </Label>
              <Input
                id="autolock"
                type="number"
                min="5"
                max="120"
                value={settings.autoLockTimeout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoLockTimeout: Number.parseInt(e.target.value) || 15,
                  })
                }
                className="mt-2"
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="expiry" className="text-foreground">
                Caducidad de Contraseñas (días)
              </Label>
              <Input
                id="expiry"
                type="number"
                min="30"
                max="365"
                value={settings.passwordExpiryDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passwordExpiryDays: Number.parseInt(e.target.value) || 90,
                  })
                }
                className="mt-2"
              />
            </div>
          </div>

          <Separator />
          <Button onClick={handleSaveSettings}>Guardar Configuración de Seguridad</Button>
        </Card>

        {/* Sección de Cambio de Contraseña */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Cambiar Contraseña</h2>
            <p className="text-sm text-muted-foreground">Actualiza tu contraseña</p>
          </div>
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newpass">Nueva Contraseña</Label>
              <Input
                id="newpass"
                type="password"
                placeholder="Ingresa nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmpass">Confirmar Contraseña</Label>
              <Input
                id="confirmpass"
                type="password"
                placeholder="Confirma la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button onClick={handleChangePassword}>Actualizar Contraseña</Button>
          </div>
        </Card>

        {/* Zona de Peligro */}
        <Card className="p-6 space-y-6 border-destructive/50">
          <div>
            <h2 className="text-xl font-semibold text-destructive mb-2">Zona de Peligro</h2>
            <p className="text-sm text-muted-foreground">Acciones irreversibles</p>
          </div>
          <Separator />

          <Button
            variant="destructive"
            onClick={() => {
              localStorage.removeItem("currentUser")
              router.push("/")
            }}
          >
            Eliminar Cuenta
          </Button>
        </Card>
      </div>
    </main>
  )
}