const videos = new Set();

window.addEventListener('canplay', e => {
  if (e.target.tagName === 'VIDEO') {
    videos.add(e.target);
    chrome.runtime.sendMessage({
      method: 'playing'
    });
  }
}, true);
