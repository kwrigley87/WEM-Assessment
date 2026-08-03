/* ==========================================================================
   WEM Maturity Snapshot — content & scoring model
   All customer-facing copy lives in this file. No internal pricing, hours,
   or sales-only language is included anywhere — only public-facing service
   names and plain-English descriptions. Benefit ranges are drawn from the
   Genesys WEM value-calculator benchmark bands (conservative/likely/
   optimistic %), presented as indicative, directional estimates.

   Maturity scale (0-5) is aligned to Genesys' internal WEM Maturity Model
   (Zero Usage -> AI-Orchestrated), adapted for a public, customer-facing
   audience. AI Readiness is scored as its own, separate dimension — an
   organization's comfort/adoption of AI is not the same thing as its WEM
   process maturity.
   ========================================================================== */

/* ---------- Maturity levels (shared shape, module-specific copy) -------- */
const LEVELS = [
  { level: 0, id: "zero",         name: "Zero Usage",      tagline: "Not yet in use" },
  { level: 1, id: "ad-hoc",       name: "Ad-Hoc",          tagline: "Manual & reactive" },
  { level: 2, id: "defined",      name: "Defined",         tagline: "Basic structure, limited coverage" },
  { level: 3, id: "integrated",   name: "Integrated",      tagline: "Consistent & connected across teams" },
  { level: 4, id: "orchestrated", name: "Orchestrated",    tagline: "Predictive, AI-enhanced, enterprise-wide" },
  { level: 5, id: "ai-orchestrated", name: "AI-Orchestrated", tagline: "Autonomous & continuously self-optimizing" }
];
const MAX_LEVEL = 5;

/* ------------------------------- Modules --------------------------------- */
const MODULES = {
  wfm: {
    key: "wfm",
    name: "Workforce Management",
    short: "WFM",
    icon: "calendar",
    blurb: "Forecasting, scheduling, capacity planning & intraday management.",
    levels: {
      0: "Workforce management isn't in use yet — staffing runs on spreadsheets and silos, with no forecasting or scheduling tool in place.",
      1: "Scheduling is reactive and highly manual — spreadsheets and gut-feel drive most staffing decisions.",
      2: "Basic forecasting and planning are in place, but coverage still relies on manual overrides and inconsistent adoption.",
      3: "Forecasting, scheduling and capacity planning are integrated across channels, supporting confident planning decisions.",
      4: "AI-optimized schedules and intraday management put the agent at the centre, adapting automatically to real-time demand.",
      5: "Workforce orchestration runs autonomously — AI continuously rebalances staffing in real time against live business outcomes."
    }
  },
  qm: {
    key: "qm",
    name: "Quality Management & Compliance",
    short: "QM",
    icon: "shield",
    blurb: "Evaluations, calibration, surveys, recording & compliance risk.",
    levels: {
      0: "Quality relies on manual reviews only — issues surface after the fact, if at all.",
      1: "Evaluations are compliance-focused and inconsistent, with subjective scoring and a reactive mindset.",
      2: "Basic scorecards and sampling are in place, but coverage is limited and workflows are largely rule-based.",
      3: "AI-assisted scoring and feedback support evaluators, with calibration building consistency across teams.",
      4: "Predictive coaching and QA run at scale, shifting focus toward compliance, risk and proactive insight.",
      5: "Quality optimization runs autonomously — AI identifies risk and coaching opportunities before they become issues."
    }
  },
  sta: {
    key: "sta",
    name: "Speech & Text Analytics + AI",
    short: "STA",
    icon: "wave",
    blurb: "Interaction analytics, topic/trend insight, Supervisor AI & Copilot.",
    levels: {
      0: "Speech & Text Analytics isn't deployed yet — there's no visibility into conversations beyond what's manually observed.",
      1: "Analytics use is complaint-driven only, with little visibility into topics, trends or root causes.",
      2: "Basic topic detection is in place, but usage and insight are limited to a small group.",
      3: "Analytics delivers real business insights and trends that are integrated with coaching and tied to KPIs.",
      4: "Predictive insights surface across the customer journey, with AI-enhanced signals shaping day-to-day decisions.",
      5: "Enterprise intelligence acts continuously — AI surfaces and acts on emerging signals across every conversation."
    }
  },
  ep: {
    key: "ep",
    name: "Employee Performance",
    short: "Gamification, Coaching & Learning",
    icon: "star",
    blurb: "Coaching, gamification, learning & performance development.",
    levels: {
      0: "Employee performance has no real visibility yet — it's an afterthought rather than a program.",
      1: "Feedback is inconsistent, often limited to annual reviews with no ongoing coaching.",
      2: "Goal setting and scorecards exist, and coaching happens, but it's ad hoc and not tied to a structured plan.",
      3: "Integrated metrics and analytics drive structured coaching and development across teams.",
      4: "Predictive coaching and insights are embedded, personalizing development at scale.",
      5: "Performance optimization is continuous and autonomous — coaching and development adapt in real time to individual and business outcomes."
    }
  }
};

