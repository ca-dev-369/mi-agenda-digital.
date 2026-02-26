import { useState, useEffect, useRef } from “react”;
import { db, auth } from “./firebase”;
import { doc, setDoc, getDoc, onSnapshot } from “firebase/firestore”;
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from “firebase/auth”;

const DAYS_ES=[“Domingo”,“Lunes”,“Martes”,“Miércoles”,“Jueves”,“Viernes”,“Sábado”];
const DAYS_EN=[“Sunday”,“Monday”,“Tuesday”,“Wednesday”,“Thursday”,“Friday”,“Saturday”];
const MES_ES=[“Enero”,“Febrero”,“Marzo”,“Abril”,“Mayo”,“Junio”,“Julio”,“Agosto”,“Septiembre”,“Octubre”,“Noviembre”,“Diciembre”];
const MES_EN=[“January”,“February”,“March”,“April”,“May”,“June”,“July”,“August”,“September”,“October”,“November”,“December”];
const HORAS=[8,9,10,11,12,13,14,15,16,17,18,19,20,21];
const MOODS=[{e:“😄”,l:“Excelente”},{e:“🙂”,l:“Bien”},{e:“😐”,l:“Regular”},{e:“😔”,l:“Difícil”},{e:“😤”,l:“Estresado”}];
const DEF_HABITS=[“💧 Agua”,“🏃 Ejercicio”,“📖 Lectura”,“🧘 Meditar”,“🥗 Comer sano”,“😴 Dormir bien”];
const FRASES=[
{t:“Ya que no podemos cambiar la realidad, cambiemos los ojos con que vemos la realidad.”,a:“Nikos Kazantzakis”},
{t:“El éxito es la suma de pequeños esfuerzos repetidos día tras día.”,a:“Robert Collier”},
{t:“No cuentes los días, haz que los días cuenten.”,a:“Muhammad Ali”},
{t:“La disciplina es el puente entre metas y logros.”,a:“Jim Rohn”},
{t:“Cada día es una nueva oportunidad para cambiar tu vida.”,a:“Anónimo”},
];
const SK=“agenda-v3”; // kept for reference
const AC=”#2d5a8e”,AL=”#dde8f5”,BD=”#d4cec5”,SF=”#faf7f3”,MU=”#9a8a7a”,FA=”#ccc”,TX=”#1e1e1e”;

const fk=d=>d.getFullYear()+”-”+d.getMonth()+”-”+d.getDate();
const fwk=ws=>“wk-”+fk(ws);
const isHoy=(d,t)=>fk(d)===fk(t);
function wkStart(date){const d=new Date(date),day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));d.setHours(0,0,0,0);return d;}
function wkDays(ws){return Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d;});}
function doy(date){return Math.floor((date-new Date(date.getFullYear(),0,0))/86400000);}
function dleft(date){return Math.floor((new Date(date.getFullYear(),11,31)-date)/86400000)+1;}
function wnum(date){const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));const dn=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-dn);const ys=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-ys)/86400000)+1)/7);}
function mgrid(y,m){const f=new Date(y,m,1),l=new Date(y,m+1,0),sd=f.getDay()===0?6:f.getDay()-1,arr=[];for(let i=0;i<sd;i++)arr.push(null);for(let d=1;d<=l.getDate();d++)arr.push(d);return arr;}

