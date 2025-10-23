
let DRUGS=[], IMG={};
const STATE={days:'',filter:'ทั้งหมด',selected:{}};
const $=(q,el=document)=>el.querySelector(q);
const $$=(q,el=document)=>Array.from(el.querySelectorAll(q));

async function boot(){
  DRUGS = await fetch('drugs.json').then(r=>r.json());
  IMG   = await fetch('drug_image_map.json').then(r=>r.json());
  if(!Array.isArray(DRUGS)) DRUGS = Object.values(DRUGS);
  bindTop(); buildTabs(); renderCards(); renderSummary();
}
function bindTop(){
  $('#days').addEventListener('input',e=>{ STATE.days=e.target.value; computeAll(); });
  $$('#days-quick .chip').forEach(b=> b.addEventListener('click',()=>{ STATE.days=b.dataset.days; $('#days').value=STATE.days; computeAll(); }));
  $('#clear').addEventListener('click',()=>{ STATE.days=''; $('#days').value=''; STATE.selected={}; computeAll(true); });
  $('#printSummary').addEventListener('click',()=>window.print());
}
function buildTabs(){
  const groups=['ทั้งหมด','SABA','LAMA','SAMA+SABA','ICS','ICS+LABA','Nasal'];
  const tabs=$('#tabs'); tabs.innerHTML='';
  groups.forEach(g=>{
    const b=document.createElement('button'); b.className='tab'+(g===STATE.filter?' active':''); b.textContent=g;
    b.addEventListener('click',()=>{ STATE.filter=g; buildTabs(); renderCards(); });
    tabs.appendChild(b);
  });
}
function filtered(){ if(STATE.filter==='ทั้งหมด') return DRUGS; return DRUGS.filter(d=>d.tags.includes(STATE.filter)); }

// core calc per special rules
function calcBoxes(drug, days, ppd){
  const D=Number(days||0), P=Number(ppd||0);
  let boxes=0; const notes=[];

  if (drug && drug.calcMode==='durationOnly'){
    const perBoxDays = Number(drug.boxDurationDays||56);
    boxes = D>0 ? Math.ceil(D/perBoxDays) : 1; // default 1 กล่อง/56 วัน
    if (drug.note) notes.push(drug.note);
  } else {
    const perBox = Number(drug?.puffsPerBox||1);
    boxes = (D>0 && P>0) ? Math.ceil((D*P)/perBox) : 0;
  }

  if (drug && drug.shelfLifeDays){
    const minByShelf = D>0 ? Math.ceil(D/Number(drug.shelfLifeDays)) : 0;
    if (minByShelf > boxes){ boxes = minByShelf; notes.push('จ่ายเพิ่มเนื่องจากยาหมดอายุ'); }
  }
  return { boxes, notes };
}

function renderCards(){
  const host=$('#grid'); host.innerHTML='';
  filtered().forEach(d=>{
    const sel=!!STATE.selected[d.id]; const ppd= sel ? (STATE.selected[d.id].ppd||'') : '';
    const card=document.createElement('div'); card.className='card'+(sel?' selected':''); card.dataset.id=d.id;
    const imgSrc = IMG[d.id] || d.image || '';

    card.innerHTML=`
      <div class="bar" style="background:${d.color||'#eef2ff'}"></div>
      <div class="body">
        <div class="badge">จ่าย 0 กล่อง</div>
        <div class="row">
          <input type="checkbox" class="pick" ${sel?'checked':''}/>
          <h3>${d.name}</h3>
        </div>
        <div class="tags">${d.tags.join(' · ')} · ${d.puffsPerBox} puff/กล่อง</div>
        <div class="controls-mini">
          <label>เลือก</label>
          <input type="number" class="ppd" min="0" max="4" placeholder="พ่น/วัน (1–4)" value="${ppd}">
        </div>
        <div class="quick">
          ${[1,2,3,4].map(n=>`<button class="pill" type="button" data-n="${n}">${n}</button>`).join('')}
        </div>
        <div class="imgwrap">
          <img src="${imgSrc}" alt="${d.name}" loading="lazy" onerror="this.style.display='none'">
        </div>
      </div>`;

    card.querySelectorAll('.pill').forEach(btn=> btn.addEventListener('click',()=>{
      const n=Number(btn.dataset.n);
      STATE.selected[d.id]={ppd:n};
      card.querySelector('.pick').checked=true;
      card.querySelector('.ppd').value=n;
      updateCard(card,true);
    }));

    card.querySelector('.ppd').addEventListener('input',e=>{
      const n=Number(e.target.value||0);
      if(n>0){ if(!STATE.selected[d.id]) STATE.selected[d.id]={ppd:n}; else STATE.selected[d.id].ppd=n; }
      else { if(STATE.selected[d.id]) STATE.selected[d.id].ppd=0; }
      if(n>0) card.querySelector('.pick').checked=true;
      updateCard(card,true);
    });

    card.querySelector('.pick').addEventListener('change',e=>{
      if(e.target.checked){
        if(!STATE.selected[d.id]){
          const cur = Number(card.querySelector('.ppd').value||0);
          STATE.selected[d.id]={ppd:cur};
        }
      }else{
        delete STATE.selected[d.id];
      }
      updateCard(card,true);
    });

    updateCard(card);
    host.appendChild(card);
  });
}

function updateCard(card, rerenderSummary=false){
  const id=card.dataset.id; const d=DRUGS.find(x=>x.id===id);
  const picked=!!STATE.selected[id];
  const ppd=STATE.selected[id]?.ppd||0;
  const days=Number(STATE.days||0);
  const { boxes } = picked ? calcBoxes(d, days, ppd) : { boxes:0, notes:[] };
  card.classList.toggle('selected', picked);
  const badge=card.querySelector('.badge'); badge.textContent=`จ่าย ${boxes} กล่อง`; badge.style.display=picked?'inline-block':'none';
  if(rerenderSummary) renderSummary();
}

function computeAll(clear=false){
  if(clear){ renderCards(); renderSummary(); return; }
  $$('.card').forEach(c=> updateCard(c));
  renderSummary();
}

function renderSummary(){
  const tb=$('#sum-body'); tb.innerHTML=''; let total=0;
  Object.keys(STATE.selected).forEach(id=>{
    const d=DRUGS.find(x=>x.id===id); const ppd=STATE.selected[id].ppd||0; const days=Number(STATE.days||0);
    const { boxes, notes } = calcBoxes(d, days, ppd); total+=boxes;
    const tr=document.createElement('tr');
    const noteHtml = notes.length?`<div class="note">${notes.join(' · ')}</div>`:'';
    tr.innerHTML=`<td>${d.name}${noteHtml}</td><td>${ppd||'-'}</td><td>${days||'-'}</td><td>${d.puffsPerBox}</td><td><b>${boxes}</b></td>`;
    tb.appendChild(tr);
  });
  $('#sum-total').textContent=total;
}

window.addEventListener('load', boot);
