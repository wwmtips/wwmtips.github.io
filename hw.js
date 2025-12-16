/* =========================================
   hw.js - 강호 숙제 관리 스크립트
   ========================================= */

// 1. 숙제 데이터 정의
const taskData = [
    // [월간]
    { id: 'm_1', freq: 'monthly', type: '교환', loc: '공명상점', title: '음의 선율 교환', count: '2개' },
    { id: 'm_2', freq: 'monthly', type: '교환', loc: '공명상점', title: '선율 할인권 교환', count: '1개' },
    
    // [주간]
    { id: 'w_1', freq: 'weekly', type: '교환', loc: '강호백전', title: '음의 선율 교환', count: '2개' },
    { id: 'w_2', freq: 'weekly', type: '교환', loc: '시즌상점', title: '심법 심득 교환', count: '40개' },
    { id: 'w_3', freq: 'weekly', type: '교환', loc: '시즌상점', title: '비결 돌파 지원상자', count: '10개' },
    { id: 'w_4', freq: 'weekly', type: '교환', loc: '시즌상점', title: '작은 단백전 상자', count: '1개' },
    { id: 'w_5', freq: 'weekly', type: '교환', loc: '외관상점', title: '음의 선율 교환', count: '1개' },
    { id: 'w_6', freq: 'weekly', type: '교환', loc: '강호령상점', title: '비결 돌파 지원상자', count: '3개' },
    { id: 'w_7', freq: 'weekly', type: '전투', loc: '협경', title: '협경 클리어', count: '2단계까지' },
    { id: 'w_8', freq: 'weekly', type: '전투', loc: '검무장', title: '진혼(검무장) 클리어', count: '최종 보스' },
    { id: 'w_9', freq: 'weekly', type: '교환', loc: '장비상점', title: '장비 상자 교환', count: '25개' },
    { id: 'w_10', freq: 'weekly', type: '교환', loc: '기술양성', title: '기술 필기 교환', count: '500개' },
    { id: 'w_11', freq: 'weekly', type: '교환', loc: '기술양성', title: '문예/의술/선택 상자', count: '각 15개' },
    { id: 'w_12', freq: 'weekly', type: '교환', loc: '심법', title: '심법 선택 교환', count: '600개' },

    // [일일]
    { id: 'd_1', freq: 'daily', type: '채집', loc: '비결자원', title: '주요 자원 채집', count: '특수 채집물' },
    { id: 'd_2', freq: 'daily', type: '활동', loc: '현상령', title: '현상령 수행', count: '일일 임무' },
    { id: 'd_3', freq: 'daily', type: '활동', loc: '강호호령', title: '강호호령 수행', count: '명성/임무' },
];

// 2. 초기화 로직 (LocalStorage 키)
const STORAGE_KEY_DATA = 'wuxia_hw_data';
const STORAGE_KEY_RESET = 'wuxia_hw_last_reset';

// 3. 메인 실행
document.addEventListener('DOMContentLoaded', () => {
    checkAndReset(); // 시간 체크 및 초기화
    renderTasks();   // 화면 그리기
    updateNextResetUI(); // 남은 시간 표시
});

/**
 * 저장된 데이터 불러오기
 */
function getSavedStatus() {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved ? JSON.parse(saved) : {};
}

/**
 * 데이터 저장하기
 */
function saveStatus(statusObj) {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(statusObj));
}

/**
 * 리셋 시간 계산 및 초기화 수행
 * 일일: 매일 06:00
 * 주간: 월요일 06:00
 * 월간: 1일 06:00
 */
