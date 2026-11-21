(() => {
  const panels = Array.from(document.querySelectorAll('details.vision-reel'));
  const videos = panels.map(panel => panel.querySelector('video'));
  panels.forEach((panel, index) => {
    const video = videos[index];
    panel.addEventListener('toggle', () => {
      if (panel.open) {
        if (!video.poster) video.poster = video.dataset.poster;
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', () => {
      videos.forEach(other => { if (other !== video && !other.paused) other.pause(); });
    });
  });
  function followLink() {
    const panel = panels.find(item => '#' + item.id === location.hash);
    if (panel) panel.open = true;
  }
  window.addEventListener('hashchange', followLink);
  followLink();
})();
