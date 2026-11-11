const fs=require("fs");
const SRC=process.argv[2]||"/tmp/src"; // folder holding clones of pe-playbook, grade5health, Grade-1-Music
const PE=require(SRC+"/pe-playbook/data.js");
const SYP=require(SRC+"/pe-playbook/school-year.js");
// health
const hs=fs.readFileSync(SRC+"/grade5health/assets/"+fs.readdirSync(SRC+"/grade5health/assets").find(f=>/^data-.*\.js$/.test(f)),"utf8");
const health={};
const re=/\{week:(\d+),unitId:`([a-z-]+)`,title:`([^`]+)`,focus:`([^`]+)`/g; let m;
while((m=re.exec(hs))) health[m[1]]=[m[3],m[4]];
// music
const cur=fs.readFileSync(fs.readdirSync(SRC+"/Grade-1-Music/assets").filter(f=>f.startsWith("curriculum-")).map(f=>SRC+"/Grade-1-Music/assets/"+f)[0],"utf8");
const music={};
const re2=/\{n:(\d+),unit:`([a-z-]+)`,[^{}]*?title:`([^`]+)`,focus:`([^`]+)`/g;
while((m=re2.exec(cur))) music[m[1]]={t:m[3]};
const re3=/\{"n":(\d+),"unit":"([a-z0-9-]+)","short":"(?:[^"\\]|\\.)*","title":"((?:[^"\\]|\\.)*)"/g;
while((m=re3.exec(cur))) music[m[1]]={t:JSON.parse('"'+m[3]+'"')};
const tc=fs.readFileSync(SRC+"/Grade-1-Music/assets/"+fs.readdirSync(SRC+"/Grade-1-Music/assets").find(f=>f.startsWith("three-classes-")&&f.endsWith(".js")),"utf8");
let i=tc.indexOf("var P=")+6, d=0, j=i;
for(;j<tc.length;j++){ if(tc[j]=="{")d++; else if(tc[j]=="}"){d--; if(!d)break;} }
const P=JSON.parse(tc.slice(i,j+1));
for(const n in P){ if(!music[n]) continue; music[n].c=P[n].map(c=>({b:c.b,i:c.i.map(x=>[x[0],x[1]])})); }
// pe
const pe={};
for(const mo of PE.months){ pe[mo.name]={w:{}}; for(const L of mo.lessons){ (pe[mo.name].w[L.w]=pe[mo.name].w[L.w]||{})[L.c]=[L.title,L.focus,L.wu,L.skill,L.game,L.cd,L.g12||"",L.g34||"",L.g56||""].map(s=>SYP.fill(String(s||"")).replace(/<[^>]+>/g,"")); } }
// kindergarten PE (pe-playbook/kindergarten-data.js): one lesson a week, in order of the PE school weeks
const kpe=[];
if(fs.existsSync(SRC+"/pe-playbook/kindergarten-data.js")){ const w={}; new Function("window",fs.readFileSync(SRC+"/pe-playbook/kindergarten-data.js","utf8"))(w);
  const plain=(s)=>String(s||"").replace(/\[\[([^\]]+)\]\]/g,"$1").replace(/<[^>]+>/g,"");
  for(const l of w.K_PE.lessons) kpe.push([l.t,l.eq,l.wu,l.skill,l.game,l.cd,l.cues,l.safe||"",l.m].map(plain)); }
// Grade 4 Tech (optional): titles, windows and sub notes from Grade4-Tech/content/lessons.py
const {execFileSync}=require("child_process");
let g4tech={};
const g4dir=SRC+"/Grade4-Tech";
if(fs.existsSync(g4dir+"/content/lessons.py")){
  const py='import json,sys\nsys.path.insert(0,sys.argv[1])\nfrom content.lessons import LESSONS\nout={}\nfor L in LESSONS:\n    mats=L.get("materials") or []\n    if isinstance(mats,list): mats=" ".join(mats)\n    out[str(L["n"])]={"n":L["n"],"slug":L["slug"],"kind":L["kind"],"window":L["window"],"title":L["title"],"question":L.get("question") or "","summary":L.get("summary") or "","sub":L.get("sub") or "","materials":mats,"sourceTitle":L.get("source_title") or "","sourceUrl":L.get("source_url") or ""}\nprint(json.dumps(out))\n';
  g4tech=JSON.parse(execFileSync("python3",["-c",py,g4dir],{encoding:"utf8"}));
}else if(fs.existsSync("lesson-catalog.js")){
  const prev={}; new Function("window",fs.readFileSync("lesson-catalog.js","utf8"))(prev);
  if(prev.LESSON_CATALOG&&prev.LESSON_CATALOG.g4tech) g4tech=prev.LESSON_CATALOG.g4tech;
}
// Kindergarten Social Studies (optional): titles, focus, materials and sub notes
let kss={};
const kssdir=SRC+"/kindergarten-social-studies";
if(fs.existsSync(kssdir+"/index.html")&&fs.existsSync("tools/extract-kss.py")){
  kss=JSON.parse(execFileSync("python3",["tools/extract-kss.py",kssdir],{encoding:"utf8"}));
}else if(fs.existsSync("lesson-catalog.js")){
  const prev2={}; new Function("window",fs.readFileSync("lesson-catalog.js","utf8"))(prev2);
  if(prev2.LESSON_CATALOG&&prev2.LESSON_CATALOG.kss) kss=prev2.LESSON_CATALOG.kss;
}
const out={generated:new Date().toISOString().slice(0,10),health,music,pe,kpe,g4tech,kss};
console.log("kpe",kpe.length,Object.keys(health).length,Object.keys(music).length,Object.values(music).filter(x=>x.c).length,"g4tech",Object.keys(g4tech).length,"kss",Object.keys(kss).length);
const js="/* Lesson titles for auto-fill, copied from the lesson sites (Grade 5 Health, Grade 1 Music, PE Playbook, Grade 4 Tech, Kindergarten Social Studies).\n   Regenerate after big lesson changes (see README). */\nwindow.LESSON_CATALOG = "+JSON.stringify(out)+";\n";
fs.writeFileSync("lesson-catalog.js",js);
console.log(js.length);
