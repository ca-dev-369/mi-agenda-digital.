import { useState, useEffect, useRef } from "react";
import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DAYS_ES=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DAYS_EN=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MES_ES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MES_EN=["January","February","March","April","May","June","July","August","September","October","November","December"];
const HORAS=[8,9,10,11,12,13,14,15,16,17,18,19,20,21];
const MOODS=[{e:"😄",l:"Excelente"},{e:"🙂",l:"Bien"},{e:"😐",l:"Regular"},{e:"😔",l:"Difícil"},{e:"😤",l:"Estresado"}];
const DEF_HABITS=["💧 Agua","🏃 Ejercicio","📖 Lectura","🧘 Meditar","🥗 Comer sano","😴 Dormir bien"];
const FRASES=[
{t:"Ya que no podemos cambiar la realidad, cambiemos los ojos con que vemos la realidad.",a:"Nikos Kazantzakis"},
{t:"El éxito es la suma de pequeños esfuerzos repetidos día tras día.",a:"Robert Collier"},
{t:"No cuentes los días, haz que los días cuenten.",a:"Muhammad Ali"},
{t:"La disciplina es el puente entre metas y logros.",a:"Jim Rohn"},
{t:"Cada día es una nueva oportunidad para cambiar tu vida.",a:"Anónimo"},
];
const AC="#2d5a8e",AL="#dde8f5",BD="#d4cec5",SF="#faf7f3",MU="#9a8a7a",FA="#ccc",TX="#1e1e1e";

const fk=d=>d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate();
const fwk=ws=>"wk-"+fk(ws);
const isHoy=(d,t)=>fk(d)===fk(t);
function wkStart(date){const d=new Date(date),day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));d.setHours(0,0,0,0);return d;}
function wkDays(ws){return Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d;});}
function doy(date){return Math.floor((date-new Date(date.getFullYear(),0,0))/86400000);}
function dleft(date){return Math.floor((new Date(date.getFullYear(),11,31)-date)/86400000)+1;}
function wnum(date){const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));const dn=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-dn);const ys=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-ys)/86400000)+1)/7);}
function mgrid(y,m){const f=new Date(y,m,1),l=new Date(y,m+1,0),sd=f.getDay()===0?6:f.getDay()-1,arr=[];for(let i=0;i<sd;i++)arr.push(null);for(let d=1;d<=l.getDate();d++)arr.push(d);return arr;}

