import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- CONFIGURACIÓN Y ESTILOS ---
const AC="#2d5a8e", SF="#faf7f3", BD="#d4cec5";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);

  // 1. CARGAR DE FIREBASE
  useEffect(() => {
    const loadData = async () => {
      if (loggedIn && userName) {
        try {
          const docRef = doc(db, "usuarios", userName.toLowerCase());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setData(docSnap.data());
          }
        } catch (e) { console.error("Error al cargar:", e); }
        setLoaded(true);
      }
    };
    loadData();
  }, [loggedIn, userName]);

  // 2. GUARDADO AUTOMÁTICO
  useEffect(() => {
    if (!loaded || !loggedIn) return;
    const t = setTimeout(async () => {
      try {
        const docRef = doc(db, "usuarios", userName.toLowerCase());
        await setDoc(docRef, data);
      } catch (e) { console.error("Error al guardar:", e); }
    }, 1500);
    return () => clearTimeout(t);
  }, [data, loaded, loggedIn, userName]);

  if (!loggedIn) {
    return (
      <div style={{height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:AC, color:"#fff", fontFamily:"sans-serif"}}>
        <div style={{background:"rgba(255,255,255,0.1)", padding:40, borderRadius:20, textAlign:"center"}}>
          <h2>📓 Mi Agenda Digital</h2>
          <input 
            placeholder="Usuario" 
            style={{padding:10, borderRadius:5, border:"none", width:"100%", marginBottom:10}}
            onChange={e => setUserName(e.target.value)}
          />
          <button 
            onClick={() => userName && setLoggedIn(true)}
            style={{padding:"10px 20px", background:"#fff", color:AC, border:"none", borderRadius:5, fontWeight:"bold", cursor:"pointer"}}
          >
            ENTRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:20, maxWidth:600, margin:"0 auto", fontFamily:"serif", background:SF, minHeight:"100vh"}}>
      <header style={{borderBottom:"1px solid "+BD, paddingBottom:10, marginBottom:20}}>
        <h1>Hola, {userName} 👋</h1>
        <button onClick={() => setLoggedIn(false)} style={{fontSize:10}}>Cerrar sesión</button>
      </header>

      <div style={{background:"#fff", padding:20, borderRadius:15, boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
        <h3>Notas Rápidas</h3>
        <textarea 
          style={{width:"100%", height:200, padding:15, borderRadius:10, border:"1px solid "+BD, fontSize:16}}
          value={data.notas || ""}
          onChange={(e) => setData({...data, notas: e.target.value})}
          placeholder="Escribe aquí tus pendientes..."
        />
        <p style={{fontSize:10, color:"#aaa", marginTop:10}}>✓ Los cambios se guardan automáticamente en la nube.</p>
      </div>
    </div>
  );
}
