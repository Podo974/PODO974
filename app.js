
const app = document.getElementById('app');

const state = {
  step: 0,
  patient: {age:'', sex:'', activity:'', notes:''},
  area: '',
  regions: [],
  answers: {},
  morpho: {},
};

const footRegions = [
  "Talon plantaire","Talon postérieur","Voûte médiale","Voûte latérale",
  "Avant-pied médial","Avant-pied central","Avant-pied latéral",
  "1re MTP / hallux","2e-3e espaces interdigitaux","5e rayon / bunionette",
  "Médio-pied dorsal","Bord médial","Bord latéral","Cheville médiale","Cheville latérale"
];

const kneeRegions = [
  "Antérieur / rotule","Sous la rotule","Au-dessus de la rotule","Interligne médial",
  "Interligne latéral","Postérieur / creux poplité","Tubérosité tibiale",
  "Face médiale","Face latérale","Diffuse"
];

const questions = {
  common: [
    ["trauma","Début après traumatisme ?","bool"],
    ["weight_bearing","Pouvez-vous prendre appui et marcher ?","boolReverse"],
    ["fever","Fièvre associée ?","bool"],
    ["red_hot","Zone rouge et anormalement chaude ?","bool"],
    ["night","Douleur importante la nuit ou au repos ?","bool"],
    ["numbness","Engourdissement ou perte de sensibilité ?","bool"],
    ["weakness","Faiblesse inhabituelle du pied ou de la jambe ?","bool"],
    ["swelling","Gonflement important ou brutal ?","bool"]
  ],
  foot: [
    ["first_steps","Douleur maximale aux premiers pas après le repos ?","bool"],
    ["after_activity","Douleur surtout après l'activité plutôt que pendant ?","bool"],
    ["push_off","Douleur lors de la propulsion sur le gros orteil ?","bool"],
    ["hallux_stiff","Gros orteil raide en extension ?","bool"],
    ["burning_toes","Brûlures/paresthésies vers les orteils ?","bool"],
    ["tight_shoes","Aggravation avec chaussures étroites ?","bool"],
    ["achilles_load","Douleur à la montée sur la pointe des pieds ?","bool"],
    ["medial_arch_fatigue","Fatigue/douleur médiale avec affaissement ressenti du pied ?","bool"]
  ],
  knee: [
    ["stairs","Douleur dans les escaliers ?","bool"],
    ["squat","Douleur au squat ou à la flexion chargée ?","bool"],
    ["sitting","Douleur après station assise prolongée genou fléchi ?","bool"],
    ["pivot","Douleur ou blocage après mouvement de pivot ?","bool"],
    ["locking","Blocage/catching du genou ?","bool"],
    ["running_lateral","Douleur latérale surtout à la course répétée ?","bool"],
    ["jumping","Douleur sous la rotule avec sauts/course ?","bool"]
  ]
};

const morphologyFields = [
  ["foot_type","Type de pied","select",["Non renseigné","Égyptien","Grec","Carré/Romain","Autre"]],
  ["arch","Voûte plantaire","select",["Non renseigné","Normale","Pied plat / pes planus","Pied creux / pes cavus"]],
  ["hindfoot","Arrière-pied","select",["Non renseigné","Neutre","Valgus calcanéen","Varus calcanéen"]],
  ["forefoot","Avant-pied","select",["Non renseigné","Neutre","Varus d'avant-pied","Valgus d'avant-pied"]],
  ["hallux","Hallux","select",["Non renseigné","Neutre","Hallux valgus","Hallux rigidus/limitus","Hallux varus"]],
  ["knee_axis","Axe du genou","select",["Non renseigné","Neutre","Genu valgum","Genu varum","Genu recurvatum"]],
  ["tibial_rotation","Rotation tibiale","select",["Non renseigné","Neutre","Interne","Externe"]],
  ["first_ray","Premier rayon","select",["Non renseigné","Normal","Hypermobile","Plantarflexé","Dorsiflexé"]],
];

function save(){ localStorage.setItem('podoTriageState', JSON.stringify(state)); }
function reset(){
  localStorage.removeItem('podoTriageState');
  Object.assign(state,{step:0,patient:{age:'',sex:'',activity:'',notes:''},area:'',regions:[],answers:{},morpho:{}});
  render();
}
document.getElementById('resetBtn').onclick = reset;

