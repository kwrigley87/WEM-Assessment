/* ==========================================================================
   Email sending via EmailJS (optional). Sends a formatted HTML summary of
   the report from the configured Genesys mailbox. Because GitHub Pages
   cannot host a generated PDF file to link to, and free email-sending
   plans generally cannot attach a dynamically generated binary file, the
   email itself carries the full report as clean HTML — the visitor's
   in-browser PDF download remains the literal "PDF" deliverable.

   If EMAILJS.enabled is false, or the send fails for any reason, the caller
   should fall back to prompting a local PDF download instead. This function
   never throws past its own try/catch — it resolves { ok: boolean }.
   ========================================================================== */

function reportToEmailHTML(report) {
  const levelRow = (m) => `
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#233950;">${m.name}</td>
      <td style="padding:6px 10px;color:#FF4F1F;font-weight:700;">Level ${m.level}/${MAX_LEVEL} — ${m.levelName}</td>
    </tr>`;

  const moduleSection = (m) => `
    <h3 style="color:#233950;margin:22px 0 4px;">${m.name} — Level ${m.level}/${MAX_LEVEL} (${m.levelName})</h3>
    <p style="margin:4px 0;color:#555;font-size:13px;">You're ${m.benchmarkComparison} typical ${report.clientInfo.industry} peers (peer level ${m.peerLevel} — ${m.peerLevelName}).</p>
    <p style="margin:4px 0;">${m.description}</p>
    <p style="margin:8px 0;font-style:italic;">${m.benefitNarrative}</p>
    <p style="margin:10px 0 2px;font-weight:600;">Recommended actions:</p>
    <ul>${m.checklist.map((c) => `<li>${c}</li>`).join("")}</ul>
    ${m.services && m.services.length ? `<p style="margin:10px 0 2px;font-weight:600;">Recommended service:</p>
    <ul>${m.services.map((s) => `<li><strong>${s.name}</strong> — ${s.blurb}</li>`).join("")}</ul>` : ""}
    ${m.caseStudyStats && m.caseStudyStats.length ? `<p style="margin:10px 0 2px;font-weight:600;">Real Genesys customer outcomes:</p>
    <ul>${m.caseStudyStats.slice(0, 3).map((c) => `<li>${c}</li>`).join("")}</ul>` : ""}
  `;

  const painItems = new Set(report.selectedPainLabels || []);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#222;">
    <div style="background:#233950;padding:24px 28px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">Genesys WEM Maturity Snapshot</h1>
      <p style="color:#f2f2f2;margin:6px 0 0;font-size:13px;">Your bespoke assessment results</p>
    </div>
    <div style="height:4px;background:#FF4F1F;"></div>
    <div style="padding:24px 28px;">
      <p>Hi ${report.clientInfo.firstName || "there"},</p>
      <p>Thanks for taking the WEM Maturity Snapshot at the Genesys booth. Here's your bespoke summary.</p>
      <div style="background:#FFF3EE;border-radius:8px;padding:12px 16px;margin:14px 0;">${report.execSummary}</div>
      <h2 style="color:#233950;font-size:16px;margin-top:20px;">Combined WEM Maturity: Level ${report.combined.level}/${MAX_LEVEL} — ${report.combined.levelName}</h2>
      <p>${report.combined.copy}</p>
      <h2 style="color:#233950;font-size:16px;">AI Readiness (separate score): Level ${report.aiReadiness.level}/${MAX_LEVEL} — ${report.aiReadiness.levelName}</h2>
      <p>${report.aiReadiness.copy}</p>
      <table style="width:100%;border-collapse:collapse;margin:14px 0;">${report.moduleResults.map(levelRow).join("")}</table>
      ${report.nextBestWorkshop && report.nextBestWorkshop.service ? `
      <div style="background:#233950;color:#fff;border-radius:8px;padding:14px 16px;margin:14px 0;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#FF4F1F;">NEXT BEST WORKSHOP</p>
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;">${report.nextBestWorkshop.service.name}</p>
        <p style="margin:0;font-size:13px;color:#E4E9EE;">${report.nextBestWorkshop.service.blurb} Recommended first for ${report.nextBestWorkshop.module}.</p>
      </div>` : ""}
      ${report.quickWins && report.quickWins.length ? `<h3 style="color:#233950;">Quick wins</h3><ul>${report.quickWins.map((q) => `<li>${q}</li>`).join("")}</ul>` : ""}
      ${report.moduleResults.map(moduleSection).join("")}
      ${report.roadmap ? `<h3 style="color:#233950;">Suggested roadmap</h3>${report.roadmap.map((p) => `<p style="margin:8px 0 2px;font-weight:600;">${p.label}</p><ul>${p.items.map((i) => `<li>${i}</li>`).join("")}</ul>`).join("")}` : ""}
      ${painItems.size ? `<h3 style="color:#233950;">Things you may be experiencing</h3><ul>${Array.from(painItems).map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
      ${report.combinedServices && report.combinedServices.length ? `<h3 style="color:#233950;">Suggested next steps</h3><ul>${report.combinedServices.map((s) => `<li><strong>${s.name}</strong> — ${s.blurb}</li>`).join("")}</ul>` : ""}
      <p style="margin-top:24px;font-size:12px;color:#777;">Estimates are indicative and vary by organization. ${report.caseStudyDisclaimer || ""}</p>
      <p style="font-size:13px;">— Genesys Professional Services · <a href="mailto:${CONFIG.event.contactEmail}">${CONFIG.event.contactEmail}</a></p>
    </div>
  </div>`;
}

async function sendReportEmail(report) {
  if (!CONFIG.EMAILJS.enabled || !window.emailjs) return { ok: false, reason: "not_configured" };
  try {
    await window.emailjs.send(
      CONFIG.EMAILJS.serviceId,
      CONFIG.EMAILJS.templateId,
      {
        to_email: report.clientInfo.email,
        to_name: report.clientInfo.firstName || "there",
        reply_to: CONFIG.event.contactEmail,
        subject: "Your Genesys WEM Maturity Snapshot",
        html_content: reportToEmailHTML(report)
      },
      CONFIG.EMAILJS.publicKey
    );
    return { ok: true };
  } catch (err) {
    console.error("EmailJS send failed", err);
    return { ok: false, reason: "send_failed", error: err };
  }
}
