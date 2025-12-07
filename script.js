/* =========================================
   script.js (최종 수정본: 단축 URL ?q= 및 ?g= 적용)
   ========================================= */

// 전역 변수
let currentQuestData = [];
let currentPage = 1;
const itemsPerPage = 12;
let isGuideLoaded = false;

// [최적화] URL 파라미터 업데이트 함수 (단축 URL q= 및 g= 지원)
function updateUrlQuery(tab, id) {
    const url = new URL(window.location);
    
    // 기존 파라미터 초기화 (충돌 방지)
    url.searchParams.delete('tab');
    url.searchParams.delete('id');
    url.searchParams.delete('q');
    url.searchParams.delete('g'); // [추가] 가이드 단축 파라미터 초기화

    // 1. 퀘스트 탭인 경우 -> 단축 주소 (?q=숫자) 사용
    if (tab === 'quest' && id) {
        const shortId = id.toLowerCase().replace('q', '');
        url.searchParams.set('q', shortId);
    } 
    // 2. 가이드 탭인 경우 -> 단축 주소 (?g=ID) 사용 [추가됨]
    else if (tab === 'guide' && id) {
        url.searchParams.set('g', id);
    }
    // 3. 그 외 (빌더 등) -> 기존 방식 유지
    else {
        if (tab && tab !== 'home') url.searchParams.set('tab', tab);
        if (id) url.searchParams.set('id', id);
    }
    
    // 주소가 실제로 변경되었을 때만 히스토리 기록
    if (url.toString() !== window.location.href) {
        history.pushState(null, '', url);
    }
}

// 데이터 저장소
let globalData = { items: [], quiz: [], quests: [], news: [] };
let builderData = null; 

// 빌더 상태 관리
let currentBuild = { weapons: [null,null], hearts: [null,null,null,null], marts: new Array(8).fill(null) };
let currentSlot = { type: '', index: 0 };

document.addEventListener("DOMContentLoaded", () => {
    // 1. 데이터 로드 시작
    loadData();

    // 2. 통합 검색창 설정
    const headerSearch = document.getElementById("header-search-input");
    const clearBtn = document.getElementById("search-clear-btn");       
    const searchResults = document.getElementById("global-search-results"); 

    if (headerSearch) {
        headerSearch.addEventListener("input", (e) => {
            handleGlobalSearch(e); 
            if (e.target.value.trim() !== '' && clearBtn) {
                clearBtn.style.display = 'block';
            } else if (clearBtn) {
                clearBtn.style.display = 'none';
            }
        });

        headerSearch.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                headerSearch.blur(); 
            }
        });

        headerSearch.addEventListener("blur", () => {
            setTimeout(() => {
                if (searchResults) searchResults.style.display = 'none';
            }, 200);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (headerSearch) {
                headerSearch.value = ''; 
                headerSearch.focus();    
            }
            clearBtn.style.display = 'none'; 
            if (searchResults) searchResults.style.display = 'none'; 
        });
    }

    // 3. 족보 탭 검색 리스너
    const quizLocalSearch = document.getElementById("quiz-local-search");
    const statusBar = document.getElementById("quiz-counter-area"); 

    if (quizLocalSearch) {
        quizLocalSearch.addEventListener("input", (e) => {
            renderQuizTable(filterQuizData(e.target.value), e.target.value);
        });

        quizLocalSearch.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                quizLocalSearch.blur(); 
            }
        });

        quizLocalSearch.addEventListener("focus", () => {
            if(statusBar) statusBar.classList.add("hidden");
        });

        quizLocalSearch.addEventListener("blur", () => {
            if(statusBar) statusBar.classList.remove("hidden");
        });
    }

    // 4. URL 파라미터 체크
    checkUrlParams();
});

