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

// 2026 LIVE V3 curated pool. Identity/team/position group/back number follow the
// official KBO first-team registration snapshot below. Detailed field slots and
// pitcher roles are game recommendations, not claims about an official depth chart.
const ROSTER_SOURCE = Object.freeze({
    season: 2026,
    snapshot: 'LIVE V3',
    asOf: '2026-07-27',
    version: '2026-07-27.1',
    label: '2026.07.27 KBO 1군 등록 기준',
    url: 'https://www.koreabaseball.com/Player/RegisterAll.aspx'
});
const batterSpec = (name, positionGroup, lineupSlot, backNo) =>
    Object.freeze({ name, positionGroup, lineupSlot, backNo });
const pitcherSpec = (name, pitchRole, backNo) =>
    Object.freeze({ name, positionGroup: 'P', pitchRole, backNo });

const TEAM_ROSTERS_RAW = {
    kia: {
        batters: [
            batterSpec('한준수', 'C', 'C', 25), batterSpec('박상준', 'IF', '1B', 50),
            batterSpec('김선빈', 'IF', '2B', 3), batterSpec('김도영', 'IF', '3B', 5),
            batterSpec('하주석', 'IF', 'SS', 30), batterSpec('박재현', 'OF', 'LF', 15),
            batterSpec('김호령', 'OF', 'CF', 27), batterSpec('나성범', 'OF', 'RF', 47),
            batterSpec('카스트로', 'OF', 'DH', 26)
        ],
        pitchers: [
            pitcherSpec('양현종', 'SP', 54), pitcherSpec('네일', 'SP', 40),
            pitcherSpec('이의리', 'SP', 48), pitcherSpec('올러', 'SP', 33),
            pitcherSpec('황동하', 'SP', 41), pitcherSpec('최지민', 'RP', 39),
            pitcherSpec('전상현', 'RP', 51), pitcherSpec('조상우', 'RP', 11),
            pitcherSpec('정해영', 'CP', 62)
        ]
    },
    samsung: {
        batters: [
            batterSpec('강민호', 'C', 'C', 47), batterSpec('디아즈', 'IF', '1B', 0),
            batterSpec('류지혁', 'IF', '2B', 16), batterSpec('김영웅', 'IF', '3B', 30),
            batterSpec('이재현', 'IF', 'SS', 7), batterSpec('최형우', 'OF', 'LF', 34),
            batterSpec('김지찬', 'OF', 'CF', 58), batterSpec('구자욱', 'OF', 'RF', 5),
            batterSpec('김헌곤', 'OF', 'DH', 32)
        ],
        pitchers: [
            pitcherSpec('원태인', 'SP', 18), pitcherSpec('최원태', 'SP', 20),
            pitcherSpec('임기영', 'SP', 38), pitcherSpec('이승민', 'SP', 28),
            pitcherSpec('보스', 'SP', 43), pitcherSpec('김태훈', 'RP', 27),
            pitcherSpec('이승현', 'RP', 57), pitcherSpec('배찬승', 'RP', 55),
            pitcherSpec('김재윤', 'CP', 62)
        ]
    },
    lg: {
        batters: [
            batterSpec('박동원', 'C', 'C', 27), batterSpec('오스틴', 'IF', '1B', 23),
            batterSpec('신민재', 'IF', '2B', 4), batterSpec('문보경', 'IF', '3B', 2),
            batterSpec('오지환', 'IF', 'SS', 10), batterSpec('문성주', 'OF', 'LF', 8),
            batterSpec('박해민', 'OF', 'CF', 17), batterSpec('홍창기', 'OF', 'RF', 51),
            batterSpec('최원영', 'OF', 'DH', 3)
        ],
        pitchers: [
            pitcherSpec('임찬규', 'SP', 1), pitcherSpec('손주영', 'SP', 29),
            pitcherSpec('송승기', 'SP', 13), pitcherSpec('톨허스트', 'SP', 30),
            pitcherSpec('웰스', 'SP', 68), pitcherSpec('우강훈', 'RP', 20),
            pitcherSpec('김윤식', 'RP', 47), pitcherSpec('김영우', 'RP', 67),
            pitcherSpec('김진성', 'CP', 42)
        ]
    },
    doosan: {
        batters: [
            batterSpec('양의지', 'C', 'C', 25), batterSpec('세베리노', 'IF', '1B', 36),
            batterSpec('강승호', 'IF', '2B', 23), batterSpec('박준순', 'IF', '3B', 52),
            batterSpec('박찬호', 'IF', 'SS', 7), batterSpec('손아섭', 'OF', 'LF', 24),
            batterSpec('정수빈', 'OF', 'CF', 31), batterSpec('조수행', 'OF', 'RF', 51),
            batterSpec('김민석', 'OF', 'DH', 2)
        ],
        pitchers: [
            pitcherSpec('곽빈', 'SP', 47), pitcherSpec('벤자민', 'SP', 48),
            pitcherSpec('잭로그', 'SP', 39), pitcherSpec('최승용', 'SP', 28),
            pitcherSpec('이영하', 'SP', 50), pitcherSpec('박치국', 'RP', 1),
            pitcherSpec('이병헌', 'RP', 29), pitcherSpec('이용찬', 'RP', 45),
            pitcherSpec('김택연', 'CP', 63)
        ]
    },
    ssg: {
        batters: [
            batterSpec('이지영', 'C', 'C', 56), batterSpec('전의산', 'IF', '1B', 47),
            batterSpec('정준재', 'IF', '2B', 3), batterSpec('안상현', 'IF', '3B', 10),
            batterSpec('박성한', 'IF', 'SS', 2), batterSpec('김재환', 'OF', 'LF', 32),
            batterSpec('최지훈', 'OF', 'CF', 54), batterSpec('마드리스', 'OF', 'RF', 13),
            batterSpec('채현우', 'OF', 'DH', 15)
        ],
        pitchers: [
            pitcherSpec('문승원', 'SP', 42), pitcherSpec('해치', 'SP', 55),
            pitcherSpec('아빌라', 'SP', 33), pitcherSpec('타케다', 'SP', 23),
            pitcherSpec('이건욱', 'SP', 16), pitcherSpec('서진용', 'RP', 22),
            pitcherSpec('노경은', 'RP', 38), pitcherSpec('이로운', 'RP', 92),
            pitcherSpec('조병현', 'CP', 19)
        ]
    },
    kt: {
        batters: [
            batterSpec('장성우', 'C', 'C', 22), batterSpec('허경민', 'IF', '1B', 13),
            batterSpec('오윤석', 'IF', '2B', 4), batterSpec('힐리어드', 'IF', '3B', 34),
            batterSpec('김상수', 'IF', 'SS', 7), batterSpec('김현수', 'OF', 'LF', 10),
            batterSpec('배정대', 'OF', 'CF', 27), batterSpec('안현민', 'OF', 'RF', 23),
            batterSpec('최원준', 'OF', 'DH', 3)
        ],
        pitchers: [
            pitcherSpec('고영표', 'SP', 1), pitcherSpec('소형준', 'SP', 30),
            pitcherSpec('사우어', 'SP', 32), pitcherSpec('로건', 'SP', 43),
            pitcherSpec('오원석', 'SP', 47), pitcherSpec('우규민', 'RP', 12),
            pitcherSpec('주권', 'RP', 38), pitcherSpec('손동현', 'RP', 41),
            pitcherSpec('박영현', 'CP', 60)
        ]
    },
    lotte: {
        batters: [
            batterSpec('손성빈', 'C', 'C', 28), batterSpec('나승엽', 'IF', '1B', 51),
            batterSpec('고승민', 'IF', '2B', 2), batterSpec('한동희', 'IF', '3B', 25),
            batterSpec('박승욱', 'IF', 'SS', 53), batterSpec('황성빈', 'OF', 'LF', 0),
            batterSpec('김동혁', 'OF', 'CF', 50), batterSpec('윤동희', 'OF', 'RF', 91),
            batterSpec('레이예스', 'OF', 'DH', 29)
        ],
        pitchers: [
            pitcherSpec('박세웅', 'SP', 21), pitcherSpec('비슬리', 'SP', 23),
            pitcherSpec('로드리게스', 'SP', 31), pitcherSpec('나균안', 'SP', 43),
            pitcherSpec('이민석', 'SP', 37), pitcherSpec('김진욱', 'RP', 15),
            pitcherSpec('최준용', 'RP', 56), pitcherSpec('정철원', 'RP', 65),
            pitcherSpec('김원중', 'CP', 34)
        ]
    },
    hanwha: {
        batters: [
            batterSpec('최재훈', 'C', 'C', 13), batterSpec('정은원', 'IF', '1B', 43),
            batterSpec('이도윤', 'IF', '2B', 5), batterSpec('노시환', 'IF', '3B', 8),
            batterSpec('심우준', 'IF', 'SS', 7), batterSpec('최인호', 'OF', 'LF', 41),
            batterSpec('문현빈', 'OF', 'CF', 51), batterSpec('페라자', 'OF', 'RF', 30),
            batterSpec('김태연', 'OF', 'DH', 25)
        ],
        pitchers: [
            pitcherSpec('류현진', 'SP', 99), pitcherSpec('화이트', 'SP', 24),
            pitcherSpec('왕옌청', 'SP', 19), pitcherSpec('이민우', 'SP', 27),
            pitcherSpec('조동욱', 'SP', 57), pitcherSpec('이상규', 'RP', 18),
            pitcherSpec('김종수', 'RP', 38), pitcherSpec('강재민', 'RP', 55),
            pitcherSpec('박상원', 'CP', 58)
        ]
    },
    nc: {
        batters: [
            batterSpec('김형준', 'C', 'C', 25), batterSpec('도태훈', 'IF', '1B', 16),
            batterSpec('박민우', 'IF', '2B', 2), batterSpec('김휘집', 'IF', '3B', 44),
            batterSpec('김주원', 'IF', 'SS', 7), batterSpec('권희동', 'OF', 'LF', 36),
            batterSpec('박건우', 'OF', 'CF', 37), batterSpec('이우성', 'OF', 'RF', 55),
            batterSpec('천재환', 'OF', 'DH', 23)
        ],
        pitchers: [
            pitcherSpec('구창모', 'SP', 59), pitcherSpec('라일리', 'SP', 3),
            pitcherSpec('테일러', 'SP', 66), pitcherSpec('신영우', 'SP', 43),
            pitcherSpec('김태훈', 'SP', 69), pitcherSpec('전사민', 'RP', 57),
            pitcherSpec('원종해', 'RP', 63), pitcherSpec('최요한', 'RP', 67),
            pitcherSpec('김진호', 'CP', 54)
        ]
    },
    kiwoom: {
        batters: [
            batterSpec('김동헌', 'C', 'C', 44), batterSpec('최주환', 'IF', '1B', 53),
            batterSpec('안치홍', 'IF', '2B', 9), batterSpec('데이비슨', 'IF', '3B', 34),
            batterSpec('김웅빈', 'IF', 'SS', 10), batterSpec('추재현', 'OF', 'LF', 27),
            batterSpec('임병욱', 'OF', 'CF', 17), batterSpec('이형종', 'OF', 'RF', 36),
            batterSpec('박찬혁', 'OF', 'DH', 43)
        ],
        pitchers: [
            pitcherSpec('안우진', 'SP', 41), pitcherSpec('하영민', 'SP', 50),
            pitcherSpec('정현우', 'SP', 13), pitcherSpec('김윤하', 'SP', 19),
            pitcherSpec('박준현', 'SP', 18), pitcherSpec('정다훈', 'RP', 45),
            pitcherSpec('김선기', 'RP', 49), pitcherSpec('김성민', 'RP', 8),
            pitcherSpec('원종현', 'CP', 46)
        ]
    }
};

// Available Skills Lists
const BATTER_SKILLS = ['해결사', '홈런왕', '스프레이 히터', '클러치 히터', '쌕쌕이', '안타 제조기'];
const PITCHER_SKILLS = ['닥터 K', '에이스', '끝판대장', '이닝 이터', '불펜의 핵', '소방수'];
const SAVE_SCHEMA_VERSION = 4;
const LINEUP_SLOT_ORDER = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const TIER_ORDER = ['normal', 'special', 'hero', 'legend'];
const TIER_CONFIG = Object.freeze({
    normal: { label: 'LIVE', series: 'live26', base: 69, star: 3, skillSlots: 2 },
    special: { label: 'SPECIAL', series: 'impact', base: 75, star: 4, skillSlots: 3 },
    hero: { label: 'HERO', series: 'hero', base: 81, star: 5, skillSlots: 3 },
    legend: { label: 'LEGEND', series: 'legend', base: 87, star: 5, skillSlots: 3 }
});
const DIFFICULTY_PROFILES = Object.freeze({
    rookie: Object.freeze({
        key: 'rookie',
        label: '루키',
        opponentTier: 'normal',
        goodWindowScale: 1,
        perfectWindowScale: 1,
        visualTimeScale: 2.85,
        minTravelMs: 1040,
        maxTravelMs: 1710,
        releaseWindowScale: 1,
        releaseSpeedScale: 1,
        aiAccuracyBonus: -0.04,
        rewardMultiplier: 0.85,
        revealPitchCue: true,
        outThresholds: Object.freeze({ perfect: 0.01, good: 0.08, early: 0.48, late: 0.48 }),
        description: '넓은 판정폭 · 구종/코스 표시 · LIVE 상대'
    }),
    pro: Object.freeze({
        key: 'pro',
        label: '프로',
        opponentTier: 'special',
        goodWindowScale: 0.72,
        perfectWindowScale: 0.84,
        visualTimeScale: 2.25,
        minTravelMs: 880,
        maxTravelMs: 1420,
        releaseWindowScale: 0.72,
        releaseSpeedScale: 1.18,
        aiAccuracyBonus: 0.02,
        rewardMultiplier: 1,
        revealPitchCue: false,
        outThresholds: Object.freeze({ perfect: 0.18, good: 0.48, early: 0.72, late: 0.72 }),
        description: '빠른 투구 · GOOD 28% 축소 · SPECIAL 상대'
    }),
    legend: Object.freeze({
        key: 'legend',
        label: '레전드',
        opponentTier: 'hero',
        goodWindowScale: 0.58,
        perfectWindowScale: 0.7,
        visualTimeScale: 1.8,
        minTravelMs: 740,
        maxTravelMs: 1160,
        releaseWindowScale: 0.52,
        releaseSpeedScale: 1.35,
        aiAccuracyBonus: 0.08,
        rewardMultiplier: 1.35,
        revealPitchCue: false,
        outThresholds: Object.freeze({ perfect: 0.28, good: 0.62, early: 0.82, late: 0.82 }),
        description: '최고 속도 · GOOD 42% 축소 · HERO 상대 · 보상 35% 증가'
    })
});
const PACK_CONFIGS = Object.freeze({
    normal: {
        label: 'KBO 일반 선수 팩',
        price: 1000,
        odds: Object.freeze({ normal: 0.75, special: 0.25, hero: 0, legend: 0 })
    },
    premium: {
        label: 'KBO 프리미엄 선수 팩',
        price: 3000,
        odds: Object.freeze({ normal: 0, special: 0.55, hero: 0.35, legend: 0.10 })
    }
});
const SKILL_EFFECTS = Object.freeze({
    해결사: { contact: 1, power: 1, clutch: true },
    홈런왕: { power: 2 },
    '스프레이 히터': { contact: 2 },
    '클러치 히터': { contact: 1, power: 1, clutch: true },
    쌕쌕이: { speed: 2 },
    '안타 제조기': { contact: 2 },
    '닥터 K': { stuff: 2 },
    에이스: { stuff: 1, control: 1, starterOnly: true },
    끝판대장: { stuff: 1, control: 2, closerOnly: true },
    '이닝 이터': { stamina: 2 },
    '불펜의 핵': { stuff: 1, control: 1, bullpenOnly: true },
    소방수: { control: 2, clutch: true }
});

// 2. Global Game State Variables
let gameState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    rosterSourceDate: ROSTER_SOURCE.asOf,
    rosterSourceVersion: ROSTER_SOURCE.version,
    gold: 5000,
    packs: 3,
    packInventory: ['normal', 'normal', 'normal'],
    myTeamId: '',
    oppTeamId: '',
    difficulty: 'pro',
    roster: [],
    lineup: { batting: [], rotation: [], bullpen: [], closer: null },
    startingLineup: { batter: null, pitcher: null }
};

function normalizeDifficultyLevel(value) {
    return Object.hasOwn(DIFFICULTY_PROFILES, value) ? value : 'pro';
}

function getDifficultyProfile(level = gameState.difficulty) {
    return DIFFICULTY_PROFILES[normalizeDifficultyLevel(level)];
}

function syncDifficultyUI() {
    const level = normalizeDifficultyLevel(gameState.difficulty);
    gameState.difficulty = level;
    document.querySelectorAll('#difficulty-select-group [data-difficulty]').forEach(button => {
        const active = button.dataset.difficulty === level;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    const description = document.getElementById('difficulty-description');
    if (description) description.textContent = getDifficultyProfile(level).description;
}

function setDifficulty(level, btn = null) {
    const normalizedLevel = normalizeDifficultyLevel(level);
    gameState.difficulty = normalizedLevel;
    syncDifficultyUI();
    const opponentSelect = document.getElementById('opp-team-select');
    if (typeof opponentSelect?.onchange === 'function') opponentSelect.onchange();
    if (btn) btn.blur();
    saveGameData();
    logCommentary(`난이도를 ${getDifficultyProfile().label}로 변경했습니다.`);
    return getDifficultyProfile();
}

// Match Play Variables
let gameActive = false;
let inningLimit = 1; // Default 1
let simulationMode = 'chance'; // 'chance' or 'full'
let currentInning = 1;
let halfInning = 'top'; // 'top' (opp attack) or 'bottom' (my attack)
let gameMode = 'batter'; // 'batter' (my team batting) or 'pitcher' (my team pitching)
let requestedGameMode = 'batter';
let tiebreakerActive = false;

// Scoring & Stats
let scores = { my: 0, opp: 0 };
let inningScores = { away: Array(9).fill(null), home: Array(9).fill(null) };
let hits = { my: 0, opp: 0 };
let errors = { my: 0, opp: 0 };
let counts = { balls: 0, strikes: 0, outs: 0 };
let baseRunners = [false, false, false]; // [1B, 2B, 3B]
let pendingAutomaticSteal = false;

// UI State
let activeTab = 'play';
let selectedUpgradeCardId = null;
let activeUpgradeTab = 'enhance'; // 'enhance', 'train', 'skills', 'synthesis'
let synthSelectedIds = []; // Synthesis targets (max 3)
let rosterFilter = 'all';
let pendingSkillRerolls = new Map();
let lastPackReveal = null;

// RBI-style card duel state: low-input pitch-by-pitch mind game.
const ZONE_LABELS = {
    up: '높게',
    down: '낮게',
    left: '몸쪽',
    right: '바깥쪽',
    center: '가운데'
};
const PITCH_LABELS = {
    fast: '직구',
    slider: '슬라이더',
    curve: '커브',
    fork: '포크볼'
};
const PITCH_ENERGY_COST = {
    fast: 10,
    slider: 8,
    curve: 7,
    fork: 12
};
const ENHANCE_SUCCESS_RATES = Object.freeze([100, 100, 90, 80, 70, 60, 50, 40, 30, 20]);

let selectedPitchZone = 'center';
let activeMatchup = {
    batter: null,
    pitcher: null,
    pitcherEnergy: 100,
    pitchNumber: 0,
    lastTiming: 'READY',
    lastOutcome: '카드를 고르고 1이닝을 시작하세요.',
    lastCardEffect: '카드 효과 계산 대기'
};
let pitcherEnergyBySide = { my: 100, opp: 100 };

let animationFrameId = null;
let stadiumStars = [];
let stadiumCrowd = [];
let gameClockMs = 0;
let scheduledGameActions = [];
let manualTimeMode = false;
let pitchMeterActive = false;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getPitchingSideForCurrentHalf() {
    return halfInning === 'top' ? 'my' : 'opp';
}

function syncActivePitcherEnergyFromSide() {
    const side = getPitchingSideForCurrentHalf();
    activeMatchup.pitcherEnergy = pitcherEnergyBySide[side];
    return activeMatchup.pitcherEnergy;
}

function spendActivePitcherEnergy(cost) {
    const side = getPitchingSideForCurrentHalf();
    pitcherEnergyBySide[side] = clamp(pitcherEnergyBySide[side] - cost, 0, 100);
    activeMatchup.pitcherEnergy = pitcherEnergyBySide[side];
    return activeMatchup.pitcherEnergy;
}

function stableHash(value) {
    let hash = 2166136261;
    for (const char of String(value)) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function getActiveLineupIds() {
    const lineup = gameState.lineup || {};
    return [
        ...(lineup.batting || []),
        ...(lineup.rotation || []),
        ...(lineup.bullpen || []),
        lineup.closer
    ].filter(Boolean);
}

function isCardInActiveLineup(cardOrId) {
    const id = typeof cardOrId === 'string' ? cardOrId : cardOrId?.id;
    return Boolean(id && getActiveLineupIds().includes(id));
}

function getTeamDeckStatus() {
    const activeIds = new Set(getActiveLineupIds());
    const activeCards = gameState.roster.filter(card => activeIds.has(card.id));
    const sameTeamCards = activeCards.filter(card => card.teamId === gameState.myTeamId);
    const count = sameTeamCards.length;
    const bonus = count >= 18 ? 3 : count >= 14 ? 2 : count >= 9 ? 1 : 0;
    const nextThreshold = [9, 14, 18].find(value => value > count) || null;
    return {
        count,
        activeCount: activeCards.length,
        batterCount: sameTeamCards.filter(card => card.pos === '타자').length,
        pitcherCount: sameTeamCards.filter(card => card.pos === '투수').length,
        bonus,
        nextThreshold,
        maxThreshold: 18
    };
}

function getSkillLevel(card) {
    const enhancement = clamp(Number(card?.level || 0), 0, 10);
    if (enhancement >= 9) return 5;
    if (enhancement >= 7) return 4;
    if (enhancement >= 5) return 3;
    if (enhancement >= 3) return 2;
    return 1;
}

function isSkillConditionActive(card, effect) {
    if (effect.starterOnly && card.pitchRole !== 'SP') return false;
    if (effect.bullpenOnly && card.pitchRole !== 'RP') return false;
    if (effect.closerOnly && card.pitchRole !== 'CP') return false;
    if (effect.clutch && !(baseRunners[1] || baseRunners[2] || currentInning >= inningLimit)) return false;
    return true;
}

function getCardSkillBonus(card, key) {
    if (!card || !Array.isArray(card.skills)) return 0;
    const level = getSkillLevel(card);
    return card.skills.reduce((sum, skillName) => {
        const effect = SKILL_EFFECTS[skillName];
        if (!effect || !isSkillConditionActive(card, effect)) return sum;
        return sum + ((effect[key] || 0) * level);
    }, 0);
}

function getCardStat(card, key, fallback = 70) {
    if (!card || !card.baseStats) return fallback;
    const base = Number(card.baseStats[key] ?? fallback);
    const trained = Number(card.allocatedStats?.[key] || 0);
    const enhance = Number(card.level || 0) * 2;
    const skill = getCardSkillBonus(card, key);
    const deck = card.teamId === gameState.myTeamId && isCardInActiveLineup(card)
        ? getTeamDeckStatus().bonus
        : 0;
    return clamp(base + trained + enhance + skill + deck, 1, 120);
}

function averageCardStat(cards, key, fallback = 70) {
    if (!Array.isArray(cards) || cards.length === 0) return fallback;
    return cards.reduce((sum, card) => sum + getCardStat(card, key, fallback), 0) / cards.length;
}

function getActiveFieldingSupport(pitcher = activeMatchup.pitcher) {
    if (isCardInActiveLineup(pitcher)) {
        const activeBatters = (gameState.lineup?.batting || [])
            .map(id => gameState.roster.find(card => card.id === id))
            .filter(Boolean);
        return {
            defense: averageCardStat(activeBatters, 'defense'),
            throwing: averageCardStat(activeBatters, 'throwing')
        };
    }

    const opponent = getOpponentTeamBalanceProfile(pitcher?.teamId || gameState.oppTeamId);
    return {
        defense: Number(opponent.defense.defense || 70),
        throwing: Number(opponent.defense.throwing || 70)
    };
}

function getPitchEnergyCost(type, pitcher = activeMatchup.pitcher || getSelectedRosterCard('pitcher')) {
    const baseCost = Number(PITCH_ENERGY_COST[type]);
    if (!Number.isFinite(baseCost)) return 0;
    const stamina = getCardStat(pitcher, 'stamina', 70);
    const staminaFactor = clamp(1 - ((stamina - 70) * 0.003), 0.9, 1.1);
    return Number((baseCost * staminaFactor).toFixed(2));
}

function getSelectedRosterCard(role) {
    const id = role === 'batter' ? gameState.startingLineup.batter : gameState.startingLineup.pitcher;
    const activeIds = role === 'batter'
        ? (gameState.lineup?.batting || [])
        : [
            ...(gameState.lineup?.rotation || []),
            ...(gameState.lineup?.bullpen || []),
            gameState.lineup?.closer
        ].filter(Boolean);
    const selected = gameState.roster.find(card => card.id === id && activeIds.includes(card.id));
    return selected
        || activeIds.map(activeId => gameState.roster.find(card => card.id === activeId)).find(Boolean)
        || null;
}

function getDuelModifiers() {
    const batter = activeMatchup.batter || getSelectedRosterCard('batter');
    const pitcher = activeMatchup.pitcher || getSelectedRosterCard('pitcher');
    const contact = getCardStat(batter, 'contact');
    const power = getCardStat(batter, 'power');
    const discipline = getCardStat(batter, 'speed');
    const stuff = getCardStat(pitcher, 'stuff');
    const control = getCardStat(pitcher, 'control');
    const velocity = getCardStat(pitcher, 'velocity');
    const stamina = getCardStat(pitcher, 'stamina');
    const fielding = getActiveFieldingSupport(pitcher);
    const energyFactor = clamp(activeMatchup.pitcherEnergy / 100, 0.45, 1);
    const matchupDelta = contact - stuff;
    const fieldingDelta = ((fielding.defense + fielding.throwing) / 2) - 70;

    return {
        contact,
        power,
        discipline,
        stuff,
        control,
        velocity,
        stamina,
        defense: fielding.defense,
        throwing: fielding.throwing,
        energyFactor,
        fieldingContactPenalty: clamp(fieldingDelta * 0.002, -0.04, 0.06),
        perfectWindow: clamp(5 + (matchupDelta * 0.035), 3.8, 7.5),
        goodWindow: clamp(18 + (matchupDelta * 0.16), 11, 28),
        pitchStep: clamp((0.0135 + ((velocity - 70) * 0.000055)) * (0.9 + (energyFactor * 0.1)), 0.012, 0.0185),
        breakScale: clamp(0.78 + ((stuff - 60) * 0.012), 0.78, 1.38),
        strikeChance: clamp(0.47 + (control * 0.0044) + ((pitchAccuracy - 0.5) * 0.18), 0.52, 0.9),
        doubleChance: clamp(
            0.22 + ((power - 70) * 0.009) - ((stuff - 70) * 0.004) - (fieldingDelta * 0.0015),
            0.12,
            0.68
        )
    };
}

const PITCH_KINEMATIC_PROFILES = Object.freeze({
    fast: Object.freeze({ speedOffset: 4, min: 138, max: 161 }),
    slider: Object.freeze({ speedOffset: -7, min: 124, max: 150 }),
    curve: Object.freeze({ speedOffset: -17, min: 108, max: 140 }),
    fork: Object.freeze({ speedOffset: -11, min: 118, max: 147 })
});

function getPitchKinematics(modifiers = getDuelModifiers(), pitchType = selectedPitchType, randomFn = Math.random) {
    const profile = PITCH_KINEMATIC_PROFILES[pitchType] || PITCH_KINEMATIC_PROFILES.fast;
    const difficulty = getDifficultyProfile();
    const velocity = clamp(Number(modifiers.velocity) || 70, 45, 110);
    const energyFactor = clamp(Number(modifiers.energyFactor) || 1, 0.45, 1);
    const randomValue = clamp(Number(randomFn()) || 0, 0, 0.9999);
    const variance = (randomValue - 0.5) * 4;
    const speedKph = Math.round(clamp(
        122 + (velocity * 0.3) + profile.speedOffset + ((energyFactor - 0.7) * 4) + variance,
        profile.min,
        profile.max
    ));
    const physicalFlightMs = (18.44 / (speedKph / 3.6)) * 1000;
    const travelDurationMs = Math.round(clamp(
        physicalFlightMs * difficulty.visualTimeScale,
        difficulty.minTravelMs,
        difficulty.maxTravelMs
    ));
    return {
        pitchType,
        speedKph,
        travelDurationMs,
        physicalFlightMs: Math.round(physicalFlightMs),
        visualTimeScale: Number((travelDurationMs / physicalFlightMs).toFixed(2))
    };
}

const BATTED_BALL_DIRECTIONS = Object.freeze([
    Object.freeze({ key: 'left_line', label: '좌익선상', targetX: -1.12 }),
    Object.freeze({ key: 'left', label: '좌익수 방향', targetX: -0.78 }),
    Object.freeze({ key: 'left_center', label: '좌중간', targetX: -0.42 }),
    Object.freeze({ key: 'center', label: '중견수 방향', targetX: 0 }),
    Object.freeze({ key: 'right_center', label: '우중간', targetX: 0.42 }),
    Object.freeze({ key: 'right', label: '우익수 방향', targetX: 0.78 }),
    Object.freeze({ key: 'right_line', label: '우익선상', targetX: 1.12 })
]);

const BATTED_BALL_RESULTS = Object.freeze({
    HOME_RUN: Object.freeze({
        label: 'HOME RUN',
        distanceBase: 116,
        distanceSpan: 24,
        exitBase: 150,
        exitSpan: 18,
        angleBase: 24,
        angleSpan: 14,
        targetY: 0.99,
        maxZBase: 2.15,
        runBases: 4
    }),
    DOUBLE: Object.freeze({
        label: '2루타',
        distanceBase: 76,
        distanceSpan: 24,
        exitBase: 137,
        exitSpan: 19,
        angleBase: 14,
        angleSpan: 13,
        targetY: 0.86,
        maxZBase: 1.28,
        runBases: 2
    }),
    SINGLE: Object.freeze({
        label: '안타',
        distanceBase: 42,
        distanceSpan: 30,
        exitBase: 119,
        exitSpan: 24,
        angleBase: 6,
        angleSpan: 15,
        targetY: 0.7,
        maxZBase: 0.72,
        runBases: 1
    }),
    FOUL: Object.freeze({
        label: '파울',
        distanceBase: 30,
        distanceSpan: 30,
        exitBase: 101,
        exitSpan: 25,
        angleBase: 12,
        angleSpan: 18,
        targetY: 0.57,
        maxZBase: 0.9,
        runBases: 0
    }),
    FLY_OUT: Object.freeze({
        label: '플라이 아웃',
        distanceBase: 66,
        distanceSpan: 24,
        exitBase: 105,
        exitSpan: 22,
        angleBase: 29,
        angleSpan: 16,
        targetY: 0.8,
        maxZBase: 1.65,
        runBases: 0
    }),
    LINE_OUT: Object.freeze({
        label: '라인 아웃',
        distanceBase: 38,
        distanceSpan: 24,
        exitBase: 111,
        exitSpan: 22,
        angleBase: 8,
        angleSpan: 12,
        targetY: 0.66,
        maxZBase: 0.58,
        runBases: 0
    }),
    GROUND_OUT: Object.freeze({
        label: '땅볼 아웃',
        distanceBase: 16,
        distanceSpan: 20,
        exitBase: 96,
        exitSpan: 24,
        angleBase: -4,
        angleSpan: 10,
        targetY: 0.48,
        maxZBase: 0.18,
        runBases: 0
    })
});

function normalizeBattedBallResultCode(value) {
    return String(value || 'SINGLE')
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_');
}

function createBattedBallProfile(timing, modifiers, outcomeCode, randomFn = Math.random) {
    const resultCode = normalizeBattedBallResultCode(outcomeCode);
    const result = BATTED_BALL_RESULTS[resultCode] || BATTED_BALL_RESULTS.SINGLE;
    const directionRoll = clamp(Number(randomFn()) || 0, 0, 0.9999);
    const timingKey = String(timing || '').toLowerCase();
    const timingBias = timingKey === 'early' ? -1 : timingKey === 'late' ? 1 : 0;
    let directionIndex = clamp(
        Math.floor(directionRoll * BATTED_BALL_DIRECTIONS.length) + timingBias,
        0,
        BATTED_BALL_DIRECTIONS.length - 1
    );
    if (resultCode === 'FOUL') directionIndex = directionRoll < 0.5 ? 0 : 6;
    const direction = BATTED_BALL_DIRECTIONS[directionIndex];
    const metricRoll = clamp(Number(randomFn()) || 0, 0, 0.9999);
    const power = clamp(Number(modifiers.power) || 70, 40, 110);
    const powerDelta = power - 70;
    const distanceM = Math.round(
        result.distanceBase + (result.distanceSpan * metricRoll) + (powerDelta * (resultCode === 'HOME_RUN' ? 0.25 : 0.18))
    );
    const exitVelocityFloor = resultCode === 'HOME_RUN' ? 150 : 88;
    const exitVelocityKph = Math.round(Math.max(
        exitVelocityFloor,
        result.exitBase + (result.exitSpan * metricRoll) + (powerDelta * 0.22)
    ));
    const launchAngle = Math.round(result.angleBase + (result.angleSpan * (1 - metricRoll)));
    const maxZ = Number((result.maxZBase + Math.max(0, launchAngle - 18) * 0.018).toFixed(2));
    const durationMs = Math.round(clamp(
        900 + (distanceM * 4.8) + (launchAngle * 7),
        1040,
        resultCode === 'HOME_RUN' ? 1950 : 1760
    ));

    return {
        resultCode,
        resultLabel: result.label,
        directionKey: direction.key,
        directionLabel: direction.label,
        targetX: direction.targetX,
        targetY: result.targetY,
        maxZ,
        runBases: result.runBases,
        distanceM,
        exitVelocityKph,
        launchAngle,
        durationMs,
        isHomeRun: resultCode === 'HOME_RUN'
    };
}

function createResolvedBattedBallProfile(timing, modifiers, randomFn = Math.random) {
    const timingKey = String(timing || '').toLowerCase();
    const difficulty = getDifficultyProfile();
    const directionRoll = clamp(Number(randomFn()) || 0, 0, 0.9999);
    const qualityRoll = clamp(Number(randomFn()) || 0, 0, 0.9999);
    const zoneQuality = Number.isFinite(Number(modifiers.zoneQuality))
        ? clamp(Number(modifiers.zoneQuality), 0.35, 1)
        : 1;
    const timingStrength = timingKey === 'perfect'
        ? 1
        : timingKey === 'good'
            ? 0.74
            : timingKey === 'early' || timingKey === 'late'
                ? 0.42
                : 0.18;
    const power = clamp(Number(modifiers.power) || 70, 40, 110);
    const stuff = clamp(Number(modifiers.stuff) || 70, 40, 110);
    const fielding = clamp(
        ((Number(modifiers.defense) || 70) + (Number(modifiers.throwing) || 70)) / 2,
        40,
        110
    );
    const powerDelta = power - 70;
    const stuffDelta = stuff - 70;
    const exitVelocityKph = Math.round(clamp(
        105
            + (timingStrength * 34)
            + (powerDelta * 0.42)
            - (stuffDelta * 0.16)
            + ((qualityRoll - 0.5) * 28),
        84,
        190
    ));
    const angleBase = timingKey === 'perfect'
        ? 18
        : timingKey === 'good'
            ? 4
            : timingKey === 'early'
                ? 25
                : 15;
    const angleSpan = timingKey === 'perfect' ? 16 : timingKey === 'good' ? 24 : 22;
    const launchAngle = Math.round(angleBase + (qualityRoll * angleSpan));
    const angleEfficiency = clamp(1 - (Math.abs(launchAngle - 28) / 28), 0, 1);
    const distanceM = Math.round(clamp(
        26
            + (Math.max(0, exitVelocityKph - 90) * 0.9)
            + (angleEfficiency * 46)
            + (powerDelta * 0.15),
        18,
        155
    ));
    const fieldingReachM = Number(clamp((fielding - 70) * 0.55, -12, 18).toFixed(1));
    const fieldingAdjustedDistanceM = Number((distanceM - fieldingReachM).toFixed(1));
    const baseOutThreshold = difficulty.outThresholds[timingKey] ?? 0.9;
    const zoneReadPenalty = (1 - zoneQuality) * 0.55;
    const matchupPressure = ((stuff - power) * 0.002) + ((fielding - 70) * 0.0004);
    const fieldingOutThreshold = clamp(
        baseOutThreshold + zoneReadPenalty + matchupPressure,
        0.01,
        0.96
    );
    const isFieldedOut = qualityRoll < fieldingOutThreshold;

    let resultCode;
    if ((timingKey === 'early' || timingKey === 'late') && qualityRoll < 0.42) {
        resultCode = 'FOUL';
    } else if (isFieldedOut) {
        resultCode = launchAngle <= 12
            ? 'GROUND_OUT'
            : launchAngle <= 24
                ? 'LINE_OUT'
                : 'FLY_OUT';
    } else if (
        exitVelocityKph >= 145 &&
        distanceM >= 112 &&
        launchAngle >= 18 &&
        launchAngle <= 40
    ) {
        resultCode = 'HOME_RUN';
    } else if (
        exitVelocityKph >= 128 &&
        fieldingAdjustedDistanceM >= 78 &&
        launchAngle >= 4 &&
        launchAngle <= 38
    ) {
        resultCode = 'DOUBLE';
    } else if (
        exitVelocityKph >= 105 &&
        fieldingAdjustedDistanceM >= 28 &&
        launchAngle >= -5 &&
        launchAngle <= 40
    ) {
        resultCode = 'SINGLE';
    } else {
        resultCode = 'FLY_OUT';
    }

    const profile = createBattedBallProfile(timing, modifiers, resultCode, () => directionRoll);
    const result = BATTED_BALL_RESULTS[resultCode];
    const maxZ = Number((
        result.maxZBase + Math.max(0, launchAngle - 18) * 0.018
    ).toFixed(2));
    const durationMs = Math.round(clamp(
        900 + (distanceM * 4.8) + (Math.max(0, launchAngle) * 7),
        1040,
        resultCode === 'HOME_RUN' ? 1950 : 1760
    ));

    return {
        ...profile,
        distanceM,
        exitVelocityKph,
        launchAngle,
        fieldingReachM,
        fieldingAdjustedDistanceM,
        maxZ,
        durationMs,
        zoneQuality,
        fieldingOutThreshold: Number(fieldingOutThreshold.toFixed(3)),
        contactQuality: Number((
            timingStrength *
            zoneQuality *
            (0.72 + (qualityRoll * 0.28))
        ).toFixed(3)),
        resolution: 'metrics_causal_v2'
    };
}

function scheduleGameAction(callback, delayMs, label = 'game-action') {
    scheduledGameActions.push({
        at: gameClockMs + Math.max(0, delayMs),
        callback,
        label
    });
    scheduledGameActions.sort((a, b) => a.at - b.at);
}

function runScheduledGameActions() {
    let guard = 0;
    while (scheduledGameActions.length && scheduledGameActions[0].at <= gameClockMs && guard < 40) {
        const task = scheduledGameActions.shift();
        task.callback();
        guard++;
    }
}

function clearScheduledGameActions() {
    scheduledGameActions = [];
    gameClockMs = 0;
    pendingAutomaticSteal = false;
}

function readRuntimeDesignTokens() {
    const styles = getComputedStyle(document.documentElement);
    return {
        design_id: 'rbi_card_duel_2026',
        mode: document.documentElement.dataset.theme || 'daylight',
        colors: {
            night: styles.getPropertyValue('--bg-darkest').trim(),
            navy: styles.getPropertyValue('--bg-card').trim(),
            page: styles.getPropertyValue('--bg-darkest').trim(),
            panel: styles.getPropertyValue('--bg-card').trim(),
            panel_alt: styles.getPropertyValue('--surface-soft').trim(),
            line: styles.getPropertyValue('--border-color').trim(),
            field: styles.getPropertyValue('--field-green').trim(),
            clay: styles.getPropertyValue('--accent-clay').trim(),
            signal: styles.getPropertyValue('--accent-green').trim(),
            cyan: styles.getPropertyValue('--accent-blue').trim(),
            sun: styles.getPropertyValue('--accent-sun').trim(),
            sakura: styles.getPropertyValue('--accent-sakura').trim(),
            ink: styles.getPropertyValue('--arcade-ink').trim()
        },
        canvas_ratio: '16 / 9',
        camera_layout: {
            pitcher: [0.5, 0.43],
            catcher: [0.5, 0.96],
            batter: [0.34, 0.91],
            strike_zone: [0.5, 0.63]
        }
    };
}

function serializeCardForState(card) {
    if (!card) return null;
    const team = KBO_TEAMS.find(entry => entry.id === card.teamId);
    return {
        name: card.name,
        role: card.pos,
        team_id: card.teamId,
        team_name: team?.name || card.teamId,
        tier: card.tier,
        ovr: getCardOvr(card),
        stats: card.pos === '타자'
            ? { contact: getCardStat(card, 'contact'), power: getCardStat(card, 'power'), speed: getCardStat(card, 'speed') }
            : { stuff: getCardStat(card, 'stuff'), control: getCardStat(card, 'control'), velocity: getCardStat(card, 'velocity') }
    };
}

// Layered Web Audio scenes share one context so contact, glove, call, and crowd
// sounds feel related instead of creating a new single-oscillator beep each time.
const AUDIO_SCENES = Object.freeze({
    pitch: Object.freeze({ label: '공기 가르는 투구', layers: ['noise-whoosh', 'low-air'] }),
    release: Object.freeze({ label: '정확한 릴리즈', layers: ['clean-click', 'control-chime'] }),
    hit: Object.freeze({ label: '배트 임팩트', layers: ['wood-crack', 'body-thump'] }),
    homeRun: Object.freeze({ label: '홈런 임팩트', layers: ['wood-crack', 'bright-chord', 'crowd-rise'] }),
    catch: Object.freeze({ label: '글러브 포구', layers: ['leather-noise', 'low-thump'] }),
    strike: Object.freeze({ label: '스트라이크 콜', layers: ['two-tone-call'] }),
    ball: Object.freeze({ label: '볼 콜', layers: ['soft-two-tone'] }),
    applause: Object.freeze({ label: '관중 환호', layers: ['wide-noise', 'rising-chord'] })
});
const audioRuntime = {
    context: null,
    master: null,
    contextCreateCount: 0,
    lastScene: null,
    recentScenes: [],
    currentSceneLayers: null,
    lastSceneLayers: [],
    lastParameters: {}
};

function ensureAudioRuntime() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioRuntime.context) {
        audioRuntime.context = new AudioContextClass();
        audioRuntime.contextCreateCount++;
        audioRuntime.master = audioRuntime.context.createGain();
        audioRuntime.master.gain.value = 0.34;
        audioRuntime.master.connect(audioRuntime.context.destination);
    }
    if (audioRuntime.context.state === 'suspended') {
        audioRuntime.context.resume().catch(() => {});
    }
    return audioRuntime;
}

function scheduleAudioTone(context, destination, {
    start,
    duration,
    from,
    to = from,
    gain = 0.12,
    type = 'sine'
}) {
    audioRuntime.currentSceneLayers?.push({
        kind: 'tone',
        duration,
        from,
        to,
        gain,
        oscillator: type
    });
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(30, from), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.012, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
}

function scheduleAudioNoise(context, destination, {
    start,
    duration,
    gain = 0.08,
    filterType = 'bandpass',
    frequency = 1000,
    q = 0.8
}) {
    audioRuntime.currentSceneLayers?.push({
        kind: 'noise',
        duration,
        gain,
        filter: filterType,
        frequency,
        q
    });
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
        const fade = 1 - (i / channel.length);
        channel[i] = (Math.random() * 2 - 1) * fade;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, start);
    filter.Q.value = q;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.02, duration * 0.18));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);
    source.start(start);
    source.stop(start + duration + 0.02);
}

