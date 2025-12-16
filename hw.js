// script.js 에 추가하세요

/* =========================================
   숙제(Checklist) 기능 초기화 함수
   ========================================= */
function initHomeworkChecklist() {
    // DOM이 생성되었는지 확인 (방어 코드)
    if (!document.getElementById('list-daily')) return;

    // 1. 데이터 정의
    const taskData = [
                // [월간]
                { id: 'm_1', freq: 'monthly', type: '구매', loc: '공명상점', title: '음의 선율 구매' },
                { id: 'm_2', freq: 'monthly', type: '구매', loc: '공명상점', title: '선율 할인권 교환' },
                
                // [주간]
                { id: 'w_1', freq: 'weekly', type: '구매', loc: '강호백진', title: '음의 선율 구매' },
                { id: 'w_2', freq: 'weekly', type: '구매', loc: '시즌상점', title: '심법 심득 상자 구매' },
                { id: 'w_3', freq: 'weekly', type: '구매', loc: '시즌상점', title: '비결 지원 상자 구매' },
                { id: 'w_4', freq: 'weekly', type: '구매', loc: '시즌상점', title: '작은 단백전 상자 구매' },
                { id: 'w_5', freq: 'weekly', type: '구매', loc: '시즌상점', title: '음의 선율 구매' },
                { id: 'w_6', freq: 'weekly', type: '구매', loc: '강호령 상점', title: '비결 지원 상자 구매' },
                { id: 'w_7', freq: 'weekly', type: '전투', loc: '협경', title: '협경 클리어' },
                { id: 'w_8', freq: 'weekly', type: '전투', loc: '검무장', title: '검무장 클리어' },
              
                { id: 'w_10', freq: 'weekly', type: '구매', loc: '시즌상점', title: '기술 필기 구매' },
                { id: 'w_11', freq: 'weekly', type: '구매', loc: '기술양성', title: '문예/의술/선택 상자 구매' },
                { id: 'w_12', freq: 'weekly', type: '구매', loc: '십득교환', title: '심법 선택 상자 구매' },

                // [일일]
                { id: 'd_2', freq: 'daily', type: '활동', loc: '현상령', title: '수배/복수 현상령' },
                { id: 'd_3', freq: 'daily', type: '활동', loc: '강호호령', title: '문파 호령' },
            ];

    const STORAGE_KEY = 'wwm_checklist_v3';
    let status = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { checked: {}, lastDailyReset: 0 };

    function checkReset() {
        const now = new Date();
        let currentResetTime = new Date(now);
        if (now.getHours() < 5) currentResetTime.setDate(currentResetTime.getDate() - 1);
        currentResetTime.setHours(5, 0, 0, 0);

        if (status.lastDailyReset < currentResetTime.getTime()) {
            const dailyIds = taskData.filter(t => t.freq === 'daily').map(t => t.id);
            dailyIds.forEach(id => delete status.checked[id]);
            status.lastDailyReset = now.getTime();
            saveStatus();
        }
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
            
            // 클릭 이벤트 직접 연결
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
        target.setHours(5, 0, 0, 0);
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