// =========================================
// [기능] 데이터 로드
// =========================================
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    const targetId = urlParams.get('id');
    const shortQuestId = urlParams.get('q'); 

    Promise.all([
        fetch('json/data.json').then(res => res.json()),
        fetch('json/quests.json').then(res => res.json()),
        fetch('json/news.json').then(res => res.json())
    ])
    .then(([mainData, questData, newsData]) => {
        console.log("데이터 로드 성공:", { questData, newsData });

        // 1. 퀘스트 데이터 파싱
        let quests = [];
        if (Array.isArray(questData)) {
            quests = questData;
        } else if (questData.quests) {
            quests = questData.quests;
        }

        // 2. 뉴스 데이터 파싱
        let news = [];
        if (Array.isArray(newsData)) {
            news = newsData;
        } else if (newsData.news) {
            news = newsData.news;
        }

        // 3. 정렬 (ID 기준 역순)
        if (quests.length > 0) {
            quests.sort((a, b) => {
                const numA = parseInt((a.id || "").replace('q', '')) || 0;
                const numB = parseInt((b.id || "").replace('q', '')) || 0;
                return numB - numA; 
            });
        }
        
        if (news.length > 0) {
            news.reverse(); 
        }

        // 4. 전역 변수에 저장
        globalData = {
            items: mainData.items || [],
            quiz: mainData.quiz || [],
            quests: quests, 
            news: news 
        };

        currentQuestData = globalData.quests;

        // 5. 화면 렌더링
        renderQuizTable(globalData.quiz);
        updateQuizCounter();

        renderQuestList();                
        renderHomeQuests(globalData.quests); 
        renderHomeNews(globalData.news);     
        
        if (typeof renderNews === 'function') {
            renderNews(globalData.news);
        } else {
            renderFullNews(globalData.news);
        }

        // 6. 바로가기 실행
        
        // Case A: 퀘스트 단축 주소 (?q=1)
        if (shortQuestId) {
            const fullId = 'q' + shortQuestId;
            const foundQuest = globalData.quests.find(q => q.id === fullId);
            if (foundQuest) {
                loadQuestDetail(foundQuest.filepath, fullId); 
            }
        }
        // Case B: 기존 긴 주소 (?tab=quest&id=q1)
        else if (targetTab === 'quest' && targetId) {
            const formattedId = targetId.toLowerCase().startsWith('q') ? targetId : 'q' + targetId;
            const foundQuest = globalData.quests.find(q => q.id === formattedId);
            if (foundQuest) {
                loadQuestDetail(foundQuest.filepath, formattedId);
            }
        }
        // Case C: 가이드 단축 주소 (?g=...)는 checkUrlParams -> loadGuideView에서 처리됨
    })
    .catch(error => {
        console.error("데이터 로드 중 오류 발생:", error);
    });
}

// 족보 카운터 업데이트 함수
function updateQuizCounter() {
    const counter = document.getElementById('quiz-counter-area');
    if (counter && globalData.quiz.length > 0) {
        const userCounts = {};
        
        globalData.quiz.forEach(item => {
            if (item.user && item.user.trim() !== "" && item.user !== "-") {
                const u = item.user.trim();
                userCounts[u] = (userCounts[u] || 0) + 1;
            }
        });

        const sortedUsers = Object.entries(userCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        let message = `총 ${globalData.quiz.length}개의 족보가 등록되었습니다.`;

        if (sortedUsers.length > 0) {
            message += `<br><div style="font-size: 0.9em; margin-top: 5px; color: #888; font-weight: normal;">`;
            
            const [user1, count1] = sortedUsers[0];
            message += `👑 <strong class="rainbow-text">${user1}</strong> <span style="font-size:0.8em">(${count1})</span>`;

            if (sortedUsers.length > 1) {
                const [user2, count2] = sortedUsers[1];
                message += ` &nbsp;|&nbsp; 🥈 ${user2} <span style="font-size:0.8em">(${count2})</span>`;
            }

            if (sortedUsers.length > 2) {
                const [user3, count3] = sortedUsers[2];
                message += ` &nbsp;|&nbsp; 🥉 ${user3} <span style="font-size:0.8em">(${count3})</span>`;
            }

            message += `</div>`;
        }
        counter.innerHTML = message;
    }
}


// =========================================
// 탭 전환 및 뷰 제어
// =========================================
function switchTab(tabName) {
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder'];
    const navs = ['nav-home', 'nav-quiz', 'nav-quest', 'nav-code', 'nav-builder'];

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
        updateUrlQuery('home');  
    } 
    else if (tabName === 'quiz') {
        document.getElementById('view-quiz').style.display = 'block';
        document.getElementById('nav-quiz').classList.add('active');
        updateUrlQuery('quiz');
    } 
    else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');
        showQuestList();
        
        const allBtn = document.querySelector('#view-quest .guide-item-btn[onclick*="all"]');
        if (allBtn) filterQuestType('all', allBtn);
        
        updateUrlQuery('quest', null);
    } 
    else if (tabName === 'news') {
        document.getElementById('view-news').style.display = 'block';
        updateUrlQuery('guide', 'news'); // 가이드(뉴스) 단축 URL 호출됨 -> ?g=news
    } 
    else if (tabName === 'guide' || tabName === 'code') {
        const guideView = document.getElementById('view-guide');
        if (guideView) {
            guideView.style.display = 'block';
            if (!isGuideLoaded) {
                loadGuideView(); 
            } else {
                const newsBtn = findButtonByFile('news.html'); 
                loadGuideContent('news.html', newsBtn);
            }
        }
        document.getElementById('nav-code').classList.add('active');
        
        // [수정] 이미 URL에 g 또는 id가 있는지 확인 후 없을 때만 업데이트
        const params = new URLSearchParams(window.location.search);
        if(!params.get('id') && !params.get('g')) {
            updateUrlQuery('guide');
        }
    }
    else if (tabName === 'builder') {
        document.getElementById('view-builder').style.display = 'block';
        document.getElementById('nav-builder').classList.add('active');
        
        if (!builderData) {
            fetch('json/builder_data.json')
                .then(res => res.json())
                .then(data => { builderData = data; })
                .catch(err => console.error("빌더 데이터 로드 실패:", err));
        }
        if (new URLSearchParams(window.location.search).get('b')) {
            loadViewer();
        }
        updateUrlQuery('builder');
    }
}

