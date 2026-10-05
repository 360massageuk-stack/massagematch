

(() => {
  const form=document.getElementById('therapistBuilder'); if(!form) return;
  const steps=[...document.querySelectorAll('.build-step')], dots=[...document.querySelectorAll('.step-track span')];
  const next=document.getElementById('nextStep'), back=document.getElementById('backStep'); let current=0;
  const selected=document.getElementById('selectedTreatments');
  const photoInput=document.getElementById('profilePhotos'), photoGallery=document.getElementById('photoGallery'), photoStatus=document.getElementById('photoStatus');
  let profilePhotos=[], mainPhotoId=null;
  const photoUrl=p=>p?.url||null;
  function renderPhotos(){
    if(!photoGallery) return;
    photoGallery.innerHTML='';
    profilePhotos.forEach(p=>{const card=document.createElement('div');card.className='photo-card'+(p.id===mainPhotoId?' main':'');card.innerHTML=`${p.id===mainPhotoId?'<span class="main-badge">MAIN</span>':''}<img alt="Therapist photo preview"><div class="photo-actions"><button type="button" class="make-main">Make main</button><button type="button" class="remove-photo">Remove</button></div>`;card.querySelector('img').src=p.url;card.querySelector('.make-main').onclick=()=>{mainPhotoId=p.id;renderPhotos();};card.querySelector('.remove-photo').onclick=()=>{URL.revokeObjectURL(p.url);profilePhotos=profilePhotos.filter(x=>x.id!==p.id);if(mainPhotoId===p.id)mainPhotoId=profilePhotos[0]?.id||null;renderPhotos();};photoGallery.appendChild(card)});
    if(photoStatus) photoStatus.textContent=profilePhotos.length?`${profilePhotos.length} of 5 photos selected. ${profilePhotos.length<5?'You can add '+(5-profilePhotos.length)+' more.':'Maximum reached.'}`:'No photos selected yet.';
    const main=profilePhotos.find(p=>p.id===mainPhotoId), pv=document.getElementById('pvPhoto');if(pv&&main)pv.style.backgroundImage=`url("${main.url}")`;
  }
  photoInput?.addEventListener('change',()=>{const files=[...photoInput.files];const allowed=['image/jpeg','image/png','image/webp'];for(const file of files){if(profilePhotos.length>=5)break;if(!allowed.includes(file.type))continue;if(file.size>10*1024*1024)continue;const item={id:(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()),url:URL.createObjectURL(file),name:file.name};profilePhotos.push(item);if(!mainPhotoId)mainPhotoId=item.id;}photoInput.value='';renderPhotos();});
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
    renderPhotos();
    const d=new FormData(form);document.getElementById('pvName').textContent=d.get('displayName')||d.get('business')||'Your name';document.getElementById('pvPlace').textContent=[d.get('city'),d.get('postcode')].filter(Boolean).join(' · ')||'Your location';document.getElementById('pvAbout').textContent=d.get('about')||'Your introduction will appear here.';
    const rows=[...selected.querySelectorAll('[data-name]')];document.getElementById('pvTreatments').innerHTML=rows.map(r=>`<span>${esc(r.dataset.name)}</span>`).join('');
    const prices=[];const menu=[];rows.forEach(r=>{const opts=[];r.querySelectorAll('.duration-option').forEach(o=>{if(o.querySelector('.duration-toggle').checked){const mins=o.querySelector('.duration-toggle').dataset.minutes;const p=+o.querySelector('.duration-price').value;if(p>0){prices.push(p);opts.push(`${mins} min £${p}`)}}});if(opts.length)menu.push(`<div class="menu-service"><strong>${esc(r.dataset.name)}</strong><span>${opts.join(' · ')}</span></div>`)});document.getElementById('pvPrice').textContent=prices.length?`Treatments from £${Math.min(...prices)}`:'';document.getElementById('pvMenu').innerHTML=menu.length?`<h3>Treatment menu</h3>${menu.join('')}`:'';
    const settings=d.getAll('setting');const area=d.get('areas');const bits=[];if(settings.length)bits.push(settings.join(' · '));if(mobile?.checked&&area)bits.push(`Areas covered: ${area}`);const pvPractice=document.getElementById('pvPractice');pvPractice.textContent=bits.join(' | ');pvPractice.hidden=!bits.length;document.getElementById('pvBadges').innerHTML=settings.map(x=>`<span>${esc(x)}</span>`).join('');
    const phone=d.get('phone'),email=d.get('email'),website=d.get('website');const contacts=[];if(phone)contacts.push(`<span>☎ ${esc(phone)}</span>`);if(email)contacts.push(`<span>✉ ${esc(email)}</span>`);if(website)contacts.push(`<span>↗ ${esc(website)}</span>`);const contact=document.getElementById('pvContact');document.getElementById('pvContactLinks').innerHTML=contacts.join('');contact.hidden=!contacts.length;
  }
 const saveProfile = async () => {
  const d = new FormData(form);

  next.disabled = true;
  next.textContent = 'Submitting...';

  try {
    let { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { data: authData, error: authError } =
        await supabase.auth.signInAnonymously();

      if (authError) throw authError;
      user = authData.user;
    }

    const treatments = [...selected.querySelectorAll('[data-name]')]
      .map(row => ({
        name: row.dataset.name,
        durations: [...row.querySelectorAll('.duration-option')]
          .filter(option =>
            option.querySelector('.duration-toggle').checked
          )
          .map(option => ({
            minutes: Number(
              option.querySelector('.duration-toggle').dataset.minutes
            ),
            price: Number(
              option.querySelector('.duration-price').value
            )
          }))
          .filter(option => option.price > 0)
      }))
      .filter(treatment => treatment.durations.length);

    const profile = {
      user_id: user.id,
      display_name: d.get('displayName'),
      business_name: d.get('business'),
      bio: d.get('about'),
      phone: d.get('phone'),
      email: d.get('email'),
      website: d.get('website'),
      location: [d.get('city'), d.get('postcode')]
        .filter(Boolean)
        .join(' · '),
      areas: d.get('areas'),
      settings: d.getAll('setting').join(' · '),
      treatments: treatments,
      mobile: d.getAll('setting').includes('Mobile visits'),
      mobile_areas: d.getAll('setting').includes('Mobile visits')
        ? (d.get('areas') || '')
        : '',
      approved: false,
      featured: false
    };

    const { error } = await supabase
      .from('profiles')
      .insert(profile);

    if (error) throw error;

    next.textContent = 'Submitted for review';

    const msg = document.createElement('div');
    msg.className = 'submit-note';
    msg.textContent =
      'Thank you — your MassageMatch profile has been submitted for review.';

    if (!next.parentElement.querySelector('.submit-note')) {
      next.parentElement.appendChild(msg);
    }

  } catch (error) {
    console.error(error);
    next.disabled = false;
    next.textContent = 'Submit for review';
    alert('Could not submit profile: ' + error.message);
  }
};

next.onclick = async () => {
  if (current < steps.length - 1) {
    current++;
    renderStep();
  } else {
    await saveProfile();
  }
};

back.onclick = () => {
  if (current > 0) {
    current--;
    renderStep();
  }
};

renderStep();

})();
