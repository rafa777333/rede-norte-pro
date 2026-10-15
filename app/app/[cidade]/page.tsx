"use client";
import Link from "next/link";
export default function CidadePage({params}:{params:{cidade:string}}){
  const cidade = decodeURIComponent(params.cidade);
  return (
    <div style={{padding:40, fontFamily:"DM Sans, sans-serif"}}>
      <h1 style={{fontWeight:900, fontSize:24, color:"#0A2342"}}>Notícias de {cidade}</h1>
      <p style={{color:"#64748b", marginTop:8}}>Página filtrada por cidade. Volte para a home para ver todas.</p>
      <Link href="/" style={{display:"inline-block", marginTop:16, padding:"8px 16px", borderRadius:999, background:"#0A2342", color:"#fff", textDecoration:"none", fontSize:12, fontWeight:700}}>← VOLTAR HOME</Link>
    </div>
  )
}
