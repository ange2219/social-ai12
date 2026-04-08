/* ═══════════════════════════════════════════
   landing.js — Social IA Interactive Demo
   ═══════════════════════════════════════════ */

/* ── View navigation ── */
const ALL_VIEWS = ['v-landing', 'v-auth', 'v-onboard', 'v-app']
function showView(id) {
  ALL_VIEWS.forEach(vid => {
    const el = document.getElementById(vid)
    if (el) el.style.display = 'none'
  })
  const target = document.getElementById(id)
  if (!target) return
  target.style.display = id === 'v-app' ? 'flex' : 'block'
  window.scrollTo(0, 0)
  if (id === 'v-app') {
    go('dashboard', null)
    setTimeout(() => showWa(), 3000)
  }
  if (id === 'v-onboard') {
    obStep = 0
    renderOb()
  }
}

/* ── Hamburger menu ── */
function toggleMenu() {
  document.getElementById('mob-menu')?.classList.toggle('open')
}

/* ── FAQ ── */
function toggleFaq(el) {
  const wasOpen = el.classList.contains('open')
  document.querySelectorAll('.l-faq-item').forEach(i => i.classList.remove('open'))
  if (!wasOpen) el.classList.add('open')
}

/* ── Auth tabs ── */
function authTab(el, tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'))
  el.classList.add('on')
  document.getElementById('f-login').style.display = tab === 'login' ? 'block' : 'none'
  document.getElementById('f-register').style.display = tab === 'register' ? 'block' : 'none'
  document.getElementById('auth-h').textContent = tab === 'login' ? 'Bon retour' : 'Créer un compte'
  document.getElementById('auth-p').textContent = tab === 'login' ? 'Connectez-vous à votre espace' : 'Rejoignez 2 000+ professionnels'
}

/* ── Onboarding ── */
let obStep = 0
const obSteps = [
  {
    h: 'Votre marque',
    p: 'Dites-nous qui vous êtes — l\'IA s\'adapte',
    render: () => `
      <p style="font-size:.82rem;color:var(--t3);margin-bottom:1rem">Quel est votre secteur d'activité ?</p>
      <div class="ob-grid">
        ${['🛍️ E-commerce','🏋️ Fitness / Bien-être','🍽️ Restaurant','💼 Conseil / Coaching','📸 Créateur de contenu','🏠 Immobilier','💻 Tech / SaaS','🎨 Design / Art'].map(s => `<div class="ob-opt" onclick="obSel(this)"><span class="ob-opt-ico">${s.split(' ')[0]}</span><span class="ob-opt-t">${s.split(' ').slice(1).join(' ')}</span></div>`).join('')}
      </div>`
  },
  {
    h: 'Votre ton',
    p: 'Comment souhaitez-vous communiquer ?',
    render: () => `
      <div class="ob-grid">
        ${['😄 Décontracté & Amical','💼 Professionnel & Expert','✨ Inspirant & Motivant','🎭 Créatif & Original','📊 Informatif & Précis','🤝 Chaleureux & Proche'].map(s => `<div class="ob-opt" onclick="obSel(this)"><span class="ob-opt-ico">${s.split(' ')[0]}</span><span class="ob-opt-t">${s.split(' ').slice(1).join(' ')}</span></div>`).join('')}
      </div>`
  },
  {
    h: 'Vos plateformes',
    p: 'Sur quels réseaux voulez-vous publier ?',
    render: () => `
      <div class="ob-grid">
        ${[['IG','Instagram','#E1306C'],['FB','Facebook','#1877f2'],['IN','LinkedIn','#0a66c2'],['TK','TikTok','#000']].map(([code,name,color]) => `
          <div class="ob-opt" onclick="obSel(this)" style="flex-direction:column;text-align:center;padding:1.25rem .75rem">
            <div style="width:40px;height:40px;border-radius:10px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;margin:0 auto .5rem">${code}</div>
            <span class="ob-opt-t">${name}</span>
          </div>`).join('')}
      </div>`
  },
  {
    h: 'Fréquence',
    p: 'Combien de posts souhaitez-vous par semaine ?',
    render: () => `
      <div style="display:flex;flex-direction:column;gap:.65rem">
        ${[['3 posts / semaine','Idéal pour commencer'],['5 posts / semaine','Recommandé pour la croissance'],['7 posts / semaine','Pour les pros du contenu'],['Personnalisé','Je veux choisir moi-même']].map(([v,d]) => `
          <div class="ob-opt" onclick="obSel(this)" style="justify-content:space-between">
            <span class="ob-opt-t">${v}</span>
            <span style="font-size:.72rem;color:var(--t3)">${d}</span>
          </div>`).join('')}
      </div>`
  }
]

