export async function encryptPassword(masterPassword: string, plainPassword: string) {
  // 1. Salt para derivar la clave
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // 2. Derivar clave con PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 310000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  )

  // 3. IV para AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 4. Cifrado real
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plainPassword)
  )

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  }
}

export async function decryptPassword(masterPassword: string, encrypted: { ciphertext: string; iv: string; salt: string }): Promise<string> {
  const saltBytes = Uint8Array.from(atob(encrypted.salt), c => c.charCodeAt(0))
  const ivBytes = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0))
  const ciphertextBytes = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0))

  // Derivar la misma clave con PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 310000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  )

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    ciphertextBytes
  )

  return new TextDecoder().decode(decryptedBuffer)
}