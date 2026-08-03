/* ==========================================================================
   Recommendation engine — turns raw assessment state into a bespoke report:
   per-module + combined maturity, a separately-scored AI Readiness score,
   industry benchmark comparisons, quantified benefit narratives, a
   checklist-style service recommendation, a Next Best Workshop pick, a
   3-phase roadmap, quick wins and an executive summary. Every piece of
   copy here is safe for a public, customer-facing screen — no internal
   pricing, hours or sales-only language.
   ========================================================================== */

function levelFromAnswers(values) {
  const nums = values.filter((v) => typeof v === "number");
  if (!nums.length) return 1;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.min(MAX_LEVEL, Math.max(1, Math.round(avg)));
}

/** Same as levelFromAnswers but allows 0 (used to combine already-scored module levels). */
function averageLevel(levels) {
  const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
  return Math.min(MAX_LEVEL, Math.max(0, Math.round(avg)));
}

/** Suggest 1 (sometimes 2) services for a single module. */
function serviceForModule(moduleKey, level, journeyStage) {
  const s = SERVICES;
  if (moduleKey === "wfm") {
    if (journeyStage === "new") return [s.wfm_deploy];
    return level <= 2 ? [s.wfm_review] : [s.wfm_mentor];
  }
  if (moduleKey === "qm") {
    if (journeyStage === "new") return [s.qm_deploy, s.survey_deploy];
    return level <= 2 ? [s.qmsta_review] : [s.qmsta_mentor];
  }
  if (moduleKey === "sta") {
    if (journeyStage === "new") return [s.sta_deploy];
    return level <= 2 ? [s.qmsta_review] : [s.qmsta_mentor];
  }
  if (moduleKey === "ep") {
    if (journeyStage === "new") return [s.ep_deploy];
    return [s.readiness];
  }
  return [];
}

function benchmarkLabel(level, peerLevel) {
  if (level > peerLevel) return "ahead of";
  if (level < peerLevel) return "behind";
  return "in line with";
}

/** Build the quantified, bespoke benefit narrative for a module. */
function buildBenefitNarrative(moduleName, levelName, industry, stat) {
  return `You're operating a ${levelName.toLowerCase()}-stage ${moduleName} programme. Organisations in ${industry} with similar maturity typically see ${stat.metric.toLowerCase()} improve by ${stat.low}-${stat.high}% (commonly around ${stat.likely}%) after ${stat.action}.`;
}

/**
 * Build the full bespoke report object from raw assessment state.
 * state shape:
 *  clientInfo: { firstName, company, industry, orgSize, journeyStage, email }
 *  selectedModules: [module keys]
 *  goals: [goal ids] (max 3)
 *  opsChannels: [channel ids], opsVolume: id
 *  likertAnswers: { [moduleKey]: { [statementId]: 1-5 } }
 *  aiReadinessAnswers: { [statementId]: 1-5 }
 *  challenges: [challenge ids]
 */