function renderOb() {
  const step = obSteps[obStep]
  document.getElementById('ob-h').textContent = step.h
  document.getElementById('ob-p').textContent = step.p
  document.getElementById('ob-body').innerHTML = step.render()
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('on', i === obStep))
  document.getElementById('ob-back').style.visibility = obStep === 0 ? 'hidden' : 'visible'
  document.getElementById('ob-next').textContent = obStep === obSteps.length - 1 ? 'Terminer →' : 'Continuer →'
}

function obSel(el) {
  el.closest('.ob-grid, div').querySelectorAll('.ob-opt').forEach(o => o.classList.remove('sel'))
  el.classList.add('sel')
}

function obGo(dir) {
  obStep += dir
  if (obStep < 0) { showView('v-auth'); return }
  if (obStep >= obSteps.length) {
    showGenOverlay()
    return
  }
  renderOb()
}

/* ── Generating overlay ── */
function showGenOverlay() {
  const ov = document.getElementById('gen-ov')
  ov.classList.add('on')
  const steps = document.querySelectorAll('.gs')
  let i = 0
  const iv = setInterval(() => {
    if (i > 0) steps[i - 1].classList.replace('on', 'done')
    if (i < steps.length) { steps[i].classList.add('on'); i++ }
    else {
      clearInterval(iv)
      setTimeout(() => {
        ov.classList.remove('on')
        steps.forEach(s => s.classList.remove('on', 'done'))
        showView('v-app')
      }, 800)
    }
  }, 600)
}

/* ── App navigation ── */
const screens = {
  dashboard: renderDashboard,
  posts:     renderPosts,
  calendar:  renderCalendar,
  analytics: renderAnalytics,
  settings:  renderSettings,
  profile:   renderProfile,
  motion:    renderMotion,
}

function go(section, navEl) {
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'))
  if (navEl) navEl.classList.add('on')
  else {
    const match = Array.from(document.querySelectorAll('.ni')).find(n => n.getAttribute('onclick')?.includes(`'${section}'`))
    if (match) match.classList.add('on')
  }
  const titles = { dashboard:'Tableau de bord', posts:'Mes Posts', calendar:'Calendrier', analytics:'Analytiques', settings:'Paramètres', profile:'Mon Profil', motion:'Motion Studio' }
  const tb = document.getElementById('tb-t')
  if (tb) tb.textContent = titles[section] || section
  const sc = document.getElementById('sc')
  if (sc && screens[section]) sc.innerHTML = screens[section]()
}

/* ── Mobile sidebar ── */
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open')
  document.getElementById('sidebar-overlay')?.classList.toggle('open')
}

function setMobNav(el) {
  document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('on'))
  el.classList.add('on')
}

/* ── WhatsApp toast ── */
function showWa() {
  const wa = document.getElementById('wa')
  wa.classList.add('on')
  setTimeout(() => wa.classList.remove('on'), 5000)
}

/* ── Modal ── */
function openModal() { document.getElementById('modal').classList.add('on') }
function closeModal() { document.getElementById('modal').classList.remove('on') }
function approve() {
  closeModal()
  const toast = document.createElement('div')
  toast.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:.65rem 1.25rem;border-radius:8px;font-size:.85rem;font-weight:600;z-index:600;transition:opacity .4s'
  toast.textContent = '✓ Post approuvé et programmé'
  document.body.appendChild(toast)
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400) }, 2500)
}

/* ═══════════════════════════════════════════
   SCREEN RENDERERS
═══════════════════════════════════════════ */

