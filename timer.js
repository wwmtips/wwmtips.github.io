/**
 * 강호 시시각각(時時刻刻) - 최종 완성본
 * 기능: 초 단위 숨김(1분 미만일 때만 표시), 논검/불꽃놀이/숙제 통합
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
            { id: 'w_13', freq: 'weekly', type: '구매', loc: '유파시련', title: '심법/비결 상자 구매' },
    // [일일]
    { id: 'd_2', freq: 'daily', type: '활동', loc: '현상령', title: '수배/복수 현상령' },
    { id: 'd_4', freq: 'daily', type: '활동', loc: '꿈속', title: '엽비휴의 도박 상기판' },
    { id: 'd_5', freq: 'daily', type: '활동', loc: '필드', title: '비결 재료 채집' },
    { id: 'd_6', freq: 'daily', type: '활동', loc: '필드', title: '야생마 포획' },
    { id: 'd_7', freq: 'daily', type: '활동', loc: '공덕지', title: '동전 던지고 소원 빌기' },
    { id: 'd_3', freq: 'daily', type: '활동', loc: '강호호령', title: '문파 호령' }
];

// 2. 타이머 정의
const TIMERS = [
    { id: 'daily', type: 'reset', freq: 'daily', name: '일일 숙제', desc: '매일 6시 갱신', badgeClass: 'status-ing' },
    { id: 'weekly', type: 'reset', freq: 'weekly', name: '주간 숙제', desc: '매주 월 6시 갱신', badgeClass: 'status-ing' },
    { id: 'monthly', type: 'reset', freq: 'monthly', name: '월간 숙제', desc: '매월 1일 6시 갱신', badgeClass: 'status-ing' },
    
    // 논검 (PvP)
    {
        id: 'pvp_daily',
        type: 'daily_operating', 
        name: '논검 (PvP)',
        desc: '매일 07:00 ~ 05:00',
        badgeClass: 'status-ing'
    },

    // 불꽃놀이 (토/일)
    { 
        id: 'fireworks_weekly', 
        type: 'schedule', 
        name: '불꽃놀이 축제', 
        desc: '토 21:30 / 일 09:30', 
        badgeClass: 'status-event',
        schedules: [
            { day: 6, hour: 21, min: 30, duration: 30 },
            { day: 0, hour: 9, min: 30, duration: 30 }
        ]
    },

    { id: 'event_winter', type: 'event', name: '겨울의 선율', desc: '한정 미니 패스', startTime: '2024-12-25T00:00:00', endTime: '2026-01-09T06:00:00', badgeClass: 'status-event' }
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
        let statusBadgeText = "";
        let currentBadgeClass = timer.badgeClass;

        // 1. 초기화형 타이머 (숙제)
        if (timer.type === 'reset') {
            const target = getNextResetTime(timer.freq, now);
            const diff = target - now;
            timeStr = formatDuration(diff);
            
            // 3시간 미만이면 긴급 (붉은색 글씨)
            if (diff < 3 * 60 * 60 * 1000) isUrgent = true;

            const labelMap = { 'daily': '필수', 'weekly': '필수', 'monthly': '필수' };
            statusBadgeText = labelMap[timer.freq] || timer.freq;

            const tasks = TASK_DATA.filter(t => t.freq === timer.freq);
            const total = tasks.length;
            if (total > 0) {
                const done = tasks.filter(t => statusData.checked[t.id]).length;
                const isAllDone = done === total;
                const color = isAllDone ? 'var(--wuxia-accent-gold)' : '#888';
                progressHtml = `<span style="font-size:0.8em; color:${color}; margin-left:5px; font-weight:bold;">(${done}/${total})</span>`;
                
                if(isAllDone) row.classList.add('row-completed');
                else row.classList.remove('row-completed');
            }
        } 
        // 2. 기간 한정 이벤트
        else if (timer.type === 'event') {
            statusBadgeText = "이벤트";
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
        // 3. 복합 일정 (불꽃놀이)
        else if (timer.type === 'schedule') {
            const result = calculateSchedule(timer.schedules, now);
            timeStr = result.timeStr;
            statusBadgeText = result.statusText;
            if (result.isUrgent) {
                isUrgent = true;
                currentBadgeClass = 'status-urgent'; 
            } else if (result.isRunning) {
                currentBadgeClass = 'status-ing';    
            } else {
                currentBadgeClass = 'status-end';    
            }
        }
        // 4. 매일 운영 시간형 (논검 PvP)
        else if (timer.type === 'daily_operating') {
            const result = calculateDailyOperating(now);
            timeStr = result.timeStr;
            statusBadgeText = result.statusText;
            currentBadgeClass = result.badgeClass;
            if (result.isUrgent) isUrgent = true;
        }

        row.innerHTML = `
            <div class="timer-left">
                <div class="timer-title">
                    ${timer.name}
                    ${progressHtml}
                </div>
                <div class="timer-status-row">
                    <span class="status-badge ${currentBadgeClass}">
                        ${statusBadgeText}
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
        
        if (isUrgent) row.classList.add('timer-urgent-blink');
        else row.classList.remove('timer-urgent-blink');
    });
}

// [로직] 매일 운영/휴장 상태 계산
function calculateDailyOperating(now) {
    const h = now.getHours();
    
    // 휴장 시간: 05:00 ~ 06:59
    if (h >= 5 && h < 7) {
        const target = new Date(now);
        target.setHours(7, 0, 0, 0);
        const diff = target - now;
        const isUrgent = diff <= 10 * 60 * 1000;
        
        return {
            statusText: '휴장',
            timeStr: formatDuration(diff),
            badgeClass: 'status-end',
            isUrgent: isUrgent
        };
    } 
    // 운영 시간: 07:00 ~ 04:59
    else {
        const target = new Date(now);
        if (h >= 7) target.setDate(target.getDate() + 1);
        target.setHours(5, 0, 0, 0);
        
        const diff = target - now;
        const isUrgent = diff <= 10 * 60 * 1000;
        
        return {
            statusText: '운영 중',
            timeStr: formatDuration(diff),
            badgeClass: 'status-ing',
            isUrgent: isUrgent
        };
    }
}

// [로직] 다중 일정 계산
function calculateSchedule(schedules, now) {
    let minDiff = Infinity;
    let isRunning = false;
    let endTime = null;

    const currentDay = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay);
    sunday.setHours(0,0,0,0);

    for (let w = 0; w <= 1; w++) {
        schedules.forEach(sch => {
            const start = new Date(sunday);
            start.setDate(sunday.getDate() + sch.day + (w * 7));
            start.setHours(sch.hour, sch.min, 0, 0);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + sch.duration);

            if (now >= start && now < end) {
                isRunning = true;
                endTime = end;
            }

            if (start > now) {
                const diff = start - now;
                if (diff < minDiff) minDiff = diff;
            }
        });
        if (isRunning) break;
    }

    if (isRunning) {
        return {
            statusText: '진행 중',
            timeStr: formatDuration(endTime - now),
            isRunning: true,
            isUrgent: false
        };
    } else {
        const isUrgent = minDiff <= 10 * 60 * 1000;
        return {
            statusText: '진행 전',
            timeStr: formatDuration(minDiff),
            isRunning: false,
            isUrgent: isUrgent
        };
    }
}

function openTimerSheet(timer) {
    const modal = document.getElementById('timer-sheet-modal');
    if (!modal) return;
    const contentBox = modal.querySelector('.sheet-body-content') || modal.querySelector('#timer-detail-content');

    let html = `<div style="text-align:center; margin-bottom:15px;">
                    <h3 style="color:var(--wuxia-accent-gold); margin:0;">${timer.name}</h3>
                    <p style="font-size:0.85em; color:#888;">${timer.desc}</p>
                </div>`;

    if (timer.type === 'reset') {
        const statusData = getChecklistStatus();
        const tasks = TASK_DATA.filter(t => t.freq === timer.freq);
        if (tasks.length > 0) {
            html += `<div class="task-list-wrapper">`;
            tasks.forEach(task => {
                const isChecked = statusData.checked[task.id];
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
            html += `<p style="text-align:center; color:#999;">체크리스트가 없습니다.</p>`;
        }
    } else {
        html += `
            <div style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
                <p style="line-height:1.6; color:#555; margin:0;">${timer.desc}</p>
            </div>
        `;
    }
    contentBox.innerHTML = html;
    modal.classList.add('show');
}

function toggleTaskCheck(taskId, el) {
    const statusData = getChecklistStatus();
    if (statusData.checked[taskId]) {
        delete statusData.checked[taskId];
        el.classList.remove('completed');
        el.querySelector('.task-check-icon').innerText = '';
        el.style.order = 0;
    } else {
        statusData.checked[taskId] = true;
        el.classList.add('completed');
        el.querySelector('.task-check-icon').innerText = '✔';
        el.style.order = 1;
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

// ★★★ [핵심 수정] 시간 표시 포맷 변경 함수 ★★★
function formatDuration(ms) {
    if (ms <= 0) return "종료됨"; // 0 이하면 종료 표시

    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);

    // [조건] 1분 미만: 초 단위만 표시 (예: 45초)
    if (ms < 60 * 1000) {
        return `${s}초`;
    }

    // [조건] 1분 이상: 초 제거 (일/시간/분)
    // 예: 1일 2시간 30분 / 2시간 30분 / 30분
    if (d > 0) {
        return `${d}일 ${h}시간 ${m}분`;
    } else if (h > 0) {
        return `${h}시간 ${m}분`;
    } else {
        return `${m}분`;
    }
}

function closeTimerSheet(e) {
    const modal = document.getElementById('timer-sheet-modal');
    if (modal && (!e || e.target === modal)) modal.classList.remove('show');
}
