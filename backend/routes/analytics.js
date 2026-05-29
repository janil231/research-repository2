const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const Research = require("../models/Research");
const User = require("../models/User");
const ResetRequest = require("../models/ResetRequest");
const fs = require("fs");
const path = require("path");

router.get("/overall", [auth, adminOnly], async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const approvedOnly = {
      status: { $nin: ["archived", "pending", "rejected"] },
    };

    const [
      totalResearch,
      totalStudents,
      totalAdmins,
      pendingApprovals,
      resetRequests,
      researchThisMonth,
      researchLastMonth,
      usersThisMonth,
      usersLastMonth,
      topDepartments,
      viewsAgg,
      downloadsAgg,
    ] = await Promise.all([
      Research.countDocuments(approvedOnly),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "student", status: "pending" }),
      ResetRequest.countDocuments(),
      Research.countDocuments({
        ...approvedOnly,
        createdAt: { $gte: startOfThisMonth },
      }),
      Research.countDocuments({
        ...approvedOnly,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      User.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      Research.aggregate([
        { $match: approvedOnly },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Research.aggregate([
        { $match: approvedOnly },
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]),
      Research.aggregate([
        { $match: approvedOnly },
        { $group: { _id: null, total: { $sum: "$downloads" } } },
      ]),
    ]);

    const totalViews = viewsAgg[0]?.total || 0;
    const totalDownloads = downloadsAgg[0]?.total || 0;

    const pct = (curr, prev) =>
      prev === 0
        ? curr > 0
          ? 100
          : 0
        : Number((((curr - prev) / prev) * 100).toFixed(1));

    res.json({
      totals: {
        research: totalResearch,
        students: totalStudents,
        admins: totalAdmins,
        users: totalStudents + totalAdmins,
        views: totalViews,
        downloads: totalDownloads,
      },
      growth: {
        researchPct: pct(researchThisMonth, researchLastMonth),
        usersPct: pct(usersThisMonth, usersLastMonth),
      },
      thisMonth: { research: researchThisMonth, users: usersThisMonth },
      lastMonth: { research: researchLastMonth, users: usersLastMonth },
      pendingApprovals,
      resetRequests,
      topDepartments: topDepartments.map((d) => ({
        department: d._id,
        count: d.count,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching overall statistics" });
  }
});

router.get("/by-department", [auth, adminOnly], async (req, res) => {
  try {
    const { year, semester } = req.query;
    const match = { status: { $nin: ["archived", "pending", "rejected"] } };
    if (year) match.year = parseInt(year);
    if (semester) match.semester = semester;

    const pipeline = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });
    pipeline.push(
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    );

    const stats = await Research.aggregate(pipeline);
    const total = stats.reduce((sum, s) => sum + s.count, 0) || 1;

    res.json(
      stats.map((stat) => ({
        department: stat._id || "Unknown",
        count: stat.count,
        percentage: ((stat.count / total) * 100).toFixed(2),
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching department statistics" });
  }
});

router.get("/by-adviser", [auth, adminOnly], async (req, res) => {
  try {
    const { year, semester } = req.query;
    const match = { status: { $nin: ["archived", "pending", "rejected"] } };
    if (year) match.year = parseInt(year);
    if (semester) match.semester = semester;

    const pipeline = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });
    pipeline.push(
      {
        $project: {
          advisers: {
            $map: {
              input: { $split: ["$adviser", ","] },
              as: "a",
              in: { $toLower: { $trim: { input: "$$a" } } },
            },
          },
        },
      },
      { $unwind: "$advisers" },
      { $group: { _id: "$advisers", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    );

    const stats = await Research.aggregate(pipeline);
    res.json(
      stats.map((s) => ({ adviser: s._id || "Unknown", count: s.count })),
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching adviser statistics" });
  }
});

router.get("/by-year", [auth, adminOnly], async (req, res) => {
  try {
    const stats = await Research.aggregate([
      { $match: { status: { $nin: ["archived", "pending", "rejected"] } } },
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching yearly statistics" });
  }
});

router.get("/top-authors", [auth, adminOnly], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const stats = await Research.aggregate([
      { $match: { status: { $nin: ["archived", "pending", "rejected"] } } },
      { $unwind: "$authors" },
      { $group: { _id: "$authors", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
    ]);
    res.json(stats.map((s) => ({ author: s._id, count: s.count })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching top authors" });
  }
});

router.get("/top-keywords", [auth, adminOnly], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const stats = await Research.aggregate([
      { $match: { status: { $nin: ["archived", "pending", "rejected"] } } },
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
    ]);
    res.json(stats.map((s) => ({ keyword: s._id, count: s.count })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching top keywords" });
  }
});

router.get("/trends", [auth, adminOnly], async (req, res) => {
  try {
    const stats = await Research.aggregate([
      { $match: { status: { $nin: ["archived", "pending", "rejected"] } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching upload trends" });
  }
});

router.get("/generate-report", [auth, adminOnly], async (req, res) => {
  try {
    const approvedOnly = {
      status: { $nin: ["archived", "pending", "rejected"] },
    };
    const year = req.query.year;
    const semester = req.query.semester;
    if (year && year !== "" && year !== "All Years")
      approvedOnly.year = parseInt(year);
    if (semester && semester !== "" && semester !== "All Semesters")
      approvedOnly.semester = semester;

    const [overall, departmentsAgg, advisersAgg] = await Promise.all([
      (async () => {
        const totalResearch = await Research.countDocuments(approvedOnly);
        const totalViewsAgg = await Research.aggregate([
          { $match: approvedOnly },
          { $group: { _id: null, total: { $sum: "$views" } } },
        ]);
        return { totalResearch, totalViews: totalViewsAgg[0]?.total || 0 };
      })(),
      Research.aggregate([
        { $match: approvedOnly },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Research.aggregate([
        { $match: approvedOnly },
        {
          $project: {
            advisers: {
              $map: {
                input: { $split: ["$adviser", ","] },
                as: "a",
                in: { $toLower: { $trim: { input: "$$a" } } },
              },
            },
          },
        },
        { $unwind: "$advisers" },
        { $group: { _id: "$advisers", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const departments = departmentsAgg.map((d) => ({
      name: d._id || "Unknown",
      count: d.count,
      percentage: ((d.count / (overall.totalResearch || 1)) * 100).toFixed(2),
    }));
    const advisers = advisersAgg.map((a) => ({
      name: a._id || "Unknown",
      count: a.count,
      percentage: ((a.count / (overall.totalResearch || 1)) * 100).toFixed(2),
    }));

    const maxDeptCount = Math.max(...departments.map((d) => d.count), 0);
    const maxAdvCount = Math.max(...advisers.map((a) => a.count), 0);
    const mostActiveDepartments = departments
      .filter((d) => d.count === maxDeptCount)
      .map((d) => d.name)
      .join(", ");
    const mostActiveAdvisers = advisers
      .filter((a) => a.count === maxAdvCount)
      .map((a) => a.name)
      .join(", ");

    let accountName = "ADMIN";
    if (req.user) {
      const fn = req.user.firstName || "";
      const ln = req.user.lastName || "";
      if (fn && ln) accountName = fn.toUpperCase() + " " + ln.toUpperCase();
      else if (ln) accountName = ln.toUpperCase();
      else if (fn) accountName = fn.toUpperCase();
      else if (req.user.username) accountName = req.user.username.toUpperCase();
    }

    let csv = "Research Repository Analytics Report\n";
    csv += "Exported by: " + accountName + "\n";
    csv +=
      "Generated on: " +
      new Date().toISOString().slice(0, 16).replace("T", " ") +
      "\n";
    csv +=
      "Semester: " +
      (semester || "All Semesters") +
      ", Year: " +
      (year || "All Years") +
      "\n\n";

    csv += "SUMMARY\n";
    csv += "Total Research Uploaded," + overall.totalResearch + "\n";
    csv += "Total Views," + overall.totalViews + "\n";
    csv += "Top Department," + (mostActiveDepartments || "N/A") + "\n";
    csv += "Top Adviser," + (mostActiveAdvisers || "N/A") + "\n\n";

    csv += "UPLOADS BY DEPARTMENT\n";
    csv += "Department,Count,Percentage\n";
    for (const dept of departments) {
      csv += dept.name + "," + dept.count + "," + dept.percentage + "%\n";
    }

    csv += "\nRESEARCH SUBMISSIONS BY ADVISER\n";
    csv += "Adviser,Count,Percentage\n";
    for (const adv of advisers) {
      csv += adv.name + "," + adv.count + "," + adv.percentage + "%\n";
    }

    const safeSemester =
      semester && semester !== "" && semester !== "All Semesters"
        ? semester.replace(/\s+/g, "_")
        : "All_Semesters";
    const safeYear =
      year && year !== "" && year !== "All Years" ? year : "All_Years";
    const fname =
      "Research_Statistics_" + safeSemester + "_" + safeYear + ".csv";

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="' + fname + '"',
    );
    res.send(csv);
  } catch (err) {
    console.error("Report export error:", err);
    res.status(500).json({ message: "Failed to export report" });
  }
});

router.get("/export-pdf", [auth, adminOnly], async (req, res) => {
  const PDFDocument = require("pdfkit");
  const tmpdir = require("os").tmpdir();
  const outPath = path.join(tmpdir, "Research_Statistics_Report.pdf");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = fs.createWriteStream(outPath);

  doc.pipe(stream);

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
    .text("Research Repository Analytics Report", 50, 130, { align: "center" });

  doc.moveDown(3);
  doc.fillColor("#1F3A5B").fontSize(16).text("Summary");
  doc.fontSize(12);
  doc.text("Analytics report export is now working via PDF!", 50);

  doc.end();

  stream.on("finish", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Research_Statistics_Report.pdf"',
    );
    const readStream = fs.createReadStream(outPath);
    readStream.pipe(res);
    readStream.on("close", () => {
      fs.unlink(outPath, () => {});
    });
  });

  stream.on("error", (err) => {
    console.error("Stream error:", err);
    res.status(500).json({ message: "Failed to export PDF: " + err.message });
  });
});

module.exports = router;
