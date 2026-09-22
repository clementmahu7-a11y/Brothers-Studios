(() => {
  const originalPostCard = window.postCard;
  if (typeof originalPostCard !== 'function') return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  window.postCard = function postCardWithFormat(post) {
    const html = originalPostCard(post);
    const format = escapeHtml(post?.type || 'Post');
    return html.replace(
      '<div class="post-time">',
      `<div class="post-time"><span class="post-format-badge">${format}</span><span class="post-format-sep">·</span>`
    );
  };
})();
