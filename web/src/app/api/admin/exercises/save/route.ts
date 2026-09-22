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

    const body = await req.json();
    const { id, name, muscle_group, description, video_url, gif_url, image_urls } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'El nombre del ejercicio es obligatorio.' },
        { status: 400 }
      );
    }

    const payload = {
      name: name.trim(),
      muscle_group: muscle_group || 'Otros',
      description: description ? description.trim() : null,
      video_url: video_url || null,
      gif_url: gif_url || null,
      image_urls: Array.isArray(image_urls) ? image_urls : [],
      updated_at: new Date().toISOString(),
    };

    if (id) {
      // Actualizar ejercicio existente
      const { data, error } = await admin
        .from('exercises')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error al actualizar ejercicio:', error);
        return NextResponse.json(
          { error: 'UPDATE_ERROR', message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, exercise: data });
    } else {
      // Insertar nuevo ejercicio del sistema
      const { data, error } = await admin
        .from('exercises')
        .insert([{ ...payload, is_custom: false }])
        .select('*')
        .single();

      if (error) {
        console.error('Error al crear ejercicio:', error);
        return NextResponse.json(
          { error: 'INSERT_ERROR', message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, exercise: data });
    }
  } catch (err: any) {
    console.error('Error en save exercise API:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Error interno al guardar ejercicio.' },
      { status: 500 }
    );
  }
}
