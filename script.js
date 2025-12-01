// 전역 변수
let globalData = { items: [], quiz: [], quests: [] };

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // 데이터 가져오기 실행

    // 1. 헤더 통합 검색 이벤트 연결
    const headerSearch = document.getElementById("header-search-input");
    if (headerSearch) {
        headerSearch.addEventListener("input", handleGlobalSearch);
        headerSearch.addEventListener("blur", () => {
            setTimeout(() => {
                const results = document.getElementById("global-search-results");
                if (results) results.style.display = 'none';
            }, 200);
        });
    }

    // 2. 족보 내부 필터링 이벤트 연결
    const quizLocalSearch = document.getElementById("quiz-local-search");
    if (quizLocalSearch) {
        quizLocalSearch.addEventListener("input", (e) => {
            renderQuizTable(filterQuizData(e.target.value));
        });
    }

    // [NEW] 3. URL 파라미터 체크하여 탭 자동 전환
    // 예: wwm.tips?tab=quiz -> 족보 탭 열기
    // 예: wwm.tips?tab=quest -> 퀘스트 탭 열기
    checkUrlParams();
});

// [NEW] URL 파라미터 처리 함수
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); // ?tab=값 가져오기

    if (tab === 'quiz') {
        switchTab('quiz');
    } else if (tab === 'quest') {
        switchTab('quest');
    } else {
        // 파라미터가 없으면 기본값 홈
        switchTab('home');
    }
}

// =========================================
// 1. 데이터 로드 및 초기화
// =========================================
function loadData() {
    // 로컬/서버 환경에 맞춰 경로 설정 (상대 경로 권장)
    Promise.all([
        fetch('json/data.json').then(res => res.json()),
        fetch('json/quests.json').then(res => res.json())
    ])
    .then(([mainData, questList]) => {
        globalData = {
            items: mainData.items || [],
            quiz: mainData.quiz || [],
            quests: questList || []
        };

        console.log("데이터 로드 완료:", globalData);

        // 1. 족보 초기화
        renderQuizTable(globalData.quiz);
        const counter = document.getElementById('quiz-counter-area');
        if(counter) counter.innerText = `총 ${globalData.quiz.length}개의 족보가 등록되었습니다.`;

        // 2. 퀘스트 탭 리스트 초기화
        renderQuestList(globalData.quests);

        // 3. 홈 화면 "주요 퀘스트" 리스트 초기화
        renderHomeQuests(globalData.quests);
    })
    .catch(error => {
        console.error("데이터 로드 중 오류 발생:", error);
    });
}

// =========================================
// [NEW] 홈 화면 퀘스트 렌더링 함수
// =========================================
function renderHomeQuests(quests) {
    const container = document.getElementById('recent-list');
    if (!container) return;

    container.innerHTML = '';

    const recentQuests = quests.slice(0, 6);

    if (recentQuests.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">표시할 퀘스트가 없습니다.</div>';
        return;
    }

    recentQuests.forEach(quest => {
        const card = document.createElement('div');
        card.className = 'quest-card'; 
        
        card.onclick = () => {
            switchTab('quest');
            loadQuestDetail(quest.filepath);
        };

        card.innerHTML = `
            <div class="quest-icon-wrapper">
                <img src="${quest.iconpath}" alt="icon" onerror="this.src='images/logo.png'">
            </div>
            <div class="quest-info">
                <div class="quest-name">${quest.name}</div>
                <div class="quest-type">${quest.type}</div>
            </div>
            <div class="quest-badge">${quest.location}</div>
        `;
        container.appendChild(card);
    });
}

// =========================================
// 2. 탭 전환 (SPA 방식)
// =========================================
function switchTab(tabName) {
    const views = ['view-home', 'view-quiz', 'view-quest'];
    const navs = ['nav-home', 'nav-quiz', 'nav-quest'];

    // 모든 뷰 숨기기 & 네비게이션 비활성화
    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    navs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('active');
    });

    // 선택된 탭 활성화
    if (tabName === 'home') {
        document.getElementById('view-home').style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
        // URL 주소 업데이트 (선택 사항: 뒤로가기 지원을 위해)
        history.pushState(null, null, '?tab=home'); 
    } else if (tabName === 'quiz') {
        document.getElementById('view-quiz').style.display = 'block';
        document.getElementById('nav-quiz').classList.add('active');
        history.pushState(null, null, '?tab=quiz');
    } else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');
        showQuestList();
        history.pushState(null, null, '?tab=quest');
    }
}

// =========================================
// 3. 족보 관련 로직
// =========================================
function renderQuizTable(data, keyword = '') {
    const tbody = document.getElementById('quiz-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding:20px; color:#888;">결과가 없습니다.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        let hint = item.hint;
        let answer = item.answer;

        if (keyword) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            hint = hint.replace(regex, '<span class="highlight">$1</span>');
            answer = answer.replace(regex, '<span class="highlight">$1</span>');
        }

        tr.innerHTML = `<td>${hint}</td><td>${answer}</td>`;
        tbody.appendChild(tr);
    });
}