const MODULE_ORDER = ["wfm", "qm", "sta", "ep"];

/* ---------------------------- Journey stages ----------------------------- */
const JOURNEY_STAGES = [
  { id: "new",        label: "Just getting started",  sub: "Evaluating or new to Genesys WEM", icon: "compass" },
  { id: "early",      label: "Recently deployed",      sub: "Live, still building adoption", icon: "seedling" },
  { id: "optimizing", label: "Live & optimizing",      sub: "Established, looking to improve", icon: "gauge" },
  { id: "mature",     label: "Mature & expanding",     sub: "Advanced user, growing scope", icon: "rocket" }
];

/* ------------------------------ Org profile ------------------------------- */
const ORG_SIZES = [
  { id: "s",  label: "Under 100 seats",   icon: "seatsS" },
  { id: "m",  label: "100–500 seats",     icon: "seatsM" },
  { id: "l",  label: "500–2,000 seats",   icon: "seatsL" },
  { id: "xl", label: "2,000+ seats",      icon: "seatsXL" }
];

const INDUSTRIES = [
  { id: "Financial Services",         label: "Financial Services",         icon: "bank" },
  { id: "Retail & eCommerce",         label: "Retail & eCommerce",         icon: "cart" },
  { id: "Healthcare",                 label: "Healthcare",                 icon: "health" },
  { id: "Telecom & Utilities",        label: "Telecom & Utilities",        icon: "signal" },
  { id: "Travel & Hospitality",       label: "Travel & Hospitality",       icon: "plane" },
  { id: "Government & Public Sector", label: "Government & Public Sector", icon: "building" },
  { id: "Other",                      label: "Other",                      icon: "grid" }
];

/* ------------------------------ Contact center operations ------------------------------- */
const OPS_CHANNELS = [
  { id: "voice",  label: "Voice",           icon: "phone" },
  { id: "chat",   label: "Chat / Messaging", icon: "messageCircle" },
  { id: "email",  label: "Email",           icon: "mail" },
  { id: "sms",    label: "SMS",             icon: "smartphone" },
  { id: "social", label: "Social",          icon: "share" },
  { id: "video",  label: "Video",           icon: "video" }
];

const OPS_VOLUME = [
  { id: "v1", label: "Under 10k / month" },
  { id: "v2", label: "10k–50k / month" },
  { id: "v3", label: "50k–250k / month" },
  { id: "v4", label: "250k+ / month" }
];

/* ------------------------------ Business goals ------------------------------- */
const BUSINESS_GOALS = [
  { id: "cx",          label: "Improve customer experience",  icon: "heart" },
  { id: "ex",          label: "Improve employee engagement",  icon: "users" },
  { id: "cost",        label: "Reduce costs",                 icon: "coinDown" },
  { id: "productivity",label: "Increase productivity",        icon: "trendUp" },
  { id: "quality",     label: "Improve quality",               icon: "badgeCheck" },
  { id: "attrition",   label: "Reduce attrition",              icon: "userMinus" },
  { id: "sales",       label: "Increase sales",                icon: "trendUpDollar" },
  { id: "compliance",  label: "Improve compliance",            icon: "shield" },
  { id: "forecasting", label: "Better forecasting",            icon: "calendar" },
  { id: "visibility",  label: "Better visibility",             icon: "eye" },
  { id: "ai_adoption", label: "AI adoption",                   icon: "cpu" }
];
const MAX_GOALS = 3;

