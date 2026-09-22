(() => {
  const PROJECT_REF = 'hjmbajbhhglqzqetptys';

  function clearStoredAuth() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        const keys = [];
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i);
          if (key && key.includes(PROJECT_REF) && key.includes('auth-token')) keys.push(key);
        }
        keys.forEach((key) => storage.removeItem(key));
      } catch (error) {
        console.warn('Unable to clear stored auth state', error);
      }
    }
  }

  async function logout(client, redirectPath, button) {
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch (error) {
      console.error('Logout error', error);
    }
    clearStoredAuth();
    window.location.replace(redirectPath);
  }

  function addAccessNote(actions, text, id) {
    if (!actions || document.getElementById(id)) return;
    const note = document.createElement('p');
    note.id = id;
    note.style.margin = '12px 0 0';
    note.style.fontSize = '13px';
    note.style.lineHeight = '1.45';
    note.style.color = '#73758a';
    note.textContent = text;
    actions.insertAdjacentElement('afterend', note);
  }

  async function getRole(client, userId) {
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Role lookup error', error);
      return null;
    }
    return data?.role || null;
  }

  async function guardAdminArea() {
    if (typeof db === 'undefined') return;
    const { data } = await db.auth.getUser();
    const currentUser = data?.user;
    if (!currentUser) return;
    const role = await getRole(db, currentUser.id);
    if (role === 'client') return window.location.replace('./client.html');
    if (role !== 'admin') await logout(db, './', null);
  }

  async function guardClientArea() {
    if (typeof clientDb === 'undefined') return;
    const { data } = await clientDb.auth.getUser();
    const currentUser = data?.user;
    if (!currentUser) return;
    const role = await getRole(clientDb, currentUser.id);
    if (role === 'admin') return window.location.replace('./');
    if (role !== 'client') await logout(clientDb, './client.html', null);
  }

  // ADMIN: no public account creation.
  const adminSignUp = document.getElementById('signUpBtn');
  if (adminSignUp) {
    adminSignUp.classList.add('hidden');
    adminSignUp.onclick = (event) => {
      event.preventDefault();
      if (typeof authMsg === 'function') authMsg('Les comptes administrateurs sont créés uniquement sur invitation.', true);
    };
    addAccessNote(
      adminSignUp.closest('.auth-actions'),
      'Accès administrateur réservé à Brothers Studios. Aucun compte administrateur ne peut être créé librement.',
      'adminAccessNote'
    );
  }

  // CLIENT: account creation appears only from a real invitation link.
  const clientSignUp = document.getElementById('clientSignUp');
  if (clientSignUp) {
    const hasInvite = Boolean(new URL(window.location.href).searchParams.get('invite'));
    clientSignUp.classList.toggle('hidden', !hasInvite);
    if (!hasInvite) {
      addAccessNote(
        clientSignUp.closest('.auth-actions'),
        'La création d’un espace client est possible uniquement depuis le lien d’invitation envoyé par Brothers Studios.',
        'clientAccessNote'
      );
    }
  }

  const adminButton = document.getElementById('logoutBtn');
  if (adminButton && typeof db !== 'undefined') {
    adminButton.onclick = (event) => {
      event.preventDefault();
      logout(db, './', adminButton);
    };
    guardAdminArea();
    db.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) setTimeout(guardAdminArea, 0);
    });

    if (!document.querySelector('script[src="./admin-admins.js"]')) {
      const script = document.createElement('script');
      script.src = './admin-admins.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  const clientButton = document.getElementById('clientLogout');
  if (clientButton && typeof clientDb !== 'undefined') {
    clientButton.onclick = (event) => {
      event.preventDefault();
      logout(clientDb, './client.html', clientButton);
    };
    guardClientArea();
    clientDb.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) setTimeout(guardClientArea, 0);
    });
  }
})();
