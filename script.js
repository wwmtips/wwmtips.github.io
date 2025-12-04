/* =========================================
   script.js (최종 수정본: renderNews 추가 및 빌더 통합)
   ========================================= */

// 전역 변수
let currentQuestData = [];
let currentPage = 1;
const itemsPerPage = 12;
let isGuideLoaded = false;

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
// [기능] 데이터 로드 (강력한 오류 방지 적용)
// =========================================
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    const targetId = urlParams.get('id');

    Promise.all([
        fetch('json/data.json').then(res => res.json()),
        fetch('json/quests.json').then(res => res.json()),
        fetch('json/news.json').then(res => res.json())
    ])
    .then(([mainData, questData, newsData]) => {
        console.log("데이터 로드 성공:", { questData, newsData });

        // 1. 퀘스트 데이터 파싱 (배열/객체 자동 감지)
        let quests = [];
        if (Array.isArray(questData)) {
            quests = questData;
        } else if (questData.quests) {
            quests = questData.quests;
        }

        // 2. 뉴스 데이터 파싱 (배열/객체 자동 감지)
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

        // 5. 화면 렌더링 (순서 중요)
        renderQuizTable(globalData.quiz);
        updateQuizCounter();

        renderQuestList();                // 무림록 리스트
        renderHomeQuests(globalData.quests); // 홈 화면 퀘스트
        renderHomeNews(globalData.news);     // 홈 화면 뉴스
        
        // [수정] renderNews가 없어서 문제가 되었다면 여기서 해결
        if (typeof renderNews === 'function') {
            renderNews(globalData.news);
        } else {
            renderFullNews(globalData.news); // 대체 함수 실행
        }

        // 6. 바로가기
        if (targetTab === 'quest' && targetId) {
            const formattedId = targetId.toLowerCase().startsWith('q') ? targetId : 'q' + targetId;
            const foundQuest = globalData.quests.find(q => q.id === formattedId);
            if (foundQuest) {
                loadQuestDetail(foundQuest.filepath);
            }
        }
    })
    .catch(error => {
        console.error("데이터 로드 중 오류 발생:", error);
    });
}

// 족보 카운터 업데이트 함수 분리
function updateQuizCounter() {
    const counter = document.getElementById('quiz-counter-area');
    if(counter && globalData.quiz.length > 0) {
        const userCounts = {};
        globalData.quiz.forEach(item => {
            if (item.user && item.user.trim() !== "") {
                const u = item.user.trim();
                userCounts[u] = (userCounts[u] || 0) + 1;
            }
        });
        let topUser = null;
        let maxCount = 0;
        for (const [user, count] of Object.entries(userCounts)) {
            if (count > maxCount) {
                maxCount = count;
                topUser = user;
            }
        }
        let message = `총 ${globalData.quiz.length}개의 족보가 등록되었습니다.`;
        if (topUser) {
            message += `<br><span style="font-size: 0.8em; color: #888; font-weight: normal;">
                (👑 강호의 고수: <strong class="rainbow-text">${topUser}</strong>님 - ${maxCount}개)
            </span>`;
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
        history.pushState(null, null, '?tab=home'); 
    } 
    else if (tabName === 'quiz') {
        document.getElementById('view-quiz').style.display = 'block';
        document.getElementById('nav-quiz').classList.add('active');
        history.pushState(null, null, '?tab=quiz');
    } 
    else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');
        showQuestList();
        
        // 무림록 필터 초기화
        const allBtn = document.querySelector('#view-quest .guide-item-btn[onclick*="all"]');
        if (allBtn) filterQuestType('all', allBtn);
        
        history.pushState(null, null, '?tab=quest');
    } 
    else if (tabName === 'news') {
        document.getElementById('view-news').style.display = 'block';
        history.pushState(null, null, '?tab=news');
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
        history.pushState(null, null, '?tab=guide');
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
        history.pushState(null, null, '?tab=builder');
    }
}

// URL 체크
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); 
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
function loadGuideView() {
    const container = document.getElementById('guide-content-loader');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    const guideMap = {
        'news': 'news.html', 'tierlist': 'guide_tier.html', 'weapon': 'tier_weapon.html',
        'build': 'build.html', 'map': 'maps.html', 'side': 'beta.html', 'npc': 'npc.html',
        'boss': 'boss.html', 'marts': 'marts.html', 'harts': 'harts.html', 'skill': 'skils.html',
        'majang': 'majang.html', 'code': 'code.html'
    };

    let fileToLoad = 'news.html';
    if (targetId && guideMap[targetId]) fileToLoad = guideMap[targetId];

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

// [추가] renderNews 함수 (renderFullNews의 별칭)
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
        // 데이터가 없으면 전체 데이터로 재시도
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
    card.onclick = () => { switchTab('quest'); loadQuestDetail(quest.filepath); };
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

function loadQuestDetail(filepath) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    if(listView) listView.style.display = 'none';
    if(detailView) detailView.style.display = 'block';
    if(contentBox) contentBox.innerHTML = '<div style="text-align:center; padding:50px;">로딩 중...</div>';

    fetch(filepath).then(res => res.text()).then(html => {
        if(contentBox) contentBox.innerHTML = html;
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

// 필터 버튼 (범위 한정)
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
            resultsHTML += `<div class="search-result-item" onclick="selectQuestResult('${quest.filepath}')"><span class="badge item">퀘스트</span> <span class="result-text">${quest.name}</span></div>`;
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

function selectQuestResult(filepath) {
    switchTab('quest');
    loadQuestDetail(filepath);
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
            div.onclick = () => selectBuilderItem(item.id, item.img, item.name);
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
        fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; loadViewer(); });
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('b');
    let w=[], h=[], m=[], creator="";

    if (encodedData) {
        try {
            const decodedString = decodeURIComponent(escape(atob(encodedData)));
            const parsedData = JSON.parse(decodedString);
            w = parsedData.w || []; h = parsedData.h || []; m = parsedData.m || []; creator = parsedData.c || "";
        } catch (e) { console.error("잘못된 빌드 주소", e); }
    }

    const authorEl = document.getElementById('build-author');
    if (authorEl) {
        authorEl.innerHTML = creator ? `제작자: <strong style="color:var(--wuxia-text-main);">${creator}</strong>` : `제작자: <span style="color:#aaa;">익명의 협객</span>`;
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
                    if (img) { img.src = itemData.img; img.style.display = 'block'; }
                    slotEl.style.border = '1px solid var(--wuxia-accent-gold)';
                }
                if (nameEl) nameEl.innerText = itemData.name;
            }
        });
    };
    renderSlot('weapons', w, 'v'); renderSlot('hearts', h, 'v'); renderSlot('marts', m, 'v');
}
