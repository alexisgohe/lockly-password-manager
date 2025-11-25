"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import PasswordGenerator from "./password-generator"
import { encryptPassword } from "@/utils/encryption"
import { updatePassword } from "@/lib/passwordService"

interface EditPasswordDialogProps {
  password: {
    id: string
    service: string
    username: string
    password: { ciphertext: string; iv: string; salt: string }
    url?: string
    notes?: string
  }
  onUpdate: (updatedPassword: {
    id: string
    service: string
    username: string
    password: { ciphertext: string; iv: string; salt: string }
    url?: string
    notes?: string
  }) => void
  children?: React.ReactNode
  open?: boolean // ✅ Agregar prop opcional
  onOpenChange?: (open: boolean) => void // ✅ Agregar prop opcional
}

export default function EditPasswordDialog({ 
  password, 
  onUpdate, 
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: EditPasswordDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [service, setService] = useState(password.service)
  const [username, setUsername] = useState(password.username)
  const [pwd, setPwd] = useState("")
  const [url, setUrl] = useState(password.url || "")
  const [notes, setNotes] = useState(password.notes || "")
  const [showGenerator, setShowGenerator] = useState(false)

  // ✅ Usar open controlado si existe, sino usar interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  // ✅ Resetear campos cuando se abre el dialog
  useEffect(() => {
    if (open) {
      setService(password.service)
      setUsername(password.username)
      setPwd("")
      setUrl(password.url || "")
      setNotes(password.notes || "")
      setShowGenerator(false)
    }
  }, [open, password])

  const handleUpdatePassword = async () => {
    const master = sessionStorage.getItem("masterKeyHash")
    if (!master) {
      alert("No se encontró la contraseña maestra")
      return
    }

    let encryptedPassword = password.password

    if (pwd) {
      encryptedPassword = await encryptPassword(master, pwd)
    }

    try {
      await updatePassword(password.id, {
        nombre_servicio: service,
        nombre_usuario: username,
        password_encriptada: JSON.stringify(encryptedPassword),
        url,
        notas: notes,
      })

      onUpdate({
        id: password.id,
        service,
        username,
        password: encryptedPassword,
        url,
        notes,
      })

      setOpen(false)
    } catch (err) {
      console.error("Error al actualizar:", err)
      alert("No se pudo actualizar la contraseña")
    }
  }

  const handleGeneratedPassword = (generated: string) => {
    setPwd(generated)
    setShowGenerator(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Contraseña</DialogTitle>
        </DialogHeader>

        {showGenerator ? (
          <PasswordGenerator onSelect={handleGeneratedPassword} />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service">Servicio/Sitio Web</Label>
              <Input id="service" value={service} onChange={(e) => setService(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario/Correo</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa nueva contraseña si quieres cambiarla"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setShowGenerator(true)}>
                  Generar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL del Sitio Web (Opcional)</Label>
              <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePassword}>Guardar Cambios</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}