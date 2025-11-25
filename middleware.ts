import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,

        set: (name, value) => {
          // Next.js middleware NO acepta options
          res.cookies.set(name, value)
        },

        remove: (name) => {
          // Igual: NO acepta options
          res.cookies.delete(name)
        },
      },
    }
  )

  // Obtener sesión
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthenticated = !!session

  const publicRoutes = ["/", "/login", "/signup"]
  const privateRoutes = ["/vault", "/settings"]

  const pathname = req.nextUrl.pathname

  // Logs de depuración: estas salidas aparecen en la terminal del servidor (dev server),
  // no en la consola del navegador.
  try {
    console.log("[middleware] pathname:", pathname)
    console.log("[middleware] isAuthenticated:", isAuthenticated)
    console.log("[middleware] cookies preview:", {
      'sb:token': req.cookies.get('sb:token')?.value,
      'sb-access-token': req.cookies.get('sb-access-token')?.value,
      'sb-refresh-token': req.cookies.get('sb-refresh-token')?.value,
      'supabase-auth-token': req.cookies.get('supabase-auth-token')?.value,
    })
    console.log("[middleware] session:", session)
  } catch (e) {
    console.log('[middleware] error al loggear cookies:', e)
  }

  if (isAuthenticated && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/vault", req.url))
  }

  if (!isAuthenticated && privateRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return res
}

export const config = {
  matcher: ["/", "/login", "/signup", "/vault/:path*", "/settings/:path*"],
}