function renderDashboard() {
  return `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:.9rem">
      ${[['Posts publiés','21','📝','↑ 3 cette semaine','up'],['Engagement','4.2K','❤️','Likes · Commentaires','neu'],['Impressions','48.3K','👁️','Vues totales','neu'],['Brouillons','5','🗂️','En attente','neu']].map(([l,v,i,d,cls]) => `
        <div class="sc"><div class="sc-top"><span class="sc-l">${l}</span><span>${i}</span></div><div class="sc-v">${v}</div><div class="sc-d ${cls}">${d}</div></div>
      `).join('')}
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div class="sc">
        <div class="sc-top" style="margin-bottom:.75rem"><span class="sc-l">Activité — 4 semaines</span><span style="font-size:.72rem;color:var(--acc);font-weight:600">5.2 /sem</span></div>
        <svg width="100%" viewBox="0 0 200 48" preserveAspectRatio="none" style="height:48px;display:block">
          <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7B5CF5" stop-opacity=".25"/><stop offset="100%" stop-color="#7B5CF5" stop-opacity="0"/></linearGradient></defs>
          <path d="M 0,38 L 66,24 L 133,16 L 200,8 L 200,48 L 0,48 Z" fill="url(#sg)"/>
          <path d="M 0,38 L 66,24 L 133,16 L 200,8" stroke="#7B5CF5" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          ${[[0,38],[66,24],[133,16],[200,8]].map(([x,y],i) => `<circle cx="${x}" cy="${y}" r="3" fill="${i===3?'#7B5CF5':'#27272a'}" stroke="${i===3?'#fff':'#7B5CF5'}" stroke-width="1.5"/>`).join('')}
        </svg>
        <div style="display:flex;justify-content:space-between;margin-top:.5rem">
          ${['S-3','S-2','S-1','Cette sem.'].map((l,i) => `<div style="text-align:center"><div style="font-size:.72rem;font-weight:700;color:${i===3?'#7B5CF5':'#e4e4e7'}">${[3,4,6,8][i]}</div><div style="font-size:.58rem;color:#52525c">${l}</div></div>`).join('')}
        </div>
      </div>
      <div class="sc" style="display:flex;flex-direction:column;justify-content:space-between">
        <div class="sc-top"><span class="sc-l">Régularité</span></div>
        <div><div class="sc-v" style="font-size:2rem">5.2</div><div style="font-size:.72rem;color:#8e8e98;margin-top:.15rem">posts/semaine</div></div>
        <div><span style="font-size:.85rem;color:var(--acc)">●●●●</span><span style="font-size:.85rem;color:#27272a">●</span><div style="font-size:.68rem;color:#52525c;margin-top:.25rem">Bonne régularité</div></div>
      </div>
      <div class="sc" style="display:flex;flex-direction:column;justify-content:space-between">
        <div class="sc-top"><span class="sc-l">Meilleure plateforme</span></div>
        <div style="display:flex;align-items:center;gap:.65rem;margin:.5rem 0">
          <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.7rem;font-weight:700">IG</div>
          <div><div style="font-size:.9rem;font-weight:700;color:#f4f4f6">Instagram</div><div style="font-size:.7rem;color:#52525c">2 847 interactions</div></div>
        </div>
        <div style="height:3px;background:#27272a;border-radius:2px"><div style="height:100%;width:100%;background:var(--acc);border-radius:2px"></div></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;margin-bottom:1.5rem">
      <div class="sc" style="background:linear-gradient(135deg,#0d0d1a,#111113);border-color:rgba(123,92,245,.25)">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.65rem">
          <div style="width:24px;height:24px;border-radius:6px;background:rgba(123,92,245,.15);display:flex;align-items:center;justify-content:center">✨</div>
          <span style="font-size:.72rem;color:var(--acc);font-weight:600;text-transform:uppercase;letter-spacing:.06em">Suggestion IA</span>
        </div>
        <p style="font-size:.8rem;color:#c4c4cc;line-height:1.55;margin:0">Publier au moins 3x/semaine double en moyenne le taux d'engagement. Vous y êtes presque !</p>
      </div>
      <div class="sc">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem"><span class="sc-l">Quota mensuel</span><span style="font-size:.72rem;color:#52525c;font-weight:600">21 / 100</span></div>
        <div style="height:6px;background:#27272a;border-radius:3px;overflow:hidden;margin-bottom:.6rem"><div style="height:100%;border-radius:3px;width:21%;background:var(--acc)"></div></div>
        <div style="font-size:.72rem;color:#52525c">Plan Premium · Accès étendu</div>
      </div>
      <div class="sc" style="padding:1rem 1.1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.65rem"><span class="sc-l">Programmés</span><span style="font-size:.7rem;color:var(--acc);cursor:pointer" onclick="go('calendar',null)">Calendrier →</span></div>
        <div style="display:flex;flex-direction:column;gap:.45rem">
          ${[['🌿','La nature nous rappelle…','Lun. 06 avr., 10h00'],['🚀','5 stratégies pour dominer…','Mar. 07 avr., 14h30'],['💡','3 erreurs que font 90%…','Mer. 08 avr., 09h00']].map(([ico,txt,date]) => `
            <div style="display:flex;align-items:center;gap:.55rem">
              <span style="font-size:.9rem">${ico}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:.73rem;color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${txt}</div>
                <div style="font-size:.63rem;color:#52525c">${date}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`
}

function renderPosts() {
  const posts = [
    { icon:'🌿', txt:'🌱 La nature nous rappelle que la croissance prend du temps. Avec la bonne stratégie, chaque graine devient une forêt. #Growth #Mindset', platforms:['ig','fb'], status:'st-a', statusTxt:'Publié', date:'2 avr.', eng:'↑ 248 interactions' },
    { icon:'🚀', txt:'5 stratégies pour dominer les réseaux sociaux en 2026 — Thread complet. 1/ Publiez régulièrement. La régularité bat le contenu parfait.', platforms:['li'], status:'st-p', statusTxt:'En attente', date:'7 avr.', eng:'' },
    { icon:'💡', txt:'3 erreurs que font 90% des entrepreneurs sur Instagram (et comment les éviter). Sauvegardez ce post — vous en aurez besoin.', platforms:['ig','li'], status:'st-pub', statusTxt:'Programmé', date:'8 avr.', eng:'' },
    { icon:'📊', txt:'Vos analytics ne mentent pas. Regardez vos 3 meilleurs posts du mois. Qu\'ont-ils en commun ? La réponse est votre prochaine stratégie.', platforms:['fb','li'], status:'st-a', statusTxt:'Publié', date:'1 avr.', eng:'↑ 184 interactions' },
    { icon:'🎯', txt:'Le secret du marketing de contenu que personne ne vous dit : la cohérence est plus puissante que la créativité. Voici pourquoi…', platforms:['ig'], status:'st-a', statusTxt:'Publié', date:'30 mars', eng:'↑ 312 interactions' },
  ]
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <div style="display:flex;gap:.5rem">
        ${['Tous','Publiés','Programmés','Brouillons'].map((t,i) => `<button onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.style.cssText='');this.style.background='var(--acc)';this.style.color='#fff';this.style.borderColor='var(--acc)'" style="padding:.4rem .9rem;border-radius:6px;font-size:.8rem;cursor:pointer;border:1px solid var(--b2);background:${i===0?'var(--acc)':'var(--s2)'};color:${i===0?'#fff':'var(--t2)'};" >${t}</button>`).join('')}
      </div>
      <button onclick="openModal()" style="padding:.5rem 1rem;background:var(--acc);color:#fff;border:none;border-radius:8px;font-size:.83rem;font-weight:600;cursor:pointer">+ Nouveau</button>
    </div>
    <div class="posts-list">
      ${posts.map(p => `
        <div class="post-row" onclick="openModal()">
          <div class="post-icon">${p.icon}</div>
          <div class="post-body">
            <div class="post-txt">${p.txt}</div>
            <div class="post-meta">
              ${p.platforms.map(pl => `<span class="pd ${pl}" style="width:16px;height:16px;border-radius:4px;font-size:.55rem">${pl==='ig'?'IG':pl==='fb'?'FB':pl==='li'?'IN':'TK'}</span>`).join('')}
              <span class="post-date">${p.date}</span>
            </div>
          </div>
          <div class="post-end">
            <span class="st ${p.status}">${p.statusTxt}</span>
            ${p.eng ? `<span class="post-eng">${p.eng}</span>` : ''}
          </div>
        </div>`).join('')}
    </div>`
}

function renderCalendar() {
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  const events = { 2:['🌿 Instagram','🚀 LinkedIn'], 5:['💡 Insta+LI'], 9:['📊 Facebook'], 12:['🎯 Instagram'], 16:['✨ Insta+FB'], 19:['📣 LinkedIn'] }
  let cells = ''
  for (let d = 1; d <= 30; d++) {
    const isToday = d === 3
    cells += `<div class="cal-day${isToday?' today':''}">
      <div class="cal-dn">${d}</div>
      ${(events[d]||[]).map((e,i) => `<div class="cal-ev${i===1?' ok':''}" title="${e}">${e}</div>`).join('')}
    </div>`
  }
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;color:var(--t1)">Avril 2026</div>
      <div style="display:flex;gap:.5rem">
        <button style="padding:.4rem .75rem;background:var(--s2);border:1px solid var(--b2);border-radius:6px;color:var(--t2);font-size:.8rem;cursor:pointer">← Préc.</button>
        <button style="padding:.4rem .75rem;background:var(--s2);border:1px solid var(--b2);border-radius:6px;color:var(--t2);font-size:.8rem;cursor:pointer">Suiv. →</button>
      </div>
    </div>
    <div class="cal-grid" style="margin-bottom:.5rem">
      ${days.map(d => `<div class="cal-day-h">${d}</div>`).join('')}
    </div>
    <div class="cal-grid">${cells}</div>`
}

