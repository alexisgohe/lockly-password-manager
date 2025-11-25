import { supabase } from "@/lib/supabase"

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
  // 1. Derivar master key
  const masterKeyHash = await deriveMasterKey(password, email)

  // 2. Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw new Error(error.message)
  if (!data.user) throw new Error("Error de registro")

  // 3. Guardar hash en la tabla usuarios (el trigger ya creó el registro)
  const { error: updateError } = await supabase
    .from("usuarios")
    .update({ hash_password_maestra: masterKeyHash })
    .eq("usuario_id", data.user.id)

  if (updateError) {
    console.error("Error guardando hash:", updateError)
    // No lanzar error, el usuario ya fue creado
  }

  return { user: data.user, masterKeyHash }
}

/* ============================
   LOGIN
============================ */
export async function loginUser(email: string, masterPassword: string) {
  // 1. Autenticar con Supabase
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password: masterPassword,
    })

  if (authError) throw new Error("Correo electrónico o contraseña no válidos")
  if (!authData.user) throw new Error("Error de inicio de sesión")

  // 2. Derivar master key para cifrado
  const masterKeyHash = await deriveMasterKey(masterPassword, email)

  return { user: authData.user, masterKeyHash }
}

/* ============================
   LOGOUT
============================ */
export async function logoutUser() {
  await supabase.auth.signOut()
}