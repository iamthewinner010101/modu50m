/* ==========================================================================
   KBO Pro Baseball 2026 - Clean Slate JS Implementation
   ========================================================================== */

// 1. KBO 10 Teams Data
const KBO_TEAMS = [
    { id: 'kia', name: 'KIA 타이거즈', short: 'KIA', emblem: '🐯', color: '#e60024' },
    { id: 'samsung', name: '삼성 라이온즈', short: '삼성', emblem: '🦁', color: '#0066b2' },
    { id: 'lg', name: 'LG 트윈스', short: 'LG', emblem: '🛡️', color: '#c0004d' },
    { id: 'doosan', name: '두산 베어스', short: '두산', emblem: '🐻', color: '#131230' },
    { id: 'ssg', name: 'SSG 랜더스', short: 'SSG', emblem: '🚀', color: '#ce0e2d' },
    { id: 'kt', name: 'KT 위즈', short: 'KT', emblem: '🧙', color: '#2b2b2a' },
    { id: 'lotte', name: '롯데 자이언츠', short: '롯데', emblem: '⚓', color: '#041e42' },
    { id: 'hanwha', name: '한화 이글스', short: '한화', emblem: '🦅', color: '#ff6600' },
    { id: 'nc', name: 'NC 다이노스', short: 'NC', emblem: '🦕', color: '#073c6b' },
    { id: 'kiwoom', name: '키움 히어로즈', short: '키움', emblem: '🦸', color: '#820024' }
];

// Raw Player Name Data for generating 180 cards
const TEAM_ROSTERS_RAW = {
    kia: {
        batters: ['김도영', '최형우', '나성범', '박찬호', '소크라테스', '김선빈', '이우성', '한준수', '최원준'],
        pitchers: ['양현종', '네일', '정해영', '최지민', '전상현', '장현식', '곽도규', '임기영', '황동하']
    },
    samsung: {
        batters: ['구자욱', '김지찬', '이재현', '강민호', '맥키넌', '김영웅', '이성규', '류지혁', '김헌곤'],
        pitchers: ['원태인', '코너', '오승환', '김재윤', '임창민', '최지광', '이상민', '이승현', '레예스']
    },
    lg: {
        batters: ['홍창기', '신민재', '김현수', '오스틴', '문보경', '박동원', '박해민', '구본혁', '문성주'],
        pitchers: ['엔스', '임찬규', '유영찬', '김진성', '박명근', '함덕주', '백승현', '손주영', '켈리']
    },
    doosan: {
        batters: ['정수빈', '허경민', '양의지', '김재환', '양석환', '강승호', '라모스', '조수행', '전민재'],
        pitchers: ['곽빈', '알칸타라', '김택연', '홍건희', '최지강', '이병헌', '최원준', '김강률', '브랜든']
    },
    ssg: {
        batters: ['최정', '에레디아', '한유섬', '박성한', '최지훈', '이지영', '고명준', '하재훈', '김성현'],
        pitchers: ['김광현', '엘리아스', '조병현', '노경은', '문승원', '고효준', '송영진', '이로운', '오원석']
    },
    kt: {
        batters: ['강백호', '로하스', '장성우', '황재균', '오윤석', '김상수', '배정대', '신본기', '심우준'],
        pitchers: ['쿠에바스', '고영표', '박영현', '김민수', '손동현', '벤자민', '엄상백', '우규민', '김민']
    },
    lotte: {
        batters: ['레이예스', '황성빈', '전준우', '안치홍', '노진혁', '유강남', '윤동희', '김민석', '고승민'],
        pitchers: ['반즈', '윌커슨', '김원중', '구승민', '김상수', '진해수', '박세웅', '나균안', '한현희']
    },
    hanwha: {
        batters: ['노시환', '채은성', '안치홍', '페라자', '황영묵', '최재훈', '장진혁', '이도윤', '김태연'],
        pitchers: ['류현진', '문동주', '주현상', '김범수', '박상원', '한승혁', '산체스', '와이스', '김민우']
    },
    nc: {
        batters: ['박건우', '데이비슨', '권희동', '김주원', '서호철', '김형준', '박민우', '김성욱', '한석현'],
        pitchers: ['하트', '신민혁', '이용찬', '김영규', '김재열', '류진욱', '임정호', '이재학', '카스타노']
    },
    kiwoom: {
        batters: ['송성문', '도슨', '이주형', '김혜성', '최주환', '김재현', '고영우', '김태진', '장재영'],
        pitchers: ['헤이조', '후라도', '조상우', '김재웅', '문성현', '조영건', '김선기', '하영민', '이명종']
    }
};

// Available Skills Lists
const BATTER_SKILLS = ['해결사', '홈런왕', '스프레이 히터', '클러치 히터', '쌕쌕이', '안타 제조기'];
const PITCHER_SKILLS = ['닥터 K', '에이스', '끝판대장', '이닝 이터', '불펜의 핵', '소방수'];

// 2. Global Game State Variables
let gameState = {
    gold: 5000,
    packs: 3,
    myTeamId: '',
    oppTeamId: '',
    roster: [],
    startingLineup: { batter: null, pitcher: null }
};

// Match Play Variables
let gameActive = false;
let inningLimit = 1; // Default 1
let simulationMode = 'chance'; // 'chance' or 'full'
let currentInning = 1;
let halfInning = 'top'; // 'top' (opp attack) or 'bottom' (my attack)
let gameMode = 'batter'; // 'batter' (my team batting) or 'pitcher' (my team pitching)

// Scoring & Stats
let scores = { my: 0, opp: 0 };
let hits = { my: 0, opp: 0 };
let errors = { my: 0, opp: 0 };
let counts = { balls: 0, strikes: 0, outs: 0 };
let baseRunners = [false, false, false]; // [1B, 2B, 3B]

// UI State
let activeTab = 'play';
let selectedUpgradeCardId = null;
let activeUpgradeTab = 'enhance'; // 'enhance', 'train', 'skills', 'synthesis'
let synthSelectedIds = []; // Synthesis targets (max 3)
let rosterFilter = 'all';

// Audio Effects Fallbacks
const AUDIO_SYNTH = {
    hit: [150, 300, 0.1],
    strike: [600, 100, 0.08],
    ball: [300, 100, 0.08],
    catch: [100, 200, 0.15],
    applause: [440, 600, 0.4]
};

function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const synth = AUDIO_SYNTH[type];
        if (!synth) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(synth[0], audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(synth[1], audioCtx.currentTime + synth[2]);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + synth[2]);
        
        osc.start();
        osc.stop(audioCtx.currentTime + synth[2]);
    } catch (e) {
        console.warn('Audio synthesis failed: ', e);
    }
}

// 3. Card Generator Helper
function generateCard(teamId, pos, name, index) {
    const isBat = pos === '타자';
    // Decide tier based on index
    let tier = 'normal';
    if (index === 0) tier = 'legend';
    else if (index <= 2) tier = 'hero';
    else if (index <= 5) tier = 'special';

    // Base OVR ranges: Legend(85-88), Hero(78-84), Special(72-77), Normal(60-71)
    let baseOvr = 60 + Math.floor(Math.random() * 12);
    if (tier === 'legend') baseOvr = 85 + Math.floor(Math.random() * 4);
    else if (tier === 'hero') baseOvr = 78 + Math.floor(Math.random() * 7);
    else if (tier === 'special') baseOvr = 72 + Math.floor(Math.random() * 6);

    const baseStats = {};
    if (isBat) {
        baseStats.contact = baseOvr + (Math.random() > 0.5 ? 4 : -4);
        baseStats.power = baseOvr + (Math.random() > 0.5 ? 4 : -4);
        baseStats.speed = baseOvr + (Math.random() > 0.5 ? 4 : -4);
        baseStats.defense = baseOvr + (Math.random() > 0.5 ? 3 : -3);
        baseStats.throwing = baseOvr + (Math.random() > 0.5 ? 3 : -3);
    } else {
        baseStats.stuff = baseOvr + (Math.random() > 0.5 ? 4 : -4);
        baseStats.control = baseOvr + (Math.random() > 0.5 ? 4 : -4);
        baseStats.velocity = baseOvr + (Math.random() > 0.5 ? 4 : -4);
        baseStats.defense = baseOvr + (Math.random() > 0.5 ? 3 : -3);
        baseStats.stamina = baseOvr + (Math.random() > 0.5 ? 3 : -3);
    }

    // Skills allocation
    const skillPool = isBat ? BATTER_SKILLS : PITCHER_SKILLS;
    const skills = [];
    const skillCount = (tier === 'legend' || tier === 'hero') ? 2 : 1;
    for (let s = 0; s < skillCount; s++) {
        const randSkill = skillPool[Math.floor(Math.random() * skillPool.length)];
        if (!skills.includes(randSkill)) skills.push(randSkill);
    }

    return {
        id: `card-${teamId}-${isBat?'bat':'pit'}-${index}-${Date.now()}-${Math.floor(Math.random()*100)}`,
        teamId: teamId,
        pos: pos,
        name: name,
        tier: tier,
        level: 0,
        exp: 0,
        expLevel: 1,
        bonusPoints: 0,
        skills: skills,
        baseStats: baseStats,
        allocatedStats: isBat 
            ? { contact: 0, power: 0, speed: 0, defense: 0, throwing: 0 }
            : { stuff: 0, control: 0, velocity: 0, defense: 0, stamina: 0 },
        year: '25',
        backNo: index + 1
    };
}

// OVR calculation including level bonus, allocated stats, and team deck synergies
function getCardOvr(card) {
    if (!card) return 0;
    const isBat = card.pos === '타자';
    
    // 1. Base + Allocated Sum
    let statSum = 0;
    if (isBat) {
        statSum += card.baseStats.contact + (card.allocatedStats.contact || 0);
        statSum += card.baseStats.power + (card.allocatedStats.power || 0);
        statSum += card.baseStats.speed + (card.allocatedStats.speed || 0);
        statSum += card.baseStats.defense + (card.allocatedStats.defense || 0);
        statSum += card.baseStats.throwing + (card.allocatedStats.throwing || 0);
    } else {
        statSum += card.baseStats.stuff + (card.allocatedStats.stuff || 0);
        statSum += card.baseStats.control + (card.allocatedStats.control || 0);
        statSum += card.baseStats.velocity + (card.allocatedStats.velocity || 0);
        statSum += card.baseStats.defense + (card.allocatedStats.defense || 0);
        statSum += card.baseStats.stamina + (card.allocatedStats.stamina || 0);
    }
    let avg = Math.round(statSum / 5);

    // 2. Add Level Enhancement Bonus (+3 per level)
    avg += (card.level * 3);

    // 3. Add Team Deck Synergies (counted inside game state starting Lineup)
    const activeTeamId = gameState.myTeamId;
    if (card.teamId === activeTeamId) {
        // Count how many cards in our roster belong to our active team
        const teamCount = gameState.roster.filter(c => c.teamId === activeTeamId).length;
        if (teamCount >= 18) avg += 5;       // All-Star Team Deck
        else if (teamCount >= 12) avg += 3;
        else if (teamCount >= 8) avg += 2;
        else if (teamCount >= 4) avg += 1;
    }

    return avg;
}