function playSound(type, detail = {}) {
    if (!AUDIO_SCENES[type]) return;
    audioRuntime.currentSceneLayers = [];
    audioRuntime.lastParameters = type === 'pitch'
        ? { speed_kph: clamp(Number(detail.speedKph) || 140, 105, 165) }
        : type === 'hit' || type === 'homeRun'
            ? { exit_velocity_kph: clamp(Number(detail.exitVelocityKph) || 150, 90, 190) }
            : {};
    try {
        audioRuntime.lastScene = type;
        audioRuntime.recentScenes.push(type);
        if (audioRuntime.recentScenes.length > 8) audioRuntime.recentScenes.shift();
        const runtime = ensureAudioRuntime();
        if (!runtime) return;
        const { context, master } = runtime;
        const now = context.currentTime + 0.006;

        if (type === 'release') {
            scheduleAudioTone(context, master, {
                start: now,
                duration: 0.08,
                from: 420,
                to: 620,
                gain: 0.055,
                type: 'triangle'
            });
            scheduleAudioTone(context, master, {
                start: now + 0.045,
                duration: 0.14,
                from: 740,
                to: 880,
                gain: 0.038,
                type: 'sine'
            });
        } else if (type === 'pitch') {
            const speed = clamp(Number(detail.speedKph) || 140, 105, 165);
            scheduleAudioNoise(context, master, {
                start: now,
                duration: 0.16,
                gain: 0.07 + ((speed - 105) / 1400),
                filterType: 'bandpass',
                frequency: 900 + (speed * 7),
                q: 0.55
            });
            scheduleAudioTone(context, master, {
                start: now,
                duration: 0.12,
                from: 210 + speed,
                to: 70,
                gain: 0.035,
                type: 'triangle'
            });
        } else if (type === 'hit' || type === 'homeRun') {
            const exitSpeed = clamp(Number(detail.exitVelocityKph) || 150, 90, 190);
            const impactGain = 0.13 + ((exitSpeed - 90) / 900);
            scheduleAudioNoise(context, master, {
                start: now,
                duration: 0.075,
                gain: impactGain,
                filterType: 'highpass',
                frequency: 1150
            });
            scheduleAudioTone(context, master, {
                start: now,
                duration: 0.12,
                from: 230 + exitSpeed,
                to: 72,
                gain: 0.13,
                type: 'square'
            });
            if (type === 'homeRun') {
                [392, 523, 659].forEach((frequency, index) => {
                    scheduleAudioTone(context, master, {
                        start: now + 0.12 + (index * 0.035),
                        duration: 0.42,
                        from: frequency,
                        to: frequency * 1.02,
                        gain: 0.045,
                        type: 'triangle'
                    });
                });
                scheduleAudioNoise(context, master, {
                    start: now + 0.16,
                    duration: 0.62,
                    gain: 0.045,
                    filterType: 'bandpass',
                    frequency: 760,
                    q: 0.35
                });
            }
        } else if (type === 'catch') {
            scheduleAudioNoise(context, master, {
                start: now,
                duration: 0.1,
                gain: 0.1,
                filterType: 'lowpass',
                frequency: 950
            });
            scheduleAudioTone(context, master, {
                start: now,
                duration: 0.13,
                from: 120,
                to: 68,
                gain: 0.1,
                type: 'triangle'
            });
        } else if (type === 'strike' || type === 'ball') {
            const tones = type === 'strike' ? [560, 410] : [260, 330];
            tones.forEach((frequency, index) => {
                scheduleAudioTone(context, master, {
                    start: now + (index * 0.07),
                    duration: 0.13,
                    from: frequency,
                    to: frequency * (type === 'strike' ? 0.9 : 1.05),
                    gain: type === 'strike' ? 0.075 : 0.055,
                    type: type === 'strike' ? 'square' : 'triangle'
                });
            });
        } else if (type === 'applause') {
            scheduleAudioNoise(context, master, {
                start: now,
                duration: 0.72,
                gain: 0.06,
                filterType: 'bandpass',
                frequency: 820,
                q: 0.3
            });
            [330, 440, 554].forEach((frequency, index) => {
                scheduleAudioTone(context, master, {
                    start: now + (index * 0.05),
                    duration: 0.48,
                    from: frequency,
                    to: frequency * 1.08,
                    gain: 0.034,
                    type: 'sine'
                });
            });
        }
    } catch (error) {
        console.debug('Audio scene unavailable:', error?.message || error);
    } finally {
        audioRuntime.lastSceneLayers = [...(audioRuntime.currentSceneLayers || [])];
        audioRuntime.currentSceneLayers = null;
    }
}

// 3. Card Generator Helper
function resolvePlayerSpec(teamId, pos, playerInput) {
    if (playerInput && typeof playerInput === 'object') return playerInput;
    const pool = TEAM_ROSTERS_RAW[teamId]?.[pos === '타자' ? 'batters' : 'pitchers'] || [];
    return pool.find(player => player.name === playerInput) || {
        name: String(playerInput || 'KBO 선수'),
        positionGroup: pos === '타자' ? 'IF' : 'P',
        lineupSlot: pos === '타자' ? 'DH' : undefined,
        pitchRole: pos === '투수' ? 'RP' : undefined,
        backNo: 0
    };
}

function getCardTemplateId(teamId, pos, playerSpec) {
    const identityHash = stableHash(`${teamId}|${pos}|${playerSpec.name}|${playerSpec.backNo}`).toString(36);
    return `live:2026:${teamId}:${identityHash}`;
}

function nextCardInstanceId(templateId) {
    gameState.nextCardSequence = Number(gameState.nextCardSequence || 0) + 1;
    return `${templateId}:${String(gameState.nextCardSequence).padStart(4, '0')}`;
}

function buildDeterministicStats(seed, isBat, baseOvr) {
    const statKeys = isBat
        ? ['contact', 'power', 'speed', 'defense', 'throwing']
        : ['stuff', 'control', 'velocity', 'defense', 'stamina'];
    const offsets = [-3, -1, 0, 1, 3];
    return Object.fromEntries(statKeys.map((key, index) => {
        const offset = offsets[stableHash(`${seed}|${key}|${index}`) % offsets.length];
        return [key, clamp(baseOvr + offset, 45, 99)];
    }));
}

function generateCard(teamId, pos, playerInput, requestedTier = 'normal') {
    const isBat = pos === '타자';
    const playerSpec = resolvePlayerSpec(teamId, pos, playerInput);
    const tier = TIER_CONFIG[requestedTier] ? requestedTier : 'normal';
    const tierConfig = TIER_CONFIG[tier];
    const templateId = getCardTemplateId(teamId, pos, playerSpec);
    const seed = `${templateId}|${tier}`;
    const baseOvr = tierConfig.base + ((stableHash(seed) % 3) - 1);
    const baseStats = buildDeterministicStats(seed, isBat, baseOvr);
    const allocatedStats = Object.fromEntries(Object.keys(baseStats).map(key => [key, 0]));
    const skillPool = isBat ? BATTER_SKILLS : PITCHER_SKILLS;
    const skillStart = stableHash(`${seed}|skills`) % skillPool.length;
    const skills = Array.from({ length: tierConfig.skillSlots }, (_, index) =>
        skillPool[(skillStart + index) % skillPool.length]
    );

    const instanceId = nextCardInstanceId(templateId);
    return {
        id: instanceId,
        instanceId,
        templateId,
        playerId: templateId.split(':').at(-1),
        teamId,
        pos,
        name: playerSpec.name,
        positionGroup: playerSpec.positionGroup,
        lineupSlot: playerSpec.lineupSlot || null,
        pitchRole: playerSpec.pitchRole || null,
        tier,
        series: tierConfig.series,
        star: tierConfig.star,
        level: 0,
        exp: 0,
        expLevel: 1,
        bonusPoints: 0,
        skills,
        baseStats,
        allocatedStats,
        season: ROSTER_SOURCE.season,
        year: '26',
        sourceDate: ROSTER_SOURCE.asOf,
        statSource: 'GAME_BALANCE_V1',
        backNo: playerSpec.backNo,
        locked: tier === 'hero' || tier === 'legend'
    };
}

function getCardOvr(card) {
    if (!card) return 0;
    const statKeys = card.pos === '타자'
        ? ['contact', 'power', 'speed', 'defense', 'throwing']
        : ['stuff', 'control', 'velocity', 'defense', 'stamina'];
    return Math.round(statKeys.reduce((sum, key) => sum + getCardStat(card, key), 0) / statKeys.length);
}

function getBaseCardOvr(card) {
    if (!card?.baseStats) return 0;
    const values = Object.values(card.baseStats);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function repairLineup() {
    if (!gameState.lineup) {
        gameState.lineup = { batting: [], rotation: [], bullpen: [], closer: null };
    }
    const rosterIds = new Set(gameState.roster.map(card => card.id));
    const bestForSlot = slot => gameState.roster
        .filter(card => card.pos === '타자' && card.lineupSlot === slot)
        .sort((a, b) => getBaseCardOvr(b) - getBaseCardOvr(a))[0]?.id || null;
    gameState.lineup.batting = LINEUP_SLOT_ORDER.map((slot, index) => {
        const currentId = gameState.lineup.batting[index];
        const current = gameState.roster.find(card =>
            card.id === currentId && card.pos === '타자' && card.lineupSlot === slot
        );
        return current?.id || bestForSlot(slot);
    }).filter(Boolean);

    const choosePitchers = (role, count, currentIds = []) => {
        const seenIds = new Set();
        const current = currentIds
            .map(id => gameState.roster.find(card => card.id === id))
            .filter(card => {
                if (card?.pos !== '투수' || card.pitchRole !== role || seenIds.has(card.id)) return false;
                seenIds.add(card.id);
                return true;
            });
        const candidates = gameState.roster
            .filter(card => card.pos === '투수' && card.pitchRole === role && !seenIds.has(card.id))
            .sort((a, b) => getBaseCardOvr(b) - getBaseCardOvr(a));
        return [...current, ...candidates].slice(0, count).map(card => card.id);
    };

    gameState.lineup.rotation = choosePitchers('SP', 5, gameState.lineup.rotation);
    gameState.lineup.bullpen = choosePitchers('RP', 3, gameState.lineup.bullpen);
    if (!rosterIds.has(gameState.lineup.closer) || gameState.roster.find(card => card.id === gameState.lineup.closer)?.pitchRole !== 'CP') {
        gameState.lineup.closer = choosePitchers('CP', 1, [])[0] || null;
    }

    if (!gameState.startingLineup) gameState.startingLineup = { batter: null, pitcher: null };
    const activeBatterIds = new Set(gameState.lineup.batting);
    const activePitcherIds = new Set([
        ...gameState.lineup.rotation,
        ...gameState.lineup.bullpen,
        gameState.lineup.closer
    ].filter(Boolean));
    if (!activeBatterIds.has(gameState.startingLineup.batter)) {
        gameState.startingLineup.batter = gameState.lineup.batting[0] || null;
    }
    if (!activePitcherIds.has(gameState.startingLineup.pitcher)) {
        gameState.startingLineup.pitcher = gameState.lineup.rotation[0]
            || gameState.lineup.bullpen[0]
            || gameState.lineup.closer
            || null;
    }
}

function autoBuildLineup() {
    gameState.lineup = { batting: [], rotation: [], bullpen: [], closer: null };
    repairLineup();
    gameState.startingLineup.batter = gameState.lineup.batting[0] || null;
    gameState.startingLineup.pitcher = gameState.lineup.rotation[0] || gameState.lineup.closer || null;
}

function getDuelDraftCards(position, selectedId) {
    const ranked = gameState.roster
        .filter(card => card.pos === position && isCardInActiveLineup(card))
        .sort((a, b) => getCardOvr(b) - getCardOvr(a));
    const selected = ranked.find(card => card.id === selectedId);
    const picks = selected ? [selected, ...ranked.filter(card => card.id !== selected.id)] : ranked;
    return picks.slice(0, 3);
}

function renderDuelPickCard(card, role) {
    const team = KBO_TEAMS.find(entry => entry.id === card.teamId) || { color: '#58d7ff', short: 'KBO' };
    const selectedId = role === 'batter' ? gameState.startingLineup.batter : gameState.startingLineup.pitcher;
    const isSelected = card.id === selectedId;
    const tierName = { legend: 'LEGEND', hero: 'HERO', special: 'SPECIAL', normal: 'LIVE' }[card.tier];
    const stats = role === 'batter'
        ? [
            `CON ${getCardStat(card, 'contact')}`,
            `POW ${getCardStat(card, 'power')}`,
            `SPD ${getCardStat(card, 'speed')}`
        ]
        : [
            `STF ${getCardStat(card, 'stuff')}`,
            `CTL ${getCardStat(card, 'control')}`,
            `VEL ${getCardStat(card, 'velocity')}`
        ];

    return `
        <button
            class="duel-pick-card ${isSelected ? 'selected' : ''}"
            style="--team-color: ${team.color};"
            data-duel-role="${role}"
            data-duel-card-id="${card.id}"
            aria-pressed="${isSelected}"
            aria-label="${card.name} ${role === 'batter' ? '타자' : '투수'} 카드 선택"
            onclick="selectDuelCard('${role}', '${card.id}')"
        >
            <span class="duel-tier">${tierName} · ${team.short}</span>
            <span class="duel-card-art pixel-ui-sprite pixel-ui-sprite-${role}" aria-hidden="true"></span>
            <strong class="duel-ovr">${getCardOvr(card)}</strong>
            <span class="duel-name">${card.name}</span>
            <span class="duel-stats">${stats.map(stat => `<span>${stat}</span>`).join('')}</span>
        </button>
    `;
}

function renderDuelDraft() {
    const batterContainer = document.getElementById('batter-duel-picks');
    const pitcherContainer = document.getElementById('pitcher-duel-picks');
    if (!batterContainer || !pitcherContainer || !gameState.roster.length) return;

    const batters = getDuelDraftCards('타자', gameState.startingLineup.batter);
    const pitchers = getDuelDraftCards('투수', gameState.startingLineup.pitcher);
    batterContainer.innerHTML = batters.map(card => renderDuelPickCard(card, 'batter')).join('');
    pitcherContainer.innerHTML = pitchers.map(card => renderDuelPickCard(card, 'pitcher')).join('');
}

function selectDuelCard(role, cardId) {
    const card = gameState.roster.find(candidate => candidate.id === cardId);
    const expectedPosition = role === 'batter' ? '타자' : '투수';
    if (!card || card.pos !== expectedPosition || !isCardInActiveLineup(card)) return false;

    if (role === 'batter') gameState.startingLineup.batter = card.id;
    else gameState.startingLineup.pitcher = card.id;

    saveGameData();
    renderDuelDraft();
    renderRosterList();

    const effect = role === 'batter'
        ? `컨택 ${getCardStat(card, 'contact')} · 파워 ${getCardStat(card, 'power')}`
        : `구위 ${getCardStat(card, 'stuff')} · 제구 ${getCardStat(card, 'control')} · 구속 ${getCardStat(card, 'velocity')}`;
    activeMatchup.lastCardEffect = `${card.name} 선발 확정 · ${effect}`;
    return true;
}

// 4. Initial Game Loader
function initializeDefaultGameData(selectedTeamId) {
    selectedUpgradeCardId = null;
    synthSelectedIds = [];
    pendingSkillRerolls.clear();
    lastPackReveal = null;
    activeMatchup.batter = null;
    activeMatchup.pitcher = null;
    activeMatchup.pitcherEnergy = 100;
    pitcherEnergyBySide = { my: 100, opp: 100 };
    activeMatchup.pitchNumber = 0;
    activeMatchup.lastTiming = 'READY';
    activeMatchup.lastOutcome = '카드를 고르고 1이닝을 시작하세요.';
    activeMatchup.lastCardEffect = '활성 엔트리 능력치 계산 대기';
    gameState.schemaVersion = SAVE_SCHEMA_VERSION;
    gameState.rosterSourceDate = ROSTER_SOURCE.asOf;
    gameState.rosterSourceVersion = ROSTER_SOURCE.version;
    gameState.difficulty = normalizeDifficultyLevel(gameState.difficulty);
    gameState.myTeamId = selectedTeamId;
    gameState.gold = 5000;
    gameState.packInventory = ['normal', 'normal', 'normal'];
    gameState.packs = gameState.packInventory.length;
    gameState.roster = [];
    gameState.nextCardSequence = 0;

    // Generate my starting team (18 players)
    const rawMy = TEAM_ROSTERS_RAW[selectedTeamId];
    rawMy.batters.forEach(player => {
        gameState.roster.push(generateCard(selectedTeamId, '타자', player, 'normal'));
    });
    rawMy.pitchers.forEach(player => {
        gameState.roster.push(generateCard(selectedTeamId, '투수', player, 'normal'));
    });

    autoBuildLineup();

    // Pick a random opponent team
    const otherTeams = KBO_TEAMS.filter(t => t.id !== selectedTeamId);
    gameState.oppTeamId = otherTeams[Math.floor(Math.random() * otherTeams.length)].id;

    saveGameData();
}

function saveGameData() {
    gameState.schemaVersion = SAVE_SCHEMA_VERSION;
    gameState.rosterSourceDate = ROSTER_SOURCE.asOf;
    gameState.rosterSourceVersion = ROSTER_SOURCE.version;
    gameState.difficulty = normalizeDifficultyLevel(gameState.difficulty);
    gameState.packs = gameState.packInventory?.length || 0;
    localStorage.setItem('kbo_pro_2026_save', JSON.stringify(gameState));
}

function getCurrentRosterTemplateEntries() {
    return Object.entries(TEAM_ROSTERS_RAW).flatMap(([teamId, roster]) => [
        ...roster.batters.map(player => ({ teamId, pos: '타자', player })),
        ...roster.pitchers.map(player => ({ teamId, pos: '투수', player }))
    ]);
}

function findCurrentRosterTemplate(savedCard, entries = getCurrentRosterTemplateEntries()) {
    if (!savedCard) return null;
    const exactTemplate = savedCard.templateId
        ? entries.find(entry =>
            getCardTemplateId(entry.teamId, entry.pos, entry.player) === savedCard.templateId
            && entry.pos === savedCard.pos
            && entry.player.name === savedCard.name
        )
        : null;
    if (exactTemplate) return exactTemplate;

    const exactTupleMatches = entries.filter(entry =>
        entry.pos === savedCard.pos
        && entry.player.name === savedCard.name
        && Number(entry.player.backNo) === Number(savedCard.backNo)
    );
    return exactTupleMatches.length === 1 ? exactTupleMatches[0] : null;
}

function copySavedCardProgress(targetCard, savedCard) {
    if (!targetCard || !savedCard) return targetCard;
    if (Number.isFinite(Number(savedCard.star))) targetCard.star = Number(savedCard.star);
    if (typeof savedCard.series === 'string' && savedCard.series) targetCard.series = savedCard.series;
    targetCard.level = clamp(Number(savedCard.level || 0), 0, 10);
    targetCard.exp = Math.max(0, Number(savedCard.exp || 0));
    targetCard.expLevel = clamp(Number(savedCard.expLevel || 1), 1, 10);
    targetCard.bonusPoints = Math.max(0, Number(savedCard.bonusPoints || 0));
    Object.keys(targetCard.baseStats).forEach(key => {
        const savedValue = Number(savedCard.baseStats?.[key]);
        if (Number.isFinite(savedValue)) targetCard.baseStats[key] = clamp(savedValue, 1, 99);
    });
    Object.keys(targetCard.allocatedStats).forEach(key => {
        targetCard.allocatedStats[key] = Math.max(0, Number(savedCard.allocatedStats?.[key] || 0));
    });

    const skillPool = targetCard.pos === '타자' ? BATTER_SKILLS : PITCHER_SKILLS;
    const skillSlotCount = TIER_CONFIG[targetCard.tier].skillSlots;
    const savedSkills = Array.isArray(savedCard.skills)
        ? savedCard.skills.filter((skill, index, list) => skillPool.includes(skill) && list.indexOf(skill) === index)
        : [];
    targetCard.skills = [...savedSkills, ...targetCard.skills]
        .filter((skill, index, list) => list.indexOf(skill) === index)
        .slice(0, skillSlotCount);
    if (typeof savedCard.locked === 'boolean') targetCard.locked = savedCard.locked;
    return targetCard;
}

function preserveLegacyOwnedCard(savedCard, selectedTeamId, usedIds) {
    const pos = savedCard?.pos === '타자' || savedCard?.pos === '투수' ? savedCard.pos : null;
    if (!pos) return null;
    const tier = Object.hasOwn(TIER_CONFIG, savedCard.tier) ? savedCard.tier : 'normal';
    const tierConfig = TIER_CONFIG[tier];
    const skillPool = pos === '타자' ? BATTER_SKILLS : PITCHER_SKILLS;
    const normalizedSkills = [
        ...(Array.isArray(savedCard.skills) ? savedCard.skills : []),
        ...skillPool
    ]
        .filter((skill, index, list) => skillPool.includes(skill) && list.indexOf(skill) === index)
        .slice(0, tierConfig.skillSlots);
    const statKeys = pos === '타자'
        ? ['contact', 'power', 'speed', 'defense', 'throwing']
        : ['stuff', 'control', 'velocity', 'defense', 'stamina'];
    const baseStats = Object.fromEntries(statKeys.map(key => {
        const value = Number(savedCard.baseStats?.[key]);
        return [key, Number.isFinite(value) ? clamp(value, 1, 99) : tierConfig.base];
    }));
    const allocatedStats = Object.fromEntries(statKeys.map(key => [
        key,
        Math.max(0, Number(savedCard.allocatedStats?.[key] || 0))
    ]));
    const requestedId = String(savedCard.id || savedCard.instanceId || '');
    let id = requestedId && !usedIds.has(requestedId)
        ? requestedId
        : `legacy-owned:${stableHash(`${savedCard.name}|${savedCard.teamId}|${gameState.nextCardSequence + 1}`).toString(36)}`;
    while (usedIds.has(id)) id = `${id}:copy`;
    usedIds.add(id);

    return {
        ...savedCard,
        id,
        instanceId: id,
        templateId: savedCard.templateId || `legacy-owned:${stableHash(`${savedCard.teamId}|${pos}|${savedCard.name}|${savedCard.backNo}`).toString(36)}`,
        playerId: savedCard.playerId || `legacy-${stableHash(`${pos}|${savedCard.name}|${savedCard.backNo}`).toString(36)}`,
        teamId: savedCard.teamId || selectedTeamId,
        pos,
        name: savedCard.name || 'KBO 선수',
        tier,
        series: savedCard.series || tierConfig.series,
        star: Number(savedCard.star || tierConfig.star),
        level: clamp(Number(savedCard.level || 0), 0, 10),
        exp: Math.max(0, Number(savedCard.exp || 0)),
        expLevel: clamp(Number(savedCard.expLevel || 1), 1, 10),
        bonusPoints: Math.max(0, Number(savedCard.bonusPoints || 0)),
        skills: normalizedSkills,
        baseStats,
        allocatedStats,
        season: ROSTER_SOURCE.season,
        year: '26',
        sourceDate: ROSTER_SOURCE.asOf,
        sourceStatus: 'legacy-owned',
        locked: Boolean(savedCard.locked)
    };
}

function migrateLegacySave(legacy) {
    const selectedTeamId = TEAM_ROSTERS_RAW[legacy.myTeamId] ? legacy.myTeamId : 'kia';
    const legacyCards = Array.isArray(legacy.roster) ? legacy.roster : [];
    const currentEntries = getCurrentRosterTemplateEntries();
    const oldToNewId = new Map();
    const legacyPackInventory = Array.isArray(legacy.packInventory)
        ? legacy.packInventory.filter(type => Object.hasOwn(PACK_CONFIGS, type))
        : Array.from({ length: Math.max(0, Number(legacy.packs || 0)) }, () => 'normal');

    gameState = {
        schemaVersion: SAVE_SCHEMA_VERSION,
        rosterSourceDate: ROSTER_SOURCE.asOf,
        rosterSourceVersion: ROSTER_SOURCE.version,
        gold: Number.isFinite(legacy.gold) ? legacy.gold : 5000,
        packs: 0,
        packInventory: legacyPackInventory,
        myTeamId: selectedTeamId,
        oppTeamId: legacy.oppTeamId,
        difficulty: normalizeDifficultyLevel(legacy.difficulty),
        roster: [],
        lineup: { batting: [], rotation: [], bullpen: [], closer: null },
        startingLineup: { batter: null, pitcher: null },
        nextCardSequence: 0
    };

    const usedIds = new Set();
    legacyCards.forEach(savedCard => {
        const currentTemplate = findCurrentRosterTemplate(savedCard, currentEntries);
        if (!currentTemplate) {
            const preservedCard = preserveLegacyOwnedCard(savedCard, selectedTeamId, usedIds);
            if (preservedCard) {
                gameState.roster.push(preservedCard);
                if (savedCard.id) oldToNewId.set(savedCard.id, preservedCard.id);
            }
            return;
        }
        const tier = Object.hasOwn(TIER_CONFIG, savedCard.tier) ? savedCard.tier : 'normal';
        const migratedCard = generateCard(
            currentTemplate.teamId,
            currentTemplate.pos,
            currentTemplate.player,
            tier
        );
        copySavedCardProgress(migratedCard, savedCard);
        const savedId = String(savedCard.id || savedCard.instanceId || '');
        if (savedId && !usedIds.has(savedId)) {
            migratedCard.id = savedId;
            migratedCard.instanceId = savedId;
        }
        usedIds.add(migratedCard.id);
        migratedCard.sourceStatus = 'current';
        gameState.roster.push(migratedCard);
        if (savedCard.id) oldToNewId.set(savedCard.id, migratedCard.id);
    });

    currentEntries
        .filter(entry => entry.teamId === selectedTeamId)
        .forEach(entry => {
            const templateId = getCardTemplateId(entry.teamId, entry.pos, entry.player);
            if (!gameState.roster.some(card => card.templateId === templateId)) {
                const seedCard = generateCard(entry.teamId, entry.pos, entry.player, 'normal');
                seedCard.sourceStatus = 'current';
                usedIds.add(seedCard.id);
                gameState.roster.push(seedCard);
            }
        });

    const remapIds = ids => (Array.isArray(ids) ? ids : [])
        .map(id => oldToNewId.get(id))
        .filter(Boolean);
    gameState.lineup = {
        batting: remapIds(legacy.lineup?.batting),
        rotation: remapIds(legacy.lineup?.rotation),
        bullpen: remapIds(legacy.lineup?.bullpen),
        closer: oldToNewId.get(legacy.lineup?.closer) || null
    };
    gameState.startingLineup = {
        batter: oldToNewId.get(legacy.startingLineup?.batter) || null,
        pitcher: oldToNewId.get(legacy.startingLineup?.pitcher) || null
    };
    repairLineup();
    if (!TEAM_ROSTERS_RAW[gameState.oppTeamId] || gameState.oppTeamId === selectedTeamId) {
        gameState.oppTeamId = KBO_TEAMS.find(team => team.id !== selectedTeamId).id;
    }
    saveGameData();
}

function loadGameData() {
    const saved = localStorage.getItem('kbo_pro_2026_save');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const hasStaleRosterSource = parsed.rosterSourceVersion !== ROSTER_SOURCE.version
                || parsed.rosterSourceDate !== ROSTER_SOURCE.asOf
                || !Array.isArray(parsed.roster)
                || parsed.roster.some(card =>
                    Number(card.season) !== ROSTER_SOURCE.season
                    || card.sourceDate !== ROSTER_SOURCE.asOf
                );
            if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION || hasStaleRosterSource) {
                migrateLegacySave(parsed);
            } else {
                gameState = parsed;
                gameState.difficulty = normalizeDifficultyLevel(gameState.difficulty);
                if (!Array.isArray(gameState.packInventory)) {
                    gameState.packInventory = Array.from({ length: Math.max(0, Number(gameState.packs || 0)) }, () => 'normal');
                }
                gameState.packs = gameState.packInventory.length;
                gameState.nextCardSequence = Math.max(
                    Number(gameState.nextCardSequence || 0),
                    gameState.roster.length
                );
                gameState.roster.forEach(card => {
                    card.level = clamp(Number(card.level || 0), 0, 10);
                });
                repairLineup();
                saveGameData();
            }
            return true;
        } catch (e) {
            console.error('Save loading failed: ', e);
        }
    }
    return false;
}