const FI={border:"none",borderBottom:"1px solid "+BD,padding:"7px 2px",fontSize:13,fontFamily:"inherit",color:TX,background:"transparent",width:"100%"};
const BP={background:AC,color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",cursor:"pointer",fontSize:13,fontWeight:"bold"};
const BI={background:SF,border:"1px solid "+BD,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:17,color:"#5a4a3a"};
const LB={fontSize:9,letterSpacing:2,textTransform:"uppercase",color:MU,display:"block",marginBottom:3};

function PH({title,sub}){return(<div style={{padding:"14px 18px 10px",background:SF,borderBottom:"2px solid "+BD,marginBottom:12}}><div style={{fontSize:15,fontWeight:"bold"}}>{title}</div><div style={{fontSize:10,fontStyle:"italic",color:MU}}>{sub}</div></div>);}

function Login({onLogin,savedCreds,onSaveCreds}){
const [user,setUser]=useState("");
const [pass,setPass]=useState("");
const [err,setErr]=useState("");
const [showPass,setShowPass]=useState(false);
const [isNew,setIsNew]=useState(!savedCreds);
const [confirmPass,setConfirmPass]=useState("");

const handleSubmit=()=>{
if(!user.trim()||!pass.trim()){setErr("Completa todos los campos");return;}
if(isNew){
if(pass!==confirmPass){setErr("Las contraseñas no coinciden");return;}
if(pass.length<4){setErr("La contraseña debe tener al menos 4 caracteres");return;}
if(savedCreds){setErr("Ya existe una cuenta. Inicia sesión.");setIsNew(false);return;}
onSaveCreds({user:user.trim(),pass});
onLogin(user.trim());
} else {
if(!savedCreds){setErr("No hay cuenta registrada. Crea una.");setIsNew(true);return;}
if(savedCreds.user===user.trim()&&savedCreds.pass===pass){onLogin(user.trim());}
else{setErr("Usuario o contraseña incorrectos");}
}
};

return(
<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,"+AC+" 0%,#1a3a5e 60%,#0e2340 100%)",padding:"32px 20px",position:"relative",overflow:"hidden"}}>
{[0,1,2,3].map(i=><div key={i} style={{position:"absolute",bottom:-20+i*35,left:-50,right:-50,height:90,border:"1px solid rgba(255,255,255,"+(0.03+i*0.02)+")",borderRadius:"50%",transform:"scaleX("+(1.2+i*.15)+")"}}/>)}
<div style={{position:"relative",zIndex:1,width:"100%",maxWidth:340}}>
<div style={{textAlign:"center",marginBottom:28}}>
<div style={{fontSize:52,marginBottom:10}}>📓</div>
<div style={{fontSize:9,letterSpacing:6,textTransform:"uppercase",color:"rgba(255,255,255,.5)",marginBottom:6}}>Agenda Digital</div>
<div style={{fontSize:22,fontWeight:"bold",color:"#fff"}}>{isNew?"Crear cuenta":"Bienvenida de vuelta"}</div>
<div style={{fontSize:12,color:"rgba(255,255,255,.45)",marginTop:4}}>{isNew?"Configura tu acceso personal":"Ingresa tus credenciales"}</div>
</div>
<div style={{background:"rgba(255,255,255,.1)",backdropFilter:"blur(12px)",borderRadius:24,padding:"28px 24px",border:"1px solid rgba(255,255,255,.15)"}}>
<div style={{marginBottom:14}}>
<label style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,.55)",display:"block",marginBottom:6}}>Usuario</label>
<input value={user} onChange={e=>{setUser(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Tu nombre de usuario" style={{width:"100%",background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#fff",fontFamily:"inherit"}}/>
</div>
<div style={{marginBottom:isNew?14:20}}>
<label style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,.55)",display:"block",marginBottom:6}}>Contraseña</label>
<div style={{position:"relative"}}>
<input value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} type={showPass?"text":"password"} placeholder="Tu contraseña" style={{width:"100%",background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:12,padding:"12px 42px 12px 14px",fontSize:14,color:"#fff",fontFamily:"inherit"}}/>
<button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:16}}>{showPass?"🙈":"👁"}</button>
</div>
</div>
{isNew&&<div style={{marginBottom:20}}>
<label style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,.55)",display:"block",marginBottom:6}}>Confirmar contraseña</label>
<input value={confirmPass} onChange={e=>{setConfirmPass(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} type={showPass?"text":"password"} placeholder="Repite tu contraseña" style={{width:"100%",background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#fff",fontFamily:"inherit"}}/>
</div>}
{err&&<div style={{background:"rgba(231,76,60,.25)",border:"1px solid rgba(231,76,60,.4)",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#ffb3b3",textAlign:"center"}}>{err}</div>}
<button onClick={handleSubmit} style={{width:"100%",background:"#fff",color:AC,border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:"bold",cursor:"pointer",letterSpacing:.5,transition:"all .2s"}}>
{isNew?"Crear mi agenda":"Entrar"}
</button>
<div style={{textAlign:"center",marginTop:16}}>
<button onClick={()=>{setIsNew(v=>!v);setErr("");setConfirmPass("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,.45)",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>
{isNew?"¿Ya tienes cuenta? Inicia sesión":"¿Primera vez? Crea tu cuenta"}
</button>
</div>
</div>
<div style={{textAlign:"center",marginTop:20,fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:1}}>TU INFORMACIÓN ES PRIVADA Y SOLO TUYA</div>
</div>
<style>{`input::placeholder{color:rgba(255,255,255,.35);}input:focus{outline:none;border-color:rgba(255,255,255,.5)!important;}`}</style>
</div>
);
}

export default function App(){
const today=new Date();
const [sec,setSec]=useState("portada");
const [data,setData]=useState({});
const [loaded,setLoaded]=useState(false);
const [toast,setToast]=useState(null);
const [loggedIn,setLoggedIn]=useState(false);
const [userName,setUserName]=useState("");
const fr=FRASES[today.getDate()%FRASES.length];

// CARGA DE DATOS DESDE FIREBASE
useEffect(()=>{
  const loadFromCloud = async () => {
    if(loggedIn && userName){
      try {
        const docRef = doc(db, "usuarios", userName.toLowerCase());
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
          setData(docSnap.data());
        }
      } catch(e){ console.error(e); }
      setLoaded(true);
    }
  };
  loadFromCloud();
},[loggedIn, userName]);

// GUARDADO AUTOMÁTICO EN FIREBASE
useEffect(()=>{
  if(!loaded || !loggedIn) return;
  const t = setTimeout(async ()=>{
    try {
      const docRef = doc(db, "usuarios", userName.toLowerCase());
      await setDoc(docRef, data);
    } catch(e){ console.error(e); }
  }, 1500);
  return () => clearTimeout(t);
},[data, loaded, loggedIn, userName]);

const saveCreds=creds=>setData(p=>({...p,__creds:creds}));
const creds=data.__creds||null;

if(!loggedIn) return <Login onLogin={n=>{setLoggedIn(true);setUserName(n);}} savedCreds={creds} onSaveCreds={saveCreds}/>;

const get=(k,d)=>{const v=data[k];return v!==undefined?v:(d!==undefined?d:{});};
const set=(k,v)=>setData(p=>({...p,[k]:v}));
const notify=msg=>{setToast(msg);setTimeout(()=>setToast(null),2200);};

const NAV=[{id:"portada",ic:"✦",lb:"Inicio"},{id:"habitos",ic:"🔥",lb:"Hábitos"},{id:"semanal",ic:"📋",lb:"Semana"},{id:"mensual",ic:"🗓",lb:"Mes"},{id:"anual",ic:"📅",lb:"Año"},{id:"proyectos",ic:"📌",lb:"Proyectos"},{id:"mas",ic:"⋯",lb:"Más"}];

return(
<div style={{minHeight:"100vh",background:"#eee9e1",fontFamily:"'Palatino Linotype',Palatino,serif",color:TX}}>
{toast&&<div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",background:AC,color:"#fff",padding:"9px 22px",borderRadius:100,fontSize:12,zIndex:999,boxShadow:"0 4px 16px rgba(0,0,0,.25)",whiteSpace:"nowrap"}}>{toast}</div>}
<div style={{paddingBottom:68}}>
{sec==="portada"&&<Portada today={today} fr={fr} get={get} goTo={setSec} userName={userName} onLogout={()=>setLoggedIn(false)}/>}
{sec==="habitos"&&<Habitos today={today} get={get} set={set} notify={notify}/>}
{sec==="semanal"&&<Semanal today={today} get={get} set={set} notify={notify} fr={fr}/>}
{sec==="mensual"&&<Mensual today={today} get={get} set={set} notify={notify}/>}
{sec==="anual"&&<Anual today={today} get={get} set={set}/>}
{sec==="proyectos"&&<Proyectos get={get} set={set} notify={notify}/>}
{sec==="mas"&&<Mas get={get} set={set} notify={notify} goTo={setSec}/>}
{sec==="personal"&&<Personal get={get} set={set} notify={notify}/>}
{sec==="directorio"&&<Directorio get={get} set={set} notify={notify}/>}
{sec==="buscar"&&<Buscar data={data}/>}
</div>
<nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid "+BD,display:"flex",zIndex:200,boxShadow:"0 -2px 12px rgba(0,0,0,.07)"}}>
{NAV.map(n=><button key={n.id} onClick={()=>setSec(n.id)} style={{flex:1,border:"none",background:"none",cursor:"pointer",padding:"7px 2px 5px",borderTop:sec===n.id?"2px solid "+AC:"2px solid transparent"}}><div style={{fontSize:14}}>{n.ic}</div><div style={{fontSize:7,textTransform:"uppercase",color:sec===n.id?AC:FA,marginTop:1}}>{n.lb}</div></button>)}
</nav>
</div>
);
}

// ... (Aquí van todas tus funciones Portada, Habitos, Semanal, etc. que ya tienes en tu código original)