function filterQuizData(keyword) {
    keyword = keyword.trim().toLowerCase();
    if (!keyword) return globalData.quiz;
    return globalData.quiz.filter(item => 
        item.hint.toLowerCase().includes(keyword) || 
        item.answer.toLowerCase().includes(keyword)
    );
}

// =========================================
// 4. 퀘스트 탭 관련 로직
// =========================================
function renderQuestList(quests) {
    const container = document.getElementById('quest-grid-container');
    if (!container) return;
    container.innerHTML = '';

    if (!quests || quests.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">퀘스트 정보가 없습니다.</div>';
        return;
    }

    quests.forEach(quest => {
        const card = document.createElement('div');
        card.className = 'quest-card';
        card.onclick = () => loadQuestDetail(quest.filepath);

        card.innerHTML = `
            <div class="quest-icon-wrapper">
                <img src="${quest.iconpath}" alt="icon" onerror="this.src='images/logo.png'">
            </div>
            <div class="quest-info">
                <div class="quest-name">${quest.name}</div>
                <div class="quest-type">${quest.type}</div>
            </div>
            <div class="quest-badge">${quest.location}</div>
        `;
        container.appendChild(card);
    });
}

function loadQuestDetail(filepath) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    listView.style.display = 'none';
    detailView.style.display = 'block';
    contentBox.innerHTML = '<div style="text-align:center; padding:50px;">로딩 중...</div>';

    fetch(filepath)
        .then(response => {
            if (!response.ok) throw new Error("파일 없음");
            return response.text();
        })
        .then(html => {
            contentBox.innerHTML = html;
        })
        .catch(err => {
            contentBox.innerHTML = `<div style="text-align:center; color:red; padding:20px;">내용 로드 실패<br><small>(${err.message})</small></div>`;
        });
}

function showQuestList() {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    if(listView && detailView) {
        listView.style.display = 'block';
        detailView.style.display = 'none';
    }
}

// =========================================
// 5. 통합 검색 핸들러
// =========================================
function handleGlobalSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    const resultContainer = document.getElementById("global-search-results");
    if (!resultContainer) return;

    if (!keyword) {
        resultContainer.style.display = 'none';
        return;
    }

    let resultsHTML = '';

    // 족보 검색
    const quizResults = globalData.quiz.filter(q => 
        q.hint.toLowerCase().includes(keyword) || q.answer.toLowerCase().includes(keyword)
    );
    if (quizResults.length > 0) {
        resultsHTML += `<div class="search-category-title">족보</div>`;
        quizResults.slice(0, 3).forEach(item => {
            resultsHTML += `
                <div class="search-result-item" onclick="selectGlobalResult('${item.hint}')">
                    <span class="badge quiz">족보</span>
                    <span class="result-text">${item.hint} - ${item.answer}</span>
                </div>
            `;
        });
    }

    // 퀘스트 검색
    if (globalData.quests) {
        const questResults = globalData.quests.filter(q => 
            q.name.toLowerCase().includes(keyword) || 
            q.location.toLowerCase().includes(keyword)
        );

        if (questResults.length > 0) {
            resultsHTML += `<div class="search-category-title">퀘스트</div>`;
            questResults.slice(0, 3).forEach(quest => {
                resultsHTML += `
                    <div class="search-result-item" onclick="selectQuestResult('${quest.filepath}')">
                        <span class="badge item">퀘스트</span> 
                        <span class="result-text">${quest.name}</span>
                    </div>
                `;
            });
        }
    }

    if (resultsHTML) {
        resultContainer.innerHTML = resultsHTML;
        resultContainer.style.display = 'block';
    } else {
        resultContainer.innerHTML = `<div class="no-result" style="padding:15px; text-align:center; color:#888;">결과 없음</div>`;
        resultContainer.style.display = 'block';
    }
}

function selectGlobalResult(keyword) {
    switchTab('quiz');
    const localInput = document.getElementById("quiz-local-search");
    if(localInput) {
        localInput.value = keyword;
        renderQuizTable(filterQuizData(keyword), keyword);
    }
    document.getElementById("global-search-results").style.display = 'none';
}

function selectQuestResult(filepath) {
    switchTab('quest');
    loadQuestDetail(filepath);
    document.getElementById("global-search-results").style.display = 'none';
}

// script.js 에 추가 (renderQuestList 함수 아래쯤)

// [NEW] 퀘스트 타입 필터링 함수
function filterQuestType(type, btnElement) {
    // 1. 버튼 활성화 상태 변경 (UI)
    // 모든 버튼에서 active 클래스 제거
    const buttons = document.querySelectorAll('.quest-type-nav .type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // 클릭된 버튼에 active 클래스 추가
    if (btnElement) {
        btnElement.classList.add('active');
    }

    // 2. 데이터 필터링 (Logic)
    const container = document.getElementById('quest-grid-container');
    
    // 데이터가 없으면 중단
    if (!globalData.quests || globalData.quests.length === 0) return;

    let filteredQuests = [];

    if (type === 'all') {
        filteredQuests = globalData.quests;
    } else {
        // quests.json의 "type" 값과 정확히 일치하는 것만 필터링
        filteredQuests = globalData.quests.filter(q => q.type === type);
    }

    // 3. 필터링된 리스트 다시 그리기
    renderQuestList(filteredQuests);
}