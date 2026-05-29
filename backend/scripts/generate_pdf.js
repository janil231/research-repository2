const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const DEPARTMENT_ACRONYMS = {
  "Marine Engineering": "BSME",
  "Marine Transportation": "BSMT",
  Criminology: "BSCRIM",
  "Tourism Management": "BSTM",
  "Technical-Vocational Teacher Education": "BTVTED",
  "Early Childhood Education": "EDUC",
  "Information System": "BSIS",
  Entrepreneurship: "BSE",
  "Management Accounting": "BSMA",
  Nursing: "BSN",
  "Humanities and Social Sciences": "HUMSS",
  "Accountancy, Business and Management": "ABM",
  "Science, Technology, Engineering and Mathematics": "STEM",
  "General Academic Strand": "GAS",
  Other: "OTHER",
};

function toAcronym(name) {
  if (!name || typeof name !== "string") return "N/A";
  if (name in DEPARTMENT_ACRONYMS) return DEPARTMENT_ACRONYMS[name];
  for (const [k, v] of Object.entries(DEPARTMENT_ACRONYMS)) {
    if (name.startsWith(k)) return v;
  }
  return name || "N/A";
}

function buildPDF(payload) {
  return new Promise((resolve, reject) => {
    const tmpdir = require("os").tmpdir();
    const outPath = path.join(tmpdir, "Research_Statistics_Report.pdf");

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(outPath);

    doc.pipe(stream);

    const accountName = payload.account_name || "Admin";
    const semester = (payload.semester || "").trim() || "All Semesters";
    const year = (payload.year || "").toString().trim() || "All Years";
    const summary = payload.summary || {};
    const departments = payload.departments || [];
    const advisers = payload.advisers || [];

    // Header
    doc
      .fillColor("#175e86")
      .fontSize(16)
      .text("Research and Publication Department", 50, 50);
    doc.fontSize(13).text("EXACT COLLEGES OF ASIA", 50, 70);
    doc.fontSize(11).text("Suclayin, Arayat, Pampanga", 50, 85);

    doc
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .moveTo(50, 110)
      .lineTo(550, 110)
      .stroke();

    doc
      .fillColor("#175e86")
      .fontSize(16)
      .text("Research Repository Analytics Report", 50, 130, {
        align: "center",
      });
    doc
      .fillColor("#6b7280")
      .fontSize(13)
      .text(`Semester: ${semester}    Year: ${year}`, 50, 155, {
        align: "center",
      });

    // Summary section
    doc.moveDown(3);
    doc.fillColor("#1F3A5B").fontSize(16).text("Summary");

    const topDept = toAcronym(summary.mostActiveDepartment || "N/A");
    const topAdv = (summary.mostActiveAdviser || "N/A").toUpperCase();

    doc.fontSize(12);
    doc.text(`Total Research Uploaded: ${summary.totalResearch || 0}`, 50);
    doc.text(`Top Department: ${topDept}`, 50);
    doc.text(`Top Adviser: ${topAdv}`, 50);

    doc.moveDown(2);
    doc.text(`Exported by: ${accountName}`, 50);
    doc.text(
      `Generated on: ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
      50,
      doc.y,
      { align: "right" },
    );

    doc.addPage();

    // Department section
    doc.fillColor("#1F3A5B").fontSize(14).text("Uploads by Department");
    doc.moveDown();

    const deptData = [["Department", "Count", "Percentage"]];
    for (const dept of departments) {
      deptData.push([
        toAcronym(dept.name),
        dept.count,
        parseFloat(dept.percentage || 0).toFixed(2) + "%",
      ]);
    }

    let y = doc.y;
    const colWidths = [250, 100, 100];
    const startX = 50;

    doc.fontSize(10).fillColor("#1F3A5B");
    doc.rect(startX, y, 400, 20).fill("#1F3A5B").fillColor("white");
    doc.text("Department", startX + 5, y + 5, { width: colWidths[0] - 10 });
    doc.text("Count", startX + colWidths[0] + 5, y + 5, {
      width: colWidths[1] - 10,
    });
    doc.text("Percentage", startX + colWidths[0] + colWidths[1] + 5, y + 5, {
      width: colWidths[2] - 10,
    });

    y += 20;
    doc.fillColor("black");
    for (let i = 1; i < deptData.length; i++) {
      const row = deptData[i];
      const bgColor = i % 2 === 0 ? "#f3f4f6" : "white";
      doc.rect(startX, y, 400, 18).fill(bgColor);
      doc.text(row[0], startX + 5, y + 3, { width: colWidths[0] - 10 });
      doc.text(row[1], startX + colWidths[0] + 5, y + 3, {
        width: colWidths[1] - 10,
      });
      doc.text(row[2], startX + colWidths[0] + colWidths[1] + 5, y + 3, {
        width: colWidths[2] - 10,
      });
      y += 18;
    }

    doc.addPage();

    // Advisers section
    doc
      .fillColor("#1F3A5B")
      .fontSize(14)
      .text("Research Submissions by Advisee Students");
    doc.moveDown();

    const advData = [["Adviser", "Count", "Percentage"]];
    for (const adv of advisers) {
      advData.push([
        (adv.name || "Unknown").toUpperCase(),
        adv.count,
        parseFloat(adv.percentage || 0).toFixed(2) + "%",
      ]);
    }

    y = doc.y;
    doc.fontSize(10).fillColor("#1F3A5B");
    doc.rect(startX, y, 400, 20).fill("#1F3A5B").fillColor("white");
    doc.text("Adviser", startX + 5, y + 5, { width: colWidths[0] - 10 });
    doc.text("Count", startX + colWidths[0] + 5, y + 5, {
      width: colWidths[1] - 10,
    });
    doc.text("Percentage", startX + colWidths[0] + colWidths[1] + 5, y + 5, {
      width: colWidths[2] - 10,
    });

    y += 20;
    doc.fillColor("black");
    for (let i = 1; i < advData.length; i++) {
      const row = advData[i];
      const bgColor = i % 2 === 0 ? "#f3f4f6" : "white";
      doc.rect(startX, y, 400, 18).fill(bgColor);
      doc.text(row[0], startX + 5, y + 3, { width: colWidths[0] - 10 });
      doc.text(row[1], startX + colWidths[0] + 5, y + 3, {
        width: colWidths[1] - 10,
      });
      doc.text(row[2], startX + colWidths[0] + colWidths[1] + 5, y + 3, {
        width: colWidths[2] - 10,
      });
      y += 18;
    }

    doc.end();

    stream.on("finish", () => resolve(outPath));
    stream.on("error", reject);
  });
}

const payload = JSON.parse(require("fs").readFileSync(0, "utf-8"));
buildPDF(payload)
  .then((out) => console.log(out))
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
