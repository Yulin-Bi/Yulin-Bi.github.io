(function () {
  function initHomeChat() {
    if (window.stellarHomeChatCleanup) window.stellarHomeChatCleanup();
    const root = document.querySelector('[data-home-chat]');
    if (!root || root.dataset.ready === 'true') return;

    const launcher = root.querySelector('.home-chat-launcher');
    const panel = root.querySelector('.home-chat-panel');
    const closeButton = root.querySelector('.home-chat-close');
    root.dataset.ready = 'true';

    function setOpen(open, restoreFocus) {
      panel.hidden = !open;
      launcher.setAttribute('aria-expanded', String(open));
      root.classList.toggle('open', open);
      if (open) {
        root.querySelector('.home-chat-unread')?.remove();
        closeButton.focus();
      } else if (restoreFocus !== false) {
        launcher.focus();
      }
    }

    launcher.addEventListener('click', () => setOpen(panel.hidden));
    closeButton.addEventListener('click', () => setOpen(false));

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && !panel.hidden) setOpen(false);
    };

    const handleOutsideClick = (event) => {
      if (!panel.hidden && !root.contains(event.target)) setOpen(false, false);
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleOutsideClick);
    window.stellarHomeChatCleanup = () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleOutsideClick);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeChat, { once: true });
  } else {
    initHomeChat();
  }
  document.addEventListener('pjax:complete', initHomeChat);
})();