function yesNo(key, label, reverse=false){
  const v = state.answers[key];
  return `<div class="card">
    <strong>${label}</strong>
    <div class="grid" style="margin-top:10px">
      <button class="choice ${v===true?'active':''}" onclick="setAnswer('${key}',true)"><strong>Oui</strong></button>
      <button class="choice ${v===false?'active':''}" onclick="setAnswer('${key}',false)"><strong>Non</strong></button>
    </div>
  </div>`;
}
window.setAnswer=(k,v)=>{state.answers[k]=v;save();render();}
window.pickArea=(a)=>{state.area=a;state.regions=[];state.answers={};state.step=2;save();render();}
window.toggleRegion=(r)=>{
  if(state.regions.includes(r)) state.regions=state.regions.filter(x=>x!==r);
  else state.regions.push(r);
  save();render();
}
window.next=()=>{state.step++;save();render();}
window.prev=()=>{state.step=Math.max(0,state.step-1);save();render();}
window.updatePatient=(k,v)=>{state.patient[k]=v;save();}
window.updateMorpho=(k,v)=>{state.morpho[k]=v;save();}

function redFlags(){
  const a = state.answers;
  const flags = [];
  if(a.fever && a.red_hot) flags.push("Fièvre + zone rouge/chaude : infection ou inflammation aiguë à éliminer.");
  if(a.trauma && a.weight_bearing===false) flags.push("Traumatisme avec impossibilité d'appui : lésion aiguë/fracture à éliminer.");
  if(a.numbness || a.weakness) flags.push("Déficit sensitif ou moteur : origine neurologique à évaluer.");
  if(a.swelling && a.trauma) flags.push("Gonflement important après traumatisme : examen clinique requis.");
  if(a.night) flags.push("Douleur importante au repos/la nuit : tableau non mécanique à explorer.");
  return flags;
}