/* ------------------------------ Current challenges ------------------------------- */
const CHALLENGES = [
  { id: "dashboards",       label: "Too many dashboards to check" },
  { id: "poor_performers",  label: "Hard to identify poor performers quickly" },
  { id: "coaching_slow",    label: "Coaching takes too long to deliver" },
  { id: "qa_backlog",       label: "QA backlog keeps growing" },
  { id: "calibration",      label: "Low calibration consistency across evaluators" },
  { id: "wfm_accuracy",     label: "Forecasts and schedules aren't accurate" },
  { id: "shrinkage",        label: "High shrinkage" },
  { id: "absence",          label: "High absence" },
  { id: "trends",           label: "Hard to spot trends before they become problems" },
  { id: "visibility",       label: "Poor visibility into what's really happening" },
  { id: "roi",               label: "Difficult proving ROI of WEM investment" },
  { id: "react_late",        label: "Managers react too late to issues" },
  { id: "routing",            label: "Call routing / IVR feels overly complex" }
];

/* Quick, tactical tips shown when a matching challenge is selected. */
const CHALLENGE_TIPS = {
  dashboards: "Consolidate reporting into a single WEM view so managers stop hopping between systems.",
  poor_performers: "Set up exception-based alerts so underperformance surfaces automatically, not by chance.",
  coaching_slow: "Pre-populate coaching conversations with evaluation and analytics data to cut prep time.",
  qa_backlog: "Introduce AI-assisted scoring on a subset of interactions to reclaim evaluator capacity fast.",
  calibration: "Run a short, recurring calibration session using the same 3-5 interactions across evaluators.",
  wfm_accuracy: "Compare forecast-vs-actual weekly for a month to quantify exactly where accuracy breaks down.",
  shrinkage: "Break shrinkage into categories (training, meetings, absence) to find the biggest single lever.",
  absence: "Layer absence trends over schedule data to see if certain shifts or teams are disproportionately affected.",
  trends: "Set a recurring 15-minute trend review using existing analytics, even before adding new tooling.",
  visibility: "Agree the 5 metrics leadership actually needs to see, and build one view around just those.",
  roi: "Baseline 2-3 metrics before any change so the next initiative has a before/after story.",
  react_late: "Move key alerts from end-of-day reports to real-time or near-real-time triggers.",
  routing: "Map your top 5 call flows end-to-end to find where callers repeat effort or abandon."
};

/* ------------------------------- Likert scale ------------------------------- */
const LIKERT_SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" }
];

/* ------------------------- Per-module maturity statements -------------------
   Compact rating screens (one screen per module): visitors rate agreement
   1-5 with each statement; the average maps directly to that module's
   maturity level. Skipped entirely for "just getting started" visitors,
   who are scored as Level 0 (Zero Usage) for every module they picked.
---------------------------------------------------------------------------- */
const LIKERT_STATEMENTS = {
  wfm: [
    { id: "wfm1", text: "Our forecasts are accurate enough to trust for planning." },
    { id: "wfm2", text: "Schedules reflect real demand, not just history." },
    { id: "wfm3", text: "Intraday changes are handled quickly when demand shifts." },
    { id: "wfm4", text: "Shrinkage and absence are visible and managed proactively." },
    { id: "wfm5", text: "Agents have some flexibility or input into their schedules." },
    { id: "wfm6", text: "Leaders can quickly see where staffing gaps exist." }
  ],
  qm: [
    { id: "qm1", text: "Evaluations are completed consistently." },
    { id: "qm2", text: "Our QA forms are reviewed regularly." },
    { id: "qm3", text: "Evaluations are completed within SLA." },
    { id: "qm4", text: "Calibration sessions happen regularly." },
    { id: "qm5", text: "Quality scores are used to improve coaching." },
    { id: "qm6", text: "Managers can quickly identify quality trends." }
  ],
  sta: [
    { id: "sta1", text: "We can quickly identify why customers are contacting us." },
    { id: "sta2", text: "Analytics insights are reviewed regularly by the business." },
    { id: "sta3", text: "Insights are tied to specific KPIs, not just interesting trends." },
    { id: "sta4", text: "Analytics findings lead to real process or coaching changes." },
    { id: "sta5", text: "Supervisors know how to act on analytics-driven alerts." },
    { id: "sta6", text: "We can spot emerging issues before they become widespread." }
  ],
  ep: [
    { id: "ep1", text: "Coaching happens on a regular, predictable cadence." },
    { id: "ep2", text: "Coaching is based on data, not just gut feel." },
    { id: "ep3", text: "Agents get clear, actionable feedback on their performance." },
    { id: "ep4", text: "We recognize and reward strong performance consistently." },
    { id: "ep5", text: "Development plans are tailored to the individual." },
    { id: "ep6", text: "Leaders can see performance trends across the team, not just individuals." }
  ]
};

