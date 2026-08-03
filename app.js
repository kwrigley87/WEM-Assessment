/* ==========================================================================
   App state machine — renders one screen at a time into #app.
   ========================================================================== */
const STATE = {
  screenIndex: 0,
  steps: ["welcome", "modules", "about", "orgsize", "industry", "journey", "goals", "ops", "LIKERT_BLOCK", "ai_readiness", "challenges", "funfact", "paywall", "results"],
  selectedModules: [],
  clientInfo: { firstName: "", company: "", industry: "", orgSize: "", journeyStage: "", email: "" },
  goals: [],
  opsChannels: [],
  opsVolume: "",
  likertAnswers: {},
  aiReadinessAnswers: {},
  challenges: [],
  report: null,
  emailStatus: null
};

const $app = document.getElementById("app");
const $progressFill = document.getElementById("progress-fill");

function rebuildLikertSteps() {
  const start = STATE.steps.indexOf("ops") + 1;
  const end = STATE.steps.indexOf("ai_readiness");
  const ids = [];
  const isNew = STATE.clientInfo.journeyStage === "new";
  MODULE_ORDER.filter((k) => STATE.selectedModules.includes(k)).forEach((k) => {
    if (!isNew) ids.push(`likert_${k}`);
    STATE.likertAnswers[k] = STATE.likertAnswers[k] || {};
  });
  STATE.steps.splice(start, end - start, ...ids);
}

function currentStepId() {
  return STATE.steps[STATE.screenIndex];
}

function updateProgress() {
  const pct = Math.round((STATE.screenIndex / (STATE.steps.length - 1)) * 100);
  $progressFill.style.width = pct + "%";
}

function goTo(index) {
  STATE.screenIndex = Math.max(0, Math.min(STATE.steps.length - 1, index));
  render();
  window.scrollTo(0, 0);
}
function goNext() { goTo(STATE.screenIndex + 1); }
function goBack() { goTo(STATE.screenIndex - 1); }

function resetApp() {
  STATE.screenIndex = 0;
  STATE.steps = ["welcome", "modules", "about", "orgsize", "industry", "journey", "goals", "ops", "LIKERT_BLOCK", "ai_readiness", "challenges", "funfact", "paywall", "results"];
  STATE.selectedModules = [];
  STATE.clientInfo = { firstName: "", company: "", industry: "", orgSize: "", journeyStage: "", email: "" };
  STATE.goals = [];
  STATE.opsChannels = [];
  STATE.opsVolume = "";
  STATE.likertAnswers = {};
  STATE.aiReadinessAnswers = {};
  STATE.challenges = [];
  STATE.report = null;
  STATE.emailStatus = null;
  render();
}

/* ---------------------------- shared UI bits ----------------------------- */
function navBar({ nextLabel = "Next", nextDisabled = false, hideBack = false } = {}) {
  return `
    <div class="nav-row">
      ${hideBack ? "" : `<button class="btn btn-ghost" id="btn-back">${icon("arrowLeft")} Back</button>`}
      <button class="btn btn-primary" id="btn-next" ${nextDisabled ? "disabled" : ""}>${nextLabel} ${icon("arrowRight")}</button>
    </div>`;
}

function tileGrid(items, { multi = false, selected = [], onAttr = "data-id", disabledIds = [] } = {}) {
  return `<div class="tile-grid">${items.map((it) => {
    const isSel = multi ? selected.includes(it.id) : selected === it.id;
    const isDisabled = disabledIds.includes(it.id) && !isSel;
    return `<button class="tile ${isSel ? "tile-selected" : ""} ${isDisabled ? "tile-disabled" : ""}" ${onAttr}="${it.id}" ${isDisabled ? "disabled" : ""}>
      ${it.iconName ? `<span class="tile-icon">${icon(it.iconName)}</span>` : ""}
      <span class="tile-label">${it.label}</span>
      ${it.sub ? `<span class="tile-sub">${it.sub}</span>` : ""}
      <span class="tile-check">${icon("check")}</span>
    </button>`;
  }).join("")}</div>`;
}