const FI={border:“none”,borderBottom:“1px solid “+BD,padding:“7px 2px”,fontSize:13,fontFamily:“inherit”,color:TX,background:“transparent”,width:“100%”};
const BP={background:AC,color:”#fff”,border:“none”,borderRadius:10,padding:“9px 20px”,cursor:“pointer”,fontSize:13,fontWeight:“bold”};
const BI={background:SF,border:“1px solid “+BD,borderRadius:8,padding:“4px 10px”,cursor:“pointer”,fontSize:17,color:”#5a4a3a”};
const LB={fontSize:9,letterSpacing:2,textTransform:“uppercase”,color:MU,display:“block”,marginBottom:3};

function PH({title,sub}){return(<div style={{padding:“14px 18px 10px”,background:SF,borderBottom:“2px solid “+BD,marginBottom:12}}><div style={{fontSize:15,fontWeight:“bold”}}>{title}</div><div style={{fontSize:10,fontStyle:“italic”,color:MU}}>{sub}</div></div>);}

function Login({onLogin}){
const [email,setEmail]=useState(””);
const [pass,setPass]=useState(””);
const [err,setErr]=useState(””);
const [showPass,setShowPass]=useState(false);
const [isNew,setIsNew]=useState(false);
const [confirmPass,setConfirmPass]=useState(””);
const [loading,setLoading]=useState(false);

const handleSubmit=async()=>{
if(!email.trim()||!pass.trim()){setErr(“Completa todos los campos”);return;}
setLoading(true); setErr(””);
try{
if(isNew){
if(pass!==confirmPass){setErr(“Las contraseñas no coinciden”);setLoading(false);return;}
if(pass.length<6){setErr(“La contraseña debe tener al menos 6 caracteres”);setLoading(false);return;}
await createUserWithEmailAndPassword(auth, email.trim(), pass);
onLogin(email.trim());
} else {
await signInWithEmailAndPassword(auth, email.trim(), pass);
onLogin(email.trim());
}
} catch(e){
if(e.code===“auth/user-not-found”||e.code===“auth/invalid-credential”)setErr(“Correo o contraseña incorrectos”);
else if(e.code===“auth/email-already-in-use”)setErr(“Este correo ya tiene cuenta. Inicia sesión.”);
else if(e.code===“auth/invalid-email”)setErr(“Correo inválido”);
else if(e.code===“auth/weak-password”)setErr(“Contraseña muy débil, mínimo 6 caracteres”);
else setErr(“Error: “+e.message);
setLoading(false);
}
};

const user=email; // alias for UI

return(
<div style={{minHeight:“100vh”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,background:“linear-gradient(160deg,”+AC+” 0%,#1a3a5e 60%,#0e2340 100%)”,padding:“32px 20px”,position:“relative”,overflow:“hidden”}}>
{[0,1,2,3].map(i=><div key={i} style={{position:“absolute”,bottom:-20+i*35,left:-50,right:-50,height:90,border:“1px solid rgba(255,255,255,”+(0.03+i*0.02)+”)”,borderRadius:“50%”,transform:“scaleX(”+(1.2+i*.15)+”)”}}/>)}
<div style={{position:“relative”,zIndex:1,width:“100%”,maxWidth:340}}>
<div style={{textAlign:“center”,marginBottom:28}}>
<div style={{fontSize:52,marginBottom:10}}>📓</div>
<div style={{fontSize:9,letterSpacing:6,textTransform:“uppercase”,color:“rgba(255,255,255,.5)”,marginBottom:6}}>Agenda Digital</div>
<div style={{fontSize:22,fontWeight:“bold”,color:”#fff”}}>{isNew?“Crear cuenta”:“Bienvenida de vuelta”}</div>
<div style={{fontSize:12,color:“rgba(255,255,255,.45)”,marginTop:4}}>{isNew?“Configura tu acceso personal”:“Ingresa tus credenciales”}</div>
</div>
<div style={{background:“rgba(255,255,255,.1)”,backdropFilter:“blur(12px)”,borderRadius:24,padding:“28px 24px”,border:“1px solid rgba(255,255,255,.15)”}}>
<div style={{marginBottom:14}}>
<label style={{fontSize:9,letterSpacing:2,textTransform:“uppercase”,color:“rgba(255,255,255,.55)”,display:“block”,marginBottom:6}}>Correo electrónico</label>
<input value={email} onChange={e=>{setEmail(e.target.value);setErr(””);}} onKeyDown={e=>e.key===“Enter”&&handleSubmit()} placeholder=“Tu correo electrónico” style={{width:“100%”,background:“rgba(255,255,255,.12)”,border:“1px solid rgba(255,255,255,.2)”,borderRadius:12,padding:“12px 14px”,fontSize:14,color:”#fff”,fontFamily:“inherit”}}/>
</div>
<div style={{marginBottom:isNew?14:20}}>
<label style={{fontSize:9,letterSpacing:2,textTransform:“uppercase”,color:“rgba(255,255,255,.55)”,display:“block”,marginBottom:6}}>Contraseña</label>
<div style={{position:“relative”}}>
<input value={pass} onChange={e=>{setPass(e.target.value);setErr(””);}} onKeyDown={e=>e.key===“Enter”&&handleSubmit()} type={showPass?“text”:“password”} placeholder=“Tu contraseña” style={{width:“100%”,background:“rgba(255,255,255,.12)”,border:“1px solid rgba(255,255,255,.2)”,borderRadius:12,padding:“12px 42px 12px 14px”,fontSize:14,color:”#fff”,fontFamily:“inherit”}}/>
<button onClick={()=>setShowPass(v=>!v)} style={{position:“absolute”,right:12,top:“50%”,transform:“translateY(-50%)”,background:“none”,border:“none”,color:“rgba(255,255,255,.5)”,cursor:“pointer”,fontSize:16}}>{showPass?“🙈”:“👁”}</button>
</div>
</div>
{isNew&&<div style={{marginBottom:20}}>
<label style={{fontSize:9,letterSpacing:2,textTransform:“uppercase”,color:“rgba(255,255,255,.55)”,display:“block”,marginBottom:6}}>Confirmar contraseña</label>
<input value={confirmPass} onChange={e=>{setConfirmPass(e.target.value);setErr(””);}} onKeyDown={e=>e.key===“Enter”&&handleSubmit()} type={showPass?“text”:“password”} placeholder=“Repite tu contraseña” style={{width:“100%”,background:“rgba(255,255,255,.12)”,border:“1px solid rgba(255,255,255,.2)”,borderRadius:12,padding:“12px 14px”,fontSize:14,color:”#fff”,fontFamily:“inherit”}}/>
</div>}
{err&&<div style={{background:“rgba(231,76,60,.25)”,border:“1px solid rgba(231,76,60,.4)”,borderRadius:10,padding:“10px 14px”,marginBottom:14,fontSize:12,color:”#ffb3b3”,textAlign:“center”}}>{err}</div>}
<button onClick={handleSubmit} style={{width:“100%”,background:”#fff”,color:AC,border:“none”,borderRadius:14,padding:“14px”,fontSize:15,fontWeight:“bold”,cursor:“pointer”,letterSpacing:.5,transition:“all .2s”}}>
{loading?“Cargando…”:(isNew?“Crear mi agenda”:“Entrar”)}
</button>
<div style={{textAlign:“center”,marginTop:16}}>
<button onClick={()=>{setIsNew(v=>!v);setErr(””);setConfirmPass(””);}} style={{background:“none”,border:“none”,color:“rgba(255,255,255,.45)”,cursor:“pointer”,fontSize:12,textDecoration:“underline”}}>
{isNew?”¿Ya tienes cuenta? Inicia sesión”:”¿Primera vez? Crea tu cuenta”}
</button>
</div>
</div>
<div style={{textAlign:“center”,marginTop:20,fontSize:9,color:“rgba(255,255,255,.25)”,letterSpacing:1}}>TU INFORMACIÓN ES PRIVADA Y SOLO TUYA</div>
</div>
<style>{`input::placeholder{color:rgba(255,255,255,.35);}input:focus{outline:none;border-color:rgba(255,255,255,.5)!important;}`}</style>
</div>
);
}

export default function App(){
const today=new Date();
const [sec,setSec]=useState(“portada”);
const [data,setData]=useState({});
const [loaded,setLoaded]=useState(false);
const [toast,setToast]=useState(null);
const [user,setUser]=useState(null); // Firebase user
const [authChecked,setAuthChecked]=useState(false);
const fr=FRASES[today.getDate()%FRASES.length];

// Listen to Firebase auth state
useEffect(()=>{
const unsub=onAuthStateChanged(auth,u=>{
setUser(u);
setAuthChecked(true);
});
return unsub;
},[]);

// Load data from Firestore when user logs in
useEffect(()=>{
if(!user) return;
const ref=doc(db,“agendas”,user.uid);
const unsub=onSnapshot(ref,snap=>{
if(snap.exists()) setData(snap.data().payload||{});
setLoaded(true);
});
return unsub;
},[user]);

// Save data to Firestore (debounced)
useEffect(()=>{
if(!loaded||!user) return;
const t=setTimeout(async()=>{
try{
const ref=doc(db,“agendas”,user.uid);
await setDoc(ref,{payload:data,updatedAt:new Date().toISOString()},{merge:true});
}catch(e){console.error(“Save error:”,e);}
},800);
return()=>clearTimeout(t);
},[data,loaded,user]);

const handleLogout=async()=>{await signOut(auth);setData({});setLoaded(false);};

// Loading spinner while checking auth
if(!authChecked) return <div style={{minHeight:“100vh”,background:“linear-gradient(160deg,”+AC+” 0%,#0e2340 100%)”,display:“flex”,alignItems:“center”,justifyContent:“center”,flexDirection:“column”,gap:16}}><div style={{fontSize:48}}>📓</div><div style={{color:“rgba(255,255,255,.5)”,fontSize:12,letterSpacing:2}}>CARGANDO…</div></div>;

if(!user) return <Login onLogin={()=>{}}/>;

const get=(k,d)=>{const v=data[k];return v!==undefined?v:(d!==undefined?d:{});};
const set=(k,v)=>setData(p=>({…p,[k]:v}));
const notify=msg=>{setToast(msg);setTimeout(()=>setToast(null),2200);};

const NAV=[{id:“portada”,ic:“✦”,lb:“Inicio”},{id:“habitos”,ic:“🔥”,lb:“Hábitos”},{id:“semanal”,ic:“📋”,lb:“Semana”},{id:“mensual”,ic:“🗓”,lb:“Mes”},{id:“anual”,ic:“📅”,lb:“Año”},{id:“proyectos”,ic:“📌”,lb:“Proyectos”},{id:“mas”,ic:“⋯”,lb:“Más”}];

return(
<div style={{minHeight:“100vh”,background:”#eee9e1”,fontFamily:”‘Palatino Linotype’,Palatino,serif”,color:TX}}>
{toast&&<div style={{position:“fixed”,top:14,left:“50%”,transform:“translateX(-50%)”,background:AC,color:”#fff”,padding:“9px 22px”,borderRadius:100,fontSize:12,zIndex:999,boxShadow:“0 4px 16px rgba(0,0,0,.25)”,whiteSpace:“nowrap”}}>{toast}</div>}
<div style={{paddingBottom:68}}>
{sec===“portada”&&<Portada today={today} fr={fr} get={get} goTo={setSec} userName={userName} onLogout={handleLogout}/>}
{sec===“habitos”&&<Habitos today={today} get={get} set={set} notify={notify}/>}
{sec===“semanal”&&<Semanal today={today} get={get} set={set} notify={notify} fr={fr}/>}
{sec===“mensual”&&<Mensual today={today} get={get} set={set} notify={notify}/>}
{sec===“anual”&&<Anual today={today} get={get} set={set}/>}
{sec===“proyectos”&&<Proyectos get={get} set={set} notify={notify}/>}
{sec===“mas”&&<Mas get={get} set={set} notify={notify} goTo={setSec}/>}
{sec===“personal”&&<Personal get={get} set={set} notify={notify}/>}
{sec===“directorio”&&<Directorio get={get} set={set} notify={notify}/>}
{sec===“buscar”&&<Buscar data={data}/>}
</div>
<nav style={{position:“fixed”,bottom:0,left:0,right:0,background:”#fff”,borderTop:“1px solid “+BD,display:“flex”,zIndex:200,boxShadow:“0 -2px 12px rgba(0,0,0,.07)”}}>
{NAV.map(n=><button key={n.id} onClick={()=>setSec(n.id)} style={{flex:1,border:“none”,background:“none”,cursor:“pointer”,padding:“7px 2px 5px”,borderTop:sec===n.id?“2px solid “+AC:“2px solid transparent”}}><div style={{fontSize:14}}>{n.ic}</div><div style={{fontSize:7,textTransform:“uppercase”,color:sec===n.id?AC:FA,marginTop:1}}>{n.lb}</div></button>)}
</nav>
<style>{`*{box-sizing:border-box;}button:focus,input:focus,textarea:focus{outline:none;}::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px;}`}</style>
</div>
);
}

function Portada({today,fr,get,goTo,userName,onLogout}){
const nombre=get(“personal”,{}).nombre||user?.email?.split(”@”)[0]||“Mi Agenda”;
const dk=fk(today);
const dd=get(dk,{tasks:[],habits:{}});
const tasks=dd.tasks||[];
const habNames=get(“habit_names”,DEF_HABITS);
const habDone=habNames.filter(h=>(dd.habits||{})[h]).length;
const done=tasks.filter(t=>t.done).length;
return(
<div style={{minHeight:“calc(100vh - 68px)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,background:“linear-gradient(160deg,”+AC+” 0%,#1a3a5e 60%,#0e2340 100%)”,padding:“32px 20px”,position:“relative”,overflow:“hidden”}}>
{[0,1,2,3].map(i=><div key={i} style={{position:“absolute”,bottom:-20+i*35,left:-50,right:-50,height:90,border:“1px solid rgba(255,255,255,”+(0.03+i*0.02)+”)”,borderRadius:“50%”,transform:“scaleX(”+(1.2+i*.15)+”)”}}/>)}
<div style={{position:“relative”,zIndex:1,textAlign:“center”,width:“100%”,maxWidth:360}}>
<div style={{fontSize:48,marginBottom:10}}>📓</div>
<div style={{fontSize:9,letterSpacing:6,textTransform:“uppercase”,color:“rgba(255,255,255,.5)”,marginBottom:4}}>Agenda Digital</div>
<div style={{fontSize:30,fontWeight:“bold”,color:”#fff”,lineHeight:1.1,marginBottom:4}}>{nombre}</div>
<div style={{fontSize:12,color:“rgba(255,255,255,.5)”,fontStyle:“italic”,marginBottom:18}}>{MES_ES[today.getMonth()]} {today.getFullYear()}</div>
<div style={{background:“rgba(255,255,255,.1)”,backdropFilter:“blur(8px)”,borderRadius:20,padding:“16px 20px”,marginBottom:16,border:“1px solid rgba(255,255,255,.15)”}}>
<div style={{fontSize:9,letterSpacing:4,textTransform:“uppercase”,color:“rgba(255,255,255,.5)”,marginBottom:2}}>Hoy</div>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”}}>
<div>
<div style={{fontSize:40,fontWeight:“bold”,color:”#fff”,lineHeight:1}}>{today.getDate()}</div>
<div style={{fontSize:14,color:“rgba(255,255,255,.75)”,fontStyle:“italic”}}>{DAYS_ES[today.getDay()]}</div>
<div style={{fontSize:10,color:“rgba(255,255,255,.4)”,marginTop:2}}>Día {doy(today)} · {dleft(today)} restantes</div>
</div>
<div style={{textAlign:“right”}}>
{dd.mood&&<div style={{fontSize:28,marginBottom:4}}>{dd.mood}</div>}
<div style={{fontSize:11,color:“rgba(255,255,255,.6)”}}>✅ {done}/{tasks.length} tareas</div>
<div style={{fontSize:11,color:“rgba(255,255,255,.6)”}}>🔥 {habDone}/{habNames.length} hábitos</div>
</div>
</div>
{tasks.length>0&&<div style={{marginTop:10,height:3,background:“rgba(255,255,255,.15)”,borderRadius:2}}><div style={{height:“100%”,width:(done/tasks.length*100)+”%”,background:”#fff”,borderRadius:2,transition:“width .4s”}}/></div>}
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:8,marginBottom:18}}>
{[{id:“semanal”,l:“📋 Mi Semana”},{id:“habitos”,l:“🔥 Hábitos”},{id:“proyectos”,l:“📌 Proyectos”},{id:“buscar”,l:“🔍 Buscar”}].map(b=>(
<button key={b.id} onClick={()=>goTo(b.id)} style={{background:“rgba(255,255,255,.1)”,border:“1px solid rgba(255,255,255,.15)”,borderRadius:14,padding:“12px 8px”,color:”#fff”,cursor:“pointer”,fontSize:12}}>{b.l}</button>
))}
</div>
<button onClick={onLogout} style={{width:“100%”,background:“rgba(255,255,255,.08)”,border:“1px solid rgba(255,255,255,.15)”,borderRadius:12,padding:“10px”,color:“rgba(255,255,255,.5)”,cursor:“pointer”,fontSize:12,marginBottom:14}}>🔒 Cerrar sesión</button><div style={{borderTop:“1px solid rgba(255,255,255,.1)”,paddingTop:14}}>
<div style={{fontSize:9,fontStyle:“italic”,color:“rgba(255,255,255,.38)”,lineHeight:1.7}}>”{fr.t}”</div>
<div style={{fontSize:8,color:“rgba(255,255,255,.25)”,marginTop:4}}>— {fr.a}</div>
</div>
</div>
</div>
);
}

function Habitos({today,get,set,notify}){
const [selDate,setSelDate]=useState(today);
const [newTask,setNewTask]=useState(””);
const [newPrio,setNewPrio]=useState(“media”);
const [addingTask,setAddingTask]=useState(false);
const [editHabit,setEditHabit]=useState(false);
const [newHab,setNewHab]=useState(””);
const iref=useRef();
const dk=fk(selDate);
const dd=get(dk,{tasks:[],habits:{},mood:””});
const tasks=dd.tasks||[];
const habits=dd.habits||{};
const habNames=get(“habit_names”,DEF_HABITS);
const upd=v=>set(dk,{…dd,…v});
const PC={alta:”#e74c3c”,media:”#e67e22”,baja:”#27ae60”};
const habDone=habNames.filter(h=>habits[h]).length;
const done=tasks.filter(t=>t.done).length;
const ws=wkStart(selDate);
const wd=wkDays(ws);
return(
<div>
<PH title="Pendientes & Hábitos" sub="Daily Tracker"/>
<div style={{display:“flex”,background:”#fff”,borderBottom:“1px solid “+BD,padding:“6px 8px”,gap:4}}>
{wd.map((d,i)=>{
const isSel=fk(d)===fk(selDate),isT=isHoy(d,today);
const hd=Object.values(get(fk(d),{habits:{}}).habits||{}).filter(Boolean).length;
return(<button key={i} onClick={()=>setSelDate(new Date(d))} style={{flex:1,border:“none”,cursor:“pointer”,padding:“6px 2px”,borderRadius:10,background:isSel?AC:“transparent”}}>
<div style={{fontSize:7,textTransform:“uppercase”,color:isSel?“rgba(255,255,255,.7)”:FA}}>{DAYS_ES[d.getDay()].slice(0,3)}</div>
<div style={{fontSize:15,fontWeight:isT?“bold”:“normal”,color:isSel?”#fff”:isT?AC:TX}}>{d.getDate()}</div>
<div style={{fontSize:7,color:isSel?“rgba(255,255,255,.7)”:”#f39c12”,height:9}}>{hd>0?“🔥”:””}</div>
</button>);
})}
</div>
<div style={{padding:“14px”}}>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,marginBottom:12}}>
<div><div style={{fontSize:20,fontWeight:“bold”,color:AC}}>{selDate.getDate()} <span style={{fontSize:13,fontStyle:“italic”,color:TX,fontWeight:“normal”}}>{DAYS_ES[selDate.getDay()]}</span></div><div style={{fontSize:11,color:FA}}>{MES_ES[selDate.getMonth()]} {selDate.getFullYear()}</div></div>
{isHoy(selDate,today)&&<div style={{fontSize:9,letterSpacing:2,textTransform:“uppercase”,color:AC,fontWeight:“bold”,background:AL,padding:“4px 10px”,borderRadius:20}}>· HOY ·</div>}
</div>
{/* Mood */}
<div style={{background:”#fff”,borderRadius:16,border:“1px solid “+BD,padding:“14px”,marginBottom:12}}>
<div style={{fontSize:9,letterSpacing:3,textTransform:“uppercase”,color:MU,marginBottom:10}}>Estado de Ánimo</div>
<div style={{display:“flex”,gap:6}}>
{MOODS.map(m=><button key={m.e} onClick={()=>upd({mood:dd.mood===m.e?””:m.e})} style={{flex:1,border:“2px solid “+(dd.mood===m.e?AC:BD),borderRadius:12,padding:“8px 2px”,background:dd.mood===m.e?AL:“transparent”,cursor:“pointer”}}>
<div style={{fontSize:20}}>{m.e}</div>
<div style={{fontSize:7,color:dd.mood===m.e?AC:FA,marginTop:2}}>{m.l}</div>
</button>)}
</div>
</div>
{/* Hábitos */}
<div style={{background:”#fff”,borderRadius:16,border:“1px solid “+BD,padding:“14px”,marginBottom:12}}>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,marginBottom:8}}>
<div style={{fontSize:9,letterSpacing:3,textTransform:“uppercase”,color:MU}}>Hábitos del Día</div>
<div style={{display:“flex”,gap:6,alignItems:“center”}}><span style={{fontSize:11,color:AC,fontWeight:“bold”}}>{habDone}/{habNames.length}</span><button onClick={()=>setEditHabit(v=>!v)} style={{fontSize:9,background:“transparent”,color:FA,border:“1px solid “+BD,borderRadius:6,padding:“2px 8px”,cursor:“pointer”}}>editar</button></div>
</div>
<div style={{height:4,background:”#f0ebe2”,borderRadius:2,marginBottom:10}}><div style={{height:“100%”,width:(habNames.length?habDone/habNames.length*100:0)+”%”,background:“linear-gradient(90deg,#f39c12,#f1c40f)”,borderRadius:2,transition:“width .4s”}}/></div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:8}}>
{habNames.map(h=><div key={h} style={{display:“flex”,alignItems:“center”,gap:8,padding:“8px 10px”,borderRadius:10,background:habits[h]?AL:”#f9f6f1”,border:“1px solid “+(habits[h]?AC:BD),cursor:“pointer”}} onClick={()=>upd({habits:{…habits,[h]:!habits[h]}})}>
<div style={{width:20,height:20,borderRadius:“50%”,border:“2px solid “+(habits[h]?AC:FA),background:habits[h]?AC:“transparent”,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0,fontSize:10,color:”#fff”}}>{habits[h]?“✓”:””}</div>
<span style={{fontSize:11,color:habits[h]?AC:TX,flex:1,lineHeight:1.2}}>{h}</span>
{editHabit&&<button onClick={e=>{e.stopPropagation();set(“habit_names”,habNames.filter(x=>x!==h));}} style={{background:“none”,border:“none”,color:”#e74c3c”,cursor:“pointer”,fontSize:14,padding:0}}>×</button>}
</div>)}
</div>
{editHabit&&<div style={{display:“flex”,gap:8,marginTop:10}}>
<input value={newHab} onChange={e=>setNewHab(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”&&newHab.trim()){set(“habit_names”,[…habNames,newHab.trim()]);setNewHab(””);setEditHabit(false);notify(“Hábito agregado ✓”);}}} placeholder=“Nuevo hábito…” style={{…FI,border:“1px solid “+BD,borderRadius:8,padding:“7px 10px”,flex:1}}/>
<button onClick={()=>{if(newHab.trim()){set(“habit_names”,[…habNames,newHab.trim()]);setNewHab(””);setEditHabit(false);notify(“Hábito agregado ✓”);}}} style={BP}>+</button>
</div>}
</div>
{/* Pendientes */}
<div style={{background:”#fff”,borderRadius:16,border:“1px solid “+BD,padding:“14px”,marginBottom:16}}>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,marginBottom:10}}>
<div style={{fontSize:9,letterSpacing:3,textTransform:“uppercase”,color:MU}}>Pendientes del Día</div>
<span style={{fontSize:11,color:AC,fontWeight:“bold”}}>{done}/{tasks.length}</span>
</div>
{tasks.length===0&&!addingTask&&<div style={{textAlign:“center”,padding:“16px 0”,color:FA,fontSize:12}}>Toca + para agregar un pendiente</div>}
{tasks.map(t=><div key={t.id} style={{display:“flex”,alignItems:“flex-start”,gap:10,padding:“10px 0”,borderBottom:“1px solid #f5f0e8”}}>
<button onClick={()=>upd({tasks:tasks.map(x=>x.id===t.id?{…x,done:!x.done}:x)})} style={{width:22,height:22,borderRadius:“50%”,border:“2px solid “+PC[t.priority||“media”],background:t.done?PC[t.priority||“media”]:“transparent”,cursor:“pointer”,flexShrink:0,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:10,color:”#fff”,marginTop:1}}>{t.done?“✓”:””}</button>
<div style={{flex:1}}>
<div style={{fontSize:13,color:t.done?FA:TX,textDecoration:t.done?“line-through”:“none”}}>{t.text}</div>
<div style={{fontSize:9,color:PC[t.priority||“media”],marginTop:2,textTransform:“uppercase”,letterSpacing:1}}>{t.priority||“media”}</div>
</div>
<button onClick={()=>upd({tasks:tasks.filter(x=>x.id!==t.id)})} style={{background:“none”,border:“none”,color:FA,cursor:“pointer”,fontSize:16,padding:0}}>×</button>
</div>)}
{addingTask?<div style={{paddingTop:10}}>
<input ref={iref} autoFocus value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”&&newTask.trim()){upd({tasks:[…tasks,{id:Date.now(),text:newTask.trim(),priority:newPrio,done:false}]});setNewTask(””);setAddingTask(false);notify(“Pendiente agregado ✓”);}if(e.key===“Escape”)setAddingTask(false);}} placeholder=”¿Qué tienes pendiente?” style={{…FI,border:“1px solid “+BD,borderRadius:8,padding:“9px 12px”,marginBottom:8}}/>
<div style={{display:“flex”,gap:6,marginBottom:8}}>
{[“alta”,“media”,“baja”].map(p=><button key={p} onClick={()=>setNewPrio(p)} style={{flex:1,padding:“6px 4px”,borderRadius:8,border:“1px solid “+(newPrio===p?PC[p]:BD),background:newPrio===p?PC[p]:“transparent”,color:newPrio===p?”#fff”:TX,cursor:“pointer”,fontSize:11,textTransform:“capitalize”}}>{p}</button>)}
</div>
<div style={{display:“flex”,gap:8}}>
<button onClick={()=>{if(newTask.trim()){upd({tasks:[…tasks,{id:Date.now(),text:newTask.trim(),priority:newPrio,done:false}]});setNewTask(””);setAddingTask(false);notify(“Pendiente agregado ✓”);}}} style={BP}>Agregar</button>
<button onClick={()=>setAddingTask(false)} style={{…BP,background:FA}}>Cancelar</button>
</div>
</div>:<button onClick={()=>{setAddingTask(true);setTimeout(()=>iref.current?.focus(),50);}} style={{width:“100%”,marginTop:10,padding:“10px”,background:SF,border:“1px dashed “+BD,borderRadius:10,color:MU,cursor:“pointer”,fontSize:13}}>+ Agregar pendiente</button>}
</div>
</div>
</div>
);
}

function Semanal({today,get,set,notify,fr}){
const [ws,setWs]=useState(wkStart(today));
const [sd,setSd]=useState(today.getDay()===0?6:today.getDay()-1);
const [editH,setEditH]=useState(null);
const [editN,setEditN]=useState(false);
const [editG,setEditG]=useState(false);
const wd=wkDays(ws),wk=fwk(ws),sel=wd[sd]||wd[0];
const gDay=d=>get(fk(d),{hours:{},tasks:[],habits:{}});
const gWk=()=>get(wk,{notes:””,goals:””});
const sHour=(d,h,v)=>{const k=fk(d),dd=get(k,{hours:{}});set(k,{…dd,hours:{…(dd.hours||{}),[h]:v}});};
const sWkF=(f,v)=>{const m=gWk();set(wk,{…m,[f]:v});};
const prevW=()=>{const w=new Date(ws);w.setDate(w.getDate()-7);setWs(w);};
const nextW=()=>{const w=new Date(ws);w.setDate(w.getDate()+7);setWs(w);};
const goNow=()=>{setWs(wkStart(today));setSd(today.getDay()===0?6:today.getDay()-1);};
const dl=()=>{
let t=“SEMANA “+wnum(ws)+” — “+wd[0].getDate()+” “+MES_ES[wd[0].getMonth()]+” – “+wd[6].getDate()+” “+MES_ES[wd[6].getMonth()]+” “+wd[6].getFullYear()+”\n\n”;
wd.forEach(d=>{const dd=gDay(d);t+=DAYS_ES[d.getDay()]+” “+d.getDate()+”\n”;HORAS.forEach(h=>{const v=dd.hours?.[h];if(v)t+=”  “+h+”:00  “+v+”\n”;});(dd.tasks||[]).forEach(tk=>t+=”  [”+(tk.done?“✓”:” “)+”] “+tk.text+”\n”);t+=”\n”;});
const m=gWk();if(m.notes)t+=“NOTAS:\n”+m.notes+”\n\n”;if(m.goals)t+=“OBJETIVOS:\n”+m.goals+”\n”;
const a=document.createElement(“a”);a.href=URL.createObjectURL(new Blob([t],{type:“text/plain”}));a.download=“semana”+wnum(ws)+”.txt”;a.click();notify(“Descargada ✓”);
};
const dd=gDay(sel),meta=gWk();
const habNames=get(“habit_names”,DEF_HABITS);
const wdKeys=new Set(wd.map(d=>fk(d)));
const mm1={y:ws.getFullYear(),m:ws.getMonth()};
const d2=new Date(ws.getFullYear(),ws.getMonth()+1,1);
const mm2={y:d2.getFullYear(),m:d2.getMonth()};

const MiniCal=({y,m})=>{
const g=mgrid(y,m);
return(
<div style={{padding:“8px 10px”,borderBottom:“1px solid “+BD}}>
<div style={{fontSize:8,letterSpacing:2,textTransform:“uppercase”,color:MU,marginBottom:4}}>{MES_ES[m].slice(0,3)} <em style={{fontSize:7}}>{MES_EN[m].slice(0,3)}</em></div>
<div style={{display:“grid”,gridTemplateColumns:“repeat(7,1fr)”,gap:1}}>
{[“L”,“M”,“M”,“J”,“V”,“S”,“D”].map((x,i)=><div key={i} style={{fontSize:6,color:FA,textAlign:“center”}}>{x}</div>)}
{g.map((x,i)=>{
if(!x)return <div key={i}/>;
const dt=new Date(y,m,x),isT=fk(dt)===fk(today),inW=wdKeys.has(fk(dt));
return <div key={i} onClick={()=>{setWs(wkStart(dt));setSd(dt.getDay()===0?6:dt.getDay()-1);}} style={{fontSize:7,textAlign:“center”,padding:“1px 0”,borderRadius:2,cursor:“pointer”,background:isT?AC:inW?AL:“transparent”,color:isT?”#fff”:inW?AC:TX,fontWeight:isT||inW?“bold”:“normal”}}>{x}</div>;
})}
</div>
</div>
);
};

return(
<div>
<div style={{background:SF,borderBottom:“1px solid “+BD,padding:“8px 14px”,display:“flex”,alignItems:“center”,justifyContent:“space-between”,position:“sticky”,top:0,zIndex:50}}>
<div style={{display:“flex”,gap:5}}><button onClick={prevW} style={BI}>‹</button><button onClick={goNow} style={{…BI,fontSize:9,padding:“3px 9px”}}>HOY</button><button onClick={nextW} style={BI}>›</button></div>
<div style={{textAlign:“center”}}><div style={{fontSize:9,letterSpacing:3,textTransform:“uppercase”,color:MU}}>Semana {wnum(ws)}</div><div style={{fontSize:12,fontWeight:“bold”}}>{MES_ES[wd[0].getMonth()].toUpperCase()} {wd[0].getFullYear()}</div></div>
<button onClick={dl} style={{…BI,fontSize:10,padding:“3px 9px”}}>↓</button>
</div>
<div style={{display:“flex”,background:”#fff”,borderBottom:“1px solid “+BD}}>
{wd.map((d,i)=>{
const ddd=gDay(d),hasC=Object.values(ddd.hours||{}).some(Boolean)||(ddd.tasks||[]).length>0;
const hd=Object.values(ddd.habits||{}).filter(Boolean).length;
return(<button key={i} onClick={()=>setSd(i)} style={{flex:1,minWidth:40,padding:“8px 2px 6px”,border:“none”,cursor:“pointer”,background:“transparent”,borderBottom:i===sd?“3px solid “+AC:“3px solid transparent”}}>
<div style={{fontSize:7,textTransform:“uppercase”,color:i===sd?AC:FA}}>{DAYS_ES[d.getDay()].slice(0,3)}</div>
<div style={{fontSize:15,fontWeight:isHoy(d,today)?“bold”:“normal”,color:i===sd?AC:isHoy(d,today)?AC:TX}}>{d.getDate()}</div>
<div style={{fontSize:8,height:9,color:hd>0?”#f39c12”:FA}}>{hd>0?“🔥”:hasC?”·”:””}</div>
</button>);
})}
</div>
<div style={{display:“flex”,background:”#fff”,minHeight:“calc(100vh - 210px)”}}>
<div style={{flex:1,borderRight:“1px solid “+BD,minWidth:0}}>
<div style={{padding:“10px 14px 8px”,borderBottom:“1px solid “+BD,background:SF}}>
<div style={{display:“flex”,alignItems:“center”,gap:10}}>
<div style={{fontSize:28,fontWeight:“bold”,color:TX,lineHeight:1}}>{sel.getDate()}</div>
<div style={{flex:1}}><div style={{fontSize:13,fontStyle:“italic”,color:”#4a3a2a”}}>{DAYS_ES[sel.getDay()]}</div><div style={{fontSize:9,color:FA,letterSpacing:2}}>{DAYS_EN[sel.getDay()]}</div></div>
<div style={{textAlign:“right”}}><div style={{fontSize:10,color:MU}}>{MES_ES[sel.getMonth()]} {sel.getFullYear()}</div><div style={{fontSize:9,color:FA}}>Día {doy(sel)} · {dleft(sel)} rest.</div></div>
</div>
{isHoy(sel,today)&&<div style={{fontSize:9,letterSpacing:3,textTransform:“uppercase”,color:AC,marginTop:3,fontWeight:“bold”}}>· HOY ·</div>}
{(dd.mood||(dd.tasks||[]).length>0)&&<div style={{display:“flex”,gap:8,marginTop:5,alignItems:“center”}}>{dd.mood&&<span style={{fontSize:14}}>{dd.mood}</span>}{(dd.tasks||[]).length>0&&<span style={{fontSize:10,color:MU}}>✅ {(dd.tasks||[]).filter(t=>t.done).length}/{(dd.tasks||[]).length}</span>}</div>}
</div>
{HORAS.map(h=>{
const val=dd.hours?.[h]||””,key=fk(sel)+”-”+h,isEd=editH===key;
return(<div key={h} style={{display:“flex”,borderBottom:“1px solid #f5f0e8”,minHeight:32}}>
<div style={{width:32,flexShrink:0,borderRight:“1px solid #f5f0e8”,display:“flex”,alignItems:“flex-start”,justifyContent:“flex-end”,padding:“8px 5px 0 0”,fontSize:9,color:FA}}>{h}</div>
{isEd?<input autoFocus value={val} onChange={e=>sHour(sel,h,e.target.value)} onBlur={()=>setEditH(null)} onKeyDown={e=>{if(e.key===“Enter”||e.key===“Escape”)setEditH(null);}} style={{flex:1,border:“none”,background:”#f0f6ff”,fontSize:12,padding:“7px 10px”,fontFamily:“inherit”,color:TX,minHeight:32}}/>
:<div onClick={()=>setEditH(key)} style={{flex:1,padding:“7px 10px”,fontSize:12,cursor:“text”,color:val?TX:“transparent”,lineHeight:1.4,userSelect:“none”}} onMouseEnter={e=>e.currentTarget.style.background=SF} onMouseLeave={e=>e.currentTarget.style.background=“transparent”}>{val||”·”}</div>}
</div>);
})}
</div>
<div style={{width:172,flexShrink:0,background:SF,display:“flex”,flexDirection:“column”}}>
{/* Notas */}
<div style={{padding:“8px 10px”,borderBottom:“1px solid “+BD}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”,marginBottom:4}}>
<span style={{fontSize:8,letterSpacing:2,textTransform:“uppercase”,color:MU}}>Notas <em style={{fontSize:7}}>Notes</em></span>
{editN?<button onClick={()=>{setEditN(false);notify(“Notas guardadas ✓”);}} style={{fontSize:8,background:AC,color:”#fff”,border:“none”,borderRadius:4,padding:“1px 7px”,cursor:“pointer”}}>✓</button>:<button onClick={()=>setEditN(true)} style={{fontSize:8,background:“transparent”,color:FA,border:“1px solid “+BD,borderRadius:4,padding:“1px 7px”,cursor:“pointer”}}>editar</button>}
</div>
{editN?<textarea autoFocus value={meta.notes} onChange={e=>sWkF(“notes”,e.target.value)} style={{width:“100%”,border:“1px solid “+BD,borderRadius:4,padding:6,fontSize:11,fontFamily:“inherit”,background:”#fff”,resize:“none”,minHeight:100,lineHeight:1.8,color:TX}}/>
:<div onClick={()=>setEditN(true)} style={{minHeight:100,cursor:“text”,fontSize:11,color:meta.notes?TX:FA,lineHeight:1.9,whiteSpace:“pre-wrap”}}>{meta.notes||“Toca para escribir…”}{!meta.notes&&[…Array(5)].map((_,i)=><div key={i} style={{borderBottom:“1px solid “+BD,height:20}}/>)}</div>}
</div>
{/* Objetivos */}
<div style={{padding:“8px 10px”,borderBottom:“1px solid “+BD}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”,marginBottom:4}}>
<span style={{fontSize:8,letterSpacing:2,textTransform:“uppercase”,color:MU}}>Objetivos <em style={{fontSize:7}}>Goals</em></span>
{editG?<button onClick={()=>{setEditG(false);notify(“Objetivos guardados ✓”);}} style={{fontSize:8,background:AC,color:”#fff”,border:“none”,borderRadius:4,padding:“1px 7px”,cursor:“pointer”}}>✓</button>:<button onClick={()=>setEditG(true)} style={{fontSize:8,background:“transparent”,color:FA,border:“1px solid “+BD,borderRadius:4,padding:“1px 7px”,cursor:“pointer”}}>editar</button>}
</div>
{editG?<textarea autoFocus value={meta.goals} onChange={e=>sWkF(“goals”,e.target.value)} style={{width:“100%”,border:“1px solid “+BD,borderRadius:4,padding:6,fontSize:11,fontFamily:“inherit”,background:”#fff”,resize:“none”,minHeight:80,lineHeight:1.8,color:TX}}/>
:<div onClick={()=>setEditG(true)} style={{minHeight:80,cursor:“text”,fontSize:11,color:meta.goals?TX:FA,lineHeight:1.9,whiteSpace:“pre-wrap”}}>{meta.goals||“Toca para escribir…”}{!meta.goals&&[…Array(4)].map((_,i)=><div key={i} style={{borderBottom:“1px solid “+BD,height:20}}/>)}</div>}
</div>
{/* Hábitos mini */}
<div style={{padding:“8px 10px”,borderBottom:“1px solid “+BD}}>
<div style={{fontSize:8,letterSpacing:2,textTransform:“uppercase”,color:MU,marginBottom:5}}>Hábitos</div>
{habNames.map(h=>{
const chk=(dd.habits||{})[h];
return(<div key={h} onClick={()=>{const k=fk(sel);const ddd=get(k,{habits:{}});set(k,{…ddd,habits:{…(ddd.habits||{}),[h]:!chk}});}} style={{display:“flex”,alignItems:“center”,gap:5,padding:“3px 0”,cursor:“pointer”}}>
<div style={{width:12,height:12,borderRadius:“50%”,border:“1.5px solid “+(chk?AC:FA),background:chk?AC:“transparent”,flexShrink:0,display:“flex”,alignItems:“center”,justifyContent:“center”}}>{chk&&<span style={{fontSize:7,color:”#fff”}}>✓</span>}</div>
<span style={{fontSize:9,color:chk?AC:MU,lineHeight:1.3}}>{h}</span>
</div>);
})}
</div>
<MiniCal y={mm1.y} m={mm1.m}/>
<MiniCal y={mm2.y} m={mm2.m}/>
<div style={{padding:“10px”,marginTop:“auto”,borderTop:“1px solid “+BD}}>
<div style={{fontSize:8,fontStyle:“italic”,color:MU,lineHeight:1.7}}>”{fr.t}”</div>
<div style={{fontSize:7,color:FA,marginTop:3,textAlign:“right”}}>— {fr.a}</div>
</div>
</div>
</div>
</div>
);
}

function Mensual({today,get,set,notify}){
const [year,setYear]=useState(today.getFullYear());
const [month,setMonth]=useState(today.getMonth());
const [selD,setSelD]=useState(null);
const [editing,setEditing]=useState(false);
const grid=mgrid(year,month);
const mk=d=>year+”-”+month+”-”+d;
const dd=d=>get(mk(d),{note:””,tasks:[],mood:””});
const prevM=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);setSelD(null);};
const nextM=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);setSelD(null);};
const pm=month===0?{y:year-1,m:11}:{y:year,m:month-1};
const nm=month===11?{y:year+1,m:0}:{y:year,m:month+1};
const MiniM=({y,m})=>{
const g=mgrid(y,m);
return(<div style={{flex:1,background:”#fff”,borderRadius:12,padding:“10px”,border:“1px solid “+BD}}>
<div style={{fontSize:8,fontWeight:“bold”,letterSpacing:2,textTransform:“uppercase”,color:MU,marginBottom:4,textAlign:“center”}}>{MES_ES[m].slice(0,3)} {y}</div>
<div style={{display:“grid”,gridTemplateColumns:“repeat(7,1fr)”,gap:1}}>
{[“L”,“M”,“M”,“J”,“V”,“S”,“D”].map((x,i)=><div key={i} style={{fontSize:6,color:FA,textAlign:“center”}}>{x}</div>)}
{g.map((x,i)=>{if(!x)return <div key={i}/>;const isT=x===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();return <div key={i} style={{fontSize:7,textAlign:“center”,borderRadius:2,background:isT?AC:“transparent”,color:isT?”#fff”:TX}}>{x}</div>;})}
</div>
</div>);
};
return(
<div>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,padding:“13px 16px”,borderBottom:“1px solid “+BD,background:SF,position:“sticky”,top:0,zIndex:50}}>
<button onClick={prevM} style={BI}>‹</button>
<div style={{textAlign:“center”}}><div style={{fontSize:18,fontWeight:“bold”,color:AC}}>{MES_ES[month].toUpperCase()}</div><div style={{fontSize:10,color:FA,letterSpacing:2}}>{MES_EN[month]} · {year}</div></div>
<button onClick={nextM} style={BI}>›</button>
</div>
<div style={{padding:“10px 12px”}}>
<div style={{display:“grid”,gridTemplateColumns:“repeat(7,1fr)”,gap:2,marginBottom:4}}>
{[“Lun”,“Mar”,“Mié”,“Jue”,“Vie”,“Sáb”,“Dom”].map((x,i)=><div key={i} style={{fontSize:8,textTransform:“uppercase”,color:MU,textAlign:“center”,padding:“4px 0”}}>{x}</div>)}
</div>
<div style={{display:“grid”,gridTemplateColumns:“repeat(7,1fr)”,gap:3}}>
{grid.map((d,i)=>{
if(!d)return <div key={i}/>;
const isT=d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
const isSel=d===selD;
const ddd=dd(d);
return(<div key={i} onClick={()=>setSelD(isSel?null:d)} style={{minHeight:46,borderRadius:10,cursor:“pointer”,background:isSel?AC:isT?AL:”#fff”,border:“1px solid “+(isSel?AC:isT?AC:BD),padding:“5px 3px”,textAlign:“center”}}>
<div style={{fontSize:12,fontWeight:isT||isSel?“bold”:“normal”,color:isSel?”#fff”:isT?AC:TX}}>{d}</div>
{ddd.mood&&<div style={{fontSize:9}}>{ddd.mood}</div>}
{((ddd.note)||(ddd.tasks||[]).length>0)&&<div style={{width:4,height:4,borderRadius:“50%”,background:isSel?“rgba(255,255,255,.7)”:AC,margin:“2px auto 0”}}/>}
</div>);
})}
</div>
</div>
{selD&&<div style={{margin:“0 12px 12px”,background:”#fff”,borderRadius:14,border:“1px solid “+BD,overflow:“hidden”}}>
<div style={{padding:“10px 14px”,background:SF,borderBottom:“1px solid “+BD,display:“flex”,alignItems:“center”,justifyContent:“space-between”}}>
<div><span style={{fontSize:16,fontWeight:“bold”,color:AC}}>{selD}</span><span style={{fontSize:12,color:MU,marginLeft:6}}>{DAYS_ES[new Date(year,month,selD).getDay()]}</span></div>
{editing?<button onClick={()=>{setEditing(false);notify(“Nota guardada ✓”);}} style={{fontSize:10,background:AC,color:”#fff”,border:“none”,borderRadius:6,padding:“3px 10px”,cursor:“pointer”}}>Guardar ✓</button>:<button onClick={()=>setEditing(true)} style={{fontSize:10,background:“transparent”,color:MU,border:“1px solid “+BD,borderRadius:6,padding:“3px 10px”,cursor:“pointer”}}>Editar</button>}
</div>
{dd(selD).mood&&<div style={{padding:“8px 14px”,fontSize:16,borderBottom:“1px solid “+BD}}>{dd(selD).mood} {MOODS.find(m=>m.e===dd(selD).mood)?.l}</div>}
{editing?<textarea autoFocus value={dd(selD).note} onChange={e=>set(mk(selD),{…dd(selD),note:e.target.value})} style={{width:“100%”,border:“none”,padding:“12px 14px”,fontSize:13,fontFamily:“inherit”,resize:“none”,minHeight:80,background:”#fff”,color:TX,lineHeight:1.7}}/>
:<div onClick={()=>setEditing(true)} style={{padding:“12px 14px”,minHeight:60,fontSize:13,color:dd(selD).note?TX:FA,cursor:“text”,lineHeight:1.7,whiteSpace:“pre-wrap”}}>{dd(selD).note||“Toca para agregar una nota…”}</div>}
{(dd(selD).tasks||[]).length>0&&<div style={{padding:“8px 14px”,borderTop:“1px solid “+BD}}>{(dd(selD).tasks||[]).map(t=><div key={t.id} style={{fontSize:12,color:t.done?FA:TX,textDecoration:t.done?“line-through”:“none”,padding:“2px 0”}}>{t.done?“✓”:“○”} {t.text}</div>)}</div>}
</div>}
<div style={{display:“flex”,gap:10,padding:“0 12px 12px”}}><MiniM y={pm.y} m={pm.m}/><MiniM y={nm.y} m={nm.m}/></div>
<div style={{margin:“0 12px 16px”,background:”#fff”,borderRadius:14,border:“1px solid “+BD,padding:“14px”}}>
<div style={{fontSize:9,letterSpacing:3,textTransform:“uppercase”,color:MU,marginBottom:8}}>Notas del mes</div>
<textarea value={get(“month-”+year+”-”+month,””)} onChange={e=>set(“month-”+year+”-”+month,e.target.value)} placeholder=“Notas generales del mes…” style={{width:“100%”,border:“none”,borderBottom:“1px solid “+BD,padding:“4px 0”,fontSize:13,fontFamily:“inherit”,resize:“none”,minHeight:60,background:“transparent”,color:TX,lineHeight:1.8}}/>
</div>
</div>
);
}

function Anual({today,get,set}){
const year=get(“anual_year”,today.getFullYear());
const sy=v=>set(“anual_year”,v);
return(
<div>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,padding:“14px 20px”,background:SF,borderBottom:“1px solid “+BD}}>
<button onClick={()=>sy(year-1)} style={BI}>‹</button>
<div style={{fontSize:30,fontWeight:“bold”,color:AC,letterSpacing:-1}}>{year}</div>
<button onClick={()=>sy(year+1)} style={BI}>›</button>
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr 1fr”,gap:10,padding:“12px”}}>
{MES_ES.map((m,mi)=>{
const grid=mgrid(year,mi);
return(<div key={mi} style={{background:”#fff”,borderRadius:12,padding:“10px 8px”,border:“1px solid “+BD}}>
<div style={{fontSize:8,fontWeight:“bold”,letterSpacing:2,textTransform:“uppercase”,color:AC,marginBottom:4,textAlign:“center”}}>{m.slice(0,3).toUpperCase()}</div>
<div style={{display:“grid”,gridTemplateColumns:“repeat(7,1fr)”,gap:1}}>
{[“L”,“M”,“M”,“J”,“V”,“S”,“D”].map((x,i)=><div key={i} style={{fontSize:6,color:FA,textAlign:“center”}}>{x}</div>)}
{grid.map((d,i)=>{
if(!d)return <div key={i}/>;
const isT=d===today.getDate()&&mi===today.getMonth()&&year===today.getFullYear();
return <div key={i} style={{fontSize:7,textAlign:“center”,padding:“1px 0”,borderRadius:2,background:isT?AC:“transparent”,color:isT?”#fff”:TX,fontWeight:isT?“bold”:“normal”}}>{d}</div>;
})}
</div>
</div>);
})}
</div>
</div>
);
}

function Proyectos({get,set,notify}){
const [selI,setSelI]=useState(0);
const proy=get(“proyectos”,[{id:1,nombre:””,desc:””,prioridad:“Media”,inicio:””,fin:””,recursos:””,objetivos:””,resultados:””,acciones:””,obs:””}]);
const upd=(k,v)=>{const a=[…proy];a[selI]={…a[selI],[k]:v};set(“proyectos”,a);};
const add=()=>{const a=[…proy,{id:Date.now(),nombre:“Nuevo Proyecto”,desc:””,prioridad:“Media”,inicio:””,fin:””,recursos:””,objetivos:””,resultados:””,acciones:””,obs:””}];set(“proyectos”,a);setSelI(a.length-1);};
const del=()=>{if(proy.length<=1){notify(“Debe haber al menos un proyecto”);return;}set(“proyectos”,proy.filter((_,i)=>i!==selI));setSelI(0);};
const p=proy[selI]||{};
const PC={Alta:”#c0392b”,Media:”#e67e22”,Baja:”#27ae60”};
return(
<div style={{padding:“0 0 20px”}}>
<PH title="Planificador de Proyectos" sub="Project Planner"/>
<div style={{padding:“0 14px”}}>
<div style={{display:“flex”,gap:6,overflowX:“auto”,paddingBottom:8,marginBottom:12}}>
{proy.map((pr,i)=><button key={pr.id} onClick={()=>setSelI(i)} style={{flexShrink:0,padding:“6px 14px”,borderRadius:20,border:“1px solid “+(i===selI?AC:BD),background:i===selI?AC:“transparent”,color:i===selI?”#fff”:TX,cursor:“pointer”,fontSize:12,whiteSpace:“nowrap”}}>{pr.nombre||“Proyecto “+(i+1)}</button>)}
<button onClick={add} style={{flexShrink:0,padding:“6px 14px”,borderRadius:20,border:“1px dashed “+BD,background:“transparent”,color:MU,cursor:“pointer”,fontSize:12}}>+ Nuevo</button>
</div>
<div style={{background:”#fff”,borderRadius:16,border:“1px solid “+BD,padding:16,marginBottom:12}}>
<div style={{display:“flex”,justifyContent:“space-between”,marginBottom:12}}><div style={{fontSize:9,letterSpacing:3,textTransform:“uppercase”,color:AC}}>Proyecto</div><button onClick={del} style={{fontSize:10,color:”#c0392b”,background:“transparent”,border:“1px solid #c0392b”,borderRadius:6,padding:“2px 10px”,cursor:“pointer”}}>Eliminar</button></div>
{[[“Nombre”,“nombre”],[“Descripción”,“desc”],[“Recursos”,“recursos”]].map(([l,k])=><div key={k} style={{marginBottom:10}}><label style={LB}>{l}</label><input value={p[k]||””} onChange={e=>upd(k,e.target.value)} style={{…FI}}/></div>)}
<div style={{marginBottom:10}}><label style={LB}>Prioridad</label><div style={{display:“flex”,gap:6,marginTop:4}}>{[“Alta”,“Media”,“Baja”].map(v=><button key={v} onClick={()=>upd(“prioridad”,v)} style={{flex:1,padding:“6px 4px”,borderRadius:8,border:“1px solid “+((p.prioridad||“Media”)===v?PC[v]:BD),background:(p.prioridad||“Media”)===v?PC[v]:“transparent”,color:(p.prioridad||“Media”)===v?”#fff”:TX,cursor:“pointer”,fontSize:11}}>{v}</button>)}</div></div>
<div style={{display:“flex”,gap:10,marginBottom:10}}>
<div style={{flex:1}}><label style={LB}>Inicia</label><input type=“date” value={p.inicio||””} onChange={e=>upd(“inicio”,e.target.value)} style={{…FI}}/></div>
<div style={{flex:1}}><label style={LB}>Termina</label><input type=“date” value={p.fin||””} onChange={e=>upd(“fin”,e.target.value)} style={{…FI}}/></div>
</div>
{[[“Objetivos”,“objetivos”],[“Resultados”,“resultados”],[“Acciones Importantes”,“acciones”],[“Observaciones”,“obs”]].map(([l,k])=><div key={k} style={{marginBottom:10}}><label style={LB}>{l}</label><textarea value={p[k]||””} onChange={e=>upd(k,e.target.value)} rows={3} style={{…FI,resize:“none”,lineHeight:1.7}}/></div>)}
</div>
<div style={{textAlign:“center”}}><button onClick={()=>notify(“Guardado ✓”)} style={BP}>Guardar</button></div>
</div>
</div>
);
}

function Mas({get,set,notify,goTo}){
const [open,setOpen]=useState(false);
const [newR,setNewR]=useState({title:””,date:””,time:””,note:””});
const today=new Date();
const todayStr=today.toISOString().split(“T”)[0];
const reminders=get(“reminders”,[]);
const add=()=>{if(!newR.title.trim()||!newR.date||!newR.time){notify(“Completa título, fecha y hora”);return;}set(“reminders”,[…reminders,{…newR,id:Date.now()}]);setNewR({title:””,date:””,time:””,note:””});setOpen(false);notify(“Recordatorio agregado ✓”);};
const del=id=>set(“reminders”,reminders.filter(r=>r.id!==id));
const sorted=[…reminders].sort((a,b)=>new Date(a.date+“T”+a.time)-new Date(b.date+“T”+b.time));
const upcoming=sorted.filter(r=>new Date(r.date+“T”+r.time)>=today);
const past=sorted.filter(r=>new Date(r.date+“T”+r.time)<today);
return(
<div style={{padding:“0 0 20px”}}>
<PH title="Más opciones" sub="More"/>
<div style={{padding:“0 14px”}}>
{[{id:“buscar”,ic:“🔍”,t:“Búsqueda Global”,s:“Busca en todas tus notas y pendientes”},{id:“personal”,ic:“👤”,t:“Datos Personales”,s:“Información personal y emergencias”},{id:“directorio”,ic:“📒”,t:“Directorio”,s:“Agenda de contactos”}].map(item=>(
<button key={item.id} onClick={()=>goTo(item.id)} style={{width:“100%”,background:”#fff”,border:“1px solid “+BD,borderRadius:14,padding:“16px”,marginBottom:10,cursor:“pointer”,textAlign:“left”,display:“flex”,alignItems:“center”,gap:14}}>
<div style={{fontSize:26}}>{item.ic}</div>
<div style={{flex:1}}><div style={{fontSize:14,fontWeight:“bold”,color:TX}}>{item.t}</div><div style={{fontSize:11,color:MU,marginTop:2}}>{item.s}</div></div>
<div style={{fontSize:20,color:FA}}>›</div>
</button>
))}
{/* Recordatorios */}
<div style={{background:”#fff”,border:“1px solid “+BD,borderRadius:14,padding:“16px”,marginBottom:10}}>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,marginBottom:12}}>
<div style={{display:“flex”,alignItems:“center”,gap:10}}><div style={{fontSize:24}}>🔔</div><div><div style={{fontSize:14,fontWeight:“bold”,color:TX}}>Recordatorios</div><div style={{fontSize:11,color:MU}}>Alertas y avisos importantes</div></div></div>
<button onClick={()=>setOpen(v=>!v)} style={{…BP,padding:“7px 14px”,fontSize:12}}>+ Nuevo</button>
</div>
{open&&<div style={{background:SF,borderRadius:12,padding:14,marginBottom:12,border:“1px solid “+BD}}>
<div style={{marginBottom:8}}><label style={LB}>Título</label><input value={newR.title} onChange={e=>setNewR(p=>({…p,title:e.target.value}))} placeholder=”¿Qué recordar?” style={{…FI,border:“1px solid “+BD,borderRadius:8,padding:“8px 10px”}}/></div>
<div style={{display:“flex”,gap:8,marginBottom:8}}>
<div style={{flex:1}}><label style={LB}>Fecha</label><input type=“date” value={newR.date} onChange={e=>setNewR(p=>({…p,date:e.target.value}))} style={{…FI,border:“1px solid “+BD,borderRadius:8,padding:“8px 10px”}}/></div>
<div style={{flex:1}}><label style={LB}>Hora</label><input type=“time” value={newR.time} onChange={e=>setNewR(p=>({…p,time:e.target.value}))} style={{…FI,border:“1px solid “+BD,borderRadius:8,padding:“8px 10px”}}/></div>
</div>
<div style={{marginBottom:10}}><label style={LB}>Nota (opcional)</label><input value={newR.note} onChange={e=>setNewR(p=>({…p,note:e.target.value}))} placeholder=“Detalles…” style={{…FI,border:“1px solid “+BD,borderRadius:8,padding:“8px 10px”}}/></div>
<div style={{display:“flex”,gap:8}}><button onClick={add} style={BP}>Guardar</button><button onClick={()=>setOpen(false)} style={{…BP,background:FA}}>Cancelar</button></div>
</div>}
{upcoming.length===0&&past.length===0&&<div style={{textAlign:“center”,padding:“14px 0”,color:FA,fontSize:12}}>Sin recordatorios</div>}
{upcoming.map(r=>{const isT=r.date===todayStr;return(<div key={r.id} style={{display:“flex”,alignItems:“flex-start”,gap:10,padding:“10px 12px”,borderRadius:12,background:isT?AL:SF,border:“1px solid “+(isT?AC:BD),marginBottom:6}}>
<div style={{fontSize:18}}>⏰</div>
<div style={{flex:1}}><div style={{fontSize:13,fontWeight:“bold”,color:TX}}>{r.title}</div><div style={{fontSize:11,color:isT?AC:MU}}>{isT?“Hoy”:r.date} · {r.time}</div>{r.note&&<div style={{fontSize:11,color:MU,marginTop:2}}>{r.note}</div>}</div>
<button onClick={()=>del(r.id)} style={{background:“none”,border:“none”,color:FA,cursor:“pointer”,fontSize:18,padding:0}}>×</button>
</div>);})}
{past.length>0&&<div style={{marginTop:8}}>{past.map(r=><div key={r.id} style={{display:“flex”,alignItems:“center”,gap:10,padding:“8px 12px”,borderRadius:10,border:“1px solid “+BD,marginBottom:4,opacity:.5}}>
<div style={{fontSize:14}}>✓</div>
<div style={{flex:1}}><div style={{fontSize:12,color:MU,textDecoration:“line-through”}}>{r.title}</div><div style={{fontSize:10,color:FA}}>{r.date} · {r.time}</div></div>
<button onClick={()=>del(r.id)} style={{background:“none”,border:“none”,color:FA,cursor:“pointer”,fontSize:16,padding:0}}>×</button>
</div>)}</div>}
</div>
</div>
</div>
);
}

function Buscar({data}){
const [q,setQ]=useState(””);
const [res,setRes]=useState([]);
useEffect(()=>{
if(q.trim().length<2){setRes([]);return;}
const ql=q.toLowerCase(),found=[];
Object.entries(data).forEach(([key,val])=>{
if(!val||typeof val!==“object”)return;
if(val.hours)Object.entries(val.hours).forEach(([h,text])=>{if(text&&text.toLowerCase().includes(ql))found.push({key,type:“hora”,text,detail:h+”:00”});});
if(val.tasks)(val.tasks).forEach(t=>{if(t.text&&t.text.toLowerCase().includes(ql))found.push({key,type:“pendiente”,text:t.text,detail:t.done?“Completado”:“Pendiente”});});
if(val.note&&val.note.toLowerCase().includes(ql))found.push({key,type:“nota”,text:val.note.slice(0,80),detail:“Nota del día”});
if(val.notes&&val.notes.toLowerCase().includes(ql))found.push({key,type:“nota semanal”,text:val.notes.slice(0,80),detail:“Notas semana”});
if(val.goals&&val.goals.toLowerCase().includes(ql))found.push({key,type:“objetivo”,text:val.goals.slice(0,80),detail:“Objetivos”});
});
Object.entries(data).forEach(([key,val])=>{if(key.startsWith(“month-”)&&typeof val===“string”&&val.toLowerCase().includes(ql))found.push({key,type:“nota mensual”,text:val.slice(0,80),detail:“Nota del mes”});});
setRes(found.slice(0,30));
},[q,data]);
const HL=({text})=>{const ql=q.toLowerCase(),idx=text.toLowerCase().indexOf(ql);if(idx<0)return <span>{text}</span>;return <span>{text.slice(0,idx)}<mark style={{background:”#fff176”,borderRadius:2}}>{text.slice(idx,idx+q.length)}</mark>{text.slice(idx+q.length)}</span>;};
const TI={hora:“🕐”,pendiente:“✅”,nota:“📝”,“nota semanal”:“📋”,objetivo:“🎯”,“nota mensual”:“🗓”};
return(
<div>
<PH title="Búsqueda Global" sub="Search everything"/>
<div style={{padding:“0 14px 14px”,position:“sticky”,top:0,background:”#eee9e1”,zIndex:10,paddingTop:14}}>
<div style={{position:“relative”}}><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder=“🔍  Busca notas, pendientes, horas…” style={{…FI,border:“1px solid “+BD,borderRadius:12,padding:“12px 16px”,fontSize:14,background:”#fff”}}/>{q&&<button onClick={()=>setQ(””)} style={{position:“absolute”,right:12,top:“50%”,transform:“translateY(-50%)”,background:“none”,border:“none”,color:FA,cursor:“pointer”,fontSize:18}}>×</button>}</div>
{q.length>0&&<div style={{fontSize:11,color:MU,marginTop:6,paddingLeft:4}}>{res.length} resultado{res.length!==1?“s”:””}</div>}
</div>
<div style={{padding:“0 14px”}}>
{q.length<2&&<div style={{textAlign:“center”,padding:“40px 0”,color:FA}}><div style={{fontSize:40,marginBottom:10}}>🔍</div><div style={{fontSize:13}}>Escribe al menos 2 caracteres</div></div>}
{res.length===0&&q.length>=2&&<div style={{textAlign:“center”,padding:“40px 0”,color:FA}}><div style={{fontSize:40,marginBottom:10}}>😶</div><div style={{fontSize:13}}>Sin resultados para “{q}”</div></div>}
{res.map((r,i)=><div key={i} style={{background:”#fff”,borderRadius:12,border:“1px solid “+BD,padding:“12px 14px”,marginBottom:8}}>
<div style={{display:“flex”,alignItems:“center”,gap:8,marginBottom:4}}><span style={{fontSize:14}}>{TI[r.type]||“📄”}</span><span style={{fontSize:9,letterSpacing:2,textTransform:“uppercase”,color:AC,background:AL,padding:“2px 8px”,borderRadius:6}}>{r.type}</span></div>
<div style={{fontSize:13,color:TX,lineHeight:1.5}}><HL text={r.text}/></div>
<div style={{fontSize:10,color:MU,marginTop:3}}>{r.detail}</div>
</div>)}
</div>
</div>
);
}

function Personal({get,set,notify}){
const pd=get(“personal”,{});
const upd=(k,v)=>set(“personal”,{…pd,[k]:v});
const F=({label,k,half})=>(<div style={{flex:half?“0 0 calc(50% - 6px)”:“0 0 100%”,marginBottom:10}}><label style={LB}>{label}</label><input value={pd[k]||””} onChange={e=>upd(k,e.target.value)} style={FI}/></div>);
return(
<div style={{padding:“0 0 20px”}}>
<PH title="Hoja de Datos Personales" sub="Personal Data Sheet"/>
<div style={{padding:“0 16px”}}>
<div style={{width:60,height:60,borderRadius:“50%”,background:AL,border:“2px solid “+AC,margin:“0 auto 14px”,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:22,color:AC}}>👤</div>
{[[“NOMBRE”,[[“Nombre completo”,“nombre”,false],[“Dirección”,“direccion”,false],[“Tel.”,“tel”,true],[“Cel.”,“cel”,true],[“E-mail”,“email”,false],[“Oficina”,“oficina”,false],[“Tel. oficina”,“tel_of”,true],[“Cel. oficina”,“cel_of”,true],[“WhatsApp”,“wa”,true],[“Instagram”,“ig”,true],[“TikTok”,“tiktok”,true],[“Facebook”,“fb”,true]]],
[“DOCUMENTOS”,[[“No. Seguridad Social”,“nss”,false],[“INE”,“ine”,true],[“CURP”,“curp”,true],[“Pasaporte”,“pasaporte”,true],[“Vigencia”,“vig_pas”,true],[“Licencia”,“licencia”,true],[“Vigencia lic.”,“vig_lic”,true],[“Aseguradora”,“aseg”,true],[“No. Póliza”,“poliza”,true],[“Vehículo”,“vehiculo”,true],[“Placas”,“placas”,true]]],
[“🚑 EMERGENCIA”,[[“Nombre contacto”,“emerg_nombre”,false],[“Tel.”,“emerg_tel”,true],[“Cel.”,“emerg_cel”,true],[“Clínica”,“clinica”,false],[“Tel. clínica”,“tel_clinica”,true],[“Cel.”,“cel_clinica”,true],[“Médico”,“medico”,false],[“Tel.”,“tel_medico”,true],[“Cel.”,“cel_medico”,true],[“Tipo de Sangre”,“sangre”,true],[“Enfermedades”,“enf”,false],[“Alergias”,“alergias”,false]]]
].map(([title,fields])=>(
<div key={title} style={{marginBottom:20}}>
<div style={{fontSize:10,fontWeight:“bold”,letterSpacing:3,textTransform:“uppercase”,color:AC,paddingBottom:6,borderBottom:“1px solid “+BD,marginBottom:12}}>{title}</div>
<div style={{display:“flex”,flexWrap:“wrap”,gap:12}}>{fields.map(([l,k,h])=><F key={k} label={l} k={k} half={h}/>)}</div>
</div>
))}
<div style={{display:“flex”,alignItems:“center”,gap:16,marginTop:4,marginBottom:16}}>
<span style={{fontSize:12,color:MU}}>Donador de Órganos:</span>
{[“Sí”,“No”].map(v=><label key={v} style={{display:“flex”,alignItems:“center”,gap:5,cursor:“pointer”,fontSize:13}}><input type=“radio” name=“donador” checked={(pd.donador||””)===v} onChange={()=>upd(“donador”,v)} style={{accentColor:AC}}/>{v}</label>)}
</div>
<div style={{textAlign:“center”}}><button onClick={()=>notify(“Datos guardados ✓”)} style={BP}>Guardar</button></div>
</div>
</div>
);
}

function Directorio({get,set,notify}){
const [search,setSearch]=useState(””);
const [selI,setSelI]=useState(null);
const [adding,setAdding]=useState(false);
const [newC,setNewC]=useState({nombre:””,tel:””,cel:””,email:””,wa:””,ig:””,fb:””,tiktok:””});
const contactos=get(“directorio”,[]);
const filtered=contactos.filter(c=>(c.nombre||””).toLowerCase().includes(search.toLowerCase()));
const addC=()=>{if(!newC.nombre.trim()){notify(“El nombre es requerido”);return;}set(“directorio”,[…contactos,{…newC,id:Date.now()}]);setAdding(false);setNewC({nombre:””,tel:””,cel:””,email:””,wa:””,ig:””,fb:””,tiktok:””});notify(“Contacto agregado ✓”);};
const delC=id=>{set(“directorio”,contactos.filter(c=>c.id!==id));setSelI(null);notify(“Eliminado”);};
return(
<div style={{padding:“0 0 20px”}}>
<PH title="Directorio" sub="Address Book"/>
<div style={{padding:“0 14px”}}>
<div style={{display:“flex”,gap:8,marginBottom:12}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder=“🔍  Buscar…” style={{…FI,flex:1,border:“1px solid “+BD,borderRadius:10,padding:“8px 12px”}}/><button onClick={()=>{setAdding(true);setSelI(null);}} style={BP}>+ Agregar</button></div>
{adding&&<div style={{background:”#fff”,borderRadius:16,border:“1px solid “+AC,padding:16,marginBottom:12}}>
<div style={{fontSize:11,letterSpacing:2,textTransform:“uppercase”,color:AC,marginBottom:12}}>Nuevo Contacto</div>
{[[“Nombre”,“nombre”],[“Tel.”,“tel”],[“Cel.”,“cel”],[“E-mail”,“email”],[“WhatsApp”,“wa”],[“Instagram”,“ig”],[“Facebook”,“fb”],[“TikTok”,“tiktok”]].map(([l,k])=><div key={k} style={{marginBottom:8}}><label style={LB}>{l}</label><input value={newC[k]} onChange={e=>setNewC(p=>({…p,[k]:e.target.value}))} style={{…FI}}/></div>)}
<div style={{display:“flex”,gap:8,marginTop:12}}><button onClick={addC} style={BP}>Guardar</button><button onClick={()=>setAdding(false)} style={{…BP,background:FA}}>Cancelar</button></div>
</div>}
{filtered.length===0&&!adding&&<div style={{textAlign:“center”,padding:“40px 0”,color:FA}}><div style={{fontSize:36,marginBottom:8}}>📒</div><div style={{fontSize:13}}>Sin contactos</div></div>}
{filtered.map(c=>{const idx=contactos.indexOf(c),isSel=selI===idx;return(<div key={c.id} style={{background:”#fff”,borderRadius:14,border:“1px solid “+(isSel?AC:BD),marginBottom:8,overflow:“hidden”}}>
<div onClick={()=>setSelI(isSel?null:idx)} style={{display:“flex”,alignItems:“center”,gap:12,padding:“12px 14px”,cursor:“pointer”}}>
<div style={{width:36,height:36,borderRadius:“50%”,background:AL,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:15,color:AC,flexShrink:0,fontWeight:“bold”}}>{(c.nombre||”?”).charAt(0).toUpperCase()}</div>
<div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:“bold”,overflow:“hidden”,textOverflow:“ellipsis”,whiteSpace:“nowrap”}}>{c.nombre||“Sin nombre”}</div><div style={{fontSize:11,color:MU}}>{c.cel||c.tel||c.email||””}</div></div>
<div style={{fontSize:18,color:FA,transform:isSel?“rotate(90deg)”:“none”,transition:“transform .2s”}}>›</div>
</div>
{isSel&&<div style={{padding:“0 14px 14px”,borderTop:“1px solid “+BD}}>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:8,marginTop:10}}>
{[[“📞 Tel.”,c.tel],[“📱 Cel.”,c.cel],[“✉️ Email”,c.email],[“💬 WhatsApp”,c.wa],[“📸 Instagram”,c.ig],[“📘 Facebook”,c.fb],[“🎵 TikTok”,c.tiktok]].filter(([,v])=>v).map(([l,v])=><div key={l}><div style={{fontSize:9,color:FA,letterSpacing:1}}>{l}</div><div style={{fontSize:12}}>{v}</div></div>)}
</div>
<button onClick={()=>delC(c.id)} style={{marginTop:12,fontSize:11,color:”#c0392b”,background:“transparent”,border:“1px solid #c0392b”,borderRadius:8,padding:“5px 14px”,cursor:“pointer”}}>Eliminar</button>
</div>}
</div>);})}
</div>
</div>
);
}