import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- CONSTANTES Y UTILIDADES ---
const DAYS_ES=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MES_ES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const FRASES=[
  {t:"Ya que no podemos cambiar la realidad, cambiemos los ojos con que vemos la realidad.",a:"Nikos Kazantzakis"},
  {t:"El éxito es la suma de pequeños esfuerzos repetidos día tras día.",a:"Robert Collier"},
  {t:"No cuentes los días, haz que los días cuenten.",a:"Muhammad Ali"}
];
const AC="#2d5a8e", BD="#d4cec5", SF="#faf7f3", MU="#9a8a7a";

// --- COMPONENTES AUXILIARES ---
const Login = ({ onLogin, savedCreds, onSaveCreds }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [isNew, setIsNew] = useState(!savedCreds);

  const handleSubmit = () => {
    if (!user.trim() || !pass.trim()) { setErr("Completa los campos"); return; }
    if (isNew) {
      onSaveCreds({ user: user.trim(), pass });
      onLogin(user.trim());
    } else {
      if (savedCreds?.user === user.trim() && savedCreds?.pass === pass) {
        onLogin(user.trim());
      } else { setErr("Datos incorrectos"); }
    }
  };

  return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:AC, padding:20, color:"#fff", fontFamily:"sans-serif"}}>
      <div style={{background:"rgba(255,255,255,0.1)", padding:30, borderRadius:20, width:"100%", maxWidth:300}}>
        <h2>{isNew ? "Crear Cuenta" : "Entrar"}</h2>
        <input placeholder="Usuario" style={{width:"100%", margin:"10px 0", padding:10}} onChange={e=>setUser(e.target.value)} />
        <input type="password" placeholder="Contraseña" style={{width:"100%", margin:"10px 0", padding:10}} onChange={e=>setPass(e.target.value)} />
        {err && <p style={{color:"#ffb3b3"}}>{err}</p>}
        <button onClick={handleSubmit} style={{width:"100%", padding:10, background:"#fff", color:AC, border:"none", borderRadius:5, fontWeight:"bold"}}>CONTINUAR</button>
        <button onClick={()=>setIsNew(!isNew)} style={{background:"none", border:"none", color:"#fff", marginTop:15, fontSize:12, textDecoration:"underline"}}>{isNew ? "¿Ya tienes cuenta?" : "¿Eres nuevo?"}</button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);
  const today = new Date();

  // 1. CARGAR DE FIREBASE
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (loggedIn && userName) {
        try {
          const docRef = doc(db, "usuarios", userName.toLowerCase());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setData(docSnap.data());
          }
        } catch (e) { console.error("Error cargando:", e); }
        setLoaded(true);
      }
    };
    loadFromFirebase();
  }, [loggedIn, userName]);

  // 2. GUARDAR EN FIREBASE (AUTO-SAVE)
  useEffect(() => {
    if (!loaded || !loggedIn) return;
    const timeout = setTimeout(async () => {
      try {
        const docRef = doc(db, "usuarios", userName.toLowerCase());
        await setDoc(docRef, data);
        console.log("Nube actualizada");
      } catch (e) { console.error("Error guardando:", e); }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [data, loaded, loggedIn, userName]);

  if (!loggedIn) {
    const savedCreds = data.__creds || null;
    return <Login onLogin={n=>{setLoggedIn(true); setUserName(n);}} savedCreds={savedCreds} onSaveCreds={c=>setData(p=>({...p, __creds:c}))} />;
  }

  // Funciones de ayuda
  const updateData = (key, value) => setData(p => ({ ...p, [key]: value }));

  return (
    <div style={{ minHeight: "100vh", background: "#fdfaf6", padding: 20, fontFamily: "serif" }}>
      <header style={{ textAlign: "center", borderBottom: "2px solid #eee", paddingBottom: 20 }}>
        <h1>📓 Mi Agenda</h1>
        <p>{DAYS_ES[today.getDay()]}, {today.getDate()} de {MES_ES[today.getMonth()]}</p>
        <button onClick={()=>setLoggedIn(false)} style={{fontSize:10}}>Cerrar Sesión</button>
      </header>

      <main style={{ marginTop: 20 }}>
        <section style={{ background: "#fff", padding: 15, borderRadius: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <h3>Frase del día</h3>
          <p style={{ fontStyle: "italic" }}>"{FRASES[0].t}"</p>
          <small>- {FRASES[0].a}</small>
        </section>

        <section style={{ marginTop: 20 }}>
          <h3>Notas Rápidas</h3>
          <textarea 
            style={{ width: "100%", height: 100, borderRadius: 10, padding: 10, border: "1px solid #ddd" }}
            value={data.notas || ""}
            onChange={(e) => updateData("notas", e.target.value)}
            placeholder="Escribe algo..."
          />
        </section>
      </main>

      <footer style={{ marginTop: 40, textAlign: "center", fontSize: 10, color: "#aaa" }}>
        Sincronizado con Firebase Firestore
      </footer>
    </div>
  );
}
