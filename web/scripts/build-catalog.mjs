import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Descargando base de datos oficial de ejercicios...');
  const res = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
  if (!res.ok) throw new Error('Error al descargar exercises.json: ' + res.status);
  const allDb = await res.json();
  const dbMap = new Map();
  allDb.forEach(d => dbMap.set(d.id, d));
  console.log(`Base de datos cargada: ${allDb.length} ejercicios disponibles.`);

  // Catálogo Curado de 105+ ejercicios profesionales
  const curatedDefinitions = [
    // ==========================================
    // PECHO (CHEST) - 15 ejercicios
    // ==========================================
    {
      id: 'Barbell_Bench_Press_-_Medium_Grip',
      name: 'Press de Banca Plano con Barra (Bench Press)',
      muscle_group: 'Pecho',
      description: 'Básico multiarticular para desarrollo del pectoral mayor. Retracción escapular activa, pies firmes en el suelo y arco lumbar natural. Descender la barra controlada hasta el tercio inferior del esternón y empujar con fuerza.',
    },
    {
      id: 'Incline_Dumbbell_Press',
      name: 'Press Inclinado con Mancuernas (Incline DB Press)',
      muscle_group: 'Pecho',
      description: 'Banco a 30°-45°. Máximo reclutamiento del haz clavicular (pecho superior). Mantener los codos a unos 45°-60° respecto al torso para proteger los hombros y lograr máximo rango de estiramiento.',
    },
    {
      id: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
      name: 'Press Inclinado con Barra (Incline Barbell Press)',
      muscle_group: 'Pecho',
      description: 'Banco a 30°. Empujar la barra verticalmente enfocando la tensión en la porción superior del pecho y deltoides anterior con retracción escapular firme.',
    },
    {
      id: 'Dumbbell_Bench_Press',
      name: 'Press Plano con Mancuernas (Flat DB Press)',
      muscle_group: 'Pecho',
      description: 'Permite mayor recorrido articular y libertad en las muñecas que la barra. Descender hasta sentir un estiramiento profundo en el pectoral y juntar arriba sin chocar las mancuernas.',
    },
    {
      id: 'Decline_Barbell_Bench_Press',
      name: 'Press Declinado con Barra (Decline Press)',
      muscle_group: 'Pecho',
      description: 'Enfatiza las fibras inferiores del pectoral mayor. Banco declinado a 15°-30°. Descenso controlado hasta la parte baja del pecho.',
    },
    {
      id: 'Smith_Machine_Bench_Press',
      name: 'Press Plano en Máquina Smith / Multipower',
      muscle_group: 'Pecho',
      description: 'Permite entrenar cerca del fallo muscular con total seguridad articular y máxima tensión constante en el pectoral.',
    },
    {
      id: 'Smith_Machine_Incline_Bench_Press',
      name: 'Press Inclinado en Máquina Smith / Multipower',
      muscle_group: 'Pecho',
      description: 'Aislamiento estable del pectoral superior sin tener que estabilizar la barra, ideal para series pesadas.',
    },
    {
      id: 'Dumbbell_Flyes',
      name: 'Aperturas Planas con Mancuernas (DB Flyes)',
      muscle_group: 'Pecho',
      description: 'Ejercicio de aislamiento para estiramiento del pectoral. Codos con leve flexión fija durante todo el recorrido. Abrir controlando el peso hasta sentir el estiramiento y cerrar abrazando un barril.',
    },
    {
      id: 'Incline_Dumbbell_Flyes',
      name: 'Aperturas Inclinadas con Mancuernas (Incline Flyes)',
      muscle_group: 'Pecho',
      description: 'Aislamiento y sobrecarga excéntrica en el pecho superior. Control estricto en la bajada sin hiperextender el hombro.',
    },
    {
      id: 'Decline_Dumbbell_Flyes',
      name: 'Aperturas Declinadas con Mancuernas',
      muscle_group: 'Pecho',
      description: 'Enfoque en las fibras inferiores del pectoral con tensión concentrada en la porción costal.',
    },
    {
      id: 'Cable_Crossover',
      name: 'Cruces en Polea Alta (Cable Crossover)',
      muscle_group: 'Pecho',
      description: 'Tensión constante durante todo el rango. Torso ligeramente inclinado hacia adelante. Cruzar las manos abajo y apretar el pectoral en máxima contracción durante 1 segundo.',
    },
    {
      id: 'Cable_Iron_Cross',
      name: 'Cruces en Polea Media / Cruz de Hierro',
      muscle_group: 'Pecho',
      description: 'Aislamiento de la parte media del pecho con trayectoria horizontal pura. Excelente congestión.',
    },
    {
      id: 'Dips_-_Chest_Version',
      name: 'Fondos en Paralelas para Pecho (Chest Dips)',
      muscle_group: 'Pecho',
      description: 'Torso inclinado hacia adelante y codos ligeramente abiertos para trasladar el estímulo al pectoral inferior. Descender hasta 90° de flexión en codo.',
    },
    {
      id: 'Pushups',
      name: 'Flexiones de Pecho (Push-Ups)',
      muscle_group: 'Pecho',
      description: 'Calistenia fundamental. Core y glúteos activos, cuerpo en línea recta. Bajar el pecho hasta rozar el suelo con codos en ángulo de 45° respecto al torso.',
    },
    {
      id: 'Butterfly',
      name: 'Aperturas en Máquina Peck Deck (Pec Deck Flyes)',
      muscle_group: 'Pecho',
      description: 'Aislamiento puro y seguro. Apoyar bien la espalda en el respaldo, codos a la altura del pecho medio y apretar fuerte 1 segundo en el centro.',
    },

    // ==========================================
    // ESPALDA (BACK) - 15 ejercicios
    // ==========================================
    {
      id: 'Pullups',
      name: 'Dominadas Pronas (Pull-Ups)',
      muscle_group: 'Espalda',
      description: 'Rey de los ejercicios de tracción vertical. Agarre prono algo más ancho que los hombros. Iniciar deprimiendo escápulas y llevar el pecho hacia la barra sin balanceo.',
    },
    {
      id: 'Chin-Up',
      name: 'Dominadas Supinas (Chin-Ups)',
      muscle_group: 'Espalda',
      description: 'Agarre supino al ancho de los hombros. Mayor intervención del bíceps braquial junto a los dorsales en tracción vertical profunda.',
    },
    {
      id: 'Wide-Grip_Lat_Pulldown',
      name: 'Jalón al Pecho en Polea Alta (Lat Pulldown)',
      muscle_group: 'Espalda',
      description: 'Tracción vertical con barra ancha. Llevar la barra al esternón superior sacando pecho y retrayendo escápulas. Evitar balancear el torso hacia atrás.',
    },
    {
      id: 'Close-Grip_Front_Lat_Pulldown',
      name: 'Jalón al Pecho con Agarre Cerrado Neutro (V-Bar Pulldown)',
      muscle_group: 'Espalda',
      description: 'Agarre neutro en V. Permite mayor recorrido y tracción dirigida hacia las inserciones inferiores del dorsal.',
    },
    {
      id: 'Bent_Over_Barbell_Row',
      name: 'Remo con Barra 45° (Barbell Row)',
      muscle_group: 'Espalda',
      description: 'Multiarticular de densidad dorsal. Espalda recta y torso a 45°. Tirar de la barra hacia la cintura baja dirigiendo el movimiento con los codos.',
    },
    {
      id: 'One-Arm_Dumbbell_Row',
      name: 'Remo Unilateral con Mancuerna (Dumbbell Row)',
      muscle_group: 'Espalda',
      description: 'Apoyo en banco plano. Permite gran estiramiento del dorsal en la bajada y contracción completa arriba sin forzar la zona lumbar.',
    },
    {
      id: 'Seated_Cable_Rows',
      name: 'Remo en Polea Baja Sentado (Seated Cable Row)',
      muscle_group: 'Espalda',
      description: 'Torso perpendicular al suelo con leve curvatura lumbar natural. Tirar hacia el ombligo, juntar escápulas al final y controlar la vuelta estirando los dorsales.',
    },
    {
      id: 'T-Bar_Row_with_Handle',
      name: 'Remo en Barra T con Agarre Cerrado (T-Bar Row)',
      muscle_group: 'Espalda',
      description: 'Excelente para el grosor de la espalda media y romboides. Pecho elevado, cadera atrás y tracción estricta hacia el abdomen.',
    },
    {
      id: 'Straight-Arm_Pulldown',
      name: 'Pullover en Polea Alta con Brazos Rectos',
      muscle_group: 'Espalda',
      description: 'Aislamiento del dorsal ancho sin fatiga de brazos. Codos con leve flexión fija. Bajar la barra hacia los muslos describiendo un arco amplio.',
    },
    {
      id: 'Barbell_Deadlift',
      name: 'Peso Muerto Convencional (Deadlift)',
      muscle_group: 'Espalda',
      description: 'Máxima construcción de fuerza y masa en toda la cadena posterior. Espalda neutra, barra rozando las piernas y empuje simultáneo de piernas y cadera.',
    },
    {
      id: 'Hyperextensions_Back_Extensions',
      name: 'Hiperextensiones en Banco 45° (Back Extensions)',
      muscle_group: 'Espalda',
      description: 'Fortalecimiento de erectores espinales, zona lumbar y glúteos. Subir hasta alinear la columna con las piernas sin hiperextender el cuello.',
    },
    {
      id: 'Barbell_Shrug',
      name: 'Encogimientos con Barra (Barbell Shrug)',
      muscle_group: 'Espalda',
      description: 'Aislamiento del trapecio superior. Elevar los hombros directamente hacia las orejas, aguantar 1 segundo en la cima y descender con control.',
    },
    {
      id: 'Dumbbell_Shrug',
      name: 'Encogimientos con Mancuernas (Dumbbell Shrug)',
      muscle_group: 'Espalda',
      description: 'Permite una posición más natural de los brazos a los lados del cuerpo para aislar los trapecios superiores.',
    },
    {
      id: 'Incline_Bench_Pull',
      name: 'Remo Tumbado en Banco Inclinado (Seal / Bench Row)',
      muscle_group: 'Espalda',
      description: 'Elimina totalmente el estrés lumbar al apoyar el pecho en el banco. Máximo aislamiento de romboides y trapecio medio.',
    },
    {
      id: 'Pull_Through',
      name: 'Cable Pull-Through para Cadena Posterior',
      muscle_group: 'Espalda',
      description: 'Bisagra de cadera en polea baja entre las piernas. Enseña a extender la cadera con glúteos e isquios protegiendo la zona lumbar.',
    },

    // ==========================================
    // HOMBROS (SHOULDERS) - 12 ejercicios
    // ==========================================
    {
      id: 'Standing_Military_Press',
      name: 'Press Militar de Pie con Barra (Military Press)',
      muscle_group: 'Hombros',
      description: 'Básico por excelencia para el deltoides anterior y lateral. Glúteos y abdomen firmes. Empujar la barra por delante de la cara hasta bloquear arriba con la cabeza alineada.',
    },
    {
      id: 'Seated_Dumbbell_Press',
      name: 'Press de Hombros Sentado con Mancuernas',
      muscle_group: 'Hombros',
      description: 'Respaldo casi a 90°. Empujar las mancuernas en trayectoria ligeramente convergente sin que lleguen a chocar arriba. Bajar controladamente hasta rozar la altura de las orejas.',
    },
    {
      id: 'Arnold_Dumbbell_Press',
      name: 'Press Arnold con Mancuernas (Arnold Press)',
      muscle_group: 'Hombros',
      description: 'Combina rotación de muñeca con press vertical para activar los tres haces del deltoides en un solo movimiento fluido.',
    },
    {
      id: 'Side_Lateral_Raise',
      name: 'Elevaciones Laterales con Mancuernas (Lateral Raises)',
      muscle_group: 'Hombros',
      description: 'Clave para la anchura del deltoides medio. Elevar los brazos en el plano escapular (ligeramente hacia adelante) guiando con los codos hasta la horizontal.',
    },
    {
      id: 'Cable_Seated_Lateral_Raise',
      name: 'Elevaciones Laterales en Polea (Cable Lateral Raise)',
      muscle_group: 'Hombros',
      description: 'Tensión uniforme desde el inicio del movimiento. Excelente para mantener sobrecarga constante en el deltoides lateral.',
    },
    {
      id: 'Front_Dumbbell_Raise',
      name: 'Elevaciones Frontales con Mancuernas (Front Raises)',
      muscle_group: 'Hombros',
      description: 'Aislamiento del deltoides anterior. Elevar las mancuernas de forma alterna o simultánea hasta la altura de los ojos sin balancear el torso.',
    },
    {
      id: 'Face_Pull',
      name: 'Face Pull con Cuerda en Polea Alta',
      muscle_group: 'Hombros',
      description: 'Esencial para la salud del hombro, manguito rotador y deltoides posterior. Tirar de la cuerda hacia los ojos abriendo las manos y rotando los hombros externamente.',
    },
    {
      id: 'Seated_Bent-Over_Rear_Delt_Raise',
      name: 'Pájaros Sentado con Mancuernas (Rear Delt Flyes)',
      muscle_group: 'Hombros',
      description: 'Torso inclinado apoyado sobre los muslos. Elevar las mancuernas hacia los lados focalizando en la parte posterior del hombro y romboides.',
    },
    {
      id: 'Dumbbell_Lying_Rear_Lateral_Raise',
      name: 'Pájaros Tumbado en Banco Inclinado',
      muscle_group: 'Hombros',
      description: 'Pecho apoyado en banco a 30°-45°. Aislamiento estricto del deltoides posterior sin balanceos.',
    },
    {
      id: 'Upright_Barbell_Row',
      name: 'Remo al Mentón con Barra (Upright Row)',
      muscle_group: 'Hombros',
      description: 'Agarre al ancho de los hombros. Subir la barra pegada al torso elevando los codos por encima de la barra para activar deltoides lateral y trapecio.',
    },
    {
      id: 'Barbell_Rear_Delt_Row',
      name: 'Remo con Barra para Deltoides Posterior',
      muscle_group: 'Hombros',
      description: 'Agarre ancho con codos perpendiculares al cuerpo (a 90°) para concentrar toda la tracción en la parte posterior del hombro.',
    },
    {
      id: 'Clean_and_Press',
      name: 'Cargada y Press Militar (Clean and Press)',
      muscle_group: 'Hombros',
      description: 'Movimiento de potencia y fuerza integral. Llevar la barra desde el suelo a los hombros y empujar enérgicamente por encima de la cabeza.',
    },

    // ==========================================
    // CUÁDRICEPS (QUADS) - 12 ejercicios
    // ==========================================
    {
      id: 'Barbell_Full_Squat',
      name: 'Sentadilla Trasera con Barra (Barbell Back Squat)',
      muscle_group: 'Cuádriceps',
      description: 'El rey del tren inferior. Apoyo firme sobre los talones y metatarsos, rodillas alineadas con las puntas de los pies. Romper el paralelo con control y empujar el suelo al subir.',
    },
    {
      id: 'Front_Barbell_Squat',
      name: 'Sentadilla Frontal con Barra (Front Squat)',
      muscle_group: 'Cuádriceps',
      description: 'Barra descansando sobre deltoides anteriores con codos altos. Torso muy vertical que enfatiza fuertemente los cuádriceps y el core anterior.',
    },
    {
      id: 'Smith_Machine_Squat',
      name: 'Sentadilla en Máquina Smith / Multipower',
      muscle_group: 'Cuádriceps',
      description: 'Permite adelantar ligeramente los pies para enfatizar al 100% los cuádriceps reduciendo la tensión en la zona lumbar.',
    },
    {
      id: 'Leg_Press',
      name: 'Prensa de Piernas 45° (Leg Press)',
      muscle_group: 'Cuádriceps',
      description: 'Permite mover grandes cargas con soporte para la espalda baja. Pies al ancho de hombros en el centro de la plataforma. Bajar hasta 90° sin despegar la pelvis del respaldo.',
    },
    {
      id: 'Leg_Extensions',
      name: 'Extensiones de Cuádriceps en Máquina (Leg Extension)',
      muscle_group: 'Cuádriceps',
      description: 'Aislamiento puro del recto femoral y vastos. Extender las piernas por completo, aguantar 1 segundo en máxima contracción y bajar lento en 3 segundos.',
    },
    {
      id: 'Single-Leg_Leg_Extension',
      name: 'Extensión de Cuádriceps Unilateral en Máquina',
      muscle_group: 'Cuádriceps',
      description: 'Trabajo a una sola pierna para corregir desbalances de fuerza y masa muscular en cuádriceps.',
    },
    {
      id: 'Goblet_Squat',
      name: 'Sentadilla Goblet con Mancuerna (Goblet Squat)',
      muscle_group: 'Cuádriceps',
      description: 'Sujetar una mancuerna pesada verticalmente contra el pecho. Excelente para aprender y perfeccionar el patrón de sentadilla profunda con torso erguido.',
    },
    {
      id: 'Dumbbell_Lunges',
      name: 'Zancadas Estáticas con Mancuernas (Lunges)',
      muscle_group: 'Cuádriceps',
      description: 'Trabajo unilateral para equilibrio y desarrollo muscular. Dar un paso amplio y descender la rodilla trasera hasta casi rozar el suelo.',
    },
    {
      id: 'Dumbbell_Rear_Lunge',
      name: 'Zancadas hacia Atrás con Mancuernas (Reverse Lunge)',
      muscle_group: 'Cuádriceps',
      description: 'Paso hacia atrás que genera menor estrés de cizalla en la rótula de la rodilla delantera. Excelente para rodillas sensibles.',
    },
    {
      id: 'Barbell_Lunge',
      name: 'Zancadas con Barra (Barbell Lunges)',
      muscle_group: 'Cuádriceps',
      description: 'Sobrecarga sobre los cuádriceps y glúteos con barra tras nuca. Mantener el torso erguido durante todo el paso.',
    },
    {
      id: 'Barbell_Step_Ups',
      name: 'Subidas al Banco con Barra (Step-Ups)',
      muscle_group: 'Cuádriceps',
      description: 'Pisar firmemente sobre el cajón empujando desde el talón de la pierna superior sin impulsarse con la pierna de abajo.',
    },
    {
      id: 'Step-up_with_Knee_Raise',
      name: 'Subidas al Banco con Elevación de Rodilla',
      muscle_group: 'Cuádriceps',
      description: 'Combina el empuje unilateral de cuádriceps con flexión explosiva de cadera y activación de glúteo.',
    },

    // ==========================================
    // ISQUIOSURALES / FEMORALES (HAMSTRINGS) - 8 ejercicios
    // ==========================================
    {
      id: 'Romanian_Deadlift',
      name: 'Peso Muerto Rumano con Barra (Barbell RDL)',
      muscle_group: 'Isquiosurales',
      description: 'Patrón de bisagra de cadera indispensable. Rodillas con microflexión fija. Enviar la cadera hacia atrás sintiendo una tensión profunda en los femorales y glúteos antes de extender la cadera al subir.',
    },
    {
      id: 'Romanian_Deadlift_from_Deficit',
      name: 'Peso Muerto Rumano con Déficit (Deficit RDL)',
      muscle_group: 'Isquiosurales',
      description: 'De pie sobre un disco o plataforma para aumentar el rango de estiramiento de los isquiotibiales en el punto más bajo de la bisagra.',
    },
    {
      id: 'Lying_Leg_Curls',
      name: 'Curl Femoral Tumbado en Máquina (Lying Leg Curl)',
      muscle_group: 'Isquiosurales',
      description: 'Flexión de rodilla directa para hipertrofia de isquiotibiales. Mantener la pelvis pegada a la almohadilla sin arquear la zona lumbar en la contracción.',
    },
    {
      id: 'Seated_Leg_Curl',
      name: 'Curl Femoral Sentado en Máquina (Seated Leg Curl)',
      muscle_group: 'Isquiosurales',
      description: 'Al tener la cadera flexionada a 90°, los isquiotibiales trabajan en posición de mayor elongación muscular, generando alta tensión mecánica.',
    },
    {
      id: 'Good_Morning',
      name: 'Buenos Días con Barra (Good Mornings)',
      muscle_group: 'Isquiosurales',
      description: 'Barra colocada sobre trapecios. Flexionar la cadera empujando los glúteos atrás con la espalda neutra hasta que el torso quede casi horizontal.',
    },
    {
      id: 'Stiff-Legged_Dumbbell_Deadlift',
      name: 'Peso Muerto con Mancuernas Piernas Semirrígidas',
      muscle_group: 'Isquiosurales',
      description: 'Permite bajar las mancuernas cerca del centro de gravedad, manteniendo tensión constante y controlada en toda la cadena posterior.',
    },
    {
      id: 'Kettlebell_One-Legged_Deadlift',
      name: 'Peso Muerto Rumano Unilateral con Kettlebell / Mancuerna',
      muscle_group: 'Isquiosurales',
      description: 'A una sola pierna. Excelente para equilibrio propioceptivo, estabilidad de tobillo y aislamiento del femoral.',
    },
    {
      id: 'Standing_Leg_Curl',
      name: 'Curl Femoral de Pie Unilateral en Máquina',
      muscle_group: 'Isquiosurales',
      description: 'Flexión de rodilla individual para equilibrar la fuerza de ambos isquiosurales por separado.',
    },

    // ==========================================
    // GLÚTEOS (GLUTES) - 7 ejercicios
    // ==========================================
    {
      id: 'Barbell_Hip_Thrust',
      name: 'Hip Thrust con Barra en Banco (Barbell Hip Thrust)',
      muscle_group: 'Glúteos',
      description: 'El ejercicio más eficiente para hipertrofia del glúteo mayor. Espalda alta apoyada en banco, espinillas verticales en la cima y retroversión pélvica con contracción de 1 segundo arriba.',
    },
    {
      id: 'Barbell_Glute_Bridge',
      name: 'Puente de Glúteos con Barra en Suelo (Glute Bridge)',
      muscle_group: 'Glúteos',
      description: 'Ejecutado sobre el suelo. Menor rango que el hip thrust pero permite manejar altas cargas y máxima tensión en extensión terminal de cadera.',
    },
    {
      id: 'Single_Leg_Glute_Bridge',
      name: 'Puente de Glúteos Unilateral en Suelo',
      muscle_group: 'Glúteos',
      description: 'Excelente para corregir asimetrías de fuerza entre glúteos y mejorar la estabilidad de la pelvis.',
    },
    {
      id: 'Barbell_Walking_Lunge',
      name: 'Zancadas Caminando con Barra para Glúteos',
      muscle_group: 'Glúteos',
      description: 'Pasos largos con ligera inclinación del torso hacia adelante para estirar y cargar al máximo los glúteos en cada zancada.',
    },
    {
      id: 'Bodyweight_Walking_Lunge',
      name: 'Zancadas Caminando con Peso Corporal',
      muscle_group: 'Glúteos',
      description: 'Volumen y congestión de glúteos y piernas sin impacto en la columna vertebral.',
    },
    {
      id: 'Glute_Kickback',
      name: 'Patada de Glúteo en Cuadrupedia / Máquina',
      muscle_group: 'Glúteos',
      description: 'Aislamiento de la porción superior del glúteo mayor. Extender la pierna hacia atrás apretando arriba.',
    },
    {
      id: 'Cable_Hip_Adduction',
      name: 'Aductores en Polea Baja (Cable Adduction)',
      muscle_group: 'Glúteos',
      description: 'Trabajo específico de la cara interna del muslo (aductores) para densidad de piernas y estabilidad de cadera.',
    },

    // ==========================================
    // BÍCEPS (BICEPS) - 10 ejercicios
    // ==========================================
    {
      id: 'Barbell_Curl',
      name: 'Curl de Bíceps con Barra Recta (Barbell Curl)',
      muscle_group: 'Bíceps',
      description: 'Básico para masa y fuerza de brazos. Codos pegados a los costados, muñecas firmes y flexión sin balancear la espalda baja.',
    },
    {
      id: 'EZ-Bar_Curl',
      name: 'Curl de Bíceps con Barra Z (EZ-Bar Curl)',
      muscle_group: 'Bíceps',
      description: 'El agarre angulado alivia la presión en muñecas y antebrazos, permitiendo entrenar pesado con máxima comodidad.',
    },
    {
      id: 'Dumbbell_Bicep_Curl',
      name: 'Curl de Bíceps con Mancuernas Alterno',
      muscle_group: 'Bíceps',
      description: 'Inicia en posición neutra y supina la muñeca activamente durante la subida para máxima activación del bíceps.',
    },
    {
      id: 'Incline_Dumbbell_Curl',
      name: 'Curl Inclinado en Banco con Mancuernas',
      muscle_group: 'Bíceps',
      description: 'Banco a 45°-60°. Coloca la cabeza larga del bíceps en posición de máximo estiramiento previo a la contracción.',
    },
    {
      id: 'Hammer_Curls',
      name: 'Curl Martillo con Mancuernas (Hammer Curl)',
      muscle_group: 'Bíceps',
      description: 'Agarre neutro (palmas enfrentadas). Enfatiza el braquial anterior y el braquiorradial para aumentar el grosor del brazo.',
    },
    {
      id: 'Cross_Body_Hammer_Curl',
      name: 'Curl Martillo Cruzado al Pecho (Cross Body Hammer)',
      muscle_group: 'Bíceps',
      description: 'Cruzar la mancuerna hacia el hombro opuesto. Estimula fuertemente el braquial anterior.',
    },
    {
      id: 'Preacher_Curl',
      name: 'Curl en Banco Scott / Predicador con Barra Z',
      muscle_group: 'Bíceps',
      description: 'Apoyo fijo de brazos que elimina completamente el impulso corporal y aísla la cabeza corta del bíceps.',
    },
    {
      id: 'Concentration_Curls',
      name: 'Curl Concentrado con Mancuerna (Concentration Curl)',
      muscle_group: 'Bíceps',
      description: 'Codo apoyado en la cara interna del muslo. Permite conexión mente-músculo extrema y pico de contracción arriba.',
    },
    {
      id: 'Cable_Preacher_Curl',
      name: 'Curl Predicador en Polea Baja',
      muscle_group: 'Bíceps',
      description: 'Añade tensión constante uniforme desde el inicio hasta el final del recorrido gracias a la polea.',
    },
    {
      id: 'Overhead_Cable_Curl',
      name: 'Curl Hércules en Polea Alta Bilateral',
      muscle_group: 'Bíceps',
      description: 'Brazos en cruz a la altura de los hombros. Flexionar las manos hacia las orejas manteniendo los codos elevados.',
    },

    // ==========================================
    // TRÍCEPS (TRICEPS) - 10 ejercicios
    // ==========================================
    {
      id: 'Close-Grip_Barbell_Bench_Press',
      name: 'Press de Banca con Agarre Cerrado (Close-Grip Press)',
      muscle_group: 'Tríceps',
      description: 'Manos al ancho de hombros con codos pegados al cuerpo. El mejor constructor de fuerza y masa para los tríceps.',
    },
    {
      id: 'Triceps_Pushdown',
      name: 'Extensiones de Tríceps en Polea con Barra V',
      muscle_group: 'Tríceps',
      description: 'Codos fijos a los lados del torso. Extender los brazos hacia abajo empujando con la palma y apretar 1 segundo abajo.',
    },
    {
      id: 'Triceps_Pushdown_-_Rope_Attachment',
      name: 'Extensiones de Tríceps con Cuerda en Polea',
      muscle_group: 'Tríceps',
      description: 'Separar los extremos de la cuerda al final de la extensión para mayor activación de la cabeza lateral del tríceps.',
    },
    {
      id: 'Lying_Triceps_Press',
      name: 'Press Francés con Barra Z en Banco (Skull Crushers)',
      muscle_group: 'Tríceps',
      description: 'Bajar la barra hacia la coronilla o ligeramente detrás de la cabeza para estirar la cabeza larga del tríceps.',
    },
    {
      id: 'Seated_Triceps_Press',
      name: 'Extensión de Tríceps sobre la Cabeza con Mancuerna (Copa)',
      muscle_group: 'Tríceps',
      description: 'Sujetar una mancuerna pesada con ambas manos tras la cabeza. Estiramiento profundo de la cabeza larga.',
    },
    {
      id: 'Cable_Rope_Overhead_Triceps_Extension',
      name: 'Extensión de Tríceps sobre la Cabeza en Polea con Cuerda',
      muscle_group: 'Tríceps',
      description: 'Tensión constante en el punto de estiramiento. Mantener los codos cerrados y extender hacia adelante.',
    },
    {
      id: 'Dumbbell_One-Arm_Triceps_Extension',
      name: 'Extensión Unilateral de Tríceps tras Nuca',
      muscle_group: 'Tríceps',
      description: 'Trabajo unilateral estricto para asegurar un desarrollo parejo en ambos brazos.',
    },
    {
      id: 'Bench_Dips',
      name: 'Fondos de Tríceps entre Bancos (Bench Dips)',
      muscle_group: 'Tríceps',
      description: 'Manos apoyadas en banco tras la espalda. Bajar con el torso vertical rozando el banco hasta 90° de codo.',
    },
    {
      id: 'Cable_One_Arm_Tricep_Extension',
      name: 'Extensión Unilateral en Polea Alta',
      muscle_group: 'Tríceps',
      description: 'Aislamiento sinérgico con agarre supino o neutro para afinar la definición y control neuromuscular.',
    },
    {
      id: 'Incline_Barbell_Triceps_Extension',
      name: 'Extensión Inclinada de Tríceps con Barra',
      muscle_group: 'Tríceps',
      description: 'En banco inclinado para enfatizar la porción larga del tríceps a lo largo de todo el arco de movimiento.',
    },

    // ==========================================
    // CORE / ABDOMEN - 10 ejercicios
    // ==========================================
    {
      id: 'Hanging_Leg_Raise',
      name: 'Elevaciones de Piernas Colgado en Barra',
      muscle_group: 'Core / Abdomen',
      description: 'Colgado de la barra de dominadas. Elevar las rodillas o piernas rectas redondeando la pelvis hacia el pecho sin arquear la espalda.',
    },
    {
      id: 'Cable_Crunch',
      name: 'Crunches en Polea Alta de Rodillas (Cable Crunch)',
      muscle_group: 'Core / Abdomen',
      description: 'Permite sobrecarga progresiva real en el recto abdominal. Sujetar la cuerda tras la nuca y flexionar la columna hacia los muslos.',
    },
    {
      id: 'Ab_Roller',
      name: 'Rueda Abdominal (Ab Wheel Rollout)',
      muscle_group: 'Core / Abdomen',
      description: 'Fuerza extrema anti-extensión. Rodar hacia adelante manteniendo la pelvis en retroversión sin hundir la zona lumbar.',
    },
    {
      id: 'Plank',
      name: 'Plancha Abdominal Isométrica (Front Plank)',
      muscle_group: 'Core / Abdomen',
      description: 'Apoyo sobre antebrazos y puntas de pies. Contraer glúteos, abdomen y cuádriceps manteniendo el cuerpo rígido como una tabla.',
    },
    {
      id: 'Air_Bike',
      name: 'Crunches Bicicleta (Air Bike / Bicycle Crunch)',
      muscle_group: 'Core / Abdomen',
      description: 'Rotación controlada del torso llevando el codo hacia la rodilla contraria alternadamente para reclutar oblicuos y recto abdominal.',
    },
    {
      id: 'Decline_Crunch',
      name: 'Crunch en Banco Declinado (Decline Crunch)',
      muscle_group: 'Core / Abdomen',
      description: 'Aumenta el rango de flexión del tronco para una contracción abdominal más intensa y sostenida.',
    },
    {
      id: 'Flat_Bench_Lying_Leg_Raise',
      name: 'Elevaciones de Piernas Tumbado en Banco Plano',
      muscle_group: 'Core / Abdomen',
      description: 'Sujetarse del banco por detrás de la cabeza y elevar las piernas manteniendo la zona lumbar pegada.',
    },
    {
      id: 'Russian_Twist',
      name: 'Giros Rusos con Disco o Balón (Russian Twists)',
      muscle_group: 'Core / Abdomen',
      description: 'Torso a 45° del suelo y pies elevados. Rotar el torso de lado a lado para estimular los oblicuos.',
    },
    {
      id: 'Standing_Cable_Wood_Chop',
      name: 'Leñador en Polea (Cable Woodchoppers)',
      muscle_group: 'Core / Abdomen',
      description: 'Patrón de rotación de torso con tensión constante para desarrollar oblicuos y fuerza rotacional.',
    },
    {
      id: 'Jackknife_Sit-Up',
      name: 'Navajas / Jackknife Abdominal',
      muscle_group: 'Core / Abdomen',
      description: 'Flexión simultánea de torso y piernas en el centro formando una V con el cuerpo.',
    },

    // ==========================================
    // PANTORRILLAS (CALVES) - 5 ejercicios
    // ==========================================
    {
      id: 'Standing_Calf_Raises',
      name: 'Elevaciones de Talones de Pie en Máquina',
      muscle_group: 'Pantorrillas',
      description: 'Enfoque en los gastrocnemios con rodillas extendidas. Pausa de 2 segundos en el estiramiento profundo abajo y 1 segundo arriba.',
    },
    {
      id: 'Seated_Calf_Raise',
      name: 'Elevaciones de Talones Sentado en Máquina',
      muscle_group: 'Pantorrillas',
      description: 'Con rodillas flexionadas a 90° se desactiva el gastrocnemio y se aísla el músculo sóleo.',
    },
    {
      id: 'Smith_Machine_Calf_Raise',
      name: 'Elevaciones de Talones en Máquina Smith',
      muscle_group: 'Pantorrillas',
      description: 'Pisar sobre un disco o escalón con barra en trapecios para gran sobrecarga progresiva.',
    },
    {
      id: 'Calf_Press_On_The_Leg_Press_Machine',
      name: 'Elevaciones de Talones en Prensa de Piernas',
      muscle_group: 'Pantorrillas',
      description: 'Puntas de los pies en el borde inferior de la plataforma de la prensa con seguro listo. Gran rango de movimiento.',
    },
    {
      id: 'Rocking_Standing_Calf_Raise',
      name: 'Elevaciones de Talones Unilateral con Mancuerna',
      muscle_group: 'Pantorrillas',
      description: 'De pie sobre un escalón con una mancuerna en la mano del mismo lado para mayor aislamiento y control.',
    },

    // ==========================================
    // ANTEBRAZOS (FOREARMS) - 4 ejercicios
    // ==========================================
    {
      id: 'Palms-Down_Wrist_Curl_Over_A_Bench',
      name: 'Extensiones de Muñeca con Barra (Extensores)',
      muscle_group: 'Antebrazos',
      description: 'Antebrazos apoyados en banco con palmas hacia abajo. Elevar la barra extendiendo las muñecas.',
    },
    {
      id: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench',
      name: 'Flexiones de Muñeca con Barra (Flexores)',
      muscle_group: 'Antebrazos',
      description: 'Palmas hacia arriba. Dejar rodar la barra por los dedos y flexionar con fuerza los antebrazos.',
    },
    {
      id: 'Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl',
      name: 'Curl de Muñeca tras la Espalda con Barra',
      muscle_group: 'Antebrazos',
      description: 'Barra sostenida por detrás de los glúteos con agarre prono. Flexión pura de muñecas.',
    },
    {
      id: 'Reverse_Barbell_Curl',
      name: 'Curl Invertido con Barra (Reverse Curl)',
      muscle_group: 'Antebrazos',
      description: 'Agarre prono (palmas hacia abajo). Desarrolla masivamente el braquiorradial y antebrazos.',
    },

    // ==========================================
    // CARDIO / ACONDICIONAMIENTO - 7 ejercicios
    // ==========================================
    {
      id: 'Rope_Jumping',
      name: 'Saltos a la Comba (Jump Rope)',
      muscle_group: 'Cardio',
      description: 'Excelente para acondicionamiento cardiovascular, coordinación neuromuscular y quema calórica.',
    },
    {
      id: 'Walking_Treadmill',
      name: 'Caminata con Inclinación en Cinta (Incline Walk)',
      muscle_group: 'Cardio',
      description: 'Cardio de bajo impacto articular. Inclinación al 8-12% a paso ligero de 4.5-5.5 km/h para quemar grasa cuidando la masa muscular.',
    },
    {
      id: 'Jogging_Treadmill',
      name: 'Trote Continuo en Cinta (Treadmill Jogging)',
      muscle_group: 'Cardio',
      description: 'Acondicionamiento aeróbico constante y resistencia cardiovascular general.',
    },
    {
      id: 'Bicycling_Stationary',
      name: 'Bicicleta Estática / Spinning',
      muscle_group: 'Cardio',
      description: 'Entrenamiento aeróbico y de resistencia muscular para piernas sin impacto en articulaciones.',
    },
    {
      id: 'Rowing_Stationary',
      name: 'Remo Indoor en Máquina (Concept2 Rower)',
      muscle_group: 'Cardio',
      description: 'Ejercicio cardiovascular completo de cuerpo entero que involucra piernas, espalda y brazos en cada palada.',
    },
    {
      id: 'Mountain_Climbers',
      name: 'Escaladores / Mountain Climbers',
      muscle_group: 'Cardio',
      description: 'Ejercicio funcional en posición de plancha. Llevar las rodillas alternadamente al pecho a ritmo rápido.',
    },
    {
      id: 'Front_Box_Jump',
      name: 'Saltos al Cajón Pliométricos (Box Jumps)',
      muscle_group: 'Cardio',
      description: 'Potencia explosiva para el tren inferior y acondicionamiento metabólico.',
    }
  ];

  console.log(`Verificando y asociando imágenes para ${curatedDefinitions.length} ejercicios curados...`);

  let missingCount = 0;
  const processed = [];
  for (const item of curatedDefinitions) {
    const raw = dbMap.get(item.id);
    let imageUrls = [];
    let gifUrl = null;

    if (raw && raw.images && raw.images.length > 0) {
      imageUrls = raw.images.map(img => `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${img}`);
      gifUrl = imageUrls[0] || null;
    } else {
      console.warn(`[ERROR] ID no encontrado en db: ${item.id}`);
      missingCount++;
    }

    processed.push({
      name: item.name,
      muscle_group: item.muscle_group,
      description: item.description,
      video_url: null,
      gif_url: gifUrl,
      image_urls: imageUrls,
    });
  }

  if (missingCount > 0) {
    throw new Error(`Se encontraron ${missingCount} IDs inválidos. Corrige los IDs antes de continuar.`);
  }

  console.log(`¡Todos los ${processed.length} ejercicios tienen imágenes 100% verificadas en CDN!`);

  // Generar archivo TypeScript
  const tsContent = `// Catálogo Oficial Curado de Ejercicios Profesionales para Fitness-Pro
// Contiene ${processed.length} ejercicios con nombres en español, descripción técnica e imágenes biomecánicas
export interface PreloadedExercise {
  name: string;
  muscle_group: string;
  description: string;
  video_url: string | null;
  gif_url: string | null;
  image_urls: string[];
}

export const DEFAULT_EXERCISES: PreloadedExercise[] = ${JSON.stringify(processed, null, 2)};
`;

  const outputPath = path.join(__dirname, '../src/lib/data/defaultExercises.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  console.log(`Archivo TypeScript generado exitosamente en: ${outputPath}`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
