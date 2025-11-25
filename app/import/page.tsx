"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { savePassword } from "@/lib/passwordService"
import { encryptPassword } from "@/utils/encryption"
import type { UIPassword } from "@/lib/passwordTypes"

interface ImportPasswordsDialogProps {
  usuarioId: string
  onAddMultiple: (passwords: UIPassword[]) => void
}

export default function ImportPasswordsDialog({ usuarioId, onAddMultiple }: ImportPasswordsDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0])
  }

  const handleImport = async () => {
    if (!file) return toast({ title: "Error", description: "Selecciona un archivo CSV", variant: "destructive" })

    setIsLoading(true)
    try {
      const text = await file.text()
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

      // Omitir encabezado si existe
      const dataLines = lines[0].toLowerCase().includes("nombre_servicio") ? lines.slice(1) : lines
      const importedPasswords: UIPassword[] = []

      const masterKey = sessionStorage.getItem("masterKeyHash")
      if (!masterKey) throw new Error("No se encontró la contraseña")

      setProgress({ current: 0, total: dataLines.length })

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i]
        const [nombre_servicio, nombre_usuario, passwordPlain, url, notas] = line.split(",")
        if (!nombre_servicio || !nombre_usuario || !passwordPlain) continue

        const encryptedPassword = await encryptPassword(masterKey, passwordPlain)

        await savePassword({
          usuario_id: usuarioId,
          nombre_servicio,
          nombre_usuario,
          password_encriptada: JSON.stringify(encryptedPassword),
          url,
          notas
        })

        importedPasswords.push({
          id: crypto.randomUUID(),
          service: nombre_servicio,
          username: nombre_usuario,
          password: encryptedPassword,
          url,
          notes: notas,
          es_favorita: false,
          createdAt: new Date().toISOString()
        })

        setProgress({ current: i + 1, total: dataLines.length }) // actualizar progreso
      }

      onAddMultiple(importedPasswords)
      setIsOpen(false)
      toast({ title: "Importado", description: `${importedPasswords.length} contraseñas importadas correctamente` })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "No se pudo importar el CSV", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? `Importando ${progress.current}/${progress.total}...` : "Importar CSV"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Contraseñas desde CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="csv-upload"
              className="block w-full cursor-pointer rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-center text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              📁 Seleccionar archivo CSV
            </label>

            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden"
            />

            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Archivo seleccionado: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Formato CSV: <code>nombre_servicio,nombre_usuario,password,url?,notas?</code>
          </p>
          {isLoading && (
            <p className="text-sm text-foreground animate-pulse">
              Importando {progress.current}/{progress.total} contraseñas, por favor espera...
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? `Importando ${progress.current}/${progress.total}...` : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
