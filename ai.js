/* ai.js — 상단 오늘의 소식 + 하단 기술 문서
 *
 * 데이터는 두 곳에서 읽는다. 한쪽이 없어도 다른 쪽은 그대로 보인다.
 *   data/news.json       archive/*.md 에서 생성된 날짜별 뉴스
 *   data/artifacts.json  catalog.py 에서 생성된 기술 문서 목록
 */
(function () {
  'use strict';

  var state = {
    days: [], cur: 0,
    artifacts: [], stages: [], tags: [],
    /* 도메인은 문서마다 하나뿐이라 하나만 고른다(또는 전체).
       주제는 여러 개가 붙으므로 AND 로 좁힌다 — "vision 이면서 on-device" 같은 요구. */
    domain: null,
    topics: []
  };

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

  /* 문서 행에 붙는 태그 표시.
     지금 고른 태그는 강조해, 왜 이 문서가 걸렸는지 바로 보이게 한다. */
  function tagChips(tags) {
    if (!tags || !tags.length) return '';
    var byId = {};
    state.tags.forEach(function (t) { byId[t.id] = t; });
    var html = tags.map(function (id) {
      var t = byId[id];
      if (!t) return '';
      var on = (state.domain === id) || state.topics.indexOf(id) >= 0;
      return '<span class="dtag' + (on ? ' on' : '') + '">' + esc(t.name) + '</span>';
    }).join('');
    return html ? '<span class="doc-tags">' + html + '</span>' : '';
  }

  /* 지금 필터를 통과하는 문서들 */
  function visibleDocs() {
    return state.artifacts.filter(function (a) {
      var tags = a.tags || [];
      if (state.domain && tags.indexOf(state.domain) < 0) return false;
      for (var i = 0; i < state.topics.length; i++) {
        if (tags.indexOf(state.topics[i]) < 0) return false;
      }
      return true;
    });
  }

  /* 어떤 태그를 지금 더 누를 수 있는지 미리 센다.
     0편이 될 버튼을 누르게 두면 빈 화면만 나와 답답하다. */
  function countWith(tagId, group) {
    return state.artifacts.filter(function (a) {
      var tags = a.tags || [];
      if (tags.indexOf(tagId) < 0) return false;
      if (group !== 'domain' && state.domain && tags.indexOf(state.domain) < 0) return false;
      for (var i = 0; i < state.topics.length; i++) {
        if (state.topics[i] !== tagId && tags.indexOf(state.topics[i]) < 0) return false;
      }
      return true;
    }).length;
  }

  function renderFilters() {
    var box = document.getElementById('filters');
    if (!state.tags.length) { box.innerHTML = ''; return; }

    function group(g, label) {
      var tags = state.tags.filter(function (t) { return t.group === g; });
      if (!tags.length) return '';
      return '<div class="frow">' +
        '<span class="flabel">' + label + '</span>' +
        tags.map(function (t) {
          var on = (g === 'domain')
            ? state.domain === t.id
            : state.topics.indexOf(t.id) >= 0;
          var n = countWith(t.id, g);
          return '<button class="chip' + (on ? ' on' : '') + (!n && !on ? ' off' : '') +
              '" data-g="' + g + '" data-id="' + esc(t.id) + '"' +
              (t.desc ? ' title="' + esc(t.desc) + '"' : '') +
              ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
            esc(t.name) + '<span class="n">' + n + '</span>' +
          '</button>';
        }).join('') +
      '</div>';
    }

    var any = state.domain || state.topics.length;
    box.innerHTML = group('domain', '분야') + group('topic', '주제') +
      (any ? '<button class="chip clear" id="clear">필터 해제</button>' : '');

    Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (el) {
      el.addEventListener('click', function () {
        if (el.id === 'clear') { state.domain = null; state.topics = []; }
        else if (el.dataset.g === 'domain') {
          state.domain = (state.domain === el.dataset.id) ? null : el.dataset.id;
        } else {
          var i = state.topics.indexOf(el.dataset.id);
          if (i >= 0) state.topics.splice(i, 1); else state.topics.push(el.dataset.id);
        }
        renderFilters();
        renderDocs();
      });
    });
  }

  function renderDocs() {
    var body = document.getElementById('docs-body');
    var list = visibleDocs();

    if (!state.artifacts.length) {
      body.innerHTML = '<div class="empty">등록된 기술 문서가 없습니다.</div>';
      return;
    }

    var filtered = state.domain || state.topics.length;
    document.getElementById('docs-meta').textContent = filtered
      ? list.length + '편 / 전체 ' + state.artifacts.length + '편'
      : state.artifacts.length + '편 · ' + state.stages.length + '단계';

    if (!list.length) {
      body.innerHTML = '<div class="empty">고른 조건에 맞는 문서가 없습니다.<br>' +
        '태그를 하나 줄여 보세요.</div>';
      return;
    }

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
          tagChips(a.tags) +
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
    state.tags = (res[1] && res[1].tags) || [];

    renderNews();
    renderDays();
    renderFilters();
    renderDocs();

    var foot = document.getElementById('foot');
    foot.textContent = state.days.length
      ? 'AI CONCEPTS · ' + state.artifacts.length + ' ENTRIES · NEWS ' + state.days.length + 'D'
      : 'AI CONCEPTS · ' + state.artifacts.length + ' ENTRIES';
  });
})();