function renderAnalytics() {
  const platforms = [['Instagram','ig','#e1306c',68],['Facebook','fb','#1877f2',22],['LinkedIn','li','#0a66c2',10]]
  const bars = [40,55,35,70,60,80,50].map((h,i) => `<div class="bar-w"><div class="bar" style="height:${h}px"></div><div class="bar-l">${['L','M','Me','J','V','S','D'][i]}</div></div>`).join('')
  return `
    <div class="analytics-grid">
      <div class="chart-card">
        <div class="chart-h">Engagement — 7 derniers jours</div>
        <div class="chart-bars">${bars}</div>
      </div>
      <div class="chart-card">
        <div class="chart-h">Répartition par plateforme</div>
        ${platforms.map(([name,cls,color,pct]) => `
          <div style="margin-bottom:.75rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
              <span style="font-size:.82rem;color:var(--t2)">${name}</span>
              <span style="font-size:.82rem;color:var(--t2)">${pct}%</span>
            </div>
            <div style="height:6px;background:var(--b1);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:3px"></div></div>
          </div>`).join('')}
      </div>
      <div class="chart-card">
        <div class="chart-h">Posts les plus performants</div>
        ${[['🌿','La nature nous rappelle…','312 interactions'],['🎯','Le secret du marketing…','248 interactions'],['📊','Vos analytics ne mentent pas…','184 interactions']].map(([ico,txt,eng]) => `
          <div style="display:flex;align-items:center;gap:.65rem;padding:.55rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="font-size:1.1rem">${ico}</span>
            <div style="flex:1;min-width:0"><div style="font-size:.8rem;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${txt}</div></div>
            <div style="font-size:.75rem;color:var(--ok);white-space:nowrap">${eng}</div>
          </div>`).join('')}
      </div>
      <div class="chart-card">
        <div class="chart-h">Résumé mensuel</div>
        ${[['Impressions totales','48 291','↑ +12.4%','ok'],['Taux d\'engagement','8.7%','↑ +2.1 pts','ok'],['Nouveaux abonnés','+234','↑ ce mois','ok'],['Posts publiés','21','Ce mois','neu']].map(([l,v,d,cls]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="font-size:.82rem;color:var(--t3)">${l}</span>
            <div style="text-align:right"><div style="font-size:.9rem;font-weight:700;color:var(--t1)">${v}</div><div style="font-size:.68rem;color:var(--${cls==='ok'?'ok':'t3'})">${d}</div></div>
          </div>`).join('')}
      </div>
    </div>`
}

function renderSettings() {
  return `
    <div class="settings-sections">
      <div class="settings-sec">
        <div class="settings-sec-h">Notifications</div>
        ${[['Alertes WhatsApp','Recevez vos posts générés sur WhatsApp',true],['Notifications email','Récapitulatif hebdomadaire par email',true],['Rappels publication','30 min avant chaque post programmé',false]].map(([l,d,on]) => `
          <div class="settings-row">
            <div><div class="settings-label">${l}</div><div class="settings-desc">${d}</div></div>
            <div class="toggle${on?' on':''}" onclick="this.classList.toggle('on')"></div>
          </div>`).join('')}
      </div>
      <div class="settings-sec">
        <div class="settings-sec-h">Intelligence Artificielle</div>
        ${[['Génération automatique','L\'IA génère vos posts chaque semaine automatiquement',true],['Optimisation horaires','Publication aux heures de pic de votre audience',true],['Hashtags intelligents','Suggestions de hashtags adaptées à chaque post',true]].map(([l,d,on]) => `
          <div class="settings-row">
            <div><div class="settings-label">${l}</div><div class="settings-desc">${d}</div></div>
            <div class="toggle${on?' on':''}" onclick="this.classList.toggle('on')"></div>
          </div>`).join('')}
      </div>
      <div class="settings-sec">
        <div class="settings-sec-h">Compte</div>
        <div class="settings-row"><div class="settings-label">Plan actuel</div><span style="font-size:.82rem;color:var(--acc);font-weight:600">Gratuit</span></div>
        <div class="settings-row"><div class="settings-label">Langue</div><span style="font-size:.82rem;color:var(--t2)">Français</span></div>
        <div class="settings-row"><div class="settings-label" style="color:var(--err);cursor:pointer">Supprimer mon compte</div></div>
      </div>
    </div>`
}

function renderProfile() {
  return `
    <div class="profile-header">
      <div class="profile-av">AM</div>
      <div>
        <div class="profile-name">Alex Martin</div>
        <div class="profile-email">alex.martin@exemple.com</div>
        <div class="profile-plan">Plan Gratuit</div>
      </div>
    </div>
    <div class="settings-sec" style="margin-bottom:1rem">
      <div class="settings-sec-h">Informations</div>
      ${[['Prénom','Alex'],['Nom','Martin'],['Secteur','E-commerce'],['Ton','Décontracté & Amical']].map(([l,v]) => `
        <div class="settings-row"><div class="settings-label">${l}</div><span style="font-size:.82rem;color:var(--t2)">${v}</span></div>`).join('')}
    </div>
    <div class="settings-sec">
      <div class="settings-sec-h">Comptes connectés</div>
      <div class="accounts-list">
        ${[['IG','Instagram','@alex.martin.co','linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)'],['FB','Facebook','Alex Martin','#1877f2'],['IN','LinkedIn','Alex Martin','#0a66c2']].map(([code,name,handle,bg]) => `
          <div class="account-row">
            <div class="account-icon" style="background:${bg};display:flex;align-items:center;justify-content:center;color:#fff;font-size:.65rem;font-weight:700">${code}</div>
            <div><div class="account-name">${name}</div><div class="account-handle">${handle}</div></div>
            <div class="account-status" style="margin-left:auto">Connecté</div>
            <div class="account-disc" style="margin-left:.75rem">Déconnecter</div>
          </div>`).join('')}
        <button style="width:100%;padding:.65rem;background:var(--s2);border:1px dashed var(--b2);border-radius:10px;color:var(--t3);font-size:.82rem;cursor:pointer;transition:all .2s" onmouseover="this.style.color='var(--t1)'" onmouseout="this.style.color='var(--t3)'">+ Connecter un réseau</button>
      </div>
    </div>`
}

function renderMotion() {
  return `
    <div class="motion-coming">
      <div class="motion-badge">Bientôt disponible — V2</div>
      <div style="font-size:3rem">🎬</div>
      <h2>Motion Studio</h2>
      <p>Transformez automatiquement vos posts en vidéos et reels optimisés pour Instagram, TikTok et YouTube Shorts.</p>
      <button style="padding:.75rem 2rem;background:var(--acc);color:#fff;border:none;border-radius:9px;font-size:.88rem;font-weight:600;cursor:pointer">Me notifier au lancement</button>
    </div>`
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  showView('v-landing')
})
