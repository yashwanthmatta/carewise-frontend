// Help chat and plans. Loaded after script.js and uses its shared helpers
// (apiGet, apiPost, authToken, backendFeatures, reportLanguage, escapeHtml).

(() => {
  const HELP_TEXT = {
    en: {
      sub: "Ask about your report or how to use CareWise.",
      hello: "Hi, I'm the CareWise helper. Ask me what a test on your report means, how to use the app, or about plans.",
      placeholder: "Type a question",
      send: "Send",
      share: "Share my latest result with the helper",
      fine: "General help, not medical advice. In an emergency call 911.",
      thinking: "Thinking…",
      chips: ["What does my result mean?", "How do I upload a report?", "What should I ask my doctor?", "How do plans and payments work?"],
      emergency: "This sounds urgent. Please call 911 or your local emergency number now, or go to the nearest emergency room. Do not wait for an app.",
      busy: "The helper is busy right now. Please try again in a minute.",
    },
    es: {
      sub: "Pregunta sobre tu informe o cómo usar CareWise.",
      hello: "Hola, soy el asistente de CareWise. Pregúntame qué significa una prueba de tu informe, cómo usar la app o sobre los planes.",
      placeholder: "Escribe una pregunta",
      send: "Enviar",
      share: "Compartir mi último resultado con el asistente",
      fine: "Ayuda general, no consejo médico. En una emergencia llama al 911.",
      thinking: "Pensando…",
      chips: ["¿Qué significa mi resultado?", "¿Cómo subo un informe?", "¿Qué le pregunto a mi médico?", "¿Cómo funcionan los planes y pagos?"],
      emergency: "Esto suena urgente. Llama al 911 o al número de emergencias local ahora, o ve a la sala de emergencias más cercana. No esperes a una app.",
      busy: "El asistente está ocupado. Inténtalo de nuevo en un minuto.",
    },
  };

  const EMERGENCY_PATTERN = /(chest pain|can'?t breathe|cannot breathe|trouble breathing|short of breath|stroke|face droop|slurred speech|passed out|unconscious|fainted|seizure|severe bleeding|bleeding (a lot|heavily)|overdose|suicid|kill myself|end my life|self[- ]harm|dolor (de|en el) pecho|no puedo respirar|derrame|desmay|convulsi|sangrado (fuerte|abundante)|suicid|quitarme la vida)/i;

  // Built-in answers, used when the online helper is off or unreachable. They come
  // from CareWise's own test explanations, the person's latest result and app how-tos.
  const EXTRA_TESTS = [
    { pattern: /\bldl\b|bad cholesterol|colesterol malo/i, name: "LDL cholesterol", es: "Colesterol LDL", what: "The \"bad\" cholesterol that can build up in blood vessels over time. Lower is usually better for the heart.", whatEs: "El colesterol \"malo\" que puede acumularse en los vasos sanguíneos con el tiempo. Más bajo suele ser mejor para el corazón.", finding: "LDL cholesterol" },
    { pattern: /total cholesterol|\bcholesterol\b|colesterol total/i, name: "Total cholesterol", es: "Colesterol total", what: "All the cholesterol in your blood: LDL, HDL and others together.", whatEs: "Todo el colesterol de la sangre: LDL, HDL y otros juntos.", finding: "Total cholesterol" },
    { pattern: /triglycer|triglicér/i, name: "Triglycerides", es: "Triglicéridos", what: "A type of fat in the blood. It goes up with sugar, alcohol and large meals, and is often checked after fasting.", whatEs: "Un tipo de grasa en la sangre. Sube con el azúcar, el alcohol y las comidas grandes; suele medirse en ayunas.", finding: "Triglycerides" },
    { pattern: /\b(hb)?a1c\b|hemoglobin a1c|glycated|glucosilada/i, name: "A1C (HbA1c)", es: "A1C (HbA1c)", what: "Your average blood sugar over the last 2 to 3 months. It is used to check for diabetes and prediabetes.", whatEs: "El promedio de azúcar en la sangre de los últimos 2 a 3 meses. Se usa para detectar diabetes y prediabetes.", finding: "A1C" },
    { pattern: /blood pressure|\bbp\b|presión arterial/i, name: "Blood pressure", es: "Presión arterial", what: "How hard blood pushes on your artery walls. The top number is when the heart beats, the bottom when it rests.", whatEs: "La fuerza con la que la sangre empuja las arterias. El número de arriba es cuando late el corazón; el de abajo, cuando descansa.", finding: "Blood pressure" },
    { pattern: /vitamin d|vitamina d/i, name: "Vitamin D", es: "Vitamina D", what: "A vitamin that helps keep bones and muscles strong. Levels are often low in winter or with little sun.", whatEs: "Una vitamina que ayuda a mantener fuertes los huesos y músculos. Suele estar baja en invierno o con poco sol.", finding: "Vitamin D" },
  ];

  const STATUS_WORDS = {
    en: { above: "above the lab's range", below: "below the lab's range", within: "within the lab's range", unknown: "with no range printed" },
    es: { above: "por encima del rango del laboratorio", below: "por debajo del rango del laboratorio", within: "dentro del rango del laboratorio", unknown: "sin rango impreso" },
  };

  const TOPICS = {
    en: [
      [/^(hi|hello|hey|good (morning|afternoon|evening))\b|^yo\b/i, "Hello! I can explain a test on your report, tell you what to do next, or help with uploading, the doctor brief, your account and plans. What would you like to know?"],
      [/thank|thanks|great|perfect|ok(ay)?\b|got it/i, "You're welcome. Ask me anything else about your report or CareWise."],
      [/who are you|what are you|what can you do|help me|^help$|how does (this|it|the app|the site|carewise) work|what is carewise|how (do i|to) use/i, "I'm the CareWise helper. CareWise explains lab and scan reports in plain words, shows what needs attention first, gives you questions for the doctor and a one-page doctor brief, and keeps a health record for you or a family member. Try asking \"What does my result mean?\" or the name of a test, like \"What is eGFR?\""],
      [/upload|photo|picture|pdf|add .*report|new report|how.*start|paste/i, "Open Upload, add a PDF, a photo, or paste the report text, choose whose report it is, then press \"Explain report\". Text PDFs and photos are read on your device, so nothing is uploaded unless you save it."],
      [/plan|price|pay|cost|cancel|subscri|\bplus\b|family plan|stripe|card|refund|billing|free/i, "Free covers explaining reports, the doctor brief and your health record. Plus is $7 a month for personal plans, reminders and trends. Family is $12 a month for up to 5 people. Choose a plan in Profile under \"Plans and payments\"; you can cancel any time with \"Manage or cancel plan\"."],
      [/brief|print|share with (my )?doctor|appointment|visit/i, "Under your result, press \"Doctor brief\". It makes a one-page summary of the values, what needs attention and your questions. Print it or save it as a PDF for the visit."],
      [/ask (my |the )?doctor|questions? (for|to ask)/i, "Good questions to start with: Which result matters most for me? Does anything need a repeat test, and when? Is any of this linked to how I have been feeling? Is there anything I should change before the next visit?"],
      [/mom|mum|dad|father|mother|parent|family member|caregiver|someone else/i, "Choose whose report it is (Me, Mom, Dad or another name) before you press \"Explain report\". CareWise keeps each person's reports and record apart, and the doctor brief shows their name. The Family plan is for sharing with siblings or other caregivers."],
      [/history|old report|past report|trend|compare/i, "Open History to see reports you saved and how values changed over time. Save a report first with \"Save to my account\" under Upload."],
      [/record|allerg|condition|medicines? list|timeline/i, "Open Record to keep conditions, allergies, visits and what did not suit you, as far back as you remember. It is saved on this device and goes into the doctor brief."],
      [/account|sign ?up|log ?in|password|save|sync|email/i, "Go to Profile to create a free account with your email. Then press \"Save to my account\" under a report to keep it. Password reset is under \"Log out, verify email or reset password\"."],
      [/privacy|delete|data|safe|secure|hipaa|who can see/i, "Reports are read on your device. When you save to an account, report text is encrypted. You can ask for your data to be deleted from Profile."],
      [/spanish|español|language|translate/i, "Pick Español in the language menu on a result to read it in Spanish. The Spanish text is still being reviewed."],
      [/install|app\b|phone|offline/i, "You can add CareWise to your phone's home screen from your browser's menu (\"Add to Home Screen\"). Report explaining also works offline once the page has loaded."],
      [/\b(mri|ct|x-?ray|ultrasound|scan|mammogram|radiolog)/i, "For a scan, paste or upload the written report from the radiologist. CareWise explains the words in it and the Impression; it does not look at the images themselves."],
      [/medicine|medication|drug|pill|dose|supplement|treat|cure|prescri|\b(can|should) i take\b|aspirin|ibuprofen|tylenol|acetaminophen|statin|metformin|insulin|antibiotic|vitamin pill/i, "I can't suggest medicines, supplements or doses. Please ask your doctor or pharmacist, and write the question down so you remember it at the visit."],
    ],
    es: [
      [/^(hola|buenas|buenos días)/i, "¡Hola! Puedo explicar una prueba de tu informe, decirte qué hacer después o ayudarte a subir un informe, con el resumen para el médico, tu cuenta y los planes."],
      [/gracias|perfecto|vale|de acuerdo/i, "De nada. Pregúntame lo que quieras sobre tu informe o CareWise."],
      [/quién eres|qué puedes hacer|ayuda|cómo funciona|qué es carewise/i, "Soy el asistente de CareWise. CareWise explica informes de laboratorio e imagen con palabras simples, muestra primero lo que necesita atención, te da preguntas para el médico y guarda un historial. Prueba con \"¿Qué significa mi resultado?\" o el nombre de una prueba."],
      [/subir|foto|pdf|agregar|nuevo informe|empez|pegar/i, "Abre Subir, agrega un PDF, una foto o pega el texto del informe, elige de quién es y pulsa \"Explicar informe\"."],
      [/plan|precio|pag|costo|cancel|suscri|tarjeta|gratis/i, "Gratis incluye explicar informes, el resumen para el médico y tu historial. Plus cuesta $7 al mes y Familia $12 al mes para hasta 5 personas. Elige un plan en Perfil y cancela cuando quieras."],
      [/resumen|imprimir|cita|consulta/i, "Debajo de tu resultado pulsa \"Doctor brief\" para crear un resumen de una página para imprimir o guardar como PDF."],
      [/pregunt.*médico|preguntas/i, "Buenas preguntas: ¿Qué resultado es más importante para mí? ¿Hace falta repetir alguna prueba y cuándo? ¿Tiene relación con cómo me he sentido?"],
      [/mamá|papá|madre|padre|familia|cuidador/i, "Elige de quién es el informe (Yo, Mamá, Papá u otro nombre) antes de pulsar \"Explicar informe\". CareWise guarda los informes de cada persona por separado."],
      [/cuenta|contraseña|guardar|iniciar|correo/i, "Ve a Perfil para crear una cuenta gratis con tu correo y guarda tus informes."],
      [/privacidad|borrar|eliminar|datos|seguro/i, "Los informes se leen en tu dispositivo. Al guardarlos en una cuenta, el texto se cifra. Puedes pedir que se borren tus datos desde Perfil."],
      [/medicina|medicamento|pastilla|dosis|suplemento|tratamiento|puedo tomar|receta/i, "No puedo sugerir medicamentos, suplementos ni dosis. Pregunta a tu médico o farmacéutico."],
    ],
  };

  const RESULT_QUESTION = /(my|the) (result|report|score|numbers|values)|what does (it|this|my).*mean|what (should i do )?next|next step|what now|anything wrong|is (it|this|my).*(bad|ok|okay|normal|serious|fine)|explain (it|this|my)|summar|resultado|mi informe|qué hago|siguiente paso|qué significa/i;

  function formatList(items, es) {
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")} ${es ? "y" : "and"} ${items[items.length - 1]}`;
  }

  function latestAnalysis() {
    return typeof latestReportAnalysis !== "undefined" && latestReportAnalysis && !latestReportAnalysis.noData ? latestReportAnalysis : null;
  }

  function nextStepText(analysis, es) {
    const ui = es ? (REPORT_TRANSLATIONS?.es?.ui || {}) : {};
    const pick = (key, english) => ui[key] || english;
    if (analysis.riskLevel === "urgent") return pick("nextUrgent", "Contact your doctor today. If you feel very unwell, seek emergency care.");
    if (analysis.riskLevel === "needs_review") return pick("nextReview", "Ask your doctor about these results soon.");
    if (analysis.riskLevel === "attention") return pick("nextAttention", "Bring these results up at your next visit.");
    return pick("nextRoutine", "Nothing urgent stands out. Keep this for your next checkup.");
  }

  function testName(item, es) {
    const info = typeof labTestInfo === "function" ? labTestInfo(item.key) : null;
    return es && info ? info.es : item.name;
  }

  function resultAnswer(es) {
    const analysis = latestAnalysis();
    if (!analysis) {
      return es
        ? "Todavía no hay un informe explicado. Abre Subir, agrega tu informe (o pulsa \"Probar un ejemplo\") y pulsa \"Explicar informe\". Luego pregúntame de nuevo y te lo resumo."
        : "There's no explained report yet. Open Upload, add your report (or try the sample report), and press \"Explain report\". Then ask me again and I'll sum it up for you.";
    }
    const view = es && typeof translateReportAnalysis === "function" ? translateReportAnalysis(analysis, "es") : analysis;
    const lines = [];
    if (analysis.scanOnly) {
      lines.push(es ? "Es un informe de imagen. CareWise explica las palabras del radiólogo; no mira las imágenes." : "This is a scan report. CareWise explains the radiologist's words; it does not look at the images.");
    } else {
      lines.push(es ? `Puntuación de salud: ${analysis.score}/100 (estimación educativa).` : `Health score: ${analysis.score}/100 (an educational estimate).`);
    }
    const outside = (analysis.panelResults || []).filter((item) => item.status === "above" || item.status === "below");
    const flagged = (view.findings || []).filter((item) => !/better range|within|mejor rango|dentro/i.test(item.level)).slice(0, 3);
    if (flagged.length) {
      lines.push((es ? "Lo que necesita atención: " : "What needs attention: ") + flagged.map((item) => `${item.label} (${item.level.toLowerCase()})`).join("; ") + ".");
    }
    if (outside.length) {
      const names = outside.slice(0, 4).map((item) => `${testName(item, es)} ${item.valueText}${item.unit ? ` ${item.unit}` : ""} (${es ? (item.status === "above" ? "alto" : "bajo") : (item.status === "above" ? "high" : "low")})`);
      lines.push((es ? "Fuera del rango del laboratorio: " : "Outside the lab's range: ") + formatList(names, es) + (outside.length > 4 ? (es ? ", y más." : ", and more.") : "."));
    } else if ((analysis.panelResults || []).length) {
      const count = analysis.panelResults.length;
      lines.push(es
        ? (count === 1 ? "La prueba con rango impreso está dentro del rango del laboratorio." : `Las ${count} pruebas con rango impreso están dentro del rango del laboratorio.`)
        : (count === 1 ? "The test with a printed range is within the lab's range." : `All ${count} tests with a printed range are within the lab's range.`));
    }
    lines.push((es ? "Siguiente paso: " : "Next step: ") + nextStepText(analysis, es));
    if (view.questions?.length) lines.push((es ? "Pregunta para su médico: " : "A question for your doctor: ") + view.questions[0]);
    lines.push(es ? "Escríbeme el nombre de una prueba para saber qué mide." : "Type the name of any test to learn what it measures.");
    return lines.join("\n");
  }

  function testAnswer(question, es) {
    const analysis = latestAnalysis();
    const compiled = typeof COMPILED !== "undefined" ? COMPILED : [];
    const hit = compiled.find(({ patterns }) => patterns.some((pattern) => pattern.test(question)));
    if (hit) {
      const { test } = hit;
      const lines = [`${es ? test.es : test.name}: ${es ? test.whatEs : test.what}`];
      const mine = analysis?.panelResults?.find((item) => item.key === test.key);
      if (mine) {
        lines.push(es
          ? `En su informe: ${mine.valueText}${mine.unit ? ` ${mine.unit}` : ""}${mine.rangeText ? ` (rango ${mine.rangeText})` : ""}, ${STATUS_WORDS.es[mine.status] || ""}.`
          : `On your report: ${mine.valueText}${mine.unit ? ` ${mine.unit}` : ""}${mine.rangeText ? ` (range ${mine.rangeText})` : ""}, ${STATUS_WORDS.en[mine.status] || ""}.`);
      }
      lines.push(es ? "Su médico puede decir qué significa para usted." : "Your doctor can tell you what it means for you.");
      return lines.join("\n");
    }
    const extra = EXTRA_TESTS.find((test) => test.pattern.test(question));
    if (extra) {
      const lines = [`${es ? extra.es : extra.name}: ${es ? extra.whatEs : extra.what}`];
      const finding = analysis?.findings?.find((item) => item.label === extra.finding);
      if (finding) lines.push(`${es ? "En su informe" : "On your report"}: ${finding.detail.replace(/\.$/, "")} (${finding.level.toLowerCase()}).`);
      lines.push(es ? "Su médico puede decir qué significa para usted." : "Your doctor can tell you what it means for you.");
      return lines.join("\n");
    }
    if (typeof TERMS !== "undefined") {
      const term = TERMS.find(([pattern]) => new RegExp(`\\b${pattern}`, "i").test(question));
      if (term) return `${term[1].replace(/^./, (c) => c.toUpperCase())}: ${es ? term[3] : term[2]}\n${es ? "Su médico puede explicar qué significa en su caso." : "Your doctor can explain what it means in your case."}`;
    }
    return "";
  }

  function fallbackAnswer(es) {
    return es
      ? "Puedo ayudarte con esto:\n• Qué significa tu resultado y qué hacer después\n• Qué mide una prueba (escribe su nombre, por ejemplo \"TSH\")\n• Subir un informe, el resumen para el médico, tu cuenta y los planes\nElige una opción abajo o escribe tu pregunta de otra forma."
      : "Here's what I can help with:\n• What your result means and what to do next\n• What a test measures (type its name, like \"TSH\" or \"eGFR\")\n• Uploading a report, the doctor brief, your account and plans\nPick one below or ask in a different way.";
  }

  // Food, movement and lifestyle questions get the same guideline-based plan the
  // result shows (AHA, ADA, CDC, DASH), built from the person's own values.
  const LIFESTYLE_QUESTION = /\b(eat|eating|food|foods|diet|meal|meals|recipe|breakfast|lunch|dinner|snack|cook|nutrition|fruit|vegetable|sugar intake|salt|exercise|exercises|workout|walk|walking|gym|yoga|activity|active|fitness|weight|lose|losing|lower|reduce|improve|bring down|control|lifestyle|habit|habits|naturally)\b|comer|comida|dieta|ejercicio|caminar|peso|bajar|mejorar|hábitos|saludable/i;
  const SLEEP_QUESTION = /\b(sleep|insomnia|tired|fatigue|stress|anxious|anxiety)\b|dormir|sueño|cansad|estrés/i;

  // Say each reason once, after the first tip it applies to.
  function planItems(section, plan, limit, said = new Set()) {
    return section.items.slice(0, limit).map((item) => {
      const why = item.why && !said.has(item.why) ? ` (${item.why})` : "";
      if (item.why) said.add(item.why);
      return `• ${item.text}${why}`;
    });
  }

  function lifestyleAnswer(question, es) {
    const analysis = latestAnalysis();
    const wantsMove = /exercise|workout|walk|gym|yoga|activity|active|fitness|ejercicio|caminar/i.test(question);
    const wantsFood = /eat|food|diet|meal|recipe|breakfast|lunch|dinner|snack|cook|nutrition|fruit|vegetable|salt|sugar|comer|comida|dieta/i.test(question);
    const both = wantsMove === wantsFood;
    if (typeof buildPersonalPlan !== "function" || !analysis || analysis.scanOnly) {
      const lines = es
        ? ["Consejos generales basados en guías públicas (AHA, CDC):",
          "• Verduras y fruta en la mayoría de las comidas, cereales integrales, y proteína de pescado, legumbres, frutos secos o pollo.",
          "• Menos bebidas azucaradas, dulces, sal y carnes procesadas.",
          "• 150 minutos por semana de actividad moderada (por ejemplo, caminar rápido 30 minutos, 5 días) y ejercicios de fuerza 2 días.",
          "• Si no haces ejercicio ahora, empieza con 10 minutos al día."]
        : ["General guidance from public guidelines (AHA, CDC):",
          "• Vegetables and fruit at most meals, whole grains, and protein from fish, beans, nuts or poultry.",
          "• Fewer sugary drinks, sweets, salty and processed foods.",
          "• 150 minutes a week of moderate activity (for example a brisk 30-minute walk on 5 days) plus strength exercises on 2 days.",
          "• If you're not active now, start with 10 minutes a day and add a little each week."];
      lines.push(es
        ? "Explica tu informe en Subir y te daré un plan según tus propios valores."
        : "Explain your report under Upload and I'll tailor this to your own results.");
      return lines.join("\n");
    }
    const reactions = typeof getPlanReactions === "function" ? getPlanReactions() : [];
    const plan = buildPersonalPlan(analysis, es ? "es" : "en", reactions);
    const section = (key) => plan.sections.find((item) => item.key === key);
    const lines = [es ? "Según tu informe, esto es lo que recomiendan las guías:" : "Based on your report, here's what the guidelines suggest:"];
    if (plan.urgent) {
      lines.push(`• ${section("move").items[0].text}`);
      return lines.join("\n");
    }
    const said = new Set();
    if (both || wantsFood) {
      lines.push(es ? "Comida:" : "Food:");
      lines.push(...planItems(section("food"), plan, both ? 4 : 6, said));
    }
    if (both || wantsMove) {
      lines.push(es ? "Movimiento:" : "Movement:");
      lines.push(...planItems(section("move"), plan, both ? 3 : 5, said));
    }
    const track = section("track").items[0];
    if (track) lines.push((es ? "Seguimiento: " : "Track: ") + track.text);
    lines.push(section("safety").items[0].text);
    return lines.join("\n");
  }

  function sleepAnswer(es) {
    return es
      ? "Consejos generales (CDC):\n• Los adultos necesitan 7 horas o más de sueño.\n• Acuéstate y levántate a la misma hora, también los fines de semana.\n• Evita pantallas, cafeína y comidas grandes antes de dormir.\n• Camina o muévete durante el día y sal a la luz del sol por la mañana.\nSi el cansancio o el estrés duran semanas, coméntalo con tu médico: algunas pruebas de laboratorio (como hierro, tiroides o B12) pueden estar relacionadas."
      : "General guidance (CDC):\n• Adults need 7 or more hours of sleep.\n• Go to bed and get up at the same time, weekends too.\n• Avoid screens, caffeine and big meals close to bedtime.\n• Move during the day and get morning daylight.\nIf tiredness or stress lasts for weeks, tell your doctor: some lab results (such as iron, thyroid or B12) can be linked to tiredness.";
  }

  const MEDICINE_QUESTION = /medicine|medication|meds\b|drug|pill|tablet|dose|dosage|supplement|prescri|\b(can|should) i take\b|aspirin|ibuprofen|tylenol|acetaminophen|statin|metformin|insulin|antibiotic|medicina|medicamento|pastilla|dosis|suplemento|receta|puedo tomar/i;

  function medicineAnswer(es) {
    const analysis = latestAnalysis();
    const lines = es
      ? ["No puedo recomendar ni nombrar medicamentos, suplementos o dosis; eso lo decide tu médico, que conoce tu historial completo.",
        "Preguntas útiles para tu médico o farmacéutico:",
        "• ¿Mis resultados indican que debería considerar un medicamento, o primero cambios de hábitos?",
        "• ¿Qué beneficios y efectos secundarios tendría, y cuándo repetimos la prueba?",
        "• ¿Interactúa con lo que ya tomo?"]
      : ["I can't recommend or name medicines, supplements or doses. That decision is your doctor's, because it depends on your whole history.",
        "Useful questions to ask your doctor or pharmacist:",
        "• Do my results mean I should consider a medicine, or try lifestyle changes first?",
        "• What are the benefits and side effects, and when should I repeat the test?",
        "• Does it interact with anything I already take?"];
    if (analysis && !analysis.scanOnly) {
      lines.push(es ? "Mientras tanto, pregúntame \"¿qué debo comer?\" o \"¿qué ejercicio me conviene?\" para ver lo que las guías recomiendan según tu informe." : "Meanwhile, ask me \"what should I eat?\" or \"what exercise is good for me?\" to see what the guidelines suggest for your results.");
    }
    return lines.join("\n");
  }

  function builtInAnswer(question) {
    const es = lang() === "es";
    const clean = question.trim();
    if (MEDICINE_QUESTION.test(clean)) return { reply: medicineAnswer(es) };
    // "How do I lower my LDL?" is about food and movement, so check that first.
    if (LIFESTYLE_QUESTION.test(clean)) return { reply: lifestyleAnswer(clean, es) };
    if (SLEEP_QUESTION.test(clean)) return { reply: sleepAnswer(es) };
    // A test name wins over a general topic ("what is my LDL" is about LDL).
    const test = testAnswer(clean, es);
    if (test) return { reply: test };
    if (RESULT_QUESTION.test(clean)) return { reply: resultAnswer(es) };
    const topic = TOPICS[es ? "es" : "en"].find(([pattern]) => pattern.test(clean));
    if (topic) return { reply: topic[1] };
    if (/\b(what|why|how|mean|result|report|qué|significa)\b/i.test(clean) && latestAnalysis()) return { reply: resultAnswer(es) };
    return { reply: fallbackAnswer(es), showTopics: true };
  }

  const lang = () => (typeof reportLanguage !== "undefined" && reportLanguage === "es" ? "es" : "en");
  const text = () => HELP_TEXT[lang()];
  const byId = (id) => document.getElementById(id);

  // ---------- Help chat ----------
  const root = byId("help-chat");
  const panel = byId("help-chat-panel");
  const openButton = byId("help-chat-open");
  const closeButton = byId("help-chat-close");
  const log = byId("help-chat-log");
  const chips = byId("help-chat-chips");
  const form = byId("help-chat-form");
  const input = byId("help-chat-input");
  const sendButton = byId("help-chat-send");
  const shareRow = byId("help-chat-share-row");
  const shareBox = byId("help-chat-share");

  const conversation = [];
  let waiting = false;

  function addBubble(role, message, extraClass = "") {
    const bubble = document.createElement("div");
    bubble.className = `help-chat-msg help-chat-${role} ${extraClass}`.trim();
    bubble.innerHTML = escapeHtml(message).replace(/\n/g, "<br>");
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function renderChips(force = false) {
    chips.innerHTML = "";
    if (conversation.length && !force) return;
    text().chips.forEach((label) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "help-chat-chip";
      chip.textContent = label;
      chip.addEventListener("click", () => ask(label));
      chips.appendChild(chip);
    });
  }

  function refreshChatText() {
    const t = text();
    byId("help-chat-sub").textContent = t.sub;
    input.placeholder = t.placeholder;
    sendButton.textContent = t.send;
    byId("help-chat-share-label").textContent = t.share;
    byId("help-chat-fine").textContent = t.fine;
    const hasResult = typeof latestReportSummaryPack !== "undefined" && Boolean(latestReportSummaryPack);
    shareRow.hidden = !hasResult;
    if (!hasResult) shareBox.checked = false;
    if (!log.childElementCount) addBubble("assistant", t.hello, "help-chat-hello");
    renderChips();
  }

  function setOpen(open) {
    panel.hidden = !open;
    root.classList.toggle("open", open);
    openButton.setAttribute("aria-expanded", String(open));
    if (open) {
      refreshChatText();
      setTimeout(() => input.focus(), 30);
    } else {
      openButton.focus();
    }
  }

  async function ask(question) {
    const clean = question.trim().slice(0, 1000);
    if (!clean || waiting) return;
    addBubble("user", clean);
    conversation.push({ role: "user", content: clean });
    input.value = "";
    renderChips();

    if (EMERGENCY_PATTERN.test(clean)) {
      addBubble("assistant", text().emergency, "help-chat-urgent");
      conversation.push({ role: "assistant", content: text().emergency });
      return;
    }

    waiting = true;
    sendButton.disabled = true;
    const pending = addBubble("assistant", text().thinking, "help-chat-pending");
    let reply = "";
    let showTopics = false;
    try {
      // Without the online helper, answer straight away from built-in knowledge.
      if (backendFeatures && backendFeatures.help_assistant === false) throw new Error("Backend returned 503");
      const response = await apiPost("/assistant/chat", {
        messages: conversation.slice(-12),
        report_summary: shareBox.checked && typeof latestReportSummaryPack === "string" ? latestReportSummaryPack.slice(0, 4000) : "",
        language: lang(),
        source: "web",
      }, { skipAuth: true });
      reply = response.reply;
    } catch (error) {
      const answer = builtInAnswer(clean);
      reply = answer.reply;
      showTopics = Boolean(answer.showTopics);
    }
    pending.remove();
    addBubble("assistant", reply);
    conversation.push({ role: "assistant", content: reply });
    if (showTopics) renderChips(true);
    waiting = false;
    sendButton.disabled = false;
  }

  if (root) {
    openButton.addEventListener("click", () => setOpen(panel.hidden));
    closeButton.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) setOpen(false);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      ask(input.value);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        ask(input.value);
      }
    });
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-open-help]");
      if (!opener) return;
      event.preventDefault();
      setOpen(true);
    });
    window.openCareWiseHelp = () => setOpen(true);
  }

  // ---------- Plans and payments ----------
  const billingPanel = document.querySelector(".billing-panel");
  const billingStatus = byId("billing-status");
  const billingBadge = byId("billing-current");
  const billingBanner = byId("billing-banner");
  const manageButton = byId("manage-billing");
  const PLAN_NAMES = { basic: "Free", plus: "Plus", premium: "Family" };
  let currentPlan = { plan_code: "basic", status: "free", payments_enabled: false, can_manage_billing: false };

  function paymentsEnabled() {
    return Boolean(currentPlan.payments_enabled || (typeof backendFeatures !== "undefined" && backendFeatures.stripe_checkout));
  }

  function renderPlan() {
    if (!billingPanel) return;
    const signedIn = Boolean(authToken);
    const activePaid = currentPlan.plan_code !== "basic";
    billingBadge.textContent = `${PLAN_NAMES[currentPlan.plan_code] || "Free"} plan${currentPlan.status === "past_due" ? " · payment due" : ""}`;
    billingBadge.className = `sync-badge ${activePaid ? "online" : ""}`.trim();
    billingPanel.querySelectorAll("[data-plan-card]").forEach((card) => {
      const code = card.dataset.planCard;
      const isCurrent = code === currentPlan.plan_code;
      card.classList.toggle("billing-card-current", isCurrent);
      const button = card.querySelector("[data-choose-plan]");
      if (code === "basic") {
        button.textContent = isCurrent ? "Your plan" : "Included";
        button.disabled = true;
        return;
      }
      button.disabled = isCurrent;
      button.textContent = isCurrent ? "Your plan" : !signedIn ? `Sign in to choose ${PLAN_NAMES[code]}` : `Choose ${PLAN_NAMES[code]}`;
    });
    manageButton.hidden = !currentPlan.can_manage_billing;
  }

  async function refreshPlan() {
    if (!billingPanel) return;
    if (!authToken) {
      currentPlan = { plan_code: "basic", status: "free", payments_enabled: false, can_manage_billing: false };
      renderPlan();
      return;
    }
    try {
      currentPlan = await apiGet("/subscriptions/me");
    } catch {
      // Keep what we had; the backend may be waking up.
    }
    renderPlan();
  }

  function showPlans() {
    if (typeof window.showCareWiseSection === "function") window.showCareWiseSection("account-title", false);
    setTimeout(() => billingPanel && billingPanel.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  async function choosePlan(code) {
    if (code === "basic" || !PLAN_NAMES[code]) return;
    if (!authToken) {
      billingStatus.textContent = `Create a free account or log in above, then choose ${PLAN_NAMES[code]}.`;
      const email = byId("auth-email");
      if (email) {
        email.scrollIntoView({ behavior: "smooth", block: "center" });
        email.focus({ preventScroll: true });
      }
      return;
    }
    if (!paymentsEnabled()) {
      billingStatus.innerHTML = `Payments for ${PLAN_NAMES[code]} open soon. <a href="#early-access-title" data-early-access-link>Join early access</a> and we will email you when it starts. Free keeps working in the meantime.`;
      return;
    }
    billingStatus.textContent = "Opening secure Stripe checkout…";
    try {
      const response = await apiPost("/subscriptions/checkout", { plan_code: code, payment_provider: "stripe" });
      if (typeof response.checkout_url === "string" && response.checkout_url.startsWith("https://checkout.stripe.com/")) {
        window.location.assign(response.checkout_url);
        return;
      }
      billingStatus.textContent = "Checkout is not ready yet. Please try again later.";
    } catch {
      billingStatus.textContent = "Checkout could not open. Check your connection and try again.";
    }
  }

  async function manageBilling() {
    billingStatus.textContent = "Opening your Stripe billing page…";
    try {
      const response = await apiPost("/subscriptions/portal", {});
      if (typeof response.portal_url === "string" && response.portal_url.startsWith("https://billing.stripe.com/")) {
        window.location.assign(response.portal_url);
        return;
      }
      billingStatus.textContent = "The billing page is not available right now.";
    } catch {
      billingStatus.textContent = "The billing page could not open. Please try again.";
    }
  }

  function handleReturnFromStripe() {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (result !== "success" && result !== "cancelled") return;
    billingBanner.hidden = false;
    billingBanner.className = `billing-banner ${result === "success" ? "ok" : ""}`.trim();
    billingBanner.textContent = result === "success"
      ? "Thank you. Your payment went through and your plan is switching on. It can take a minute to show here."
      : "Checkout was cancelled. Nothing was charged.";
    params.delete("checkout");
    const query = params.toString();
    history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}#account-title`);
    showPlans();
    if (result === "success") {
      refreshPlan();
      setTimeout(refreshPlan, 8000);
    }
  }

  if (billingPanel) {
    document.addEventListener("click", (event) => {
      const chooser = event.target.closest("[data-choose-plan]");
      if (!chooser) return;
      const code = chooser.dataset.choosePlan;
      if (chooser.closest(".billing-panel")) {
        choosePlan(code);
        return;
      }
      // Pricing cards on the home page: open Profile at the plans.
      event.preventDefault();
      showPlans();
      if (authToken) choosePlan(code);
      else billingStatus.textContent = `Create a free account or log in above, then choose ${PLAN_NAMES[code] || "a plan"}.`;
    });
    manageButton.addEventListener("click", manageBilling);
    // Refresh when Profile opens and when someone signs in or out.
    new MutationObserver(() => {
      if (!billingPanel.hidden) refreshPlan();
    }).observe(billingPanel, { attributes: true, attributeFilter: ["hidden"] });
    const authBadge = byId("auth-badge");
    if (authBadge) new MutationObserver(refreshPlan).observe(authBadge, { childList: true, characterData: true, subtree: true });
    renderPlan();
    handleReturnFromStripe();
    if (!billingPanel.hidden) refreshPlan();
  }
})();