// URL 체크 (q= 및 g= 파라미터 확인)
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); 
    const shortQuest = urlParams.get('q'); // 퀘스트 단축 ID
    const shortGuide = urlParams.get('g'); // 가이드 단축 ID [추가]

    // 단축 URL 우선 처리
    if (shortQuest) { switchTab('quest'); return; }
    if (shortGuide) { switchTab('guide'); return; } // [추가] g= 있으면 가이드 탭으로

    if (urlParams.get('b')) { switchTab('builder'); return; }

    if (tab === 'quiz') switchTab('quiz');
    else if (tab === 'quest') switchTab('quest');
    else if (tab === 'news') switchTab('news');
    else if (tab === 'guide') switchTab('guide'); 
    else if (tab === 'builder') switchTab('builder');
    else switchTab('home');
}

// =========================================
// [기능] 가이드 관련
// =========================================

const GUIDE_MAP = {
    'news': 'news.html',
    'tierlist': 'guide_tier.html',
    'weapon': 'tier_weapon.html', 
    'build': 'build.html',
    'map': 'maps.html',
    'side': 'beta.html',
    'hw': 'npc.html',        
    'boss': 'boss.html',     
    'marts': 'marts.html',   
    'harts': 'harts.html',   
    'skill': 'skils.html',
    'majang': 'majang.html', 
    'code': 'code.html'      
};

function loadGuideView() {
    const container = document.getElementById('guide-content-loader');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    // [수정] id 또는 g 파라미터 확인
    const targetId = urlParams.get('id') || urlParams.get('g');

    // ID로 파일명 찾기 (없으면 기본값 news.html)
    let fileToLoad = 'news.html';
    if (targetId && GUIDE_MAP[targetId]) {
        fileToLoad = GUIDE_MAP[targetId];
    }

    if (isGuideLoaded) {
        const targetBtn = findButtonByFile(fileToLoad);
        loadGuideContent(fileToLoad, targetBtn);
        return; 
    }
    
    fetch('guide.html') 
        .then(res => res.text())
        .then(html => {
            container.innerHTML = html;
            container.style.marginTop = '0';
            isGuideLoaded = true;
            const targetBtn = findButtonByFile(fileToLoad);
            loadGuideContent(fileToLoad, targetBtn); 
        });
}

function findButtonByFile(filename) {
    const buttons = document.querySelectorAll('#view-guide .guide-item-btn');
    let foundBtn = null;
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(filename)) foundBtn = btn;
    });
    return foundBtn;
}

