(() => {
  const originalPostCard = window.postCard;
  if (typeof originalPostCard !== 'function') return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const formatClass = (value) => {
    const key = String(value || 'Post')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    const known = {
      story: 'story',
      post: 'post',
      reel: 'reel',
      carrousel: 'carrousel',
      carousel: 'carrousel',
      video: 'video',
    };
    return known[key] || 'post';
  };

  window.postCard = function postCardWithFormat(post) {
    const html = originalPostCard(post);
    const format = escapeHtml(post?.type || 'Post');
    const kind = formatClass(post?.type);
    return html.replace(
      '<div class="post-time">',
      `<div class="post-time"><span class="post-format-badge format-${kind}">${format}</span><span class="post-format-sep">·</span>`
    );
  };
})();
