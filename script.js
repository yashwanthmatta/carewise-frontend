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
const reportResults = document.querySelector("#report-results");
const paymentBadge = document.querySelector("#payment-badge");
const paymentStatus = document.querySelector("#payment-status");
const dashboardStats = document.querySelector("#dashboard-stats");
const profileStatus = document.querySelector("#profile-status");
const savedPlans = document.querySelector("#saved-plans");
const checkinStatus = document.querySelector("#checkin-status");
const checkinHistory = document.querySelector("#checkin-history");
const medicationStatus = document.querySelector("#medication-status");
const medicationList = document.querySelector("#medication-list");
const reviewQueue = document.querySelector("#review-queue");
const reviewStatus = document.querySelector("#review-status");
const auditTrail = document.querySelector("#audit-trail");
const exportStatus = document.querySelector("#export-status");
const exportOutput = document.querySelector("#export-output");
const securityReadiness = document.querySelector("#security-readiness");

loadProfile();
loadConsent();
initializeCheckinDate();
renderSavedPlans();
renderCheckins();
renderMedications();
renderReviewQueue();
renderAuditTrail();
renderReportHistory();
renderDashboardStats();
initializeAccountPanel();
checkBackend(false);

document.querySelector("#signup").addEventListener("click", () => {
  signup();
});

document.querySelector("#login").addEventListener("click", () => {
  login();
});