function loadGuideContent(filename, btnElement) {
    const innerContainer = document.getElementById('guide-dynamic-content');
    if(!innerContainer) return;

    // 파일명 -> ID 역추적 및 URL 업데이트 (여기서 g=... 로 변환됨)
    const foundId = Object.keys(GUIDE_MAP).find(key => GUIDE_MAP[key] === filename);
    if (foundId) {
        updateUrlQuery('guide', foundId);
    }

    if (btnElement) {
        const allButtons = document.querySelectorAll('#view-guide .guide-item-btn');
        allButtons.forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const codeView = document.querySelector('.code-page-container');
    if(codeView) codeView.style.display = 'none';
    
    innerContainer.style.display = 'block';
    innerContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#888;">컨텐츠 로딩 중...</div>';
    
    fetch(filename)
        .then(res => res.text())
        .then(html => {
            innerContainer.innerHTML = html;
            if (filename === 'news.html') renderGuideNewsList(); 
        });
}

function renderGuideNewsList() {
    const container = document.getElementById('guide-inner-news-list');
    if (!container) return;

    if (!globalData.news || globalData.news.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">최신 뉴스를 불러올 수 없습니다.</div>';
        return;
    }

    container.innerHTML = ''; 
    const displayList = globalData.news.slice(0, 5); 
    displayList.forEach(item => {
        const el = createNewsElement(item);
        el.style.borderBottom = '1px dashed #444'; 
        el.style.backgroundColor = 'transparent'; 
        container.appendChild(el);
    });
}

// =========================================
// [기능] 무림록 및 뉴스 공통 렌더링
// =========================================

function renderNews(newsList) {
    renderFullNews(newsList);
}

function renderFullNews(newsList) {
    const container = document.getElementById('full-news-list');
    if (!container) return;
    container.innerHTML = '';
    if (!newsList || newsList.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">등록된 정보가 없습니다.</div>';
        return;
    }
    newsList.forEach(item => container.appendChild(createNewsElement(item)));
}

function renderHomeNews(newsList) {
    const container = document.getElementById('home-news-list');
    if (!container) return;
    container.innerHTML = '';
    const displayList = newsList.slice(0, 4); 
    if (displayList.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">최신 정보가 없습니다.</div>';
        return;
    }
    displayList.forEach(item => container.appendChild(createNewsElement(item)));
}

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

// 퀘스트 리스트
function renderQuestList() {
    const container = document.getElementById('quest-grid-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentQuestData || currentQuestData.length === 0) {
        if(globalData.quests && globalData.quests.length > 0) {
            currentQuestData = globalData.quests;
        } else {
            container.innerHTML = '<div style="padding:20px; color:#888;">퀘스트 정보가 없습니다.</div>';
            return;
        }
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedQuests = currentQuestData.slice(startIndex, endIndex);

    paginatedQuests.forEach(quest => createQuestCard(quest, container));
    renderPagination();
}

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

function createQuestCard(quest, container) {
    const card = document.createElement('div');
    card.className = 'quest-card';
    
    // 클릭 시 단축 URL로 이동하도록 ID 전달
    card.onclick = () => { 
        switchTab('quest'); 
        loadQuestDetail(quest.filepath, quest.id); 
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

// 페이지네이션
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

function loadQuestDetail(filepath, id) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    // ID가 있으면 URL 업데이트 (단축 로직 적용)
    if (id) {
        updateUrlQuery('quest', id);
    }

    if(listView) listView.style.display = 'none';
    if(detailView) detailView.style.display = 'block';
    if(contentBox) contentBox.innerHTML = '<div style="text-align:center; padding:50px;">로딩 중...</div>';

    fetch(filepath).then(res => res.text()).then(html => {
        if(contentBox) contentBox.innerHTML = html;
        window.scrollTo(0, 0);
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

// 필터 버튼
function filterQuestType(type, btnElement) {
    const buttons = document.querySelectorAll('#view-quest .guide-item-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    if (!globalData.quests) return;
    if (type === 'all') currentQuestData = globalData.quests;
    else currentQuestData = globalData.quests.filter(q => q.type === type);

    currentPage = 1;
    renderQuestList();
}

// 족보 테이블
function renderQuizTable(data, keyword = '') {
    const tbody = document.getElementById('quiz-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="padding:20px; color:#888;">결과가 없습니다.</td></tr>`;
        return;
    }
    data.forEach(item => {
        const tr = document.createElement('tr');
        let hint = item.hint, answer = item.answer;
        if (keyword) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            hint = hint.replace(regex, '<span class="highlight">$1</span>');
            answer = answer.replace(regex, '<span class="highlight">$1</span>');
        }
        tr.innerHTML = `<td>${hint}</td><td>${answer}</td><td class="user-cell">${item.user || '-'}</td>`;
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

// 통합 검색
function handleGlobalSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    const resultContainer = document.getElementById("global-search-results");
    if (!resultContainer) return;
    if (!keyword) { resultContainer.style.display = 'none'; return; }

    let resultsHTML = '';
    if (globalData.news) {
        globalData.news.filter(n => n.title.toLowerCase().includes(keyword) || n.content.toLowerCase().includes(keyword))
            .slice(0, 3).forEach(item => {
                resultsHTML += `<div class="search-result-item" onclick="switchTab('news')"><span class="badge info">정보</span> <span class="result-text">${item.title}</span></div>`;
            });
    }
    globalData.quiz.filter(q => q.hint.toLowerCase().includes(keyword) || q.answer.toLowerCase().includes(keyword))
        .slice(0, 3).forEach(item => {
            resultsHTML += `<div class="search-result-item" onclick="selectGlobalResult('${item.hint}')"><span class="badge quiz">족보</span><span class="result-text">${item.hint} - ${item.answer}</span></div>`;
        });
    globalData.quests.filter(q => q.name.toLowerCase().includes(keyword) || q.location.toLowerCase().includes(keyword))
        .slice(0, 3).forEach(quest => {
            resultsHTML += `<div class="search-result-item" onclick="selectQuestResult('${quest.filepath}', '${quest.id}')"><span class="badge item">퀘스트</span> <span class="result-text">${quest.name}</span></div>`;
        });


    resultContainer.innerHTML = resultsHTML || `<div class="no-result" style="padding:15px; text-align:center; color:#888;">결과 없음</div>`;
    resultContainer.style.display = 'block';
}

function selectGlobalResult(keyword) {
    switchTab('quiz');
    const localInput = document.getElementById("quiz-local-search");
    if(localInput) { localInput.value = keyword; renderQuizTable(filterQuizData(keyword), keyword); }
    document.getElementById("global-search-results").style.display = 'none';
}

function selectQuestResult(filepath, id) {
    switchTab('quest');
    loadQuestDetail(filepath, id); 
    document.getElementById("global-search-results").style.display = 'none';
}


/* =========================================
   [기능] 빌더 (Builder)
   ========================================= */
function openBuilderModal(type, index) {
    if (!builderData) return alert("데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    
    currentSlot = { type, index };
    const modal = document.getElementById('builder-modal');
    const list = document.getElementById('builder-modal-list');
    const title = document.getElementById('builder-modal-title');
    
    const typeNames = { 'weapons': '무기/무술', 'hearts': '심법', 'marts': '비결' };
    title.innerText = `${typeNames[type]} 선택`;
    
    list.innerHTML = '';

    const currentList = currentBuild[type];
    const usedIds = currentList.filter((id, idx) => {
        return id !== null && idx !== parseInt(index);
    });

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'select-item';
    emptyDiv.innerHTML = '<div style="width:48px;height:48px;background:#eee;line-height:48px;margin:0 auto;font-weight:bold;color:#888;">X</div><p>해제</p>';
    emptyDiv.onclick = () => selectBuilderItem(null, '', '');
    list.appendChild(emptyDiv);

    if (builderData[type]) {
        builderData[type].forEach(item => {
            const div = document.createElement('div');
            div.className = 'select-item';
            div.innerHTML = `<img src="${item.img}" onerror="this.src='images/logo.png'"><p>${item.name}</p>`;
            
            if (usedIds.includes(item.id)) {
                div.classList.add('disabled');
            } else {
                div.onclick = () => selectBuilderItem(item.id, item.img, item.name);
            }
            
            list.appendChild(div);
        });
    }

    modal.style.display = 'flex';
}


function selectBuilderItem(itemId, imgSrc, itemName) {
    const { type, index } = currentSlot;
    currentBuild[type][index] = itemId;
    const imgEl = document.getElementById(`slot-${type}-${index}`);
    const nameEl = document.getElementById(`name-${type}-${index}`);
    const slotEl = imgEl.parentElement;
    const plusSpan = slotEl.querySelector('span');

    if (itemId) {
        imgEl.src = imgSrc;
        imgEl.style.display = 'block';
        if(plusSpan) plusSpan.style.display = 'none';
        slotEl.style.borderStyle = 'solid';
        if(nameEl) nameEl.innerText = itemName;
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
        if(plusSpan) plusSpan.style.display = 'block';
        slotEl.style.borderStyle = 'dashed';
        if(nameEl) nameEl.innerText = '';
    }
    closeBuilderModal(null); 
}

function closeBuilderModal(e) {
    if (e === null || e.target.classList.contains('modal-overlay')) {
        document.getElementById('builder-modal').style.display = 'none';
    }
}

function generateBuildUrl() {
    const creatorName = document.getElementById('creator-name').value.trim();
    const buildData = {
        w: currentBuild.weapons,
        h: currentBuild.hearts,
        m: currentBuild.marts,
        c: creatorName
    };
    const jsonString = JSON.stringify(buildData);
    const encodedString = btoa(unescape(encodeURIComponent(jsonString)));
    const origin = window.location.origin;
    let basePath = window.location.pathname.replace('index.html', ''); 
    if (!basePath.endsWith('/')) basePath += '/';
    const viewerUrl = `${origin}${basePath}viewer.html?b=${encodedString}`;
    const urlInput = document.getElementById('result-url');
    urlInput.value = viewerUrl;
    urlInput.style.display = 'block';
    navigator.clipboard.writeText(viewerUrl).then(() => alert("빌드 코드가 생성되었습니다!")).catch(() => alert("주소가 생성되었습니다."));
}

function loadViewer() {
    if (!builderData) {
        fetch('json/builder_data.json')
            .then(res => res.json())
            .then(data => { 
                builderData = data; 
                loadViewer(); 
            });
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('b');

    let w = [], h = [], m = [];
    let creator = "";

    if (encodedData) {
        try {
            const decodedString = decodeURIComponent(escape(atob(encodedData)));
            const parsedData = JSON.parse(decodedString);
            w = parsedData.w || [];
            h = parsedData.h || [];
            m = parsedData.m || [];
            creator = parsedData.c || "";
        } catch (e) {
            console.error("잘못된 빌드 주소입니다.", e);
            alert("빌드 정보를 불러올 수 없습니다.");
            return;
        }
    }

    const titleEl = document.getElementById('build-main-title');
    if (titleEl) {
        if (creator) {
            titleEl.innerText = `${creator}`;
        } else {
            titleEl.innerText = "익명의 협객의 빌드";
        }
    }

    const renderSlot = (type, ids, prefix) => {
        ids.forEach((id, idx) => {
            if (!id) return;
            const itemData = builderData[type].find(i => i.id === id);
            if (itemData) {
                const slotId = `${prefix}-${type}-${idx}`;
                const nameId = `name-${prefix}-${type}-${idx}`;
                const slotEl = document.getElementById(slotId);
                const nameEl = document.getElementById(nameId);

                if (slotEl) {
                    const img = slotEl.querySelector('img');
                    if (img) {
                        img.src = itemData.img;
                        img.style.display = 'block';
                    }
                    slotEl.style.border = '1px solid var(--wuxia-accent-gold)';
                }
                if (nameEl) {
                    nameEl.innerText = itemData.name;
                }
            }
        });
    };

    renderSlot('weapons', w, 'v');
    renderSlot('hearts', h, 'v');
    renderSlot('marts', m, 'v');
}

function downloadBuildImage() {
    const element = document.getElementById("capture-area"); 
    const titleEl = document.getElementById("build-main-title");
    
    let fileName = "연운_빌드";
    if (titleEl) {
        fileName = titleEl.innerText.replace(/\s/g, "_");
    }

    const btn = document.querySelector('.download-btn');
    const originalText = btn.innerText;
    btn.innerText = "🖼️ 변환 중...";
    btn.disabled = true;

    const options = {
        scale: 2,               
        backgroundColor: "#f4f4f2", 
        useCORS: true,          
        allowTaint: true,       
        logging: false,          
        
        onclone: (clonedDoc) => {
            const clonedArea = clonedDoc.getElementById("capture-area");
            
            const footer = clonedDoc.createElement('div');
            footer.style.marginTop = "30px";
            footer.style.paddingTop = "15px";
            footer.style.borderTop = "1px solid #ccc";
            footer.style.textAlign = "center";
            footer.style.color = "#555";
            footer.style.fontFamily = "'Noto Serif KR', serif";
            footer.style.fontSize = "0.9em";
            
            footer.innerHTML = "출처: <strong style='color:#a08040;'>연운 한국 위키</strong> (wwm.tips)";
            
            clonedArea.appendChild(footer);
        }
    };

    setTimeout(() => {
        html2canvas(element, options).then(canvas => {
            try {
                const imgData = canvas.toDataURL("image/jpeg", 0.9);
                const link = document.createElement("a");
                link.download = `${fileName}.jpg`;
                link.href = imgData;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                btn.innerText = originalText;
                btn.disabled = false;
            } catch (e) {
                console.error("보안 에러 발생:", e);
                alert("브라우저 보안 문제로 저장이 차단되었습니다.\n(서버 환경에서 실행해주세요.)");
                btn.innerText = "저장 실패";
                btn.disabled = false;
            }
        }).catch(err => {
            console.error("html2canvas 캡처 실패:", err);
            alert("이미지 변환 중 오류가 발생했습니다.");
            btn.innerText = originalText;
            btn.disabled = false;
        });
    }, 100);
}

/* =========================================
   [추가] 쿠폰 코드 복사 기능 (전역 함수)
   설명: code.html이 동적으로 로드되므로, 함수는 메인 스크립트에 있어야 합니다.
   ========================================= */
function copyToClipboard(text, btnElement) {
    // 1. 성공 시 버튼 UI 변경 효과 함수
    const handleSuccess = () => {
        if (!btnElement) return;
        const originalContent = btnElement.innerHTML;
        const originalBg = btnElement.style.backgroundColor;
        const originalColor = btnElement.style.color;
        const originalBorder = btnElement.style.borderColor;

        // 완료 스타일 적용
        btnElement.innerHTML = '<span class="copy-icon">✓</span> 완료';
        btnElement.style.backgroundColor = '#b08d55'; // var(--wuxia-accent-gold) 직접 적용
        btnElement.style.color = '#fff';
        btnElement.style.borderColor = '#b08d55';

        // 2초 후 원상복구
        setTimeout(() => {
            btnElement.innerHTML = originalContent;
            btnElement.style.backgroundColor = originalBg;
            btnElement.style.color = originalColor;
            btnElement.style.borderColor = originalBorder;
        }, 2000);
    };

    // 2. 모바일/PC 호환 복사 로직
    if (navigator.clipboard && navigator.clipboard.writeText) {
        // 최신 방식 (빌더에서 작동했던 방식)
        navigator.clipboard.writeText(text)
            .then(handleSuccess)
            .catch(err => {
                // 권한 문제 등으로 실패 시 fallback 실행
                fallbackCopy(text, btnElement, handleSuccess);
            });
    } else {
        // 구형 방식 (fallback)
        fallbackCopy(text, btnElement, handleSuccess);
    }
}

// 구형 브라우저 및 일부 인앱 브라우저용 Fallback
function fallbackCopy(text, btnElement, successCallback) {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // 화면 튐 방지 스타일
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // iOS 대응
        textArea.setSelectionRange(0, 99999); 

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            successCallback();
        } else {
            prompt("복사하기: 아래 텍스트를 복사하세요.", text);
        }
    } catch (err) {
        prompt("복사하기: 아래 텍스트를 복사하세요.", text);
    }
}


/* =========================================
   [script.js - 더미 데이터 포함 버전]
   ========================================= */

// 1. [더미 데이터] 슬라이더 뉴스 (이미지가 없으면 색상 박스로 대체됨)
const dummyNewsData = [
    {
        id: "d1",
        title: "12월 12일 모바일 정식 출시",
        tag: "공지",
        content: "PC와 모바일의 경계를 허무는 크로스 플랫폼 지원. <br>지금 사전 예약하고 한정판 의상을 받으세요!",
        link: "#",
        image: "" // 테스트용 이미지 URL
    },
    {
        id: "d2",
        title: "12월 12일 모바일 업데이트 노트",
        tag: "업데이트",
        content: "플레이스테이션 환경이 보다 쾌적하게 개선됩니다.",
        link: "#",
        image: ""
    }
];

// 2. [더미 데이터] 지도 정보 (첨부 이미지 스타일 테스트용)
const dummyMapData = [
    {
        title: "청하",
        desc: "초보 협객들의 수련 장소로 적합합니다.",
        link: "https://yhellos3327-eng.github.io/wwmkoreamap/",
        image: "https://via.placeholder.com/600x300/263238/ffffff?text=Blue+Lake"
    },
    {
        title: "개봉",
        desc: "수많은 고수들이 도전했으나 돌아오지 못했습니다.",
        link: "https://yhellos3327-eng.github.io/wwmkoreamap/",
        image: "https://via.placeholder.com/600x300/455a64/ffffff?text=Frozen+Peak"
    }
];


// === [기능 로직] ===

let currentSlideIndex = 0;
let slideInterval;

// (1) 메인 슬라이더 로딩 (더미 데이터 사용)
function loadHomeSlider() {
    const track = document.getElementById('hero-slider-track');
    const indicators = document.getElementById('slider-indicators');
    
    if (!track) return;

    // 초기화
    track.innerHTML = '';
    indicators.innerHTML = '';

    dummyNewsData.forEach((news, index) => {
        // 슬라이드 생성
        const slideDiv = document.createElement('div');
        slideDiv.className = 'hero-slide';
        // 실제 이미지가 있다면 url('images/...') 형식이 됩니다.
        slideDiv.style.backgroundImage = `url('${news.image}')`; 
        
        slideDiv.innerHTML = `
            <div class="slide-content">
                <span class="slide-tag">${news.tag}</span>
                <h2 class="slide-title">${news.title}</h2>
                <p class="slide-desc">${news.content.replace(/<br>/g, ' ')}</p>
                <a href="${news.link}" class="slide-link-btn">자세히 보기 ↗</a>
            </div>
        `;
        
      /* script.js 내 loadHomeSlider 함수 내부의 slideDiv.onclick 부분 수정 */

slideDiv.onclick = () => {
    // 1. 가이드 파일 로드 (예: guide:build.html)
    if (news.link.startsWith('guide:')) {
        const fileName = news.link.split(':')[1]; // 'beginner_guide.html' 추출
        
        switchTab('guide'); // ① 가이드 탭으로 화면 전환
        
        // ② 탭 전환 후 약간의 딜레이(0.1초)를 두고 콘텐츠 로드 (안정성 확보)
        setTimeout(() => {
            // 만약 loadGuideContent 함수가 정의되어 있다면 실행
            if (typeof loadGuideContent === 'function') {
                loadGuideContent(fileName); 
            } else {
                console.error('loadGuideContent 함수가 없습니다.');
            }
        }, 100);
    } 
    // 2. 기존 탭 이동 (예: tab:quest)
    else if (news.link.startsWith('tab:')) {
        const targetTab = news.link.split(':')[1];
        switchTab(targetTab); 
    } 
    // 3. 외부 링크 (새 창)
    else {
        window.open(news.link, '_blank');
    }
};
        slideDiv.style.cursor = 'pointer';

        track.appendChild(slideDiv);

        // 인디케이터 생성
        const dot = document.createElement('div');
        dot.className = `indicator ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        indicators.appendChild(dot);
    });

    startSlider();
}
// 슬라이더 상태 변수
let currentSlideIndex = 0;
let slideInterval;

// 1. news.json 데이터를 불러와 슬라이더 생성
function loadHomeSlider() {
    const track = document.getElementById('hero-slider-track');
    const indicators = document.getElementById('slider-indicators');
    
    if (!track) return;

    // 초기화
    track.innerHTML = '';
    indicators.innerHTML = '';

    // 실제 데이터 Fetch
    fetch('news.json')
        .then(response => {
            if (!response.ok) throw new Error("네트워크 응답 실패");
            return response.json();
        })
        .then(data => {
            // 최신 5개만 슬라이더에 표시
            const sliderData = data.slice(0, 5);
            
            if (sliderData.length === 0) return;

            sliderData.forEach((news, index) => {
                // 1) 태그 자동 생성 로직 (news.json에 tag가 없으므로 제목기반 추론)
                let tag = "NEWS";
                if (news.title.includes("업데이트")) tag = "업데이트";
                else if (news.title.includes("이벤트")) tag = "이벤트";
                else if (news.title.includes("출시") || news.title.includes("공지")) tag = "공지";
                else if (news.title.includes("노트")) tag = "개발자 노트";

                // 2) 본문 미리보기 텍스트 정리 (HTML 태그 제거)
                const cleanDesc = news.content.replace(/<[^>]*>?/gm, ' ').substring(0, 80) + '...';
                
                // 3) 슬라이드 요소 생성
                const slideDiv = document.createElement('div');
                slideDiv.className = 'hero-slide';
                // 이미지 경로가 없으면 기본 이미지 사용
                const bgImage = news.image ? news.image : 'images/bg.jpg';
                slideDiv.style.backgroundImage = `url('${bgImage}')`;
                
                slideDiv.innerHTML = `
                    <div class="slide-content">
                        <span class="slide-tag">${tag}</span>
                        <h2 class="slide-title">${news.title}</h2>
                        <p class="slide-desc">${cleanDesc}</p>
                        <button class="slide-link-btn">자세히 보기 ↗</button>
                    </div>
                `;
                
                // 4) 클릭 이벤트 처리 (외부링크, 탭이동, 가이드로드)
                slideDiv.onclick = () => {
                    const link = news.link || '#';

                    if (link.startsWith('guide:')) {
                        // "guide:파일명.html" 형식
                        const fileName = link.split(':')[1];
                        switchTab('guide');
                        setTimeout(() => {
                            if (typeof loadGuideContent === 'function') loadGuideContent(fileName);
                        }, 100);
                    } else if (link.startsWith('tab:')) {
                        // "tab:탭이름" 형식
                        const targetTab = link.split(':')[1];
                        switchTab(targetTab);
                    } else {
                        // 일반 URL
                        window.open(link, '_blank');
                    }
                };

                track.appendChild(slideDiv);

                // 5) 인디케이터(점) 생성
                const dot = document.createElement('div');
                dot.className = `indicator ${index === 0 ? 'active' : ''}`;
                dot.onclick = (e) => {
                    e.stopPropagation(); // 버블링 방지
                    goToSlide(index);
                };
                indicators.appendChild(dot);
            });

            // 데이터 로딩 후 슬라이더 시작
            startSlider();
        })
        .catch(error => {
            console.error('뉴스 데이터를 불러오는데 실패했습니다:', error);
            track.innerHTML = '<div style="color:white; text-align:center; padding-top:100px;">데이터를 불러올 수 없습니다.</div>';
        });
}

// 2. 슬라이드 이동 (DOM 요소 개수 기반으로 수정됨)
function moveSlide(direction) {
    const track = document.getElementById('hero-slider-track');
    if (!track || track.children.length === 0) return;

    const totalSlides = track.children.length; // 실제 생성된 슬라이드 개수
    currentSlideIndex = (currentSlideIndex + direction + totalSlides) % totalSlides;
    
    updateSliderPosition();
    resetSliderTimer();
}

// 3. 특정 슬라이드로 점프
function goToSlide(index) {
    currentSlideIndex = index;
    updateSliderPosition();
    resetSliderTimer();
}

// 4. 화면 업데이트
function updateSliderPosition() {
    const track = document.getElementById('hero-slider-track');
    const indicators = document.querySelectorAll('.indicator');
    
    if (track) {
        track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    }
    
    indicators.forEach((dot, idx) => {
        if (idx === currentSlideIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

// 5. 타이머 제어
function startSlider() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        moveSlide(1);
    }, 5000); // 5초 대기
}

function resetSliderTimer() {
    if (slideInterval) clearInterval(slideInterval);
    startSlider();
}
// === [초기화] 페이지 로드 시 실행 ===
// 이 부분은 script.js 하단 혹은 switchTab 함수 내에 위치해야 합니다.
document.addEventListener("DOMContentLoaded", () => {
    // 홈 화면일 때 로딩
    loadHomeSlider();
    loadHomeMaps();
    // loadRecentItems(); // 기존 퀘스트 로딩 함수 (있다면 유지)
});


/* script.js 하단에 추가 */

function loadGuideContent(fileName, btnElement) {
    const loader = document.getElementById('guide-content-loader');
    if (!loader) return;

    // 1. 로딩 표시
    loader.innerHTML = '<div style="padding:20px; text-align:center;">비급을 펼치는 중...</div>';

    // 2. fetch로 HTML 파일 가져오기
    // (실제 서버나 로컬 파일이 있어야 작동합니다. 없으면 에러 메시지 표시)
    fetch(fileName)
        .then(response => {
            if (!response.ok) throw new Error("파일을 찾을 수 없습니다.");
            return response.text();
        })
        .then(html => {
            loader.innerHTML = html; // 내용 집어넣기
        })
        .catch(error => {
            console.error(error);
            loader.innerHTML = `
                <div style="padding:20px; text-align:center; color:var(--wuxia-accent-red);">
                    <h3>내용을 불러올 수 없습니다.</h3>
                    <p>파일 경로(${fileName})를 확인해주세요.</p>
                </div>`;
        });

    // 3. (선택사항) 사이드바 버튼 활성화 스타일 처리
    // 슬라이더에서 호출했을 때는 btnElement가 없으므로 무시
    if (btnElement) {
        document.querySelectorAll('.guide-item-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }
}