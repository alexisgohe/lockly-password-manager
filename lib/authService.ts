import { createClient } from "@/utils/supabase/client"

/* ============================
   Derivar la master key (hash)
============================ */
export async function deriveMasterKey(password: string, email: string) {
  const enc = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(email),
      iterations: 150000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )

  const exported = await crypto.subtle.exportKey("raw", key)
  return Buffer.from(exported).toString("base64")
}

/* ============================
   SIGNUP
============================ */
export async function signupWithEmail(email: string, password: string) {
  const supabase = createClient()

  // 1. Derivar master key
  const masterKeyHash = await deriveMasterKey(password, email)

  // 2. Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw new Error(error.message)
  if (!data.user) throw new Error("Error de registro")

  // 3. Guardar hash en la tabla usuarios
  const { error: updateError } = await supabase
    .from("usuarios")
    .update({ hash_password_maestra: masterKeyHash })
    .eq("usuario_id", data.user.id)

  if (updateError) {
    console.error("Error guardando hash:", updateError)
  }

  return { user: data.user, masterKeyHash }
}

/* ============================
   LOGIN
============================ */
export async function loginUser(email: string, masterPassword: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: masterPassword,
  })

  if (error) throw new Error("Correo electrónico o contraseña no válidos")
  if (!data.user) throw new Error("Error de inicio de sesión")

  const masterKeyHash = await deriveMasterKey(masterPassword, email)

  return { user: data.user, masterKeyHash }
}

/* ============================
   LOGOUT
============================ */
export async function logoutUser() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
