/* Brothers Studios V2 — accessible interactions and a single commercial catalog. */
(function(){
'use strict';

/* Keep links to V1 hash routes working after the V2 migration. */
if(window.location.pathname==='/' && window.location.hash){
  const destinations={
    '#sites':'/services/#sites',
    '#reseaux':'/services/#communication',
    '#image':'/services/#creation',
    '#realisations':'/realisations/',
    '#qui-sommes-nous':'/a-propos/',
    '#contact':'/contact/',
    '#mentions-legales':'/mentions-legales/',
    '#confidentialite':'/confidentialite/',
    '#cgv':'/cgv/'
  };
  const target=destinations[window.location.hash.toLowerCase()];
  if(target)window.location.replace(target);
}

const money = value => typeof value === 'number' ? new Intl.NumberFormat('fr-FR').format(value)+' €' : value;
const catalog={
  web:[
    {name:'Essentielle',price:349,unit:'une fois',hint:'Pour lancer une présence professionnelle sans superflu.',items:['Site vitrine simple et responsive','Présentation de votre activité','Coordonnées et contact faciles à trouver','Mise en ligne et bases du référencement']},
    {name:'Professionnelle',price:599,unit:'une fois',featured:true,hint:'Pour présenter clairement plusieurs prestations.',items:['Site vitrine avec rubriques détaillées','Design adapté à votre activité','Mise en valeur de vos contenus et photos','Formulaire de contact selon le périmètre convenu']},
    {name:'Premium',price:'Dès 990 €',unit:'sur devis',hint:'Pour un site plus complet et des besoins spécifiques.',items:['Architecture et pages adaptées au projet','Contenus et sections plus avancés','Personnalisation sur devis','Évolutions définies après étude du besoin']}
  ],
  social:[
    {name:'Présence',price:190,unit:'/ mois',hint:'Pour communiquer régulièrement sans multiplier les contenus.',items:['Calendrier de contenus adapté à votre activité','Conception de publications','Rédaction et programmation','Validation avant publication']},
    {name:'Régulière',price:360,unit:'/ mois',featured:true,hint:'Pour développer une présence plus structurée.',items:['Plan éditorial mensuel','Création de contenus réguliers','Programmation et coordination','Point de suivi périodique']},
    {name:'Complète',price:590,unit:'/ mois',hint:'Pour une communication plus approfondie.',items:['Stratégie éditoriale renforcée','Volume de contenus défini au devis','Coordination des formats adaptés','Suivi et ajustements convenus']}
  ],
  creation:[
    {name:'Photographie',price:'Dès 140 €',unit:'séance',hint:'Des images authentiques pour montrer votre activité.',items:['Préparation du besoin','Prises de vues adaptées au projet','Sélection et traitement selon devis']},
    {name:'Identité visuelle',price:'Dès 150 €',unit:'logo',hint:'Une identité lisible, cohérente et mémorable.',items:['Échange sur votre univers','Proposition graphique selon devis','Livrables définis en amont']},
    {name:'Vidéo & supports',price:'Sur devis',unit:'selon projet',hint:'Valorisez votre marque avec les bons formats.',items:['Vidéo, tournage ou montage','Supports pour le web et les réseaux','Périmètre et délais adaptés']}
  ],
  convocations:{monthly:20,setup:150,launchSetup:75,launchClubs:3}
};
window.BROTHERS_CATALOG=Object.freeze(catalog);
function renderCard(item){
  const p=money(item.price);
  return '<article class="card price-card'+(item.featured?' recommended':'')+'">'+
  (item.featured?'<span class="pill">La formule à découvrir</span>':'<span class="pill">Offre Brothers Studios</span>')+
  '<h3>'+item.name+'</h3><div class="price">'+p+' <small>'+item.unit+'</small></div><p>'+item.hint+'</p>'+
  '<ul class="checklist">'+item.items.map(x=>'<li>'+x+'</li>').join('')+'</ul>'+
  '<a class="button '+(item.featured?'primary':'secondary')+'" href="/contact/?service='+encodeURIComponent(item.name)+'">Parler de cette offre ↗</a></article>';
}
Object.keys(catalog).filter(k=>Array.isArray(catalog[k])).forEach(group=>{
  const target=document.querySelector('[data-pricing="'+group+'"]');
  if(target)target.innerHTML=catalog[group].map(renderCard).join('');
});
document.querySelectorAll('[data-conv-price]').forEach(el=>{
  const prop=el.getAttribute('data-conv-price'); if(prop in catalog.convocations)el.textContent=money(catalog.convocations[prop]);
});
const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('#main-nav');
if(toggle&&nav){
  function setNav(open){nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');}
  toggle.addEventListener('click',()=>setNav(toggle.getAttribute('aria-expanded')!=='true'));
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setNav(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setNav(false)});
}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const form=document.getElementById('contact-form');
if(form){
 const status=document.getElementById('form-status'),button=form.querySelector('button[type="submit"]');
 const service=new URLSearchParams(window.location.search).get('service');
 if(service){const sel=form.elements.service;if(sel){if([...sel.options].some(o=>o.value===service))sel.value=service;}}
 form.addEventListener('submit',async e=>{
   e.preventDefault();if(!form.reportValidity())return;
   const d=Object.fromEntries(new FormData(form).entries());
   button.disabled=true;status.textContent='Envoi de votre message…';status.dataset.kind='loading';
   try{
     const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
     const json=await response.json().catch(()=>({}));
     if(!response.ok||!json.ok)throw new Error(json.error||"L'envoi n'a pas abouti.");
     status.textContent='Votre demande a bien été envoyée. Nous vous répondrons directement par e-mail.';status.dataset.kind='success';form.reset();
   }catch(err){
     status.textContent='Message non envoyé : '+err.message+' Vous pouvez nous écrire à brothersstudios9@gmail.com.';status.dataset.kind='error';
   }finally{button.disabled=false;}
 });
}
})();