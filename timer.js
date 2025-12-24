/**
 * 강호 시시각각(時時刻刻) - 최종 수정본
 * 수정사항: 월간 숙제 취소선 제거, 시간 포맷 변경 (일 HH:MM:SS)
 */

// ============================================================
// [데이터 1] 숙제 세부 목록
// ============================================================
const TASK_DATA = [
    // [월간]
    { freq: 'monthly', type: '구매', loc: '공명상점', title: '음의 선율 구매' },
    { freq: 'monthly', type: '구매', loc: '공명상점', title: '선율 할인권 구매' },
    // [주간]
    { freq: 'weekly', type: '전투', loc: '협경', title: '협경 클리어 (보상 수령)' },
    { freq: 'weekly', type: '전투', loc: '검무장', title: '검무장 클리어' },
    { freq: 'weekly', type: '구매', loc: '강호백진', title: '음의 선율 구매' },
    { freq: 'weekly', type: '구매', loc: '시즌상점', title: '주간 한정 물품 구매' },
    { freq: 'weekly', type: '활동', loc: '동맹', title: '화물 운송' },
    { freq: 'weekly', type: '활동', loc: '무역', title: '시매사 교환' },
    // [일일]
    { freq: 'daily', type: '활동', loc: '현상령', title: '수배/복수 현상령 완료' },
    { freq: 'daily', type: '활동', loc: '꿈속', title: '엽비휴와 도박' },
    { freq: 'daily', type: '활동', loc: '필드', title: '비결 재료 채집' },
    { freq: 'daily', type: '활동', loc: '강호호령', title: '문파 호령 수행' }
];

// ============================================================
// [데이터 2] 타이머 설정
// ============================================================
const TIMERS = [
    // 1. 일일 초기화
    {
        id: 'daily',
        type: 'reset',
        freq: 'daily',
        name: '일일 할 일',
        desc: '매일 오전 6시 갱신',
        badgeClass: 'status-ing'
    },
    // 2. 주간 초기화
    {
        id: 'weekly',
        type: 'reset',
        freq: 'weekly',
        name: '주간 할 일',
        desc: '매주 월요일 6시 갱신',
        badgeClass: 'status-ing' // (수정) urgent 대신 ing로 통일
    },
    // 3. 월간 초기화 (수정됨: status-end -> status-ing)
    {
        id: 'monthly',
        type: 'reset',
        freq: 'monthly',
        name: '월간 할 일',
        desc: '매월 1일 6시 갱신',
        badgeClass: 'status-ing' // ★여기가 원인이었습니다★
    },
    // 4. 이벤트
    {
        id: 'event_winter',
        type: 'event',
        name: '불꽃놀이 축제',
        desc: '강호의 밤을 수놓는 불꽃 축제입니다.',
        startTime: '2024-12-25T00:00:00',
        endTime: '2025-12-31T23:59:59',
        badgeClass: 'status-event'
    }
];

// ============================================================
// ▼ 로직 영역
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
    updateTimers();
    setInterval(updateTimers, 1000);
});

function updateTimers() {
    const container = document.getElementById('gangho-timer-list');
    if (!container) return;

    if (container.innerText.includes('시간을 읽는 중')) container.innerHTML = '';

    const now = new Date();

    TIMERS.forEach(timer => {
        let row = document.getElementById(`timer-row-${timer.id}`);
        
        if (!row) {
            row = document.createElement('div');
            row.id = `timer-row-${timer.id}`;
            row.className = 'timer-row';
            row.onclick = () => openTimerSheet(timer);
            container.appendChild(row);
        }

        let timeStr = "";
        let isUrgent = false;

        // 시간 계산 분기
        if (timer.type === 'reset') {
            const target = getNextResetTime(timer.freq, now);
            const diff = target - now;
            timeStr = formatDuration(diff); // 포맷 함수 변경됨
            if (diff < 3 * 60 * 60 * 1000) isUrgent = true;
        } 
        else if (timer.type === 'event') {
            const start = new Date(timer.startTime);
            const end = new Date(timer.endTime);
            
            if (now < start) {
                timeStr = "시작 전";
            } else if (now > end) {
                timeStr = "종료됨";
            } else {
                const diff = end - now;
                timeStr = formatDuration(diff); // 포맷 함수 변경됨
                if (diff < 24 * 60 * 60 * 1000) isUrgent = true;
            }
        }

        row.innerHTML = `
            <div class="timer-left">
                <div class="timer-title">${timer.name}</div>
                <div class="timer-status-row">
                    <span class="status-badge ${timer.badgeClass}">
                        ${timer.type === 'event' ? 'EVENT' : timer.freq.toUpperCase()}
                    </span>
                    <span style="color:#ddd;">|</span>
                    <span>${timer.desc}</span>
                </div>
            </div>
            <div class="timer-right">
                <div class="timer-clock" style="color: ${isUrgent ? 'var(--wuxia-accent-red)' : '#333'}">
                    ${timeStr}
                </div>
            </div>
        `;
    });
}