/* AI Readiness — scored separately from WEM process maturity. Always asked,
   regardless of journey stage, since it reflects organizational/cultural
   readiness rather than Genesys WEM adoption specifically. */
const AI_READINESS_STATEMENTS = [
  { id: "ai1", text: "We trust AI-generated insights." },
  { id: "ai2", text: "Managers use AI recommendations." },
  { id: "ai3", text: "AI supports our quality evaluations." },
  { id: "ai4", text: "AI summarises customer interactions for us." },
  { id: "ai5", text: "AI helps managers prioritise their work." },
  { id: "ai6", text: "We're comfortable allowing AI to automate low-risk tasks." }
];

/* -------------------------- Benefit benchmark stats --------------------------
   Conservative / likely / optimistic % ranges, drawn from the Genesys WEM
   value-calculator benchmark bands (illustrative, directional estimates —
   actual results vary by organization).
---------------------------------------------------------------------------- */
const BENEFIT_STATS = {
  wfm: [
    { metric: "Improved schedule adherence", action: "closing manual scheduling gaps", low: 5, likely: 10, high: 15 },
    { metric: "Improved agent occupancy", action: "optimizing intraday scheduling", low: 8.5, likely: 10, high: 11.5 },
    { metric: "Reduced agent overstaffing", action: "tightening forecast-to-schedule accuracy", low: 10, likely: 15, high: 20 },
    { metric: "Reduced supervisor administration time", action: "automating routine WFM admin", low: 40, likely: 47, high: 54 }
  ],
  qm: [
    { metric: "Reduced quality evaluation time", action: "introducing AI-assisted evaluations", low: 22, likely: 35, high: 48 },
    { metric: "Reduced quality management admin effort", action: "automating monitoring and reporting", low: 35, likely: 47, high: 62 },
    { metric: "Improved coaching evaluation time", action: "streamlining evaluation-to-coaching workflows", low: 15, likely: 20, high: 25 },
    { metric: "Improved first contact resolution", action: "closing root-cause gaps found in evaluations", low: 4, likely: 6, high: 8 }
  ],
  sta: [
    { metric: "Reduced average handle time", action: "using real-time conversation analytics", low: 6.7, likely: 9.2, high: 10.5 },
    { metric: "Reduced administration costs with Supervisor Copilot", action: "adopting Supervisor AI / Copilot", low: 33, likely: 38, high: 43 },
    { metric: "Reduced supervisor evaluation effort", action: "using AI-assisted translation and summarization", low: 17, likely: 20, high: 25 },
    { metric: "Reduced outbound handle time", action: "guiding agents with real-time talk-path insight", low: 4, likely: 8, high: 12 }
  ],
  ep: [
    { metric: "Reduced employee performance admin effort", action: "automating performance tracking and reporting", low: 30, likely: 45, high: 60 },
    { metric: "Reduced training cost", action: "introducing gamified, self-directed learning", low: 15, likely: 25, high: 35 },
    { metric: "Improved agent adherence", action: "introducing gamification", low: 6, likely: 10, high: 14 },
    { metric: "Reduced agent turnover", action: "improving recognition and coaching consistency", low: 1, likely: 2, high: 3 }
  ]
};

