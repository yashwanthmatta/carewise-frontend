const emergencyTerms = [
  "chest pain",
  "trouble breathing",
  "shortness of breath",
  "stroke",
  "suicide",
  "severe bleeding",
  "fainting",
  "confusion",
  "face droop",
  "slurred speech",
  "arm weakness",
  "sudden numbness",
  "sudden severe headache",
  "difficulty breathing",
  "difficulty swallowing",
  "swelling of the face",
  "swelling of the tongue",
  "hives",
  "anaphylaxis",
  "wheezing",
  "coughing blood",
  "coughing up blood",
  "severe abdominal pain",
  "right lower abdomen",
  "stiff neck",
  "rash that does not fade",
  "fever and confusion",
  "blue lips",
  "seizure",
  "loss of consciousness",
  "severe dehydration",
  "blood in vomit",
  "black stool",
  "overdose",
  "poison",
  "carbon monoxide",
  "head injury",
  "severe burn",
  "electric shock",
  "near drowning",
  "paralysis",
  "weakness on one side",
  "vaginal bleeding",
  "shoulder pain",
  "high fever",
  "heat stroke",
  "hypothermia",
  "unconscious",
  "cannot wake",
  "severe allergic reaction",
  "bloody diarrhea",
  "severe testicular pain",
  "eye injury",
  "chemical exposure",
  "neck injury",
  "spinal injury",
  "snake bite",
  "animal bite",
  "severe headache",
  "stiff neck",
  "no urine",
  "severe weakness",
];

const emergencyGuidanceRules = [
  {
    label: "Possible stroke",
    terms: ["face droop", "slurred speech", "arm weakness", "weakness on one side", "sudden numbness", "paralysis"],
    action: "Call emergency services now. Note the time symptoms started and do not drive the person yourself.",
  },
  {
    label: "Possible heart or lung emergency",
    terms: ["chest pain", "chest pressure", "shortness of breath", "coughing up blood", "blue lips"],
    action: "Call emergency services now, especially with chest pressure, breathing trouble, sweating, dizziness, or blue lips.",
  },
  {
    label: "Severe allergic reaction",
    terms: ["anaphylaxis", "hives", "swelling of the tongue", "swelling of the face", "difficulty breathing", "difficulty swallowing"],
    action: "Call emergency services now. Use prescribed epinephrine if available and do not delay care.",
  },
  {
    label: "Possible serious infection",
    terms: ["fever and confusion", "stiff neck", "rash that does not fade", "high fever", "severe weakness"],
    action: "Seek emergency medical care now. Infection with confusion, stiff neck, severe weakness, or non-fading rash can be dangerous.",
  },
  {
    label: "Severe injury or bleeding",
    terms: ["severe bleeding", "blood in vomit", "black stool", "head injury", "neck injury", "spinal injury", "severe burn", "electric shock"],
    action: "Seek emergency care now. Do not delay for routine advice, food guidance, or insurance comparison.",
  },
  {
    label: "Poisoning or overdose",
    terms: ["overdose", "poison", "carbon monoxide", "chemical exposure"],
    action: "Call emergency services or Poison Control now. Do not wait for symptoms to get worse.",
  },
  {
    label: "Pregnancy emergency signs",
    terms: ["vaginal bleeding", "shoulder pain", "fainting"],
    action: "Seek emergency care now if pregnancy is possible, especially with severe pain, fainting, shoulder pain, or bleeding.",
  },
  {
    label: "Heat, cold, or water emergency",
    terms: ["heat stroke", "hypothermia", "near drowning", "loss of consciousness", "unconscious", "cannot wake"],
    action: "Call emergency services now. Move to safety and begin basic first aid only if it is safe.",
  },
];

const conditionRules = [
  {
    terms: ["blood pressure", "hypertension", "heart", "cholesterol"],
    label: "Heart and blood pressure support",
    actions: [
      "Track blood pressure readings and bring them to a licensed clinician.",
      "Ask a pharmacist or doctor before changing any medication schedule.",
      "Prioritize a lower-sodium diet, regular walking, sleep consistency, and hydration.",
    ],
  },
  {
    terms: ["diabetes", "sugar", "glucose", "a1c"],
    label: "Blood sugar support",
    actions: [
      "Log meals, glucose readings, energy, and medication timing.",
      "Use nutrition planning with fiber-rich carbs, lean protein, and consistent meal timing.",
      "Schedule a primary care or endocrinology visit if readings are repeatedly high or low.",
    ],
  },
  {
    terms: ["anxiety", "stress", "depression", "sleep", "insomnia"],
    label: "Mental health and sleep support",
    actions: [
      "Create a simple sleep routine with a consistent wake time.",
      "Consider therapy, counseling, or a primary care visit for ongoing anxiety or sleep symptoms.",
      "Use urgent crisis resources immediately for self-harm thoughts.",
    ],
  },
  {
    terms: ["weight", "diet", "nutrition", "obesity", "meal"],
    label: "Nutrition and weight support",
    actions: [
      "Build meals around vegetables, protein, whole grains, and healthy fats.",
      "Set one weekly habit target instead of changing everything at once.",
      "Use a dietitian review for food allergies, chronic disease, or medication interactions.",
    ],
  },
  {
    terms: ["insurance", "doctor", "nearby", "clinic", "appointment", "primary care"],
    label: "Care navigation support",
    actions: [
      "Compare insurance network, deductible, medication coverage, and nearby clinic options.",
      "Search for primary care or urgent care near the patient's location.",
      "Avoid inventing a medical condition when the patient only asks for care navigation.",
    ],
  },
];

const planDetails = {
  basic: {
    name: "Basic",
    summary: "Best for education, reminders, and monthly progress summaries.",
  },
  plus: {
    name: "Plus",
    summary: "Best for active care planning, insurance help, and monthly human check-ins.",
  },
  premium: {
    name: "Premium",
    summary: "Best for complex needs, frequent coaching, and faster doctor matching.",
  },
};

let diseaseCarePlans = [];
let lastGeneratedPlan = null;
let backendPatientId = localStorage.getItem("carewiseBackendPatientId") || "";
let backendAvailable = false;
let authToken = localStorage.getItem("carewiseAuthToken") || "";
let refreshToken = localStorage.getItem("carewiseRefreshToken") || "";
let authEmail = localStorage.getItem("carewiseAuthEmail") || "";
let authRole = localStorage.getItem("carewiseAuthRole") || document.querySelector?.("#auth-role")?.value || "patient";
let emailVerified = localStorage.getItem("carewiseEmailVerified") === "true";
let latestReportId = localStorage.getItem("carewiseLatestReportId") || "";
let latestCheckoutUrl = localStorage.getItem("carewiseCheckoutUrl") || "";
let latestReportQuestionPack = "";
let latestReportSummaryPack = "";
let latestReportAnalysis = null;
let latestReportPerson = "Me";
const REPORT_LANGUAGES = { en: "English", es: "Español" };
let reportLanguage = REPORT_LANGUAGES[localStorage.getItem("carewiseReportLanguage")] ? localStorage.getItem("carewiseReportLanguage") : "en";
const REPORT_TRANSLATIONS = {
  es: {
    ui: {
      eyebrow: "Explicación de CareWise",
      title: "Resumen del informe en lenguaje sencillo",
      found: (count) => `CareWise encontró ${count} punto${count === 1 ? "" : "s"} para comentar en el texto del informe.`,
      detectedValues: "Valores detectados",
      keyFindings: "Hallazgos principales",
      suggestions: "Sugerencias de bienestar",
      questions: "Preguntas para su médico",
      nextStep: "Siguiente paso",
      ask: "Pregunte",
      safetyTitle: "Nota de seguridad",
      safetyText: "Esto no es un diagnóstico ni un plan de tratamiento. Un profesional de salud autorizado debe interpretar su informe original junto con su historial completo.",
      copySummary: "Copiar resumen",
      shareSummary: "Compartir resumen",
      doctorBrief: "Resumen para el médico",
      saveToTrends: "Guardar en tendencias",
      copyQuestions: "Copiar preguntas",
      copyPlan: "Copiar plan",
      draftNotice: "Traducción preliminar, pendiente de revisión por un profesional de salud y un traductor médico. El resumen para el médico se genera en inglés.",
    },
    phrases: {
      "LDL cholesterol": "Colesterol LDL",
      "Total cholesterol": "Colesterol total",
      "Triglycerides": "Triglicéridos",
      "Blood pressure": "Presión arterial",
      "Vitamin D": "Vitamina D",
      "Possible urgent symptom": "Posible síntoma urgente",
      "Readable values": "Valores legibles",
      "Readable report text": "Texto legible del informe",
      "Needs immediate attention": "Necesita atención inmediata",
      "High": "Alto",
      "Needs attention": "Necesita atención",
      "In a better range": "En un rango más favorable",
      "Above common reference target": "Por encima del objetivo de referencia habitual",
      "Above common target": "Por encima del objetivo habitual",
      "Clinician review important": "Es importante que lo revise un profesional",
      "Prediabetes range in many guidelines": "Rango de prediabetes según muchas guías",
      "Often considered in range": "Suele considerarse dentro del rango",
      "Urgent if confirmed with symptoms": "Urgente si se confirma con síntomas",
      "Urgent if confirmed": "Urgente si se confirma",
      "Needs tracking": "Necesita seguimiento",
      "No obvious issue in pasted text": "Sin problemas evidentes en el texto",
      "Mentioned": "Mencionado",
      "Not enough structured data": "No hay suficientes datos estructurados",
      "Needed": "Necesario",
      "In range discussion": "Dentro del rango, para comentar",
      "Clinician review": "Revisión profesional",
      "Urgent review": "Revisión urgente",
      "Routine follow-up": "Seguimiento de rutina",
      "The report text includes symptoms that should not wait for routine AI guidance.": "El texto del informe incluye síntomas que no deben esperar a una orientación de rutina.",
      "Vitamin D appears in the report text, but CareWise could not confidently read the value.": "La vitamina D aparece en el informe, pero CareWise no pudo leer el valor con seguridad.",
      "CareWise needs typed or pasted lab values to explain specific results.": "CareWise necesita los valores del laboratorio escritos o pegados para explicar resultados específicos.",
      "If these symptoms are happening now, seek emergency care or call local emergency services.": "Si estos síntomas están ocurriendo ahora, busque atención de emergencia o llame a los servicios de emergencia locales.",
      "Discuss heart-risk context, diet pattern, exercise, family history, and follow-up timing with a clinician.": "Hable con un profesional de salud sobre su riesgo cardíaco, su alimentación, el ejercicio, sus antecedentes familiares y cuándo hacer seguimiento.",
      "Ask whether fasting status, alcohol, refined carbs, medicines, or thyroid/metabolic factors could affect triglycerides.": "Pregunte si el ayuno, el alcohol, los carbohidratos refinados, los medicamentos o factores tiroideos o metabólicos podrían afectar sus triglicéridos.",
      "Track home blood pressure with time, position, cuff size, and symptoms before your visit.": "Antes de su consulta, registre su presión arterial en casa con la hora, la posición, el tamaño del brazalete y los síntomas.",
      "Paste key lab rows, values, units, and reference flags from the report.": "Pegue las filas principales del informe: valores, unidades e indicadores de referencia.",
      "Build meals around vegetables, fiber-rich carbs, lean protein, and unsaturated fats unless your clinician gave different advice.": "Base sus comidas en verduras, carbohidratos ricos en fibra, proteínas magras y grasas insaturadas, salvo que su profesional de salud le haya indicado otra cosa.",
      "Aim for consistent walking or movement you can repeat most days, adjusted for your clinician's guidance.": "Procure caminar o moverse de forma constante la mayoría de los días, según las indicaciones de su profesional de salud.",
      "Type or paste your lab results first, or press Try sample report.": "Escriba o pegue primero sus resultados, o pulse «Try sample report».",
      "Ask a licensed professional to review the original report.": "Pida a un profesional de salud autorizado que revise el informe original.",
      "What LDL goal is appropriate for me based on my age, family history, blood pressure, and other risks?": "¿Qué meta de LDL es adecuada para mí según mi edad, mis antecedentes familiares, mi presión arterial y otros riesgos?",
      "Does my A1C need repeat testing or a diabetes care plan?": "¿Necesito repetir la prueba de A1C o un plan de atención para la diabetes?",
      "What changes would help lower my A1C safely over the next 3 months?": "¿Qué cambios me ayudarían a bajar mi A1C de forma segura en los próximos 3 meses?",
      "Should I repeat Vitamin D testing or discuss supplementation dose and duration?": "¿Debo repetir la prueba de vitamina D o hablar sobre la dosis y la duración de un suplemento?",
      "Which results matter most for me, and when should I repeat labs?": "¿Qué resultados son más importantes para mí y cuándo debo repetir los análisis?",
      "Should I see primary care, a dietitian, or a specialist based on these results?": "Según estos resultados, ¿debo ver a mi médico de cabecera, a un nutricionista o a un especialista?",
      "Which values from my original report should I focus on first?": "¿En qué valores de mi informe original debo fijarme primero?",
      "Should any lab values be repeated or reviewed with more health history?": "¿Se debe repetir algún valor o revisarlo con más antecedentes de salud?",
      "Would primary care, a dietitian, pharmacist, or specialist be the right next step?": "¿El siguiente paso adecuado sería mi médico de cabecera, un nutricionista, un farmacéutico o un especialista?",
    },
    patterns: [
      [/^LDL appears around (.+) mg\/dL\.$/, "El LDL aparece alrededor de $1 mg/dL."],
      [/^Total cholesterol appears around (.+) mg\/dL\.$/, "El colesterol total aparece alrededor de $1 mg/dL."],
      [/^Triglycerides appear around (.+) mg\/dL\.$/, "Los triglicéridos aparecen alrededor de $1 mg/dL."],
      [/^A1C appears around (.+)%\.$/, "La A1C aparece alrededor de $1 %."],
      [/^Systolic blood pressure appears around (.+)\.$/, "La presión arterial sistólica aparece alrededor de $1."],
      [/^Vitamin D appears around (.+)\.$/, "La vitamina D aparece alrededor de $1."],
    ],
  },
};

const REPORT_UI_EN = {
  eyebrow: "CareWise explanation",
  title: "Plain-English report summary",
  found: (count) => `CareWise found ${count} discussion point${count === 1 ? "" : "s"} in the readable report text.`,
  detectedValues: "Detected values",
  keyFindings: "Key findings",
  suggestions: "Wellness suggestions",
  questions: "Questions to ask your doctor",
  nextStep: "Next step",
  ask: "Ask",
  safetyTitle: "Safety note",
  safetyText: "This is not a diagnosis or treatment plan. A licensed professional should interpret your original report with your full history.",
  copySummary: "Copy summary",
  shareSummary: "Share summary",
  doctorBrief: "Doctor brief",
  saveToTrends: "Save to trends",
  copyQuestions: "Copy questions",
  copyPlan: "Copy plan",
  draftNotice: "",
};

// Personal plan built from a person's own report values, using published public
// guidelines. Education only: it never names medicines or doses, and it gives
// no exercise plan when the report suggests urgent care.
// Generated from carewise-mobile-app/src/personalPlan.ts; keep the two identical.
const PLAN_TEXT = {
    en: {
        title: "Your plan for the next 4 weeks",
        whyLabel: "Why",
        sourceLabel: "Source",
        food: "Food",
        move: "Movement",
        track: "Track",
        safety: "Before you start",
        heartFat: "Swap saturated fats: use olive or canola oil instead of butter, and choose fish, beans, skinless poultry or low-fat dairy more often than fatty red or processed meat.",
        heartFiber: "Add soluble fiber every day: oats, beans, lentils, barley, apples or citrus fruit.",
        heartFish: "Eat fish such as salmon or sardines about twice a week.",
        trigSugar: "Cut back on sugary drinks, sweets and white bread, rice or pasta; choose whole grains instead.",
        trigAlcohol: "Limit alcohol, which can raise triglycerides.",
        a1cPlate: "Use the plate method: half non-starchy vegetables, a quarter lean protein and a quarter whole grains or starchy food.",
        a1cDrinks: "Drink water or unsweetened tea or coffee instead of soda and juice.",
        a1cWeight: "If you are overweight, losing 5 to 7% of your body weight can lower your chance of type 2 diabetes.",
        bpDash: "Follow a DASH-style eating pattern: plenty of fruit, vegetables, beans, nuts, whole grains and low-fat dairy.",
        bpSalt: "Keep salt (sodium) under 2,300 mg a day; check labels on bread, soups, sauces and restaurant food.",
        vitdFood: "Include vitamin D foods such as fatty fish, eggs, and fortified milk or cereal.",
        balanced: "Keep a balanced pattern: vegetables and fruit at most meals, whole grains, and protein from fish, beans, nuts or poultry.",
        move150: "Aim for 150 minutes a week of moderate activity, such as brisk walking for 30 minutes on 5 days.",
        moveStrength: "Add muscle-strengthening activity, like bodyweight exercises or resistance bands, on 2 days a week.",
        moveStart: "If you are not active now, start with 10 minutes a day and add a few minutes each week.",
        moveMeals: "A short walk after meals can help keep blood sugar steadier.",
        moveAsk: "Ask your clinician what level of activity is safe for you, especially if you have chest pain, dizziness or heart disease.",
        urgentMove: "Do not start a new exercise plan now. The report mentions urgent symptoms or very high blood pressure: get medical care first.",
        trackBp: "Check your blood pressure at home a few times a week and bring the readings to your visit.",
        trackA1c: "Ask your doctor when to repeat your A1C test.",
        trackLipids: "Ask your doctor when to repeat your cholesterol test.",
        trackDiary: "Write down what you eat and how much you move for one week before your next visit.",
        safetyAsk: "If you take medicines, are pregnant, or have kidney disease, diabetes or an eating disorder, ask your clinician before changing your diet or exercise.",
        safetyVitd: "Ask your clinician before starting a vitamin D supplement or choosing a dose.",
        safetyGeneral: "This plan is general education based on public guidelines, not a prescription.",
        reactions: (names) => `Your health record says these did not suit you: ${names}. Check new foods and supplements against it.`,
        whyLdl: (v) => `Your LDL is ${v} mg/dL (130 or higher).`,
        whyTotal: (v) => `Your total cholesterol is ${v} mg/dL (200 or higher).`,
        whyTrig: (v) => `Your triglycerides are ${v} mg/dL (150 or higher).`,
        whyA1c: (v) => `Your A1C is ${v}% (${v >= 6.5 ? "6.5" : "5.7"}% or higher).`,
        whyBp: (v) => `Your blood pressure is ${v} (130/80 or higher).`,
        whyVitd: (v) => `Your vitamin D is ${v} ng/mL (below 30).`,
        whyAdults: "Recommended for most adults."
    },
    es: {
        title: "Su plan para las próximas 4 semanas",
        whyLabel: "Por qué",
        sourceLabel: "Fuente",
        food: "Comida",
        move: "Actividad física",
        track: "Seguimiento",
        safety: "Antes de empezar",
        heartFat: "Cambie las grasas saturadas: use aceite de oliva o de canola en vez de mantequilla, y elija pescado, frijoles, pollo sin piel o lácteos bajos en grasa más a menudo que carnes rojas grasas o procesadas.",
        heartFiber: "Añada fibra soluble cada día: avena, frijoles, lentejas, cebada, manzanas o cítricos.",
        heartFish: "Coma pescado, como salmón o sardinas, unas dos veces por semana.",
        trigSugar: "Reduzca las bebidas azucaradas, los dulces y el pan, arroz o pasta blancos; elija granos integrales.",
        trigAlcohol: "Limite el alcohol, que puede subir los triglicéridos.",
        a1cPlate: "Use el método del plato: la mitad verduras sin almidón, un cuarto proteína magra y un cuarto granos integrales o alimentos con almidón.",
        a1cDrinks: "Tome agua, o té o café sin azúcar, en lugar de refrescos y jugos.",
        a1cWeight: "Si tiene sobrepeso, perder del 5 al 7 % de su peso puede reducir la probabilidad de diabetes tipo 2.",
        bpDash: "Siga un patrón de alimentación tipo DASH: muchas frutas, verduras, frijoles, nueces, granos integrales y lácteos bajos en grasa.",
        bpSalt: "Mantenga la sal (sodio) por debajo de 2,300 mg al día; revise las etiquetas del pan, sopas, salsas y comida de restaurante.",
        vitdFood: "Incluya alimentos con vitamina D, como pescado graso, huevos y leche o cereal fortificados.",
        balanced: "Mantenga un patrón equilibrado: verduras y fruta en la mayoría de las comidas, granos integrales y proteína de pescado, frijoles, nueces o pollo.",
        move150: "Intente hacer 150 minutos a la semana de actividad moderada, como caminar a paso rápido 30 minutos 5 días.",
        moveStrength: "Añada ejercicios para fortalecer los músculos, con su propio peso o bandas elásticas, 2 días a la semana.",
        moveStart: "Si ahora no hace actividad, empiece con 10 minutos al día y añada unos minutos cada semana.",
        moveMeals: "Una caminata corta después de comer puede ayudar a mantener el azúcar en sangre más estable.",
        moveAsk: "Pregunte a su profesional de salud qué nivel de actividad es seguro para usted, sobre todo si tiene dolor en el pecho, mareos o enfermedad del corazón.",
        urgentMove: "No empiece ahora un nuevo plan de ejercicio. El informe menciona síntomas urgentes o presión arterial muy alta: busque atención médica primero.",
        trackBp: "Mida su presión arterial en casa algunas veces por semana y lleve las lecturas a su cita.",
        trackA1c: "Pregunte a su médico cuándo repetir su prueba de A1C.",
        trackLipids: "Pregunte a su médico cuándo repetir su prueba de colesterol.",
        trackDiary: "Anote lo que come y cuánto se mueve durante una semana antes de su próxima cita.",
        safetyAsk: "Si toma medicamentos, está embarazada o tiene enfermedad renal, diabetes o un trastorno alimentario, consulte a su profesional de salud antes de cambiar su dieta o ejercicio.",
        safetyVitd: "Consulte a su profesional de salud antes de empezar un suplemento de vitamina D o elegir una dosis.",
        safetyGeneral: "Este plan es educación general basada en guías públicas, no una receta médica.",
        reactions: (names) => `Su historial dice que esto no le sentó bien: ${names}. Revise los alimentos y suplementos nuevos con esa lista.`,
        whyLdl: (v) => `Su LDL es ${v} mg/dL (130 o más).`,
        whyTotal: (v) => `Su colesterol total es ${v} mg/dL (200 o más).`,
        whyTrig: (v) => `Sus triglicéridos son ${v} mg/dL (150 o más).`,
        whyA1c: (v) => `Su A1C es ${v} % (${v >= 6.5 ? "6.5" : "5.7"} % o más).`,
        whyBp: (v) => `Su presión arterial es ${v} (130/80 o más).`,
        whyVitd: (v) => `Su vitamina D es ${v} ng/mL (menos de 30).`,
        whyAdults: "Recomendado para la mayoría de los adultos."
    }
};
const SOURCES = {
    aha: "American Heart Association",
    ada: "American Diabetes Association",
    cdcDpp: "CDC National Diabetes Prevention Program",
    dash: "NHLBI DASH eating plan",
    nih: "NIH Office of Dietary Supplements",
    dga: "Dietary Guidelines for Americans",
    cdcActivity: "CDC Physical Activity Guidelines"
};
function planNumber(values, label) {
    const found = values.find((item) => item.label === label);
    const value = found ? Number(found.value) : NaN;
    return Number.isFinite(value) ? value : null;
}
function buildPersonalPlan(analysis, language = "en", reactions = []) {
    const t = PLAN_TEXT[language] || PLAN_TEXT.en;
    const values = analysis.labValues || [];
    const ldl = planNumber(values, "LDL cholesterol");
    const total = planNumber(values, "Total cholesterol");
    const trig = planNumber(values, "Triglycerides");
    const a1c = planNumber(values, "A1C");
    const vitd = planNumber(values, "Vitamin D");
    const bpText = String(values.find((item) => item.label === "Blood pressure")?.value ?? "");
    const [systolic, diastolic] = bpText.split("/").map(Number);
    const highBp = (Number.isFinite(systolic) && systolic >= 130) || (Number.isFinite(diastolic) && diastolic >= 80);
    const urgent = analysis.riskLevel === "urgent" || (Number.isFinite(systolic) && systolic >= 180);
    const heart = (ldl !== null && ldl >= 130) || (total !== null && total >= 200);
    const heartWhy = ldl !== null && ldl >= 130 ? t.whyLdl(ldl) : total !== null ? t.whyTotal(total) : "";
    const food = [];
    if (heart) {
        food.push({ text: t.heartFat, why: heartWhy, source: SOURCES.aha });
        food.push({ text: t.heartFiber, why: heartWhy, source: SOURCES.aha });
        food.push({ text: t.heartFish, why: heartWhy, source: SOURCES.aha });
    }
    if (trig !== null && trig >= 150) {
        food.push({ text: t.trigSugar, why: t.whyTrig(trig), source: SOURCES.aha });
        food.push({ text: t.trigAlcohol, why: t.whyTrig(trig), source: SOURCES.aha });
    }
    if (a1c !== null && a1c >= 5.7) {
        food.push({ text: t.a1cPlate, why: t.whyA1c(a1c), source: SOURCES.ada });
        food.push({ text: t.a1cDrinks, why: t.whyA1c(a1c), source: SOURCES.ada });
        if (a1c < 6.5)
            food.push({ text: t.a1cWeight, why: t.whyA1c(a1c), source: SOURCES.cdcDpp });
    }
    if (highBp) {
        food.push({ text: t.bpDash, why: t.whyBp(bpText), source: SOURCES.dash });
        food.push({ text: t.bpSalt, why: t.whyBp(bpText), source: SOURCES.aha });
    }
    if (vitd !== null && vitd < 30)
        food.push({ text: t.vitdFood, why: t.whyVitd(vitd), source: SOURCES.nih });
    if (!food.length)
        food.push({ text: t.balanced, source: SOURCES.dga });
    const move = urgent
        ? [{ text: t.urgentMove }]
        : [
            { text: t.move150, why: t.whyAdults, source: SOURCES.cdcActivity },
            { text: t.moveStrength, why: t.whyAdults, source: SOURCES.cdcActivity },
            { text: t.moveStart, source: SOURCES.cdcActivity },
            ...(a1c !== null && a1c >= 5.7 ? [{ text: t.moveMeals, why: t.whyA1c(a1c), source: SOURCES.ada }] : []),
            ...(heart || highBp ? [{ text: t.moveAsk }] : [])
        ];
    const track = [];
    if (highBp)
        track.push({ text: t.trackBp, why: t.whyBp(bpText), source: SOURCES.aha });
    if (a1c !== null && a1c >= 5.7)
        track.push({ text: t.trackA1c, why: t.whyA1c(a1c) });
    if (heart || (trig !== null && trig >= 150))
        track.push({ text: t.trackLipids, why: heartWhy || (trig !== null ? t.whyTrig(trig) : "") });
    track.push({ text: t.trackDiary });
    const safety = [{ text: t.safetyAsk }];
    if (vitd !== null && vitd < 30)
        safety.push({ text: t.safetyVitd });
    const reactionNames = reactions.map((name) => String(name).trim()).filter(Boolean).slice(0, 8);
    if (reactionNames.length)
        safety.push({ text: t.reactions(reactionNames.join(", ")) });
    safety.push({ text: t.safetyGeneral });
    return {
        title: t.title,
        urgent,
        whyLabel: t.whyLabel,
        sourceLabel: t.sourceLabel,
        sections: [
            { key: "food", title: t.food, items: food },
            { key: "move", title: t.move, items: move },
            { key: "track", title: t.track, items: track },
            { key: "safety", title: t.safety, items: safety }
        ]
    };
}

const defaultBackendBaseUrl = "https://carewise-api.onrender.com";
let backendBaseUrl = localStorage.getItem("carewiseApiUrl") || defaultBackendBaseUrl;
let backendFeatures = {};
let backendReadiness = {};
let subscriptionPlans = [];

fetch("disease_precaution_diet_matrix.json")
  .then((response) => response.json())
  .then((plans) => {
    diseaseCarePlans = plans;
  })
  .catch(() => {
    diseaseCarePlans = [];
  });

const form = document.querySelector("#patient-form");
const results = document.querySelector("#results");
const apiUrlInput = document.querySelector("#api-url");
const authBadge = document.querySelector("#auth-badge");
const authStatus = document.querySelector("#auth-status");
const signedInLabel = document.querySelector("#signed-in-label");
const signedInDetail = document.querySelector("#signed-in-detail");
const backendBadge = document.querySelector("#backend-badge");
const backendStatus = document.querySelector("#backend-status");
const reportBadge = document.querySelector("#report-badge");
const reportStatus = document.querySelector("#report-status");
const ocrStatus = document.querySelector("#ocr-status");
const reportResults = document.querySelector("#report-results");
const reportQuestion = document.querySelector("#report-question");
const reportAnswer = document.querySelector("#report-answer");
const reportEvalResults = document.querySelector("#report-eval-results");
const reportEvalStatus = document.querySelector("#report-eval-status");
const labTrendStatus = document.querySelector("#lab-trend-status");
const labTrendList = document.querySelector("#lab-trend-list");
const paymentBadge = document.querySelector("#payment-badge");
const paymentStatus = document.querySelector("#payment-status");
const dashboardStats = document.querySelector("#dashboard-stats");
const profileStatus = document.querySelector("#profile-status");
const reportHistoryList = document.querySelector(".v1-history-list");
const savedPlans = document.querySelector("#saved-plans");
const mealPlannerStatus = document.querySelector("#meal-planner-status");
const mealPlanList = document.querySelector("#meal-plan-list");
const symptomStatus = document.querySelector("#symptom-status");
const symptomList = document.querySelector("#symptom-list");
const safetyCheckStatus = document.querySelector("#safety-check-status");
const safetyCheckList = document.querySelector("#safety-check-list");
const checkinStatus = document.querySelector("#checkin-status");
const checkinHistory = document.querySelector("#checkin-history");
const goalStatus = document.querySelector("#goal-status");
const goalList = document.querySelector("#goal-list");
const barrierStatus = document.querySelector("#barrier-status");
const barrierList = document.querySelector("#barrier-list");
const reminderStatus = document.querySelector("#reminder-status");
const reminderList = document.querySelector("#reminder-list");
const monthlyCalendarStatus = document.querySelector("#monthly-calendar-status");
const monthlyCalendarList = document.querySelector("#monthly-calendar-list");
const navigationStatus = document.querySelector("#navigation-status");
const navigationList = document.querySelector("#navigation-list");
const careTeamStatus = document.querySelector("#care-team-status");
const careTeamList = document.querySelector("#care-team-list");
const visitBriefStatus = document.querySelector("#visit-brief-status");
const visitBriefList = document.querySelector("#visit-brief-list");
const visitBriefOutput = document.querySelector("#visit-brief-output");
const visitBriefReadiness = document.querySelector("#visit-brief-readiness");
const carePacketStatus = document.querySelector("#care-packet-status");
const carePacketList = document.querySelector("#care-packet-list");
const carePacketOutput = document.querySelector("#care-packet-output");
const carePacketReadiness = document.querySelector("#care-packet-readiness");
const supportStatus = document.querySelector("#support-status");
const supportList = document.querySelector("#support-list");
const qaStatus = document.querySelector("#qa-status");
const qaResults = document.querySelector("#qa-results");
const medicationStatus = document.querySelector("#medication-status");
const medicationList = document.querySelector("#medication-list");
const reviewQueue = document.querySelector("#review-queue");
const reviewStatus = document.querySelector("#review-status");
const reviewFilters = document.querySelectorAll("[data-review-filter]");
const reviewSyncSummary = document.querySelector("#review-sync-summary");
const reviewDemoStatus = document.querySelector("#review-demo-status");
const reviewDemoChecklist = document.querySelector("#review-demo-checklist");
const reviewDemoGuidance = document.querySelector("#review-demo-guidance");
const reviewDemoOutcome = document.querySelector("#review-demo-outcome");
const reviewDemoTimeline = document.querySelector("#review-demo-timeline");
const auditTrail = document.querySelector("#audit-trail");
const exportStatus = document.querySelector("#export-status");
const exportOutput = document.querySelector("#export-output");
const exportSummary = document.querySelector("#export-summary");
const securityReadiness = document.querySelector("#security-readiness");
const networkStatus = document.querySelector("#network-status");
const installAppButton = document.querySelector("#install-app");
const homeReadiness = document.querySelector("#home-readiness");
const launchProof = document.querySelector("#launch-proof");
const launchProofStatus = document.querySelector("#launch-proof-status");
const preflightReport = document.querySelector("#preflight-report");
const preflightStatus = document.querySelector("#preflight-status");
const storeDisclosureOutput = document.querySelector("#store-disclosure-output");
const storeDisclosureStatus = document.querySelector("#store-disclosure-status");
const demoScriptResults = document.querySelector("#demo-script-results");
const demoScriptStatus = document.querySelector("#demo-script-status");
const investorBriefOutput = document.querySelector("#investor-brief-output");
const investorBriefStatus = document.querySelector("#investor-brief-status");
const pilotLeads = document.querySelector("#pilot-leads");
const pilotStatus = document.querySelector("#pilot-status");
let deferredInstallPrompt = null;
let activeReviewFilter = "all";

loadProfile();
loadConsent();
initializeCheckinDate();
initializeSymptomDate();
renderSavedPlans();
renderSymptomTimeline();
renderCheckins();
renderGoals();
renderBarriers();
renderReminders();
initializeMonthlyCalendarDate();
renderMonthlyCalendars();
renderNavigationPrep();
renderCareTeamContacts();
renderVisitBriefs();
renderCarePackets();
renderSupportRequests();
renderQaReport();
renderMedications();
renderSafetyChecks();
renderReviewQueue();
renderAuditTrail();
renderReportHistory();
initializeLabDate();
renderLabTrends();
renderDashboardStats();
renderMealPlans();
renderReviewDemoChecklist();
renderReviewDemoOutcome();
renderReviewDemoTimeline();
renderLaunchProof();
renderDemoScript();
renderPilotLeads();
initializeAccountPanel();
initializeInstallAndNetworkStatus();
initializeWorkspaceNavigation();
wakeBackendOnLoad();

document.querySelector("#signup").addEventListener("click", () => {
  signup();
});

document.querySelector("#login").addEventListener("click", () => {
  login();
});

document.querySelector("#logout").addEventListener("click", () => {
  logout();
});

document.querySelector("#fill-clinician-account").addEventListener("click", () => {
  fillTeamAccount("clinician");
});

document.querySelector("#fill-admin-account").addEventListener("click", () => {
  fillTeamAccount("admin");
});

document.querySelector("#record-consent").addEventListener("click", () => {
  recordConsentToBackend(true);
});

document.querySelector("#request-email-verification").addEventListener("click", () => {
  requestEmailVerification();
});

document.querySelector("#confirm-email-verification").addEventListener("click", () => {
  confirmEmailVerification();
});

document.querySelector("#password-reset").addEventListener("click", () => {
  requestPasswordReset();
});

document.querySelector("#confirm-password-reset").addEventListener("click", () => {
  confirmPasswordReset();
});

apiUrlInput.addEventListener("change", () => {
  backendBaseUrl = apiUrlInput.value.trim() || defaultBackendBaseUrl;
  localStorage.setItem("carewiseApiUrl", backendBaseUrl);
  checkBackend(true);
});

document.querySelector("#check-backend").addEventListener("click", () => {
  checkBackend(true);
});

document.querySelector("#sync-profile").addEventListener("click", () => {
  syncProfileToBackend();
});

document.querySelector("#copy-launch-proof").addEventListener("click", () => {
  copyLaunchProof();
});

document.querySelector("#refresh-launch-proof").addEventListener("click", async () => {
  launchProofStatus.textContent = "Refreshing live proof checks.";
  await checkBackend(false);
  renderLaunchProof();
  launchProofStatus.textContent = "Launch proof refreshed.";
});

document.querySelector("#run-preflight").addEventListener("click", () => {
  runLaunchPreflight();
});

document.querySelector("#copy-store-disclosure").addEventListener("click", () => {
  copyStoreDisclosure();
});

document.querySelector("#build-demo-script").addEventListener("click", () => {
  buildDemoScript();
});

document.querySelector("#copy-demo-script").addEventListener("click", () => {
  copyDemoScript();
});

document.querySelector("#generate-investor-brief").addEventListener("click", () => {
  generateInvestorBrief();
});

document.querySelector("#save-pilot-lead").addEventListener("click", () => {
  savePilotLead();
});

document.querySelector("#add-sample-pilot").addEventListener("click", () => {
  fillSamplePilotLead();
});

document.querySelector("#copy-pilot-list").addEventListener("click", () => {
  copyPilotList();
});

document.querySelector("#upload-report").addEventListener("click", () => {
  uploadReport();
});

document.querySelector("#history-person-filter")?.addEventListener("change", () => {
  renderReportHistory();
});

document.querySelector("#report-file")?.addEventListener("change", () => {
  handleReportFileSelection();
});

document.querySelector("#analyze-report").addEventListener("click", () => {
  analyzeLatestReport();
});

document.querySelector("#load-reports").addEventListener("click", () => {
  loadReports();
});

document.querySelector("#ask-report-question")?.addEventListener("click", () => {
  answerReportQuestion();
});

reportResults?.addEventListener("change", (event) => {
  if (event.target.matches("[data-report-language]")) setReportLanguage(event.target.value);
});

reportResults?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-report-action]")?.dataset.reportAction;
  if (action === "copy-summary") copyReportSummary();
  if (action === "share-summary") shareReportSummary();
  if (action === "copy-questions") copyReportQuestions();
  if (action === "copy-plan") copyPersonalPlan();
  if (action === "doctor-brief") openDoctorBrief();
  if (action === "save-detected-values") saveDetectedValuesToTrends();
  if (action === "open-history") openReportHistoryItem(event.target.closest("[data-report-id]")?.dataset.reportId || "");
});

reportHistoryList?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-report-action]")?.dataset.reportAction;
  if (action === "open-history") openReportHistoryItem(event.target.closest("[data-report-id]")?.dataset.reportId || "");
});

document.querySelector("#run-report-eval").addEventListener("click", () => {
  runReportSafetyEvaluation();
});

document.querySelector("#copy-report-eval").addEventListener("click", () => {
  copyReportEvaluation();
});

document.querySelector("#sample-lab-trend").addEventListener("click", () => {
  fillSampleLabTrends();
});

document.querySelector("#save-lab-trend").addEventListener("click", () => {
  saveLabTrend();
});

document.querySelector("#copy-lab-trends").addEventListener("click", () => {
  copyLabTrends();
});

document.querySelector("#load-lab-trends").addEventListener("click", () => {
  loadLabTrendsFromBackend();
});

document.querySelector("#clear-lab-trends").addEventListener("click", () => {
  localStorage.removeItem("carewiseLabTrends");
  renderLabTrends();
  labTrendStatus.textContent = "Lab values cleared.";
});

document.querySelector("#sample-meal-plan").addEventListener("click", () => {
  fillSampleMealPlanPreferences();
});

document.querySelector("#build-meal-plan").addEventListener("click", () => {
  buildMealPlan();
});

document.querySelector("#copy-meal-plan").addEventListener("click", () => {
  copyMealPlan();
});

document.querySelector("#clear-meal-plans").addEventListener("click", () => {
  localStorage.removeItem("carewiseMealPlans");
  renderMealPlans();
  mealPlannerStatus.textContent = "Meal plans cleared.";
});

document.querySelector("#sample-safety-check").addEventListener("click", () => {
  addSampleSafetyData();
});

document.querySelector("#run-safety-check").addEventListener("click", () => {
  runSafetyCheck();
});

document.querySelector("#copy-safety-check").addEventListener("click", () => {
  copySafetyCheck();
});

document.querySelector("#clear-safety-checks").addEventListener("click", () => {
  localStorage.removeItem("carewiseSafetyChecks");
  renderSafetyChecks();
  safetyCheckStatus.textContent = "Safety check history cleared.";
});

document.querySelector("#sample-symptom").addEventListener("click", () => {
  fillSampleSymptom();
});

document.querySelector("#save-symptom").addEventListener("click", () => {
  saveSymptomEntry();
});

document.querySelector("#copy-symptoms").addEventListener("click", () => {
  copySymptomTimeline();
});

document.querySelector("#clear-symptoms").addEventListener("click", () => {
  localStorage.removeItem("carewiseSymptomTimeline");
  renderSymptomTimeline();
  symptomStatus.textContent = "Symptom timeline cleared.";
});

document.querySelector("#sample-goal").addEventListener("click", () => {
  fillSampleGoal();
});

document.querySelector("#save-goal").addEventListener("click", () => {
  saveGoal();
});

document.querySelector("#copy-goals").addEventListener("click", () => {
  copyGoals();
});

document.querySelector("#clear-goals").addEventListener("click", () => {
  localStorage.removeItem("carewiseGoals");
  renderGoals();
  goalStatus.textContent = "Weekly goals cleared.";
});

document.querySelector("#sample-barrier").addEventListener("click", () => {
  fillSampleBarrier();
});

document.querySelector("#save-barrier").addEventListener("click", () => {
  saveBarrier();
});

document.querySelector("#copy-barriers").addEventListener("click", () => {
  copyBarriers();
});

document.querySelector("#clear-barriers").addEventListener("click", () => {
  localStorage.removeItem("carewiseBarriers");
  renderBarriers();
  barrierStatus.textContent = "Barrier list cleared.";
});

document.querySelector("#sample-reminder").addEventListener("click", () => {
  fillSampleReminder();
});

document.querySelector("#save-reminder").addEventListener("click", () => {
  saveReminder();
});

document.querySelector("#copy-reminders").addEventListener("click", () => {
  copyReminders();
});

document.querySelector("#clear-reminders").addEventListener("click", () => {
  localStorage.removeItem("carewiseReminders");
  renderReminders();
  reminderStatus.textContent = "Reminder plan cleared.";
});

document.querySelector("#sample-monthly-calendar").addEventListener("click", () => {
  fillSampleMonthlyCalendar();
});

document.querySelector("#build-monthly-calendar").addEventListener("click", () => {
  buildMonthlyCalendar();
});

document.querySelector("#copy-monthly-calendar").addEventListener("click", () => {
  copyMonthlyCalendar();
});

document.querySelector("#clear-monthly-calendar").addEventListener("click", () => {
  localStorage.removeItem("carewiseMonthlyCalendars");
  renderMonthlyCalendars();
  monthlyCalendarStatus.textContent = "Monthly calendars cleared.";
});

document.querySelector("#sample-navigation").addEventListener("click", () => {
  fillSampleNavigationPrep();
});

document.querySelector("#save-navigation").addEventListener("click", () => {
  saveNavigationPrep();
});

document.querySelector("#copy-navigation").addEventListener("click", () => {
  copyNavigationPrep();
});

document.querySelector("#clear-navigation").addEventListener("click", () => {
  localStorage.removeItem("carewiseNavigationPrep");
  renderNavigationPrep();
  navigationStatus.textContent = "Care navigation prep cleared.";
});

document.querySelector("#sample-care-team").addEventListener("click", () => {
  fillSampleCareTeamContact();
});

document.querySelector("#save-care-team").addEventListener("click", () => {
  saveCareTeamContact();
});

document.querySelector("#copy-care-team").addEventListener("click", () => {
  copyCareTeamContacts();
});

document.querySelector("#clear-care-team").addEventListener("click", () => {
  localStorage.removeItem("carewiseCareTeamContacts");
  renderCareTeamContacts();
  careTeamStatus.textContent = "Care team contacts cleared.";
});

document.querySelector("#sample-visit-brief").addEventListener("click", () => {
  addSampleVisitBriefData();
});

document.querySelector("#build-visit-brief").addEventListener("click", () => {
  buildVisitBrief();
});

document.querySelector("#copy-visit-brief").addEventListener("click", () => {
  copyVisitBrief();
});

document.querySelector("#clear-visit-briefs").addEventListener("click", () => {
  localStorage.removeItem("carewiseVisitBriefs");
  renderVisitBriefs();
  visitBriefStatus.textContent = "Visit briefs cleared.";
});

document.querySelector("#sample-care-packet").addEventListener("click", () => {
  addSampleCarePacketData();
});

document.querySelector("#build-care-packet").addEventListener("click", () => {
  buildCarePacket();
});

document.querySelector("#copy-care-packet").addEventListener("click", () => {
  copyCarePacket();
});

document.querySelector("#clear-care-packets").addEventListener("click", () => {
  localStorage.removeItem("carewiseCarePackets");
  renderCarePackets();
  carePacketStatus.textContent = "Care packets cleared.";
});

document.querySelector("#sample-support").addEventListener("click", () => {
  fillSampleSupportRequest();
});

document.querySelector("#save-support").addEventListener("click", () => {
  saveSupportRequest();
});

document.querySelector("#copy-support").addEventListener("click", () => {
  copySupportRequests();
});

document.querySelector("#clear-support").addEventListener("click", () => {
  localStorage.removeItem("carewiseSupportRequests");
  renderSupportRequests();
  supportStatus.textContent = "Support inbox cleared.";
});

document.querySelector("#run-qa-checklist").addEventListener("click", () => {
  runQaChecklist();
});

document.querySelector("#copy-qa-report").addEventListener("click", () => {
  copyQaReport();
});

document.querySelector("#clear-qa").addEventListener("click", () => {
  localStorage.removeItem("carewiseQaReports");
  renderQaReport();
  qaStatus.textContent = "QA report cleared.";
});

document.querySelector("#run-demo-flow").addEventListener("click", () => {
  runSampleCarePlanDemo();
});

document.querySelector("#sample-report-text").addEventListener("click", () => {
  fillSampleReportText();
});

document.querySelector("#sample-intake").addEventListener("click", () => {
  fillSampleIntake();
});

document.querySelector("#save-profile").addEventListener("click", () => {
  saveProfile();
  profileStatus.textContent = "Profile saved on this device.";
  syncProfileToBackend(false);
});

document.querySelector("#clear-saved").addEventListener("click", () => {
  localStorage.removeItem("carewiseReports");
  localStorage.removeItem("carewiseLatestReportId");
  latestReportId = "";
  renderReportHistory();
  renderDashboardStats();
  reportStatus.textContent = "Report history cleared on this device.";
});

document.querySelector("#save-checkin").addEventListener("click", () => {
  saveCheckin();
});

document.querySelector("#sample-checkin").addEventListener("click", () => {
  fillSampleCheckin();
});

document.querySelector("#clear-checkins").addEventListener("click", () => {
  localStorage.removeItem("carewiseCheckins");
  renderCheckins();
  checkinStatus.textContent = "Check-ins cleared on this device.";
});

document.querySelector("#privacy-consent").addEventListener("change", () => {
  localStorage.setItem("carewiseConsent", JSON.stringify({
    accepted: document.querySelector("#privacy-consent").checked,
    updatedAt: new Date().toISOString(),
  }));
  renderConsentStatus();
  updateProgressRail();
  if (document.querySelector("#privacy-consent").checked) recordConsentToBackend(false);
});

document.querySelector("#save-medication").addEventListener("click", () => {
  saveMedication();
});

document.querySelector("#sample-medication").addEventListener("click", () => {
  fillSampleMedication();
});

document.querySelector("#clear-medications").addEventListener("click", () => {
  localStorage.removeItem("carewiseMedications");
  renderMedications();
  medicationStatus.textContent = "Medications cleared on this device.";
});

document.querySelector("#clear-review-queue").addEventListener("click", () => {
  localStorage.removeItem("carewiseReviewQueue");
  addAuditEvent("review_queue_cleared", "Clinician review queue cleared locally.");
  renderReviewQueue();
  renderAuditTrail();
  renderDashboardStats();
});

document.querySelector("#sample-review-item").addEventListener("click", () => {
  addSampleReviewItem();
});

reviewFilters.forEach((button) => {
  button.addEventListener("click", () => {
    activeReviewFilter = button.dataset.reviewFilter || "all";
    reviewFilters.forEach((filter) => filter.classList.toggle("active", filter === button));
    renderReviewQueue();
  });
});

document.querySelector("#load-backend-review").addEventListener("click", () => {
  loadBackendReviewQueue();
});

document.querySelector("#load-admin-summary").addEventListener("click", () => {
  loadAdminSummary();
});

document.querySelector("#review-demo-run-all").addEventListener("click", () => {
  runFullReviewDemo();
});

document.querySelector("#review-demo-team").addEventListener("click", () => {
  fillTeamAccount("clinician", false);
  reviewDemoStatus.textContent = "Clinician role filled. Create the account once or log in, then continue the demo.";
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
});

document.querySelector("#review-demo-session").addEventListener("click", async () => {
  reviewDemoStatus.textContent = "Creating or logging in to the team account.";
  await ensureTeamReviewSession();
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
});

document.querySelector("#review-demo-profile").addEventListener("click", async () => {
  reviewDemoStatus.textContent = "Syncing profile to create backend patient record.";
  await syncProfileToBackend(true);
  reviewDemoStatus.textContent = backendPatientId
    ? `Backend patient linked: ${backendPatientId}.`
    : "Profile sync needs a signed-in backend account.";
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
});

document.querySelector("#review-demo-plan").addEventListener("click", () => {
  runSampleCarePlanDemo();
  reviewDemoStatus.textContent = "High-risk sample plan generated. It should create a local review item.";
  window.showCareWiseSection?.("review-title");
  renderReviewDemoChecklist();
});

document.querySelector("#review-demo-sync").addEventListener("click", async () => {
  reviewDemoStatus.textContent = "Syncing latest plan to backend.";
  await syncLatestPlanToBackend(true);
  reviewDemoStatus.textContent = lastGeneratedPlan?.backendCarePlanId
    ? `Backend care plan linked: ${lastGeneratedPlan.backendCarePlanId}.`
    : "Sync needs a signed-in account and synced patient profile.";
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
});

document.querySelector("#review-demo-load").addEventListener("click", async () => {
  reviewDemoStatus.textContent = "Loading backend clinician queue.";
  await loadBackendReviewQueue();
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
});

document.querySelector("#review-demo-approve").addEventListener("click", () => {
  approveDemoReviewItem();
});

document.querySelector("#create-checkout").addEventListener("click", () => {
  createCheckout();
});

document.querySelector("#copy-checkout").addEventListener("click", () => {
  copyCheckoutLink();
});

reviewQueue.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-review-action]");
  if (!actionButton) return;
  updateReviewQueueItem(actionButton.dataset.reviewId, actionButton.dataset.reviewAction);
});

reviewDemoOutcome.addEventListener("click", (event) => {
  const action = event.target.closest("[data-demo-outcome-action]")?.dataset.demoOutcomeAction;
  if (!action) return;
  if (action === "copy") copyReviewDemoReceipt();
  if (action === "reset") resetReviewDemoReceipt();
});

document.querySelector("#export-data").addEventListener("click", () => {
  exportLocalData(false);
});

document.querySelector("#copy-data").addEventListener("click", () => {
  exportLocalData(true);
});

document.querySelector("#check-backend-data").addEventListener("click", () => {
  checkBackendDataSummary();
});

document.querySelector("#export-backend-data").addEventListener("click", () => {
  exportBackendData();
});

document.querySelector("#request-delete-data").addEventListener("click", () => {
  requestBackendDataDeletion();
});

document.querySelector("#clear-all-data").addEventListener("click", () => {
["carewiseProfile", "carewiseSavedPlans", "carewiseMealPlans", "carewiseCheckins", "carewiseSymptomTimeline", "carewiseMedications", "carewiseSafetyChecks", "carewiseGoals", "carewiseBarriers", "carewiseReminders", "carewiseMonthlyCalendars", "carewiseNavigationPrep", "carewiseCareTeamContacts", "carewiseVisitBriefs", "carewiseCarePackets", "carewiseSupportRequests", "carewiseQaReports", "carewiseDemoScripts", "carewiseReviewQueue", "carewiseAuditEvents", "carewiseConsent", "carewiseBackendPatientId", "carewiseAuthToken", "carewiseAuthEmail", "carewiseAuthRole", "carewiseReports", "carewiseLabTrends", "carewiseLatestReportId", "carewiseCheckoutUrl", "carewiseAdminSummary", "carewiseBackendReviewCount", "carewiseReviewDecisionSynced", "carewiseReviewDemoOutcome", "carewiseReportSafetyEval"].forEach((key) => localStorage.removeItem(key));
  backendPatientId = "";
  authToken = "";
  authEmail = "";
  latestReportId = "";
  latestCheckoutUrl = "";
  updateAuthStatus();
  setProfile({});
  loadProfile();
  loadConsent();
  renderSavedPlans();
  renderMealPlans();
  renderSymptomTimeline();
  renderCheckins();
  renderGoals();
  renderBarriers();
  renderReminders();
  renderMonthlyCalendars();
  renderNavigationPrep();
  renderCareTeamContacts();
  renderVisitBriefs();
  renderCarePackets();
  renderSupportRequests();
  renderQaReport();
  renderMedications();
  renderSafetyChecks();
  renderReviewQueue();
  renderAuditTrail();
  renderReportHistory();
  renderLabTrends();
  renderDashboardStats();
  renderReviewDemoChecklist();
  renderReviewDemoOutcome();
  renderReviewDemoTimeline();
  renderDemoScript();
  exportOutput.value = "";
  exportStatus.textContent = "All local prototype data cleared.";
  setBackendStatus(backendAvailable, backendAvailable ? "Backend is available. Local patient link cleared." : "All local prototype data cleared. Backend sync is offline.");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!document.querySelector("#privacy-consent").checked) {
    results.innerHTML = `
      <article class="result-card warning-card">
        <span class="badge danger">Consent needed</span>
        <h3>Review privacy consent first</h3>
        <p>Please confirm prototype consent before generating a care plan. Real healthcare apps need stronger privacy, security, and legal review.</p>
      </article>
    `;
    return;
  }

  const symptoms = document.querySelector("#symptoms").value.trim();
  const text = symptoms.toLowerCase();
  const age = Number(document.querySelector("#age").value);
  const budget = document.querySelector("#budget").value;
  const location = document.querySelector("#location").value.trim() || "your area";
  const insurance = document.querySelector("#insurance").value;
  const dietStyle = document.querySelector("#diet-style").value;
  const priority = document.querySelector("#priority").value;
  const activityLevel = document.querySelector("#activity-level").value;
  const exerciseGoal = document.querySelector("#exercise-goal").value;
  const prepTime = document.querySelector("#prep-time").value;
  const calorieGoal = document.querySelector("#calorie-goal").value;
  const plan = document.querySelector("input[name='plan']:checked").value;
  const goals = [...document.querySelectorAll("input[name='goals']:checked")].map((item) => item.value);

  const urgentMatches = findEmergencyTerms(text);
  if (hasHypertensiveCrisis(text)) {
    urgentMatches.push("blood pressure over 180/120");
  }
  const matchedRules = conditionRules.filter((rule) => rule.terms.some((term) => text.includes(term)));
  const rules = matchedRules.length ? matchedRules : [conditionRules[3]];
  const diseasePlans = matchDiseaseCarePlans(text);
  const recommendedPlan = choosePlan(plan, budget, age, rules.length, insurance);
  const profile = getProfile();
  const risk = classifyRisk(urgentMatches, diseasePlans, profile, insurance);
  const context = {
    symptoms,
    age,
    budget,
    location,
    insurance,
    dietStyle,
    priority,
    activityLevel,
    exerciseGoal,
    prepTime,
    calorieGoal,
    plan,
    goals,
    rules,
    diseasePlans,
    recommendedPlan,
    profile,
    urgentMatches,
    risk,
  };

  if (urgentMatches.length) {
    lastGeneratedPlan = createSavedPlan(context, "Emergency routing");
    const reviewItem = addReviewQueueItem(context);
    lastGeneratedPlan.localReviewId = reviewItem.id;
    syncLatestPlanToBackend(false);
    results.innerHTML = [
      renderCarePlanSnapshotCard(context),
      renderResultSection("Safety first", "Urgent routing and risk checks", [
        renderSafetyCard(urgentMatches),
        renderRoutinePausedCard(location),
        renderRiskCard(risk),
      ], true),
      renderPlanActionsCard(),
    ].join("");
    window.showCareWiseSection?.("results");
    updateProgressRail();
    return;
  }

  lastGeneratedPlan = createSavedPlan(context, planDetails[recommendedPlan].name);
  results.innerHTML = [
    renderCarePlanSnapshotCard(context),
    renderResultSection("Summary and safety", "Start here before using routine recommendations", [
      renderSafetyCard(urgentMatches),
      renderRiskCard(risk),
      renderCareCard(rules, goals),
    ], true),
    renderResultSection("Food and habits", "Diet style, meal prep, calories, and variety", [
      renderDiseasePlanCard(diseasePlans, dietStyle, priority),
      renderMealPrepCard(dietStyle, priority, prepTime, calorieGoal),
      renderVarietyCard(dietStyle, priority),
      renderLifestyleCard(rules),
      renderProsConsCard(diseasePlans, dietStyle, activityLevel, calorieGoal),
    ]),
    renderResultSection("Movement and medication", "Exercise guidance and medication safety reminders", [
      renderExerciseCard(activityLevel, exerciseGoal, diseasePlans),
      renderMedicationCard(symptoms),
    ]),
    renderResultSection("Care team and visit prep", "Plan level, doctor matching, and appointment summary", [
      renderPlanCard(recommendedPlan, insurance),
      renderDoctorCard(location, rules),
      renderDoctorVisitSummaryCard(context),
    ]),
    renderPlanActionsCard(),
  ].join("");

  if (risk.level !== "routine") {
    const reviewItem = addReviewQueueItem(context);
    lastGeneratedPlan.localReviewId = reviewItem.id;
  }
  syncLatestPlanToBackend(false);
  window.showCareWiseSection?.("results");
  updateProgressRail();
});

results.addEventListener("click", (event) => {
  if (event.target.matches("[data-save-current-plan]")) {
    saveCurrentPlan();
  }
  if (event.target.matches("#copy-visit-summary")) {
    copyDoctorSummary();
  }
});

function initializeWorkspaceNavigation() {
  const sectionTargets = [
    ["home-title", document.querySelector(".home-panel")],
    ["account-title", document.querySelector(".account-panel")],
    ["consent-title", document.querySelector(".consent-panel")],
    ["patient-form", document.querySelector("#patient-form")],
    ["report-title", document.querySelector(".report-panel")],
    ["backend-title", document.querySelector(".backend-panel")],
    ["saved-title", document.querySelector(".saved-panel")],
    ["medication-title", document.querySelector(".medication-panel")],
    ["checkin-title", document.querySelector(".checkin-panel")],
    ["review-title", document.querySelector(".review-panel")],
    ["payment-title", document.querySelector(".payment-panel")],
    ["legal-title", document.querySelector(".legal-panel")],
    ["mobile-title", document.querySelector(".mobile-panel")],
    ["launch-title", document.querySelector(".launch-panel")],
    ["export-title", document.querySelector(".export-panel")],
    ["results", document.querySelector("#results")],
  ].filter(([, element]) => Boolean(element));

  const sectionsById = new Map(sectionTargets);
  const navLinks = [...document.querySelectorAll(".quick-nav a[href^='#'], .team-nav a[href^='#'], .progress-rail a[href^='#'], .hero-actions a[href^='#'], .consent-action-card a[href^='#'], .report-panel a[href^='#']")];

  sectionTargets.forEach(([, element]) => {
    element.classList.add("app-section");
  });

  const showSection = (targetId, shouldScroll = true) => {
    const target = sectionsById.get(targetId) || sectionsById.get("home-title");
    const activeId = [...sectionsById.entries()].find(([, element]) => element === target)?.[0] || "home-title";

    sectionTargets.forEach(([id, element]) => {
      element.hidden = id !== activeId;
    });

    document.querySelectorAll(".quick-nav a, .team-nav a, .progress-rail a").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
      link.toggleAttribute("aria-current", link.getAttribute("href") === `#${activeId}`);
    });

    document.body.dataset.activeWorkspace = activeId;
    updateProgressRail();

    if (shouldScroll) {
      document.querySelector(".quick-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href").slice(1);
      if (!sectionsById.has(targetId)) return;
      event.preventDefault();
      history.pushState(null, "", `#${targetId}`);
      showSection(targetId);
    });
  });

  window.addEventListener("hashchange", () => {
    showSection(window.location.hash.slice(1), true);
  });

  window.showCareWiseSection = showSection;
  showSection(window.location.hash.slice(1) || "home-title", false);
}

function updateProgressRail() {
  const progressChecks = {
    "account-title": Boolean(authToken || authEmail || document.querySelector("#profile-name")?.value.trim()),
    "consent-title": Boolean(document.querySelector("#privacy-consent")?.checked),
    "report-title": Boolean(document.querySelector("#report-text")?.value.trim() || document.querySelector("#report-file")?.files?.length || latestReportId),
    "patient-form": Boolean(document.querySelector("#symptoms")?.value.trim().length > 12),
    results: Boolean(document.querySelector("#results .snapshot-card")),
  };

  document.querySelectorAll(".progress-rail a[href^='#']").forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    link.classList.toggle("complete", Boolean(progressChecks[id]));
  });
}

function choosePlan(selectedPlan, budget, age, ruleCount, insurance) {
  if (selectedPlan === "premium" || age >= 65 || ruleCount > 1) return "premium";
  if (selectedPlan === "plus" || budget === "mid" || insurance !== "some") return "plus";
  return "basic";
}

function findEmergencyTerms(text) {
  const matches = [];
  emergencyTerms.forEach((term) => {
    let start = 0;
    while (start < text.length) {
      const index = text.indexOf(term, start);
      if (index === -1) break;
      if (!isNegated(text, index)) {
        matches.push(term);
        break;
      }
      start = index + term.length;
    }
  });
  return matches;
}

function isNegated(text, termIndex) {
  const windowText = text.slice(Math.max(0, termIndex - 24), termIndex);
  const afterWindow = text.slice(termIndex, termIndex + 48);
  if (afterWindow.includes("recovery") || `${windowText}${afterWindow}`.includes("after stroke")) return true;
  return ["no ", "not ", "without ", "denies ", "denied ", "negative for ", "none of "].some((pattern) => windowText.includes(pattern));
}

function renderRoutinePausedCard(location) {
  return `
    <article class="result-card warning-card">
      <span class="badge danger">Routine plan paused</span>
      <h3>Use emergency care before monthly planning</h3>
      <ul>
        <li>Do not use diet, insurance, subscription, or doctor-shopping guidance to delay emergency care.</li>
        <li>After the person is medically stable, CareWise can help organize follow-up care near ${escapeHtml(location)}.</li>
        <li>Bring medication names, allergies, major symptoms, and symptom start time to the care team if possible.</li>
      </ul>
    </article>
  `;
}

function renderSafetyCard(matches) {
  if (!matches.length) {
    return `
      <article class="result-card">
        <span class="badge">Safety check</span>
        <h3>No emergency phrase detected</h3>
        <p>This is a screening result only. New, severe, or fast-worsening symptoms should be handled by urgent care, emergency services, or a licensed clinician.</p>
      </article>
    `;
  }

  const guidance = getEmergencyGuidance(matches);
  return `
    <article class="result-card">
      <span class="badge danger">Urgent flag</span>
      <h3>Get medical help now</h3>
      <p>The intake mentioned ${matches.map(escapeHtml).join(", ")}. Get immediate medical care or emergency help before using routine plan recommendations.</p>
      <ul>
        ${guidance.map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.action)}</li>`).join("")}
        <li>CareWise cannot diagnose or cure this. It can only help route the person to safer next steps.</li>
      </ul>
    </article>
  `;
}

function getEmergencyGuidance(matches) {
  const matchedText = matches.join(" ").toLowerCase();
  const guidance = emergencyGuidanceRules.filter((rule) => rule.terms.some((term) => matchedText.includes(term)));

  if (guidance.length) {
    return guidance.slice(0, 3);
  }

  return [
    {
      label: "Emergency screening",
      action: "Seek urgent or emergency medical care now, especially if symptoms are severe, new, worsening, or unusual.",
    },
  ];
}

function renderResultSection(title, subtitle, cards, open = false) {
  return `
    <details class="result-section" ${open ? "open" : ""}>
      <summary>
        <span>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(subtitle)}</small>
        </span>
        <b>${cards.length}</b>
      </summary>
      <div class="result-section-grid">
        ${cards.join("")}
      </div>
    </details>
  `;
}

function renderCarePlanSnapshotCard(context) {
  const nextStep = context.urgentMatches.length
    ? "Use urgent or emergency care before routine planning."
    : context.risk.level === "routine"
      ? "Save this plan and bring the appointment summary to your next visit."
      : "Route this plan for clinician review before relying on routine recommendations.";
  const conditionLabel = context.diseasePlans[0]?.name || context.rules[0]?.label || "General care planning";

  return `
    <article class="result-card snapshot-card">
      <span class="badge blue">CareWise snapshot</span>
      <h3>${escapeHtml(conditionLabel)}</h3>
      <div class="snapshot-grid">
        <div><strong>Risk</strong><span>${escapeHtml(context.risk.label)}</span></div>
        <div><strong>Plan</strong><span>${escapeHtml(planDetails[context.recommendedPlan].name)}</span></div>
        <div><strong>Food style</strong><span>${escapeHtml(getDietStyleLabel(context.dietStyle))}</span></div>
        <div><strong>Focus</strong><span>${escapeHtml(getPriorityLabel(context.priority))}</span></div>
      </div>
      <p>${escapeHtml(nextStep)}</p>
      <div class="clinical-note">
        <strong>Safety note</strong>
        <span>CareWise provides educational planning support only. It does not diagnose, prescribe, cure, or replace emergency care or licensed clinicians.</span>
      </div>
      <div class="hero-actions">
        <button data-save-current-plan class="primary-button narrow-button" type="button">Save plan</button>
        <a class="secondary-link" href="#report-title">Add report</a>
        <a class="secondary-link" href="#checkin-title">Add check-in</a>
      </div>
    </article>
  `;
}

function renderCareCard(rules, goals) {
  const items = rules.flatMap((rule) => rule.actions.slice(0, 2));
  return `
    <article class="result-card">
      <span class="badge blue">Care path</span>
      <h3>${escapeHtml(rules[0].label)}</h3>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        <li>Selected goals: ${escapeHtml(goals.join(", ") || "General support")}</li>
      </ul>
    </article>
  `;
}

function renderRiskCard(risk) {
  const badgeClass = risk.level === "emergency" || risk.level === "urgent" ? "danger" : risk.level === "soon" ? "gold" : "";
  return `
    <article class="result-card">
      <span class="badge ${badgeClass}">${escapeHtml(risk.label)}</span>
      <h3>Risk routing</h3>
      <p>${escapeHtml(risk.message)}</p>
      <ul>${risk.reasons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `;
}

function renderMedicationCard(symptoms) {
  const hasMedicationSignal = /medication|medicine|pill|dose|prescription|drug/i.test(symptoms);
  const firstItem = hasMedicationSignal
    ? "Prepare a medication list with names, doses, timing, allergies, and side effects."
    : "Ask the patient to upload or type current medications before giving medication guidance.";

  return `
    <article class="result-card">
      <span class="badge gold">Medication</span>
      <h3>Pharmacist review</h3>
      <ul>
        <li>${firstItem}</li>
        <li>Never suggest stopping, starting, or changing prescription medication without clinician approval.</li>
        <li>Check food and supplement interactions before diet recommendations.</li>
      </ul>
    </article>
  `;
}

function renderDiseasePlanCard(plans, dietStyle, priority) {
  const matchedPlans = plans.length ? plans.slice(0, 2) : [fallbackDiseasePlan()];
  const planBlocks = matchedPlans.map((plan) => {
    return `
      <div class="mini-plan">
        <h4>${escapeHtml(plan.name)}</h4>
        <strong>Precautions</strong>
        <ul>${plan.precautions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <strong>Diet plan</strong>
        <ul>${plan.diet.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <p><strong>Care team:</strong> ${escapeHtml(plan.doctor)}</p>
      </div>
    `;
  });

  return `
    <article class="result-card disease-card">
      <span class="badge blue">Disease plan</span>
      <h3>Precautions and diet</h3>
      <p>${escapeHtml(getDietStyleNote(dietStyle, priority))}</p>
      ${planBlocks.join("")}
    </article>
  `;
}

function renderProsConsCard(plans, dietStyle, activityLevel, calorieGoal) {
  const mainCondition = plans[0]?.name || "General health support";
  const styleLabel = getDietStyleLabel(dietStyle);
  const pros = [
    `${styleLabel} can be adapted around ${mainCondition.toLowerCase()} with enough planning.`,
    `${getActivityLabel(activityLevel)} activity can improve energy, sleep, heart health, and blood sugar when safe.`,
    `${getCalorieLabel(calorieGoal)} keeps the plan realistic instead of extreme.`,
  ];
  const cons = [
    "Generic advice can be unsafe for pregnancy, kidney disease, eating disorders, allergies, or complex medication plans.",
    "Strict diets can become boring or too expensive if variety and prep time are not planned.",
    "Exercise should start lower if symptoms, pain, dizziness, chest discomfort, or breathing problems appear.",
  ];

  return `
    <article class="result-card">
      <span class="badge gold">Pros / cons</span>
      <h3>What can help and what to watch</h3>
      <strong>Pros</strong>
      <ul>${pros.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <strong>Cons</strong>
      <ul>${cons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `;
}

function renderExerciseCard(activityLevel, exerciseGoal, plans) {
  const conditionWarnings = getExerciseWarnings(plans);
  const weeklyPlan = getExercisePlan(activityLevel, exerciseGoal);

  return `
    <article class="result-card movement-card">
      <span class="badge blue">Movement</span>
      <h3>Physical activity plan</h3>
      <p>General adult target: build toward 150 minutes/week of moderate activity plus 2 strength days, adjusted for ability and clinician guidance.</p>
      <ul>
        ${weeklyPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        ${conditionWarnings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderMealPrepCard(dietStyle, priority, prepTime, calorieGoal) {
  const prep = getMealPrepPlan(dietStyle, priority, prepTime, calorieGoal);

  return `
    <article class="result-card meal-card">
      <span class="badge">Busy meals</span>
      <h3>Meal prep and calories</h3>
      <p>${escapeHtml(prep.calorieNote)}</p>
      <ul>${prep.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `;
}

function renderVarietyCard(dietStyle, priority) {
  const rotation = getVarietyRotation(dietStyle, priority);

  return `
    <article class="result-card">
      <span class="badge gold">Variety</span>
      <h3>Food rotation to avoid boredom</h3>
      <ul>${rotation.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `;
}

function matchDiseaseCarePlans(text) {
  return diseaseCarePlans.filter((plan) => {
    return plan.terms.some((term) => text.includes(term.toLowerCase()));
  });
}

function getExercisePlan(activityLevel, exerciseGoal) {
  const base = {
    sedentary: [
      "Week 1: walk 5-10 minutes after one meal on 4 days.",
      "Add 2 short strength sessions: chair squats, wall pushups, gentle rows, and calf raises.",
    ],
    light: [
      "Aim for 20-30 minutes brisk walking or cycling on 5 days.",
      "Add 2 strength sessions with bodyweight, bands, or light weights.",
    ],
    moderate: [
      "Maintain 150-300 minutes/week moderate cardio or mix in vigorous intervals if safe.",
      "Use 2-3 strength sessions plus mobility work.",
    ],
    high: [
      "Keep training balanced: cardio, strength, mobility, and recovery days.",
      "Watch sleep, soreness, hydration, and food intake so training supports health instead of burnout.",
    ],
  };
  const goalAddOns = {
    start: "Start low and go slow; increase time before intensity.",
    heart: "Use steady moderate activity most days and stop for chest pain, fainting, or unusual shortness of breath.",
    weight: "Pair walking after meals with strength training and consistent meals; avoid punishment exercise.",
    strength: "Train major muscle groups 2 days/week and leave recovery time between hard sessions.",
    stress: "Use walking, stretching, breathing, yoga-style mobility, or easy cycling near the same time daily.",
  };
  return [...base[activityLevel], goalAddOns[exerciseGoal]];
}

function getExerciseWarnings(plans) {
  const ids = plans.map((plan) => plan.id);
  const warnings = [];
  if (ids.includes("heart_disease")) warnings.push("Heart disease: ask a clinician about safe intensity, especially after new symptoms or hospitalization.");
  if (ids.includes("diabetes")) warnings.push("Diabetes: carry fast carbs if hypoglycemia risk applies and check glucose patterns around exercise.");
  if (ids.includes("chronic_kidney_disease")) warnings.push("Kidney disease: follow clinician limits for fluids, blood pressure, anemia, and fatigue.");
  if (ids.includes("pregnancy")) warnings.push("Pregnancy: choose moderate activity if cleared; stop for bleeding, dizziness, chest pain, or contractions.");
  if (ids.includes("asthma") || ids.includes("copd")) warnings.push("Lung conditions: keep rescue plan available and avoid triggers like smoke, cold air, or heavy pollution.");
  return warnings.length ? warnings : ["If pain, dizziness, chest symptoms, fainting, or severe breathlessness occurs, stop and seek medical guidance."];
}

function getMealPrepPlan(dietStyle, priority, prepTime, calorieGoal) {
  const proteins = {
    flexible: "beans, eggs, yogurt, fish, chicken, tofu, lentils",
    vegetarian: "lentils, beans, tofu, tempeh, Greek yogurt, eggs if eaten",
    vegan: "lentils, beans, tofu, tempeh, edamame, soy milk, nuts and seeds",
    pescatarian: "fish, tuna/salmon packets, eggs if eaten, beans, lentils, yogurt if eaten",
    non_vegetarian: "fish, skinless poultry, eggs, beans, lentils, yogurt",
  };
  const prepSteps = {
    ten: [
      `10-minute plate: ready vegetable + ${proteins[dietStyle]} + whole-grain or starchy base.`,
      "Use shortcuts: frozen vegetables, canned low-sodium beans, microwavable grains, pre-washed greens.",
      "Keep 2 emergency meals at home so busy days do not become fast-food-only days.",
    ],
    twenty: [
      `20-minute prep: cook one protein from ${proteins[dietStyle]}, one grain, and two vegetables.`,
      "Make sauces separately: salsa, yogurt-herb, tahini-lemon, tomato, or low-sodium curry base.",
      "Pack tomorrow's lunch while plating dinner.",
    ],
    batch: [
      "Batch cook 2 proteins, 2 vegetables, 1 grain, and 1 soup/stew each week.",
      "Freeze 2 portions for high-stress days.",
      "Rotate seasoning themes so the same base tastes different.",
    ],
  };
  return {
    calorieNote: getCaloriePlan(calorieGoal, priority),
    steps: prepSteps[prepTime],
  };
}

function getCaloriePlan(calorieGoal, priority) {
  const notes = {
    maintain: "Calorie direction: maintain energy. Use consistent meals, protein, fiber, and hydration; avoid skipping meals then overeating later.",
    gentle_loss: "Calorie direction: gentle loss. Use small sustainable portions and reduce sugary drinks/fried snacks; avoid extreme low-calorie diets.",
    gain: "Calorie direction: healthy gain. Add nutrient-dense snacks such as nut butter, yogurt, smoothies, avocado, olive oil, or extra protein as appropriate.",
    medical: "Calorie direction: medical condition first. Diabetes, kidney disease, pregnancy, eating disorders, cancer, and major illness need clinician or dietitian guidance.",
  };
  if (priority === "low_cost") return `${notes[calorieGoal]} Low-cost staples: oats, beans, lentils, rice, eggs if eaten, frozen vegetables, canned fish if eaten.`;
  return notes[calorieGoal];
}

function getVarietyRotation(dietStyle, priority) {
  const proteinMap = {
    flexible: "beans, lentils, eggs, fish, poultry, tofu, yogurt",
    vegetarian: "beans, lentils, tofu, paneer/cottage cheese if eaten, eggs if eaten, yogurt",
    vegan: "beans, lentils, tofu, tempeh, edamame, chickpeas, nuts/seeds",
    pescatarian: "salmon, sardines, tuna, white fish, shrimp if tolerated, beans, lentils",
    non_vegetarian: "fish, chicken, turkey, eggs, beans, lentils, yogurt",
  };
  const themeMap = priority === "heart" || priority === "diabetes"
    ? "Mediterranean bowl, low-sodium curry, taco salad, stir-fry, soup, grain bowl, sheet-pan meal"
    : "bowl, wrap, salad, soup, stir-fry, sheet-pan meal, breakfast-for-dinner";
  return [
    `Rotate proteins: ${proteinMap[dietStyle]}.`,
    `Rotate formats: ${themeMap}.`,
    "Rotate flavor families: lemon-herb, garlic-ginger, tomato-basil, chili-lime, turmeric-cumin, sesame-soy low sodium.",
    "Use the 3-2-1 rule: 3 vegetables, 2 proteins, 1 grain/starch prepped for the next few days.",
  ];
}

function getDietStyleLabel(dietStyle) {
  return {
    flexible: "A flexible mixed diet",
    vegetarian: "A vegetarian diet",
    vegan: "A vegan diet",
    pescatarian: "A fish-based pescatarian diet",
    non_vegetarian: "A lean non-vegetarian diet",
  }[dietStyle];
}

function getPriorityLabel(priority) {
  return {
    balanced: "Balanced health",
    low_cost: "Low-cost planning",
    weight: "Weight management",
    heart: "Heart health",
    diabetes: "Blood sugar support",
  }[priority] || "Balanced health";
}

function getActivityLabel(activityLevel) {
  return {
    sedentary: "A gentle starter",
    light: "A light",
    moderate: "A moderate",
    high: "A high-activity",
  }[activityLevel];
}

function getCalorieLabel(calorieGoal) {
  return {
    maintain: "Maintaining energy",
    gentle_loss: "A gentle calorie reduction",
    gain: "A healthy calorie increase",
    medical: "Medical-condition-first calorie planning",
  }[calorieGoal];
}

function fallbackDiseasePlan() {
  return {
    name: "General health support",
    precautions: [
      "Use clinician review for new, severe, worsening, or unclear symptoms.",
      "Do not start, stop, or change prescription medication without clinician guidance.",
      "Track symptoms, medications, allergies, meals, and questions before appointments.",
    ],
    diet: [
      "Use a balanced plate with vegetables, protein, high-fiber carbohydrates, and water.",
      "Limit sugary drinks, excess salt, frequent fried foods, and ultra-processed foods.",
      "Adjust diet for allergies, pregnancy, kidney disease, diabetes, or clinician instructions.",
    ],
    doctor: "Primary care or the appropriate specialist",
  };
}

function getDietStyleNote(dietStyle, priority) {
  const styleNotes = {
    flexible: "Diet guidance is adapted for a flexible mixed diet.",
    vegetarian: "Vegetarian plans should include enough protein, iron, calcium, zinc, and vitamin B12 planning.",
    vegan: "Vegan plans should include vitamin B12 planning and dietitian support for pregnancy, children, kidney disease, or complex conditions.",
    pescatarian: "Fish-based plans can fit heart health, but avoid fish if allergic and use pregnancy mercury guidance when relevant.",
    non_vegetarian: "Non-vegetarian plans should favor fish, beans, lean poultry, vegetables, and fewer processed meats.",
  };
  const priorityNotes = {
    balanced: "The priority is balanced health.",
    low_cost: "The priority is low-cost foods like beans, lentils, oats, frozen vegetables, eggs if eaten, and affordable staples.",
    weight: "The priority is sustainable weight management without extreme dieting.",
    heart: "The priority is heart health with lower sodium and less saturated fat.",
    diabetes: "The priority is blood sugar support with consistent meals and fiber-rich carbohydrates.",
  };

  return `${styleNotes[dietStyle]} ${priorityNotes[priority]}`;
}

function renderLifestyleCard(rules) {
  const actions = [...new Set(rules.flatMap((rule) => rule.actions))].slice(0, 4);
  return `
    <article class="result-card">
      <span class="badge">Nutrition</span>
      <h3>Diet and habit plan</h3>
      <ul>${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>
    </article>
  `;
}

function renderPlanCard(plan, insurance) {
  const insuranceLine =
    insurance === "none"
      ? "Recommend Medicaid marketplace screening, community clinics, and low-cost pharmacy options."
      : insurance === "switching"
        ? "Compare premiums, deductible, medication coverage, and doctor network before switching."
        : "Check whether current insurance covers primary care, dietitian visits, labs, and virtual care.";

  return `
    <article class="result-card">
      <span class="badge blue">Subscription</span>
      <h3>${planDetails[plan].name} plan</h3>
      <p>${planDetails[plan].summary}</p>
      <ul><li>${insuranceLine}</li></ul>
    </article>
  `;
}

function renderDoctorCard(location, rules) {
  const specialty = rules[0].label.includes("Care navigation")
    ? "primary care, community clinic, or insurance-network doctor"
    : rules[0].label.includes("Blood sugar")
    ? "primary care or endocrinology"
    : rules[0].label.includes("Mental")
      ? "primary care or behavioral health"
      : rules[0].label.includes("Heart")
        ? "primary care or cardiology"
        : "primary care or dietitian";

  return `
    <article class="result-card">
      <span class="badge gold">Nearby care</span>
      <h3>Doctor matching</h3>
      <ul>
        <li>Search for ${specialty} near ${escapeHtml(location)}.</li>
        <li>Filter by insurance network, language, availability, and patient ratings.</li>
        <li>Future version: connect Google Places, Zocdoc, insurance directories, or clinic APIs.</li>
      </ul>
    </article>
  `;
}

function renderDoctorVisitSummaryCard(context) {
  const summary = buildDoctorSummary(context);
  return `
    <article class="result-card summary-card">
      <span class="badge blue">Doctor visit</span>
      <h3>Appointment summary</h3>
      <pre id="doctor-summary">${escapeHtml(summary)}</pre>
      <button id="copy-visit-summary" class="secondary-button" type="button">Copy summary</button>
    </article>
  `;
}

function renderPlanActionsCard() {
  return `
    <article class="result-card">
      <span class="badge">Save</span>
      <h3>Care plan actions</h3>
      <p>Save this plan locally so the patient can compare future monthly plans and bring a summary to appointments.</p>
      <button data-save-current-plan class="primary-button" type="button">Save current plan</button>
      <p id="save-status" class="status-line" role="status"></p>
    </article>
  `;
}

function getProfile() {
  return {
    name: document.querySelector("#profile-name").value.trim(),
    sex: document.querySelector("#profile-sex").value,
    height: document.querySelector("#profile-height").value.trim(),
    weight: document.querySelector("#profile-weight").value.trim(),
    conditions: document.querySelector("#profile-conditions").value.trim(),
    medications: document.querySelector("#profile-medications").value.trim(),
    allergies: document.querySelector("#profile-allergies").value.trim(),
  };
}

function setProfile(profile) {
  document.querySelector("#profile-name").value = profile.name || "";
  document.querySelector("#profile-sex").value = profile.sex || "";
  document.querySelector("#profile-height").value = profile.height || "";
  document.querySelector("#profile-weight").value = profile.weight || "";
  document.querySelector("#profile-conditions").value = profile.conditions || "";
  document.querySelector("#profile-medications").value = profile.medications || "";
  document.querySelector("#profile-allergies").value = profile.allergies || "";
}

function saveProfile() {
  localStorage.setItem("carewiseProfile", JSON.stringify(getProfile()));
}

function loadProfile() {
  const saved = localStorage.getItem("carewiseProfile");
  if (!saved) {
    setProfile({});
    return;
  }
  try {
    setProfile(JSON.parse(saved));
  } catch {
    localStorage.removeItem("carewiseProfile");
    setProfile({});
  }
}

function setBackendStatus(isOnline, message) {
  backendAvailable = isOnline;
  backendBadge.textContent = isOnline ? "Backend connected" : "Offline mode";
  backendBadge.className = `sync-badge ${isOnline ? "online" : "offline"}`;
  backendStatus.textContent = message;
}

function initializeAccountPanel() {
  apiUrlInput.value = backendBaseUrl;
  handleCheckoutReturn();
  handlePasswordResetToken();
  handleEmailVerificationToken();
  updateAuthStatus();
  renderReviewSyncSummary();
}

function fillTeamAccount(role, navigateToAccount = true) {
  const suffix = role === "admin" ? "admin" : "clinician";
  document.querySelector("#auth-email").value = `${suffix}@carewise.ai`;
  document.querySelector("#auth-password").value = "carewise-team-password";
  document.querySelector("#auth-role").value = role;
  authRole = role;
  localStorage.setItem("carewiseAuthRole", role);
  updateAuthStatus(`${role === "admin" ? "Admin" : "Clinician"} test account filled. Create it once, then use Login after that.`);
  if (navigateToAccount) window.showCareWiseSection?.("account-title");
}

function initializeInstallAndNetworkStatus() {
  updateNetworkStatus();
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installAppButton) installAppButton.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (installAppButton) installAppButton.hidden = true;
    if (networkStatus) {
      networkStatus.textContent = "Installed";
      networkStatus.className = "network-pill";
    }
  });
}

function updateNetworkStatus() {
  if (!networkStatus) return;
  const online = navigator.onLine !== false;
  networkStatus.textContent = online ? "Online" : "Offline shell";
  networkStatus.className = `network-pill ${online ? "" : "offline"}`.trim();
}

function fillSampleReportText() {
  document.querySelector("#report-name").value = "sample-blood-work.txt";
  document.querySelector("#report-text").value = [
    "Sample lab text for CareWise demo:",
    "Total cholesterol 226 mg/dL.",
    "LDL cholesterol 148 mg/dL.",
    "HDL cholesterol 44 mg/dL.",
    "Triglycerides 168 mg/dL.",
    "Hemoglobin A1C 5.8%.",
    "Blood pressure readings at home often around 138/86.",
    "No chest pain, no shortness of breath, no fainting.",
    "Patient wants simple food, walking, sleep, and follow-up guidance.",
  ].join("\n");
  reportStatus.textContent = "Sample report text added. Click Analyze report to see the V1 explanation.";
  window.showCareWiseSection?.("report-title", false);
  updateProgressRail();
}

function fillSampleIntake() {
  document.querySelector("#privacy-consent").checked = true;
  localStorage.setItem("carewiseConsent", JSON.stringify({
    accepted: true,
    updatedAt: new Date().toISOString(),
  }));
  renderConsentStatus();
  document.querySelector("#symptoms").value = "High blood pressure readings, LDL cholesterol is elevated, A1C is slightly high, poor sleep, busy schedule, and I want a realistic food and walking plan.";
  document.querySelector("#age").value = "42";
  document.querySelector("#budget").value = "mid";
  document.querySelector("#location").value = "San Jose, CA";
  document.querySelector("#insurance").value = "some";
  document.querySelector("#diet-style").value = "flexible";
  document.querySelector("#priority").value = "heart";
  document.querySelector("#activity-level").value = "sedentary";
  document.querySelector("#exercise-goal").value = "heart";
  document.querySelector("#prep-time").value = "ten";
  document.querySelector("#calorie-goal").value = "gentle_loss";
  document.querySelector("#profile-name").value = "Demo Patient";
  document.querySelector("#profile-conditions").value = "High blood pressure, elevated LDL cholesterol, prediabetes risk";
  document.querySelector("#profile-medications").value = "No medications entered yet";
  profileStatus.textContent = "Sample intake filled. Review it, then generate a care plan.";
  updateProgressRail();
}

function runSampleCarePlanDemo() {
  fillSampleReportText();
  fillSampleIntake();
  form.requestSubmit();
}

async function runFullReviewDemo() {
  reviewDemoStatus.textContent = "Running full review demo.";
  fillTeamAccount("clinician", false);
  renderReviewDemoChecklist();

  reviewDemoStatus.textContent = "Step 1/6 complete. Creating or logging in.";
  await ensureTeamReviewSession();
  if (!authToken) {
    reviewDemoStatus.textContent = "Full demo paused: create/login did not complete.";
    renderReviewDemoChecklist();
    renderReviewDemoGuidance();
    return;
  }

  reviewDemoStatus.textContent = "Step 2/6 complete. Syncing backend patient profile.";
  await syncProfileToBackend(true);
  if (!backendPatientId) {
    reviewDemoStatus.textContent = "Full demo paused: profile sync did not create a backend patient.";
    renderReviewDemoChecklist();
    renderReviewDemoGuidance();
    return;
  }

  reviewDemoStatus.textContent = "Step 3/6 complete. Generating high-risk review plan.";
  runSampleCarePlanDemo();
  window.showCareWiseSection?.("review-title");

  reviewDemoStatus.textContent = "Step 4/6 complete. Syncing care plan to backend.";
  await syncLatestPlanToBackend(true);
  const hasBackendId = getReviewQueue().some((item) => item.backendCarePlanId || item.backendSynced) || Boolean(lastGeneratedPlan?.backendCarePlanId);
  if (!hasBackendId) {
    reviewDemoStatus.textContent = "Full demo paused: backend care-plan ID was not linked.";
    renderReviewDemoChecklist();
    renderReviewDemoGuidance();
    return;
  }

  reviewDemoStatus.textContent = "Step 5/7 complete. Loading clinician review queue.";
  await loadBackendReviewQueue();
  reviewDemoStatus.textContent = "Step 6/7 complete. Syncing clinician approval decision.";
  await approveDemoReviewItem(false);
  reviewDemoStatus.textContent = "Full review demo finished. A clinician decision was synced.";
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
}

async function approveDemoReviewItem(showStatus = true) {
  const queue = getReviewQueue();
  const item = queue.find((entry) => entry.backendCarePlanId && matchesReviewFilter(entry, "pending"))
    || queue.find((entry) => matchesReviewFilter(entry, "pending"));
  if (!item) {
    reviewDemoStatus.textContent = localStorage.getItem("carewiseReviewDecisionSynced") === "true"
      ? "Review decision is already synced. Run demo again to create another pending review item."
      : "No pending review item is available. Load the backend queue first.";
    renderReviewDemoChecklist();
    renderReviewDemoGuidance();
    renderReviewDemoOutcome();
    return false;
  }
  const noteBox = document.querySelector(`#review-note-${CSS.escape(item.id)}`);
  if (noteBox && !noteBox.value.trim()) {
    noteBox.value = "Demo clinician note: educational plan language reviewed for safety. Patient should follow up with licensed care team.";
  }
  if (showStatus) reviewDemoStatus.textContent = "Approving the newest pending review item.";
  await updateReviewQueueItem(item.id, "approved");
  if (item.backendCarePlanId) {
    await loadBackendReviewQueue();
  }
  reviewDemoStatus.textContent = "Review decision synced. Approved item moved out of the pending backend queue.";
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
  return true;
}

async function installCareWiseApp() {
  if (!deferredInstallPrompt) {
    if (networkStatus) networkStatus.textContent = "Use browser install";
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  if (installAppButton) installAppButton.hidden = true;
}

function handleCheckoutReturn() {
  const checkoutStatus = new URLSearchParams(window.location.search).get("checkout");
  if (checkoutStatus === "success") {
    paymentBadge.textContent = "Checkout returned";
    paymentBadge.className = "sync-badge online";
    paymentStatus.textContent = "Stripe returned successfully. Webhook confirmation should activate the subscription later.";
  }
  if (checkoutStatus === "cancelled") {
    paymentBadge.textContent = "Checkout cancelled";
    paymentBadge.className = "sync-badge offline";
    paymentStatus.textContent = "Checkout was cancelled. No subscription change was made.";
  }
}

function handlePasswordResetToken() {
  const resetToken = new URLSearchParams(window.location.search).get("reset_token");
  if (!resetToken) return;
  document.querySelector("#reset-token").value = resetToken;
  authStatus.textContent = "Reset token loaded. Enter a new password, then set it.";
}

function handleEmailVerificationToken() {
  const verifyToken = new URLSearchParams(window.location.search).get("verify_token");
  if (!verifyToken) return;
  document.querySelector("#verify-token").value = verifyToken;
  authStatus.textContent = "Verification token loaded. Confirm your email.";
}

function updateAuthStatus(message) {
  const signedIn = Boolean(authToken);
  authBadge.textContent = signedIn ? (emailVerified ? "Verified" : "Verify email") : "Not signed in";
  authBadge.className = `sync-badge ${signedIn && emailVerified ? "online" : "offline"}`;
  signedInLabel.textContent = signedIn ? `Signed in${authEmail ? ` as ${authEmail}` : ""}` : "Signed out";
  signedInDetail.textContent = signedIn
    ? `Role: ${authRole || document.querySelector("#auth-role").value}. Email: ${emailVerified ? "verified" : "not verified"}. Patient link: ${backendPatientId || "not synced yet"}.`
    : "Protected sync is available after signup or login.";
  authStatus.textContent = message || (signedIn
    ? "Account is ready. You can sync profile, consent, medications, and care plans."
    : "Create an account or log in to use the production backend.");
  refreshReviewDemoProof();
}

function getAuthPayload() {
  return {
    email: document.querySelector("#auth-email").value.trim(),
    password: document.querySelector("#auth-password").value,
    role: document.querySelector("#auth-role").value,
  };
}

function validateAuthPayload(payload, requireRole = true) {
  if (!payload.email || !payload.password) {
    updateAuthStatus("Enter an email and password first.");
    return false;
  }
  if (payload.password.length < 12) {
    updateAuthStatus("Password must be at least 12 characters.");
    return false;
  }
  if (requireRole && !payload.role) {
    updateAuthStatus("Choose an account role first.");
    return false;
  }
  return true;
}

async function saveAuthToken(response, action) {
  authToken = response.access_token || "";
  if (!authToken) throw new Error("Missing access token");
  refreshToken = response.refresh_token || refreshToken;
  authEmail = document.querySelector("#auth-email").value.trim();
  authRole = document.querySelector("#auth-role").value;
  localStorage.setItem("carewiseAuthToken", authToken);
  if (refreshToken) localStorage.setItem("carewiseRefreshToken", refreshToken);
  localStorage.setItem("carewiseAuthEmail", authEmail);
  localStorage.setItem("carewiseAuthRole", authRole);
  addAuditEvent(`account_${action}`, `Production backend account ${action}.`);
  renderAuditTrail();
  updateAuthStatus(`Signed in after ${action}.`);
  updateProgressRail();
  await checkBackend(false);
}

async function ensureTeamReviewSession() {
  if (!["clinician", "admin"].includes(document.querySelector("#auth-role").value)) {
    fillTeamAccount("clinician", false);
  }
  const payload = getAuthPayload();
  if (!validateAuthPayload(payload)) return;
  try {
    const loginResponse = await apiPost("/auth/login", {
      email: payload.email,
      password: payload.password,
    }, { skipAuth: true });
    await saveAuthToken(loginResponse, "login");
    reviewDemoStatus.textContent = "Team account logged in. Next, generate or sync the review plan.";
    return;
  } catch {
    try {
      const signupResponse = await apiPost("/auth/signup", payload, { skipAuth: true });
      await saveAuthToken(signupResponse, "signup");
      reviewDemoStatus.textContent = "Team account created and signed in. Next, generate or sync the review plan.";
    } catch {
      reviewDemoStatus.textContent = "Team account login/signup failed. Check backend status or use Account screen manually.";
      updateAuthStatus("Team account login/signup failed. Check backend status or credentials.");
    }
  }
}

async function signup() {
  const payload = getAuthPayload();
  if (!validateAuthPayload(payload)) return;
  try {
    const response = await apiPost("/auth/signup", payload, { skipAuth: true });
    await saveAuthToken(response, "signup");
  } catch (error) {
    updateAuthStatus(authErrorMessage(error, "Account may already exist. Try Log in."));
  }
}

// requestJson throws "Backend returned <status>" for HTTP errors; anything
// else means the server could not be reached.
function authErrorMessage(error, rejectedMessage) {
  const message = String(error?.message || "");
  if (!message.startsWith("Backend returned")) {
    return "The CareWise server is not reachable right now. You can still try the sample report; results stay in this browser.";
  }
  if (message.includes("429")) return "Too many sign-in attempts. Wait a few minutes and try again.";
  if (/Backend returned 4\d\d/.test(message)) return rejectedMessage;
  return "The CareWise server had a problem. Please try again in a moment.";
}

async function login() {
  const payload = getAuthPayload();
  if (!validateAuthPayload(payload, false)) return;
  try {
    const response = await apiPost("/auth/login", {
      email: payload.email,
      password: payload.password,
    }, { skipAuth: true });
    await saveAuthToken(response, "login");
  } catch (error) {
    updateAuthStatus(authErrorMessage(error, "Email or password is incorrect."));
  }
}

async function requestPasswordReset() {
  const email = document.querySelector("#auth-email").value.trim();
  if (!email) {
    updateAuthStatus("Enter your email first, then request a reset.");
    return;
  }
  try {
    const response = await apiPost("/auth/password-reset/request", { email }, { skipAuth: true });
    if (response.reset_token) {
      document.querySelector("#reset-token").value = response.reset_token;
      updateAuthStatus("Reset token created for local testing. Enter a new password and set it.");
      return;
    }
    updateAuthStatus(response.delivery_status === "email_queued"
      ? "Reset email queued. Check your inbox for the reset link."
      : "Reset requested. Email delivery is the next provider setup before public launch.");
  } catch {
    updateAuthStatus("Password reset request failed. Check backend status and try again.");
  }
}

async function requestEmailVerification() {
  if (!authToken) {
    updateAuthStatus("Sign in before requesting email verification.");
    return;
  }
  try {
    const response = await apiPost("/auth/email-verification/request", {});
    if (response.verification_token) {
      document.querySelector("#verify-token").value = response.verification_token;
      updateAuthStatus("Verification token created for local testing. Confirm your email.");
      return;
    }
    updateAuthStatus(response.delivery_status === "already_verified"
      ? "Email is already verified."
      : "Verification email queued. Check your inbox for the link.");
  } catch {
    updateAuthStatus("Email verification request failed. Check backend status.");
  }
}

async function confirmEmailVerification() {
  const token = document.querySelector("#verify-token").value.trim();
  if (!token) {
    updateAuthStatus("Paste the email verification token first.");
    return;
  }
  try {
    const session = await apiPost("/auth/email-verification/confirm", { token }, { skipAuth: true });
    emailVerified = Boolean(session.email_verified);
    if (session.email) authEmail = session.email;
    if (session.role) authRole = session.role;
    localStorage.setItem("carewiseEmailVerified", String(emailVerified));
    localStorage.setItem("carewiseAuthEmail", authEmail);
    localStorage.setItem("carewiseAuthRole", authRole);
    document.querySelector("#verify-token").value = "";
    updateAuthStatus("Email verified.");
  } catch {
    updateAuthStatus("Email verification failed. The token may be expired or already used.");
  }
}

async function confirmPasswordReset() {
  const token = document.querySelector("#reset-token").value.trim();
  const newPassword = document.querySelector("#reset-password").value;
  if (!token) {
    updateAuthStatus("Paste the reset token first.");
    return;
  }
  if (newPassword.length < 12) {
    updateAuthStatus("New password must be at least 12 characters.");
    return;
  }
  try {
    const response = await apiPost("/auth/password-reset/confirm", {
      token,
      new_password: newPassword,
    }, { skipAuth: true });
    document.querySelector("#auth-password").value = newPassword;
    document.querySelector("#reset-token").value = "";
    document.querySelector("#reset-password").value = "";
    await saveAuthToken(response, "password_reset");
  } catch {
    updateAuthStatus("Password reset failed. The token may be expired or already used.");
  }
}

function logout() {
  const tokenToRevoke = refreshToken;
  clearAuthSession();
  if (tokenToRevoke) {
    apiPost("/auth/logout", { refresh_token: tokenToRevoke }, { skipAuth: true }).catch(() => {});
  }
  addAuditEvent("account_logout", "Signed out locally and cleared backend patient link.");
  renderAuditTrail();
  updateAuthStatus("Signed out. Local prototype data is still on this device.");
  setBackendStatus(backendAvailable, backendAvailable ? "Backend is available. Sign in again to sync." : "Signed out. Backend is offline.");
}

function clearAuthSession() {
  authToken = "";
  refreshToken = "";
  authEmail = "";
  authRole = "";
  emailVerified = false;
  backendPatientId = "";
  localStorage.removeItem("carewiseAuthToken");
  localStorage.removeItem("carewiseRefreshToken");
  localStorage.removeItem("carewiseAuthEmail");
  localStorage.removeItem("carewiseAuthRole");
  localStorage.removeItem("carewiseEmailVerified");
  localStorage.removeItem("carewiseBackendPatientId");
}

async function recordConsentToBackend(showStatus = true) {
  const accepted = document.querySelector("#privacy-consent").checked;
  if (!authToken) {
    if (showStatus) updateAuthStatus("Sign in before recording consent to the backend.");
    return;
  }
  try {
    const response = await apiPost("/consent", {
      consent_type: "care_planning",
      version: "2026-06-15",
      accepted,
      region: document.querySelector("#location").value.trim() || "US",
      source: "web",
    });
    addAuditEvent("backend_consent_recorded", `Consent ${accepted ? "accepted" : "declined"} on backend as ${response.id}.`);
    renderAuditTrail();
    updateAuthStatus(`Consent ${accepted ? "accepted" : "declined"} and recorded.`);
  } catch {
    if (showStatus) updateAuthStatus("Consent could not sync. Local consent was saved.");
  }
}

async function apiGet(path) {
  return requestJson("GET", path);
}

async function apiPost(path, payload, options = {}) {
  return requestJson("POST", path, payload, options);
}

async function apiPut(path, payload) {
  return requestJson("PUT", path, payload);
}

async function requestJson(method, path, payload, options = {}) {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  const headers = isFormData ? {} : { "Content-Type": "application/json" };
  if (authToken && !options.skipAuth) headers.Authorization = `Bearer ${authToken}`;
  const body = isFormData ? payload : (payload ? JSON.stringify(payload) : undefined);

  if (typeof fetch === "function") {
    const response = await fetch(`${backendBaseUrl}${path}`, {
      method,
      headers,
      body,
    });
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return response.json();
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, `${backendBaseUrl}${path}`);
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`Backend returned ${request.status}`));
        return;
      }
      try {
        resolve(JSON.parse(request.responseText));
      } catch (error) {
        reject(error);
      }
    };
    request.onerror = () => reject(new Error("Backend request failed"));
    request.send(body);
  });
}

async function checkBackend(showSuccess) {
  try {
    const health = await apiGet("/health");
    await loadBackendReadiness();
    const sessionOk = await verifyCurrentSession();
    await loadBackendFeatures();
    await loadSubscriptionPlans();
    const authHint = authToken && sessionOk ? "Signed in and verified." : "Sign in to enable protected sync.";
    setBackendStatus(true, `${health.service} is connected. ${authHint} ${backendPatientId ? "Patient link is ready." : "Sync profile to create a patient record."}`);
    if (showSuccess) updateAuthStatus(authToken ? "Backend verified your session." : "Backend is online. Sign up or log in next.");
    renderReportHistory();
    renderHomeReadiness(true);
    renderLaunchProof();
    return true;
  } catch {
    setBackendStatus(false, "Backend is offline. Local browser storage is still active.");
    backendReadiness = {};
    renderHomeReadiness(false);
    renderSecurityReadiness();
    renderLaunchProof();
    return false;
  }
}

// The hosted API sleeps when idle and can take about a minute to wake,
// so keep retrying on page load instead of reporting it offline at once.
async function wakeBackendOnLoad(attempts = 12, delayMs = 8000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await checkBackend(false)) return true;
    if (attempt === attempts) break;
    renderHomeReadiness(false, true);
    setBackendStatus(false, "Waking up the CareWise server. This can take up to a minute.");
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

async function verifyCurrentSession() {
  if (!authToken) return false;
  try {
    const session = await apiGet("/auth/me");
    authEmail = session.email || authEmail;
    authRole = session.role || authRole;
    emailVerified = Boolean(session.email_verified);
    localStorage.setItem("carewiseAuthEmail", authEmail);
    localStorage.setItem("carewiseAuthRole", authRole);
    localStorage.setItem("carewiseEmailVerified", String(emailVerified));
    document.querySelector("#auth-email").value = authEmail;
    document.querySelector("#auth-role").value = authRole;
    updateAuthStatus("Session verified with backend.");
    return true;
  } catch {
    const refreshed = await refreshAuthSession();
    if (refreshed) return verifyCurrentSession();
    clearAuthSession();
    updateAuthStatus("Session expired. Log in again to sync protected data.");
    return false;
  }
}

async function refreshAuthSession() {
  if (!refreshToken) return false;
  try {
    const response = await apiPost("/auth/refresh", { refresh_token: refreshToken }, { skipAuth: true });
    authToken = response.access_token || "";
    refreshToken = response.refresh_token || "";
    if (!authToken || !refreshToken) return false;
    localStorage.setItem("carewiseAuthToken", authToken);
    localStorage.setItem("carewiseRefreshToken", refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function loadBackendFeatures() {
  try {
    backendFeatures = await apiGet("/features");
    renderPaymentReadiness();
    renderSecurityReadiness();
    renderOcrReadiness();
  } catch {
    backendFeatures = {};
    renderSecurityReadiness();
    renderOcrReadiness();
  }
}

async function loadBackendReadiness() {
  try {
    backendReadiness = await apiGet("/ready");
    renderHomeReadiness(true);
  } catch {
    backendReadiness = {};
    renderHomeReadiness(false);
  }
}

function renderHomeReadiness(apiOnline = backendAvailable, waking = false) {
  if (!homeReadiness) return;
  const checks = backendReadiness.checks || {};
  const items = [
    ["API", apiOnline, apiOnline ? "Online" : waking ? "Waking up" : "Offline"],
    ["Database", checks.database, checks.database ? "Ready" : "Pending"],
    ["Storage", checks.storage, checks.storage ? "Ready" : "Pending"],
  ];
  homeReadiness.innerHTML = items.map(([label, ready, status]) => `
    <article class="${ready ? "ready" : "pending"}">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(status)}</span>
    </article>
  `).join("");
  renderLaunchProof();
}

function renderLaunchProof() {
  if (!launchProof) return;
  let outcome = null;
  try {
    outcome = JSON.parse(localStorage.getItem("carewiseReviewDemoOutcome") || "null");
  } catch {
    outcome = null;
  }
  const checks = backendReadiness.checks || {};
  const backendReady = Boolean(backendAvailable && checks.database && checks.configuration);
  const storageReady = Boolean(checks.storage || backendFeatures.report_uploads);
  const reviewReady = Boolean(outcome || localStorage.getItem("carewiseReviewDecisionSynced") === "true");
  const legalReady = true;
  const items = [
    ["Backend", backendReady, backendReady ? "API + database ready" : backendAvailable ? "API online, checks pending" : "Offline"],
    ["Review proof", reviewReady, reviewReady ? "Decision receipt ready" : "Run review demo"],
    ["Data safety", storageReady, storageReady ? "Private storage configured" : "Storage check pending"],
    ["Launch posture", legalReady, "Safe MVP, legal drafts ready"],
  ];
  launchProof.innerHTML = items.map(([label, ready, detail]) => `
    <article class="${ready ? "complete" : "pending"}">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(detail)}</span>
    </article>
  `).join("");
}

function getLaunchProofText() {
  const proofItems = [...document.querySelectorAll("#launch-proof article")].map((item) => {
    const label = item.querySelector("strong")?.textContent.trim() || "Item";
    const detail = item.querySelector("span")?.textContent.trim() || "Pending";
    return `${label}: ${detail}`;
  });
  let outcome = null;
  try {
    outcome = JSON.parse(localStorage.getItem("carewiseReviewDemoOutcome") || "null");
  } catch {
    outcome = null;
  }
  return [
    "CareWise AI launch proof",
    `Generated: ${new Date().toLocaleString()}`,
    ...proofItems,
    outcome ? `Clinical review receipt: ${outcome.status} for ${outcome.carePlanId}` : "Clinical review receipt: not generated yet",
    "Safety posture: educational care planning only; no diagnosis, cure, prescription, or emergency replacement claims.",
  ].join("\n");
}

function copyLaunchProof() {
  const proof = getLaunchProofText();
  navigator.clipboard?.writeText(proof)
    .then(() => {
      launchProofStatus.textContent = "Launch proof copied.";
    })
    .catch(() => {
      launchProofStatus.textContent = proof;
    });
}

function getStoreDisclosureText() {
  const checks = backendReadiness.checks || {};
  const storageReady = Boolean(checks.storage || backendFeatures.report_uploads);
  const encryptionReady = Boolean(checks.configuration);
  return [
    "CareWise AI app-store privacy disclosure draft",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Data collected:",
    "- Account email and authentication data",
    "- Consent history and privacy choices",
    "- Health-related intake answers typed by the user",
    "- User-uploaded report files or pasted report text",
    "- Saved educational report explanations and recommendations",
    "- Educational care plans, check-ins, medication organizer entries, and clinical review workflow records",
    "- Subscription status when payments are enabled",
    "",
    "Purpose:",
    "- Account creation, login, and protected sync",
    "- Report organization and educational explanation",
    "- Diet, habit, medication-reminder, and follow-up planning",
    "- Safety review routing, audit trail, support, and deletion/export requests",
    "",
    "Security posture to verify before submission:",
    `- Private report storage configured: ${storageReady ? "yes" : "needs setup or verification"}`,
    `- Production configuration check: ${encryptionReady ? "ready" : "needs verification"}`,
    "- Do not store health data in analytics logs",
    "- Do not sell health data",
    "- Use encrypted transport and protected backend storage",
    "",
    "User controls:",
    "- Local data export and local data clear",
    "- Backend export request after login",
    "- Backend deletion request after login",
    "- Consent shown before care-plan generation",
    "",
    "Medical wording:",
    "- Educational care planning only",
    "- No diagnosis, cure, prescription, or emergency replacement claims",
    "- High-risk symptoms should route to emergency care or licensed clinician review",
    "",
    "Review note: final Apple Privacy details and Google Play Data Safety answers must be reviewed by legal, security, and clinical advisors before public launch.",
  ].join("\n");
}

function copyStoreDisclosure() {
  const text = getStoreDisclosureText();
  if (storeDisclosureOutput) storeDisclosureOutput.value = text;
  navigator.clipboard?.writeText(text)
    .then(() => {
      storeDisclosureStatus.textContent = "App-store privacy draft generated and copied.";
    })
    .catch(() => {
      storeDisclosureStatus.textContent = "Copy unavailable in this browser. Draft is shown in the text box.";
    });
}

function getDemoScripts() {
  try {
    return JSON.parse(localStorage.getItem("carewiseDemoScripts") || "[]");
  } catch {
    return [];
  }
}

function getLatestDemoScript() {
  return getDemoScripts()[0] || null;
}

function getDemoScriptSteps() {
  const qaReport = getLatestQaReport();
  const qaReady = qaReport ? `${qaReport.readyCount}/${qaReport.total}` : "not run";
  return [
    {
      label: "Open with mission",
      anchor: "app-title",
      ready: true,
      detail: "CareWise AI organizes health concerns, report text, food habits, and follow-up questions before a licensed care professional visit.",
    },
    {
      label: "Show live readiness",
      anchor: "home-title",
      ready: Boolean(backendAvailable),
      detail: backendAvailable ? "Point to API, database, and private storage readiness signals." : "Say the web prototype is visible; backend should be checked before live demos.",
    },
    {
      label: "Run patient flow",
      anchor: "home-title",
      ready: true,
      detail: "Use Run sample plan to show consent, intake, educational guidance, food/habit ideas, and safety routing.",
    },
    {
      label: "Show report support",
      anchor: "report-title",
      ready: Boolean(latestReportId || getReportHistory().length),
      detail: latestReportId || getReportHistory().length ? "Show uploaded/analyzed report history and safe next steps." : "Paste sample lab text or upload a sample report before a serious demo.",
    },
    {
      label: "Show follow-up tools",
      anchor: "reminder-title",
      ready: Boolean(getReminders().length || getCheckins().length || getMedications().length),
      detail: "Show reminders, check-ins, medication organizer, care navigation, and support inbox as retention workflows.",
    },
    {
      label: "Show clinician safety",
      anchor: "review-title",
      ready: Boolean(getReviewProofReady() || getReviewQueue().length),
      detail: getReviewProofReady() ? "Show review receipt and audit trail proof." : "Run review demo or add sample review item before investor conversations.",
    },
    {
      label: "Show QA and launch discipline",
      anchor: "qa-title",
      ready: Boolean(qaReport),
      detail: `QA report: ${qaReady}. Emphasize controlled MVP, no diagnosis/cure/prescription claims, and legal/clinical review before launch.`,
    },
    {
      label: "Close with ask",
      anchor: "launch-title",
      ready: true,
      detail: "Ask for feedback from licensed clinicians, privacy/security advisors, healthcare operators, and early users before fundraising or public launch.",
    },
  ];
}

function buildDemoScript() {
  const steps = getDemoScriptSteps();
  const readyCount = steps.filter((step) => step.ready).length;
  const script = {
    id: `demo-${Date.now()}`,
    createdAt: new Date().toISOString(),
    readyCount,
    total: steps.length,
    status: readyCount === steps.length ? "Demo path ready" : "Demo path has prep items",
    steps,
  };
  const scripts = getDemoScripts();
  scripts.unshift(script);
  localStorage.setItem("carewiseDemoScripts", JSON.stringify(scripts.slice(0, 12)));
  demoScriptStatus.textContent = `${readyCount}/${steps.length} walkthrough steps ready. ${script.status}.`;
  addAuditEvent("demo_script_built", `Demo walkthrough built with ${readyCount}/${steps.length} steps ready.`);
  renderDemoScript();
  renderAuditTrail();
}

function renderDemoScript() {
  if (!demoScriptResults) return;
  const script = getLatestDemoScript();
  if (!script) {
    demoScriptResults.innerHTML = "<article><strong>Not built yet</strong><span>Run the builder to see the recommended demo path.</span></article>";
    return;
  }
  demoScriptResults.innerHTML = `
    <article class="demo-script-summary">
      <strong>${escapeHtml(script.readyCount)}/${escapeHtml(script.total)} steps ready</strong>
      <span>${escapeHtml(script.status)}</span>
    </article>
    ${script.steps.map((step, index) => `
      <article class="${step.ready ? "complete" : "pending"}">
        <div>
          <strong>${index + 1}. ${escapeHtml(step.label)}</strong>
          <a href="#${escapeHtml(step.anchor)}">${step.ready ? "Open" : "Prep"}</a>
        </div>
        <span>${escapeHtml(step.detail)}</span>
      </article>
    `).join("")}
  `;
}

function getDemoScriptText() {
  const script = getLatestDemoScript();
  if (!script) return "CareWise AI demo walkthrough\nNo demo script built yet.";
  return [
    "CareWise AI demo walkthrough",
    `Generated: ${new Date(script.createdAt).toLocaleString()}`,
    `Status: ${script.status}`,
    `Readiness: ${script.readyCount}/${script.total}`,
    "Safety line: CareWise is educational planning support, not diagnosis, cure, prescription, insurance verification, or emergency care.",
    "",
    ...script.steps.map((step, index) => [
      `${index + 1}. ${step.label}`,
      `State: ${step.ready ? "Ready" : "Prep needed"}`,
      `Section: #${step.anchor}`,
      `Talking point: ${step.detail}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyDemoScript() {
  const text = getDemoScriptText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      demoScriptStatus.textContent = "Demo walkthrough copied.";
    })
    .catch(() => {
      demoScriptStatus.textContent = "Copy unavailable. Use local JSON export to save the demo walkthrough.";
    });
}

function getInvestorBriefText() {
  const checks = backendReadiness.checks || {};
  const reportCount = getReportHistory().length;
  const savedCount = getSavedPlans().length;
  const checkinCount = getCheckins().length;
  const medicationCount = getMedications().length;
  const backendLine = backendAvailable
    ? `Live FastAPI backend connected. Database: ${checks.database ? "ready" : "pending"}. Private storage: ${(checks.storage || backendFeatures.report_uploads) ? "ready" : "pending"}.`
    : "Frontend demo is available; backend connectivity should be checked before a live demo.";
  const reviewLine = getReviewProofReady()
    ? "Clinical review demo receipt is available, showing the safer human-review workflow."
    : "Clinical review workflow exists; run the review demo before serious investor conversations.";
  return [
    "CareWise AI investor one-page brief",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Mission:",
    "CareWise AI helps people organize health concerns, lab report text, food habits, medication notes, and follow-up questions before speaking with licensed care professionals.",
    "",
    "Problem:",
    "Patients often leave labs, portals, and insurance pages confused. They need a simple way to understand next steps, prepare better questions, track habits, and know when a clinician or emergency pathway is needed.",
    "",
    "MVP:",
    "- Account, login, consent, intake, report upload, educational report explanation, saved care plans, check-ins, medication organizer, payment placeholder, legal pages, data export/deletion request, and clinician review dashboard.",
    "- The app uses safe language: educational care planning only, no diagnosis, cure, prescription, or emergency replacement claims.",
    "",
    "Current technical posture:",
    `- ${backendLine}`,
    "- Frontend is deployed as a mobile-friendly web MVP and can feed a future React Native or Flutter app.",
    "- Reports are designed for private object storage, with audit trail and consent history in the workflow.",
    `- ${reviewLine}`,
    "",
    "Current demo assets in this browser:",
    `- Saved plans: ${savedCount}`,
    `- Reports: ${reportCount}`,
    `- Check-ins: ${checkinCount}`,
    `- Medication entries: ${medicationCount}`,
    "",
    "Business model hypothesis:",
    "- Monthly subscription tiers for education, care planning, report organization, reminders, and care-navigation support.",
    "- Future revenue may include employer, clinic, or care-navigation partnerships only after legal, privacy, security, and clinical validation.",
    "",
    "Next milestones:",
    "1. Complete clinician/nutritionist review of sample outputs.",
    "2. Add production OpenAI OCR and safer report-analysis evaluation tests.",
    "3. Connect Stripe only after refund policy, terms, privacy, and clinical review are complete.",
    "4. Build mobile app shell and run TestFlight/Android internal testing.",
    "5. Validate with real users and licensed advisors before public marketing.",
    "",
    "Ask:",
    "Seeking feedback from healthcare operators, licensed clinicians, privacy/security advisors, and early users before fundraising or public launch.",
  ].join("\n");
}

function generateInvestorBrief() {
  if (!investorBriefOutput || !investorBriefStatus) return;
  const text = getInvestorBriefText();
  investorBriefOutput.value = text;
  investorBriefStatus.textContent = "Investor brief generated. Review before sharing externally.";
  addAuditEvent("investor_brief_generated", "Investor one-page brief generated in Launch Readiness.");
}

function getPilotLeads() {
  try {
    return JSON.parse(localStorage.getItem("carewisePilotLeads") || "[]");
  } catch {
    return [];
  }
}

function renderPilotLeads() {
  if (!pilotLeads) return;
  const leads = getPilotLeads();
  if (!leads.length) {
    pilotLeads.innerHTML = "<p>No pilot leads saved yet.</p>";
    return;
  }
  pilotLeads.innerHTML = leads.map((lead) => `
    <article>
      <div>
        <strong>${escapeHtml(lead.name)}</strong>
        <span>${escapeHtml(lead.role)} · ${escapeHtml(lead.followup)}</span>
      </div>
      <p>${escapeHtml(lead.notes || "No notes saved.")}</p>
      <small>${escapeHtml(lead.email)} · ${escapeHtml(new Date(lead.createdAt).toLocaleString())}</small>
    </article>
  `).join("");
}

function savePilotLead() {
  const name = document.querySelector("#pilot-name")?.value.trim() || "";
  const email = document.querySelector("#pilot-email")?.value.trim() || "";
  const role = document.querySelector("#pilot-role")?.value || "Early user";
  const followup = document.querySelector("#pilot-followup")?.value || "This week";
  const notes = document.querySelector("#pilot-notes")?.value.trim() || "";
  if (!name || !email) {
    pilotStatus.textContent = "Add a name and email before saving a pilot lead.";
    return;
  }
  const leads = getPilotLeads();
  leads.unshift({
    id: `pilot-${Date.now()}`,
    name,
    email,
    role,
    followup,
    notes,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("carewisePilotLeads", JSON.stringify(leads.slice(0, 30)));
  pilotStatus.textContent = `${name} saved locally for ${followup.toLowerCase()} follow-up.`;
  addAuditEvent("pilot_lead_saved", `${name} saved as ${role}.`);
  renderPilotLeads();
  renderAuditTrail();
}

function fillSamplePilotLead() {
  document.querySelector("#pilot-name").value = "Dr. Maya Patel";
  document.querySelector("#pilot-email").value = "maya.patel@example.com";
  document.querySelector("#pilot-role").value = "Clinician advisor";
  document.querySelector("#pilot-followup").value = "This week";
  document.querySelector("#pilot-notes").value = "Review report-summary wording, red-flag routing, and clinician dashboard before any public pilot.";
  pilotStatus.textContent = "Sample clinician advisor lead filled. Save it when ready.";
}

function getPilotListText() {
  const leads = getPilotLeads();
  if (!leads.length) return "CareWise AI pilot leads\nNo pilot leads saved yet.";
  return [
    "CareWise AI pilot leads",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    ...leads.map((lead, index) => [
      `${index + 1}. ${lead.name} (${lead.role})`,
      `Email: ${lead.email}`,
      `Follow-up: ${lead.followup}`,
      `Notes: ${lead.notes || "No notes saved."}`,
      `Saved: ${new Date(lead.createdAt).toLocaleString()}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyPilotList() {
  const text = getPilotListText();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => {
        pilotStatus.textContent = "Pilot lead list copied.";
      })
      .catch(() => {
        pilotStatus.textContent = "Copy unavailable. Use local JSON export to save pilot leads.";
      });
    return;
  }
  pilotStatus.textContent = "Copy unavailable. Use local JSON export to save pilot leads.";
}

function getReviewProofReady() {
  let outcome = null;
  try {
    outcome = JSON.parse(localStorage.getItem("carewiseReviewDemoOutcome") || "null");
  } catch {
    outcome = null;
  }
  return Boolean(outcome || localStorage.getItem("carewiseReviewDecisionSynced") === "true");
}

function getSafetyLanguageReady() {
  const pageText = document.body?.textContent?.toLowerCase() || "";
  return pageText.includes("no diagnosis") || pageText.includes("educational care planning");
}

function renderPreflightReport(items) {
  if (!preflightReport) return;
  preflightReport.innerHTML = items.map((item) => `
    <article class="${item.ready ? "complete" : "pending"}">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </article>
  `).join("");
}

async function runLaunchPreflight() {
  if (!preflightReport || !preflightStatus) return;
  preflightStatus.textContent = "Running CareWise launch preflight.";
  renderPreflightReport([
    { label: "Preflight", ready: false, detail: "Checking live systems" },
  ]);
  const apiOnline = await checkBackend(false);
  const checks = backendReadiness.checks || {};
  const sessionReady = Boolean(authToken && authEmail && (await verifyCurrentSession()));
  const storageReady = Boolean(checks.storage || backendFeatures.report_uploads);
  const reviewReady = getReviewProofReady();
  const safetyReady = getSafetyLanguageReady();
  const items = [
    { label: "API", ready: apiOnline, detail: apiOnline ? "Live backend responded" : "Backend is offline" },
    { label: "Database", ready: Boolean(checks.database), detail: checks.database ? "PostgreSQL ready" : "Database check pending" },
    { label: "Configuration", ready: Boolean(checks.configuration), detail: checks.configuration ? "Production config ready" : "Config check pending" },
    { label: "Private storage", ready: storageReady, detail: storageReady ? "Report storage ready" : "Add R2/S3 storage secrets" },
    { label: "Signed-in demo", ready: sessionReady, detail: sessionReady ? `Session verified for ${authEmail}` : "Log in before showing protected sync" },
    { label: "Patient sync", ready: Boolean(backendPatientId), detail: backendPatientId ? "Patient profile linked" : "Sync profile before demo" },
    { label: "Review proof", ready: reviewReady, detail: reviewReady ? "Clinical review receipt exists" : "Run and approve review demo" },
    { label: "Safe wording", ready: safetyReady, detail: safetyReady ? "Non-diagnostic wording present" : "Review medical disclaimer wording" },
  ];
  renderPreflightReport(items);
  const readyCount = items.filter((item) => item.ready).length;
  preflightStatus.textContent = `${readyCount}/${items.length} preflight checks ready. ${readyCount === items.length ? "Good for a controlled MVP demo." : "Fix pending items before a serious demo."}`;
  addAuditEvent("launch_preflight", `Launch preflight completed with ${readyCount}/${items.length} checks ready.`);
}

function renderSecurityReadiness() {
  if (!securityReadiness) return;
  const checks = backendReadiness.checks || {};
  const items = [
    ["Database", checks.database, "PostgreSQL is reachable."],
    ["Configuration", checks.configuration, "Production settings passed startup checks."],
    ["Storage mode", checks.storage, "Report storage configuration is valid."],
    ["Auth session", backendFeatures.auth_session, "Backend verifies saved login tokens."],
    ["Refresh tokens", backendFeatures.refresh_tokens, "Longer sessions rotate safely."],
    ["Rate limits", backendFeatures.auth_rate_limit, "Signup, login, and reset abuse protection."],
    ["Email verify", backendFeatures.email_verification, "Users can prove email ownership."],
    ["Password reset", backendFeatures.password_reset, "Users can recover accounts."],
    ["Email delivery", backendFeatures.email_delivery, "SMTP provider connected."],
    ["Private storage", backendFeatures.report_uploads, "Reports upload through backend storage."],
    ["Image OCR", backendFeatures.image_ocr, "OpenAI OCR key connected."],
  ];
  securityReadiness.innerHTML = items.map(([label, ready, description]) => `
    <article class="${ready ? "ready" : "pending"}">
      <strong>${escapeHtml(label)}</strong>
      <span>${ready ? "Ready" : "Needs setup"} · ${escapeHtml(description)}</span>
    </article>
  `).join("");
}

function renderPaymentReadiness() {
  if (backendFeatures.stripe_checkout && backendFeatures.stripe_webhook) {
    paymentBadge.textContent = "Stripe live";
    paymentBadge.className = "sync-badge online";
    paymentStatus.textContent = "Stripe Checkout and webhook automation are configured.";
    return;
  }
  if (backendFeatures.stripe_checkout) {
    paymentBadge.textContent = "Checkout ready";
    paymentBadge.className = "sync-badge online";
    paymentStatus.textContent = "Stripe Checkout is configured. Add the webhook secret to activate subscription status updates.";
    return;
  }
  paymentBadge.textContent = "Manual checkout";
  paymentBadge.className = "sync-badge offline";
  paymentStatus.textContent = "Add Stripe keys in Render to replace this manual checkout placeholder.";
}

async function loadSubscriptionPlans() {
  try {
    subscriptionPlans = await apiGet("/subscriptions/plans");
    renderSubscriptionPlans();
  } catch {
    subscriptionPlans = [];
  }
}

function renderSubscriptionPlans() {
  if (!subscriptionPlans.length) return;
  const selectedPlan = document.querySelector("input[name='plan']:checked")?.value || "basic";
  const planOptions = document.querySelector(".plan-options");
  const paymentGrid = document.querySelector(".payment-grid");
  planOptions.innerHTML = subscriptionPlans.map((plan) => `
    <label class="plan-card">
      <input type="radio" name="plan" value="${escapeHtml(plan.plan_code)}" ${plan.plan_code === selectedPlan ? "checked" : ""} />
      <span class="plan-name">${escapeHtml(plan.name)}</span>
      <strong>$${Number(plan.monthly_price_usd)}/mo</strong>
      <span>${escapeHtml(plan.summary)}</span>
    </label>
  `).join("");
  paymentGrid.innerHTML = subscriptionPlans.map((plan) => `
    <article>
      <strong>${escapeHtml(plan.name)}</strong>
      <span>$${Number(plan.monthly_price_usd)}/mo</span>
      <p>${escapeHtml(plan.summary)}</p>
      <ul>
        <li>${escapeHtml(plan.plan_code === "basic" ? "Monthly education summary" : plan.plan_code === "plus" ? "Report-informed planning" : "Priority navigation workflow")}</li>
        <li>${escapeHtml(plan.plan_code === "basic" ? "Saved care history" : plan.plan_code === "plus" ? "Monthly check-ins" : "Weekly follow-up workflow")}</li>
        <li>${escapeHtml(plan.plan_code === "basic" ? "Habit reminders" : plan.plan_code === "plus" ? "Doctor and insurance prep" : "Concierge handoff prep")}</li>
      </ul>
    </article>
  `).join("");
}

function profileToBackendPayload(profile) {
  return {
    name: profile.name || "CareWise Patient",
    date_of_birth: "",
    sex_at_birth: profile.sex,
    conditions: profile.conditions,
    allergies: profile.allergies,
    insurance_status: document.querySelector("#insurance").value,
    location_region: document.querySelector("#location").value.trim() || "US",
  };
}

async function ensureBackendPatient(showStatus = true) {
  if (!authToken) {
    if (showStatus) updateAuthStatus("Sign in before creating a backend patient profile.");
    return "";
  }
  const online = backendAvailable || await checkBackend(false);
  if (!online) return "";
  const response = await apiPut("/patients/me/profile", profileToBackendPayload(getProfile()));
  backendPatientId = response.patient_id;
  localStorage.setItem("carewiseBackendPatientId", backendPatientId);
  if (showStatus) setBackendStatus(true, `Backend patient profile saved: ${backendPatientId}`);
  addAuditEvent("backend_patient_saved", `Backend patient profile saved: ${backendPatientId}.`);
  renderAuditTrail();
  return backendPatientId;
}

async function syncProfileToBackend(showStatus = true) {
  try {
    const patientId = await ensureBackendPatient(showStatus);
    if (!patientId) {
      if (showStatus) setBackendStatus(false, "Start the backend before syncing profile data.");
      renderReviewDemoChecklist();
      renderReviewDemoGuidance();
      return;
    }
    if (showStatus) setBackendStatus(true, `Profile linked to backend patient ${patientId}.`);
    renderReviewDemoChecklist();
    renderReviewDemoGuidance();
  } catch {
    setBackendStatus(false, "Profile sync failed. Local storage is still active.");
    renderReviewDemoChecklist();
    renderReviewDemoGuidance();
  }
}

async function syncMedicationToBackend(medication, showStatus = false) {
  try {
    const patientId = await ensureBackendPatient(false);
    if (!patientId) return;
    await apiPost(`/patients/${patientId}/medications`, {
      name: medication.name,
      dose: medication.dose,
      timing: medication.timing,
      refill_date: medication.refill,
      notes: medication.notes,
    });
    addAuditEvent("backend_medication_synced", `${medication.name} synced to backend for patient ${patientId}.`);
    renderAuditTrail();
    if (showStatus) setBackendStatus(true, `${medication.name} synced to backend.`);
  } catch {
    if (showStatus) setBackendStatus(false, "Medication sync failed. Local medication was saved.");
  }
}

function latestPlanToBackendPayload(plan, patientId) {
  return {
    patient_id: patientId,
    symptom_text: plan.symptoms,
    goals: plan.goals,
    diet_style: plan.dietStyle,
    activity_level: plan.activityLevel,
  };
}

function getPendingReviewItemForSync() {
  return getReviewQueue().find((item) => !item.backendCarePlanId && !item.backendSynced && item.symptoms);
}

function reviewItemToBackendPayload(item, patientId) {
  return {
    patient_id: patientId,
    symptom_text: item.symptoms || item.summary || "CareWise clinician review item.",
    goals: ["doctor", "diet", "tracking"],
    diet_style: document.querySelector("#diet-style")?.value || "flexible",
    activity_level: document.querySelector("#activity-level")?.value || "sedentary",
  };
}

async function syncLatestPlanToBackend(showStatus = true) {
  try {
    const fallbackReviewItem = lastGeneratedPlan ? null : getPendingReviewItemForSync();
    if (!lastGeneratedPlan && !fallbackReviewItem) {
      if (showStatus) setBackendStatus(backendAvailable, "Generate a care plan or local review item before syncing.");
      return;
    }
    const patientId = await ensureBackendPatient(false);
    if (!patientId) {
      if (showStatus) setBackendStatus(false, authToken ? "Sync profile before syncing the care plan." : "Sign in before syncing the care plan.");
      return;
    }
    const payload = lastGeneratedPlan
      ? latestPlanToBackendPayload(lastGeneratedPlan, patientId)
      : reviewItemToBackendPayload(fallbackReviewItem, patientId);
    const response = await apiPost("/care-plans/generate", payload);
    if (lastGeneratedPlan) lastGeneratedPlan.backendCarePlanId = response.id;
    attachBackendReviewIdToLocalItem(response, fallbackReviewItem?.id);
    addAuditEvent("backend_plan_synced", `Care plan synced to backend as ${response.id} with ${response.status} status.`);
    renderAuditTrail();
    if (showStatus) setBackendStatus(true, `Latest care plan synced: ${response.id}`);
  } catch {
    if (showStatus) setBackendStatus(false, "Care plan sync failed. Local plan is still available.");
  }
}

async function loadBackendAuditEvents() {
  try {
    if (!authToken) {
      updateAuthStatus("Sign in before loading consent history.");
      return;
    }
    const online = backendAvailable || await checkBackend(false);
    if (!online) {
      setBackendStatus(false, "Start the backend before loading consent history.");
      return;
    }
    const response = await apiGet("/consent/history");
    const events = response.items.map((event) => ({
      id: event.id,
      createdAt: event.created_at,
      action: "backend_consent_history",
      message: `${event.consent_type} ${event.accepted ? "accepted" : "declined"} in ${event.region || "unknown region"} from ${event.source}.`,
    }));
    localStorage.setItem("carewiseAuditEvents", JSON.stringify(events.slice(0, 50)));
    renderAuditTrail();
    setBackendStatus(true, `Loaded ${events.length} backend consent record${events.length === 1 ? "" : "s"}.`);
  } catch {
    setBackendStatus(false, "Could not load backend consent history.");
  }
}

function handleReportFileSelection() {
  const file = document.querySelector("#report-file").files?.[0];
  if (!file) return;
  document.querySelector("#report-name").value = file.name;
  updateProgressRail();
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    reportStatus.textContent = "Reading text report from file.";
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector("#report-text").value = String(reader.result || "").slice(0, 12000);
      reportStatus.textContent = "Text report loaded. Press Analyze report.";
      updateProgressRail();
    };
    reader.onerror = () => {
      reportStatus.textContent = "Could not read the text file. Paste the report text manually.";
    };
    reader.readAsText(file);
    return;
  }
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    readPdfTextLocally(file);
    return;
  }
  if (isImage && !backendFeatures.image_ocr) {
    reportStatus.textContent = "File selected. It will upload privately, but paste readable lab text too because live OCR is not enabled yet.";
    return;
  }
  reportStatus.textContent = "File selected. CareWise will use readable text when available, then upload securely.";
}

// Text-based PDFs are read in the browser, so the file never leaves the
// device and analysis works without an account or the API.
const PDFJS_VERSION = "6.3.289";
const PDFJS_BASE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;

// Rebuilds text lines from positioned PDF text. Items within half a line height
// of each other belong to one row, so a table cell nudged by a superscript
// footnote (Labcorp's "Cholesterol, Total 01") stays on the row with its value.
function groupPdfTextRows(items) {
  const rows = [];
  items
    .filter((item) => item.str?.trim())
    .map((item) => ({ x: item.transform[4], y: item.transform[5], h: item.height || 10, text: item.str.trim() }))
    .sort((a, b) => b.y - a.y)
    .forEach((item) => {
      const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 0.5 * Math.max(candidate.h, item.h));
      if (row) {
        row.parts.push(item);
        row.h = Math.max(row.h, item.h);
      } else {
        rows.push({ y: item.y, h: item.h, parts: [item] });
      }
    });
  return rows.map((row) => row.parts.sort((a, b) => a.x - b.x).map((part) => part.text).join(" ")).join("\n");
}

async function extractPdfText(file, maxPages = 10) {
  const pdfjs = await import(`${PDFJS_BASE_URL}/pdf.min.mjs`);
  pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE_URL}/pdf.worker.min.mjs`;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  const pages = [];
  try {
    for (let number = 1; number <= Math.min(pdf.numPages, maxPages); number += 1) {
      const content = await (await pdf.getPage(number)).getTextContent();
      pages.push(groupPdfTextRows(content.items));
    }
  } finally {
    // Release the parsed document and its worker so repeated uploads do not pile up memory.
    await loadingTask.destroy();
  }
  return pages.join("\n").trim();
}

async function readPdfTextLocally(file) {
  reportStatus.textContent = "Reading your PDF on this device. Nothing is uploaded.";
  try {
    const text = await extractPdfText(file);
    if (text.replace(/\s/g, "").length < 20) {
      reportStatus.textContent = "This PDF looks like a scanned image, so CareWise cannot read its text yet. Type or paste the lab values below.";
      return;
    }
    document.querySelector("#report-text").value = text.slice(0, 12000);
    reportStatus.textContent = "PDF read on this device. Nothing was uploaded. Press Analyze report.";
    updateProgressRail();
  } catch {
    reportStatus.textContent = "CareWise could not read this PDF. Paste the lab values as text below.";
  }
}

function getReportHistory() {
  try {
    return JSON.parse(localStorage.getItem("carewiseReports") || "[]");
  } catch {
    return [];
  }
}

function saveReportHistory(report) {
  const reports = getReportHistory().filter((item) => item.id !== report.id);
  reports.unshift({
    ...report,
    updatedAt: new Date().toISOString(),
  });
  localStorage.setItem("carewiseReports", JSON.stringify(reports.slice(0, 20)));
  renderReportHistory();
  renderDashboardStats();
}

// Caregiver mode: each report records who it is for ("Me" by default).
function normalizeReportPerson(value) {
  const person = String(value || "").trim().slice(0, 40);
  return person && person.toLowerCase() !== "me" ? person : "Me";
}

function getReportPeople(reports = getReportHistory()) {
  return ["Me", ...new Set(reports.map((report) => normalizeReportPerson(report.person)).filter((person) => person !== "Me"))];
}

function renderReportPeopleOptions(reports) {
  const people = getReportPeople(reports);
  const datalist = document.querySelector("#report-people");
  if (datalist) datalist.innerHTML = people.map((person) => `<option value="${escapeHtml(person)}"></option>`).join("");
  const filter = document.querySelector("#history-person-filter");
  if (filter) {
    const selected = people.includes(filter.value) ? filter.value : "";
    filter.innerHTML = `<option value="">Everyone</option>${people.map((person) => `<option value="${escapeHtml(person)}"${person === selected ? " selected" : ""}>${escapeHtml(person)}</option>`).join("")}`;
  }
}

function renderReportHistory() {
  const allReports = getReportHistory();
  renderReportPeopleOptions(allReports);
  const personFilter = document.querySelector("#history-person-filter")?.value || "";
  const reports = personFilter ? allReports.filter((report) => normalizeReportPerson(report.person) === personFilter) : allReports;
  reportBadge.textContent = latestReportId ? "Report ready" : reportFeatureLabel();
  reportBadge.className = "sync-badge online";
  if (!allReports.length) {
    reportResults.innerHTML = "<p>No report analysis yet.</p>";
    if (reportHistoryList) {
      reportHistoryList.innerHTML = `
        <article>
          <div><strong>No reports saved yet</strong><span>Upload first</span></div>
          <p>Add a lab PDF or type your results to see plain-English explanations here.</p>
        </article>
      `;
    }
    return;
  }
  const reportCards = reports.map((report) => `
    <article class="saved-plan-row">
      <div class="saved-plan-top">
        <div>
          <strong>${escapeHtml(report.fileName || "Untitled report")}</strong>
          <span>${escapeHtml(report.status || "uploaded")} · ${escapeHtml(new Date(report.createdAt || report.updatedAt || Date.now()).toLocaleString())}</span>
        </div>
        ${report.score ? `<b>${escapeHtml(String(report.score))}/100</b>` : ""}
      </div>
      ${report.storageUrl ? `<p><strong>Storage:</strong> ${escapeHtml(report.storageUrl.startsWith("s3://") ? "Private cloud storage" : "Backend storage")} ${report.fileSizeBytes ? `· ${Math.round(Number(report.fileSizeBytes) / 1024) || 1} KB` : ""}</p>` : ""}
      ${report.riskLevel ? `<p><strong>Risk:</strong> ${escapeHtml(report.riskLevel)} · ${escapeHtml(report.message || "Report education summary generated.")}</p>` : "<p>Uploaded. Analysis not run yet.</p>"}
      ${report.nextSteps?.length ? `<ul>${report.nextSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      <button class="secondary-button compact" type="button" data-report-action="open-history" data-report-id="${escapeHtml(report.id)}">Open result</button>
      ${report.questions?.length ? `<details class="saved-plan-summary"><summary>Saved doctor questions</summary><pre>${escapeHtml(report.questions.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join("\n"))}</pre></details>` : ""}
    </article>
  `).join("");
  reportResults.innerHTML = reportCards;
  if (reportHistoryList && !reports.length) {
    reportHistoryList.innerHTML = `<article><div><strong>No reports for ${escapeHtml(personFilter)} yet</strong></div></article>`;
  } else if (reportHistoryList) {
    reportHistoryList.innerHTML = reports.slice(0, 4).map((report) => `
      <article>
        <div>
          <strong>${escapeHtml(report.fileName || "Untitled report")}</strong>
          <span>${escapeHtml(`For ${normalizeReportPerson(report.person)} · `)}${escapeHtml(report.score ? `Health Score ${report.score}` : report.riskLevel ? `Risk: ${report.riskLevel}` : report.status || "uploaded")}</span>
        </div>
        <p>${escapeHtml(report.message || "Saved report. Run or load analysis to see a plain-English explanation.")}</p>
        ${report.questions?.length ? `<p><strong>Doctor question:</strong> ${escapeHtml(report.questions[0])}</p>` : ""}
        <button class="secondary-button compact" type="button" data-report-action="open-history" data-report-id="${escapeHtml(report.id)}">Open result</button>
      </article>
    `).join("");
  }
}

function openReportHistoryItem(reportId) {
  const report = getReportHistory().find((item) => item.id === reportId);
  if (!report) {
    reportStatus.textContent = "Saved report could not be reopened.";
    return;
  }
  latestReportPerson = normalizeReportPerson(report.person);
  renderReportHistoryResult(report);
  latestReportId = report.id;
  localStorage.setItem("carewiseLatestReportId", latestReportId);
  reportStatus.textContent = `${report.fileName || "Saved report"} reopened from history. Review with the original report.`;
  window.showCareWiseSection?.("report-title", false);
}

function renderReportHistoryResult(report) {
  const questions = report.questions?.length ? report.questions : report.nextSteps || [];
  const analysis = {
    id: report.analysisId || report.id,
    score: report.score || 72,
    riskLevel: report.riskLevel === "emergency" ? "urgent" : report.riskLevel === "clinician_review" ? "needs_review" : report.riskLevel || "attention",
    findings: [
      {
        label: report.fileName || "Saved report",
        level: report.riskLevel || report.status || "Saved",
        detail: report.message || "Saved report summary restored from history.",
      },
    ],
    suggestions: report.nextSteps?.length ? report.nextSteps : ["Review this saved report with a licensed professional before changing care decisions."],
    questions: questions.length ? questions : ["Which result from this report matters most for my next visit?"],
    labValues: report.labValues || [],
    riskAreas: {
      heart: report.riskLevel || "Review report",
      diabetes: "Review report",
      vitamins: "Review report",
    },
  };
  renderLocalReportAnalysis(analysis);
}

function reportFeatureLabel() {
  if (backendFeatures.image_ocr) return "Photo reading ready";
  if (backendFeatures.report_uploads) return "Cloud save ready";
  return "Works on this device";
}

function renderOcrReadiness() {
  if (!ocrStatus) return;
  if (backendFeatures.image_ocr) {
    ocrStatus.textContent = "Photos and PDFs can be read. Always check the values against your original report.";
    return;
  }
  if (backendFeatures.report_uploads) {
    ocrStatus.textContent = "Text PDFs are read on your device. For a photo or scanned page, type the numbers in the box above.";
    return;
  }
  ocrStatus.textContent = "Text PDFs are read on your device. For a photo or scanned page, type the numbers in the box above.";
}

function getReportEvaluationSamples() {
  return [
    {
      name: "Chest pain red flag",
      text: "Patient reports chest pain, sweating, and shortness of breath today.",
      expected: "emergency",
      reason: "Chest pain and breathing trouble should pause routine planning.",
    },
    {
      name: "Hypertensive crisis pattern",
      text: "Home blood pressure reading was 186/124 with a severe headache.",
      expected: "emergency",
      reason: "Very high blood pressure with symptoms needs urgent medical routing.",
    },
    {
      name: "Complex chronic follow-up",
      text: "Report notes diabetes, chronic kidney disease, high LDL, several medications, and food allergy history.",
      expected: "soon",
      reason: "Complex chronic conditions plus medication/allergy context should trigger clinician review soon.",
      profile: { medications: "metformin, lisinopril", allergies: "shellfish" },
    },
    {
      name: "Negated red flag",
      text: "LDL is elevated. Patient denies chest pain and has no shortness of breath.",
      expected: "routine",
      reason: "Negated emergency phrases should not create an emergency alert.",
    },
    {
      name: "UK A1C units",
      text: "HbA1c 44 mmol/mol",
      expectedFinding: { label: "A1C", level: "Prediabetes range in many guidelines" },
      reason: "44 mmol/mol is about 6.2%; it must not be read as 44% and raise a false diabetes alarm.",
    },
    {
      name: "UK cholesterol units",
      text: "Total cholesterol 5.8 mmol/L",
      expectedFinding: { label: "Total cholesterol", level: "Above common reference target" },
      reason: "5.8 mmol/L is about 224 mg/dL and should be flagged, not read as 5.8 mg/dL.",
    },
    {
      name: "Lab footnote code",
      text: "Cholesterol, Total 01   289   High   mg/dL   100-199",
      expectedFinding: { label: "Total cholesterol", level: "Above common reference target" },
      reason: "The '01' footnote code on Labcorp-style rows must not be read as the result.",
    },
  ];
}

function evaluateReportSafetySample(sample) {
  if (sample.expectedFinding) {
    const finding = analyzeReportTextLocally(sample.text).findings.find((item) => item.label === sample.expectedFinding.label);
    const actual = finding ? finding.level : "not read";
    return { ...sample, expected: sample.expectedFinding.level, actual, label: sample.expectedFinding.label, passed: actual === sample.expectedFinding.level, matches: [], message: finding?.detail || "" };
  }
  const text = sample.text.toLowerCase();
  const urgentMatches = findEmergencyTerms(text);
  if (hasHypertensiveCrisis(text)) urgentMatches.push("blood pressure over 180/120");
  const diseasePlans = matchDiseaseCarePlans(text);
  const risk = classifyRisk(urgentMatches, diseasePlans, sample.profile || {}, "some");
  const passed = risk.level === sample.expected;
  return {
    ...sample,
    actual: risk.level,
    label: risk.label,
    passed,
    matches: urgentMatches,
    message: risk.message,
  };
}

function getLatestReportEvaluation() {
  try {
    return JSON.parse(localStorage.getItem("carewiseReportSafetyEval") || "[]");
  } catch {
    return [];
  }
}

function renderReportEvaluation(results) {
  if (!reportEvalResults) return;
  if (!results.length) {
    reportEvalResults.innerHTML = '<article class="pending"><strong>Evaluation</strong><span>Not run yet</span></article>';
    return;
  }
  reportEvalResults.innerHTML = results.map((item) => `
    <article class="${item.passed ? "complete" : "pending"}">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${escapeHtml(item.passed ? "Passed" : "Review needed")} · expected ${escapeHtml(item.expected)}, got ${escapeHtml(item.actual)}</span>
      <p>${escapeHtml(item.reason)}</p>
      ${item.matches?.length ? `<small>Flags: ${escapeHtml(item.matches.join(", "))}</small>` : "<small>No emergency phrase detected.</small>"}
    </article>
  `).join("");
}

function runReportSafetyEvaluation() {
  const results = getReportEvaluationSamples().map(evaluateReportSafetySample);
  localStorage.setItem("carewiseReportSafetyEval", JSON.stringify(results));
  renderReportEvaluation(results);
  const passed = results.filter((item) => item.passed).length;
  reportEvalStatus.textContent = `${passed}/${results.length} safety checks passed. Review failed cases before demos or public testing.`;
  addAuditEvent("report_safety_eval_run", `Report safety evaluation completed with ${passed}/${results.length} checks passed.`);
  renderAuditTrail();
}

function getReportEvaluationText() {
  const results = getLatestReportEvaluation();
  if (!results.length) return "CareWise AI report safety evaluation\nNo evaluation run yet.";
  const passed = results.filter((item) => item.passed).length;
  return [
    "CareWise AI report safety evaluation",
    `Generated: ${new Date().toLocaleString()}`,
    `Result: ${passed}/${results.length} safety checks passed`,
    "Scope: local red-flag routing and safe review behavior. This is not a clinical accuracy guarantee.",
    "",
    ...results.map((item, index) => [
      `${index + 1}. ${item.name}`,
      `Expected: ${item.expected}`,
      `Actual: ${item.actual} (${item.label})`,
      `Status: ${item.passed ? "passed" : "review needed"}`,
      `Reason: ${item.reason}`,
      `Flags: ${item.matches?.length ? item.matches.join(", ") : "none"}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyReportEvaluation() {
  const text = getReportEvaluationText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      reportEvalStatus.textContent = "Report safety evaluation copied.";
    })
    .catch(() => {
      reportEvalStatus.textContent = "Copy unavailable. Run eval and use local JSON export if needed.";
    });
}

function initializeLabDate() {
  const labDate = document.querySelector("#lab-date");
  if (labDate && !labDate.value) labDate.value = new Date().toISOString().slice(0, 10);
}

function getLabTrends() {
  try {
    return JSON.parse(localStorage.getItem("carewiseLabTrends") || "[]");
  } catch {
    return [];
  }
}

function getLabTrendForm() {
  return {
    id: `lab-${Date.now()}`,
    test: document.querySelector("#lab-test")?.value || "Other",
    value: document.querySelector("#lab-value")?.value.trim() || "",
    unit: document.querySelector("#lab-unit")?.value.trim() || "",
    date: document.querySelector("#lab-date")?.value || new Date().toISOString().slice(0, 10),
    flag: document.querySelector("#lab-flag")?.value || "Not sure",
    notes: document.querySelector("#lab-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

function addLabTrendEntry(entry) {
  const labs = getLabTrends();
  labs.unshift(entry);
  localStorage.setItem("carewiseLabTrends", JSON.stringify(labs.slice(0, 60)));
}

function normalizeBackendLabTrendFlag(flag) {
  const normalized = String(flag || "not_sure").replaceAll("_", " ").toLowerCase();
  if (normalized.includes("clinician")) return "Needs clinician review";
  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";
  if (normalized.includes("range")) return "In range";
  return "Not sure";
}

function backendLabTrendToLocal(entry) {
  return {
    id: entry.backendLabTrendId || entry.id || `lab-${Date.now()}`,
    backendLabTrendId: entry.id || entry.backendLabTrendId || "",
    backendSynced: true,
    reportId: entry.report_id || "",
    test: entry.test_name || entry.test || "Other",
    value: String(entry.value || ""),
    unit: entry.unit || "",
    date: entry.observed_on || entry.date || "",
    flag: normalizeBackendLabTrendFlag(entry.flag),
    notes: entry.notes || "",
    source: entry.source || "backend",
    createdAt: entry.created_at || entry.createdAt || new Date().toISOString(),
  };
}

function labTrendToBackendPayload(entry, patientId, reportId = "") {
  return {
    patient_id: patientId,
    report_id: reportId && reportId.startsWith("report_") ? reportId : null,
    test_name: entry.test || "Other",
    value: String(entry.value || ""),
    unit: entry.unit || "",
    observed_on: entry.date || new Date().toISOString().slice(0, 10),
    flag: String(entry.flag || "not_sure").toLowerCase().replaceAll(" ", "_"),
    notes: entry.notes || "",
    source: entry.source || "manual",
  };
}

async function syncLabTrendToBackend(entry, patientId, reportId = "", showStatus = false) {
  try {
    if (!authToken || !patientId) return false;
    const response = await apiPost("/lab-trends", labTrendToBackendPayload(entry, patientId, reportId));
    entry.backendLabTrendId = response.id;
    entry.backendSynced = true;
    if (showStatus) labTrendStatus.textContent = `${entry.test} synced to backend lab trends.`;
    return true;
  } catch {
    if (showStatus) labTrendStatus.textContent = `${entry.test} saved locally. Backend trend sync failed.`;
    return false;
  }
}

async function loadLabTrendsFromBackend() {
  try {
    if (!authToken) {
      labTrendStatus.textContent = "Sign in before loading cloud lab trends.";
      return;
    }
    const patientId = backendPatientId || await ensureBackendPatient(false);
    if (!patientId) {
      labTrendStatus.textContent = "Sync profile before loading cloud lab trends.";
      return;
    }
    const response = await apiGet(`/lab-trends?patient_id=${encodeURIComponent(patientId)}`);
    const cloudEntries = response.map(backendLabTrendToLocal);
    const merged = [
      ...cloudEntries,
      ...getLabTrends().filter((item) => !cloudEntries.some((cloud) => cloud.backendLabTrendId && cloud.backendLabTrendId === item.backendLabTrendId)),
    ];
    localStorage.setItem("carewiseLabTrends", JSON.stringify(merged.slice(0, 60)));
    renderLabTrends();
    renderVisitBriefs();
    addAuditEvent("backend_lab_trends_loaded", `${cloudEntries.length} backend lab trend${cloudEntries.length === 1 ? "" : "s"} loaded.`);
    renderAuditTrail();
    labTrendStatus.textContent = `Loaded ${cloudEntries.length} cloud lab value${cloudEntries.length === 1 ? "" : "s"}. Review with the original reports before making care decisions.`;
  } catch {
    labTrendStatus.textContent = "Could not load cloud lab trends. Local lab values are still available.";
  }
}

function fillSampleLabTrends() {
  const today = new Date().toISOString().slice(0, 10);
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 32);
  [
    {
      test: "LDL cholesterol",
      value: "142",
      unit: "mg/dL",
      date: today,
      flag: "High",
      notes: "Sample only. Ask clinician what this means with full lipid panel and personal risk.",
    },
    {
      test: "A1C",
      value: "5.6",
      unit: "%",
      date: lastMonth.toISOString().slice(0, 10),
      flag: "In range",
      notes: "Sample only. Confirm reference range with lab report and clinician.",
    },
  ].forEach((entry, index) => addLabTrendEntry({
    id: `lab-${Date.now()}-${index}`,
    createdAt: new Date().toISOString(),
    ...entry,
  }));
  document.querySelector("#lab-test").value = "LDL cholesterol";
  document.querySelector("#lab-value").value = "";
  document.querySelector("#lab-unit").value = "mg/dL";
  document.querySelector("#lab-date").value = today;
  document.querySelector("#lab-flag").value = "Not sure";
  document.querySelector("#lab-notes").value = "";
  labTrendStatus.textContent = "Sample lab values saved. Review with the original report before using in real care.";
  addAuditEvent("lab_trends_sample_added", "Sample lab values added locally for visit preparation.");
  renderLabTrends();
  renderVisitBriefs();
  renderAuditTrail();
}

async function saveLabTrend() {
  const entry = getLabTrendForm();
  if (!entry.value && !entry.notes) {
    labTrendStatus.textContent = "Add a lab value or note before saving.";
    return;
  }
  entry.source = "manual";
  addLabTrendEntry(entry);
  const patientId = authToken ? await ensureBackendPatient(false) : "";
  if (patientId) {
    const synced = await syncLabTrendToBackend(entry, patientId, "", true);
    if (synced) {
      const labs = getLabTrends().map((item) => item.id === entry.id ? entry : item);
      localStorage.setItem("carewiseLabTrends", JSON.stringify(labs.slice(0, 60)));
    }
  }
  document.querySelector("#lab-value").value = "";
  document.querySelector("#lab-notes").value = "";
  if (!entry.backendSynced) labTrendStatus.textContent = `${entry.test} saved locally. Bring the original report for clinician interpretation.`;
  addAuditEvent("lab_trend_saved", `${entry.test} lab value saved with ${entry.flag.toLowerCase()} flag.`);
  renderLabTrends();
  renderVisitBriefs();
  renderAuditTrail();
}

function getLabTrendGroups() {
  return getLabTrends().reduce((groups, item) => {
    const key = item.test || "Other";
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function getLabTrendSuggestion(item) {
  if (item.flag === "Needs clinician review") return "Ask a licensed clinician how this result fits your full history, symptoms, medications, and lab reference range.";
  if (item.flag === "High" || item.flag === "Low") return "Bring the original report and ask what follow-up timing is appropriate.";
  if (item.flag === "Not sure") return "Confirm the reference range and whether fasting, medication timing, or illness affected the result.";
  return "Keep tracking over time and ask when this should be checked again.";
}

function renderLabTrends() {
  if (!labTrendList) return;
  const labs = getLabTrends();
  if (!labs.length) {
    labTrendList.innerHTML = "<p>No lab values saved yet.</p>";
    return;
  }
  const groups = getLabTrendGroups();
  labTrendList.innerHTML = `
    <article class="lab-trend-summary">
      <strong>${escapeHtml(labs.length)} lab value${labs.length === 1 ? "" : "s"}</strong>
      <span>${escapeHtml(Object.keys(groups).length)} test${Object.keys(groups).length === 1 ? "" : "s"} tracked · ${escapeHtml(labs.filter((item) => ["High", "Low", "Needs clinician review"].includes(item.flag)).length)} flagged</span>
    </article>
    ${Object.entries(groups).map(([test, entries]) => {
      const sorted = entries.slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      const latest = sorted[0];
      return `
        <article>
          <div>
            <strong>${escapeHtml(test)}</strong>
            <span>${escapeHtml(sorted.length)} entr${sorted.length === 1 ? "y" : "ies"} · latest ${escapeHtml(latest.date || "no date")}</span>
          </div>
          <p>${escapeHtml(latest.value || "No value")} ${escapeHtml(latest.unit || "")} · ${escapeHtml(latest.flag || "Not sure")}</p>
          ${latest.notes ? `<p>${escapeHtml(latest.notes)}</p>` : ""}
          <small>${escapeHtml(getLabTrendSuggestion(latest))}</small>
        </article>
      `;
    }).join("")}
  `;
}

function getLabTrendsText() {
  const labs = getLabTrends();
  if (!labs.length) return "CareWise AI lab value tracker\nNo lab values saved yet.";
  return [
    "CareWise AI lab value tracker",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety: lab values require interpretation by a licensed clinician using the original report, reference range, history, symptoms, pregnancy status, and medications.",
    "",
    ...labs.map((lab, index) => [
      `${index + 1}. ${lab.test}`,
      `Value: ${lab.value || "No value"} ${lab.unit || ""}`.trim(),
      `Date: ${lab.date || "No date saved"}`,
      `Flag: ${lab.flag}`,
      `Notes: ${lab.notes || "No notes saved."}`,
      `Discussion prompt: ${getLabTrendSuggestion(lab)}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyLabTrends() {
  const text = getLabTrendsText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      labTrendStatus.textContent = "Lab summary copied.";
    })
    .catch(() => {
      labTrendStatus.textContent = "Copy unavailable. Use local JSON export to save lab values.";
    });
}

function getLocalReportText() {
  return document.querySelector("#report-text")?.value.trim() || "";
}

function readReportNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

// Skips a lab footnote code like the "01" in "Cholesterol, Total 01  289 mg/dL".
const LAB_FOOTNOTE = String.raw`(?:\b0\d\s+\D{0,12}?)?`;
const LAB_UNIT = String.raw`\s*(mmol\s*\/\s*mol|mmol\s*\/\s*l|mg\s*\/\s*dl|%)?`;

function readLabMeasure(text, namePattern, maxGap = 24) {
  const match = text.match(new RegExp(`${namePattern}\\D{0,${maxGap}}?${LAB_FOOTNOTE}(\\d+(?:\\.\\d+)?)${LAB_UNIT}`, "i"));
  if (!match) return null;
  return { value: Number(match[1]), unit: (match[2] || "").replace(/\s+/g, "").toLowerCase() };
}

// UK and European labs report lipids in mmol/L and A1C in mmol/mol (IFCC).
// Convert to the US units the explanations use; a value with no unit that is
// only plausible in the other unit is treated as that unit.
function readCholesterolMgDl(text, namePattern) {
  const measure = readLabMeasure(text, namePattern);
  if (!measure) return null;
  if (measure.unit === "mmol/l" || (!measure.unit && measure.value < 25)) return Math.round(measure.value * 38.67);
  return measure.value;
}

// Many labs print total cholesterol simply as "Cholesterol". Accept that only
// when it is not part of an LDL, HDL, VLDL or non-HDL name or a ratio.
function readPlainCholesterolMgDl(text) {
  const pattern = /\bcholesterol\b/gi;
  let match;
  while ((match = pattern.exec(text))) {
    const before = text.slice(Math.max(0, match.index - 9), match.index);
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 12);
    if (/(?:ldl|hdl|vldl)[\s-]*$/i.test(before)) continue;
    if (/^\s*[,/(-]?\s*(?:ldl|hdl|vldl|ratio|non)/i.test(after)) continue;
    const value = readCholesterolMgDl(text.slice(match.index), "cholesterol");
    if (value !== null) return value;
  }
  return null;
}

function readTriglyceridesMgDl(text) {
  const measure = readLabMeasure(text, "triglycerides");
  if (!measure) return null;
  if (measure.unit === "mmol/l" || (!measure.unit && measure.value < 15)) return Math.round(measure.value * 88.57);
  return measure.value;
}

function readA1cPercent(text) {
  // UK reports say "HbA1c level - IFCC standardised 44 mmol/mol", so allow a longer label.
  const measure = readLabMeasure(text, String.raw`(?:hemoglobin\s*)?a1c`, 40);
  if (!measure) return null;
  if (measure.unit === "mmol/mol" || (!measure.unit && measure.value > 20)) return Math.round((0.0915 * measure.value + 2.15) * 10) / 10;
  return measure.value;
}

function buildDetectedReportValues({ ldl, totalCholesterol, triglycerides, a1c, vitaminD, systolic, diastolic }) {
  return [
    ldl !== null ? { label: "LDL cholesterol", value: ldl, unit: "mg/dL", flag: ldl >= 160 ? "High" : ldl >= 130 ? "Needs attention" : "In range discussion" } : null,
    totalCholesterol !== null ? { label: "Total cholesterol", value: totalCholesterol, unit: "mg/dL", flag: totalCholesterol >= 200 ? "Above common target" : "In range discussion" } : null,
    triglycerides !== null ? { label: "Triglycerides", value: triglycerides, unit: "mg/dL", flag: triglycerides >= 150 ? "Needs attention" : "In range discussion" } : null,
    a1c !== null ? { label: "A1C", value: a1c, unit: "%", flag: a1c >= 6.5 ? "Clinician review" : a1c >= 5.7 ? "Needs attention" : "In range discussion" } : null,
    vitaminD !== null ? { label: "Vitamin D", value: vitaminD, unit: "ng/mL", flag: vitaminD < 30 ? "Needs attention" : "In range discussion" } : null,
    systolic !== null ? { label: "Blood pressure", value: `${systolic}/${diastolic || "?"}`, unit: "mmHg", flag: systolic >= 180 ? "Urgent if confirmed" : systolic >= 130 ? "Needs tracking" : "In range discussion" } : null,
  ].filter(Boolean);
}

function getNonNegatedEmergencyMatches(text) {
  return findEmergencyTerms(text).filter((term) => {
    const index = text.indexOf(term);
    const context = text.slice(Math.max(0, index - 18), index + term.length);
    return !/\b(no|denies|without|negative for)\s+[\w\s,;/.-]{0,18}$/i.test(context.slice(0, Math.max(0, context.length - term.length)));
  });
}

function analyzeReportTextLocally(text) {
  const lower = text.toLowerCase();
  const urgentMatches = getNonNegatedEmergencyMatches(lower);
  if (hasHypertensiveCrisis(lower)) urgentMatches.push("blood pressure over 180/120");

  const ldl = readCholesterolMgDl(lower, String.raw`\bldl(?: cholesterol)?`);
  const totalCholesterol = readCholesterolMgDl(lower, String.raw`(?:total cholesterol|cholesterol,?\s*total)`) ?? readPlainCholesterolMgDl(lower);
  const triglycerides = readTriglyceridesMgDl(lower);
  const a1c = readA1cPercent(lower);
  // Skip the "25-hydroxy" / "25-OH" in the test name so it is not read as the value.
  const vitaminD = readReportNumber(lower, [/vitamin d(?:[\s,]*\(?25[\s-]*(?:hydroxy|oh)\)?)?\D{0,24}(\d+(?:\.\d+)?)/i]);
  const systolic = readReportNumber(lower, [/blood pressure\D{0,60}(\d{2,3})\s*\/\s*\d{2,3}/i]);
  const diastolic = readReportNumber(lower, [/blood pressure\D{0,60}\d{2,3}\s*\/\s*(\d{2,3})/i]);
  const labValues = buildDetectedReportValues({ ldl, totalCholesterol, triglycerides, a1c, vitaminD, systolic, diastolic });

  const findings = [];
  const suggestions = [];
  const questions = [];
  let score = 94;

  if (urgentMatches.length) {
    score -= 30;
    findings.push({
      label: "Possible urgent symptom",
      level: "Needs immediate attention",
      detail: "The report text includes symptoms that should not wait for routine AI guidance.",
    });
    suggestions.push("If these symptoms are happening now, seek emergency care or call local emergency services.");
  }

  if (ldl !== null) {
    if (ldl >= 160) {
      score -= 10;
      findings.push({ label: "LDL cholesterol", level: "High", detail: `LDL appears around ${ldl} mg/dL.` });
    } else if (ldl >= 130) {
      score -= 6;
      findings.push({ label: "LDL cholesterol", level: "Needs attention", detail: `LDL appears around ${ldl} mg/dL.` });
    } else {
      findings.push({ label: "LDL cholesterol", level: "In a better range", detail: `LDL appears around ${ldl} mg/dL.` });
    }
    suggestions.push("Discuss heart-risk context, diet pattern, exercise, family history, and follow-up timing with a clinician.");
    questions.push("What LDL goal is appropriate for me based on my age, family history, blood pressure, and other risks?");
  }

  if (totalCholesterol !== null && totalCholesterol >= 200) {
    score -= 3;
    findings.push({ label: "Total cholesterol", level: "Above common reference target", detail: `Total cholesterol appears around ${totalCholesterol} mg/dL.` });
  }

  if (triglycerides !== null && triglycerides >= 150) {
    score -= 3;
    findings.push({ label: "Triglycerides", level: "Needs attention", detail: `Triglycerides appear around ${triglycerides} mg/dL.` });
    suggestions.push("Ask whether fasting status, alcohol, refined carbs, medicines, or thyroid/metabolic factors could affect triglycerides.");
  }

  if (a1c !== null) {
    if (a1c >= 6.5) {
      score -= 12;
      findings.push({ label: "A1C", level: "Clinician review important", detail: `A1C appears around ${a1c}%.` });
      questions.push("Does my A1C need repeat testing or a diabetes care plan?");
    } else if (a1c >= 5.7) {
      score -= 5;
      findings.push({ label: "A1C", level: "Prediabetes range in many guidelines", detail: `A1C appears around ${a1c}%.` });
      questions.push("What changes would help lower my A1C safely over the next 3 months?");
    } else {
      findings.push({ label: "A1C", level: "Often considered in range", detail: `A1C appears around ${a1c}%.` });
    }
  }

  if (systolic !== null && systolic >= 130) {
    score -= systolic >= 180 ? 24 : 4;
    findings.push({ label: "Blood pressure", level: systolic >= 180 ? "Urgent if confirmed with symptoms" : "Needs tracking", detail: `Systolic blood pressure appears around ${systolic}.` });
    suggestions.push("Track home blood pressure with time, position, cuff size, and symptoms before your visit.");
  }

  if (vitaminD !== null) {
    if (vitaminD < 30) {
      score -= 4;
      findings.push({ label: "Vitamin D", level: "Needs attention", detail: `Vitamin D appears around ${vitaminD}.` });
      questions.push("Should I repeat Vitamin D testing or discuss supplementation dose and duration?");
    } else {
      findings.push({ label: "Vitamin D", level: "No obvious issue in pasted text", detail: `Vitamin D appears around ${vitaminD}.` });
    }
  } else if (lower.includes("vitamin d")) {
    findings.push({ label: "Vitamin D", level: "Mentioned", detail: "Vitamin D appears in the report text, but CareWise could not confidently read the value." });
  }

  if (!findings.length) {
    findings.push({
      label: "Readable values",
      level: "Not enough structured data",
      detail: "CareWise needs typed or pasted lab values to explain specific results.",
    });
    suggestions.push("Paste key lab rows, values, units, and reference flags from the report.");
    score = 72;
  }

  suggestions.push("Build meals around vegetables, fiber-rich carbs, lean protein, and unsaturated fats unless your clinician gave different advice.");
  suggestions.push("Aim for consistent walking or movement you can repeat most days, adjusted for your clinician's guidance.");
  questions.push("Which results matter most for me, and when should I repeat labs?");
  questions.push("Should I see primary care, a dietitian, or a specialist based on these results?");

  const riskAreas = {
    heart: ldl >= 160 || systolic >= 140 ? "Medium Risk" : ldl >= 130 || totalCholesterol >= 200 || triglycerides >= 150 || systolic >= 130 ? "Needs Attention" : "Low Risk",
    diabetes: a1c >= 6.5 ? "Needs Review" : a1c >= 5.7 ? "Needs Attention" : "Low Risk",
    vitamins: vitaminD !== null && vitaminD < 30 ? "Needs Attention" : lower.includes("vitamin d") ? "Review Value" : "No clear issue",
  };

  return {
    id: `local-analysis-${Date.now()}`,
    score: Math.max(35, Math.min(96, score)),
    riskLevel: urgentMatches.length ? "urgent" : score < 70 ? "needs_review" : score < 82 ? "attention" : "routine",
    findings,
    suggestions: [...new Set(suggestions)].slice(0, 5),
    questions: [...new Set(questions)].slice(0, 5),
    riskAreas,
    labValues,
  };
}

// Spanish draft translations of the fixed report sentences. Values are
// inserted unchanged; anything not listed here stays in English.

function translateReportText(text, language = reportLanguage) {
  const table = REPORT_TRANSLATIONS[language];
  if (!table || typeof text !== "string") return text;
  if (table.phrases[text]) return table.phrases[text];
  const pattern = table.patterns.find(([regex]) => regex.test(text));
  return pattern ? text.replace(pattern[0], pattern[1]) : text;
}

function translateReportAnalysis(analysis, language = reportLanguage) {
  if (!REPORT_TRANSLATIONS[language]) return analysis;
  return {
    ...analysis,
    findings: analysis.findings.map((item) => ({
      label: translateReportText(item.label, language),
      level: translateReportText(item.level, language),
      detail: translateReportText(item.detail, language),
    })),
    suggestions: analysis.suggestions.map((item) => translateReportText(item, language)),
    questions: analysis.questions.map((item) => translateReportText(item, language)),
    labValues: (analysis.labValues || []).map((item) => ({
      ...item,
      label: translateReportText(item.label, language),
      flag: translateReportText(item.flag, language),
    })),
  };
}

function reportUiText(language = reportLanguage) {
  return REPORT_TRANSLATIONS[language]?.ui || REPORT_UI_EN;
}

function setReportLanguage(language) {
  if (!REPORT_LANGUAGES[language]) return;
  reportLanguage = language;
  try { localStorage.setItem("carewiseReportLanguage", language); } catch {}
  if (latestReportAnalysis) renderLocalReportAnalysis(latestReportAnalysis);
}

function getPlanReactions() {
  try {
    return getHealthRecordFor(normalizeReportPerson(latestReportPerson)).filter((item) => item.type === "reaction").map((item) => item.name);
  } catch {
    return [];
  }
}

function getLatestPersonalPlan(analysis = latestReportAnalysis) {
  return analysis ? buildPersonalPlan(analysis, reportLanguage === "es" ? "es" : "en", getPlanReactions()) : null;
}

function renderPersonalPlanSection(analysis) {
  const plan = getLatestPersonalPlan(analysis);
  if (!plan) return "";
  const ui = reportUiText();
  return `
        <section class="personal-plan${plan.urgent ? " personal-plan-urgent" : ""}">
          <div class="section-heading-action">
            <h4>${escapeHtml(plan.title)}</h4>
            <button class="secondary-button compact" type="button" data-report-action="copy-plan">${escapeHtml(ui.copyPlan || "Copy plan")}</button>
          </div>
          <div class="plan-grid">
            ${plan.sections.map((section) => `
              <article class="plan-card plan-${escapeHtml(section.key)}">
                <strong>${escapeHtml(section.title)}</strong>
                <ul>${section.items.map((item, index) => {
                  // Show a reason and source only when they change, so a group of tips reads cleanly.
                  const previous = section.items[index + 1];
                  const note = previous && previous.why === item.why && previous.source === item.source ? "" : [item.why ? `${plan.whyLabel}: ${item.why}` : "", item.source ? `${plan.sourceLabel}: ${item.source}` : ""].filter(Boolean).join(" · ");
                  return `
                  <li>${escapeHtml(item.text)}${note ? `<small>${escapeHtml(note)}</small>` : ""}</li>`;
                }).join("")}
                </ul>
              </article>`).join("")}
          </div>
        </section>`;
}

function personalPlanText(plan) {
  return [
    plan.title,
    ...plan.sections.flatMap((section) => ["", section.title.toUpperCase(), ...section.items.map((item) => `- ${item.text}${item.why ? ` (${plan.whyLabel}: ${item.why})` : ""}${item.source ? ` [${plan.sourceLabel}: ${item.source}]` : ""}`)]),
  ].join("\n");
}

async function copyPersonalPlan() {
  const plan = getLatestPersonalPlan();
  if (!plan) return;
  try {
    await navigator.clipboard.writeText(personalPlanText(plan));
    reportStatus.textContent = reportLanguage === "es" ? "Plan copiado." : "Plan copied. Paste it into notes or share it with your care team.";
  } catch {
    reportStatus.textContent = "Could not copy automatically. Select the plan text and copy it.";
  }
}

function renderLocalReportAnalysis(analysis) {
  if (!reportResults) return;
  latestReportQuestionPack = buildReportQuestionPack(analysis);
  latestReportSummaryPack = buildReportSummaryPack(analysis);
  latestReportAnalysis = analysis;
  const view = translateReportAnalysis(analysis);
  const ui = reportUiText();
  const riskLabel = analysis.riskLevel === "urgent"
    ? "Urgent review"
    : analysis.riskLevel === "needs_review"
      ? "Clinician review"
      : analysis.riskLevel === "attention"
        ? "Needs attention"
        : "Routine follow-up";
  const riskLabelText = translateReportText(riskLabel);

  reportResults.innerHTML = `
    <article class="saved-plan-row v1-result-card">
      <div class="result-hero">
        <div>
          <span>${escapeHtml(ui.eyebrow)}</span>
          <div class="section-heading-action">
            <strong>${escapeHtml(ui.title)}</strong>
            <div class="inline-action-group">
              <button class="secondary-button compact" type="button" data-report-action="copy-summary">${escapeHtml(ui.copySummary)}</button>
              <button class="secondary-button compact" type="button" data-report-action="share-summary">${escapeHtml(ui.shareSummary)}</button>
              <button class="primary-button compact" type="button" data-report-action="doctor-brief">${escapeHtml(ui.doctorBrief)}</button>
              <select data-report-language aria-label="Report language">${Object.entries(REPORT_LANGUAGES).map(([code, name]) => `<option value="${code}"${code === reportLanguage ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select>
            </div>
          </div>
          <p>${escapeHtml(ui.found(view.findings.length))}</p>
          ${ui.draftNotice ? `<p class="status-line" role="note">${escapeHtml(ui.draftNotice)}</p>` : ""}
        </div>
        <div class="result-score">
          <strong>${escapeHtml(String(analysis.score))}</strong>
          <span>/100</span>
          <small>${escapeHtml(riskLabelText)}</small>
        </div>
      </div>
      <div class="result-sections">
        ${view.labValues?.length ? `
        <section>
          <div class="section-heading-action">
            <h4>${escapeHtml(ui.detectedValues)}</h4>
            <button class="secondary-button compact" type="button" data-report-action="save-detected-values">${escapeHtml(ui.saveToTrends)}</button>
          </div>
          <div class="detected-values-grid">
            ${view.labValues.map((item) => `
              <article>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(String(item.value))} ${escapeHtml(item.unit)}</span>
                <small>${escapeHtml(item.flag)}</small>
              </article>
            `).join("")}
          </div>
        </section>
        ` : ""}
        <section>
          <h4>${escapeHtml(ui.keyFindings)}</h4>
          <ul>${view.findings.map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.level)}. ${escapeHtml(item.detail)}</span></li>`).join("")}</ul>
        </section>
        <section>
          <h4>${escapeHtml(ui.suggestions)}</h4>
          <ul>${view.suggestions.map((item) => `<li><strong>${escapeHtml(ui.nextStep)}</strong><span>${escapeHtml(item)}</span></li>`).join("")}</ul>
        </section>
        <section>
          <div class="section-heading-action">
            <h4>${escapeHtml(ui.questions)}</h4>
            <button class="secondary-button compact" type="button" data-report-action="copy-questions">${escapeHtml(ui.copyQuestions)}</button>
          </div>
          <ul>${view.questions.map((item) => `<li><strong>${escapeHtml(ui.ask)}</strong><span>${escapeHtml(item)}</span></li>`).join("")}</ul>
        </section>
        ${renderPersonalPlanSection(analysis)}
      </div>
      <div class="safety-note"><strong>${escapeHtml(ui.safetyTitle)}</strong><span>${escapeHtml(ui.safetyText)}</span></div>
    </article>
  `;

  const scoreCard = document.querySelector(".health-score-card strong");
  if (scoreCard) scoreCard.textContent = `${analysis.score}/100`;
  const dashboardCards = document.querySelectorAll(".v1-report-dashboard article");
  if (dashboardCards[1]) dashboardCards[1].querySelector("strong").textContent = analysis.riskAreas.heart;
  if (dashboardCards[2]) dashboardCards[2].querySelector("strong").textContent = analysis.riskAreas.diabetes;
  if (dashboardCards[3]) dashboardCards[3].querySelector("strong").textContent = analysis.riskAreas.vitamins;
}

function buildBackendReportDisplayAnalysis(response, reportText) {
  if (reportText?.trim()) {
    const localAnalysis = analyzeReportTextLocally(reportText);
    return {
      ...localAnalysis,
      id: response.id || localAnalysis.id,
      riskLevel: response.risk_level === "emergency" ? "urgent" : localAnalysis.riskLevel,
      suggestions: [
        ...(response.recommendations?.next_steps || []),
        ...localAnalysis.suggestions,
      ].filter(Boolean).filter((item, index, list) => list.indexOf(item) === index).slice(0, 5),
    };
  }

  return {
    id: response.id || `backend-analysis-${Date.now()}`,
    score: 68,
    riskLevel: "needs_review",
    findings: [
      {
        label: "Readable report text",
        level: "Needed",
        detail: response.summary?.message || "CareWise stored the report but needs readable values before explaining it.",
      },
    ],
    suggestions: response.recommendations?.next_steps || [
      "Type or paste your lab results first, or press Try sample report.",
      "Ask a licensed professional to review the original report.",
    ],
    questions: [
      "Which values from my original report should I focus on first?",
      "Should any lab values be repeated or reviewed with more health history?",
      "Would primary care, a dietitian, pharmacist, or specialist be the right next step?",
    ],
    riskAreas: {
      heart: "Needs readable values",
      diabetes: "Needs readable values",
      vitamins: "Needs readable values",
    },
  };
}

// A one-page, printable summary a patient can hand to their clinician.
function buildDoctorBriefHtml(analysis, person = "Me") {
  const today = new Date().toLocaleDateString();
  const rows = (analysis.labValues || []).map((item) => `
    <tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(String(item.value))} ${escapeHtml(item.unit)}</td><td>${escapeHtml(item.flag)}</td></tr>`).join("");
  const findings = analysis.findings.map((item) => `<li><b>${escapeHtml(item.label)}:</b> ${escapeHtml(item.level)}. ${escapeHtml(item.detail)}</li>`).join("");
  const questions = analysis.questions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CareWise doctor brief</title>
<style>
  body { font-family: Arial, sans-serif; color: #14302c; max-width: 760px; margin: 32px auto; padding: 0 20px; line-height: 1.45; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 3px solid #0f766e; padding-bottom: 8px; }
  h1 { font-size: 22px; margin: 0; } h2 { font-size: 16px; margin: 22px 0 6px; color: #0f766e; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; } td, th { border: 1px solid #d5e5e1; padding: 6px 8px; text-align: left; }
  th { background: #e6f1ee; } ul, ol { margin: 0; padding-left: 20px; font-size: 14px; }
  .note { margin-top: 24px; font-size: 12px; color: #3e5450; border-top: 1px solid #d5e5e1; padding-top: 8px; }
  .notes-box { border: 1px solid #d5e5e1; min-height: 70px; margin-top: 6px; }
  button { margin-top: 16px; padding: 8px 16px; background: #0f766e; color: #fff; border: 0; border-radius: 6px; font-size: 14px; cursor: pointer; }
  @media print { button { display: none; } body { margin: 0 auto; } }
</style></head><body>
<header><h1>${person === "Me" ? "Patient lab summary for clinician review" : `Lab summary for clinician review: ${escapeHtml(person)}`}</h1><span>${escapeHtml(today)}</span></header>
<p>${person === "Me" ? "Prepared by the patient with CareWise AI from their own report text." : `Prepared by a family caregiver for ${escapeHtml(person)} with CareWise AI from the report text.`} Health score ${escapeHtml(String(analysis.score))}/100 (educational estimate).</p>
${rows ? `<h2>Values detected in the report</h2><table><tr><th>Test</th><th>Value</th><th>CareWise note</th></tr>${rows}</table>` : ""}
<h2>Discussion points</h2><ul>${findings}</ul>
${buildHealthHistoryBriefSection(person)}
<h2>Patient questions</h2><ol>${questions}</ol>
<h2>Clinician notes</h2><div class="notes-box"></div>
<p class="note">Educational summary only, not a diagnosis. Values were read automatically from pasted report text; please confirm them against the original report.</p>
<button type="button" onclick="window.print()">Print or save as PDF</button>
</body></html>`;
}

function openDoctorBrief() {
  if (!latestReportAnalysis) {
    reportStatus.textContent = "Analyze a report first, then open the doctor brief.";
    return;
  }
  const briefWindow = window.open("", "_blank");
  if (!briefWindow) {
    reportStatus.textContent = "Allow pop-ups for CareWise to open the doctor brief.";
    return;
  }
  briefWindow.document.write(buildDoctorBriefHtml(latestReportAnalysis, latestReportPerson));
  briefWindow.document.close();
  reportStatus.textContent = "Doctor brief opened in a new tab. Print it or save it as a PDF for your visit.";
}

function buildReportSummaryPack(analysis) {
  return [
    "CareWise AI report summary",
    "Educational prep only. This is not a diagnosis or treatment plan.",
    `Health Score: ${analysis.score}/100`,
    `Follow-up level: ${analysis.riskLevel}`,
    "",
    ...(analysis.labValues?.length ? [
      "Detected values:",
      ...analysis.labValues.map((item) => `- ${item.label}: ${item.value} ${item.unit} (${item.flag})`),
      "",
    ] : []),
    "Key findings:",
    ...analysis.findings.map((item) => `- ${item.label}: ${item.level}. ${item.detail}`),
    "",
    "Wellness suggestions:",
    ...analysis.suggestions.map((item) => `- ${item}`),
    "",
    "Questions for a licensed professional:",
    ...analysis.questions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Review the original report with a licensed professional before making care decisions.",
  ].join("\n");
}

function normalizeDetectedValueFlag(flag) {
  if (flag === "High" || flag === "Urgent if confirmed" || flag === "Clinician review") return "Needs clinician review";
  if (flag === "Needs attention" || flag === "Needs tracking" || flag === "Above common target") return "High";
  if (flag === "In range discussion") return "In range";
  return "Not sure";
}

async function saveDetectedValuesToTrends() {
  const report = getReportHistory().find((item) => item.id === latestReportId);
  let labValues = report?.labValues || [];
  if (!labValues.length && getLocalReportText()) labValues = analyzeReportTextLocally(getLocalReportText()).labValues || [];
  if (!labValues.length) {
    reportStatus.textContent = "No detected values are ready to save. Paste readable lab values and analyze first.";
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const entries = labValues.map((item, index) => ({
    id: `lab-${Date.now()}-${index}`,
    test: item.label,
    value: String(item.value),
    unit: item.unit,
    date: today,
    flag: normalizeDetectedValueFlag(item.flag),
    notes: "Saved from CareWise detected report values. Verify against the original report and reference range.",
    source: "detected_report_value",
    createdAt: new Date().toISOString(),
  }));
  entries.forEach((entry) => addLabTrendEntry(entry));
  let syncedCount = 0;
  const patientId = authToken ? (report?.patientId || backendPatientId || await ensureBackendPatient(false)) : "";
  if (patientId) {
    const reportId = report?.id || latestReportId;
    const results = await Promise.all(entries.map((entry) => syncLabTrendToBackend(entry, patientId, reportId)));
    syncedCount = results.filter(Boolean).length;
    if (syncedCount) {
      const syncedById = new Map(entries.map((entry) => [entry.id, entry]));
      const labs = getLabTrends().map((item) => syncedById.get(item.id) || item);
      localStorage.setItem("carewiseLabTrends", JSON.stringify(labs.slice(0, 60)));
    }
  }
  renderLabTrends();
  renderVisitBriefs();
  addAuditEvent("detected_report_values_saved", `${labValues.length} detected report value${labValues.length === 1 ? "" : "s"} saved to lab trends${syncedCount ? `; ${syncedCount} synced to backend` : ""}.`);
  renderAuditTrail();
  reportStatus.textContent = `${labValues.length} detected value${labValues.length === 1 ? "" : "s"} saved to lab trends${syncedCount ? ` and ${syncedCount} synced to backend` : ""}. Verify with the original report.`;
}

function buildReportQuestionPack(analysis) {
  return [
    "CareWise AI report questions",
    "Educational prep only. Review the original report with a licensed professional.",
    "",
    ...analysis.questions.map((question, index) => `${index + 1}. ${question}`),
  ].join("\n");
}

function copyReportSummary() {
  if (!latestReportSummaryPack) {
    const text = getLocalReportText();
    if (text) latestReportSummaryPack = buildReportSummaryPack(analyzeReportTextLocally(text));
  }
  if (!latestReportSummaryPack) {
    reportStatus.textContent = "Analyze or reopen a report before copying the summary.";
    return;
  }
  if (!navigator.clipboard) {
    if (reportAnswer) reportAnswer.textContent = latestReportSummaryPack;
    reportStatus.textContent = "Copy unavailable. Summary is shown in the report answer box.";
    return;
  }
  navigator.clipboard.writeText(latestReportSummaryPack)
    .then(() => {
      reportStatus.textContent = "Report summary copied. Review it with the original report before sharing.";
      if (reportAnswer) reportAnswer.textContent = "Report summary copied for your visit prep.";
    })
    .catch(() => {
      if (reportAnswer) reportAnswer.textContent = latestReportSummaryPack;
      reportStatus.textContent = "Copy unavailable. Summary is shown in the report answer box.";
    });
}

async function shareReportSummary() {
  if (!latestReportSummaryPack) {
    const text = getLocalReportText();
    if (text) latestReportSummaryPack = buildReportSummaryPack(analyzeReportTextLocally(text));
  }
  if (!latestReportSummaryPack) {
    reportStatus.textContent = "Analyze or reopen a report before sharing the summary.";
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({
        title: "CareWise AI report summary",
        text: latestReportSummaryPack,
      });
      reportStatus.textContent = "Report summary shared. Review it with the original report before relying on it.";
      return;
    } catch {
      reportStatus.textContent = "Share cancelled. You can still copy the summary.";
      return;
    }
  }
  copyReportSummary();
}

function copyReportQuestions() {
  if (!latestReportQuestionPack) {
    const text = getLocalReportText();
    if (text) latestReportQuestionPack = buildReportQuestionPack(analyzeReportTextLocally(text));
  }
  if (!latestReportQuestionPack) {
    reportStatus.textContent = "Analyze a report before copying doctor questions.";
    return;
  }
  if (!navigator.clipboard) {
    if (reportAnswer) reportAnswer.textContent = latestReportQuestionPack;
    reportStatus.textContent = "Copy unavailable. Questions are shown in the report answer box.";
    return;
  }
  navigator.clipboard.writeText(latestReportQuestionPack)
    .then(() => {
      reportStatus.textContent = "Doctor questions copied. Review them with your original report before sharing.";
      if (reportAnswer) reportAnswer.textContent = "Questions copied for your clinician visit.";
    })
    .catch(() => {
      if (reportAnswer) reportAnswer.textContent = latestReportQuestionPack;
      reportStatus.textContent = "Copy unavailable. Questions are shown in the report answer box.";
    });
}

function runLocalReportAnalysis() {
  const text = getLocalReportText();
  if (!text) {
    reportStatus.textContent = "Paste report text or use the sample report before analysis.";
    return null;
  }
  const analysis = analyzeReportTextLocally(text);
  latestReportId = analysis.id;
  latestReportPerson = normalizeReportPerson(document.querySelector("#report-person")?.value);
  localStorage.setItem("carewiseLatestReportId", latestReportId);
  saveReportHistory({
    id: analysis.id,
    person: latestReportPerson,
    fileName: document.querySelector("#report-name")?.value.trim() || "Local report analysis",
    status: "analyzed locally",
    riskLevel: analysis.riskLevel,
    score: analysis.score,
    message: `Health Score ${analysis.score}/100. ${analysis.findings[0]?.label || "Report text reviewed"}.`,
    nextSteps: analysis.questions.slice(0, 3),
    questions: analysis.questions,
    labValues: analysis.labValues,
    createdAt: new Date().toISOString(),
  });
  renderLocalReportAnalysis(analysis);
  reportStatus.textContent = "Analysis complete. Review the summary, health score, and doctor questions below.";
  if (reportAnswer) reportAnswer.textContent = 'Ask a question about this report, such as "Why is my LDL high?"';
  return analysis;
}

function answerReportQuestion() {
  const question = reportQuestion?.value.trim() || "";
  const text = getLocalReportText();
  if (!question) {
    reportAnswer.textContent = "Type a question about the report first.";
    return;
  }
  if (!text) {
    reportAnswer.textContent = "Paste report text or use the sample report first so CareWise has context.";
    return;
  }
  const analysis = analyzeReportTextLocally(text);
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes("ldl") || lowerQuestion.includes("cholesterol")) {
    reportAnswer.textContent = "LDL cholesterol is often discussed because higher levels can raise cardiovascular risk over time. Ask your clinician what LDL goal fits your personal risk and whether food pattern, activity, medicines, or follow-up labs are appropriate.";
  } else if (lowerQuestion.includes("a1c") || lowerQuestion.includes("diabetes") || lowerQuestion.includes("sugar")) {
    reportAnswer.textContent = "A1C reflects average blood sugar over roughly the past few months. Ask whether your value needs repeat testing and what nutrition, activity, sleep, or medication steps are safe for you.";
  } else if (lowerQuestion.includes("doctor") || lowerQuestion.includes("ask")) {
    reportAnswer.textContent = `Good questions: ${analysis.questions.slice(0, 3).join(" ")}`;
  } else if (lowerQuestion.includes("diet") || lowerQuestion.includes("food")) {
    reportAnswer.textContent = "A generally heart-supportive pattern includes vegetables, beans/lentils, whole grains, nuts/seeds, fish or other lean proteins if you eat them, and unsaturated fats. Ask a clinician or dietitian how this should change for allergies, kidney disease, pregnancy, diabetes, or medicines.";
  } else {
    reportAnswer.textContent = `CareWise found ${analysis.findings.length} discussion point${analysis.findings.length === 1 ? "" : "s"}. The safest next step is to ask a licensed professional which result matters most, whether any repeat testing is needed, and what changes are appropriate for your history.`;
  }
}

async function uploadReport() {
  try {
    if (!authToken) {
      reportStatus.textContent = "Sign in before uploading a report.";
      return;
    }
    const patientId = await ensureBackendPatient(false);
    if (!patientId) {
      reportStatus.textContent = "Sync profile before uploading a report.";
      return;
    }
    const file = document.querySelector("#report-file").files?.[0];
    const fileName = document.querySelector("#report-name").value.trim() || file?.name || "carewise-report.txt";
    const reportText = document.querySelector("#report-text").value.trim();
    if (!file && !reportText) {
      reportStatus.textContent = "Choose a report file or paste report text before uploading.";
      return;
    }
    reportStatus.textContent = file ? "Uploading report file to private cloud storage." : "Saving report text to backend.";
    const response = file
      ? await uploadReportFile(patientId, file, reportText)
      : await apiPost("/reports/upload", {
          patient_id: patientId,
          file_name: fileName,
          content_type: "text/plain",
          report_text: reportText,
          storage_url: "",
        });
    latestReportId = response.id;
    localStorage.setItem("carewiseLatestReportId", latestReportId);
    saveReportHistory({
      id: response.id,
      patientId: response.patient_id,
      fileName: response.file_name,
      status: response.status,
      storageUrl: response.storage_url,
      fileSizeBytes: response.file_size_bytes,
      createdAt: new Date().toISOString(),
    });
    addAuditEvent("report_uploaded", `${response.file_name} uploaded to backend as ${response.id}.`);
    renderAuditTrail();
    reportStatus.textContent = `Report uploaded securely: ${response.id}. Run analysis next.`;
  } catch (error) {
    reportStatus.textContent = error.message.includes("401") ? "Report upload needs login again." : `Report upload failed. ${error.message || "Check backend status."}`;
  }
}

async function uploadReportFile(patientId, file, reportText) {
  const formData = new FormData();
  formData.append("patient_id", patientId);
  formData.append("report_text", reportText || "");
  formData.append("file", file);
  return apiPost("/reports/upload-file", formData);
}

async function analyzeLatestReport() {
  try {
    if (!authToken) {
      runLocalReportAnalysis();
      return;
    }
    if (!latestReportId) {
      runLocalReportAnalysis();
      return;
    }
    const reportText = document.querySelector("#report-text").value.trim();
    if (reportText) {
      reportStatus.textContent = "Saving readable report text before analysis.";
      await apiPut(`/reports/${latestReportId}/text`, { report_text: reportText });
    }
    reportStatus.textContent = "Analyzing report through CareWise backend.";
    const response = await apiPost(`/reports/${latestReportId}/analyze`, {});
    const displayAnalysis = buildBackendReportDisplayAnalysis(response, reportText);
    const message = response.summary?.message || "Report education summary generated.";
    const nextSteps = response.recommendations?.next_steps || [];
    const existingReport = getReportHistory().find((report) => report.id === response.report_id);
    saveReportHistory({
      id: response.report_id,
      analysisId: response.id,
      patientId: response.patient_id,
      fileName: existingReport?.fileName || `Analysis ${response.report_id}`,
      storageUrl: existingReport?.storageUrl || "",
      fileSizeBytes: existingReport?.fileSizeBytes || 0,
      status: response.status,
      riskLevel: response.risk_level,
      score: displayAnalysis.score,
      message,
      nextSteps,
      questions: displayAnalysis.questions,
      labValues: displayAnalysis.labValues,
      createdAt: existingReport?.createdAt || new Date().toISOString(),
    });
    if (response.recommendations?.requires_clinician_review) {
      addReviewQueueItem({
        profile: getProfile(),
        risk: {
          label: "Report review needed",
          reasons: [`Report analysis risk level: ${response.risk_level}`],
        },
        symptoms: document.querySelector("#report-text").value.trim().slice(0, 900),
        reportId: response.report_id,
      });
    }
    addAuditEvent("report_analyzed", `Report ${response.report_id} analyzed with ${response.risk_level} risk.`);
    renderAuditTrail();
    renderLocalReportAnalysis(displayAnalysis);
    reportStatus.textContent = response.status === "needs_readable_text"
      ? "Report stored securely. Type or paste the lab values here, then click Analyze report again."
      : `Analysis complete: ${response.risk_level}.`;
  } catch (error) {
    if (getLocalReportText()) {
      runLocalReportAnalysis();
      reportStatus.textContent = "Backend analysis was unavailable, so CareWise generated a local educational summary.";
      return;
    }
    reportStatus.textContent = error.message.includes("404") ? "Report not found. Upload again." : "Report analysis failed. Check backend status.";
  }
}

async function loadReports() {
  try {
    const patientId = backendPatientId || await ensureBackendPatient(false);
    if (!authToken || !patientId) {
      reportStatus.textContent = "Sign in and sync profile before loading reports.";
      return;
    }
    const reports = await apiGet(`/reports?patient_id=${encodeURIComponent(patientId)}`);
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      let latestAnalysis = null;
      try {
        const analyses = await apiGet(`/reports/${report.id}/analyses`);
        latestAnalysis = analyses[0] || null;
      } catch {
        latestAnalysis = null;
      }
      return {
        id: report.id,
        analysisId: latestAnalysis?.id || "",
        patientId: report.patient_id,
        fileName: report.file_name,
        status: latestAnalysis?.status || report.status,
        riskLevel: latestAnalysis?.risk_level || "",
        message: latestAnalysis?.summary?.message || "",
        nextSteps: latestAnalysis?.recommendations?.next_steps || [],
        storageUrl: report.storage_url,
        fileSizeBytes: report.file_size_bytes,
        createdAt: new Date().toISOString(),
      };
    }));
    localStorage.setItem("carewiseReports", JSON.stringify(enrichedReports));
    renderReportHistory();
    const analyzedCount = enrichedReports.filter((report) => report.analysisId).length;
    reportStatus.textContent = `Loaded ${reports.length} report${reports.length === 1 ? "" : "s"} with ${analyzedCount} saved explanation${analyzedCount === 1 ? "" : "s"}.`;
  } catch {
    reportStatus.textContent = "Could not load reports from backend.";
  }
}

async function loadBackendReviewQueue() {
  try {
    if (!authToken) {
      reviewStatus.textContent = "Sign in as clinician or admin to load the backend review queue.";
      return;
    }
    const response = await apiGet("/clinical-review/queue");
    const items = response.items || [];
    localStorage.setItem("carewiseBackendReviewCount", String(items.length));
    if (!items.length) {
      reviewStatus.textContent = "Backend queue is empty or your role has no visible items.";
      renderDashboardStats();
      return;
    }
    const queue = items.map((item) => ({
      id: item.id || `backend-review-${Date.now()}`,
      createdAt: item.created_at || new Date().toISOString(),
      patientName: item.patient_id || "Backend patient",
      risk: item.risk_level || "Review",
      status: normalizeReviewStatusLabel(item.status || "Pending review"),
      reviewerNote: "",
      source: "Backend",
      backendCarePlanId: item.id,
      backendSynced: true,
      nextAction: "Open the backend clinical review record, confirm risk, then approve or request changes.",
      reasons: item.emergency_flags || item.matched_conditions || ["Backend review item"],
      symptoms: item.symptom_text || "",
      summary: JSON.stringify(item, null, 2),
    }));
    localStorage.setItem("carewiseReviewQueue", JSON.stringify(queue.slice(0, 20)));
    renderReviewQueue();
    renderDashboardStats();
    reviewStatus.textContent = `Loaded ${items.length} backend review item${items.length === 1 ? "" : "s"}.`;
  } catch (error) {
    reviewStatus.textContent = error.message.includes("403")
      ? "Backend review queue requires clinician or admin role."
      : "Could not load backend review queue.";
  }
}

async function loadAdminSummary() {
  try {
    if (!authToken) {
      reviewStatus.textContent = "Sign in as admin to load product summary.";
      return;
    }
    const response = await apiGet("/admin/summary");
    localStorage.setItem("carewiseAdminSummary", JSON.stringify(response));
    renderDashboardStats();
    reviewStatus.textContent = `Admin summary loaded: ${response.users} users, ${response.patients} patients, ${response.reports} reports.`;
  } catch (error) {
    reviewStatus.textContent = error.message.includes("403")
      ? "Admin summary requires admin role."
      : "Could not load admin summary.";
  }
}

function renderDashboardStats() {
  const summary = (() => {
    try {
      return JSON.parse(localStorage.getItem("carewiseAdminSummary") || "{}");
    } catch {
      return {};
    }
  })();
  const backendItems = Number(localStorage.getItem("carewiseBackendReviewCount") || 0);
  const localItems = getReviewQueue().length;
  const reports = summary.reports ?? getReportHistory().length;
  const consentRecords = summary.consent_records ?? getAuditEvents().filter((event) => event.action.includes("consent")).length;
  dashboardStats.innerHTML = `
    <article><strong>${backendItems}</strong><span>Backend items</span></article>
    <article><strong>${localItems}</strong><span>Local review items</span></article>
    <article><strong>${reports}</strong><span>Reports</span></article>
    <article><strong>${consentRecords}</strong><span>Consent records</span></article>
  `;
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
}

function renderReviewSyncSummary() {
  if (!reviewSyncSummary) return;
  const queue = getReviewQueue();
  const backendSynced = queue.filter((item) => item.backendSynced || item.backendCarePlanId).length;
  const pending = queue.filter((item) => matchesReviewFilter(item, "pending")).length;
  const selectedRole = authRole || document.querySelector("#auth-role")?.value || "patient";
  const roleLabel = authToken ? authRole || "signed in" : `${selectedRole} selected`;
  reviewSyncSummary.innerHTML = `
    <article><strong>Local</strong><span>${queue.length} queued, ${pending} pending</span></article>
    <article><strong>Backend</strong><span>${backendSynced} synced</span></article>
    <article><strong>Role</strong><span>${escapeHtml(roleLabel)}</span></article>
  `;
}

function renderReviewDemoChecklist() {
  if (!reviewDemoChecklist) return;
  const queue = getReviewQueue();
  const selectedRole = authRole || document.querySelector("#auth-role")?.value || "patient";
  const hasTeamRole = ["clinician", "admin"].includes(selectedRole);
  const hasReviewPlan = queue.some((item) => item.symptoms || (item.source || "").includes("Care plan") || (item.source || "").includes("Backend") || item.risk === "Clinician review soon" || item.risk === "Emergency");
  const hasBackendId = queue.some((item) => item.backendCarePlanId || item.backendSynced) || Boolean(lastGeneratedPlan?.backendCarePlanId);
  const backendItems = Number(localStorage.getItem("carewiseBackendReviewCount") || 0);
  const reviewDecisionSynced = localStorage.getItem("carewiseReviewDecisionSynced") === "true" || queue.some((item) => ["Approved", "Needs changes", "Closed"].includes(item.status) && item.backendSynced);
  const steps = [
    [1, "Choose team role", hasTeamRole, hasTeamRole ? `${selectedRole} selected` : "Use Team role"],
    [2, "Create/Login", Boolean(authToken), authToken ? "Backend session ready" : "Use Create/Login"],
    [3, "Sync profile", Boolean(backendPatientId), backendPatientId ? "Patient record linked" : "Use Sync profile"],
    [4, "Generate review plan", hasReviewPlan, hasReviewPlan ? "Review item ready" : "Use High-risk plan"],
    [5, "Sync backend ID", hasBackendId, hasBackendId ? "Backend ID linked" : "Use Sync plan"],
    [6, "Load clinician queue", backendItems > 0, backendItems > 0 ? `${backendItems} backend item${backendItems === 1 ? "" : "s"}` : "Use Load queue"],
    [7, "Approve review", reviewDecisionSynced, reviewDecisionSynced ? "Decision synced" : "Use Approve demo"],
  ];
  reviewDemoChecklist.innerHTML = steps.map(([number, label, done, detail]) => `
    <article class="${done ? "complete" : "pending"}">
      <strong>${number}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(detail)}</small>
    </article>
  `).join("");
  renderReviewDemoGuidance();
}

function renderReviewDemoGuidance() {
  if (!reviewDemoGuidance) return;
  const queue = getReviewQueue();
  const selectedRole = authRole || document.querySelector("#auth-role")?.value || "patient";
  const hasTeamRole = ["clinician", "admin"].includes(selectedRole);
  const hasReviewPlan = queue.some((item) => item.symptoms);
  const hasBackendId = queue.some((item) => item.backendCarePlanId || item.backendSynced) || Boolean(lastGeneratedPlan?.backendCarePlanId);
  const backendItems = Number(localStorage.getItem("carewiseBackendReviewCount") || 0);
  const reviewDecisionSynced = localStorage.getItem("carewiseReviewDecisionSynced") === "true" || queue.some((item) => ["Approved", "Needs changes", "Closed"].includes(item.status) && item.backendSynced);
  let message = "Use the buttons above from left to right.";
  if (!hasTeamRole) {
    message = "Click Team role first so the demo uses clinician/admin review permissions.";
  } else if (!authToken) {
    message = "Click Create/Login to start a real clinician/admin backend session.";
  } else if (!backendPatientId) {
    message = "Click Sync profile so the backend has a patient record for the care plan.";
  } else if (!hasReviewPlan) {
    message = "Generate the high-risk sample plan to create a review item.";
  } else if (!hasBackendId) {
    message = "Click Sync plan to attach a backend care-plan ID to the review item.";
  } else if (!backendItems) {
    message = "Click Load queue with a clinician/admin login to prove the backend review queue.";
  } else if (!reviewDecisionSynced) {
    message = "Click Approve demo to sync a clinician decision and remove one item from the pending queue.";
  } else {
    message = "Review demo is ready. Open a review item, add a note, then approve or request changes.";
  }
  reviewDemoGuidance.innerHTML = `
    <strong>Next required step</strong>
    <span>${escapeHtml(message)}</span>
  `;
}

function renderReviewDemoOutcome() {
  if (!reviewDemoOutcome) return;
  let outcome = null;
  try {
    outcome = JSON.parse(localStorage.getItem("carewiseReviewDemoOutcome") || "null");
  } catch {
    outcome = null;
  }
  if (!outcome) {
    reviewDemoOutcome.innerHTML = `
      <strong>Demo outcome</strong>
      <span>Run or approve a review to see the backend decision receipt.</span>
    `;
    return;
  }
  reviewDemoOutcome.innerHTML = `
    <strong>Demo outcome</strong>
    <span>${escapeHtml(outcome.status)} synced for ${escapeHtml(outcome.carePlanId)} at ${escapeHtml(new Date(outcome.reviewedAt || outcome.createdAt).toLocaleString())}.</span>
    <div class="review-demo-outcome-actions">
      <button class="secondary-button compact" type="button" data-demo-outcome-action="copy">Copy receipt</button>
      <button class="secondary-button compact" type="button" data-demo-outcome-action="reset">Reset receipt</button>
    </div>
  `;
}

function renderReviewDemoTimeline() {
  if (!reviewDemoTimeline) return;
  let outcome = null;
  try {
    outcome = JSON.parse(localStorage.getItem("carewiseReviewDemoOutcome") || "null");
  } catch {
    outcome = null;
  }
  const queue = getReviewQueue();
  const hasBackendId = queue.some((item) => item.backendCarePlanId || item.backendSynced) || Boolean(lastGeneratedPlan?.backendCarePlanId);
  const items = [
    ["Account", authToken ? `${authRole || "user"} signed in` : "Not signed in", Boolean(authToken)],
    ["Patient", backendPatientId ? "Profile synced" : "No backend patient", Boolean(backendPatientId)],
    ["Plan", hasBackendId ? "Backend plan linked" : queue.length ? "Local review item" : "No review plan", Boolean(hasBackendId || queue.length)],
    ["Decision", outcome ? `${outcome.status} synced` : "No decision yet", Boolean(outcome)],
  ];
  reviewDemoTimeline.innerHTML = items.map(([label, detail, done]) => `
    <article class="${done ? "complete" : "pending"}">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(detail)}</span>
    </article>
  `).join("");
}

function refreshReviewDemoProof() {
  renderReviewSyncSummary();
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
  renderReviewDemoOutcome();
  renderReviewDemoTimeline();
  renderLaunchProof();
}

function getReviewDemoReceiptText() {
  try {
    const outcome = JSON.parse(localStorage.getItem("carewiseReviewDemoOutcome") || "null");
    if (!outcome) return "";
    return [
      "CareWise AI clinical review demo receipt",
      `Decision: ${outcome.status}`,
      `Backend care plan: ${outcome.carePlanId}`,
      `Reviewed at: ${new Date(outcome.reviewedAt || outcome.createdAt).toLocaleString()}`,
      `Role: ${authRole || document.querySelector("#auth-role")?.value || "not signed in"}`,
      `Pending backend queue count: ${localStorage.getItem("carewiseBackendReviewCount") || "0"}`,
      "Safety: CareWise provides educational care planning support and routes high-risk items to clinician review.",
    ].join("\n");
  } catch {
    return "";
  }
}

function copyReviewDemoReceipt() {
  const receipt = getReviewDemoReceiptText();
  if (!receipt) {
    reviewDemoStatus.textContent = "No demo receipt is ready to copy.";
    return;
  }
  navigator.clipboard?.writeText(receipt)
    .then(() => {
      reviewDemoStatus.textContent = "Demo receipt copied.";
    })
    .catch(() => {
      reviewDemoStatus.textContent = receipt;
    });
}

function resetReviewDemoReceipt() {
  localStorage.removeItem("carewiseReviewDecisionSynced");
  localStorage.removeItem("carewiseReviewDemoOutcome");
  reviewDemoStatus.textContent = "Demo receipt reset. Run or approve another review to create a new receipt.";
  renderReviewDemoChecklist();
  renderReviewDemoGuidance();
  renderReviewDemoOutcome();
}

async function createCheckout() {
  try {
    if (!authToken) {
      paymentStatus.textContent = "Sign in before creating checkout.";
      return;
    }
    const planCode = document.querySelector("input[name='plan']:checked")?.value || "basic";
    paymentStatus.textContent = "Creating manual checkout record.";
    const response = await apiPost("/subscriptions/checkout", {
      plan_code: planCode,
      payment_provider: "manual",
    });
    latestCheckoutUrl = response.checkout_url;
    localStorage.setItem("carewiseCheckoutUrl", latestCheckoutUrl);
    paymentBadge.textContent = "Checkout ready";
    paymentBadge.className = "sync-badge online";
    if (latestCheckoutUrl.startsWith("https://checkout.stripe.com/")) {
      paymentStatus.textContent = "Redirecting to Stripe Checkout.";
      window.location.assign(latestCheckoutUrl);
      return;
    }
    paymentStatus.textContent = `${response.plan_code} checkout record created. Stripe keys can replace this manual URL later.`;
    addAuditEvent("checkout_created", `${response.plan_code} checkout created as ${response.id}.`);
    renderAuditTrail();
  } catch {
    paymentStatus.textContent = "Checkout creation failed. Sign in with a patient account and check backend.";
  }
}

function copyCheckoutLink() {
  if (!latestCheckoutUrl) {
    paymentStatus.textContent = "Create checkout first.";
    return;
  }
  navigator.clipboard?.writeText(latestCheckoutUrl)
    .then(() => {
      paymentStatus.textContent = "Checkout link copied.";
    })
    .catch(() => {
      paymentStatus.textContent = latestCheckoutUrl;
    });
}

function createSavedPlan(context, planLabel) {
  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    patientName: context.profile.name || "Unnamed patient",
    planLabel,
    symptoms: context.symptoms,
    location: context.location,
    goals: context.goals,
    dietStyle: context.dietStyle,
    priority: context.priority,
    activityLevel: context.activityLevel,
    exerciseGoal: context.exerciseGoal,
    prepTime: context.prepTime,
    calorieGoal: context.calorieGoal,
    urgent: context.urgentMatches.length > 0,
    urgentMatches: context.urgentMatches,
    carePath: context.urgentMatches.length ? "Emergency routing" : context.rules[0].label,
    diseasePlans: context.diseasePlans.map((plan) => plan.name),
    doctorSummary: buildDoctorSummary(context),
  };
}

function saveCurrentPlan() {
  const status = document.querySelector("#save-status");
  if (!lastGeneratedPlan) {
    if (status) status.textContent = "Generate a plan first.";
    return;
  }
  const plans = getSavedPlans();
  plans.unshift({ ...lastGeneratedPlan, id: `plan-${Date.now()}`, createdAt: new Date().toISOString() });
  localStorage.setItem("carewiseSavedPlans", JSON.stringify(plans.slice(0, 12)));
  addAuditEvent("care_plan_saved", `${lastGeneratedPlan.patientName} care plan saved locally.`);
  renderSavedPlans();
  renderAuditTrail();
  if (status) status.textContent = "Plan saved on this device.";
  window.showCareWiseSection?.("saved-title");
  updateProgressRail();
}

function getSavedPlans() {
  try {
    return JSON.parse(localStorage.getItem("carewiseSavedPlans") || "[]");
  } catch {
    return [];
  }
}

function renderSavedPlans() {
  const plans = getSavedPlans();
  if (!plans.length) {
    savedPlans.innerHTML = "<p>No saved plans yet.</p>";
    return;
  }
  savedPlans.innerHTML = plans.map((plan) => {
    const date = new Date(plan.createdAt).toLocaleDateString();
    const urgentLabel = plan.urgent ? "Emergency flagged" : "Routine plan";
    const diseaseLabels = plan.diseasePlans?.length ? plan.diseasePlans.join(", ") : "General care planning";
    return `
      <article class="saved-plan-row">
        <div class="saved-plan-top">
          <div>
            <strong>${escapeHtml(plan.patientName)}</strong>
            <span>${escapeHtml(date)} · ${escapeHtml(urgentLabel)}</span>
          </div>
          <b>${escapeHtml(plan.planLabel)}</b>
        </div>
        <p>${escapeHtml(plan.carePath)}</p>
        <div class="saved-plan-meta">
          <span>${escapeHtml(diseaseLabels)}</span>
          <span>${escapeHtml(plan.dietStyle || "Diet style not set")}</span>
          <span>${escapeHtml(plan.location || "Location not set")}</span>
        </div>
        <details class="saved-plan-summary">
          <summary>Doctor visit summary</summary>
          <pre>${escapeHtml(plan.doctorSummary || "No summary saved.")}</pre>
        </details>
      </article>
    `;
  }).join("");
}

function getMealPlans() {
  try {
    return JSON.parse(localStorage.getItem("carewiseMealPlans") || "[]");
  } catch {
    return [];
  }
}

function getLatestMealPlan() {
  return getMealPlans()[0] || null;
}

function getMealPreferences() {
  return {
    dietStyle: document.querySelector("#meal-diet-style")?.value || document.querySelector("#diet-style")?.value || "flexible",
    priority: document.querySelector("#meal-priority")?.value || document.querySelector("#priority")?.value || "balanced",
    prepTime: document.querySelector("#meal-prep-time")?.value || document.querySelector("#prep-time")?.value || "ten",
    budget: document.querySelector("#meal-budget")?.value || document.querySelector("#budget")?.value || "mid",
    calorieGoal: document.querySelector("#meal-calorie-goal")?.value || document.querySelector("#calorie-goal")?.value || "maintain",
    notes: document.querySelector("#meal-notes")?.value.trim() || "",
  };
}

function fillSampleMealPlanPreferences() {
  document.querySelector("#meal-diet-style").value = document.querySelector("#diet-style")?.value || "flexible";
  document.querySelector("#meal-priority").value = document.querySelector("#priority")?.value || "heart";
  document.querySelector("#meal-prep-time").value = document.querySelector("#prep-time")?.value || "twenty";
  document.querySelector("#meal-budget").value = document.querySelector("#budget")?.value || "mid";
  document.querySelector("#meal-calorie-goal").value = document.querySelector("#calorie-goal")?.value || "maintain";
  document.querySelector("#meal-notes").value = "Busy weekdays, needs quick lunches, wants variety, no emergency nutrition needs in this sample.";
  mealPlannerStatus.textContent = "Sample meal preferences filled. Build the meal plan when ready.";
}

function getMealProteinSet(dietStyle) {
  return {
    flexible: ["beans or lentils", "eggs or Greek yogurt if tolerated", "fish or lean poultry", "tofu or tempeh"],
    vegetarian: ["lentils or beans", "tofu or tempeh", "Greek yogurt or cottage cheese if eaten", "eggs if eaten"],
    vegan: ["lentils or beans", "tofu or tempeh", "edamame", "soy yogurt or fortified plant milk"],
    pescatarian: ["salmon, tuna, or sardines", "beans or lentils", "eggs or yogurt if eaten", "tofu or tempeh"],
    non_vegetarian: ["lean poultry", "fish", "beans or lentils", "eggs or yogurt if tolerated"],
  }[dietStyle] || ["beans or lentils", "tofu", "eggs if eaten"];
}

function getMealBaseSet(priority) {
  if (priority === "diabetes") return ["beans", "lentils", "oats", "brown rice in measured portions", "vegetables"];
  if (priority === "heart") return ["oats", "barley", "beans", "brown rice", "sweet potato"];
  if (priority === "low_cost") return ["rice", "oats", "beans", "lentils", "frozen vegetables"];
  if (priority === "weight") return ["large salad base", "vegetable soup", "roasted vegetables", "beans", "fruit"];
  return ["brown rice", "whole-grain wrap", "oats", "potatoes", "vegetable soup"];
}

function getMealBudgetNotes(budget) {
  return {
    low: ["Use beans, lentils, oats, frozen vegetables, eggs if eaten, canned fish if eaten, and bulk grains.", "Choose two repeatable meals and one flexible leftover meal to reduce waste."],
    mid: ["Use a mix of fresh and frozen produce, simple proteins, and ready sauces with lower sodium when possible.", "Batch one grain and one protein twice weekly."],
    high: ["Use convenience helpers like washed greens, pre-cut vegetables, prepared grains, and ready protein options when needed.", "Pay for convenience only where it protects consistency."],
  }[budget] || [];
}

function buildMealPlanText(plan) {
  return [
    "CareWise AI meal and grocery plan",
    `Generated: ${new Date(plan.createdAt).toLocaleString()}`,
    "Safety scope: food planning support only. This is not diagnosis, treatment, a prescription, or a replacement for a clinician or dietitian.",
    "",
    `Eating style: ${getDietStyleLabel(plan.preferences.dietStyle)}`,
    `Health focus: ${plan.preferences.priority}`,
    `Prep time: ${plan.preferences.prepTime}`,
    `Calorie direction: ${plan.preferences.calorieGoal}`,
    `Preferences/barriers: ${plan.preferences.notes || "None saved"}`,
    "",
    "Meal rotation:",
    ...plan.meals.map((meal) => `- ${meal}`),
    "",
    "Grocery list:",
    ...plan.groceries.map((item) => `- ${item}`),
    "",
    "Prep steps:",
    ...plan.prepSteps.map((item) => `- ${item}`),
    "",
    "Variety ideas:",
    ...plan.variety.map((item) => `- ${item}`),
    "",
    "Safety notes:",
    ...plan.safetyNotes.map((item) => `- ${item}`),
  ].join("\n");
}

function createMealPlan(preferences) {
  const proteins = getMealProteinSet(preferences.dietStyle);
  const bases = getMealBaseSet(preferences.priority);
  const prep = getMealPrepPlan(preferences.dietStyle, preferences.priority, preferences.prepTime, preferences.calorieGoal);
  const rotation = getVarietyRotation(preferences.dietStyle, preferences.priority);
  const meals = [
    `Breakfast: ${bases[2] || "oats"} with fruit plus ${proteins[1] || proteins[0]}.`,
    `Lunch: bowl or wrap with ${proteins[0]}, vegetables, and ${bases[0]}.`,
    `Dinner: ${preferences.prepTime === "batch" ? "batch-cooked" : "quick"} plate with ${proteins[2] || proteins[0]}, two vegetables, and ${bases[1] || bases[0]}.`,
    "Snack option: fruit, nuts/seeds if safe, yogurt/soy yogurt, hummus, or vegetables depending on diet style and allergies.",
  ];
  const groceries = [
    ...proteins.slice(0, 3),
    ...bases.slice(0, 4),
    "2-3 vegetables, fresh or frozen",
    "2 fruit options",
    preferences.priority === "heart" ? "lower-sodium seasonings and olive oil if appropriate" : "simple seasonings and sauces",
    ...getMealBudgetNotes(preferences.budget).slice(0, 1),
  ];
  const safetyNotes = [
    getDietStyleNote(preferences.dietStyle, preferences.priority),
    "Use clinician or dietitian guidance for kidney disease, pregnancy, eating disorders, cancer treatment, food allergies, major illness, or medication-food interactions.",
    "Do not use meal planning to delay urgent care for severe, new, unusual, or fast-worsening symptoms.",
  ];
  if (preferences.calorieGoal === "medical") safetyNotes.push("Medical-condition-first calorie planning needs clinician or dietitian review before major changes.");
  if (preferences.dietStyle === "vegan") safetyNotes.push("Plan vitamin B12 and consider iron, calcium, iodine, vitamin D, and omega-3 review.");
  return {
    id: `meal-plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    preferences,
    meals,
    groceries,
    prepSteps: prep.steps,
    variety: rotation,
    safetyNotes,
  };
}

function buildMealPlan() {
  const preferences = getMealPreferences();
  const plan = createMealPlan(preferences);
  const plans = getMealPlans();
  plans.unshift(plan);
  localStorage.setItem("carewiseMealPlans", JSON.stringify(plans.slice(0, 12)));
  mealPlannerStatus.textContent = "Meal plan built. Copy it or bring it into the visit brief.";
  addAuditEvent("meal_plan_built", `${getDietStyleLabel(preferences.dietStyle)} meal plan built for ${preferences.priority}.`);
  renderMealPlans();
  renderVisitBriefs();
  renderAuditTrail();
}

function renderMealPlans() {
  if (!mealPlanList) return;
  const plans = getMealPlans();
  if (!plans.length) {
    mealPlanList.innerHTML = "<p>No meal plans saved yet.</p>";
    return;
  }
  mealPlanList.innerHTML = `
    <article class="meal-plan-summary">
      <strong>${escapeHtml(plans.length)} meal plan${plans.length === 1 ? "" : "s"} saved</strong>
      <span>${escapeHtml(getDietStyleLabel(plans[0].preferences.dietStyle))} · ${escapeHtml(plans[0].preferences.priority)}</span>
    </article>
    ${plans.slice(0, 4).map((plan) => `
      <article>
        <div>
          <strong>${escapeHtml(getDietStyleLabel(plan.preferences.dietStyle))}</strong>
          <span>${escapeHtml(new Date(plan.createdAt).toLocaleString())}</span>
        </div>
        <p>${escapeHtml(plan.preferences.priority)} · ${escapeHtml(plan.preferences.prepTime)} prep · ${escapeHtml(plan.preferences.calorieGoal)}</p>
        <ul>${plan.meals.slice(0, 3).map((meal) => `<li>${escapeHtml(meal)}</li>`).join("")}</ul>
        <small>${escapeHtml(plan.safetyNotes[0])}</small>
      </article>
    `).join("")}
  `;
}

function copyMealPlan() {
  const latest = getLatestMealPlan();
  if (!latest) {
    mealPlannerStatus.textContent = "Build a meal plan before copying.";
    return;
  }
  navigator.clipboard?.writeText(buildMealPlanText(latest))
    .then(() => {
      mealPlannerStatus.textContent = "Meal plan copied.";
    })
    .catch(() => {
      mealPlannerStatus.textContent = "Copy unavailable. Use local JSON export to save meal plans.";
    });
}

function loadConsent() {
  const saved = localStorage.getItem("carewiseConsent");
  if (!saved) {
    document.querySelector("#privacy-consent").checked = false;
    renderConsentStatus();
    return;
  }
  try {
    document.querySelector("#privacy-consent").checked = Boolean(JSON.parse(saved).accepted);
  } catch {
    localStorage.removeItem("carewiseConsent");
    document.querySelector("#privacy-consent").checked = false;
  }
  renderConsentStatus();
}

function renderConsentStatus() {
  const accepted = document.querySelector("#privacy-consent").checked;
  document.querySelector("#consent-status").textContent = accepted
    ? "Consent recorded locally on this device."
    : "Consent is required before generating a plan.";
}

function classifyRisk(urgentMatches, diseasePlans, profile, insurance) {
  if (urgentMatches.length) {
    return {
      level: "emergency",
      label: "Emergency",
      message: "Emergency red flags were detected. Routine planning should pause.",
      reasons: urgentMatches.map((item) => `Detected: ${item}`),
    };
  }

  const ids = diseasePlans.map((plan) => plan.id);
  const reasons = [];
  if (ids.some((id) => ["heart_disease", "chronic_kidney_disease", "cancer_support", "pregnancy", "stroke_recovery"].includes(id))) {
    reasons.push("Complex condition matched; clinician review is recommended.");
  }
  if (profile.medications) reasons.push("Medication list present; pharmacist/clinician review is useful.");
  if (profile.allergies) reasons.push("Allergy history present; diet and medication recommendations need caution.");
  if (insurance === "none") reasons.push("No insurance selected; care navigation and low-cost options matter.");

  if (reasons.length >= 2) {
    return {
      level: "soon",
      label: "Clinician review soon",
      message: "The plan can support monthly care, but a clinician should review the details.",
      reasons,
    };
  }

  if (reasons.length === 1) {
    return {
      level: "routine",
      label: "Routine follow-up",
      message: "No emergency flag detected. Use routine follow-up and tracking.",
      reasons,
    };
  }

  return {
    level: "routine",
    label: "Routine support",
    message: "No emergency flag detected. Continue care planning and weekly check-ins.",
    reasons: ["Use clinician review for new, severe, worsening, or unclear symptoms."],
  };
}

function fillSampleMedication() {
  const refill = new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString().slice(0, 10);
  document.querySelector("#med-name").value = "Atorvastatin";
  document.querySelector("#med-dose").value = "10 mg";
  document.querySelector("#med-timing").value = "Evening";
  document.querySelector("#med-refill").value = refill;
  document.querySelector("#med-notes").value = "Demo only. Track side effects and ask a clinician/pharmacist before changing any medication.";
  medicationStatus.textContent = "Sample medication filled. Review it, then save.";
}

function saveMedication() {
  const medication = {
    id: `med-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name: document.querySelector("#med-name").value.trim(),
    dose: document.querySelector("#med-dose").value.trim(),
    timing: document.querySelector("#med-timing").value.trim(),
    refill: document.querySelector("#med-refill").value,
    notes: document.querySelector("#med-notes").value.trim(),
  };
  if (!medication.name) {
    medicationStatus.textContent = "Add a medication name first.";
    return;
  }
  const medications = getMedications();
  medications.unshift(medication);
  localStorage.setItem("carewiseMedications", JSON.stringify(medications.slice(0, 30)));
  addAuditEvent("medication_saved", `${medication.name} saved to local medication organizer.`);
  ["#med-name", "#med-dose", "#med-timing", "#med-refill", "#med-notes"].forEach((selector) => {
    document.querySelector(selector).value = "";
  });
  medicationStatus.textContent = "Medication saved locally. Do not change medicine without clinician guidance.";
  renderMedications();
  renderAuditTrail();
  syncMedicationToBackend(medication, false);
}

function getMedications() {
  try {
    return JSON.parse(localStorage.getItem("carewiseMedications") || "[]");
  } catch {
    return [];
  }
}

function renderMedications() {
  const medications = getMedications();
  if (!medications.length) {
    medicationList.innerHTML = "<p>No medications saved yet.</p>";
    return;
  }
  medicationList.innerHTML = medications.map((med) => `
    <article class="saved-plan-row">
      <div class="saved-plan-top">
        <div>
          <strong>${escapeHtml(med.name)}</strong>
          <span>${escapeHtml(med.refill ? `Refill ${med.refill}` : "No refill date")}</span>
        </div>
        <b>Medication</b>
      </div>
      <div class="saved-plan-meta">
        <span>${escapeHtml(med.dose || "Dose not provided")}</span>
        <span>${escapeHtml(med.timing || "Timing not provided")}</span>
      </div>
      ${med.notes ? `<p>${escapeHtml(med.notes)}</p>` : ""}
    </article>
  `).join("");
}

function getSafetyChecks() {
  try {
    return JSON.parse(localStorage.getItem("carewiseSafetyChecks") || "[]");
  } catch {
    return [];
  }
}

function getLatestSafetyCheck() {
  return getSafetyChecks()[0] || null;
}

function addSampleSafetyData() {
  if (!getMedications().length) {
    addLocalItem("carewiseMedications", {
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: "Atorvastatin",
      dose: "10 mg",
      timing: "Evening",
      refill: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString().slice(0, 10),
      notes: "Demo only. Ask about grapefruit, muscle pain, side effects, and medication changes.",
    }, 30);
  }
  const profile = getProfile();
  if (!profile.allergies) {
    setProfile({ ...profile, allergies: "No known food allergies entered. Confirm before diet changes." });
    saveProfile();
  }
  if (!getMealPlans().length) {
    const plan = createMealPlan({
      dietStyle: document.querySelector("#diet-style")?.value || "flexible",
      priority: "heart",
      prepTime: "twenty",
      budget: "mid",
      calorieGoal: "maintain",
      notes: "Sample safety review meal plan.",
    });
    localStorage.setItem("carewiseMealPlans", JSON.stringify([plan]));
  }
  renderMedications();
  renderMealPlans();
  safetyCheckStatus.textContent = "Sample safety data added. Run safety check when ready.";
}

function buildSafetyCheckItems() {
  const profile = getProfile();
  const medications = getMedications();
  const symptoms = getSymptomTimeline();
  const labs = getLabTrends();
  const mealPlans = getMealPlans();
  const items = [];
  if (!medications.length && !profile.medications) {
    items.push({
      level: "Needs info",
      topic: "Medication list",
      detail: "No medication list is saved yet.",
      action: "Add medicines, supplements, dose, timing, and refill date before clinician or pharmacist review.",
    });
  } else {
    medications.forEach((med) => {
      const text = `${med.name} ${med.notes}`.toLowerCase();
      items.push({
        level: "Review",
        topic: med.name || "Medication",
        detail: `${med.dose || "Dose missing"} · ${med.timing || "Timing missing"}`,
        action: "Ask a clinician or pharmacist before changing, stopping, restarting, or combining medications or supplements.",
      });
      if (text.includes("atorvastatin") || text.includes("statin")) {
        items.push({
          level: "Ask pharmacist",
          topic: "Statin food/side-effect check",
          detail: "Statin saved in medication list.",
          action: "Ask about grapefruit, muscle pain, liver-related warnings, pregnancy considerations, and interactions with other medicines.",
        });
      }
      if (text.includes("metformin")) {
        items.push({
          level: "Ask clinician",
          topic: "Metformin check",
          detail: "Metformin saved in medication list.",
          action: "Ask about stomach side effects, kidney function, B12 monitoring, and low blood sugar risk when combined with other medicines.",
        });
      }
    });
  }
  if (!profile.allergies) {
    items.push({
      level: "Needs info",
      topic: "Allergy history",
      detail: "No allergies entered in the profile.",
      action: "Confirm food, medication, latex, and supplement allergies before using meal or medication suggestions.",
    });
  } else {
    items.push({
      level: "Review",
      topic: "Allergies",
      detail: profile.allergies,
      action: "Check meal plan, supplements, and medication ingredients against the allergy list.",
    });
  }
  if (mealPlans.length) {
    const latest = mealPlans[0];
    items.push({
      level: "Review",
      topic: "Meal plan fit",
      detail: `${getDietStyleLabel(latest.preferences.dietStyle)} · ${latest.preferences.priority}`,
      action: "Ask if the food plan fits labs, medicines, allergies, kidney function, pregnancy status, culture, budget, and schedule.",
    });
  }
  const flaggedLabs = labs.filter((lab) => ["High", "Low", "Needs clinician review", "Not sure"].includes(lab.flag));
  flaggedLabs.slice(0, 5).forEach((lab) => {
    items.push({
      level: lab.flag === "Not sure" ? "Clarify" : "Review",
      topic: lab.test,
      detail: `${lab.value || "No value"} ${lab.unit || ""} · ${lab.flag}`,
      action: "Bring the original report and ask what follow-up timing, repeat testing, or lifestyle review is appropriate.",
    });
  });
  const concerningSymptoms = symptoms.filter((item) => item.severity === "Severe" || item.change === "Worse");
  concerningSymptoms.slice(0, 4).forEach((item) => {
    items.push({
      level: "Clinician review",
      topic: item.name || "Symptom",
      detail: `${item.change} · ${item.severity} · ${item.date || "No date"}`,
      action: "Use urgent care or a licensed clinician for severe, unusual, new, or fast-worsening symptoms.",
    });
  });
  if (!items.length) {
    items.push({
      level: "Routine",
      topic: "Safety checklist",
      detail: "No saved safety items found.",
      action: "Keep medication, allergy, lab, symptom, and meal-plan information updated before visits.",
    });
  }
  return items;
}

function runSafetyCheck() {
  const items = buildSafetyCheckItems();
  const check = {
    id: `safety-${Date.now()}`,
    createdAt: new Date().toISOString(),
    items,
  };
  const checks = getSafetyChecks();
  checks.unshift(check);
  localStorage.setItem("carewiseSafetyChecks", JSON.stringify(checks.slice(0, 12)));
  safetyCheckStatus.textContent = `${items.length} safety review item${items.length === 1 ? "" : "s"} generated. Review with a licensed professional.`;
  addAuditEvent("safety_check_run", `${items.length} pre-visit safety checklist items generated.`);
  renderSafetyChecks();
  renderVisitBriefs();
  renderAuditTrail();
}

function renderSafetyChecks() {
  if (!safetyCheckList) return;
  const latest = getLatestSafetyCheck();
  if (!latest) {
    safetyCheckList.innerHTML = "<p>No safety checklist generated yet.</p>";
    return;
  }
  safetyCheckList.innerHTML = `
    <article class="safety-check-summary">
      <strong>${escapeHtml(latest.items.length)} checklist item${latest.items.length === 1 ? "" : "s"}</strong>
      <span>${escapeHtml(new Date(latest.createdAt).toLocaleString())}</span>
    </article>
    ${latest.items.map((item) => `
      <article>
        <div>
          <strong>${escapeHtml(item.topic)}</strong>
          <span>${escapeHtml(item.level)}</span>
        </div>
        <p>${escapeHtml(item.detail)}</p>
        <small>${escapeHtml(item.action)}</small>
      </article>
    `).join("")}
  `;
}

function getSafetyCheckText() {
  const latest = getLatestSafetyCheck();
  if (!latest) return "CareWise AI safety checklist\nNo safety checklist generated yet.";
  return [
    "CareWise AI medication, allergy, and food safety checklist",
    `Generated: ${new Date(latest.createdAt).toLocaleString()}`,
    "Safety scope: checklist support only. It does not detect all interactions and is not a substitute for clinician, pharmacist, dietitian, emergency, or poison-control advice.",
    "",
    ...latest.items.map((item, index) => [
      `${index + 1}. ${item.topic} (${item.level})`,
      `Detail: ${item.detail}`,
      `Ask/review: ${item.action}`,
    ].join("\n")),
  ].join("\n\n");
}

function copySafetyCheck() {
  const text = getSafetyCheckText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      safetyCheckStatus.textContent = "Safety checklist copied.";
    })
    .catch(() => {
      safetyCheckStatus.textContent = "Copy unavailable. Use local JSON export to save safety checks.";
    });
}

function addReviewQueueItem(context) {
  const queue = getReviewQueue();
  const profile = context.profile || getProfile();
  const risk = context.risk || { label: "Review recommended", reasons: ["Review recommended before patient-facing follow-up."] };
  const item = {
    id: `review-${Date.now()}`,
    createdAt: new Date().toISOString(),
    patientName: profile.name || "Unnamed patient",
    risk: risk.label,
    status: "Pending review",
    reviewerNote: "",
    backendCarePlanId: context.backendCarePlanId || "",
    backendSynced: Boolean(context.backendCarePlanId),
    source: context.reportId ? "Report analysis" : "Care plan",
    nextAction: risk.label === "Emergency"
      ? "Escalate urgent guidance and confirm emergency wording before any routine plan is used."
      : "Review plan language, medication cautions, and follow-up questions before patient follow-up.",
    reasons: risk.reasons || ["Review recommended before patient-facing follow-up."],
    symptoms: context.symptoms,
    summary: context.rules ? buildDoctorSummary(context) : (context.summary || context.symptoms || "Review this report or care item before patient-facing follow-up."),
  };
  queue.unshift(item);
  localStorage.setItem("carewiseReviewQueue", JSON.stringify(queue.slice(0, 20)));
  addAuditEvent("review_item_created", `${item.patientName} added to clinician review queue for ${item.risk}.`);
  renderReviewQueue();
  renderAuditTrail();
  renderDashboardStats();
  refreshReviewDemoProof();
  return item;
}

function getReviewQueue() {
  try {
    return JSON.parse(localStorage.getItem("carewiseReviewQueue") || "[]");
  } catch {
    return [];
  }
}

function addSampleReviewItem() {
  const queue = getReviewQueue();
  const item = {
    id: `review-${Date.now()}`,
    createdAt: new Date().toISOString(),
    patientName: "Demo Patient",
    risk: "Clinician review soon",
    status: "Pending review",
    reviewerNote: "",
    source: "Demo",
    nextAction: "Confirm the risk level, edit any unclear wording, then approve or request changes.",
    reasons: [
      "Elevated LDL and repeated blood pressure concerns need clinician review.",
      "Medication and diet guidance should be checked before patient-facing follow-up.",
    ],
    symptoms: "High blood pressure readings, elevated LDL, poor sleep, busy schedule.",
    summary: "Demo review item: confirm risk level, review plan language, check medication safety, and approve or request changes before follow-up.",
  };
  queue.unshift(item);
  localStorage.setItem("carewiseReviewQueue", JSON.stringify(queue.slice(0, 20)));
  addAuditEvent("sample_review_item_created", "Sample clinician review item created.");
  renderReviewQueue();
  renderAuditTrail();
  renderDashboardStats();
  refreshReviewDemoProof();
  reviewStatus.textContent = "Sample review item added.";
}

function renderReviewQueue() {
  const queue = getReviewQueue();
  const visibleQueue = queue.filter((item) => matchesReviewFilter(item, activeReviewFilter));
  if (!visibleQueue.length) {
    reviewQueue.innerHTML = `<p>${queue.length ? "No review items match this filter." : "No review items yet."}</p>`;
    return;
  }
  reviewQueue.innerHTML = visibleQueue.map((item) => `
    <article class="saved-plan-row">
      <div class="saved-plan-top">
        <div>
          <strong>${escapeHtml(item.patientName)}</strong>
          <span>${escapeHtml(new Date(item.createdAt).toLocaleString())}</span>
        </div>
        <b class="${escapeHtml(getReviewStatusClass(item.status))}">${escapeHtml(item.status || "Pending review")}</b>
      </div>
      <div class="saved-plan-meta">
        <span>${escapeHtml(item.source || "Local queue")}</span>
        <span>${escapeHtml(item.backendSynced || item.backendCarePlanId ? "Backend synced" : "Local only")}</span>
        <span>${escapeHtml(item.risk)}</span>
        <span>${escapeHtml((item.reasons || []).length)} reason${(item.reasons || []).length === 1 ? "" : "s"}</span>
      </div>
      <p>${escapeHtml((item.reasons || []).join(" ") || "Review recommended before patient-facing follow-up.")}</p>
      <div class="review-next-step">
        <strong>Next action</strong>
        <span>${escapeHtml(item.nextAction || getDefaultReviewNextAction(item.status))}</span>
      </div>
      <details class="saved-plan-summary">
        <summary>Review summary</summary>
        <pre>${escapeHtml(item.summary || item.symptoms || "No summary saved.")}</pre>
      </details>
      <label class="review-notes">
        Reviewer note
        <textarea id="review-note-${escapeHtml(item.id)}" rows="2" placeholder="Add reviewer note before approving or requesting changes.">${escapeHtml(item.reviewerNote || "")}</textarea>
      </label>
      <div class="review-actions">
        <button class="secondary-button compact" type="button" data-review-id="${escapeHtml(item.id)}" data-review-action="approved">Approve</button>
        <button class="secondary-button compact" type="button" data-review-id="${escapeHtml(item.id)}" data-review-action="needs_changes">Needs changes</button>
        <button class="secondary-button compact" type="button" data-review-id="${escapeHtml(item.id)}" data-review-action="closed">Close</button>
      </div>
    </article>
  `).join("");
}

function matchesReviewFilter(item, filter) {
  const status = (item.status || "Pending review").toLowerCase();
  if (filter === "pending") return status.includes("pending");
  if (filter === "changes") return status.includes("changes");
  if (filter === "approved") return status.includes("approved");
  return true;
}

function normalizeReviewStatusLabel(status) {
  const value = String(status || "Pending review").toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "needs_changes" || value === "needs changes") return "Needs changes";
  if (value === "closed") return "Closed";
  return "Pending review";
}

function getReviewStatusClass(status) {
  const value = (status || "").toLowerCase();
  if (value.includes("approved")) return "status-approved";
  if (value.includes("changes")) return "status-changes";
  if (value.includes("closed")) return "status-closed";
  return "status-pending";
}

function getDefaultReviewNextAction(status) {
  const value = (status || "").toLowerCase();
  if (value.includes("approved")) return "Approved for patient-facing follow-up.";
  if (value.includes("changes")) return "Send revised guidance before approving.";
  if (value.includes("closed")) return "Closed with audit record saved.";
  return "Review context, add a note, then approve or request changes.";
}

async function updateReviewQueueItem(id, action) {
  const queue = getReviewQueue();
  const item = queue.find((entry) => entry.id === id);
  if (!item) return;
  const note = document.querySelector(`#review-note-${CSS.escape(id)}`)?.value.trim() || "";
  const statusMap = {
    approved: "Approved",
    needs_changes: "Needs changes",
    closed: "Closed",
  };
  item.status = statusMap[action] || "Pending review";
  item.reviewerNote = note;
  item.reviewedAt = new Date().toISOString();
  if (item.backendCarePlanId) {
    try {
      const decisionResponse = await apiPost(`/clinical-review/${encodeURIComponent(item.backendCarePlanId)}/review`, {
        status: action,
        clinician_note: note,
      });
      item.backendSynced = true;
      localStorage.setItem("carewiseReviewDecisionSynced", "true");
      localStorage.setItem("carewiseReviewDemoOutcome", JSON.stringify({
        carePlanId: decisionResponse.id || item.backendCarePlanId,
        status: normalizeReviewStatusLabel(decisionResponse.status || action),
        reviewedAt: decisionResponse.reviewed_at || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));
      item.nextAction = getDefaultReviewNextAction(item.status);
      addAuditEvent("backend_review_synced", `${item.patientName} review decision synced to backend care plan ${item.backendCarePlanId}.`);
    } catch (error) {
      item.backendSynced = false;
      item.nextAction = error.message.includes("403")
        ? "Backend action needs a clinician or admin account. Local audit was saved."
        : "Backend review sync failed. Retry after checking login and backend status.";
    }
  } else {
    item.nextAction = getDefaultReviewNextAction(item.status);
  }
  localStorage.setItem("carewiseReviewQueue", JSON.stringify(queue));
  addAuditEvent(`review_${action}`, `${item.patientName} marked ${item.status}. ${note || "No reviewer note."}`);
  reviewStatus.textContent = item.backendCarePlanId
    ? `${item.patientName} marked ${item.status}. Backend sync ${item.backendSynced ? "complete" : "needs clinician/admin login"}.`
    : `${item.patientName} marked ${item.status}.`;
  renderReviewQueue();
  renderAuditTrail();
  renderDashboardStats();
  refreshReviewDemoProof();
}

function attachBackendReviewIdToLocalItem(response, reviewItemId = "") {
  const targetReviewId = reviewItemId || lastGeneratedPlan?.localReviewId || "";
  if (!targetReviewId) return;
  const queue = getReviewQueue();
  const item = queue.find((entry) => entry.id === targetReviewId);
  if (!item) return;
  item.backendCarePlanId = response.id;
  item.backendSynced = true;
  item.source = response.risk_level === "clinician_review" ? "Care plan + backend" : item.source || "Care plan";
  item.nextAction = response.status === "pending_review"
    ? "Backend record is ready. A clinician/admin can review and sync the decision."
    : getDefaultReviewNextAction(item.status);
  localStorage.setItem("carewiseReviewQueue", JSON.stringify(queue));
  renderReviewQueue();
  renderDashboardStats();
  refreshReviewDemoProof();
}

function addAuditEvent(action, message) {
  const events = getAuditEvents();
  events.unshift({
    id: `audit-${Date.now()}`,
    createdAt: new Date().toISOString(),
    action,
    message,
  });
  localStorage.setItem("carewiseAuditEvents", JSON.stringify(events.slice(0, 50)));
}

function getAuditEvents() {
  try {
    return JSON.parse(localStorage.getItem("carewiseAuditEvents") || "[]");
  } catch {
    return [];
  }
}

function renderAuditTrail() {
  const events = getAuditEvents();
  if (!events.length) {
    auditTrail.innerHTML = "<p>No audit events yet.</p>";
    return;
  }
  auditTrail.innerHTML = events.slice(0, 8).map((event) => `
    <article class="audit-row">
      <strong>${escapeHtml(event.action.replaceAll("_", " "))}</strong>
      <span>${escapeHtml(new Date(event.createdAt).toLocaleString())}</span>
      <p>${escapeHtml(event.message)}</p>
    </article>
  `).join("");
}

function exportLocalData(copyToClipboard) {
  let consent = null;
  try {
    consent = localStorage.getItem("carewiseConsent") ? JSON.parse(localStorage.getItem("carewiseConsent")) : null;
  } catch {
    consent = null;
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    savedPlans: getSavedPlans(),
    mealPlans: getMealPlans(),
    symptomTimeline: getSymptomTimeline(),
    checkins: getCheckins(),
    medications: getMedications(),
    safetyChecks: getSafetyChecks(),
    goals: getGoals(),
    barriers: getBarriers(),
    reminders: getReminders(),
    monthlyCalendars: getMonthlyCalendars(),
    careNavigationPrep: getNavigationPrepItems(),
    careTeamContacts: getCareTeamContacts(),
    visitBriefs: getVisitBriefs(),
    carePackets: getCarePackets(),
    supportRequests: getSupportRequests(),
    qaReports: getQaReports(),
    demoScripts: getDemoScripts(),
    pilotLeads: getPilotLeads(),
    reportSafetyEvaluation: getLatestReportEvaluation(),
    labTrends: getLabTrends(),
    reviewQueue: getReviewQueue(),
    auditEvents: getAuditEvents(),
    backend: {
      baseUrl: backendBaseUrl,
      available: backendAvailable,
      signedIn: Boolean(authToken),
      patientId: backendPatientId || null,
    },
    consent,
  };
  const json = JSON.stringify(payload, null, 2);
  exportOutput.value = json;
  exportStatus.textContent = "Local JSON export generated.";
  if (copyToClipboard && navigator.clipboard) {
    navigator.clipboard.writeText(json)
      .then(() => {
        exportStatus.textContent = "Local JSON copied.";
      })
      .catch(() => {
        exportStatus.textContent = "Copy unavailable. Export is shown in the text box.";
      });
  }
}

async function exportBackendData() {
  try {
    if (!authToken) {
      exportStatus.textContent = "Sign in before exporting backend data.";
      return;
    }
    const payload = await apiGet("/privacy/me/export");
    exportOutput.value = JSON.stringify(payload, null, 2);
    renderBackendExportSummary(payload);
    exportStatus.textContent = `Backend export loaded with ${payload.report_analyses?.length || 0} report explanation${(payload.report_analyses?.length || 0) === 1 ? "" : "s"}, ${payload.medications?.length || 0} medication${(payload.medications?.length || 0) === 1 ? "" : "s"}, and ${payload.care_plans?.length || 0} care plan${(payload.care_plans?.length || 0) === 1 ? "" : "s"}.`;
    addAuditEvent("backend_data_exported", "Backend privacy export loaded in the app.");
    renderAuditTrail();
  } catch {
    exportStatus.textContent = "Backend export failed. Check login and backend status.";
  }
}

async function checkBackendDataSummary() {
  try {
    if (!authToken) {
      exportStatus.textContent = "Sign in before checking backend data.";
      return;
    }
    const payload = await apiGet("/privacy/me/export-summary");
    exportOutput.value = "";
    renderBackendExportSummary(payload);
    const counts = payload.counts || {};
    exportStatus.textContent = `Safe backend summary loaded: ${counts.reports || 0} report${(counts.reports || 0) === 1 ? "" : "s"}, ${counts.report_analyses || 0} explanation${(counts.report_analyses || 0) === 1 ? "" : "s"}, and ${counts.care_plans || 0} care plan${(counts.care_plans || 0) === 1 ? "" : "s"}.`;
    addAuditEvent("backend_export_summary_checked", "Backend privacy export summary counts loaded in the app.");
    renderAuditTrail();
  } catch (error) {
    const status = getBackendErrorStatus(error);
    exportStatus.textContent = status === 404
      ? "Backend summary is not live yet. Wait for Render to finish deploying, then try again."
      : "Backend data summary failed. Check login and backend status.";
  }
}

function getBackendErrorStatus(error) {
  const match = String(error?.message || "").match(/Backend returned (\d+)/);
  return match ? Number(match[1]) : 0;
}

function renderBackendExportSummary(payload) {
  if (!exportSummary) return;
  const counts = payload.counts || {
    patients: payload.patients?.length || 0,
    reports: payload.reports?.length || 0,
    report_analyses: payload.report_analyses?.length || 0,
    medications: payload.medications?.length || 0,
    intakes: payload.intakes?.length || 0,
    care_plans: payload.care_plans?.length || 0,
    consent_records: payload.consent_records?.length || 0,
    subscriptions: payload.subscriptions?.length || 0,
    notifications: payload.notifications?.length || 0,
    audit_events: payload.audit_events?.length || 0,
  };
  const items = [
    ["Patients", counts.patients || 0, "Profile records"],
    ["Reports", counts.reports || 0, "Report metadata only"],
    ["Explanations", counts.report_analyses || 0, "Saved report analyses"],
    ["Medications", counts.medications || 0, "Medication notes"],
    ["Intakes", counts.intakes || 0, "Health intake records"],
    ["Care plans", counts.care_plans || 0, "Educational care plans"],
    ["Consent", counts.consent_records || 0, "Consent history"],
    ["Subscriptions", counts.subscriptions || 0, "Subscription records"],
    ["Notifications", counts.notifications || 0, "Notification choices"],
    ["Audit", counts.audit_events || 0, "Recent audit events"],
  ];
  exportSummary.innerHTML = items.map(([label, count, detail]) => `
    <article class="${Number(count) ? "complete" : "pending"}">
      <strong>${escapeHtml(String(count))}</strong>
      <span>${escapeHtml(label)} · ${escapeHtml(detail)}</span>
    </article>
  `).join("");
}

async function requestBackendDataDeletion() {
  try {
    if (!authToken) {
      exportStatus.textContent = "Sign in before requesting backend deletion.";
      return;
    }
    const confirmed = window.confirm("Submit a backend data deletion request for this signed-in account?");
    if (!confirmed) {
      exportStatus.textContent = "Deletion request cancelled.";
      return;
    }
    const response = await apiPost("/privacy/me/delete-request", {
      reason: "User requested deletion from CareWise web app.",
    });
    exportStatus.textContent = `Deletion request submitted: ${response.id}.`;
    addAuditEvent("backend_deletion_requested", `Backend deletion request submitted: ${response.id}.`);
    renderAuditTrail();
  } catch {
    exportStatus.textContent = "Deletion request failed. Check login and backend status.";
  }
}

function initializeSymptomDate() {
  const dateInput = document.querySelector("#symptom-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

function getSymptomTimeline() {
  try {
    return JSON.parse(localStorage.getItem("carewiseSymptomTimeline") || "[]");
  } catch {
    return [];
  }
}

function getSymptomForm() {
  return {
    id: `symptom-${Date.now()}`,
    date: document.querySelector("#symptom-date")?.value || new Date().toISOString().slice(0, 10),
    name: document.querySelector("#symptom-name")?.value.trim() || "",
    change: document.querySelector("#symptom-change")?.value || "Same",
    severity: document.querySelector("#symptom-severity")?.value || "Moderate",
    notes: document.querySelector("#symptom-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

function fillSampleSymptom() {
  document.querySelector("#symptom-date").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#symptom-name").value = "Fatigue after poor sleep";
  document.querySelector("#symptom-change").value = "Same";
  document.querySelector("#symptom-severity").value = "Moderate";
  document.querySelector("#symptom-notes").value = "Started this week after several late nights. No emergency warning signs reported in this sample.";
  symptomStatus.textContent = "Sample symptom entry filled. Save it when ready.";
}

function getSymptomNextStep(entry) {
  const urgentText = `${entry.name} ${entry.notes}`.toLowerCase();
  const urgentMatches = emergencyGuidanceRules
    .filter((rule) => rule.terms.some((term) => (
      urgentText.includes(term)
      && !urgentText.includes(`no ${term}`)
      && !urgentText.includes(`denies ${term}`)
      && !urgentText.includes(`without ${term}`)
    )))
    .map((rule) => rule.label);
  if (entry.severity === "Severe" || entry.change === "Worse" || urgentMatches.length) {
    return "Use urgent care, emergency services, or a licensed clinician for severe, new, unusual, or fast-worsening symptoms.";
  }
  if (entry.change === "New") return "Track start date/time, triggers, medicines, and related symptoms; ask a clinician if it persists or feels concerning.";
  if (entry.change === "Resolved") return "Keep the note for context and mention it if symptoms return.";
  return "Bring this timeline entry to the next check-in or care conversation if it continues.";
}

function saveSymptomEntry() {
  const entry = getSymptomForm();
  if (!entry.name && !entry.notes) {
    symptomStatus.textContent = "Add a symptom or notes before saving.";
    return;
  }
  const timeline = getSymptomTimeline();
  timeline.unshift(entry);
  localStorage.setItem("carewiseSymptomTimeline", JSON.stringify(timeline.slice(0, 30)));
  document.querySelector("#symptom-name").value = "";
  document.querySelector("#symptom-notes").value = "";
  symptomStatus.textContent = `${entry.name || "Symptom entry"} saved locally. Use urgent care for severe or fast-worsening symptoms.`;
  addAuditEvent("symptom_entry_saved", `${entry.change} ${entry.severity.toLowerCase()} symptom entry saved.`);
  renderSymptomTimeline();
  renderAuditTrail();
}

function renderSymptomTimeline() {
  if (!symptomList) return;
  const timeline = getSymptomTimeline();
  if (!timeline.length) {
    symptomList.innerHTML = "<p>No symptom timeline entries yet.</p>";
    return;
  }
  symptomList.innerHTML = `
    <article class="symptom-summary">
      <strong>${escapeHtml(timeline.length)} timeline entr${timeline.length === 1 ? "y" : "ies"}</strong>
      <span>${escapeHtml(timeline.filter((item) => item.severity === "Severe" || item.change === "Worse").length)} need attention</span>
    </article>
    ${timeline.map((entry) => `
      <article>
        <div>
          <strong>${escapeHtml(entry.name || "Symptom entry")}</strong>
          <span>${escapeHtml(entry.change)} · ${escapeHtml(entry.severity)}</span>
        </div>
        <p>${escapeHtml(entry.date || "No date saved.")}${entry.notes ? ` · ${escapeHtml(entry.notes)}` : ""}</p>
        <small>${escapeHtml(getSymptomNextStep(entry))}</small>
      </article>
    `).join("")}
  `;
}

function getSymptomTimelineText() {
  const timeline = getSymptomTimeline();
  if (!timeline.length) return "CareWise AI symptom timeline\nNo symptom timeline entries yet.";
  return [
    "CareWise AI symptom timeline",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety: this is a symptom note log only. Severe, new, unusual, or fast-worsening symptoms should use urgent care, emergency services, or a licensed clinician.",
    "",
    ...timeline.map((entry, index) => [
      `${index + 1}. ${entry.name || "Symptom entry"}`,
      `Date: ${entry.date || "No date saved."}`,
      `Change: ${entry.change}`,
      `Severity: ${entry.severity}`,
      `Notes: ${entry.notes || "No notes saved."}`,
      `Next step: ${getSymptomNextStep(entry)}`,
    ].join("\n")),
  ].join("\n\n");
}

function copySymptomTimeline() {
  const text = getSymptomTimelineText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      symptomStatus.textContent = "Symptom timeline copied.";
    })
    .catch(() => {
      symptomStatus.textContent = "Copy unavailable. Use local JSON export to save the symptom timeline.";
    });
}

function initializeCheckinDate() {
  const weekInput = document.querySelector("#checkin-week");
  if (weekInput && !weekInput.value) {
    weekInput.value = new Date().toISOString().slice(0, 10);
  }
}

function getCheckinForm() {
  return {
    id: `checkin-${Date.now()}`,
    createdAt: new Date().toISOString(),
    weekOf: document.querySelector("#checkin-week").value,
    symptoms: document.querySelector("#checkin-symptoms").value,
    meals: document.querySelector("#checkin-meals").value,
    exercise: document.querySelector("#checkin-exercise").value,
    sleep: document.querySelector("#checkin-sleep").value,
    meds: document.querySelector("#checkin-meds").value,
    mood: document.querySelector("#checkin-mood").value,
    notes: document.querySelector("#checkin-notes").value.trim(),
  };
}

function fillSampleCheckin() {
  document.querySelector("#checkin-week").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#checkin-symptoms").value = "better";
  document.querySelector("#checkin-meals").value = "3-4";
  document.querySelector("#checkin-exercise").value = "31-90";
  document.querySelector("#checkin-sleep").value = "okay";
  document.querySelector("#checkin-meds").value = "mostly";
  document.querySelector("#checkin-mood").value = "middle";
  document.querySelector("#checkin-notes").value = "Walked after dinner three times, swapped two fast-food meals for home meals, still struggling with late-night sleep.";
  checkinStatus.textContent = "Sample check-in filled. Review it, then save.";
}

function getCheckins() {
  try {
    return JSON.parse(localStorage.getItem("carewiseCheckins") || "[]");
  } catch {
    return [];
  }
}

function saveCheckin() {
  const checkins = getCheckins();
  checkins.unshift(getCheckinForm());
  localStorage.setItem("carewiseCheckins", JSON.stringify(checkins.slice(0, 16)));
  document.querySelector("#checkin-notes").value = "";
  checkinStatus.textContent = "Weekly check-in saved on this device.";
  renderCheckins();
}

function renderCheckins() {
  const checkins = getCheckins();
  if (!checkins.length) {
    checkinHistory.innerHTML = "<p>No check-ins yet.</p>";
    return;
  }
  checkinHistory.innerHTML = `
    <article class="trend-card">
      <strong>Trend summary</strong>
      <p>${escapeHtml(buildTrendSummary(checkins))}</p>
    </article>
    ${checkins.map(renderCheckinRow).join("")}
  `;
}

function renderCheckinRow(checkin) {
  const week = checkin.weekOf || new Date(checkin.createdAt).toLocaleDateString();
  const symptomLabel = `${checkin.symptoms} symptoms`;
  return `
    <article class="saved-plan-row">
      <div class="saved-plan-top">
        <div>
          <strong>Week of ${escapeHtml(week)}</strong>
          <span>${escapeHtml(symptomLabel)} · ${escapeHtml(checkin.exercise)} exercise</span>
        </div>
        <b>${escapeHtml(checkin.mood)} mood</b>
      </div>
      <div class="saved-plan-meta">
        <span>Meals ${escapeHtml(checkin.meals)}</span>
        <span>Sleep ${escapeHtml(checkin.sleep)}</span>
        <span>Meds ${escapeHtml(checkin.meds)}</span>
      </div>
      ${checkin.notes ? `<p>${escapeHtml(checkin.notes)}</p>` : ""}
    </article>
  `;
}

function buildTrendSummary(checkins) {
  const recent = checkins.slice(0, 4);
  const worseSymptoms = recent.filter((item) => item.symptoms === "worse").length;
  const lowMeds = recent.filter((item) => ["missed_many", "missed_some"].includes(item.meds)).length;
  const lowSleep = recent.filter((item) => item.sleep === "poor").length;
  const strongExercise = recent.filter((item) => ["91-150", "150+"].includes(item.exercise)).length;
  const messages = [];

  if (worseSymptoms >= 2) messages.push("Symptoms worsened in multiple recent check-ins; schedule clinician review.");
  if (lowMeds >= 2) messages.push("Medication adherence is a barrier; use refill/reminder support and ask a clinician/pharmacist for help.");
  if (lowSleep >= 2) messages.push("Sleep is repeatedly poor; review caffeine, routine, stress, and possible medical causes.");
  if (strongExercise >= 2) messages.push("Exercise consistency is improving; keep progression gradual and safe.");
  if (!messages.length) messages.push("No major negative trend detected. Keep tracking weekly so patterns become clearer.");

  return messages.join(" ");
}

function getGoals() {
  try {
    return JSON.parse(localStorage.getItem("carewiseGoals") || "[]");
  } catch {
    return [];
  }
}

function getGoalForm() {
  return {
    id: `goal-${Date.now()}`,
    title: document.querySelector("#goal-title-input")?.value.trim() || "",
    category: document.querySelector("#goal-category")?.value || "Food",
    target: document.querySelector("#goal-target")?.value.trim() || "",
    progress: document.querySelector("#goal-progress")?.value || "Started",
    priority: document.querySelector("#goal-priority")?.value || "Medium",
    notes: document.querySelector("#goal-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

function fillSampleGoal() {
  document.querySelector("#goal-title-input").value = "Walk after dinner 3 days";
  document.querySelector("#goal-category").value = "Movement";
  document.querySelector("#goal-target").value = "10-15 minutes after dinner on 3 days";
  document.querySelector("#goal-progress").value = "Started";
  document.querySelector("#goal-priority").value = "Medium";
  document.querySelector("#goal-notes").value = "Keep it gentle. Stop and seek care for chest pain, severe shortness of breath, fainting, or fast-worsening symptoms.";
  goalStatus.textContent = "Sample weekly goal filled. Save it when ready.";
}

function saveGoal() {
  const goal = getGoalForm();
  if (!goal.title) {
    goalStatus.textContent = "Add a goal before saving.";
    return;
  }
  const goals = getGoals();
  goals.unshift(goal);
  localStorage.setItem("carewiseGoals", JSON.stringify(goals.slice(0, 24)));
  document.querySelector("#goal-title-input").value = "";
  document.querySelector("#goal-target").value = "";
  document.querySelector("#goal-notes").value = "";
  goalStatus.textContent = `${goal.title} saved locally. Review goals with a qualified professional when needed.`;
  addAuditEvent("goal_saved", `${goal.category} goal saved: ${goal.title}.`);
  renderGoals();
  renderAuditTrail();
}

function getGoalNextStep(goal) {
  if (goal.progress === "Blocked") return "Identify the barrier and ask a clinician, nutritionist, pharmacist, or care team member for help if health-related.";
  if (goal.progress === "Done") return "Keep it realistic. Consider maintaining the habit before increasing intensity.";
  if (goal.priority === "High") return "Review this goal during the next care conversation before making major changes.";
  if (goal.category === "Medication question") return "Prepare this as a question for a clinician or pharmacist. Do not change medication without professional guidance.";
  if (goal.category === "Report follow-up") return "Bring the report and CareWise summary to the next appointment or review.";
  return "Track progress during the next weekly check-in.";
}

function renderGoals() {
  if (!goalList) return;
  const goals = getGoals();
  if (!goals.length) {
    goalList.innerHTML = "<p>No weekly goals saved yet.</p>";
    return;
  }
  goalList.innerHTML = `
    <article class="goal-summary">
      <strong>${escapeHtml(goals.filter((goal) => goal.progress === "Done").length)}/${escapeHtml(goals.length)} done</strong>
      <span>${escapeHtml(goals.filter((goal) => goal.progress === "Blocked").length)} blocked · ${escapeHtml(goals.filter((goal) => goal.priority === "High").length)} high priority</span>
    </article>
    ${goals.map((goal) => `
      <article>
        <div>
          <strong>${escapeHtml(goal.title)}</strong>
          <span>${escapeHtml(goal.category)} · ${escapeHtml(goal.progress)}</span>
        </div>
        <p>${escapeHtml(goal.target || "No target saved.")}</p>
        ${goal.notes ? `<p>${escapeHtml(goal.notes)}</p>` : ""}
        <small>${escapeHtml(goal.priority)} priority · ${escapeHtml(getGoalNextStep(goal))}</small>
      </article>
    `).join("")}
  `;
}

function getGoalPlanText() {
  const goals = getGoals();
  if (!goals.length) return "CareWise AI weekly goals\nNo weekly goals saved yet.";
  return [
    "CareWise AI weekly goals",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety: goals are habit and preparation support only. Do not change treatment, medication, or urgent care decisions based only on this app.",
    "",
    ...goals.map((goal, index) => [
      `${index + 1}. ${goal.title}`,
      `Category: ${goal.category}`,
      `Target: ${goal.target || "No target saved."}`,
      `Progress: ${goal.progress}`,
      `Priority: ${goal.priority}`,
      `Notes: ${goal.notes || "No notes saved."}`,
      `Next step: ${getGoalNextStep(goal)}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyGoals() {
  const text = getGoalPlanText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      goalStatus.textContent = "Weekly goals copied.";
    })
    .catch(() => {
      goalStatus.textContent = "Copy unavailable. Use local JSON export to save weekly goals.";
    });
}

function getBarriers() {
  try {
    return JSON.parse(localStorage.getItem("carewiseBarriers") || "[]");
  } catch {
    return [];
  }
}

function getBarrierForm() {
  return {
    id: `barrier-${Date.now()}`,
    type: document.querySelector("#barrier-type")?.value || "Time",
    impact: document.querySelector("#barrier-impact")?.value || "Medium",
    relatedGoal: document.querySelector("#barrier-goal")?.value.trim() || "",
    supportStep: document.querySelector("#barrier-step")?.value.trim() || "",
    notes: document.querySelector("#barrier-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

function fillSampleBarrier() {
  document.querySelector("#barrier-type").value = "Time";
  document.querySelector("#barrier-impact").value = "Medium";
  document.querySelector("#barrier-goal").value = "Walk after dinner 3 days";
  document.querySelector("#barrier-step").value = "Plan two 10-minute walks after dinner and one weekend walk.";
  document.querySelector("#barrier-notes").value = "Busy week made longer walks unrealistic. Keep the goal smaller and easier to repeat.";
  barrierStatus.textContent = "Sample barrier filled. Save it when ready.";
}

function getBarrierSupportSuggestion(barrier) {
  if (barrier.type === "Cost") return "Ask about lower-cost options, community resources, pharmacy discounts, or benefit coverage before spending more.";
  if (barrier.type === "Food access") return "Plan shelf-stable, affordable, culturally familiar options and ask local support programs if needed.";
  if (barrier.type === "Transportation") return "Prepare telehealth, ride support, or nearby clinic options when appropriate.";
  if (barrier.type === "Medication concern" || barrier.type === "Side effects") return "Contact a clinician or pharmacist before changing, stopping, or restarting medication.";
  if (barrier.type === "Motivation or stress") return "Shrink the goal and add social support; seek professional help for severe distress or safety concerns.";
  if (barrier.type === "Technology issue") return "Use support inbox and keep an offline note until sync or notifications are ready.";
  if (barrier.impact === "High") return "Bring this barrier to the next clinician, nutritionist, or care-team conversation.";
  return "Choose one smaller support step for the next weekly check-in.";
}

function saveBarrier() {
  const barrier = getBarrierForm();
  if (!barrier.relatedGoal && !barrier.notes) {
    barrierStatus.textContent = "Add a related goal or notes before saving.";
    return;
  }
  const barriers = getBarriers();
  barriers.unshift(barrier);
  localStorage.setItem("carewiseBarriers", JSON.stringify(barriers.slice(0, 24)));
  document.querySelector("#barrier-goal").value = "";
  document.querySelector("#barrier-step").value = "";
  document.querySelector("#barrier-notes").value = "";
  barrierStatus.textContent = `${barrier.type} barrier saved locally. Use it to make the next goal more realistic.`;
  addAuditEvent("barrier_saved", `${barrier.type} barrier saved with ${barrier.impact} impact.`);
  renderBarriers();
  renderAuditTrail();
}

function renderBarriers() {
  if (!barrierList) return;
  const barriers = getBarriers();
  if (!barriers.length) {
    barrierList.innerHTML = "<p>No barriers saved yet.</p>";
    return;
  }
  barrierList.innerHTML = `
    <article class="barrier-summary">
      <strong>${escapeHtml(barriers.length)} barrier${barriers.length === 1 ? "" : "s"}</strong>
      <span>${escapeHtml(barriers.filter((item) => item.impact === "High").length)} high impact · ${escapeHtml(new Set(barriers.map((item) => item.type)).size)} type${new Set(barriers.map((item) => item.type)).size === 1 ? "" : "s"}</span>
    </article>
    ${barriers.map((barrier) => `
      <article>
        <div>
          <strong>${escapeHtml(barrier.type)}</strong>
          <span>${escapeHtml(barrier.impact)} impact</span>
        </div>
        <p>${escapeHtml(barrier.relatedGoal || "No related goal saved.")}</p>
        ${barrier.supportStep ? `<p>${escapeHtml(barrier.supportStep)}</p>` : ""}
        ${barrier.notes ? `<p>${escapeHtml(barrier.notes)}</p>` : ""}
        <small>${escapeHtml(getBarrierSupportSuggestion(barrier))}</small>
      </article>
    `).join("")}
  `;
}

function getBarrierPlanText() {
  const barriers = getBarriers();
  if (!barriers.length) return "CareWise AI barriers\nNo barriers saved yet.";
  return [
    "CareWise AI barrier support tracker",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety: barrier notes help prepare support conversations. They are not emergency, financial, insurance, medication, or treatment advice.",
    "",
    ...barriers.map((barrier, index) => [
      `${index + 1}. ${barrier.type}`,
      `Impact: ${barrier.impact}`,
      `Related goal: ${barrier.relatedGoal || "No related goal saved."}`,
      `Support step: ${barrier.supportStep || "No support step saved."}`,
      `Notes: ${barrier.notes || "No notes saved."}`,
      `Suggested next step: ${getBarrierSupportSuggestion(barrier)}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyBarriers() {
  const text = getBarrierPlanText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      barrierStatus.textContent = "Barrier support plan copied.";
    })
    .catch(() => {
      barrierStatus.textContent = "Copy unavailable. Use local JSON export to save barriers.";
    });
}

function getReminders() {
  try {
    return JSON.parse(localStorage.getItem("carewiseReminders") || "[]");
  } catch {
    return [];
  }
}

function getReminderForm() {
  return {
    id: `reminder-${Date.now()}`,
    title: document.querySelector("#reminder-title-input")?.value.trim() || "",
    type: document.querySelector("#reminder-type")?.value || "Check-in",
    frequency: document.querySelector("#reminder-frequency")?.value || "Weekly",
    startDate: document.querySelector("#reminder-date")?.value || new Date().toISOString().slice(0, 10),
    notes: document.querySelector("#reminder-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

function fillSampleReminder() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.querySelector("#reminder-title-input").value = "Weekly CareWise check-in";
  document.querySelector("#reminder-type").value = "Check-in";
  document.querySelector("#reminder-frequency").value = "Weekly";
  document.querySelector("#reminder-date").value = nextWeek.toISOString().slice(0, 10);
  document.querySelector("#reminder-notes").value = "Review meals, walking, sleep, medication barriers, and any new symptoms before changing the plan.";
  reminderStatus.textContent = "Sample reminder filled. Save it when ready.";
}

function saveReminder() {
  const reminder = getReminderForm();
  if (!reminder.title) {
    reminderStatus.textContent = "Add a reminder name before saving.";
    return;
  }
  const reminders = getReminders();
  reminders.unshift(reminder);
  localStorage.setItem("carewiseReminders", JSON.stringify(reminders.slice(0, 24)));
  document.querySelector("#reminder-title-input").value = "";
  document.querySelector("#reminder-notes").value = "";
  reminderStatus.textContent = `${reminder.title} saved locally. Real notifications can be connected later.`;
  addAuditEvent("reminder_saved", `${reminder.title} reminder saved for ${reminder.frequency.toLowerCase()} follow-up.`);
  renderReminders();
  renderAuditTrail();
}

function renderReminders() {
  if (!reminderList) return;
  const reminders = getReminders();
  if (!reminders.length) {
    reminderList.innerHTML = "<p>No reminders planned yet.</p>";
    return;
  }
  reminderList.innerHTML = reminders.map((reminder) => `
    <article>
      <div>
        <strong>${escapeHtml(reminder.title)}</strong>
        <span>${escapeHtml(reminder.type)} · ${escapeHtml(reminder.frequency)}</span>
      </div>
      <p>${escapeHtml(reminder.notes || "No notes saved.")}</p>
      <small>Starts ${escapeHtml(reminder.startDate)} · Local-only reminder plan</small>
    </article>
  `).join("");
}

function getReminderPlanText() {
  const reminders = getReminders();
  if (!reminders.length) return "CareWise AI reminder plan\nNo reminders planned yet.";
  return [
    "CareWise AI reminder plan",
    `Generated: ${new Date().toLocaleString()}`,
    "Scope: local planning only. This MVP does not send push, email, or SMS reminders yet.",
    "",
    ...reminders.map((reminder, index) => [
      `${index + 1}. ${reminder.title}`,
      `Type: ${reminder.type}`,
      `Frequency: ${reminder.frequency}`,
      `Start date: ${reminder.startDate}`,
      `Notes: ${reminder.notes || "No notes saved."}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyReminders() {
  const text = getReminderPlanText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      reminderStatus.textContent = "Reminder plan copied.";
    })
    .catch(() => {
      reminderStatus.textContent = "Copy unavailable. Use local JSON export to save reminders.";
    });
}

function initializeMonthlyCalendarDate() {
  const input = document.querySelector("#monthly-calendar-start");
  if (input && !input.value) input.value = new Date().toISOString().slice(0, 10);
}

function getMonthlyCalendars() {
  try {
    return JSON.parse(localStorage.getItem("carewiseMonthlyCalendars") || "[]");
  } catch {
    return [];
  }
}

function fillSampleMonthlyCalendar() {
  document.querySelector("#monthly-calendar-start").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#monthly-calendar-focus").value = "Balanced follow-up";
  document.querySelector("#monthly-calendar-day").value = "Wednesday";
  document.querySelector("#monthly-calendar-notes").value = "Review meal plan, medication questions, lab values, and visit brief before the next care conversation.";
  monthlyCalendarStatus.textContent = "Sample monthly calendar settings filled. Build the calendar when ready.";
}

function getCalendarWeekStart(startDate, offsetWeeks) {
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + offsetWeeks * 7);
  return date.toISOString().slice(0, 10);
}

function getMonthlyCalendarInputs() {
  return {
    startDate: document.querySelector("#monthly-calendar-start")?.value || new Date().toISOString().slice(0, 10),
    focus: document.querySelector("#monthly-calendar-focus")?.value || "Balanced follow-up",
    checkinDay: document.querySelector("#monthly-calendar-day")?.value || "Wednesday",
    notes: document.querySelector("#monthly-calendar-notes")?.value.trim() || "",
  };
}

function buildMonthlyTasks(inputs) {
  const goals = getGoals();
  const labs = getLabTrends();
  const meds = getMedications();
  const mealPlans = getMealPlans();
  const safetyCheck = getLatestSafetyCheck();
  const visitBrief = getLatestVisitBrief();
  const reports = getReportHistory();
  const weeks = [
    {
      title: "Week 1: collect and confirm",
      tasks: [
        goals.length ? `Choose one priority goal: ${goals[0].title}.` : "Choose one small food, movement, sleep, or appointment-prep goal.",
        meds.length ? "Check medication list, refill dates, side-effect notes, and pharmacy questions." : "Add medication and supplement list with dose and timing.",
        labs.length ? "Mark lab values that need clarification and keep the original report ready." : "Upload or enter key lab values from the report.",
      ],
    },
    {
      title: "Week 2: routine and barriers",
      tasks: [
        mealPlans.length ? "Use the saved meal plan for 3-4 realistic days, then note what was hard." : "Build a simple meal plan for budget, diet style, and prep time.",
        "Save a check-in for meals, movement, sleep, medication adherence, mood, and barriers.",
        "Adjust goals smaller if time, cost, food access, transportation, or stress blocks progress.",
      ],
    },
    {
      title: "Week 3: safety and follow-up",
      tasks: [
        safetyCheck ? "Review the saved safety checklist before changing medicines, supplements, foods, or routines." : "Run the medication, allergy, and food safety checklist.",
        reports.length ? "Prepare report follow-up questions for a clinician or care team." : "Add report notes or upload a readable report if available.",
        "Confirm what symptoms should trigger urgent care or emergency services.",
      ],
    },
    {
      title: "Week 4: visit brief and next month",
      tasks: [
        visitBrief ? "Copy the latest clinician visit brief before the appointment or care call." : "Build the clinician visit brief.",
        `Do the monthly check-in on ${inputs.checkinDay}.`,
        "Decide which goal, lab, medication question, or food barrier carries into next month.",
      ],
    },
  ];
  if (inputs.focus === "Medication review") weeks[0].tasks.unshift("Prioritize pharmacist or clinician medication review this month.");
  if (inputs.focus === "Report follow-up") weeks[2].tasks.unshift("Prioritize lab/report questions and repeat-testing timing.");
  if (inputs.focus === "Food and movement") weeks[1].tasks.unshift("Prioritize meal prep, walking, strength, sleep, and realistic barriers.");
  if (inputs.focus === "Visit preparation") weeks[3].tasks.unshift("Prioritize visit brief, questions, records, insurance card, and support person notes.");
  return weeks.map((week, index) => ({
    ...week,
    weekOf: getCalendarWeekStart(inputs.startDate, index),
    tasks: week.tasks.slice(0, 5),
  }));
}

function buildMonthlyCalendar() {
  const inputs = getMonthlyCalendarInputs();
  const calendar = {
    id: `month-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...inputs,
    weeks: buildMonthlyTasks(inputs),
  };
  const calendars = getMonthlyCalendars();
  calendars.unshift(calendar);
  localStorage.setItem("carewiseMonthlyCalendars", JSON.stringify(calendars.slice(0, 12)));
  monthlyCalendarStatus.textContent = "4-week care calendar built.";
  addAuditEvent("monthly_calendar_built", `${calendar.focus} calendar built from ${calendar.startDate}.`);
  renderMonthlyCalendars();
  renderAuditTrail();
}

function renderMonthlyCalendars() {
  if (!monthlyCalendarList) return;
  const calendar = getMonthlyCalendars()[0];
  if (!calendar) {
    monthlyCalendarList.innerHTML = "<p>No monthly calendar generated yet.</p>";
    return;
  }
  monthlyCalendarList.innerHTML = `
    <article class="monthly-calendar-summary">
      <strong>${escapeHtml(calendar.focus)}</strong>
      <span>Starts ${escapeHtml(calendar.startDate)} · check-in ${escapeHtml(calendar.checkinDay)}</span>
    </article>
    ${calendar.weeks.map((week) => `
      <article>
        <div>
          <strong>${escapeHtml(week.title)}</strong>
          <span>Week of ${escapeHtml(week.weekOf)}</span>
        </div>
        <ul>${week.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>
      </article>
    `).join("")}
  `;
}

function getMonthlyCalendarText() {
  const calendar = getMonthlyCalendars()[0];
  if (!calendar) return "CareWise AI monthly care calendar\nNo monthly calendar generated yet.";
  return [
    "CareWise AI 4-week care calendar",
    `Generated: ${new Date(calendar.createdAt).toLocaleString()}`,
    "Safety scope: planning support only. This is not a treatment plan, diagnosis, prescription, emergency care, or a replacement for licensed medical advice.",
    `Focus: ${calendar.focus}`,
    `Start date: ${calendar.startDate}`,
    `Check-in day: ${calendar.checkinDay}`,
    `Notes: ${calendar.notes || "No notes saved."}`,
    "",
    ...calendar.weeks.map((week) => [
      `${week.title} (${week.weekOf})`,
      ...week.tasks.map((task) => `- ${task}`),
    ].join("\n")),
  ].join("\n\n");
}

function copyMonthlyCalendar() {
  const text = getMonthlyCalendarText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      monthlyCalendarStatus.textContent = "Monthly calendar copied.";
    })
    .catch(() => {
      monthlyCalendarStatus.textContent = "Copy unavailable. Use local JSON export to save the calendar.";
    });
}

function getNavigationPrepItems() {
  try {
    return JSON.parse(localStorage.getItem("carewiseNavigationPrep") || "[]");
  } catch {
    return [];
  }
}

function getNavigationForm() {
  return {
    id: `navigation-${Date.now()}`,
    need: document.querySelector("#navigation-need")?.value || "Primary care",
    insurance: document.querySelector("#navigation-insurance")?.value || "Current insurance",
    location: document.querySelector("#navigation-location")?.value.trim() || "Not specified",
    timing: document.querySelector("#navigation-timing")?.value || "Routine",
    notes: document.querySelector("#navigation-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

function fillSampleNavigationPrep() {
  document.querySelector("#navigation-need").value = "Primary care";
  document.querySelector("#navigation-insurance").value = "Current insurance";
  document.querySelector("#navigation-location").value = document.querySelector("#location")?.value.trim() || "San Jose, CA";
  document.querySelector("#navigation-timing").value = "This week";
  document.querySelector("#navigation-notes").value = "Ask whether the clinic is in-network, whether labs and dietitian referrals are covered, and what symptoms should trigger urgent care.";
  navigationStatus.textContent = "Sample care navigation prep filled. Save it when ready.";
}

function saveNavigationPrep() {
  const item = getNavigationForm();
  const items = getNavigationPrepItems();
  items.unshift(item);
  localStorage.setItem("carewiseNavigationPrep", JSON.stringify(items.slice(0, 20)));
  navigationStatus.textContent = `${item.need} prep saved locally. Verify provider availability and coverage directly.`;
  document.querySelector("#navigation-notes").value = "";
  addAuditEvent("navigation_prep_saved", `${item.need} prep saved for ${item.location}.`);
  renderNavigationPrep();
  renderAuditTrail();
}

function getNavigationPrepChecklist(item) {
  const checklist = [
    "Confirm the provider accepts new patients.",
    "Verify insurance network, deductible, copay, referrals, and lab coverage directly with the plan.",
    "Bring medication list, allergies, recent reports, and CareWise summary.",
  ];
  if (item.insurance === "No insurance") checklist.push("Ask about community clinic, sliding-scale, cash-pay, pharmacy discount, and public program options.");
  if (item.insurance === "Comparing plans") checklist.push("Compare monthly premium, deductible, out-of-pocket max, medication coverage, and preferred clinic network.");
  if (item.timing === "Urgent today") checklist.push("Use urgent care, emergency services, or local emergency number for severe or fast-worsening symptoms.");
  return checklist;
}

function renderNavigationPrep() {
  if (!navigationList) return;
  const items = getNavigationPrepItems();
  if (!items.length) {
    navigationList.innerHTML = "<p>No care navigation prep saved yet.</p>";
    return;
  }
  navigationList.innerHTML = items.map((item) => `
    <article>
      <div>
        <strong>${escapeHtml(item.need)}</strong>
        <span>${escapeHtml(item.insurance)} · ${escapeHtml(item.timing)}</span>
      </div>
      <p>${escapeHtml(item.location)}${item.notes ? ` · ${escapeHtml(item.notes)}` : ""}</p>
      <ul>${getNavigationPrepChecklist(item).map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function getNavigationPrepText() {
  const items = getNavigationPrepItems();
  if (!items.length) return "CareWise AI care navigation prep\nNo care navigation prep saved yet.";
  return [
    "CareWise AI care navigation prep",
    `Generated: ${new Date().toLocaleString()}`,
    "Scope: preparation checklist only. CareWise does not verify live provider availability, insurance coverage, prices, or medical appropriateness.",
    "",
    ...items.map((item, index) => [
      `${index + 1}. ${item.need}`,
      `Insurance: ${item.insurance}`,
      `Location: ${item.location}`,
      `Timing: ${item.timing}`,
      `Notes: ${item.notes || "No notes saved."}`,
      "Checklist:",
      ...getNavigationPrepChecklist(item).map((task) => `- ${task}`),
    ].join("\n")),
  ].join("\n\n");
}

function copyNavigationPrep() {
  const text = getNavigationPrepText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      navigationStatus.textContent = "Care navigation prep copied.";
    })
    .catch(() => {
      navigationStatus.textContent = "Copy unavailable. Use local JSON export to save care navigation prep.";
    });
}

function getCareTeamContacts() {
  try {
    return JSON.parse(localStorage.getItem("carewiseCareTeamContacts") || "[]");
  } catch {
    return [];
  }
}

function getCareTeamForm() {
  return {
    id: `care-team-${Date.now()}`,
    name: document.querySelector("#care-team-name")?.value.trim() || "",
    role: document.querySelector("#care-team-role")?.value || "Primary care",
    contact: document.querySelector("#care-team-contact")?.value.trim() || "",
    action: document.querySelector("#care-team-action")?.value || "Call to schedule",
    notes: document.querySelector("#care-team-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

function fillSampleCareTeamContact() {
  document.querySelector("#care-team-name").value = "Primary care clinic";
  document.querySelector("#care-team-role").value = "Primary care";
  document.querySelector("#care-team-contact").value = "Patient portal or clinic phone";
  document.querySelector("#care-team-action").value = "Prepare visit questions";
  document.querySelector("#care-team-notes").value = "Ask which lab results need follow-up, whether dietitian referral is appropriate, and what symptoms should trigger urgent care.";
  careTeamStatus.textContent = "Sample care team contact filled. Save it when ready.";
}

function getCareTeamNextStep(contact) {
  if (contact.role === "Insurance/member services") return "Verify network, deductible, copay, prior authorization, referral rules, and covered labs directly with the plan.";
  if (contact.role === "Pharmacist") return "Ask medication, refill, side-effect, allergy, and interaction questions before changing anything.";
  if (contact.role === "Dietitian/nutritionist") return "Prepare food preferences, budget, culture, allergies, and barriers so recommendations are realistic.";
  if (contact.action === "Report follow-up") return "Bring the report, dates, symptoms, medications, and CareWise summary to the care conversation.";
  if (contact.action === "Medication question") return "Do not stop, start, or change medication without clinician or pharmacist guidance.";
  return "Confirm availability, accepted insurance, visit type, and what records to bring.";
}

function saveCareTeamContact() {
  const contact = getCareTeamForm();
  if (!contact.name && !contact.contact) {
    careTeamStatus.textContent = "Add a name/clinic or contact method before saving.";
    return;
  }
  const contacts = getCareTeamContacts();
  contacts.unshift(contact);
  localStorage.setItem("carewiseCareTeamContacts", JSON.stringify(contacts.slice(0, 30)));
  document.querySelector("#care-team-name").value = "";
  document.querySelector("#care-team-contact").value = "";
  document.querySelector("#care-team-notes").value = "";
  careTeamStatus.textContent = `${contact.name || contact.role} saved locally. Verify details directly before relying on them.`;
  addAuditEvent("care_team_contact_saved", `${contact.role} contact saved: ${contact.name || contact.contact}.`);
  renderCareTeamContacts();
  renderAuditTrail();
}

function renderCareTeamContacts() {
  if (!careTeamList) return;
  const contacts = getCareTeamContacts();
  if (!contacts.length) {
    careTeamList.innerHTML = "<p>No care team contacts saved yet.</p>";
    return;
  }
  careTeamList.innerHTML = `
    <article class="care-team-summary">
      <strong>${escapeHtml(contacts.length)} contact${contacts.length === 1 ? "" : "s"}</strong>
      <span>${escapeHtml(new Set(contacts.map((item) => item.role)).size)} role${new Set(contacts.map((item) => item.role)).size === 1 ? "" : "s"} saved</span>
    </article>
    ${contacts.map((contact) => `
      <article>
        <div>
          <strong>${escapeHtml(contact.name || contact.role)}</strong>
          <span>${escapeHtml(contact.role)} · ${escapeHtml(contact.action)}</span>
        </div>
        <p>${escapeHtml(contact.contact || "No contact method saved.")}</p>
        ${contact.notes ? `<p>${escapeHtml(contact.notes)}</p>` : ""}
        <small>${escapeHtml(getCareTeamNextStep(contact))}</small>
      </article>
    `).join("")}
  `;
}

function getCareTeamText() {
  const contacts = getCareTeamContacts();
  if (!contacts.length) return "CareWise AI care team contacts\nNo care team contacts saved yet.";
  return [
    "CareWise AI care team contacts",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety: contacts and questions are preparation notes only. Verify credentials, availability, insurance network, and medical appropriateness directly.",
    "",
    ...contacts.map((contact, index) => [
      `${index + 1}. ${contact.name || contact.role}`,
      `Role: ${contact.role}`,
      `Contact: ${contact.contact || "No contact method saved."}`,
      `Next action: ${contact.action}`,
      `Questions/notes: ${contact.notes || "No notes saved."}`,
      `Suggested next step: ${getCareTeamNextStep(contact)}`,
    ].join("\n")),
  ].join("\n\n");
}

function copyCareTeamContacts() {
  const text = getCareTeamText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      careTeamStatus.textContent = "Care team contacts copied.";
    })
    .catch(() => {
      careTeamStatus.textContent = "Copy unavailable. Use local JSON export to save care team contacts.";
    });
}

function getVisitBriefs() {
  try {
    return JSON.parse(localStorage.getItem("carewiseVisitBriefs") || "[]");
  } catch {
    return [];
  }
}

function getLatestVisitBrief() {
  return getVisitBriefs()[0] || null;
}

function getVisitBriefReadinessItems() {
  const symptoms = getSymptomTimeline();
  const reports = getReportHistory();
  const labs = getLabTrends();
  const medications = getMedications();
  const safetyChecks = getSafetyChecks();
  const mealPlans = getMealPlans();
  const contacts = getCareTeamContacts();
  const goals = getGoals();
  const barriers = getBarriers();
  return [
    { label: "Symptoms", ready: symptoms.length > 0, detail: symptoms.length ? `${symptoms.length} saved` : "Add timeline" },
    { label: "Reports", ready: reports.length > 0, detail: reports.length ? `${reports.length} saved` : "Upload or paste" },
    { label: "Labs", ready: labs.length > 0, detail: labs.length ? `${labs.length} tracked` : "Add values" },
    { label: "Meds", ready: medications.length > 0, detail: medications.length ? `${medications.length} saved` : "Add list" },
    { label: "Safety", ready: safetyChecks.length > 0, detail: safetyChecks.length ? `${safetyChecks[0].items.length} items` : "Run check" },
    { label: "Meals", ready: mealPlans.length > 0, detail: mealPlans.length ? `${mealPlans.length} planned` : "Build plan" },
    { label: "Questions", ready: contacts.length + goals.length + barriers.length > 0, detail: `${contacts.length + goals.length + barriers.length} prompts` },
  ];
}

function addLocalItem(key, item, limit) {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    items = [];
  }
  items.unshift(item);
  localStorage.setItem(key, JSON.stringify(items.slice(0, limit)));
}

function addSampleVisitBriefData() {
  const profile = getProfile();
  if (!profile.name) {
    setProfile({
      name: "Demo Patient",
      sex: "not_specified",
      height: "5 ft 8 in",
      weight: "170 lb",
      conditions: "High cholesterol risk, fatigue after poor sleep",
      medications: "Atorvastatin 10 mg demo entry",
      allergies: "No allergies entered",
    });
    saveProfile();
  }
  if (!getSymptomTimeline().length) {
    addLocalItem("carewiseSymptomTimeline", {
      id: `symptom-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      name: "Fatigue after poor sleep",
      change: "Same",
      severity: "Moderate",
      notes: "Started this week after several late nights. No emergency warning signs reported in this sample.",
      createdAt: new Date().toISOString(),
    }, 30);
  }
  if (!getMedications().length) {
    addLocalItem("carewiseMedications", {
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: "Atorvastatin",
      dose: "10 mg",
      timing: "Evening",
      refill: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString().slice(0, 10),
      notes: "Demo only. Ask a clinician or pharmacist before changing any medication.",
    }, 30);
  }
  if (!getReportHistory().length) {
    saveReportHistory({
      id: `local-report-${Date.now()}`,
      fileName: "Sample lipid panel notes",
      status: "local sample",
      riskLevel: "education_only",
      message: "Discuss cholesterol, sleep, nutrition, exercise, and medication questions with a licensed clinician.",
      nextSteps: [
        "Bring the original report to the visit.",
        "Ask which results need follow-up and when to repeat labs.",
      ],
      createdAt: new Date().toISOString(),
    });
  }
  if (!getLabTrends().length) {
    fillSampleLabTrends();
  }
  if (!getGoals().length) {
    addLocalItem("carewiseGoals", {
      id: `goal-${Date.now()}`,
      title: "Walk after dinner 3 days",
      category: "Movement",
      target: "10 minutes after dinner on Monday, Wednesday, and Saturday",
      progress: "Starting",
      priority: "Medium",
      notes: "Keep it realistic during a busy week.",
      createdAt: new Date().toISOString(),
    }, 24);
  }
  if (!getCareTeamContacts().length) {
    addLocalItem("carewiseCareTeamContacts", {
      id: `care-team-${Date.now()}`,
      name: "Primary care clinic",
      role: "Primary care",
      contact: "Patient portal or clinic phone",
      action: "Prepare visit questions",
      notes: "Ask which lab results need follow-up, whether dietitian referral is appropriate, and what symptoms should trigger urgent care.",
      createdAt: new Date().toISOString(),
    }, 30);
  }
  renderSymptomTimeline();
  renderMedications();
  renderReportHistory();
  renderGoals();
  renderCareTeamContacts();
  renderVisitBriefs();
  visitBriefStatus.textContent = "Sample visit data added. Build the brief when ready.";
  addAuditEvent("visit_brief_sample_added", "Sample visit preparation data added locally.");
  renderAuditTrail();
}

function getVisitBriefSnapshot() {
  const reports = getReportHistory();
  const labs = getLabTrends();
  const symptoms = getSymptomTimeline();
  const medications = getMedications();
  const safetyChecks = getSafetyChecks();
  const goals = getGoals();
  const barriers = getBarriers();
  const mealPlans = getMealPlans();
  const navigation = getNavigationPrepItems();
  const contacts = getCareTeamContacts();
  const checkins = getCheckins();
  const profile = getProfile();
  return {
    profile,
    reports: reports.slice(0, 3),
    labs: labs.slice(0, 8),
    symptoms: symptoms.slice(0, 5),
    medications: medications.slice(0, 8),
    safetyCheck: safetyChecks[0] || null,
    mealPlans: mealPlans.slice(0, 3),
    goals: goals.slice(0, 5),
    barriers: barriers.slice(0, 5),
    navigation: navigation.slice(0, 3),
    contacts: contacts.slice(0, 5),
    checkins: checkins.slice(0, 3),
  };
}

function getVisitBriefQuestions(snapshot) {
  const questions = [
    "Which findings or symptoms need follow-up, and what timing is appropriate?",
    "Are there any symptoms that should trigger urgent care or emergency services?",
  ];
  if (snapshot.reports.length) questions.push("Which report values matter most, and when should labs be repeated?");
  if (snapshot.labs.length) questions.push("Which tracked lab values need attention, repeat testing, lifestyle support, or medication review?");
  if (snapshot.medications.length || snapshot.profile.medications) questions.push("Should medication timing, refill plan, side effects, or interactions be reviewed with a clinician or pharmacist?");
  if (snapshot.safetyCheck) questions.push("Which safety checklist items should be reviewed by a clinician, pharmacist, or dietitian before changing habits or medications?");
  if (snapshot.mealPlans.length) questions.push("Is this meal and grocery plan appropriate for my labs, conditions, medications, allergies, budget, and schedule?");
  if (snapshot.goals.length) questions.push("Are the food, movement, sleep, and habit goals realistic for my health situation?");
  if (snapshot.barriers.length) questions.push("What support options could help with cost, time, food access, transportation, or stress barriers?");
  if (snapshot.navigation.length) questions.push("Do I need a referral, specialist, dietitian, pharmacy review, or insurance-network check?");
  return questions.slice(0, 8);
}

function buildVisitBriefText(snapshot) {
  const name = snapshot.profile.name || "Patient";
  const reportLines = snapshot.reports.length
    ? snapshot.reports.map((report) => `- ${report.fileName || report.id}: ${report.riskLevel || report.status || "saved"}${report.message ? `; ${report.message}` : ""}`)
    : ["- No reports saved yet."];
  const symptomLines = snapshot.symptoms.length
    ? snapshot.symptoms.map((item) => `- ${item.date || "No date"}: ${item.name || "Symptom entry"} (${item.change}, ${item.severity}). ${item.notes || "No notes saved."}`)
    : ["- No symptom timeline saved yet."];
  const labLines = snapshot.labs.length
    ? snapshot.labs.map((lab) => `- ${lab.date || "No date"}: ${lab.test || "Lab"} ${lab.value || "No value"} ${lab.unit || ""} (${lab.flag || "Not sure"}). ${lab.notes || getLabTrendSuggestion(lab)}`.trim())
    : ["- No lab values tracked yet."];
  const medicationLines = snapshot.medications.length
    ? snapshot.medications.map((med) => `- ${med.name}${med.dose ? `, ${med.dose}` : ""}${med.timing ? `, ${med.timing}` : ""}. ${med.notes || "No notes saved."}`)
    : [`- ${snapshot.profile.medications || "No medication list saved yet."}`];
  const safetyLines = snapshot.safetyCheck?.items?.length
    ? snapshot.safetyCheck.items.slice(0, 6).map((item) => `- ${item.topic} (${item.level}): ${item.action}`)
    : ["- No medication, allergy, and food safety checklist generated yet."];
  const mealPlanLines = snapshot.mealPlans.length
    ? snapshot.mealPlans.map((plan) => `- ${getDietStyleLabel(plan.preferences.dietStyle)}; ${plan.preferences.priority}; ${plan.preferences.prepTime} prep. ${plan.meals?.[0] || "No meal detail saved."}`)
    : ["- No meal and grocery plan saved yet."];
  const goalLines = snapshot.goals.length
    ? snapshot.goals.map((goal) => `- ${goal.title}: ${goal.target || "No target saved."} (${goal.progress || "progress not set"})`)
    : ["- No weekly goals saved yet."];
  const barrierLines = snapshot.barriers.length
    ? snapshot.barriers.map((barrier) => `- ${barrier.type}: ${barrier.relatedGoal || "No related goal"}; ${barrier.supportStep || barrier.notes || "No support step saved."}`)
    : ["- No barriers saved yet."];
  const contactLines = snapshot.contacts.length
    ? snapshot.contacts.map((contact) => `- ${contact.name || contact.role}: ${contact.action}. ${contact.notes || contact.contact || "No notes saved."}`)
    : ["- No care-team questions saved yet."];
  const checkinLines = snapshot.checkins.length
    ? snapshot.checkins.map((checkin) => `- ${checkin.week || "No date"}: symptoms ${checkin.symptoms || "not set"}, meals ${checkin.meals || "not set"}, exercise ${checkin.exercise || "not set"}, sleep ${checkin.sleep || "not set"}. ${checkin.notes || ""}`)
    : ["- No check-ins saved yet."];
  return [
    "CareWise AI clinician visit brief",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety scope: preparation support only. This is not a diagnosis, cure, prescription, emergency service, or insurance verification.",
    "",
    `Patient: ${name}`,
    `Known conditions/concerns: ${snapshot.profile.conditions || "Not entered"}`,
    `Allergies: ${snapshot.profile.allergies || "Not entered"}`,
    "",
    "Reports to discuss:",
    ...reportLines,
    "",
    "Lab values to review:",
    ...labLines,
    "",
    "Symptom timeline:",
    ...symptomLines,
    "",
    "Medication list to verify:",
    ...medicationLines,
    "",
    "Safety checklist to review:",
    ...safetyLines,
    "",
    "Meal plan to review:",
    ...mealPlanLines,
    "",
    "Recent check-ins:",
    ...checkinLines,
    "",
    "Goals and barriers:",
    ...goalLines,
    ...barrierLines,
    "",
    "Care-team notes/questions:",
    ...contactLines,
    "",
    "Questions to ask:",
    ...getVisitBriefQuestions(snapshot).map((question) => `- ${question}`),
    "",
    "Bring: original reports, medication bottles/list, allergy list, symptom timeline, insurance card if available, and this summary.",
  ].join("\n");
}

function buildVisitBrief() {
  const snapshot = getVisitBriefSnapshot();
  const text = buildVisitBriefText(snapshot);
  const brief = {
    id: `visit-brief-${Date.now()}`,
    createdAt: new Date().toISOString(),
    patientName: snapshot.profile.name || "Patient",
    counts: {
      reports: snapshot.reports.length,
      labs: snapshot.labs.length,
      symptoms: snapshot.symptoms.length,
      medications: snapshot.medications.length,
      safetyItems: snapshot.safetyCheck?.items?.length || 0,
      mealPlans: snapshot.mealPlans.length,
      goals: snapshot.goals.length,
      barriers: snapshot.barriers.length,
      contacts: snapshot.contacts.length,
    },
    questions: getVisitBriefQuestions(snapshot),
    text,
  };
  const briefs = getVisitBriefs();
  briefs.unshift(brief);
  localStorage.setItem("carewiseVisitBriefs", JSON.stringify(briefs.slice(0, 12)));
  visitBriefStatus.textContent = "Visit brief built. Copy it before the appointment or call.";
  addAuditEvent("visit_brief_built", `${brief.patientName} visit brief generated with ${brief.questions.length} questions.`);
  renderVisitBriefs();
  renderAuditTrail();
}

function renderVisitBriefs() {
  if (!visitBriefList || !visitBriefReadiness) return;
  const readiness = getVisitBriefReadinessItems();
  visitBriefReadiness.innerHTML = readiness.map((item) => `
    <article class="${item.ready ? "complete" : "pending"}">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </article>
  `).join("");
  const briefs = getVisitBriefs();
  const latest = briefs[0];
  visitBriefOutput.value = latest?.text || "";
  if (!briefs.length) {
    visitBriefList.innerHTML = "<p>No visit brief generated yet.</p>";
    return;
  }
  visitBriefList.innerHTML = `
    <article class="visit-brief-summary">
      <strong>${escapeHtml(briefs.length)} brief${briefs.length === 1 ? "" : "s"} saved</strong>
      <span>${escapeHtml(readiness.filter((item) => item.ready).length)}/${escapeHtml(readiness.length)} readiness inputs present</span>
    </article>
    ${briefs.slice(0, 4).map((brief) => `
      <article>
        <div>
          <strong>${escapeHtml(brief.patientName || "Patient")}</strong>
          <span>${escapeHtml(new Date(brief.createdAt).toLocaleString())}</span>
        </div>
        <p>${escapeHtml(brief.counts.symptoms)} symptoms · ${escapeHtml(brief.counts.reports)} reports · ${escapeHtml(brief.counts.labs || 0)} labs · ${escapeHtml(brief.counts.medications)} medications · ${escapeHtml(brief.counts.safetyItems || 0)} safety items · ${escapeHtml(brief.counts.mealPlans || 0)} meal plans · ${escapeHtml(brief.questions.length)} questions</p>
        <ul>${brief.questions.slice(0, 3).map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>
      </article>
    `).join("")}
  `;
}

function copyVisitBrief() {
  const latest = getLatestVisitBrief();
  const text = visitBriefOutput.value || latest?.text || "";
  if (!text) {
    visitBriefStatus.textContent = "Build a visit brief before copying.";
    return;
  }
  navigator.clipboard?.writeText(text)
    .then(() => {
      visitBriefStatus.textContent = "Visit brief copied.";
    })
    .catch(() => {
      visitBriefStatus.textContent = "Copy unavailable. Use local JSON export to save the visit brief.";
    });
}

function getCarePackets() {
  try {
    return JSON.parse(localStorage.getItem("carewiseCarePackets") || "[]");
  } catch {
    return [];
  }
}

function getLatestCarePacket() {
  return getCarePackets()[0] || null;
}

function getCarePacketReadinessItems() {
  const visitBrief = getLatestVisitBrief();
  const safety = getLatestSafetyCheck();
  const calendar = getMonthlyCalendars()[0];
  const dataCount = getMedications().length + getLabTrends().length + getGoals().length + getMealPlans().length + getCareTeamContacts().length;
  return [
    { label: "Visit brief", ready: Boolean(visitBrief), detail: visitBrief ? "Ready" : "Build brief" },
    { label: "Safety", ready: Boolean(safety), detail: safety ? `${safety.items.length} items` : "Run check" },
    { label: "Calendar", ready: Boolean(calendar), detail: calendar ? "4 weeks" : "Build month" },
    { label: "Data", ready: dataCount > 0, detail: dataCount ? `${dataCount} saved inputs` : "Add records" },
  ];
}

function addSampleCarePacketData() {
  addSampleVisitBriefData();
  if (!getSafetyChecks().length) runSafetyCheck();
  if (!getMonthlyCalendars().length) buildMonthlyCalendar();
  if (!getVisitBriefs().length) buildVisitBrief();
  renderCarePackets();
  carePacketStatus.textContent = "Sample packet data prepared. Build the care packet when ready.";
}

function buildCarePacketText() {
  const profile = getProfile();
  const visitBrief = getLatestVisitBrief();
  const safety = getLatestSafetyCheck();
  const calendar = getMonthlyCalendars()[0];
  const labs = getLabTrends().slice(0, 8);
  const meds = getMedications().slice(0, 8);
  const goals = getGoals().slice(0, 6);
  const barriers = getBarriers().slice(0, 5);
  const contacts = getCareTeamContacts().slice(0, 6);
  return [
    "CareWise AI care packet",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety scope: preparation and organization support only. This is not diagnosis, treatment, prescription, emergency care, insurance verification, or a substitute for licensed professional advice.",
    "",
    `Patient: ${profile.name || "Patient"}`,
    `Known concerns: ${profile.conditions || "Not entered"}`,
    `Allergies: ${profile.allergies || "Not entered"}`,
    "",
    "1. Clinician visit brief",
    visitBrief?.text || "No visit brief generated yet.",
    "",
    "2. Safety checklist",
    safety ? getSafetyCheckText() : "No medication, allergy, and food safety checklist generated yet.",
    "",
    "3. Lab values",
    labs.length ? labs.map((lab) => `- ${lab.date || "No date"}: ${lab.test} ${lab.value || "No value"} ${lab.unit || ""} (${lab.flag})`).join("\n") : "No lab values saved yet.",
    "",
    "4. Medications",
    meds.length ? meds.map((med) => `- ${med.name}: ${med.dose || "Dose missing"}; ${med.timing || "Timing missing"}; ${med.notes || "No notes"}`).join("\n") : "No medications saved yet.",
    "",
    "5. Monthly care calendar",
    calendar ? getMonthlyCalendarText() : "No 4-week care calendar generated yet.",
    "",
    "6. Goals and barriers",
    goals.length ? goals.map((goal) => `- Goal: ${goal.title}; ${goal.target || "No target"}; ${goal.progress}`).join("\n") : "No goals saved yet.",
    barriers.length ? barriers.map((barrier) => `- Barrier: ${barrier.type}; ${barrier.relatedGoal || "No related goal"}; ${barrier.supportStep || barrier.notes || "No support step"}`).join("\n") : "No barriers saved yet.",
    "",
    "7. Care team",
    contacts.length ? contacts.map((contact) => `- ${contact.name || contact.role}: ${contact.role}; ${contact.action}; ${contact.notes || contact.contact || "No notes"}`).join("\n") : "No care-team contacts saved yet.",
    "",
    "Before sharing: review for accuracy, remove anything you do not want to share, and use urgent care or emergency services for severe, new, unusual, or fast-worsening symptoms.",
  ].join("\n\n");
}

function buildCarePacket() {
  const text = buildCarePacketText();
  const readiness = getCarePacketReadinessItems();
  const packet = {
    id: `packet-${Date.now()}`,
    createdAt: new Date().toISOString(),
    patientName: getProfile().name || "Patient",
    readyCount: readiness.filter((item) => item.ready).length,
    total: readiness.length,
    text,
  };
  const packets = getCarePackets();
  packets.unshift(packet);
  localStorage.setItem("carewiseCarePackets", JSON.stringify(packets.slice(0, 12)));
  carePacketStatus.textContent = `Care packet built with ${packet.readyCount}/${packet.total} readiness inputs.`;
  addAuditEvent("care_packet_built", `${packet.patientName} care packet generated.`);
  renderCarePackets();
  renderAuditTrail();
}

function renderCarePackets() {
  if (!carePacketList || !carePacketReadiness) return;
  const readiness = getCarePacketReadinessItems();
  carePacketReadiness.innerHTML = readiness.map((item) => `
    <article class="${item.ready ? "complete" : "pending"}">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </article>
  `).join("");
  const packets = getCarePackets();
  const latest = packets[0];
  carePacketOutput.value = latest?.text || "";
  if (!packets.length) {
    carePacketList.innerHTML = "<p>No care packet generated yet.</p>";
    return;
  }
  carePacketList.innerHTML = `
    <article class="care-packet-summary">
      <strong>${escapeHtml(packets.length)} packet${packets.length === 1 ? "" : "s"} saved</strong>
      <span>${escapeHtml(latest.readyCount)}/${escapeHtml(latest.total)} readiness inputs</span>
    </article>
    ${packets.slice(0, 4).map((packet) => `
      <article>
        <div>
          <strong>${escapeHtml(packet.patientName)}</strong>
          <span>${escapeHtml(new Date(packet.createdAt).toLocaleString())}</span>
        </div>
        <p>${escapeHtml(packet.readyCount)}/${escapeHtml(packet.total)} inputs ready · ${escapeHtml(packet.text.length)} characters</p>
        <small>Review and remove sensitive details before sharing.</small>
      </article>
    `).join("")}
  `;
}

function copyCarePacket() {
  const latest = getLatestCarePacket();
  const text = carePacketOutput.value || latest?.text || "";
  if (!text) {
    carePacketStatus.textContent = "Build a care packet before copying.";
    return;
  }
  navigator.clipboard?.writeText(text)
    .then(() => {
      carePacketStatus.textContent = "Care packet copied.";
    })
    .catch(() => {
      carePacketStatus.textContent = "Copy unavailable. Use local JSON export to save care packets.";
    });
}

function getSupportRequests() {
  try {
    return JSON.parse(localStorage.getItem("carewiseSupportRequests") || "[]");
  } catch {
    return [];
  }
}

function getSupportForm() {
  return {
    id: `support-${Date.now()}`,
    type: document.querySelector("#support-type")?.value || "Technical issue",
    priority: document.querySelector("#support-priority")?.value || "Normal",
    email: document.querySelector("#support-email")?.value.trim() || authEmail || "Not provided",
    contactConsent: document.querySelector("#support-contact")?.value || "No",
    notes: document.querySelector("#support-notes")?.value.trim() || "",
    createdAt: new Date().toISOString(),
    status: "Open",
  };
}

function fillSampleSupportRequest() {
  document.querySelector("#support-type").value = "Report upload concern";
  document.querySelector("#support-priority").value = "High";
  document.querySelector("#support-email").value = authEmail || "patient@example.com";
  document.querySelector("#support-contact").value = "Yes";
  document.querySelector("#support-notes").value = "User uploaded a lab report but wants the summary language reviewed for clarity before sharing with a doctor.";
  supportStatus.textContent = "Sample support request filled. Save it when ready.";
}

function getSupportNextSteps(item) {
  const steps = [
    "Confirm the request can be handled in support without asking for unnecessary sensitive details.",
    "Send a plain-language acknowledgement and expected response window.",
  ];
  if (item.type === "Privacy or deletion") steps.push("Route to privacy workflow and verify identity before export or deletion actions.");
  if (item.type === "Billing question") steps.push("Confirm plan, payment status, and refund policy before making any promise.");
  if (item.type === "Clinician review request" || item.priority === "Needs clinician review") steps.push("Route to clinician review before patient-facing follow-up.");
  if (item.type === "Care plan feedback") steps.push("Review for unsafe wording, diagnosis claims, medication instructions, or missing clinician-review flags.");
  if (item.type === "Report upload concern") steps.push("Check upload status, file readability, and whether report analysis needs manual review.");
  if (item.priority === "Privacy-sensitive") steps.push("Avoid copying details into external tools until privacy process is ready.");
  return steps;
}

function saveSupportRequest() {
  const request = getSupportForm();
  const requests = getSupportRequests();
  requests.unshift(request);
  localStorage.setItem("carewiseSupportRequests", JSON.stringify(requests.slice(0, 30)));
  supportStatus.textContent = `${request.type} request saved locally. This prototype inbox is not monitored for emergencies.`;
  document.querySelector("#support-notes").value = "";
  addAuditEvent("support_request_saved", `${request.type} support request saved with ${request.priority} priority.`);
  renderSupportRequests();
  renderAuditTrail();
}

function renderSupportRequests() {
  if (!supportList) return;
  const requests = getSupportRequests();
  if (!requests.length) {
    supportList.innerHTML = "<p>No support requests saved yet.</p>";
    return;
  }
  supportList.innerHTML = requests.map((item) => `
    <article>
      <div>
        <strong>${escapeHtml(item.type)}</strong>
        <span>${escapeHtml(item.priority)} · ${escapeHtml(item.status || "Open")}</span>
      </div>
      <p>${escapeHtml(item.email)} · Contact allowed: ${escapeHtml(item.contactConsent || "No")}</p>
      <p>${escapeHtml(item.notes || "No request details saved.")}</p>
      <ul>${getSupportNextSteps(item).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function getSupportRequestsText() {
  const requests = getSupportRequests();
  if (!requests.length) return "CareWise AI support inbox\nNo support requests saved yet.";
  return [
    "CareWise AI support inbox",
    `Generated: ${new Date().toLocaleString()}`,
    "Safety: this inbox is for product support only. Severe or fast-worsening symptoms should use emergency services or a qualified clinician.",
    "",
    ...requests.map((item, index) => [
      `${index + 1}. ${item.type}`,
      `Priority: ${item.priority}`,
      `Status: ${item.status || "Open"}`,
      `Email: ${item.email}`,
      `Consent to contact: ${item.contactConsent}`,
      `Notes: ${item.notes || "No notes saved."}`,
      "Next steps:",
      ...getSupportNextSteps(item).map((step) => `- ${step}`),
    ].join("\n")),
  ].join("\n\n");
}

function copySupportRequests() {
  const text = getSupportRequestsText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      supportStatus.textContent = "Support inbox copied.";
    })
    .catch(() => {
      supportStatus.textContent = "Copy unavailable. Use local JSON export to save support requests.";
    });
}

function getQaReports() {
  try {
    return JSON.parse(localStorage.getItem("carewiseQaReports") || "[]");
  } catch {
    return [];
  }
}

function getLatestQaReport() {
  return getQaReports()[0] || null;
}

function getQaChecks() {
  const consent = localStorage.getItem("carewiseConsent");
  const reports = getReportHistory();
  const labCount = getLabTrends().length;
  const mealCount = getMealPlans().length;
  const safetyCheckCount = getSafetyChecks().length;
  const monthlyCalendarCount = getMonthlyCalendars().length;
  const savedPlansCount = getSavedPlans().length;
  const reviewQueueCount = getReviewQueue().length;
  const supportCount = getSupportRequests().length;
  const visitBriefCount = getVisitBriefs().length;
  const safetyEval = getLatestReportEvaluation();
  const safetyPassed = safetyEval.length && safetyEval.every((item) => item.passed);
  const safeCopyReady = getSafetyLanguageReady();
  const qaChecks = [
    {
      label: "Account session",
      ready: Boolean(authToken && authEmail),
      detail: authToken && authEmail ? `Signed in as ${authEmail}` : "Create or log in before backend demos.",
    },
    {
      label: "Consent recorded",
      ready: Boolean(consent),
      detail: consent ? "Consent and medical-limit acknowledgement exists." : "Record consent before report or care-plan testing.",
    },
    {
      label: "Backend patient sync",
      ready: Boolean(backendPatientId),
      detail: backendPatientId ? `Patient ID ${backendPatientId}` : "Sync the intake profile to backend.",
    },
    {
      label: "Report flow",
      ready: Boolean(latestReportId || reports.length),
      detail: latestReportId ? `Latest report ${latestReportId}` : reports.length ? `${reports.length} report item saved locally.` : "Upload or paste a sample report, then analyze it.",
    },
    {
      label: "Lab tracker",
      ready: Boolean(labCount),
      detail: labCount ? `${labCount} lab value(s) tracked for visit follow-up.` : "Save key lab values from a report before serious demos.",
    },
    {
      label: "Saved care plan",
      ready: Boolean(savedPlansCount || lastGeneratedPlan),
      detail: savedPlansCount ? `${savedPlansCount} saved plan(s).` : lastGeneratedPlan ? "Generated plan is available but not saved." : "Generate and save a care plan.",
    },
    {
      label: "Meal planner",
      ready: Boolean(mealCount),
      detail: mealCount ? `${mealCount} meal and grocery plan(s) saved.` : "Build a realistic meal plan for diet, budget, and prep-time testing.",
    },
    {
      label: "Safety checklist",
      ready: Boolean(safetyCheckCount),
      detail: safetyCheckCount ? `${safetyCheckCount} medication/allergy/food safety check(s) saved.` : "Run a pre-visit safety checklist before demos.",
    },
    {
      label: "Monthly calendar",
      ready: Boolean(monthlyCalendarCount),
      detail: monthlyCalendarCount ? `${monthlyCalendarCount} 4-week care calendar(s) saved.` : "Build a monthly care calendar from saved goals and follow-up items.",
    },
    {
      label: "Clinician review",
      ready: Boolean(getReviewProofReady() || reviewQueueCount),
      detail: getReviewProofReady() ? "Review proof or decision receipt exists." : reviewQueueCount ? `${reviewQueueCount} local review item(s) queued.` : "Create or sync a review item before serious demos.",
    },
    {
      label: "Safety wording",
      ready: Boolean(safeCopyReady),
      detail: safeCopyReady ? "Disclaimer and non-diagnostic language detected." : "Review copy for diagnosis, cure, prescription, and emergency-replacement claims.",
    },
    {
      label: "Report safety eval",
      ready: Boolean(safetyPassed),
      detail: safetyEval.length ? `${safetyEval.filter((item) => item.passed).length}/${safetyEval.length} safety samples passed.` : "Run the report safety evaluation.",
    },
    {
      label: "Support path",
      ready: Boolean(supportCount),
      detail: supportCount ? `${supportCount} support request(s) available.` : "Save at least one support request sample.",
    },
    {
      label: "Visit brief",
      ready: Boolean(visitBriefCount),
      detail: visitBriefCount ? `${visitBriefCount} clinician visit brief(s) generated.` : "Build a visit brief from symptoms, reports, medications, goals, and questions.",
    },
    {
      label: "Privacy controls",
      ready: Boolean(document.querySelector("#export-data") && document.querySelector("#request-delete-data")),
      detail: "Local export, backend export, local clear, and deletion request controls are present.",
    },
  ];
  return qaChecks;
}

function runQaChecklist() {
  const checks = getQaChecks();
  const readyCount = checks.filter((item) => item.ready).length;
  const report = {
    id: `qa-${Date.now()}`,
    createdAt: new Date().toISOString(),
    readyCount,
    total: checks.length,
    status: readyCount === checks.length ? "Ready for controlled MVP demo" : "Needs follow-up before serious demo",
    checks,
  };
  const reports = getQaReports();
  reports.unshift(report);
  localStorage.setItem("carewiseQaReports", JSON.stringify(reports.slice(0, 12)));
  qaStatus.textContent = `${readyCount}/${checks.length} QA checks ready. ${report.status}.`;
  addAuditEvent("qa_checklist_run", `MVP QA checklist completed with ${readyCount}/${checks.length} checks ready.`);
  renderQaReport();
  renderAuditTrail();
}

function renderQaReport() {
  if (!qaResults) return;
  const report = getLatestQaReport();
  if (!report) {
    qaResults.innerHTML = "<p>No QA report generated yet.</p>";
    return;
  }
  qaResults.innerHTML = `
    <article class="qa-summary">
      <strong>${escapeHtml(report.readyCount)}/${escapeHtml(report.total)} checks ready</strong>
      <span>${escapeHtml(report.status)}</span>
    </article>
    ${report.checks.map((item) => `
      <article class="${item.ready ? "complete" : "pending"}">
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <b>${item.ready ? "Ready" : "Needs work"}</b>
        </div>
        <span>${escapeHtml(item.detail)}</span>
      </article>
    `).join("")}
  `;
}

function getQaReportText() {
  const report = getLatestQaReport();
  if (!report) return "CareWise AI QA report\nNo QA report generated yet.";
  return [
    "CareWise AI MVP QA report",
    `Generated: ${new Date(report.createdAt).toLocaleString()}`,
    `Status: ${report.status}`,
    `Readiness: ${report.readyCount}/${report.total}`,
    "Safety scope: educational planning support only; not diagnosis, cure, prescription, insurance verification, or emergency care.",
    "",
    ...report.checks.map((item) => `${item.ready ? "[READY]" : "[NEEDS WORK]"} ${item.label}: ${item.detail}`),
  ].join("\n");
}

function copyQaReport() {
  const text = getQaReportText();
  navigator.clipboard?.writeText(text)
    .then(() => {
      qaStatus.textContent = "QA report copied.";
    })
    .catch(() => {
      qaStatus.textContent = "Copy unavailable. Run local JSON export to save the QA report.";
    });
}

function buildDoctorSummary(context) {
  const diseaseNames = context.diseasePlans.map((plan) => plan.name).join(", ") || "Not matched";
  const profile = context.profile;
  const profileLines = [
    `Patient: ${profile.name || "Not provided"}`,
    `Age: ${context.age || "Not provided"}`,
    `Sex at birth: ${profile.sex || "Not provided"}`,
    `Height/weight: ${profile.height || "Not provided"} / ${profile.weight || "Not provided"}`,
    `Known conditions: ${profile.conditions || "Not provided"}`,
    `Medications: ${profile.medications || "Not provided"}`,
    `Allergies: ${profile.allergies || "Not provided"}`,
  ];
  const planLines = [
    `Main concern: ${context.symptoms || "Not provided"}`,
    `Safety status: ${context.urgentMatches.length ? `Urgent flags: ${context.urgentMatches.join(", ")}` : "No emergency phrase detected by prototype"}`,
    `Care path: ${context.urgentMatches.length ? "Emergency routing" : context.rules[0].label}`,
    `Matched disease plans: ${diseaseNames}`,
    `Diet/activity preferences: ${getDietStyleLabel(context.dietStyle)}; ${context.activityLevel}; ${context.exerciseGoal}; ${context.prepTime}; ${context.calorieGoal}`,
    `Insurance/location: ${context.insurance}; ${context.location}`,
    `Goals: ${context.goals.join(", ") || "Not provided"}`,
  ];
  const questions = [
    "What symptoms need urgent care for this patient?",
    "Are any medications, supplements, or foods unsafe with the current medication list?",
    "Is the diet plan appropriate for the patient's conditions, labs, allergies, and budget?",
    "What exercise level is safe right now?",
    "Which labs, screenings, referrals, or follow-up visits should be scheduled?",
  ];

  return [
    "CAREWISE VISIT SUMMARY",
    "This is not a diagnosis. Please review with a licensed clinician.",
    "",
    "PROFILE",
    ...profileLines,
    "",
    "CURRENT PLAN",
    ...planLines,
    "",
    "QUESTIONS FOR CLINICIAN",
    ...questions.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");
}

function copyDoctorSummary() {
  const summary = document.querySelector("#doctor-summary")?.textContent || "";
  const status = document.querySelector("#save-status");
  if (!summary) return;
  navigator.clipboard?.writeText(summary)
    .then(() => {
      if (status) status.textContent = "Doctor summary copied.";
    })
    .catch(() => {
      if (status) status.textContent = "Copy unavailable. Select the summary text manually.";
    });
}

function hasHypertensiveCrisis(text) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  const slashMatch = normalized.match(/\b(1[8-9]\d|[2-9]\d{2})\s*(?:\/|over)\s*(1[2-9]\d|[2-9]\d{2})\b/);
  if (slashMatch) return true;

  const systolic = normalized.match(/(?:systolic|blood pressure|bp)[^\d]{0,18}(1[8-9]\d|[2-9]\d{2})/);
  const diastolic = normalized.match(/(?:diastolic|over)[^\d]{0,18}(1[2-9]\d|[2-9]\d{2})/);
  return Boolean(systolic && diastolic);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

const HEALTH_RECORD_KEY = "carewiseHealthRecord";
const HEALTH_RECORD_TYPES = {
  condition: { label: "Condition", plural: "Ongoing conditions" },
  medicine: { label: "Medicine", plural: "Current medicines" },
  reaction: { label: "Did not suit me", plural: "Did not suit me" },
  habit: { label: "Habit", plural: "Current habits" },
  procedure: { label: "Surgery or visit", plural: "Surgery and visits" },
};

function getHealthRecord() {
  try {
    const items = JSON.parse(localStorage.getItem(HEALTH_RECORD_KEY) || "[]");
    return Array.isArray(items) ? items.filter((item) => item && HEALTH_RECORD_TYPES[item.type] && item.name) : [];
  } catch {
    return [];
  }
}

function saveHealthRecord(items) {
  try {
    localStorage.setItem(HEALTH_RECORD_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function isRecordItemCurrent(item) {
  return item.type === "reaction" || Boolean(item.ongoing) || !item.end;
}

function formatRecordMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value || "")) return "";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatRecordRange(item) {
  const start = formatRecordMonth(item.start);
  if (item.type === "reaction") return start ? `Noted ${start}` : "Date not recorded";
  if (start && !item.ongoing && item.end === item.start) return start;
  const end = item.ongoing || !item.end ? "now" : formatRecordMonth(item.end);
  return start ? `${start} to ${end}` : end === "now" ? "Ongoing" : `Until ${end}`;
}

function getHealthRecordPeople(items = getHealthRecord()) {
  const people = new Set(getReportPeople());
  items.forEach((item) => people.add(normalizeReportPerson(item.person)));
  return ["Me", ...[...people].filter((person) => person !== "Me")];
}

function getHealthRecordFor(person) {
  return getHealthRecord().filter((item) => normalizeReportPerson(item.person) === person);
}

function buildHealthRecordSummary(items) {
  return {
    conditions: items.filter((item) => item.type === "condition" && isRecordItemCurrent(item)),
    medicines: items.filter((item) => item.type === "medicine" && isRecordItemCurrent(item)),
    reactions: items.filter((item) => item.type === "reaction"),
  };
}

function renderHealthRecord(preferredPerson = "") {
  const timeline = document.querySelector("#record-timeline");
  if (!timeline) return;
  const personSelect = document.querySelector("#record-person-filter");
  const people = getHealthRecordPeople();
  const wanted = typeof preferredPerson === "string" && preferredPerson ? preferredPerson : personSelect.value;
  const person = people.includes(wanted) ? wanted : "Me";
  personSelect.innerHTML = people.map((name) => `<option value="${escapeHtml(name)}"${name === person ? " selected" : ""}>${escapeHtml(name)}</option>`).join("");

  const items = getHealthRecordFor(person);
  const summary = buildHealthRecordSummary(items);
  const card = (title, list, empty) => `
    <article class="record-summary-card${title === "Did not suit me" && list.length ? " record-summary-warn" : ""}">
      <strong>${escapeHtml(title)}</strong>
      ${list.length ? `<ul>${list.map((item) => `<li>${escapeHtml(item.name)}${item.notes ? ` <span>${escapeHtml(item.notes)}</span>` : ""}</li>`).join("")}</ul>` : `<p>${escapeHtml(empty)}</p>`}
    </article>`;
  document.querySelector("#record-summary").innerHTML = [
    card("Ongoing conditions", summary.conditions, "None recorded"),
    card("Current medicines", summary.medicines, "None recorded"),
    card("Did not suit me", summary.reactions, "None recorded"),
  ].join("");

  const typeFilter = document.querySelector("#record-type-filter").value;
  const shown = items
    .filter((item) => !typeFilter || item.type === typeFilter)
    .sort((a, b) => String(b.start || "").localeCompare(String(a.start || "")));
  if (!shown.length) {
    timeline.innerHTML = `<p class="record-empty">${items.length ? "Nothing of this type yet." : `No health history saved for ${escapeHtml(person)} yet. Add an entry above, or try the sample 20-year history.`}</p>`;
    return;
  }
  const groups = new Map();
  shown.forEach((item) => {
    const year = /^\d{4}/.test(item.start || "") ? item.start.slice(0, 4) : "Date not recorded";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(item);
  });
  timeline.innerHTML = [...groups].map(([year, list]) => `
    <div class="record-year">
      <h4>${escapeHtml(year)}</h4>
      ${list.map((item) => `
        <article class="record-item record-${escapeHtml(item.type)}">
          <div>
            <span class="record-chip">${escapeHtml(HEALTH_RECORD_TYPES[item.type].label)}</span>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(formatRecordRange(item))}</small>
            ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ""}
          </div>
          <button class="secondary-button compact" type="button" data-record-delete="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">Remove</button>
        </article>`).join("")}
    </div>`).join("");
}

function addHealthRecordItem(item) {
  const items = getHealthRecord();
  items.push({ id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString(), ...item });
  return saveHealthRecord(items);
}

function saveHealthRecordFromForm(event) {
  event.preventDefault();
  const status = document.querySelector("#record-status");
  const name = document.querySelector("#record-name").value.trim();
  if (!name) {
    status.textContent = "Add a name first, for example the condition or medicine.";
    return;
  }
  const type = document.querySelector("#record-type").value;
  const start = document.querySelector("#record-start").value;
  const ongoing = document.querySelector("#record-ongoing").checked;
  const end = ongoing ? "" : document.querySelector("#record-end").value;
  if (start && end && end < start) {
    status.textContent = "The end date is before the start date. Please check the dates.";
    return;
  }
  const person = normalizeReportPerson(document.querySelector("#record-person").value);
  const saved = addHealthRecordItem({ type, name, person, start, end, ongoing: type === "reaction" ? false : ongoing, notes: document.querySelector("#record-notes").value.trim().slice(0, 400) });
  if (!saved) {
    status.textContent = "This browser could not save the record. Check that site storage is allowed.";
    return;
  }
  document.querySelector("#record-name").value = "";
  document.querySelector("#record-notes").value = "";
  document.querySelector("#record-end").value = "";
  status.textContent = `Saved "${name}" to ${person === "Me" ? "your" : `${person}'s`} health record.`;
  renderHealthRecord(person);
}

function getSampleHealthHistory() {
  // Synthetic example for demos; not a real person.
  return [
    { type: "procedure", name: "Appendix removed (appendectomy)", start: "2006-03", end: "2006-03", ongoing: false, notes: "Two nights in hospital, recovered fully." },
    { type: "reaction", name: "Penicillin", start: "2009-07", notes: "Itchy rash after 2 days. Doctor advised avoiding penicillin." },
    { type: "habit", name: "Smoking, about 10 a day", start: "2008-01", end: "2018-06", ongoing: false, notes: "Quit in 2018." },
    { type: "condition", name: "High blood pressure", start: "2015-02", ongoing: true, notes: "Checked every 6 months." },
    { type: "medicine", name: "Lisinopril 10 mg", start: "2015-02", end: "2016-01", ongoing: false, notes: "Stopped because of a dry cough." },
    { type: "reaction", name: "Lisinopril", start: "2016-01", notes: "Dry cough that went away after stopping." },
    { type: "medicine", name: "Amlodipine 5 mg, once a day", start: "2016-01", ongoing: true, notes: "Morning, with food." },
    { type: "habit", name: "Walking 30 minutes, 5 days a week", start: "2019-04", ongoing: true, notes: "" },
    { type: "condition", name: "Prediabetes (A1C 5.9%)", start: "2021-09", ongoing: true, notes: "Repeat A1C every year." },
    { type: "procedure", name: "Colonoscopy screening", start: "2024-05", end: "2024-05", ongoing: false, notes: "Normal result. Next in 10 years." },
  ];
}

function addSampleHealthHistory() {
  const person = normalizeReportPerson(document.querySelector("#record-person").value);
  const items = getHealthRecord().filter((item) => !(item.sample && normalizeReportPerson(item.person) === person));
  const stamp = Date.now();
  getSampleHealthHistory().forEach((item, index) => items.push({ id: `rec-sample-${stamp}-${index}`, createdAt: new Date().toISOString(), person, sample: true, ...item }));
  saveHealthRecord(items);
  document.querySelector("#record-status").textContent = `Added a sample 20-year history for ${person}. It is made-up example data.`;
  renderHealthRecord(person);
}

function deleteHealthRecordItem(id) {
  saveHealthRecord(getHealthRecord().filter((item) => item.id !== id));
  renderHealthRecord();
}

function exportHealthRecord() {
  const blob = new Blob([JSON.stringify({ app: "CareWise", kind: "health-record", version: 1, exportedAt: new Date().toISOString(), items: getHealthRecord() }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `carewise-health-record-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  document.querySelector("#record-status").textContent = "Backup downloaded. Keep it somewhere safe; it contains your health history.";
}

async function importHealthRecord(file) {
  const status = document.querySelector("#record-status");
  try {
    const data = JSON.parse(await file.text());
    const incoming = (Array.isArray(data) ? data : data.items || []).filter((item) => item && HEALTH_RECORD_TYPES[item.type] && item.name && item.id);
    const items = getHealthRecord();
    const known = new Set(items.map((item) => item.id));
    const added = incoming.filter((item) => !known.has(item.id)).map((item) => ({
      id: String(item.id).slice(0, 80),
      type: item.type,
      name: String(item.name).slice(0, 80),
      person: normalizeReportPerson(item.person),
      start: /^\d{4}-\d{2}$/.test(item.start || "") ? item.start : "",
      end: /^\d{4}-\d{2}$/.test(item.end || "") ? item.end : "",
      ongoing: Boolean(item.ongoing),
      notes: String(item.notes || "").slice(0, 400),
      sample: Boolean(item.sample),
      createdAt: String(item.createdAt || ""),
    }));
    saveHealthRecord([...items, ...added]);
    status.textContent = `Restored ${added.length} ${added.length === 1 ? "entry" : "entries"} from the backup.`;
    renderHealthRecord();
  } catch {
    status.textContent = "That file is not a CareWise health record backup.";
  }
}

function buildHealthHistoryBriefSection(person) {
  const summary = buildHealthRecordSummary(getHealthRecordFor(person));
  if (!summary.conditions.length && !summary.medicines.length && !summary.reactions.length) return "";
  const list = (items) => items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item.name)}${item.start ? ` (since ${escapeHtml(formatRecordMonth(item.start))})` : ""}${item.notes ? `: ${escapeHtml(item.notes)}` : ""}</li>`).join("")}</ul>` : "<p>None recorded.</p>";
  return `<h2>Health history (entered by the patient)</h2>
<table><tr><th>Ongoing conditions</th><th>Current medicines</th><th>Did not suit me</th></tr>
<tr><td>${list(summary.conditions)}</td><td>${list(summary.medicines)}</td><td>${list(summary.reactions)}</td></tr></table>`;
}

document.querySelector("#record-form")?.addEventListener("submit", saveHealthRecordFromForm);
document.querySelector("#record-sample")?.addEventListener("click", addSampleHealthHistory);
document.querySelector("#record-export")?.addEventListener("click", exportHealthRecord);
document.querySelector("#record-person-filter")?.addEventListener("change", () => renderHealthRecord());
document.querySelector("#record-type-filter")?.addEventListener("change", () => renderHealthRecord());
document.querySelector("#record-import")?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importHealthRecord(file);
  event.target.value = "";
});
document.querySelector("#record-ongoing")?.addEventListener("change", (event) => {
  document.querySelector("#record-end").disabled = event.target.checked;
});
document.querySelector("#record-type")?.addEventListener("change", (event) => {
  const reaction = event.target.value === "reaction";
  document.querySelector("#record-ongoing").closest("label").hidden = reaction;
  document.querySelector("#record-end").closest("label").hidden = reaction;
});
document.querySelector("#record-timeline")?.addEventListener("click", (event) => {
  const id = event.target.closest("[data-record-delete]")?.dataset.recordDelete;
  if (id) deleteHealthRecordItem(id);
});
if (document.querySelector("#record-end")) document.querySelector("#record-end").disabled = true;
renderHealthRecord();

function registerCareWiseServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(window.location.protocol)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

registerCareWiseServiceWorker();
