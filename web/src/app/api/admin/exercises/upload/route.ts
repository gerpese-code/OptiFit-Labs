import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'CONFIG_ERROR', message: 'Clave de servicio de Supabase no configurada.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'photos';
    const bucketName = (formData.get('bucket') as string) || 'exercise-media';

    if (!file) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'No se envió ningún archivo para subir.' },
        { status: 400 }
      );
    }

    // Sanitizar nombre de archivo y generar ruta única
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${folder}/${Date.now()}_${cleanName}`;

    // Convertir el File a Buffer para el upload con service role
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error en Supabase Storage upload:', uploadError);
      return NextResponse.json(
        { error: 'UPLOAD_ERROR', message: `Error al almacenar archivo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(bucketName).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filePath,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    console.error('Error inesperado al subir archivo:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Error interno al procesar archivo.' },
      { status: 500 }
    );
  }
}