/* ------------------------ Real customer outcome stats -----------------------
   Drawn from Genesys product materials — results reported by specific,
   selected customers, not guaranteed or typical outcomes. Shown separately
   from the value-calculator ranges above, clearly labelled as real examples
   rather than an estimate for the visitor's own organization.
---------------------------------------------------------------------------- */
const CASE_STUDY_STATS = {
  wfm: [
    "88% improvement in service levels after AI-powered demand prediction (reported by GSG)",
    "$250,000 in annual cost avoidance through WEM (reported by GSG)",
    "10% increase in schedule adherence (reported by Adapthealth)",
    "5% reduction in handle time (reported by Nuuday)"
  ],
  qm: [
    "20% improvement in CSAT scores",
    "69% reduction in critical failures",
    "35% reduction in time to evaluate agents with AI scoring",
    "38% reduction in administrative costs with AI scoring"
  ],
  sta: [
    "12% increase in quality scores",
    "5% rise in service levels and quality scores",
    "15% productivity time savings from real-time supervision",
    "69% reduction in critical failures"
  ],
  ep: [
    "20% reduction in agent turnover alongside a 13% rise in productivity",
    "55% higher NPS",
    "13% increase in first-contact resolution (FCR)"
  ]
};
const CASE_STUDY_DISCLAIMER = "Based on results reported by specific, selected Genesys customers. Individual results vary and are not guaranteed.";

/* --------------------------- Best-practice notes --------------------------- */
const BEST_PRACTICE = {
  wfm: {
    0: "Even before deploying WFM, document how staffing decisions get made today — it makes the first rollout far smoother.",
    1: "Leading operations pair a single source of forecasting truth with clear planner ownership before automating further.",
    2: "Mature WFM teams protect adoption by measuring plan-vs-actual variance and closing the loop on why overrides happen.",
    3: "High-performing teams pair trusted forecasting with agent-facing flexibility (bidding, self-service) to improve both service and experience.",
    4: "Strategic WFM organizations treat forecasting accuracy as a living metric, continuously retrained against real demand signals.",
    5: "The most advanced teams still keep a human in the loop for exceptions, even as day-to-day planning runs autonomously."
  },
  qm: {
    0: "Best practice starts with a small, consistent evaluation form tied to 3–5 outcomes that matter, not exhaustive scorecards.",
    1: "Best practice starts with a small, consistent evaluation form tied to 3–5 outcomes that matter, not exhaustive scorecards.",
    2: "Regular calibration sessions across evaluators are the fastest way to close scoring-consistency gaps.",
    3: "Leading quality programs treat surveys and evaluations as one feedback loop, not two separate processes.",
    4: "Mature programs use AI scoring to increase coverage, while keeping humans focused on coaching and edge cases.",
    5: "Even fully autonomous QM programs keep a governance layer reviewing AI decisions for bias and drift."
  },
  sta: {
    0: "Start analytics with 3–5 business questions leadership actually asks, rather than analyzing everything at once.",
    1: "Start analytics with 3–5 business questions leadership actually asks, rather than analyzing everything at once.",
    2: "Tie every analytics topic to an owner and a KPI — insight without ownership rarely turns into action.",
    3: "Give supervisors a weekly ritual for reviewing AI-surfaced trends so insight becomes a habit, not a one-off report.",
    4: "The most advanced teams treat AI recommendations as a starting point for supervisors, not a replacement for judgment.",
    5: "Continuously audit which AI-surfaced signals actually drove action, and retire the ones that don't."
  },
  ep: {
    0: "Even a lightweight, consistent coaching cadence beats an elaborate program used inconsistently.",
    1: "Even a lightweight, consistent coaching cadence beats an elaborate program used inconsistently.",
    2: "Link every coaching conversation to a specific data point (an evaluation, a metric, a trend) to build credibility.",
    3: "Gamification sustains engagement longest when it's tied to behaviors that also improve customer outcomes.",
    4: "The strongest programs personalize development paths while keeping a visible line to business results.",
    5: "Keep development personal — pair autonomous, AI-driven coaching with regular human check-ins."
  }
};