document.querySelector("#logout").addEventListener("click", () => {
  logout();
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

document.querySelector("#sync-plan").addEventListener("click", () => {
  syncLatestPlanToBackend();
});

document.querySelector("#load-audit-events").addEventListener("click", () => {
  loadBackendAuditEvents();
});

document.querySelector("#report-file").addEventListener("change", () => {
  handleReportFileSelection();
});

document.querySelector("#upload-report").addEventListener("click", () => {
  uploadReport();
});

document.querySelector("#analyze-report").addEventListener("click", () => {
  analyzeLatestReport();
});

document.querySelector("#load-reports").addEventListener("click", () => {
  loadReports();
});

document.querySelector("#save-profile").addEventListener("click", () => {
  saveProfile();
  profileStatus.textContent = "Profile saved on this device.";
  syncProfileToBackend(false);
});

document.querySelector("#clear-saved").addEventListener("click", () => {
  localStorage.removeItem("carewiseSavedPlans");
  renderSavedPlans();
});

document.querySelector("#save-checkin").addEventListener("click", () => {
  saveCheckin();
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
  if (document.querySelector("#privacy-consent").checked) recordConsentToBackend(false);
});

document.querySelector("#save-medication").addEventListener("click", () => {
  saveMedication();
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

document.querySelector("#load-backend-review").addEventListener("click", () => {
  loadBackendReviewQueue();
});

document.querySelector("#load-admin-summary").addEventListener("click", () => {
  loadAdminSummary();
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

document.querySelector("#export-data").addEventListener("click", () => {
  exportLocalData(false);
});

document.querySelector("#copy-data").addEventListener("click", () => {
  exportLocalData(true);
});

document.querySelector("#export-backend-data").addEventListener("click", () => {
  exportBackendData();
});

document.querySelector("#request-delete-data").addEventListener("click", () => {
  requestBackendDataDeletion();
});

document.querySelector("#clear-all-data").addEventListener("click", () => {
  ["carewiseProfile", "carewiseSavedPlans", "carewiseCheckins", "carewiseMedications", "carewiseReviewQueue", "carewiseAuditEvents", "carewiseConsent", "carewiseBackendPatientId", "carewiseAuthToken", "carewiseAuthEmail", "carewiseReports", "carewiseLatestReportId", "carewiseCheckoutUrl", "carewiseAdminSummary", "carewiseBackendReviewCount"].forEach((key) => localStorage.removeItem(key));
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
  renderCheckins();
  renderMedications();
  renderReviewQueue();
  renderAuditTrail();
  renderReportHistory();
  renderDashboardStats();
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
    addReviewQueueItem(context);
    syncLatestPlanToBackend(false);
    results.innerHTML = [
      renderSafetyCard(urgentMatches),
      renderRoutinePausedCard(location),
      renderRiskCard(risk),
      renderPlanActionsCard(),
    ].join("");
    return;
  }

  lastGeneratedPlan = createSavedPlan(context, planDetails[recommendedPlan].name);
  results.innerHTML = [
    renderSafetyCard(urgentMatches),
    renderRiskCard(risk),
    renderCareCard(rules, goals),
    renderDiseasePlanCard(diseasePlans, dietStyle, priority),
    renderProsConsCard(diseasePlans, dietStyle, activityLevel, calorieGoal),
    renderExerciseCard(activityLevel, exerciseGoal, diseasePlans),
    renderMealPrepCard(dietStyle, priority, prepTime, calorieGoal),
    renderVarietyCard(dietStyle, priority),
    renderMedicationCard(symptoms),
    renderLifestyleCard(rules),
    renderPlanCard(recommendedPlan, insurance),
    renderDoctorCard(location, rules),
    renderDoctorVisitSummaryCard(context),
    renderPlanActionsCard(),
  ].join("");

  if (risk.level !== "routine") addReviewQueueItem(context);
  syncLatestPlanToBackend(false);
});

results.addEventListener("click", (event) => {
  if (event.target.matches("#save-current-plan")) {
    saveCurrentPlan();
  }
  if (event.target.matches("#copy-visit-summary")) {
    copyDoctorSummary();
  }
});

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
      <button id="save-current-plan" class="primary-button" type="button">Save current plan</button>
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
  await checkBackend(false);
}

async function signup() {
  const payload = getAuthPayload();
  if (!validateAuthPayload(payload)) return;
  try {
    const response = await apiPost("/auth/signup", payload, { skipAuth: true });
    await saveAuthToken(response, "signup");
  } catch (error) {
    updateAuthStatus(error.message.includes("400") ? "Account may already exist. Try Log in." : "Signup failed. Check backend logs and try again.");
  }
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
  } catch {
    updateAuthStatus("Login failed. Check email, password, and backend status.");
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
    return true;
  } catch {
    setBackendStatus(false, "Backend is offline. Local browser storage is still active.");
    backendReadiness = {};
    renderSecurityReadiness();
    return false;
  }
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
  } catch {
    backendFeatures = {};
    renderSecurityReadiness();
  }
}

async function loadBackendReadiness() {
  try {
    backendReadiness = await apiGet("/ready");
  } catch {
    backendReadiness = {};
  }
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
      return;
    }
    if (showStatus) setBackendStatus(true, `Profile linked to backend patient ${patientId}.`);
  } catch {
    setBackendStatus(false, "Profile sync failed. Local storage is still active.");
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

async function syncLatestPlanToBackend(showStatus = true) {
  try {
    if (!lastGeneratedPlan) {
      if (showStatus) setBackendStatus(backendAvailable, "Generate a care plan before syncing.");
      return;
    }
    const patientId = await ensureBackendPatient(false);
    if (!patientId) {
      if (showStatus) setBackendStatus(false, "Start the backend before syncing a care plan.");
      return;
    }
    const response = await apiPost("/care-plans/generate", latestPlanToBackendPayload(lastGeneratedPlan, patientId));
    lastGeneratedPlan.backendCarePlanId = response.id;
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
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    reportStatus.textContent = "Reading text report from file.";
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector("#report-text").value = String(reader.result || "").slice(0, 12000);
      reportStatus.textContent = "Text report loaded. Save it to analyze.";
    };
    reader.onerror = () => {
      reportStatus.textContent = "Could not read the text file. Paste the report text manually.";
    };
    reader.readAsText(file);
    return;
  }
  reportStatus.textContent = "File selected. Add pasted/OCR text if you want a stronger analysis, then upload securely.";
}

function getReportHistory() {
  try {
    return JSON.parse(localStorage.getItem("carewiseReports") || "[]");
  } catch {
    return [];
  }
}

function saveReportHistory(report) {
  const reports = getReportHistory();
  reports.unshift(report);
  localStorage.setItem("carewiseReports", JSON.stringify(reports.slice(0, 20)));
  renderReportHistory();
  renderDashboardStats();
}

function renderReportHistory() {
  const reports = getReportHistory();
  reportBadge.textContent = latestReportId ? "Report ready" : reportFeatureLabel();
  reportBadge.className = `sync-badge ${latestReportId ? "online" : "offline"}`;
  if (!reports.length) {
    reportResults.innerHTML = "<p>No report analysis yet.</p>";
    return;
  }
  reportResults.innerHTML = reports.map((report) => `
    <article class="saved-plan-row">
      <div>
        <strong>${escapeHtml(report.fileName || "Untitled report")}</strong>
        <span>${escapeHtml(report.status || "uploaded")} · ${escapeHtml(new Date(report.createdAt).toLocaleString())}</span>
      </div>
      ${report.storageUrl ? `<p><strong>Storage:</strong> ${escapeHtml(report.storageUrl.startsWith("s3://") ? "Private cloud storage" : "Backend storage")} ${report.fileSizeBytes ? `· ${Math.round(Number(report.fileSizeBytes) / 1024) || 1} KB` : ""}</p>` : ""}
      ${report.riskLevel ? `<p><strong>Risk:</strong> ${escapeHtml(report.riskLevel)} · ${escapeHtml(report.message || "Report education summary generated.")}</p>` : "<p>Uploaded. Analysis not run yet.</p>"}
      ${report.nextSteps?.length ? `<ul>${report.nextSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    </article>
  `).join("");
}

function reportFeatureLabel() {
  if (backendFeatures.image_ocr) return "OCR ready";
  if (backendFeatures.report_uploads) return "Cloud storage ready";
  return "Backend check needed";
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
      reportStatus.textContent = "Sign in before analyzing a report.";
      return;
    }
    if (!latestReportId) {
      reportStatus.textContent = "Upload a report before analysis.";
      return;
    }
    const reportText = document.querySelector("#report-text").value.trim();
    if (reportText) {
      reportStatus.textContent = "Saving readable report text before analysis.";
      await apiPut(`/reports/${latestReportId}/text`, { report_text: reportText });
    }
    reportStatus.textContent = "Analyzing report through CareWise backend.";
    const response = await apiPost(`/reports/${latestReportId}/analyze`, {});
    const message = response.summary?.message || "Report education summary generated.";
    const nextSteps = response.recommendations?.next_steps || [];
    saveReportHistory({
      id: response.report_id,
      analysisId: response.id,
      patientId: response.patient_id,
      fileName: `Analysis ${response.report_id}`,
      status: response.status,
      riskLevel: response.risk_level,
      message,
      nextSteps,
      createdAt: new Date().toISOString(),
    });
    if (response.recommendations?.requires_clinician_review) {
      addReviewQueueItem({
        profile: getProfile(),
        risk: {
          label: "Report review needed",
          reasons: [`Report analysis risk level: ${response.risk_level}`],
        },
        symptoms: document.querySelector("#report-text").value.trim().slice(0, 900),
      });
    }
    addAuditEvent("report_analyzed", `Report ${response.report_id} analyzed with ${response.risk_level} risk.`);
    renderAuditTrail();
    reportStatus.textContent = response.status === "needs_readable_text"
      ? "Report stored securely. Paste OCR text or key lab values here, then click Analyze report again."
      : `Analysis complete: ${response.risk_level}.`;
  } catch (error) {
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
    localStorage.setItem("carewiseReports", JSON.stringify(reports.map((report) => ({
      id: report.id,
      patientId: report.patient_id,
      fileName: report.file_name,
      status: report.status,
      storageUrl: report.storage_url,
      fileSizeBytes: report.file_size_bytes,
      createdAt: new Date().toISOString(),
    }))));
    renderReportHistory();
    reportStatus.textContent = `Loaded ${reports.length} report${reports.length === 1 ? "" : "s"}.`;
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
      status: item.status || "Pending review",
      reviewerNote: "",
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
    return `
      <article class="saved-plan-row">
        <div>
          <strong>${escapeHtml(plan.patientName)}</strong>
          <span>${escapeHtml(date)} - ${escapeHtml(urgentLabel)}</span>
        </div>
        <p>${escapeHtml(plan.carePath)} · ${escapeHtml(plan.planLabel)}</p>
      </article>
    `;
  }).join("");
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
      <div>
        <strong>${escapeHtml(med.name)}</strong>
        <span>${escapeHtml(med.refill || "No refill date")}</span>
      </div>
      <p>${escapeHtml([med.dose, med.timing].filter(Boolean).join(" · ") || "Dose/timing not provided")}</p>
      ${med.notes ? `<p>${escapeHtml(med.notes)}</p>` : ""}
    </article>
  `).join("");
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
}

function getReviewQueue() {
  try {
    return JSON.parse(localStorage.getItem("carewiseReviewQueue") || "[]");
  } catch {
    return [];
  }
}

function renderReviewQueue() {
  const queue = getReviewQueue();
  if (!queue.length) {
    reviewQueue.innerHTML = "<p>No review items yet.</p>";
    return;
  }
  reviewQueue.innerHTML = queue.map((item) => `
    <article class="saved-plan-row">
      <div>
        <strong>${escapeHtml(item.patientName)}</strong>
        <span>${escapeHtml(item.risk)} · ${escapeHtml(item.status || "Pending review")}</span>
      </div>
      <p>${escapeHtml((item.reasons || []).join(" ") || "Review recommended before patient-facing follow-up.")}</p>
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

function updateReviewQueueItem(id, action) {
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
  localStorage.setItem("carewiseReviewQueue", JSON.stringify(queue));
  addAuditEvent(`review_${action}`, `${item.patientName} marked ${item.status}. ${note || "No reviewer note."}`);
  reviewStatus.textContent = `${item.patientName} marked ${item.status}.`;
  renderReviewQueue();
  renderAuditTrail();
  renderDashboardStats();
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
    checkins: getCheckins(),
    medications: getMedications(),
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
    exportStatus.textContent = "Backend data export loaded.";
    addAuditEvent("backend_data_exported", "Backend privacy export loaded in the app.");
    renderAuditTrail();
  } catch {
    exportStatus.textContent = "Backend export failed. Check login and backend status.";
  }
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
  return `
    <article class="saved-plan-row">
      <div>
        <strong>Week of ${escapeHtml(week)}</strong>
        <span>${escapeHtml(checkin.symptoms)} symptoms · ${escapeHtml(checkin.exercise)} exercise</span>
      </div>
      <p>Meals: ${escapeHtml(checkin.meals)} · Sleep: ${escapeHtml(checkin.sleep)} · Meds: ${escapeHtml(checkin.meds)} · Mood: ${escapeHtml(checkin.mood)}</p>
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

function registerCareWiseServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(window.location.protocol)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

registerCareWiseServiceWorker();