// 4. Initial Game Loader
function initializeDefaultGameData(selectedTeamId) {
    gameState.myTeamId = selectedTeamId;
    gameState.gold = 5000;
    gameState.packs = 3;
    gameState.roster = [];

    // Generate my starting team (18 players)
    const rawMy = TEAM_ROSTERS_RAW[selectedTeamId];
    rawMy.batters.forEach((name, idx) => {
        gameState.roster.push(generateCard(selectedTeamId, '타자', name, idx));
    });
    rawMy.pitchers.forEach((name, idx) => {
        gameState.roster.push(generateCard(selectedTeamId, '투수', name, idx));
    });

    // Auto set starters
    const myBatters = gameState.roster.filter(c => c.pos === '타자');
    const myPitchers = gameState.roster.filter(c => c.pos === '투수');
    gameState.startingLineup.batter = myBatters[0].id;
    gameState.startingLineup.pitcher = myPitchers[0].id;

    // Pick a random opponent team
    const otherTeams = KBO_TEAMS.filter(t => t.id !== selectedTeamId);
    gameState.oppTeamId = otherTeams[Math.floor(Math.random() * otherTeams.length)].id;

    saveGameData();
}

function saveGameData() {
    localStorage.setItem('kbo_pro_2026_save', JSON.stringify(gameState));
}

function loadGameData() {
    const saved = localStorage.getItem('kbo_pro_2026_save');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            return true;
        } catch (e) {
            console.error('Save loading failed: ', e);
        }
    }
    return false;
}

// 5. 3D Stadium Projection Math & Canvas Rendering
let canvas, ctx;
const CW = 960;
const CH = 540;
const VP = { x: 480, y: 195 }; // 2.5D Over-the-Shoulder Batter View Horizon

// Projection Formula: 2.5D Over-the-Shoulder Camera (matching V24 style)
function projectToCanvas(wx, wy) {
    const horizon = VP.y;
    // Non-linear perspective depth curve
    const depth = Math.pow(Math.max(0, (wy - 0.05) / 0.95), 0.82); 
    const screenY = CH - 10 - (depth * (CH - 10 - horizon));
    
    // Scale shrinks smoothly as depth increases (wy gets larger towards pitcher)
    const scale = Math.max(0.16, 1.35 - (depth * 0.98));
    const screenX = VP.x + (wx * 560 * scale);
    return { x: screenX, y: screenY, scale: scale };
}

function initStadiumAssets() {
    // Generate twinkling sky stars
    stadiumStars = [];
    for (let i = 0; i < 40; i++) {
        stadiumStars.push({
            x: Math.random() * CW,
            y: Math.random() * VP.y,
            r: 0.5 + Math.random() * 1.3,
            twinkle: Math.random() * Math.PI
        });
    }

    // Generate static audience crowd dots (closer to outfield / horizon in 1st-person POV)
    stadiumCrowd = [];
    const seatRows = 5;
    for (let row = 0; row < seatRows; row++) {
        const wy = 0.50 + (row * 0.06); // Outfield stands coordinates
        for (let wx = -0.9; wx <= 0.9; wx += 0.015) {
            // Skew dots slightly to look like stadium stands
            if (Math.abs(wx) < 0.2) continue; // Outfield gap
            const basePos = projectToCanvas(wx, wy);
            stadiumCrowd.push({
                x: basePos.x + (Math.random() - 0.5) * 4,
                y: basePos.y - (Math.random() * 6),
                color: `hsl(${Math.random() * 360}, ${40 + Math.random()*40}%, ${45 + Math.random()*30}%)`,
                r: 1.5 + Math.random() * 1.5
            });
        }
    }
}

// Global active drawing coordinate lists for animation loops
let pitchAnimState = {
    active: false,
    timer: 0,
    pitcherWindup: 0,
    batterSwing: 0,
    swingTriggered: false,
    swingResultText: '',
    ballX: 0,
    ballY: 0,
    ballZ: 0, // Flying ball height
    shadowX: 0,
    shadowY: 0,
    ballSpeed: 0,
    targetZone: 'center', // 'up', 'down', 'left', 'right', 'center'
    userGuessZone: 'center'
};

let hitFlightState = {
    active: false,
    timer: 0,
    ballX: 0,
    ballY: 0.15,
    ballZ: 0,
    shadowX: 0,
    shadowY: 0.15,
    targetX: 0,
    targetY: 0.85,
    maxZ: 1.5,
    runBases: 0
};