function hypotheses(){
  const a=state.answers, r=state.regions;
  let out=[];
  function add(name, score, why, tests, orthosis){
    out.push({name,score,why,tests,orthosis});
  }
  if(state.area==="foot"){
    let s=0, why=[];
    if(r.includes("Talon plantaire")){s+=3;why.push("douleur talonnière plantaire")}
    if(a.first_steps){s+=4;why.push("premiers pas douloureux")}
    if(a.after_activity){s+=2;why.push("douleur surtout après l'activité")}
    if(s>=4) add("Fasciopathie plantaire / douleur plantaire du talon",s,why,
      ["Palpation insertion médiale du fascia","Dorsiflexion de cheville","Test fonctionnel de mise en charge"],
      ["Objectif possible : réduction de contrainte plantaire et soutien adapté, à confirmer cliniquement"]);

    s=0;why=[];
    if(r.includes("1re MTP / hallux")){s+=3;why.push("1re MTP douloureuse")}
    if(a.hallux_stiff){s+=4;why.push("raideur de l'hallux")}
    if(a.push_off){s+=2;why.push("douleur à la propulsion")}
    if(s>=4) add("Hallux limitus / hallux rigidus à explorer",s,why,
      ["Mobilité 1re MTP","Douleur à la dorsiflexion","Observation de la propulsion"],
      ["Objectif possible : limiter la dorsiflexion douloureuse / optimiser la propulsion selon examen"]);

    s=0;why=[];
    if(r.includes("2e-3e espaces interdigitaux")){s+=3;why.push("douleur interdigitale")}
    if(a.burning_toes){s+=3;why.push("brûlures/paresthésies")}
    if(a.tight_shoes){s+=2;why.push("aggravation chaussures étroites")}
    if(s>=4) add("Névralgie interdigital / névrome de Morton à explorer",s,why,
      ["Palpation espace interdigital","Compression avant-pied par praticien","Examen sensitif"],
      ["Objectif possible : décharger l'avant-pied / modifier contraintes de chaussage"]);

    s=0;why=[];
    if(r.includes("Talon postérieur")){s+=3;why.push("douleur postérieure")}
    if(a.achilles_load){s+=3;why.push("douleur en charge sur pointe")}
    if(s>=4) add("Tendinopathie d'Achille à explorer",s,why,
      ["Palpation du tendon","Élévation unipodale du talon si sûre","Amplitude de cheville"],
      ["Orthèse seulement si indication biomécanique associée; ne pas en faire un traitement isolé"]);

    s=0;why=[];
    if(a.medial_arch_fatigue){s+=3;why.push("fatigue médiale/affaissement ressenti")}
    if(state.morpho.arch==="Pied plat / pes planus"){s+=2;why.push("pes planus renseigné")}
    if(state.morpho.hindfoot==="Valgus calcanéen"){s+=2;why.push("valgus calcanéen")}
    if(s>=4) add("Pied plat symptomatique / dysfonction médiale à explorer",s,why,
      ["Observation en charge","Heel-rise unipodal par praticien","Mobilité sous-talienne","Tendon tibial postérieur"],
      ["Objectif possible : soutien/accommodation et contrôle des contraintes selon flexibilité"]);
  } else {
    let s=0,why=[];
    if(r.includes("Antérieur / rotule")||r.includes("Face médiale")){s+=2;why.push("douleur antérieure/péri-patellaire")}
    if(a.stairs){s+=2;why.push("escaliers")}
    if(a.squat){s+=2;why.push("squat")}
    if(a.sitting){s+=2;why.push("assis prolongé genou fléchi")}
    if(s>=4) add("Douleur fémoro-patellaire à explorer",s,why,
      ["Squat fonctionnel","Contrôle dynamique hanche-genou-pied","Palpation et mobilité patellaire"],
      ["Orthèse possible seulement si un facteur pied/appui pertinent est identifié"]);

    s=0;why=[];
    if(r.includes("Interligne médial")||r.includes("Interligne latéral")){s+=2;why.push("interligne douloureux")}
    if(a.pivot){s+=3;why.push("mécanisme en pivot")}
    if(a.locking){s+=3;why.push("blocage/catching")}
    if(s>=4) add("Atteinte méniscale à explorer",s,why,
      ["Palpation interligne","Tests méniscaux par praticien","Recherche d'épanchement et limitation"],
      ["Pas de prescription d'orthèse plantaire sur cette hypothèse seule"]);

    s=0;why=[];
    if(r.includes("Face latérale")){s+=2;why.push("douleur latérale")}
    if(a.running_lateral){s+=4;why.push("course répétée")}
    if(s>=4) add("Syndrome de la bandelette ilio-tibiale à explorer",s,why,
      ["Analyse course/marche","Contrôle hanche-genou","Palpation latérale"],
      ["Orthèse seulement si un facteur biomécanique du pied est clairement contributif"]);

    s=0;why=[];
    if(r.includes("Sous la rotule")){s+=3;why.push("douleur sous-patellaire")}
    if(a.jumping){s+=3;why.push("sauts/course")}
    if(s>=4) add("Tendinopathie patellaire à explorer",s,why,
      ["Palpation tendon patellaire","Charge progressive selon tolérance","Évaluation chaîne cinétique"],
      ["Orthèse plantaire non automatique; rechercher facteurs de charge et d'appui"]);
  }
  return out.sort((a,b)=>b.score-a.score);
}

