const mongoose = require('mongoose');
const Research = require('../models/Research');
const path = require('path');
const fs = require('fs');

const DB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/research-repo';

const departments = [
  'Marine Engineering','Marine Transportation','Criminology','Tourism Management','Technical-Vocational Teacher Education','Early Childhood Education','Information System','Entrepreneurship','Management Accounting','Nursing','Humanities and Social Sciences (HUMSS)','Accountancy, Business and Management (ABM)','Science, Technology, Engineering and Mathematics (STEM)','General Academic Strand (GAS)','Other'
];
const advisersList = ['Ana Reyes','Luis Ramos','Maria Cruz','John Santos','Ella Ramirez','Carlo Mendoza','Andrea Villanueva','Miguel Aquino','Rafael Castro','Romeo Garcia'];
const semesters = ['1st Semester','2nd Semester','Summer'];
const years = Array.from({length: 9}, (_,i)=>2017+i);
const baseTitles = [
  'Practical Approaches to Cloud Cost Optimization',
  'Enhancing Audit Trails with Hashing',
  'Tourism Demand Prediction with Time Series',
  'STEM Robotics Kits for Senior High',
  'Marine Navigation Safety Analytics',
  'Mobile Wellness Support for Students',
  'Automated Grading Aids in IS Courses',
  'Security Awareness Training Impact',
  'Data Pipelines for Educational KPIs',
  'Green Practices in Campus Operations'
];

function pick(a){return a[Math.floor(Math.random()*a.length)];}
function pickMany(a,k){const s=new Set();while(s.size<k)s.add(pick(a));return Array.from(s)}
function name(){const f=['Maria','Juan','Jose','Mark','Ella','Ana','Luis','Miguel','Andrea','Carlo','Rafael','Romeo','Lourdes','Diana','Paolo','Marian'];const l=['Santos','Dela Cruz','Garcia','Reyes','Mendoza','Ramirez','Gonzales','Ramos','Aquino','Villanueva','Castro'];return `${pick(f)} ${pick(l)}`}

function findUploadsDir(){
  let dir=path.join(__dirname,'../uploads/research');
  if(!fs.existsSync(dir)){
    const alt=path.join(__dirname,'../../uploads/research');
    if(fs.existsSync(alt)) dir=alt;
  }
  return dir;
}

(async()=>{
  await mongoose.connect(DB_URI);
  const uploadDir=findUploadsDir();
  if(!uploadDir||!fs.existsSync(uploadDir)){console.error('uploads/research not found');process.exit(1)}
  const pdfs=fs.readdirSync(uploadDir).filter(f=>f.toLowerCase().endsWith('.pdf'));
  if(pdfs.length===0){console.error('No PDFs found');process.exit(1)}

  const n=10+Math.floor(Math.random()*11); // 10-20
  const docs=[]; let idx=0;
  for(let i=0;i<n;i++){
    const title=pick(baseTitles);
    const authors=Array.from({length:3+Math.floor(Math.random()*6)},()=>name());
    const advisersCount=Math.random()<0.5?1:2;
    const advisers=pickMany(advisersList,advisersCount).join(', ');
    const pdf=pdfs[idx%pdfs.length]; idx++;
    const year=pick(years); const sem=pick(semesters);
    const keywords=pickMany(['AI','cloud','analytics','health','education','tourism','marine','audit','startup','security','blockchain','STEM','GIS','mobile','behavior'],4);
    docs.push({
      title,
      authors,
      adviser: advisers,
      department: pick(departments),
      year,
      semester: sem,
      keywords,
      abstract: `This study evaluates ${title.toLowerCase()} with application in academic and operational contexts.`,
      status: 'approved',
      views: Math.floor(Math.random()*200),
      downloads: Math.floor(Math.random()*120),
      uploadedBy: null,
      pdfFilePath: path.join(uploadDir,pdf)
    });
  }

  const res=await Research.insertMany(docs);
  console.log(`Inserted ${res.length} approved research records.`);
  await mongoose.disconnect();
  process.exit(0);
})()


