(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  var colors = ['#8cbcff', '#65d9bb', '#bddb65', '#e8b86c', '#f19bbb', '#b7a1fb', '#f3dc99', '#78c9d5', '#cfb49d'];
  var data, selected = new Set(), active = 'terminal';
  var metric = function () { return data.benchmarks.find(function (b) { return b.id === active; }); };
  var model = function (id) { return data.models.find(function (m) { return m.id === id; }); };
  var result = function (id, effort) { return data.results.find(function (r) { return r.model === id && r.effort === effort; }); };
  var visible = function () { return data.models.filter(function (m) { return (!m.legacy || $('show-legacy').checked) && selected.has(m.id); }); };
  var format = function (v, b) { return v == null ? '미공개' : v.toFixed(b.unit === 'Elo' ? 0 : 1) + (b.unit === '%' ? '%' : ' ' + b.unit); };
  var money = function (v) { return v == null ? '비용 미공개' : '$' + v.toFixed(v < 0.01 ? 4 : 2) + ' / 작업'; };
  var color = function (id) { return colors[data.models.findIndex(function (m) { return m.id === id; })]; };
  var options = function (values, chosen) { return values.map(function (v) { return '<option value="' + esc(v.id) + '"' + (v.id === chosen ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join(''); };
  var scoreCell = function (r, b) { var s = r.scores[b.id]; return '<strong>' + esc(format(s.score, b)) + '</strong><small>' + esc(s.score == null ? '해당 설정의 공개 결과 없음' : money(s.cost)) + '</small>'; };
  function renderPicker() {
    $('model-options').innerHTML = data.models.filter(function (m) { return !m.legacy || $('show-legacy').checked; }).map(function (m) {
      return '<label style="--model-color:' + color(m.id) + '"><input type="checkbox" value="' + esc(m.id) + '"' + (selected.has(m.id) ? ' checked' : '') + '><span class="model-dot" aria-hidden="true"></span>' + esc(m.name) + '</label>';
    }).join('');
    $('model-options').querySelectorAll('input').forEach(function (input) { input.addEventListener('change', function () { if (this.checked) selected.add(this.value); else selected.delete(this.value); renderMetric(); }); });
  }
  function renderMetric() {
    var b = metric();
    $('metric-name').textContent = b.name;
    $('benchmark-desc').textContent = b.description;
    $('metric-condition').textContent = '높을수록 좋음 · ' + b.unit + ' · ' + b.harness + (b.status === 'under-review' ? ' · 잠정 결과 (Under review)' : '');
    $('benchmark-source').href = b.source; $('methodology-source').href = b.methodology;
    renderRecommendations(b); renderChart(b); renderMatrix(b); renderHead();
  }
  function renderRecommendations(b) {
    var ids = new Set(visible().map(function (m) { return m.id; }));
    var rows = data.results.filter(function (r) { return ids.has(r.model) && r.scores[b.id].score != null; });
    if (!rows.length) { $('recommendations').innerHTML = '<div class="empty">비교할 모델을 선택하세요. 공개 결과가 없는 평가에서는 다른 벤치마크를 선택할 수 있습니다.</div>'; return; }
    rows.sort(function (a, c) { return c.scores[b.id].score - a.scores[b.id].score; });
    var best = rows[0], tolerance = b.unit === '%' ? 5 : b.unit === 'Elo' ? 50 : 3;
    var close = rows.filter(function (r) { return r.scores[b.id].score >= best.scores[b.id].score - tolerance && r.scores[b.id].cost != null; });
    close.sort(function (a, c) { return a.scores[b.id].cost - c.scores[b.id].cost; });
    var cheap = close[0];
    var cards = [{label: '공개 최고 점수', row: best, text: '선택한 모델·설정 중 최고 관측값. 동점·작은 차이는 우열로 단정하지 않습니다.'}];
    if (cheap) cards.push({label: '성능을 유지하며 비용 줄이기', row: cheap, text: '최고 점수에서 ' + tolerance + (b.unit === '%' ? '%p' : b.unit === 'Elo' ? ' Elo' : '점') + ' 이내인 설정 중 API 비용 최소. 이 범위는 선택 가이드의 기준이며 오차 범위가 아닙니다.'});
    $('recommendations').innerHTML = cards.map(function (c) { var m = model(c.row.model), s = c.row.scores[b.id]; return '<article><span class="guide-label">' + c.label + '</span><h3>' + esc(m.name) + ' <span>' + esc(c.row.effort) + '</span></h3><div class="guide-score">' + esc(format(s.score, b)) + ' <small>' + esc(money(s.cost)) + '</small></div><p>' + esc(c.text) + '</p><a href="' + esc(c.row.source) + '" target="_blank" rel="noopener noreferrer">조건·원문 ↗</a></article>'; }).join('');
  }
  function renderChart(b) {
    var models = visible(), values = [];
    models.forEach(function (m) { data.efforts.forEach(function (e) { var s = result(m.id, e).scores[b.id].score; if (s != null) values.push(s); }); });
    if (!values.length) { $('effort-chart').innerHTML = '<p class="empty">표시할 공개 결과가 없습니다.</p>'; $('chart-legend').innerHTML = ''; return; }
    var top = b.unit === '%' ? 100 : b.unit === 'Elo' ? Math.ceil(Math.max.apply(null, values) / 250) * 250 : Math.ceil(Math.max.apply(null, values) / 10) * 10;
    top = top || 100;
    var x = function (i) { return 75 + i * 145; }, y = function (v) { return 265 - (v / top) * 225; };
    var svg = '<svg viewBox="0 0 720 315" role="img" aria-labelledby="curve-title curve-desc"><title id="curve-title">' + esc(b.name) + ' effort별 점수</title><desc id="curve-desc">0부터 ' + top + '까지의 점수. 같은 모델의 공개 관측값만 연결합니다. 정확한 점수와 비용은 다음 표에 있습니다.</desc>';
    for (var i = 0; i <= 4; i++) { var v = top * i / 4, py = y(v); svg += '<line x1="65" x2="665" y1="' + py + '" y2="' + py + '" class="chart-grid"/><text x="55" y="' + (py + 4) + '" text-anchor="end">' + (b.unit === 'Elo' ? v.toFixed(0) : v.toFixed(1)) + '</text>'; }
    data.efforts.forEach(function (e, i) { svg += '<text x="' + x(i) + '" y="295" text-anchor="middle">' + esc(e) + '</text>'; });
    models.forEach(function (m) {
      var previous = null;
      data.efforts.forEach(function (e, i) {
        var value = result(m.id, e).scores[b.id].score;
        if (value == null) { previous = null; return; }
        var point = {x: x(i), y: y(value)};
        if (previous) svg += '<line x1="' + previous.x + '" y1="' + previous.y + '" x2="' + point.x + '" y2="' + point.y + '" stroke="' + color(m.id) + '" stroke-width="2.4"' + (m.product === 'Codex' ? ' stroke-dasharray="6 4"' : '') + '/>';
        svg += '<circle cx="' + point.x + '" cy="' + point.y + '" r="4" fill="' + color(m.id) + '"><title>' + esc(m.name + ' / ' + e + ': ' + format(value, b)) + '</title></circle>';
        previous = point;
      });
    });
    $('effort-chart').innerHTML = svg + '</svg>';
    $('chart-legend').innerHTML = models.map(function (m) { return '<span><i style="background:' + color(m.id) + '"></i>' + esc(m.name) + '</span>'; }).join('') + '<span class="legend-note">Codex 계열: 점선 · Claude 계열: 실선</span>';
  }
  function renderMatrix(b) {
    var models = visible();
    $('matrix-caption').textContent = b.name + ' · 점수 / API 작업당 비용';
    $('matrix-head').innerHTML = '<th scope="col">모델 / 측정 조건</th>' + data.efforts.map(function (e) { return '<th scope="col">' + esc(e) + '</th>'; }).join('');
    $('matrix-body').innerHTML = models.length ? models.map(function (m) {
      return '<tr><th scope="row"><span style="color:' + color(m.id) + '">' + esc(m.name) + '</span><small>' + esc(result(m.id, 'high').fallback === '없음' ? m.product + ' 계열 · 모델 API 평가' : '모델 API · Default Fallback') + '</small></th>' + data.efforts.map(function (e) { var r = result(m.id, e); return '<td' + (r.scores[b.id].score == null ? ' class="unpublished"' : '') + '><button type="button" data-model="' + esc(m.id) + '" data-effort="' + esc(e) + '" aria-label="' + esc(m.name + ' ' + e + ' 직접 비교에 적용') + '">' + scoreCell(r, b) + '</button></td>'; }).join('') + '</tr>';
    }).join('') : '<tr><td colspan="6" class="empty">비교할 모델을 선택하세요.</td></tr>';
    $('matrix-body').querySelectorAll('button').forEach(function (button) { button.addEventListener('click', function () { var side = model(this.dataset.model).product === 'Codex' ? 'codex' : 'claude'; $(side + '-model').value = this.dataset.model; $(side + '-effort').value = this.dataset.effort; renderHead(); $('compare-title').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'}); }); });
  }
  function renderHeadControls() {
    ['codex', 'claude'].forEach(function (side) {
      var previous = $(side + '-model').value;
      var list = data.models.filter(function (m) { return m.product === (side === 'codex' ? 'Codex' : 'Claude') && (!m.legacy || $('show-legacy').checked); });
      var initial = side === 'codex' ? 'gpt-6-1-sol' : 'claude-opus-5-5';
      $(side + '-model').innerHTML = options(list, list.some(function (m) { return m.id === previous; }) ? previous : initial);
      if (!$(side + '-effort').options.length) $(side + '-effort').innerHTML = options(data.efforts.map(function (e) { return {id: e, name: e}; }), 'high');
    });
  }
  function renderHead() {
    var a = result($('codex-model').value, $('codex-effort').value), c = result($('claude-model').value, $('claude-effort').value);
    if (!a || !c) return;
    $('codex-heading').textContent = model(a.model).name + ' / ' + a.effort;
    $('claude-heading').textContent = model(c.model).name + ' / ' + c.effort;
    $('head-summary').innerHTML = '<span><strong>Codex 계열</strong> ' + esc(a.source_label) + ' · ' + esc(a.observed) + ' <a href="' + esc(a.source) + '" target="_blank" rel="noopener noreferrer">원문 ↗</a></span><span><strong>Claude 계열</strong> ' + esc(c.source_label) + ' · ' + esc(c.observed) + ' <a href="' + esc(c.source) + '" target="_blank" rel="noopener noreferrer">원문 ↗</a></span>';
    $('head-body').innerHTML = data.benchmarks.map(function (b) {
      var sa = a.scores[b.id].score, sc = c.scores[b.id].score;
      var delta = sa == null || sc == null ? '비교 자료 없음' : (sa - sc > 0 ? '+' : '') + (sa - sc).toFixed(b.unit === 'Elo' ? 0 : 1) + (b.unit === '%' ? '%p' : ' ' + b.unit);
      return '<tr' + (b.id === active ? ' class="active-metric"' : '') + '><th scope="row"><button type="button" data-benchmark="' + b.id + '">' + esc(b.name) + '</button><small>' + esc(b.group + ' · ' + b.harness) + '</small></th><td>' + scoreCell(a, b) + '</td><td>' + scoreCell(c, b) + '</td><td class="delta">' + esc(delta) + '</td></tr>';
    }).join('');
    $('head-body').querySelectorAll('button').forEach(function (button) { button.addEventListener('click', function () { active = this.dataset.benchmark; $('benchmark-select').value = active; renderMetric(); $('benchmark-title').scrollIntoView({block: 'start'}); }); });
  }
  fetch('data/benchmarks.json', {cache: 'no-store'}).then(function (r) { if (!r.ok) throw Error(r.status); return r.json(); }).then(function (snapshot) {
    if (snapshot.schema_version !== 2) throw Error('unsupported snapshot');
    data = snapshot;
    data.models.filter(function (m) { return !m.legacy; }).forEach(function (m) { selected.add(m.id); });
    $('as-of').textContent = '원문 확인 · ' + data.as_of + ' UTC';
    $('coverage').textContent = data.models.length + '개 모델 · ' + data.efforts.length + '개 effort · ' + data.benchmarks.length + '개 평가';
    var groups = Array.from(new Set(data.benchmarks.map(function (b) { return b.group; })));
    $('benchmark-select').innerHTML = groups.map(function (g) { return '<optgroup label="' + esc(g) + '">' + options(data.benchmarks.filter(function (b) { return b.group === g; }), active) + '</optgroup>'; }).join('');
    $('benchmark-note').textContent = data.note;
    $('benchmark-history').innerHTML = data.history.slice().reverse().map(function (h) { return '<div class="history-row"><time datetime="' + esc(h.date) + '">' + esc(h.date) + '</time><span>' + esc(h.summary) + '</span></div>'; }).join('');
    $('historical-body').innerHTML = (data.historical || []).map(function (h) { return '<h3>' + esc(h.benchmark.name) + '</h3><p>' + esc(h.note) + '</p><ul>' + h.results.map(function (r) { return '<li>' + esc(r.agent + ' / ' + r.model + ' / ' + r.effort + ' · ' + r.score + '% (' + r.uncertainty + ') · 확인 ' + r.observed) + ' <a href="' + esc(r.source) + '" target="_blank" rel="noopener noreferrer">출처 ↗</a></li>'; }).join('') + '</ul>'; }).join('');
    renderHeadControls(); renderPicker(); renderMetric();
    $('benchmark-select').addEventListener('change', function () { active = this.value; renderMetric(); });
    $('show-legacy').addEventListener('change', function () { if (this.checked) data.models.filter(function (m) { return m.legacy; }).forEach(function (m) { selected.add(m.id); }); renderHeadControls(); renderPicker(); renderMetric(); });
    ['codex-model', 'codex-effort', 'claude-model', 'claude-effort'].forEach(function (id) { $(id).addEventListener('change', renderHead); });
  }).catch(function () { $('as-of').textContent = '데이터 확인 필요'; $('load-error').hidden = false; $('load-error').textContent = '벤치마크 데이터를 불러오지 못했습니다. 새로고침해 주세요.'; });
})();
