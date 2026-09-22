(() => {
  const CLIENT_TABS = [
    { id: 'clients', label: 'Clients' },
    { id: 'social', label: 'Comptes sociaux' },
    { id: 'access', label: 'Accès clients' },
  ];
  let activeClientTab = 'clients';

  function brandApp() {
    document.querySelectorAll('.brand-mark').forEach((mark) => {
      if (mark.textContent) mark.textContent = '';
      mark.setAttribute('aria-label', 'Brothers Studios');
      mark.setAttribute('role', 'img');
    });
  }

  function clientModal() {
    return document.querySelector('#clientModalBackdrop .client-modal');
  }

  function ensureClientTabs() {
    const modal = clientModal();
    const header = modal?.querySelector('.modal-header');
    const form = document.getElementById('clientForm');
    const list = document.getElementById('clientManagerList');
    if (!modal || !header || !form || !list) return false;

    const title = header.querySelector('h2');
    const subtitle = header.querySelector('p');
    if (title) title.textContent = 'Gestion des clients';
    if (subtitle) subtitle.textContent = 'Gère tes clients, leurs comptes sociaux et leurs accès depuis un seul endroit.';

    let tabs = modal.querySelector('.client-tabs');
    if (!tabs) {
      tabs = document.createElement('div');
      tabs.className = 'client-tabs';
      tabs.setAttribute('role', 'tablist');
      tabs.innerHTML = CLIENT_TABS.map((tab) => `
        <button type="button" class="client-tab" data-client-tab="${tab.id}" role="tab">
          ${tab.label}<span class="tab-count" data-tab-count="${tab.id}"></span>
        </button>`).join('');
      header.insertAdjacentElement('afterend', tabs);
      tabs.querySelectorAll('[data-client-tab]').forEach((button) => {
        button.addEventListener('click', () => {
          activeClientTab = button.dataset.clientTab;
          applyClientTabState();
          if (activeClientTab === 'social' && typeof renderSocialConnections === 'function') renderSocialConnections();
          if (activeClientTab === 'access' && typeof renderClientAccess === 'function') renderClientAccess();
        });
      });
    }

    form.dataset.v2TabPanel = 'clients';
    list.dataset.v2TabPanel = 'clients';
    const social = document.getElementById('socialConnectionsSection');
    const access = document.getElementById('clientAccessSection');
    if (social) social.dataset.v2TabPanel = 'social';
    if (access) access.dataset.v2TabPanel = 'access';

    applyClientTabState();
    updateTabCounts();
    return true;
  }

  function applyClientTabState() {
    const modal = clientModal();
    if (!modal) return;
    modal.querySelectorAll('[data-client-tab]').forEach((button) => {
      const isActive = button.dataset.clientTab === activeClientTab;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
    modal.querySelectorAll('[data-v2-tab-panel]').forEach((panel) => {
      panel.style.display = panel.dataset.v2TabPanel === activeClientTab ? '' : 'none';
    });
  }

  function updateTabCounts() {
    const modal = clientModal();
    if (!modal) return;
    const counts = {
      clients: document.querySelectorAll('#clientManagerList .client-manager-row').length,
      social: document.querySelectorAll('#socialConnectionsContent .social-client-card').length,
      access: document.querySelectorAll('#clientAccessContent .client-access-card').length,
    };
    Object.entries(counts).forEach(([key, value]) => {
      const badge = modal.querySelector(`[data-tab-count="${key}"]`);
      if (!badge) return;
      badge.textContent = value ? String(value) : '';
      badge.classList.toggle('hidden', !value);
    });
  }

  function decorateAdminNav() {
    const button = document.getElementById('openAdminManager');
    if (button) button.title = 'Gérer les administrateurs';
  }

  function decorateAdminModal() {
    const modal = document.querySelector('#adminManagerBackdrop .admin-manager-modal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header');
    const h2 = header?.querySelector('h2');
    const p = header?.querySelector('p');
    if (h2) h2.textContent = 'Administrateurs';
    if (p) p.textContent = 'Invite et gère les personnes qui ont accès à l’ensemble de Brothers Social Planner.';
  }

  function enhanceAccessCards() {
    document.querySelectorAll('.client-access-card').forEach((card) => {
      const title = card.querySelector('.client-access-title');
      if (!title) return;
      let main = title.querySelector('.client-access-title-main');
      if (!main) {
        const dot = title.querySelector('.client-dot');
        const strong = title.querySelector('strong');
        if (!dot || !strong) return;
        main = document.createElement('div');
        main.className = 'client-access-title-main';
        main.append(dot, strong);
        title.prepend(main);
      }

      let badges = title.querySelector('.client-access-badges');
      if (!badges) {
        badges = document.createElement('div');
        badges.className = 'client-access-badges';
        title.appendChild(badges);
      }
      const rows = [...card.querySelectorAll('.client-access-row')];
      const active = rows.filter((row) => row.textContent.includes('Accès actif')).length;
      const pending = rows.filter((row) => row.textContent.includes('Invitation en attente')).length;
      badges.innerHTML = active || pending
        ? `${active ? `<span class="access-badge active">● ${active} accès actif${active > 1 ? 's' : ''}</span>` : ''}${pending ? `<span class="access-badge pending">● ${pending} invitation${pending > 1 ? 's' : ''}</span>` : ''}`
        : '<span class="access-badge empty">Aucun accès</span>';
    });
  }

  function enhanceSocialCards() {
    document.querySelectorAll('.social-client-card').forEach((card) => {
      const head = card.querySelector('.social-client-head');
      const button = head?.querySelector('.social-connect-meta');
      if (!head || !button) return;
      let badge = head.querySelector('.social-status-badge');
      if (!badge) {
        badge = document.createElement('span');
        button.insertAdjacentElement('beforebegin', badge);
      }
      const connected = card.querySelectorAll('.social-connection-row').length;
      badge.className = `social-status-badge ${connected ? 'connected' : 'empty'}`;
      badge.textContent = connected ? `${connected} connecté${connected > 1 ? 's' : ''}` : 'Aucun compte connecté';
    });
  }

  function enhanceAdminRows() {
    document.querySelectorAll('#adminsActiveList .admin-row').forEach((row) => {
      const info = row.querySelector('.admin-row-info');
      if (!info || info.querySelector('.admin-status-badge')) return;
      const badge = document.createElement('span');
      badge.className = 'admin-status-badge active';
      badge.textContent = '● Actif';
      info.appendChild(badge);
    });
    document.querySelectorAll('#adminsPendingList .admin-row').forEach((row) => {
      if (row.querySelector('.admin-status-badge')) return;
      const info = row.querySelector('.admin-row-info');
      if (!info) return;
      const badge = document.createElement('span');
      badge.className = 'admin-status-badge pending';
      badge.textContent = '● Invitation envoyée';
      info.appendChild(badge);
    });
  }

  function onClientManagerOpen() {
    activeClientTab = 'clients';
    setTimeout(() => {
      ensureClientTabs();
      applyClientTabState();
      const modal = clientModal();
      if (modal) modal.scrollTop = 0;
    }, 0);
  }

  function polish() {
    brandApp();
    ensureClientTabs();
    updateTabCounts();
    decorateAdminNav();
    decorateAdminModal();
    enhanceAccessCards();
    enhanceSocialCards();
    enhanceAdminRows();
  }

  function init() {
    polish();
    document.getElementById('openClientManager')?.addEventListener('click', onClientManagerOpen);
    const observer = new MutationObserver(polish);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
