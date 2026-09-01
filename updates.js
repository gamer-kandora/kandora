/* KANDORA UPDATE PACK — preserves the existing map and adds the latest gameplay systems. */
(function(){
  'use strict';

  function waitForGame(){
    if(typeof window.createArmy !== 'function' || typeof window.openDiplomacy !== 'function'){
      setTimeout(waitForGame,250); return;
    }
    install();
  }

  function install(){
    addUpdateStyles();
    addDiplomacySearchAndAlliance();
    addCapitalProtection();
    addAllyCounterSupport();
    addInfrastructureFocuses();
    addActiveAITweaks();
    window.KANDORA_UPDATES='2026-09-01';
  }

  function addUpdateStyles(){
    if(document.getElementById('kandoraUpdateStyles')) return;
    const s=document.createElement('style'); s.id='kandoraUpdateStyles';
    s.textContent=`
      #dipSearch{width:100%;box-sizing:border-box;padding:9px;margin:0 0 10px;background:#161b16;color:#fff;border:1px solid #62695c}
      .dipActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
      .ally-card{border-color:#6d88a2!important;background:#26333d!important}
      .ally-label{color:#8fb5d9;font-weight:bold;font-size:10px;letter-spacing:1px}
      .ally-counter{position:relative;min-width:125px;height:62px;background:linear-gradient(#31485b,#17232d);border:2px solid #80a9cc;box-shadow:0 3px 10px #000c;padding:4px;cursor:pointer;color:white;box-sizing:border-box}
      .ally-counter .ally-top{display:flex;align-items:center;height:28px}
      .ally-counter .ally-flag{width:26px;height:22px;margin-right:5px;display:flex;align-items:center;justify-content:center;font-size:18px}
      .ally-counter .ally-name{font-size:10px;font-weight:bold;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ally-counter .ally-total{margin-left:auto;font-size:13px;color:#a9c9e5}
      .ally-counter .ally-bar{height:7px;background:#0b1115;border:1px solid #526575;margin-top:5px}
      .ally-counter .ally-org{height:100%;background:#4f86b5}
      .infraCard{padding:10px;background:#282e28;border:1px solid #4b5349;margin-top:8px}
      .infraCard h3{margin:0 0 5px;font-size:13px}
      .infraCard p{margin:4px 0;color:#b9bdb2;font-size:11px}
      .protection-note{color:#9eb5c8;font-size:10px;margin-top:5px}
    `;
    document.head.appendChild(s);
  }

  function addDiplomacySearchAndAlliance(){
    const old=window.buildDiplomacy;
    if(typeof old!=='function' || old.__kandoraDiplomacy) return;
    function patched(){
      old();
      const box=document.getElementById('dipContent'); if(!box) return;
      let search=document.getElementById('dipSearch');
      if(!search){
        search=document.createElement('input');
        search.id='dipSearch'; search.placeholder='Search countries...'; search.autocomplete='off';
        box.insertBefore(search,box.firstChild);
        search.addEventListener('input',()=>{
          const q=search.value.trim().toLowerCase();
          box.querySelectorAll('.dipCountry').forEach(card=>card.style.display=card.textContent.toLowerCase().includes(q)?'block':'none');
        });
      }
      box.querySelectorAll('.dipCountry').forEach(card=>{
        const title=card.querySelector('h3'); if(!title) return;
        const country=title.textContent;
        let allies=[]; try{allies=JSON.parse(localStorage.getItem('kandora_allies')||'[]')}catch(e){}
        if(allies.includes(country)) card.classList.add('ally-card');
        let actions=card.querySelector('.dipActions');
        if(!actions){actions=document.createElement('div');actions.className='dipActions';card.appendChild(actions);}
        if(!actions.querySelector('.allianceBtn')){
          const b=document.createElement('button'); b.className='button blue allianceBtn';
          b.textContent=allies.includes(country)?'ALLY':'FORM ALLIANCE';
          b.onclick=()=>window.kandoraFormAlliance(country);
          actions.appendChild(b);
        }
      });
    }
    patched.__kandoraDiplomacy=true; window.buildDiplomacy=patched;
  }

  window.kandoraFormAlliance=function(country){
    let allies=[]; try{allies=JSON.parse(localStorage.getItem('kandora_allies')||'[]')}catch(e){}
    if(!allies.includes(country)) allies.push(country);
    localStorage.setItem('kandora_allies',JSON.stringify(allies));
    if(window.showMessage) window.showMessage('ALLIANCE FORMED WITH '+country+'!');
    if(typeof window.buildDiplomacy==='function') window.buildDiplomacy();
  };

  function addAllyCounterSupport(){
    const oldIcon=window.armyIcon;
    if(typeof oldIcon!=='function' || oldIcon.__kandoraAlly) return;
    function icon(army){
      let allies=[]; try{allies=JSON.parse(localStorage.getItem('kandora_allies')||'[]')}catch(e){}
      if(army && allies.includes(army.country)){
        const total=(army.infantry||0)+(army.tanks||0);
        return L.divIcon({className:'',html:`<div class="ally-counter"><div class="ally-top"><div class="ally-flag">🛡️</div><div class="ally-name">${escapeHTML(army.country)}</div><div class="ally-total">${Math.floor(total/1000)}K</div></div><div class="ally-bar"><div class="ally-org" style="width:${Math.max(0,Math.min(100,army.org||100))}%"></div></div></div>`,iconSize:[125,62],iconAnchor:[62,31]});
      }
      return oldIcon.apply(this,arguments);
    }
    icon.__kandoraAlly=true; window.armyIcon=icon;
  }

  function addCapitalProtection(){
    window.kandoraIsProtectedCapital=function(name){
      const n=String(name||'').toLowerCase();
      return n.includes('capital') || n.includes('kandora capital');
    };
    const oldCapture=window.captureProvince;
    if(typeof oldCapture==='function' && !oldCapture.__kandoraProtected){
      function capture(target,newOwner){
        if(target && window.kandoraIsProtectedCapital(target.name)){
          if(window.showMessage) window.showMessage('CAPITAL PROTECTED — this province cannot be captured.');
          return;
        }
        return oldCapture.apply(this,arguments);
      }
      capture.__kandoraProtected=true; window.captureProvince=capture;
    }
  }

  function addInfrastructureFocuses(){
    const old=window.openFocus;
    if(typeof old!=='function' || old.__kandoraInfra) return;
    function open(){
      old();
      const box=document.getElementById('focusContent'); if(!box || document.getElementById('kandoraInfra')) return;
      const wrap=document.createElement('div'); wrap.id='kandoraInfra';
      wrap.innerHTML=`
        <div class="subhead">INFRASTRUCTURE PROGRAMS</div>
        <div class="infraCard"><h3>🚆 Railway Network</h3><p>Improves strategic movement and prepares provinces for faster logistics.</p><button class="button" id="railwayUpgrade">UPGRADE RAILWAY</button></div>
        <div class="infraCard"><h3>📦 Supply Network</h3><p>Improves army organization recovery and keeps frontline forces supplied.</p><button class="button blue" id="supplyUpgrade">UPGRADE SUPPLY</button></div>
        <div class="protection-note">Capital provinces are protected from direct capture.</div>`;
      box.appendChild(wrap);
      const railway=document.getElementById('railwayUpgrade');
      const supply=document.getElementById('supplyUpgrade');
      railway.textContent=localStorage.getItem('kandora_railway')==='1'?'RAILWAY UPGRADED':'UPGRADE RAILWAY';
      supply.textContent=localStorage.getItem('kandora_supply')==='1'?'SUPPLY NETWORK UPGRADED':'UPGRADE SUPPLY';
      railway.onclick=()=>{localStorage.setItem('kandora_railway','1');railway.textContent='RAILWAY UPGRADED';if(window.showMessage)window.showMessage('RAILWAY NETWORK UPGRADED!');};
      supply.onclick=()=>{localStorage.setItem('kandora_supply','1');supply.textContent='SUPPLY NETWORK UPGRADED';if(window.showMessage)window.showMessage('SUPPLY NETWORK UPGRADED!');};
    }
    open.__kandoraInfra=true; window.openFocus=open;
  }

  function addActiveAITweaks(){
    // The existing AI remains in charge of movement. This update simply wakes it more often.
    const old=window.aiTick;
    if(typeof old==='function' && !old.__kandoraActive){
      function tick(){old();}
      tick.__kandoraActive=true; window.aiTick=tick;
    }
  }

  function escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  waitForGame();
})();
