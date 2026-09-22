import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const COACH_EMAIL = 'gerpese.fitness@gmail.com';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function buildEmailHtml(data: {
  fullName: string;
  email: string;
  userId?: string;
  birthDate?: string;
  source?: string;
  dateStr: string;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Nuevo Alumno en OptiFit Labs</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020503;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #051209;
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 255, 135, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #030805 0%, #082012 100%);
      padding: 28px 24px;
      text-align: center;
      border-bottom: 2px solid #00ff87;
    }
    .logo-badge {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      background-color: #10b981;
      color: #020503;
      font-size: 22px;
      font-weight: 900;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 0 15px rgba(0, 255, 135, 0.5);
    }
    .brand-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
      margin: 0;
    }
    .brand-highlight {
      color: #00ff87;
    }
    .brand-subtitle {
      color: #34d399;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    .content {
      padding: 32px 28px;
    }
    .alert-banner {
      background-color: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
      text-align: center;
    }
    .alert-title {
      color: #00ff87;
      font-size: 16px;
      font-weight: 800;
      margin: 0 0 4px 0;
    }
    .alert-desc {
      color: #cbd5e1;
      font-size: 13px;
      margin: 0;
    }
    .info-card {
      background-color: #020604;
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .info-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
      width: 140px;
    }
    .info-value {
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      flex: 1;
    }
    .button-container {
      text-align: center;
      margin: 30px 0 10px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #00ff87 0%, #10b981 100%);
      color: #020503 !important;
      font-weight: 900;
      font-size: 14px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 255, 135, 0.35);
    }
    .footer {
      background-color: #020503;
      padding: 18px;
      text-align: center;
      color: #64748b;
      font-size: 11px;
      border-top: 1px solid rgba(16, 185, 129, 0.15);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">OL</div>
      <h1 class="brand-title">OPTIFIT<span class="brand-highlight"> LABS</span></h1>
      <div class="brand-subtitle">Alerta de Registro para el Coach</div>
    </div>
    <div class="content">
      <div class="alert-banner">
        <p class="alert-title">🏋️ ¡Nuevo Alumno Registrado!</p>
        <p class="alert-desc">Un nuevo usuario ha creado su cuenta en la plataforma OptiFit Labs.</p>
      </div>

      <div class="info-card">
        <div class="info-row">
          <div class="info-label">👤 Alumno:</div>
          <div class="info-value">${data.fullName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">📧 Correo:</div>
          <div class="info-value"><a href="mailto:${data.email}" style="color: #00ff87; text-decoration: none;">${data.email}</a></div>
        </div>
        <div class="info-row">
          <div class="info-label">📅 Registro:</div>
          <div class="info-value">${data.dateStr}</div>
        </div>
        ${data.birthDate ? `
        <div class="info-row">
          <div class="info-label">🎂 Cumpleaños:</div>
          <div class="info-value">${data.birthDate}</div>
        </div>` : ''}
        ${data.userId ? `
        <div class="info-row">
          <div class="info-label">🆔 ID de Usuario:</div>
          <div class="info-value" style="font-family: monospace; font-size: 11px; color: #94a3b8;">${data.userId}</div>
        </div>` : ''}
        <div class="info-row">
          <div class="info-label">📱 Plataforma:</div>
          <div class="info-value">${data.source === 'admin_panel' ? 'Panel Web de Administración' : 'Aplicación Móvil (Android/iOS)'}</div>
        </div>
      </div>

      <div class="button-container">
        <a href="http://localhost:3000/admin/clients" class="btn">
          Ver Alumno en Panel del Coach
        </a>
      </div>
    </div>
    <div class="footer">
      OptiFit Labs • Sistema Central de Entrenamiento, Nutrición &amp; Biohacking<br>
      Notificación oficial para el Coach enviada a ${COACH_EMAIL}
    </div>
  </div>
</body>
</html>`;
}

async function dispatchEmail(payload: {
  fullName: string;
  email: string;
  userId?: string;
  birthDate?: string;
  source?: string;
}) {
  const dateStr = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const subject = `🏋️ Nuevo Alumno Registrado en OptiFit Labs: ${payload.fullName}`;
  const html = buildEmailHtml({
    ...payload,
    dateStr,
  });

  let emailSent = false;
  let providerUsed = 'none';
  let errorMsg: string | null = null;

  // 1. Intento con Resend si RESEND_API_KEY está configurada
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const sendResult = await resend.emails.send({
        from: 'OptiFit Labs <onboarding@resend.dev>',
        to: COACH_EMAIL,
        subject,
        html,
      });
      if (sendResult.error) {
        throw new Error(sendResult.error.message);
      }
      emailSent = true;
      providerUsed = 'resend';
      console.log('[NOTIFICACION] Correo enviado exitosamente vía Resend a:', COACH_EMAIL);
    } catch (err: any) {
      console.error('[NOTIFICACION] Error con Resend:', err.message);
      errorMsg = `Resend: ${err.message}`;
    }
  }

  // 2. Fallback a Nodemailer con Gmail SMTP si se configuró GMAIL_APP_PASSWORD o SMTP_PASS
  if (!emailSent && (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS)) {
    try {
      const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS)!.replace(/\s+/g, '');
      const user = process.env.SMTP_USER || COACH_EMAIL;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"OptiFit Labs" <${user}>`,
        to: COACH_EMAIL,
        subject,
        html,
      });

      emailSent = true;
      providerUsed = 'gmail_smtp';
      errorMsg = null;
      console.log('[NOTIFICACION] Correo enviado exitosamente vía Gmail SMTP a:', COACH_EMAIL);
    } catch (err: any) {
      console.error('[NOTIFICACION] Error con Gmail SMTP:', err.message);
      errorMsg = (errorMsg ? errorMsg + ' | ' : '') + `SMTP: ${err.message}`;
    }
  }

  // 3. Si no hay credenciales todavía
  if (!emailSent && !errorMsg) {
    errorMsg = 'Pendiente de configurar RESEND_API_KEY o GMAIL_APP_PASSWORD en .env.local';
    console.warn('[NOTIFICACION] Registro detectado para:', payload.fullName, `(${payload.email})`, errorMsg);
  }

  // 4. Actualizar metadata del usuario en Supabase si emailSent es true
  const supabase = getSupabaseAdmin();
  if (supabase && payload.userId) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(payload.userId);
      if (userData?.user) {
        await supabase.auth.admin.updateUserById(payload.userId, {
          user_metadata: {
            ...userData.user.user_metadata,
            coach_notified: emailSent,
            coach_notified_at: emailSent ? new Date().toISOString() : null,
            coach_notified_error: errorMsg,
          },
        });
      }
    } catch (metaErr: any) {
      console.error('[NOTIFICACION] Error actualizando user_metadata:', metaErr.message);
    }

    // Si existe la tabla opcional registration_notifications, guardar también
    try {
      await supabase.from('registration_notifications').insert({
        user_id: payload.userId,
        email: payload.email,
        full_name: payload.fullName,
        birth_date: payload.birthDate || null,
        email_sent: emailSent,
        sent_at: emailSent ? new Date().toISOString() : null,
        error_message: errorMsg,
      });
    } catch {
      // Ignorar si la tabla no está creada aún en la base de datos
    }
  }

  return { emailSent, providerUsed, errorMsg };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, userId, birthDate, source } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'email y fullName son campos requeridos.' },
        { status: 400 }
      );
    }

    const result = await dispatchEmail({
      email,
      fullName,
      userId,
      birthDate,
      source: source || 'mobile_app',
    });

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      providerUsed: result.providerUsed,
      recipient: COACH_EMAIL,
      note: result.emailSent
        ? 'Correo de notificación enviado correctamente.'
        : result.errorMsg,
    });
  } catch (error: any) {
    console.error('[NOTIFICACION API] Error general:', error);
    return NextResponse.json(
      { error: error.message || 'Error procesando la notificación' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const doSync = url.searchParams.get('sync') === 'true';

  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSmtp = Boolean(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS);

  const supabase = getSupabaseAdmin();
  let unnotifiedUsers: any[] = [];
  let syncResults: any[] = [];

  if (supabase) {
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });
      if (usersData?.users) {
        // Alumnos registrados que no sean el admin coach y no hayan sido notificados
        unnotifiedUsers = usersData.users.filter(
          (u) =>
            u.email?.toLowerCase() !== COACH_EMAIL.toLowerCase() &&
            u.user_metadata?.coach_notified !== true
        );

        if (doSync && (hasResend || hasSmtp) && unnotifiedUsers.length > 0) {
          for (const u of unnotifiedUsers) {
            const res = await dispatchEmail({
              userId: u.id,
              email: u.email || '',
              fullName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Nuevo Alumno',
              birthDate: u.user_metadata?.birth_date,
              source: 'mobile_app',
            });
            syncResults.push({ id: u.id, email: u.email, ...res });
          }
        }
      }
    } catch (e: any) {
      console.error('[NOTIFICACION GET] Error listando usuarios:', e.message);
    }
  }

  return NextResponse.json({
    status: 'online',
    recipient: COACH_EMAIL,
    configuredProvider: hasResend ? 'resend' : hasSmtp ? 'gmail_smtp' : 'none',
    providers: {
      resend: hasResend,
      gmail_smtp: hasSmtp,
    },
    unnotifiedCount: unnotifiedUsers.length,
    unnotifiedUsers: unnotifiedUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.user_metadata?.full_name,
      createdAt: u.created_at,
    })),
    synced: syncResults,
  });
}