// 초기화 시간 계산
function getNextResetTime(freq, now) {
    let target = new Date(now);
    if (freq === 'daily') {
        if (now.getHours() >= 6) target.setDate(target.getDate() + 1);
        target.setHours(6, 0, 0, 0);
    } else if (freq === 'weekly') {
        const day = now.getDay();
        const diffToMon = (1 + 7 - day) % 7;
        target.setDate(target.getDate() + diffToMon);
        target.setHours(6, 0, 0, 0);
        if (diffToMon === 0 && now.getHours() >= 6) target.setDate(target.getDate() + 7);
    } else if (freq === 'monthly') {
        target.setMonth(target.getMonth() + 1);
        target.setDate(1);
        target.setHours(6, 0, 0, 0);
    }
    return target;
}

// ★★★ 시간 포맷 수정 (일 HH:MM:SS) ★★★
function formatDuration(ms) {
    if (ms <= 0) return "00:00:00";
    
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);

    // 시, 분, 초는 항상 2자리로 맞춤 (05:03:01)
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');

    // 1일 이상 남았으면 "3일 12:30:55" 형식
    if (d > 0) {
        return `${d}일 ${hStr}:${mStr}:${sStr}`;
    }
    
    // 24시간 미만이면 "12:30:55" 형식
    return `${hStr}:${mStr}:${sStr}`;
}

// 바텀시트 열기
function openTimerSheet(timer) {
    const modal = document.getElementById('timer-sheet-modal');
    if (!modal) return;
    const contentBox = modal.querySelector('.sheet-body-content') || modal.querySelector('#timer-detail-content');

    let html = `<div style="text-align:center; margin-bottom:15px;">
                    <h3 style="color:var(--wuxia-accent-gold); margin:0;">${timer.name}</h3>
                    <p style="font-size:0.85em; color:#888;">${timer.desc}</p>
                </div>`;

    if (timer.type === 'reset') {
        const tasks = TASK_DATA.filter(t => t.freq === timer.freq);
        if (tasks.length > 0) {
            html += `<div class="task-list-wrapper">`;
            tasks.forEach(task => {
                html += `
                    <div class="task-item">
                        <span class="task-loc">[${task.loc}]</span>
                        <span class="task-title">${task.title}</span>
                    </div>`;
            });
            html += `</div>`;
        } else {
            html += `<p style="text-align:center; color:#999;">등록된 상세 내역이 없습니다.</p>`;
        }
    } 
    else if (timer.type === 'event') {
        const start = timer.startTime.split('T')[0];
        const end = timer.endTime.split('T')[0];
        html += `
            <div style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
                <p><strong>기간:</strong> ${start} ~ ${end}</p>
                <hr style="border:0; border-top:1px dashed #ddd; margin:10px 0;">
                <p style="line-height:1.6; color:#555;">${timer.desc}</p>
            </div>
        `;
    }

    contentBox.innerHTML = html;
    modal.classList.add('show');
}

// 닫기
function closeTimerSheet(e) {
    const modal = document.getElementById('timer-sheet-modal');
    if (modal && (!e || e.target === modal)) modal.classList.remove('show');
}
