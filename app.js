
// ===== DRUG MASTER (explicit color per drug) =====
const DRUGS = [
  {id:'aerotamol',   name:'Aerotamol MDI',              tags:['SABA'],       puffPerCan:200, color:'#cfe7f6'},
  {id:'aerobidal',   name:'Aerobidal MDI',              tags:['SABA','SAMA'],puffPerCan:200, color:'#a6eff0'},
  {id:'aeronide200', name:'Aeronide MDI (200mcg/dose)', tags:['ICS'],        puffPerCan:200, color:'#f6d7a7'},
  {id:'flix125',     name:'Flixotide Evohaler (125mcg/dose)', tags:['ICS'],  puffPerCan:120, color:'#f6b1ab'},
  {id:'aerotide125', name:'Aerotide MDI 125 (125/25)',  tags:['ICS','LABA'], puffPerCan:120, color:'#d8c6f0'},
  {id:'aerotide250', name:'Aerotide MDI 250 (250/25)',  tags:['ICS','LABA'], puffPerCan:120, color:'#c7b8e6'},
  {id:'seretide',    name:'Seretide accuhaler (250/50)',tags:['ICS','LABA'], puffPerCan:60,  color:'#bdb4d8'},
  {id:'duo160',      name:'Duoresp Spiromax (160/4.5)', tags:['ICS','LABA'], puffPerCan:120, color:'#dbe2ea'},
  {id:'duo320',      name:'Duoresp Spiromax (320/9)',   tags:['ICS','LABA'], puffPerCan:60,  color:'#cfd7e2'},
  {id:'spiriva',     name:'Spiriva handihaler (18mcg)', tags:['LAMA'],       puffPerCan:30,  color:'#c7e6c7'},
  {id:'avamys',      name:'AVAMYS (27.5mcg/dose)',      tags:['NASAL'],      puffPerCan:120, color:'#b6eef2'},
  {id:'mometasone',  name:'Mometasone (50mcg/dose)',    tags:['NASAL'],      puffPerCan:140, color:'#f7e69c'},
  {id:'busonase',    name:'Busonase (64mcg/dose)',      tags:['NASAL'],      puffPerCan:120, color:'#b6eef2'},
];

// State keeps across filters
const state = { days:'', chosen:{} };

// DOM
const listEl = document.getElementById('drugList');
const daysEl = document.getElementById('days');
const summarySec = document.getElementById('summarySec');
const summaryBody = document.getElementById('summaryBody');

function matchesFilter(drug, filter){
  if (filter==='ALL') return true;
  return drug.tags.includes(filter);
}

function renderList(filter='ALL'){
  const cards = DRUGS.filter(d=>matchesFilter(d,filter)).map(d=>{
    const st = state.chosen[d.id] || {};
    return `
    <div class="card drug" style="--bar:${d.color}">
      <div class="row">
        <input type="checkbox" class="pick" data-id="${d.id}" ${st.checked?'checked':''}>
        <div class="name">${d.name}</div>
        <span class="badge">${d.tags.join(' · ')}</span>
        <span class="muted">· ${d.puffPerCan} puff/กล่อง</span>
      </div>
      <div class="row" style="gap:12px;margin-top:8px">
        <label class="muted">เลือกพ่น/วัน</label>
        <input class="pday" data-id="${d.id}" type="number" inputmode="numeric" placeholder="เช่น 1–6" value="${st.puffsPerDay ?? ''}" style="width:120px">
        <div class="quick-puffs">
          ${[1,2,3,4,5,6].map(n=>`<button class="mini setp" data-id="${d.id}" data-val="${n}">${n}</button>`).join('')}
        </div>
        <input class="puffCan" type="number" value="${d.puffPerCan}" disabled style="width:120px">
      </div>
    </div>`
  }).join('');
  listEl.innerHTML = cards;
}
renderList();

// Filter buttons
document.querySelectorAll('.pill').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    renderList(btn.dataset.filter);
  });
});

// Events
listEl.addEventListener('click', e=>{
  const b = e.target.closest('.setp'); if(!b) return;
  const id=b.dataset.id, v=Number(b.dataset.val);
  state.chosen[id]=state.chosen[id]||{checked:true,puffsPerDay:v};
  state.chosen[id].puffsPerDay=v; state.chosen[id].checked=true;
  renderList(document.querySelector('.pill.active')?.dataset.filter||'ALL');
  updateSummary();
});
listEl.addEventListener('input', e=>{
  const inp=e.target.closest('.pday'); if(!inp) return;
  const id=inp.dataset.id; const v=Number(inp.value||0);
  state.chosen[id]=state.chosen[id]||{checked:true,puffsPerDay:v};
  state.chosen[id].puffsPerDay=v; updateSummary();
});
listEl.addEventListener('change', e=>{
  const box=e.target.closest('.pick'); if(!box) return;
  const id=box.dataset.id;
  state.chosen[id]=state.chosen[id]||{checked:false,puffsPerDay:state.chosen[id]?.puffsPerDay||0};
  state.chosen[id].checked=box.checked; updateSummary();
});

// Quick days
function setDays(v){ daysEl.value=v; ['input','change'].forEach(ev=>daysEl.dispatchEvent(new Event(ev,{bubbles:true}))) }
document.addEventListener('click',e=>{
  const q=e.target.closest('.qd'); if(!q) return; e.preventDefault(); setDays(q.dataset.days);
});
document.addEventListener('touchstart',e=>{
  const q=e.target.closest('.qd'); if(!q) return; setDays(q.dataset.days);
},{passive:true});

document.getElementById('clearBtn').addEventListener('click',()=>{
  daysEl.value=''; state.days=''; state.chosen={};
  renderList(document.querySelector('.pill.active')?.dataset.filter||'ALL');
  updateSummary();
});

daysEl.addEventListener('input',()=>{ state.days=Number(daysEl.value||0); updateSummary(); });

function updateSummary(){
  const days=Number(daysEl.value||0);
  const rows=Object.entries(state.chosen).filter(([id,st])=>st.checked && st.puffsPerDay>0);
  summaryBody.innerHTML='';
  rows.forEach(([id,st])=>{
    const d=DRUGS.find(x=>x.id===id);
    const total=days*st.puffsPerDay;
    const boxes=d.puffPerCan?Math.ceil(total/d.puffPerCan):0;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${d.name}</td><td>${days||'-'}</td><td>${st.puffsPerDay}</td><td>${total||0}</td><td>${d.puffPerCan}</td><td><b>${boxes}</b></td>`;
    summaryBody.appendChild(tr);
  });
  document.getElementById('summarySec').style.display = rows.length ? '' : 'none';
}

// Print
function printSection(id){
  const node=document.getElementById(id); if(!node) return;
  const w=window.open('','','width=900,height=700');
  const css = document.querySelector('link[href="styles.css"]').outerHTML;
  w.document.write(`<html><head><title>สรุปสำหรับบุคลากร</title>${css}</head><body>${node.innerHTML}</body></html>`);
  w.document.close(); w.print();
}
document.addEventListener('click',e=>{
  if(e.target && e.target.id==='printSummary'){ e.preventDefault(); printSection('summarySec'); }
});
