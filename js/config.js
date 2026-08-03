/* ==========================================================================
   CONFIG — fill this in to enable automatic emailing of the PDF report.
   See SETUP_GUIDE.md for step-by-step instructions.

   If EMAILJS.enabled stays false (or sending fails), the app automatically
   falls back to: show the PDF on-screen for the visitor to download, so
   nothing is ever blocked on this configuration.
   ========================================================================== */
const CONFIG = {
  event: {
    name: "Genesys Xperience — WEM Booth",
    // Shown in the footer of the report/PDF as the "prepared by" contact.
    contactEmail: "kieron.wrigley@genesys.com"
  },

  EMAILJS: {
    enabled: false,               // set to true once the three IDs below are filled in
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    templateId: "YOUR_EMAILJS_TEMPLATE_ID"
  },

  // Optional: paste a Google Apps Script Web App URL here to also mirror
  // every lead into a Google Sheet in real time. Leave blank to skip —
  // leads are always saved locally and exportable as CSV regardless.
  LEADS_WEBHOOK_URL: "",

  // Optional: automatically append every lead as a new CSV row committed to
  // this GitHub repo. Requires deploying the small Cloudflare Worker in
  // worker/github-leads-worker.js first (see SETUP_GUIDE.md) — the GitHub
  // token lives only in that Worker's secrets, never in this browser code.
  GITHUB_LEADS: {
    enabled: false,
    workerUrl: "" // e.g. "https://wem-leads.yoursubdomain.workers.dev"
  }
};
