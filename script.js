/* =========================================
   script.js (최종 수정: 누락된 함수 복구 완료)
   ========================================= */

// 전역 변수
let globalData = { items: [], quiz: [], quests: [], news: [] };

// 퀘스트 페이지네이션용 변수
let currentQuestData = [];
let currentPage = 1;
const itemsPerPage = 12;

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
            // [오류 해결] 이제 함수가 정의되어 있어 정상 작동합니다.
            renderQuizTable(filterQuizData(e.target.value));
        });
    }

    // 3. URL 파라미터 체크하여 탭 자동 전환
    checkUrlParams();
});

// URL 파라미터 처리 함수
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); 

    if (tab === 'quiz') switchTab('quiz');
    else if (tab === 'quest') switchTab('quest');
    else if (tab === 'news') switchTab('news');
    else switchTab('home');
}

// [기능] 데이터 로드
function loadData() {
    Promise.all([
        fetch('/json/data.json').then(res => res.json()),
        fetch('/json/quests.json').then(res => res.json()),
        fetch('/json/news.json').then(res => res.json())
    ])
    .then(([mainData, questList, newsList]) => {
        // 퀘스트 역순 정렬
        if (questList && Array.isArray(questList)) {
            questList.sort((a, b) => {
                const numA = parseInt(a.id.replace('q', ''));
                const numB = parseInt(b.id.replace('q', ''));
                return numB - numA; 
            });
        }
        
        // 뉴스 역순 정렬
        if (newsList && Array.isArray(newsList)) {
            newsList.reverse(); 
        }

        globalData = {
            items: mainData.items || [],
            quiz: mainData.quiz || [],
            quests: questList || [],
            news: newsList || [] 
        };

        // 퀘스트 데이터 초기화
        currentQuestData = globalData.quests;

        console.log("데이터 로드 완료:", globalData);

        // [오류 해결] 1. 족보 초기화 (이제 함수가 있으므로 실행됨)
        renderQuizTable(globalData.quiz);
        const counter = document.getElementById('quiz-counter-area');
        if(counter) counter.innerText = `총 ${globalData.quiz.length}개의 족보가 등록되었습니다.`;

        // 2. 퀘스트 탭 리스트 초기화
        renderQuestList();

        // 3. 홈 화면 퀘스트 리스트 초기화
        renderHomeQuests(globalData.quests);
        
        // 4. 뉴스 렌더링
        renderHomeNews(globalData.news);
        renderFullNews(globalData.news);
    })
    .catch(error => {
        console.error("데이터 로드 중 오류 발생:", error);
    });
}

// =========================================
// [누락되었던 함수 복구] 족보 관련 로직
// =========================================
function renderQuizTable(data, keyword = '') {
    const tbody = document.getElementById('quiz-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
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
// 탭 전환 및 기타 기능 함수들
// =========================================

function switchTab(tabName) {
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news'];
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
    } else if (tabName === 'news') {
        document.getElementById('view-news').style.display = 'block';
        history.pushState(null, null, '?tab=news');
    }
}

// 홈 화면 뉴스 렌더링
function renderHomeNews(newsList) {
    const container = document.getElementById('home-news-list');
    if (!container) return;
    container.innerHTML = '';

    const displayList = newsList.slice(0, 4); 

    if (displayList.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">최신 정보가 없습니다.</div>';
        return;
    }

    displayList.forEach(item => {
        const el = createNewsElement(item);
        container.appendChild(el);
    });
}

// 전체 뉴스 렌더링
function renderFullNews(newsList) {
    const container = document.getElementById('full-news-list');
    if (!container) return;
    container.innerHTML = '';

    if (!newsList || newsList.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">등록된 정보가 없습니다.</div>';
        return;
    }

    newsList.forEach(item => {
        const el = createNewsElement(item);
        container.appendChild(el);
    });
}

// 뉴스 아이템 HTML 생성
function createNewsElement(item) {
    const div = document.createElement('div');
    div.className = 'news-item';
    div.onclick = function() { this.classList.toggle('active'); };

    let linkHtml = '';
    if (item.link && item.link.trim() !== '') {
        linkHtml = `<a href="${item.link}" target="_blank" class="news-link-btn" onclick="event.stopPropagation()">바로가기 →</a>`;
    }

    div.innerHTML = `
        <div class="news-header">
            <span class="news-title">${item.title}</span>
            <span class="news-date">${item.date}</span>
        </div>
        <div class="news-content">${item.content}<br>${linkHtml}</div>
    `;
    return div;
}

// 홈 화면 퀘스트 렌더링
function renderHomeQuests(quests) {
    const container = document.getElementById('home-quest-list');
    if (!container) return;
    container.innerHTML = '';
    const recentQuests = quests.slice(0, 6);
    if (recentQuests.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">표시할 퀘스트가 없습니다.</div>';
        return;
    }
    recentQuests.forEach(quest => createQuestCard(quest, container));
}

// 퀘스트 탭 리스트 렌더링 (페이지네이션)
function renderQuestList() {
    const container = document.getElementById('quest-grid-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentQuestData || currentQuestData.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">퀘스트 정보가 없습니다.</div>';
        const pContainer = document.getElementById('pagination-container');
        if(pContainer) pContainer.innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedQuests = currentQuestData.slice(startIndex, endIndex);

    paginatedQuests.forEach(quest => createQuestCard(quest, container));
    renderPagination();
}

// 페이지네이션 버튼 그리기
function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(currentQuestData.length / itemsPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerText = '<';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => changePage(i);
        container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerText = '>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);
    container.appendChild(nextBtn);
}

function changePage(page) {
    currentPage = page;
    renderQuestList();
    document.getElementById('quest-list-view').scrollIntoView({ behavior: 'smooth' });
}

// 퀘스트 카드 생성 헬퍼
function createQuestCard(quest, container) {
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
}

// 퀘스트 상세 로드
function loadQuestDetail(filepath) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    if(listView) listView.style.display = 'none';
    if(detailView) detailView.style.display = 'block';
    if(contentBox) contentBox.innerHTML = '<div style="text-align:center; padding:50px;">로딩 중...</div>';

    fetch(filepath).then(res => {
        if(!res.ok) throw new Error("File not found");
        return res.text();
    }).then(html => {
        if(contentBox) contentBox.innerHTML = html;
    }).catch(err => {
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

// 퀘스트 타입 필터링
function filterQuestType(type, btnElement) {
    const buttons = document.querySelectorAll('.quest-type-nav .type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    if (!globalData.quests) return;

    if (type === 'all') currentQuestData = globalData.quests;
    else currentQuestData = globalData.quests.filter(q => q.type === type);

    currentPage = 1;
    renderQuestList();
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

    // 1. 뉴스(정보) 검색
    if (globalData.news) {
        const newsResults = globalData.news.filter(n => 
            n.title.toLowerCase().includes(keyword) || 
            n.content.toLowerCase().includes(keyword)
        );

        if (newsResults.length > 0) {
            resultsHTML += `<div class="search-category-title">정보</div>`;
            newsResults.slice(0, 3).forEach(item => {
                resultsHTML += `
                    <div class="search-result-item" onclick="switchTab('news')">
                        <span class="badge info">정보</span> <span class="result-text">${item.title}</span>
                    </div>
                `;
            });
        }
    }

    // 2. 족보 검색
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

    // 3. 퀘스트 검색
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