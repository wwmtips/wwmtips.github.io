/**
 * 강호 시시각각(時時刻刻) - 최종 통합본
 * 기능: 텍스트 변경 적용(필수 등) + 완료 항목 자동 내림 정렬
 */

// 1. 숙제 데이터
const TASK_DATA = [
    // [월간]
    { id: 'm_1', freq: 'monthly', type: '구매', loc: '공명상점', title: '음의 선율 구매' },
    { id: 'm_2', freq: 'monthly', type: '구매', loc: '공명상점', title: '선율 할인권 구매' },
    // [주간]
    { id: 'w_7', freq: 'weekly', type: '전투', loc: '협경', title: '협경 클리어' },
    { id: 'w_8', freq: 'weekly', type: '전투', loc: '검무장', title: '검무장 클리어' },
    { id: 'w_1', freq: 'weekly', type: '구매', loc: '강호백진', title: '음의 선율 구매' },
    { id: 'w_5', freq: 'weekly', type: '구매', loc: '시즌상점', title: '음의 선율 구매' },
    { id: 'w_2', freq: 'weekly', type: '구매', loc: '시즌상점', title: '심법 심득 상자 구매' },
    { id: 'w_3', freq: 'weekly', type: '구매', loc: '시즌상점', title: '비결 지원 상자 구매' },
    { id: 'w_4', freq: 'weekly', type: '구매', loc: '시즌상점', title: '작은 단백전 상자 구매' },
    { id: 'w_6', freq: 'weekly', type: '구매', loc: '강호령 상점', title: '비결 지원 상자 구매' },
    { id: 'w_9', freq: 'weekly', type: '활동', loc: '동맹', title: '화물 운송' },
    { id: 'w_13', freq: 'weekly', type: '활동', loc: '무역', title: '시매사 교환' },
    { id: 'w_10', freq: 'weekly', type: '구매', loc: '시즌상점', title: '기술 필기 구매' },
    { id: 'w_11', freq: 'weekly', type: '구매', loc: '기술양성', title: '기술 선택 상자 구매' },
    { id: 'w_12', freq: 'weekly', type: '구매', loc: '심득교환', title: '심법 선택 상자 구매' },
    // [일일]
    { id: 'd_2', freq: 'daily', type: '활동', loc: '현상령', title: '수배/복수 현상령' },
    { id: 'd_4', freq: 'daily', type: '활동', loc: '꿈속', title: '엽비휴와 도박 상기' },
    { id: 'd_5', freq: 'daily', type: '활동', loc: '필드', title: '비결 재료 채집' },
    { id: 'd_3', freq: 'daily', type: '활동', loc: '강호호령', title: '문파 호령' }
];

// 2. 타이머 정의 (텍스트 변경 유지)
const TIMERS = [
    { id: 'daily', type: 'reset', freq: 'daily', name: '일일 숙제', desc: '매일 6시 갱신', badgeClass: 'status-ing' },
    { id: 'weekly', type: 'reset', freq: 'weekly', name: '주간 숙제', desc: '매주 월 6시 갱신', badgeClass: 'status-ing' },
    { id: 'monthly', type: 'reset', freq: 'monthly', name: '월간 숙제', desc: '매월 1일 6시 갱신', badgeClass: 'status-ing' },
    { id: 'event_winter', type: 'event', name: '겨울의 선율', desc: '26년 1월 9일 6시까지', startTime: '2024-12-25T00:00:00', endTime: '2026-01-09T06:00:00', badgeClass: 'status-event' }
];

const STORAGE_KEY = 'wwm_checklist_v3';

function getChecklistStatus() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : { checked: {} };
    } catch (e) {
        return { checked: {} };
    }
}

