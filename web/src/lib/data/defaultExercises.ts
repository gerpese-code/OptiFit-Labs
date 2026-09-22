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
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg"
    ]
  },
  {
    "name": "Press Inclinado con Mancuernas (Incline DB Press)",
    "muscle_group": "Pecho",
    "description": "Banco a 30°-45°. Máximo reclutamiento del haz clavicular (pecho superior). Mantener los codos a unos 45°-60° respecto al torso para proteger los hombros y lograr máximo rango de estiramiento.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/1.jpg"
    ]
  },
  {
    "name": "Press Inclinado con Barra (Incline Barbell Press)",
    "muscle_group": "Pecho",
    "description": "Banco a 30°. Empujar la barra verticalmente enfocando la tensión en la porción superior del pecho y deltoides anterior con retracción escapular firme.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg"
    ]
  },
  {
    "name": "Press Plano con Mancuernas (Flat DB Press)",
    "muscle_group": "Pecho",
    "description": "Permite mayor recorrido articular y libertad en las muñecas que la barra. Descender hasta sentir un estiramiento profundo en el pectoral y juntar arriba sin chocar las mancuernas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bench_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bench_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bench_Press/1.jpg"
    ]
  },
  {
    "name": "Press Declinado con Barra (Decline Press)",
    "muscle_group": "Pecho",
    "description": "Enfatiza las fibras inferiores del pectoral mayor. Banco declinado a 15°-30°. Descenso controlado hasta la parte baja del pecho.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Barbell_Bench_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Barbell_Bench_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Barbell_Bench_Press/1.jpg"
    ]
  },
  {
    "name": "Press Plano en Máquina Smith / Multipower",
    "muscle_group": "Pecho",
    "description": "Permite entrenar cerca del fallo muscular con total seguridad articular y máxima tensión constante en el pectoral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Bench_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Bench_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Bench_Press/1.jpg"
    ]
  },
  {
    "name": "Press Inclinado en Máquina Smith / Multipower",
    "muscle_group": "Pecho",
    "description": "Aislamiento estable del pectoral superior sin tener que estabilizar la barra, ideal para series pesadas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Incline_Bench_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Incline_Bench_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Incline_Bench_Press/1.jpg"
    ]
  },
  {
    "name": "Aperturas Planas con Mancuernas (DB Flyes)",
    "muscle_group": "Pecho",
    "description": "Ejercicio de aislamiento para estiramiento del pectoral. Codos con leve flexión fija durante todo el recorrido. Abrir controlando el peso hasta sentir el estiramiento y cerrar abrazando un barril.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Flyes/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Flyes/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Flyes/1.jpg"
    ]
  },
  {
    "name": "Aperturas Inclinadas con Mancuernas (Incline Flyes)",
    "muscle_group": "Pecho",
    "description": "Aislamiento y sobrecarga excéntrica en el pecho superior. Control estricto en la bajada sin hiperextender el hombro.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Flyes/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Flyes/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Flyes/1.jpg"
    ]
  },
  {
    "name": "Aperturas Declinadas con Mancuernas",
    "muscle_group": "Pecho",
    "description": "Enfoque en las fibras inferiores del pectoral con tensión concentrada en la porción costal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Dumbbell_Flyes/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Dumbbell_Flyes/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Dumbbell_Flyes/1.jpg"
    ]
  },
  {
    "name": "Cruces en Polea Alta (Cable Crossover)",
    "muscle_group": "Pecho",
    "description": "Tensión constante durante todo el rango. Torso ligeramente inclinado hacia adelante. Cruzar las manos abajo y apretar el pectoral en máxima contracción durante 1 segundo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crossover/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crossover/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crossover/1.jpg"
    ]
  },
  {
    "name": "Cruces en Polea Media / Cruz de Hierro",
    "muscle_group": "Pecho",
    "description": "Aislamiento de la parte media del pecho con trayectoria horizontal pura. Excelente congestión.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Iron_Cross/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Iron_Cross/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Iron_Cross/1.jpg"
    ]
  },
  {
    "name": "Fondos en Paralelas para Pecho (Chest Dips)",
    "muscle_group": "Pecho",
    "description": "Torso inclinado hacia adelante y codos ligeramente abiertos para trasladar el estímulo al pectoral inferior. Descender hasta 90° de flexión en codo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dips_-_Chest_Version/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dips_-_Chest_Version/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dips_-_Chest_Version/1.jpg"
    ]
  },
  {
    "name": "Flexiones de Pecho (Push-Ups)",
    "muscle_group": "Pecho",
    "description": "Calistenia fundamental. Core y glúteos activos, cuerpo en línea recta. Bajar el pecho hasta rozar el suelo con codos en ángulo de 45° respecto al torso.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/1.jpg"
    ]
  },
  {
    "name": "Aperturas en Máquina Peck Deck (Pec Deck Flyes)",
    "muscle_group": "Pecho",
    "description": "Aislamiento puro y seguro. Apoyar bien la espalda en el respaldo, codos a la altura del pecho medio y apretar fuerte 1 segundo en el centro.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Butterfly/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Butterfly/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Butterfly/1.jpg"
    ]
  },
  {
    "name": "Dominadas Pronas (Pull-Ups)",
    "muscle_group": "Espalda",
    "description": "Rey de los ejercicios de tracción vertical. Agarre prono algo más ancho que los hombros. Iniciar deprimiendo escápulas y llevar el pecho hacia la barra sin balanceo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pullups/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pullups/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pullups/1.jpg"
    ]
  },
  {
    "name": "Dominadas Supinas (Chin-Ups)",
    "muscle_group": "Espalda",
    "description": "Agarre supino al ancho de los hombros. Mayor intervención del bíceps braquial junto a los dorsales en tracción vertical profunda.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Chin-Up/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Chin-Up/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Chin-Up/1.jpg"
    ]
  },
  {
    "name": "Jalón al Pecho en Polea Alta (Lat Pulldown)",
    "muscle_group": "Espalda",
    "description": "Tracción vertical con barra ancha. Llevar la barra al esternón superior sacando pecho y retrayendo escápulas. Evitar balancear el torso hacia atrás.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Wide-Grip_Lat_Pulldown/1.jpg"
    ]
  },
  {
    "name": "Jalón al Pecho con Agarre Cerrado Neutro (V-Bar Pulldown)",
    "muscle_group": "Espalda",
    "description": "Agarre neutro en V. Permite mayor recorrido y tracción dirigida hacia las inserciones inferiores del dorsal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Close-Grip_Front_Lat_Pulldown/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Close-Grip_Front_Lat_Pulldown/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Close-Grip_Front_Lat_Pulldown/1.jpg"
    ]
  },
  {
    "name": "Remo con Barra 45° (Barbell Row)",
    "muscle_group": "Espalda",
    "description": "Multiarticular de densidad dorsal. Espalda recta y torso a 45°. Tirar de la barra hacia la cintura baja dirigiendo el movimiento con los codos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bent_Over_Barbell_Row/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bent_Over_Barbell_Row/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bent_Over_Barbell_Row/1.jpg"
    ]
  },
  {
    "name": "Remo Unilateral con Mancuerna (Dumbbell Row)",
    "muscle_group": "Espalda",
    "description": "Apoyo en banco plano. Permite gran estiramiento del dorsal en la bajada y contracción completa arriba sin forzar la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Dumbbell_Row/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Dumbbell_Row/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Dumbbell_Row/1.jpg"
    ]
  },
  {
    "name": "Remo en Polea Baja Sentado (Seated Cable Row)",
    "muscle_group": "Espalda",
    "description": "Torso perpendicular al suelo con leve curvatura lumbar natural. Tirar hacia el ombligo, juntar escápulas al final y controlar la vuelta estirando los dorsales.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/1.jpg"
    ]
  },
  {
    "name": "Remo en Barra T con Agarre Cerrado (T-Bar Row)",
    "muscle_group": "Espalda",
    "description": "Excelente para el grosor de la espalda media y romboides. Pecho elevado, cadera atrás y tracción estricta hacia el abdomen.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/T-Bar_Row_with_Handle/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/T-Bar_Row_with_Handle/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/T-Bar_Row_with_Handle/1.jpg"
    ]
  },
  {
    "name": "Pullover en Polea Alta con Brazos Rectos",
    "muscle_group": "Espalda",
    "description": "Aislamiento del dorsal ancho sin fatiga de brazos. Codos con leve flexión fija. Bajar la barra hacia los muslos describiendo un arco amplio.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Straight-Arm_Pulldown/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Straight-Arm_Pulldown/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Straight-Arm_Pulldown/1.jpg"
    ]
  },
  {
    "name": "Peso Muerto Convencional (Deadlift)",
    "muscle_group": "Espalda",
    "description": "Máxima construcción de fuerza y masa en toda la cadena posterior. Espalda neutra, barra rozando las piernas y empuje simultáneo de piernas y cadera.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Deadlift/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Deadlift/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Deadlift/1.jpg"
    ]
  },
  {
    "name": "Hiperextensiones en Banco 45° (Back Extensions)",
    "muscle_group": "Espalda",
    "description": "Fortalecimiento de erectores espinales, zona lumbar y glúteos. Subir hasta alinear la columna con las piernas sin hiperextender el cuello.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hyperextensions_Back_Extensions/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hyperextensions_Back_Extensions/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hyperextensions_Back_Extensions/1.jpg"
    ]
  },
  {
    "name": "Encogimientos con Barra (Barbell Shrug)",
    "muscle_group": "Espalda",
    "description": "Aislamiento del trapecio superior. Elevar los hombros directamente hacia las orejas, aguantar 1 segundo en la cima y descender con control.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Shrug/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Shrug/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Shrug/1.jpg"
    ]
  },
  {
    "name": "Encogimientos con Mancuernas (Dumbbell Shrug)",
    "muscle_group": "Espalda",
    "description": "Permite una posición más natural de los brazos a los lados del cuerpo para aislar los trapecios superiores.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Shrug/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Shrug/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Shrug/1.jpg"
    ]
  },
  {
    "name": "Remo Tumbado en Banco Inclinado (Seal / Bench Row)",
    "muscle_group": "Espalda",
    "description": "Elimina totalmente el estrés lumbar al apoyar el pecho en el banco. Máximo aislamiento de romboides y trapecio medio.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Bench_Pull/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Bench_Pull/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Bench_Pull/1.jpg"
    ]
  },
  {
    "name": "Cable Pull-Through para Cadena Posterior",
    "muscle_group": "Espalda",
    "description": "Bisagra de cadera en polea baja entre las piernas. Enseña a extender la cadera con glúteos e isquios protegiendo la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pull_Through/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pull_Through/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pull_Through/1.jpg"
    ]
  },
  {
    "name": "Press Militar de Pie con Barra (Military Press)",
    "muscle_group": "Hombros",
    "description": "Básico por excelencia para el deltoides anterior y lateral. Glúteos y abdomen firmes. Empujar la barra por delante de la cara hasta bloquear arriba con la cabeza alineada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Military_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Military_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Military_Press/1.jpg"
    ]
  },
  {
    "name": "Press de Hombros Sentado con Mancuernas",
    "muscle_group": "Hombros",
    "description": "Respaldo casi a 90°. Empujar las mancuernas en trayectoria ligeramente convergente sin que lleguen a chocar arriba. Bajar controladamente hasta rozar la altura de las orejas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Dumbbell_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Dumbbell_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Dumbbell_Press/1.jpg"
    ]
  },
  {
    "name": "Press Arnold con Mancuernas (Arnold Press)",
    "muscle_group": "Hombros",
    "description": "Combina rotación de muñeca con press vertical para activar los tres haces del deltoides en un solo movimiento fluido.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Arnold_Dumbbell_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Arnold_Dumbbell_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Arnold_Dumbbell_Press/1.jpg"
    ]
  },
  {
    "name": "Elevaciones Laterales con Mancuernas (Lateral Raises)",
    "muscle_group": "Hombros",
    "description": "Clave para la anchura del deltoides medio. Elevar los brazos en el plano escapular (ligeramente hacia adelante) guiando con los codos hasta la horizontal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/1.jpg"
    ]
  },
  {
    "name": "Elevaciones Laterales en Polea (Cable Lateral Raise)",
    "muscle_group": "Hombros",
    "description": "Tensión uniforme desde el inicio del movimiento. Excelente para mantener sobrecarga constante en el deltoides lateral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Seated_Lateral_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Seated_Lateral_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Seated_Lateral_Raise/1.jpg"
    ]
  },
  {
    "name": "Elevaciones Frontales con Mancuernas (Front Raises)",
    "muscle_group": "Hombros",
    "description": "Aislamiento del deltoides anterior. Elevar las mancuernas de forma alterna o simultánea hasta la altura de los ojos sin balancear el torso.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Dumbbell_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Dumbbell_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Dumbbell_Raise/1.jpg"
    ]
  },
  {
    "name": "Face Pull con Cuerda en Polea Alta",
    "muscle_group": "Hombros",
    "description": "Esencial para la salud del hombro, manguito rotador y deltoides posterior. Tirar de la cuerda hacia los ojos abriendo las manos y rotando los hombros externamente.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Face_Pull/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Face_Pull/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Face_Pull/1.jpg"
    ]
  },
  {
    "name": "Pájaros Sentado con Mancuernas (Rear Delt Flyes)",
    "muscle_group": "Hombros",
    "description": "Torso inclinado apoyado sobre los muslos. Elevar las mancuernas hacia los lados focalizando en la parte posterior del hombro y romboides.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Bent-Over_Rear_Delt_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Bent-Over_Rear_Delt_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Bent-Over_Rear_Delt_Raise/1.jpg"
    ]
  },
  {
    "name": "Pájaros Tumbado en Banco Inclinado",
    "muscle_group": "Hombros",
    "description": "Pecho apoyado en banco a 30°-45°. Aislamiento estricto del deltoides posterior sin balanceos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Lying_Rear_Lateral_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Lying_Rear_Lateral_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Lying_Rear_Lateral_Raise/1.jpg"
    ]
  },
  {
    "name": "Remo al Mentón con Barra (Upright Row)",
    "muscle_group": "Hombros",
    "description": "Agarre al ancho de los hombros. Subir la barra pegada al torso elevando los codos por encima de la barra para activar deltoides lateral y trapecio.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Upright_Barbell_Row/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Upright_Barbell_Row/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Upright_Barbell_Row/1.jpg"
    ]
  },
  {
    "name": "Remo con Barra para Deltoides Posterior",
    "muscle_group": "Hombros",
    "description": "Agarre ancho con codos perpendiculares al cuerpo (a 90°) para concentrar toda la tracción en la parte posterior del hombro.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Rear_Delt_Row/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Rear_Delt_Row/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Rear_Delt_Row/1.jpg"
    ]
  },
  {
    "name": "Cargada y Press Militar (Clean and Press)",
    "muscle_group": "Hombros",
    "description": "Movimiento de potencia y fuerza integral. Llevar la barra desde el suelo a los hombros y empujar enérgicamente por encima de la cabeza.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Clean_and_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Clean_and_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Clean_and_Press/1.jpg"
    ]
  },
  {
    "name": "Sentadilla Trasera con Barra (Barbell Back Squat)",
    "muscle_group": "Cuádriceps",
    "description": "El rey del tren inferior. Apoyo firme sobre los talones y metatarsos, rodillas alineadas con las puntas de los pies. Romper el paralelo con control y empujar el suelo al subir.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/1.jpg"
    ]
  },
  {
    "name": "Sentadilla Frontal con Barra (Front Squat)",
    "muscle_group": "Cuádriceps",
    "description": "Barra descansando sobre deltoides anteriores con codos altos. Torso muy vertical que enfatiza fuertemente los cuádriceps y el core anterior.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Barbell_Squat/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Barbell_Squat/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Barbell_Squat/1.jpg"
    ]
  },
  {
    "name": "Sentadilla en Máquina Smith / Multipower",
    "muscle_group": "Cuádriceps",
    "description": "Permite adelantar ligeramente los pies para enfatizar al 100% los cuádriceps reduciendo la tensión en la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Squat/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Squat/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Squat/1.jpg"
    ]
  },
  {
    "name": "Prensa de Piernas 45° (Leg Press)",
    "muscle_group": "Cuádriceps",
    "description": "Permite mover grandes cargas con soporte para la espalda baja. Pies al ancho de hombros en el centro de la plataforma. Bajar hasta 90° sin despegar la pelvis del respaldo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/1.jpg"
    ]
  },
  {
    "name": "Extensiones de Cuádriceps en Máquina (Leg Extension)",
    "muscle_group": "Cuádriceps",
    "description": "Aislamiento puro del recto femoral y vastos. Extender las piernas por completo, aguantar 1 segundo en máxima contracción y bajar lento en 3 segundos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Extensions/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Extensions/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Extensions/1.jpg"
    ]
  },
  {
    "name": "Extensión de Cuádriceps Unilateral en Máquina",
    "muscle_group": "Cuádriceps",
    "description": "Trabajo a una sola pierna para corregir desbalances de fuerza y masa muscular en cuádriceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Single-Leg_Leg_Extension/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Single-Leg_Leg_Extension/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Single-Leg_Leg_Extension/1.jpg"
    ]
  },
  {
    "name": "Sentadilla Goblet con Mancuerna (Goblet Squat)",
    "muscle_group": "Cuádriceps",
    "description": "Sujetar una mancuerna pesada verticalmente contra el pecho. Excelente para aprender y perfeccionar el patrón de sentadilla profunda con torso erguido.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Goblet_Squat/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Goblet_Squat/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Goblet_Squat/1.jpg"
    ]
  },
  {
    "name": "Zancadas Estáticas con Mancuernas (Lunges)",
    "muscle_group": "Cuádriceps",
    "description": "Trabajo unilateral para equilibrio y desarrollo muscular. Dar un paso amplio y descender la rodilla trasera hasta casi rozar el suelo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Lunges/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Lunges/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Lunges/1.jpg"
    ]
  },
  {
    "name": "Zancadas hacia Atrás con Mancuernas (Reverse Lunge)",
    "muscle_group": "Cuádriceps",
    "description": "Paso hacia atrás que genera menor estrés de cizalla en la rótula de la rodilla delantera. Excelente para rodillas sensibles.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Rear_Lunge/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Rear_Lunge/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Rear_Lunge/1.jpg"
    ]
  },
  {
    "name": "Zancadas con Barra (Barbell Lunges)",
    "muscle_group": "Cuádriceps",
    "description": "Sobrecarga sobre los cuádriceps y glúteos con barra tras nuca. Mantener el torso erguido durante todo el paso.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Lunge/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Lunge/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Lunge/1.jpg"
    ]
  },
  {
    "name": "Subidas al Banco con Barra (Step-Ups)",
    "muscle_group": "Cuádriceps",
    "description": "Pisar firmemente sobre el cajón empujando desde el talón de la pierna superior sin impulsarse con la pierna de abajo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Step_Ups/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Step_Ups/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Step_Ups/1.jpg"
    ]
  },
  {
    "name": "Subidas al Banco con Elevación de Rodilla",
    "muscle_group": "Cuádriceps",
    "description": "Combina el empuje unilateral de cuádriceps con flexión explosiva de cadera y activación de glúteo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Step-up_with_Knee_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Step-up_with_Knee_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Step-up_with_Knee_Raise/1.jpg"
    ]
  },
  {
    "name": "Peso Muerto Rumano con Barra (Barbell RDL)",
    "muscle_group": "Isquiosurales",
    "description": "Patrón de bisagra de cadera indispensable. Rodillas con microflexión fija. Enviar la cadera hacia atrás sintiendo una tensión profunda en los femorales y glúteos antes de extender la cadera al subir.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/1.jpg"
    ]
  },
  {
    "name": "Peso Muerto Rumano con Déficit (Deficit RDL)",
    "muscle_group": "Isquiosurales",
    "description": "De pie sobre un disco o plataforma para aumentar el rango de estiramiento de los isquiotibiales en el punto más bajo de la bisagra.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift_from_Deficit/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift_from_Deficit/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift_from_Deficit/1.jpg"
    ]
  },
  {
    "name": "Curl Femoral Tumbado en Máquina (Lying Leg Curl)",
    "muscle_group": "Isquiosurales",
    "description": "Flexión de rodilla directa para hipertrofia de isquiotibiales. Mantener la pelvis pegada a la almohadilla sin arquear la zona lumbar en la contracción.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Leg_Curls/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Leg_Curls/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Leg_Curls/1.jpg"
    ]
  },
  {
    "name": "Curl Femoral Sentado en Máquina (Seated Leg Curl)",
    "muscle_group": "Isquiosurales",
    "description": "Al tener la cadera flexionada a 90°, los isquiotibiales trabajan en posición de mayor elongación muscular, generando alta tensión mecánica.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Leg_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Leg_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Leg_Curl/1.jpg"
    ]
  },
  {
    "name": "Buenos Días con Barra (Good Mornings)",
    "muscle_group": "Isquiosurales",
    "description": "Barra colocada sobre trapecios. Flexionar la cadera empujando los glúteos atrás con la espalda neutra hasta que el torso quede casi horizontal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Good_Morning/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Good_Morning/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Good_Morning/1.jpg"
    ]
  },
  {
    "name": "Peso Muerto con Mancuernas Piernas Semirrígidas",
    "muscle_group": "Isquiosurales",
    "description": "Permite bajar las mancuernas cerca del centro de gravedad, manteniendo tensión constante y controlada en toda la cadena posterior.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Stiff-Legged_Dumbbell_Deadlift/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Stiff-Legged_Dumbbell_Deadlift/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Stiff-Legged_Dumbbell_Deadlift/1.jpg"
    ]
  },
  {
    "name": "Peso Muerto Rumano Unilateral con Kettlebell / Mancuerna",
    "muscle_group": "Isquiosurales",
    "description": "A una sola pierna. Excelente para equilibrio propioceptivo, estabilidad de tobillo y aislamiento del femoral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Kettlebell_One-Legged_Deadlift/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Kettlebell_One-Legged_Deadlift/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Kettlebell_One-Legged_Deadlift/1.jpg"
    ]
  },
  {
    "name": "Curl Femoral de Pie Unilateral en Máquina",
    "muscle_group": "Isquiosurales",
    "description": "Flexión de rodilla individual para equilibrar la fuerza de ambos isquiosurales por separado.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Leg_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Leg_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Leg_Curl/1.jpg"
    ]
  },
  {
    "name": "Hip Thrust con Barra en Banco (Barbell Hip Thrust)",
    "muscle_group": "Glúteos",
    "description": "El ejercicio más eficiente para hipertrofia del glúteo mayor. Espalda alta apoyada en banco, espinillas verticales en la cima y retroversión pélvica con contracción de 1 segundo arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Hip_Thrust/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Hip_Thrust/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Hip_Thrust/1.jpg"
    ]
  },
  {
    "name": "Puente de Glúteos con Barra en Suelo (Glute Bridge)",
    "muscle_group": "Glúteos",
    "description": "Ejecutado sobre el suelo. Menor rango que el hip thrust pero permite manejar altas cargas y máxima tensión en extensión terminal de cadera.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Glute_Bridge/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Glute_Bridge/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Glute_Bridge/1.jpg"
    ]
  },
  {
    "name": "Puente de Glúteos Unilateral en Suelo",
    "muscle_group": "Glúteos",
    "description": "Excelente para corregir asimetrías de fuerza entre glúteos y mejorar la estabilidad de la pelvis.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Single_Leg_Glute_Bridge/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Single_Leg_Glute_Bridge/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Single_Leg_Glute_Bridge/1.jpg"
    ]
  },
  {
    "name": "Zancadas Caminando con Barra para Glúteos",
    "muscle_group": "Glúteos",
    "description": "Pasos largos con ligera inclinación del torso hacia adelante para estirar y cargar al máximo los glúteos en cada zancada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Walking_Lunge/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Walking_Lunge/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Walking_Lunge/1.jpg"
    ]
  },
  {
    "name": "Zancadas Caminando con Peso Corporal",
    "muscle_group": "Glúteos",
    "description": "Volumen y congestión de glúteos y piernas sin impacto en la columna vertebral.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bodyweight_Walking_Lunge/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bodyweight_Walking_Lunge/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bodyweight_Walking_Lunge/1.jpg"
    ]
  },
  {
    "name": "Patada de Glúteo en Cuadrupedia / Máquina",
    "muscle_group": "Glúteos",
    "description": "Aislamiento de la porción superior del glúteo mayor. Extender la pierna hacia atrás apretando arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Glute_Kickback/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Glute_Kickback/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Glute_Kickback/1.jpg"
    ]
  },
  {
    "name": "Aductores en Polea Baja (Cable Adduction)",
    "muscle_group": "Glúteos",
    "description": "Trabajo específico de la cara interna del muslo (aductores) para densidad de piernas y estabilidad de cadera.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Hip_Adduction/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Hip_Adduction/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Hip_Adduction/1.jpg"
    ]
  },
  {
    "name": "Curl de Bíceps con Barra Recta (Barbell Curl)",
    "muscle_group": "Bíceps",
    "description": "Básico para masa y fuerza de brazos. Codos pegados a los costados, muñecas firmes y flexión sin balancear la espalda baja.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl de Bíceps con Barra Z (EZ-Bar Curl)",
    "muscle_group": "Bíceps",
    "description": "El agarre angulado alivia la presión en muñecas y antebrazos, permitiendo entrenar pesado con máxima comodidad.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/EZ-Bar_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/EZ-Bar_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/EZ-Bar_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl de Bíceps con Mancuernas Alterno",
    "muscle_group": "Bíceps",
    "description": "Inicia en posición neutra y supina la muñeca activamente durante la subida para máxima activación del bíceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bicep_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bicep_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bicep_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl Inclinado en Banco con Mancuernas",
    "muscle_group": "Bíceps",
    "description": "Banco a 45°-60°. Coloca la cabeza larga del bíceps en posición de máximo estiramiento previo a la contracción.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl Martillo con Mancuernas (Hammer Curl)",
    "muscle_group": "Bíceps",
    "description": "Agarre neutro (palmas enfrentadas). Enfatiza el braquial anterior y el braquiorradial para aumentar el grosor del brazo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hammer_Curls/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hammer_Curls/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hammer_Curls/1.jpg"
    ]
  },
  {
    "name": "Curl Martillo Cruzado al Pecho (Cross Body Hammer)",
    "muscle_group": "Bíceps",
    "description": "Cruzar la mancuerna hacia el hombro opuesto. Estimula fuertemente el braquial anterior.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cross_Body_Hammer_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cross_Body_Hammer_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cross_Body_Hammer_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl en Banco Scott / Predicador con Barra Z",
    "muscle_group": "Bíceps",
    "description": "Apoyo fijo de brazos que elimina completamente el impulso corporal y aísla la cabeza corta del bíceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Preacher_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Preacher_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Preacher_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl Concentrado con Mancuerna (Concentration Curl)",
    "muscle_group": "Bíceps",
    "description": "Codo apoyado en la cara interna del muslo. Permite conexión mente-músculo extrema y pico de contracción arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Concentration_Curls/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Concentration_Curls/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Concentration_Curls/1.jpg"
    ]
  },
  {
    "name": "Curl Predicador en Polea Baja",
    "muscle_group": "Bíceps",
    "description": "Añade tensión constante uniforme desde el inicio hasta el final del recorrido gracias a la polea.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Preacher_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Preacher_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Preacher_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl Hércules en Polea Alta Bilateral",
    "muscle_group": "Bíceps",
    "description": "Brazos en cruz a la altura de los hombros. Flexionar las manos hacia las orejas manteniendo los codos elevados.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Overhead_Cable_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Overhead_Cable_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Overhead_Cable_Curl/1.jpg"
    ]
  },
  {
    "name": "Press de Banca con Agarre Cerrado (Close-Grip Press)",
    "muscle_group": "Tríceps",
    "description": "Manos al ancho de hombros con codos pegados al cuerpo. El mejor constructor de fuerza y masa para los tríceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Close-Grip_Barbell_Bench_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Close-Grip_Barbell_Bench_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Close-Grip_Barbell_Bench_Press/1.jpg"
    ]
  },
  {
    "name": "Extensiones de Tríceps en Polea con Barra V",
    "muscle_group": "Tríceps",
    "description": "Codos fijos a los lados del torso. Extender los brazos hacia abajo empujando con la palma y apretar 1 segundo abajo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown/1.jpg"
    ]
  },
  {
    "name": "Extensiones de Tríceps con Cuerda en Polea",
    "muscle_group": "Tríceps",
    "description": "Separar los extremos de la cuerda al final de la extensión para mayor activación de la cabeza lateral del tríceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown_-_Rope_Attachment/1.jpg"
    ]
  },
  {
    "name": "Press Francés con Barra Z en Banco (Skull Crushers)",
    "muscle_group": "Tríceps",
    "description": "Bajar la barra hacia la coronilla o ligeramente detrás de la cabeza para estirar la cabeza larga del tríceps.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Triceps_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Triceps_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Triceps_Press/1.jpg"
    ]
  },
  {
    "name": "Extensión de Tríceps sobre la Cabeza con Mancuerna (Copa)",
    "muscle_group": "Tríceps",
    "description": "Sujetar una mancuerna pesada con ambas manos tras la cabeza. Estiramiento profundo de la cabeza larga.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Triceps_Press/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Triceps_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Triceps_Press/1.jpg"
    ]
  },
  {
    "name": "Extensión de Tríceps sobre la Cabeza en Polea con Cuerda",
    "muscle_group": "Tríceps",
    "description": "Tensión constante en el punto de estiramiento. Mantener los codos cerrados y extender hacia adelante.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Rope_Overhead_Triceps_Extension/1.jpg"
    ]
  },
  {
    "name": "Extensión Unilateral de Tríceps tras Nuca",
    "muscle_group": "Tríceps",
    "description": "Trabajo unilateral estricto para asegurar un desarrollo parejo en ambos brazos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_One-Arm_Triceps_Extension/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_One-Arm_Triceps_Extension/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_One-Arm_Triceps_Extension/1.jpg"
    ]
  },
  {
    "name": "Fondos de Tríceps entre Bancos (Bench Dips)",
    "muscle_group": "Tríceps",
    "description": "Manos apoyadas en banco tras la espalda. Bajar con el torso vertical rozando el banco hasta 90° de codo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bench_Dips/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bench_Dips/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bench_Dips/1.jpg"
    ]
  },
  {
    "name": "Extensión Unilateral en Polea Alta",
    "muscle_group": "Tríceps",
    "description": "Aislamiento sinérgico con agarre supino o neutro para afinar la definición y control neuromuscular.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_One_Arm_Tricep_Extension/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_One_Arm_Tricep_Extension/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_One_Arm_Tricep_Extension/1.jpg"
    ]
  },
  {
    "name": "Extensión Inclinada de Tríceps con Barra",
    "muscle_group": "Tríceps",
    "description": "En banco inclinado para enfatizar la porción larga del tríceps a lo largo de todo el arco de movimiento.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Barbell_Triceps_Extension/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Barbell_Triceps_Extension/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Barbell_Triceps_Extension/1.jpg"
    ]
  },
  {
    "name": "Elevaciones de Piernas Colgado en Barra",
    "muscle_group": "Core / Abdomen",
    "description": "Colgado de la barra de dominadas. Elevar las rodillas o piernas rectas redondeando la pelvis hacia el pecho sin arquear la espalda.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hanging_Leg_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hanging_Leg_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hanging_Leg_Raise/1.jpg"
    ]
  },
  {
    "name": "Crunches en Polea Alta de Rodillas (Cable Crunch)",
    "muscle_group": "Core / Abdomen",
    "description": "Permite sobrecarga progresiva real en el recto abdominal. Sujetar la cuerda tras la nuca y flexionar la columna hacia los muslos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crunch/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crunch/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crunch/1.jpg"
    ]
  },
  {
    "name": "Rueda Abdominal (Ab Wheel Rollout)",
    "muscle_group": "Core / Abdomen",
    "description": "Fuerza extrema anti-extensión. Rodar hacia adelante manteniendo la pelvis en retroversión sin hundir la zona lumbar.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Ab_Roller/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Ab_Roller/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Ab_Roller/1.jpg"
    ]
  },
  {
    "name": "Plancha Abdominal Isométrica (Front Plank)",
    "muscle_group": "Core / Abdomen",
    "description": "Apoyo sobre antebrazos y puntas de pies. Contraer glúteos, abdomen y cuádriceps manteniendo el cuerpo rígido como una tabla.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Plank/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Plank/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Plank/1.jpg"
    ]
  },
  {
    "name": "Crunches Bicicleta (Air Bike / Bicycle Crunch)",
    "muscle_group": "Core / Abdomen",
    "description": "Rotación controlada del torso llevando el codo hacia la rodilla contraria alternadamente para reclutar oblicuos y recto abdominal.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Air_Bike/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Air_Bike/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Air_Bike/1.jpg"
    ]
  },
  {
    "name": "Crunch en Banco Declinado (Decline Crunch)",
    "muscle_group": "Core / Abdomen",
    "description": "Aumenta el rango de flexión del tronco para una contracción abdominal más intensa y sostenida.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Crunch/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Crunch/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Crunch/1.jpg"
    ]
  },
  {
    "name": "Elevaciones de Piernas Tumbado en Banco Plano",
    "muscle_group": "Core / Abdomen",
    "description": "Sujetarse del banco por detrás de la cabeza y elevar las piernas manteniendo la zona lumbar pegada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Flat_Bench_Lying_Leg_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Flat_Bench_Lying_Leg_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Flat_Bench_Lying_Leg_Raise/1.jpg"
    ]
  },
  {
    "name": "Giros Rusos con Disco o Balón (Russian Twists)",
    "muscle_group": "Core / Abdomen",
    "description": "Torso a 45° del suelo y pies elevados. Rotar el torso de lado a lado para estimular los oblicuos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Russian_Twist/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Russian_Twist/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Russian_Twist/1.jpg"
    ]
  },
  {
    "name": "Leñador en Polea (Cable Woodchoppers)",
    "muscle_group": "Core / Abdomen",
    "description": "Patrón de rotación de torso con tensión constante para desarrollar oblicuos y fuerza rotacional.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Cable_Wood_Chop/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Cable_Wood_Chop/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Cable_Wood_Chop/1.jpg"
    ]
  },
  {
    "name": "Navajas / Jackknife Abdominal",
    "muscle_group": "Core / Abdomen",
    "description": "Flexión simultánea de torso y piernas en el centro formando una V con el cuerpo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Jackknife_Sit-Up/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Jackknife_Sit-Up/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Jackknife_Sit-Up/1.jpg"
    ]
  },
  {
    "name": "Elevaciones de Talones de Pie en Máquina",
    "muscle_group": "Pantorrillas",
    "description": "Enfoque en los gastrocnemios con rodillas extendidas. Pausa de 2 segundos en el estiramiento profundo abajo y 1 segundo arriba.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Calf_Raises/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Calf_Raises/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Calf_Raises/1.jpg"
    ]
  },
  {
    "name": "Elevaciones de Talones Sentado en Máquina",
    "muscle_group": "Pantorrillas",
    "description": "Con rodillas flexionadas a 90° se desactiva el gastrocnemio y se aísla el músculo sóleo.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Calf_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Calf_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Calf_Raise/1.jpg"
    ]
  },
  {
    "name": "Elevaciones de Talones en Máquina Smith",
    "muscle_group": "Pantorrillas",
    "description": "Pisar sobre un disco o escalón con barra en trapecios para gran sobrecarga progresiva.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Calf_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Calf_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Smith_Machine_Calf_Raise/1.jpg"
    ]
  },
  {
    "name": "Elevaciones de Talones en Prensa de Piernas",
    "muscle_group": "Pantorrillas",
    "description": "Puntas de los pies en el borde inferior de la plataforma de la prensa con seguro listo. Gran rango de movimiento.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Calf_Press_On_The_Leg_Press_Machine/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Calf_Press_On_The_Leg_Press_Machine/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Calf_Press_On_The_Leg_Press_Machine/1.jpg"
    ]
  },
  {
    "name": "Elevaciones de Talones Unilateral con Mancuerna",
    "muscle_group": "Pantorrillas",
    "description": "De pie sobre un escalón con una mancuerna en la mano del mismo lado para mayor aislamiento y control.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rocking_Standing_Calf_Raise/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rocking_Standing_Calf_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rocking_Standing_Calf_Raise/1.jpg"
    ]
  },
  {
    "name": "Extensiones de Muñeca con Barra (Extensores)",
    "muscle_group": "Antebrazos",
    "description": "Antebrazos apoyados en banco con palmas hacia abajo. Elevar la barra extendiendo las muñecas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/1.jpg"
    ]
  },
  {
    "name": "Flexiones de Muñeca con Barra (Flexores)",
    "muscle_group": "Antebrazos",
    "description": "Palmas hacia arriba. Dejar rodar la barra por los dedos y flexionar con fuerza los antebrazos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/1.jpg"
    ]
  },
  {
    "name": "Curl de Muñeca tras la Espalda con Barra",
    "muscle_group": "Antebrazos",
    "description": "Barra sostenida por detrás de los glúteos con agarre prono. Flexión pura de muñecas.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl/1.jpg"
    ]
  },
  {
    "name": "Curl Invertido con Barra (Reverse Curl)",
    "muscle_group": "Antebrazos",
    "description": "Agarre prono (palmas hacia abajo). Desarrolla masivamente el braquiorradial y antebrazos.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Reverse_Barbell_Curl/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Reverse_Barbell_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Reverse_Barbell_Curl/1.jpg"
    ]
  },
  {
    "name": "Saltos a la Comba (Jump Rope)",
    "muscle_group": "Cardio",
    "description": "Excelente para acondicionamiento cardiovascular, coordinación neuromuscular y quema calórica.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rope_Jumping/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rope_Jumping/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rope_Jumping/1.jpg"
    ]
  },
  {
    "name": "Caminata con Inclinación en Cinta (Incline Walk)",
    "muscle_group": "Cardio",
    "description": "Cardio de bajo impacto articular. Inclinación al 8-12% a paso ligero de 4.5-5.5 km/h para quemar grasa cuidando la masa muscular.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Walking_Treadmill/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Walking_Treadmill/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Walking_Treadmill/1.jpg"
    ]
  },
  {
    "name": "Trote Continuo en Cinta (Treadmill Jogging)",
    "muscle_group": "Cardio",
    "description": "Acondicionamiento aeróbico constante y resistencia cardiovascular general.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Jogging_Treadmill/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Jogging_Treadmill/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Jogging_Treadmill/1.jpg"
    ]
  },
  {
    "name": "Bicicleta Estática / Spinning",
    "muscle_group": "Cardio",
    "description": "Entrenamiento aeróbico y de resistencia muscular para piernas sin impacto en articulaciones.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bicycling_Stationary/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bicycling_Stationary/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bicycling_Stationary/1.jpg"
    ]
  },
  {
    "name": "Remo Indoor en Máquina (Concept2 Rower)",
    "muscle_group": "Cardio",
    "description": "Ejercicio cardiovascular completo de cuerpo entero que involucra piernas, espalda y brazos en cada palada.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rowing_Stationary/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rowing_Stationary/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rowing_Stationary/1.jpg"
    ]
  },
  {
    "name": "Escaladores / Mountain Climbers",
    "muscle_group": "Cardio",
    "description": "Ejercicio funcional en posición de plancha. Llevar las rodillas alternadamente al pecho a ritmo rápido.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Mountain_Climbers/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Mountain_Climbers/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Mountain_Climbers/1.jpg"
    ]
  },
  {
    "name": "Saltos al Cajón Pliométricos (Box Jumps)",
    "muscle_group": "Cardio",
    "description": "Potencia explosiva para el tren inferior y acondicionamiento metabólico.",
    "video_url": null,
    "gif_url": "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Box_Jump/0.jpg",
    "image_urls": [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Box_Jump/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Box_Jump/1.jpg"
    ]
  }
];
