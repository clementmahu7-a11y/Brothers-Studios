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
      clearStoredAuth();
    }

    clearStoredAuth();
    window.location.replace(redirectPath);
  }

  const adminButton = document.getElementById('logoutBtn');
  if (adminButton && typeof db !== 'undefined') {
    adminButton.onclick = (event) => {
      event.preventDefault();
      logout(db, './', adminButton);
    };
  }

  const clientButton = document.getElementById('clientLogout');
  if (clientButton && typeof clientDb !== 'undefined') {
    clientButton.onclick = (event) => {
      event.preventDefault();
      logout(clientDb, './client.html', clientButton);
    };
  }

  // L'interface administrateur dispose désormais de deux vues d'authentification distinctes.
  if (document.getElementById('authScreen')) {
    if (!document.querySelector('link[href="./auth-ui.css"]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = './auth-ui.css';
      document.head.appendChild(stylesheet);
    }

    if (!document.querySelector('script[src="./auth-ui.js"]')) {
      const script = document.createElement('script');
      script.src = './auth-ui.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }
})();