// 5. 3D Stadium Projection Math & Canvas Rendering
let canvas, ctx;
let canvasBackingScale = 1;
const CW = 960;
const CH = 540;
const VP = { x: 480, y: 195 }; // 2.5D Over-the-Shoulder Batter View Horizon
const CAMERA_LAYOUT = Object.freeze({
    view: 'behind_home_plate',
    pitcher: Object.freeze({ x: 480, y: 232, nx: 0.50, ny: 0.43 }),
    catcher: Object.freeze({ x: 480, y: 518, nx: 0.50, ny: 0.96 }),
    batter: Object.freeze({ x: 326, y: 492, nx: 0.34, ny: 0.91, handedness: 'right' }),
    strikeZone: Object.freeze({ x: 480, y: 340, nx: 0.50, ny: 0.63, width: 116, height: 130 }),
    homePlate: Object.freeze({ x: 480, y: 464, nx: 0.50, ny: 0.86 })
});
const FIELD_GEOMETRY = Object.freeze({
    home: Object.freeze({ x: 480, y: 470 }),
    first: Object.freeze({ x: 684, y: 342 }),
    second: Object.freeze({ x: 480, y: 205 }),
    third: Object.freeze({ x: 276, y: 342 }),
    mound: Object.freeze({ x: 480, y: 246 })
});

function configureCanvasBackingStore(force = false) {
    if (!canvas) return false;
    const nextScale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const nextWidth = Math.round(CW * nextScale);
    const nextHeight = Math.round(CH * nextScale);
    if (!force && canvas.width === nextWidth && canvas.height === nextHeight) return false;

    canvas.width = nextWidth;
    canvas.height = nextHeight;
    canvasBackingScale = nextScale;
    ctx = canvas.getContext('2d');
    ctx.setTransform(nextScale, 0, 0, nextScale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    canvas.dataset.backingScale = String(nextScale);
    return true;
}

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
    initPixelSpriteAtlas();

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
    elapsedMs: 0,
    travelDurationMs: 1320,
    speedKph: 145,
    pitchType: 'fast',
	    pitcherWindup: 0,
	    batterSwing: 0,
	    swingTriggered: false,
	    cueRevealed: false,
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
    elapsedMs: 0,
    durationMs: 1350,
    ballX: 0,
    ballY: 0.15,
    ballZ: 0,
    shadowX: 0,
    shadowY: 0.15,
    targetX: 0,
    targetY: 0.85,
    maxZ: 1.5,
    runBases: 0,
    resultCode: '',
    resultLabel: '',
    directionKey: '',
    directionLabel: '',
    distanceM: 0,
    currentDistanceM: 0,
    exitVelocityKph: 0,
    launchAngle: 0,
    trailPoints: [],
    calloutVisible: false
};
let lastBattedBall = null;

function drawBaseDiamond() {
    const { home, first, second, third, mound } = FIELD_GEOMETRY;

    ctx.save();

    // The foul lines and base paths share one centered, behind-home geometry contract.
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(home.x, home.y);
    ctx.lineTo(26, VP.y - 4);
    ctx.moveTo(home.x, home.y);
    ctx.lineTo(CW - 26, VP.y - 4);
    ctx.stroke();

    // A warm dirt lane wraps the true home-first-second-third order.
    ctx.strokeStyle = '#c96a45';
    ctx.lineWidth = 27;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(home.x, home.y);
    ctx.lineTo(first.x, first.y);
    ctx.lineTo(second.x, second.y);
    ctx.lineTo(third.x, third.y);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 253, 243, 0.94)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(home.x, home.y);
    ctx.lineTo(first.x, first.y);
    ctx.lineTo(second.x, second.y);
    ctx.lineTo(third.x, third.y);
    ctx.closePath();
    ctx.stroke();

    [
        { base: first, width: 18, height: 13 },
        { base: second, width: 15, height: 11 },
        { base: third, width: 18, height: 13 }
    ].forEach(({ base, width, height }) => {
        ctx.save();
        ctx.translate(base.x, base.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#9eb3c0';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = 'rgba(23, 50, 77, 0.24)';
        ctx.shadowBlur = 4;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.strokeRect(-width / 2, -height / 2, width, height);
        ctx.restore();
    });

    ctx.fillStyle = '#d17a50';
    ctx.strokeStyle = 'rgba(255, 253, 243, 0.84)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(mound.x, mound.y, 60, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fffdf3';
    ctx.fillRect(mound.x - 15, mound.y - 7, 30, 5);

    ctx.strokeStyle = 'rgba(255,255,255,0.86)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(home.x - 232, home.y + 1);
    ctx.lineTo(home.x - 84, home.y + 1);
    ctx.lineTo(home.x - 70, home.y - 166);
    ctx.lineTo(home.x - 176, home.y - 166);
    ctx.closePath();
    ctx.moveTo(home.x + 84, home.y + 1);
    ctx.lineTo(home.x + 232, home.y + 1);
    ctx.lineTo(home.x + 176, home.y - 166);
    ctx.lineTo(home.x + 70, home.y - 166);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#9eb3c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(home.x - 31, home.y - 16);
    ctx.lineTo(home.x + 31, home.y - 16);
    ctx.lineTo(home.x + 31, home.y - 8);
    ctx.lineTo(home.x, home.y + 5);
    ctx.lineTo(home.x - 31, home.y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function mixHexColors(from, to, amount = 0.5) {
    const parse = value => {
        const normalized = String(value || '').trim().replace('#', '');
        const full = normalized.length === 3
            ? normalized.split('').map(char => char + char).join('')
            : normalized.padEnd(6, '0').slice(0, 6);
        const number = Number.parseInt(full, 16);
        return {
            r: (number >> 16) & 255,
            g: (number >> 8) & 255,
            b: number & 255
        };
    };
    const a = parse(from);
    const b = parse(to);
    const t = clamp(amount, 0, 1);
    const channel = key => Math.round(a[key] + ((b[key] - a[key]) * t))
        .toString(16)
        .padStart(2, '0');
    return `#${channel('r')}${channel('g')}${channel('b')}`;
}

function getTeamPalette(teamId) {
    const team = KBO_TEAMS.find(t => t.id === teamId) || { color: '#2876c7' };
    const designColors = window.__RBI_CARD_DESIGN_TOKENS__?.colors || {};
    const ink = designColors.ink || '#10213a';
    const jersey = team.color;
    return {
        jersey,
        jerseyLight: mixHexColors(jersey, '#ffffff', 0.28),
        jerseyShadow: mixHexColors(jersey, ink, 0.46),
        jerseyDark: ink,
        ink,
        rim: designColors.cyan || '#58d7ff',
        signal: designColors.sun || '#ffe45c',
        skin: '#ffd6b5',
        skinLight: '#fff2e2',
        skinShadow: '#e9a477',
        cheek: '#f38f8a',
        pants: '#f8fbff',
        pantsShadow: '#b9c9dc',
        shoe: '#13233a',
        shoeLight: '#48627f',
        glove: '#9b5b32',
        gloveLight: '#d39257',
        metal: '#dce9f5'
    };
}

const EMBEDDED_PIXEL_SPRITE_ATLAS_SRC = typeof window.__BASEBALL_PIXEL_ATLAS_V2_DATA_URI__ === 'string'
    ? window.__BASEBALL_PIXEL_ATLAS_V2_DATA_URI__
    : '';

const PIXEL_SPRITE_ATLAS = Object.freeze({
    id: 'pixel_sprite_atlas_v2',
    src: EMBEDDED_PIXEL_SPRITE_ATLAS_SRC || 'assets/sprites/baseball_pixel_atlas_v2.png',
    sourceMode: EMBEDDED_PIXEL_SPRITE_ATLAS_SRC ? 'embedded_data_uri' : 'relative_png',
    width: 1024,
    height: 1024,
    cell: 256,
    embeddedProps: false,
    qualityProfile: 'clean_outline_v2',
    outlineColor: '#071525',
    footY: Object.freeze({
        batter: 252,
        catcher: 250,
        pitcher: 243
    }),
    rows: Object.freeze({
        batter: 0,
        catcher: 1,
        pitcher: 2
    })
});

const PIXEL_SPRITE_PROP_SEEDS = Object.freeze([
    Object.freeze({ x: 702, y: 172 }), // batter contact-ball prop
    Object.freeze({ x: 918, y: 341 }), // catcher impact shard
    Object.freeze({ x: 938, y: 350 }), // catcher impact shard
    Object.freeze({ x: 945, y: 365 }), // catcher impact shard
    Object.freeze({ x: 708, y: 597 })  // pitcher release-ball prop
]);

const PIXEL_SPRITE_FRAME_OFFSETS = Object.freeze({
    catcher: Object.freeze([
        Object.freeze({ x: 0, y: 0 }),
        Object.freeze({ x: 0, y: 0 }),
        Object.freeze({ x: 0, y: 0 }),
        Object.freeze({ x: 24, y: 19 })
    ])
});

const pixelSpriteAtlasState = {
    status: 'idle',
    image: null,
    error: '',
    tintFallback: false,
    propMaskApplied: !PIXEL_SPRITE_ATLAS.embeddedProps,
    teamAtlases: new Map(),
    lastFrames: {
        pitcher: 0,
        catcher: 0,
        batter: 0
    }
};

function initPixelSpriteAtlas() {
    if (pixelSpriteAtlasState.status === 'loading' || pixelSpriteAtlasState.status === 'ready') return;

    pixelSpriteAtlasState.status = 'loading';
    pixelSpriteAtlasState.error = '';
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
        if (image.naturalWidth !== PIXEL_SPRITE_ATLAS.width || image.naturalHeight !== PIXEL_SPRITE_ATLAS.height) {
            pixelSpriteAtlasState.status = 'error';
            pixelSpriteAtlasState.error = `invalid atlas dimensions: ${image.naturalWidth}x${image.naturalHeight}`;
            return;
        }
        pixelSpriteAtlasState.image = image;
        pixelSpriteAtlasState.status = 'ready';
        pixelSpriteAtlasState.teamAtlases.clear();
        if (ctx && gameActive) drawStadium();
    };
    image.onerror = () => {
        pixelSpriteAtlasState.status = 'error';
        pixelSpriteAtlasState.error = 'sprite atlas failed to load';
    };
    image.src = PIXEL_SPRITE_ATLAS.src;
}

function parseSpriteHex(value) {
    const normalized = String(value || '#ff2a8a').replace('#', '').trim();
    const full = normalized.length === 3
        ? normalized.split('').map(char => char + char).join('')
        : normalized.padEnd(6, '0').slice(0, 6);
    const number = Number.parseInt(full, 16);
    return {
        r: (number >> 16) & 255,
        g: (number >> 8) & 255,
        b: number & 255
    };
}

function mixSpriteRgb(from, to, amount) {
    const t = clamp(amount, 0, 1);
    return {
        r: Math.round(from.r + ((to.r - from.r) * t)),
        g: Math.round(from.g + ((to.g - from.g) * t)),
        b: Math.round(from.b + ((to.b - from.b) * t))
    };
}

function clearSpritePropComponents(imageData) {
    const { data, width, height } = imageData;
    let removedPixels = 0;

    PIXEL_SPRITE_PROP_SEEDS.forEach(seed => {
        const startKey = (seed.y * width) + seed.x;
        const startAlpha = data[(startKey * 4) + 3];
        if (startAlpha === 0) return;

        const pending = [startKey];
        const visited = new Set([startKey]);
        const component = [];

        while (pending.length > 0 && component.length <= 2048) {
            const key = pending.pop();
            const x = key % width;
            const y = Math.floor(key / width);
            if (data[(key * 4) + 3] === 0) continue;
            component.push(key);

            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    if (offsetX === 0 && offsetY === 0) continue;
                    const nextX = x + offsetX;
                    const nextY = y + offsetY;
                    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
                    const nextKey = (nextY * width) + nextX;
                    if (visited.has(nextKey) || data[(nextKey * 4) + 3] === 0) continue;
                    visited.add(nextKey);
                    pending.push(nextKey);
                }
            }
        }

        // A prop is a small disconnected component. Never erase a player body if an atlas changes.
        if (component.length > 2048) return;
        component.forEach(key => {
            data[(key * 4) + 3] = 0;
        });
        removedPixels += component.length;
    });

    return removedPixels;
}

function getTeamPixelAtlas(teamId, palette) {
    const cacheKey = `${teamId}:${palette.jersey}`;
    if (pixelSpriteAtlasState.teamAtlases.has(cacheKey)) {
        return pixelSpriteAtlasState.teamAtlases.get(cacheKey);
    }
    if (pixelSpriteAtlasState.status !== 'ready' || !pixelSpriteAtlasState.image) return null;

    try {
        const recolored = document.createElement('canvas');
        recolored.width = PIXEL_SPRITE_ATLAS.width;
        recolored.height = PIXEL_SPRITE_ATLAS.height;
        const recolorCtx = recolored.getContext('2d', { willReadFrequently: true });
        recolorCtx.imageSmoothingEnabled = false;
        recolorCtx.drawImage(pixelSpriteAtlasState.image, 0, 0);
        const imageData = recolorCtx.getImageData(0, 0, recolored.width, recolored.height);
        const data = imageData.data;
        const team = parseSpriteHex(palette.jersey);
        const shadow = parseSpriteHex(palette.jerseyShadow);
        const light = parseSpriteHex(palette.jerseyLight);

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const isKeyMagenta = r >= 175
                && g <= 125
                && b >= 82
                && b <= 185
                && (r - g) >= 65
                && (r - b) >= 24;
            if (!isKeyMagenta) continue;

            const luminance = (r + g + b) / 3;
            const mapped = luminance < 128
                ? mixSpriteRgb(team, shadow, (128 - luminance) / 92)
                : mixSpriteRgb(team, light, (luminance - 128) / 108);
            data[i] = mapped.r;
            data[i + 1] = mapped.g;
            data[i + 2] = mapped.b;
        }

        pixelSpriteAtlasState.propMaskApplied = PIXEL_SPRITE_ATLAS.embeddedProps
            ? clearSpritePropComponents(imageData) > 0
            : true;
        recolorCtx.putImageData(imageData, 0, 0);
        pixelSpriteAtlasState.teamAtlases.set(cacheKey, recolored);
        return recolored;
    } catch (error) {
        pixelSpriteAtlasState.tintFallback = true;
        pixelSpriteAtlasState.error = `team tint failed; procedural fallback: ${error.message}`;
        pixelSpriteAtlasState.teamAtlases.set(cacheKey, null);
        return null;
    }
}

function getPixelSpriteFrame(role, animState = 0) {
    const progress = clamp(animState, 0, 1);
    if (role === 'pitcher') {
        if (progress < 0.16) return 0;
        if (progress < 0.44) return 1;
        if (progress < 0.73) return 2;
        return 3;
    }
    if (role === 'catcher') {
        if (progress < 0.58) return Math.floor(gameClockMs / 460) % 2;
        if (progress < 0.90) return 2;
        return 3;
    }
    if (role === 'batter') {
        if (progress < 0.08) return 0;
        if (progress < 0.38) return 1;
        if (progress < 0.72) return 2;
        return 3;
    }
    return 0;
}

function drawPixelSpriteRole(role, teamId, animState = 0, palette = getTeamPalette(teamId)) {
    if (pixelSpriteAtlasState.status === 'idle') initPixelSpriteAtlas();
    if (pixelSpriteAtlasState.status !== 'ready') return false;

    const atlas = getTeamPixelAtlas(teamId, palette);
    const row = PIXEL_SPRITE_ATLAS.rows[role];
    if (!atlas || row === undefined) return false;

    const frame = getPixelSpriteFrame(role, animState);
    pixelSpriteAtlasState.lastFrames[role] = frame;
    const config = {
        pitcher: {
            anchor: CAMERA_LAYOUT.pitcher,
            width: 122,
            height: 122,
            badge: 'P',
            badgeWidth: 78,
            shadowWidth: 39,
            shadowHeight: 8
        },
        catcher: {
            anchor: CAMERA_LAYOUT.catcher,
            width: 190,
            height: 190,
            badge: 'C',
            badgeWidth: 104,
            shadowWidth: 52,
            shadowHeight: 10
        },
        batter: {
            anchor: CAMERA_LAYOUT.batter,
            width: 270,
            height: 270,
            badge: 'B',
            badgeWidth: 152,
            shadowWidth: 58,
            shadowHeight: 11
        }
    }[role];

    const footRatio = PIXEL_SPRITE_ATLAS.footY[role] / PIXEL_SPRITE_ATLAS.cell;
    const actionLift = role === 'pitcher' && frame === 2
        ? -3
        : role === 'batter' && frame === 2
            ? -2
            : 0;
    const zone = pitchAnimState.targetZone || selectedPitchZone;
    const catcherOffsetX = role === 'catcher' && frame >= 2
        ? (zone === 'left' ? -6 : zone === 'right' ? 6 : 0)
        : 0;
    const catcherOffsetY = role === 'catcher' && frame >= 2
        ? (zone === 'up' ? -5 : zone === 'down' ? 4 : 0)
        : 0;

    ctx.save();
    ctx.translate(config.anchor.x + catcherOffsetX, config.anchor.y + catcherOffsetY + actionLift);
    drawCharacterBadge(0, role === 'catcher' ? -1 : 4, config.badge, palette, config.badgeWidth);

    ctx.fillStyle = 'rgba(16, 33, 58, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 3 - actionLift, config.shadowWidth, config.shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    const sourceX = frame * PIXEL_SPRITE_ATLAS.cell;
    const sourceY = row * PIXEL_SPRITE_ATLAS.cell;
    const frameOffset = PIXEL_SPRITE_FRAME_OFFSETS[role]?.[frame] || { x: 0, y: 0 };
    const drawX = (-config.width / 2) + ((frameOffset.x / PIXEL_SPRITE_ATLAS.cell) * config.width);
    const drawY = -(config.height * footRatio) + ((frameOffset.y / PIXEL_SPRITE_ATLAS.cell) * config.height);
    ctx.drawImage(
        atlas,
        sourceX,
        sourceY,
        PIXEL_SPRITE_ATLAS.cell,
        PIXEL_SPRITE_ATLAS.cell,
        Math.round(drawX),
        Math.round(drawY),
        config.width,
        config.height
    );

    if (role === 'catcher' && frame >= 2) {
        const ringX = frame === 2 ? 52 : 58;
        const ringY = frame === 2 ? -68 : -74;
        ctx.strokeStyle = `${palette.rim}bb`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ringX, ringY, 17 + ((gameClockMs / 90) % 4), 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
    return true;
}

function drawOutlinedLimb(x1, y1, x2, y2, width, color, ink = '#10213a') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    ctx.lineWidth = width + 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.26)';
    ctx.lineWidth = Math.max(1.2, width * 0.2);
    ctx.beginPath();
    ctx.moveTo(x1 - 1, y1 - 1);
    ctx.lineTo(x2 - 1, y2 - 1);
    ctx.stroke();
}

function drawOutlinedCircle(x, y, radius, fill, ink = '#10213a', lineWidth = 4) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = ink;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function resolveCharacterPose(role, animState = 0) {
    const t = clamp(animState, 0, 1);
    const smooth = value => {
        const clamped = clamp(value, 0, 1);
        return clamped * clamped * (3 - (2 * clamped));
    };

    if (role === 'pitcher') {
        return {
            stage: t < 0.24 ? 'ready' : t < 0.7 ? 'action' : 'follow-through',
            load: smooth(t / 0.34),
            action: Math.sin(clamp(t / 0.72, 0, 1) * Math.PI),
            release: smooth((t - 0.32) / 0.4),
            follow: smooth((t - 0.68) / 0.32)
        };
    }
    if (role === 'batter') {
        return {
            stage: t < 0.18 ? 'ready' : t < 0.7 ? 'action' : 'follow-through',
            load: smooth(t / 0.22),
            action: smooth((t - 0.12) / 0.46),
            release: smooth((t - 0.42) / 0.3),
            follow: smooth((t - 0.68) / 0.32)
        };
    }
    return {
        stage: t < 0.58 ? 'ready' : t < 0.9 ? 'action' : 'follow-through',
        load: smooth(t / 0.3),
        action: smooth((t - 0.52) / 0.3),
        release: 0,
        follow: smooth((t - 0.82) / 0.18)
    };
}

function drawCharacterBadge(x, y, label, palette, width = 72) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = palette.rim;
    ctx.shadowBlur = 9;
    ctx.strokeStyle = `${palette.rim}aa`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.5, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(7, 19, 31, 0.92)';
    ctx.strokeStyle = palette.signal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect((width * 0.5) - 24, -9, 23, 18, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = palette.signal;
    ctx.font = '900 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, (width * 0.5) - 12.5, 0);
    ctx.restore();
}

