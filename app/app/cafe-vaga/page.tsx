"use client";
import Link from "next/link";
export default function CafeVaga(){
  return (
    <div style={{padding:40, fontFamily:"DM Sans, sans-serif"}}>
      <h1 style={{fontWeight:900, fontSize:24, color:"#0A2342"}}>Vagas</h1>
      <p style={{color:"#64748b"}}>Em breve listagem de vagas. Por enquanto use a seção Empregos na home.</p>
      <Link href="/" style={{display:"inline-block", marginTop:16, padding:"8px 16px", borderRadius:999, background:"#0A2342", color:"#fff", textDecoration:"none", fontSize:12, fontWeight:700}}>← HOME</Link>
    </div>
  )
}
