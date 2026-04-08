import jsPDF from "jspdf";

type Issue = {
  id: number;
  label: string;
  severity: "critical" | "warning" | "good";
  score: number;
  roast: string;
  fix: string;
};

type AuditResult = {
  score: number;
  grade: string;
  verdict: string;
  stats: {
    issues_found: number;
    critical_count: number;
    bounce_estimate: string;
    upside: string;
  };
  issues: Issue[];
};

function severityRGB(s: string): [number, number, number] {
  if (s === "critical") return [226, 75, 74];
  if (s === "warning") return [239, 159, 39];
  return [99, 153, 34];
}

function scoreRGB(n: number): [number, number, number] {
  if (n >= 75) return [99, 153, 34];
  if (n >= 50) return [186, 117, 23];
  return [226, 75, 74];
}

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
  const accent: [number, number, number] = [251, 191, 36];
  const dark: [number, number, number] = [18, 18, 18];
  const mid: [number, number, number] = [40, 40, 40];
  const muted: [number, number, number] = [120, 120, 120];
  const light: [number, number, number] = [220, 220, 220];

  const newPage = () => {
    pdf.addPage();
    pdf.setFillColor(...dark);
    pdf.rect(0, 0, W, H, "F");
    return M;
  };

  // ── Full dark background ──
  pdf.setFillColor(...dark);
  pdf.rect(0, 0, W, H, "F");

  // ── Cover page ──
  // Top accent bar
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, W, 2, "F");

  // Logo area
  pdf.setFillColor(...mid);
  pdf.rect(0, 0, W, 52, "F");
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, W, 2, "F");

  pdf.setTextColor(...accent);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("LandingLens", M, 20);

  pdf.setTextColor(...light);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("LANDING PAGE AUDIT REPORT", M, 30);

  pdf.setTextColor(...muted);
  pdf.setFontSize(8);
  pdf.text(url.replace(/^https?:\/\//, ""), M, 40);
  pdf.text(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    M,
    47,
  );

  let y = 68;

  // ── Score hero ──
  const [sr, sg, sb] = scoreRGB(result.score);
  pdf.setTextColor(sr, sg, sb);
  pdf.setFontSize(72);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${result.score}`, M, y + 18);

  pdf.setTextColor(...muted);
  pdf.setFontSize(18);
  pdf.text("/100", M + 38, y + 18);

  // Grade pill
  pdf.setFillColor(...mid);
  pdf.roundedRect(M, y + 24, 70, 10, 2, 2, "F");
  pdf.setTextColor(...accent);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${result.grade.toUpperCase()}`, M + 4, y + 31);

  y += 46;

  // ── Verdict ──
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.5);
  pdf.line(M, y, M + CW, y);
  y += 8;

  pdf.setTextColor(...light);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  const verdictLines = pdf.splitTextToSize(`"${result.verdict}"`, CW);
  pdf.text(verdictLines, M, y);
  y += verdictLines.length * 6 + 10;

  // ── Stats row ──
  const statW = CW / 3;
  const stats = [
    {
      label: "ISSUES FOUND",
      value: `${result.stats.issues_found}`,
      sub: `${result.stats.critical_count} critical`,
    },
    {
      label: "BOUNCE ESTIMATE",
      value: result.stats.bounce_estimate,
      sub: "Visitors leaving",
    },
    {
      label: "UPSIDE POTENTIAL",
      value: result.stats.upside,
      sub: "If fixes applied",
    },
  ];

  stats.forEach((s, i) => {
    const x = M + i * statW;
    pdf.setFillColor(...mid);
    pdf.roundedRect(x, y, statW - 3, 22, 2, 2, "F");
    pdf.setTextColor(...muted);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.text(s.label, x + 4, y + 7);
    pdf.setTextColor(...accent);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(s.value, x + 4, y + 16);
    pdf.setTextColor(...muted);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(s.sub, x + 4, y + 21);
  });

  y += 30;

  // ── Screenshot ──
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = screenshotSrc;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
    });
    const imgH = Math.min((img.naturalHeight / img.naturalWidth) * CW, 65);

    // Browser bar mock
    pdf.setFillColor(...mid);
    pdf.roundedRect(M, y, CW, imgH + 8, 3, 3, "F");
    [
      [255, 95, 87],
      [254, 188, 46],
      [40, 200, 64],
    ].forEach(([r, g, b], i) => {
      pdf.setFillColor(r, g, b);
      pdf.circle(M + 5 + i * 6, y + 4, 1.5, "F");
    });

    pdf.addImage(img, "JPEG", M, y + 7, CW, imgH);
    y += imgH + 16;
  } catch {
    y += 4;
  }

  // ── Issues ──
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.5);
  pdf.line(M, y, M + CW, y);
  y += 8;

  pdf.setTextColor(...muted);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("ISSUES RANKED BY DAMAGE", M, y);
  y += 8;

  result.issues.forEach((issue) => {
    const roastLines = pdf.splitTextToSize(issue.roast, CW - 8);
    const fixLines = pdf.splitTextToSize(`→ ${issue.fix}`, CW - 8);
    const cardH = 8 + roastLines.length * 5 + 4 + fixLines.length * 5 + 8;

    if (y + cardH > H - 16) {
      y = newPage();
    }

    const [br, bg, bb] = severityRGB(issue.severity);

    // Card bg
    pdf.setFillColor(...mid);
    pdf.roundedRect(M, y, CW, cardH, 2, 2, "F");

    // Severity left bar
    pdf.setFillColor(br, bg, bb);
    pdf.roundedRect(M, y, 2.5, cardH, 1, 1, "F");

    // Label
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...light);
    pdf.text(issue.label, M + 6, y + 7);

    // Score
    pdf.setFontSize(8);
    pdf.setTextColor(br, bg, bb);
    pdf.text(`${issue.score}/10`, W - M - 12, y + 7);

    // Score bar track
    const barX = M + 6;
    const barY = y + 10;
    const barW = CW - 20;
    pdf.setFillColor(50, 50, 50);
    pdf.roundedRect(barX, barY, barW, 1.5, 0.5, 0.5, "F");
    pdf.setFillColor(br, bg, bb);
    pdf.roundedRect(barX, barY, (issue.score / 10) * barW, 1.5, 0.5, 0.5, "F");

    // Roast text
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...muted);
    pdf.text(roastLines, M + 6, y + 16);

    // Fix box
    const fixY = y + 16 + roastLines.length * 5 + 2;
    pdf.setFillColor(30, 30, 30);
    pdf.roundedRect(M + 4, fixY, CW - 8, fixLines.length * 5 + 4, 1, 1, "F");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(...accent);
    pdf.text(fixLines, M + 8, fixY + 5);

    y += cardH + 4;
  });

  // ── Footer on last page ──
  if (y + 14 > H) {
    y = newPage();
  }
  pdf.setDrawColor(...mid);
  pdf.setLineWidth(0.3);
  pdf.line(M, H - 12, W - M, H - 12);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...muted);
  pdf.text("LandingLens · landinglens.com", M, H - 6);
  pdf.text(`Score: ${result.score}/100 · ${result.grade}`, W - M - 35, H - 6);

  pdf.save(`landinglens-audit-${Date.now()}.pdf`);
}
