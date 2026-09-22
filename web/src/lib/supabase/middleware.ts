import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Si aún no se configuran las variables en .env.local, permitir navegar a /login
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('your-project-id')
  ) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unconfigured');
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAccessingAdmin = request.nextUrl.pathname.startsWith('/admin');
    const isAccessingLogin = request.nextUrl.pathname === '/login';

    // 1. Proteger rutas /admin/*
    if (isAccessingAdmin) {
      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verificar si el usuario tiene rol 'admin'
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, deleted_at')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin' || profile.deleted_at !== null) {
        const unauthorizedUrl = new URL('/login', request.url);
        unauthorizedUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(unauthorizedUrl);
      }
    }

    // 2. Si ya está autenticado como admin y va a /login, redirigir directo a /admin
    if (isAccessingLogin && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  } catch (e) {
    console.error('Error en middleware auth session:', e);
  }

  return response;
}
