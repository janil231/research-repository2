// Seed Research documents from existing PDFs in uploads/research
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Research = require(path.join(__dirname, '..', 'models', 'Research'));
const User = require(path.join(__dirname, '..', 'models', 'User'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/research-repo';
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'research');

function inferMetadataFromFilename(filename) {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  const tokens = nameWithoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');

  // Try to find a 4-digit year
  const yearToken = tokens.find(t => /^\d{4}$/.test(t));
  const year = yearToken ? parseInt(yearToken, 10) : new Date().getFullYear();

  const title = nameWithoutExt
    .replace(/\b\d{4}\b/g, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: title || nameWithoutExt,
    year,
  };
}

// Simple deterministic PRNG based on filename for consistent data generation
function seededRandom(seed) {
  let x = seed;
  return function() {
    // xorshift32
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    // Convert to [0,1)
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

// Departments exactly as in the Research Upload dropdown (dashboard.html)
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

// Use only 10 teacher names (fixed list)
const teacherNames = [
  'Kathline Ventura',
  'Michael Reyes',
  'Maria Santos',
  'Daniel Cruz',
  'Angela Garcia',
  'Robert Mendoza',
  'Anna Torres',
  'Joseph Rivera',
  'Patricia Ramos',
  'Victor Flores'
];

const firstNames = [
  'James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','William','Elizabeth',
  'David','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen',
  'Christopher','Nancy','Daniel','Lisa','Matthew','Betty','Anthony','Margaret','Mark','Sandra'
];
const lastNames = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin'
];

const titlePrefixes = [
  'A Comparative Study of',
  'Design and Implementation of',
  'An Exploratory Analysis of',
  'Optimization of',
  'Evaluating the Effectiveness of',
  'A Machine Learning Approach to',
  'An Investigation into',
  'A Framework for',
  'Towards',
  'Leveraging'
];
const titleSubjects = [
  'Predictive Analytics','Recommendation Systems','IoT Sensor Networks','Cybersecurity Protocols',
  'Natural Language Processing','Computer Vision Pipelines','Cloud-Native Applications',
  'Distributed Systems','Blockchain-Based Identity','Edge Computing Frameworks',
  'Time Series Forecasting','Large Language Models','Privacy-Preserving Data Mining',
  'Automated Code Generation','A/B Testing Platforms','CI/CD Pipelines','Data Warehousing'
];
const titleContexts = [
  'in Higher Education','for Smart Cities','in Healthcare','for E-Commerce',
  'for Financial Risk Assessment','for Agriculture','in Public Sector Services',
  'for Customer Churn Prediction','in Resource-Constrained Environments','at Scale'
];

function pick(arr, rnd) {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}

function generateAuthors(rnd) {
  const num = 2 + Math.floor(rnd() * 3); // 2-4 authors
  const set = new Set();
  while (set.size < num) {
    const name = `${pick(firstNames, rnd)} ${pick(lastNames, rnd)}`;
    set.add(name);
  }
  return Array.from(set);
}

function generateAdviser(rnd) {
  const first = pick(teacherNames, rnd);
  // 50% chance to assign two advisers, ensure distinct names
  if (rnd() < 0.5) {
    let second = pick(teacherNames, rnd);
    let guard = 0;
    while (second === first && guard++ < 5) second = pick(teacherNames, rnd);
    return second === first ? first : `${first}, ${second}`;
  }
  return first;
}

function generateTitle(rnd) {
  return `${pick(titlePrefixes, rnd)} ${pick(titleSubjects, rnd)} ${pick(titleContexts, rnd)}`;
}

function generateKeywords(title, rnd) {
  const base = title.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const extras = ['ai','ml','nlp','iot','cloud','security','analytics','data','systems','engineering'];
  const pool = Array.from(new Set([...base, ...extras]));
  const count = 3 + Math.floor(rnd() * 4);
  const out = new Set();
  while (out.size < count) out.add(pick(pool, rnd));
  return Array.from(out).slice(0, 6);
}

function generateMetadata(filename) {
  const seed = hashString(filename);
  const rnd = seededRandom(seed || 123456789);
  const dep = pick(departments, rnd);
  const title = generateTitle(rnd);
  const yearMin = 2017;
  const yearMax = new Date().getFullYear();
  const year = yearMin + Math.floor(rnd() * (yearMax - yearMin + 1));
  const semesters = ['1st Semester','2nd Semester','Summer'];
  const semester = pick(semesters, rnd);
  const authors = generateAuthors(rnd);
  const adviser = generateAdviser(rnd);
  const keywords = generateKeywords(title, rnd);
  return { title, year, semester, department: dep, authors, adviser, keywords };
}

async function main() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.error('Uploads directory not found:', UPLOADS_DIR);
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const entries = fs.readdirSync(UPLOADS_DIR)
      .filter(f => f.toLowerCase().endsWith('.pdf'));

    if (entries.length === 0) {
      console.log('No PDF files found in uploads. Nothing to seed.');
      process.exit(0);
    }

    let created = 0;
    let updated = 0;
    for (const file of entries) {
      const pdfFilePath = path.join('uploads', 'research', file); // stored as relative path like existing uploads
      const seed = hashString(file);
      const rnd = seededRandom(seed || 123456789);

      // See if record exists
      const existing = await Research.findOne({ pdfFilePath });
      const meta = generateMetadata(file);

      if (existing) {
        // Normalize department to allowed list
        const deptAllowed = departments.includes(existing.department);
        // Ensure adviser(s) come from the 10-teacher list
        const adviserParts = String(existing.adviser || '').split(',').map(s => s.trim()).filter(Boolean);
        const advisersValid = adviserParts.length > 0 && adviserParts.every(a => teacherNames.includes(a));

        if (!deptAllowed || !advisersValid) {
          if (!deptAllowed) existing.department = pick(departments, rnd);
          if (!advisersValid) existing.adviser = generateAdviser(rnd);
          await existing.save();
          updated += 1;
          console.log('Normalized existing record:', existing.title);
        } else {
          console.log('Skipping existing record for:', file);
        }
        continue;
      }

      // Create new record
      const doc = new Research({
        title: meta.title,
        abstract: '',
        authors: meta.authors,
        adviser: meta.adviser,
        department: meta.department,
        year: meta.year,
        semester: meta.semester,
        keywords: meta.keywords,
        pdfFilePath,
        status: 'approved',
      });

      await doc.save();
      created += 1;
      console.log('Seeded:', meta.title);
    }

    // Create additional PENDING and ARCHIVED records using existing PDFs
    const total = entries.length;
    const pendingTarget = Math.max(5, Math.round(total * 0.12));
    const archivedTarget = Math.max(5, Math.round(total * 0.10));

    let pendingCreated = 0;
    let archivedCreated = 0;

    // Look up students for upload assignment
    const students = await User.find({ role: 'student', status: { $in: ['approved','pending'] } }, '_id firstName lastName');
    const studentIds = students.map(s => s._id);
    function pickStudent(rnd) { if (!studentIds.length) return undefined; return studentIds[Math.floor(rnd()*studentIds.length)]; }

    // Helper to try create a variant record with a given status
    async function createVariant(file, statusLabel) {
      const seed = hashString(file + ':' + statusLabel);
      const rnd = seededRandom(seed);
      const pdfFilePath = path.join('uploads', 'research', file);
      const meta = generateMetadata(file);
      // Avoid duplicate variant for same file+status
      const existsVariant = await Research.findOne({ pdfFilePath, status: statusLabel });
      if (existsVariant) return false;
      // Assign uploadedBy only for pending records
      let uploadedBy = undefined;
      if (statusLabel === 'pending') {
        uploadedBy = pickStudent(rnd);
      }
      const variant = new Research({
        title: `${meta.title} (${statusLabel === 'pending' ? 'Pending' : 'Archived'})`,
        abstract: '',
        authors: meta.authors,
        adviser: generateAdviser(rnd),
        department: pick(departments, rnd),
        year: meta.year,
        semester: meta.semester,
        keywords: meta.keywords,
        pdfFilePath,
        status: statusLabel,
        ...(uploadedBy && { uploadedBy })
      });
      await variant.save();
      return true;
    }

    // Deterministically walk files to create targets
    for (let i = 0; i < entries.length && pendingCreated < pendingTarget; i += 2) {
      if (await createVariant(entries[i], 'pending')) pendingCreated++;
    }
    for (let i = 1; i < entries.length && archivedCreated < archivedTarget; i += 3) {
      if (await createVariant(entries[i], 'archived')) archivedCreated++;
    }

    console.log(`Done. Created ${created} new research record(s), updated ${updated} record(s). Additional: pending=${pendingCreated}, archived=${archivedCreated}.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();


