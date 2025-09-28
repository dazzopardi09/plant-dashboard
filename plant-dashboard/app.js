/* Plant Dashboard — Phase 1 (static/manual, localStorage) */
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

const storeKey = 'plantdash.v1';
const defaultRules = {
  waterAtOrBelow: 3,
  checkLow: 4,
  checkHigh: 5,
  holdAtOrAbove: 6,
  staleDays: 3
};

const demoPlants = [
  {id: crypto.randomUUID(), name:"Hardenbergia (trellis pot)", type:"Hardenbergia", photo:"", moisture:5, updatedAt:Date.now() - 1000*60*60*20},
  {id: crypto.randomUUID(), name:"Kangaroo Paw (black pot)", type:"Anigozanthos", photo:"", moisture:4, updatedAt:Date.now() - 1000*60*60*30},
  {id: crypto.randomUUID(), name:"Melaleuca seedling", type:"Melaleuca", photo:"", moisture:7, updatedAt:Date.now() - 1000*60*60*6},
  {id: crypto.randomUUID(), name:"Grevillea (alpine)", type:"Grevillea", photo:"", moisture:7, updatedAt:Date.now() - 1000*60*60*50},
];

function loadState(){
  const raw = localStorage.getItem(storeKey);
  if(!raw){
    const state = {rules: defaultRules, plants: demoPlants};
    localStorage.setItem(storeKey, JSON.stringify(state));
    return state;
  }
  try { return JSON.parse(raw); } catch(e){ return {rules: defaultRules, plants: []}; }
}

function saveState(state){ localStorage.setItem(storeKey, JSON.stringify(state)); }

