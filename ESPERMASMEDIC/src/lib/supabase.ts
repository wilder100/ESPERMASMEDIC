import { createClient } from '@supabase/supabase-js'

// Se captura antes de crear el cliente (que limpia la URL) para detectar el enlace de recuperación de contraseña.
export const recoveryFromUrl = window.location.hash.includes('type=recovery')

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Solo la clave pública "anon". NUNCA pongas la service_role aquí.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
