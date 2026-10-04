(() => {
  const form=document.getElementById('therapistBuilder'); if(!form) return;
  const steps=[...document.querySelectorAll('.build-step')], dots=[...document.querySelectorAll('.step-track span')];
  const next=document.getElementById('nextStep'), back=document.getElementById('backStep'); let current=0;
  const selected=document.getElementById('selectedTreatments');
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeSel=s=>window.CSS&&CSS.escape?CSS.escape(s):String(s).replace(/["\\]/g,'\\$&');
  function renderStep(){steps.forEach((x,i)=>x.classList.toggle('active',i===current));dots.forEach((x,i)=>x.classList.toggle('active',i<=current));back.disabled=current===0;next.textContent=current===steps.length-1?'Submit for review':'Continue';if(current===steps.length-1)preview();window.scrollTo({top:0,behavior:'smooth'});}
  function emptyIfNeeded(){if(!selected.querySelector('[data-name]'))selected.innerHTML='<div class="empty-menu">No treatments added yet.</div>';}
  function removeTreatment(name){selected.querySelector(`[data-name="${safeSel(name)}"]`)?.remove();document.querySelector(`[data-treatment="${safeSel(name)}"]`)?.classList.remove('selected');emptyIfNeeded();}
  function durationOption(name,mins,checked=false){return `<label class="duration-option"><input type="checkbox" class="duration-toggle" data-minutes="${mins}" ${checked?'checked':''}><span>${mins} min</span><span class="price-wrap">£ <input type="number" class="duration-price" min="0" step="1" placeholder="${mins===30?'35':mins===60?'60':'85'}" aria-label="${esc(name)} ${mins} minute price" ${checked?'':'disabled'}></span></label>`;}
  function addTreatment(name){
    name=(name||'').trim(); if(!name||selected.querySelector(`[data-name="${safeSel(name)}"]`))return;
    selected.querySelector('.empty-menu')?.remove();
    const row=document.createElement('div');row.className='treatment-row';row.dataset.name=name;
    row.innerHTML=`<div class="treatment-head"><b>${esc(name)}</b><button type="button" class="remove-treatment">Remove</button></div><div class="duration-grid">${durationOption(name,30)}${durationOption(name,60,true)}${durationOption(name,90)}</div>`;
    selected.appendChild(row);
    row.querySelector('.remove-treatment').onclick=()=>removeTreatment(name);
    row.querySelectorAll('.duration-toggle').forEach(cb=>cb.addEventListener('change',()=>{const p=cb.closest('.duration-option').querySelector('.duration-price');p.disabled=!cb.checked;if(cb.checked)p.focus();}));
  }
  document.querySelectorAll('[data-treatment]').forEach(b=>b.onclick=()=>{const name=b.dataset.treatment;if(b.classList.contains('selected'))removeTreatment(name);else{b.classList.add('selected');addTreatment(name);}});
  const add=document.getElementById('addCustomTreatment'); add.onclick=()=>{const i=document.getElementById('customTreatment');const name=i.value.trim();if(name){addTreatment(name);i.value='';}};
  const search=document.getElementById('treatmentSearch'); search.addEventListener('input',()=>{const q=search.value.toLowerCase();document.querySelectorAll('.treatment-library section').forEach(sec=>{let visible=0;sec.querySelectorAll('[data-treatment]').forEach(b=>{const show=b.textContent.toLowerCase().includes(q);b.style.display=show?'':'none';visible+=show?1:0});sec.style.display=visible?'':'none'})});
  const mobile=document.querySelector('input[name="setting"][value="Mobile visits"]');
  const mobileAreas=document.getElementById('mobileAreas');
  function syncMobile(){if(!mobile||!mobileAreas)return;mobileAreas.hidden=!mobile.checked;}
  mobile?.addEventListener('change',syncMobile);syncMobile();
  function preview(){
    const d=new FormData(form);document.getElementById('pvName').textContent=d.get('displayName')||d.get('business')||'Your name';document.getElementById('pvPlace').textContent=[d.get('city'),d.get('postcode')].filter(Boolean).join(' · ')||'Your location';document.getElementById('pvAbout').textContent=d.get('about')||'Your introduction will appear here.';
    const rows=[...selected.querySelectorAll('[data-name]')];document.getElementById('pvTreatments').innerHTML=rows.map(r=>`<span>${esc(r.dataset.name)}</span>`).join('');
    const prices=[];rows.forEach(r=>r.querySelectorAll('.duration-option').forEach(o=>{if(o.querySelector('.duration-toggle').checked){const p=+o.querySelector('.duration-price').value;if(p>0)prices.push(p);}}));document.getElementById('pvPrice').textContent=prices.length?`Treatments from £${Math.min(...prices)}`:'';
    const settings=d.getAll('setting');const area=d.get('areas');const bits=[];if(settings.length)bits.push(settings.join(' · '));if(mobile?.checked&&area)bits.push(`Areas covered: ${area}`);const pvPractice=document.getElementById('pvPractice');pvPractice.textContent=bits.join(' | ');pvPractice.hidden=!bits.length;
  }
  next.onclick=()=>{if(current<steps.length-1){current++;renderStep()}else{next.disabled=true;next.textContent='Ready for live system';if(!next.parentElement.querySelector('.submit-note')){const msg=document.createElement('div');msg.className='submit-note';msg.textContent='Prototype complete — your profile is ready for the future review system.';next.parentElement.appendChild(msg)}}};
  back.onclick=()=>{if(current>0){current--;renderStep()}};
  renderStep();
})();
