/**
 * 강호 시시각각(時時刻刻) - 실시간 타이머 시스템
 */

// 1. 콘텐츠 데이터 정의 (운영 시간 및 설명)
const GANGHO_EVENTS = [
    {
        id: 'field_boss',
        name: '필드 보스 출현',
        desc: '강호 곳곳에 강력한 보스가 나타납니다. 협객들과 힘을 합쳐 물리치고 보상을 획득하십시오.',
        startTime: '00:00',
        endTime: '24:00'
    },
    {
        id: 'mystic_shop',
        name: '비전 상점 개방',
        desc: '희귀한 비급과 재료를 파는 떠돌이 상인이 머무는 시간입니다. 한정 수량이니 서두르십시오.',
        startTime: '18:00',
        endTime: '23:59'
    }
];

// 2. 타이머 업데이트 메인 함수
function updateGanghoTimers() {
    const container = document.getElementById('gangho-timer-list');
    if (!container) return;

    const now = new Date();

    GANGHO_EVENTS.forEach(event => {
        let card = document.getElementById(`timer-${event.id}`);
        
        // 카드 엘리먼트가 없으면 최초 생성
        if (!card) {
            card = document.createElement('div');
            card.id = `timer-${event.id}`;
            card.className = 'timer-card';
            // 클릭 시 바텀시트 오픈 (html에 해당 함수가 있어야 함)
            card.onclick = () => openTimerDetailSheet(event);
            container.appendChild(card);
        }

        const { status, timeStr, isUrgent, isEnded } = calculateRemainingTime(event, now);

        // 상태에 따른 스타일 및 텍스트 업데이트
        card.innerHTML = `
            <div class="timer-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="timer-status" style="color: ${isEnded ? '#999' : 'var(--wuxia-accent-red)'}; font-size: 0.85em; font-weight: bold;">
                    ${status}
                </span>
                <span class="timer-clock" style="font-family: 'Noto Serif KR', serif; font-size: 1.2em; font-weight: bold; color: ${isUrgent ? 'var(--wuxia-accent-red)' : '#333'}">
                    ${timeStr}
                </span>
            </div>
            <div class="timer-body" style="margin-top: 8px;">
                <div class="timer-name" style="font-weight: bold; font-size: 1em; color: #222;">${event.name}</div>
                <div class="timer-range" style="font-size: 0.8em; color: #888; margin-top: 4px;">${event.startTime} ~ ${event.endTime}</div>
            </div>
        `;
        
        // 종료 임박 시 깜빡임 효과 클래스 추가
        if (isUrgent) card.classList.add('timer-urgent');
        else card.classList.remove('timer-urgent');
    });
}

// 3. 남은 시간 계산 로직
function calculateRemainingTime(event, now) {
    const [sHour, sMin] = event.startTime.split(':').map(Number);
    const [eHour, eMin] = event.endTime.split(':').map(Number);
    
    const startDate = new Date(now);
    startDate.setHours(sHour, sMin, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(eHour, eMin, 0, 0);
    
    let status = "";
    let diff = 0;
    let isUrgent = false;
    let isEnded = false;

    if (now < startDate) {
        status = "시작까지";
        diff = startDate - now;
    } else if (now >= startDate && now <= endDate) {
        status = "종료까지";
        diff = endDate - now;
        if (diff < 600000) isUrgent = true; // 10분 미만일 때 긴급 표시
    } else {
        status = "종료됨";
        diff = 0;
        isEnded = true;
    }

    // 밀리초를 HH:MM:SS 포맷으로 변환
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    return { status, timeStr, isUrgent, isEnded };
}

// 4. 바텀시트 열기 함수 (예시)
function openTimerDetailSheet(event) {
    // 기존에 구현된 바텀시트 모달 ID를 사용하세요
    const modal = document.getElementById('timer-sheet-modal');
    if (modal) {
        // 상세 내용 주입 로직
        const detailContent = modal.querySelector('#timer-detail-content');
        if (detailContent) {
            detailContent.innerHTML = `
                <h3 style="color: var(--wuxia-accent-gold);">${event.name}</h3>
                <p style="font-size: 0.9em; color: #666;">운영 시간: ${event.startTime} ~ ${event.endTime}</p>
                <hr style="border: 0; border-top: 1px dashed #ddd; margin: 15px 0;">
                <p style="line-height: 1.6;">${event.desc}</p>
            `;
        }
        modal.classList.add('show');
    }
}

// 5. 즉시 실행 및 1초마다 갱신
updateGanghoTimers();
setInterval(updateGanghoTimers, 1000);
