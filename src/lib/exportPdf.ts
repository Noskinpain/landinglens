import jsPDF from "jspdf";
import type { AuditResult } from "@/app/api/audit/route";

export async function exportToPdf(
  screenshotSrc: string,
  result: AuditResult,
  url: string,
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 14;
  const CW = W - M * 2;

  // Editorial Paper Theme Colors matching Landing Page
  const paperBg: [number, number, number] = [245, 240, 235]; // #f5f0eb
  const surfaceWhite: [number, number, number] = [255, 255, 255];
  const surfaceMuted: [number, number, number] = [237, 233, 227]; // #ede9e3
  const darkInk: [number, number, number] = [26, 26, 26]; // #1a1a1a
  const mutedText: [number, number, number] = [120, 115, 110];
  const borderRule: [number, number, number] = [210, 204, 196];
  const criticalRed: [number, number, number] = [198, 40, 40];
  const successGreen: [number, number, number] = [46, 125, 50];

  const newPage = () => {
    pdf.addPage();
    pdf.setFillColor(...paperBg);
    pdf.rect(0, 0, W, H, "F");
    return M;
  };

  // Base canvas (Warm editorial paper)
  pdf.setFillColor(...paperBg);
  pdf.rect(0, 0, W, H, "F");

  // Top Rule
  pdf.setFillColor(...darkInk);
  pdf.rect(0, 0, W, 2, "F");

  // Header Brand Block
  pdf.setFillColor(...darkInk);
  pdf.rect(0, 2, W, 38, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("LANDINGLENS", M, 16);

  pdf.setTextColor(200, 195, 190);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("EXECUTIVE CONVERSION RATE DIAGNOSTIC REPORT", M, 23);

  const cleanDomain = url.replace(/^https?:\/\//, "");
  pdf.text(`Target URL: ${cleanDomain} | Verified Response Latency: ${result.telemetry?.responseTimeMs || 0}ms`, M, 29);
  pdf.text(
    `Report Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    M,
    35,
  );

  let y = 48;

  // ── Executive Score Hero Card ──
  pdf.setFillColor(...surfaceWhite);
  pdf.roundedRect(M, y, CW, 30, 2, 2, "F");
  pdf.setDrawColor(...borderRule);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, CW, 30, 2, 2, "D");

  // Score Number
  pdf.setTextColor(...darkInk);
  pdf.setFontSize(44);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${result.score}`, M + 8, y + 18);

  pdf.setTextColor(...mutedText);
  pdf.setFontSize(12);
  pdf.text("/ 100", M + 34, y + 18);

  // Grade badge pill
  pdf.setFillColor(...surfaceMuted);
  pdf.roundedRect(M + 8, y + 21, 65, 6, 1, 1, "F");
  pdf.setTextColor(...darkInk);
  pdf.setFontSize(6.5);
  pdf.setFont("helvetica", "bold");
  pdf.text(result.grade.toUpperCase(), M + 11, y + 25.5);

  // Quick summary line next to score
  pdf.setTextColor(...darkInk);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  const shortVerdict = pdf.splitTextToSize(`"${result.verdict.split(".")[0]}."`, CW - 65);
  pdf.text(shortVerdict, M + 55, y + 10);

  pdf.setTextColor(...mutedText);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  const verdictDetail = pdf.splitTextToSize(result.verdict.split(".").slice(1).join(".").trim(), CW - 65);
  pdf.text(verdictDetail.slice(0, 3), M + 55, y + 18);

  y += 36;

  // ── Telemetry Matrix ──
  if (result.telemetry) {
    pdf.setFillColor(...surfaceWhite);
    pdf.roundedRect(M, y, CW, 14, 1.5, 1.5, "F");
    pdf.setDrawColor(...borderRule);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, CW, 14, 1.5, 1.5, "D");

    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");

    const colW = CW / 4;
    const tData = [
      { k: "SERVER LATENCY", v: `${result.telemetry.responseTimeMs}ms` },
      { k: "HEADING 1 NODE", v: result.telemetry.h1Count === 1 ? "1 (Verified)" : `${result.telemetry.h1Count} (Attention)` },
      { k: "CONTENT VOLUME", v: `${result.telemetry.wordCount} words` },
      { k: "SOCIAL PROOF DOM", v: result.telemetry.hasSocialProof ? "Verified" : "Unverified" },
    ];

    tData.forEach((t, i) => {
      const tx = M + i * colW + 4;
      pdf.setTextColor(...mutedText);
      pdf.text(t.k, tx, y + 5);
      pdf.setTextColor(...darkInk);
      pdf.text(t.v, tx, y + 10);
    });

    y += 18;
  }

  // ── 5-Pillar Score Grid ──
  if (result.pillars && result.pillars.length > 0) {
    pdf.setTextColor(...darkInk);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.text("CONVERSION PILLAR ASSESSMENT", M, y);
    y += 4;

    const pillarW = (CW - 8) / result.pillars.length;
    result.pillars.forEach((p, idx) => {
      const px = M + idx * (pillarW + 2);
      pdf.setFillColor(...surfaceWhite);
      pdf.roundedRect(px, y, pillarW, 20, 1.5, 1.5, "F");
      pdf.setDrawColor(...borderRule);
      pdf.roundedRect(px, y, pillarW, 20, 1.5, 1.5, "D");

      // Progress bar line
      const barColor = p.score >= 75 ? successGreen : p.score >= 60 ? darkInk : criticalRed;
      pdf.setFillColor(...barColor);
      pdf.rect(px, y, pillarW, 1, "F");

      pdf.setTextColor(...mutedText);
      pdf.setFontSize(5.5);
      pdf.setFont("helvetica", "bold");
      const nameLines = pdf.splitTextToSize(p.name, pillarW - 4);
      pdf.text(nameLines[0] || "", px + 3, y + 5.5);

      pdf.setTextColor(...darkInk);
      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${p.score}`, px + 3, y + 12.5);

      pdf.setTextColor(...mutedText);
      pdf.setFontSize(5);
      pdf.setFont("helvetica", "normal");
      pdf.text(p.benchmark, px + 3, y + 17);
    });

    y += 25;
  }

  // ── 5-Second Test Diagnostic ──
  if (result.five_second_test) {
    pdf.setFillColor(...surfaceWhite);
    pdf.roundedRect(M, y, CW, 21, 1.5, 1.5, "F");
    pdf.setDrawColor(...borderRule);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, CW, 21, 1.5, 1.5, "D");

    pdf.setTextColor(...darkInk);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.text("FIRST-IMPRESSION COGNITIVE ASSESSMENT", M + 5, y + 5.5);

    pdf.setTextColor(...darkInk);
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "normal");
    const l1 = pdf.splitTextToSize(`Immediate Interpretation: ${result.five_second_test.what_they_think_you_do}`, CW - 10);
    const l2 = pdf.splitTextToSize(`Primary Exit Driver: ${result.five_second_test.top_bounce_reason}`, CW - 10);
    pdf.text(l1[0] || "", M + 5, y + 11.5);
    pdf.setTextColor(...criticalRed);
    pdf.text(l2[0] || "", M + 5, y + 17);

    y += 26;
  }

  // ── Screenshot Verification ──
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = screenshotSrc;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
    });

    const maxH = 75;
    let imgH = (img.naturalHeight / img.naturalWidth) * CW;
    let imgW = CW;
    let offsetX = 0;

    if (imgH > maxH) {
      imgH = maxH;
      imgW = imgH / (img.naturalHeight / img.naturalWidth);
      offsetX = (CW - imgW) / 2;
    }

    if (y + imgH + 16 > H - 10) {
      y = newPage();
    }

    pdf.setFillColor(...surfaceMuted);
    pdf.roundedRect(M + offsetX, y, imgW, imgH + 4, 1.5, 1.5, "F");
    pdf.addImage(img, "JPEG", M + offsetX, y + 3, imgW, imgH);
    y += imgH + 9;
  } catch {
    y += 4;
  }

  // ── Technical Teardowns & Revisions ──
  if (y + 40 > H - 16) {
    y = newPage();
  }

  pdf.setDrawColor(...borderRule);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, M + CW, y);
  y += 6;

  pdf.setTextColor(...darkInk);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("DIAGNOSTIC TEARDOWNS & COPY REVISIONS", M, y);
  y += 6;

  result.teardown.forEach((section) => {
    const analysisLines = pdf.splitTextToSize(section.analysis, CW - 12);
    const beforeLines = section.before_example ? pdf.splitTextToSize(`Observed Baseline: ${section.before_example}`, CW - 16) : [];
    const afterLines = section.after_rewrite ? pdf.splitTextToSize(`Prescribed Revision: ${section.after_rewrite}`, CW - 16) : [];
    const fixLines = pdf.splitTextToSize(`Action Protocol: ${section.fix}`, CW - 12);

    let cardH = 14 + analysisLines.length * 4 + fixLines.length * 4;
    if (beforeLines.length > 0) cardH += beforeLines.length * 3.5 + 4;
    if (afterLines.length > 0) cardH += afterLines.length * 3.5 + 4;

    if (y + cardH > H - 16) {
      y = newPage();
    }

    // Card surface
    pdf.setFillColor(...surfaceWhite);
    pdf.roundedRect(M, y, CW, cardH, 1.5, 1.5, "F");
    pdf.setDrawColor(...borderRule);
    pdf.roundedRect(M, y, CW, cardH, 1.5, 1.5, "D");

    // Left border indicator
    const [br, bg, bb] = section.status === "pass" ? darkInk : criticalRed;
    pdf.setFillColor(br, bg, bb);
    pdf.rect(M, y, 2, cardH, "F");

    // Title
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...darkInk);
    pdf.text(section.section_name, M + 6, y + 6);

    // Status
    pdf.setFontSize(6.5);
    pdf.setTextColor(br, bg, bb);
    pdf.text(section.status === "pass" ? "COMPLIANT" : "NON-COMPLIANT", W - M - 24, y + 6);

    // Analysis
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkInk);
    pdf.text(analysisLines, M + 6, y + 12);

    let currentCardY = y + 12 + analysisLines.length * 4 + 2;

    // Prescribed Revision Box
    if (section.after_rewrite) {
      pdf.setFillColor(...surfaceMuted);
      const rwH = afterLines.length * 3.8 + 4;
      pdf.roundedRect(M + 6, currentCardY, CW - 12, rwH, 1, 1, "F");
      pdf.setDrawColor(...darkInk);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(M + 6, currentCardY, CW - 12, rwH, 1, 1, "D");
      pdf.setTextColor(...darkInk);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text(afterLines, M + 9, currentCardY + 3.5);
      currentCardY += rwH + 3;
    }

    // Action protocol
    pdf.setTextColor(...mutedText);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.text(fixLines, M + 6, currentCardY + 2);

    y += cardH + 4;
  });

  // ── Roadmap Protocol ──
  if (result.comprehensive_playbook) {
    newPage();
    let pbY = 20;

    pdf.setFillColor(...darkInk);
    pdf.rect(0, 0, W, 2, "F");

    pdf.setTextColor(...darkInk);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.text("30-DAY STRATEGIC CONVERSION PROTOCOL", M, pbY);
    pbY += 7;

    pdf.setDrawColor(...borderRule);
    pdf.setLineWidth(0.4);
    pdf.line(M, pbY, M + CW, pbY);
    pbY += 6;

    pdf.setTextColor(...darkInk);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    const paragraphs = result.comprehensive_playbook.split("\n");
    paragraphs.forEach((p) => {
      if (p.trim() === "") return;
      const pgLines = pdf.splitTextToSize(p, CW);
      const bH = pgLines.length * 4.2;
      if (pbY + bH > H - 18) {
        pbY = newPage() + 12;
      }
      pdf.text(pgLines, M, pbY);
      pbY += bH + 4;
    });
  }

  // Footer on last page
  pdf.setDrawColor(...borderRule);
  pdf.setLineWidth(0.3);
  pdf.line(M, H - 9, W - M, H - 9);
  pdf.setFontSize(6.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...mutedText);
  pdf.text("LANDINGLENS — Editorial Conversion Diagnostic", M, H - 4.5);
  pdf.text(`Overall Conversion Index: ${result.score}/100`, W - M - 40, H - 4.5);

  pdf.save(`landinglens-diagnostic-${Date.now()}.pdf`);
}