function likertScreen({ tag, title, sub, statements, answers }) {
  const answered = statements.every((s) => answers[s.id] !== undefined);
  return `
    <section class="screen screen-likert">
      ${tag ? `<div class="q-tag">${tag}</div>` : ""}
      <h2>${title}</h2>
      ${sub ? `<p class="screen-sub">${sub}</p>` : ""}
      <div class="likert-scale-labels"><span>${LIKERT_SCALE[0].label}</span><span>${LIKERT_SCALE[LIKERT_SCALE.length - 1].label}</span></div>
      <div class="likert-list">
        ${statements.map((s) => `
          <div class="likert-row" data-stmt="${s.id}">
            <div class="likert-text">${s.text}</div>
            <div class="likert-options">
              ${LIKERT_SCALE.map((o) => `<button class="likert-dot ${answers[s.id] === o.value ? "likert-dot-on" : ""}" data-stmt="${s.id}" data-value="${o.value}" title="${o.label}">${o.value}</button>`).join("")}
            </div>
          </div>`).join("")}
      </div>
      ${navBar({ nextDisabled: !answered })}
    </section>`;
}

/* -------------------------------- Screens --------------------------------- */
function screenWelcome() {
  return `
    <section class="screen screen-hero">
      <div class="hero-badge">${icon("compass")} WEM Maturity Snapshot</div>
      <h1>Where does your WEM &amp; AI strategy stand today?</h1>
      <p class="hero-sub">A quick, interactive snapshot across Workforce Management, Quality &amp; Compliance, Speech &amp; Text Analytics, Employee Performance — and your organization's AI readiness. Get a bespoke maturity report with real benchmarks and recommendations, sent straight to you.</p>
      <button class="btn btn-primary btn-lg" id="btn-start">Start my snapshot ${icon("arrowRight")}</button>
      <p class="hero-meta">Takes about 3 minutes · Your results are private and emailed only to you</p>
    </section>`;
}

function screenModules() {
  const items = MODULE_ORDER.map((k) => ({ id: k, label: MODULES[k].name, sub: MODULES[k].blurb, iconName: MODULES[k].icon }));
  return `
    <section class="screen">
      <h2>Which areas do you want to explore?</h2>
      <p class="screen-sub">Pick one, a few, or all four — your snapshot will be tailored to exactly what you choose. We'll also score your AI readiness separately, since AI maturity and WEM maturity aren't the same thing.</p>
      ${tileGrid(items, { multi: true, selected: STATE.selectedModules })}
      ${navBar({ hideBack: true, nextDisabled: STATE.selectedModules.length === 0 })}
    </section>`;
}

function screenAbout() {
  const { firstName, company } = STATE.clientInfo;
  return `
    <section class="screen screen-narrow">
      <h2>A little about you</h2>
      <p class="screen-sub">So we can personalize your snapshot.</p>
      <label class="field-label" for="in-firstname">First name</label>
      <input class="text-input" id="in-firstname" type="text" placeholder="e.g. Jordan" value="${firstName}" autocomplete="given-name" />
      <label class="field-label" for="in-company">Company <span class="optional">(optional)</span></label>
      <input class="text-input" id="in-company" type="text" placeholder="e.g. Acme Corp" value="${company}" autocomplete="organization" />
      ${navBar({ nextDisabled: firstName.trim().length === 0 })}
    </section>`;
}

function screenOrgSize() {
  const items = ORG_SIZES.map((o) => ({ id: o.id, label: o.label, iconName: o.icon }));
  return `
    <section class="screen">
      <h2>How big is your contact center?</h2>
      ${tileGrid(items, { selected: STATE.clientInfo.orgSize })}
      ${navBar({ nextDisabled: !STATE.clientInfo.orgSize })}
    </section>`;
}

function screenIndustry() {
  const items = INDUSTRIES.map((i) => ({ id: i.id, label: i.label, iconName: i.icon }));
  return `
    <section class="screen">
      <h2>What industry are you in?</h2>
      <p class="screen-sub">We'll use this to benchmark you against typical peers.</p>
      ${tileGrid(items, { selected: STATE.clientInfo.industry })}
      ${navBar({ nextDisabled: !STATE.clientInfo.industry })}
    </section>`;
}

function screenJourney() {
  const items = JOURNEY_STAGES.map((j) => ({ id: j.id, label: j.label, sub: j.sub, iconName: j.icon }));
  return `
    <section class="screen">
      <h2>Where are you in your Genesys WEM journey?</h2>
      ${tileGrid(items, { selected: STATE.clientInfo.journeyStage })}
      ${navBar({ nextDisabled: !STATE.clientInfo.journeyStage })}
    </section>`;
}

