(function () {
  function initHomeChat() {
    if (window.stellarHomeChatCleanup) window.stellarHomeChatCleanup();
    const root = document.querySelector('[data-home-chat]');
    if (!root || root.dataset.ready === 'true') return;

    const launcher = root.querySelector('.home-chat-launcher');
    const panel = root.querySelector('.home-chat-panel');
    const closeButton = root.querySelector('.home-chat-close');
    const chatView = root.querySelector('[data-chat-view]');
    const commentView = root.querySelector('[data-comment-view]');
    const commentBack = root.querySelector('[data-comment-back]');
    const giscusContainer = root.querySelector('[data-chat-giscus]');
    const messages = root.querySelector('.home-chat-messages');
    const options = root.querySelector('.home-chat-options');
    const form = root.querySelector('.home-chat-form');
    const input = root.querySelector('#home-chat-input');
    const avatar = root.dataset.chatAvatar;
    const timers = [];
    root.dataset.ready = 'true';

    function scrollToLatest() {
      messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
    }

    function appendMessage(type, content) {
      const row = document.createElement('div');
      row.className = `home-chat-row ${type} new`;

      if (type === 'bot') {
        const image = document.createElement('img');
        image.className = 'home-chat-mini-avatar';
        image.src = avatar;
        image.alt = '';
        image.setAttribute('no-lazy', '');
        row.appendChild(image);
      }

      const bubble = document.createElement('div');
      bubble.className = 'home-chat-bubble';
      if (typeof content === 'string') {
        bubble.textContent = content;
      } else {
        bubble.appendChild(content);
      }
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollToLatest();
    }

    function appendLinkedMessage(text, linkText, href, external) {
      const content = document.createElement('span');
      content.append(document.createTextNode(text));
      const link = document.createElement('a');
      link.href = href;
      link.textContent = linkText;
      if (external) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      content.appendChild(document.createElement('br'));
      content.appendChild(link);
      appendMessage('bot', content);
    }

    function appendLinkListMessage(text, links) {
      const content = document.createElement('div');
      const description = document.createElement('span');
      description.textContent = text;
      content.appendChild(description);

      const list = document.createElement('div');
      list.className = 'home-chat-link-list';
      for (const item of links) {
        const link = document.createElement('a');
        link.href = item.href;
        link.textContent = item.label;
        if (item.external) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        list.appendChild(link);
      }
      content.appendChild(list);
      appendMessage('bot', content);
    }

    function appendSuggestionMessage(text, suggestions) {
      const content = document.createElement('div');
      const description = document.createElement('span');
      description.textContent = text;
      content.appendChild(description);

      const list = document.createElement('div');
      list.className = 'home-chat-suggestions';
      for (const suggestion of suggestions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.chatQuery = suggestion;
        button.textContent = suggestion;
        list.appendChild(button);
      }
      content.appendChild(list);
      appendMessage('bot', content);
    }

    function scheduleMessage(callback, delay) {
      timers.push(window.setTimeout(callback, delay));
    }

    function loadGiscus() {
      if (!giscusContainer || giscusContainer.dataset.loaded === 'true') return;
      giscusContainer.dataset.loaded = 'true';

      const script = document.createElement('script');
      script.async = true;
      for (const attribute of giscusContainer.attributes) {
        if (['class', 'id', 'data-chat-giscus', 'data-loaded'].includes(attribute.name)) continue;
        script.setAttribute(attribute.name, attribute.value);
      }
      giscusContainer.appendChild(script);
    }

    function showCommentView() {
      chatView.hidden = true;
      commentView.hidden = false;
      root.classList.add('comments-open');
      loadGiscus();
      commentBack.focus();
    }

    function showChatView() {
      commentView.hidden = true;
      chatView.hidden = false;
      root.classList.remove('comments-open');
    }

    function replyAbout(appendUserMessage) {
      if (appendUserMessage !== false) appendMessage('user', '介绍一下你自己');
      scheduleMessage(() => appendMessage('bot', '你好，我是毕钰林。这里是我的个人博客，用来记录学习、技术实践，也会分享生活中的见闻与思考。'), 180);
      scheduleMessage(() => appendMessage('bot', '技术方面，我主要关注 Java 后端、AI Agent、RAG 和工程化实践，并持续把项目经验整理成可以复用的内容。'), 420);
      scheduleMessage(() => appendLinkedMessage('如果你想了解更完整的教育经历、项目经历和技术栈，可以查看我的个人简历。', '查看个人简历', '/resume/', false), 680);
    }

    function replyMessageGuide(appendUserMessage) {
      if (appendUserMessage !== false) appendMessage('user', '我想要留言');
      scheduleMessage(() => appendMessage('bot', '当然可以，正在为你打开留言板。留言会由 GitHub Discussions 公开保存。'), 180);
      scheduleMessage(showCommentView, 520);
    }

    function normalizeQuery(value) {
      return value.toLowerCase().replace(/[\s，。！？、,.!?：:；;“”"'‘’]/g, '');
    }

    function includesAny(query, keywords) {
      return keywords.some((keyword) => query.includes(keyword));
    }

    function handleQuery(value) {
      const query = normalizeQuery(value);
      appendMessage('user', value);

      if (includesAny(query, ['留言', '评论', '联系你', '联系博主'])) {
        replyMessageGuide(false);
        return;
      }
      if (includesAny(query, ['你是谁', '介绍', '关于你', '关于我', '博主'])) {
        replyAbout(false);
        return;
      }
      if (includesAny(query, ['简历', '经历', '教育', '学校', '工作'])) {
        scheduleMessage(() => appendLinkedMessage('我的个人简历整理了教育经历、项目经历、专业技能和相关荣誉。', '查看个人简历', '/resume/', false), 220);
        return;
      }
      if (includesAny(query, ['codeauto', 'code auto', '编程助手'])) {
        scheduleMessage(() => appendLinkedMessage('CodeAuto 是一个基于 Java 21 构建的轻量级 AI 编程代理运行时。', '查看 CodeAuto 项目介绍', '/codeauto/', false), 220);
        return;
      }
      if (includesAny(query, ['知问', 'ragagent', 'rag项目'])) {
        scheduleMessage(() => appendLinkedMessage('知问是一个面向知识库问答场景的 RAG Agent 平台。', '前往 GitHub 查看知问', 'https://github.com/Yulin-Bi/Rag-agent', true), 220);
        return;
      }
      if (includesAny(query, ['探店', 'hmdp'])) {
        scheduleMessage(() => appendLinkedMessage('i 探店是围绕本地生活点评场景扩展的后端实践项目。', '前往 GitHub 查看 i 探店', 'https://github.com/Yulin-Bi/hmdp-pro', true), 220);
        return;
      }
      if (includesAny(query, ['项目', '作品', '开源'])) {
        scheduleMessage(() => appendLinkListMessage('这里有三个主要项目，你可以选择一个查看：', [
          { label: 'CodeAuto', href: '/codeauto/' },
          { label: '知问', href: 'https://github.com/Yulin-Bi/Rag-agent', external: true },
          { label: 'i 探店', href: 'https://github.com/Yulin-Bi/hmdp-pro', external: true }
        ]), 220);
        return;
      }
      if (includesAny(query, ['transformer', '大模型'])) {
        scheduleMessage(() => appendLinkedMessage('可以从这篇文章了解 Transformer 的核心结构、注意力机制和发展脉络。', '阅读 Transformer 简介', '/2026/07/18/llm_study1/', false), 220);
        return;
      }
      if (includesAny(query, ['rocketmq', 'rocket', '消息队列', 'mq'])) {
        scheduleMessage(() => appendLinkedMessage('这篇文章整理了 RocketMQ 的核心知识点和常见问题。', '阅读 RocketMQ 知识点整理', '/2026/06/07/RocketMq/', false), 220);
        return;
      }
      if (includesAny(query, ['文章', '博客', '最近更新', '推荐'])) {
        scheduleMessage(() => appendLinkListMessage('最近可以从这些内容开始阅读：', [
          { label: 'Transformer 简介', href: '/2026/07/18/llm_study1/' },
          { label: 'RocketMQ 知识点整理', href: '/2026/06/07/RocketMq/' },
          { label: '第一篇博客', href: '/2026/05/26/hello-world/' }
        ]), 220);
        return;
      }
      if (includesAny(query, ['github', 'github主页', '代码仓库'])) {
        scheduleMessage(() => appendLinkedMessage('你可以在 GitHub 查看我的开源项目和近期提交。', '访问我的 GitHub', 'https://github.com/Yulin-Bi', true), 220);
        return;
      }
      if (includesAny(query, ['你好', '在吗', '嗨', 'hello', 'hi'])) {
        scheduleMessage(() => appendSuggestionMessage('你好，我在。想先了解哪一部分？', ['关于我', '简历', '项目', '文章', '留言']), 220);
        return;
      }

      scheduleMessage(() => appendSuggestionMessage('我暂时只能回答博客相关的预设问题。你可以试试下面这些关键词：', ['关于我', '简历', '项目', '文章', 'GitHub', '留言']), 260);
    }

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
    commentBack.addEventListener('click', showChatView);

    options.addEventListener('click', (event) => {
      const button = event.target.closest('[data-chat-topic]');
      if (!button) return;
      if (button.dataset.chatTopic === 'about') replyAbout();
      if (button.dataset.chatTopic === 'message') replyMessageGuide();
    });

    messages.addEventListener('click', (event) => {
      const button = event.target.closest('[data-chat-query]');
      if (!button) return;
      handleQuery(button.dataset.chatQuery);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        input.focus();
        return;
      }
      input.value = '';
      handleQuery(value);
    });

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && !panel.hidden) setOpen(false);
    };

    const handleOutsideClick = (event) => {
      if (!panel.hidden && !root.contains(event.target)) setOpen(false, false);
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleOutsideClick);
    window.stellarHomeChatCleanup = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
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