function render(){
  const p = Math.min(100, [12,25,42,62,78,100][state.step]||100);
  let html=`<div class="progress"><span style="width:${p}%"></span></div>`;
  if(state.step===0){
    html+=`<section class="card"><h2>Nouveau patient</h2><p class="sub">Informations minimales pour la pré-consultation.</p>
      <div class="grid">
        <div><label>Âge</label><input type="number" min="0" max="120" value="${state.patient.age}" oninput="updatePatient('age',this.value)"></div>
        <div><label>Sexe</label><select onchange="updatePatient('sex',this.value)">
          <option value="">Non renseigné</option><option ${state.patient.sex==="F"?"selected":""} value="F">Femme</option>
          <option ${state.patient.sex==="M"?"selected":""} value="M">Homme</option><option ${state.patient.sex==="A"?"selected":""} value="A">Autre / non précisé</option>
        </select></div>
      </div>
      <label>Activité / profession</label><input value="${state.patient.activity}" oninput="updatePatient('activity',this.value)" placeholder="Ex. course, station debout, travail physique">
      <label>Motif libre</label><textarea oninput="updatePatient('notes',this.value)" placeholder="Décrivez brièvement le problème">${state.patient.notes}</textarea>
      <div class="actions"><span></span><button class="primary" onclick="next()">Continuer</button></div>
    </section>`;
  } else if(state.step===1){
    html+=`<section class="card"><h2>Zone principale</h2><p class="sub">Choisissez la région qui motive la consultation.</p>
    <div class="grid">
      <button class="choice" onclick="pickArea('foot')"><strong>Pied / cheville</strong><small>Du talon aux orteils, cheville incluse</small></button>
      <button class="choice" onclick="pickArea('knee')"><strong>Genou</strong><small>Douleur antérieure, médiale, latérale ou postérieure</small></button>
    </div><div class="actions"><button class="secondary" onclick="prev()">Retour</button></div></section>`;
  } else if(state.step===2){
    const regs = state.area==="foot"?footRegions:kneeRegions;
    html+=`<section class="card"><h2>Localisation de la douleur</h2><p class="sub">Sélectionnez une ou plusieurs zones.</p>
      <div class="region-list">${regs.map(r=>`<button class="region ${state.regions.includes(r)?'active':''}" onclick='toggleRegion(${JSON.stringify(r)})'>${r}</button>`).join('')}</div>
      <div class="actions"><button class="secondary" onclick="prev()">Retour</button><button class="primary" onclick="next()" ${state.regions.length?'':'disabled'}>Continuer</button></div>
    </section>`;
  } else if(state.step===3){
    html+=`<section><div class="card"><h2>Questionnaire symptômes</h2><p class="sub">Les questions ci-dessous servent à orienter l'examen, pas à poser un diagnostic.</p></div>`;
    for(const [k,l,t] of [...questions.common,...questions[state.area]]) html+=yesNo(k,l,t==="boolReverse");
    html+=`<div class="card"><div class="actions"><button class="secondary" onclick="prev()">Retour</button><button class="primary" onclick="next()">Continuer</button></div></div></section>`;
  } else if(state.step===4){
    html+=`<section class="card"><h2>Observations biomécaniques</h2><p class="sub">À remplir par le praticien si disponible. Ces données ne sont pas interprétées comme des diagnostics isolés.</p>`;
    for(const [k,l,t,opts] of morphologyFields){
      html+=`<label>${l}</label><select onchange="updateMorpho('${k}',this.value)">${opts.map(o=>`<option ${state.morpho[k]===o?'selected':''}>${o}</option>`).join('')}</select>`;
    }
    html+=`<div class="actions"><button class="secondary" onclick="prev()">Retour</button><button class="primary" onclick="next()">Voir la synthèse</button></div></section>`;
  } else {
    const flags=redFlags(), hyps=hypotheses();
    html+=`<section class="card"><h2>Synthèse praticien</h2>
      <p class="sub">Patient ${state.patient.age?state.patient.age+" ans":"âge non renseigné"} — ${state.area==="foot"?"pied/cheville":"genou"} — zones : ${state.regions.join(", ")||"non renseignées"}.</p>`;
    if(flags.length){
      html+=`<div class="redflag"><strong>⚠️ Priorité sécurité</strong><ul>${flags.map(f=>`<li>${f}</li>`).join('')}</ul><div>Ne pas poursuivre vers une recommandation d'orthèse avant évaluation clinique appropriée.</div></div>`;
    } else {
      html+=`<div class="ok"><strong>Aucun red flag majeur détecté par ce questionnaire.</strong><div class="muted">Cela n'exclut pas une pathologie nécessitant examen ou imagerie.</div></div>`;
    }
    html+=`<h3>Hypothèses à explorer</h3>`;
    if(!hyps.length) html+=`<div class="warning">Les réponses actuelles ne correspondent pas suffisamment aux parcours intégrés dans cette version. Examen clinique requis.</div>`;
    for(const h of hyps){
      html+=`<div class="card">
        <div class="score-row"><strong>${h.name}</strong><span>Score d'orientation ${h.score}</span></div>
        <p><strong>Éléments concordants :</strong> ${h.why.join(", ")}.</p>
        <p><strong>À examiner :</strong></p><div>${h.tests.map(x=>`<span class="tag">${x}</span>`).join('')}</div>
        <p><strong>Orthèse :</strong> ${h.orthosis}</p>
      </div>`;
    }
    html+=`<h3>Observations morphologiques</h3><div>${Object.entries(state.morpho).filter(([k,v])=>v&&v!=="Non renseigné").map(([k,v])=>`<span class="tag">${v}</span>`).join('')||'<span class="muted">Non renseignées</span>'}</div>`;
    html+=`<p class="footer-note">Ce prototype utilise des règles explicites. Les scores servent uniquement à classer des hypothèses pour le praticien. Ils ne sont pas des probabilités diagnostiques.</p>
      <div class="actions"><button class="secondary" onclick="prev()">Retour</button><button class="primary" onclick="reset()">Nouveau patient</button></div>
    </section>`;
  }
  app.innerHTML=html;
}
render();
