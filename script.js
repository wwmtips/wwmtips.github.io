// 전역 변수
let globalData = { items: [], quiz: [], quests: [] };

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // 데이터 가져오기 실행

    // 헤더 통합 검색 이벤트 연결
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

    // 족보 내부 필터링 이벤트 연결
    const quizLocalSearch = document.getElementById("quiz-local-search");
    if (quizLocalSearch) {
        quizLocalSearch.addEventListener("input", (e) => {
            renderQuizTable(filterQuizData(e.target.value));
        });
    }
});

// =========================================
// 1. 데이터 로드 및 초기화
// =========================================
function loadData() {
    Promise.all([
        fetch('https://wwm.tips/json/data.json').then(res => res.json()),
        fetch('https://wwm.tips/json/quests.json').then(res => res.json())
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

        // [NEW] 3. 홈 화면 "주요 퀘스트" 리스트 초기화
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
    const container = document.getElementById('recent-list'); // 홈 화면의 컨테이너 ID
    if (!container) return;

    container.innerHTML = '';

    // 홈 화면에는 최대 6개까지만 보여주기 (원하시면 숫자를 바꾸거나 slice 제거 가능)
    const recentQuests = quests.slice(0, 6);

    if (recentQuests.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">표시할 퀘스트가 없습니다.</div>';
        return;
    }

    recentQuests.forEach(quest => {
        const card = document.createElement('div');
        card.className = 'quest-card'; // 퀘스트 탭과 동일한 스타일 클래스 사용
        // 클릭 시: 퀘스트 탭으로 이동 -> 상세 페이지 로드
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
    document.getElementById('view-home').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'none';
    document.getElementById('view-quest').style.display = 'none';

    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-quest').classList.remove('active');
    document.getElementById('nav-quiz').classList.remove('active');

    if (tabName === 'home') {
        document.getElementById('view-home').style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
    } else if (tabName === 'quiz') {
        document.getElementById('view-quiz').style.display = 'block';
        document.getElementById('nav-quiz').classList.add('active');
    } else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');
        showQuestList();
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