function screenGoals() {
  const items = BUSINESS_GOALS.map((g) => ({ id: g.id, label: g.label, iconName: g.icon }));
  const atMax = STATE.goals.length >= MAX_GOALS;
  return `
    <section class="screen">
      <h2>What are your biggest priorities over the next 12 months?</h2>
      <p class="screen-sub">Pick up to ${MAX_GOALS} — not features, outcomes. This shapes which recommendations we lead with. (${STATE.goals.length}/${MAX_GOALS} selected)</p>
      ${tileGrid(items, { multi: true, selected: STATE.goals, disabledIds: atMax ? items.map((i) => i.id) : [] })}
      ${navBar({ nextDisabled: STATE.goals.length === 0 })}
    </section>`;
}

function screenOps() {
  const channelItems = OPS_CHANNELS.map((c) => ({ id: c.id, label: c.label, iconName: c.icon }));
  const volumeItems = OPS_VOLUME.map((v) => ({ id: v.id, label: v.label }));
  return `
    <section class="screen">
      <h2>Tell us about your operation</h2>
      <p class="screen-sub">Which channels do you support today?</p>
      ${tileGrid(channelItems, { multi: true, selected: STATE.opsChannels, onAttr: "data-channel" })}
      <p class="screen-sub" style="margin-top:24px;">Roughly how many interactions do you handle a month?</p>
      ${tileGrid(volumeItems, { selected: STATE.opsVolume, onAttr: "data-volume" })}
      ${navBar({ nextDisabled: STATE.opsChannels.length === 0 || !STATE.opsVolume })}
    </section>`;
}

function screenLikert(moduleKey) {
  const mod = MODULES[moduleKey];
  STATE.likertAnswers[moduleKey] = STATE.likertAnswers[moduleKey] || {};
  return likertScreen({
    tag: `${icon(mod.icon)} ${mod.short}`,
    title: `How true is this of ${mod.name} today?`,
    sub: "Rate how much you agree with each statement.",
    statements: LIKERT_STATEMENTS[moduleKey],
    answers: STATE.likertAnswers[moduleKey]
  });
}

function screenAIReadiness() {
  return likertScreen({
    tag: `${icon("cpu")} AI Readiness`,
    title: "How ready is your organization for AI?",
    sub: "AI readiness is scored separately from WEM maturity — it's about trust and habits, not tools.",
    statements: AI_READINESS_STATEMENTS,
    answers: STATE.aiReadinessAnswers
  });
}

function screenChallenges() {
  const items = CHALLENGES.map((c) => ({ id: c.id, label: c.label }));
  return `
    <section class="screen">
      <h2>What slows your managers down today?</h2>
      <p class="screen-sub">Optional — pick as many as apply, or skip ahead.</p>
      ${tileGrid(items, { multi: true, selected: STATE.challenges })}
      ${navBar({ nextLabel: "Continue" })}
    </section>`;
}

function screenFunFact() {
  const fact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
  return `
    <section class="screen screen-narrow screen-funfact">
      <div class="hero-badge">${icon("sparkle")} Did you know?</div>
      <div class="funfact-stat">${fact.stat}</div>
      <p class="funfact-text">${fact.text}</p>
      <p class="funfact-source">Source: ${fact.source}</p>
      ${navBar({ hideBack: true, nextLabel: "Continue" })}
    </section>`;
}

function screenPaywall() {
  return `
    <section class="screen screen-narrow">
      <div class="hero-badge">${icon("lock")} Almost there</div>
      <h2>Where should we send your snapshot?</h2>
      <p class="screen-sub">Enter your work email to unlock your bespoke maturity results and receive a copy for later.</p>
      <label class="field-label" for="in-email">Work email</label>
      <input class="text-input" id="in-email" type="email" placeholder="you@company.com" value="${STATE.clientInfo.email}" autocomplete="email" />
      <p id="email-error" class="field-error"></p>
      <div class="nav-row">
        <button class="btn btn-ghost" id="btn-back">${icon("arrowLeft")} Back</button>
        <button class="btn btn-primary" id="btn-unlock">Unlock my results ${icon("arrowRight")}</button>
      </div>
      <p class="hero-meta">We'll only use this to send your results and share relevant Genesys WEM resources.</p>
    </section>`;
}

