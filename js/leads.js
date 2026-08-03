/* ==========================================================================
   Leads storage — every submission is saved locally in the browser
   (source of truth for the booth laptop) — this is the guaranteed path and
   works with zero configuration and no internet connection.

   Two OPTIONAL mirrors, both off by default:
   1. CONFIG.LEADS_WEBHOOK_URL — a Google Apps Script (or similar) webhook
      that appends the lead to a shared Google Sheet in real time.
   2. CONFIG.GITHUB_LEADS — a Cloudflare Worker endpoint that appends a row
      to leads.csv inside your GitHub repo via the GitHub Contents API. The
      Worker holds the GitHub token server-side (never in this client code),
      so it's safe to enable even though this app itself is fully static.
      See SETUP_GUIDE.md for the ready-to-deploy Worker script.
   Both mirrors are fire-and-forget: if they fail or there's no connection,
   the local save above has already succeeded and nothing is lost.
   ========================================================================== */
const LEADS_KEY = "wem_maturity_leads_v1";

const Leads = {
  all() {
    try {
      return JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  },

  save(lead) {
    const leads = Leads.all();
    leads.push(lead);
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));

    if (CONFIG.LEADS_WEBHOOK_URL) {
      fetch(CONFIG.LEADS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      }).catch(() => {});
    }

    if (CONFIG.GITHUB_LEADS && CONFIG.GITHUB_LEADS.enabled && CONFIG.GITHUB_LEADS.workerUrl) {
      fetch(CONFIG.GITHUB_LEADS.workerUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      }).catch(() => {});
    }

    return lead;
  },

  clearAll() {
    localStorage.removeItem(LEADS_KEY);
  },

  toCSV() {
    const leads = Leads.all();
    if (!leads.length) return "";
    const cols = [
      "timestamp", "firstName", "company", "email", "industry", "orgSize",
      "journeyStage", "modulesAssessed", "combinedLevel", "aiReadinessLevel",
      "goals", "challenges"
    ];
    const rows = leads.map((l) => cols.map((c) => `"${String(l[c] ?? "").replace(/"/g, '""')}"`).join(","));
    return [cols.join(","), ...rows].join("\n");
  },

  downloadCSV() {
    const csv = Leads.toCSV();
    if (!csv) {
      alert("No leads captured yet.");
      return;
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wem-maturity-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};

/* --------------------------------------------------------------------------
   Hidden admin panel: append #admin to the URL at any time to open a simple
   overlay showing lead count + a "Download CSV" / "Clear leads" button.
   No password — intended for booth-staff-only use on a controlled device.
---------------------------------------------------------------------------- */
function maybeShowAdminPanel() {
  if (location.hash !== "#admin") return;
  const overlay = document.createElement("div");
  overlay.className = "admin-overlay";
  const leads = Leads.all();
  overlay.innerHTML = `
    <div class="admin-panel">
      <h2>Booth Admin</h2>
      <p>${leads.length} lead${leads.length === 1 ? "" : "s"} captured on this device.</p>
      <button class="btn btn-primary" id="admin-download">Download leads CSV</button>
      <button class="btn btn-ghost" id="admin-clear">Clear all leads</button>
      <button class="btn btn-ghost" id="admin-close">Close</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById("admin-download").onclick = () => Leads.downloadCSV();
  document.getElementById("admin-clear").onclick = () => {
    if (confirm("Delete all captured leads from this device? This cannot be undone.")) {
      Leads.clearAll();
      overlay.remove();
      location.hash = "";
    }
  };
  document.getElementById("admin-close").onclick = () => {
    overlay.remove();
    location.hash = "";
  };
}