function buildReport(state) {
  const { clientInfo, selectedModules, goals, challenges, likertAnswers, aiReadinessAnswers } = state;
  const journeyStage = clientInfo.journeyStage;
  const industry = clientInfo.industry || "Other";
  const peerLevels = INDUSTRY_BENCHMARK[industry] || INDUSTRY_BENCHMARK.Other;

  const moduleResults = selectedModules.map((key) => {
    const mod = MODULES[key];
    const answers = (likertAnswers && likertAnswers[key]) || {};
    const values = Object.values(answers);
    const hasAnswers = values.length === LIKERT_STATEMENTS[key].length;
    const level = journeyStage === "new" || !hasAnswers ? 0 : levelFromAnswers(values);
    const levelName = LEVELS[level].name;
    const assumed = (ASSUMED_PAIN[key] && ASSUMED_PAIN[key][level]) || [];
    const stats = BENEFIT_STATS[key];
    const primaryStat = stats[0];
    const peerLevel = peerLevels[key];

    return {
      key,
      name: mod.name,
      short: mod.short,
      level,
      levelName,
      targetLevel: Math.min(MAX_LEVEL, level + 1 === 0 ? 1 : level === MAX_LEVEL ? MAX_LEVEL : level + 1),
      description: mod.levels[level],
      benefitStats: stats,
      caseStudyStats: CASE_STUDY_STATS[key],
      benefitNarrative: level > 0 ? buildBenefitNarrative(mod.name, levelName, industry, primaryStat) : `You're just getting started with ${mod.name}. Organisations in ${industry} typically see ${primaryStat.metric.toLowerCase()} improve by ${primaryStat.low}-${primaryStat.high}% once ${primaryStat.action} is in place from day one.`,
      bestPractice: BEST_PRACTICE[key][level],
      assumedPain: assumed,
      checklist: MODULE_CHECKLISTS[key],
      services: serviceForModule(key, level, journeyStage),
      peerLevel,
      peerLevelName: LEVELS[peerLevel].name,
      benchmarkComparison: benchmarkLabel(level, peerLevel)
    };
  });

  const combinedLevel = averageLevel(moduleResults.map((m) => m.level));

  // --- AI Readiness: scored independently of WEM process maturity ---
  const aiValues = Object.values(aiReadinessAnswers || {});
  const aiLevel = aiValues.length ? levelFromAnswers(aiValues) : 1;
  const aiReadiness = {
    level: aiLevel,
    levelName: LEVELS[aiLevel].name,
    copy: AI_READINESS_COPY[aiLevel]
  };

  // --- De-duplicated combined service recommendations ---
  const combinedServices = [];
  const pushUnique = (svc) => {
    if (svc && !combinedServices.find((s) => s.name === svc.name)) combinedServices.push(svc);
  };
  if (selectedModules.length >= 3 && (journeyStage === "new" || journeyStage === "early")) {
    pushUnique(SERVICES.readiness);
  }
  if (selectedModules.length >= 3 && clientInfo.orgSize === "xl" && journeyStage === "mature") {
    pushUnique(SERVICES.enterprise);
  }
  if (combinedLevel >= 3) {
    pushUnique(SERVICES.insights);
  }
  if (challenges && challenges.includes("routing")) {
    pushUnique(SERVICES.routing_review);
  }
  moduleResults.forEach((m) => m.services.forEach(pushUnique));

  // --- Next Best Workshop: biggest opportunity = lowest-scoring selected module ---
  const sortedByOpportunity = [...moduleResults].sort((a, b) => a.level - b.level);
  const nextBestModule = sortedByOpportunity[0];
  const nextBestWorkshop = nextBestModule ? { module: nextBestModule.name, service: nextBestModule.services[0] } : null;

  // --- Simple 3-phase roadmap ---
  const now = nextBestModule ? [`${nextBestModule.services[0] ? nextBestModule.services[0].name : "Quick review"} for ${nextBestModule.name}`, ...nextBestModule.checklist.slice(0, 2)] : [];
  const nextPhaseModules = sortedByOpportunity.slice(1);
  const next = nextPhaseModules.map((m) => `${m.services[0] ? m.services[0].name : "Follow-on review"} for ${m.name}`);
  const later = [];
  combinedServices.forEach((s) => {
    if ((s.name === SERVICES.readiness.name || s.name === SERVICES.enterprise.name || s.name === SERVICES.insights.name) && !later.includes(s.name)) {
      later.push(s.name);
    }
  });
  if (aiLevel <= 2) later.push("Build AI trust with a small, low-risk pilot before scaling automation further");
  const roadmap = [
    { label: "Now (0-3 months)", items: now },
    { label: "Next (3-6 months)", items: next.length ? next : ["Sustain adoption of what's already in motion"] },
    { label: "Later (6-12 months)", items: later.length ? later : ["Revisit scope as adoption matures"] }
  ];

  // --- Quick wins: tactical, distinct from the fuller benefits ---
  const quickWins = [];
  if (nextBestModule) quickWins.push(nextBestModule.checklist[0]);
  (challenges || []).slice(0, 3).forEach((id) => {
    if (CHALLENGE_TIPS[id]) quickWins.push(CHALLENGE_TIPS[id]);
  });
  if (nextBestModule && quickWins.length < 3) quickWins.push(nextBestModule.checklist[1]);

  // --- Goals & challenges, resolved to labels ---
  const goalLabels = (goals || []).map((id) => (BUSINESS_GOALS.find((g) => g.id === id) || {}).label).filter(Boolean);
  const challengeLabels = (challenges || []).map((id) => (CHALLENGES.find((c) => c.id === id) || {}).label).filter(Boolean);

  // --- Executive summary ---
  const nameLine = clientInfo.company ? `${clientInfo.firstName || "there"} at ${clientInfo.company}` : (clientInfo.firstName || "there");
  const goalPhrase = goalLabels.length ? goalLabels.slice(0, 2).join(" and ").toLowerCase() : "strengthening WEM maturity";
  const execSummary = `${nameLine}'s combined WEM maturity sits at Level ${combinedLevel} — ${LEVELS[combinedLevel].name}. With a stated focus on ${goalPhrase}, the biggest near-term opportunity is ${nextBestModule ? nextBestModule.name : "your selected disciplines"}, where ${nextBestModule ? nextBestModule.benefitNarrative.split(". ")[1] || nextBestModule.benefitNarrative : "targeted improvement is available"} AI readiness is currently ${aiReadiness.levelName.toLowerCase()}, which ${aiLevel >= 3 ? "supports taking on more AI-assisted capability now." : "suggests building trust in AI-assisted workflows before scaling automation further."}`;

  const allPainLabels = Array.from(new Set([...challengeLabels, ...moduleResults.flatMap((m) => m.assumedPain)]));

  return {
    clientInfo,
    journeyStage,
    generatedAt: new Date().toISOString(),
    moduleResults,
    combined: {
      level: combinedLevel,
      levelName: LEVELS[combinedLevel].name,
      copy: COMBINED_COPY[combinedLevel]
    },
    aiReadiness,
    goalLabels,
    challengeLabels,
    selectedPainLabels: allPainLabels,
    combinedServices,
    nextBestWorkshop,
    roadmap,
    quickWins: Array.from(new Set(quickWins)).slice(0, 4),
    execSummary,
    caseStudyDisclaimer: CASE_STUDY_DISCLAIMER
  };
}

if (typeof module !== "undefined") {
  module.exports = { buildReport, levelFromAnswers, averageLevel, serviceForModule };
}
