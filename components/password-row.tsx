import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { decryptPassword } from "@/utils/encryption"
import { deletePassword as deletePasswordService } from "@/lib/passwordService"
import EditPasswordDialog from "./edit-password-dialog"
import { Star } from "lucide-react"
import { setFavoritePassword } from "@/lib/passwordService"

interface EncryptedPassword {
  ciphertext: string
  iv: string
  salt: string
}

interface PasswordRowProps {
  password: {
    id: string
    service: string
    username: string
    password: EncryptedPassword
    url?: string
    notes?: string
    es_favorita?: boolean
  }
  onDelete: (id: string) => void
  onUpdate: (updated: any) => void
}

export default function PasswordRow({ password, onDelete, onUpdate }: PasswordRowProps) {
  const { toast } = useToast()
  const [isRevealed, setIsRevealed] = useState(false)
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(!!password.es_favorita)

  const toggleFavorite = async () => {
    try {
      const updated = await setFavoritePassword(password.id, !isFavorite)
      setIsFavorite(updated?.es_favorita ?? !isFavorite)
      onUpdate(updated) // Actualiza la UI en VaultPage
      toast({
        title: updated?.es_favorita ? "Marcado como favorito" : "Quitado de favoritos",
        description: `La contraseña de "${password.service}" ${updated?.es_favorita ? "ahora" : "ya no"} es favorita`,
      })
    } catch (err) {
      console.error("Error actualizando favorito:", err)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de favorito",
        variant: "destructive",
      })
    }
  }

  const copyPassword = async () => {
    const masterKey = sessionStorage.getItem("masterKeyHash")
    if (!masterKey) return alert("No se encontró la contraseña maestra")
    try {
      const decrypted = await decryptPassword(masterKey, password.password)
      navigator.clipboard.writeText(decrypted)
      toast({
        title: "Copiado",
        description: `Contraseña copiada al portapapeles`,
      })
    } catch (err) {
      console.error("Error al copiar:", err)
      toast({
        title: "Error",
        description: "No se pudo copiar la contraseña",
        variant: "destructive",
      })
    }
  }

  const handleReveal = async () => {
    if (!decryptedPassword) {
      const masterKey = sessionStorage.getItem("masterKeyHash")
      if (!masterKey) return alert("No se encontró la contraseña maestra")
      const decrypted = await decryptPassword(masterKey, password.password)
      setDecryptedPassword(decrypted)
    }
    setIsRevealed(!isRevealed)
  }

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    })
  }

  const handleDelete = async () => {
    if (!confirm(`¿Seguro que quieres eliminar la contraseña de "${password.service}"?`)) return
    try {
      await deletePasswordService(password.id)
      onDelete(password.id)
      toast({
        title: "Eliminado",
        description: `La contraseña de "${password.service}" fue eliminada`,
        variant: "destructive",
      })
    } catch (err) {
      console.error("Error al eliminar:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar la contraseña",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow relative">
      <div className="space-y-3">
        {/* Header con nombre del servicio y menú */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{password.service}</h3>
            <p className="text-sm text-muted-foreground">{password.username}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={copyPassword}>Copiar Contraseña</DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyToClipboard(password.username, "Usuario")}>Copiar Usuario</DropdownMenuItem>
              {password.url && (
                <DropdownMenuItem asChild>
                  <a href={password.url} target="_blank" rel="noopener noreferrer">Abrir URL</a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Contraseña</span>
            <Button size="sm" variant="ghost" onClick={handleReveal}>
              {isRevealed ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          <div className="bg-muted p-2 rounded font-mono text-sm text-foreground break-all">
            {isRevealed ? decryptedPassword ?? "Cargando..." : "•".repeat(8)}
          </div>
        </div>

        {/* Notas y favorito */}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <p className="text-xs text-muted-foreground">{password.notes}</p>
          <Button variant="ghost" size="icon" onClick={toggleFavorite}>
            <Star className={`w-5 h-5 ${isFavorite ? "text-yellow-400" : "text-gray-400"}`} />
          </Button>
        </div>
      </div>

      <EditPasswordDialog
        password={password}
        onUpdate={onUpdate}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </Card>
  )
}
