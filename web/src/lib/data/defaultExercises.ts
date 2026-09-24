// Catálogo Oficial Curado de Ejercicios Profesionales para Fitness-Pro
// Contiene 115 ejercicios con nombres en español, descripción técnica e imágenes biomecánicas
export interface PreloadedExercise {
  name: string;
  muscle_group: string;
  description: string;
  video_url: string | null;
  gif_url: string | null;
  image_urls: string[];
}

export const DEFAULT_EXERCISES: PreloadedExercise[] = [
  {
    "name": "Press de Banca Plano con Barra (Bench Press)",
    "muscle_group": "Pecho",
    "description": "Básico multiarticular para desarrollo del pectoral mayor. Retracción escapular activa, pies firmes en el suelo y arco lumbar natural. Descender la barra controlada hasta el tercio inferior del esternón y empujar con fuerza.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/da0e4d00-4e7f-446b-9e28-c261bd079cd4/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/da0e4d00-4e7f-446b-9e28-c261bd079cd4/phase-1.png"
    ]
  },
  {
    "name": "Press Inclinado con Mancuernas (Incline DB Press)",
    "muscle_group": "Pecho",
    "description": "Banco a 30°-45°. Máximo reclutamiento del haz clavicular (pecho superior). Mantener los codos a unos 45°-60° respecto al torso para proteger los hombros y lograr máximo rango de estiramiento.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8563830d-80aa-4908-8896-503aa2590685/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8563830d-80aa-4908-8896-503aa2590685/phase-1.png"
    ]
  },
  {
    "name": "Press Inclinado con Barra (Incline Barbell Press)",
    "muscle_group": "Pecho",
    "description": "Banco a 30°. Empujar la barra verticalmente enfocando la tensión en la porción superior del pecho y deltoides anterior con retracción escapular firme.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-incline-bench-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/20e395fe-2a0b-4a55-aaa5-86d718d67258/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/20e395fe-2a0b-4a55-aaa5-86d718d67258/phase-1.png"
    ]
  },
  {
    "name": "Press Plano con Mancuernas (Flat DB Press)",
    "muscle_group": "Pecho",
    "description": "Permite mayor recorrido articular y libertad en las muñecas que la barra. Descender hasta sentir un estiramiento profundo en el pectoral y juntar arriba sin chocar las mancuernas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ab3d3faa-305d-493b-852a-6ee3f773e007/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ab3d3faa-305d-493b-852a-6ee3f773e007/phase-1.png"
    ]
  },
  {
    "name": "Press Declinado con Barra (Decline Press)",
    "muscle_group": "Pecho",
    "description": "Enfatiza las fibras inferiores del pectoral mayor. Banco declinado a 15°-30°. Descenso controlado hasta la parte baja del pecho.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-decline-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8b737307-731a-41e3-955a-89c1514fc7a6/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8b737307-731a-41e3-955a-89c1514fc7a6/phase-1.png"
    ]
  },
  {
    "name": "Press Plano en Máquina Smith / Multipower",
    "muscle_group": "Pecho",
    "description": "Permite entrenar cerca del fallo muscular con total seguridad articular y máxima tensión constante en el pectoral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-bench-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/65bf0f3a-6805-443d-953f-a7eab104174c/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/65bf0f3a-6805-443d-953f-a7eab104174c/phase-1.png"
    ]
  },
  {
    "name": "Press Inclinado en Máquina Smith / Multipower",
    "muscle_group": "Pecho",
    "description": "Aislamiento estable del pectoral superior sin tener que estabilizar la barra, ideal para series pesadas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-incline-bench-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9d8e5d36-e3ac-46ee-a255-7b0c5a3a7c82/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9d8e5d36-e3ac-46ee-a255-7b0c5a3a7c82/phase-1.png"
    ]
  },
  {
    "name": "Aperturas Planas con Mancuernas (DB Flyes)",
    "muscle_group": "Pecho",
    "description": "Ejercicio de aislamiento para estiramiento del pectoral. Codos con leve flexión fija durante todo el recorrido. Abrir controlando el peso hasta sentir el estiramiento y cerrar abrazando un barril.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-fly.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/52a1ad83-4708-440b-a1d1-9dc245375f9b/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/52a1ad83-4708-440b-a1d1-9dc245375f9b/phase-1.png"
    ]
  },
  {
    "name": "Aperturas Inclinadas con Mancuernas (Incline Flyes)",
    "muscle_group": "Pecho",
    "description": "Aislamiento y sobrecarga excéntrica en el pecho superior. Control estricto en la bajada sin hiperextender el hombro.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-fly.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9f7dd33b-5e8a-4917-8dbb-c65a687ca8e0/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9f7dd33b-5e8a-4917-8dbb-c65a687ca8e0/phase-1.png"
    ]
  },
  {
    "name": "Aperturas Declinadas con Mancuernas",
    "muscle_group": "Pecho",
    "description": "Enfoque en las fibras inferiores del pectoral con tensión concentrada en la porción costal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-decline-fly.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a336faec-7aab-492c-97ff-4d0cae6b4003/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a336faec-7aab-492c-97ff-4d0cae6b4003/phase-1.png"
    ]
  },
  {
    "name": "Cruces en Polea Alta (Cable Crossover)",
    "muscle_group": "Pecho",
    "description": "Tensión constante durante todo el rango. Torso ligeramente inclinado hacia adelante. Cruzar las manos abajo y apretar el pectoral en máxima contracción durante 1 segundo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-middle-fly.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c98c5c1e-ea83-4fed-9a2a-3505c8ab8313/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c98c5c1e-ea83-4fed-9a2a-3505c8ab8313/phase-1.png"
    ]
  },
  {
    "name": "Cruces en Polea Media / Cruz de Hierro",
    "muscle_group": "Pecho",
    "description": "Aislamiento de la parte media del pecho con trayectoria horizontal pura. Excelente congestión.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-middle-fly.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/73ae0921-d76a-4f3d-89bd-48b8663c59cb/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/73ae0921-d76a-4f3d-89bd-48b8663c59cb/phase-1.png"
    ]
  },
  {
    "name": "Fondos en Paralelas para Pecho (Chest Dips)",
    "muscle_group": "Pecho",
    "description": "Torso inclinado hacia adelante y codos ligeramente abiertos para trasladar el estímulo al pectoral inferior. Descender hasta 90° de flexión en codo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/chest-dip-on-dip-pull-up-cage.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/04993959-2ea6-4375-a327-2af761a7188b/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/04993959-2ea6-4375-a327-2af761a7188b/phase-1.png"
    ]
  },
  {
    "name": "Flexiones de Pecho (Push-Ups)",
    "muscle_group": "Pecho",
    "description": "Calistenia fundamental. Core y glúteos activos, cuerpo en línea recta. Bajar el pecho hasta rozar el suelo con codos en ángulo de 45° respecto al torso.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/push-up.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/28064fab-7ebf-49b1-b715-6a2ea7fda916/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/28064fab-7ebf-49b1-b715-6a2ea7fda916/phase-1.png"
    ]
  },
  {
    "name": "Aperturas en Máquina Peck Deck (Pec Deck Flyes)",
    "muscle_group": "Pecho",
    "description": "Aislamiento puro y seguro. Apoyar bien la espalda en el respaldo, codos a la altura del pecho medio y apretar fuerte 1 segundo en el centro.",
    "video_url": null,
    "gif_url": "https://burnfit.io/wp-content/uploads/PEC_DECK_MC.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9e9d85fd-f29a-494b-bf2a-5ec2da80d2a2/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9e9d85fd-f29a-494b-bf2a-5ec2da80d2a2/phase-1.png"
    ]
  },
  {
    "name": "Dominadas Pronas (Pull-Ups)",
    "muscle_group": "Espalda",
    "description": "Rey de los ejercicios de tracción vertical. Agarre prono algo más ancho que los hombros. Iniciar deprimiendo escápulas y llevar el pecho hacia la barra sin balanceo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/pull-up.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/53c0cf2b-3bc7-4e4d-aca2-0f0a37d6c6b5/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/53c0cf2b-3bc7-4e4d-aca2-0f0a37d6c6b5/phase-1.png"
    ]
  },
  {
    "name": "Dominadas Supinas (Chin-Ups)",
    "muscle_group": "Espalda",
    "description": "Agarre supino al ancho de los hombros. Mayor intervención del bíceps braquial junto a los dorsales en tracción vertical profunda.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/chin-ups-narrow-parallel-grip.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/163fa562-bf63-4607-875e-b1d16b8275fe/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/163fa562-bf63-4607-875e-b1d16b8275fe/phase-1.png"
    ]
  },
  {
    "name": "Jalón al Pecho en Polea Alta (Lat Pulldown)",
    "muscle_group": "Espalda",
    "description": "Tracción vertical con barra ancha. Llevar la barra al esternón superior sacando pecho y retrayendo escápulas. Evitar balancear el torso hacia atrás.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lat-pulldown-full-range-of-motion.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/1e75cbb8-0def-415d-a9f7-db332ee926dd/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/1e75cbb8-0def-415d-a9f7-db332ee926dd/phase-1.png"
    ]
  },
  {
    "name": "Jalón al Pecho con Agarre Cerrado Neutro (V-Bar Pulldown)",
    "muscle_group": "Espalda",
    "description": "Agarre neutro en V. Permite mayor recorrido y tracción dirigida hacia las inserciones inferiores del dorsal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lateral-pulldown-with-v-bar.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b4a8edb1-43e0-469d-9157-04301a6f3ea3/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b4a8edb1-43e0-469d-9157-04301a6f3ea3/phase-1.png"
    ]
  },
  {
    "name": "Remo con Barra 45° (Barbell Row)",
    "muscle_group": "Espalda",
    "description": "Multiarticular de densidad dorsal. Espalda recta y torso a 45°. Tirar de la barra hacia la cintura baja dirigiendo el movimiento con los codos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0907da50-063c-4cf4-a79a-60b7b18b28bc/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0907da50-063c-4cf4-a79a-60b7b18b28bc/phase-1.png"
    ]
  },
  {
    "name": "Remo Unilateral con Mancuerna (Dumbbell Row)",
    "muscle_group": "Espalda",
    "description": "Apoyo en banco plano. Permite gran estiramiento del dorsal en la bajada y contracción completa arriba sin forzar la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-one-arm-bent-over-row.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ccee75aa-e279-41fd-bafb-4dd09e27be1b/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ccee75aa-e279-41fd-bafb-4dd09e27be1b/phase-1.png"
    ]
  },
  {
    "name": "Remo en Polea Baja Sentado (Seated Cable Row)",
    "muscle_group": "Espalda",
    "description": "Torso perpendicular al suelo con leve curvatura lumbar natural. Tirar hacia el ombligo, juntar escápulas al final y controlar la vuelta estirando los dorsales.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/d013319e-404d-45b2-b902-64c55d43c95d/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/d013319e-404d-45b2-b902-64c55d43c95d/phase-1.png"
    ]
  },
  {
    "name": "Remo en Barra T con Agarre Cerrado (T-Bar Row)",
    "muscle_group": "Espalda",
    "description": "Excelente para el grosor de la espalda media y romboides. Pecho elevado, cadera atrás y tracción estricta hacia el abdomen.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-reverse-t-bar-row.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8b98df4b-0db6-4639-b403-0daf6dee7e8d/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8b98df4b-0db6-4639-b403-0daf6dee7e8d/phase-1.png"
    ]
  },
  {
    "name": "Pullover en Polea Alta con Brazos Rectos",
    "muscle_group": "Espalda",
    "description": "Aislamiento del dorsal ancho sin fatiga de brazos. Codos con leve flexión fija. Bajar la barra hacia los muslos describiendo un arco amplio.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-pushdown-straight-arm-v-2.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/79f6c270-deb9-407e-a31d-a7ee6824b180/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/79f6c270-deb9-407e-a31d-a7ee6824b180/phase-1.png"
    ]
  },
  {
    "name": "Peso Muerto Convencional (Deadlift)",
    "muscle_group": "Espalda",
    "description": "Máxima construcción de fuerza y masa en toda la cadena posterior. Espalda neutra, barra rozando las piernas y empuje simultáneo de piernas y cadera.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/3a81bc6a-7ab9-4d2e-a61d-1cc9ce23c432/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/3a81bc6a-7ab9-4d2e-a61d-1cc9ce23c432/phase-1.png"
    ]
  },
  {
    "name": "Hiperextensiones en Banco 45° (Back Extensions)",
    "muscle_group": "Espalda",
    "description": "Fortalecimiento de erectores espinales, zona lumbar y glúteos. Subir hasta alinear la columna con las piernas sin hiperextender el cuello.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/hyperextension.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a1adf61c-0f4f-449b-9f63-4c243bc02893/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a1adf61c-0f4f-449b-9f63-4c243bc02893/phase-1.png"
    ]
  },
  {
    "name": "Encogimientos con Barra (Barbell Shrug)",
    "muscle_group": "Espalda",
    "description": "Aislamiento del trapecio superior. Elevar los hombros directamente hacia las orejas, aguantar 1 segundo en la cima y descender con control.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/barbell-shrug.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/25e35f0f-ea92-446b-892d-21d70d321b3d/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/25e35f0f-ea92-446b-892d-21d70d321b3d/phase-1.png"
    ]
  },
  {
    "name": "Encogimientos con Mancuernas (Dumbbell Shrug)",
    "muscle_group": "Espalda",
    "description": "Permite una posición más natural de los brazos a los lados del cuerpo para aislar los trapecios superiores.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/dumbbell-shrug.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bb49bd82-d34e-4c0b-a205-88ea13065ef8/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bb49bd82-d34e-4c0b-a205-88ea13065ef8/phase-1.png"
    ]
  },
  {
    "name": "Remo Tumbado en Banco Inclinado (Seal / Bench Row)",
    "muscle_group": "Espalda",
    "description": "Elimina totalmente el estrés lumbar al apoyar el pecho en el banco. Máximo aislamiento de romboides y trapecio medio.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-reverse-grip-incline-bench-row.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b5a86084-2dc7-4512-85c8-9fe3079fd6aa/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b5a86084-2dc7-4512-85c8-9fe3079fd6aa/phase-1.png"
    ]
  },
  {
    "name": "Cable Pull-Through para Cadena Posterior",
    "muscle_group": "Espalda",
    "description": "Bisagra de cadera en polea baja entre las piernas. Enseña a extender la cadera con glúteos e isquios protegiendo la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/cable-pull-through-with-rope.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/67decea3-9521-42fd-8e0d-5189137633d8/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/67decea3-9521-42fd-8e0d-5189137633d8/phase-1.png"
    ]
  },
  {
    "name": "Press Militar de Pie con Barra (Military Press)",
    "muscle_group": "Hombros",
    "description": "Básico por excelencia para el deltoides anterior y lateral. Glúteos y abdomen firmes. Empujar la barra por delante de la cara hasta bloquear arriba con la cabeza alineada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-standing-wide-military-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7ee86628-5028-4d8b-8d99-2bd3d2c914e9/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7ee86628-5028-4d8b-8d99-2bd3d2c914e9/phase-1.png"
    ]
  },
  {
    "name": "Press de Hombros Sentado con Mancuernas",
    "muscle_group": "Hombros",
    "description": "Respaldo casi a 90°. Empujar las mancuernas en trayectoria ligeramente convergente sin que lleguen a chocar arriba. Bajar controladamente hasta rozar la altura de las orejas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-seated-shoulder-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f9423dcc-6bc7-46b8-ba03-e54c8c0674ac/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f9423dcc-6bc7-46b8-ba03-e54c8c0674ac/phase-1.png"
    ]
  },
  {
    "name": "Press Arnold con Mancuernas (Arnold Press)",
    "muscle_group": "Hombros",
    "description": "Combina rotación de muñeca con press vertical para activar los tres haces del deltoides en un solo movimiento fluido.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-arnold-press-v-2.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ce05c5d5-e288-4f48-a418-4a6082ff5311/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ce05c5d5-e288-4f48-a418-4a6082ff5311/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones Laterales con Mancuernas (Lateral Raises)",
    "muscle_group": "Hombros",
    "description": "Clave para la anchura del deltoides medio. Elevar los brazos en el plano escapular (ligeramente hacia adelante) guiando con los codos hasta la horizontal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/41f72c6a-54d2-4c18-9b4a-69731e998906/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/41f72c6a-54d2-4c18-9b4a-69731e998906/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones Laterales en Polea (Cable Lateral Raise)",
    "muscle_group": "Hombros",
    "description": "Tensión uniforme desde el inicio del movimiento. Excelente para mantener sobrecarga constante en el deltoides lateral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9dbd5d84-b329-4ec3-98e2-ba73cf928b92/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9dbd5d84-b329-4ec3-98e2-ba73cf928b92/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones Frontales con Mancuernas (Front Raises)",
    "muscle_group": "Hombros",
    "description": "Aislamiento del deltoides anterior. Elevar las mancuernas de forma alterna o simultánea hasta la altura de los ojos sin balancear el torso.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-front-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bf481a2a-6549-4dc3-addb-615436755307/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bf481a2a-6549-4dc3-addb-615436755307/phase-1.png"
    ]
  },
  {
    "name": "Face Pull con Cuerda en Polea Alta",
    "muscle_group": "Hombros",
    "description": "Esencial para la salud del hombro, manguito rotador y deltoides posterior. Tirar de la cuerda hacia los ojos abriendo las manos y rotando los hombros externamente.",
    "video_url": null,
    "gif_url": "https://burnfit.io/wp-content/uploads/FACE_PULL.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/e62d44c0-5306-491e-b26a-283b30900b23/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/e62d44c0-5306-491e-b26a-283b30900b23/phase-1.png"
    ]
  },
  {
    "name": "Pájaros Sentado con Mancuernas (Rear Delt Flyes)",
    "muscle_group": "Hombros",
    "description": "Torso inclinado apoyado sobre los muslos. Elevar las mancuernas hacia los lados focalizando en la parte posterior del hombro y romboides.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-incline-rear-lateral-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b69b4bfc-8466-49c7-bb97-54ed2f2891c7/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b69b4bfc-8466-49c7-bb97-54ed2f2891c7/phase-1.png"
    ]
  },
  {
    "name": "Pájaros Tumbado en Banco Inclinado",
    "muscle_group": "Hombros",
    "description": "Pecho apoyado en banco a 30°-45°. Aislamiento estricto del deltoides posterior sin balanceos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-incline-rear-lateral-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/62903171-c974-4e12-86d4-d244908d1ab2/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/62903171-c974-4e12-86d4-d244908d1ab2/phase-1.png"
    ]
  },
  {
    "name": "Remo al Mentón con Barra (Upright Row)",
    "muscle_group": "Hombros",
    "description": "Agarre al ancho de los hombros. Subir la barra pegada al torso elevando los codos por encima de la barra para activar deltoides lateral y trapecio.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-upright-row-v-2.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/5a2b8f28-4a09-408a-9249-0e8b34520e90/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/5a2b8f28-4a09-408a-9249-0e8b34520e90/phase-1.png"
    ]
  },
  {
    "name": "Remo con Barra para Deltoides Posterior",
    "muscle_group": "Hombros",
    "description": "Agarre ancho con codos perpendiculares al cuerpo (a 90°) para concentrar toda la tracción en la parte posterior del hombro.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-rear-delt-row.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/25fce4fd-ed75-4e7d-a538-be5eaba66975/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/25fce4fd-ed75-4e7d-a538-be5eaba66975/phase-1.png"
    ]
  },
  {
    "name": "Cargada y Press Militar (Clean and Press)",
    "muscle_group": "Hombros",
    "description": "Movimiento de potencia y fuerza integral. Llevar la barra desde el suelo a los hombros y empujar enérgicamente por encima de la cabeza.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/barbell-clean-and-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/4116d5a1-d946-48a0-96f0-68ab435734d1/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/4116d5a1-d946-48a0-96f0-68ab435734d1/phase-1.png"
    ]
  },
  {
    "name": "Sentadilla Trasera con Barra (Barbell Back Squat)",
    "muscle_group": "Cuádriceps",
    "description": "El rey del tren inferior. Apoyo firme sobre los talones y metatarsos, rodillas alineadas con las puntas de los pies. Romper el paralelo con control y empujar el suelo al subir.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-full-squat.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/341b4618-1fd6-4b0f-9cd7-e30770602e04/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/341b4618-1fd6-4b0f-9cd7-e30770602e04/phase-1.png"
    ]
  },
  {
    "name": "Sentadilla Frontal con Barra (Front Squat)",
    "muscle_group": "Cuádriceps",
    "description": "Barra descansando sobre deltoides anteriores con codos altos. Torso muy vertical que enfatiza fuertemente los cuádriceps y el core anterior.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-clean-grip-front-squat.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ab968cbf-d1c9-4895-901a-8ddddda64c61/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ab968cbf-d1c9-4895-901a-8ddddda64c61/phase-1.png"
    ]
  },
  {
    "name": "Sentadilla en Máquina Smith / Multipower",
    "muscle_group": "Cuádriceps",
    "description": "Permite adelantar ligeramente los pies para enfatizar al 100% los cuádriceps reduciendo la tensión en la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-squat.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/baa22311-07e1-451b-91ca-01ef7a2782f7/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/baa22311-07e1-451b-91ca-01ef7a2782f7/phase-1.png"
    ]
  },
  {
    "name": "Prensa de Piernas 45° (Leg Press)",
    "muscle_group": "Cuádriceps",
    "description": "Permite mover grandes cargas con soporte para la espalda baja. Pies al ancho de hombros en el centro de la plataforma. Bajar hasta 90° sin despegar la pelvis del respaldo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-45-leg-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/fa52daa3-9e0f-4032-b2dc-290ed5dc6fd9/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/fa52daa3-9e0f-4032-b2dc-290ed5dc6fd9/phase-1.png"
    ]
  },
  {
    "name": "Extensiones de Cuádriceps en Máquina (Leg Extension)",
    "muscle_group": "Cuádriceps",
    "description": "Aislamiento puro del recto femoral y vastos. Extender las piernas por completo, aguantar 1 segundo en máxima contracción y bajar lento en 3 segundos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/2accffc5-45bf-4b72-b568-25c8e763b8e9/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/2accffc5-45bf-4b72-b568-25c8e763b8e9/phase-1.png"
    ]
  },
  {
    "name": "Extensión de Cuádriceps Unilateral en Máquina",
    "muscle_group": "Cuádriceps",
    "description": "Trabajo a una sola pierna para corregir desbalances de fuerza y masa muscular en cuádriceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/quads.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9e09b25d-6706-4d22-8173-2839c9e824e3/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9e09b25d-6706-4d22-8173-2839c9e824e3/phase-1.png"
    ]
  },
  {
    "name": "Sentadilla Goblet con Mancuerna (Goblet Squat)",
    "muscle_group": "Cuádriceps",
    "description": "Sujetar una mancuerna pesada verticalmente contra el pecho. Excelente para aprender y perfeccionar el patrón de sentadilla profunda con torso erguido.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/kettlebell-goblet-squat.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6bc33740-4117-408c-b3ec-0233f56fd563/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6bc33740-4117-408c-b3ec-0233f56fd563/phase-1.png"
    ]
  },
  {
    "name": "Zancadas Estáticas con Mancuernas (Lunges)",
    "muscle_group": "Cuádriceps",
    "description": "Trabajo unilateral para equilibrio y desarrollo muscular. Dar un paso amplio y descender la rodilla trasera hasta casi rozar el suelo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-lunge.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/179cd90f-cb5b-44d9-986d-407fe688ed54/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/179cd90f-cb5b-44d9-986d-407fe688ed54/phase-1.png"
    ]
  },
  {
    "name": "Zancadas hacia Atrás con Mancuernas (Reverse Lunge)",
    "muscle_group": "Cuádriceps",
    "description": "Paso hacia atrás que genera menor estrés de cizalla en la rótula de la rodilla delantera. Excelente para rodillas sensibles.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-rear-lunge.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/dfccff62-6501-4165-b312-9c668755914b/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/dfccff62-6501-4165-b312-9c668755914b/phase-1.png"
    ]
  },
  {
    "name": "Zancadas con Barra (Barbell Lunges)",
    "muscle_group": "Cuádriceps",
    "description": "Sobrecarga sobre los cuádriceps y glúteos con barra tras nuca. Mantener el torso erguido durante todo el paso.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-lunge.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/47c12eea-4946-4f35-88aa-442d663d5b47/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/47c12eea-4946-4f35-88aa-442d663d5b47/phase-1.png"
    ]
  },
  {
    "name": "Subidas al Banco con Barra (Step-Ups)",
    "muscle_group": "Cuádriceps",
    "description": "Pisar firmemente sobre el cajón empujando desde el talón de la pierna superior sin impulsarse con la pierna de abajo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-step-up.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/72eda55f-9710-48f3-bc51-b3adfee8ea78/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/72eda55f-9710-48f3-bc51-b3adfee8ea78/phase-1.png"
    ]
  },
  {
    "name": "Subidas al Banco con Elevación de Rodilla",
    "muscle_group": "Cuádriceps",
    "description": "Combina el empuje unilateral de cuádriceps con flexión explosiva de cadera y activación de glúteo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-step-up.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0fa59765-a05b-4d48-bac0-9c1c17d974e3/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0fa59765-a05b-4d48-bac0-9c1c17d974e3/phase-1.png"
    ]
  },
  {
    "name": "Peso Muerto Rumano con Barra (Barbell RDL)",
    "muscle_group": "Isquiosurales",
    "description": "Patrón de bisagra de cadera indispensable. Rodillas con microflexión fija. Enviar la cadera hacia atrás sintiendo una tensión profunda en los femorales y glúteos antes de extender la cadera al subir.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ee8c9a45-8628-4613-9686-7861d9fa3a8b/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ee8c9a45-8628-4613-9686-7861d9fa3a8b/phase-1.png"
    ]
  },
  {
    "name": "Peso Muerto Rumano con Déficit (Deficit RDL)",
    "muscle_group": "Isquiosurales",
    "description": "De pie sobre un disco o plataforma para aumentar el rango de estiramiento de los isquiotibiales en el punto más bajo de la bisagra.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/4dbe2a54-f3e5-4f83-bcb3-2af8ee6053a2/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/4dbe2a54-f3e5-4f83-bcb3-2af8ee6053a2/phase-1.png"
    ]
  },
  {
    "name": "Curl Femoral Tumbado en Máquina (Lying Leg Curl)",
    "muscle_group": "Isquiosurales",
    "description": "Flexión de rodilla directa para hipertrofia de isquiotibiales. Mantener la pelvis pegada a la almohadilla sin arquear la zona lumbar en la contracción.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ce50d67b-f744-4229-b8d9-1b1f6a4be1c6/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ce50d67b-f744-4229-b8d9-1b1f6a4be1c6/phase-1.png"
    ]
  },
  {
    "name": "Curl Femoral Sentado en Máquina (Seated Leg Curl)",
    "muscle_group": "Isquiosurales",
    "description": "Al tener la cadera flexionada a 90°, los isquiotibiales trabajan en posición de mayor elongación muscular, generando alta tensión mecánica.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-seated-leg-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/87217fdb-8c57-4556-bb48-aebbd9ced768/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/87217fdb-8c57-4556-bb48-aebbd9ced768/phase-1.png"
    ]
  },
  {
    "name": "Buenos Días con Barra (Good Mornings)",
    "muscle_group": "Isquiosurales",
    "description": "Barra colocada sobre trapecios. Flexionar la cadera empujando los glúteos atrás con la espalda neutra hasta que el torso quede casi horizontal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-seated-good-morning.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/2143048f-0b7f-4edb-b258-fe75601c0a4a/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/2143048f-0b7f-4edb-b258-fe75601c0a4a/phase-1.png"
    ]
  },
  {
    "name": "Peso Muerto con Mancuernas Piernas Semirrígidas",
    "muscle_group": "Isquiosurales",
    "description": "Permite bajar las mancuernas cerca del centro de gravedad, manteniendo tensión constante y controlada en toda la cadena posterior.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-deadlift.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c37e621f-2158-444d-ac22-2a98e0001f13/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c37e621f-2158-444d-ac22-2a98e0001f13/phase-1.png"
    ]
  },
  {
    "name": "Peso Muerto Rumano Unilateral con Kettlebell / Mancuerna",
    "muscle_group": "Isquiosurales",
    "description": "A una sola pierna. Excelente para equilibrio propioceptivo, estabilidad de tobillo y aislamiento del femoral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a2b2f324-c146-4003-a161-94fac64b4333/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a2b2f324-c146-4003-a161-94fac64b4333/phase-1.png"
    ]
  },
  {
    "name": "Curl Femoral de Pie Unilateral en Máquina",
    "muscle_group": "Isquiosurales",
    "description": "Flexión de rodilla individual para equilibrar la fuerza de ambos isquiosurales por separado.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/inverse-leg-curl-on-pull-up-cable-machine.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/d227e3dc-963c-4e01-87ae-b7cb1a1e806e/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/d227e3dc-963c-4e01-87ae-b7cb1a1e806e/phase-1.png"
    ]
  },
  {
    "name": "Hip Thrust con Barra en Banco (Barbell Hip Thrust)",
    "muscle_group": "Glúteos",
    "description": "El ejercicio más eficiente para hipertrofia del glúteo mayor. Espalda alta apoyada en banco, espinillas verticales en la cima y retroversión pélvica con contracción de 1 segundo arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0225b3a0-fb91-4c67-aa27-3d8213ba6776/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0225b3a0-fb91-4c67-aa27-3d8213ba6776/phase-1.png"
    ]
  },
  {
    "name": "Puente de Glúteos con Barra en Suelo (Glute Bridge)",
    "muscle_group": "Glúteos",
    "description": "Ejecutado sobre el suelo. Menor rango que el hip thrust pero permite manejar altas cargas y máxima tensión en extensión terminal de cadera.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/44984589-d5fc-4982-80e1-68122bfd6acc/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/44984589-d5fc-4982-80e1-68122bfd6acc/phase-1.png"
    ]
  },
  {
    "name": "Puente de Glúteos Unilateral en Suelo",
    "muscle_group": "Glúteos",
    "description": "Excelente para corregir asimetrías de fuerza entre glúteos y mejorar la estabilidad de la pelvis.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/low-glute-bridge-on-floor.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a98d0411-ba07-426e-9496-6a5bf2e4d0a8/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a98d0411-ba07-426e-9496-6a5bf2e4d0a8/phase-1.png"
    ]
  },
  {
    "name": "Zancadas Caminando con Barra para Glúteos",
    "muscle_group": "Glúteos",
    "description": "Pasos largos con ligera inclinación del torso hacia adelante para estirar y cargar al máximo los glúteos en cada zancada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-lunge.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/e7e0e63c-0b3f-4baf-81c8-18ce8c84e1c4/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/e7e0e63c-0b3f-4baf-81c8-18ce8c84e1c4/phase-1.png"
    ]
  },
  {
    "name": "Zancadas Caminando con Peso Corporal",
    "muscle_group": "Glúteos",
    "description": "Volumen y congestión de glúteos y piernas sin impacto en la columna vertebral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/walking-lunge.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9eb95a08-c119-40d6-9914-9dc4f68708af/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9eb95a08-c119-40d6-9914-9dc4f68708af/phase-1.png"
    ]
  },
  {
    "name": "Patada de Glúteo en Cuadrupedia / Máquina",
    "muscle_group": "Glúteos",
    "description": "Aislamiento de la porción superior del glúteo mayor. Extender la pierna hacia atrás apretando arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/lever-hip-extension-v-2.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f13f55ef-a967-4a6f-8dd1-c4edb8bd70ef/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f13f55ef-a967-4a6f-8dd1-c4edb8bd70ef/phase-1.png"
    ]
  },
  {
    "name": "Aductores en Polea Baja (Cable Adduction)",
    "muscle_group": "Glúteos",
    "description": "Trabajo específico de la cara interna del muslo (aductores) para densidad de piernas y estabilidad de cadera.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/adductors/cable-hip-adduction.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/cb49b2d6-fb84-4f7d-b556-638c67aaf38a/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/cb49b2d6-fb84-4f7d-b556-638c67aaf38a/phase-1.png"
    ]
  },
  {
    "name": "Curl de Bíceps con Barra Recta (Barbell Curl)",
    "muscle_group": "Bíceps",
    "description": "Básico para masa y fuerza de brazos. Codos pegados a los costados, muñecas firmes y flexión sin balancear la espalda baja.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/410bda23-96af-4a2b-bbfe-58f92c738ae1/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/410bda23-96af-4a2b-bbfe-58f92c738ae1/phase-1.png"
    ]
  },
  {
    "name": "Curl de Bíceps con Barra Z (EZ-Bar Curl)",
    "muscle_group": "Bíceps",
    "description": "El agarre angulado alivia la presión en muñecas y antebrazos, permitiendo entrenar pesado con máxima comodidad.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-alternate-biceps-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/68f4db1b-5ba9-4d34-b001-30a6b4b61fc5/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/68f4db1b-5ba9-4d34-b001-30a6b4b61fc5/phase-1.png"
    ]
  },
  {
    "name": "Curl de Bíceps con Mancuernas Alterno",
    "muscle_group": "Bíceps",
    "description": "Inicia en posición neutra y supina la muñeca activamente durante la subida para máxima activación del bíceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-biceps-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9735769a-1f70-4dc6-b106-c53ccb8b7b56/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9735769a-1f70-4dc6-b106-c53ccb8b7b56/phase-1.png"
    ]
  },
  {
    "name": "Curl Inclinado en Banco con Mancuernas",
    "muscle_group": "Bíceps",
    "description": "Banco a 45°-60°. Coloca la cabeza larga del bíceps en posición de máximo estiramiento previo a la contracción.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-two-arm-curl-on-incline-bench.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0d4efd96-1ff5-475f-b2f3-0262c56c154c/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0d4efd96-1ff5-475f-b2f3-0262c56c154c/phase-1.png"
    ]
  },
  {
    "name": "Curl Martillo con Mancuernas (Hammer Curl)",
    "muscle_group": "Bíceps",
    "description": "Agarre neutro (palmas enfrentadas). Enfatiza el braquial anterior y el braquiorradial para aumentar el grosor del brazo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-hammer-curl-with-rope.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9e62db3e-fe26-4f7c-ae67-6e9fde1981d9/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9e62db3e-fe26-4f7c-ae67-6e9fde1981d9/phase-1.png"
    ]
  },
  {
    "name": "Curl Martillo Cruzado al Pecho (Cross Body Hammer)",
    "muscle_group": "Bíceps",
    "description": "Cruzar la mancuerna hacia el hombro opuesto. Estimula fuertemente el braquial anterior.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-cross-body-hammer-curl-v-2.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9a646042-47a3-41b7-83ee-c497c5d8ee76/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/9a646042-47a3-41b7-83ee-c497c5d8ee76/phase-1.png"
    ]
  },
  {
    "name": "Curl en Banco Scott / Predicador con Barra Z",
    "muscle_group": "Bíceps",
    "description": "Apoyo fijo de brazos que elimina completamente el impulso corporal y aísla la cabeza corta del bíceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-lying-preacher-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/2eab6ad7-a704-4e07-948a-64193a971700/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/2eab6ad7-a704-4e07-948a-64193a971700/phase-1.png"
    ]
  },
  {
    "name": "Curl Concentrado con Mancuerna (Concentration Curl)",
    "muscle_group": "Bíceps",
    "description": "Codo apoyado en la cara interna del muslo. Permite conexión mente-músculo extrema y pico de contracción arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/band-concentration-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/62c53d9c-e7bd-44d2-84a5-d05cc54a7b05/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/62c53d9c-e7bd-44d2-84a5-d05cc54a7b05/phase-1.png"
    ]
  },
  {
    "name": "Curl Predicador en Polea Baja",
    "muscle_group": "Bíceps",
    "description": "Añade tensión constante uniforme desde el inicio hasta el final del recorrido gracias a la polea.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-preacher-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7a86b077-8bd2-48ce-8660-c246ed063869/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7a86b077-8bd2-48ce-8660-c246ed063869/phase-1.png"
    ]
  },
  {
    "name": "Curl Hércules en Polea Alta Bilateral",
    "muscle_group": "Bíceps",
    "description": "Brazos en cruz a la altura de los hombros. Flexionar las manos hacia las orejas manteniendo los codos elevados.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-close-grip-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/319bfc3e-3c0f-415d-8964-1c32f99b3e75/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/319bfc3e-3c0f-415d-8964-1c32f99b3e75/phase-1.png"
    ]
  },
  {
    "name": "Press de Banca con Agarre Cerrado (Close-Grip Press)",
    "muscle_group": "Tríceps",
    "description": "Manos al ancho de hombros con codos pegados al cuerpo. El mejor constructor de fuerza y masa para los tríceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-close-grip-press.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/1b7219b1-43b8-464c-b38f-32a2208f9f48/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/1b7219b1-43b8-464c-b38f-32a2208f9f48/phase-1.png"
    ]
  },
  {
    "name": "Extensiones de Tríceps en Polea con Barra V",
    "muscle_group": "Tríceps",
    "description": "Codos fijos a los lados del torso. Extender los brazos hacia abajo empujando con la palma y apretar 1 segundo abajo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/88bd5712-df63-4498-bd8b-db24ee72317b/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/88bd5712-df63-4498-bd8b-db24ee72317b/phase-1.png"
    ]
  },
  {
    "name": "Extensiones de Tríceps con Cuerda en Polea",
    "muscle_group": "Tríceps",
    "description": "Separar los extremos de la cuerda al final de la extensión para mayor activación de la cabeza lateral del tríceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-overhead-triceps-extension-rope-attachment.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ea4798be-8c21-4b11-8e4a-95b247028157/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/ea4798be-8c21-4b11-8e4a-95b247028157/phase-1.png"
    ]
  },
  {
    "name": "Press Francés con Barra Z en Banco (Skull Crushers)",
    "muscle_group": "Tríceps",
    "description": "Bajar la barra hacia la coronilla o ligeramente detrás de la cabeza para estirar la cabeza larga del tríceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-triceps-extension.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f9c6f94a-c6eb-4a1b-a71b-891f90a8716b/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f9c6f94a-c6eb-4a1b-a71b-891f90a8716b/phase-1.png"
    ]
  },
  {
    "name": "Extensión de Tríceps sobre la Cabeza con Mancuerna (Copa)",
    "muscle_group": "Tríceps",
    "description": "Sujetar una mancuerna pesada con ambas manos tras la cabeza. Estiramiento profundo de la cabeza larga.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/dumbbell-seated-reverse-grip-one-arm-overhead-tricep-extension.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/acfeb072-f1a9-4517-a0f8-c336da95fdbb/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/acfeb072-f1a9-4517-a0f8-c336da95fdbb/phase-1.png"
    ]
  },
  {
    "name": "Extensión de Tríceps sobre la Cabeza en Polea con Cuerda",
    "muscle_group": "Tríceps",
    "description": "Tensión constante en el punto de estiramiento. Mantener los codos cerrados y extender hacia adelante.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-overhead-triceps-extension-rope-attachment.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/08ed021c-278e-45c1-95ef-15279c804e84/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/08ed021c-278e-45c1-95ef-15279c804e84/phase-1.png"
    ]
  },
  {
    "name": "Extensión Unilateral de Tríceps tras Nuca",
    "muscle_group": "Tríceps",
    "description": "Trabajo unilateral estricto para asegurar un desarrollo parejo en ambos brazos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-seated-close-grip-behind-neck-triceps-extension.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/1b2ecda1-9af0-4bd3-b7d8-32e83b09ec1e/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/1b2ecda1-9af0-4bd3-b7d8-32e83b09ec1e/phase-1.png"
    ]
  },
  {
    "name": "Fondos de Tríceps entre Bancos (Bench Dips)",
    "muscle_group": "Tríceps",
    "description": "Manos apoyadas en banco tras la espalda. Bajar con el torso vertical rozando el banco hasta 90° de codo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/weighted-three-bench-dips.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6db799af-765a-4ad3-948a-8b005d126cda/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6db799af-765a-4ad3-948a-8b005d126cda/phase-1.png"
    ]
  },
  {
    "name": "Extensión Unilateral en Polea Alta",
    "muscle_group": "Tríceps",
    "description": "Aislamiento sinérgico con agarre supino o neutro para afinar la definición y control neuromuscular.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-one-arm-tricep-pushdown.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/734ff01a-6ea0-48e2-b40d-93877348dcdd/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/734ff01a-6ea0-48e2-b40d-93877348dcdd/phase-1.png"
    ]
  },
  {
    "name": "Extensión Inclinada de Tríceps con Barra",
    "muscle_group": "Tríceps",
    "description": "En banco inclinado para enfatizar la porción larga del tríceps a lo largo de todo el arco de movimiento.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-back-of-the-head-tricep-extension.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7705a9cc-ce1c-4032-8b40-56042be60ea5/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7705a9cc-ce1c-4032-8b40-56042be60ea5/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones de Piernas Colgado en Barra",
    "muscle_group": "Core / Abdomen",
    "description": "Colgado de la barra de dominadas. Elevar las rodillas o piernas rectas redondeando la pelvis hacia el pecho sin arquear la espalda.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/arm-slingers-hanging-straight-legs.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/d36506bc-ac44-4cb9-a347-ce750f8c3780/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/d36506bc-ac44-4cb9-a347-ce750f8c3780/phase-1.png"
    ]
  },
  {
    "name": "Crunches en Polea Alta de Rodillas (Cable Crunch)",
    "muscle_group": "Core / Abdomen",
    "description": "Permite sobrecarga progresiva real en el recto abdominal. Sujetar la cuerda tras la nuca y flexionar la columna hacia los muslos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-kneeling-crunch.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c4d28a3f-f82f-4a13-9e2f-085cc0d9abd8/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c4d28a3f-f82f-4a13-9e2f-085cc0d9abd8/phase-1.png"
    ]
  },
  {
    "name": "Rueda Abdominal (Ab Wheel Rollout)",
    "muscle_group": "Core / Abdomen",
    "description": "Fuerza extrema anti-extensión. Rodar hacia adelante manteniendo la pelvis en retroversión sin hundir la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/wheel-rollerout.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8abc13d0-3b10-483c-b95b-c150437e62fe/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/8abc13d0-3b10-483c-b95b-c150437e62fe/phase-1.png"
    ]
  },
  {
    "name": "Plancha Abdominal Isométrica (Front Plank)",
    "muscle_group": "Core / Abdomen",
    "description": "Apoyo sobre antebrazos y puntas de pies. Contraer glúteos, abdomen y cuádriceps manteniendo el cuerpo rígido como una tabla.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/front-plank-with-twist.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/5ae0a74d-24b1-488b-a8b6-ff407c6e04f2/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/5ae0a74d-24b1-488b-a8b6-ff407c6e04f2/phase-1.png"
    ]
  },
  {
    "name": "Crunches Bicicleta (Air Bike / Bicycle Crunch)",
    "muscle_group": "Core / Abdomen",
    "description": "Rotación controlada del torso llevando el codo hacia la rodilla contraria alternadamente para reclutar oblicuos y recto abdominal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/air-bike.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/301659a3-bb38-4431-b95f-379fde22b125/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/301659a3-bb38-4431-b95f-379fde22b125/phase-1.png"
    ]
  },
  {
    "name": "Crunch en Banco Declinado (Decline Crunch)",
    "muscle_group": "Core / Abdomen",
    "description": "Aumenta el rango de flexión del tronco para una contracción abdominal más intensa y sostenida.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/decline-crunch.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/04b1bb57-8518-470d-9af0-c31327772abb/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/04b1bb57-8518-470d-9af0-c31327772abb/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones de Piernas Tumbado en Banco Plano",
    "muscle_group": "Core / Abdomen",
    "description": "Sujetarse del banco por detrás de la cabeza y elevar las piernas manteniendo la zona lumbar pegada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/lying-leg-raise-flat-bench.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6fa8a48f-1e56-411c-af26-643213980ab6/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6fa8a48f-1e56-411c-af26-643213980ab6/phase-1.png"
    ]
  },
  {
    "name": "Giros Rusos con Disco o Balón (Russian Twists)",
    "muscle_group": "Core / Abdomen",
    "description": "Torso a 45° del suelo y pies elevados. Rotar el torso de lado a lado para estimular los oblicuos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-russian-twists-on-stability-ball.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/97312ccc-c47d-43dd-9ed9-a3c627458517/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/97312ccc-c47d-43dd-9ed9-a3c627458517/phase-1.png"
    ]
  },
  {
    "name": "Leñador en Polea (Cable Woodchoppers)",
    "muscle_group": "Core / Abdomen",
    "description": "Patrón de rotación de torso con tensión constante para desarrollar oblicuos y fuerza rotacional.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-twist.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c5cc007f-6632-4b6b-ad7c-bc2513fd8c98/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/c5cc007f-6632-4b6b-ad7c-bc2513fd8c98/phase-1.png"
    ]
  },
  {
    "name": "Navajas / Jackknife Abdominal",
    "muscle_group": "Core / Abdomen",
    "description": "Flexión simultánea de torso y piernas en el centro formando una V con el cuerpo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/jackknife-sit-up.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bbe02c75-930d-452c-a743-d696f6517e9c/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bbe02c75-930d-452c-a743-d696f6517e9c/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones de Talones de Pie en Máquina",
    "muscle_group": "Pantorrillas",
    "description": "Enfoque en los gastrocnemios con rodillas extendidas. Pausa de 2 segundos en el estiramiento profundo abajo y 1 segundo arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/smith-reverse-calf-raises-1394.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/65f30053-8ea7-4ecc-9a0f-132eb18b80a2/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/65f30053-8ea7-4ecc-9a0f-132eb18b80a2/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones de Talones Sentado en Máquina",
    "muscle_group": "Pantorrillas",
    "description": "Con rodillas flexionadas a 90° se desactiva el gastrocnemio y se aísla el músculo sóleo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-seated-calf-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6e75a1b6-ce1f-4a59-93c7-91360bf8c963/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/6e75a1b6-ce1f-4a59-93c7-91360bf8c963/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones de Talones en Máquina Smith",
    "muscle_group": "Pantorrillas",
    "description": "Pisar sobre un disco o escalón con barra en trapecios para gran sobrecarga progresiva.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/smith-standing-leg-calf-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/fb3a51d8-067f-4ff7-8c36-6ff2914f6ed8/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/fb3a51d8-067f-4ff7-8c36-6ff2914f6ed8/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones de Talones en Prensa de Piernas",
    "muscle_group": "Pantorrillas",
    "description": "Puntas de los pies en el borde inferior de la plataforma de la prensa con seguro listo. Gran rango de movimiento.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-seated-squat-calf-raise-on-leg-press-machine.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a4735930-c0bb-4910-a0b9-a9869b6d5c6f/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/a4735930-c0bb-4910-a0b9-a9869b6d5c6f/phase-1.png"
    ]
  },
  {
    "name": "Elevaciones de Talones Unilateral con Mancuerna",
    "muscle_group": "Pantorrillas",
    "description": "De pie sobre un escalón con una mancuerna en la mano del mismo lado para mayor aislamiento y control.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/dumbbell-seated-calf-raise.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f589dd5f-2720-4e58-9c74-e57be64d3f95/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/f589dd5f-2720-4e58-9c74-e57be64d3f95/phase-1.png"
    ]
  },
  {
    "name": "Extensiones de Muñeca con Barra (Extensores)",
    "muscle_group": "Antebrazos",
    "description": "Antebrazos apoyados en banco con palmas hacia abajo. Elevar la barra extendiendo las muñecas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/barbell-palms-down-wrist-curl-over-a-bench.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bac5b14d-1776-4757-83d8-589aa7b64dd9/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/bac5b14d-1776-4757-83d8-589aa7b64dd9/phase-1.png"
    ]
  },
  {
    "name": "Flexiones de Muñeca con Barra (Flexores)",
    "muscle_group": "Antebrazos",
    "description": "Palmas hacia arriba. Dejar rodar la barra por los dedos y flexionar con fuerza los antebrazos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/barbell-palms-up-wrist-curl-over-a-bench.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0de84c23-dc5a-492e-8904-07da895692a5/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/0de84c23-dc5a-492e-8904-07da895692a5/phase-1.png"
    ]
  },
  {
    "name": "Curl de Muñeca tras la Espalda con Barra",
    "muscle_group": "Antebrazos",
    "description": "Barra sostenida por detrás de los glúteos con agarre prono. Flexión pura de muñecas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/barbell-standing-back-wrist-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/caabc144-991a-4839-8e4e-502593e67502/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/caabc144-991a-4839-8e4e-502593e67502/phase-1.png"
    ]
  },
  {
    "name": "Curl Invertido con Barra (Reverse Curl)",
    "muscle_group": "Antebrazos",
    "description": "Agarre prono (palmas hacia abajo). Desarrolla masivamente el braquiorradial y antebrazos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-reverse-curl.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7bcf0165-e46c-4ed5-8cd6-499ef6e4ef97/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/7bcf0165-e46c-4ed5-8cd6-499ef6e4ef97/phase-1.png"
    ]
  },
  {
    "name": "Saltos a la Comba (Jump Rope)",
    "muscle_group": "Cardio",
    "description": "Excelente para acondicionamiento cardiovascular, coordinación neuromuscular y quema calórica.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/jump-rope.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/09a2608b-dadf-4e46-bd08-48b6c1454c72/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/09a2608b-dadf-4e46-bd08-48b6c1454c72/phase-1.png"
    ]
  },
  {
    "name": "Caminata con Inclinación en Cinta (Incline Walk)",
    "muscle_group": "Cardio",
    "description": "Cardio de bajo impacto articular. Inclinación al 8-12% a paso ligero de 4.5-5.5 km/h para quemar grasa cuidando la masa muscular.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/walking-on-incline-treadmill.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/83187ec6-32e6-4224-aae0-a89675c3ef04/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/83187ec6-32e6-4224-aae0-a89675c3ef04/phase-1.png"
    ]
  },
  {
    "name": "Trote Continuo en Cinta (Treadmill Jogging)",
    "muscle_group": "Cardio",
    "description": "Acondicionamiento aeróbico constante y resistencia cardiovascular general.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/run.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/dca175ad-8c51-4686-a3a2-517bc4a97e82/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/dca175ad-8c51-4686-a3a2-517bc4a97e82/phase-1.png"
    ]
  },
  {
    "name": "Bicicleta Estática / Spinning",
    "muscle_group": "Cardio",
    "description": "Entrenamiento aeróbico y de resistencia muscular para piernas sin impacto en articulaciones.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/stationary-bike-run-v-3.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/367686cf-f890-4a06-b529-d15cab242cca/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/367686cf-f890-4a06-b529-d15cab242cca/phase-1.png"
    ]
  },
  {
    "name": "Remo Indoor en Máquina (Concept2 Rower)",
    "muscle_group": "Cardio",
    "description": "Ejercicio cardiovascular completo de cuerpo entero que involucra piernas, espalda y brazos en cada palada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/cycle-cross-trainer.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/15190d5b-7e33-4d65-bee8-137e7f680fe7/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/15190d5b-7e33-4d65-bee8-137e7f680fe7/phase-1.png"
    ]
  },
  {
    "name": "Escaladores / Mountain Climbers",
    "muscle_group": "Cardio",
    "description": "Ejercicio funcional en posición de plancha. Llevar las rodillas alternadamente al pecho a ritmo rápido.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/mountain-climber.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b16db17d-3d6b-4458-a287-e3685d9dc603/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/b16db17d-3d6b-4458-a287-e3685d9dc603/phase-1.png"
    ]
  },
  {
    "name": "Saltos al Cajón Pliométricos (Box Jumps)",
    "muscle_group": "Cardio",
    "description": "Potencia explosiva para el tren inferior y acondicionamiento metabólico.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/cardio/semi-squat-jump-male.gif",
    "image_urls": [
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/deff0e8f-8b18-4d7d-9e62-d4fb93dcd625/phase-0.png",
      "https://uvqkdcsetadyecgnyyem.supabase.co/storage/v1/object/public/exercise-media/exercises/deff0e8f-8b18-4d7d-9e62-d4fb93dcd625/phase-1.png"
    ]
  }
];
