"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import PasswordGenerator from "./password-generator"
import { encryptPassword } from "@/utils/encryption"
import { savePassword } from "@/lib/passwordService"
import { useUser } from "@supabase/auth-helpers-react"
import type { UIPassword } from "@/lib/passwordTypes"

interface AddPasswordDialogProps {
  onAdd: (password: UIPassword) => void
  children?: React.ReactNode
}

export default function AddPasswordDialog({ onAdd, children }: AddPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [service, setService] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [url, setUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [showGenerator, setShowGenerator] = useState(false)
  const user = useUser()

  const handleAddPassword = async () => {
    if (!service || !username || !password || !user) return

    // 1. Obtener master key
    const master = sessionStorage.getItem("masterKeyHash")
    if (!master) {
      alert("No se encontró la contraseña maestra")
      return
    }

    // 2. Encriptar la contraseña
    const encrypted = await encryptPassword(master, password)

    // 3. Guardar en Supabase
    await savePassword({
      usuario_id: user.id,
      nombre_servicio: service,
      nombre_usuario: username,
      password_encriptada: JSON.stringify(encrypted), // Se guarda como JSON
      url,
      notas: notes,
    })

    // 4. Crear objeto UIPassword para la UI
    const newUIPassword: UIPassword = {
      id: crypto.randomUUID(),
      service,
      username,
      password: encrypted,
      url: url || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    }

    onAdd(newUIPassword)

    // 5. Reset del formulario
    setService("")
    setUsername("")
    setPassword("")
    setUrl("")
    setNotes("")
    setOpen(false)
  }

  const handleGeneratedPassword = (generated: string) => {
    setPassword(generated)
    setShowGenerator(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full sm:w-auto text-sm sm:text-base">
            Añadir Contraseña
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Nueva Contraseña</DialogTitle>
        </DialogHeader>

        {showGenerator ? (
          <PasswordGenerator onSelect={handleGeneratedPassword} />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service">Servicio/Sitio Web</Label>
              <Input
                id="service"
                placeholder="ej. Gmail, GitHub"
                value={service}
                onChange={(e) => setService(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario/Correo</Label>
              <Input
                id="username"
                placeholder="tu@email.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa la contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setShowGenerator(true)}>
                  Generar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL del Sitio Web (Opcional)</Label>
              <Input id="url" placeholder="https://ejemplo.com" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Añade cualquier nota sobre esta contraseña..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPassword} disabled={!service || !username || !password}>
                Guardar Contraseña
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
