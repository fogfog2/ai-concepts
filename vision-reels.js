(() => {
  const panel = document.getElementById('video-explainer');
  if (!panel) return;
  const video = panel.querySelector('video');
  function update() {
    if (panel.open) {
      if (!video.poster) video.poster = video.dataset.poster;
    } else {
      video.pause();
    }
  }
  function followLink() {
    if (location.hash === '#video-explainer') panel.open = true;
  }
  panel.addEventListener('toggle', update);
  window.addEventListener('hashchange', followLink);
  followLink();
  update();
})();
