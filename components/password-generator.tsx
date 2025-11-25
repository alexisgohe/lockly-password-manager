"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface PasswordGeneratorProps {
  onSelect: (password: string) => void
}

export default function PasswordGenerator({ onSelect }: PasswordGeneratorProps) {
  const { toast } = useToast()
  const [length, setLength] = useState(16)
  const [useUppercase, setUseUppercase] = useState(true)
  const [useLowercase, setUseLowercase] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [generated, setGenerated] = useState("")

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    let chars = ""
    if (useUppercase) chars += uppercase
    if (useLowercase) chars += lowercase
    if (useNumbers) chars += numbers
    if (useSymbols) chars += symbols

    if (!chars) return

    let password = ""
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGenerated(password)
  }

  useEffect(() => {
    generatePassword()
  }, [])

  const handleCopyAndSelect = () => {
    navigator.clipboard.writeText(generated)
    toast({
      title: "Copiado",
      description: "Contraseña copiada al portapapeles",
    })
    onSelect(generated)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="bg-muted p-4 rounded-lg font-mono text-center text-lg font-semibold text-foreground break-all">
          {generated}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => {
              navigator.clipboard.writeText(generated)
              toast({
                title: "Copiado",
                description: "Contraseña copiada al portapapeles",
              })
            }}
          >
            Copiar
          </Button>
          <Button className="flex-1" onClick={handleCopyAndSelect}>
            Usar Esta Contraseña
          </Button>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Longitud de Contraseña</Label>
            <span className="text-lg font-semibold text-foreground">{length}</span>
          </div>
          <Slider value={[length]} onValueChange={(value) => setLength(value[0])} min={8} max={64} step={1} />
        </div>

        <div className="space-y-3">
          <Label>Tipos de Caracteres</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="uppercase"
              checked={useUppercase}
              onCheckedChange={(checked) => setUseUppercase(checked as boolean)}
            />
            <Label htmlFor="uppercase" className="font-normal cursor-pointer">
              Mayúsculas (A-Z)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lowercase"
              checked={useLowercase}
              onCheckedChange={(checked) => setUseLowercase(checked as boolean)}
            />
            <Label htmlFor="lowercase" className="font-normal cursor-pointer">
              Minúsculas (a-z)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="numbers"
              checked={useNumbers}
              onCheckedChange={(checked) => setUseNumbers(checked as boolean)}
            />
            <Label htmlFor="numbers" className="font-normal cursor-pointer">
              Números (0-9)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="symbols"
              checked={useSymbols}
              onCheckedChange={(checked) => setUseSymbols(checked as boolean)}
            />
            <Label htmlFor="symbols" className="font-normal cursor-pointer">
              Símbolos (!@#$%...)
            </Label>
          </div>
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={generatePassword}>
          Regenerar
        </Button>
      </div>
    </div>
  )
}