function checkAndReset() {
    const now = new Date();
    const lastResets = JSON.parse(localStorage.getItem(STORAGE_KEY_RESET)) || {
        daily: 0,
        weekly: 0,
        monthly: 0
    };

    let statusData = getSavedStatus();
    let isUpdated = false;

    // 1. 일일 초기화 기준 시간 계산 (오늘 06:00)
    // 현재 시간이 6시 이전이면 '어제 6시'가 기준, 6시 이후면 '오늘 6시'가 기준
    const dailyRef = new Date(now);
    dailyRef.setHours(6, 0, 0, 0);
    if (now < dailyRef) dailyRef.setDate(dailyRef.getDate() - 1);

    // 2. 주간 초기화 기준 시간 계산 (이번주 월요일 06:00)
    const weeklyRef = new Date(dailyRef);
    const day = weeklyRef.getDay(); // 0(일)~6(토)
    const diff = weeklyRef.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
    weeklyRef.setDate(diff);

    // 3. 월간 초기화 기준 시간 계산 (이번달 1일 06:00)
    const monthlyRef = new Date(dailyRef);
    monthlyRef.setDate(1);

    // --- 비교 및 초기화 ---

    // 일일 리셋
    if (lastResets.daily < dailyRef.getTime()) {
        resetByType(statusData, 'daily');
        lastResets.daily = dailyRef.getTime();
        isUpdated = true;
        console.log("일일 숙제가 초기화되었습니다.");
    }

    // 주간 리셋
    if (lastResets.weekly < weeklyRef.getTime()) {
        resetByType(statusData, 'weekly');
        lastResets.weekly = weeklyRef.getTime();
        isUpdated = true;
        console.log("주간 숙제가 초기화되었습니다.");
    }

    // 월간 리셋
    if (lastResets.monthly < monthlyRef.getTime()) {
        resetByType(statusData, 'monthly');
        lastResets.monthly = monthlyRef.getTime();
        isUpdated = true;
        console.log("월간 숙제가 초기화되었습니다.");
    }

    if (isUpdated) {
        saveStatus(statusData);
        localStorage.setItem(STORAGE_KEY_RESET, JSON.stringify(lastResets));
    }
}

/**
 * 특정 타입(daily/weekly/monthly)의 완료 상태만 제거
 */
function resetByType(statusData, freqType) {
    taskData.forEach(task => {
        if (task.freq === freqType) {
            delete statusData[task.id];
        }
    });
}

/**
 * 화면 렌더링
 */
function renderTasks() {
    const statusData = getSavedStatus();

    // 컨테이너 비우기
    document.getElementById('list-daily').innerHTML = '';
    document.getElementById('list-weekly').innerHTML = '';
    document.getElementById('list-monthly').innerHTML = '';

    // 카운터 초기화
    const counts = { daily: {total:0, done:0}, weekly: {total:0, done:0}, monthly: {total:0, done:0} };

    taskData.forEach(task => {
        const isDone = !!statusData[task.id];
        
        // 카운트 증가
        if(counts[task.freq]) {
            counts[task.freq].total++;
            if(isDone) counts[task.freq].done++;
        }

        // 카드 HTML 생성
        const card = document.createElement('div');
        card.className = `quest-card ${isDone ? 'completed' : ''}`;
        card.onclick = (e) => toggleTask(task.id, e); // 카드 클릭 시 토글

        card.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; flex-grow:1;">
                <div style="margin-bottom:4px;">
                    <span class="badge-loc">${task.loc}</span>
                    <span class="badge-type">${task.type}</span>
                </div>
                <div class="quest-name" style="font-size:1em; margin-bottom:2px;">${task.title}</div>
                <div style="font-size:0.85em; color:#888;">${task.count}</div>
            </div>
            <div class="check-btn">
                ${isDone ? '✔' : ''}
            </div>
        `;

        // 해당되는 리스트에 추가
        document.getElementById(`list-${task.freq}`).appendChild(card);
    });

    // 진행도 텍스트 업데이트
    updateProgressText('prog-daily', counts.daily);
    updateProgressText('prog-weekly', counts.weekly);
    updateProgressText('prog-monthly', counts.monthly);
}

function updateProgressText(elementId, countObj) {
    const el = document.getElementById(elementId);
    if(el) {
        el.innerText = `${countObj.done} / ${countObj.total}`;
        // 다 했으면 색상 변경
        if(countObj.total > 0 && countObj.total === countObj.done) {
            el.style.color = 'var(--rarity-uncommon)'; // 초록색 계열
        } else {
            el.style.color = 'var(--wuxia-accent-gold)';
        }
    }
}

/**
 * 클릭 시 상태 토글
 */
function toggleTask(id, event) {
    // 버튼 애니메이션 효과 등을 위해 약간의 딜레이를 줄 수도 있음
    const statusData = getSavedStatus();
    
    if (statusData[id]) {
        delete statusData[id]; // 완료 취소
    } else {
        statusData[id] = true; // 완료
    }

    saveStatus(statusData);
    renderTasks(); // 다시 그리기
}

/**
 * 다음 초기화 시간 안내 (UI 편의성)
 */
function updateNextResetUI() {
    const el = document.getElementById('next-reset-time');
    const now = new Date();
    // 가장 가까운 다음 06:00 계산
    let nextReset = new Date(now);
    nextReset.setHours(6, 0, 0, 0);
    if (now > nextReset) {
        nextReset.setDate(nextReset.getDate() + 1);
    }
    
    // 시간차 계산
    const diffMs = nextReset - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    el.innerText = `${hours}시간 ${minutes}분 후 (매일 06:00)`;
}
