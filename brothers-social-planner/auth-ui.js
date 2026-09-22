(() => {
  const authCard = document.querySelector('#authScreen .auth-card');
  const loginForm = document.getElementById('authForm');
  const signUpTrigger = document.getElementById('signUpBtn');
  const title = authCard?.querySelector('h1');
  const subtitle = authCard?.querySelector('.auth-subtitle');
  const authMessage = document.getElementById('authMessage');

  if (!authCard || !loginForm || !signUpTrigger || !title || !subtitle) return;

  const originalTitle = title.textContent;
  const originalSubtitle = subtitle.textContent;

  const signupForm = document.createElement('form');
  signupForm.id = 'signupForm';
  signupForm.className = 'auth-form auth-signup-form hidden';
  signupForm.innerHTML = `
    <label class="field">
      <span>Email</span>
      <input id="signupEmail" type="email" autocomplete="email" required placeholder="ton@email.fr">
    </label>
    <label class="field">
      <span>Mot de passe</span>
      <input id="signupPassword" type="password" autocomplete="new-password" required minlength="6" placeholder="6 caractères minimum">
    </label>
    <label class="field">
      <span>Confirmer le mot de passe</span>
      <input id="signupPasswordConfirm" type="password" autocomplete="new-password" required minlength="6" placeholder="Retape ton mot de passe">
    </label>
    <div class="auth-actions signup-actions">
      <button type="submit" class="primary-btn">Créer mon compte</button>
    </div>
    <button type="button" id="backToLogin" class="auth-switch-link">← J’ai déjà un compte — Se connecter</button>
  `;
  loginForm.insertAdjacentElement('afterend', signupForm);

  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
  const backToLogin = document.getElementById('backToLogin');

  function clearMessage() {
    if (!authMessage) return;
    authMessage.textContent = '';
    authMessage.classList.add('hidden');
    authMessage.classList.remove('error');
  }

  function setMessage(message, isError = false) {
    if (typeof authMsg === 'function') {
      authMsg(message, isError);
      return;
    }
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.classList.toggle('hidden', !message);
    authMessage.classList.toggle('error', isError);
  }

  function showSignup() {
    clearMessage();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    title.textContent = 'Créer un compte';
    subtitle.textContent = 'Crée ton accès Brothers Social Planner pour gérer tes clients et ton calendrier éditorial.';
    signupEmail.value = document.getElementById('authEmail')?.value?.trim() || '';
    signupPassword.value = '';
    signupPasswordConfirm.value = '';
    setTimeout(() => (signupEmail.value ? signupPassword : signupEmail).focus(), 0);
  }

  function showLogin() {
    clearMessage();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    title.textContent = originalTitle;
    subtitle.textContent = originalSubtitle;
    const authEmail = document.getElementById('authEmail');
    if (authEmail && signupEmail.value) authEmail.value = signupEmail.value.trim();
    setTimeout(() => authEmail?.focus(), 0);
  }

  // Remplace le comportement historique qui inscrivait immédiatement depuis l'écran de connexion.
  signUpTrigger.onclick = showSignup;
  backToLogin.onclick = showLogin;

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmation = signupPasswordConfirm.value;

    if (!email) return setMessage('Renseigne ton adresse email.', true);
    if (password.length < 6) return setMessage('Le mot de passe doit contenir au moins 6 caractères.', true);
    if (password !== confirmation) return setMessage('Les deux mots de passe ne correspondent pas.', true);

    const submit = signupForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Création…';
    setMessage('Création du compte…');

    try {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: location.origin },
      });

      if (error) {
        setMessage(error.message, true);
        return;
      }

      if (data?.session) {
        setMessage('Compte créé. Connexion en cours…');
      } else {
        setMessage('Compte créé. Consulte ton email pour confirmer ton adresse, puis connecte-toi.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Impossible de créer le compte pour le moment.', true);
    } finally {
      submit.disabled = false;
      submit.textContent = 'Créer mon compte';
    }
  });
})();