function drawCelShadedHead(x, y, radius, palette, options = {}) {
    const gaze = clamp(options.gaze || 0, -1, 1);
    const focus = options.expression === 'focus';

    drawOutlinedCircle(x - (radius * 0.82), y + 1, radius * 0.23, palette.skin, palette.ink, 2.5);
    drawOutlinedCircle(x + (radius * 0.82), y + 1, radius * 0.23, palette.skin, palette.ink, 2.5);
    drawOutlinedCircle(x, y, radius, palette.skin, palette.ink, Math.max(4, radius * 0.2));

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = palette.skinShadow;
    ctx.beginPath();
    ctx.ellipse(x + (radius * 0.55), y + (radius * 0.3), radius * 0.7, radius * 1.05, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.48)';
    ctx.beginPath();
    ctx.ellipse(x - (radius * 0.34), y - (radius * 0.38), radius * 0.32, radius * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const eyeY = y - (radius * 0.1);
    const eyeOffset = radius * 0.34;
    [-1, 1].forEach(side => {
        const eyeX = x + (eyeOffset * side);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, radius * 0.18, radius * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = palette.ink;
        ctx.beginPath();
        ctx.arc(eyeX + (gaze * radius * 0.08), eyeY + 0.5, radius * 0.075, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX + (gaze * radius * 0.08) - 1, eyeY - 1, Math.max(0.9, radius * 0.025), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = Math.max(1.5, radius * 0.075);
        ctx.beginPath();
        const browTilt = focus ? side * 2.2 : side * 0.7;
        ctx.moveTo(eyeX - (radius * 0.17), eyeY - (radius * 0.26) - browTilt);
        ctx.lineTo(eyeX + (radius * 0.17), eyeY - (radius * 0.23) + browTilt);
        ctx.stroke();
    });

    ctx.strokeStyle = mixHexColors(palette.skinShadow, palette.ink, 0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 1, y);
    ctx.lineTo(x - 1, y + (radius * 0.16));
    ctx.lineTo(x + (radius * 0.08), y + (radius * 0.18));
    ctx.stroke();

    ctx.fillStyle = `${palette.cheek}88`;
    ctx.beginPath();
    ctx.ellipse(x - (radius * 0.48), y + (radius * 0.27), radius * 0.15, radius * 0.08, 0, 0, Math.PI * 2);
    ctx.ellipse(x + (radius * 0.48), y + (radius * 0.27), radius * 0.15, radius * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (focus) {
        ctx.moveTo(x - (radius * 0.14), y + (radius * 0.42));
        ctx.lineTo(x + (radius * 0.14), y + (radius * 0.42));
    } else {
        ctx.arc(x, y + (radius * 0.29), radius * 0.2, 0.12 * Math.PI, 0.88 * Math.PI);
    }
    ctx.stroke();
}

function drawArcadeCap(x, y, radius, palette, options = {}) {
    const helmet = Boolean(options.helmet);
    ctx.save();
    ctx.fillStyle = palette.jersey;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = Math.max(4, radius * 0.2);
    ctx.beginPath();
    ctx.arc(x, y - (radius * 0.12), radius * 1.03, Math.PI, 0);
    ctx.lineTo(x + radius, y - (radius * 0.03));
    ctx.lineTo(x - radius, y - (radius * 0.03));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y - (radius * 0.12), radius * 0.92, Math.PI, 0);
    ctx.clip();
    ctx.fillStyle = palette.jerseyLight;
    ctx.beginPath();
    ctx.ellipse(x - (radius * 0.38), y - (radius * 0.55), radius * 0.32, radius * 0.55, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.jerseyShadow;
    ctx.fillRect(x + (radius * 0.38), y - radius, radius * 0.8, radius);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.54)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y - (radius * 0.14));
    ctx.stroke();

    ctx.fillStyle = palette.ink;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - (radius * 0.18), y - (radius * 0.57), radius * 0.36, radius * 0.38, radius * 0.12);
    ctx.fill();
    ctx.fillStyle = palette.signal;
    ctx.fillRect(x - (radius * 0.045), y - (radius * 0.5), radius * 0.09, radius * 0.23);

    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    if (helmet) {
        ctx.roundRect(x - (radius * 0.98), y - (radius * 0.13), radius * 1.45, radius * 0.24, radius * 0.1);
    } else {
        ctx.roundRect(x - (radius * 0.12), y - (radius * 0.08), radius * 1.18, radius * 0.23, radius * 0.1);
    }
    ctx.fill();

    if (helmet) {
        ctx.fillStyle = palette.jersey;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x - (radius * 0.88), y - (radius * 0.02), radius * 0.42, radius * 0.72, radius * 0.16);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

function drawRearArcadeHead(x, y, radius, palette, options = {}) {
    const catcherMask = Boolean(options.catcherMask);
    const helmet = Boolean(options.helmet);
    const threeQuarter = Boolean(options.threeQuarter);
    const turn = Math.sign(options.turn || -1);

    ctx.save();
    ctx.translate(x, y);

    if (catcherMask) {
        // From the home-plate camera the catcher shows the shell, rear pad,
        // and crossed harness. No face plane or front cage is visible.
        ctx.fillStyle = palette.jerseyDark;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = Math.max(4, radius * 0.2);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = palette.jerseyShadow;
        ctx.beginPath();
        ctx.ellipse(radius * 0.48, radius * 0.12, radius * 0.64, radius * 1.02, -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.ellipse(-radius * 0.34, -radius * 0.46, radius * 0.3, radius * 0.18, -0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Rear shell panel seams run vertically and diagonally. Avoid front-cage
        // horizontal bars, which can read like eyes or a mouth at small sizes.
        ctx.strokeStyle = 'rgba(255,255,255,0.48)';
        ctx.lineWidth = Math.max(1.8, radius * 0.08);
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.88);
        ctx.lineTo(0, radius * 0.62);
        ctx.moveTo(-radius * 0.55, -radius * 0.62);
        ctx.quadraticCurveTo(-radius * 0.34, -radius * 0.08, -radius * 0.45, radius * 0.5);
        ctx.moveTo(radius * 0.55, -radius * 0.62);
        ctx.quadraticCurveTo(radius * 0.34, -radius * 0.08, radius * 0.45, radius * 0.5);
        ctx.stroke();

        ctx.strokeStyle = palette.jerseyLight;
        ctx.lineWidth = Math.max(3, radius * 0.15);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-radius * 0.58, -radius * 0.52);
        ctx.lineTo(radius * 0.5, radius * 0.55);
        ctx.moveTo(radius * 0.58, -radius * 0.52);
        ctx.lineTo(-radius * 0.5, radius * 0.55);
        ctx.stroke();

        // Central rear pad and two side buckles make the attachment direction
        // unmistakable without recreating a face-like front mask.
        ctx.fillStyle = palette.jersey;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-radius * 0.28, -radius * 0.13, radius * 0.56, radius * 0.34, radius * 0.1);
        ctx.fill();
        ctx.stroke();

        [-1, 1].forEach(side => {
            ctx.fillStyle = palette.metal;
            ctx.strokeStyle = palette.ink;
            ctx.beginPath();
            ctx.roundRect((side * radius * 0.75) - (radius * 0.11), radius * 0.17, radius * 0.22, radius * 0.24, radius * 0.07);
            ctx.fill();
            ctx.stroke();
        });

        ctx.fillStyle = palette.ink;
        ctx.beginPath();
        ctx.roundRect(-radius * 0.58, radius * 0.5, radius * 1.16, radius * 0.16, radius * 0.08);
        ctx.fill();

        ctx.fillStyle = palette.signal;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -radius * 0.82, Math.max(2, radius * 0.1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return;
    }

    // Rear-three-quarter batting helmet: only the back of the skull, one ear,
    // rear seams, and the plate-side flap are shown. Facial features are omitted.
    drawOutlinedCircle(0, radius * 0.08, radius * 0.94, palette.skin, palette.ink, Math.max(4, radius * 0.19));

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, radius * 0.08, radius * 0.9, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = mixHexColors(palette.ink, '#2b1b19', 0.34);
    ctx.beginPath();
    ctx.ellipse(-turn * radius * 0.2, radius * 0.56, radius * 0.75, radius * 0.48, turn * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (threeQuarter) {
        drawOutlinedCircle(turn * radius * 0.82, radius * 0.12, radius * 0.22, palette.skinShadow, palette.ink, 2.5);
        ctx.strokeStyle = mixHexColors(palette.skinShadow, palette.ink, 0.35);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(turn * radius * 0.82, radius * 0.12, radius * 0.1, -0.55 * Math.PI, 0.55 * Math.PI);
        ctx.stroke();
    }

    ctx.fillStyle = palette.jersey;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = Math.max(4, radius * 0.2);
    ctx.beginPath();
    ctx.arc(0, -radius * 0.03, radius * 1.03, Math.PI, 0);
    ctx.lineTo(radius * 0.96, radius * 0.31);
    ctx.quadraticCurveTo(0, radius * 0.48, -radius * 0.96, radius * 0.31);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -radius * 0.03, radius * 0.92, Math.PI, 0);
    ctx.lineTo(radius * 0.86, radius * 0.25);
    ctx.quadraticCurveTo(0, radius * 0.4, -radius * 0.86, radius * 0.25);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = palette.jerseyLight;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.38, -radius * 0.48, radius * 0.3, radius * 0.55, -0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.jerseyShadow;
    ctx.fillRect(radius * 0.34, -radius, radius * 0.8, radius * 1.4);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.52)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.96);
    ctx.lineTo(0, radius * 0.3);
    ctx.moveTo(-radius * 0.52, -radius * 0.68);
    ctx.quadraticCurveTo(-radius * 0.33, -radius * 0.12, -radius * 0.4, radius * 0.29);
    ctx.moveTo(radius * 0.52, -radius * 0.68);
    ctx.quadraticCurveTo(radius * 0.33, -radius * 0.12, radius * 0.4, radius * 0.29);
    ctx.stroke();

    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.55, radius * 0.19, radius * 1.1, radius * 0.18, radius * 0.08);
    ctx.fill();

    if (helmet) {
        ctx.fillStyle = palette.jersey;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(
            (turn * radius * 0.6) - (radius * 0.2),
            radius * 0.03,
            radius * 0.42,
            radius * 0.72,
            radius * 0.16
        );
        ctx.fill();
        ctx.stroke();

        // A short side brim points toward the mound; it never crosses the rear
        // of the helmet like a front-facing visor would.
        ctx.fillStyle = palette.ink;
        ctx.beginPath();
        const brimX = turn < 0 ? -radius * 1.08 : radius * 0.42;
        ctx.roundRect(brimX, -radius * 0.08, radius * 0.66, radius * 0.2, radius * 0.08);
        ctx.fill();
    }

    ctx.fillStyle = palette.signal;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.88, Math.max(2.2, radius * 0.11), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawUniformDetails(x, y, width, height, palette, options = {}) {
    const rotation = options.rotation || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.fillStyle = palette.jersey;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = options.foreground ? 5 : 4;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, Math.min(13, width * 0.28));
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect((-width / 2) + 2, (-height / 2) + 2, width - 4, height - 4, Math.min(11, width * 0.24));
    ctx.clip();
    ctx.fillStyle = palette.jerseyShadow;
    ctx.fillRect(width * 0.12, -height / 2, width * 0.48, height);
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.beginPath();
    ctx.ellipse(-width * 0.25, -height * 0.36, width * 0.22, height * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width * 0.12, -height * 0.48);
    ctx.lineTo(0, -height * 0.29);
    ctx.lineTo(width * 0.12, -height * 0.48);
    ctx.moveTo(0, -height * 0.25);
    ctx.lineTo(0, height * 0.4);
    ctx.stroke();

    ctx.fillStyle = palette.signal;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-width * 0.23, 0, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 1, 1.5, 0, Math.PI * 2);
    ctx.arc(0, 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawRearUniformDetails(x, y, width, height, palette, options = {}) {
    const rotation = options.rotation || 0;
    const number = String(options.number || '11');

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.fillStyle = palette.jersey;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = options.foreground ? 5 : 4;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, Math.min(13, width * 0.28));
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect((-width / 2) + 2, (-height / 2) + 2, width - 4, height - 4, Math.min(11, width * 0.24));
    ctx.clip();
    ctx.fillStyle = palette.jerseyShadow;
    ctx.fillRect(width * 0.12, -height / 2, width * 0.48, height);
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.beginPath();
    ctx.ellipse(-width * 0.25, -height * 0.34, width * 0.22, height * 0.15, -0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Back collar and shoulder yoke replace the front V-neck and button placket.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -height * 0.48, width * 0.17, 0.08 * Math.PI, 0.92 * Math.PI);
    ctx.moveTo(-width * 0.42, -height * 0.25);
    ctx.quadraticCurveTo(0, -height * 0.12, width * 0.42, -height * 0.25);
    ctx.stroke();

    ctx.save();
    if (options.mirrored) ctx.scale(-1, 1);
    ctx.font = `900 ${Math.max(14, Math.round(height * 0.39))}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 4;
    ctx.strokeText(number, 0, height * 0.1);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(number, 0, height * 0.1);
    ctx.restore();

    if (options.harness) {
        ctx.strokeStyle = palette.jerseyLight;
        ctx.lineWidth = Math.max(3, width * 0.09);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-width * 0.35, -height * 0.34);
        ctx.lineTo(width * 0.28, height * 0.4);
        ctx.moveTo(width * 0.35, -height * 0.34);
        ctx.lineTo(-width * 0.28, height * 0.4);
        ctx.stroke();
        ctx.strokeStyle = palette.metal;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-width * 0.38, height * 0.28);
        ctx.lineTo(width * 0.38, height * 0.28);
        ctx.stroke();

        // Keep the jersey number above the crossed rear straps so the harness
        // cannot be mistaken for a front chest protector at thumbnail scale.
        ctx.font = `900 ${Math.max(12, Math.round(height * 0.3))}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 3;
        ctx.strokeText(number, 0, height * 0.1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(number, 0, height * 0.1);
    }
    ctx.restore();
}

function drawGloveDetails(x, y, radius, palette, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    drawOutlinedCircle(0, 0, radius, palette.glove, palette.ink, 4);
    ctx.strokeStyle = palette.gloveLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-1, 1, radius * 0.6, -0.85 * Math.PI, 0.32 * Math.PI);
    ctx.moveTo(-radius * 0.42, -radius * 0.28);
    ctx.lineTo(radius * 0.42, radius * 0.32);
    ctx.moveTo(-radius * 0.15, -radius * 0.5);
    ctx.lineTo(radius * 0.5, radius * 0.1);
    ctx.stroke();
    ctx.restore();
}

function drawChibiPitcher(teamId, animState = 0) {
    const palette = getTeamPalette(teamId);
    if (drawPixelSpriteRole('pitcher', teamId, animState, palette)) return;

    const pose = resolveCharacterPose('pitcher', animState);
    const legKick = pose.action * (1 - (pose.follow * 0.4));
    const gloveX = -18 + (pose.release * 19);
    const gloveY = -49 + (pose.release * 19);
    const gloveElbowX = -26 + (pose.release * 18);
    const gloveElbowY = -54 + (pose.release * 16);
    const throwElbowX = 27 + (pose.action * 10) - (pose.release * 42);
    const throwElbowY = -55 - (pose.action * 13) + (pose.release * 25);
    const throwHandX = 17 + (pose.action * 19) - (pose.release * 63);
    const throwHandY = -52 - (pose.action * 17) + (pose.release * 32);
    const kneeX = 10 + (legKick * 22) + (pose.follow * 8);
    const kneeY = -23 - (legKick * 24) + (pose.follow * 15);
    const torsoTurn = (-pose.release * 0.13) + (pose.follow * 0.2);

    ctx.save();
    ctx.translate(CAMERA_LAYOUT.pitcher.x, CAMERA_LAYOUT.pitcher.y);
    drawCharacterBadge(0, 5, 'P', palette, 78);
    ctx.scale(1.06, 1.06);

    ctx.fillStyle = 'rgba(16, 33, 58, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    drawOutlinedLimb(-8, -25, -13 - (pose.follow * 8), 0, 11, palette.pants, palette.ink);
    drawOutlinedLimb(7, -24, kneeX, kneeY, 12, palette.pants, palette.ink);
    drawOutlinedLimb(
        kneeX,
        kneeY,
        kneeX + 5 + (pose.release * 17),
        1 - (legKick * 9),
        10,
        palette.pantsShadow,
        palette.ink
    );
    drawOutlinedLimb(-17 - (pose.follow * 7), 0, -4 - (pose.follow * 4), 0, 8, palette.shoe, palette.ink);
    drawOutlinedLimb(
        kneeX + (pose.release * 11),
        1 - (legKick * 9),
        kneeX + 11 + (pose.release * 14),
        1 - (legKick * 7),
        8,
        palette.shoe,
        palette.ink
    );

    ctx.strokeStyle = palette.shoeLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14 - (pose.follow * 7), -2);
    ctx.lineTo(-5 - (pose.follow * 4), -2);
    ctx.moveTo(kneeX + 12 + (pose.release * 10), -1 - (legKick * 7));
    ctx.lineTo(kneeX + 20 + (pose.release * 12), -1 - (legKick * 7));
    ctx.stroke();

    drawUniformDetails(2 + (pose.release * 3), -41, 40, 41, palette, { rotation: torsoTurn });

    const shoulderShift = pose.release * 3;
    drawOutlinedLimb(-13 + shoulderShift, -52, gloveElbowX, gloveElbowY, 10, palette.jerseyShadow, palette.ink);
    drawOutlinedLimb(gloveElbowX, gloveElbowY, gloveX, gloveY, 9, palette.jersey, palette.ink);
    drawOutlinedLimb(13 + shoulderShift, -51, throwElbowX, throwElbowY, 10, palette.jersey, palette.ink);
    drawOutlinedLimb(throwElbowX, throwElbowY, throwHandX, throwHandY, 8, palette.skin, palette.ink);
    drawGloveDetails(gloveX - 4, gloveY + 1, 11, palette, -0.35 + (pose.release * 0.6));

    const headX = pose.release * 5;
    const headY = -79 + (pose.release * 3) + (pose.follow * 2);
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate((pose.release * 0.08) - (pose.follow * 0.12));
    drawCelShadedHead(0, 0, 21, palette, { expression: 'focus', gaze: -0.2 - (pose.release * 0.55) });
    drawArcadeCap(0, -1, 21, palette);
    ctx.restore();

    drawOutlinedCircle(throwHandX, throwHandY, 4.5, palette.skin, palette.ink, 2.5);
    if (animState < 0.42 && pitchMeterActive) {
        drawOutlinedCircle(throwHandX, throwHandY, 4, '#ffffff', '#d9414b', 2);
    }

    if (pose.release > 0.45) {
        ctx.strokeStyle = `${palette.signal}aa`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(throwHandX + 10 + (i * 5), throwHandY - 7 + (i * 4));
            ctx.lineTo(throwHandX + 24 + (i * 6), throwHandY - 11 + (i * 5));
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawChibiCatcher(teamId, animState = 0) {
    const palette = getTeamPalette(teamId);
    if (drawPixelSpriteRole('catcher', teamId, animState, palette)) return;

    const pose = resolveCharacterPose('catcher', animState);
    const zone = pitchAnimState.targetZone || selectedPitchZone;
    const zoneX = zone === 'left' ? -8 : zone === 'right' ? 8 : 0;
    const zoneY = zone === 'up' ? -8 : zone === 'down' ? 7 : 0;
    const receive = pose.action;
    const gloveX = -37 + (zoneX * receive);
    const gloveY = -37 + (zoneY * receive);

    ctx.save();
    ctx.translate(CAMERA_LAYOUT.catcher.x, CAMERA_LAYOUT.catcher.y);
    drawCharacterBadge(0, -1, 'C', palette, 104);
    ctx.scale(1.28, 1.28);

    ctx.fillStyle = 'rgba(16, 33, 58, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 45, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    const crouchDrop = pose.action * 2;
    drawOutlinedLimb(-10, -27 + crouchDrop, -29, -16 + crouchDrop, 12, palette.pants, palette.ink);
    drawOutlinedLimb(-29, -16 + crouchDrop, -39, -2, 11, palette.pantsShadow, palette.ink);
    drawOutlinedLimb(10, -27 + crouchDrop, 29, -16 + crouchDrop, 12, palette.pants, palette.ink);
    drawOutlinedLimb(29, -16 + crouchDrop, 39, -2, 11, palette.pantsShadow, palette.ink);
    drawOutlinedLimb(-39, -2, -49, 1, 8, palette.shoe, palette.ink);
    drawOutlinedLimb(39, -2, 49, 1, 8, palette.shoe, palette.ink);

    // Rear calf straps and narrow guard edges keep the squat readable without
    // presenting the bright front shin plates to the home-plate camera.
    [-1, 1].forEach(side => {
        ctx.save();
        ctx.translate(side * 33, -11 + crouchDrop);
        ctx.rotate(side * -0.28);
        ctx.fillStyle = palette.pantsShadow;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-5, -12, 10, 24, 5);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = palette.jerseyDark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-7, -5);
        ctx.lineTo(7, -5);
        ctx.moveTo(-7, 5);
        ctx.lineTo(7, 5);
        ctx.stroke();
        ctx.restore();
    });

    drawRearUniformDetails(0, -41 + crouchDrop, 45, 40, palette, {
        rotation: 0,
        number: '2',
        harness: true
    });

    const gloveElbowX = -26 + (zoneX * receive * 0.55);
    const gloveElbowY = -47 + (zoneY * receive * 0.45);
    drawOutlinedLimb(-15, -50 + crouchDrop, gloveElbowX, gloveElbowY, 10, palette.jerseyShadow, palette.ink);
    drawOutlinedLimb(gloveElbowX, gloveElbowY, gloveX, gloveY, 9, palette.jersey, palette.ink);
    drawGloveDetails(gloveX, gloveY, 13, palette, -0.4 + (zoneX * 0.03));
    drawOutlinedLimb(15, -50 + crouchDrop, 27, -33 + crouchDrop, 9, palette.jerseyDark, palette.ink);
    drawOutlinedCircle(28, -31 + crouchDrop, 5, palette.skin, palette.ink, 2.5);

    const headY = -79 + crouchDrop;
    drawRearArcadeHead(0, headY, 21, {
        ...palette,
        jersey: palette.jerseyDark,
        jerseyLight: palette.jerseyShadow
    }, { catcherMask: true });

    if (pose.action > 0.35) {
        ctx.strokeStyle = `${palette.rim}${Math.round(80 + (pose.action * 100)).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gloveX, gloveY, 18 + (pose.action * 4), 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawChibiBatter(teamId, animState = 0) {
    const palette = getTeamPalette(teamId);
    if (drawPixelSpriteRole('batter', teamId, animState, palette)) return;

    const swing = clamp(animState, 0, 1);
    const pose = resolveCharacterPose('batter', swing);
    const lean = (pose.load * 3) + (pose.action * 8) - (pose.follow * 4);
    const hands = {
        x: -17 - (pose.action * 27) + (pose.follow * 8),
        y: -60 + (pose.action * 11) - (pose.follow * 9)
    };
    const batAngle = -0.95 - (pose.action * 2.12) - (pose.follow * 0.55);
    const batLength = 118;
    const batEnd = {
        x: hands.x + Math.cos(batAngle) * batLength,
        y: hands.y + Math.sin(batAngle) * batLength
    };
    const barrelStart = {
        x: hands.x + Math.cos(batAngle) * 64,
        y: hands.y + Math.sin(batAngle) * 64
    };
    const torsoRotation = -0.08 - (pose.load * 0.04) + (pose.action * 0.23) + (pose.follow * 0.12);
    const frontStride = pose.action * 4;

    const drawBat = () => {
        drawOutlinedLimb(hands.x, hands.y, batEnd.x, batEnd.y, 6.5, '#d98b37', '#5d361f');
        drawOutlinedLimb(barrelStart.x, barrelStart.y, batEnd.x, batEnd.y, 10, '#efb85f', '#5d361f');
        ctx.strokeStyle = '#fff0b7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barrelStart.x + 1, barrelStart.y - 2);
        ctx.lineTo(batEnd.x + 1, batEnd.y - 2);
        ctx.stroke();
    };

    ctx.save();
    ctx.translate(CAMERA_LAYOUT.batter.x, CAMERA_LAYOUT.batter.y);
    drawCharacterBadge(0, 4, 'B', palette, 152);
    ctx.scale(-1.72, 1.72);

    ctx.fillStyle = 'rgba(16, 33, 58, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 48, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Motion trails sit behind the silhouette so they never erase the face or hands.
    if (pose.action > 0.08) {
        ctx.strokeStyle = `rgba(255, 228, 92, ${0.18 + (pose.action * 0.34)})`;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(hands.x - 4, hands.y + 4, 62 + (i * 13), -2.9, -1.2);
            ctx.stroke();
        }
    }

    if (swing < 0.5) drawBat();

    const rearKnee = { x: -20 - (pose.follow * 2), y: -16 };
    const frontKnee = { x: 22 - frontStride, y: -17 + (pose.follow * 2) };
    drawOutlinedLimb(-8, -31, rearKnee.x, rearKnee.y, 13, palette.pants, palette.ink);
    drawOutlinedLimb(rearKnee.x, rearKnee.y, -29 - (pose.follow * 3), 0, 12, palette.pantsShadow, palette.ink);
    drawOutlinedLimb(10, -30, frontKnee.x, frontKnee.y, 13, palette.pants, palette.ink);
    drawOutlinedLimb(frontKnee.x, frontKnee.y, 31 - frontStride, -pose.follow * 4, 12, palette.pantsShadow, palette.ink);
    drawOutlinedLimb(-30 - (pose.follow * 3), 0, -17 - (pose.follow * 2), 1, 8, palette.shoe, palette.ink);
    drawOutlinedLimb(29 - frontStride, -pose.follow * 4, 42 - frontStride, 1 - (pose.follow * 3), 8, palette.shoe, palette.ink);

    ctx.strokeStyle = palette.shoeLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-28 - (pose.follow * 3), -2);
    ctx.lineTo(-18 - (pose.follow * 2), -2);
    ctx.moveTo(31 - frontStride, -2 - (pose.follow * 3));
    ctx.lineTo(40 - frontStride, -1 - (pose.follow * 3));
    ctx.stroke();

    drawRearUniformDetails(-lean, -49, 46, 44, palette, {
        rotation: torsoRotation,
        foreground: true,
        mirrored: true,
        number: '11'
    });

    if (swing >= 0.5) drawBat();

    const rearElbow = {
        x: -21 - (pose.action * 7) + (pose.follow * 5),
        y: -53 + (pose.action * 5)
    };
    const frontElbow = {
        x: 8 - (pose.action * 20) + (pose.follow * 5),
        y: -69 + (pose.action * 16) - (pose.follow * 4)
    };
    drawOutlinedLimb(-12 - lean, -61, rearElbow.x, rearElbow.y, 11, palette.jerseyShadow, palette.ink);
    drawOutlinedLimb(rearElbow.x, rearElbow.y, hands.x, hands.y, 9, palette.skin, palette.ink);
    drawOutlinedLimb(14 - lean, -58, frontElbow.x, frontElbow.y, 10, palette.jersey, palette.ink);
    drawOutlinedLimb(frontElbow.x, frontElbow.y, hands.x + 4, hands.y + 4, 9, palette.skin, palette.ink);
    drawOutlinedCircle(hands.x - 1, hands.y, 6, '#ffffff', palette.ink, 3);
    drawOutlinedCircle(hands.x + 4, hands.y + 4, 5.5, palette.jerseyLight, palette.ink, 3);
    ctx.strokeStyle = palette.jersey;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hands.x - 5, hands.y);
    ctx.lineTo(hands.x + 8, hands.y + 4);
    ctx.stroke();

    const headX = -9 - lean + (pose.follow * 3);
    const headY = -91 + (pose.action * 1.5);
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate((-torsoRotation * 0.48) + (pose.follow * 0.04));
    drawRearArcadeHead(0, 0, 25, palette, {
        helmet: true,
        threeQuarter: true,
        turn: -1
    });
    ctx.restore();

    if (Math.abs(swing - 0.7) < 0.11) {
        ctx.strokeStyle = palette.signal;
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const angle = (-0.65 + (i * 0.32));
            ctx.beginPath();
            ctx.moveTo(hands.x + Math.cos(angle) * 14, hands.y + Math.sin(angle) * 14);
            ctx.lineTo(hands.x + Math.cos(angle) * 29, hands.y + Math.sin(angle) * 29);
            ctx.stroke();
        }
    }

    ctx.restore();
    return true;
}

function drawChibiRunner(wx, wy, teamId) {
    const palette = getTeamPalette(teamId);
    const pos = projectToCanvas(wx, wy);
    const scale = Math.max(0.48, pos.scale * 0.82);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(scale, scale);
    drawOutlinedLimb(-6, -21, -14, -10, 9, palette.pants, palette.ink);
    drawOutlinedLimb(-14, -10, -23, 1, 8, palette.pantsShadow, palette.ink);
    drawOutlinedLimb(6, -21, 15, -10, 9, palette.pants, palette.ink);
    drawOutlinedLimb(15, -10, 23, 1, 8, palette.pantsShadow, palette.ink);
    drawOutlinedLimb(-11, -41, 13, -27, 7, palette.jerseyShadow, palette.ink);
    drawOutlinedLimb(11, -42, -13, -29, 7, palette.jersey, palette.ink);
    drawUniformDetails(0, -34, 31, 32, palette, {});
    drawCelShadedHead(0, -65, 17, palette, { expression: 'focus', gaze: -0.4 });
    drawArcadeCap(0, -66, 17, palette, { helmet: true });
    ctx.restore();
}

function drawPlayerFigure(wx, wy, role, teamId, animState = 0) {
    if (role === 'pitcher') {
        drawChibiPitcher(teamId, animState);
        return;
    }
    if (role === 'catcher') {
        drawChibiCatcher(teamId, animState);
        return;
    }
    if (role === 'batter') {
        drawChibiBatter(teamId, animState);
        return;
    }
    if (role === 'runner') {
        drawChibiRunner(wx, wy, teamId);
    }
}

function getSwingTimingWindows(modifiers = getDuelModifiers()) {
    const difficulty = getDifficultyProfile();
    const zoneMatch = pitchAnimState.userGuessZone === pitchAnimState.targetZone;
    const neutralRead = pitchAnimState.userGuessZone === 'center';
    const zoneMultiplier = zoneMatch ? 1.18 : neutralRead ? 0.9 : 0.58;
    const perfectWindow = modifiers.perfectWindow *
        (zoneMatch ? 1.12 : 0.9) *
        difficulty.perfectWindowScale;
    const goodWindow = Math.max(
        perfectWindow,
        modifiers.goodWindow * zoneMultiplier * difficulty.goodWindowScale
    );
    const targetRadius = Number.isFinite(pitchAnimState.targetRadius) ? pitchAnimState.targetRadius : 30;
    const timingRadius = Number.isFinite(pitchAnimState.timingRadius) ? pitchAnimState.timingRadius : 88;

    return {
        radiusDiff: timingRadius - targetRadius,
        perfectWindow,
        goodWindow,
        zoneMatch,
        neutralRead,
        difficulty: difficulty.key
    };
}

function classifySwingTiming(radiusDiff, windows) {
    if (Math.abs(radiusDiff) <= windows.perfectWindow) return 'Perfect';
    if (Math.abs(radiusDiff) <= windows.goodWindow) return 'Good';
    if (radiusDiff > windows.goodWindow && radiusDiff <= windows.goodWindow + 30) return 'Early';
    if (radiusDiff < -windows.perfectWindow && radiusDiff >= -(windows.goodWindow + 12)) return 'Late';
    return 'Miss';
}

function getBatterTimingPresentation(modifiers = null) {
    const startRadius = Number.isFinite(pitchAnimState.startRadius) ? pitchAnimState.startRadius : 88;
    const targetRadius = Number.isFinite(pitchAnimState.targetRadius) ? pitchAnimState.targetRadius : 30;
    const radiusSpan = Math.max(1, startRadius - targetRadius);
    const isActive = gameMode === 'batter' && pitchAnimState.active && !hitFlightState.active;

    if (!isActive) {
        return {
            ui: 'approach_rail',
            state: 'idle',
            call: '투구를 기다리세요',
            markerPercent: 0,
            goodStartPercent: 72,
            perfectStartPercent: 92,
            result: null,
            zoneMatch: false
        };
    }

    const windows = getSwingTimingWindows(modifiers || getDuelModifiers());
    const markerPercent = clamp((1 - (clamp(windows.radiusDiff, 0, radiusSpan) / radiusSpan)) * 100, 0, 100);
    const goodStartPercent = clamp((1 - (Math.min(windows.goodWindow, radiusSpan) / radiusSpan)) * 100, 0, 100);
    const perfectStartPercent = clamp((1 - (Math.min(windows.perfectWindow, radiusSpan) / radiusSpan)) * 100, 0, 100);
    const result = classifySwingTiming(windows.radiusDiff, windows);
    let state = 'wait';
    let call = '기다려';

    if (pitchAnimState.swingTriggered) {
        state = 'locked';
        call = '스윙 판정 중';
    } else if (result === 'Perfect') {
        state = 'just';
        call = '지금 스윙!';
    } else if (result === 'Good') {
        state = 'good';
        call = '스윙!';
    } else if (markerPercent >= Math.max(0, goodStartPercent - 16)) {
        state = 'ready';
        call = '준비…';
    }

    return {
        ui: 'approach_rail',
        state,
        call,
        markerPercent: Number(markerPercent.toFixed(2)),
        goodStartPercent: Number(goodStartPercent.toFixed(2)),
        perfectStartPercent: Number(perfectStartPercent.toFixed(2)),
        result,
        zoneMatch: windows.zoneMatch,
        radiusDiff: Number(windows.radiusDiff.toFixed(2)),
        goodWindow: Number(windows.goodWindow.toFixed(2)),
        perfectWindow: Number(windows.perfectWindow.toFixed(2))
    };
}

function updateBatterTimingUI(modifiers = null) {
    const consoleNode = document.getElementById('batter-timing-console');
    const track = document.getElementById('batter-timing-track');
    const call = document.getElementById('batter-timing-call');
    const hint = document.getElementById('batter-timing-hint');
    const swingButton = document.getElementById('btn-swing-bat');
    if (!consoleNode || !track || !call) return getBatterTimingPresentation(modifiers);

    const presentation = getBatterTimingPresentation(modifiers);
    consoleNode.dataset.timingState = presentation.state;
    call.textContent = presentation.call;
    track.style.setProperty('--timing-marker', `${presentation.markerPercent}%`);
    track.style.setProperty('--timing-good-start', `${presentation.goodStartPercent}%`);
    track.style.setProperty('--timing-perfect-start', `${presentation.perfectStartPercent}%`);
    track.setAttribute('aria-valuenow', String(Math.round(presentation.markerPercent)));
    track.setAttribute('aria-valuetext', presentation.call);
    if (hint) {
        hint.textContent = presentation.state === 'just'
            ? '초록 구간 · 최고 타이밍'
            : presentation.state === 'good'
                ? '노란 구간 · 안타 타이밍'
                : presentation.state === 'locked'
                    ? '스윙 결과를 계산하고 있습니다'
                    : '공이 노란·초록 구간에 들어오면 스윙';
    }
    if (swingButton) swingButton.dataset.timingState = presentation.state;
    return presentation;
}

function drawStrikeZoneOverlay() {
    const zone = CAMERA_LAYOUT.strikeZone;
    const left = zone.x - zone.width / 2;
    const top = zone.y - zone.height / 2;
    const cellW = zone.width / 3;
    const cellH = zone.height / 3;
    const selectedZone = gameMode === 'batter' ? pitchAnimState.userGuessZone : selectedPitchZone;
    const selectedCell = {
        up: [1, 0],
        left: [0, 1],
        center: [1, 1],
        right: [2, 1],
        down: [1, 2]
    }[selectedZone] || [1, 1];

    ctx.save();
    ctx.fillStyle = gameMode === 'batter' ? 'rgba(255, 228, 92, 0.28)' : 'rgba(88, 215, 255, 0.28)';
    ctx.fillRect(left + selectedCell[0] * cellW, top + selectedCell[1] * cellH, cellW, cellH);

    ctx.strokeStyle = 'rgba(255,255,255,0.48)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            ctx.strokeRect(left + c * cellW, top + r * cellH, cellW, cellH);
        }
    }

    ctx.shadowColor = gameMode === 'batter' ? '#ffe45c' : '#58d7ff';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(left, top, zone.width, zone.height);
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(7,19,31,0.78)';
    ctx.beginPath();
    ctx.roundRect(zone.x - 48, top - 25, 96, 18, 8);
    ctx.fill();
    ctx.fillStyle = gameMode === 'batter' ? '#ffe45c' : '#58d7ff';
    ctx.font = '900 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${gameMode === 'batter' ? 'READ' : 'AIM'} · ${ZONE_LABELS[selectedZone]}`, zone.x, top - 12);
    ctx.restore();
}

