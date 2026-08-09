/* ai/ai.js - 데일리 AI 뉴스 + 내가 만든 AI 기술 문서(artifact) 뷰어
 *
 * 데이터는 두 곳에서 읽는다. 둘 다 없어도 페이지는 안내문을 띄우고 살아 있는다.
 *   data/index.json      날짜 목록  -> data/YYYY-MM-DD.json  하루치 뉴스
 *   data/artifacts.json  claude.ai 에 만들어 둔 기술 문서 링크
 *
 * 서버(public/)와 앱 내장 사본 어느 쪽에서 열려도 같은 상대경로로 동작한다.
 */
(function () {
  'use strict';

  var feed = document.getElementById('feed');
  var tabs = document.getElementById('tabs');
  var sub = document.getElementById('sub');
  var foot = document.getElementById('foot');

  var state = { dates: [], artifacts: [], stages: [], view: null };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 링크는 외부(claude.ai)로 나가므로 안전 속성을 붙인다.
     앱 WebView 에서도 새 창 없이 그대로 열린다. */
  function link(url, text, cls) {
    return '<a class="' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(text) + '</a>';
  }

  function getJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  /* ---------- 렌더 ---------- */

  function renderNews(day) {
    if (!day || !day.items || !day.items.length) {
      feed.innerHTML = '<div class="empty">이 날짜의 항목이 없습니다.</div>';
      return;
    }
    feed.innerHTML = day.items.map(function (it) {
      var facts = (it.facts || []).map(function (f) {
        return '<li>' + esc(f) + '</li>';
      }).join('');
      var host = '';
      try { host = it.url ? new URL(it.url).hostname.replace(/^www\./, '') : ''; } catch (e) { host = it.source || ''; }

      return '<article class="item">' +
        '<h2>' + esc(it.title) + '</h2>' +
        '<div class="meta">' +
          (it.category ? '<span class="tag cat-' + esc(it.category) + '">' + esc(it.category) + '</span>' : '') +
          (it.url ? link(it.url, host || '원문', 'src') : '') +
          (it.unverified ? '<span class="tag">미확인</span>' : '') +
        '</div>' +
        (facts ? '<ul>' + facts + '</ul>' : '') +
        (it.takeaway ? '<div class="takeaway"><b>그래서</b> · ' + esc(it.takeaway) + '</div>' : '') +
      '</article>';
    }).join('');
  }

  /* 기술문서는 '파이프라인 단계'로 묶어 보여준다.
     모델이 만들어져 서비스되기까지의 순서라, 목록 순서 자체가 읽는 순서가 된다. */
  function renderArtifacts() {
    var list = state.artifacts;
    if (!list.length) {
      feed.innerHTML = '<div class="empty">등록된 기술 문서가 없습니다.<br>' +
        '<code>data/artifacts.json</code> 에 추가하세요.</div>';
      return;
    }

    /* 단계 정의가 없으면(구버전 데이터) 한 덩어리로 떨어뜨린다 */
    var stages = state.stages.length
      ? state.stages
      : [{ id: null, no: '', name: '기술 문서', tagline: '', desc: '' }];

    feed.innerHTML = stages.map(function (st) {
      var items = list.filter(function (a) {
        return st.id === null || a.stage === st.id;
      });
      if (!items.length) return '';

      var cards = items.map(function (a) {
        /* 내부 문서는 같은 탭에서, 외부 링크만 새 탭으로 연다. */
        var ext = !a.local;
        return '<a class="doc" href="' + esc(a.url) + '"' +
            (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
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
          '<div>' +
            '<h2>' + esc(st.name) +
              (st.tagline ? ' <em>' + esc(st.tagline) + '</em>' : '') +
            '</h2>' +
            (st.desc ? '<p>' + esc(st.desc) + '</p>' : '') +
          '</div>' +
          '<span class="stage-count">' + items.length + '</span>' +
        '</div>' +
        '<div class="doc-list">' + cards + '</div>' +
      '</section>';
    }).join('');
  }

  function show(view) {
    state.view = view;
    Array.prototype.forEach.call(tabs.children, function (el) {
      el.classList.toggle('on', el.dataset.view === view);
    });

    if (view === 'artifacts') {
      sub.textContent = 'AI 기술 문서 ' + state.artifacts.length + '편 · ' +
        state.stages.length + '단계로 정리';
      renderArtifacts();
      return;
    }
    sub.textContent = view + ' 뉴스';
    feed.innerHTML = '<div class="loading">불러오는 중…</div>';
    getJson('data/' + view + '.json')
      .then(renderNews)
      .catch(function () {
        feed.innerHTML = '<div class="empty">' + esc(view) + ' 리포트를 불러오지 못했습니다.</div>';
      });
  }

  function buildTabs() {
    var html = state.dates.slice(0, 14).map(function (d) {
      return '<div class="tab" data-view="' + esc(d) + '">' + esc(d.slice(5)) + '</div>';
    }).join('');
    if (state.artifacts.length) {
      html += '<div class="tab" data-view="artifacts">🧩 기술문서</div>';
    }
    tabs.innerHTML = html;
    Array.prototype.forEach.call(tabs.children, function (el) {
      el.addEventListener('click', function () { show(el.dataset.view); });
    });
  }

  /* ---------- 시작 ---------- */
  /* 뉴스와 기술문서는 서로 독립이다. 한쪽이 없어도 다른 쪽은 보여야 한다. */
  Promise.all([
    getJson('data/index.json').catch(function () { return { dates: [] }; }),
    getJson('data/artifacts.json').catch(function () { return { items: [] }; })
  ]).then(function (res) {
    state.dates = (res[0] && res[0].dates) || [];
    state.artifacts = (res[1] && res[1].items) || [];
    state.stages = (res[1] && res[1].stages) || [];

    if (!state.dates.length && !state.artifacts.length) {
      tabs.innerHTML = '';
      sub.textContent = '데이터 없음';
      feed.innerHTML = '<div class="empty">문서를 불러오지 못했습니다.<br>' +
        '잠시 후 다시 시도해 주세요.</div>';
      return;
    }

    buildTabs();
    /* 공개 사이트에서는 기술문서가 본체다. 뉴스가 있어도 문서를 먼저 보여준다. */
    show(state.artifacts.length ? 'artifacts' : state.dates[0]);
    foot.textContent = state.dates.length
      ? '기술문서 ' + state.artifacts.length + '편 · 뉴스 ' + state.dates.length + '일치'
      : '기술문서 ' + state.artifacts.length + '편';
  });
})();
