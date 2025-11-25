// /lib/passwordTypes.ts

// Este es el tipo EXACTO que devuelve Supabase
export interface Password {
  password_id: string
  usuario_id: string
  nombre_servicio: string
  nombre_usuario: string
  password_encriptada: string
  url?: string
  notas?: string
  creado_en: string
  actualizado_en?: string
  ultimo_uso?: string
  es_favorita?: boolean
  eliminado_en?: string
}

// Tipo para el objeto encriptado
export interface EncryptedPassword {
  ciphertext: string
  iv: string
  salt: string
}

// Este es el tipo para TU UI (PasswordRow, AddPasswordDialog, etc.)
export interface UIPassword {
  id: string
  service: string
  username: string
  password: EncryptedPassword
  url?: string
  notes?: string
  es_favorita?: boolean
  createdAt: string
}