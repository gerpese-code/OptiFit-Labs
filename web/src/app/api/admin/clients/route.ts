import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase/admin';
import { generateRandomClientCode } from '@/lib/utils/clientCode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, codes: {} });
    }

    const { data: usersData, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      console.warn('Error listUsers en GET /api/admin/clients:', error.message);
      return NextResponse.json({ success: false, codes: {} });
    }

    const codes: Record<string, string> = {};
    const emails: Record<string, string> = {};
    (usersData?.users || []).forEach((u) => {
      if (u.id) {
        if (u.user_metadata?.client_code) {
          codes[u.id] = String(u.user_metadata.client_code).trim().toLowerCase();
        }
        if (u.email) {
          emails[u.id] = u.email.trim().toLowerCase();
        }
      }
    });

    return NextResponse.json({ success: true, codes, emails });
  } catch (err: any) {
    console.error('Error en GET /api/admin/clients:', err);
    return NextResponse.json({ success: false, codes: {}, emails: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, unitPreference, birthDate } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'El nombre completo es obligatorio.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Ingresa un correo electrónico válido.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanUnit = unitPreference === 'lbs' ? 'lbs' : 'kg';
    const cleanBirthDate = typeof birthDate === 'string' && birthDate.trim() ? birthDate.trim() : null;

    const admin = getAdminClient();

    let userId: string;
    let createdAt: string;
    let usedAdminBypass = false;

    // Generar código único aleatorio e irrepetible de 3 letras y 3 números (ej. 'hgd563')
    let nextCode = generateRandomClientCode();

    if (admin) {
      // Verificar unicidad contra usuarios existentes en Supabase Auth
      const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const usedCodes = new Set(
        (usersData?.users || [])
          .map((u) => (u.user_metadata?.client_code ? String(u.user_metadata.client_code).trim().toLowerCase() : null))
          .filter(Boolean)
      );
      while (usedCodes.has(nextCode)) {
        nextCode = generateRandomClientCode();
      }

      // 1. Modo Privilegiado: Crear usuario en Supabase Auth con email_confirm: true
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true, // Bypass de confirmación por correo para que ingrese de inmediato
        user_metadata: {
          full_name: cleanName,
          role: 'client',
          birth_date: cleanBirthDate,
          client_code: nextCode,
        },
      });

      if (authError || !authData.user) {
        console.error('Error al crear usuario con supabaseAdmin:', authError);
        let friendly = authError?.message || 'Error al crear la cuenta en Supabase.';
        if (friendly.includes('already been registered')) {
          friendly = 'Ya existe un alumno registrado con este correo electrónico.';
        }
        return NextResponse.json({ error: 'AUTH_ERROR', message: friendly }, { status: 400 });
      }

      userId = authData.user.id;
      createdAt = authData.user.created_at;
      usedAdminBypass = true;

      // Upsert directo en profiles con privilegios admin
      await admin.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        role: 'client',
        weight_unit_preference: cleanUnit,
        birth_date: cleanBirthDate,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    } else {
      // 2. Modo Fallback (si aún no se configuró SUPABASE_SERVICE_ROLE_KEY):
      // Usa un cliente público temporal para registrar el usuario
      const publicClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: signData, error: signError } = await publicClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            role: 'client',
            birth_date: cleanBirthDate,
            client_code: nextCode,
          },
        },
      });

      if (signError || !signData.user) {
        console.error('Error en signUp fallback:', signError);
        let friendly = signError?.message || 'Error al registrar al alumno.';
        if (friendly.includes('already registered')) {
          friendly = 'Ya existe un alumno registrado con este correo electrónico.';
        }
        return NextResponse.json({ error: 'AUTH_ERROR', message: friendly }, { status: 400 });
      }

      userId = signData.user.id;
      createdAt = signData.user.created_at;

      // Intentar upsert en profiles
      await publicClient.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        role: 'client',
        weight_unit_preference: cleanUnit,
        birth_date: cleanBirthDate,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    }

    // Despachar alerta de nuevo alumno por correo al coach (gerpese.fitness@gmail.com)
    try {
      const origin = req.nextUrl?.origin || 'http://localhost:3000';
      fetch(`${origin}/api/notifications/new-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          fullName: cleanName,
          userId,
          birthDate: cleanBirthDate,
          source: 'admin_panel',
        }),
      }).catch(() => {});
    } catch (notifErr) {
      console.warn('Error al disparar notificación de registro:', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: usedAdminBypass
          ? 'Alumno creado y activado inmediatamente (sin necesidad de correo).'
          : 'Alumno registrado exitosamente.',
        usedAdminBypass,
        client: {
          id: userId,
          full_name: cleanName,
          email: cleanEmail,
          role: 'client',
          weight_unit_preference: cleanUnit,
          client_code: nextCode,
          is_active: true,
          created_at: createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Excepción en POST /api/admin/clients:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let clientId: string | null = null;

    const { searchParams } = new URL(req.url);
    clientId = searchParams.get('clientId');

    if (!clientId) {
      try {
        const body = await req.json();
        clientId = body.clientId;
      } catch {
        // Ignorar si no hay body
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Se requiere el ID del alumno a eliminar.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    if (admin) {
      // 1. Desactivar rutinas
      await admin.from('routines').update({ is_active: false }).eq('client_id', clientId);

      // 2. Soft-delete en profiles
      await admin
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId);

      // 3. Eliminar de auth.users para liberar el correo
      const { error: authDelErr } = await admin.auth.admin.deleteUser(clientId);
      if (authDelErr) {
        console.warn('Nota al eliminar de auth.users:', authDelErr.message);
      }
    } else {
      // Modo anon: Soft-delete con cliente general
      const publicClient = createClient(supabaseUrl, anonKey);
      await publicClient
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId);

      await publicClient.from('routines').update({ is_active: false }).eq('client_id', clientId);
    }

    return NextResponse.json({
      success: true,
      message: 'Alumno eliminado y acceso revocado correctamente.',
    });
  } catch (error: any) {
    console.error('Excepción en DELETE /api/admin/clients:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