function levelBarHTML(level, levelName, targetLevel) {
  return `
    <div class="level-bar">
      ${Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((n) => {
        const on = n <= level;
        const isTarget = targetLevel && n === targetLevel && targetLevel > level;
        return `<span class="seg ${on ? "seg-on seg-l" + level : ""} ${isTarget ? "seg-target" : ""}"></span>`;
      }).join("")}
    </div>
    <div class="level-caption">Level ${level} of ${MAX_LEVEL} — <strong>${levelName}</strong>${targetLevel && targetLevel > level ? ` <span class="target-caption">→ Target: Level ${targetLevel}</span>` : ""}</div>`;
}

function screenResults() {
  const r = STATE.report;
  const allPain = Array.from(new Set([...(r.selectedPainLabels || [])]));

  return `
    <section class="screen screen-results">
      <div class="results-intro">
        <div class="hero-badge">${icon("check")} Snapshot ready</div>
        <h2>Executive Summary</h2>
        <p class="exec-summary">${r.execSummary}</p>
        <div class="results-grid-top">
          <div class="results-score-card">
            <p class="label-strong">Combined WEM Maturity</p>
            ${levelBarHTML(r.combined.level, r.combined.levelName)}
            <p>${r.combined.copy}</p>
          </div>
          <div class="results-score-card">
            <p class="label-strong">${icon("cpu")} AI Readiness (separate score)</p>
            ${levelBarHTML(r.aiReadiness.level, r.aiReadiness.levelName)}
            <p>${r.aiReadiness.copy}</p>
          </div>
        </div>
        <div class="radar-wrap">
          <canvas id="radar-chart" width="480" height="380"></canvas>
        </div>
        ${STATE.emailStatus === "sent"
          ? `<p class="email-status ok">${icon("mail")} We've emailed a copy to ${r.clientInfo.email}.</p>`
          : `<p class="email-status">${icon("mail")} Download your PDF below — we'll also follow up by email.</p>`}
        <div class="nav-row results-actions">
          <button class="btn btn-primary" id="btn-download">${icon("download")} Download PDF report</button>
          <button class="btn btn-ghost" id="btn-restart">${icon("refresh")} Start over</button>
        </div>
      </div>

      ${r.nextBestWorkshop ? `
        <div class="nbw-card">
          <div class="nbw-tag">${icon("target")} Next Best Workshop</div>
          <h3>${r.nextBestWorkshop.service ? r.nextBestWorkshop.service.name : "Talk to Genesys Professional Services"}</h3>
          <p>${r.nextBestWorkshop.service ? r.nextBestWorkshop.service.blurb : ""} Recommended first for <strong>${r.nextBestWorkshop.module}</strong> — your biggest opportunity right now.</p>
        </div>` : ""}

      <div class="module-cards">
        ${r.moduleResults.map((m) => `
          <div class="module-card">
            <div class="module-card-head">
              <span class="tile-icon">${icon(MODULES[m.key].icon)}</span>
              <h3>${m.name}</h3>
            </div>
            ${levelBarHTML(m.level, m.levelName, m.targetLevel)}
            <p class="benchmark-line">${icon("map")} You're <strong>${m.benchmarkComparison}</strong> typical ${r.clientInfo.industry} peers (peer level: ${m.peerLevel} — ${m.peerLevelName})</p>
            <p>${m.description}</p>
            <p class="benefit-narrative">${m.benefitNarrative}</p>
            <p class="label-strong">Recommended actions</p>
            <ul class="checklist">${m.checklist.map((c) => `<li>${icon("check")} ${c}</li>`).join("")}</ul>
            ${m.services.length ? `<div class="service-box"><p class="label-strong">Recommended service</p>${m.services.map((s) => `<p><strong>${s.name}</strong><br/>${s.blurb}</p>`).join("")}</div>` : ""}
            ${m.caseStudyStats && m.caseStudyStats.length ? `<div class="case-study-box"><p class="label-strong">${icon("sparkle")} Real Genesys customer outcomes</p><ul>${m.caseStudyStats.slice(0, 3).map((c) => `<li>${c}</li>`).join("")}</ul></div>` : ""}
          </div>`).join("")}
      </div>

      ${r.quickWins && r.quickWins.length ? `
        <div class="quickwins-box">
          <p class="label-strong">${icon("bolt")} Quick wins</p>
          <ul>${r.quickWins.map((q) => `<li>${q}</li>`).join("")}</ul>
        </div>` : ""}

      ${r.roadmap ? `
        <div class="roadmap-box">
          <p class="label-strong">${icon("map")} Suggested roadmap</p>
          <div class="roadmap-phases">
            ${r.roadmap.map((phase) => `
              <div class="roadmap-phase">
                <div class="roadmap-phase-label">${phase.label}</div>
                <ul>${phase.items.map((i) => `<li>${i}</li>`).join("")}</ul>
              </div>`).join("")}
          </div>
        </div>` : ""}

      ${allPain.length ? `
        <div class="pain-box">
          <p class="label-strong">Things you may be experiencing</p>
          <ul>${allPain.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>` : ""}

      ${r.combinedServices.length ? `
        <div class="service-box service-box-combined">
          <p class="label-strong">Suggested next steps from Genesys Professional Services</p>
          ${r.combinedServices.map((s) => `<p><strong>${s.name}</strong><br/>${s.blurb}</p>`).join("")}
        </div>` : ""}

      <p class="disclaimer">Estimates are indicative and vary by organization. ${r.caseStudyDisclaimer}</p>
    </section>`;
}

/* ------------------------------- Render loop ------------------------------- */
function render() {
  updateProgress();
  const id = currentStepId();
  let html = "";

  if (id === "welcome") html = screenWelcome();
  else if (id === "modules") html = screenModules();
  else if (id === "about") html = screenAbout();
  else if (id === "orgsize") html = screenOrgSize();
  else if (id === "industry") html = screenIndustry();
  else if (id === "journey") html = screenJourney();
  else if (id === "goals") html = screenGoals();
  else if (id === "ops") html = screenOps();
  else if (id === "ai_readiness") html = screenAIReadiness();
  else if (id === "challenges") html = screenChallenges();
  else if (id === "funfact") html = screenFunFact();
  else if (id === "paywall") html = screenPaywall();
  else if (id === "results") html = screenResults();
  else if (id.startsWith("likert_")) html = screenLikert(id.replace("likert_", ""));

  $app.innerHTML = html;
  attachHandlers(id);
  if (id === "results") renderRadarChart(STATE.report);
}

/* ------------------------------ Event wiring ------------------------------- */
function wireLikertRows(statements, answers) {
  document.querySelectorAll(".likert-dot").forEach((btn) => {
    btn.onclick = () => {
      const stmt = btn.getAttribute("data-stmt");
      const value = Number(btn.getAttribute("data-value"));
      answers[stmt] = value;
      render();
    };
  });
}

function attachHandlers(id) {
  const backBtn = document.getElementById("btn-back");
  if (backBtn) backBtn.onclick = goBack;

  if (id === "welcome") {
    document.getElementById("btn-start").onclick = goNext;
    return;
  }

  if (id === "modules") {
    document.querySelectorAll("[data-id]").forEach((tile) => {
      tile.onclick = () => {
        const val = tile.getAttribute("data-id");
        const i = STATE.selectedModules.indexOf(val);
        if (i >= 0) STATE.selectedModules.splice(i, 1); else STATE.selectedModules.push(val);
        render();
      };
    });
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id === "about") {
    const fn = document.getElementById("in-firstname");
    const co = document.getElementById("in-company");
    const next = document.getElementById("btn-next");
    fn.oninput = () => { STATE.clientInfo.firstName = fn.value; next.disabled = fn.value.trim().length === 0; };
    co.oninput = () => { STATE.clientInfo.company = co.value; };
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id === "orgsize" || id === "industry" || id === "journey") {
    const key = id === "orgsize" ? "orgSize" : id === "industry" ? "industry" : "journeyStage";
    document.querySelectorAll("[data-id]").forEach((tile) => {
      tile.onclick = () => { STATE.clientInfo[key] = tile.getAttribute("data-id"); render(); };
    });
    // Journey stage is the last profile question and determines whether any
    // detailed maturity questions are needed later, so rebuild that step
    // list here — by this point selectedModules AND journeyStage are known.
    document.getElementById("btn-next").onclick = id === "journey" ? () => { rebuildLikertSteps(); goNext(); } : goNext;
    return;
  }

  if (id === "goals") {
    document.querySelectorAll("[data-id]").forEach((tile) => {
      tile.onclick = () => {
        const val = tile.getAttribute("data-id");
        const i = STATE.goals.indexOf(val);
        if (i >= 0) { STATE.goals.splice(i, 1); render(); return; }
        if (STATE.goals.length >= MAX_GOALS) return;
        STATE.goals.push(val);
        render();
      };
    });
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id === "ops") {
    document.querySelectorAll("[data-channel]").forEach((tile) => {
      tile.onclick = () => {
        const val = tile.getAttribute("data-channel");
        const i = STATE.opsChannels.indexOf(val);
        if (i >= 0) STATE.opsChannels.splice(i, 1); else STATE.opsChannels.push(val);
        render();
      };
    });
    document.querySelectorAll("[data-volume]").forEach((tile) => {
      tile.onclick = () => { STATE.opsVolume = tile.getAttribute("data-volume"); render(); };
    });
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id.startsWith("likert_")) {
    const moduleKey = id.replace("likert_", "");
    wireLikertRows(LIKERT_STATEMENTS[moduleKey], STATE.likertAnswers[moduleKey]);
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id === "ai_readiness") {
    wireLikertRows(AI_READINESS_STATEMENTS, STATE.aiReadinessAnswers);
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id === "challenges") {
    document.querySelectorAll("[data-id]").forEach((tile) => {
      tile.onclick = () => {
        const val = tile.getAttribute("data-id");
        const i = STATE.challenges.indexOf(val);
        if (i >= 0) STATE.challenges.splice(i, 1); else STATE.challenges.push(val);
        render();
      };
    });
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id === "funfact") {
    document.getElementById("btn-next").onclick = goNext;
    return;
  }

  if (id === "paywall") {
    const emailInput = document.getElementById("in-email");
    const errorEl = document.getElementById("email-error");
    document.getElementById("btn-unlock").onclick = async () => {
      const email = emailInput.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) { errorEl.textContent = "Please enter a valid email address."; return; }
      STATE.clientInfo.email = email;

      const btn = document.getElementById("btn-unlock");
      btn.disabled = true;
      btn.textContent = "Preparing your results…";

      STATE.report = buildReport(STATE);

      Leads.save({
        timestamp: new Date().toISOString(),
        firstName: STATE.clientInfo.firstName,
        company: STATE.clientInfo.company,
        email: STATE.clientInfo.email,
        industry: STATE.clientInfo.industry,
        orgSize: STATE.clientInfo.orgSize,
        journeyStage: STATE.clientInfo.journeyStage,
        modulesAssessed: STATE.selectedModules.join("; "),
        combinedLevel: STATE.report.combined.level,
        aiReadinessLevel: STATE.report.aiReadiness.level,
        goals: STATE.goals.join("; "),
        challenges: STATE.challenges.join("; ")
      });

      const result = await sendReportEmail(STATE.report);
      STATE.emailStatus = result.ok ? "sent" : "fallback";
      goNext();
    };
    return;
  }

  if (id === "results") {
    document.getElementById("btn-download").onclick = () => downloadPDF(STATE.report);
    document.getElementById("btn-restart").onclick = resetApp;
    return;
  }
}

/* ------------------------------ Radar chart -------------------------------- */
let radarChartInstance = null;
function renderRadarChart(report) {
  const canvas = document.getElementById("radar-chart");
  if (!canvas || !window.Chart) return;
  const labels = report.moduleResults.map((m) => m.short).concat(["AI Readiness"]);
  const today = report.moduleResults.map((m) => m.level).concat([report.aiReadiness.level]);
  const target = report.moduleResults.map((m) => m.targetLevel).concat([Math.min(MAX_LEVEL, report.aiReadiness.level + 1)]);

  if (radarChartInstance) { radarChartInstance.destroy(); radarChartInstance = null; }
  radarChartInstance = new window.Chart(canvas.getContext("2d"), {
    type: "radar",
    data: {
      labels,
      datasets: [
        { label: "Today", data: today, backgroundColor: "rgba(255,79,31,0.25)", borderColor: "#FF4F1F", pointBackgroundColor: "#FF4F1F", borderWidth: 2 },
        { label: "12-Month Target", data: target, backgroundColor: "rgba(35,57,80,0.08)", borderColor: "#233950", pointBackgroundColor: "#233950", borderWidth: 2, borderDash: [4, 4] }
      ]
    },
    options: {
      responsive: false,
      scales: { r: { min: 0, max: MAX_LEVEL, ticks: { stepSize: 1, showLabelBackdrop: false }, pointLabels: { font: { size: 12, weight: "600" } } } },
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/* --------------------------------- Boot ------------------------------------ */
// Expose state/objects for the admin overlay and for automated testing.
if (typeof window !== "undefined") {
  window.STATE = STATE;
  window.Leads = Leads;
}

render();
maybeShowAdminPanel();
