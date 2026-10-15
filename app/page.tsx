"use client";
export default function Page(){
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f6f1",fontFamily:"sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <h1 style={{fontSize:32,fontWeight:900,color:"#0A2342"}}>REDE NORTE</h1>
        <p style={{color:"#64748b",marginTop:8}}>Site no ar - build OK</p>
        <a href="/admin" style={{display:"inline-block",marginTop:16,background:"#0A2342",color:"white",padding:"10px 16px",borderRadius:8,textDecoration:"none",fontWeight:700}}>Ir para /admin</a>
      </div>
    </div>
  )
}
