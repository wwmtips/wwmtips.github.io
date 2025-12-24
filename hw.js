/* hw.js */
(function() {
    // 1. 함수를 전역(window)에 등록하여 외부에서 부를 수 있게 함
    window.initHomeworkChecklist = function() {
        // 방어 코드: HTML이 로드되지 않았으면 중단
        if (!document.getElementById('list-daily')) return;

        console.log("퀘스트 리스트 초기화 시작...");

        // --- 데이터 및 로직 시작 ---
        const taskData = [
            // [월간]
            { id: 'm_1', freq: 'monthly', type: '구매', loc: '공명상점', title: '음의 선율 구매' },
            { id: 'm_2', freq: 'monthly', type: '구매', loc: '공명상점', title: '선율 할인권 구매' }
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
            { id: 'd_4', freq: 'daily', type: '활동', loc: '꿈속의 불선선', title: '엽비휴와 도박 상기' },
            { id: 'd_5', freq: 'daily', type: '활동', loc: '각 지역', title: '비결 재료 채집'},
            { id: 'd_3', freq: 'daily', type: '활동', loc: '강호호령', title: '문파 호령' }
        ];

        const STORAGE_KEY = 'wwm_checklist_v3';
        let status = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
            checked: {},
            lastDailyReset: 0,
            lastWeeklyReset: 0,
            lastMonthlyReset: 0
        };

        function checkReset() {
            const now = new Date();
            // A. 일일 리셋
            let dailyTarget = new Date(now);
            if (now.getHours() < 6) dailyTarget.setDate(dailyTarget.getDate() - 1);
            dailyTarget.setHours(6, 0, 0, 0);
            if (status.lastDailyReset < dailyTarget.getTime()) {
                resetTasks('daily');
                status.lastDailyReset = now.getTime();
            }
            // B. 주간 리셋
            let weeklyTarget = new Date(now);
            const day = weeklyTarget.getDay();
            const diff = weeklyTarget.getDate() - day + (day === 0 ? -6 : 1);
            weeklyTarget.setDate(diff);
            weeklyTarget.setHours(6, 0, 0, 0);
            if (day === 1 && now.getHours() < 6) weeklyTarget.setDate(weeklyTarget.getDate() - 7);
            if (weeklyTarget > now) weeklyTarget.setDate(weeklyTarget.getDate() - 7);
            if (status.lastWeeklyReset < weeklyTarget.getTime()) {
                resetTasks('weekly');
                status.lastWeeklyReset = now.getTime();
            }
            // C. 월간 리셋
            let monthlyTarget = new Date(now);
            monthlyTarget.setDate(1);
            monthlyTarget.setHours(6, 0, 0, 0);
            if (now.getDate() === 1 && now.getHours() < 6) monthlyTarget.setMonth(monthlyTarget.getMonth() - 1);
            if (monthlyTarget > now) monthlyTarget.setMonth(monthlyTarget.getMonth() - 1);
            if (status.lastMonthlyReset < monthlyTarget.getTime()) {
                resetTasks('monthly');
                status.lastMonthlyReset = now.getTime();
            }
            saveStatus();
        }

        function resetTasks(freqType) {
            const idsToReset = taskData.filter(t => t.freq === freqType).map(t => t.id);
            idsToReset.forEach(id => delete status.checked[id]);
        }

        function saveStatus() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
            updateProgress();
        }

        function updateProgress() {
            ['daily', 'weekly', 'monthly'].forEach(freq => {
                const tasks = taskData.filter(t => t.freq === freq);
                const total = tasks.length;
                const done = tasks.filter(t => status.checked[t.id]).length;
                const el = document.getElementById(`prog-${freq}`);
                if (el) el.textContent = `${done}/${total}`;
            });
        }

        function renderList(freq, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            const tasks = taskData.filter(t => t.freq === freq);

            tasks.forEach(task => {
                const isChecked = status.checked[task.id];
                const card = document.createElement('div');
                card.className = `quest-card ${isChecked ? 'completed' : ''}`;
                card.onclick = () => toggleTask(task.id, card);
                card.innerHTML = `
                    <div class="quest-info">
                        <div class="quest-badges">
                            <span class="badge badge-loc">${task.loc}</span>
                            <span class="badge badge-type">${task.type}</span>
                        </div>
                        <div class="quest-name">${task.title}</div>
                    </div>
                    <div class="check-btn">${isChecked ? '✔' : ''}</div>
                `;
                container.appendChild(card);
            });
        }

        function toggleTask(id, cardEl) {
            const isDone = !status.checked[id];
            if (isDone) {
                status.checked[id] = true;
                cardEl.classList.add('completed');
                cardEl.querySelector('.check-btn').textContent = '✔';
            } else {
                delete status.checked[id];
                cardEl.classList.remove('completed');
                cardEl.querySelector('.check-btn').textContent = '';
            }
            saveStatus();
        }

        function formatTimeLeft(ms) {
            const days = Math.floor(ms / (1000 * 60 * 60 * 24));
            const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            if (days > 0) return `${days}일 ${hours}시간`;
            return `${hours}시간 ${minutes}분`;
        }

        let timerInterval;
        function updateAllTimers() {
            const now = new Date();
            let nextDaily = new Date(now);
            nextDaily.setHours(6, 0, 0, 0);
            if (now >= nextDaily) nextDaily.setDate(nextDaily.getDate() + 1);

            let nextWeekly = new Date(now);
            nextWeekly.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
            nextWeekly.setHours(6, 0, 0, 0);
            if (nextWeekly <= now) nextWeekly.setDate(nextWeekly.getDate() + 7);

            let nextMonthly = new Date(now);
            nextMonthly.setMonth(nextMonthly.getMonth() + 1);
            nextMonthly.setDate(1);
            nextMonthly.setHours(6, 0, 0, 0);

            const dEl = document.getElementById('timer-daily');
            const wEl = document.getElementById('timer-weekly');
            const mEl = document.getElementById('timer-monthly');
            if(dEl) dEl.textContent = formatTimeLeft(nextDaily - now);
            if(wEl) wEl.textContent = formatTimeLeft(nextWeekly - now);
            if(mEl) mEl.textContent = formatTimeLeft(nextMonthly - now);
        }

        // 실행
        checkReset();
        renderList('daily', 'list-daily');
        renderList('weekly', 'list-weekly');
        renderList('monthly', 'list-monthly');
        updateProgress();
        updateAllTimers();
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateAllTimers, 60000);
    };

    // 페이지가 이미 로드된 상태면 바로 실행 (일반적인 경우)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if(document.getElementById('list-daily')) window.initHomeworkChecklist();
    } else {
        document.addEventListener('DOMContentLoaded', window.initHomeworkChecklist);
    }
})();
