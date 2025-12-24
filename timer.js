/**
 * 강호 시시각각 - 타이머 시스템
 */

const GANGHO_EVENTS = [
    {
        id: 'world_boss',
        name: '필드 보스 출현',
        desc: '강호 곳곳에 강력한 보스가 나타납니다. 협객들과 힘을 합쳐 물리치십시오.',
        startTime: '12:00', // 매일 시작 시간
        endTime: '14:00',   // 매일 종료 시간
        type: 'daily'
    },
    {
        id: 'mystic_shop',
        name: '비전 상점 개방',
        desc: '희귀한 비급과 재료를 파는 떠돌이 상인이 머무는 시간입니다.',
        startTime: '18:00',
        endTime: '23:59',
        type: 'daily'
    }
];

function updateTimers() {
    const container = document.getElementById('gangho-timer-list');
    if (!container) return;

    const now = new Date();
    
    GANGHO_EVENTS.forEach(event => {
        let card = document.getElementById(`timer-${event.id}`);
        
        // 카드 생성 (최초 1회)
        if (!card) {
            card = document.createElement('div');
            card.id = `timer-${event.id}`;
            card.className = 'timer-card';
            card.onclick = () => openTimerSheet(event);
            container.appendChild(card);
        }

        const { status, timeStr, isUrgent } = calculateTime(event, now);

        card.className = `timer-card ${isUrgent ? 'timer-urgent' : ''}`;
        card.innerHTML = `
            <div class="timer-header">
                <span class="timer-label">${status}</span>
                <span class="timer-display">${timeStr}</span>
            </div>
            <div class="timer-name">${event.name}</div>
            <div class="timer-status-text">${event.startTime} ~ ${event.endTime}</div>
        `;
    });
}

function calculateTime(event, now) {
    const [sHour, sMin] = event.startTime.split(':').map(Number);
    const [eHour, eMin] = event.endTime.split(':').map(Number);
    
    const start = new Date(now).setHours(sHour, sMin, 0);
    const end = new Date(now).setHours(eHour, eMin, 0);
    
    let status = "";
    let diff = 0;
    let isUrgent = false;

    if (now < start) {
        status = "시작까지";
        diff = start - now;
    } else if (now >= start && now <= end) {
        status = "종료까지";
        diff = end - now;
        if (diff < 600000) isUrgent = true; // 10분 미만일 때 긴급
    } else {
        status = "종료됨";
        diff = 0;
    }

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    
    const timeStr = diff > 0 
        ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : "00:00:00";

    return { status, timeStr, isUrgent };
}

// 바텀시트 열기
function openTimerSheet(event) {
    const modal = document.getElementById('timer-sheet-modal');
    const content = document.getElementById('timer-detail-content');
    
    content.innerHTML = `
        <h3 style="color:var(--wuxia-accent-gold); margin-bottom:15px;">${event.name}</h3>
        <div style="background:#f9f9f9; padding:15px; border-radius:8px; line-height:1.6; color:#444;">
            <p><strong>운영 시간:</strong> ${event.startTime} ~ ${event.endTime}</p>
            <p style="margin-top:10px;">${event.desc}</p>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeTimerSheet(e) {
    if (!e || e.target.classList.contains('bottom-sheet-modal') || e.target.classList.contains('sheet-close-btn')) {
        document.getElementById('timer-sheet-modal').classList.remove('show');
    }
}

// 초기화 및 반복 실행
updateTimers();
setInterval(updateTimers, 1000);
