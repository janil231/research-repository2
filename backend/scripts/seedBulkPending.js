const mongoose = require('mongoose');
const Research = require('../models/Research');
const path = require('path');
const fs = require('fs');

// Use your existing MongoDB connection logic or require main app/db file
// (Provide in README how to configure if needed)
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/research-repository';

const departments = [
  'Information Systems', 'Computer Science', 'Tourism Management', 'Accountancy',
  'Marine Engineering', 'Marine Transportation', 'General Academic Strand (GAS)',
  'Education', 'Criminology', 'Entrepreneurship', 'Nursing', 'Management Accounting'
];
const advisers = ['Dr. Ana Reyes', 'Prof. Luis Ramos', 'Dr. Maria Cruz', 'Prof. John Santos', 'Engr. Ella Ramirez'];
const keywords = [
  ['AI', 'automation', 'learning'], ['migration', 'cloud', 'legacy'], ['sustainability', 'eco', 'green'],
  ['tourism', 'analytics', 'social'], ['accounting', 'audit', 'compliance'], ['STEM', 'robotics', 'experimentation'],
  ['health', 'wellness', 'public health'], ['entrepreneurship', 'startup', 'innovation'], ['security','cyber','safety']
];
const semesters = ['1st Semester','2nd Semester','Summer'];
function randomItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function randomYear() { return 2017+Math.floor(Math.random()*8); }

const titles = [
  'Intelligent Assistant for Online Study Sessions',
  'Legacy Platform Modernization Using Serverless',
  'Eco-Friendly Strategies in Urban Transport',
  'Tourist Behavior Patterns Pre/Post Pandemic',
  'Auditing Procedures for Cloud-Based Accounting',
  'Robotic Process Automation in Education',
  'Wellness App Usage Among Nursing Students',
  'Startup Launch Patterns in Local Communities',
  'Cybersecurity Awareness in Senior High School',
  'Data-Driven Decision Making in Nursing',
  'Machine Learning for Predicting Exam Performance',
  'Migration Strategies in Educational IT',
  'GIS Applications for Marine Navigation',
  'Smart Energy Management in Dormitories',
  'Adaptive Scheduling Tools for IS Students',
  'Financial Literacy Among STEM Majors',
  'Blockchain Use in Records Management',
  'Student Preferences for E-Learning',
  'Simulation-Based Learning in Marine Engineering',
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
  'Online Internship Experiences in Pandemic Years'
];

(async () => {
  await mongoose.connect(dbUri);
  // Locate uploads directory (supports both project-root/uploads and backend/uploads)
  let uploadDir = path.join(__dirname, '../uploads/research');
  if (!fs.existsSync(uploadDir)) {
    const alt = path.join(__dirname, '../../uploads/research');
    if (fs.existsSync(alt)) uploadDir = alt;
  }
  if (!fs.existsSync(uploadDir)) {
    console.error('uploads/research directory not found. Expected at:', uploadDir);
    process.exit(1);
  }
  const files = fs.readdirSync(uploadDir).filter(f => f.toLowerCase().endsWith('.pdf'));

  // Skip PDFs already used in DB
  const usedFiles = (await Research.find({}, {pdfFilePath:1})).map(r=>r.pdfFilePath && path.basename(r.pdfFilePath));
  const toUse = files.filter(f => !usedFiles.includes(f)).slice(0, 30);

  if (toUse.length === 0) {
    console.log('No unused uploaded PDFs found.');
    return process.exit(0);
  }

  const bulkDocs = toUse.map((fname, idx) => {
    const i = idx % titles.length;
    return {
      title: titles[i],
      authors: [
        `${['Jane','Juana','Mark','Ella','Jose','Carlos','Ana'][(i+i)%7]} ${(i%2===0)?'Dela Cruz':'Santos'}`,
        `${['Maria','Miguel','Luis','Andrea','Romeo','Rafael','Lourdes'][(i*i)%7]} ${(i%2===1)?'Garcia':'Reyes'}`
      ],
      adviser: randomItem(advisers),
      department: randomItem(departments),
      year: randomYear(),
      semester: randomItem(semesters),
      keywords: randomItem(keywords),
      abstract: `This research explores ${titles[i].toLowerCase()} with a focus on innovative methodologies and relevant outcomes for both academia and industry. Findings suggest notable improvements in student engagement and process optimization.`,
      status: 'pending',
      views: Math.floor(Math.random()*20),
      downloads: Math.floor(Math.random()*8),
      pdfFilePath: path.join(uploadDir, fname),
      uploadedBy: null // not tied to a specific user
    };
  });

  const inserted = await Research.insertMany(bulkDocs);
  console.log(`Created ${inserted.length} sample pending research records.`);
  mongoose.disconnect();
})();
