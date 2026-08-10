/* ai.js — 상단 오늘의 소식 + 하단 기술 문서
 *
 * 데이터는 두 곳에서 읽는다. 한쪽이 없어도 다른 쪽은 그대로 보인다.
 *   data/news.json       archive/*.md 에서 생성된 날짜별 뉴스
 *   data/artifacts.json  catalog.py 에서 생성된 기술 문서 목록
 */
(function () {
  'use strict';

  var state = { days: [], cur: 0, artifacts: [], stages: [] };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  /* ---------- 뉴스 ---------- */

  function renderNews() {
    var body = document.getElementById('news-body');
    var meta = document.getElementById('news-date');

    if (!state.days.length) {
      meta.textContent = '';
      body.innerHTML = '<div class="empty">아직 수집된 소식이 없습니다.</div>';
      return;
    }

    var day = state.days[state.cur];
    /* 가장 최근 날짜면 '오늘', 아니면 날짜를 그대로 보여준다 */
    meta.textContent = day.date + (state.cur === 0 ? '' : ' · 지난 소식');

    body.innerHTML = day.items.map(function (it) {
      var h = it.url ? host(it.url) : '';
      var facts = (it.facts || []).map(function (f) {
        return '<li>' + esc(f) + '</li>';
      }).join('');

      return '<article class="item">' +
        '<h3>' +
          (it.url
            ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' +
                esc(it.title) + '<span class="ext" aria-hidden="true">↗</span></a>'
            : esc(it.title)) +
        '</h3>' +
        '<div class="item-meta">' +
          (it.category ? '<span class="tag">' + esc(it.category) + '</span>' : '') +
          (h ? '<span class="src">' + esc(h) + '</span>' : '') +
        '</div>' +
        (facts ? '<ul class="facts">' + facts + '</ul>' : '') +
        (it.takeaway
          ? '<p class="takeaway"><b>그래서</b>' + esc(it.takeaway) + '</p>'
          : '') +
      '</article>';
    }).join('');
  }

  function renderDays() {
    var nav = document.getElementById('days');
    if (state.days.length < 2) { nav.innerHTML = ''; return; }

    nav.innerHTML = '<span class="days-label">지난 날짜</span>' +
      state.days.slice(0, 14).map(function (d, i) {
        return '<button class="day' + (i === state.cur ? ' on' : '') +
          '" data-i="' + i + '">' + esc(d.date.slice(5)) + '</button>';
      }).join('');

    Array.prototype.forEach.call(nav.querySelectorAll('.day'), function (el) {
      el.addEventListener('click', function () {
        state.cur = +el.dataset.i;
        renderNews();
        renderDays();
      });
    });
  }

  /* ---------- 기술 문서 ---------- */

  function renderDocs() {
    var body = document.getElementById('docs-body');
    var list = state.artifacts;

    if (!list.length) {
      body.innerHTML = '<div class="empty">등록된 기술 문서가 없습니다.</div>';
      return;
    }

    document.getElementById('docs-meta').textContent =
      list.length + '편 · ' + state.stages.length + '단계';

    body.innerHTML = state.stages.map(function (st) {
      var items = list.filter(function (a) { return a.stage === st.id; });
      if (!items.length) return '';

      var rows = items.map(function (a, i) {
        var ext = !a.local;
        var idx = ('0' + (i + 1)).slice(-2);
        return '<a class="doc" href="' + esc(a.url) + '"' +
            (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
          '<span class="doc-idx" aria-hidden="true">' + idx + '</span>' +
          '<span class="doc-head">' +
            '<b>' + esc(a.title) + '</b>' +
            (a.subtitle ? '<i>' + esc(a.subtitle) + '</i>' : '') +
          '</span>' +
          (a.summary ? '<span class="doc-sum">' + esc(a.summary) + '</span>' : '') +
          '<span class="doc-go" aria-hidden="true">' + (ext ? '↗' : '→') + '</span>' +
        '</a>';
      }).join('');

      return '<section class="stage">' +
        '<div class="stage-head">' +
          '<span class="stage-no">' + esc(st.no) + '</span>' +
          '<h3>' + esc(st.name) +
            (st.tagline ? ' <em>' + esc(st.tagline) + '</em>' : '') +
          '</h3>' +
          '<span class="stage-count">' + items.length + '편</span>' +
          (st.desc ? '<p>' + esc(st.desc) + '</p>' : '') +
        '</div>' +
        '<div class="doc-list">' + rows + '</div>' +
      '</section>';
    }).join('');
  }

  /* ---------- 시작 ---------- */
  Promise.all([
    getJson('data/news.json').catch(function () { return { days: [] }; }),
    getJson('data/artifacts.json').catch(function () { return { items: [] }; })
  ]).then(function (res) {
    state.days = (res[0] && res[0].days) || [];
    state.artifacts = (res[1] && res[1].items) || [];
    state.stages = (res[1] && res[1].stages) || [];

    renderNews();
    renderDays();
    renderDocs();

    var foot = document.getElementById('foot');
    foot.textContent = state.days.length
      ? 'AI CONCEPTS · ' + state.artifacts.length + ' ENTRIES · NEWS ' + state.days.length + 'D'
      : 'AI CONCEPTS · ' + state.artifacts.length + ' ENTRIES';
  });
})();