function drawArcadeSpeedLines() {
    if (!pitchAnimState.active) return;
    const progress = clamp(pitchAnimState.timer, 0, 1);
    if (progress < 0.22) return;

    const centerX = CAMERA_LAYOUT.strikeZone.x;
    const centerY = CAMERA_LAYOUT.strikeZone.y;
    const alpha = clamp((progress - 0.22) * 0.42, 0, 0.26);
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
        const angle = (Math.PI * 2 * i) / 18 + 0.09;
        const inner = 112 + (i % 3) * 17;
        const outer = inner + 70 + (i % 4) * 16;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner * 0.72);
        ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer * 0.72);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPitchShapeTrail(x, y, ballSize) {
    if (!pitchAnimState.active || hitFlightState.active) return;
    const flightPitchType = pitchAnimState.pitchType || selectedPitchType;
    ctx.save();
    ctx.lineCap = 'round';

    if (flightPitchType === 'fast') {
        ctx.strokeStyle = 'rgba(255, 107, 94, 0.72)';
        ctx.lineWidth = Math.max(2, ballSize * 0.45);
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 8, y - 14);
            ctx.lineTo(x + i * 11, y - 45 - Math.abs(i) * 8);
            ctx.stroke();
        }
    } else if (flightPitchType === 'slider') {
        ctx.strokeStyle = 'rgba(88, 215, 255, 0.76)';
        ctx.lineWidth = Math.max(3, ballSize * 0.52);
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 5);
        ctx.quadraticCurveTo(x - 54, y - 30, x - 20, y - 66);
        ctx.stroke();
    } else if (flightPitchType === 'curve') {
        ctx.strokeStyle = 'rgba(255, 111, 174, 0.74)';
        ctx.lineWidth = Math.max(3, ballSize * 0.52);
        ctx.beginPath();
        ctx.moveTo(x + 3, y - 5);
        ctx.bezierCurveTo(x + 46, y - 30, x - 32, y - 52, x - 5, y - 82);
        ctx.stroke();
    } else {
        ctx.fillStyle = 'rgba(255, 228, 92, 0.82)';
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(x, y - i * 13, Math.max(2, ballSize * (0.55 - i * 0.06)), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawArcadeImpactBurst(x, y) {
    if (!hitFlightState.active || hitFlightState.timer > 0.28) return;
    const strength = 1 - hitFlightState.timer / 0.28;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = `rgba(255, 228, 92, ${0.45 + strength * 0.5})`;
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const inner = 18 + (1 - strength) * 20;
        const outer = 54 + strength * 32;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.stroke();
    }
    ctx.rotate(-0.08);
    ctx.fillStyle = '#ffe45c';
    ctx.strokeStyle = '#10213a';
    ctx.lineWidth = 6;
    ctx.font = '950 31px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.strokeText('JUST IMPACT!', 0, -62);
    ctx.fillText('JUST IMPACT!', 0, -62);
    ctx.restore();
}

function drawBattedBallTrail() {
    const points = hitFlightState.trailPoints;
    if (!hitFlightState.active || !Array.isArray(points) || points.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < points.length; i++) {
        const alpha = i / points.length;
        ctx.strokeStyle = `rgba(22, 121, 184, ${0.08 + alpha * 0.6})`;
        ctx.lineWidth = 1.2 + alpha * 4;
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawHomeRunCallout() {
    hitFlightState.calloutVisible = false;
    if (!hitFlightState.active || hitFlightState.resultCode !== 'HOME_RUN' || hitFlightState.timer < 0.12) return;
    hitFlightState.calloutVisible = true;
    const pulse = 1 + Math.sin(hitFlightState.timer * Math.PI * 8) * 0.025;
    ctx.save();
    ctx.translate(CW / 2, 184);
    ctx.scale(pulse, pulse);
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#17324d';
    ctx.lineWidth = 9;
    ctx.font = '950 49px "Outfit", "Noto Sans KR", sans-serif';
    ctx.strokeText('HOME RUN!', 0, 0);
    ctx.fillStyle = '#f5b942';
    ctx.fillText('HOME RUN!', 0, 0);
    ctx.font = '900 16px "Noto Sans KR", sans-serif';
    ctx.lineWidth = 5;
    ctx.strokeText(`${hitFlightState.directionLabel} · ${hitFlightState.distanceM}m`, 0, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${hitFlightState.directionLabel} · ${hitFlightState.distanceM}m`, 0, 28);
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

    // 5. Draw All Fielders & Players (Depth-sorted order: Outfield -> Mound -> Bases -> Home Plate)
    const myTeam = gameState.myTeamId;
    const oppTeam = gameState.oppTeamId;
    const activePitcherTeam = (gameMode === 'batter') ? oppTeam : myTeam;
    const activeBatterTeam = (gameMode === 'batter') ? myTeam : oppTeam;

    // Pitcher is centered above the zone with a dedicated wind-up silhouette.
    const pitcherPose = pitchAnimState.active
        ? clamp(pitchAnimState.timer, 0, 1)
        : pitchMeterActive
            ? 0.28
            : 0.08;
    drawPlayerFigure(0, 0.55, 'pitcher', activePitcherTeam, pitcherPose);

    // Persistent base occupancy belongs to the separate situation HUD.
    // Keeping runner figures off the field prevents them from crossing the
    // catcher and strike zone. The steal cutscene can still draw its transient runner.

    // Catcher stays on the center line behind home and reacts toward the selected pitch cell.
    const catcherPose = pitchAnimState.active ? clamp(pitchAnimState.timer, 0, 1) : 0.08;
    drawPlayerFigure(0, 0.06, 'catcher', activePitcherTeam, catcherPose);

    const swingFrame = pitchAnimState.batterSwing;
    drawPlayerFigure(-0.22, 0.10, 'batter', activeBatterTeam, swingFrame);

    // Zone and timing UI remain above the catcher silhouette.
    drawStrikeZoneOverlay();
    drawArcadeSpeedLines();
    updateBatterTimingUI();

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

        drawBattedBallTrail();
        drawArcadeImpactBurst(bX, bY);
        drawPitchShapeTrail(bX, bY, bSize);

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
        if (gameMode === 'batter' && pitchAnimState.timingRadius !== undefined && !hitFlightState.active) {
            ctx.save();
            const cx = pitchAnimState.timingCenterX;
            const cy = pitchAnimState.timingCenterY;
            const tRadius = pitchAnimState.targetRadius;
            const cRadius = pitchAnimState.timingRadius;
            const timingCue = getBatterTimingPresentation();

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
            let circleColor = '#f59e0b';
            if (timingCue.state === 'just') circleColor = '#c9f05a';
            else if (timingCue.state === 'good') circleColor = '#ffe45c';
            else if (timingCue.state === 'ready') circleColor = '#58d7ff';

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
            ctx.fillStyle = timingCue.state === 'just'
                ? '#c9f05a'
                : timingCue.state === 'good'
                    ? '#ffe45c'
                    : 'rgba(255, 255, 255, 0.72)';
            ctx.fillText(timingCue.call, cx, cy + tRadius + 24);

            ctx.restore();
        }
    }
    drawHomeRunCallout();
}

// 6. Gameplay Pitching & Batting Cycle Logic
let simulationInterval = null;

function setInningLimit(limit, btn) {
    inningLimit = limit;
    const inningWord = limit === 1 ? 'INNING' : 'INNINGS';
    const lobbyFormat = document.getElementById('lobby-duel-format');
    const resultFormat = document.getElementById('result-duel-format');
    if (lobbyFormat) lobbyFormat.textContent = `RETRO CARD DUEL · ${limit} ${inningWord}`;
    if (resultFormat) resultFormat.textContent = `${limit} ${inningWord} COMPLETE`;
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

function showPitchSpeedGun(kinematics, pitchType, targetZone) {
    const gun = document.getElementById('speed-gun');
    if (!gun) return;
    const revealPitchCue = getDifficultyProfile().revealPitchCue;
    gun.style.display = 'block';
    document.getElementById('speed-gun-value').textContent = kinematics.speedKph;
    document.getElementById('speed-gun-type').textContent = revealPitchCue
        ? PITCH_LABELS[pitchType]
        : '판정 후 공개';
    document.getElementById('speed-gun-zone').textContent = revealPitchCue
        ? ZONE_LABELS[targetZone]
        : '공 궤적 읽기';
    pitchAnimState.cueRevealed = revealPitchCue;
    scheduleGameAction(
        () => { gun.style.display = 'none'; },
        kinematics.travelDurationMs + 650,
        'hide-speed-gun'
    );
}

function revealPitchSpeedGun() {
    const pitchType = pitchAnimState.pitchType;
    const targetZone = pitchAnimState.targetZone;
    if (!PITCH_LABELS[pitchType] || !ZONE_LABELS[targetZone]) return;
    const type = document.getElementById('speed-gun-type');
    const zone = document.getElementById('speed-gun-zone');
    if (type) type.textContent = PITCH_LABELS[pitchType];
    if (zone) zone.textContent = ZONE_LABELS[targetZone];
    pitchAnimState.cueRevealed = true;
}

function hideBattedBallHud() {
    const hud = document.getElementById('ball-distance-hud');
    if (!hud) return;
    hud.style.display = 'none';
    hud.classList.remove('home-run');
}

function updateBattedBallHud(profile, currentDistanceM = 0) {
    const hud = document.getElementById('ball-distance-hud');
    if (!hud || !profile) return;
    hud.style.display = 'flex';
    hud.classList.toggle('home-run', Boolean(profile.isHomeRun));
    document.getElementById('ball-flight-result').textContent = profile.resultLabel;
    document.getElementById('ball-flight-direction').textContent = profile.directionLabel;
    document.getElementById('ball-distance-value').textContent = Math.round(currentDistanceM);
    document.getElementById('ball-exit-velocity').textContent = profile.exitVelocityKph;
    document.getElementById('ball-launch-angle').textContent = profile.launchAngle;
}

function preparePitchFlight(pitchType, targetZone, modifiers = getDuelModifiers(), randomFn = Math.random) {
    const kinematics = getPitchKinematics(modifiers, pitchType, randomFn);
    Object.assign(pitchAnimState, {
        active: true,
        timer: 0,
        elapsedMs: 0,
        travelDurationMs: kinematics.travelDurationMs,
        speedKph: kinematics.speedKph,
        pitchType,
        ballSpeed: kinematics.speedKph,
        ballX: 0,
        ballY: 0.60,
        ballZ: 0.8,
        shadowX: 0,
        shadowY: 0.60,
	        batterSwing: 0,
	        swingTriggered: false,
	        cueRevealed: false,
	        targetZone,
        targetRadius: 30,
        baseTimingCenterX: CAMERA_LAYOUT.strikeZone.x,
        baseTimingCenterY: CAMERA_LAYOUT.strikeZone.y,
        timingCenterX: CAMERA_LAYOUT.strikeZone.x,
        timingCenterY: CAMERA_LAYOUT.strikeZone.y,
        startRadius: 88,
        timingRadius: 88
    });
    hitFlightState.active = false;
    hideBattedBallHud();
    showPitchSpeedGun(kinematics, pitchType, targetZone);
    playSound('pitch', kinematics);
    return kinematics;
}

function beginBattedBallFlight(profile) {
    pitchAnimState.active = false;
    document.getElementById('timing-verdict')?.classList.remove('visible');
    Object.assign(hitFlightState, {
        active: true,
        timer: 0,
        elapsedMs: 0,
        durationMs: profile.durationMs,
        ballX: 0,
        ballY: 0.15,
        ballZ: 0,
        shadowX: 0,
        shadowY: 0.15,
        targetX: profile.targetX,
        targetY: profile.targetY,
        maxZ: profile.maxZ,
        runBases: profile.runBases,
        resultCode: profile.resultCode,
        resultLabel: profile.resultLabel,
        directionKey: profile.directionKey,
        directionLabel: profile.directionLabel,
        distanceM: profile.distanceM,
        currentDistanceM: 0,
        exitVelocityKph: profile.exitVelocityKph,
        launchAngle: profile.launchAngle,
        trailPoints: [],
        calloutVisible: false
    });
    lastBattedBall = {
        ...profile,
        active: true,
        progress: 0,
        currentDistanceM: 0
    };
    const summary = document.getElementById('ball-flight-summary');
    if (summary) {
        summary.textContent =
            `${profile.resultLabel}, ${profile.directionLabel}, 비거리 ${profile.distanceM}미터, ` +
            `타구속도 ${profile.exitVelocityKph}킬로미터, 발사각 ${profile.launchAngle}도`;
    }
    updateBattedBallHud(profile, 0);
    playSound(profile.isHomeRun ? 'homeRun' : 'hit', profile);
}

function getActiveRoleForCurrentHalf() {
    if (simulationMode === 'full') {
        return halfInning === 'top' ? 'pitcher' : 'batter';
    }
    return requestedGameMode;
}

function getMatchupRoleForCurrentHalf() {
    return halfInning === 'top' ? 'pitcher' : 'batter';
}

function getCurrentCommandStage() {
    if (!gameActive) return 'result';
    if (pendingAutomaticSteal || stealAnimState.active) return 'steal_sequence';
    if (hitFlightState.active) return 'ball_in_play';
    if (pitchAnimState.active) return gameMode === 'batter' ? 'swing_timing' : 'pitch_in_flight';
    if (
        scheduledGameActions.some(action =>
            ['simulation-play', 'wait-for-steal-before-simulation'].includes(action.label)
        )
    ) {
        return 'simulation';
    }
    if (gameMode === 'pitcher') return pitchMeterActive ? 'release_timing' : 'select_pitch';
    return 'read_pitch';
}

function isManualPitchInputAllowed() {
    const simulationQueued = scheduledGameActions.some(action =>
        ['simulation-play', 'wait-for-steal-before-simulation'].includes(action.label)
    );
    return (
        gameActive &&
        gameMode === 'pitcher' &&
        isUserControlledHalf() &&
        !simulationQueued &&
        !pendingAutomaticSteal &&
        !stealAnimState.active &&
        !pitchAnimState.active &&
        !hitFlightState.active
    );
}

function applyGameModeControls(mode) {
    gameMode = mode;
    document.body.dataset.gameMode = mode;
    if (mode !== 'pitcher') {
        clearInterval(pitchMeterInterval);
        pitchMeterInterval = null;
        pitchMeterActive = false;
    }
    const batterControls = document.getElementById('batter-controls');
    const pitcherControls = document.getElementById('pitcher-controls');
    const pitchMeter = document.getElementById('pitch-meter-container');
    const absHud = document.getElementById('abs-hud');
    if (batterControls) batterControls.style.display = mode === 'batter' ? 'flex' : 'none';
    if (pitcherControls) pitcherControls.style.display = mode === 'pitcher' ? 'flex' : 'none';
    if (pitchMeter) pitchMeter.style.display = mode === 'pitcher' ? 'flex' : 'none';
    if (absHud) absHud.style.display = 'none';
}

function isUserControlledHalf() {
    if (simulationMode === 'full') return true;
    return (
        (requestedGameMode === 'batter' && halfInning === 'bottom') ||
        (requestedGameMode === 'pitcher' && halfInning === 'top')
    );
}

function startCurrentHalf() {
    const simOverlay = document.getElementById('simulation-overlay');
    applyGameModeControls(getActiveRoleForCurrentHalf());
    setupPlayersForAtBat(true);
    if (simulationMode === 'chance') {
        runSimulationLoop();
        return 'simulation';
    }
    if (isUserControlledHalf()) {
        if (simOverlay) simOverlay.style.display = 'none';
        if (gameMode === 'pitcher') startPitcherModeAction();
        else aiTriggerPitch();
        return 'manual';
    }
    runSimulationLoop();
    return 'simulation';
}

function startNewGame(mode) {
    ensureAudioRuntime();
    gameActive = true;
    requestedGameMode = mode;
    gameMode = mode;
    pitcherEnergyBySide = { my: 100, opp: 100 };
    pitchAccuracy = 0.75;
    pitchAccuracySource = 'neutral';
    currentInning = 1;
    halfInning = 'top';
    tiebreakerActive = false;
    pendingAutomaticSteal = false;
    stealAnimState.active = false;
    selectedPitchZone = 'center';
    pitchAnimState.userGuessZone = 'center';
    clearScheduledGameActions();
    activeMatchup = {
        batter: null,
        pitcher: null,
        pitcherEnergy: 100,
        pitchNumber: 0,
        lastTiming: 'READY',
        lastOutcome: mode === 'batter' ? '방향키로 코스를 읽고 Space로 스윙하세요.' : '구종과 로케이션을 고른 뒤 릴리즈하세요.',
        lastCardEffect: '선발 카드 능력치를 계산했습니다.'
    };
    document.body.dataset.gameMode = mode;
    document.getElementById('game-result-overlay')?.classList.remove('visible');
    updateZonePickerUI();
    
    // Chance mode keeps the requested role. Full mode switches between
    // pitching in the top half and batting in the bottom half.
    applyGameModeControls(getActiveRoleForCurrentHalf());

    // Reset scores & counts
    scores = { my: 0, opp: 0 };
    hits = { my: 0, opp: 0 };
    errors = { my: 0, opp: 0 };
    counts = { balls: 0, strikes: 0, outs: 0 };
    baseRunners = [false, false, false];
    pitchAnimState.active = false;
    pitchAnimState.timer = 0;
    pitchAnimState.elapsedMs = 0;
    pitchAnimState.swingTriggered = false;
    pitchAnimState.batterSwing = 0;
    hitFlightState.active = false;
    lastBattedBall = null;
    hideBattedBallHud();

    // Pop up Gameplay screen
    document.getElementById('match-setup-screen').style.display = 'none';
    document.getElementById('gameplay-arena-screen').style.display = 'block';
    window.scrollTo(0, 0);
    
    // Clear live commentary box
    const commBox = document.getElementById('widescreen-commentary-list');
    if (commBox) commBox.innerHTML = '';

    logCommentary(`⚾ KBO 정규 친선 매치가 시작됩니다! (설정: ${inningLimit}이닝, ${simulationMode === 'chance' ? '찬스 플레이' : '풀 플레이'})`);
    
    // Init canvas rendering
    canvas = document.getElementById('pitch-canvas');
    configureCanvasBackingStore(true);
    canvas.onclick = () => {
        canvas.focus({ preventScroll: true });
        if (!gameActive) return;
        if (gameMode === 'batter') {
            triggerUserSwing();
            return;
        }
        const releaseButton = document.getElementById('btn-release-pitch');
        if (releaseButton && !releaseButton.disabled) {
            releaseButton.dispatchEvent(new MouseEvent('mousedown'));
        }
    };
    initStadiumAssets();
    
    // Core game setup
    updateScoreboardUI();

    // Start gameloop ticking & immediate 30 FPS render interval
    if (animationFrameId) clearInterval(animationFrameId);
    animationFrameId = setInterval(() => tickGameDrawing(33), 33);
    drawStadium();

    // Hide simulation overlay on start so canvas is immediately visible
    const simOverlay = document.getElementById('simulation-overlay');
    if (simOverlay) simOverlay.style.display = 'none';

    // A full inning always starts with the opponent batting in the top half.
    if (gameMode === 'pitcher') {
        logCommentary('🛡️ 1회초 내 팀 수비 시작! 마운드에서 스트라이크를 던지세요.');
    } else {
        logCommentary('📡 1회초 상대 공격은 자동 중계한 뒤 1회말 타석으로 이어집니다.');
    }
    startCurrentHalf();
}

function tickGameDrawing(deltaMs = 33) {
    gameClockMs += deltaMs;
    runScheduledGameActions();
    if (!gameActive) return;

    // Steal animation runner progress
    if (stealAnimState.active) {
        updateStealAnimation(deltaMs);
    }

    // Flying Pitch Physics
    if (pitchAnimState.active) {
        updatePitchPhysics(deltaMs);
    }

    // Flying Hit Physics
    if (hitFlightState.active) {
        updateHitFlightPhysics(deltaMs);
    }

    drawStadium();
}

function updateHitFlightPhysics(deltaMs = 33) {
    hitFlightState.elapsedMs += deltaMs;
    const durationMs = Math.max(1, hitFlightState.durationMs || 1350);
    const t = clamp(hitFlightState.elapsedMs / durationMs, 0, 1);
    hitFlightState.timer = t;

    // Direction, hang time, and distance all come from the same batted-ball profile.
    const lateralProgress = Math.pow(t, 0.88);
    const lateralCurve = Math.sin(t * Math.PI) * hitFlightState.targetX * 0.1;
    pitchAnimState.ballY = 0.15 + ((hitFlightState.targetY - 0.15) * t);
    pitchAnimState.ballX = (hitFlightState.targetX * lateralProgress) + lateralCurve;
    pitchAnimState.ballZ = Math.pow(Math.sin(t * Math.PI), 0.82) * hitFlightState.maxZ;
    pitchAnimState.shadowX = pitchAnimState.ballX;
    pitchAnimState.shadowY = pitchAnimState.ballY;

    const distanceProgress = 1 - Math.pow(1 - t, 1.35);
    hitFlightState.currentDistanceM = hitFlightState.distanceM * distanceProgress;
    if (lastBattedBall) {
        lastBattedBall.active = t < 1;
        lastBattedBall.progress = Number(t.toFixed(3));
        lastBattedBall.currentDistanceM = Math.round(hitFlightState.currentDistanceM);
    }
    updateBattedBallHud(lastBattedBall || {
        ...hitFlightState,
        isHomeRun: hitFlightState.resultCode === 'HOME_RUN'
    }, hitFlightState.currentDistanceM);

    const projected = projectToCanvas(pitchAnimState.ballX, pitchAnimState.ballY);
    hitFlightState.trailPoints.push({
        x: projected.x,
        y: projected.y - (pitchAnimState.ballZ * 140 * projected.scale)
    });
    if (hitFlightState.trailPoints.length > 18) hitFlightState.trailPoints.shift();

    if (t >= 1) {
        hitFlightState.active = false;
        pitchAnimState.active = false;
        if (hitFlightState.resultCode === 'FLY_OUT') playSound('catch');
        if (hitFlightState.runBases > 0) {
            advanceRunners(hitFlightState.runBases);
        }
        if (finishWalkOffIfNeeded()) {
            hideBattedBallHud();
            return;
        }
        scheduleGameAction(hideBattedBallHud, 920, 'hide-batted-ball-hud');
        scheduleGameAction(nextAtBat, 980, 'next-at-bat-after-hit');
    }
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
function setupPlayersForAtBat(resetMatchup = false) {
    const oppTeam = KBO_TEAMS.find(t => t.id === gameState.oppTeamId);
    const matchupRole = getMatchupRoleForCurrentHalf();

    // Search active starters
    const myBatters = (gameState.lineup?.batting || [])
        .map(id => gameState.roster.find(card => card.id === id))
        .filter(Boolean);
    const myPitchers = [
        ...(gameState.lineup?.rotation || []),
        ...(gameState.lineup?.bullpen || []),
        gameState.lineup?.closer
    ].filter(Boolean).map(id => gameState.roster.find(card => card.id === id)).filter(Boolean);

    if (resetMatchup || !activeMatchup.batter || !activeMatchup.pitcher) {
        activeMatchup.batter = matchupRole === 'batter'
            ? (gameState.roster.find(c => c.id === gameState.startingLineup.batter) || myBatters[0])
            : generateOpponentCard('타자', oppTeam.id);

        activeMatchup.pitcher = matchupRole === 'batter'
            ? generateOpponentCard('투수', oppTeam.id)
            : (gameState.roster.find(c => c.id === gameState.startingLineup.pitcher) || myPitchers[0]);
    }
    syncActivePitcherEnergyFromSide();

    const activeBatter = activeMatchup.batter;
    const activePitcher = activeMatchup.pitcher;

    // Render cards to sidebar deck placeholders
    const liveBatCard = document.getElementById('live-batter-card-placeholder');
    const livePitCard = document.getElementById('live-pitcher-card-placeholder');
    if (liveBatCard) liveBatCard.innerHTML = renderCardHTML(activeBatter, false);
    if (livePitCard) livePitCard.innerHTML = renderCardHTML(activePitcher, false);

    // Update bottom controllers HUD
    if (gameMode === 'batter') {
        document.getElementById('batting-player-name').textContent = activeBatter.name;
        document.getElementById('batting-contact').textContent = getCardOvr(activeBatter);
        document.getElementById('batting-power').textContent = getCardStat(activeBatter, 'power');
        document.getElementById('opp-pitcher-name').textContent = activePitcher.name;
    } else {
        document.getElementById('pitching-player-name').textContent = activePitcher.name;
        document.getElementById('pitching-stuff').textContent = getCardOvr(activePitcher);
        document.getElementById('pitching-control').textContent = getCardStat(activePitcher, 'control');
    }

    updateDuelStatusUI();
}

function generateOpponentCard(pos, teamId) {
    const rosterList = TEAM_ROSTERS_RAW[teamId];
    const players = pos === '타자' ? rosterList.batters : rosterList.pitchers;
    const player = players[Math.floor(Math.random() * players.length)];
    return generateCard(teamId, pos, player, getDifficultyProfile().opponentTier);
}

function updateDuelStatusUI() {
    const batter = activeMatchup.batter;
    const pitcher = activeMatchup.pitcher;
    const modifiers = getDuelModifiers();
    const zoneMatch = pitchAnimState.userGuessZone === pitchAnimState.targetZone;

    const batterName = document.getElementById('duel-batter-name');
    const pitcherName = document.getElementById('duel-pitcher-name');
    const batterEffect = document.getElementById('duel-batter-effect');
    const pitcherEffect = document.getElementById('duel-pitcher-effect');
    const pitchNumber = document.getElementById('duel-pitch-number');
    const countdown = document.getElementById('duel-countdown');

    if (batterName) batterName.textContent = batter ? batter.name : '타자 준비';
    if (pitcherName) pitcherName.textContent = pitcher ? pitcher.name : '투수 준비';
    if (batterEffect) batterEffect.textContent = `CON ${modifiers.contact} · GOOD ±${modifiers.goodWindow.toFixed(1)}`;
    if (pitcherEffect) pitcherEffect.textContent = `VEL ${modifiers.velocity} · ENERGY ${Math.round(activeMatchup.pitcherEnergy)}`;
    if (pitchNumber) pitchNumber.textContent = `PITCH ${String(Math.max(1, activeMatchup.pitchNumber)).padStart(2, '0')}`;
    if (countdown) {
        countdown.textContent = pitchAnimState.active
            ? getDifficultyProfile().revealPitchCue || pitchAnimState.cueRevealed
                ? `${ZONE_LABELS[pitchAnimState.targetZone]} · ${zoneMatch ? 'READ' : 'TRACK'}`
                : '공 궤적 추적 · 타이밍 집중'
            : `${getDifficultyProfile().label.toUpperCase()} · ${PITCH_LABELS[selectedPitchType].toUpperCase()}`;
    }

    const effectToast = document.getElementById('card-effect-toast');
    if (effectToast) effectToast.textContent = activeMatchup.lastCardEffect;
    updateBatterTimingUI(modifiers);
}

function showTimingVerdict(label, detail, tone = 'good') {
    activeMatchup.lastTiming = label.toUpperCase();
    const verdict = document.getElementById('timing-verdict');
    if (!verdict) return;
    verdict.className = `timing-verdict visible ${tone}`;
    verdict.querySelector('.verdict-label').textContent = label.toUpperCase();
    verdict.querySelector('small').textContent = detail;
    scheduleGameAction(() => verdict.classList.remove('visible'), 760, 'hide-timing-verdict');
}

function showCardEffect(message) {
    activeMatchup.lastCardEffect = message;
    const effectToast = document.getElementById('card-effect-toast');
    if (effectToast) effectToast.textContent = message;
    updateDuelStatusUI();
}

function updateGameSituationUI() {
    const baseLabels = ['1루', '2루', '3루'];
    const occupiedLabels = [];

    document.querySelectorAll('[data-base-index]').forEach(chip => {
        const baseIndex = Number(chip.dataset.baseIndex);
        if (!Number.isInteger(baseIndex) || baseIndex < 0 || baseIndex >= baseRunners.length) return;
        const occupied = Boolean(baseRunners[baseIndex]);
        chip.classList.toggle('occupied', occupied);
        chip.dataset.occupied = String(occupied);
        chip.setAttribute('aria-label', `${baseLabels[baseIndex]} ${occupied ? '주자 있음' : '비어 있음'}`);
        if (occupied) occupiedLabels.push(baseLabels[baseIndex]);
    });

    const runnerSummary = document.getElementById('base-runner-summary');
    const summaryText = occupiedLabels.length > 0
        ? occupiedLabels.join(' · ')
        : '주자 없음';
    if (runnerSummary) {
        runnerSummary.textContent = summaryText;
    }
    document.getElementById('base-runner-status')
        ?.setAttribute('aria-label', `그래픽 베이스 주자 점유 · ${summaryText}`);
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
    updateLineScoreboardUI();
    updateGameSituationUI();
}

function updateLineScoreboardUI() {
    const idx = Math.min(Math.max(currentInning - 1, 0), 8);
    if (halfInning === 'top' && inningScores.away[idx] === null) {
        inningScores.away[idx] = 0;
    }
    if (halfInning === 'bottom' && inningScores.home[idx] === null) {
        inningScores.home[idx] = 0;
    }

    const awayEmblem = document.getElementById('ls-away-emblem');
    const awayName = document.getElementById('ls-away-name');
    const homeEmblem = document.getElementById('ls-home-emblem');
    const homeName = document.getElementById('ls-home-name');
    if (awayEmblem && typeof oppTeam !== 'undefined') awayEmblem.textContent = oppTeam?.emblem || '🦁';
    if (awayName && typeof oppTeam !== 'undefined') awayName.textContent = oppTeam?.name || '원정';
    if (homeEmblem && typeof myTeam !== 'undefined') homeEmblem.textContent = myTeam?.emblem || '🐯';
    if (homeName && typeof myTeam !== 'undefined') homeName.textContent = myTeam?.name || '홈';

    for (let i = 1; i <= 9; i++) {
        const awayCell = document.getElementById(`ls-a-${i}`);
        const homeCell = document.getElementById(`ls-h-${i}`);
        const inIdx = i - 1;

        if (awayCell) {
            const val = inningScores.away[inIdx];
            awayCell.textContent = val !== null ? val : '-';
            awayCell.classList.toggle('current-inning', i === currentInning && halfInning === 'top');
        }
        if (homeCell) {
            const val = inningScores.home[inIdx];
            homeCell.textContent = val !== null ? val : '-';
            homeCell.classList.toggle('current-inning', i === currentInning && halfInning === 'bottom');
        }
    }

    const awayR = document.getElementById('ls-away-r');
    const homeR = document.getElementById('ls-home-r');
    if (awayR) awayR.textContent = scores.opp;
    if (homeR) homeR.textContent = scores.my;

    const awayH = document.getElementById('ls-away-h');
    const homeH = document.getElementById('ls-home-h');
    if (awayH) awayH.textContent = hits.opp;
    if (homeH) homeH.textContent = hits.my;

    const awayE = document.getElementById('ls-away-e');
    const homeE = document.getElementById('ls-home-e');
    if (awayE) awayE.textContent = errors.opp;
    if (homeE) homeE.textContent = errors.my;

    const diffBadge = document.getElementById('live-score-diff-text');
    if (diffBadge) {
        const diff = scores.my - scores.opp;
        const myName = typeof myTeam !== 'undefined' ? myTeam?.name || '우리팀' : '우리팀';
        const oppNameText = typeof oppTeam !== 'undefined' ? oppTeam?.name || '상대팀' : '상대팀';
        if (diff > 0) {
            diffBadge.textContent = `${myName} ${diff}점 차 리드 中 🔥`;
            diffBadge.className = 'live-score-diff-badge lead';
        } else if (diff < 0) {
            diffBadge.textContent = `${oppNameText} ${Math.abs(diff)}점 차 우세 ⚡`;
            diffBadge.className = 'live-score-diff-badge chase';
        } else {
            diffBadge.textContent = `${scores.my} : ${scores.opp} 동점 (TIE) ⚖️`;
            diffBadge.className = 'live-score-diff-badge tie';
        }
    }
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
let pitchAccuracySource = 'neutral';
let pitchMeterInterval = null;
let pitchMeterPos = 0;
let pitchMeterDir = 1;

// Setup Pitcher release meter
const runner = document.getElementById('pitch-meter-runner');
if (runner) {
    document.getElementById('btn-release-pitch').addEventListener('mousedown', () => {
        if (!isManualPitchInputAllowed() || !pitchMeterActive) return;
        // Stop meter and calculate accuracy
        clearInterval(pitchMeterInterval);
        pitchMeterActive = false;
        const control = getDuelModifiers().control;
        const sweetWidth = clamp(8 + ((control - 60) * 0.22), 8, 20) *
            getDifficultyProfile().releaseWindowScale;
        const sweetMin = 50 - (sweetWidth / 2);
        const sweetMax = 50 + (sweetWidth / 2);
        if (pitchMeterPos >= sweetMin && pitchMeterPos <= sweetMax) {
            pitchAccuracy = 1.0; // Perfect release!
            playSound('release', { accuracy: pitchAccuracy });
            logCommentary('☄️ PERFECT RELEASE! 최고의 실투 없는 제구입니다.');
            showTimingVerdict('Perfect', `제구 ${control} · 릴리즈 보너스`, 'perfect');
        } else {
            const dev = Math.abs(pitchMeterPos - 50);
            pitchAccuracy = Math.max(0.3, 1.0 - (dev * 0.02));
            logCommentary(`GOOD RELEASE! 제구가 안정적입니다. (정확도: ${Math.round(pitchAccuracy*100)}%)`);
            showTimingVerdict('Release', `정확도 ${Math.round(pitchAccuracy * 100)}%`, 'good');
        }
        pitchAccuracySource = 'user';
        
        triggerUserPitchThrow();
    });
}

function updatePitchMeterStep(deltaMs = 20) {
    if (!pitchMeterActive) return;
    pitchMeterPos += pitchMeterDir * (deltaMs / 20);
    if (pitchMeterPos >= 100) {
        pitchMeterPos = 100;
        pitchMeterDir = -Math.abs(pitchMeterDir);
    } else if (pitchMeterPos <= 0) {
        pitchMeterPos = 0;
        pitchMeterDir = Math.abs(pitchMeterDir);
    }
    const runnerEl = document.getElementById('pitch-meter-runner');
    if (runnerEl) runnerEl.style.left = `${pitchMeterPos}%`;
}

function updatePitchEnergyLabels() {
    ['fast', 'slider', 'curve', 'fork'].forEach((type, index) => {
        const label = document.querySelector(`[data-pitch="${type}"] small`);
        if (label) label.textContent = `${index + 1} · EN -${Math.round(getPitchEnergyCost(type))}`;
    });
}

function syncPitchTypeButtons() {
    document.querySelectorAll('[data-pitch]').forEach(button => {
        button.classList.toggle('active', button.dataset.pitch === selectedPitchType);
    });
}

function startPitcherModeAction() {
    // Reset release gauge
    pitchMeterPos = 0;
    pitchMeterDir = 2.5 * getDifficultyProfile().releaseSpeedScale;
    pitchMeterActive = true;
    const releaseButton = document.getElementById('btn-release-pitch');
    if (releaseButton) releaseButton.disabled = false;
    
    clearInterval(pitchMeterInterval);
    if (!manualTimeMode) pitchMeterInterval = setInterval(() => updatePitchMeterStep(20), 20);

    const control = getDuelModifiers().control;
    const sweetWidth = clamp(8 + ((control - 60) * 0.22), 8, 20) *
        getDifficultyProfile().releaseWindowScale;
    const sweetSpot = document.querySelector('.meter-sweet-spot');
    if (sweetSpot) {
        sweetSpot.style.left = `${50 - (sweetWidth / 2)}%`;
        sweetSpot.style.width = `${sweetWidth}%`;
    }
    updatePitchEnergyLabels();
    syncPitchTypeButtons();

    // Pitch types toggling
    const pBtns = ['pitch-btn-fast', 'pitch-btn-slider', 'pitch-btn-curve', 'pitch-btn-fork'];
    pBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                if (!isManualPitchInputAllowed()) return;
                pBtns.forEach(b => {
                    const el = document.getElementById(b);
                    if (el) el.classList.remove('active');
                });
                btn.classList.add('active');
                selectedPitchType = btn.dataset.pitch;
                showCardEffect(`${PITCH_LABELS[selectedPitchType]} 선택 · ENERGY -${getPitchEnergyCost(selectedPitchType)}`);
            };
        }
    });

    updateZonePickerUI();
    updateDuelStatusUI();
}

function triggerUserPitchThrow() {
    if (!isManualPitchInputAllowed()) return false;
    document.getElementById('btn-release-pitch').disabled = true;
    pitchMeterActive = false;
    activeMatchup.pitchNumber++;
    spendActivePitcherEnergy(getPitchEnergyCost(selectedPitchType));

    const modifiers = getDuelModifiers();
    const kinematics = preparePitchFlight(selectedPitchType, selectedPitchZone, modifiers);
    showCardEffect(
        `${activeMatchup.pitcher.name} · ${PITCH_LABELS[selectedPitchType]} ${ZONE_LABELS[selectedPitchZone]} · ` +
        `${kinematics.speedKph}km/h / ENERGY ${Math.round(activeMatchup.pitcherEnergy)}`
    );

    // Faster pitches reach the AI decision point earlier because display and physics share one duration.
    scheduleGameAction(aiTriggerSwing, Math.round(kinematics.travelDurationMs * 0.6), 'ai-swing');
    return true;
}

function updatePitchPhysics(deltaMs = 33) {
    const modifiers = getDuelModifiers();
    pitchAnimState.elapsedMs += deltaMs;
    const progress = clamp(
        pitchAnimState.elapsedMs / Math.max(1, pitchAnimState.travelDurationMs || 1320),
        0,
        1
    );
    pitchAnimState.timer = progress;

    if (progress >= 1.0) {
        pitchAnimState.active = false;
        // ONLY evaluate take/strike if user did NOT swing!
        if (!pitchAnimState.swingTriggered && !hitFlightState.active) {
            evaluatePitchResult();
        }
        return;
    }

    const flightPitchType = pitchAnimState.pitchType || selectedPitchType;

    // Ball moves from pitcher wy=0.5 to home plate wy=0.22
    pitchAnimState.ballY = 0.60 - (progress * 0.45); // Pitch travels from 0.60 down to 0.15
    pitchAnimState.shadowY = pitchAnimState.ballY;

    // Break horizontal arcs based on pitchType (smaller arcs to stay inside zone)
    const zoneX = pitchAnimState.targetZone === 'left' ? -0.055 : pitchAnimState.targetZone === 'right' ? 0.055 : 0;
    const zoneZ = pitchAnimState.targetZone === 'up' ? 0.13 : pitchAnimState.targetZone === 'down' ? -0.13 : 0;
    let horizBreak = 0;
    if (flightPitchType === 'slider') horizBreak = Math.sin(progress * Math.PI) * 0.03 * modifiers.breakScale;
    else if (flightPitchType === 'curve') horizBreak = Math.sin(progress * Math.PI) * 0.04 * modifiers.breakScale;

    pitchAnimState.ballX = (zoneX * progress) + horizBreak;
    pitchAnimState.shadowX = pitchAnimState.ballX;

    // Ball flight height arch (Z)
    if (flightPitchType === 'fork') {
        // Forkball dips down sharply at the plate
        pitchAnimState.ballZ = 0.8 * (1 - progress) + (progress < 0.7 ? 0.3 * Math.sin(progress * Math.PI) : -0.15) + (zoneZ * progress);
    } else {
        pitchAnimState.ballZ = 0.7 * (1 - progress) + 0.3 * Math.sin(progress * Math.PI) + (zoneZ * progress);
    }

    // Reach the sweet spot shortly before the plate, then visibly pass it so
    // both early/pull and late/opposite-field timing are reachable.
    const sweetSpotProgress = 0.9;
    const approachProgress = clamp(progress / sweetSpotProgress, 0, 1);
    let shrinkProgress = approachProgress;
    if (flightPitchType === 'fast') shrinkProgress = Math.pow(approachProgress, 1.8);
    else if (flightPitchType === 'curve') shrinkProgress = Math.pow(approachProgress, 0.6);
    else if (flightPitchType === 'fork') shrinkProgress = Math.pow(approachProgress, 1.2);
    if (progress > sweetSpotProgress) {
        const lateProgress = (progress - sweetSpotProgress) / (1 - sweetSpotProgress);
        shrinkProgress = 1 + (lateProgress * 0.5);
    }

    pitchAnimState.timingRadius = pitchAnimState.startRadius - (pitchAnimState.startRadius - pitchAnimState.targetRadius) * shrinkProgress;

    const visualZoneX = pitchAnimState.targetZone === 'left'
        ? -(CAMERA_LAYOUT.strikeZone.width / 3)
        : pitchAnimState.targetZone === 'right'
            ? CAMERA_LAYOUT.strikeZone.width / 3
            : 0;
    const visualZoneY = pitchAnimState.targetZone === 'up'
        ? -(CAMERA_LAYOUT.strikeZone.height / 3)
        : pitchAnimState.targetZone === 'down'
            ? CAMERA_LAYOUT.strikeZone.height / 3
            : 0;
    const visualBreak = flightPitchType === 'slider'
        ? Math.sin(progress * Math.PI) * 26 * modifiers.breakScale
        : flightPitchType === 'curve'
            ? Math.sin(progress * Math.PI) * 18 * modifiers.breakScale
            : 0;
    const visualDrop = flightPitchType === 'fork' && progress > 0.72
        ? (progress - 0.72) * 95 * modifiers.breakScale
        : 0;
    pitchAnimState.timingCenterX = pitchAnimState.baseTimingCenterX + (visualZoneX * progress) + visualBreak;
    pitchAnimState.timingCenterY = pitchAnimState.baseTimingCenterY + (visualZoneY * progress) + visualDrop;
    updateDuelStatusUI();
}

function updateZonePickerUI() {
    document.querySelectorAll('[data-bat-zone]').forEach(button => {
        button.classList.toggle('active', button.dataset.batZone === pitchAnimState.userGuessZone);
    });
    document.querySelectorAll('[data-pitch-zone]').forEach(button => {
        button.classList.toggle('active', button.dataset.pitchZone === selectedPitchZone);
    });
    updateGameSituationUI();
}

function selectBatterZone(zone) {
    if (!ZONE_LABELS[zone]) return;
    pitchAnimState.userGuessZone = zone;
    updateZonePickerUI();
    if (gameActive && gameMode === 'batter') {
        showCardEffect(`${activeMatchup.batter.name} 코스 리드 · ${ZONE_LABELS[zone]}`);
    }
}

function selectPitcherZone(zone) {
    if (!ZONE_LABELS[zone]) return;
    selectedPitchZone = zone;
    updateZonePickerUI();
    if (gameActive && gameMode === 'pitcher') {
        showCardEffect(`${activeMatchup.pitcher.name} 로케이션 · ${ZONE_LABELS[zone]}`);
    }
}

function zoneFromArrowCode(code) {
    return {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
    }[code] || null;
}

async function toggleGameFullscreen() {
    const target = document.querySelector('.game-container');
    if (!document.fullscreenElement) {
        await target?.requestFullscreen?.();
    } else {
        await document.exitFullscreen?.();
    }
}

// User Batter & Pitcher hitting/pitching triggers via Keyboard
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
        e.preventDefault();
        toggleGameFullscreen();
        return;
    }

    if (!gameActive) {
        if (e.code === 'KeyB') startNewGame('batter');
        if (e.code === 'KeyP' || e.code === 'KeyA') startNewGame('pitcher');
        return;
    }

    const zone = zoneFromArrowCode(e.code);
    if (zone) {
        e.preventDefault();
        if (gameMode === 'batter') selectBatterZone(zone);
        else if (isManualPitchInputAllowed()) selectPitcherZone(zone);
    }

    if (gameMode === 'batter' && (e.code === 'Space' || e.code === 'Enter')) {
        // Prevent default spacebar scrolling
        e.preventDefault();
        triggerUserSwing();
    } else if (gameMode === 'pitcher') {
        // Space to release pitch
        if (
            (e.code === 'Space' || e.code === 'Enter') &&
            isManualPitchInputAllowed() &&
            document.getElementById('btn-release-pitch') &&
            !document.getElementById('btn-release-pitch').disabled
        ) {
            e.preventDefault();
            document.getElementById('btn-release-pitch').dispatchEvent(new MouseEvent('mousedown'));
        }
        // 1,2,3,4 for Pitch types
        if (isManualPitchInputAllowed()) {
            if (e.code === 'Digit1') document.getElementById('pitch-btn-fast')?.click();
            if (e.code === 'Digit2') document.getElementById('pitch-btn-slider')?.click();
            if (e.code === 'Digit3') document.getElementById('pitch-btn-curve')?.click();
            if (e.code === 'Digit4') document.getElementById('pitch-btn-fork')?.click();
        }
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

    const modifiers = getDuelModifiers();
    // The timing rail, canvas cue, and swing result share one dynamic window contract.
    const timingWindows = getSwingTimingWindows(modifiers);
    const timingResult = classifySwingTiming(timingWindows.radiusDiff, timingWindows);

    const verdictTone = timingResult === 'Perfect' ? 'perfect' : timingResult === 'Good' ? 'good' : 'miss';
    showTimingVerdict(
        timingResult,
        `${timingWindows.zoneMatch ? '코스 적중' : '코스 불일치'} · CON ${modifiers.contact}`,
        verdictTone
    );
    showCardEffect(
        `${activeMatchup.batter.name} · 컨택 ${modifiers.contact}로 GOOD 판정폭 ±${timingWindows.goodWindow.toFixed(1)}`
    );

    evaluateSwingHit(timingResult);
}

function getAiPitchAccuracy(pitcher = activeMatchup.pitcher, randomFn = Math.random) {
    const control = clamp(getCardStat(pitcher, 'control'), 40, 110);
    const releaseRoll = clamp(Number(randomFn()) || 0, 0, 0.9999);
    return Number(clamp(
        0.58 +
            ((control - 60) * 0.006) +
            ((releaseRoll - 0.5) * 0.22) +
            getDifficultyProfile().aiAccuracyBonus,
        0.38,
        0.96
    ).toFixed(3));
}

function aiTriggerPitch() {
    // Show active player updates
    setupPlayersForAtBat();
    updateScoreboardUI();

    // AI pitches after a short, deterministic game-clock delay.
    scheduleGameAction(() => {
        const pitchTypes = ['fast', 'slider', 'curve', 'fork'];
        selectedPitchType = pitchTypes[Math.floor(Math.random() * pitchTypes.length)];
        syncPitchTypeButtons();
        const zones = ['up', 'down', 'left', 'right', 'center'];
        const targetZone = zones[Math.floor(Math.random() * zones.length)];
        pitchAccuracy = getAiPitchAccuracy(activeMatchup.pitcher);
        pitchAccuracySource = 'ai';
        activeMatchup.pitchNumber++;
        spendActivePitcherEnergy(getPitchEnergyCost(selectedPitchType));

        activeMatchup.lastOutcome = '투구 진행 중';

        const modifiers = getDuelModifiers();
        const kinematics = preparePitchFlight(selectedPitchType, targetZone, modifiers);
        if (getDifficultyProfile().revealPitchCue) {
            logCommentary(`⚾ ${PITCH_LABELS[selectedPitchType]} ${ZONE_LABELS[pitchAnimState.targetZone]}! 코스를 읽으세요.`);
            showCardEffect(
                `${activeMatchup.pitcher.name} · ${PITCH_LABELS[selectedPitchType]} · ` +
                `${kinematics.speedKph}km/h · 구위 ${modifiers.stuff} / ENERGY ${Math.round(activeMatchup.pitcherEnergy)}`
            );
        } else {
            logCommentary('⚾ 투구 시작! 공 궤적을 읽고 타이밍을 잡으세요.');
            showCardEffect(
                `${activeMatchup.pitcher.name} · ${kinematics.speedKph}km/h · ` +
                `구위 ${modifiers.stuff} / ENERGY ${Math.round(activeMatchup.pitcherEnergy)}`
            );
        }
    }, 720, 'ai-pitch');
}

function aiTriggerSwing() {
    if (pitchAnimState.swingTriggered) return;
    const modifiers = getDuelModifiers();
    const cornerPenalty = pitchAnimState.targetZone === 'center' ? 0 : 0.12;
    const swingProb = clamp(
        0.72 + ((modifiers.discipline - 70) * 0.003) - cornerPenalty,
        0.38,
        0.86
    );
    if (Math.random() < swingProb) {
        pitchAnimState.swingTriggered = true;
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

        const contactChance = clamp(
            0.52
                + ((modifiers.contact - modifiers.stuff) * 0.008)
                - ((pitchAccuracy - 0.5) * 0.22)
                - cornerPenalty
                - modifiers.fieldingContactPenalty,
            0.16,
            0.78
        );
        const timing = Math.random() < contactChance ? 'Good' : 'Miss';
        showTimingVerdict(
            timing,
            timing === 'Good' ? '타자가 코스를 따라왔습니다.' : '구위로 배트를 이겼습니다.',
            timing === 'Good' ? 'good' : 'miss'
        );
        evaluateSwingHit(timing);
    } else {
        // AI takes
        pitchAnimState.swingTriggered = false;
        activeMatchup.lastTiming = 'TAKE';
        showTimingVerdict('Take', `${ZONE_LABELS[pitchAnimState.targetZone]} 로케이션 관찰`, 'good');
    }
}

// 8. Hitting / ABS Referee Evaluation
function evaluateSwingHit(timing) {
    if (timing === 'Take') return;

    const modifiers = getDuelModifiers();
    revealPitchSpeedGun();

    if (['Perfect', 'Good', 'Early', 'Late'].includes(timing)) {
        // Resolve the physical contact metrics first. The result is derived from
        // exit velocity, launch angle, and distance instead of being preselected.
        const timingWindows = getSwingTimingWindows(modifiers);
        const zoneQuality = gameMode === 'batter'
            ? timingWindows.zoneMatch
                ? 1
                : timingWindows.neutralRead
                    ? 0.72
                    : 0.45
            : 0.82;
        const profile = createResolvedBattedBallProfile(
            timing,
            { ...modifiers, zoneQuality }
        );
        beginBattedBallFlight(profile);

        if (profile.resultCode === 'HOME_RUN') {
            addHitForCurrentSide();
            activeMatchup.lastOutcome = 'HOME RUN';
            logCommentary(
                `☄️ HOME RUN! ${profile.directionLabel} ${profile.distanceM}m · ` +
                `타구속도 ${profile.exitVelocityKph}km/h · 발사각 ${profile.launchAngle}°`
            );
            showCardEffect(
                `${activeMatchup.batter.name} · ${timing.toUpperCase()} 배럴 타구가 ${profile.directionLabel} 홈런으로 연결`
            );
            counts.balls = 0;
            counts.strikes = 0;
        } else if (profile.resultCode === 'DOUBLE' || profile.resultCode === 'SINGLE') {
            addHitForCurrentSide();
            activeMatchup.lastOutcome = profile.resultCode;
            logCommentary(
                `${profile.resultCode === 'DOUBLE' ? '깡! 2루타' : '딱! 안타'} · ${profile.directionLabel} · ` +
                `${profile.distanceM}m · ${profile.exitVelocityKph}km/h · 발사각 ${profile.launchAngle}°`
            );
            showCardEffect(
                `${activeMatchup.batter.name} · ${profile.directionLabel} ${profile.resultLabel} / 타구 질 ${profile.contactQuality}`
            );
            counts.balls = 0;
            counts.strikes = 0;
        } else if (profile.resultCode === 'FOUL') {
            logCommentary(
                `파울! ${profile.directionLabel} 바깥쪽 ${profile.distanceM}m · ` +
                `${profile.exitVelocityKph}km/h`
            );
            if (counts.strikes < 2) counts.strikes++;
            activeMatchup.lastOutcome = 'FOUL';
            showCardEffect(`${timing.toUpperCase()} 타이밍 · ${profile.directionLabel} 파울`);
        } else {
            logCommentary(
                `${profile.resultLabel} · ${profile.directionLabel} · 발사각 ${profile.launchAngle}° · ` +
                `${profile.distanceM}m`
            );
            counts.outs++;
            counts.balls = 0;
            counts.strikes = 0;
            activeMatchup.lastOutcome = profile.resultCode.replace('_', ' ');
            showCardEffect(
                `${activeMatchup.pitcher.name} · 구위 ${modifiers.stuff}와 수비가 ` +
                `${Math.round(profile.fieldingOutThreshold * 100)}% 아웃 압박을 만듦`
            );
        }
    } else {
        // Swing and Miss
        pitchAnimState.active = false;
        hideBattedBallHud();
        playSound('strike');
        logCommentary('헛스윙 스트라이크! 너무 일찍 휘둘렀습니다! (Strike)');
        counts.strikes++;
        if (counts.strikes >= 3) {
            logCommentary('삼진 아웃!! 타이밍을 완전히 뺏겼습니다.');
            counts.outs++;
            counts.balls = 0;
            counts.strikes = 0;
        }
        activeMatchup.lastOutcome = 'SWING MISS';
        showCardEffect(`${activeMatchup.pitcher.name} · 구위 ${modifiers.stuff}가 컨택 ${modifiers.contact}를 제압`);
        scheduleGameAction(nextAtBat, 820, 'next-at-bat-after-miss');
    }

    updateScoreboardUI();
    updateDuelStatusUI();
}

function evaluatePitchResult() {
    revealPitchSpeedGun();
    const modifiers = getDuelModifiers();
    const edgePenalty = pitchAnimState.targetZone === 'center' ? 0 : 0.08;
    const isStrike = Math.random() < clamp(modifiers.strikeChance - edgePenalty, 0.42, 0.92);
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
        activeMatchup.lastOutcome = 'CALLED STRIKE';
        showCardEffect(
            `${activeMatchup.pitcher.name} · 제구 ${modifiers.control} / 스트라이크 확률 ${Math.round((modifiers.strikeChance - edgePenalty) * 100)}%`
        );
    } else {
        playSound('ball');
        logCommentary('볼! ABS 판독: 바깥쪽으로 한참 빠졌습니다.');
        counts.balls++;
        if (counts.balls >= 4) {
            logCommentary('사구(볼넷) 출루! (Walk)');
            advanceWalkRunners();
            counts.balls = 0;
            counts.strikes = 0;
        }
        activeMatchup.lastOutcome = 'BALL';
        showCardEffect(`${ZONE_LABELS[pitchAnimState.targetZone]} 공략 실패 · ENERGY ${Math.round(activeMatchup.pitcherEnergy)}`);
    }
    
    updateScoreboardUI();
    if (finishWalkOffIfNeeded()) return;
    scheduleGameAction(nextAtBat, 820, 'next-at-bat-after-take');
}

// 9. Base Runner Advancing & Automatic Steals
let stealAnimState = {
    active: false,
    progress: 0,
    runnerX: 0.24, // starts on 1B
    runnerY: 0.51,
    runnerSpeed: 70,
    catcherThrowing: 70,
    matchupSide: 'user_batting'
};

function addRunsForCurrentSide(runs) {
    if (runs <= 0) return;
    if (halfInning === 'bottom') scores.my += runs;
    else scores.opp += runs;
    logCommentary(`득점 성공! +${runs}점 득점`);
    playSound('applause');
}

function addHitForCurrentSide() {
    if (halfInning === 'bottom') hits.my++;
    else hits.opp++;
}

function finishWalkOffIfNeeded() {
    if (
        !gameActive ||
        halfInning !== 'bottom' ||
        currentInning < inningLimit ||
        scores.my <= scores.opp
    ) {
        return false;
    }
    logCommentary('🏆 끝내기 득점! 홈 팀이 즉시 경기를 마무리합니다.');
    return triggerGameOver();
}

function maybeScheduleAutomaticSteal(randomFn = Math.random) {
    if (
        pendingAutomaticSteal ||
        stealAnimState.active ||
        !baseRunners[0] ||
        baseRunners[1] ||
        randomFn() >= 0.28
    ) {
        return false;
    }
    pendingAutomaticSteal = true;
    scheduleGameAction(() => {
        pendingAutomaticSteal = false;
        if (baseRunners[0] && !baseRunners[1]) triggerAutomaticSteal();
    }, 780, 'automatic-steal');
    return true;
}

function advanceWalkRunners(randomFn = Math.random) {
    let runs = 0;
    if (baseRunners[0]) {
        if (baseRunners[1]) {
            if (baseRunners[2]) runs++;
            baseRunners[2] = true;
        }
        baseRunners[1] = true;
    }
    baseRunners[0] = true;
    addRunsForCurrentSide(runs);
    maybeScheduleAutomaticSteal(randomFn);
    updateGameSituationUI();
    return runs;
}

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
            addRunsForCurrentSide(runs);
        }
    }

    // Auto Steal Trigger probability: runner on 1B, 2B is vacant
    maybeScheduleAutomaticSteal();

    updateGameSituationUI();
}

function triggerAutomaticSteal() {
    pendingAutomaticSteal = false;
    if (!baseRunners[0] || baseRunners[1]) return;
    logCommentary('⚡ 도루 시도!! 주자가 다음 베이스로 뛰기 시작합니다!');
    
    // Zoom in cutscene banner
    const cut = document.getElementById('steal-cutscene');
    if (cut) {
        cut.classList.add('active');
        document.getElementById('steal-cutscene-text').textContent = '주자 2루 도루 시도 중! ⚡';
        scheduleGameAction(() => cut.classList.remove('active'), 1500, 'hide-steal-cutscene');
    }

    // Start drawing sliding runner animation
    const stealProfile = getSimulationProfile();
    stealAnimState.active = true;
    stealAnimState.progress = 0;
    stealAnimState.runnerSpeed = stealProfile.offense.speed;
    stealAnimState.catcherThrowing = stealProfile.defense.throwing;
    stealAnimState.matchupSide = stealProfile.side;
}

function updateStealAnimation(deltaMs = 33) {
    stealAnimState.progress += Math.max(0, deltaMs) / 2200;
    
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
        // Resolve from the batting and fielding sides captured when the play began.
        const speed = stealAnimState.runnerSpeed;
        const throwing = stealAnimState.catcherThrowing;
        const successChance = clamp(
            0.36 + (speed * 0.005) - ((throwing - 70) * 0.003),
            0.42,
            0.9
        );
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
    if (pendingAutomaticSteal || stealAnimState.active) {
        scheduleGameAction(runSimulationLoop, 120, 'wait-for-steal-before-simulation');
        return;
    }
    
    // Check if we need to intervene
    if (simulationMode === 'chance' && isUserControlledHalf()) {
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
    const simulationStatus = document.getElementById('simulation-status-text');
    if (simulationStatus) {
        simulationStatus.textContent = halfInning === 'bottom'
            ? '내 팀 공격을 시뮬레이션하는 중...'
            : '상대 팀 공격을 시뮬레이션하는 중...';
    }
    if (gameMode === 'pitcher') {
        clearInterval(pitchMeterInterval);
        pitchMeterInterval = null;
        pitchMeterActive = false;
        const releaseButton = document.getElementById('btn-release-pitch');
        if (releaseButton) releaseButton.disabled = true;
    }
    document.getElementById('simulation-overlay').style.display = 'flex';
    scheduleGameAction(() => {
        simulateOnePlay();
        updateScoreboardUI();
        if (finishWalkOffIfNeeded()) {
            document.getElementById('simulation-overlay').style.display = 'none';
            return;
        }
        
        if (counts.outs >= 3) {
            document.getElementById('simulation-overlay').style.display = 'none';
            handleHalfInningChange();
        } else {
            runSimulationLoop(); // Continue sim
        }
    }, 520, 'simulation-play');
}

function averageCardStats(cards, keys, fallback = 70) {
    if (!cards.length) return Object.fromEntries(keys.map(key => [key, fallback]));
    return Object.fromEntries(keys.map(key => [
        key,
        cards.reduce((sum, card) => sum + getCardStat(card, key, fallback), 0) / cards.length
    ]));
}

function getUserLineupBalanceProfile() {
    const lineup = gameState.lineup || {};
    const byIds = ids => (ids || [])
        .map(id => gameState.roster.find(card => card.id === id))
        .filter(Boolean);
    const batters = byIds(lineup.batting);
    const pitchers = byIds([...(lineup.rotation || []), ...(lineup.bullpen || []), lineup.closer]);
    return {
        offense: averageCardStats(batters, ['contact', 'power', 'speed']),
        defense: {
            ...averageCardStats(pitchers, ['stuff', 'control', 'velocity', 'stamina']),
            defense: averageCardStat([...batters, ...pitchers], 'defense'),
            throwing: averageCardStat(batters, 'throwing')
        }
    };
}

function getOpponentTeamBalanceProfile(teamId = gameState.oppTeamId) {
    const base = 69 + ((stableHash(teamId) % 5) - 2);
    return {
        offense: {
            contact: base + ((stableHash(`${teamId}|contact`) % 5) - 2),
            power: base + ((stableHash(`${teamId}|power`) % 5) - 2),
            speed: base + ((stableHash(`${teamId}|speed`) % 5) - 2)
        },
        defense: {
            stuff: base + ((stableHash(`${teamId}|stuff`) % 5) - 2),
            control: base + ((stableHash(`${teamId}|control`) % 5) - 2),
            velocity: base + ((stableHash(`${teamId}|velocity`) % 5) - 2),
            stamina: base + ((stableHash(`${teamId}|stamina`) % 5) - 2),
            defense: base + ((stableHash(`${teamId}|defense`) % 5) - 2),
            throwing: base + ((stableHash(`${teamId}|throwing`) % 5) - 2)
        }
    };
}

function buildSimulationProbabilities(offense, defense) {
    const staminaDelta = Number(defense.stamina ?? 70) - 70;
    const velocityDelta = Number(defense.velocity ?? 70) - 70;
    const fieldingDelta = ((Number(defense.defense ?? 70) + Number(defense.throwing ?? 70)) / 2) - 70;
    const effectiveStuff = Number(defense.stuff ?? 70) + (staminaDelta * 0.12) + (velocityDelta * 0.08);
    const effectiveControl = Number(defense.control ?? 70) + (staminaDelta * 0.08);
    const contactDelta = Number(offense.contact ?? 70) - effectiveStuff;
    const powerDelta = Number(offense.power ?? 70) - effectiveStuff;
    const eyeDelta = Number(offense.speed ?? 70) - effectiveControl;
    const raw = {
        single: clamp(0.12 + (contactDelta * 0.0022) - (fieldingDelta * 0.0006), 0.035, 0.26),
        double: clamp(0.03 + (powerDelta * 0.0011) - (fieldingDelta * 0.0003), 0.008, 0.10),
        homeRun: clamp(0.02 + (powerDelta * 0.0009), 0.004, 0.09),
        walk: clamp(0.05 + (eyeDelta * 0.0011), 0.018, 0.11),
        strikeout: clamp(
            0.28 - (contactDelta * 0.0023) + (staminaDelta * 0.0008) + (velocityDelta * 0.0008),
            0.10,
            0.46
        )
    };
    raw.groundout = Math.max(0.08, 1 - Object.values(raw).reduce((sum, value) => sum + value, 0));
    const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value / total]));
}

function getSimulationProfile() {
    const user = getUserLineupBalanceProfile();
    const opponent = getOpponentTeamBalanceProfile();
    const userBatting = halfInning === 'bottom';
    const offense = userBatting ? user.offense : opponent.offense;
    const defense = userBatting ? opponent.defense : user.defense;
    return {
        side: userBatting ? 'user_batting' : 'opponent_batting',
        offense,
        defense,
        probabilities: buildSimulationProbabilities(offense, defense)
    };
}

function resolveSimulationOutcome(probabilities, roll) {
    let cumulative = 0;
    for (const key of ['single', 'double', 'homeRun', 'walk', 'strikeout', 'groundout']) {
        cumulative += probabilities[key] || 0;
        if (roll < cumulative) return key;
    }
    return 'groundout';
}

function simulateOnePlay(randomRoll = Math.random()) {
    const profile = getSimulationProfile();
    const outcome = resolveSimulationOutcome(profile.probabilities, randomRoll);
    if (outcome === 'single') {
        logCommentary('[중계] 타구가 펜스를 때리는 깨끗한 안타! (Single)');
        addHitForCurrentSide();
        advanceRunners(1);
    } else if (outcome === 'double') {
        logCommentary('[중계] 우중간 완전히 가르는 2루타! (Double)');
        addHitForCurrentSide();
        advanceRunners(2);
    } else if (outcome === 'homeRun') {
        logCommentary('☄️ [중계] 큰 타구!! 넘어갔습니다! 솔로 홈런!! (Home Run)');
        addHitForCurrentSide();
        advanceRunners(4);
    } else if (outcome === 'walk') {
        logCommentary('[중계] 볼넷을 잘 골라 1루로 출루합니다. (Walk)');
        advanceWalkRunners();
    } else if (outcome === 'strikeout') {
        logCommentary('[중계] 삼진 아웃! 배트가 허공을 가릅니다. (Strikeout)');
        counts.outs++;
    } else {
        logCommentary('[중계] 유격수 정면 땅볼 아웃. (Groundout)');
        counts.outs++;
    }
    return { outcome, profile };
}

function nextAtBat() {
    if (pendingAutomaticSteal || stealAnimState.active) {
        scheduleGameAction(nextAtBat, 120, 'wait-for-steal-before-next-at-bat');
        return;
    }
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
        if (currentInning >= inningLimit && scores.my > scores.opp) {
            logCommentary('🏁 홈 팀 리드로 마지막 회말 공격 없이 경기를 종료합니다.');
            triggerGameOver();
            updateScoreboardUI();
            return;
        }
        halfInning = 'bottom';
        if (tiebreakerActive) baseRunners = [false, true, false];
        logCommentary('🧹 공수 교대! 내 팀 공격이 시작됩니다.');
        startCurrentHalf();
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
            startCurrentHalf();
        }
    }
    updateScoreboardUI();
}

// Tiebreaker shootout: short-form runner-on-second finish.
function triggerTiebreakerShootout() {
    logCommentary('⚡ 동점 상황 연장전! 무사 2루 승부치기에 돌입합니다!');
    tiebreakerActive = true;
    baseRunners = [false, true, false];
    currentInning++;
    halfInning = 'top';
    startCurrentHalf();
    updateScoreboardUI();
}

function triggerGameOver() {
    if (!gameActive) return false;
    gameActive = false;
    tiebreakerActive = false;
    pitchMeterActive = false;
    clearScheduledGameActions();
    clearInterval(animationFrameId);
    clearInterval(pitchMeterInterval);
    animationFrameId = null;
    pitchMeterInterval = null;
    const isWin = scores.my > scores.opp;
    const finalMsg = isWin 
        ? `🏆 승리!! 경기 종료! (최종 스코어: ${scores.my} 대 ${scores.opp})`
        : `😭 패배... 경기 종료! (최종 스코어: ${scores.my} 대 ${scores.opp})`;

    activeMatchup.lastOutcome = isWin ? 'WIN' : 'LOSS';
    const resultOverlay = document.getElementById('game-result-overlay');
    const resultTitle = document.getElementById('game-result-title');
    const resultScore = document.getElementById('game-result-score');
    const resultSummary = document.getElementById('game-result-summary');
    if (resultTitle) resultTitle.textContent = isWin ? '카드 듀얼 승리' : '카드 듀얼 패배';
    if (resultScore) resultScore.textContent = `${scores.my} : ${scores.opp}`;
    if (resultSummary) {
        resultSummary.textContent = `${activeMatchup.batter?.name || '타자'} vs ${activeMatchup.pitcher?.name || '투수'} · ${finalMsg}`;
    }
    resultOverlay?.classList.add('visible');
    awardMatchRewards(isWin);
    updateDuelStatusUI();
    return true;
}

function replayLastMode() {
    document.getElementById('game-result-overlay')?.classList.remove('visible');
    startNewGame(gameMode);
}

function returnToDuelLobby() {
    document.getElementById('game-result-overlay')?.classList.remove('visible');
    document.getElementById('match-setup-screen').style.display = 'block';
    document.getElementById('gameplay-arena-screen').style.display = 'none';
    renderDuelDraft();
}

function awardMatchRewards(isWin) {
    const rewardMultiplier = getDifficultyProfile().rewardMultiplier;
    const goldEarned = Math.round((isWin ? 1000 : 400) * rewardMultiplier);
    const expEarned = Math.round((isWin ? 50 : 25) * rewardMultiplier);
    
    gameState.gold += goldEarned;
    logCommentary(`🪙 매치 보상 획득: +${goldEarned} P P!`);

    // Full active lineup grows in auto and manual games; duel representatives get full EXP.
    const activeIds = new Set(getActiveLineupIds());
    gameState.roster.forEach(c => {
        if (activeIds.has(c.id)) {
            const isDuelRepresentative = gameState.startingLineup.batter === c.id || gameState.startingLineup.pitcher === c.id;
            c.exp += isDuelRepresentative ? expEarned : Math.ceil(expEarned * 0.5);
            while (c.expLevel < 10 && c.exp >= c.expLevel * 100) {
                c.exp -= c.expLevel * 100;
                c.expLevel++;
                c.bonusPoints += 5;
                logCommentary(`🎉 [${c.name}] 선수 트레이닝 레벨 업! (Lv.${c.expLevel})`);
            }
            if (c.expLevel >= 10) c.exp = 0;
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
    renderLineupSummary();
}

function getLineupCard(id) {
    return gameState.roster.find(card => card.id === id) || null;
}

function renderLineupSlot(card, label) {
    if (!card) {
        return `<div class="lineup-slot empty"><span class="slot-label">${label}</span><strong>미편성</strong></div>`;
    }
    const team = KBO_TEAMS.find(item => item.id === card.teamId);
    return `
        <button class="lineup-slot" type="button" data-lineup-card-id="${card.id}" onclick="selectCardForUpgrade('${card.id}')">
            <span class="slot-label">${label}</span>
            <strong>${card.name}</strong>
            <span>${team?.short || 'KBO'} · OVR ${getCardOvr(card)}</span>
        </button>
    `;
}

function renderLineupSummary() {
    const container = document.getElementById('lineup-summary');
    if (!container) return;
    const lineup = gameState.lineup || { batting: [], rotation: [], bullpen: [], closer: null };
    const deck = getTeamDeckStatus();
    const progress = Math.min(100, (deck.count / deck.maxThreshold) * 100);
    const nextText = deck.nextThreshold
        ? `다음 +${deck.bonus + 1}: ${deck.nextThreshold - deck.count}명 남음`
        : '최대 팀덱 보너스 달성';
    const battingSlots = LINEUP_SLOT_ORDER.map((slot, index) =>
        renderLineupSlot(getLineupCard(lineup.batting[index]), `${index + 1}번 · ${slot}`)
    ).join('');
    const rotation = (lineup.rotation || []).map((id, index) =>
        renderLineupSlot(getLineupCard(id), `SP${index + 1}`)
    ).join('');
    const bullpen = (lineup.bullpen || []).map((id, index) =>
        renderLineupSlot(getLineupCard(id), `RP${index + 1}`)
    ).join('');

    container.innerHTML = `
        <div class="lineup-summary-head">
            <div>
                <span class="lineup-kicker">ACTIVE LINEUP · 18</span>
                <h4>2026 시즌 엔트리</h4>
            </div>
            <div class="deck-synergy-card">
                <span>TEAM DECK</span>
                <strong>${deck.count}/18 · 전 능력 +${deck.bonus}</strong>
                <small>${nextText}</small>
                <div class="synergy-meter"><i style="width:${progress}%"></i></div>
            </div>
        </div>
        <div class="lineup-group">
            <div class="lineup-group-title"><strong>BATTER ORDER</strong><span>${deck.batterCount}/9 동일 구단</span></div>
            <div class="lineup-slot-grid batting-lineup">${battingSlots}</div>
        </div>
        <div class="lineup-group">
            <div class="lineup-group-title"><strong>PITCHER STAFF</strong><span>${deck.pitcherCount}/9 동일 구단</span></div>
            <div class="lineup-slot-grid pitching-lineup">
                ${rotation}
                ${bullpen}
                ${renderLineupSlot(getLineupCard(lineup.closer), 'CP')}
            </div>
        </div>
    `;
}

function renderCardHTML(c, isSelected) {
    const ovr = getCardOvr(c);
    const tierName = { legend: 'LGD', hero: 'HERO', special: 'SPC', normal: 'LIVE' }[c.tier];
    const team = KBO_TEAMS.find(t => t.id === c.teamId) || { emblem: '⚾', color: '#64748b', short: 'KBO' };
    const avatarRole = c.pos === '타자' ? 'batter' : 'pitcher';
    const isStarter = isCardInActiveLineup(c);
    const roleLabel = c.pos === '타자' ? c.lineupSlot : c.pitchRole;
    const synthesisBlockReason = getSynthesisBlockReason(c);

    let clickHandler = `selectCardForUpgrade('${c.id}')`;
    let checkHTML = '';

    if (activeUpgradeTab === 'synthesis') {
        const isSynthSelected = synthSelectedIds.includes(c.id);
        clickHandler = `toggleSynthSelection('${c.id}')`;
        checkHTML = `<div class="synth-checkbox ${isSynthSelected ? 'selected' : ''} ${synthesisBlockReason ? 'blocked' : ''}">${isSynthSelected ? '✓' : (synthesisBlockReason ? '×' : '')}</div>`;
    }

    return `
        <div class="player-card tier-${c.tier} ${isSelected ? 'selected' : ''} ${synthesisBlockReason && activeUpgradeTab === 'synthesis' ? 'synthesis-blocked' : ''}" data-card-id="${c.id}" data-template-id="${c.templateId}" style="--team-color: ${team.color};" onclick="${clickHandler}">
            ${checkHTML}
            <span class="card-grade-badge">${tierName}</span>
            <span class="card-team-emblem">${team.emblem}</span>
            <span class="card-enh">${c.level > 0 ? `+${c.level}` : ''}</span>
            <span class="card-backno">No.${c.backNo}</span>
            ${isStarter ? '<span class="card-starter-badge">엔트리</span>' : ''}
            ${c.locked ? '<span class="card-lock-badge" aria-label="잠금">🔒</span>' : ''}
            
            <div class="card-avatar-img">
                <span class="pixel-ui-sprite pixel-ui-sprite-${avatarRole}" aria-hidden="true"></span>
            </div>
            <span class="card-holo-overlay" aria-hidden="true"></span>
            <div class="card-name">${c.name}</div>
            <div class="card-bottom-row">
                <span class="card-pos">${roleLabel || c.pos} · ${team.short}</span>
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
    renderRosterList();
    renderUpgradePanel();
}

function sanitizeSynthesisSelection() {
    const validRosterIds = new Set(gameState.roster.map(card => card.id));
    synthSelectedIds = synthSelectedIds.filter((id, index, ids) =>
        validRosterIds.has(id) && ids.indexOf(id) === index
    );
}

function toggleSynthSelection(cardId) {
    const idx = synthSelectedIds.indexOf(cardId);
    if (idx !== -1) {
        synthSelectedIds.splice(idx, 1);
        renderRosterList();
        renderUpgradePanel();
        return true;
    }

    const card = gameState.roster.find(candidate => candidate.id === cardId);
    const blockReason = getSynthesisBlockReason(card);
    if (blockReason) {
        alert(blockReason);
        return false;
    }
    if (synthSelectedIds.length >= 3) {
        alert('조합 카드는 최대 3장만 선택 가능합니다.');
        return false;
    }
    synthSelectedIds.push(cardId);
    renderRosterList();
    renderUpgradePanel();
    return true;
}

function getSynthesisBlockReason(card) {
    if (!card) return '카드를 찾을 수 없습니다.';
    if (card.locked) return '잠금 카드는 조합할 수 없습니다. 카드 관리에서 잠금을 해제하세요.';
    if (isCardInActiveLineup(card)) return '활성 라인업 카드는 조합할 수 없습니다.';
    const copies = gameState.roster.filter(candidate => candidate.templateId === card.templateId).length;
    if (synthSelectedIds.includes(card.id)) return '';
    const alreadySelectedCopies = synthSelectedIds
        .map(id => gameState.roster.find(candidate => candidate.id === id))
        .filter(candidate => candidate?.templateId === card.templateId)
        .length;
    if (copies - alreadySelectedCopies <= 1) return '마지막 1장은 보존됩니다. 같은 선수 카드를 한 장 더 획득하세요.';
    return '';
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
    const isStarter = isCardInActiveLineup(card);

    let bodyHTML = '';

    if (activeUpgradeTab === 'enhance') {
        const enhanceContract = getEnhanceContract(card.level);
        const isMax = !enhanceContract;
        const goldCost = enhanceContract?.cost || 0;
        const rate = enhanceContract?.rate || 0;

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
                    ? `<button class="btn btn-starter-remove" onclick="removeStarter('${card.id}')">엔트리 교체</button>`
                    : `<button class="btn btn-starter-set" onclick="setStarter('${card.id}')">엔트리 등록</button>`
                }
                <button class="btn btn-secondary" onclick="toggleCardLock('${card.id}')">${card.locked ? '🔓 잠금 해제' : '🔒 카드 잠금'}</button>
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
            const trainedTotal = stats[key] + (alloc[key] || 0);
            const total = getCardStat(card, key);
            const allocateBtn = card.bonusPoints > 0 && trainedTotal < 99
                ? `<button class="btn-allocate" onclick="allocateStatPoint('${card.id}', '${key}')">+</button>`
                : '';
            statsHTML += `
                <div class="train-stat-row">
                    <span class="stat-name">${labels[key]}</span>
                    <div class="stat-values">
                        <span class="stat-val">${total}</span>
                        <span class="text-muted">(기본 ${stats[key]} + 훈련 ${alloc[key] || 0} + 실전 보너스)</span>
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
                    <div style="background:#3b82f6; height:100%; width:${clamp((card.exp / (card.expLevel * 100)) * 100, 0, 100)}%;"></div>
                </div>
                <div>${statsHTML}</div>
            </div>
        `;
    }
    else if (activeUpgradeTab === 'skills') {
        const proposal = pendingSkillRerolls.get(card.id);
        const currentSkills = card.skills.map(skill => `
            <li><strong>${skill}</strong><span>Lv.${getSkillLevel(card)} · ${describeSkillEffect(skill)}</span></li>
        `).join('');
        const proposalSkills = proposal?.map(skill => `
            <li><strong>${skill}</strong><span>Lv.${getSkillLevel(card)} · ${describeSkillEffect(skill)}</span></li>
        `).join('');
        bodyHTML = `
            <div class="skill-management">
                <h3>보유 고유 스킬 · 실전 적용 중</h3>
                <p class="text-secondary">강화 +3 / +5 / +7 / +9에서 스킬 레벨도 함께 오릅니다.</p>
                <div class="skill-compare ${proposal ? 'has-proposal' : ''}">
                    <section>
                        <span class="skill-state-label">KEEP · 현재</span>
                        <ul>${currentSkills}</ul>
                    </section>
                    ${proposal ? `
                        <section>
                            <span class="skill-state-label">REPLACE · 후보</span>
                            <ul>${proposalSkills}</ul>
                        </section>
                    ` : ''}
                </div>
                ${proposal ? `
                    <div class="skill-reroll-actions">
                        <button class="btn btn-secondary" onclick="resolveSkillTicket('${card.id}', false)">현재 스킬 유지</button>
                        <button class="btn btn-primary" onclick="resolveSkillTicket('${card.id}', true)">후보로 교체 (🪙 500 P)</button>
                    </div>
                ` : `<button class="btn btn-primary" onclick="useSkillTicket('${card.id}')">변경 후보 확인 (교체 시 🪙 500 P)</button>`}
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
    sanitizeSynthesisSelection();
    const selectedCards = synthSelectedIds
        .map(id => gameState.roster.find(card => card.id === id))
        .filter(Boolean);
    const odds = selectedCards.length === 3 ? getSynthesisOdds(selectedCards) : null;
    let slotsHTML = '';
    for (let i = 0; i < 3; i++) {
        const id = synthSelectedIds[i];
        if (id) {
            const card = gameState.roster.find(c => c.id === id);
            if (!card) continue;
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
            <div class="synthesis-contract">
                <strong>조합 보호 규칙</strong>
                <span>엔트리·잠금·마지막 1장은 재료로 사용할 수 없습니다.</span>
                <span>결과 등급은 가장 높은 재료보다 내려가지 않습니다.</span>
                ${odds ? `<b>${formatTierOdds(odds)}</b>` : '<b>재료 3장을 선택하면 실제 확률이 표시됩니다.</b>'}
            </div>
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

function getEnhanceContract(level) {
    const normalizedLevel = Number(level);
    if (!Number.isInteger(normalizedLevel) || normalizedLevel < 0 || normalizedLevel >= 10) return null;
    return {
        cost: 500 + (normalizedLevel * 250),
        rate: ENHANCE_SUCCESS_RATES[normalizedLevel]
    };
}

function attemptEnhance(id, cost, rate) {
    const card = gameState.roster.find(c => c.id === id);
    const contract = card ? getEnhanceContract(card.level) : null;
    const suppliedCost = Number(cost);
    const suppliedRate = Number(rate);
    if (
        !card
        || !contract
        || !Number.isFinite(suppliedCost)
        || !Number.isFinite(suppliedRate)
        || suppliedCost !== contract.cost
        || suppliedRate !== contract.rate
    ) return false;

    if (gameState.gold < contract.cost) {
        alert('보유 골드 포인트가 부족합니다.');
        return false;
    }

    gameState.gold -= contract.cost;
    
    if (Math.random() * 100 <= contract.rate) {
        card.level = Math.min(10, card.level + 1);
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
    return true;
}

function allocateStatPoint(id, key) {
    const card = gameState.roster.find(c => c.id === id);
    const trainedTotal = card ? Number(card.baseStats?.[key] || 0) + Number(card.allocatedStats?.[key] || 0) : 99;
    if (card && card.bonusPoints > 0 && trainedTotal < 99) {
        card.bonusPoints--;
        card.allocatedStats[key] = (card.allocatedStats[key] || 0) + 1;
        saveGameData();
        renderRosterList();
        renderUpgradePanel();
    }
}

function describeSkillEffect(skillName) {
    const effect = SKILL_EFFECTS[skillName] || {};
    const labels = {
        contact: '컨택', power: '파워', speed: '주력',
        stuff: '구위', control: '제구', velocity: '구속', stamina: '체력'
    };
    const stats = Object.entries(effect)
        .filter(([key, value]) => labels[key] && typeof value === 'number')
        .map(([key, value]) => `${labels[key]} +${value}/Lv`);
    if (effect.starterOnly) stats.push('선발 전용');
    if (effect.bullpenOnly) stats.push('불펜 전용');
    if (effect.closerOnly) stats.push('마무리 전용');
    if (effect.clutch) stats.push('득점권/종반 발동');
    return stats.join(' · ');
}

function buildUniqueSkillReroll(skillPool, count, currentSkills = [], randomFn = Math.random) {
    const newSkills = [];
    let guard = 0;
    while (newSkills.length < count && guard < 30) {
        const sName = skillPool[Math.floor(randomFn() * skillPool.length)];
        if (!newSkills.includes(sName)) newSkills.push(sName);
        guard++;
    }
    for (const skill of skillPool) {
        if (newSkills.length >= count) break;
        if (!newSkills.includes(skill)) newSkills.push(skill);
    }
    const currentSkillSet = new Set(currentSkills);
    const sameEffectiveSet = (
        newSkills.length === currentSkills.length &&
        newSkills.every(skill => currentSkillSet.has(skill))
    );
    if (sameEffectiveSet) {
        for (let index = 0; index < newSkills.length; index++) {
            const usedByOtherSlots = new Set(newSkills.filter((_, skillIndex) => skillIndex !== index));
            const replacement = skillPool.find(skill =>
                skill !== newSkills[index] && !usedByOtherSlots.has(skill)
            );
            if (replacement) {
                newSkills[index] = replacement;
                break;
            }
        }
    }
    return newSkills;
}

function useSkillTicket(id) {
    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;
    const skillPool = card.pos === '타자' ? BATTER_SKILLS : PITCHER_SKILLS;
    const newSkills = buildUniqueSkillReroll(skillPool, card.skills.length, card.skills);
    pendingSkillRerolls.set(id, newSkills);
    renderUpgradePanel();
}

function resolveSkillTicket(id, accept) {
    const card = gameState.roster.find(candidate => candidate.id === id);
    const proposal = pendingSkillRerolls.get(id);
    if (!card || !proposal) return;
    if (!accept) {
        pendingSkillRerolls.delete(id);
        renderUpgradePanel();
        return;
    }
    if (gameState.gold < 500) {
        alert('골드가 부족합니다.');
        return;
    }
    gameState.gold -= 500;
    card.skills = [...proposal];
    pendingSkillRerolls.delete(id);
    playSound('hit');
    alert(`스킬 교체 완료! 새로운 스킬: [${card.skills.join(', ')}]`);
    saveGameData();
    updateSidebarUI();
    renderUpgradePanel();
}

function getSynthesisOdds(cards) {
    const highestIndex = Math.max(...cards.map(card => Math.max(0, TIER_ORDER.indexOf(card.tier))));
    const floorTier = TIER_ORDER[highestIndex];
    if (floorTier === 'legend') return { legend: 1 };
    if (floorTier === 'hero') return { hero: 0.65, legend: 0.35 };
    if (floorTier === 'special') return { special: 0.65, hero: 0.30, legend: 0.05 };
    return { normal: 0.75, special: 0.25 };
}

function formatTierOdds(odds) {
    return TIER_ORDER
        .filter(tier => odds[tier])
        .map(tier => `${TIER_CONFIG[tier].label} ${Math.round(odds[tier] * 100)}%`)
        .join(' · ');
}

function rollTierFromOdds(odds, roll = Math.random()) {
    let cumulative = 0;
    for (const tier of TIER_ORDER) {
        cumulative += odds[tier] || 0;
        if (roll < cumulative) return tier;
    }
    return TIER_ORDER.findLast(tier => odds[tier]) || 'normal';
}

function runSynthesisAction() {
    sanitizeSynthesisSelection();
    if (synthSelectedIds.length !== 3) return;
    const subCards = synthSelectedIds.map(id => gameState.roster.find(c => c.id === id));
    if (subCards.some(card => !card || card.locked || isCardInActiveLineup(card))) {
        alert('조합할 수 없는 카드가 포함되어 있습니다.');
        return;
    }
    const selectedByTemplate = subCards.reduce((map, card) => {
        map.set(card.templateId, (map.get(card.templateId) || 0) + 1);
        return map;
    }, new Map());
    for (const [templateId, selectedCount] of selectedByTemplate) {
        const ownedCount = gameState.roster.filter(card => card.templateId === templateId).length;
        if (ownedCount - selectedCount < 1) {
            alert('선수별 마지막 1장은 반드시 남겨야 합니다.');
            return;
        }
    }

    const odds = getSynthesisOdds(subCards);
    const outputTier = rollTierFromOdds(odds);
    gameState.roster = gameState.roster.filter(c => !synthSelectedIds.includes(c.id));

    // Pick a random team and player name
    const teamId = KBO_TEAMS[Math.floor(Math.random() * KBO_TEAMS.length)].id;
    const isBat = Math.random() > 0.5;
    const rosterList = TEAM_ROSTERS_RAW[teamId];
    const nameList = isBat ? rosterList.batters : rosterList.pitchers;
    const player = nameList[Math.floor(Math.random() * nameList.length)];

    const newCard = generateCard(teamId, isBat ? '타자' : '투수', player, outputTier);
    gameState.roster.push(newCard);
    playSound('applause');
    alert(`🎉 조합 성공!! 새로운 선수 [${newCard.name}] (${TIER_CONFIG[newCard.tier].label}) 선수를 영입했습니다!`);

    synthSelectedIds = [];
    selectedUpgradeCardId = newCard.id;
    activeUpgradeTab = 'enhance';

    saveGameData();
    updateSidebarUI();
    renderRosterList();
    renderUpgradePanel();
}

function registerCardToLineup(card) {
    if (!card) return false;
    if (card.pos === '타자') {
        const slotIndex = LINEUP_SLOT_ORDER.indexOf(card.lineupSlot);
        if (slotIndex < 0) return false;
        gameState.lineup.batting[slotIndex] = card.id;
        gameState.startingLineup.batter = card.id;
    } else {
        const key = card.pitchRole === 'SP' ? 'rotation' : card.pitchRole === 'RP' ? 'bullpen' : 'closer';
        if (key === 'closer') {
            gameState.lineup.closer = card.id;
        } else {
            const current = gameState.lineup[key] || [];
            if (!current.includes(card.id)) {
                const replacementIndex = current
                    .map(id => getLineupCard(id))
                    .reduce((worstIndex, item, index, items) =>
                        !items[worstIndex] || getCardOvr(item) < getCardOvr(items[worstIndex]) ? index : worstIndex
                    , 0);
                current[replacementIndex] = card.id;
                gameState.lineup[key] = current;
            }
        }
        gameState.startingLineup.pitcher = card.id;
    }
    synthSelectedIds = synthSelectedIds.filter(id => id !== card.id);
    repairLineup();
    return true;
}

function setStarter(id) {
    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;
    if (!registerCardToLineup(card)) return;
    alert(`[${card.name}] 선수가 ${card.lineupSlot || card.pitchRole} 엔트리에 등록되었습니다.`);
    saveGameData();
    renderDuelDraft();
    renderRosterList();
    renderUpgradePanel();
}

function removeStarter(id) {
    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;
    const replacement = gameState.roster
        .filter(candidate => candidate.id !== id
            && candidate.pos === card.pos
            && (card.pos === '타자'
                ? candidate.lineupSlot === card.lineupSlot
                : candidate.pitchRole === card.pitchRole))
        .sort((a, b) => getCardOvr(b) - getCardOvr(a))[0];
    if (!replacement) {
        alert('같은 포지션의 교체 카드가 없습니다. 팩에서 선수를 더 영입하세요.');
        return;
    }
    registerCardToLineup(replacement);
    alert(`[${card.name}] 대신 [${replacement.name}] 선수가 엔트리에 등록되었습니다.`);
    saveGameData();
    renderDuelDraft();
    renderRosterList();
    renderUpgradePanel();
}

function toggleCardLock(id) {
    const card = gameState.roster.find(candidate => candidate.id === id);
    if (!card) return;
    card.locked = !card.locked;
    if (card.locked) synthSelectedIds = synthSelectedIds.filter(cardId => cardId !== id);
    saveGameData();
    renderRosterList();
    renderUpgradePanel();
}

function sellCard(id) {
    const card = gameState.roster.find(c => c.id === id);
    if (!card) return;

    if (card.locked) {
        alert('잠금 카드는 판매할 수 없습니다.');
        return;
    }
    if (isCardInActiveLineup(card)) {
        alert('활성 엔트리 선수는 판매할 수 없습니다.');
        return;
    }
    if (!card.templateId) {
        alert('선수 식별 정보가 없는 카드는 판매할 수 없습니다.');
        return;
    }
    const ownedCopies = gameState.roster.filter(candidate => candidate.templateId === card.templateId).length;
    if (ownedCopies <= 1) {
        alert('선수별 마지막 1장은 보존됩니다. 같은 선수 카드를 한 장 더 획득하세요.');
        return;
    }

    const price = (card.level * 200) + 500;
    gameState.gold += price;
    gameState.roster = gameState.roster.filter(c => c.id !== id);
    synthSelectedIds = synthSelectedIds.filter(cardId => cardId !== id);

    alert(`선수 판매가 완료되었습니다. +💰 ${price.toLocaleString()} P 지급`);
    selectedUpgradeCardId = null;

    saveGameData();
    updateSidebarUI();
    renderRosterList();
    renderUpgradePanel();
}

// 12. Gacha Shop purchase & flips
function buyPack(type) {
    if (!Object.hasOwn(PACK_CONFIGS, type)) return false;
    const packConfig = PACK_CONFIGS[type];
    if (gameState.gold < packConfig.price) {
        alert('골드가 부족합니다.');
        return false;
    }
    gameState.gold -= packConfig.price;
    gameState.packInventory.push(type);
    gameState.packs = gameState.packInventory.length;
    
    playSound('hit');
    alert(`${packConfig.label} 1개를 구매했습니다!`);
    
    saveGameData();
    updateSidebarUI();
    updateShopUI();
    return true;
}

function updateShopUI() {
    let wait = document.getElementById('opening-waiting');
    if (!wait) {
        const stage = document.getElementById('opening-stage-container');
        if (!stage) return;
        stage.innerHTML = '<div class="waiting-pack" id="opening-waiting"></div>';
        wait = document.getElementById('opening-waiting');
    }
    const normalCount = gameState.packInventory.filter(type => type === 'normal').length;
    const premiumCount = gameState.packInventory.filter(type => type === 'premium').length;
    document.querySelectorAll('[data-pack-owned="normal"]').forEach(node => node.textContent = normalCount);
    document.querySelectorAll('[data-pack-owned="premium"]').forEach(node => node.textContent = premiumCount);
    if (gameState.packInventory.length > 0) {
        wait.innerHTML = `
            <span class="chest-icon" style="font-size:4rem;">🎁</span>
            <p>개봉 대기: <strong>일반 ${normalCount} · 프리미엄 ${premiumCount}</strong></p>
            <div class="pack-open-actions">
                <button class="btn btn-secondary" ${normalCount ? '' : 'disabled'} onclick="drawCardGacha('normal')">일반 팩 개봉</button>
                <button class="btn btn-primary" ${premiumCount ? '' : 'disabled'} onclick="drawCardGacha('premium')">프리미엄 팩 개봉</button>
            </div>
        `;
    } else {
        wait.innerHTML = `
            <span class="chest-icon" style="opacity:0.3;">🎁</span>
            <p>보유하고 있는 카드 팩이 없습니다.</p>
            <button class="btn btn-secondary" disabled>개봉 대기 없음</button>
        `;
    }
}

function drawCardGacha(requestedType) {
    if (!Object.hasOwn(PACK_CONFIGS, requestedType)) return null;
    const type = requestedType;
    const inventoryIndex = gameState.packInventory.indexOf(type);
    if (inventoryIndex < 0) return null;
    gameState.packInventory.splice(inventoryIndex, 1);
    gameState.packs = gameState.packInventory.length;
    const tier = rollTierFromOdds(PACK_CONFIGS[type].odds);

    // Pick a random team and player
    const teamId = KBO_TEAMS[Math.floor(Math.random() * KBO_TEAMS.length)].id;
    const isBat = Math.random() > 0.5;
    const rosterList = TEAM_ROSTERS_RAW[teamId];
    const nameList = isBat ? rosterList.batters : rosterList.pitchers;
    const player = nameList[Math.floor(Math.random() * nameList.length)];

    const card = generateCard(teamId, isBat ? '타자' : '투수', player, tier);
    gameState.roster.push(card);
    const team = KBO_TEAMS.find(entry => entry.id === teamId);
    const tierLabel = { legend: 'LEGEND', hero: 'HERO', special: 'SPECIAL', normal: 'LIVE' }[tier];
    lastPackReveal = {
        name: card.name,
        tier,
        tierLabel,
        teamId,
        team: team?.name || 'KBO',
        position: card.pos,
        backNo: card.backNo,
        sourceDate: ROSTER_SOURCE.asOf
    };

    // Draw a staged pack charge → burst → real-player card reveal.
    const container = document.getElementById('opening-stage-container');
    if (container) {
        const particles = Array.from({ length: 16 }, (_, index) =>
            `<i class="reveal-particle" style="--particle-index:${index}" aria-hidden="true"></i>`
        ).join('');
        container.innerHTML = `
            <div
                class="card-draw-reveal-scene reveal-tier-${tier}"
                data-reveal-tier="${tier}"
                role="status"
                aria-live="polite"
                aria-label="${tierLabel} ${team?.short || 'KBO'} ${card.name} 선수 카드 획득"
            >
                <div class="reveal-sky" aria-hidden="true">
                    <span class="reveal-flare"></span>
                    <span class="reveal-ring reveal-ring-a"></span>
                    <span class="reveal-ring reveal-ring-b"></span>
                    <span class="reveal-particles">${particles}</span>
                </div>
                <div class="reveal-pack-shell" aria-hidden="true">
                    <span class="reveal-pack-icon">${type === 'premium' ? '💎' : '⚾'}</span>
                    <strong>${type === 'premium' ? 'PREMIUM' : 'LIVE'} PACK</strong>
                    <small>OPEN!</small>
                </div>
                <div class="reveal-card-wrap">
                    <span class="reveal-tier-callout">${tierLabel} PLAYER!</span>
                    <span class="reveal-real-name">${team?.short || 'KBO'} · 공식 등록 선수</span>
                    ${renderCardHTML(card, false)}
                </div>
                <div class="reveal-result-copy">
                    <h4>🎉 ${card.name} 선수 영입!</h4>
                    <p>${PACK_CONFIGS[type].label} · ${formatTierOdds(PACK_CONFIGS[type].odds)}</p>
                    <button class="btn btn-primary" onclick="resetOpeningStage()">확인</button>
                </div>
            </div>
        `;
    }

    playSound('applause');
    saveGameData();
    updateSidebarUI();
    renderRosterList();
    return card;
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
    document.getElementById('user-packs').textContent = gameState.packInventory?.length || 0;

    // Team overall reflects the active 18-card lineup, not unused inventory.
    const activeCards = getActiveLineupIds().map(getLineupCard).filter(Boolean);
    const avgOvr = Math.round(activeCards.reduce((sum, card) => sum + getCardOvr(card), 0) / (activeCards.length || 1));
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
    syncDifficultyUI();
    // Populate opponent select option
    const sel = document.getElementById('opp-team-select');
    if (sel) {
        sel.innerHTML = KBO_TEAMS.filter(t => t.id !== gameState.myTeamId).map(t => {
            return `<option value="${t.id}">${t.emblem} ${t.name}</option>`;
        }).join('');

        const availableOpponentIds = Array.from(sel.options).map(option => option.value);
        if (!availableOpponentIds.includes(gameState.oppTeamId)) {
            gameState.oppTeamId = availableOpponentIds[0];
        }
        sel.value = gameState.oppTeamId;
        const syncOpponentUI = () => {
            gameState.oppTeamId = sel.value;
            const opp = KBO_TEAMS.find(t => t.id === gameState.oppTeamId);
            document.getElementById('setup-opp-team-name').textContent = opp.name;
            const opponentProfile = getOpponentTeamBalanceProfile(opp.id);
            const opponentTier = getDifficultyProfile().opponentTier;
            const tierOvrBonus = TIER_CONFIG[opponentTier].base - TIER_CONFIG.normal.base;
            const opponentOvr = Math.round((
                opponentProfile.offense.contact + opponentProfile.offense.power + opponentProfile.defense.stuff + opponentProfile.defense.control
            ) / 4) + tierOvrBonus;
            document.getElementById('setup-opp-ovr').textContent = `OVR ${opponentOvr}`;
            
            document.getElementById('sb-opp-name').textContent = opp.short;
            document.getElementById('sb-opp-emblem').textContent = opp.emblem;
            saveGameData();
        };
        sel.onchange = syncOpponentUI;
        syncOpponentUI();
    }

    renderDuelDraft();
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
    const team = KBO_TEAMS.find(entry => entry.id === teamId);
    if (!team) return false;

    if (gameActive) {
        gameActive = false;
        pitchMeterActive = false;
        pitchAnimState.active = false;
        hitFlightState.active = false;
        pendingAutomaticSteal = false;
        stealAnimState.active = false;
        clearScheduledGameActions();
        clearInterval(animationFrameId);
        clearInterval(pitchMeterInterval);
        animationFrameId = null;
        pitchMeterInterval = null;
        document.getElementById('simulation-overlay').style.display = 'none';
        document.getElementById('steal-cutscene').style.display = 'none';
        document.getElementById('game-result-overlay')?.classList.remove('visible');
        document.getElementById('match-setup-screen').style.display = 'block';
        document.getElementById('gameplay-arena-screen').style.display = 'none';
    }

    gameState.myTeamId = teamId;
    if (gameState.oppTeamId === teamId) {
        gameState.oppTeamId = KBO_TEAMS.find(entry => entry.id !== teamId)?.id || gameState.oppTeamId;
    }
    repairLineup();
    saveGameData();
    
    const modal = document.getElementById('modal-team-select');
    if (modal) modal.style.display = 'none';

    updateSidebarUI();
    setupPlayLobby();
    renderRosterList();
    
    logCommentary(`🎉 대표 구단을 [${team.name}]으로 변경했습니다. 보유 카드와 재화는 유지됩니다.`);
    return true;
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
        const titles = { play: '오늘의 카드 듀얼', roster: '라인업 & 선수 성장', shop: '선수 영입 상점', info: '게임 가이드' };
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

window.render_game_to_text = () => {
    const inLobby = document.getElementById('match-setup-screen')?.style.display !== 'none';
    const payload = {
        coordinate_system: 'Canvas origin is top-left; +x is right, +y is down. Camera is behind home plate looking toward the mound.',
        visual_theme: {
            mode: document.documentElement.dataset.theme || 'daylight',
            design_id: 'rbi_card_duel_2026',
            shell: 'bright_daylight_broadcast',
            runtime_tokens: readRuntimeDesignTokens().colors
        },
        field_geometry: Object.fromEntries(
            Object.entries(FIELD_GEOMETRY).map(([key, point]) => [key, { x: point.x, y: point.y }])
        ),
        camera_layout: {
            view: CAMERA_LAYOUT.view,
            canvas_backing_scale: canvasBackingScale,
            canvas_backing_size: canvas ? [canvas.width, canvas.height] : [CW, CH],
            pitcher_feet: [CAMERA_LAYOUT.pitcher.nx, CAMERA_LAYOUT.pitcher.ny],
            catcher_feet: [CAMERA_LAYOUT.catcher.nx, CAMERA_LAYOUT.catcher.ny],
            batter_feet: [CAMERA_LAYOUT.batter.nx, CAMERA_LAYOUT.batter.ny],
            batter_handedness: CAMERA_LAYOUT.batter.handedness,
            strike_zone_center: [CAMERA_LAYOUT.strikeZone.nx, CAMERA_LAYOUT.strikeZone.ny],
            layer_order: ['pitcher', 'catcher', 'batter', 'strike_zone', 'ball']
        },
        character_render: {
            style: PIXEL_SPRITE_ATLAS.id,
            quality_profile: PIXEL_SPRITE_ATLAS.qualityProfile,
            outline: {
                color: PIXEL_SPRITE_ATLAS.outlineColor,
                source_pixels: 3
            },
            layers: ['role-ring', 'ground-shadow', 'team-tinted-pixel-sprite', 'contact-effects'],
            sprite_assets_ready: pixelSpriteAtlasState.status === 'ready',
            asset_state: {
                atlas: pixelSpriteAtlasState.status,
                source_mode: PIXEL_SPRITE_ATLAS.sourceMode,
                tint_fallback: pixelSpriteAtlasState.tintFallback,
                embedded_props_removed: pixelSpriteAtlasState.propMaskApplied,
                error: pixelSpriteAtlasState.error || null
            },
            frame_index: {
                pitcher: getPixelSpriteFrame(
                    'pitcher',
                    pitchAnimState.active ? clamp(pitchAnimState.timer, 0, 1) : pitchMeterActive ? 0.28 : 0.08
                ),
                catcher: getPixelSpriteFrame(
                    'catcher',
                    pitchAnimState.active ? clamp(pitchAnimState.timer, 0, 1) : 0.08
                ),
                batter: getPixelSpriteFrame('batter', pitchAnimState.batterSwing)
            },
            orientations: {
                pitcher: 'front',
                catcher: 'rear',
                batter: 'rear-three-quarter'
            },
            poses: {
                pitcher: resolveCharacterPose(
                    'pitcher',
                    pitchAnimState.active ? clamp(pitchAnimState.timer, 0, 1) : pitchMeterActive ? 0.28 : 0.08
                ).stage,
                catcher: resolveCharacterPose('catcher', pitchAnimState.active ? clamp(pitchAnimState.timer, 0, 1) : 0.08).stage,
                batter: resolveCharacterPose('batter', pitchAnimState.batterSwing).stage
            },
            original_assets_only: true,
            ui_sprite_reuse: true
        },
        screen: inLobby ? 'duel_lobby' : (gameActive ? 'live_duel' : 'result'),
        mode: gameMode,
        difficulty: {
            key: getDifficultyProfile().key,
            label: getDifficultyProfile().label,
            opponent_tier: getDifficultyProfile().opponentTier,
            reveal_pitch_cue: getDifficultyProfile().revealPitchCue,
            reward_multiplier: getDifficultyProfile().rewardMultiplier
        },
        game_flow: {
            requested_role: requestedGameMode,
            simulation_mode: simulationMode,
            inning_limit: inningLimit,
            user_controls_half: isUserControlledHalf(),
            matchup_role: getMatchupRoleForCurrentHalf(),
            matchup_side: getSimulationProfile().side,
            command_stage: inLobby ? 'duel_setup' : getCurrentCommandStage(),
            tiebreaker_active: tiebreakerActive,
            pending_automatic_steal: pendingAutomaticSteal,
            steal: {
                active: stealAnimState.active,
                progress: Number((stealAnimState.progress || 0).toFixed(3)),
                matchup_side: stealAnimState.matchupSide
            }
        },
        inning: currentInning,
        half: halfInning,
        score: { ...scores },
        count: { ...counts },
        bases: { first: baseRunners[0], second: baseRunners[1], third: baseRunners[2] },
        situation_display: {
            runner_hud: 'separate_dom_diamond',
            placement: 'below_gameplay_canvas',
            occupied_bases: baseRunners
                .map((occupied, index) => occupied ? ['1루', '2루', '3루'][index] : null)
                .filter(Boolean),
            on_field_runner_figures: false,
            base_detail: 'diamond_graphic',
            scoreboard_counts: ['balls', 'strikes', 'outs'],
            course_read_ui: 'compact_cross_picker'
        },
        selected_cards: {
            batter: serializeCardForState(activeMatchup.batter || getSelectedRosterCard('batter')),
            pitcher: serializeCardForState(activeMatchup.pitcher || getSelectedRosterCard('pitcher'))
        },
        card_system: {
            schema_version: gameState.schemaVersion,
            roster_source: { ...ROSTER_SOURCE },
            roster_count: gameState.roster.length,
            active_lineup: {
                batting: (gameState.lineup?.batting || []).map(id => {
                    const card = getLineupCard(id);
                    return card ? { id, name: card.name, slot: card.lineupSlot, ovr: getCardOvr(card) } : null;
                }).filter(Boolean),
                rotation: (gameState.lineup?.rotation || []).map(id => {
                    const card = getLineupCard(id);
                    return card ? { id, name: card.name, role: card.pitchRole, ovr: getCardOvr(card) } : null;
                }).filter(Boolean),
                bullpen: (gameState.lineup?.bullpen || []).map(id => {
                    const card = getLineupCard(id);
                    return card ? { id, name: card.name, role: card.pitchRole, ovr: getCardOvr(card) } : null;
                }).filter(Boolean),
                closer: (() => {
                    const card = getLineupCard(gameState.lineup?.closer);
                    return card ? { id: card.id, name: card.name, role: card.pitchRole, ovr: getCardOvr(card) } : null;
                })()
            },
            team_deck: getTeamDeckStatus(),
            pack_inventory: {
                normal: gameState.packInventory.filter(type => type === 'normal').length,
                premium: gameState.packInventory.filter(type => type === 'premium').length
            },
            pack_odds: Object.fromEntries(Object.entries(PACK_CONFIGS).map(([type, config]) => [type, { ...config.odds }])),
            last_pack_reveal: lastPackReveal ? { ...lastPackReveal } : null,
            auto_simulation: getSimulationProfile()
        },
        pitch: {
            active: pitchAnimState.active,
            number: activeMatchup.pitchNumber,
            type: pitchAnimState.active ? pitchAnimState.pitchType : selectedPitchType,
            speed_kph: pitchAnimState.speedKph,
            travel_duration_ms: pitchAnimState.travelDurationMs,
            target_zone: pitchAnimState.targetZone,
            cue_revealed: Boolean(pitchAnimState.cueRevealed),
            batter_read_zone: pitchAnimState.userGuessZone,
            pitcher_selected_zone: selectedPitchZone,
            progress: Number((pitchAnimState.timer || 0).toFixed(3)),
            ball: {
                x: Number((pitchAnimState.ballX || 0).toFixed(3)),
                y: Number((pitchAnimState.ballY || 0).toFixed(3)),
                z: Number((pitchAnimState.ballZ || 0).toFixed(3))
            },
            release_accuracy: Number(pitchAccuracy.toFixed(3)),
            release_source: pitchAccuracySource,
            pitcher_energy: Math.round(activeMatchup.pitcherEnergy),
            pitcher_energy_by_side: {
                my: Math.round(pitcherEnergyBySide.my),
                opp: Math.round(pitcherEnergyBySide.opp)
            }
        },
        batted_ball: lastBattedBall
            ? {
                active: Boolean(lastBattedBall.active),
                result_code: lastBattedBall.resultCode,
                result_label: lastBattedBall.resultLabel,
                direction_key: lastBattedBall.directionKey,
                direction_label: lastBattedBall.directionLabel,
                distance_m: lastBattedBall.distanceM,
                current_distance_m: lastBattedBall.currentDistanceM,
                exit_velocity_kph: lastBattedBall.exitVelocityKph,
                launch_angle_deg: lastBattedBall.launchAngle,
                contact_quality: lastBattedBall.contactQuality ?? null,
                zone_quality: lastBattedBall.zoneQuality ?? null,
                fielding_out_threshold: lastBattedBall.fieldingOutThreshold ?? null,
                fielding_reach_m: lastBattedBall.fieldingReachM ?? null,
                fielding_adjusted_distance_m: lastBattedBall.fieldingAdjustedDistanceM ?? null,
                resolution: lastBattedBall.resolution || 'preset_profile',
                travel_duration_ms: lastBattedBall.durationMs,
                progress: lastBattedBall.progress,
                callout_visible: Boolean(hitFlightState.calloutVisible)
            }
            : null,
        audio: {
            profile: 'layered_web_audio_v2',
            shared_context: Boolean(audioRuntime.context && audioRuntime.master),
            context_create_count: audioRuntime.contextCreateCount,
            context_state: audioRuntime.context?.state || 'unavailable',
            scenes: Object.keys(AUDIO_SCENES),
            last_scene: audioRuntime.lastScene,
            recent_scenes: [...audioRuntime.recentScenes],
            last_parameters: { ...audioRuntime.lastParameters },
            last_scene_layers: audioRuntime.lastSceneLayers.map(layer => ({ ...layer }))
        },
        feedback: {
            timing: activeMatchup.lastTiming,
            outcome: activeMatchup.lastOutcome,
            card_effect: activeMatchup.lastCardEffect
        },
        interaction: {
            numbered_command_flow: false,
            command_stage: inLobby ? 'duel_setup' : getCurrentCommandStage(),
            batter_timing: getBatterTimingPresentation(),
            timing_ring_visible: Boolean(gameMode === 'batter' && pitchAnimState.active && !hitFlightState.active),
            release_meter_active: Boolean(pitchMeterActive),
            selected_zone: gameMode === 'batter' ? pitchAnimState.userGuessZone : selectedPitchZone
        },
        controls: inLobby
            ? { choose_card: 'Click one of three batter and pitcher cards', batter_quick_start: 'B', pitcher_quick_start: 'P or A', fullscreen: 'F' }
            : gameMode === 'batter'
                ? { aim: 'Arrow keys', swing: 'Space, Enter, or canvas tap', fullscreen: 'F' }
                : { pitch_type: '1-4', location: 'Arrow keys', release: 'Space, Enter, or canvas tap', fullscreen: 'F' }
    };
    return JSON.stringify(payload, null, 2);
};

window.__KBO_CARD_TEST__ = {
    getState: () => JSON.parse(JSON.stringify(gameState)),
    getDifficulty: () => getDifficultyProfile().key,
    getDifficultyProfiles: () => JSON.parse(JSON.stringify(DIFFICULTY_PROFILES)),
    setDifficulty: level => ({ ...setDifficulty(level) }),
    getPitchKinematics,
    getSwingTimingWindows,
    createResolvedBattedBallProfile,
    setState: nextState => {
        gameState = JSON.parse(JSON.stringify(nextState));
        repairLineup();
        saveGameData();
        updateSidebarUI();
        renderDuelDraft();
        renderRosterList();
        renderUpgradePanel();
        updateShopUI();
        return JSON.parse(JSON.stringify(gameState));
    },
    reset: teamId => {
        initializeDefaultGameData(TEAM_ROSTERS_RAW[teamId] ? teamId : 'kia');
        updateSidebarUI();
        setupPlayLobby();
        renderRosterList();
        updateShopUI();
        return JSON.parse(JSON.stringify(gameState));
    },
    getPackOdds: type => ({ ...(PACK_CONFIGS[type]?.odds || {}) }),
    getRosterCatalog: () => Object.fromEntries(Object.entries(TEAM_ROSTERS_RAW).map(([teamId, roster]) => [
        teamId,
        {
            batters: roster.batters.map(player => ({ ...player })),
            pitchers: roster.pitchers.map(player => ({ ...player }))
        }
    ])),
    rollPackTier: (type, roll) => rollTierFromOdds(PACK_CONFIGS[type].odds, roll),
    createCard: (teamId, pos, playerIndex, tier) => {
        const pool = TEAM_ROSTERS_RAW[teamId][pos === '타자' ? 'batters' : 'pitchers'];
        return generateCard(teamId, pos, pool[playerIndex], tier);
    },
    getCardStat,
    getCardOvr,
    getPitchEnergyCost,
    getTeamDeckStatus,
    getSynthesisBlockReason,
    getSynthesisOdds,
    buildUniqueSkillReroll,
    buildSimulationProbabilities,
    resolveSimulationOutcome,
    getSimulationProfile,
    getCardSystemSnapshot: () => JSON.parse(window.render_game_to_text()).card_system
};

window.advanceTime = (ms) => {
    manualTimeMode = true;
    if (animationFrameId) {
        clearInterval(animationFrameId);
        animationFrameId = null;
    }
    if (pitchMeterInterval) {
        clearInterval(pitchMeterInterval);
        pitchMeterInterval = null;
    }

    const frameMs = 1000 / 60;
    const steps = Math.max(1, Math.ceil(ms / frameMs));
    const stepMs = ms / steps;
    for (let step = 0; step < steps; step++) {
        updatePitchMeterStep(stepMs);
        tickGameDrawing(stepMs);
    }
    if (ctx && gameActive) drawStadium();
    return Promise.resolve();
};

window.addEventListener('resize', () => {
    if (configureCanvasBackingStore() && gameActive) drawStadium();
});

window.addEventListener('fullscreenchange', () => {
    configureCanvasBackingStore();
    if (ctx && gameActive) drawStadium();
});

// Boot triggers
let gameBooted = false;
function bootGame() {
    if (gameBooted) return;
    gameBooted = true;
    if (window.lucide) lucide.createIcons();
    initPixelSpriteAtlas();
    const hasSave = loadGameData();
    if (!hasSave) {
        initializeDefaultGameData('kia');
    }
    if (!gameState.startingLineup) gameState.startingLineup = { batter: null, pitcher: null };
    if (!getSelectedRosterCard('batter')) {
        gameState.startingLineup.batter = gameState.roster.find(card => card.pos === '타자')?.id || null;
    }
    if (!getSelectedRosterCard('pitcher')) {
        gameState.startingLineup.pitcher = gameState.roster.find(card => card.pos === '투수')?.id || null;
    }
    updateSidebarUI();
    setupPlayLobby();
    updateZonePickerUI();
    window.__RBI_CARD_DESIGN_TOKENS__ = readRuntimeDesignTokens();
    const modal = document.getElementById('modal-team-select');
    if (modal) modal.style.display = 'none';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGame, { once: true });
} else {
    bootGame();
}
window.addEventListener('load', bootGame, { once: true });

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


// ==========================================================================
// Account & Auth System (Multi-user Isolated Save Engine)
// ==========================================================================
let currentUser = null;
let authMode = 'login';

function getUsersList() {
    try {
        return JSON.parse(localStorage.getItem('kbo_users_registry') || '{}');
    } catch (e) {
        return {};
    }
}

function saveUsersList(registry) {
    localStorage.setItem('kbo_users_registry', JSON.stringify(registry));
}

function getAccountStateKey(username) {
    return 'kbo_user_state_' + String(username).toLowerCase();
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = (hash << 5) - hash + password.charCodeAt(i);
        hash |= 0;
    }
    return 'kbo_h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function openAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.style.display = 'flex';
    setAuthMode('login');
}

function closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.style.display = 'none';
}

function setAuthMode(mode) {
    authMode = mode;
    const loginBtn = document.getElementById('tab-auth-login');
    const regBtn = document.getElementById('tab-auth-register');
    const submitBtn = document.getElementById('btn-auth-submit');
    const modalTitle = document.getElementById('auth-modal-title');
    const err = document.getElementById('auth-error-msg');
    const succ = document.getElementById('auth-success-msg');

    if (err) err.textContent = '';
    if (succ) succ.textContent = '';

    if (mode === 'login') {
        if (loginBtn) loginBtn.className = 'auth-tab-btn active';
        if (regBtn) regBtn.className = 'auth-tab-btn';
        if (submitBtn) submitBtn.textContent = '로그인하기';
        if (modalTitle) modalTitle.textContent = '🔐 KBO 프로야구 로그인';
    } else {
        if (loginBtn) loginBtn.className = 'auth-tab-btn';
        if (regBtn) regBtn.className = 'auth-tab-btn active';
        if (submitBtn) submitBtn.textContent = '새 계정 회원가입';
        if (modalTitle) modalTitle.textContent = '📝 KBO 프로야구 회원가입';
    }
}

function handleAuthSubmit() {
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const errorMsg = document.getElementById('auth-error-msg');
    const successMsg = document.getElementById('auth-success-msg');

    if (errorMsg) errorMsg.textContent = '';
    if (successMsg) successMsg.textContent = '';

    const username = (usernameInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();

    if (!username || username.length < 2) {
        if (errorMsg) errorMsg.textContent = '아이디는 2자 이상 입력해 주세요.';
        return;
    }
    if (!password || password.length < 3) {
        if (errorMsg) errorMsg.textContent = '비밀번호는 3자 이상 입력해 주세요.';
        return;
    }

    const registry = getUsersList();
    const userKey = username.toLowerCase();

    if (authMode === 'register') {
        if (registry[userKey]) {
            if (errorMsg) errorMsg.textContent = '이미 존재하는 아이디입니다. 로그인 탭을 이용해 주세요.';
            return;
        }
        registry[userKey] = {
            username: username,
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString()
        };
        saveUsersList(registry);

        currentUser = { username: username };
        localStorage.setItem('kbo_active_session', username);
        saveCurrentGameStateToAccount();

        if (successMsg) successMsg.textContent = '회원가입 및 로그인이 완료되었습니다!';
        setTimeout(() => {
            closeAuthModal();
            updateUserAccountUI();
        }, 800);

    } else {
        const existingUser = registry[userKey];
        if (!existingUser) {
            if (errorMsg) errorMsg.textContent = '존재하지 않는 아이디입니다. 회원가입 탭에서 계정을 생성해 주세요.';
            return;
        }
        if (existingUser.passwordHash !== hashPassword(password)) {
            if (errorMsg) errorMsg.textContent = '비밀번호가 일치하지 않습니다.';
            return;
        }

        currentUser = { username: existingUser.username };
        localStorage.setItem('kbo_active_session', existingUser.username);
        loadGameStateFromAccount(existingUser.username);

        if (successMsg) successMsg.textContent = `[${existingUser.username}] 님으로 로그인되었습니다!`;
        setTimeout(() => {
            closeAuthModal();
            updateUserAccountUI();
        }, 800);
    }
}

function saveCurrentGameStateToAccount() {
    if (!currentUser) return;
    const state = {
        userGold,
        userPacks,
        myTeam,
        oppTeam,
        myRoster,
        scores,
        hits,
        errors,
        savedAt: new Date().toISOString()
    };
    localStorage.setItem(getAccountStateKey(currentUser.username), JSON.stringify(state));
}

function loadGameStateFromAccount(username) {
    const raw = localStorage.getItem(getAccountStateKey(username));
    if (!raw) return false;
    try {
        const state = JSON.parse(raw);
        if (typeof state.userGold === 'number') userGold = state.userGold;
        if (typeof state.userPacks === 'number') userPacks = state.userPacks;
        if (state.myTeam) myTeam = state.myTeam;
        if (state.oppTeam) oppTeam = state.oppTeam;
        if (Array.isArray(state.myRoster)) myRoster = state.myRoster;

        if (typeof updateResourceUI === 'function') updateResourceUI();
        if (typeof updateRosterUI === 'function') updateRosterUI();
        if (typeof updateScoreboardUI === 'function') updateScoreboardUI();
        return true;
    } catch (e) {
        console.error('Failed to load user account state:', e);
        return false;
    }
}

function updateUserAccountUI() {
    const displayId = document.getElementById('user-display-id');
    const statusText = document.getElementById('user-account-status');
    const authBtn = document.getElementById('btn-open-auth-modal');
    const avatar = document.getElementById('user-avatar-icon');

    if (currentUser) {
        if (displayId) displayId.textContent = currentUser.username;
        if (statusText) statusText.textContent = '로그인됨 (내 개별 저장소 연결됨)';
        if (avatar) avatar.textContent = '⚾';
        if (authBtn) {
            authBtn.textContent = '로그아웃';
            authBtn.className = 'btn-auth-action logout';
            authBtn.onclick = handleLogout;
        }
    } else {
        if (displayId) displayId.textContent = '손님 (Guest)';
        if (statusText) statusText.textContent = '로그인이 필요합니다';
        if (avatar) avatar.textContent = '👤';
        if (authBtn) {
            authBtn.textContent = '로그인';
            authBtn.className = 'btn-auth-action';
            authBtn.onclick = openAuthModal;
        }
    }
}

function handleLogout() {
    if (currentUser) {
        saveCurrentGameStateToAccount();
    }
    currentUser = null;
    localStorage.removeItem('kbo_active_session');
    updateUserAccountUI();
    logCommentary('로그아웃되었습니다.');
}

function initAccountSystem() {
    const loginTab = document.getElementById('tab-auth-login');
    const regTab = document.getElementById('tab-auth-register');
    const closeBtn = document.getElementById('btn-close-auth-modal');
    const authForm = document.getElementById('auth-form');

    if (loginTab) loginTab.addEventListener('click', () => setAuthMode('login'));
    if (regTab) regTab.addEventListener('click', () => setAuthMode('register'));
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
    if (authForm) authForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuthSubmit(); });

    const activeUsername = localStorage.getItem('kbo_active_session');
    if (activeUsername) {
        const registry = getUsersList();
        if (registry[activeUsername.toLowerCase()]) {
            currentUser = { username: registry[activeUsername.toLowerCase()].username };
            loadGameStateFromAccount(currentUser.username);
        }
    }
    updateUserAccountUI();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccountSystem);
} else {
    initAccountSystem();
}
