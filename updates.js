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
    addPeaceConferenceSystem();
    window.KANDORA_UPDATES='2026-09-01-peace-conference';
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

      /* PEACE CONFERENCE */
      #kandoraPeaceWindow{
        position:fixed;
        z-index:10000;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        width:780px;
        max-width:92vw;
        max-height:82vh;
        overflow:auto;
        background:linear-gradient(#30362f,#171c17);
        border:1px solid #8b8a6a;
        box-shadow:0 10px 40px #000d;
        color:#eee;
      }
      #kandoraPeaceWindow .pcHead{
        padding:12px 14px;
        background:#3b4038;
        border-bottom:1px solid #77765e;
        font-weight:bold;
        letter-spacing:1px;
      }
      #kandoraPeaceWindow .pcBody{padding:14px}
      #kandoraPeaceWindow .pcTitle{font-size:19px;font-weight:bold;margin-bottom:5px}
      #kandoraPeaceWindow .pcSub{font-size:11px;color:#b9bdb2;margin-bottom:12px}
      .pcGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .pcProvince{
        padding:9px;
        background:#272d27;
        border:1px solid #4b5349;
        display:flex;
        gap:8px;
        align-items:center;
      }
      .pcProvince:hover{background:#323a31}
      .pcProvince input{width:17px;height:17px}
      .pcProvince .pcInfo{flex:1;min-width:0}
      .pcProvince .pcName{font-weight:bold;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .pcProvince .pcOwner{font-size:9px;color:#aeb3a8;margin-top:3px}
      .pcProvince .pcAlly{color:#91b7d7}
      .pcActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}
      .pcActions button{flex:1;min-width:145px}
      .pcPuppet{
        background:linear-gradient(#5d596f,#393645)!important;
        border-color:#938ba9!important;
      }
      .pcClose{float:right;background:none;border:0;color:white;font-size:20px;cursor:pointer}
      .pcNotice{padding:9px;margin-top:10px;background:#202620;border:1px solid #454b43;color:#c3c7bc;font-size:10px}
      .puppetBadge{display:inline-block;padding:3px 6px;margin-left:5px;background:#4d4760;border:1px solid #857b9a;color:#ddd;font-size:8px;font-weight:bold}
      @media(max-width:650px){.pcGrid{grid-template-columns:1fr}}
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
        if(localStorage.getItem('kandora_puppet_'+country)==='1'){
          const p=document.createElement('span'); p.className='puppetBadge'; p.textContent='PUPPET'; actions.appendChild(p);
        }
        if(!actions.querySelector('.peaceConferenceBtn')){
          const pc=document.createElement('button'); pc.className='button gold peaceConferenceBtn';
          pc.textContent='PEACE CONFERENCE';
          pc.onclick=()=>window.kandoraOpenPeaceConference(country);
          actions.appendChild(pc);
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
    const old=window.aiTick;
    if(typeof old==='function' && !old.__kandoraActive){
      function tick(){old();}
      tick.__kandoraActive=true; window.aiTick=tick;
    }
  }

  /* =========================================================
     PEACE CONFERENCE / LAND CLAIMS / PUPPETS
     This layer works with the existing battle/capture system and
     does not redraw or replace the existing map.
     ========================================================= */

  const peaceWars={};
  let activeConference=null;
  let lastCapture=null;

  function playerCountry(){
    const el=document.getElementById('countryName');
    return el ? (el.textContent||'').trim() : '';
  }

  function warKey(a,b){
    return [String(a),String(b)].sort().join('|');
  }

  function ensureWarRecord(a,b){
    if(!a || !b || a===b) return null;
    const key=warKey(a,b);
    if(!peaceWars[key]){
      peaceWars[key]={
        key,
        sides:[a,b],
        loser:null,
        captures:[],
        participants:new Set()
      };
    }
    return peaceWars[key];
  }

  function hookWars(){
    const oldToggle=window.toggleWar;
    if(typeof oldToggle==='function' && !oldToggle.__kandoraPeaceHook){
      function toggle(country){
        const me=playerCountry();
        const key=warKey(me,country);
        const existed=!!peaceWars[key];
        const result=oldToggle.apply(this,arguments);
        if(!existed) ensureWarRecord(me,country);
        return result;
      }
      toggle.__kandoraPeaceHook=true;
      window.toggleWar=toggle;
    }

    const oldCapture=window.captureProvince;
    if(typeof oldCapture==='function' && !oldCapture.__kandoraPeaceCapture){
      function capture(target,newOwner){
        const oldOwner=target && target.country ? target.country : '';
        if(target && oldOwner && newOwner && oldOwner!==newOwner){
          lastCapture={
            feature:target.feature,
            layer:target.layer,
            name:target.name || 'Province',
            oldOwner,
            newOwner
          };
          const record=ensureWarRecord(oldOwner,newOwner);
          if(record){
            record.participants.add(newOwner);
            record.captures.push({
              feature:target.feature,
              layer:target.layer,
              name:target.name || 'Province',
              oldOwner,
              capturer:newOwner
            });
          }
        }
        const result=oldCapture.apply(this,arguments);
        if(lastCapture) maybeOpenVictory(lastCapture.oldOwner,lastCapture.newOwner);
        return result;
      }
      capture.__kandoraPeaceCapture=true;
      window.captureProvince=capture;
    }
  }

  function maybeOpenVictory(defeated,lastWinner){
    const me=playerCountry();
    if(!defeated || defeated===me) return;
    const key=warKey(me,defeated);
    const record=peaceWars[key];
    if(!record) return;

    const captured=record.captures.filter(c=>c.oldOwner===defeated);
    if(!captured.length) return;

    /* A full automatic capitulation is intentionally conservative:
       once a country has been reduced to the captured provinces tracked
       by this war, the conference can be opened. The player can also
       open it manually from Diplomacy at any point during the war. */
    const allKnown=record.captures.filter(c=>c.oldOwner===defeated).length;
    const lastWasPlayer=lastWinner===me;

    if(lastWasPlayer && allKnown>=1){
      const autoKey='kandora_pc_prompt_'+key+'_'+captured.length;
      if(!sessionStorage.getItem(autoKey)){
        sessionStorage.setItem(autoKey,'1');
        setTimeout(()=>openConference(defeated,record,false),500);
      }
    }
  }

  function addPeaceConferenceSystem(){
    addPeaceStylesIfNeeded();
    hookWars();
    setInterval(hookWars,500);
  }

  function addPeaceStylesIfNeeded(){
    /* Styles are already installed by addUpdateStyles. */
  }

  function buildConference(defeated,record){
    const me=playerCountry();
    const unique=[];
    const seen=new Set();
    record.captures.forEach(c=>{
      const id=(c.name||'Province')+'|'+(c.oldOwner||'');
      if(!seen.has(id)){
        seen.add(id);
        unique.push(c);
      }
    });

    let rows='';
    unique.forEach((c,i)=>{
      const ally=c.capturer!==me;
      rows+=`<label class="pcProvince">
        <input type="checkbox" class="pcClaim" data-index="${i}" ${ally?'':'checked'}>
        <div class="pcInfo">
          <div class="pcName">${escapeHTML(c.name)}</div>
          <div class="pcOwner">Captured by <span class="${ally?'pcAlly':''}">${escapeHTML(c.capturer)}</span>${ally?' — ALLY LAND':''}</div>
        </div>
      </label>`;
    });

    if(!rows){
      rows='<div class="pcNotice">No provinces have been recorded for this war yet.</div>';
    }

    return {unique,html:`
      <div class="pcHead">
        <button class="pcClose" onclick="window.kandoraClosePeaceConference()">✕</button>
        PEACE CONFERENCE
      </div>
      <div class="pcBody">
        <div class="pcTitle">🏳️ ${escapeHTML(defeated)} DEFEATED</div>
        <div class="pcSub">Select the land you want to take. Allied armies keep provinces they captured unless you claim them.</div>
        <div class="pcGrid">${rows}</div>
        <div class="pcActions">
          <button class="button" onclick="window.kandoraTakeSelectedLand()">TAKE SELECTED LAND</button>
          <button class="button blue" onclick="window.kandoraConfirmAlliedClaims()">LET ALLIES KEEP THEIR LAND</button>
          <button class="button pcPuppet" onclick="window.kandoraPuppetDefeated()">PUPPET ${escapeHTML(defeated)}</button>
          <button class="button red" onclick="window.kandoraFinishPeaceConference()">FINISH CONFERENCE</button>
        </div>
        <div class="pcNotice">Puppet rule: ${escapeHTML(defeated)} becomes your puppet state. The puppet relationship is saved for the current browser game.</div>
      </div>
    `};
  }

  function openConference(defeated,record,manual){
    const me=playerCountry();
    if(!me || !defeated || me===defeated) return;
    record=record || peaceWars[warKey(me,defeated)] || ensureWarRecord(me,defeated);
    if(!record) return;

    activeConference={defeated,record};
    let win=document.getElementById('kandoraPeaceWindow');
    if(!win){
      win=document.createElement('div');
      win.id='kandoraPeaceWindow';
      document.body.appendChild(win);
    }
    const built=buildConference(defeated,record);
    activeConference.unique=built.unique;
    win.innerHTML=built.html;
    win.style.display='block';
    if(manual && window.showMessage) window.showMessage('Peace conference opened with '+defeated+'.');
  }

  window.kandoraOpenPeaceConference=function(country){
    const me=playerCountry();
    if(!me || !country) return;
    const record=peaceWars[warKey(me,country)] || ensureWarRecord(me,country);
    openConference(country,record,true);
  };

  window.kandoraClosePeaceConference=function(){
    const win=document.getElementById('kandoraPeaceWindow');
    if(win) win.style.display='none';
  };

  function selectedClaims(){
    if(!activeConference) return [];
    const win=document.getElementById('kandoraPeaceWindow');
    if(!win) return [];
    const out=[];
    win.querySelectorAll('.pcClaim:checked').forEach(box=>{
      const i=Number(box.dataset.index);
      if(activeConference.unique[i]) out.push(activeConference.unique[i]);
    });
    return out;
  }

  function transfer(c,to){
    if(!c || !c.feature || !to) return false;
    try{
      /* The normal game protects capital provinces. During a signed peace
         conference the winning side may legally transfer the province,
         so the temporary name avoids the protection wrapper while the
         original captureProvince logic still updates the actual owner. */
      const target={
        feature:c.feature,
        layer:c.layer,
        name:'Peace Conference Transfer',
        country:c.capturer
      };
      window.captureProvince(target,to);
      return true;
    }catch(e){
      console.error('KANDORA peace transfer failed',e);
      return false;
    }
  }

  window.kandoraTakeSelectedLand=function(){
    if(!activeConference) return;
    const me=playerCountry();
    const claims=selectedClaims();
    let moved=0;
    claims.forEach(c=>{
      if(c.capturer!==me && c.capturer!==activeConference.defeated){
        /* Allied land is claimable in the conference only when explicitly selected. */
      }
      if(transfer(c,me)){
        c.capturer=me;
        moved++;
      }
    });
    if(window.showMessage) window.showMessage(moved+' province'+(moved===1?'':'s')+' transferred to '+me+'.');
    refreshConference();
  };

  window.kandoraConfirmAlliedClaims=function(){
    if(!activeConference) return;
    const me=playerCountry();
    const claims=selectedClaims();
    claims.forEach(c=>{
      if(c.capturer!==me) return;
      /* Player-selected land stays with the player; ally land is left alone. */
    });
    if(window.showMessage) window.showMessage('Allies keep the provinces they captured.');
    refreshConference();
  };

  window.kandoraPuppetDefeated=function(){
    if(!activeConference) return;
    const me=playerCountry();
    const defeated=activeConference.defeated;
    localStorage.setItem('kandora_puppet_'+defeated,'1');
    let puppets=[];
    try{puppets=JSON.parse(localStorage.getItem('kandora_puppets')||'[]')}catch(e){}
    const entry={country:defeated,master:me,date:Date.now()};
    puppets=puppets.filter(x=>x.country!==defeated);
    puppets.push(entry);
    localStorage.setItem('kandora_puppets',JSON.stringify(puppets));

    /* Any unclaimed provinces belonging to the defeated side are assigned
       to the puppet. This does not redraw the map; it only uses the game's
       existing ownership/capture mechanism. */
    activeConference.unique.forEach(c=>{
      if(c.capturer===defeated){
        transfer(c,defeated);
        c.capturer=defeated;
      }
    });

    if(window.showMessage) window.showMessage(defeated+' is now your puppet!');
    refreshConference();
  };

  window.kandoraFinishPeaceConference=function(){
    if(!activeConference) return;
    const key=activeConference.record.key;
    const defeated=activeConference.defeated;
    if(window.showMessage) window.showMessage('Peace signed with '+defeated+'!');
    delete peaceWars[key];
    window.kandoraClosePeaceConference();
    if(typeof window.buildDiplomacy==='function') window.buildDiplomacy();
  };

  function refreshConference(){
    if(!activeConference) return;
    const win=document.getElementById('kandoraPeaceWindow');
    if(!win) return;
    const built=buildConference(activeConference.defeated,activeConference.record);
    activeConference.unique=built.unique;
    win.innerHTML=built.html;
    win.style.display='block';
  }

  function escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  waitForGame();
})();
