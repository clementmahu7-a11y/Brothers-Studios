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
    html = html.replace(
      '<div class="post-time">',
      `<div class="post-time"><span class="post-format-badge format-${formatSlug}">${format}</span><span class="post-format-sep">·</span>`
    );
    return html;
  };
})();
