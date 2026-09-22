const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function generateManual() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 36, bottom: 36, left: 36, right: 36 },
    bufferPages: true,
    info: {
      Title: 'Manual de Usuario - Fitness Pro',
      Author: 'Fitness Pro Team',
      Subject: 'Guía de Inicio Rápido, Funciones y Beneficios para el Alumno',
      Keywords: 'fitness, manual, alumno, entrenamiento, calorias, rutinas',
    },
  });

  const outputWebPath = path.join(__dirname, '..', 'public', 'Manual_Fitness_Pro.pdf');
  const outputArtifactPath = path.join(
    'C:',
    'Users',
    'germa',
    '.gemini',
    'antigravity',
    'brain',
    'bc1aacba-5a01-4e0d-9450-9c8be20b0918',
    'Manual_Fitness_Pro.pdf'
  );

  const writeStream = fs.createWriteStream(outputWebPath);
  doc.pipe(writeStream);

  const primaryEmerald = '#059669';
  const darkEmerald = '#064e3b';
  const lightEmeraldBg = '#ecfdf5';
  const borderEmerald = '#a7f3d0';
  const textDark = '#0f172a';
  const textGray = '#475569';
  const textLightGray = '#64748b';
  const cardBg = '#f8fafc';
  const cardBorder = '#e2e8f0';

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 523.28

  // Helper: Card box
  function drawCard(x, y, w, h, bg = cardBg, stroke = cardBorder) {
    doc.save();
    doc.roundedRect(x, y, w, h, 6).fillColor(bg).fill();
    doc.roundedRect(x, y, w, h, 6).lineWidth(1).strokeColor(stroke).stroke();
    doc.restore();
  }

  // Helper: Section title badge
  function drawSectionBadge(num, title, y) {
    const badgeW = 20;
    const badgeH = 20;
    doc.save();
    doc.roundedRect(margin, y, badgeW, badgeH, 4).fillColor(primaryEmerald).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
    doc.text(String(num), margin, y + 4.5, { width: badgeW, align: 'center' });

    doc.fillColor(darkEmerald).font('Helvetica-Bold').fontSize(12);
    doc.text(title.toUpperCase(), margin + badgeW + 8, y + 4.5);
    doc.restore();
    return y + 26;
  }

  // ==========================================
  // PAGE 1: Portada, Descarga, Datos, Rutinas
  // ==========================================

  // Header Banner
  doc.save();
  doc.roundedRect(margin, margin, contentWidth, 70, 8).fillColor(darkEmerald).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20);
  doc.text('FITNESS PRO', margin + 18, margin + 14);

  doc.fillColor('#34d399').font('Helvetica-Bold').fontSize(10);
  doc.text('MANUAL DE USUARIO PARA EL ALUMNO', margin + 18, margin + 38);

  doc.fillColor('#93c5fd').font('Helvetica').fontSize(8.5);
  doc.text('Guía Rápida de Inicio, Funcionalidades y Beneficios • Versión 2.0', margin + 18, margin + 50);

  // Decorative app pill on header right
  const pillW = 100;
  const pillH = 22;
  const pillX = margin + contentWidth - pillW - 16;
  doc.roundedRect(pillX, margin + 24, pillW, pillH, 11).fillColor(primaryEmerald).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
  doc.text('APP MOVIL', pillX, margin + 30, { width: pillW, align: 'center' });
  doc.restore();

  let curY = margin + 80;

  // Introducción breve
  doc.save();
  doc.fillColor(textGray).font('Helvetica').fontSize(9);
  doc.text(
    'Bienvenido a Fitness Pro. Esta aplicación ha sido diseñada junto a tu entrenador para brindarte una experiencia guiada, registrar tus marcas de entrenamiento, autocalcular tus calorías quemadas y monitorear tu evolución física con precisión científica.',
    margin,
    curY,
    { width: contentWidth, lineGap: 2.5 }
  );
  doc.restore();

  curY += 34;

  // ------------------------------------------
  // SECCIÓN 1: Descarga e Instalación Directa
  // ------------------------------------------
  curY = drawSectionBadge(1, '¿Cómo Descargar e Instalar el APK Oficial?', curY);

  const stepCardH = 74;
  const stepColW = (contentWidth - 12) / 3;

  // Paso 1.1
  drawCard(margin, curY, stepColW, stepCardH);
  doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8.5).text('PASO 1: ESCANEAR QR', margin + 8, curY + 8);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(8.5).text('Apunta tu cámara', margin + 8, curY + 20);
  doc.fillColor(textGray).font('Helvetica').fontSize(7.5).text(
    'Escanea el código QR provisto por tu Coach o accede al enlace directo desde tu navegador móvil.',
    margin + 8,
    curY + 32,
    { width: stepColW - 16, lineGap: 1.5 }
  );

  // Paso 1.2
  drawCard(margin + stepColW + 6, curY, stepColW, stepCardH);
  doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8.5).text('PASO 2: INSTALAR APK', margin + stepColW + 14, curY + 8);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(8.5).text('Descarga el paquete', margin + stepColW + 14, curY + 20);
  doc.fillColor(textGray).font('Helvetica').fontSize(7.5).text(
    'Pulsa "Descargar APK". Si el móvil solicita autorización para instalar apps desconocidas, selecciona "Permitir".',
    margin + stepColW + 14,
    curY + 32,
    { width: stepColW - 16, lineGap: 1.5 }
  );

  // Paso 1.3
  drawCard(margin + (stepColW + 6) * 2, curY, stepColW, stepCardH);
  doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8.5).text('PASO 3: INICIAR SESIÓN', margin + (stepColW + 6) * 2 + 8, curY + 8);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(8.5).text('Ingresa tus credenciales', margin + (stepColW + 6) * 2 + 8, curY + 20);
  doc.fillColor(textGray).font('Helvetica').fontSize(7.5).text(
    'Inicia sesión con tu correo y contraseña coordinados con tu Coach. ¡Todos tus planes se cargan al instante!',
    margin + (stepColW + 6) * 2 + 8,
    curY + 32,
    { width: stepColW - 16, lineGap: 1.5 }
  );

  curY += stepCardH + 14;

  // ------------------------------------------
  // SECCIÓN 2: Datos de Inicio y Perfil
  // ------------------------------------------
  curY = drawSectionBadge(2, 'Primeros Pasos: Datos a Ingresar', curY);

  const bioBoxH = 88;
  drawCard(margin, curY, contentWidth, bioBoxH, lightEmeraldBg, borderEmerald);

  doc.fillColor(darkEmerald).font('Helvetica-Bold').fontSize(9.5).text(
    'Configura tus datos biométricos en la pestaña "Perfil" para cálculos exactos:',
    margin + 12,
    curY + 10
  );

  const bioItems = [
    {
      title: '• Tu Cuenta:',
      desc: 'Inicia sesión con el correo electrónico y contraseña que coordinaste con tu Coach.',
    },
    {
      title: '• Selector de Unidad (KG / LBS):',
      desc: 'Elige si entrenas en Kilos o Libras. La app hace autoconversión instantánea de todos los pesos.',
    },
    {
      title: '• Peso Actual y Altura:',
      desc: 'Permite calcular tu Índice de Masa Corporal (IMC) y estimar calorías gastadas con precisión científica.',
    },
    {
      title: '• Edad, Género y Actividad:',
      desc: 'Calcula tu Tasa Metabólica Basal (BMR) y gasto calórico diario total (TDEE).',
    },
  ];

  let bioItemY = curY + 26;
  bioItems.forEach((it) => {
    doc.fillColor(darkEmerald).font('Helvetica-Bold').fontSize(8).text(it.title, margin + 12, bioItemY);
    doc.fillColor(textDark).font('Helvetica').fontSize(8).text(it.desc, margin + 140, bioItemY, {
      width: contentWidth - 152,
    });
    bioItemY += 14;
  });

  curY += bioBoxH + 14;

  // ------------------------------------------
  // SECCIÓN 3: Funciones del Entrenamiento Guiado
  // ------------------------------------------
  curY = drawSectionBadge(3, 'Tu Entrenamiento Diario en el Gimnasio', curY);

  const features = [
    {
      badge: 'RUTINAS EN VIVO',
      title: 'Plan Asignado & Memoria de Cargas',
      desc: 'La app precarga tus últimos pesos y series para que progreses sesión tras sesión sin olvidar tus marcas.',
    },
    {
      badge: 'PERSONALIZACIÓN',
      title: 'Agrega, Sustituye o Crea Ejercicios',
      desc: 'Adapta tu rutina del día al instante. Crea tus propios ejercicios con privacidad estricta (solo tú y tu Coach los ven).',
    },
    {
      badge: 'DISPOSITIVO & AJUSTES',
      title: 'Vibración y Pantalla Siempre Activa',
      desc: 'Configura desde Ajustes vibración háptica en series/descanso y pantalla activa para que el móvil no se bloquee.',
    },
    {
      badge: 'CALCULADORA DE DISCOS',
      title: 'Desglose por Lado en Barra Olímpica',
      desc: 'Calcula con precisión gráfica qué discos cargar en barras de 20kg/15kg tanto en KG como en LBS.',
    },
    {
      badge: 'DESCANSO FLOTANTE',
      title: 'Cronómetro de Descanso Inteligente',
      desc: 'Inicia automáticamente tras cada serie con aviso háptico para mantener la densidad del estímulo muscular.',
    },
    {
      badge: 'HISTORIAL DE MARCAS',
      title: 'Sobrecarga Progresiva por Ejercicio',
      desc: 'Visualiza tus mejores marcas y progresiones históricas con un toque en el botón de historial.',
    },
    {
      badge: 'CALORÍAS EN FUERZA',
      title: 'Cálculo de Calorías en Tiempo Real',
      desc: 'La app calcula calorías según tu peso corporal, volumen total levantado y minutos de tensión activa.',
    },
    {
      badge: 'BIOHACKER PEPTIDES',
      title: 'Péptidos y Rendimiento Avanzado',
      desc: 'Accede a la guía de péptidos bioactivos (BPC-157, CJC-1295, etc.) para regeneración celular e hipertrofia.',
    },
  ];

  const gridRows = 4;
  const gridW = (contentWidth - 10) / 2;
  const gridH = 46;

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const gx = margin + col * (gridW + 10);
    const gy = curY + row * (gridH + 8);

    drawCard(gx, gy, gridW, gridH);
    doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(7).text(features[i].badge, gx + 8, gy + 6);
    doc.fillColor(textDark).font('Helvetica-Bold').fontSize(8).text(features[i].title, gx + 8, gy + 16);
    doc.fillColor(textGray).font('Helvetica').fontSize(7.2).text(features[i].desc, gx + 8, gy + 27, {
      width: gridW - 16,
      lineGap: 1.2,
    });
  }

  curY += gridRows * (gridH + 8) + 8;

  // ==========================================
  // PAGE 2: Deportes Extras, Progreso, Beneficios, Membresía
  // ==========================================
  doc.addPage();
  curY = margin;

  // Mini Banner Page 2
  doc.save();
  doc.roundedRect(margin, curY, contentWidth, 38, 6).fillColor(darkEmerald).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text('FITNESS PRO • MANUAL DEL ALUMNO', margin + 14, curY + 10);
  doc.fillColor('#34d399').font('Helvetica').fontSize(8).text('Deportes Extras, Informes, Beneficios y Membresía', margin + 14, curY + 24);
  doc.restore();

  curY += 48;

  // ------------------------------------------
  // SECCIÓN 4: Deportes Extras y Cardio
  // ------------------------------------------
  curY = drawSectionBadge(4, 'Actividades Extras, Cardio y Deportes Libres', curY);

  doc.fillColor(textGray).font('Helvetica').fontSize(8.5).text(
    '¿Haces otra actividad además del entrenamiento con pesas? Puedes agregarla en cualquier momento para que sus calorías se sumen a tu balance del día:',
    margin,
    curY,
    { width: contentWidth, lineGap: 2 }
  );

  curY += 24;

  const sportsBoxH = 110;
  drawCard(margin, curY, contentWidth, sportsBoxH);

  const sportsList = [
    { name: 'Caminadora', desc: 'Con grados de inclinación ajustables (fórmula ACSM de pendiente)', met: '5.0 - 9.0 MET' },
    { name: 'Fútbol', desc: 'Partido o entrenamiento dinámico', met: '8.0 MET' },
    { name: 'Tenis / Pádel', desc: 'Intensidad media-alta en singles/dobles', met: '7.3 MET' },
    { name: 'Básquetbol', desc: 'Juego continuo y saltos', met: '8.0 MET' },
    { name: 'Boxeo / Sparring', desc: 'Golpeo de saco y técnica', met: '9.0 MET' },
    { name: 'Golf', desc: 'Caminando y transportando bolsa', met: '4.5 MET' },
    { name: 'Yoga / Pilates', desc: 'Flexibilidad, control corporal y core', met: '3.0 - 3.2 MET' },
    { name: 'Escalador / Elíptica / Bici', desc: 'Cardio continuo de sala', met: '7.0 - 8.5 MET' },
  ];

  const colW = (contentWidth - 20) / 2;
  for (let i = 0; i < sportsList.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = margin + 10 + col * colW;
    const sy = curY + 8 + row * 24;

    doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8).text(`• ${sportsList[i].name}:`, sx, sy);
    doc.fillColor(textDark).font('Helvetica').fontSize(7.5).text(
      `${sportsList[i].desc} (${sportsList[i].met})`,
      sx + 75,
      sy,
      { width: colW - 85 }
    );
  }

  curY += sportsBoxH + 8;

  // Card explicativa de control de tiempo
  const timerCalloutH = 34;
  drawCard(margin, curY, contentWidth, timerCalloutH, lightEmeraldBg, borderEmerald);
  doc.fillColor(darkEmerald).font('Helvetica-Bold').fontSize(8).text('⏱️ CONTROL FLEXIBLE DE TIEMPO:', margin + 10, curY + 6);
  doc.fillColor(textDark).font('Helvetica').fontSize(7.5).text(
    'Puedes iniciar el cronómetro en vivo mientras juegas o entrenas. Y si te olvidaste de iniciarlo o pausarlo, ¡no te preocupes! Puedes escribir o modificar los minutos manualmente en cualquier momento para recalcular tus calorías.',
    margin + 10,
    curY + 16,
    { width: contentWidth - 20, lineGap: 1.5 }
  );

  curY += timerCalloutH + 14;

  // ------------------------------------------
  // SECCIÓN 5: Informes y Reportes de Progreso
  // ------------------------------------------
  curY = drawSectionBadge(5, 'Informes, Gráficos y Seguimiento de Progreso', curY);

  const progW = (contentWidth - 12) / 3;
  const progH = 68;

  // Tarjeta 5.1
  drawCard(margin, curY, progW, progH);
  doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8).text('CALORÍAS TOTALES', margin + 8, curY + 8);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(8).text('Día, Semana y Mes', margin + 8, curY + 19);
  doc.fillColor(textGray).font('Helvetica').fontSize(7.2).text(
    'Visualiza cuánto gastaste cada día sumando pesas + cardio + deportes exteriores.',
    margin + 8,
    curY + 31,
    { width: progW - 16, lineGap: 1.2 }
  );

  // Tarjeta 5.2
  drawCard(margin + progW + 6, curY, progW, progH);
  doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8).text('TONELAJE Y VOLUMEN', margin + progW + 14, curY + 8);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(8).text('Evolución de Cargas', margin + progW + 14, curY + 19);
  doc.fillColor(textGray).font('Helvetica').fontSize(7.2).text(
    'Gráficos de volumen acumulado para asegurar sobrecarga progresiva en tus músculos.',
    margin + progW + 14,
    curY + 31,
    { width: progW - 16, lineGap: 1.2 }
  );

  // Tarjeta 5.3
  drawCard(margin + (progW + 6) * 2, curY, progW, progH);
  doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8).text('RÉCORDS Y 1RM', margin + (progW + 6) * 2 + 8, curY + 8);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(8).text('Fuerza Máxima', margin + (progW + 6) * 2 + 8, curY + 19);
  doc.fillColor(textGray).font('Helvetica').fontSize(7.2).text(
    'Cálculo estimado de tu repetición máxima en cada ejercicio para medir tu ganancia de fuerza.',
    margin + (progW + 6) * 2 + 8,
    curY + 31,
    { width: progW - 16, lineGap: 1.2 }
  );

  curY += progH + 14;

  // ------------------------------------------
  // SECCIÓN 6: Beneficios de Usar la App
  // ------------------------------------------
  curY = drawSectionBadge(6, 'Beneficios Exclusivos para Ti', curY);

  const benBoxH = 68;
  drawCard(margin, curY, contentWidth, benBoxH);

  const benefits = [
    { title: '✓ Cero Improvisaciones:', text: 'Llegas al gym sabiendo exactamente qué ejercicio, peso y series hacer.' },
    { title: '✓ Todo en Uno:', text: 'Entrenamiento, cardio, deportes extras, calorías y nutrición en una sola app.' },
    { title: '✓ Motivación Visual:', text: 'Ver tus gráficos de avance te impulsa a mantener la disciplina cada semana.' },
    { title: '✓ Acompañamiento del Coach:', text: 'Tu entrenador ajusta tu plan según tus datos reales, sin adivinanzas.' },
  ];

  benefits.forEach((b, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = margin + 12 + col * ((contentWidth - 24) / 2);
    const by = curY + 10 + row * 28;

    doc.fillColor(primaryEmerald).font('Helvetica-Bold').fontSize(8).text(b.title, bx, by);
    doc.fillColor(textDark).font('Helvetica').fontSize(7.5).text(b.text, bx, by + 11, {
      width: (contentWidth - 36) / 2,
    });
  });

  curY += benBoxH + 14;

  // ------------------------------------------
  // SECCIÓN 7: Estado de Membresía (Activo / Inactivo)
  // ------------------------------------------
  curY = drawSectionBadge(7, 'Estado de Membresía y Acceso a la App', curY);

  const memBoxH = 50;
  drawCard(margin, curY, contentWidth, memBoxH, '#fffbeb', '#fde68a');

  doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(8.5).text(
    'ℹ️ ¿Qué ocurre si tu cuenta figura como "Inactiva / En Pausa"?',
    margin + 12,
    curY + 8
  );
  doc.fillColor('#78350f').font('Helvetica').fontSize(7.5).text(
    'Tu Coach puede pausar tu membresía temporalmente (por vacaciones, pago pendiente o pausa programada). Siempre podrás iniciar sesión y consultar tu perfil, pero el acceso a rutinas diarias y gráficos de progreso se mantendrá restringido hasta que tu Coach reactive tu cuenta en su panel.',
    margin + 12,
    curY + 20,
    { width: contentWidth - 24, lineGap: 1.5 }
  );

  // ==========================================
  // FOOTER EN AMBAS PÁGINAS
  // ==========================================
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Linea divisoria
    doc.save();
    doc.lineWidth(0.5).strokeColor('#e2e8f0');
    doc.moveTo(margin, pageHeight - margin - 14).lineTo(pageWidth - margin, pageHeight - margin - 14).stroke();

    doc.fillColor(textLightGray).font('Helvetica').fontSize(7.5);
    doc.text('Fitness Pro • Sistema de Gestión Deportiva y Entrenamiento Guiado', margin, pageHeight - margin - 8);

    doc.text(
      `Página ${i + 1} de ${range.count}`,
      margin,
      pageHeight - margin - 8,
      { width: contentWidth, align: 'right' }
    );
    doc.restore();
  }

  doc.end();

  writeStream.on('finish', () => {
    console.log('PDF generated successfully at:', outputWebPath);
    // Copy to artifact directory
    try {
      fs.copyFileSync(outputWebPath, outputArtifactPath);
      console.log('PDF copied to artifact directory at:', outputArtifactPath);
    } catch (err) {
      console.error('Error copying to artifact directory:', err);
    }
  });
}

generateManual();
