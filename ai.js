(function () {
  'use strict';
  var state = {days: [], day: -1, items: [], stages: [], tags: [], domain: null, topics: [], query: '', docsReady: false};
  var $ = function (id) { return document.getElementById(id); };
  var tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  function getJson(url) {
    return fetch(url, {cache: 'no-store'}).then(function (r) {
      if (!r.ok) throw Error(r.status);
      return r.json();
    });
  }
  function activateTab(id, focus) {
    tabs.forEach(function (tab) {
      var selected = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !selected;
      if (selected && focus) tab.focus();
    });
  }
  function syncHash() {
    var hash = location.hash.slice(1);
    // The footer's #main link scrolls up without changing the selected panel.
    if (hash === 'main') return;
    var library = hash === 'library' || hash === 'explore' || hash.indexOf('stage-') === 0;
    activateTab(library ? 'library' : 'news');
    if (library && hash.indexOf('stage-') === 0 && $(hash)) $(hash).scrollIntoView({block: 'start'});
  }
  function selectTab(id, focus) {
    if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    activateTab(id, focus);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab.getAttribute('aria-controls')); });
    tab.addEventListener('keydown', function (e) {
      var next;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        e.preventDefault();
        selectTab(tabs[next].getAttribute('aria-controls'), true);
      }
    });
  });
  window.addEventListener('hashchange', syncHash);
  window.addEventListener('popstate', syncHash);
  syncHash();

  function renderNews() {
    var entries = [];
    if (state.day === -1) {
      state.days.forEach(function (d) { d.items.forEach(function (it) { entries.push({date: d.date, item: it}); }); });
      entries = entries.slice(0, 6);
    } else if (state.days[state.day]) {
      var day = state.days[state.day];
      entries = day.items.map(function (it) { return {date: day.date, item: it}; });
    }
    $('news-date').textContent = (state.newsCheckedAt ? '확인 ' + state.newsCheckedAt + ' · 한국시간 · ' : '') + entries.length + '건';
    $('news-body').innerHTML = entries.length ? entries.map(function (entry) {
      var it = entry.item, host = '';
      try { host = new URL(it.url).hostname.replace(/^www\./, ''); } catch (e) {}
      var facts = it.facts || [];
      var summary = facts[0] || '';
      return '<article class="news-card"><div class="news-meta">' + esc(it.category || '뉴스') + ' · 발표 <time datetime="' + esc(entry.date) + '">' + esc(entry.date) + '</time></div><h3>' + (it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + esc(it.title) + ' ↗</a>' : esc(it.title)) + '</h3>' + (summary ? '<p>' + esc(summary) + '</p>' : '') + (facts.length > 1 || it.takeaway ? '<details class="news-detail"><summary>자세히</summary>' + facts.slice(1).map(function (f) { return '<p>' + esc(f) + '</p>'; }).join('') + (it.takeaway ? '<p class="takeaway">' + esc(it.takeaway) + '</p>' : '') + '</details>' : '') + '<span class="source">' + esc(host || '출처 미확인') + '</span></article>';
    }).join('') : '<p class="empty">확인된 뉴스가 없습니다.</p>';
  }
  $('news-day').addEventListener('change', function () { state.day = Number(this.value); renderNews(); });

  function visibleDocs() {
    return state.items.filter(function (d) {
      var tags = d.tags || [];
      return (!state.domain || tags.indexOf(state.domain) >= 0) && state.topics.every(function (t) { return tags.indexOf(t) >= 0; }) && (!state.query || [d.title, d.subtitle, d.summary, d.slug].join(' ').toLocaleLowerCase().indexOf(state.query) >= 0);
    });
  }
  function countWith(id, group) {
    return state.items.filter(function (d) {
      var tags = d.tags || [];
      return tags.indexOf(id) >= 0 && (group === 'domain' || !state.domain || tags.indexOf(state.domain) >= 0) && state.topics.every(function (t) { return t === id || tags.indexOf(t) >= 0; });
    }).length;
  }
  function renderFilters() {
    function group(name, label) {
      return '<div class="frow"><span class="flabel">' + label + '</span>' + state.tags.filter(function (t) { return t.group === name; }).map(function (t) {
        var active = name === 'domain' ? state.domain === t.id : state.topics.indexOf(t.id) >= 0;
        return '<button type="button" class="chip' + (active ? ' on' : '') + '" data-group="' + name + '" data-tag="' + esc(t.id) + '" title="' + esc(t.desc) + '" aria-pressed="' + String(active) + '">' + esc(t.name) + '<span class="n">' + countWith(t.id, name) + '</span></button>';
      }).join('') + '</div>';
    }
    $('filters').innerHTML = group('domain', '분야') + group('topic', '주제') + ((state.domain || state.topics.length) ? '<button type="button" class="chip clear" id="clear">필터 해제</button>' : '');
  }
  $('filters').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'clear') { state.domain = null; state.topics = []; }
    else if (b.dataset.group === 'domain') state.domain = state.domain === b.dataset.tag ? null : b.dataset.tag;
    else {
      var i = state.topics.indexOf(b.dataset.tag);
      if (i >= 0) state.topics.splice(i, 1); else state.topics.push(b.dataset.tag);
    }
    var focusId = b.id, focusTag = b.dataset.tag;
    renderFilters();
    renderDocs();
    var next = focusTag ? Array.from($('filters').querySelectorAll('[data-tag]')).find(function (el) { return el.dataset.tag === focusTag; }) : $(focusId);
    (next || $('filter-toggle')).focus();
  });
  function renderDocs() {
    var docs = visibleDocs();
    $('docs-meta').textContent = docs.length + ' / ' + state.items.length + '편';
    $('docs-body').innerHTML = docs.length ? state.stages.map(function (s) {
      var list = docs.filter(function (d) { return d.stage === s.id; });
      if (!list.length) return '';
      return '<section class="stage-block" id="stage-' + esc(s.id) + '"><h3>' + esc(s.name) + '</h3><div class="doc-list">' + list.map(function (d) {
        return '<a class="doc-row" href="' + esc(d.url) + '"' + (d.local ? '' : ' target="_blank" rel="noopener noreferrer"') + '><strong>' + esc(d.title) + '</strong><p>' + esc(d.summary || d.subtitle) + '</p></a>';
      }).join('') + '</div></section>';
    }).join('') : '<p class="empty">일치하는 문서가 없습니다. 검색어나 필터를 줄여보세요.</p>';
  }
  $('doc-search').addEventListener('input', function () {
    state.query = this.value.trim().toLocaleLowerCase();
    if (state.docsReady) renderDocs();
  });
  document.addEventListener('keydown', function (e) {
    var active = document.activeElement;
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(active.tagName) && !active.isContentEditable) {
      e.preventDefault();
      selectTab('library');
      $('doc-search').focus();
    }
  });
  $('filter-toggle').addEventListener('click', function () {
    var open = $('filters').hidden;
    $('filters').hidden = !open;
    this.setAttribute('aria-expanded', String(open));
  });

  // Load panels independently: one failed request must not hide the other panel.
  getJson('data/news.json').then(function (data) {
    state.days = data.days || [];
    state.newsCheckedAt = data.checked_at || '';
    $('news-day').innerHTML = '<option value="-1">최근 뉴스</option>' + state.days.map(function (d, i) { return '<option value="' + i + '">' + esc(d.date) + '</option>'; }).join('');
    $('news-day').disabled = !state.days.length;
    renderNews();
  }).catch(function () {
    $('news-body').innerHTML = '<p class="empty" role="alert">뉴스를 불러오지 못했습니다. 새로고침해 주세요.</p>';
  }).finally(function () { $('news-body').setAttribute('aria-busy', 'false'); });
  getJson('data/artifacts.json').then(function (data) {
    state.items = data.items || [];
    state.stages = data.stages || [];
    state.tags = data.tags || [];
    state.docsReady = true;
    $('filter-toggle').disabled = false;
    renderFilters();
    renderDocs();
    syncHash();
  }).catch(function () {
    $('docs-body').innerHTML = '<p class="empty" role="alert">기술정보를 불러오지 못했습니다. 새로고침해 주세요.</p>';
  }).finally(function () { $('docs-body').setAttribute('aria-busy', 'false'); });
})();
