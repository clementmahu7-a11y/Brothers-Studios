const SOCIAL_NETWORK_LABELS = {
  Facebook: 'Facebook',
  Instagram: 'Instagram',
  TikTok: 'TikTok',
  LinkedIn: 'LinkedIn',
};

function socialEsc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}

function socialToast(message) {
  if (typeof toast === 'function') return toast(message);
  alert(message);
}

function ensureSocialSection() {
  const manager = document.getElementById('clientManagerList');
  if (!manager || document.getElementById('socialConnectionsSection')) return;
  const section = document.createElement('section');
  section.id = 'socialConnectionsSection';
  section.className = 'social-connections-section';
  section.innerHTML = `
    <div class="social-section-head">
      <div>
        <h3>Comptes sociaux</h3>
        <p>Connecte les comptes de chaque client pour récupérer leurs statistiques.</p>
      </div>
    </div>
    <div id="socialConnectionsContent" class="social-connections-content"></div>`;
  manager.insertAdjacentElement('afterend', section);
}

async function loadSocialData() {
  const [{ data: clientRows, error: clientError }, { data: connectionRows, error: connectionError }] = await Promise.all([
    db.from('clients').select('id,name,color').order('name'),
    db.from('social_connections').select('id,client_id,provider,network,external_account_id,account_name,username,status,connected_at,updated_at').order('network'),
  ]);
  if (clientError) throw clientError;
  if (connectionError) throw connectionError;
  return { clients: clientRows || [], connections: connectionRows || [] };
}

function connectionLabel(connection) {
  const handle = connection.username ? `@${connection.username}` : connection.account_name;
  return `${SOCIAL_NETWORK_LABELS[connection.network] || connection.network} · ${handle}`;
}

async function renderSocialConnections() {
  ensureSocialSection();
  const content = document.getElementById('socialConnectionsContent');
  if (!content) return;
  content.innerHTML = '<div class="social-loading">Chargement des comptes sociaux…</div>';

  try {
    const { clients, connections } = await loadSocialData();
    if (!clients.length) {
      content.innerHTML = '<div class="social-empty">Ajoute d’abord un client.</div>';
      return;
    }

    content.innerHTML = clients.map((client) => {
      const linked = connections.filter((c) => c.client_id === client.id);
      const rows = linked.length
        ? linked.map((c) => `
          <div class="social-connection-row">
            <div class="social-connection-info">
              <span class="social-network-dot ${c.network.toLowerCase()}"></span>
              <div>
                <strong>${socialEsc(connectionLabel(c))}</strong>
                <span>${c.status === 'active' ? 'Connecté' : socialEsc(c.status)}</span>
              </div>
            </div>
            <button type="button" class="danger-link social-disconnect" data-connection-id="${c.id}">Déconnecter</button>
          </div>`).join('')
        : '<div class="social-no-account">Aucun compte social connecté.</div>';

      return `
        <article class="social-client-card">
          <div class="social-client-head">
            <div class="social-client-name">
              <span class="client-dot large" style="background:${socialEsc(client.color)}"></span>
              <strong>${socialEsc(client.name)}</strong>
            </div>
            <button type="button" class="primary-btn small-btn social-connect-meta" data-client-id="${client.id}">
              ${linked.some((c) => c.provider === 'meta') ? 'Reconnecter Meta' : 'Connecter Facebook / Instagram'}
            </button>
          </div>
          <div class="social-client-connections">${rows}</div>
        </article>`;
    }).join('');

    content.querySelectorAll('.social-connect-meta').forEach((button) => {
      button.addEventListener('click', () => startMetaOAuth(button.dataset.clientId, button));
    });

    content.querySelectorAll('.social-disconnect').forEach((button) => {
      button.addEventListener('click', () => disconnectSocialConnection(button.dataset.connectionId, button));
    });
  } catch (error) {
    console.error(error);
    content.innerHTML = '<div class="social-empty">Impossible de charger les comptes sociaux.</div>';
  }
}

async function startMetaOAuth(clientId, button) {
  button.disabled = true;
  try {
    const { data, error } = await db.functions.invoke('meta-oauth-start', {
      body: { client_id: clientId, redirect_to: location.origin },
    });
    if (error) {
      let message = 'Impossible de démarrer la connexion Meta.';
      try {
        const payload = await error.context?.json?.();
        if (payload?.error === 'meta_not_configured') {
          message = 'La connexion Meta est prête côté application, mais les identifiants META_APP_ID et META_APP_SECRET doivent encore être ajoutés dans Supabase.';
        }
      } catch {}
      socialToast(message);
      return;
    }
    if (!data?.authorize_url) {
      socialToast('URL de connexion Meta introuvable.');
      return;
    }
    location.assign(data.authorize_url);
  } catch (error) {
    console.error(error);
    socialToast('Impossible de démarrer la connexion Meta.');
  } finally {
    button.disabled = false;
  }
}