function saveChecklistStatus(status) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
    updateTimers(); 
}

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
    const statusData = getChecklistStatus(); 

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
        let progressHtml = ""; 

        // [유지] 한글 카테고리명 변환 (사용자 커스텀: 필수)
        let categoryLabel = "";
        if (timer.type === 'event') {
            categoryLabel = "이벤트";
        } else {
            const labelMap = {
                'daily': '필수',
                'weekly': '필수',
                'monthly': '필수'
            };
            categoryLabel = labelMap[timer.freq] || timer.freq;
        }

        if (timer.type === 'reset') {
            const target = getNextResetTime(timer.freq, now);
            const diff = target - now;
            timeStr = formatDuration(diff);
            if (diff < 3 * 60 * 60 * 1000) isUrgent = true;

            const tasks = TASK_DATA.filter(t => t.freq === timer.freq);
            const total = tasks.length;
            const done = tasks.filter(t => statusData.checked[t.id]).length;
            
            if (total > 0) {
                const isAllDone = done === total;
                const color = isAllDone ? 'var(--wuxia-accent-gold)' : '#888';
                progressHtml = `<span style="font-size:0.8em; color:${color}; margin-left:5px; font-weight:bold;">(${done}/${total})</span>`;
                
                if(isAllDone) row.classList.add('row-completed');
                else row.classList.remove('row-completed');
            }
        } 
        else if (timer.type === 'event') {
            const start = new Date(timer.startTime);
            const end = new Date(timer.endTime);
            if (now < start) timeStr = "시작 전";
            else if (now > end) timeStr = "종료됨";
            else {
                const diff = end - now;
                timeStr = formatDuration(diff);
                if (diff < 24 * 60 * 60 * 1000) isUrgent = true;
            }
        }

        row.innerHTML = `
            <div class="timer-left">
                <div class="timer-title">
                    ${timer.name}
                    ${progressHtml}
                </div>
                <div class="timer-status-row">
                    <span class="status-badge ${timer.badgeClass}">
                        ${categoryLabel}
                    </span>
                    <span style="color:#eee;">|</span>
                    <span>${timer.desc}</span>
                </div>
            </div>
            <div class="timer-right">
                <div class="timer-clock" style="color: ${isUrgent ? 'var(--wuxia-accent-red)' : '#444'}">
                    ${timeStr}
                </div>
            </div>
        `;
    });
}

function openTimerSheet(timer) {
    const modal = document.getElementById('timer-sheet-modal');
    if (!modal) return;
    const contentBox = modal.querySelector('.sheet-body-content') || modal.querySelector('#timer-detail-content');

    const statusData = getChecklistStatus();

    let html = `<div style="text-align:center; margin-bottom:15px;">
                    <h3 style="color:var(--wuxia-accent-gold); margin:0;">${timer.name}</h3>
                    <p style="font-size:0.85em; color:#888;">${timer.desc}</p>
                </div>`;

    if (timer.type === 'reset') {
        const tasks = TASK_DATA.filter(t => t.freq === timer.freq);
        if (tasks.length > 0) {
            html += `<div class="task-list-wrapper">`;
            tasks.forEach(task => {
                const isChecked = statusData.checked[task.id];
                // [추가] 초기 정렬 적용 (체크됨=1=하단, 안됨=0=상단)
                const orderStyle = isChecked ? 'style="order:1;"' : 'style="order:0;"';
                
                html += `
                    <div class="task-item ${isChecked ? 'completed' : ''}" ${orderStyle} onclick="toggleTaskCheck('${task.id}', this)">
                        <div style="flex:1;">
                            <span class="task-loc">[${task.loc}]</span>
                            <span class="task-title">${task.title}</span>
                        </div>
                        <div class="task-check-icon">${isChecked ? '✔' : ''}</div>
                    </div>`;
            });
            html += `</div>`;
        } else {
            html += `<p style="text-align:center; color:#999;">등록된 내용이 없습니다.</p>`;
        }
    } else if (timer.type === 'event') {
        const start = timer.startTime.split('T')[0];
        const end = timer.endTime.split('T')[0];
        html += `
            <div style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
                <p><strong>기간:</strong> ${start} ~ ${end}</p>
                <p style="line-height:1.6; color:#555; margin-top:10px;">${timer.desc}</p>
            </div>
        `;
    }
    contentBox.innerHTML = html;
    modal.classList.add('show');
}

function toggleTaskCheck(taskId, el) {
    const statusData = getChecklistStatus();
    
    if (statusData.checked[taskId]) {
        // 체크 해제
        delete statusData.checked[taskId];
        el.classList.remove('completed');
        el.querySelector('.task-check-icon').innerText = '';
        el.style.order = 0; // [추가] 위로 올림
    } else {
        // 체크 완료
        statusData.checked[taskId] = true;
        el.classList.add('completed');
        el.querySelector('.task-check-icon').innerText = '✔';
        el.style.order = 1; // [추가] 아래로 내림
    }
    saveChecklistStatus(statusData);
}

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

function formatDuration(ms) {
    if (ms <= 0) return "00:00:00";
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    if (d > 0) return `${d}일 ${hStr}:${mStr}:${sStr}`;
    return `${hStr}:${mStr}:${sStr}`;
}

function closeTimerSheet(e) {
    const modal = document.getElementById('timer-sheet-modal');
    if (modal && (!e || e.target === modal)) modal.classList.remove('show');
}
