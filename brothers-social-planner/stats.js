const STATS_METRICS = [
  ['views', 'Vues'],
  ['reach', 'Portée'],
  ['impressions', 'Impressions'],
  ['likes', 'J’aime'],
  ['comments', 'Commentaires'],
  ['shares', 'Partages'],
  ['clicks', 'Clics'],
  ['saves', 'Enregistrements'],
];

function statsNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat('fr-FR').format(n) : '—';
}

function statsEngagement(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %` : '—';
}

function selectedStatsNetworks() {
  return [...document.querySelectorAll('[name="postPlatform"]:checked')].map((el) => el.value);
}

async function renderPublishedStats() {
  const section = document.getElementById('publishedStatsSection');
  const content = document.getElementById('publishedStatsContent');
  if (!section || !content) return;

  const status = document.getElementById('postStatus')?.value;
  if (status !== 'published') {
    section.classList.add('hidden');
    content.innerHTML = '';
    return;
  }

  section.classList.remove('hidden');
  const publicationId = document.getElementById('postId')?.value;
  const networks = selectedStatsNetworks();

  if (!publicationId) {
    content.innerHTML = '<div class="stats-empty"><strong>Publication pas encore enregistrée</strong><span>Enregistre-la d’abord, puis rouvre-la pour ajouter le lien du post et voir ses statistiques.</span></div>';
    return;
  }

  content.innerHTML = '<div class="stats-loading">Chargement des statistiques…</div>';

  const { data, error } = await db
    .from('publication_stats')
    .select('id, publication_id, network, post_url, views, reach, impressions, likes, comments, shares, clicks, saves, engagement_rate, fetched_at, updated_at')
    .eq('publication_id', publicationId);

  if (error) {
    console.error(error);
    content.innerHTML = '<div class="stats-empty"><strong>Impossible de charger les statistiques</strong><span>Réessaie dans quelques instants.</span></div>';
    return;
  }

  const rows = new Map((data || []).map((row) => [row.network, row]));
  if (!networks.length) {
    content.innerHTML = '<div class="stats-empty"><strong>Aucun réseau sélectionné</strong><span>Sélectionne au moins un réseau pour cette publication.</span></div>';
    return;
  }

  content.innerHTML = networks.map((network) => {
    const row = rows.get(network) || {};
    const hasMetric = [...STATS_METRICS.map(([key]) => key), 'engagement_rate']
      .some((key) => row[key] !== null && row[key] !== undefined);
    const syncLabel = row.fetched_at
      ? `Dernière synchronisation : ${new Date(row.fetched_at).toLocaleString('fr-FR')}`
      : 'Aucune statistique synchronisée pour le moment.';

    const metrics = STATS_METRICS.map(([key, label]) => `
      <div class="post-stat">
        <span>${label}</span>
        <strong>${statsNumber(row[key])}</strong>
      </div>`).join('');

    return `
      <article class="network-stats-card" data-stats-network="${network}">
        <div class="network-stats-head">
          <div>
            <strong>${network}</strong>
            <span>${syncLabel}</span>
          </div>
          <span class="stats-sync-badge ${hasMetric ? 'synced' : ''}">${hasMetric ? 'Données disponibles' : 'En attente de synchronisation'}</span>
        </div>

        <div class="stats-link-row">
          <label class="field stats-url-field">
            <span>Lien du post publié</span>
            <input class="stats-post-url" data-network="${network}" type="url" value="${row.post_url || ''}" placeholder="https://…">
          </label>
          <button type="button" class="secondary-btn stats-save-link" data-network="${network}">Enregistrer le lien</button>
        </div>

        <div class="post-stats-grid">
          ${metrics}
          <div class="post-stat engagement">
            <span>Taux d’engagement</span>
            <strong>${statsEngagement(row.engagement_rate)}</strong>
          </div>
        </div>
      </article>`;
  }).join('');

  content.querySelectorAll('.stats-save-link').forEach((button) => {
    button.addEventListener('click', async () => {
      const network = button.dataset.network;
      const input = content.querySelector(`.stats-post-url[data-network="${network}"]`);
      const postUrl = input?.value.trim() || null;
      button.disabled = true;
      const { error: saveError } = await db.from('publication_stats').upsert({
        user_id: user.id,
        publication_id: publicationId,
        network,
        post_url: postUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'publication_id,network' });
      button.disabled = false;
      if (saveError) {
        console.error(saveError);
        toast('Impossible d’enregistrer le lien');
        return;
      }
      toast('Lien du post enregistré');
      await renderPublishedStats();
    });
  });
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-post]')) {
    setTimeout(renderPublishedStats, 80);
  }
});

document.getElementById('postStatus')?.addEventListener('change', () => {
  setTimeout(renderPublishedStats, 0);
});

document.querySelectorAll('[name="postPlatform"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (document.getElementById('postStatus')?.value === 'published') setTimeout(renderPublishedStats, 0);
  });
});

document.getElementById('refreshPublishedStats')?.addEventListener('click', renderPublishedStats);

// Charge l'interface de gestion des connexions sociales sans modifier le cœur du calendrier.
(() => {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './social.css';
  document.head.appendChild(css);

  const script = document.createElement('script');
  script.src = './social.js';
  script.defer = true;
  document.body.appendChild(script);
})();
