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
const out={generated:new Date().toISOString().slice(0,10),health,music,pe};
console.log(Object.keys(health).length,Object.keys(music).length,Object.values(music).filter(x=>x.c).length);
const js="/* Lesson titles for auto-fill, copied from the lesson sites (Grade 5 Health, Grade 1 Music, PE Playbook).\n   Regenerate after big lesson changes (see README). */\nwindow.LESSON_CATALOG = "+JSON.stringify(out)+";\n";
fs.writeFileSync("lesson-catalog.js",js);
console.log(js.length);
