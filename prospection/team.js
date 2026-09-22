import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const teamDb=createClient('https://hjmbajbhhglqzqetptys.supabase.co','sb_publishable_ePthilRsYOzeHYbqrpZ7cg_iDoke9jk',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=(v,time=false)=>{if(!v)return '—';return new Intl.DateTimeFormat('fr-FR',time?{dateStyle:'short',timeStyle:'short'}:{dateStyle:'short'}).format(new Date(v))};

function notify(text,error=false){
  let wrap=document.getElementById('toastWrap');
  if(!wrap){wrap=document.createElement('div');wrap.id='toastWrap';wrap.className='toast-wrap';document.body.appendChild(wrap)}
  const el=document.createElement('div');el.className='toast'+(error?' error-toast':'');el.textContent=text;wrap.appendChild(el);setTimeout(()=>el.remove(),3200);
}

function waitForNav(){
  const nav=document.querySelector('.nav');
  if(nav)return Promise.resolve(nav);
  return new Promise(resolve=>{const obs=new MutationObserver(()=>{const n=document.querySelector('.nav');if(n){obs.disconnect();resolve(n)}});obs.observe(document.documentElement,{childList:true,subtree:true})});
}

const nav=await waitForNav();
if(!document.getElementById('teamBtn')){
  const button=document.createElement('button');button.type='button';button.id='teamBtn';button.className='nav-btn team-nav';button.innerHTML='<span class="nav-icon">♙</span>Équipe';nav.appendChild(button);

  const modal=document.createElement('div');modal.id='teamModal';modal.className='modal-backdrop hidden';modal.innerHTML=`
    <div class="modal team-modal">
      <div class="modal-head"><div><div class="modal-title">Équipe Brothers Prospection</div><div class="muted small" style="margin-top:4px">Tous les administrateurs partagent les mêmes prospects, relances et modifications.</div></div><button class="close" id="closeTeamModal" type="button">×</button></div>
      <div class="modal-body">
        <p class="team-intro">Invite un collaborateur avec son propre compte. Tout le monde travaille sur le même espace commercial et voit les mêmes données.</p>
        <section class="team-section"><h3>Inviter un administrateur</h3><p>Le lien est valable 7 jours et uniquement pour l’adresse e-mail indiquée.</p><form id="teamInviteForm" class="team-form"><input id="teamInviteEmail" class="input" type="email" required placeholder="collaborateur@email.fr"><button id="teamInviteSubmit" class="btn" type="submit">Générer l’invitation</button></form><div id="teamInviteResult" class="invite-result hidden"></div></section>
        <section class="team-section"><h3>Comptes actifs</h3><p>Ces comptes peuvent consulter et modifier toute la prospection.</p><div id="teamActiveList" class="team-list"><div class="team-empty">Chargement…</div></div></section>
        <section class="team-section" style="margin-bottom:0"><h3>Invitations en attente</h3><p>Tu peux les révoquer tant qu’elles n’ont pas été utilisées.</p><div id="teamPendingList" class="team-list"><div class="team-empty">Chargement…</div></div></section>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const active=document.getElementById('teamActiveList'),pending=document.getElementById('teamPendingList'),result=document.getElementById('teamInviteResult');
  const close=()=>modal.classList.add('hidden');
  document.getElementById('closeTeamModal').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))close()});

  function renderAdmins(admins){active.innerHTML=admins.length?admins.map(a=>`<div class="team-row"><div class="team-row-info"><strong>${esc(a.email||'Compte administrateur')}</strong><span>Administrateur depuis le ${fmt(a.created_at)}</span>${a.current?'<span class="team-badge">Votre compte</span>':''}</div></div>`).join(''):'<div class="team-empty">Aucun administrateur actif.</div>'}
  function renderInvites(invites){
    pending.innerHTML=invites.length?invites.map(i=>`<div class="team-row"><div class="team-row-info"><strong>${esc(i.email)}</strong><span>Expire le ${fmt(i.expires_at,true)}</span></div><button class="danger-link" type="button" data-revoke="${i.id}">Révoquer</button></div>`).join(''):'<div class="team-empty">Aucune invitation en attente.</div>';
    pending.querySelectorAll('[data-revoke]').forEach(btn=>btn.onclick=async()=>{if(!confirm('Révoquer cette invitation ?'))return;btn.disabled=true;const {data,error}=await teamDb.functions.invoke('admin-invite-revoke',{body:{invite_id:btn.dataset.revoke}});if(error||!data?.ok){btn.disabled=false;return notify('Impossible de révoquer l’invitation',true)}notify('Invitation révoquée');await loadTeam()});
  }
  async function loadTeam(){active.innerHTML='<div class="team-empty">Chargement…</div>';pending.innerHTML='<div class="team-empty">Chargement…</div>';const {data,error}=await teamDb.functions.invoke('admin-list',{body:{}});if(error||!data?.ok){active.innerHTML='<div class="team-empty">Impossible de charger les comptes.</div>';pending.innerHTML='';return}renderAdmins(data.admins||[]);renderInvites(data.invites||[])}

  button.onclick=async()=>{result.classList.add('hidden');modal.classList.remove('hidden');await loadTeam()};
  document.getElementById('teamInviteForm').onsubmit=async e=>{
    e.preventDefault();const email=document.getElementById('teamInviteEmail').value.trim().toLowerCase();if(!email)return;const submit=document.getElementById('teamInviteSubmit');submit.disabled=true;submit.textContent='Création…';result.classList.add('hidden');
    const {data,error}=await teamDb.functions.invoke('admin-invite-create',{body:{email,app:'prospection'}});submit.disabled=false;submit.textContent='Générer l’invitation';
    if(error||!data?.ok){let msg='Impossible de créer cette invitation.';try{const p=await error?.context?.json?.();if(p?.error==='already_admin')msg='Cette adresse possède déjà un accès administrateur.';if(p?.error==='account_already_exists')msg='Cette adresse possède déjà un compte dans l’application.'}catch{}return notify(msg,true)}
    result.innerHTML=`<strong>Lien d’invitation pour ${esc(data.email)}</strong><div class="invite-link-row"><input class="input" type="text" readonly value="${esc(data.invite_url)}"><button id="copyTeamInvite" class="btn secondary" type="button">Copier le lien</button></div>`;result.classList.remove('hidden');document.getElementById('teamInviteEmail').value='';document.getElementById('copyTeamInvite').onclick=async ev=>{try{await navigator.clipboard.writeText(data.invite_url);const b=ev.currentTarget,o=b.textContent;b.textContent='Copié ✓';setTimeout(()=>b.textContent=o,1500)}catch{result.querySelector('input')?.select();document.execCommand('copy')}};notify('Invitation créée');await loadTeam();
  };
}
