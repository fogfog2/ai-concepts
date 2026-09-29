(function(){
  'use strict';
  var sheet=document.querySelector('.sheet');if(!sheet)return;
  var sections=Array.prototype.slice.call(sheet.querySelectorAll(':scope > section > h2'));
  if(sections.length){
    var nav=document.createElement('nav');nav.className='doc-toc';nav.setAttribute('aria-label','\uC774 \uAE00\uC758 \uBAA9\uCC28');
    var label=document.createElement('span');label.textContent='\uC774 \uAE00\uC758 \uBAA9\uCC28';nav.appendChild(label);
    var list=document.createElement('div');list.className='doc-toc-links';
    sections.forEach(function(h,i){var id='section-'+String(i+1).padStart(2,'0');h.id=id;var a=document.createElement('a');a.href='#'+id;var clone=h.cloneNode(true);clone.querySelectorAll('.n').forEach(function(n){n.remove()});a.textContent=String(i+1).padStart(2,'0')+'  '+clone.textContent.trim();list.appendChild(a)});
    nav.appendChild(list);var spec=sheet.querySelector('.spec');if(spec)spec.insertAdjacentElement('afterend',nav);else sheet.insertBefore(nav,sheet.firstChild);
  }
  var slug=location.pathname.split('/').pop().replace(/\.html$/,'');
  fetch('../data/artifacts.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error(r.status);return r.json()}).then(function(data){
    var items=data.items||[];var idx=items.findIndex(function(d){return d.slug===slug});if(idx<0)return;
    var nav=document.createElement('nav');nav.className='doc-neighbors';nav.setAttribute('aria-label','\uC774\uC5B4 \uC77D\uC744 \uBB38\uC11C');
    var prev=items[idx-1],next=items[idx+1];
    function link(d,word){var a=document.createElement('a');a.href=/^https?:\/\//.test(d.url)?d.url:'../'+d.url;a.innerHTML='<small>'+word+'</small><strong></strong>';a.querySelector('strong').textContent=d.title;return a}
    if(prev)nav.appendChild(link(prev,'\u2190 \uC774\uC804 \uBB38\uC11C'));if(next)nav.appendChild(link(next,'\uB2E4\uC74C \uBB38\uC11C \u2192'));
    var footer=sheet.querySelector(':scope > footer');if(footer)footer.insertAdjacentElement('beforebegin',nav);else sheet.appendChild(nav);
  }).catch(function(){/* 목차는 데이터 연결과 독립적으로 표시한다. */});
})();
