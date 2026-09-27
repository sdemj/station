/* ==========================================================================
   숫자 퍼레이드 페스티벌 — 스테이션 학습 웹앱
   패드(태블릿)마다 독립 동작. 스테이션+번호는 이 기기에 localStorage로 저장됨.
   station.ready=false 인 스테이션은 아직 실제 미션 콘텐츠가 없는 "틀"이며,
   sentence/distractors/steps 값만 채우면 바로 실제 미션처럼 동작하는 뼈대입니다.
   ========================================================================== */

const STATIONS = [
  {
    id: 1,
    name: '숫자 방송국',
    sub: '숫자 듣기 · 다시 듣기 · 정답 보기',
    badge: 'assets/badge-1-broadcast.png',
    color: '#F25C4B', colorDark: '#BF3A2C',
    ready: true,
    steps: [
      '방송을 듣고, 들은 수를 주판에 놓아요.',
      '<b>다음</b> 버튼을 누르고 화면 속 주판과 내 주판을 비교해요. 다르면 다시 고쳐요.',
      '미션을 마치고 받은 <b>암호 조각</b>을 친구들에게 알려 줘요.',
      '네 친구의 조각을 모아 <b>암호</b>를 만들어요.',
      '완성한 암호를 넣으면 <b>뱃지</b>를 받아요.'
    ],
    sentence: ['소리를', '잘 들으면', '크게', '보여요'],
    distractors: ['수가', '주판이']
  },
  {
    id: 2,
    name: '짝꿍 광장',
    sub: '숫자와 그림 주판 짝 확인',
    badge: 'assets/badge-2-pair.png',
    color: '#4BA3EE', colorDark: '#2B74B8',
    ready: false,
    steps: [
      '이 스테이션은 선생님이 준비 중이에요.',
      '완성되면 숫자 카드와 그림 주판 카드의 짝을 찾는 미션이 열려요.'
    ],
    sentence: ['짝꿍을', '잘', '찾으면', '보여요'],
    distractors: ['먼저', '다시']
  },
  {
    id: 3,
    name: '열 묶음 공방',
    sub: '만들 수 제시 · 십/일 자리 확인',
    badge: 'assets/badge-3-bundle.png',
    color: '#FFC53D', colorDark: '#D9961A',
    ready: false,
    steps: [
      '이 스테이션은 선생님이 준비 중이에요.',
      '완성되면 제시된 수만큼 열 묶음과 낱개를 만드는 미션이 열려요.'
    ],
    sentence: ['열개씩', '묶어서', '세어', '봐요'],
    distractors: ['다시', '천천히']
  },
  {
    id: 4,
    name: '주판 해설대',
    sub: '말하기 차례 · 설명 문장 제시',
    badge: 'assets/badge-4-explain.png',
    color: '#5CB84A', colorDark: '#3A8A2C',
    ready: false,
    steps: [
      '이 스테이션은 선생님이 준비 중이에요.',
      '완성되면 자기 주판을 말로 설명하는 미션이 열려요.'
    ],
    sentence: ['또박또박', '자신있게', '설명해', '봐요'],
    distractors: ['크게', '조용히']
  },
  {
    id: 5,
    name: '오류 탐정소',
    sub: '틀린 주판 그림 · 고친 모습 확인',
    badge: 'assets/badge-5-detective.png',
    color: '#9D6DE3', colorDark: '#6E44B0',
    ready: false,
    steps: [
      '이 스테이션은 선생님이 준비 중이에요.',
      '완성되면 틀린 주판 그림을 찾아 고치는 미션이 열려요.'
    ],
    sentence: ['틀린곳을', '찾아서', '고쳐', '봐요'],
    distractors: ['다시', '천천히']
  }
];

const SINO = ['영','일','이','삼','사','오','육','칠','팔','구','십','십일','십이','십삼','십사','십오','십육','십칠','십팔','십구','이십'];
const NATIVE = ['영','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉','열','열하나','열둘','열셋','열넷','열다섯','열여섯','열일곱','열여덟','열아홉','스물'];
const CIRCLED = ['①','②','③','④','⑤'];

