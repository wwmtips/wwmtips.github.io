
// 전역 변수
let globalData = { items: [], quiz: [], quests: [] };

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // 데이터 가져오기

    // 헤더 통합 검색 이벤트 연결
    const headerSearch = document.getElementById("header-search-input");
    if (headerSearch) {
        headerSearch.addEventListener("input", handleGlobalSearch);
        headerSearch.addEventListener("blur", () => {
            setTimeout(() => {
                document.getElementById("global-search-results").style.display = 'none';
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

// [NEW] 퀘스트 리스트 그리기
function renderQuestList(quests) {
    const container = document.getElementById('quest-grid-container');
    container.innerHTML = ''; // 초기화

    if (!quests || quests.length === 0) {
        container.innerHTML = '<div style="padding:20px;">퀘스트 정보가 없습니다.</div>';
        return;
    }

    quests.forEach(quest => {
        // 카드 HTML 생성
        const card = document.createElement('div');
        card.className = 'quest-card';
        card.onclick = () => loadQuestDetail(quest.filepath); // 클릭 시 상세 로드

        card.innerHTML = `
            <div class="quest-icon-wrapper">
                <img src="${quest.iconpath}" alt="icon">
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

// [NEW] 퀘스트 상세 내용 로드 (HTML 파일 Fetch)
function loadQuestDetail(filepath) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    // 화면 전환
    listView.style.display = 'none';
    detailView.style.display = 'block';
    contentBox.innerHTML = '<div style="text-align:center; padding:50px;">로딩 중...</div>';

    // 파일 가져오기
    fetch(filepath)
        .then(response => {
            if (!response.ok) throw new Error("파일을 찾을 수 없습니다.");
            return response.text();
        })
        .then(html => {
            contentBox.innerHTML = html;
        })
        .catch(err => {
            contentBox.innerHTML = `<div style="text-align:center; color:red;">내용을 불러오지 못했습니다.<br>(${err.message})</div>`;
        });
}

// [NEW] 상세에서 목록으로 돌아가기
function showQuestList() {
    document.getElementById('quest-list-view').style.display = 'block';
    document.getElementById('quest-detail-view').style.display = 'none';
}

// [수정] 통합 검색 핸들러 (퀘스트 추가)
function handleGlobalSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    const resultContainer = document.getElementById("global-search-results");
    
    if (!keyword) {
        resultContainer.style.display = 'none';
        return;
    }

    let resultsHTML = '';

    // 1. 족보 검색
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

    // 2. 퀘스트 검색 (추가됨)
    if (globalData.quests) {
        const questResults = globalData.quests.filter(q => 
            q.name.toLowerCase().includes(keyword) || 
            q.location.toLowerCase().includes(keyword)
        );

        if (questResults.length > 0) {
            resultsHTML += `<div class="search-category-title">퀘스트</div>`;
            questResults.slice(0, 3).forEach(quest => {
                // 클릭 시: 퀘스트 탭 이동 -> 상세 로드
                resultsHTML += `
                    <div class="search-result-item" onclick="selectQuestResult('${quest.filepath}')">
                        <span class="badge item">퀘스트</span> <span class="result-text">${quest.name}</span>
                    </div>
                `;
            });
        }
    }

    // 결과 표시
    if (resultsHTML) {
        resultContainer.innerHTML = resultsHTML;
        resultContainer.style.display = 'block';
    } else {
        resultContainer.innerHTML = `<div class="no-result">결과 없음</div>`;
        resultContainer.style.display = 'block';
    }
}

// [NEW] 통합 검색에서 퀘스트 클릭 시 동작
function selectQuestResult(filepath) {
    // 1. 퀘스트 탭으로 이동
    switchTab('quest');
    // 2. 해당 퀘스트 상세 로드
    loadQuestDetail(filepath);
    // 3. 검색창 닫기
    document.getElementById("global-search-results").style.display = 'none';
}