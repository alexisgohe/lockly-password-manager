import { supabase } from "@/lib/supabase"
import { mapToUI } from "./mappers"
import type { UIPassword } from "./passwordTypes"

export async function savePassword(data: {
  usuario_id: string
  nombre_servicio: string
  nombre_usuario: string
  password_encriptada: string
  url?: string
  notas?: string
}) {
  const { error } = await supabase.from("passwords").insert(data)

  if (error) {
    console.error("Error al guardar contraseña:", error)
    throw error
  }
}

export async function getPasswords(userId: string): Promise<UIPassword[]> {
  const { data, error } = await supabase
    .from("passwords")
    .select("*")
    .eq("usuario_id", userId)

  if (error) throw error

  return data.map(mapToUI)
}

export async function deletePassword(passwordId: string) {
  const { error } = await supabase
    .from("passwords")
    .delete()
    .eq("password_id", passwordId)

  if (error) throw error
}

export async function updatePassword(passwordId: string, updates: {
  nombre_servicio?: string
  nombre_usuario?: string
  password_encriptada?: string
  url?: string
  notas?: string
}) {
  const { error } = await supabase
    .from("passwords")
    .update(updates)
    .eq("password_id", passwordId)

  if (error) throw error
}

export const setFavoritePassword = async (passwordId: string, isFavorite: boolean) => {
  const { data, error } = await supabase
    .from("passwords")
    .update({
      es_favorita: isFavorite,
      actualizado_en: new Date().toISOString()
    })
    .eq("password_id", passwordId)
    .select()

  if (error) throw error

  return data?.[0] as UIPassword | null
}