/* --------------------------- Assumed pain points ---------------------------
   Shown as "you may be experiencing" style hypotheses tied to low scores,
   blended at runtime with any challenges the visitor actually selected.
---------------------------------------------------------------------------- */
const ASSUMED_PAIN = {
  wfm: {
    0: ["No structured view of staffing needs today", "Coverage relies on individual judgment, not data"],
    1: ["Frequent understaffing or overstaffing surprises", "Planner time consumed by manual rework"],
    2: ["Frontline trust in schedules is inconsistent", "Shadow spreadsheets persist alongside WFM"],
    3: ["Capacity planning is solid but rigid to sudden demand shifts"],
    4: ["Balancing full automation with planner and agent trust"],
    5: ["Ensuring exception handling keeps pace with full autonomy"]
  },
  qm: {
    0: ["Compliance and risk exposure is essentially unknown"],
    1: ["Compliance and risk exposure is largely unknown", "Evaluation feels subjective or unfair to agents"],
    2: ["Evaluators score inconsistently across sites/teams", "Survey data is collected but quietly ignored"],
    3: ["Manual evaluation coverage limits sample size"],
    4: ["Keeping human coaching central as AI scoring scales"],
    5: ["Governance keeping pace with fully autonomous risk detection"]
  },
  sta: {
    0: ["No visibility into root causes of customer friction at all"],
    1: ["Root causes of customer friction are guessed, not known", "Compliance/risk signals in conversations go unseen"],
    2: ["Insight exists but doesn't reach frontline decisions", "Supervisors are unsure how to use AI tools day to day"],
    3: ["Insight-to-action is inconsistent across teams"],
    4: ["Governance keeping pace with AI-driven recommendations"],
    5: ["Keeping frontline teams from becoming over-reliant on AI signals"]
  },
  ep: {
    0: ["No baseline to know if engagement or performance is improving"],
    1: ["Agent engagement and retention are hard to explain or predict", "Coaching quality depends heavily on individual leaders"],
    2: ["Coaching and analytics/evaluation data live in separate worlds", "Engagement programs reach only part of the workforce"],
    3: ["Hard to prove ROI of coaching/engagement programs to leadership"],
    4: ["Keeping personalization human-feeling as it scales with AI"],
    5: ["Keeping autonomous coaching aligned as business priorities shift"]
  }
};

/* ------------------------ Public-facing PS services ------------------------
   Names & descriptions only — no internal pricing, hours or positioning.
---------------------------------------------------------------------------- */
const SERVICES = {
  wfm_deploy: { name: "Workforce Management Guided Configuration", blurb: "Hands-on configuration of forecasting, scheduling and capacity planning, so your team builds confidence and capability from day one." },
  wfm_review: { name: "WFM Optimization Review", blurb: "A focused review of your current WFM usage that surfaces quick wins and a prioritized improvement roadmap." },
  wfm_mentor: { name: "WFM Mentoring Engagement", blurb: "An ongoing, expert-led engagement that helps your team close forecasting, scheduling and capacity-planning gaps over time." },
  qm_deploy: { name: "Quality Management Guided Configuration", blurb: "Guided setup of evaluation forms, quality policies and workflows aligned to your business outcomes." },
  survey_deploy: { name: "Post-Interaction Survey Guided Configuration", blurb: "Design and launch consistent Web and/or Voice surveys that connect feedback to action." },
  qmsta_review: { name: "QM / STA Optimization Review", blurb: "A focused review of your quality and analytics practices, identifying gaps in evaluation, calibration and insight-to-action." },
  qmsta_mentor: { name: "QM / STA Mentoring Engagement", blurb: "Ongoing expert-led sessions that build AI-ready quality practices and turn insight into consistent action." },
  sta_deploy: { name: "Speech & Text Analytics + Supervisor AI Guided Configuration", blurb: "KPI-led configuration of analytics topics, trends and Supervisor AI so insight drives day-to-day decisions." },
  ep_deploy: { name: "Employee Performance Guided Configuration", blurb: "Guided setup of gamification, coaching and learning so development is personalized and tied to metrics from day one." },
  routing_review: { name: "WEM Routing Review", blurb: "An advisory review of call flows, queues and routing design to improve customer experience, forecasting accuracy and future AI/bot readiness." },
  readiness: { name: "WEM Transformation Readiness Consulting", blurb: "An advisory engagement that aligns your goals, processes and WEM capabilities into one practical roadmap before you invest further." },
  enterprise: { name: "Enterprise WEM Transformation", blurb: "A structured, multi-phase engagement to define your future-state WEM operating model and guide large-scale migration and adoption." },
  insights: { name: "WEM Insights & KPI Design", blurb: "Refine KPIs and reporting so your WEM investment stays connected to measurable business outcomes." }
};

/* Generic action checklists shown under a module's recommendation, in the
   spirit of "Quality Management Optimisation: review, optimise, introduce
   AI, calibrate, build coaching workflows." Applies regardless of which
   specific service gets recommended for that module. */