function drawBaseDiamond() {
    // 1st-person POV coordinates: home (0.15), mound (0.60), 2B (0.75), 1B (right, 0.45), 3B (left, 0.45)
    const home = projectToCanvas(0, 0.15);
    const mound = projectToCanvas(0, 0.60);
    const first = projectToCanvas(0.25, 0.45);
    const second = projectToCanvas(0, 0.75);
    const third = projectToCanvas(-0.25, 0.45);

    // Draw infield dirt brown paths
    ctx.fillStyle = '#b45309'; // Infield clay brown
    ctx.beginPath();
    ctx.moveTo(home.x, home.y);
    ctx.lineTo(first.x, first.y);
    ctx.lineTo(second.x, second.y);
    ctx.lineTo(third.x, third.y);
    ctx.closePath();
    ctx.fill();

    // Draw green inner infield grass diamond
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    const grHome = projectToCanvas(0, 0.25);
    const grFirst = projectToCanvas(0.18, 0.45);
    const grSecond = projectToCanvas(0, 0.65);
    const grThird = projectToCanvas(-0.18, 0.45);
    ctx.moveTo(grHome.x, grHome.y);
    ctx.lineTo(grFirst.x, grFirst.y);
    ctx.lineTo(grSecond.x, grSecond.y);
    ctx.lineTo(grThird.x, grThird.y);
    ctx.closePath();
    ctx.fill();

    // Draw white chalk lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(home.x, home.y);
    ctx.lineTo(first.x, first.y);
    ctx.lineTo(second.x, second.y);
    ctx.lineTo(third.x, third.y);
    ctx.lineTo(home.x, home.y);
    ctx.stroke();

    // Base pads white diamonds
    ctx.fillStyle = '#ffffff';
    const bases = [first, second, third, home];
    bases.forEach((b, idx) => {
        ctx.beginPath();
        if (idx === 3) {
            // Home plate pentagon
            ctx.moveTo(b.x, b.y - 4);
            ctx.lineTo(b.x + 8, b.y);
            ctx.lineTo(b.x + 8, b.y + 8);
            ctx.lineTo(b.x - 8, b.y + 8);
            ctx.lineTo(b.x - 8, b.y);
        } else {
            // Square bases
            ctx.rect(b.x - 6, b.y - 6, 12, 12);
        }
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

function drawPlayerFigure(wx, wy, role, teamId, animState = 0) {
    const pos = projectToCanvas(wx, wy);
    const scale = pos.scale;
    const team = KBO_TEAMS.find(t => t.id === teamId) || { color: '#0066b2' };

    ctx.save();
    ctx.translate(pos.x, pos.y);

    const headRadius = 14 * scale;
    const bodyHeight = 22 * scale;
    const bodyWidth = 16 * scale;

    if (role === 'catcher') {
        // CROWCHED CATCHER POSITION (wy = 0.06, directly in front of camera)
        // Leg guards (Grey/Black)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-12 * scale, 0, 8 * scale, 12 * scale);
        ctx.fillRect(4 * scale, 0, 8 * scale, 12 * scale);

        // Chest protector (Team Color / Dark navy)
        ctx.fillStyle = team.color;
        ctx.fillRect(-14 * scale, -bodyHeight, 28 * scale, bodyHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeRect(-14 * scale, -bodyHeight, 28 * scale, bodyHeight);

        // Catcher Mask Head
        ctx.fillStyle = '#ffedd5'; // Skin
        ctx.beginPath();
        ctx.arc(0, -bodyHeight - headRadius, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Catcher Mask Iron Grid (#020617)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, -bodyHeight - headRadius, headRadius * 1.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(-headRadius, -bodyHeight - headRadius);
        ctx.lineTo(headRadius, -bodyHeight - headRadius);
        ctx.moveTo(0, -bodyHeight - headRadius * 2);
        ctx.lineTo(0, -bodyHeight);
        ctx.stroke();

        // Big Catcher Mitt Extended
        ctx.fillStyle = '#b45309'; // Brown leather mitt
        ctx.beginPath();
        ctx.arc(-16 * scale, -bodyHeight * 0.8, 9 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return;
    }

    if (role === 'umpire') {
        // UMPIRE POSITION (wy = 0.03, behind catcher)
        // Black Polo & Pants
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-10 * scale, -bodyHeight * 1.2, 20 * scale, bodyHeight * 1.2 + 8 * scale);

        // Umpire Mask & Blue Cap
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(0, -bodyHeight * 1.2 - headRadius, headRadius * 1.05, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#020617';
        ctx.fillRect(-headRadius, -bodyHeight * 1.2 - headRadius, headRadius * 2, headRadius * 1.6);

        ctx.restore();
        return;
    }

    // GENERAL PLAYER FIGURE (Pitcher, Batter, Base Runners)
    // 1. Cleats / Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6 * scale, 4 * scale, 4 * scale, 6 * scale);
    ctx.fillRect(2 * scale, 4 * scale, 4 * scale, 6 * scale);

    // 2. Uniform Pants (White with belt)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-7 * scale, -bodyHeight * 0.4, 14 * scale, bodyHeight * 0.4 + 4 * scale);
    // Belt
    ctx.fillStyle = '#020617';
    ctx.fillRect(-7 * scale, -bodyHeight * 0.4, 14 * scale, 2.5 * scale);

    // 3. Uniform Jersey (Team color)
    ctx.fillStyle = team.color;
    ctx.fillRect(-bodyWidth / 2, -bodyHeight, bodyWidth, bodyHeight * 0.65);

    // Jersey Stripes / Collar
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(-bodyWidth / 2, -bodyHeight, bodyWidth, bodyHeight * 0.65);

    // 4. Arms
    ctx.fillStyle = team.color;
    // Left & Right Arm Sleeves
    ctx.fillRect(-bodyWidth / 2 - 4 * scale, -bodyHeight, 4 * scale, 10 * scale);
    ctx.fillRect(bodyWidth / 2, -bodyHeight, 4 * scale, 10 * scale);

    // 5. Head (Skin tone)
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, -bodyHeight - headRadius + 2 * scale, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // 6. Helmet or Cap
    if (role === 'batter' || role === 'runner') {
        // Batting Helmet (Team color with shiny visor)
        ctx.fillStyle = team.color;
        ctx.beginPath();
        ctx.arc(0, -bodyHeight - headRadius, headRadius * 1.12, 0, Math.PI * 2);
        ctx.fill();

        // Ear guard & visor
        ctx.fillStyle = '#0f172a';
        const visorDir = role === 'batter' ? 1 : -1;
        const visorWidth = 14 * scale;
        const visorX = visorDir === 1 ? -4 * scale : -4 * scale - visorWidth;
        ctx.fillRect(visorX, -bodyHeight - headRadius, visorWidth, 4 * scale);
    } else {
        // Pitcher Cap
        ctx.fillStyle = team.color;
        ctx.beginPath();
        ctx.arc(0, -bodyHeight - headRadius + 2 * scale, headRadius * 1.08, Math.PI * 0.95, Math.PI * 0.05);
        ctx.fill();
        // Cap Brim
        ctx.fillStyle = '#020617';
        ctx.fillRect(-headRadius, -bodyHeight - headRadius + 2 * scale, headRadius * 2, 2.5 * scale);
    }

    // 7. Role-Specific Animations (Batter Bat Swing / Pitcher Windup / Runner Stance)
    if (role === 'batter') {
        ctx.strokeStyle = '#d97706'; // Wooden bat brown
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        if (animState > 0) {
            // Bat swing 3D arc rotation
            const swingAngle = -Math.PI / 3 + (animState * Math.PI * 0.9);
            ctx.moveTo(4 * scale, -bodyHeight * 0.8);
            ctx.lineTo(4 * scale + Math.cos(swingAngle) * 36 * scale, -bodyHeight * 0.8 - Math.sin(swingAngle) * 24 * scale);
        } else {
            // Bat standing ready position
            ctx.moveTo(-6 * scale, -bodyHeight * 0.9);
            ctx.lineTo(-18 * scale, -bodyHeight * 0.9 - 28 * scale);
        }
        ctx.stroke();
    } else if (role === 'runner') {
        // Runner Lead-off / Running Label Badge
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.font = `bold ${Math.max(9, Math.floor(10 * scale))}px "Pretendard", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('RUNNER', 0, -bodyHeight - headRadius - 8 * scale);
    }

    ctx.restore();
}

function drawStadium() {
    if (!ctx) return;
    ctx.clearRect(0, 0, CW, CH);

    // 1. Draw Daytime Blue Sky & Clouds (Matching V24 Broadcast Look)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, VP.y);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.7, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CW, VP.y);

    // Soft daytime clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(220, 50, 45, 0, Math.PI * 2);
    ctx.arc(260, 40, 55, 0, Math.PI * 2);
    ctx.arc(310, 55, 40, 0, Math.PI * 2);
    ctx.arc(700, 60, 50, 0, Math.PI * 2);
    ctx.arc(750, 50, 60, 0, Math.PI * 2);
    ctx.fill();

    // Outfield Mountain Hills Silhouette Background
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(0, VP.y);
    ctx.lineTo(0, VP.y - 40);
    ctx.quadraticCurveTo(240, VP.y - 85, 480, VP.y - 45);
    ctx.quadraticCurveTo(720, VP.y - 95, CW, VP.y - 35);
    ctx.lineTo(CW, VP.y);
    ctx.closePath();
    ctx.fill();

    // 2. Outfield Wall & Electronic Scoreboard
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, VP.y - 25, CW, 25);
    // Outfield Fence Pads (Green)
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, VP.y - 12, CW, 12);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, VP.y - 12, CW, 12);

    // 3. Outfield Grass Lawn
    const fieldGrad = ctx.createLinearGradient(0, VP.y, 0, CH);
    fieldGrad.addColorStop(0, '#059669');
    fieldGrad.addColorStop(1, '#10b981');
    ctx.fillStyle = fieldGrad;
    ctx.fillRect(0, VP.y, CW, CH - VP.y);

    // 4. Draw Infield Chalk & bases
    drawBaseDiamond();

    // 4.5 Draw 3x3 ABS Hot/Cold Zone Grid (2.5D Broadcast Style matching V24)
    const szCenter = projectToCanvas(0, 0.22);
    const szScale = szCenter.scale;
    const gridW = 90 * szScale;
    const gridH = 115 * szScale;
    const gridX = szCenter.x - gridW / 2;
    const gridY = szCenter.y - gridH;

    ctx.save();
    // Background 3x3 cells
    const cellW = gridW / 3;
    const cellH = gridH / 3;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const cx = gridX + c * cellW;
            const cy = gridY + r * cellH;
            
            // Center column is Hot Zone (Red), Outer columns are Cold Zones (Blue)
            if (c === 1) ctx.fillStyle = 'rgba(239, 68, 68, 0.55)'; // Red Hot Zone
            else ctx.fillStyle = 'rgba(59, 130, 246, 0.45)'; // Blue Cold Zone

            ctx.fillRect(cx, cy, cellW, cellH);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(cx, cy, cellW, cellH);
        }
    }

    // Outer Dashed ABS Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(gridX, gridY, gridW, gridH);
    ctx.setLineDash([]);
    ctx.restore();

    // 5. Draw All Fielders & Players (Depth-sorted order: Outfield -> Mound -> Bases -> Home Plate)
    const myTeam = gameState.myTeamId;
    const oppTeam = gameState.oppTeamId;
    const activePitcherTeam = (gameMode === 'batter') ? oppTeam : myTeam;
    const activeBatterTeam = (gameMode === 'batter') ? myTeam : oppTeam;

    // Pitcher on Mound (wy = 0.55)
    drawPlayerFigure(0, 0.55, 'pitcher', activePitcherTeam);

    // BASE RUNNERS (Full 2.5D Human Player Figures - 1B, 2B, 3B)
    if (baseRunners[1]) {
        // 2nd Base Runner
        const runnerProgress = hitFlightState.active ? hitFlightState.timer : 0;
        const rWy = 0.70 - (runnerProgress * 0.25);
        const rWx = runnerProgress * -0.26;
        drawPlayerFigure(rWx, rWy, 'runner', activeBatterTeam);
    }
    if (baseRunners[0]) {
        // 1st Base Runner
        const runnerProgress = hitFlightState.active ? hitFlightState.timer : 0;
        const rWy = 0.42 + (runnerProgress * 0.25);
        const rWx = 0.30 - (runnerProgress * 0.30);
        drawPlayerFigure(rWx, rWy, 'runner', activeBatterTeam);
    }
    if (baseRunners[2]) {
        // 3rd Base Runner
        const runnerProgress = hitFlightState.active ? hitFlightState.timer : 0;
        const rWy = 0.42 - (runnerProgress * 0.30);
        const rWx = -0.30 + (runnerProgress * 0.30);
        drawPlayerFigure(rWx, rWy, 'runner', activeBatterTeam);
    }

    // Batter in Foreground Right (wy = 0.10, wx = 0.22 - matching Over-the-Shoulder V24 Batter Stance!)
    const swingFrame = pitchAnimState.batterSwing;
    drawPlayerFigure(0.22, 0.10, 'batter', activeBatterTeam, swingFrame);

    // 6. Draw flying ball & its shadow (Both during pitch flight AND hit flight)
    if (pitchAnimState.active || hitFlightState.active) {
        // Shadow on the ground (wy projection)
        const shadowPos = projectToCanvas(pitchAnimState.shadowX, pitchAnimState.shadowY);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(shadowPos.x, shadowPos.y, 6 * shadowPos.scale, 0, Math.PI * 2);
        ctx.fill();

        // Flying ball (Y includes Z height curve offset)
        const ballPos = projectToCanvas(pitchAnimState.ballX, pitchAnimState.ballY);
        const zOffset = pitchAnimState.ballZ * 140 * ballPos.scale; // height scale for 3D flight
        const bX = ballPos.x;
        const bY = ballPos.y - zOffset;
        const bSize = Math.max(3, 7.5 * ballPos.scale);

        // Bat Impact Spark Explosion (First few frames of hit)
        if (hitFlightState.active && hitFlightState.timer < 0.3) {
            ctx.save();
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bX, bY, bSize * 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px "Pretendard", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💥 POW!', bX, bY - 20);
            ctx.restore();
        }

        // Flying Ball Body
        ctx.save();
        if (hitFlightState.active) {
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 15; // Blue neon tracer for hit ball
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bX, bY, bSize, 0, Math.PI * 2);
        ctx.fill();

        // Stitching details on ball
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bX, bY, Math.max(1, bSize - 2), -Math.PI / 4, Math.PI / 4);
        ctx.stroke();
        ctx.restore();

        // 7. Draw Timing Circle (Rhythm UI) over Strike Zone (ONLY during pitch flight, NOT during hit flight)
        if (pitchAnimState.timingRadius !== undefined && !hitFlightState.active) {
            ctx.save();
            const cx = pitchAnimState.timingCenterX;
            const cy = pitchAnimState.timingCenterY;
            const tRadius = pitchAnimState.targetRadius;
            const cRadius = pitchAnimState.timingRadius;

            // Target Crosshair
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - tRadius - 10, cy);
            ctx.lineTo(cx + tRadius + 10, cy);
            ctx.moveTo(cx, cy - tRadius - 10);
            ctx.lineTo(cx, cy + tRadius + 10);
            ctx.stroke();

            // Inner Target Sweet Spot (Green Glow)
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, tRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Outer Shrinking Circle
            const diff = Math.abs(cRadius - tRadius);
            let circleColor = '#f59e0b'; // Amber/Yellow
            if (diff < 10) circleColor = '#10b981'; // Green when inside sweet spot
            else if (diff < 30) circleColor = '#3b82f6'; // Blue when close

            ctx.shadowColor = circleColor;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = circleColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(0, cRadius), 0, Math.PI * 2);
            ctx.stroke();

            // Text Label HUD
            ctx.shadowBlur = 0;
            ctx.font = 'bold 12px "Pretendard", sans-serif';
            ctx.textAlign = 'center';
            if (diff < 10) {
                ctx.fillStyle = '#10b981';
                ctx.fillText('HIT NOW! (Space)', cx, cy + tRadius + 24);
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillText('타이밍 맞추기', cx, cy + tRadius + 24);
            }

            ctx.restore();
        }
    }
}

// 6. Gameplay Pitching & Batting Cycle Logic
let simulationInterval = null;

function setInningLimit(limit, btn) {
    inningLimit = limit;
    const parent = document.getElementById('inning-select-group');
    if (parent) {
        parent.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    logCommentary(`경기가 ${limit}이닝 경기 설정으로 변경되었습니다.`);
}

function setSimMode(mode, btn) {
    simulationMode = mode;
    const parent = document.getElementById('sim-select-group');
    if (parent) {
        parent.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    logCommentary(`경기 진행 방식이 ${mode === 'chance' ? '찬스 플레이 개입' : '전체 직접 플레이'}로 변경되었습니다.`);
}

function startNewGame(mode) {
    gameActive = true;
    gameMode = mode;
    currentInning = 1;
    halfInning = 'top'; // Top: opponent team attacks (so we pitch in pitcher mode, or simulate in batter mode)
    
    // Set game modes according to selection
    if (mode === 'batter') {
        document.getElementById('batter-controls').style.display = 'flex';
        document.getElementById('pitcher-controls').style.display = 'none';
        const absHud = document.getElementById('abs-hud');
        if (absHud) absHud.style.display = 'none';
        document.getElementById('pitch-meter-container').style.display = 'none';
    } else {
        document.getElementById('batter-controls').style.display = 'none';
        document.getElementById('pitcher-controls').style.display = 'flex';
        const absHud = document.getElementById('abs-hud');
        if (absHud) absHud.style.display = 'none';
        document.getElementById('pitch-meter-container').style.display = 'flex';
    }

    // Reset scores & counts
    scores = { my: 0, opp: 0 };
    hits = { my: 0, opp: 0 };
    errors = { my: 0, opp: 0 };
    counts = { balls: 0, strikes: 0, outs: 0 };
    baseRunners = [false, false, false];

    // Pop up Gameplay screen
    document.getElementById('match-setup-screen').style.display = 'none';
    document.getElementById('gameplay-arena-screen').style.display = 'block';
    
    // Clear live commentary box
    const commBox = document.getElementById('widescreen-commentary-list');
    if (commBox) commBox.innerHTML = '';

    logCommentary(`⚾ KBO 정규 친선 매치가 시작됩니다! (설정: ${inningLimit}이닝, ${simulationMode === 'chance' ? '찬스 플레이' : '풀 플레이'})`);
    
    // Init canvas rendering
    canvas = document.getElementById('pitch-canvas');
    ctx = canvas.getContext('2d');
    initStadiumAssets();
    
    // Core game setup
    setupPlayersForAtBat();
    updateScoreboardUI();

    // Start gameloop ticking & immediate 30 FPS render interval
    if (animationFrameId) clearInterval(animationFrameId);
    animationFrameId = setInterval(tickGameDrawing, 33);
    drawStadium();

    // Hide simulation overlay on start so canvas is immediately visible
    const simOverlay = document.getElementById('simulation-overlay');
    if (simOverlay) simOverlay.style.display = 'none';

    // Start directly into chosen player mode
    if (gameMode === 'batter') {
        halfInning = 'bottom'; // 1회말: 내 팀 공격 시작 (바로 타석 진입)
        logCommentary('⚔️ 1회말 내 팀 공격 시작! 타석에 들어섭니다.');
        aiTriggerPitch();
    } else {
        halfInning = 'top'; // 1회초: 내 팀 수비 시작 (바로 마운드 진입)
        logCommentary('🛡️ 1회초 내 팀 수비 시작! 마운드에서 스트라이크를 던지세요.');
        startPitcherModeAction();
    }
}

function tickGameDrawing() {
    if (!gameActive) return;

    // Steal animation runner progress
    if (stealAnimState.active) {
        updateStealAnimation();
    }

    // Flying Pitch Physics
    if (pitchAnimState.active) {
        updatePitchPhysics();
    }

    // Flying Hit Physics
    if (hitFlightState.active) {
        updateHitFlightPhysics();
    }

    drawStadium();
}

function updateHitFlightPhysics() {
    hitFlightState.timer += 0.022; // Speed of hit ball flight
    const t = hitFlightState.timer;

    if (t >= 1.0) {
        hitFlightState.active = false;
        pitchAnimState.active = false;
        if (hitFlightState.runBases > 0) {
            advanceRunners(hitFlightState.runBases);
        }
        setTimeout(nextAtBat, 1200);
        return;
    }

    // Ball travels back into the outfield
    pitchAnimState.ballY = 0.15 * (1 - t) + hitFlightState.targetY * t;
    pitchAnimState.ballX = 0.0 * (1 - t) + hitFlightState.targetX * t;
    pitchAnimState.ballZ = Math.sin(t * Math.PI) * hitFlightState.maxZ;

    pitchAnimState.shadowX = pitchAnimState.ballX;
    pitchAnimState.shadowY = pitchAnimState.ballY;
}

// Sound effects and log reporting helper
function logCommentary(msg, isSystem = false) {
    const list = document.getElementById('widescreen-commentary-list');
    if (!list) return;

    const item = document.createElement('div');
    item.className = `commentary-log-item ${isSystem ? 'system' : ''}`;
    
    // Inning tag label
    const halfStr = halfInning === 'top' ? '초' : '말';
    item.innerHTML = `<span class="time-badge">[${currentInning}회${halfStr}]</span> ${msg}`;
    
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;

    // Update central overlay too
    const overlay = document.getElementById('game-commentary');
    if (overlay) overlay.textContent = msg;
}

// Setup live active card deck side panel
function setupPlayersForAtBat() {
    const myTeam = KBO_TEAMS.find(t => t.id === gameState.myTeamId);
    const oppTeam = KBO_TEAMS.find(t => t.id === gameState.oppTeamId);

    // Search active starters
    const myBatters = gameState.roster.filter(c => c.pos === '타자');
    const myPitchers = gameState.roster.filter(c => c.pos === '투수');
    
    const activeBatter = gameMode === 'batter' 
        ? (gameState.roster.find(c => c.id === gameState.startingLineup.batter) || myBatters[0])
        : generateOpponentCard('타자', oppTeam.id);

    const activePitcher = gameMode === 'batter'
        ? generateOpponentCard('투수', oppTeam.id)
        : (gameState.roster.find(c => c.id === gameState.startingLineup.pitcher) || myPitchers[0]);

    // Render cards to sidebar deck placeholders
    const liveBatCard = document.getElementById('live-batter-card-placeholder');
    const livePitCard = document.getElementById('live-pitcher-card-placeholder');
    if (liveBatCard) liveBatCard.innerHTML = renderCardHTML(activeBatter, false);
    if (livePitCard) livePitCard.innerHTML = renderCardHTML(activePitcher, false);

    // Update bottom controllers HUD
    if (gameMode === 'batter') {
        document.getElementById('batting-player-name').textContent = activeBatter.name;
        document.getElementById('batting-contact').textContent = getCardOvr(activeBatter);
        document.getElementById('batting-power').textContent = activeBatter.baseStats.power + (activeBatter.allocatedStats.power || 0);
        document.getElementById('opp-pitcher-name').textContent = activePitcher.name;
    } else {
        document.getElementById('pitching-player-name').textContent = activePitcher.name;
        document.getElementById('pitching-stuff').textContent = getCardOvr(activePitcher);
        document.getElementById('pitching-control').textContent = activePitcher.baseStats.control + (activePitcher.allocatedStats.control || 0);
    }
}

function generateOpponentCard(pos, teamId) {
    const rosterList = TEAM_ROSTERS_RAW[teamId];
    const names = pos === '타자' ? rosterList.batters : rosterList.pitchers;
    const name = names[Math.floor(Math.random() * names.length)];
    return generateCard(teamId, pos, name, 4); // Special grade opponent
}

function updateScoreboardUI() {
    document.getElementById('sb-my-score').textContent = scores.my;
    document.getElementById('sb-opp-score').textContent = scores.opp;
    document.getElementById('rhe-r').textContent = halfInning === 'top' ? scores.opp : scores.my;
    document.getElementById('rhe-h').textContent = halfInning === 'top' ? hits.opp : hits.my;
    document.getElementById('rhe-e').textContent = halfInning === 'top' ? errors.opp : errors.my;

    document.getElementById('sb-inning').textContent = `${currentInning}회${halfInning === 'top' ? '초' : '말'}`;

    // Pop dots
    renderDots('sb-balls-dots', counts.balls, 3);
    renderDots('sb-strikes-dots', counts.strikes, 2);
    renderDots('sb-outs-dots', counts.outs, 2);
}

function renderDots(containerId, count, max) {
    const c = document.getElementById(containerId);
    if (!c) return;
    let html = '';
    for (let i = 0; i < max; i++) {
        html += `<span class="${i < count ? 'active' : ''}"></span>`;
    }
    c.innerHTML = html;
}

// 7. Pitch Physics Anim Loop
let selectedPitchType = 'fast';
let pitchAccuracy = 1.0; // 0.0 to 1.0 timing releasing
let pitchMeterInterval = null;
let pitchMeterPos = 0;
let pitchMeterDir = 1;

// Setup Pitcher release meter
const runner = document.getElementById('pitch-meter-runner');
if (runner) {
    document.getElementById('btn-release-pitch').addEventListener('mousedown', () => {
        // Stop meter and calculate accuracy
        clearInterval(pitchMeterInterval);
        const sweetMin = 45;
        const sweetMax = 55;
        if (pitchMeterPos >= sweetMin && pitchMeterPos <= sweetMax) {
            pitchAccuracy = 1.0; // Perfect release!
            playSound('hit');
            logCommentary('☄️ PERFECT RELEASE! 최고의 실투 없는 제구입니다.');
        } else {
            const dev = Math.abs(pitchMeterPos - 50);
            pitchAccuracy = Math.max(0.3, 1.0 - (dev * 0.02));
            logCommentary(`GOOD RELEASE! 제구가 안정적입니다. (정확도: ${Math.round(pitchAccuracy*100)}%)`);
        }
        
        triggerUserPitchThrow();
    });
}

function startPitcherModeAction() {
    // Reset release gauge
    pitchMeterPos = 0;
    pitchMeterDir = 2.5;
    const runner = document.getElementById('pitch-meter-runner');
    
    clearInterval(pitchMeterInterval);
    pitchMeterInterval = setInterval(() => {
        pitchMeterPos += pitchMeterDir;
        if (pitchMeterPos >= 100 || pitchMeterPos <= 0) {
            pitchMeterDir = -pitchMeterDir;
        }
        if (runner) runner.style.left = `${pitchMeterPos}%`;
    }, 20);

    // Pitch types toggling
    const pBtns = ['pitch-btn-fast', 'pitch-btn-slider', 'pitch-btn-curve', 'pitch-btn-fork'];
    pBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                pBtns.forEach(b => {
                    const el = document.getElementById(b);
                    if (el) el.classList.remove('active');
                });
                btn.classList.add('active');
                selectedPitchType = btn.dataset.pitch;
            };
        }
    });
}

function triggerUserPitchThrow() {
    document.getElementById('btn-release-pitch').disabled = true;

    // Trigger ball visual travel animation
    pitchAnimState.active = true;
    pitchAnimState.timer = 0;
    pitchAnimState.ballX = 0;
    pitchAnimState.ballY = 0.60; // Starts at pitcher mound
    pitchAnimState.ballZ = 0.8;
    pitchAnimState.shadowX = 0;
    pitchAnimState.shadowY = 0.60;
    pitchAnimState.batterSwing = 0;
    pitchAnimState.swingTriggered = false;

    // Initialize Timing Circle
    pitchAnimState.targetRadius = 22; // Inner sweet spot size
    const szCenter = projectToCanvas(0, 0.22); // Strike zone center
    pitchAnimState.timingCenterX = szCenter.x;
    pitchAnimState.timingCenterY = szCenter.y - (115 * szCenter.scale) / 2;
    pitchAnimState.startRadius = 180;
    pitchAnimState.timingRadius = 180;

    // AI swings choice based on target zone and accuracy
    setTimeout(() => {
        aiTriggerSwing();
    }, 600 + Math.random() * 400);
}

function updatePitchPhysics() {
    pitchAnimState.timer += 0.015; // Slow down pitch slightly for better readability
    const progress = pitchAnimState.timer; // 0 to 1 progress

    // Distance countdown
    const distance = Math.max(0, 18.44 * (1 - progress));
    const distHud = document.getElementById('ball-distance-hud');
    const distVal = document.getElementById('ball-distance-value');
    if (distHud) distHud.style.display = 'flex';
    if (distVal) distVal.textContent = distance.toFixed(2);

    if (progress >= 1.0) {
        pitchAnimState.active = false;
        if (distHud) distHud.style.display = 'none';
        // ONLY evaluate take/strike if user did NOT swing!
        if (!pitchAnimState.swingTriggered && !hitFlightState.active) {
            evaluatePitchResult();
        }
        return;
    }

    // Ball moves from pitcher wy=0.5 to home plate wy=0.22
    pitchAnimState.ballY = 0.60 - (progress * 0.45); // Pitch travels from 0.60 down to 0.15
    pitchAnimState.shadowY = pitchAnimState.ballY;

    // Break horizontal arcs based on pitchType (smaller arcs to stay inside zone)
    let horizBreak = 0;
    if (selectedPitchType === 'slider') horizBreak = Math.sin(progress * Math.PI) * 0.03;
    else if (selectedPitchType === 'curve') horizBreak = Math.sin(progress * Math.PI) * 0.04;

    pitchAnimState.ballX = horizBreak; // No manual zone target offset, straight pitch down the middle
    pitchAnimState.shadowX = pitchAnimState.ballX;

    // Ball flight height arch (Z)
    if (selectedPitchType === 'fork') {
        // Forkball dips down sharply at the plate
        pitchAnimState.ballZ = 0.8 * (1 - progress) + (progress < 0.7 ? 0.3 * Math.sin(progress * Math.PI) : -0.15);
    } else {
        pitchAnimState.ballZ = 0.7 * (1 - progress) + 0.3 * Math.sin(progress * Math.PI);
    }

    // Timing Circle Shrinkage Math
    let shrinkProgress = progress; // Base linear
    if (selectedPitchType === 'fast') shrinkProgress = Math.pow(progress, 1.8); // Starts slow, shrinks super fast at end
    else if (selectedPitchType === 'curve') shrinkProgress = Math.pow(progress, 0.6); // Shrinks fast early, then hangs slowly
    else if (selectedPitchType === 'fork') shrinkProgress = Math.pow(progress, 1.2); 

    pitchAnimState.timingRadius = pitchAnimState.startRadius - (pitchAnimState.startRadius - pitchAnimState.targetRadius) * shrinkProgress;

    // Forkball shifts target center slightly down at the last moment
    if (selectedPitchType === 'fork' && progress > 0.8) {
        pitchAnimState.timingCenterY += 1.5; // Circle drops down!
    } else if (selectedPitchType === 'slider') {
        // Slider shifts left/right slightly
        pitchAnimState.timingCenterX += Math.sin(progress * Math.PI) * 1.2;
    }
}

// User Batter & Pitcher hitting/pitching triggers via Keyboard
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    if (gameMode === 'batter' && (e.code === 'Space' || e.code === 'Enter')) {
        // Prevent default spacebar scrolling
        e.preventDefault();
        triggerUserSwing();
    } else if (gameMode === 'pitcher') {
        // Space to release pitch
        if ((e.code === 'Space' || e.code === 'Enter') && document.getElementById('btn-release-pitch') && !document.getElementById('btn-release-pitch').disabled) {
            e.preventDefault();
            document.getElementById('btn-release-pitch').dispatchEvent(new MouseEvent('mousedown'));
        }
        // 1,2,3,4 for Pitch types
        if (e.code === 'Digit1') document.getElementById('pitch-btn-fast')?.click();
        if (e.code === 'Digit2') document.getElementById('pitch-btn-slider')?.click();
        if (e.code === 'Digit3') document.getElementById('pitch-btn-curve')?.click();
        if (e.code === 'Digit4') document.getElementById('pitch-btn-fork')?.click();
    }
});

const swingBtn = document.getElementById('btn-swing-bat');
if (swingBtn) swingBtn.onclick = () => {
    if (gameActive && gameMode === 'batter') triggerUserSwing();
};

function triggerUserSwing() {
    if (pitchAnimState.swingTriggered || !pitchAnimState.active) return;
    pitchAnimState.swingTriggered = true;

    // Animate bat swing frame
    let swingProgress = 0;
    const interval = setInterval(() => {
        swingProgress += 0.15;
        pitchAnimState.batterSwing = swingProgress;
        if (swingProgress >= 1.0) {
            clearInterval(interval);
            pitchAnimState.batterSwing = 0;
        }
    }, 25);

    // Calculate timing strictly based on Timing Circle discrepancy
    const radiusDiff = pitchAnimState.timingRadius - pitchAnimState.targetRadius;
    let timingResult = 'Miss';
    
    // Evaluate based on circle radius difference
    if (Math.abs(radiusDiff) <= 4.5) {
        timingResult = 'Perfect'; // Circle perfectly overlaps target
    } else if (Math.abs(radiusDiff) <= 18) {
        timingResult = 'Good';    // Solid hit
    } else if (radiusDiff > 18 && radiusDiff <= 45) {
        timingResult = 'Early';    // Circle is still too big
    } else if (radiusDiff < -4.5 && radiusDiff >= -20) {
        timingResult = 'Late';     // Circle already shrank too much
    }

    // Map Early/Late to the previous logic which handled "Late" as foul/out
    if (timingResult === 'Early' || timingResult === 'Late') timingResult = 'Late';

    evaluateSwingHit(timingResult);
}

function aiTriggerPitch() {
    // Show active player updates
    setupPlayersForAtBat();
    updateScoreboardUI();

    // AI pitches after delay
    setTimeout(() => {
        const pitchTypes = ['fast', 'slider', 'curve', 'fork'];
        selectedPitchType = pitchTypes[Math.floor(Math.random() * pitchTypes.length)];
        const zones = ['up', 'down', 'left', 'right', 'center'];
        pitchAnimState.targetZone = zones[Math.floor(Math.random() * zones.length)];

        pitchAnimState.active = true;
        pitchAnimState.timer = 0;
        pitchAnimState.ballX = 0;
        pitchAnimState.ballY = 0.60;
        pitchAnimState.ballZ = 0.8;
        pitchAnimState.shadowX = 0;
        pitchAnimState.shadowY = 0.60;
        pitchAnimState.batterSwing = 0;
        pitchAnimState.swingTriggered = false;

        // Initialize Timing Circle for Batter Mode
        pitchAnimState.targetRadius = 24; // Inner sweet spot size
        const szCenter = projectToCanvas(0, 0.22); // Strike zone center
        pitchAnimState.timingCenterX = szCenter.x;
        pitchAnimState.timingCenterY = szCenter.y - (115 * szCenter.scale) / 2;
        pitchAnimState.startRadius = 190;
        pitchAnimState.timingRadius = 190;

        logCommentary(`⚾ 상대 투수가 공을 던졌습니다! (${selectedPitchType.toUpperCase()})`);
    }, 1500);
}

function aiTriggerSwing() {
    if (pitchAnimState.swingTriggered) return;
    pitchAnimState.swingTriggered = true;

    // AI swing probability based on target zone and timing
    const swingProb = pitchAnimState.targetZone === 'center' ? 0.75 : 0.45;
    if (Math.random() < swingProb) {
        // Play swing animations
        let swingProgress = 0;
        const interval = setInterval(() => {
            swingProgress += 0.15;
            pitchAnimState.batterSwing = swingProgress;
            if (swingProgress >= 1.0) {
                clearInterval(interval);
                pitchAnimState.batterSwing = 0;
            }
        }, 25);

        evaluateSwingHit('Good');
    } else {
        // AI takes
        evaluateSwingHit('Take');
    }
}

// 8. Hitting / ABS Referee Evaluation
function evaluateSwingHit(timing) {
    if (timing === 'Take') return;

    const speedGunValue = 135 + Math.floor(Math.random() * 18);
    const distHud = document.getElementById('ball-distance-hud');
    if (distHud) distHud.style.display = 'none';

    // Show speed gun
    const gun = document.getElementById('speed-gun');
    if (gun) {
        gun.style.display = 'block';
        document.getElementById('speed-gun-value').textContent = speedGunValue;
        document.getElementById('speed-gun-type').textContent = selectedPitchType.toUpperCase();
        document.getElementById('speed-gun-zone').textContent = 'CENTER';
        setTimeout(() => gun.style.display = 'none', 2000);
    }

    if (timing === 'Perfect') {
        // HOME RUN! (Hit Flight animation starts)
        playSound('hit');
        logCommentary('☄️ 쩌억!! 완벽한 배럴 타격! 하늘 높이 뻗어갑니다!! 홈런!!!');
        
        pitchAnimState.active = false; // Stop pitch flight
        hitFlightState.active = true;
        hitFlightState.timer = 0;
        hitFlightState.targetX = (Math.random() - 0.5) * 0.7; // random outfield flight path
        hitFlightState.targetY = 0.98;
        hitFlightState.maxZ = 2.4;
        hitFlightState.runBases = 4;
        
        counts.balls = 0;
        counts.strikes = 0;
    } else if (timing === 'Good') {
        // Solid Hit / Double (Hit Flight animation starts)
        playSound('hit');
        const isDouble = Math.random() < 0.35;
        
        pitchAnimState.active = false; // Stop pitch flight
        hitFlightState.active = true;
        hitFlightState.timer = 0;
        hitFlightState.targetX = (Math.random() - 0.5) * 0.45;
        hitFlightState.targetY = isDouble ? 0.84 : 0.68;
        hitFlightState.maxZ = isDouble ? 1.3 : 0.75;
        hitFlightState.runBases = isDouble ? 2 : 1;
        
        logCommentary(isDouble 
            ? '깡! 날카롭게 뻗어 외야 펜스 바로 앞에 떨어지는 2루타!'
            : '딱! 빗맞지 않고 깨끗하게 좌우측 갈라 떨어지는 1루 안타!'
        );
        
        counts.balls = 0;
        counts.strikes = 0;
    } else if (timing === 'Late') {
        // Foul / Out (Hit Flight Animation enabled for visual trajectory!)
        pitchAnimState.active = false;
        const isFoul = Math.random() < 0.45;
        
        hitFlightState.active = true;
        hitFlightState.timer = 0;
        hitFlightState.runBases = 0; // No base advance on foul or out

        if (isFoul) {
            playSound('hit');
            logCommentary('파울! 파울 라인 바깥쪽으로 타구가 휘어 들어갑니다. (Foul)');
            hitFlightState.targetX = Math.random() < 0.5 ? -0.85 : 0.85; // Foul territory left/right
            hitFlightState.targetY = 0.55;
            hitFlightState.maxZ = 0.9;
            if (counts.strikes < 2) counts.strikes++;
        } else {
            playSound('hit');
            logCommentary('아웃! 높게 뜬 타구가 야수 플라이 아웃으로 잡힙니다.');
            hitFlightState.targetX = (Math.random() - 0.5) * 0.4; // Center field fly ball
            hitFlightState.targetY = 0.68;
            hitFlightState.maxZ = 1.7; // High fly ball
            counts.outs++;
            counts.balls = 0;
            counts.strikes = 0;
        }
    } else {
        // Swing and Miss
        pitchAnimState.active = false;
        playSound('strike');
        logCommentary('헛스윙 스트라이크! 너무 일찍 휘둘렀습니다! (Strike)');
        counts.strikes++;
        if (counts.strikes >= 3) {
            logCommentary('삼진 아웃!! 타이밍을 완전히 뺏겼습니다.');
            counts.outs++;
            counts.balls = 0;
            counts.strikes = 0;
        }
        setTimeout(nextAtBat, 1500);
    }
}

function evaluatePitchResult() {
    // Called if batter took the pitch. Striking zones now evaluated on direct probability
    const isStrike = Math.random() < 0.65; // 65% strike probability
    const distHud = document.getElementById('ball-distance-hud');
    if (distHud) distHud.style.display = 'none';
    
    if (isStrike) {
        playSound('strike');
        logCommentary('스트라이크! ABS 판독: 스트라이크 존을 정확하게 찔러넣었습니다.');
        counts.strikes++;
        if (counts.strikes >= 3) {
            logCommentary('삼진 아웃!! 루킹 삼진입니다!');
            counts.outs++;
            counts.balls = 0;
            counts.strikes = 0;
        }
    } else {
        playSound('ball');
        logCommentary('볼! ABS 판독: 바깥쪽으로 한참 빠졌습니다.');
        counts.balls++;
        if (counts.balls >= 4) {
            logCommentary('사구(볼넷) 출루! (Walk)');
            advanceRunners(1);
            counts.balls = 0;
            counts.strikes = 0;
        }
    }
    
    setTimeout(nextAtBat, 1500);
}

// 9. Base Runner Advancing & Automatic Steals
let stealAnimState = {
    active: false,
    progress: 0,
    runnerX: 0.24, // starts on 1B
    runnerY: 0.51
};

function advanceRunners(bases) {
    if (bases === 4) {
        // Home run
        let runnersOn = baseRunners.filter(r => r).length;
        const runs = runnersOn + 1;
        if (halfInning === 'bottom') scores.my += runs;
        else scores.opp += runs;
        
        baseRunners = [false, false, false];
        logCommentary(`☄️ 대박 홈런으로 주자 싹쓸이! [${runs}득점]`);
        playSound('applause');
    } else {
        let runs = 0;
        for (let b = 0; b < bases; b++) {
            // Push runners
            if (baseRunners[2]) {
                runs++;
                baseRunners[2] = false;
            }
            if (baseRunners[1]) {
                baseRunners[2] = true;
                baseRunners[1] = false;
            }
            if (baseRunners[0]) {
                baseRunners[1] = true;
                baseRunners[0] = false;
            }
            if (b === 0) {
                baseRunners[0] = true; // Batter goes to 1B
            }
        }
        
        if (runs > 0) {
            if (halfInning === 'bottom') scores.my += runs;
            else scores.opp += runs;
            logCommentary(`득점 성공! +${runs}점 득점`);
            playSound('applause');
        }
    }

    // Auto Steal Trigger probability: runner on 1B, 2B is vacant
    if (baseRunners[0] && !baseRunners[1] && Math.random() < 0.28) {
        setTimeout(triggerAutomaticSteal, 1200);
    }
}

function triggerAutomaticSteal() {
    logCommentary('⚡ 도루 시도!! 주자가 다음 베이스로 뛰기 시작합니다!');
    
    // Zoom in cutscene banner
    const cut = document.getElementById('steal-cutscene');
    if (cut) {
        cut.classList.add('active');
        document.getElementById('steal-cutscene-text').textContent = '주자 2루 도루 시도 중! ⚡';
        setTimeout(() => cut.classList.remove('active'), 2500);
    }

    // Start drawing sliding runner animation
    stealAnimState.active = true;
    stealAnimState.progress = 0;
}

function updateStealAnimation() {
    stealAnimState.progress += 0.015;
    
    // Animate runner wx/wy trajectory path from 1B (0.24, 0.51) to 2B (0, 0.8)
    const t = stealAnimState.progress;
    stealAnimState.runnerX = 0.24 * (1 - t) + 0 * t;
    stealAnimState.runnerY = 0.51 * (1 - t) + 0.8 * t;

    // Draw sliding dust particles
    if (t > 0.8) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        const pos = projectToCanvas(stealAnimState.runnerX, stealAnimState.runnerY);
        ctx.beginPath();
        ctx.arc(pos.x + (Math.random()-0.5)*20, pos.y, 8, 0, Math.PI*2);
        ctx.fill();
    }

    // Draw the runner circle explicitly
    const pos = projectToCanvas(stealAnimState.runnerX, stealAnimState.runnerY);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 12 * pos.scale, 7 * pos.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (t >= 1.0) {
        stealAnimState.active = false;
        // Evaluate Steal Success based on speed
        const myBatters = gameState.roster.filter(c => c.pos === '타자');
        const speed = myBatters[0] ? myBatters[0].baseStats.speed + (myBatters[0].allocatedStats.speed || 0) : 70;
        
        const successChance = 0.4 + (speed * 0.005);
        if (Math.random() < successChance) {
            logCommentary('🏆 도루 성공!! 슬라이딩 세이프 판정입니다!');
            baseRunners[0] = false;
            baseRunners[1] = true; // Safe at 2B
        } else {
            playSound('catch');
            logCommentary('태그아웃!! 송구가 빨랐습니다. 도루 저지 실패!');
            baseRunners[0] = false; // Out
            counts.outs++;
        }
        updateScoreboardUI();
    }
}

// 10. Inning Stream / Intervene Simulation Engine
function runSimulationLoop() {
    if (!gameActive) return;
    
    // Check if we need to intervene
    if (simulationMode === 'chance') {
        const isClutchChance = baseRunners[1] || baseRunners[2] || (currentInning >= inningLimit && Math.abs(scores.my - scores.opp) <= 1);
        if (isClutchChance) {
            logCommentary('⚡ 찬스 상황 돌입! 직접 수동 플레이 모드로 전환합니다.');
            document.getElementById('simulation-overlay').style.display = 'none';
            setupPlayersForAtBat();
            if (gameMode === 'pitcher') startPitcherModeAction();
            else aiTriggerPitch();
            return;
        }
    }

    // Fast simulator iteration ticking
    document.getElementById('simulation-overlay').style.display = 'flex';
    setTimeout(() => {
        simulateOnePlay();
        updateScoreboardUI();
        
        if (counts.outs >= 3) {
            document.getElementById('simulation-overlay').style.display = 'none';
            handleHalfInningChange();
        } else {
            runSimulationLoop(); // Continue sim
        }
    }, 800);
}

function simulateOnePlay() {
    const r = Math.random();
    if (r < 0.12) {
        logCommentary('[중계] 타구가 펜스를 때리는 깨끗한 안타! (Single)');
        advanceRunners(1);
    } else if (r < 0.15) {
        logCommentary('[중계] 우중간 완전히 가르는 2루타! (Double)');
        advanceRunners(2);
    } else if (r < 0.17) {
        logCommentary('☄️ [중계] 큰 타구!! 넘어갔습니다! 솔로 홈런!! (Home Run)');
        advanceRunners(4);
    } else if (r < 0.22) {
        logCommentary('[중계] 볼넷을 잘 골라 1루로 출루합니다. (Walk)');
        advanceRunners(1);
    } else if (r < 0.5) {
        logCommentary('[중계] 삼진 아웃! 배트가 허공을 가릅니다. (Strikeout)');
        counts.outs++;
    } else {
        logCommentary('[중계] 유격수 정면 땅볼 아웃. (Groundout)');
        counts.outs++;
    }
}

function nextAtBat() {
    if (counts.outs >= 3) {
        handleHalfInningChange();
    } else {
        if (gameMode === 'pitcher') {
            document.getElementById('btn-release-pitch').disabled = false;
            startPitcherModeAction();
        } else {
            aiTriggerPitch();
        }
    }
    updateScoreboardUI();
}

function handleHalfInningChange() {
    counts.balls = 0;
    counts.strikes = 0;
    counts.outs = 0;
    baseRunners = [false, false, false];

    if (halfInning === 'top') {
        halfInning = 'bottom';
        logCommentary('🧹 공수 교대! 내 팀 공격이 시작됩니다.');
        
        if (gameMode === 'batter') {
            document.getElementById('simulation-overlay').style.display = 'none';
            aiTriggerPitch();
        } else {
            runSimulationLoop();
        }
    } else {
        // Bottom ended, check inning limits
        if (currentInning >= inningLimit) {
            if (scores.my === scores.opp) {
                triggerTiebreakerShootout();
            } else {
                triggerGameOver();
            }
        } else {
            currentInning++;
            halfInning = 'top';
            logCommentary(`🧹 ${currentInning}회초 경기 시작!`);
            
            if (gameMode === 'pitcher') {
                document.getElementById('simulation-overlay').style.display = 'none';
                startPitcherModeAction();
            } else {
                runSimulationLoop();
            }
        }
    }
    updateScoreboardUI();
}

// Tiebreaker shootout: start inning with runners on 1B & 2B
function triggerTiebreakerShootout() {
    logCommentary('⚡ 동점 상황 연장전! 무사 1, 2루 승부치기에 돌입합니다!');
    baseRunners = [true, true, false]; // 1B & 2B occupied
    currentInning++;
    halfInning = 'top';
    
    if (gameMode === 'pitcher') {
        startPitcherModeAction();
    } else {
        aiTriggerPitch();
    }
    updateScoreboardUI();
}

function triggerGameOver() {
    gameActive = false;
    const isWin = scores.my > scores.opp;
    const finalMsg = isWin 
        ? `🏆 승리!! 경기 종료! (최종 스코어: ${scores.my} 대 ${scores.opp})`
        : `😭 패배... 경기 종료! (최종 스코어: ${scores.my} 대 ${scores.opp})`;
    
    alert(finalMsg);
    awardMatchRewards(isWin);

    // Switch panels back
    document.getElementById('match-setup-screen').style.display = 'block';
    document.getElementById('gameplay-arena-screen').style.display = 'none';
}

function awardMatchRewards(isWin) {
    const goldEarned = isWin ? 1000 : 400;
    const expEarned = isWin ? 50 : 25;
    
    gameState.gold += goldEarned;
    logCommentary(`🪙 매치 보상 획득: +${goldEarned} P P!`);

    // Give experience points to starters
    gameState.roster.forEach(c => {
        const isStarter = gameState.startingLineup.batter === c.id || gameState.startingLineup.pitcher === c.id;
        if (isStarter) {
            c.exp += expEarned;
            const nextLevelExp = c.expLevel * 100;
            if (c.exp >= nextLevelExp && c.expLevel < 10) {
                c.exp -= nextLevelExp;
                c.expLevel++;
                c.bonusPoints += 5; // 5 bonus stats points!
                logCommentary(`🎉 [${c.name}] 선수 트레이닝 레벨 업! (Lv.${c.expLevel})`);
            }
        }
    });

    saveGameData();
    updateSidebarUI();
}

// 11. Roster Upgrades, Enhancements, Training & Synthesis Controllers
function filterRoster(type, e) {
    rosterFilter = type;
    const filters = document.querySelector('.roster-list-filters');
    if (filters) {
        filters.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        if (e) e.target.classList.add('active');
    }
    renderRosterList();
}

function renderRosterList() {
    const container = document.getElementById('roster-cards-container');
    if (!container) return;

    let list = gameState.roster;
    
    // Apply filters
    if (rosterFilter === 'myteam') list = list.filter(c => c.teamId === gameState.myTeamId);
    else if (rosterFilter === 'other') list = list.filter(c => c.teamId !== gameState.myTeamId);
    else if (rosterFilter === 'bat') list = list.filter(c => c.pos === '타자');
    else if (rosterFilter === 'pit') list = list.filter(c => c.pos === '투수');

    container.innerHTML = list.map(c => {
        const isSelected = selectedUpgradeCardId === c.id;
        return renderCardHTML(c, isSelected);
    }).join('');
}

function renderCardHTML(c, isSelected) {
    const ovr = getCardOvr(c);
    const tierName = { legend: 'LGD', hero: 'HERO', special: 'SPC', normal: 'LIVE' }[c.tier];
    const team = KBO_TEAMS.find(t => t.id === c.teamId) || { emblem: '⚾', color: '#64748b', short: 'KBO' };
    const avatar = c.pos === '타자' ? '🧢' : '⚾';
    const isStarter = gameState.startingLineup.batter === c.id || gameState.startingLineup.pitcher === c.id;

    let clickHandler = `selectCardForUpgrade('${c.id}')`;
    let checkHTML = '';

    if (activeUpgradeTab === 'synthesis') {
        const isSynthSelected = synthSelectedIds.includes(c.id);
        clickHandler = `toggleSynthSelection('${c.id}')`;
        checkHTML = `<div class="synth-checkbox ${isSynthSelected ? 'selected' : ''}">${isSynthSelected ? '✓' : ''}</div>`;
    }

    return `
        <div class="player-card tier-${c.tier} ${isSelected ? 'selected' : ''}" style="--team-color: ${team.color};" onclick="${clickHandler}">
            ${checkHTML}
            <span class="card-grade-badge">${tierName}</span>
            <span class="card-team-emblem">${team.emblem}</span>
            <span class="card-enh">${c.level > 0 ? `+${c.level}` : ''}</span>
            <span class="card-backno">No.${c.backNo}</span>
            ${isStarter ? '<span class="card-starter-badge">선발</span>' : ''}
            
            <div class="card-avatar-img">
                <span style="font-size:2.8rem;">${avatar}</span>
            </div>
            <div class="card-name">${c.name}</div>
            <div class="card-bottom-row">
                <span class="card-pos">${c.pos} · ${team.short}</span>
                <span class="card-ovr-circle">${ovr}</span>
            </div>
        </div>
    `;
}

function selectCardForUpgrade(cardId) {
    selectedUpgradeCardId = cardId;
    renderRosterList();
    renderUpgradePanel();
}

function setUpgradeTab(tab) {
    activeUpgradeTab = tab;
    renderUpgradePanel();
}

function toggleSynthSelection(cardId) {
    const idx = synthSelectedIds.indexOf(cardId);
    if (idx !== -1) {
        synthSelectedIds.splice(idx, 1);
    } else {
        if (synthSelectedIds.length >= 3) {
            alert('조합 카드는 최대 3장만 선택 가능합니다.');
            return;
        }
        synthSelectedIds.push(cardId);
    }
    renderRosterList();
    renderUpgradePanel();
}

function renderUpgradePanel() {
    const panel = document.getElementById('upgrade-panel-body');
    if (!panel) return;

    if (activeUpgradeTab === 'synthesis') {
        renderSynthesisTab(panel);
        return;
    }

    if (!selectedUpgradeCardId) {
        panel.innerHTML = `
            <div class="upgrade-tabs-header">
                <button class="tab-btn ${activeUpgradeTab === 'enhance' ? 'active' : ''}" onclick="setUpgradeTab('enhance')">강화</button>
                <button class="tab-btn ${activeUpgradeTab === 'train' ? 'active' : ''}" onclick="setUpgradeTab('train')">훈련/스탯</button>
                <button class="tab-btn ${activeUpgradeTab === 'skills' ? 'active' : ''}" onclick="setUpgradeTab('skills')">고유 스킬</button>
                <button class="tab-btn ${activeUpgradeTab === 'synthesis' ? 'active' : ''}" onclick="setUpgradeTab('synthesis')">카드 조합</button>
            </div>
            <div class="empty-state"><p>좌측 목록에서 선수를 선택해 주세요.</p></div>
        `;
        return;
    }

    const card = gameState.roster.find(c => c.id === selectedUpgradeCardId);
    if (!card) return;

    const ovr = getCardOvr(card);
    const isStarter = gameState.startingLineup.batter === card.id || gameState.startingLineup.pitcher === card.id;

    let bodyHTML = '';

    if (activeUpgradeTab === 'enhance') {
        const isMax = card.level >= 10;
        const goldCost = isMax ? 0 : 500 + card.level * 250;
        const successRates = [100, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
        const rate = isMax ? 0 : successRates[card.level];

        bodyHTML = `
            <div class="upgrade-card-display">
                ${renderCardHTML(card, false)}
                ${!isMax ? `
                    <div class="upgrade-arrow">➡️</div>
                    <div style="opacity:0.75;">
                        ${renderCardHTML({...card, level: card.level + 1}, false)}
                    </div>
                ` : ''}
            </div>

            <!-- Steal Cutscene Split-pane Overlay -->
            <div class="steal-cutscene-overlay" id="steal-cutscene" style="display: none;"></div>

            ${!isMax ? `
                <div class="upgrade-action-box">
                    <p>강화 성공률: <strong>${rate}%</strong></p>
                    <p>필요 비용: <strong>🪙 ${goldCost.toLocaleString()} P</strong></p>
                    <button class="btn btn-primary" onclick="attemptEnhance('${card.id}', ${goldCost}, ${rate})">강화 시도하기</button>
                </div>
            ` : `<div class="upgrade-action-box"><p style="color:#f59e0b;">최대 강화(+10) 완료!</p></div>`}

            <div class="card-management-actions">
                ${isStarter 
                    ? `<button class="btn btn-starter-remove" onclick="removeStarter('${card.id}')">선발 해제</button>`
                    : `<button class="btn btn-starter-set" onclick="setStarter('${card.id}')">선발 지정</button>`
                }
                <button class="btn btn-sell" onclick="sellCard('${card.id}')">카드 판매 (🪙 ${((card.level * 200) + 500).toLocaleString()} P)</button>
            </div>
        `;
    } 
    else if (activeUpgradeTab === 'train') {
        const stats = card.baseStats;
        const alloc = card.allocatedStats;
        const labels = card.pos === '타자' 
            ? { contact: '정확 (Contact)', power: '파워 (Power)', speed: '주력 (Speed)', defense: '수비 (Defense)', throwing: '송구 (Throwing)' }
            : { stuff: '구위 (Stuff)', control: '제구 (Control)', velocity: '구속 (Velocity)', defense: '수비 (Defense)', stamina: '체력 (Stamina)' };

        let statsHTML = '';
        Object.keys(labels).forEach(key => {
            const total = stats[key] + (alloc[key] || 0);
            const allocateBtn = card.bonusPoints > 0 
                ? `<button class="btn-allocate" onclick="allocateStatPoint('${card.id}', '${key}')">+</button>`
                : '';
            statsHTML += `
                <div class="train-stat-row">
                    <span class="stat-name">${labels[key]}</span>
                    <div class="stat-values">
                        <span class="stat-val">${total}</span>
                        <span class="text-muted">(기본 ${stats[key]} + ${alloc[key] || 0})</span>
                        ${allocateBtn}
                    </div>
                </div>
            `;
        });

        bodyHTML = `
            <div class="train-container">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <h3>트레이닝 훈련 (Lv.${card.expLevel} / 10)</h3>
                    <span class="train-points-badge">보너스 스탯: ${card.bonusPoints} P</span>
                </div>
                <div style="background:rgba(255,255,255,0.06); height:6px; border-radius:3px; margin-bottom:14px; overflow:hidden;">
                    <div style="background:#3b82f6; height:100%; width:${(card.exp / (card.expLevel*100))*100}%;"></div>
                </div>
                <div>${statsHTML}</div>
            </div>
        `;
    }
    else if (activeUpgradeTab === 'skills') {
        const skillText = card.skills.join(', ');
        bodyHTML = `
            <div style="text-align:center; padding:12px 0;">
                <h3>보유 고유 특능</h3>
                <div style="background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.2); padding:16px; border-radius:8px; margin:16px 0; color:#a78bfa; font-weight:800; font-size:1.1rem;">
                    ${skillText}
                </div>
                <button class="btn btn-primary" onclick="useSkillTicket('${card.id}')">고유 스킬 변경권 사용 (💰 500 P)</button>
            </div>
        `;
    }

    panel.innerHTML = `
        <div class="upgrade-tabs-header">
            <button class="tab-btn ${activeUpgradeTab === 'enhance' ? 'active' : ''}" onclick="setUpgradeTab('enhance')">강화</button>
            <button class="tab-btn ${activeUpgradeTab === 'train' ? 'active' : ''}" onclick="setUpgradeTab('train')">훈련/스탯</button>
            <button class="tab-btn ${activeUpgradeTab === 'skills' ? 'active' : ''}" onclick="setUpgradeTab('skills')">고유 스킬</button>
            <button class="tab-btn ${activeUpgradeTab === 'synthesis' ? 'active' : ''}" onclick="setUpgradeTab('synthesis')">카드 조합</button>
        </div>
        ${bodyHTML}
    `;
}

function renderSynthesisTab(panel) {
    let slotsHTML = '';
    for (let i = 0; i < 3; i++) {
        const id = synthSelectedIds[i];
        if (id) {
            const card = gameState.roster.find(c => c.id === id);
            slotsHTML += `
                <div class="synth-slot occupied" onclick="toggleSynthSelection('${id}')">
                    <span class="emblem">${getTeamEmblem(card.teamId)}</span>
                    <span class="name">${card.name}</span>
                    <span class="tier">${card.tier.toUpperCase()}</span>
                </div>
            `;
        } else {
            slotsHTML += `
                <div class="synth-slot empty">
                    <span class="plus">+</span>
                    <span class="sub">선택 대기</span>
                </div>
            `;
        }
    }

    panel.innerHTML = `
        <div class="upgrade-tabs-header">
            <button class="tab-btn ${activeUpgradeTab === 'enhance' ? 'active' : ''}" onclick="setUpgradeTab('enhance')">강화</button>
            <button class="tab-btn ${activeUpgradeTab === 'train' ? 'active' : ''}" onclick="setUpgradeTab('train')">훈련/스탯</button>
            <button class="tab-btn ${activeUpgradeTab === 'skills' ? 'active' : ''}" onclick="setUpgradeTab('skills')">고유 스킬</button>
            <button class="tab-btn ${activeUpgradeTab === 'synthesis' ? 'active' : ''}" onclick="setUpgradeTab('synthesis')">카드 조합</button>
        </div>
        <div style="padding:10px 0;">
            <h3>KBO 선수 조합 합성</h3>
            <p class="text-secondary" style="font-size:0.8rem; margin-bottom:16px;">안 쓰는 카드 3장을 골라 상위 랭크 획득 확률 조합을 진행합니다.</p>
            <div style="display:flex; justify-content:space-around; margin:16px 0;">
                ${slotsHTML}
            </div>
            
            ${synthSelectedIds.length === 3 
                ? `<button class="btn btn-primary btn-xl" style="width:100%;" onclick="runSynthesisAction()">조합 시작하기</button>`
                : `<button class="btn btn-secondary btn-xl" style="width:100%; opacity:0.5;" disabled>3장을 선택하세요</button>`
            }
        </div>
    `;
}

function attemptEnhance(id, cost, rate) {
    if (gameState.gold < cost) {
        alert('보유 골드 포인트가 부족합니다.');
        return;
    }

    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;

    gameState.gold -= cost;
    
    if (Math.random() * 100 <= rate) {
        card.level++;
        playSound('applause');
        alert(`🎉 강화 성공!! [${card.name}] 카드가 +${card.level} 강화 되었습니다.`);
    } else {
        playSound('catch');
        alert('😭 강화에 실패했습니다.');
    }

    saveGameData();
    updateSidebarUI();
    renderRosterList();
    renderUpgradePanel();
}

function allocateStatPoint(id, key) {
    const card = gameState.roster.find(c => c.id === id);
    if (card && card.bonusPoints > 0) {
        card.bonusPoints--;
        card.allocatedStats[key] = (card.allocatedStats[key] || 0) + 1;
        saveGameData();
        renderRosterList();
        renderUpgradePanel();
    }
}

function useSkillTicket(id) {
    if (gameState.gold < 500) {
        alert('골드가 부족합니다.');
        return;
    }

    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;

    gameState.gold -= 500;
    
    const skillPool = card.pos === '타자' ? BATTER_SKILLS : PITCHER_SKILLS;
    const newSkills = [];
    const count = card.skills.length;
    for (let s = 0; s < count; s++) {
        const sName = skillPool[Math.floor(Math.random() * skillPool.length)];
        if (!newSkills.includes(sName)) newSkills.push(sName);
    }
    
    card.skills = newSkills;
    playSound('hit');
    alert(`스킬 변경 완료! 새로운 스킬: [${newSkills.join(', ')}]`);
    
    saveGameData();
    updateSidebarUI();
    renderUpgradePanel();
}

function runSynthesisAction() {
    if (synthSelectedIds.length !== 3) return;

    // Remove the 3 cards
    const subCards = synthSelectedIds.map(id => gameState.roster.find(c => c.id === id));
    gameState.roster = gameState.roster.filter(c => !synthSelectedIds.includes(c.id));

    // Determine weight sum for higher output tier
    const tiers = subCards.map(c => c.tier);
    let outputTier = 'normal';
    const roll = Math.random();

    if (tiers.includes('legend')) {
        outputTier = roll < 0.65 ? 'legend' : 'hero';
    } else if (tiers.includes('hero')) {
        outputTier = roll < 0.45 ? 'hero' : (roll < 0.8 ? 'legend' : 'special');
    } else if (tiers.includes('special')) {
        outputTier = roll < 0.5 ? 'special' : (roll < 0.9 ? 'hero' : 'legend');
    } else {
        outputTier = roll < 0.7 ? 'normal' : 'special';
    }

    // Pick a random team and player name
    const teamId = KBO_TEAMS[Math.floor(Math.random() * KBO_TEAMS.length)].id;
    const isBat = Math.random() > 0.5;
    const rosterList = TEAM_ROSTERS_RAW[teamId];
    const nameList = isBat ? rosterList.batters : rosterList.pitchers;
    const name = nameList[Math.floor(Math.random() * nameList.length)];

    const newCard = generateCard(teamId, isBat ? '타자' : '투수', name, 3);
    newCard.tier = outputTier;
    
    gameState.roster.push(newCard);
    playSound('applause');
    alert(`🎉 조합 성공!! 새로운 선수 [\${newCard.name}] (\${newCard.tier.toUpperCase()}) 선수를 영입했습니다!`);

    synthSelectedIds = [];
    selectedUpgradeCardId = newCard.id;
    activeUpgradeTab = 'enhance';

    saveGameData();
    updateSidebarUI();
    renderRosterList();
    renderUpgradePanel();
}

function setStarter(id) {
    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;
    if (card.pos === '타자') gameState.startingLineup.batter = card.id;
    else gameState.startingLineup.pitcher = card.id;
    
    alert(`[${card.name}] 선수가 선발 라인업에 지정되었습니다.`);
    saveGameData();
    renderRosterList();
    renderUpgradePanel();
}

function removeStarter(id) {
    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;
    if (card.pos === '타자') gameState.startingLineup.batter = null;
    else gameState.startingLineup.pitcher = null;

    alert(`[${card.name}] 선수가 선발 해제되었습니다.`);
    saveGameData();
    renderRosterList();
    renderUpgradePanel();
}

function sellCard(id) {
    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;

    if (gameState.startingLineup.batter === id || gameState.startingLineup.pitcher === id) {
        alert('선발 지정된 주전 선수는 판매할 수 없습니다.');
        return;
    }

    const price = (card.level * 200) + 500;
    gameState.gold += price;
    gameState.roster = gameState.roster.filter(c => c.id !== id);

    alert(`선수 판매가 완료되었습니다. +💰 ${price.toLocaleString()} P 지급`);
    selectedUpgradeCardId = null;

    saveGameData();
    updateSidebarUI();
    renderRosterList();
    renderUpgradePanel();
}

// 12. Gacha Shop purchase & flips
function buyPack(type, price) {
    if (gameState.gold < price) {
        alert('골드가 부족합니다.');
        return;
    }
    gameState.gold -= price;
    gameState.packs++;
    
    playSound('hit');
    alert(`${type === 'premium' ? '프리미엄' : '일반'} 선수 팩 1개를 구매했습니다!`);
    
    saveGameData();
    updateSidebarUI();
    updateShopUI();
}

function updateShopUI() {
    const wait = document.getElementById('opening-waiting');
    if (!wait) return;

    if (gameState.packs > 0) {
        wait.innerHTML = `
            <span class="chest-icon" style="font-size:4rem; cursor:pointer;" onclick="drawCardGacha()">🎁</span>
            <p>보유 중인 개봉 대기 팩: <strong>${gameState.packs}개</strong></p>
            <button class="btn btn-primary" onclick="drawCardGacha()">팩 개봉하기 (Reveal)</button>
        `;
    } else {
        wait.innerHTML = `
            <span class="chest-icon" style="opacity:0.3;">🎁</span>
            <p>보유하고 있는 카드 팩이 없습니다.</p>
            <button class="btn btn-secondary" disabled>개봉 대기 없음</button>
        `;
    }
}

function drawCardGacha() {
    if (gameState.packs <= 0) return;
    gameState.packs--;

    // Pick a random team and player
    const teamId = KBO_TEAMS[Math.floor(Math.random() * KBO_TEAMS.length)].id;
    const isBat = Math.random() > 0.5;
    const rosterList = TEAM_ROSTERS_RAW[teamId];
    const nameList = isBat ? rosterList.batters : rosterList.pitchers;
    const name = nameList[Math.floor(Math.random() * nameList.length)];

    const card = generateCard(teamId, isBat ? '타자' : '투수', name, Math.floor(Math.random()*9));
    gameState.roster.push(card);

    // Draw card reveal flash visual
    const container = document.getElementById('opening-stage-container');
    if (container) {
        container.innerHTML = `
            <div class="card-draw-reveal-scene" style="animation: flashGlow 0.8s ease-out; text-align:center;">
                <h4 style="color:#fbbf24; margin-bottom:12px; font-weight:800; font-size:1.15rem;">🎉 선수 카드 획득!</h4>
                <div style="display:flex; justify-content:center; margin-bottom:16px;">
                    ${renderCardHTML(card, false)}
                </div>
                <button class="btn btn-primary" onclick="resetOpeningStage()">확인</button>
            </div>
        `;
    }

    playSound('applause');
    saveGameData();
    updateSidebarUI();
}

function resetOpeningStage() {
    const container = document.getElementById('opening-stage-container');
    if (container) {
        container.innerHTML = `<div class="waiting-pack" id="opening-waiting"></div>`;
    }
    updateShopUI();
}

// 13. Sidebar resource HUD updates
function updateSidebarUI() {
    document.getElementById('user-gold').textContent = gameState.gold.toLocaleString();
    document.getElementById('user-packs').textContent = gameState.packs;

    // Team overall rating averaging
    const avgOvr = Math.round(gameState.roster.reduce((sum, c) => sum + getCardOvr(c), 0) / (gameState.roster.length || 1));
    const teamNameEl = document.getElementById('my-team-name');
    const teamEmblemEl = document.getElementById('my-team-emblem');
    const teamOvrEl = document.getElementById('my-team-ovr');

    const myTeamObj = KBO_TEAMS.find(t => t.id === gameState.myTeamId);
    if (myTeamObj && teamNameEl) {
        teamNameEl.textContent = myTeamObj.name;
        teamEmblemEl.textContent = myTeamObj.emblem;
        teamOvrEl.textContent = avgOvr;
        
        document.getElementById('header-my-team-emblem').textContent = myTeamObj.emblem;
        document.getElementById('header-my-team-name').textContent = myTeamObj.name;
        document.getElementById('setup-my-emblem').textContent = myTeamObj.emblem;
        document.getElementById('setup-my-team-name').textContent = myTeamObj.name;
        document.getElementById('setup-my-ovr').textContent = `OVR ${avgOvr}`;
    }
}

// 14. Dialog modals 구단 창단 및 선택
function setupPlayLobby() {
    // Populate opponent select option
    const sel = document.getElementById('opp-team-select');
    if (sel) {
        sel.innerHTML = KBO_TEAMS.filter(t => t.id !== gameState.myTeamId).map(t => {
            return `<option value="${t.id}">${t.emblem} ${t.name}</option>`;
        }).join('');
        
        sel.onchange = (e) => {
            gameState.oppTeamId = e.target.value;
            const opp = KBO_TEAMS.find(t => t.id === gameState.oppTeamId);
            document.getElementById('setup-opp-team-name').textContent = opp.name;
            document.getElementById('setup-opp-ovr').textContent = 'OVR 72';
            
            document.getElementById('sb-opp-name').textContent = opp.short;
            document.getElementById('sb-opp-emblem').textContent = opp.emblem;
            saveGameData();
        };
    }
}

function showTeamSelectModal() {
    const modal = document.getElementById('modal-team-select');
    if (!modal) return;
    modal.style.display = 'flex';

    const grid = document.getElementById('team-selector-grid');
    if (grid) {
        grid.innerHTML = KBO_TEAMS.map(t => {
            return `
                <div class="team-select-btn" onclick="selectActiveTeam('${t.id}')">
                    <span class="emblem">${t.emblem}</span>
                    <span class="name">${t.short}</span>
                </div>
            `;
        }).join('');
    }
}

function selectActiveTeam(teamId) {
    initializeDefaultGameData(teamId);
    
    const modal = document.getElementById('modal-team-select');
    if (modal) modal.style.display = 'none';

    updateSidebarUI();
    setupPlayLobby();
    renderRosterList();
    
    logCommentary(`🎉 대표 구단으로 [${KBO_TEAMS.find(t => t.id === teamId).name}]이 창단/선택 되었습니다!`);
}

// 15. Setup Tab Navigation
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        const tab = link.dataset.tab;
        activeTab = tab;

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`tab-${tab}`);
        if (activeContent) activeContent.classList.add('active');

        // Header text updates
        const titles = { play: '경기장 입장', roster: '라인업 & 선수 성장', shop: '선수 영입 상점', info: '게임 가이드 가이드' };
        document.getElementById('view-title').textContent = titles[tab];

        if (tab === 'roster') {
            renderRosterList();
            renderUpgradePanel();
        } else if (tab === 'shop') {
            updateShopUI();
        }
    };
});

// Setup team change click
const changeBtn = document.getElementById('btn-select-team');
if (changeBtn) changeBtn.onclick = showTeamSelectModal;

// Boot triggers
window.onload = () => {
    lucide.createIcons();
    const hasSave = loadGameData();
    if (!hasSave) {
        initializeDefaultGameData('kia');
    }
    updateSidebarUI();
    setupPlayLobby();
    const modal = document.getElementById('modal-team-select');
    if (modal) modal.style.display = 'none';
};

// Emblems mapping lookup
function getTeamEmblem(teamId) {
    const t = KBO_TEAMS.find(x => x.id === teamId);
    return t ? t.emblem : '⚾';
}
function getTeamShortName(teamId) {
    const t = KBO_TEAMS.find(x => x.id === teamId);
    return t ? t.short : 'KBO';
}
function getTeamColor(teamId) {
    const t = KBO_TEAMS.find(x => x.id === teamId);
    return t ? t.color : '#64748b';
}