function timeAgo(ts){
  const d = Math.floor((Date.now()-ts)/1000);
  if(d<60) return `${d}s ago`;
  if(d<3600) return `${Math.floor(d/60)}m ago`;
  if(d<86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

function computeStatus(moisture, rules){
  if(moisture === "" || moisture == null || isNaN(Number(moisture))) return {label:"No reading", class:"", hint:"Tap to add a reading."};
  const m = Number(moisture);
  if(m <= rules.waterAtOrBelow) return {label:"Water", class:"bad", hint:`Reading ≤ ${rules.waterAtOrBelow}.`};
  if(m >= rules.holdAtOrAbove) return {label:"Hold", class:"ok", hint:`Reading ≥ ${rules.holdAtOrAbove}.`};
  if(m >= rules.checkLow && m <= rules.checkHigh) return {label:"Check tomorrow", class:"warn", hint:`Between ${rules.checkLow}–${rules.checkHigh}.`};
  // Otherwise: neutral hold
  return {label:"Hold", class:"ok", hint:`Within safe range.`};
}

let state = loadState();

function render(){
  const grid = $("#grid");
  const search = $("#search").value.trim().toLowerCase();
  grid.innerHTML = "";
  const rules = state.rules || defaultRules;

  // KPIs
  const kpis = $("#kpis");
  const totals = state.plants.length;
  const due = state.plants.filter(p => computeStatus(p.moisture, rules).label === "Water").length;
  const hold = state.plants.filter(p => computeStatus(p.moisture, rules).label === "Hold").length;
  const check = state.plants.filter(p => computeStatus(p.moisture, rules).label === "Check tomorrow").length;
  kpis.innerHTML = `
    <div class="kpi">Plants: <strong>${totals}</strong></div>
    <div class="kpi">Water now: <strong>${due}</strong></div>
    <div class="kpi">Hold: <strong>${hold}</strong></div>
    <div class="kpi">Check tomorrow: <strong>${check}</strong></div>
  `;

  state.plants
    .filter(p => !search || p.name.toLowerCase().includes(search) || (p.type||"").toLowerCase().includes(search))
    .sort((a,b)=> (a.name||"").localeCompare(b.name||""))
    .forEach(p => {
      const rulesForPlant = rules; // Phase 1: use global rules; plant-specific later
      const status = computeStatus(p.moisture, rulesForPlant);
      const stale = p.updatedAt ? (Date.now() - p.updatedAt) > (rules.staleDays*86400000) : true;
      const div = document.createElement("article");
      div.className = "card";
      const placeholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='%230a0f14'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2370808f' font-family='system-ui' font-size='24'>No photo</text></svg>`;
      div.innerHTML = `
        <img src="${p.photo||placeholder}" alt="">
        <div class="content">
          <div class="name">${p.name||"Untitled"}</div>
          <div class="meta">
            <span class="pill">${p.type||"—"}</span>
            <span class="pill">Moisture: <strong>${p.moisture ?? "—"}</strong></span>
            <span class="pill">${p.updatedAt ? timeAgo(p.updatedAt) : "no reading"}</span>
            ${stale? `<span class="pill">stale</span>`:""}
          </div>
          <div class="status ${status.class}">${status.label} — <span style="color:#9fb0bf">${status.hint}</span></div>
          <div class="row" style="margin-top:10px">
            <input class="reading" type="number" min="0" max="10" step="1" placeholder="0–10" value="${p.moisture ?? ""}" style="flex:1">
            <button class="saveBtn">Save</button>
            <button class="editBtn">Edit</button>
            <button class="delBtn">Delete</button>
          </div>
        </div>
      `;
      div.querySelector(".saveBtn").addEventListener("click", ()=>{
        const v = div.querySelector(".reading").value;
        p.moisture = v === "" ? null : Number(v);
        p.updatedAt = Date.now();
        saveState(state); render();
      });
      div.querySelector(".editBtn").addEventListener("click", ()=> openPlantDialog(p));
      div.querySelector(".delBtn").addEventListener("click", ()=>{
        if(confirm(`Delete “${p.name}”?`)){
          state.plants = state.plants.filter(x=>x.id!==p.id);
          saveState(state); render();
        }
      });
      grid.appendChild(div);
    });
}

function openPlantDialog(p=null){
  const dlg = $("#plantDialog");
  const form = $("#plantForm");
  $("#dialogTitle").textContent = p? "Edit plant":"Add plant";
  form.reset();
  form.name.value = p?.name || "";
  form.type.value = p?.type || "";
  form.moisture.value = p?.moisture ?? "";
  form.photo.value = p?.photo || "";
  dlg.returnValue="";
  dlg.showModal();
  form.onsubmit = (e)=>{
    e.preventDefault();
    const data = {
      id: p?.id || crypto.randomUUID(),
      name: form.name.value.trim(),
      type: form.type.value.trim(),
      moisture: form.moisture.value === "" ? null : Number(form.moisture.value),
      photo: form.photo.value.trim(),
      updatedAt: p?.updatedAt || (form.moisture.value===""? null : Date.now() )
    };
    if(p){
      Object.assign(p, data);
    }else{
      state.plants.push(data);
    }
    saveState(state);
    dlg.close();
    render();
  };
}

$("#addBtn").addEventListener("click", ()=> openPlantDialog());

$("#search").addEventListener("input", render);

$("#exportBtn").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "plant-dashboard-data.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

$("#importBtn").addEventListener("click", ()=> $("#importInput").click());
$("#importInput").addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try {
      const incoming = JSON.parse(reader.result);
      if(incoming.rules && incoming.plants){
        state = incoming;
      } else if(Array.isArray(incoming)) {
        state.plants = incoming;
      } else {
        alert("Invalid file format.");
        return;
      }
      saveState(state); render();
    } catch(err){ alert("Import failed: " + err.message); }
  };
  reader.readAsText(file);
});

$("#settingsBtn").addEventListener("click", ()=>{
  const dlg = $("#settingsDialog");
  const form = $("#settingsForm");
  form.waterAtOrBelow.value = state.rules.waterAtOrBelow;
  form.checkLow.value = state.rules.checkLow;
  form.checkHigh.value = state.rules.checkHigh;
  form.holdAtOrAbove.value = state.rules.holdAtOrAbove;
  form.staleDays.value = state.rules.staleDays;
  dlg.returnValue="";
  dlg.showModal();
  form.onsubmit = (e)=>{
    e.preventDefault();
    const r = state.rules;
    r.waterAtOrBelow = Number(form.waterAtOrBelow.value);
    r.checkLow = Number(form.checkLow.value);
    r.checkHigh = Number(form.checkHigh.value);
    r.holdAtOrAbove = Number(form.holdAtOrAbove.value);
    r.staleDays = Number(form.staleDays.value);
    saveState(state);
    dlg.close();
    render();
  };
});

// PWA-lite: installable manifest & icon are included; service worker optional later.
window.addEventListener("load", render);