const MODULE_CHECKLISTS = {
  wfm: ["Review current forecasting & scheduling approach", "Identify automation and self-service opportunities", "Tighten the loop between forecasts and real-time demand", "Introduce or expand AI-assisted forecasting", "Build a capacity-planning cadence tied to business KPIs"],
  qm: ["Review current evaluation strategy", "Optimise QA forms and scoring criteria", "Introduce AI-assisted evaluations", "Improve calibration across evaluators", "Build coaching workflows linked to quality data"],
  sta: ["Define the KPIs analytics should answer", "Refine topics and phrases to reduce noise", "Connect insights to coaching and process owners", "Introduce or expand Supervisor AI / Copilot", "Build a weekly insight-to-action review habit"],
  ep: ["Review current coaching and development cadence", "Link coaching to evaluation and analytics data", "Introduce or expand gamification for key teams", "Build individual development/performance profiles", "Tie engagement metrics to business outcomes"]
};

/* --------------------------- Combined maturity copy ------------------------- */
const COMBINED_COPY = {
  0: "You're right at the start of your WEM journey — the priority is standing up foundational capability across the areas you care about.",
  1: "You're at the start of your WEM journey — the biggest gains right now come from getting foundational capability in place and adopted.",
  2: "Your capabilities are deployed but adoption is still building — the priority is closing the gap between what's enabled and what's actually used.",
  3: "Your WEM capabilities are consistent and data-informed — the opportunity now is connecting them together and pushing toward AI-assisted operations.",
  4: "You're operating at a predictive, AI-enhanced level — the focus shifts to scaling that intelligence enterprise-wide.",
  5: "You're operating with autonomous, continuously self-optimizing WEM — the focus shifts to governance and using it as a durable differentiator."
};

/* -------------------------- AI Readiness narrative --------------------------
   Framed around a simple, widely-used progression for AI trust:
   Detect -> Assist -> Validate -> Automate. Signals are noticed, then AI
   helps investigate, then validated plans are trusted, then they run with
   little or no human intervention.
---------------------------------------------------------------------------- */
const AI_READINESS_COPY = {
  1: "You're at the 'Detect' stage — signals exist, but AI isn't yet part of how managers investigate or act on them.",
  2: "You're moving into 'Assist' — AI tools are starting to help investigate issues, but trust and habitual use are still building.",
  3: "You're solidly in 'Assist' — AI recommendations are used in places, but not yet a default part of how managers work day to day.",
  4: "You're approaching 'Validate' — AI recommendations are generally trusted, with a path opening up to more automated, human-approved execution.",
  5: "You've reached 'Automate' — validated, AI-driven plans run with little manual intervention, and AI is a trusted part of daily decisions."
};

/* --------------------- Indicative industry benchmark levels -----------------
   A blended, directional estimate of where "typical" peer organizations sit
   per module (0-5) — informed by common patterns referenced in public
   contact-center benchmarking frameworks (e.g. COPC, ContactBabel, SQM,
   APQC), NOT a literal figure from any single named source. Used only to
   give visitors a rough sense of "ahead of / in line with / behind" peers.
---------------------------------------------------------------------------- */
const INDUSTRY_BENCHMARK = {
  "Financial Services":         { wfm: 3, qm: 3, sta: 3, ep: 2 },
  "Retail & eCommerce":         { wfm: 2, qm: 2, sta: 3, ep: 2 },
  "Healthcare":                 { wfm: 2, qm: 3, sta: 2, ep: 2 },
  "Telecom & Utilities":        { wfm: 3, qm: 3, sta: 3, ep: 2 },
  "Travel & Hospitality":       { wfm: 2, qm: 2, sta: 2, ep: 2 },
  "Government & Public Sector": { wfm: 2, qm: 2, sta: 1, ep: 1 },
  "Other":                      { wfm: 2, qm: 2, sta: 2, ep: 2 }
};

