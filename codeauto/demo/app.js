(() => {
  const data = window.CODEAUTO_DEMO_DATA;
  if (!data) return;
  const displayTitle = 'CodeAuto 设计问题复盘';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = value => new Intl.NumberFormat('zh-CN').format(Number(value) || 0);
  const compact = value => {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    return text.length > 1600 ? `${text.slice(0, 1600)}\n…（演示中已折叠）` : text;
  };
  const payloadText = event => {
    const payload = event.payload || {};
    if (event.type === 'user_message' || event.type === 'assistant_message' || event.type === 'progress') return payload.content || '';
    if (event.type === 'tool_start') return JSON.stringify(payload.input || {}, null, 2);
    if (event.type === 'tool_result') return payload.output || '';
    return JSON.stringify(payload, null, 2);
  };
  const typeName = type => ({
    user_message:'用户消息', assistant_message:'Agent 回复', progress:'执行进度', tool_start:'工具调用',
    tool_result:'工具结果', permission_request:'权限请求', permission_resolved:'权限结果',
    git_initialized:'Git 初始化', git_changed:'Git 变更', turn_complete:'轮次完成',
    usage_stats:'Token 统计', context_stats:'上下文统计', session_created:'会话创建'
  }[type] || type);

  $('#project-name').textContent = data.project;
  $('#workspace-name').textContent = data.workspace;
  $('#session-name').textContent = displayTitle;
  $('#main-title').textContent = displayTitle;

  const chatEvents = data.events.filter(event => ['user_message','assistant_message','progress','tool_start','tool_result'].includes(event.type));
  $('#chat-view').innerHTML = chatEvents.map(event => {
    if (event.type === 'tool_start' || event.type === 'tool_result') {
      const name = event.payload?.name || 'tool';
      return `<details class="tool-event ${event.type === 'tool_result' ? 'tool-result' : ''}"><summary>${escapeHtml(event.type === 'tool_start' ? `调用 ${name}` : `${name} 返回结果`)}</summary><pre>${escapeHtml(compact(payloadText(event)))}</pre></details>`;
    }
    const role = event.type === 'user_message' ? 'user' : event.type === 'assistant_message' ? 'assistant' : 'progress';
    const label = role === 'user' ? 'YOU' : role === 'assistant' ? 'CODEAUTO' : 'PROGRESS';
    return `<article class="message ${role}"><div class="message-label"><i></i>${label}</div><div class="message-body">${escapeHtml(payloadText(event))}</div></article>`;
  }).join('');

  $('#trace-view').innerHTML = `<div class="trace-list">${data.events.map(event => {
    const time = event.time ? new Date(event.time).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '--:--';
    const isError = event.type === 'tool_result' && event.payload?.error;
    return `<div class="trace-row ${isError ? 'error' : ''}"><span class="trace-node"></span><time class="trace-time">${escapeHtml(time)}</time><div class="trace-card"><b>${escapeHtml(typeName(event.type))}${event.payload?.name ? ` · ${escapeHtml(event.payload.name)}` : ''}</b><p>${escapeHtml(compact(payloadText(event)))}</p></div></div>`;
  }).join('')}</div>`;

  const s = data.summary;
  const contextPercent = s.contextLimit ? Math.min(100, Math.round(s.contextTokens / s.contextLimit * 100)) : 0;
  const successRate = s.toolCalls ? Math.round((s.toolCalls - s.toolErrors) / s.toolCalls * 100) : 100;
  $('#evaluation-view').innerHTML = `
    <div class="metric-grid">
      <div class="metric-card accent"><span>记录事件</span><b>${number(s.events)}</b><small>已过滤流式增量事件</small></div>
      <div class="metric-card"><span>工具调用</span><b>${number(s.toolCalls)}</b><small>成功率 ${successRate}%</small></div>
      <div class="metric-card"><span>总 Token</span><b>${number(s.totalTokens)}</b><small>输入 ${number(s.inputTokens)} / 输出 ${number(s.outputTokens)}</small></div>
      <div class="metric-card"><span>经验记录</span><b>${number(data.memory.length)}</b><small>Reflection + Bullet</small></div>
      <div class="metric-card"><span>项目文件</span><b>${number(data.files.length)}</b><small>仅展示公开白名单</small></div>
      <div class="metric-card"><span>Git 提交</span><b>${number(data.commits.length)}</b><small>当前分支 ${escapeHtml(data.session.branch)}</small></div>
    </div>
    <div class="context-block"><div class="context-head"><b>上下文窗口</b><span>${number(s.contextTokens)} / ${number(s.contextLimit)} tokens</span></div><div class="context-track"><i style="width:${contextPercent}%"></i></div></div>
    <div class="audit-note"><b>公开数据说明：</b> 原始日志中的邮箱、本机绝对路径和潜在凭据均经过导出器脱敏；${number(s.skippedMalformedRecords)} 条无法安全解析的原始记录未进入演示数据。</div>`;

  $('#overview-rail').innerHTML = `
    <div class="rail-title">Token 用量</div>
    <div class="rail-card"><div class="token-number"><strong>${number(s.contextTokens)}</strong><span>/ ${number(s.contextLimit)}</span></div><div class="mini-track"><i style="width:${contextPercent}%"></i></div><small>当前上下文占用 ${contextPercent}%</small></div>
    <div class="rail-title">运行状态</div>
    <div class="rail-card"><b>${number(s.toolCalls)} 次工具调用</b><small>${number(s.toolErrors)} 次错误 · ${successRate}% 成功率</small></div>
    <div class="rail-title">Git 时间线</div>
    ${data.commits.map(commit => `<div class="rail-card commit"><code>${escapeHtml(commit.hash)}</code><b>${escapeHtml(commit.subject)}</b><small>${escapeHtml(new Date(commit.time).toLocaleString('zh-CN'))}</small></div>`).join('')}`;

  const openDetail = (title, content) => {
    $('#dialog-content').innerHTML = `<h2>${escapeHtml(title)}</h2><pre>${escapeHtml(content)}</pre>`;
    $('#detail-dialog').showModal();
  };
  $('#files-rail').innerHTML = `<div class="rail-title">公开文件白名单</div>${data.files.map((file, index) => `<button class="file-row" data-file="${index}"><b>${escapeHtml(file.name)}</b><small>点击查看只读内容</small></button>`).join('')}`;
  $('#memory-rail').innerHTML = `<div class="rail-title">经验沉淀</div>${data.memory.map((item, index) => `<button class="memory-row" data-memory="${index}"><small class="memory-kind">${escapeHtml(item.kind)}</small><b>${escapeHtml(item.title)}</b></button>`).join('')}`;
  $$('[data-file]').forEach(button => button.addEventListener('click', () => { const file = data.files[Number(button.dataset.file)]; openDetail(file.name, file.content); }));
  $$('[data-memory]').forEach(button => button.addEventListener('click', () => { const item = data.memory[Number(button.dataset.memory)]; openDetail(item.title, item.content); }));

  $$('[data-view]').forEach(button => button.addEventListener('click', () => {
    $$('[data-view]').forEach(item => item.classList.toggle('active', item === button));
    $$('.main-panel .view').forEach(view => view.classList.toggle('active', view.id === `${button.dataset.view}-view`));
  }));
  $$('[data-rail]').forEach(button => button.addEventListener('click', () => {
    $$('[data-rail]').forEach(item => item.classList.toggle('active', item === button));
    $$('.rail-view').forEach(view => view.classList.toggle('active', view.id === `${button.dataset.rail}-rail`));
  }));
})();