/* ---------------- persistence ---------------- */
function loadPad(){
  try{
    const st = localStorage.getItem('np_station');
    const pd = localStorage.getItem('np_pad');
    if(st && pd) return { station: Number(st), number: Number(pd) };
  }catch(e){}
  return null;
}
function savePad(p){
  try{
    localStorage.setItem('np_station', String(p.station));
    localStorage.setItem('np_pad', String(p.number));
  }catch(e){}
}
function clearPad(){
  try{
    localStorage.removeItem('np_station');
    localStorage.removeItem('np_pad');
  }catch(e){}
}

let pad = loadPad();
let rt = {
  screen: pad ? 'stationHome' : 'intro',
  missionIndex: 0,
  missionNumbers: [],
  wordBank: [],
  slots: [null, null, null, null],
  settingsOpen: false,
  pendingStation: null,
  pendingPad: null
};

function currentStation(){ return STATIONS.find(s => s.id === pad.station); }
function circled(id){ return CIRCLED[id - 1]; }

/* ---------------- helpers ---------------- */
function shuffle(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandomNumbers(count, min, max){
  const pool = [];
  for(let i = min; i <= max; i++) pool.push(i);
  return shuffle(pool).slice(0, count);
}
function hexAlpha(hex, a){
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function hintForDigit(place, d){
  if(d === 0) return null;
  if(d < 5) return `${place} 아래알 ${d}개 올리기`;
  if(d === 5) return `${place} 윗알 1개 내리기`;
  return `${place} 윗알 내리고, 아래알 ${d - 5}개 올리기`;
}
function hintChips(n){
  const tens = Math.floor(n / 10), units = n % 10;
  const chips = [hintForDigit('십', tens), hintForDigit('일', units)].filter(Boolean);
  if(chips.length === 0) chips.push('모든 알을 내려서 0을 만들어요');
  return chips;
}

/* ---------------- 그림 주판 ---------------- */
function upperRodHTML(digit){
  const on = digit >= 5;
  return `<div class="rod"><div class="bar"></div>${on ? '<div class="spacer"></div>' : ''}<div class="bead"></div>${on ? '<div style="height:3px"></div>' : ''}</div>`;
}
function lowerRodHTML(digit){
  const on = digit % 5, off = 4 - on;
  let beads = '';
  for(let i = 0; i < on; i++) beads += '<div class="bead"></div>';
  beads += '<div class="spacer"></div>';
  for(let i = 0; i < off; i++) beads += '<div class="bead"></div>';
  return `<div class="rod"><div class="bar"></div>${beads}</div>`;
}
function abacusHTML(n){
  const tens = Math.floor(n / 10), units = n % 10;
  const digits = [0, 0, 0, tens, units];
  const labels = ['', '', '', '십', '일'];
  return `<div class="abacus">
    <div class="abacus-frame">
      <div class="abacus-row upper">${digits.map(upperRodHTML).join('')}</div>
      <div class="abacus-row lower">${digits.map(lowerRodHTML).join('')}</div>
    </div>
    <div class="abacus-labels">${labels.map(l => `<div class="lbl jua">${l}</div>`).join('')}</div>
  </div>`;
}

/* ---------------- 음성 ---------------- */
function speakNumber(n){
  const caption = document.getElementById('fallback-caption');
  if(!('speechSynthesis' in window)){
    if(caption){
      caption.style.display = 'block';
      caption.textContent = `🔈 소리 대신 보여줘요: ${n} (${SINO[n]})`;
    }
    return;
  }
  if(caption) caption.style.display = 'none';
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(SINO[n]);
    u.lang = 'ko-KR';
    u.rate = 0.85;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  }catch(e){
    if(caption){
      caption.style.display = 'block';
      caption.textContent = `🔈 소리 대신 보여줘요: ${n} (${SINO[n]})`;
    }
  }
}

/* ---------------- 공통 조각 ---------------- */
function gearHTML(){
  return '<button class="gear-btn" data-action="open-settings" aria-label="패드 설정">⚙</button>';
}
function settingsModal(){
  if(!rt.settingsOpen) return '';
  const s = currentStation();
  return `<div class="modal-overlay">
    <div class="modal-card">
      <div class="modal-title jua">패드 설정</div>
      <div class="modal-body">현재: ${circled(s.id)} ${s.name} · ${pad.number}번 패드<br>바꾸려면 아래 버튼을 눌러요 (선생님 전용).</div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-action="close-settings">닫기</button>
        <button class="btn btn-primary" data-action="reassign">다시 지정하기</button>
      </div>
      <button class="reset-link" data-action="reset-intro">처음 화면(인트로)부터 다시 보기</button>
    </div>
  </div>`;
}
function padChipHTML(){
  return `<div class="pad-chip"><div class="num jua">${pad.number}</div><span class="jua">${pad.number}번 패드</span></div>`;
}
function headerHTML(s, opts = {}){
  const { big = false, dots = null } = opts;
  const badgeSize = big ? 140 : 120;
  const nameSize = big ? 56 : 48;
  let right = '';
  if(dots){
    const { index, total } = dots;
    let dotHtml = '';
    for(let i = 0; i < total; i++){
      if(i < index) dotHtml += '<div class="dot done"></div>';
      else if(i === index) dotHtml += '<div class="dot current"></div>';
      else dotHtml += '<div class="dot"></div>';
    }
    right += `<div class="mission-count"><div class="progress-dots">${dotHtml}</div><span class="jua">내 미션 ${index + 1} / ${total}</span></div>`;
  }
  right += padChipHTML();
  return `<div class="station-header" style="background:${s.color};box-shadow:inset 0 -10px 0 ${s.colorDark}">
    <div style="display:flex;align-items:center;gap:${big ? 24 : 22}px">
      <img class="badge-img" src="${s.badge}" alt="${s.name} 뱃지" style="width:${badgeSize}px;height:${badgeSize}px;margin:-20px 0 -20px -8px">
      <div class="titles">
        <div class="eyebrow jua">스테이션 ${circled(s.id)}</div>
        <div class="name jua" style="font-size:${nameSize}px">${s.name}</div>
      </div>
    </div>
    <div class="header-right">${right}</div>
  </div>`;
}

/* ---------------- 화면 렌더 ---------------- */
function renderIntro(){
  return `<div class="screen">
    <div class="intro-bg"></div><div class="intro-fade"></div>
    <div class="intro-content">
      <div class="intro-title-wrap">
        <div class="intro-title-card">
          <div class="eyebrow jua">주판으로 만나는 0~20</div>
          <div class="title jua"><span style="color:var(--s1)">숫</span><span style="color:var(--s3)">자</span><span style="color:var(--s4)">&nbsp;퍼</span><span style="color:var(--s2)">레</span><span style="color:var(--s5)">이</span><span style="color:var(--candy)">드</span></div>
          <div class="sub jua">페스티벌</div>
        </div>
      </div>
      <button class="btn btn-primary" style="height:96px;padding:0 72px;font-size:40px;border:4px solid #fff;box-shadow:0 9px 0 var(--s3-dark),0 16px 30px rgba(58,42,30,.3)" data-action="start-festival">축제 시작!</button>
    </div>
  </div>`;
}

function renderSetup(){
  const sel = rt.pendingStation, padSel = rt.pendingPad;
  const stationCards = STATIONS.map(s => {
    const selected = sel === s.id;
    return `<div class="station-pick ${selected ? 'selected' : ''}" style="${selected ? `border-color:${s.color};--pickc-dark:${s.colorDark}` : ''}" data-action="pick-station" data-station="${s.id}">
      <div class="check" style="${selected ? `background:${s.colorDark}` : ''}">✓</div>
      <img src="${s.badge}" alt="">
      <div class="ord jua">${circled(s.id)}</div>
      <div class="name jua">${s.name}</div>
    </div>`;
  }).join('');
  const padCards = [1, 2, 3, 4].map(n => {
    const selected = padSel === n;
    return `<div class="pad-pick ${selected ? 'selected' : ''}" data-action="pick-pad" data-pad="${n}"><div class="circle jua">${n}</div></div>`;
  }).join('');
  const ready = sel && padSel;
  const st = sel ? STATIONS.find(x => x.id === sel) : null;
  const summary = ready
    ? `<span class="jua" style="font-size:26px">${circled(sel)} ${st.name} · ${padSel}번 패드</span>로 지정`
    : '스테이션과 패드 번호를 선택해 주세요';
  return `<div class="screen">
    <div class="setup-body">
      <div class="setup-heading">
        <div class="label">선생님 설정 · 이 패드는 이 자리에 놓여요</div>
        <div class="title jua">이 패드 지정하기</div>
      </div>
      <div class="section-label jua">스테이션</div>
      <div class="station-grid">${stationCards}</div>
      <div class="section-label jua" style="margin-top:6px">패드 번호 <span class="muted" style="font-family:'Gowun Dodum';font-size:18px">암호 조각의 순서가 돼요</span></div>
      <div class="pad-grid">${padCards}</div>
      <div style="flex:1"></div>
      <div class="setup-footer">
        <div>${summary}</div>
        <button class="btn ${ready ? 'btn-primary' : 'btn-disabled'}" data-action="confirm-setup" ${ready ? '' : 'disabled'}>지정 완료</button>
      </div>
    </div>
  </div>`;
}

function renderStationHome(){
  const s = currentStation();
  return `<div class="screen">
    ${headerHTML(s, { big: true })}
    <div class="home-steps"><div class="home-steps-inner">
      <div class="home-steps-title jua">이렇게 해요</div>
      ${s.steps.map((t, i) => `<div class="step-row"><div class="step-num jua" style="background:${s.color}">${i + 1}</div><div class="step-text">${t}</div></div>`).join('')}
    </div></div>
    <div class="home-footer"><button class="btn btn-primary" data-action="begin-mission">시작!</button></div>
    ${gearHTML()}${settingsModal()}
  </div>`;
}

function renderMission(){
  const s = currentStation();
  return `<div class="screen">
    ${headerHTML(s, { dots: { index: rt.missionIndex, total: rt.missionNumbers.length } })}
    <div class="mission-body">
      <div class="mission-prompt jua">잘 듣고, 들은 수를 주판에 놓아요</div>
      <button class="listen-btn" style="background:${s.color};box-shadow:0 14px 0 ${s.colorDark},0 0 0 24px ${hexAlpha(s.color, .25)},0 0 0 52px ${hexAlpha(s.color, .12)}" data-action="listen">
        <div class="icon">♪</div><div class="label jua">듣기</div>
      </button>
      <div id="fallback-caption" class="listen-hint jua" style="display:none"></div>
      <div class="listen-hint">친구들은 다른 수를 들어요 · 내 주판에 혼자 놓아요</div>
    </div>
    <div class="mission-footer"><button class="btn btn-success" data-action="mission-next">다음</button></div>
    ${gearHTML()}${settingsModal()}
  </div>`;
}

function renderCheck(){
  const s = currentStation();
  const n = rt.missionNumbers[rt.missionIndex];
  return `<div class="screen">
    ${headerHTML(s, { dots: { index: rt.missionIndex, total: rt.missionNumbers.length } })}
    <div class="check-body">
      <div class="check-title jua">내 주판과 똑같나요?</div>
      <div class="check-row">
        <div class="number-card" style="border-color:${s.color}">
          <div class="n jua">${n}</div>
          <div class="read">${SINO[n]} · ${NATIVE[n]}</div>
        </div>
        ${abacusHTML(n)}
      </div>
      <div class="hint-row">${hintChips(n).map(h => `<div class="hint-chip">${h}</div>`).join('')}</div>
    </div>
    <div class="check-footer">
      <button class="btn btn-outline" data-action="check-relisten">다시 들을래요</button>
      <button class="btn btn-success" data-action="check-match">똑같아요!</button>
    </div>
    ${gearHTML()}${settingsModal()}
  </div>`;
}

function renderPlaceholder(){
  const s = currentStation();
  return `<div class="screen">
    ${headerHTML(s, { big: true })}
    <div class="placeholder-body">
      <img src="${s.badge}" alt="">
      <div class="title jua">이 스테이션은 곧 준비돼요!</div>
      <div class="sub">${s.sub} — 선생님이 실제 미션을 채워 넣을 자리예요. 지금은 체험판으로 암호 조각을 받아볼 수 있어요.</div>
    </div>
    <div class="home-footer"><button class="btn btn-primary" data-action="placeholder-continue">조각 받기 (체험)</button></div>
    ${gearHTML()}${settingsModal()}
  </div>`;
}

function renderFragment(){
  const s = currentStation();
  const word = s.sentence[pad.number - 1];
  const leadText = s.ready ? `내 미션 ${rt.missionNumbers.length}개 완료!` : '체험 완료!';
  const dots = [1, 2, 3, 4].map(i => i === pad.number
    ? `<div class="order-dot mine jua" style="background:${s.color};box-shadow:0 4px 0 ${s.colorDark}">${i}</div>`
    : `<div class="order-dot pending jua">${i}</div>`).join('');
  return `<div class="screen">
    ${headerHTML(s)}
    <div class="fragment-body">
      <div class="fragment-lead"><div class="muted" style="font-size:22px">${leadText}</div><div class="jua" style="font-size:48px">암호 조각을 얻었어요</div></div>
      <div class="fragment-card" style="border:6px solid ${s.color};box-shadow:0 14px 0 ${s.colorDark}">
        <div class="num jua">${pad.number}</div>
        <div class="word jua">${word}</div>
      </div>
      <div class="order-row">${dots}</div>
      <div class="muted" style="font-size:22px;max-width:640px">1번부터 차례로 내 조각을 소리 내어 말해요. 친구 조각은 귀로 들어요!</div>
    </div>
    <div class="fragment-footer"><button class="btn btn-primary" data-action="go-password">암호 넣기 →</button></div>
    ${gearHTML()}${settingsModal()}
  </div>`;
}

function renderPassword(){
  const s = currentStation();
  const slotsHTML = rt.slots.map((w, i) => {
    const filled = w !== null;
    return `<div class="slot-item">
      <div class="slot-num jua ${filled ? 'filled' : ''}">${i + 1}</div>
      <div class="slot-box jua ${filled ? 'filled' : 'empty'}" style="${filled ? `background:${s.color};box-shadow:0 7px 0 ${s.colorDark}` : ''}">${filled ? w : ''}</div>
    </div>`;
  }).join('');
  const bankHTML = rt.wordBank.map((item, idx) =>
    `<div class="word-chip ${item.used ? 'used' : ''}" data-action="pick-word" data-idx="${idx}">${item.word}</div>`
  ).join('');
  const allFilled = rt.slots.every(x => x !== null);
  return `<div class="screen">
    ${headerHTML(s)}
    <div class="password-toast"><span id="pw-toast"></span></div>
    <div class="password-body">
      <div class="password-title jua">모둠 암호를 순서대로 넣어요</div>
      <div class="slot-row" id="slot-row">${slotsHTML}</div>
      <div class="word-bank">${bankHTML}</div>
    </div>
    <div class="password-footer">
      <button class="btn btn-outline" data-action="undo-word">← 하나 지우기</button>
      <button class="btn ${allFilled ? 'btn-primary' : 'btn-disabled'}" data-action="submit-password" ${allFilled ? '' : 'disabled'}>암호 확인</button>
    </div>
    ${gearHTML()}${settingsModal()}
  </div>`;
}

function renderBadge(){
  const s = currentStation();
  return `<div class="screen">
    <div class="badge-bg" style="background-image:url('assets/festival-bg.png')"></div>
    <div class="badge-overlay"></div>
    <div class="badge-content">
      <div class="eyebrow jua">암호 정답!</div>
      <img src="${s.badge}" alt="${s.name} 뱃지">
      <div class="title jua">${s.name} 뱃지를 얻었어요</div>
      <div class="note">활동지에 <b>암호</b>를 적고 뱃지 칸에 표시해요</div>
    </div>
    <div class="badge-footer">
      <div>우리 모둠은 다음 스테이션으로! 이 패드는 여기 그대로.</div>
      <button class="btn btn-primary" data-action="finish-mission">미션 완료</button>
    </div>
    ${gearHTML()}${settingsModal()}
  </div>`;
}

function render(){
  const stage = document.getElementById('stage');
  const renderers = {
    intro: renderIntro,
    setup: renderSetup,
    stationHome: renderStationHome,
    mission: renderMission,
    check: renderCheck,
    placeholder: renderPlaceholder,
    fragment: renderFragment,
    password: renderPassword,
    badge: renderBadge
  };
  stage.innerHTML = renderers[rt.screen]();
}

/* ---------------- 미션 흐름 ---------------- */
function resetMissionState(){
  rt.missionIndex = 0;
  rt.missionNumbers = [];
  rt.slots = [null, null, null, null];
  rt.wordBank = [];
}
function goToMissionNumber(){
  rt.screen = 'mission';
  render();
  speakNumber(rt.missionNumbers[rt.missionIndex]);
}
function beginMission(){
  const s = currentStation();
  if(s.ready){
    rt.missionNumbers = pickRandomNumbers(3, 0, 20);
    rt.missionIndex = 0;
    goToMissionNumber();
  }else{
    rt.screen = 'placeholder';
    render();
  }
}
function advanceMission(){
  rt.missionIndex++;
  if(rt.missionIndex < rt.missionNumbers.length){
    goToMissionNumber();
  }else{
    rt.screen = 'fragment';
    render();
  }
}
function setupPasswordRound(){
  const s = currentStation();
  rt.wordBank = shuffle([...s.sentence, ...s.distractors]).map(w => ({ word: w, used: false }));
  rt.slots = [null, null, null, null];
  rt.screen = 'password';
  render();
}
function pickWord(idx){
  const item = rt.wordBank[idx];
  if(!item || item.used) return;
  const empty = rt.slots.findIndex(x => x === null);
  if(empty === -1) return;
  rt.slots[empty] = item.word;
  item.used = true;
  render();
}
function undoWord(){
  let last = -1;
  for(let i = rt.slots.length - 1; i >= 0; i--){
    if(rt.slots[i] !== null){ last = i; break; }
  }
  if(last === -1) return;
  const w = rt.slots[last];
  rt.slots[last] = null;
  const item = rt.wordBank.find(it => it.word === w && it.used);
  if(item) item.used = false;
  render();
}
function submitPassword(){
  const s = currentStation();
  const correct = rt.slots.join('|') === s.sentence.join('|');
  if(correct){
    rt.screen = 'badge';
    render();
  }else{
    wrongAttempt();
  }
}
function wrongAttempt(){
  const toast = document.getElementById('pw-toast');
  const row = document.getElementById('slot-row');
  if(toast){ toast.textContent = '아직이에요! 순서를 다시 확인해요'; toast.classList.add('show'); }
  if(row){ row.classList.add('shake'); }
  setTimeout(() => {
    rt.slots = [null, null, null, null];
    rt.wordBank.forEach(it => it.used = false);
    render();
  }, 900);
}

/* ---------------- 이벤트 위임 ---------------- */
function handleAction(action, el){
  switch(action){
    case 'start-festival':
      rt.screen = 'setup'; rt.pendingStation = null; rt.pendingPad = null;
      render();
      break;
    case 'pick-station':
      rt.pendingStation = Number(el.dataset.station);
      render();
      break;
    case 'pick-pad':
      rt.pendingPad = Number(el.dataset.pad);
      render();
      break;
    case 'confirm-setup':
      pad = { station: rt.pendingStation, number: rt.pendingPad };
      savePad(pad);
      resetMissionState();
      rt.settingsOpen = false;
      rt.screen = 'stationHome';
      render();
      break;
    case 'open-settings':
      rt.settingsOpen = true;
      render();
      break;
    case 'close-settings':
      rt.settingsOpen = false;
      render();
      break;
    case 'reassign':
      rt.pendingStation = pad.station;
      rt.pendingPad = pad.number;
      rt.settingsOpen = false;
      rt.screen = 'setup';
      render();
      break;
    case 'reset-intro':
      clearPad();
      pad = null;
      resetMissionState();
      rt.settingsOpen = false;
      rt.pendingStation = null;
      rt.pendingPad = null;
      rt.screen = 'intro';
      render();
      break;
    case 'begin-mission':
      beginMission();
      break;
    case 'listen':
      speakNumber(rt.missionNumbers[rt.missionIndex]);
      break;
    case 'mission-next':
      rt.screen = 'check';
      render();
      break;
    case 'check-relisten':
      goToMissionNumber();
      break;
    case 'check-match':
      advanceMission();
      break;
    case 'placeholder-continue':
      rt.screen = 'fragment';
      render();
      break;
    case 'go-password':
      setupPasswordRound();
      break;
    case 'pick-word':
      pickWord(Number(el.dataset.idx));
      break;
    case 'undo-word':
      undoWord();
      break;
    case 'submit-password':
      submitPassword();
      break;
    case 'finish-mission':
      resetMissionState();
      rt.screen = 'stationHome';
      render();
      break;
  }
}

document.getElementById('stage-wrap').addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if(!el || el.disabled) return;
  handleAction(el.dataset.action, el);
});

/* ---------------- 화면 맞춤 ---------------- */
function fitStage(){
  const wrap = document.getElementById('stage-wrap');
  const stage = document.getElementById('stage');
  const scale = Math.min(wrap.clientWidth / 1180, wrap.clientHeight / 820);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitStage);
window.addEventListener('orientationchange', () => setTimeout(fitStage, 200));

fitStage();
render();
