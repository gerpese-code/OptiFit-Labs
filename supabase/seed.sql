-- ==============================================================================
-- FITNESS-PRO: SEED DATA (35+ EJERCICIOS FUNDAMENTALES Y RUTINA MODELO)
-- ==============================================================================

INSERT INTO public.exercises (name, muscle_group, description, video_url, gif_url, image_urls)
VALUES
  -- Pecho
  ('Press de Banca Plano con Barra', 'Pecho', 'Ejercicio básico multiarticular. Retracción escapular activa, pies firmes en el suelo y arco lumbar fisiológico.', NULL, NULL, ARRAY['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=60']::text[]),
  ('Press Inclinado con Mancuernas', 'Pecho', 'Banco a 30°-45°. Mayor énfasis en el haz clavicular. Mantener codos a 45°-60° del torso.', NULL, NULL, ARRAY['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=60']::text[]),
  ('Cruces en Polea (Aperturas)', 'Pecho', 'Tensión constante en máxima contracción y estiramiento.', NULL, NULL, '{}'::text[]),
  ('Fondos en Paralelas (Dips)', 'Pecho', 'Torso inclinado hacia adelante para enfatizar pectoral inferior.', NULL, NULL, '{}'::text[]),
  ('Flexiones de Pecho (Push-ups)', 'Pecho', 'Core bloqueado, glúteos apretados y descenso completo.', NULL, NULL, '{}'::text[]),

  -- Espalda
  ('Dominadas Pronas (Pull-ups)', 'Espalda', 'Iniciar desde depresión escapular y llevar el pecho hacia la barra.', NULL, NULL, ARRAY['https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=60']::text[]),
  ('Remo con Barra 45°', 'Espalda', 'Torso inclinado, tirar de la barra al ombligo guiando con codos.', NULL, NULL, '{}'::text[]),
  ('Jalón al Pecho en Polea Alta', 'Espalda', 'Agarre amplio prono hacia el esternón sacando pecho.', NULL, NULL, '{}'::text[]),
  ('Remo Unilateral con Mancuerna', 'Espalda', 'Gran recorrido de estiramiento y contracción dorsal.', NULL, NULL, '{}'::text[]),
  ('Peso Muerto Convencional', 'Espalda', 'Rey de la tracción y cadena posterior. Barra pegada a tibias.', NULL, NULL, ARRAY['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=60']::text[]),
  ('Pullover en Polea Alta', 'Espalda', 'Aislamiento del dorsal ancho. Brazos semirrígidos.', NULL, NULL, '{}'::text[]),

  -- Piernas / Cuádriceps
  ('Sentadilla Trasera con Barra', 'Cuádriceps', 'Patrón rey de empuje. Bajar controlando rompiendo el paralelo.', NULL, NULL, ARRAY['https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=60']::text[]),
  ('Prensa de Piernas a 45°', 'Cuádriceps', 'Alto volumen mecánico con mínimo estrés axial en la columna.', NULL, NULL, '{}'::text[]),
  ('Sentadilla Búlgara con Mancuernas', 'Cuádriceps', 'Trabajo unilateral brutal para fuerza y equilibrio.', NULL, NULL, '{}'::text[]),
  ('Extensiones de Cuádriceps', 'Cuádriceps', 'Aislamiento para el recto femoral con pausa arriba.', NULL, NULL, '{}'::text[]),
  ('Sentadilla Goblet', 'Cuádriceps', 'Ideal para aprender el patrón con el torso erguido.', NULL, NULL, '{}'::text[]),

  -- Piernas / Isquios y Glúteos
  ('Peso Muerto Rumano con Barra (RDL)', 'Isquiosurales', 'Bisagra de cadera pura para isquiotibiales y glúteos.', NULL, NULL, '{}'::text[]),
  ('Curl Femoral Tumbado en Máquina', 'Isquiosurales', 'Aislamiento de la flexión de rodilla.', NULL, NULL, '{}'::text[]),
  ('Hip Thrust con Barra en Banco', 'Glúteos', 'Constructor supremo de fuerza y masa en glúteos.', NULL, NULL, '{}'::text[]),
  ('Zancadas Caminando con Mancuernas', 'Glúteos', 'Pasos largos para mayor activación de glúteos e isquios.', NULL, NULL, '{}'::text[]),
  ('Abducciones de Cadera en Máquina', 'Glúteos', 'Enfoque en glúteo medio y estabilidad pélvica.', NULL, NULL, '{}'::text[]),

  -- Hombros
  ('Press Militar de Pie con Barra (OHP)', 'Hombros', 'Fuerza estricta vertical con core y glúteos firmes.', NULL, NULL, '{}'::text[]),
  ('Elevaciones Laterales con Mancuernas', 'Hombros', 'Anchura de hombros en el plano escapular.', NULL, NULL, '{}'::text[]),
  ('Pájaros / Elevaciones Posteriores', 'Hombros', 'Deltoides posterior y salud del manguito rotador.', NULL, NULL, '{}'::text[]),
  ('Face Pull en Polea Alta con Cuerda', 'Hombros', 'Ejercicio postural y rotadores externos.', NULL, NULL, '{}'::text[]),

  -- Brazos
  ('Curl de Bíceps con Barra Z', 'Bíceps', 'Básico para masa en bíceps con agarre ergonómico.', NULL, NULL, '{}'::text[]),
  ('Curl Martillo con Mancuernas', 'Bíceps', 'Braquial anterior y braquiorradial (grosor de brazo).', NULL, NULL, '{}'::text[]),
  ('Curl Inclinado con Mancuernas', 'Bíceps', 'Máximo estiramiento de la cabeza larga del bíceps.', NULL, NULL, '{}'::text[]),
  ('Press Francés con Barra Z', 'Tríceps', 'Enfoque en la cabeza larga del tríceps.', NULL, NULL, '{}'::text[]),
  ('Extensiones de Tríceps en Polea Alta', 'Tríceps', 'Aislamiento con cuerda para contracción pico.', NULL, NULL, '{}'::text[]),

  -- Core y Pantorrillas
  ('Plancha Abdominal Frontal (Plank)', 'Core / Abdomen', 'Anti-extensión lumbar isométrica.', NULL, NULL, '{}'::text[]),
  ('Rueda Abdominal (Ab Wheel Rollout)', 'Core / Abdomen', 'Máxima activación del recto abdominal.', NULL, NULL, '{}'::text[]),
  ('Elevaciones de Piernas Colgado', 'Core / Abdomen', 'Flexión de cadera y pelvis.', NULL, NULL, '{}'::text[]),
  ('Crunches en Polea Alta', 'Core / Abdomen', 'Sobrecarga progresiva para el abdomen.', NULL, NULL, '{}'::text[]),
  ('Elevaciones de Talones de Pie', 'Pantorrillas', 'Pausa en estiramiento y contracción de gastrocnemios.', NULL, NULL, '{}'::text[]),
  ('Elevaciones de Talones Sentado', 'Pantorrillas', 'Aislamiento del sóleo.', NULL, NULL, '{}'::text[])
ON CONFLICT DO NOTHING;
