/**
 * Brothers Studios — POST /api/contact (Vercel Function)
 * Required env: RESEND_API_KEY, CONTACT_FROM_EMAIL (verified sender).
 * Optional: CONTACT_TO_EMAIL (defaults to published business inbox).
 * Never log message contents or credentials.
 */
const hits=new Map();
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Méthode non autorisée.'});}
  const origin=req.headers.origin||'';
  const host=req.headers.host||'';
  if(origin){try{if(new URL(origin).host!==host)return res.status(403).json({ok:false,error:'Origine non autorisée.'});}catch{return res.status(403).json({ok:false,error:'Origine incorrecte.'});}}
  if(Number(req.headers['content-length']||0)>12000)return res.status(413).json({ok:false,error:'Message trop long.'});
  const ip=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||'anon').split(',')[0].trim();
  const now=Date.now();const windowStart=now-15*60*1000;
  const prior=(hits.get(ip)||[]).filter(t=>t>windowStart);
  if(prior.length>=5)return res.status(429).json({ok:false,error:'Trop de demandes. Réessayez plus tard.'});
  prior.push(now);hits.set(ip,prior);
  if(hits.size>2500)hits.clear(); // best-effort, not cross-instance; add managed limiter before scaling.
  let d=req.body;
  if(typeof d==='string'){try{d=JSON.parse(d);}catch{d=null;}}
  if(!d||typeof d!=='object'||Array.isArray(d))return res.status(400).json({ok:false,error:'Demande invalide.'});
  if(d.website)return res.status(200).json({ok:true}); // honeypot
  const clean=(key,max=400)=>own(d,key)&&typeof d[key]==='string'?d[key].trim().slice(0,max):'';
  const name=clean('name',120),company=clean('company',160),email=clean('email',190);
  const phone=clean('phone',70),service=clean('service',100),message=clean('message',4000);
  if(!name||!email||!service||message.length<15)return res.status(400).json({ok:false,error:'Complétez les champs obligatoires (message de 15 caractères minimum).'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email))return res.status(400).json({ok:false,error:'Adresse e-mail invalide.'});
  if(!process.env.RESEND_API_KEY||!process.env.CONTACT_FROM_EMAIL)return res.status(503).json({ok:false,error:'Envoi indisponible actuellement. Utilisez notre adresse e-mail directe.'});
  const text=['Nouvelle demande de devis — Brothers Studios','','Nom : '+name,'Structure : '+(company||'Non précisée'),'E-mail : '+email,'Téléphone : '+(phone||'Non précisé'),'Prestation : '+service,'','Projet :',message].join('\n');
  try{
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.CONTACT_FROM_EMAIL,to:[process.env.CONTACT_TO_EMAIL||'brothersstudios9@gmail.com'],reply_to:email,subject:'Demande de devis — '+service.replace(/[\r\n]/g,' '),text})});
    if(!response.ok)return res.status(502).json({ok:false,error:"Le service d'envoi n'a pas confirmé la transmission. Réessayez par e-mail."});
    return res.status(200).json({ok:true});
  }catch{return res.status(502).json({ok:false,error:"Service momentanément indisponible. Écrivez-nous directement par e-mail."});}
};