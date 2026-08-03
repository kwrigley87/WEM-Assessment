/* ==========================================================================
   PDF report generation (client-side, via jsPDF — no backend required).
   Mirrors the on-screen "Gartner-style" report: executive summary, combined
   + AI-readiness maturity, radar chart, next best workshop, per-module
   detail (benchmark, benefit narrative, checklist, service, case studies),
   quick wins and a 3-phase roadmap.
   ========================================================================== */
const BRAND = {
  orange: [255, 79, 31],
  navy: [35, 57, 80],
  grey: [110, 120, 130]
};

function levelBarColor(level) {
  return [
    [255, 217, 191],
    [255, 200, 150],
    [255, 150, 90],
    [255, 110, 56],
    BRAND.orange
  ][Math.max(0, level - 1)];
}

function buildPDF(report) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 0;

  function header() {
    doc.setFillColor(...BRAND.navy);
    doc.rect(0, 0, pageW, 78, "F");
    doc.setFillColor(...BRAND.orange);
    doc.rect(0, 78, pageW, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Genesys WEM Maturity Snapshot", marginX, 34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Workforce Engagement Management — bespoke assessment results", marginX, 52);
    doc.setFontSize(9);
    doc.text(new Date(report.generatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), marginX, 66);
    y = 108;
  }

  function footer() {
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, h - 44, pageW - marginX, h - 44);
    doc.setTextColor(...BRAND.grey);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Prepared for ${report.clientInfo.firstName || "you"}${report.clientInfo.company ? " · " + report.clientInfo.company : ""}  ·  Estimates are indicative and vary by organization.`,
      marginX, h - 30
    );
    doc.text(`Genesys Professional Services  ·  ${CONFIG.event.contactEmail}`, marginX, h - 18);
  }

  function ensureSpace(needed) {
    const h = doc.internal.pageSize.getHeight();
    if (y + needed > h - 60) {
      footer();
      doc.addPage();
      header();
    }
  }

  function heading(text) {
    ensureSpace(28);
    doc.setTextColor(...BRAND.navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, marginX, y);
    y += 16;
  }

  function bodyText(text, opts = {}) {
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 10.5);
    const lines = doc.splitTextToSize(text, pageW - marginX * 2 - (opts.indent || 0));
    ensureSpace(lines.length * 14 + 6);
    doc.text(lines, marginX + (opts.indent || 0), y);
    y += lines.length * 14 + 4;
  }

  function bulletList(items, indent = 0, bulletChar = "•") {
    items.forEach((it) => {
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(`${bulletChar}  ${it}`, pageW - marginX * 2 - indent);
      ensureSpace(lines.length * 14 + 2);
      doc.text(lines, marginX + indent, y);
      y += lines.length * 14 + 2;
    });
    y += 4;
  }

  function levelBar(level, label, targetLevel) {
    ensureSpace(22);
    const barX = marginX;
    const barW = pageW - marginX * 2;
    const segW = barW / MAX_LEVEL;
    for (let i = 0; i < MAX_LEVEL; i++) {
      doc.setFillColor(...(i < level ? levelBarColor(level) : [230, 232, 235]));
      doc.rect(barX + i * segW, y, segW - 4, 10, "F");
      if (targetLevel && i === targetLevel - 1 && targetLevel > level) {
        doc.setDrawColor(...BRAND.navy);
        doc.setLineWidth(1.4);
        doc.rect(barX + i * segW, y, segW - 4, 10);
      }
    }
    y += 16;
    doc.setTextColor(...BRAND.navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let caption = `Level ${level} of ${MAX_LEVEL} — ${label}`;
    if (targetLevel && targetLevel > level) caption += `   (target: Level ${targetLevel})`;
    doc.text(caption, barX, y);
    y += 18;
  }

  header();

  // Executive summary
  heading("Executive Summary");
  bodyText(report.execSummary);
  y += 4;

  // Combined maturity + AI readiness
  heading("Your Combined WEM Maturity");
  levelBar(report.combined.level, report.combined.levelName);
  bodyText(report.combined.copy);
  y += 4;

  heading("AI Readiness (scored separately from WEM maturity)");
  levelBar(report.aiReadiness.level, report.aiReadiness.levelName);
  bodyText(report.aiReadiness.copy);
  y += 4;

  // Radar chart image, if the visitor has already seen the results screen
  const radarCanvas = document.getElementById("radar-chart");
  if (radarCanvas) {
    try {
      const imgData = radarCanvas.toDataURL("image/png");
      const imgW = 300, imgH = 240;
      ensureSpace(imgH + 20);
      doc.addImage(imgData, "PNG", marginX, y, imgW, imgH);
      y += imgH + 12;
    } catch (e) { /* canvas not ready — skip the image, text content still covers everything */ }
  }

  // Next Best Workshop
  if (report.nextBestWorkshop && report.nextBestWorkshop.service) {
    heading("Next Best Workshop");
    bodyText(`${report.nextBestWorkshop.service.name} — recommended first for ${report.nextBestWorkshop.module}`, { bold: true });
    bodyText(report.nextBestWorkshop.service.blurb);
    y += 4;
  }

  // Quick wins
  if (report.quickWins && report.quickWins.length) {
    heading("Quick Wins");
    bulletList(report.quickWins);
  }

  // Per-module detail
  report.moduleResults.forEach((m) => {
    ensureSpace(40);
    heading(m.name);
    levelBar(m.level, m.levelName, m.targetLevel);
    bodyText(`You're ${m.benchmarkComparison} typical ${report.clientInfo.industry} peers (peer level: ${m.peerLevel} — ${m.peerLevelName}).`, { bold: true });
    bodyText(m.description);
    bodyText(m.benefitNarrative);
    bodyText("Recommended actions:", { bold: true });
    bulletList(m.checklist, 8, "✓");
    if (m.services && m.services.length) {
      bodyText("Recommended service:", { bold: true });
      m.services.forEach((s) => bodyText(`${s.name} — ${s.blurb}`, { indent: 8 }));
    }
    if (m.caseStudyStats && m.caseStudyStats.length) {
      bodyText("Real Genesys customer outcomes:", { bold: true });
      bulletList(m.caseStudyStats.slice(0, 3), 8);
    }
    y += 6;
  });

  // Roadmap
  if (report.roadmap) {
    heading("Suggested Roadmap");
    report.roadmap.forEach((phase) => {
      bodyText(phase.label, { bold: true });
      bulletList(phase.items, 8);
    });
  }

  // Pain points
  if (report.selectedPainLabels && report.selectedPainLabels.length) {
    heading("Things you may be experiencing");
    bulletList(report.selectedPainLabels);
  }

  // Combined services
  if (report.combinedServices && report.combinedServices.length) {
    heading("Suggested Next Steps from Genesys Professional Services");
    report.combinedServices.forEach((s) => {
      bodyText(s.name, { bold: true });
      bodyText(s.blurb);
    });
  }

  bodyText(report.caseStudyDisclaimer || "", { size: 8.5 });

  footer();
  return doc;
}

function downloadPDF(report) {
  const doc = buildPDF(report);
  const namePart = (report.clientInfo.company || report.clientInfo.firstName || "wem-snapshot").replace(/[^a-z0-9]+/gi, "-");
  doc.save(`genesys-wem-maturity-${namePart}.pdf`);
}

function pdfAsBase64(report) {
  const doc = buildPDF(report);
  return doc.output("datauristring").split(",")[1];
}
