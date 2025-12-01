/* =========================================
   script.js (페이지네이션 적용 버전)
   ========================================= */

// 전역 변수
let globalData = { items: [], quiz: [], quests: [] };

// [NEW] 페이지네이션용 전역 변수
let currentQuestData = []; // 현재 필터링된 퀘스트 목록
let currentPage = 1;       // 현재 페이지 번호
const itemsPerPage = 10;   // 한 페이지당 보여줄 개수

document.addEventListener("DOMContentLoaded", () => {
    loadData(); 

    // 헤더 통합 검색
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

    // 족보 검색
    const quizLocalSearch = document.getElementById("quiz-local-search");
    if (quizLocalSearch) {
        quizLocalSearch.addEventListener("input", (e) => {
            renderQuizTable(filterQuizData(e.target.value));
        });
    }

    checkUrlParams();
});

// URL 파라미터 체크
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); 

    if (tab === 'quiz') switchTab('quiz');
    else if (tab === 'quest') switchTab('quest');
    else switchTab('home');
}

// 데이터 로드
function loadData() {
    Promise.all([
        fetch('json/data.json').then(res => res.json()),
        fetch('json/quests.json').then(res => res.json())
    ])
    .then(([mainData, questList]) => {
        // 퀘스트 ID 역순 정렬 (최신순)
        if (questList && Array.isArray(questList)) {
            questList.sort((a, b) => {
                const numA = parseInt(a.id.replace('q', ''));
                const numB = parseInt(b.id.replace('q', ''));
                return numB - numA; 
            });
        }

        globalData = {
            items: mainData.items || [],
            quiz: mainData.quiz || [],
            quests: questList || []
        };

        // 초기화: 현재 퀘스트 데이터를 전체로 설정
        currentQuestData = globalData.quests; 

        console.log("데이터 로드 완료:", globalData);

        // 1. 족보 초기화
        renderQuizTable(globalData.quiz);
        const counter = document.getElementById('quiz-counter-area');
        if(counter) counter.innerText = `총 ${globalData.quiz.length}개의 족보가 등록되었습니다.`;

        // 2. 퀘스트 탭 리스트 초기화 (페이지네이션 적용)
        renderQuestList(); 

        // 3. 홈 화면 리스트 초기화 (6개 제한)
        renderHomeQuests(globalData.quests);
    })
    .catch(error => {
        console.error("데이터 로드 중 오류 발생:", error);
    });
}

// 탭 전환
function switchTab(tabName) {
    const views = ['view-home', 'view-quiz', 'view-quest'];
    const navs = ['nav-home', 'nav-quiz', 'nav-quest'];

    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    navs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('active');
    });

    if (tabName === 'home') {
        document.getElementById('view-home').style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
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

// 홈 화면 퀘스트 렌더링 (6개 제한 유지)
function renderHomeQuests(quests) {
    const container = document.getElementById('home-quest-list');
    if (!container) return;

    container.innerHTML = '';
    const recentQuests = quests.slice(0, 6); // 여기는 6개 제한 유지

    if (recentQuests.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">표시할 퀘스트가 없습니다.</div>';
        return;
    }

    recentQuests.forEach(quest => createQuestCard(quest, container));
}

// [수정] 퀘스트 탭 리스트 렌더링 (페이지네이션 적용)
function renderQuestList() {
    const container = document.getElementById('quest-grid-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentQuestData || currentQuestData.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">퀘스트 정보가 없습니다.</div>';
        document.getElementById('pagination-container').innerHTML = ''; // 버튼도 지움
        return;
    }

    // 페이지네이션 계산
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedQuests = currentQuestData.slice(startIndex, endIndex);

    // 카드 생성
    paginatedQuests.forEach(quest => createQuestCard(quest, container));

    // 페이지네이션 버튼 렌더링
    renderPagination();
}

// [NEW] 페이지네이션 버튼 그리기
function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(currentQuestData.length / itemsPerPage);
    
    // 페이지가 1개뿐이면 버튼 안 보여줌
    if (totalPages <= 1) return;

    // 이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerText = '<';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    container.appendChild(prevBtn);

    // 숫자 버튼
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => changePage(i);
        container.appendChild(btn);
    }

    // 다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerText = '>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);
    container.appendChild(nextBtn);
}

// [NEW] 페이지 변경 함수
function changePage(page) {
    currentPage = page;
    renderQuestList(); // 리스트 다시 그리기
    // 스크롤 맨 위로 (선택사항)
    document.getElementById('quest-list-view').scrollIntoView({ behavior: 'smooth' });
}

// 헬퍼 함수: 퀘스트 카드 생성 (중복 제거용)
function createQuestCard(quest, container) {
    const card = document.createElement('div');
    card.className = 'quest-card';
    card.onclick = () => {
        switchTab('quest'); // 홈에서 클릭했을 때를 대비해 탭 전환
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
}

// 퀘스트 상세 로드
function loadQuestDetail(filepath) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    if(listView) listView.style.display = 'none';
    if(detailView) detailView.style.display = 'block';
    if(contentBox) contentBox.innerHTML = '<div style="text-align:center; padding:50px;">로딩 중...</div>';

    fetch(filepath)
        .then(response => {
            if (!response.ok) throw new Error("File not found");
            return response.text();
        })
        .then(html => {
            if(contentBox) contentBox.innerHTML = html;
        })
        .catch(err => {
            if(contentBox) contentBox.innerHTML = `<div style="text-align:center; padding:50px; color:#888;">정보 준비 중입니다.</div>`;
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

// [수정] 퀘스트 타입 필터링 (페이지 리셋 포함)
function filterQuestType(type, btnElement) {
    // 버튼 UI
    const buttons = document.querySelectorAll('.quest-type-nav .type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    // 데이터 필터링
    if (!globalData.quests) return;

    if (type === 'all') {
        currentQuestData = globalData.quests;
    } else {
        currentQuestData = globalData.quests.filter(q => q.type === type);
    }

    // [중요] 필터 변경 시 1페이지로 리셋
    currentPage = 1;
    
    // 리스트 다시 그리기
    renderQuestList();
}

// 족보 로직
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

// 통합 검색 핸들러
function handleGlobalSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    const resultContainer = document.getElementById("global-search-results");
    if (!resultContainer) return;

    if (!keyword) {
        resultContainer.style.display = 'none';
        return;
    }

    let resultsHTML = '';

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