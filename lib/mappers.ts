import type { Password, UIPassword } from "./passwordTypes"

export function mapToUI(p: Password): UIPassword {
  // ✅ Parsear password_encriptada si es string
  let passwordObj
  try {
    passwordObj = typeof p.password_encriptada === 'string' 
      ? JSON.parse(p.password_encriptada)
      : p.password_encriptada
  } catch (error) {
    console.error("Error parseando password_encriptada:", error, p.password_encriptada)
    // Fallback en caso de error
    passwordObj = {
      ciphertext: "",
      iv: "",
      salt: ""
    }
  }

  return {
    id: p.password_id,
    service: p.nombre_servicio,
    username: p.nombre_usuario,
    password: passwordObj,
    url: p.url ?? "",
    notes: p.notas ?? "",
    es_favorita: p.es_favorita,
    createdAt: p.creado_en
  }
}