/* -------------------------------- Fun facts ---------------------------------
   Shown as brief, delightful "did you know" interstitials between question
   blocks to keep momentum at a booth. Each is attributed to its real source
   — general industry research, not Genesys-specific outcome claims.
---------------------------------------------------------------------------- */
const FUN_FACTS = [
  { stat: "51%", text: "of decision-makers are planning to focus their AI efforts on employee productivity.", source: "Forrester, State of AI Survey, 2025" },
  { stat: "78%", text: "less absenteeism is typical among highly engaged teams compared to disengaged ones.", source: "Gallup, State of the Global Workplace Report, 2025" },
  { stat: "51%", text: "lower turnover is typical among highly engaged teams compared to disengaged ones.", source: "Gallup Employee Engagement Meta-Analysis" },
  { stat: "23%", text: "higher profitability is typical among highly engaged teams compared to disengaged ones.", source: "Gallup, State of the Global Workplace Report, 2025" },
  { stat: "37%", text: "of decision-makers say AI is already improving employee effectiveness.", source: "Forrester, State of AI Survey, 2025" }
];

/* Goals that most directly connect to each module, used to decide which
   modules' benefits/services get emphasized first when building the report. */
const GOAL_MODULE_EMPHASIS = {
  cx: ["sta", "qm"],
  ex: ["ep", "wfm"],
  cost: ["wfm", "qm"],
  productivity: ["wfm", "sta"],
  quality: ["qm"],
  attrition: ["ep"],
  sales: ["sta"],
  compliance: ["qm"],
  forecasting: ["wfm"],
  visibility: ["sta", "qm"],
  ai_adoption: ["sta", "qm"]
};

if (typeof module !== "undefined") {
  module.exports = {
    LEVELS, MAX_LEVEL, MODULES, MODULE_ORDER, JOURNEY_STAGES, ORG_SIZES, INDUSTRIES,
    OPS_CHANNELS, OPS_VOLUME, BUSINESS_GOALS, MAX_GOALS, CHALLENGES, CHALLENGE_TIPS,
    LIKERT_SCALE, LIKERT_STATEMENTS, AI_READINESS_STATEMENTS, BENEFIT_STATS,
    BEST_PRACTICE, ASSUMED_PAIN, SERVICES, MODULE_CHECKLISTS, COMBINED_COPY,
    AI_READINESS_COPY, INDUSTRY_BENCHMARK, GOAL_MODULE_EMPHASIS, FUN_FACTS,
    CASE_STUDY_STATS, CASE_STUDY_DISCLAIMER
  };
}

// Expose on window for browser-side testability (top-level const/let in a
// classic <script> do NOT become window properties automatically).
if (typeof window !== "undefined") {
  window.LEVELS = LEVELS; window.MAX_LEVEL = MAX_LEVEL; window.MODULES = MODULES;
  window.MODULE_ORDER = MODULE_ORDER; window.JOURNEY_STAGES = JOURNEY_STAGES;
  window.ORG_SIZES = ORG_SIZES; window.INDUSTRIES = INDUSTRIES;
  window.OPS_CHANNELS = OPS_CHANNELS; window.OPS_VOLUME = OPS_VOLUME;
  window.BUSINESS_GOALS = BUSINESS_GOALS; window.MAX_GOALS = MAX_GOALS;
  window.CHALLENGES = CHALLENGES; window.CHALLENGE_TIPS = CHALLENGE_TIPS;
  window.LIKERT_SCALE = LIKERT_SCALE; window.LIKERT_STATEMENTS = LIKERT_STATEMENTS;
  window.AI_READINESS_STATEMENTS = AI_READINESS_STATEMENTS;
  window.BENEFIT_STATS = BENEFIT_STATS; window.BEST_PRACTICE = BEST_PRACTICE;
  window.ASSUMED_PAIN = ASSUMED_PAIN; window.SERVICES = SERVICES;
  window.MODULE_CHECKLISTS = MODULE_CHECKLISTS; window.COMBINED_COPY = COMBINED_COPY;
  window.AI_READINESS_COPY = AI_READINESS_COPY; window.INDUSTRY_BENCHMARK = INDUSTRY_BENCHMARK;
  window.GOAL_MODULE_EMPHASIS = GOAL_MODULE_EMPHASIS; window.FUN_FACTS = FUN_FACTS;
  window.CASE_STUDY_STATS = CASE_STUDY_STATS; window.CASE_STUDY_DISCLAIMER = CASE_STUDY_DISCLAIMER;
}
