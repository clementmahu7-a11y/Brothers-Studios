(() => {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav || typeof db === 'undefined') return;

  if (!document.querySelector('link[href="./admin-admins.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './admin-admins.css';
    document.head.appendChild(link);
  }

  const escAdmin = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'openAdminManager';
  button.className = 'nav-item';
  button.textContent = 'Administrateurs';
  nav.appendChild(button);

  const backdrop = document.createElement('div');
  backdrop.id = 'adminManagerBackdrop';
  backdrop.className = 'modal-backdrop hidden';
  backdrop.innerHTML = `
    <div class="modal admin-manager-modal">
      <div class="modal-header">
        <div><h2>Administrateurs</h2><p>Invite et consulte les personnes ayant accès à tout Brothers Social Planner.</p></div>
        <button type="button" id="closeAdminManager" class="icon-btn" aria-label="Fermer">×</button>
      </div>

      <section class="admin-manager-section">
        <div class="admin-manager-title"><div><h3>Inviter un administrateur</h3><p>Le lien généré est valable 7 jours et ne fonctionne que pour l’adresse email indiquée.</p></div></div>
        <form id="adminInviteFormManager" class="admin-invite-form">
          <label class="field"><span>Adresse email</span><input id="adminInviteEmailManager" type="email" required placeholder="admin@email.fr"></label>
          <button type="submit" class="primary-btn">Générer l’invitation</button>
        </form>
        <div id="adminInviteResult" class="admin-invite-result hidden"></div>
      </section>

      <section class="admin-manager-section">
        <div class="admin-manager-title"><div><h3>Administrateurs actifs</h3><p>Ces comptes ont accès à tous les clients, publications et paramètres.</p></div></div>
        <div id="adminsActiveList" class="admin-list"><div class="admin-loading">Chargement…</div></div>
      </section>

      <section class="admin-manager-section">
        <div class="admin-manager-title"><div><h3>Invitations en attente</h3><p>Tu peux révoquer une invitation tant qu’elle n’a pas été utilisée.</p></div></div>
        <div id="adminsPendingList" class="admin-list"><div class="admin-loading">Chargement…</div></div>
      </section>
    </div>`;
  document.body.appendChild(backdrop);

  const activeList = document.getElementById('adminsActiveList');
  const pendingList = document.getElementById('adminsPendingList');
  const resultBox = document.getElementById('adminInviteResult');
  const form = document.getElementById('adminInviteFormManager');
  const emailInput = document.getElementById('adminInviteEmailManager');

  async function copyText(text, copyButton) {
    try {
      await navigator.clipboard.writeText(text);
      const original = copyButton.textContent;
      copyButton.textContent = 'Copié ✓';
      setTimeout(() => copyButton.textContent = original, 1500);
    } catch {
      const input = resultBox.querySelector('input');
      input?.select();
      document.execCommand('copy');
    }
  }

  function renderAdmins(admins) {
    activeList.innerHTML = admins?.length ? admins.map((admin) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <strong>${escAdmin(admin.email || 'Compte administrateur')}</strong>
          <span>Administrateur depuis le ${new Date(admin.created_at).toLocaleDateString('fr-FR')}</span>
          ${admin.current ? '<span class="admin-badge">Votre compte</span>' : ''}
        </div>
      </div>`).join('') : '<div class="admin-empty">Aucun administrateur.</div>';
  }

  function renderInvites(invites) {
    pendingList.innerHTML = invites?.length ? invites.map((invite) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <strong>${escAdmin(invite.email)}</strong>
          <span>Expire le ${new Date(invite.expires_at).toLocaleString('fr-FR')}</span>
        </div>
        <button type="button" class="danger-link admin-revoke" data-admin-invite-id="${invite.id}">Révoquer</button>
      </div>`).join('') : '<div class="admin-empty">Aucune invitation en attente.</div>';

    pendingList.querySelectorAll('[data-admin-invite-id]').forEach((revokeButton) => {
      revokeButton.addEventListener('click', async () => {
        if (!confirm('Révoquer cette invitation administrateur ?')) return;
        revokeButton.disabled = true;
        const { data, error } = await db.functions.invoke('admin-invite-revoke', { body: { invite_id: revokeButton.dataset.adminInviteId } });
        if (error || !data?.ok) {
          revokeButton.disabled = false;
          if (typeof toast === 'function') toast('Impossible de révoquer l’invitation');
          return;
        }
        if (typeof toast === 'function') toast('Invitation administrateur révoquée');
        await loadAdmins();
      });
    });
  }

  async function loadAdmins() {
    activeList.innerHTML = '<div class="admin-loading">Chargement…</div>';
    pendingList.innerHTML = '<div class="admin-loading">Chargement…</div>';
    const { data, error } = await db.functions.invoke('admin-list', { body: {} });
    if (error || !data?.ok) {
      activeList.innerHTML = '<div class="admin-empty">Impossible de charger les administrateurs.</div>';
      pendingList.innerHTML = '';
      return;
    }
    renderAdmins(data.admins || []);
    renderInvites(data.invites || []);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Création…';
    resultBox.classList.add('hidden');

    const { data, error } = await db.functions.invoke('admin-invite-create', { body: { email } });
    submit.disabled = false;
    submit.textContent = 'Générer l’invitation';

    if (error || !data?.ok) {
      let message = 'Impossible de créer cette invitation.';
      try {
        const payload = await error?.context?.json?.();
        if (payload?.error === 'already_admin') message = 'Cette adresse possède déjà un compte administrateur.';
        if (payload?.error === 'account_already_exists') message = 'Cette adresse possède déjà un compte dans l’application.';
      } catch {}
      if (typeof toast === 'function') toast(message);
      return;
    }

    resultBox.innerHTML = `
      <strong>Lien d’invitation pour ${escAdmin(data.email)}</strong>
      <div class="admin-invite-link-row">
        <input type="text" readonly value="${escAdmin(data.invite_url)}">
        <button type="button" class="secondary-btn" id="copyAdminInvite">Copier le lien</button>
      </div>`;
    resultBox.classList.remove('hidden');
    resultBox.querySelector('#copyAdminInvite').onclick = (event) => copyText(data.invite_url, event.currentTarget);
    emailInput.value = '';
    if (typeof toast === 'function') toast('Invitation administrateur créée');
    await loadAdmins();
  });

  button.addEventListener('click', async () => {
    backdrop.classList.remove('hidden');
    resultBox.classList.add('hidden');
    await loadAdmins();
  });
  document.getElementById('closeAdminManager').onclick = () => backdrop.classList.add('hidden');
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) backdrop.classList.add('hidden');
  });
})();
