const mongoose = require('mongoose');
const Research = require('../models/Research');
const path = require('path');
const fs = require('fs');

const DB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/research-repo';

// Departments from the provided list (exact labels)
const departments = [
  'Marine Engineering',
  'Marine Transportation',
  'Criminology',
  'Tourism Management',
  'Technical-Vocational Teacher Education',
  'Early Childhood Education',
  'Information System',
  'Entrepreneurship',
  'Management Accounting',
  'Nursing',
  'Humanities and Social Sciences (HUMSS)',
  'Accountancy, Business and Management (ABM)',
  'Science, Technology, Engineering and Mathematics (STEM)',
  'General Academic Strand (GAS)',
  'Other'
];

const semesterOptions = ['1st Semester', '2nd Semester', 'Summer'];
const years = Array.from({ length: 9 }, (_, i) => 2017 + i); // 2017-2025

const firstNames = ['Maria', 'Juan', 'Jose', 'Mark', 'Ella', 'Ana', 'Luis', 'Miguel', 'Andrea', 'Carlo', 'Rafael', 'Romeo', 'Lourdes', 'Diana', 'Kiko', 'Paolo', 'Marian'];
const lastNames = ['Santos', 'Dela Cruz', 'Garcia', 'Reyes', 'Mendoza', 'Ramirez', 'Gonzales', 'Ramos', 'Aquino', 'Villanueva', 'Castro'];
// Exactly 10 adviser names (no titles)
const advisersList = [
  'Ana Reyes',
  'Luis Ramos',
  'Maria Cruz',
  'John Santos',
  'Ella Ramirez',
  'Carlo Mendoza',
  'Andrea Villanueva',
  'Miguel Aquino',
  'Rafael Castro',
  'Romeo Garcia'
];

const baseTitles = [
  'Improving Audit Efficiency with Deep Learning',
  'Sustainable Tourism Initiatives',
  'Cloud Migration for Small Businesses',
  'Interactive STEM Modules for Remote Learning',
  'Assessment of Mental Health Apps',
  'Faculty Perspectives on Remote Teaching',
  'Green Entrepreneurship Case Studies',
  'Forensic Auditing Methods for IS',
  'Big Data in Educational Analytics',
  'Wearable Tech for Student Health',
  'Simulation-Based Learning in Marine Engineering',
  'GIS Applications for Marine Navigation',
  'Adaptive Scheduling Tools for IS Students',
  'Blockchain Use in Records Management',
  'Cybersecurity Awareness in Senior High School'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickMany(arr, k) {
  const out = new Set();
  while (out.size < k) out.add(pick(arr));
  return Array.from(out);
}
function makeName() { return pick(firstNames) + ' ' + pick(lastNames); }
function makeAdvisers() {
  const count = Math.random() < 0.5 ? 1 : 2; // 1 or 2 advisers
  const chosen = pickMany(advisersList, count);
  return count === 1 ? chosen[0] : chosen.join(', ');
}
function makeAuthors() { return Array.from({ length: 3 + Math.floor(Math.random()*6) }, () => makeName()); }
function makeKeywords() {
  const base = ['AI','cloud','analytics','health','education','tourism','marine','audit','startup','security','blockchain','STEM','GIS','mobile','behavior'];
  return pickMany(base, 3 + Math.floor(Math.random() * 4));
}
function makeAbstract(title) {
  return `This research investigates ${title.toLowerCase()} across multiple settings, presenting methods, metrics, and outcomes relevant to the department. Results indicate promising improvements in engagement and operational efficiency.`;
}

function findUploadsDir() {
  let dir = path.join(__dirname, '../uploads/research');
  if (!fs.existsSync(dir)) {
    const alt = path.join(__dirname, '../../uploads/research');
    if (fs.existsSync(alt)) dir = alt;
  }
  return dir;
}

(async () => {
  await mongoose.connect(DB_URI);

  const uploadDir = findUploadsDir();
  if (!uploadDir || !fs.existsSync(uploadDir)) {
    console.error('uploads/research not found. Aborting.');
    process.exit(1);
  }
  const pdfs = fs.readdirSync(uploadDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (pdfs.length === 0) {
    console.error('No PDFs found in uploads/research. Aborting.');
    process.exit(1);
  }

  const docs = [];
  let pdfIndex = 0;

  for (const year of years) {
    for (const semester of semesterOptions) {
      // 10-30 per semester per year
      const count = 10 + Math.floor(Math.random() * 21);
      for (let i = 0; i < count; i++) {
        const title = pick(baseTitles);
        const statusRand = Math.random();
        const status = statusRand < 0.55 ? 'approved' : statusRand < 0.8 ? 'pending' : 'archived';

        const pdfName = pdfs[pdfIndex % pdfs.length];
        pdfIndex++;

        docs.push({
          title,
          authors: makeAuthors(),
          adviser: makeAdvisers(),
          department: pick(departments),
          year,
          semester,
          keywords: makeKeywords(),
          abstract: makeAbstract(title),
          status,
          views: Math.floor(Math.random()*100),
          downloads: Math.floor(Math.random()*50),
          uploadedBy: null,
          pdfFilePath: path.join(uploadDir, pdfName),
          createdAt: new Date(year, semester === '1st Semester' ? 1 : semester === '2nd Semester' ? 7 : 4, 15)
        });
      }
    }
  }

  // Insert in batches to avoid large payloads
  const BATCH = 500;
  let insertedTotal = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const chunk = docs.slice(i, i + BATCH);
    const res = await Research.insertMany(chunk);
    insertedTotal += res.length;
  }

  console.log(`Inserted ${insertedTotal} research records across years and semesters.`);
  await mongoose.disconnect();
  process.exit(0);
})();


