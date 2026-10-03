
// v0.4.1 therapist profile builder + treatment menu
(() => {
 const form=document.getElementById('therapistBuilder'); if(!form) return;
 const steps=[...document.querySelectorAll('.build-step')], dots=[...document.querySelectorAll('.step-track span')];
 const next=document.getElementById('nextStep'), back=document.getElementById('backStep'); let current=0;
 const selectedBox=document.getElementById('selectedTreatments');
 let menu=[];

 function renderMenu(){
   if(!selectedBox) return;
   if(!menu.length){selectedBox.innerHTML='<div class="empty-menu">No treatments added yet.</div>';return;}
   selectedBox.innerHTML=menu.map((x,i)=>`<div class="menu-treatment">
     <div class="menu-treatment-head"><b>${x.name}</b><button type="button" class="remove-treatment" data-remove="${i}">Remove</button></div>
     <div class="duration-row"><label>Duration<select data-duration="${i}"><option>30 min</option><option selected>60 min</option><option>75 min</option><option>90 min</option><option>120 min</option></select></label><label>Price<input data-price="${i}" placeholder="£55" value="${x.price||''}"></label></div>
     <button type="button" class="add-duration" data-add-duration="${i}">+ Add another duration / price</button>
     <div class="extra-durations">${(x.extra||[]).map((d,j)=>`<div class="duration-row extra"><label>Duration<select data-extra-duration="${i}:${j}"><option>30 min</option><option>45 min</option><option selected>60 min</option><option>75 min</option><option>90 min</option><option>120 min</option></select></label><label>Price<input data-extra-price="${i}:${j}" placeholder="£75" value="${d.price||''}"></label><button type="button" data-remove-duration="${i}:${j}">×</button></div>`).join('')}</div>
   </div>`).join('');
 }
 function addTreatment(name){name=name.trim();if(!name||menu.some(x=>x.name.toLowerCase()===name.toLowerCase()))return;menu.push({name,price:'',extra:[]});renderMenu();save();}
 document.querySelectorAll('[data-treatment]').forEach(b=>b.onclick=()=>addTreatment(b.dataset.treatment));
 const addCustom=document.getElementById('addCustomTreatment'), custom=document.getElementById('customTreatment');
 if(addCustom)addCustom.onclick=()=>{addTreatment(custom.value);custom.value=''};
 const search=document.getElementById('treatmentSearch');
 if(search)search.oninput=()=>{const q=search.value.toLowerCase();document.querySelectorAll('#treatmentLibrary [data-treatment]').forEach(b=>b.style.display=b.textContent.toLowerCase().includes(q)?'':'none');document.querySelectorAll('#treatmentLibrary section').forEach(s=>s.style.display=[...s.querySelectorAll('[data-treatment]')].some(b=>b.style.display!=='none')?'':'none')};
 if(selectedBox)selectedBox.onclick=e=>{
   let b=e.target.closest('[data-remove]');if(b){menu.splice(+b.dataset.remove,1);renderMenu();save();return}
   b=e.target.closest('[data-add-duration]');if(b){menu[+b.dataset.addDuration].extra.push({price:''});renderMenu();save();return}
   b=e.target.closest('[data-remove-duration]');if(b){let[i,j]=b.dataset.removeDuration.split(':').map(Number);menu[i].extra.splice(j,1);renderMenu();save()}
 };
 if(selectedBox)selectedBox.oninput=e=>{
   if(e.target.dataset.price!==undefined)menu[+e.target.dataset.price].price=e.target.value;
   if(e.target.dataset.extraPrice){let[i,j]=e.target.dataset.extraPrice.split(':').map(Number);menu[i].extra[j].price=e.target.value}
   save();
 };
 function preview(){const d=new FormData(form);pvName.textContent=d.get('displayName')||d.get('business')||'Your name';pvPlace.textContent=[d.get('city'),d.get('postcode')].filter(Boolean).join(' · ')||'Your location';pvAbout.textContent=d.get('about')||'Your introduction will appear here.';pvTreatments.innerHTML=menu.slice(0,8).map(x=>`<span>${x.name}</span>`).join('');pvPrice.textContent=menu.length?`${menu.length} treatment${menu.length===1?'':'s'} listed`:''}
 function show(){steps.forEach((x,i)=>x.classList.toggle('active',i===current));dots.forEach((x,i)=>x.classList.toggle('active',i<=current));back.disabled=current===0;next.textContent=current===steps.length-1?'Submit for review':'Continue';if(current===3)preview()}
 function save(){const o={};new FormData(form).forEach((v,k)=>o[k]=o[k]?[].concat(o[k],v):v);o.treatmentMenu=menu;localStorage.setItem('mmBuilderDraft',JSON.stringify(o))}
 next.onclick=()=>{save();if(current<steps.length-1){current++;show()}else alert('Prototype complete! In the live version this would send the profile to your MassageMatch admin review queue. Nothing has been published.')};
 back.onclick=()=>{if(current){current--;show()}};form.addEventListener('input',save);renderMenu();show();
})();
