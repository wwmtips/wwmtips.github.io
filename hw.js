/* homework.js */

function initHomeworkChecklist() {
    // 1. 방어 코드
    if (!document.getElementById('list-daily')) return;

    // 2. 데이터 정의
    const taskData = [
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
              { id: 'w_7', freq: 'weekly', type: '활동', loc: '동맹', title: '화물 운송' },
              { id: 'w_8', freq: 'weekly', type: '활동', loc: '무역', title: '시매사 교환' },
              
                { id: 'w_10', freq: 'weekly', type: '구매', loc: '시즌상점', title: '기술 필기 구매' },
                { id: 'w_11', freq: 'weekly', type: '구매', loc: '기술양성', title: '기술 선택 상자 구매' },
                { id: 'w_12', freq: 'weekly', type: '구매', loc: '심득교환', title: '심법 선택 상자 구매' },

                // [일일]
                { id: 'd_2', freq: 'daily', type: '활동', loc: '현상령', title: '수배/복수 현상령' },
                { id: 'd_3', freq: 'daily', type: '활동', loc: '강호호령', title: '문파 호령' },
            ];
    
    // 3. 상태 관리
    const STORAGE_KEY = 'wwm_checklist_v3';
    let status = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { 
        checked: {}, 
        lastDailyReset: 0,
        lastWeeklyReset: 0,
        lastMonthlyReset: 0
    };

    // 4. 초기화 로직 (오전 6시 기준)
    function checkReset() {
        const now = new Date();

        // A. 일일 리셋 (매일 오전 6시)
        let dailyTarget = new Date(now);
        // 현재 시간이 오전 6시 전이라면, 타겟은 어제 6시
        if (now.getHours() < 6) dailyTarget.setDate(dailyTarget.getDate() - 1);
        dailyTarget.setHours(6, 0, 0, 0);

        if (status.lastDailyReset < dailyTarget.getTime()) {
            resetTasks('daily');
            status.lastDailyReset = now.getTime();
        }

        // B. 주간 리셋 (매주 월요일 오전 6시)
        let weeklyTarget = new Date(now);
        const day = weeklyTarget.getDay(); // 0(일) ~ 6(토)
        // 이번 주 월요일 계산
        const diff = weeklyTarget.getDate() - day + (day === 0 ? -6 : 1); 
        weeklyTarget.setDate(diff);
        weeklyTarget.setHours(6, 0, 0, 0);
        
        // 오늘이 월요일인데 6시 전이라면, 저번주 월요일이 타겟
        if (day === 1 && now.getHours() < 6) {
            weeklyTarget.setDate(weeklyTarget.getDate() - 7);
        }
        // 계산된 월요일이 미래라면 저번주로 보정
        if (weeklyTarget > now) {
            weeklyTarget.setDate(weeklyTarget.getDate() - 7);
        }

        if (status.lastWeeklyReset < weeklyTarget.getTime()) {
            resetTasks('weekly');
            status.lastWeeklyReset = now.getTime();
        }

        // C. 월간 리셋 (매월 1일 오전 6시)
        let monthlyTarget = new Date(now);
        monthlyTarget.setDate(1);
        monthlyTarget.setHours(6, 0, 0, 0);
        
        // 오늘이 1일인데 6시 전이라면, 저번달 1일이 타겟
        if (now.getDate() === 1 && now.getHours() < 6) {
            monthlyTarget.setMonth(monthlyTarget.getMonth() - 1);
        }
        // 계산된 1일이 미래라면 저번달로 보정
        if (monthlyTarget > now) {
            monthlyTarget.setMonth(monthlyTarget.getMonth() - 1);
        }

        if (status.lastMonthlyReset < monthlyTarget.getTime()) {
            resetTasks('monthly');
            status.lastMonthlyReset = now.getTime();
        }

        saveStatus();
    }

    // 특정 타입의 체크만 해제하는 헬퍼 함수
    function resetTasks(freqType) {
        const idsToReset = taskData.filter(t => t.freq === freqType).map(t => t.id);
        idsToReset.forEach(id => delete status.checked[id]);
        console.log(`${freqType} 퀘스트가 초기화되었습니다. (오전 6시 기준)`);
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
            
            card.addEventListener('click', function() {
                toggleTask(task.id, card);
            });

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

    function updateTimer() {
        const el = document.getElementById('next-reset-time');
        if(!el) return;
        const now = new Date();
        let target = new Date(now);
        // 다음 오전 6시 계산
        target.setHours(6, 0, 0, 0);
        if (now >= target) target.setDate(target.getDate() + 1);
        
        const diff = target - now;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        el.textContent = `${h}시간 ${m}분 후`;
    }

    // 실행
    checkReset();
    renderList('daily', 'list-daily');
    renderList('weekly', 'list-weekly');
    renderList('monthly', 'list-monthly');
    updateProgress();
    updateTimer();
}
