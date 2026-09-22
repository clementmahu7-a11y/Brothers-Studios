(() => {
  const originalPostCard = window.postCard;
  if (typeof originalPostCard !== 'function') return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const slug = (value) => String(value || 'Post')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  window.postCard = function postCardWithFormat(post) {
    let html = originalPostCard(post);
    const format = escapeHtml(post?.type || 'Post');
    const formatSlug = slug(post?.type || 'Post');

    html = html.replace('class="calendar-post ', `class="calendar-post format-${formatSlug} `);

    if (formatSlug === 'evenement') {
      const eventTime = post?.time ? `<span class="event-time">${escapeHtml(post.time)}</span>` : '';
      html = html.replace(
        /<div class="post-time">.*?<\/div>/,
        `<div class="post-time"><span class="post-format-badge format-evenement">Événement</span>${eventTime}</div>`
      );
      return html;
    }

    html = html.replace(
      '<div class="post-time">',
      `<div class="post-time"><span class="post-format-badge format-${formatSlug}">${format}</span><span class="post-format-sep">·</span>`
    );
    return html;
  };

  const form = document.getElementById('postForm');
  const type = document.getElementById('postType');
  const status = document.getElementById('postStatus');
  if (!form || !type || !status) return;

  if (![...type.options].some((o) => o.value === 'Événement')) {
    const option = document.createElement('option');
    option.value = 'Événement';
    option.textContent = 'Événement';
    type.appendChild(option);
  }

  const legend = document.querySelector('.legend');
  if (legend && !legend.querySelector('.legend-dot.event')) {
    legend.insertAdjacentHTML('beforeend', '<span><i class="legend-dot event"></i>Événement</span>');
  }
  const hint = document.querySelector('.calendar-hint');
  if (hint) hint.textContent = 'Glisse une publication ou un événement vers une autre date pour le déplacer.';

  const networksField = document.querySelector('.platform-fieldset');
  const statusField = status.closest('.field');
  const captionField = document.getElementById('postCaption')?.closest('.field');
  const visualField = document.getElementById('postVisual')?.closest('.field');
  const isEvent = () => type.value === 'Événement';

  function syncEventMode() {
    const eventMode = isEvent();
    networksField?.classList.toggle('event-field-hidden', eventMode);
    statusField?.classList.toggle('event-field-hidden', eventMode);
    captionField?.classList.toggle('event-field-hidden', eventMode);
    visualField?.classList.toggle('event-field-hidden', eventMode);

    if (eventMode) {
      status.value = 'idea';
      document.querySelectorAll('[name=postPlatform]').forEach((input) => { input.checked = false; });
      const editing = Boolean(document.getElementById('postId')?.value);
      const title = document.getElementById('modalTitle');
      const subtitle = document.getElementById('modalSubtitle');
      if (title) title.textContent = editing ? 'Modifier l’événement' : 'Nouvel événement';
      if (subtitle) subtitle.textContent = 'Ajoute un repère interne au calendrier Brothers Studios.';
    }
  }

  type.addEventListener('change', syncEventMode);

  if (typeof window.openEdit === 'function') {
    const originalOpenEdit = window.openEdit;
    window.openEdit = function (...args) {
      const result = originalOpenEdit.apply(this, args);
      syncEventMode();
      return result;
    };
  }

  if (typeof window.resetPost === 'function') {
    const originalResetPost = window.resetPost;
    window.resetPost = function (...args) {
      const result = originalResetPost.apply(this, args);
      syncEventMode();
      return result;
    };
  }

  if (typeof window.filtered === 'function') {
    const originalFiltered = window.filtered;
    window.filtered = function () {
      const rows = originalFiltered();
      const statusFilter = document.getElementById('filterStatus')?.value || 'all';
      const platformFilter = document.getElementById('filterPlatform')?.value || 'all';
      return rows.filter((row) => row.type !== 'Événement' || (statusFilter === 'all' && platformFilter === 'all'));
    };
  }

  if (typeof window.stats === 'function') {
    window.stats = function () {
      const currentMonthPosts = posts.filter((p) => {
        if (p.type === 'Événement') return false;
        const d = new Date(p.date + 'T12:00');
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
      document.getElementById('statTotal').textContent = currentMonthPosts.length;
      document.getElementById('statReview').textContent = currentMonthPosts.filter((p) => p.status === 'review').length;
      document.getElementById('statApproved').textContent = currentMonthPosts.filter((p) => p.status === 'approved').length;
      document.getElementById('statPublished').textContent = currentMonthPosts.filter((p) => p.status === 'published').length;
    };
  }

  form.addEventListener('submit', async (event) => {
    if (!isEvent()) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const id = document.getElementById('postId').value;
    const titleValue = document.getElementById('postTitle').value.trim();
    const clientId = document.getElementById('postClient').value;
    const dateValue = document.getElementById('postDate').value;
    if (!titleValue || !clientId || !dateValue) {
      toast('Renseigne le titre, le client et la date');
      return;
    }

    busy(true);
    try {
      const payload = {
        user_id: user.id,
        client_id: clientId,
        title: titleValue,
        category: document.getElementById('postCategory').value.trim() || 'Événement',
        networks: [],
        publication_date: dateValue,
        publication_time: document.getElementById('postTime').value || null,
        format: 'Événement',
        status: 'idea',
        caption: null,
        notes: document.getElementById('postNotes').value.trim() || null,
        visual_path: null
      };

      const query = id
        ? db.from('publications').update(payload).eq('id', id)
        : db.from('publications').insert(payload);
      const { error } = await query;
      if (error) throw error;

      document.getElementById('postModalBackdrop').classList.add('hidden');
      await load();
      toast(id ? 'Événement modifié' : 'Événement ajouté au calendrier');
    } catch (error) {
      console.error(error);
      toast('Enregistrement de l’événement impossible');
    } finally {
      busy(false);
    }
  }, true);
})();
