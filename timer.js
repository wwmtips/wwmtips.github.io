/**
 * 강호 시시각각(時時刻刻) - 통합 타이머 시스템
 * 기능: 매일 반복 일정(daily) & 장기 이벤트(period) 동시 지원
 */

// ★★★ 데이터 설정 영역 ★★★
const GANGHO_EVENTS = [
    // 1. [매일 반복] 예: 필드 보스, 상점 (기존 방식)
    // type: 'daily' 필수, 시간은 'HH:MM' 형식
    {
        id: 'daily_boss',
        type: 'daily', 
        name: '필드 보스 출현',
        desc: '매일 정해진 시간에 강호에 보스가 출현합니다.',
        startTime: '12:00',
        endTime: '14:00'
    },
    {
        id: 'daily_shop',
        type: 'daily',
        name: '비전 상점 개방',
        desc: '희귀 재료를 판매하는 떠돌이 상인입니다.',
        startTime: '18:00',
        endTime: '23:59'
    },

    // 2. [기간 한정] 예: 불꽃놀이 축제, 시즌 이벤트
    // type: 'period' 필수, 날짜는 'YYYY-MM-DDTHH:MM:SS' 형식 (ISO 8601)
    // T는 날짜와 시간을 구분하는 문자입니다.
    {
        id: 'event_winter',
        type: 'period',
        name: '불꽃놀이 축제 (연말)',
        desc: '새해를 맞이하여 강호에서 불꽃놀이가 펼쳐집니다.',
        startTime: '2024-12-25T00:00:00', // 시작일
        endTime: '2025-12-31T23:59:59'    // 종료일 (이 날짜까지 카운트다운)
    },
    {
        id: 'event_attendance',
        type: 'period',
        name: '7일 출석 이벤트',
        desc: '매일 접속하여 특별한 보상을 수령하십시오.',
        startTime: '2025-05-01T10:00:00',
        endTime: '2025-05-15T10:00:00'
    }
];

// ============================================================
// ▼ 아래는 로직 영역입니다 (수정 불필요)
// ============================================================

function updateGanghoTimers() {
    const container = document.getElementById('gangho-timer-list');
    if (!container) return;

    const now = new Date();

    GANGHO_EVENTS.forEach(event => {
        let card = document.getElementById(`timer-${event.id}`);
        
        // 카드 없으면 생성
        if (!card) {
            card = document.createElement('div');
            card.id = `timer-${event.id}`;
            card.className = 'timer-card';
            card.onclick = () => openTimerDetailSheet(event);
            container.appendChild(card);
        }

        // 타입에 따라 시간 계산 방식 분기
        const result = (event.type === 'period') 
            ? calculatePeriodTime(event, now)  // 기간 한정 계산
            : calculateDailyTime(event, now);  // 매일 반복 계산

        const { status, timeStr, isUrgent, isEnded, dateRangeStr } = result;

        // 상태 뱃지 색상
        let badgeColor = 'var(--wuxia-accent-gold)'; // 진행중 (기본)
        if (status === '시작 전') badgeColor = '#555';
        if (status === '종료됨') badgeColor = '#999';
        if (isUrgent) badgeColor = 'var(--wuxia-accent-red)';

        // HTML 렌더링
        card.innerHTML = `
            <div class="timer-header">
                <span class="timer-status" style="color: ${badgeColor}; font-size: 0.8em; font-weight: bold;">
                    ${status}
                </span>
                <span class="timer-clock" style="font-family: 'Noto Serif KR', serif; font-size: 1.1em; font-weight: bold; color: ${isUrgent ? 'var(--wuxia-accent-red)' : '#333'}">
                    ${timeStr}
                </span>
            </div>
            <div class="timer-body" style="margin-top: 5px;">
                <div class="timer-name" style="font-weight: bold; font-size: 0.95em; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${event.name}
                </div>
                <div class="timer-range" style="font-size: 0.75em; color: #888; margin-top: 4px;">
                    ${dateRangeStr}
                </div>
            </div>
        `;

        // 긴급/종료 스타일 클래스 토글
        card.classList.toggle('timer-urgent', isUrgent);
        card.style.opacity = isEnded ? '0.6' : '1';
    });
}

/**
 * [로직 1] 기간 한정 이벤트 계산 (X일 X시간 남음)
 */
function calculatePeriodTime(event, now) {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    let status = "";
    let diff = 0;
    let isUrgent = false; // 종료 24시간 전
    let isEnded = false;

    // 날짜 표시 문자열 (MM.DD 형식)
    const startStr = `${startDate.getMonth()+1}.${startDate.getDate()}`;
    const endStr = `${endDate.getMonth()+1}.${endDate.getDate()}`;
    const dateRangeStr = `${startStr} ~ ${endStr}`;

    if (now < startDate) {
        status = "시작 전";
        diff = startDate - now;
    } else if (now >= startDate && now <= endDate) {
        status = "종료까지";
        diff = endDate - now;
        if (diff < 86400000) isUrgent = true; // 24시간 미만 남음
    } else {
        status = "종료됨";
        diff = 0;
        isEnded = true;
    }

    // 시간 포맷팅 (일/시간/분)
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    let timeStr = "";
    if (isEnded) {
        timeStr = "기간 종료";
    } else {
        if (d > 0) {
            // 1일 이상 남았을 때: "6일 13시간"
            timeStr = `${d}일 ${h}시간 ${m}분`;
        } else {
            // 1일 미만 남았을 때: "13:45:22" (초 단위까지 긴박하게)
            timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
    }

    return { status, timeStr, isUrgent, isEnded, dateRangeStr };
}

/**
 * [로직 2] 매일 반복 일정 계산 (HH:MM:SS)
 */
function calculateDailyTime(event, now) {
    const [sHour, sMin] = event.startTime.split(':').map(Number);
    const [eHour, eMin] = event.endTime.split(':').map(Number);
    
    const startDate = new Date(now);
    startDate.setHours(sHour, sMin, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(eHour, eMin, 0, 0);
    
    let status = "";
    let diff = 0;
    let isUrgent = false; // 종료 10분 전
    let isEnded = false;

    // 날짜 표시 (운영 시간)
    const dateRangeStr = `${event.startTime} ~ ${event.endTime}`;

    if (now < startDate) {
        status = "시작까지";
        diff = startDate - now;
    } else if (now >= startDate && now <= endDate) {
        status = "종료까지";
        diff = endDate - now;
        if (diff < 600000) isUrgent = true; 
    } else {
        status = "휴식 중"; // 당일 종료
        diff = 0;
        isEnded = true;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    let timeStr = "";
    if (isEnded) {
        timeStr = "금일 종료"; // 혹은 내일 시작 시간 계산 가능하나 단순화
    } else {
        timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    return { status, timeStr, isUrgent, isEnded, dateRangeStr };
}

// 바텀시트 열기 (기존 코드 활용)
function openTimerDetailSheet(event) {
    const modal = document.getElementById('timer-sheet-modal');
    if (modal) {
        const detailContent = modal.querySelector('#timer-detail-content');
        if (detailContent) {
            let timeInfo = "";
            if(event.type === 'period') {
                // 날짜 포맷 예쁘게 변환
                const s = new Date(event.startTime);
                const e = new Date(event.endTime);
                timeInfo = `${s.getFullYear()}.${s.getMonth()+1}.${s.getDate()} ~ ${e.getFullYear()}.${e.getMonth()+1