async function disconnectSocialConnection(connectionId, button) {
  if (!confirm('Déconnecter ce compte social ? Les publications et statistiques déjà enregistrées resteront dans le calendrier.')) return;
  button.disabled = true;
  try {
    const { data, error } = await db.functions.invoke('meta-oauth-disconnect', {
      body: { connection_id: connectionId },
    });
    if (error || !data?.ok) throw error || new Error('disconnect_failed');
    socialToast('Compte social déconnecté');
    await renderSocialConnections();
  } catch (error) {
    console.error(error);
    socialToast('Impossible de déconnecter ce compte.');
  } finally {
    button.disabled = false;
  }
}

function closeMetaSelectionModal() {
  document.getElementById('metaAccountBackdrop')?.remove();
}

function showMetaSelectionModal(requestId, options) {
  closeMetaSelectionModal();
  const backdrop = document.createElement('div');
  backdrop.id = 'metaAccountBackdrop';
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal meta-account-modal">
      <div class="modal-header">
        <div>
          <h2>Choisir le compte Meta</h2>
          <p>Sélectionne la Page Facebook du client. Si un compte Instagram professionnel y est lié, il peut être connecté en même temps.</p>
        </div>
        <button type="button" class="icon-btn" id="closeMetaAccountModal" aria-label="Fermer">×</button>
      </div>
      <div class="meta-account-options">
        ${options.map((option) => `
          <article class="meta-account-option">
            <div class="meta-account-copy">
              <strong>${socialEsc(option.page_name)}</strong>
              <span>Facebook · ${socialEsc(option.page_id)}</span>
              ${option.instagram ? `<span>Instagram · @${socialEsc(option.instagram.username || option.instagram.name || option.instagram.id)}</span>` : '<span>Aucun compte Instagram professionnel lié détecté</span>'}
            </div>
            <div class="meta-account-controls">
              <label class="check-option"><input type="checkbox" data-meta-facebook="${socialEsc(option.page_id)}" checked> Facebook</label>
              <label class="check-option ${option.instagram ? '' : 'disabled-option'}"><input type="checkbox" data-meta-instagram="${socialEsc(option.page_id)}" ${option.instagram ? 'checked' : 'disabled'}> Instagram</label>
              <button type="button" class="primary-btn meta-select-account" data-page-id="${socialEsc(option.page_id)}">Connecter</button>
            </div>
          </article>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  document.getElementById('closeMetaAccountModal').onclick = closeMetaSelectionModal;
  backdrop.querySelectorAll('.meta-select-account').forEach((button) => {
    button.addEventListener('click', async () => {
      const pageId = button.dataset.pageId;
      const facebook = backdrop.querySelector(`[data-meta-facebook="${CSS.escape(pageId)}"]`)?.checked ?? true;
      const instagram = backdrop.querySelector(`[data-meta-instagram="${CSS.escape(pageId)}"]`)?.checked ?? false;
      button.disabled = true;
      try {
        const { data, error } = await db.functions.invoke('meta-oauth-complete', {
          body: { request_id: requestId, page_id: pageId, facebook, instagram },
        });
        if (error || !data?.ok) throw error || new Error('oauth_complete_failed');
        cleanOAuthQuery();
        closeMetaSelectionModal();
        socialToast('Compte Meta connecté');
        document.getElementById('clientModalBackdrop')?.classList.remove('hidden');
        await renderSocialConnections();
      } catch (error) {
        console.error(error);
        socialToast('Impossible de finaliser la connexion Meta.');
      } finally {
        button.disabled = false;
      }
    });
  });
}

function cleanOAuthQuery() {
  const url = new URL(location.href);
  ['oauth', 'status', 'request', 'reason'].forEach((key) => url.searchParams.delete(key));
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

async function handleMetaOAuthReturn() {
  const url = new URL(location.href);
  if (url.searchParams.get('oauth') !== 'meta') return;
  const status = url.searchParams.get('status');
  const requestId = url.searchParams.get('request');

  const { data: sessionData } = await db.auth.getSession();
  if (!sessionData?.session) return;

  if (status === 'select' && requestId) {
    try {
      const { data, error } = await db.functions.invoke('meta-oauth-options', {
        body: { request_id: requestId },
      });
      if (error || !data?.accounts?.length) throw error || new Error('no_accounts');
      showMetaSelectionModal(requestId, data.accounts);
    } catch (error) {
      console.error(error);
      cleanOAuthQuery();
      socialToast('Impossible de récupérer les Pages Meta disponibles.');
    }
    return;
  }

  if (status === 'cancelled') {
    cleanOAuthQuery();
    socialToast('Connexion Meta annulée.');
    return;
  }

  if (status === 'error') {
    const reason = url.searchParams.get('reason');
    cleanOAuthQuery();
    socialToast(reason === 'not_configured'
      ? 'Les identifiants de l’application Meta doivent encore être configurés.'
      : 'La connexion Meta a échoué.');
  }
}

function initSocialOAuthUI() {
  ensureSocialSection();
  document.getElementById('openClientManager')?.addEventListener('click', () => {
    setTimeout(renderSocialConnections, 40);
  });
  handleMetaOAuthReturn();
}

initSocialOAuthUI();
