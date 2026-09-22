const SUPABASE_URL='https://hjmbajbhhglqzqetptys.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_ePthilRsYOzeHYbqrpZ7cg_iDoke9jk';
const inviteDb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const token=new URL(location.href).searchParams.get('invite')||'';
const state=document.getElementById('inviteState');
const form=document.getElementById('adminInviteForm');
const emailInput=document.getElementById('adminInviteEmail');
const passwordInput=document.getElementById('adminInvitePassword');
const confirmInput=document.getElementById('adminInvitePasswordConfirm');
const message=document.getElementById('adminInviteMessage');
const submit=document.getElementById('adminInviteSubmit');

function showMessage(text,error=false){message.textContent=text;message.classList.toggle('hidden',!text);message.classList.toggle('error',error)}
function setState(text,type=''){state.textContent=text;state.className=`state-badge ${type}`.trim()}

async function loadInvite(){
  if(!token){setState('Invitation invalide','error');showMessage('Ce lien d’invitation est incomplet.',true);return}
  try{
    const {data,error}=await inviteDb.functions.invoke('admin-invite-info',{body:{token}});
    if(error||!data?.ok){
      let text='Cette invitation est invalide ou a expiré.';
      try{const payload=await error?.context?.json?.();if(payload?.error==='invite_already_used')text='Cette invitation a déjà été utilisée.';if(payload?.error==='invite_expired')text='Cette invitation a expiré.';}catch{}
      setState('Invitation indisponible','error');showMessage(text,true);return;
    }
    emailInput.value=data.email;
    form.classList.remove('hidden');
    setState('Invitation administrateur valide','success');
  }catch(error){console.error(error);setState('Erreur de vérification','error');showMessage('Impossible de vérifier cette invitation pour le moment.',true)}
}

form.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const password=passwordInput.value;
  if(password.length<6)return showMessage('Le mot de passe doit contenir au moins 6 caractères.',true);
  if(password!==confirmInput.value)return showMessage('Les deux mots de passe ne correspondent pas.',true);
  submit.disabled=true;submit.textContent='Création…';showMessage('Création du compte administrateur…');
  try{
    const {data,error}=await inviteDb.auth.signUp({
      email:emailInput.value.trim(),
      password,
      options:{
        data:{bsp_admin_invite:token},
        emailRedirectTo:`${location.origin}/`
      }
    });
    if(error){
      const msg=error.message?.includes('Database error')?'Invitation invalide, expirée ou déjà utilisée.':error.message;
      showMessage(msg||'Impossible de créer le compte.',true);return;
    }
    setState('Compte administrateur créé','success');
    if(data?.session){showMessage('Compte créé. Redirection vers Brothers Social Planner…');setTimeout(()=>location.replace('./'),900)}
    else{form.classList.add('hidden');showMessage('Compte créé. Confirmez maintenant votre adresse email, puis connectez-vous à Brothers Social Planner.')}
  }catch(error){console.error(error);showMessage('Impossible de créer le compte pour le moment.',true)}finally{submit.disabled=false;submit.textContent='Créer mon compte administrateur'}
});

loadInvite();
