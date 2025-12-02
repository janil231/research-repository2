const mongoose = require('mongoose');
const User = require('../models/User');

const DB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/research-repo';

const departments = [
  'Marine Engineering','Marine Transportation','Criminology','Tourism Management','Technical-Vocational Teacher Education','Early Childhood Education','Information System','Entrepreneurship','Management Accounting','Nursing','Humanities and Social Sciences (HUMSS)','Accountancy, Business and Management (ABM)','Science, Technology, Engineering and Mathematics (STEM)','General Academic Strand (GAS)','Other'
];

const firstNames = ['Maria','Juan','Jose','Mark','Ella','Ana','Luis','Miguel','Andrea','Carlo','Rafael','Romeo','Lourdes','Diana','Paolo','Marian','Shane','Russel','Hidelu','Kane'];
const lastNames  = ['Santos','Dela Cruz','Garcia','Reyes','Mendoza','Ramirez','Gonzales','Ramos','Aquino','Villanueva','Castro','Roxas','Suzuki','Sanoy'];

function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

function genSchoolId(){
  const year = 2000 + Math.floor(Math.random()*26); // 2000-2025
  const mid = Math.floor(Math.random()*100).toString().padStart(2,'0');
  const last = Math.floor(Math.random()*10000).toString().padStart(4,'0');
  return `${year}-${mid}${last}`; // 20xx-00xxxx
}

(async()=>{
  await mongoose.connect(DB_URI);

  const toCreate = 50;
  const docs = [];
  const used = new Set();
  for (let i=0;i<toCreate;i++){
    let sid = genSchoolId();
    while(used.has(sid) || (await User.exists({ schoolId: sid }))){ sid = genSchoolId(); }
    used.add(sid);

    const first = pick(firstNames);
    const last  = pick(lastNames);

    docs.push({
      firstName: first,
      lastName: last,
      schoolId: sid,
      department: pick(departments),
      role: 'student',
      status: 'approved',
      // Password equals schoolId; hashed by pre-save hook
      password: sid,
    });
  }

  const inserted = await User.insertMany(docs);
  console.log(`Inserted ${inserted.length} student users.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (e)=>{ console.error(e); try{ await mongoose.disconnect(); }catch(_){} process.exit(1); });


