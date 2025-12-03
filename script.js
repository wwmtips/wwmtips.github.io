/* =========================================
   script.js (최종 통합본: 가이드 로직 완성)
   ========================================= */

// 전역 변수
let globalData = { items: [], quiz: [], quests: [], news: [] };
let currentQuestData = [];
let currentPage = 1;
const itemsPerPage = 12;
let isGuideLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
    // 1. 데이터 로드 시작
    loadData();

    // 2. 통합 검색창 관련 요소 가져오기
    const headerSearch = document.getElementById("header-search-input");
    const clearBtn = document.getElementById("search-clear-btn");       // X 버튼
    const searchResults = document.getElementById("global-search-results"); // 결과창

    // 3. 통합 검색창 이벤트 리스너 설정
    if (headerSearch) {
        
        // [입력 이벤트] 검색 실행 및 X 버튼 표시 제어
        headerSearch.addEventListener("input", (e) => {
            handleGlobalSearch(e); // 검색 함수 실행
            
            // 글자가 공백 제외하고 1자라도 있으면 X 버튼 표시
            if (e.target.value.trim() !== '' && clearBtn) {
                clearBtn.style.display = 'block';
            } else if (clearBtn) {
                clearBtn.style.display = 'none';
            }
        });

        // [키다운 이벤트] 엔터 키 누르면 키보드만 내리기 (Blur)
        headerSearch.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();  // 폼 제출 등 기본 동작 방지
                headerSearch.blur(); // 포커스 해제 -> 모바일 키보드 내려감 (내용은 유지)
            }
        });

        // [블러 이벤트] 포커스 잃으면 결과창 숨기기 (클릭할 시간 벌기 위해 딜레이)
        headerSearch.addEventListener("blur", () => {
            setTimeout(() => {
                if (searchResults) searchResults.style.display = 'none';
            }, 200);
        });
    }

    // 4. X 버튼 클릭 이벤트: 내용 초기화
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (headerSearch) {
                headerSearch.value = ''; // 1. 입력값 비우기
                headerSearch.focus();    // 2. 다시 입력할 수 있도록 포커스 유지
            }
            clearBtn.style.display = 'none'; // 3. X 버튼 숨기기
            
            // 4. 검색 결과창도 닫기
            if (searchResults) searchResults.style.display = 'none'; 
        });
    }

    // 5. 족보 탭 내부 검색 리스너 (기존 유지)
    const quizLocalSearch = document.getElementById("quiz-local-search");
    if (quizLocalSearch) {
        quizLocalSearch.addEventListener("input", (e) => {
            // 검색어에 맞춰 필터링하고, 하이라이팅을 위해 키워드도 같이 넘김
            renderQuizTable(filterQuizData(e.target.value), e.target.value);
        });
    }

    // 6. URL 파라미터 체크 (탭 이동 등)
    checkUrlParams();
});

// [기능] URL 파라미터 처리 함수
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); 

    if (tab === 'quiz') switchTab('quiz');
    else if (tab === 'quest') switchTab('quest');
    else if (tab === 'news') switchTab('news');
    else if (tab === 'guide') switchTab('guide'); 
    else if (tab === 'code') switchTab('guide'); 
    else switchTab('home');
}

// [기능] 데이터 로드
function loadData() {
    // [수정 1] 비동기 요청(fetch) 전에 URL 파라미터를 미리 '캡처'해 둡니다.
    // 나중에 switchTab이 실행되어 URL이 변경되더라도, 여기 저장된 값은 유지됩니다.
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    const targetId = urlParams.get('id');

    // 로컬/서버 환경에 맞춰 절대 경로 사용 (/json/...)
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

        // 1. 족보 초기화
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

        /* ============================================================
           [수정 2] 위에서 미리 캡처해둔 targetTab과 targetId 변수를 사용합니다.
           (window.location.search를 다시 읽지 않음)
           ============================================================ */
        if (targetTab === 'quest' && targetId) {
            // 입력받은 id가 숫자면 'q'를 붙여줌 (1 -> q1)
            // 이미 'q1' 형태라면 그대로 사용
            const formattedId = targetId.toLowerCase().startsWith('q') ? targetId : 'q' + targetId;
            
            // globalData에서 해당 ID를 가진 퀘스트 찾기
            const foundQuest = globalData.quests.find(q => q.id === formattedId);
            
            if (foundQuest) {
                // 상세 페이지 로드 함수 호출
                loadQuestDetail(foundQuest.filepath);
            }
        }
    })
    .catch(error => {
        console.error("데이터 로드 중 오류 발생:", error);
    });
}



// =========================================
// 탭 전환 및 뷰 제어 (Switch Tab)
// =========================================
function switchTab(tabName) {
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide'];
    const navs = ['nav-home', 'nav-quiz', 'nav-quest', 'nav-code'];

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
    // [가이드 탭]
    else if (tabName === 'guide' || tabName === 'code') {
        const guideView = document.getElementById('view-guide');
        if (guideView) {
            guideView.style.display = 'block';
            loadGuideView(); // 가이드 페이지 로드
        }
        
        const navBtn = document.getElementById('nav-code');
        if (navBtn) navBtn.classList.add('active');
        
        history.pushState(null, null, '?tab=guide');
    }
}

// =========================================
// [기능] 가이드 및 교환 코드 관련 로직
// =========================================
function loadGuideView() {
    const container = document.getElementById('guide-content-loader');
    if (!container) return;

    // 1. URL 파라미터 확인 및 파일 매핑
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id'); // URL에서 ?id=값 가져오기

    // [설정] id 값과 연결될 실제 파일명 매핑
    // 예: ?id=tierlist 로 들어오면 guide_tier.html을 엽니다.
    const guideMap = {
        'news': 'news.html',             // ?id=news
        'tierlist': 'guide_tier.html',   // ?id=tierlist (티어 목록)
        'weapon': 'tier_weapon.html',    // ?id=weapon (무기 티어)
        'build': 'build.html',           // ?id=build
        'map': 'maps.html',              // ?id=map
        'side': 'beta.html',             // ?id=side (사이드 퀘스트)
        'npc': 'npc.html',               // ?id=npc
        'boss': 'boss.html',             // ?id=boss
        'marts': 'marts.html',           // ?id=marts (무공)
        'harts': 'harts.html',           // ?id=harts (심법)
        'skill': 'skils.html',           // ?id=skill (기술)
        'majang': 'majang.html',         // ?id=majang
        'code': 'code.html'              // ?id=code
    };

    // 로드할 파일 결정: ID가 있고 매핑된 파일이 있으면 그 파일, 아니면 기본값 'news.html'
    let fileToLoad = 'news.html';
    if (targetId && guideMap[targetId]) {
        fileToLoad = guideMap[targetId];
    }

    // 2. 이미 가이드 프레임이 로드된 경우 -> 결정된 파일만 바로 로드
    if (isGuideLoaded) {
        loadGuideContent(fileToLoad);
        return; 
    }
    
    // 3. 가이드 프레임 최초 로드
    fetch('guide.html') 
        .then(res => {
            if(!res.ok) throw new Error("guide.html not found");
            return res.text();
        })
        .then(html => {
            container.innerHTML = html;
            container.style.marginTop = '0';
            isGuideLoaded = true;
            
            // 프레임 로드 직후 결정된 파일(fileToLoad)을 띄움
            loadGuideContent(fileToLoad); 
        })
        .catch(err => {
            container.innerHTML = `<div style="padding:20px; color:red;">가이드 페이지 로드 실패</div>`;
        });
}

// 가이드 페이지 안에서 교환 코드(code.html) 불러오기 (자동 로드 및 버튼 클릭)
function loadCodeInGuide(isAutoLoad = false) {
    const innerContainer = document.getElementById('guide-dynamic-content');
    if(!innerContainer) return;

    // [수동] AND 이미 열려 있으면 닫기 (토글 기능)
    if (!isAutoLoad && innerContainer.style.display === 'block' && innerContainer.innerHTML.trim() !== '') {
        innerContainer.style.display = 'none';
        return;
    }

    // 무조건 보이게 설정
    innerContainer.style.display = 'block';
    
    // 내용이 없거나 자동 로드일 경우에만 fetch 실행
    if (innerContainer.innerHTML.trim() === '' || isAutoLoad) {
        innerContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">코드를 불러오는 중...</div>';

        fetch('code.html') // code.html 파일 로드
            .then(res => {
                if(!res.ok) throw new Error("code.html not found");
                return res.text();
            })
            .then(html => {
                innerContainer.innerHTML = html;
                if (!isAutoLoad) {
                    // 수동 클릭 시에만 스크롤 이동
                   // innerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            })
            .catch(err => {
                innerContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">코드 목록을 불러오지 못했습니다.</div>`;
            });
    }
}

// [NEW] 일반 가이드 내용 로드 함수
function loadGuideContent(filename, btnElement) {
    const innerContainer = document.getElementById('guide-dynamic-content');
    if(!innerContainer) return;

    // 만약 code.html이 열려있다면 닫아주기
    const codeView = document.querySelector('.code-page-container');
    if(codeView) codeView.style.display = 'none'; // 혹은 innerHTML 초기화
    
    // 로딩 표시
    innerContainer.style.display = 'block';
    innerContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#888;">컨텐츠 로딩 중...</div>';
    
    // 파일 가져오기
    fetch(filename)
        .then(res => {
            if(!res.ok) throw new Error("File not found");
            return res.text();
        })
        .then(html => {
            innerContainer.innerHTML = html;
          //  innerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // [추가된 부분] 뉴스 페이지가 로드되었다면 JS로 리스트를 렌더링
            if (filename === 'news.html') {
                renderGuideNewsList(); 
            }
        })
        .catch(err => {
            innerContainer.innerHTML = `<div style="text-align:center; padding:50px; color:#888;">
                <h3 style="color:var(--wuxia-accent-gold);">정보 준비 중입니다.</h3>
                <p>죄송합니다. 해당 공략은 아직 작성 중입니다.</p>
            </div>`;
        });
}

// [추가] 가이드 내부 뉴스 리스트 렌더링 함수
function renderGuideNewsList() {
    const container = document.getElementById('guide-inner-news-list');
    if (!container) return;

    // globalData.news가 로드되어 있는지 확인
    if (!globalData.news || globalData.news.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888;">최신 뉴스를 불러올 수 없습니다.</div>';
        return;
    }

    container.innerHTML = ''; // 로딩 텍스트 제거

    // 상위 5개 혹은 전체 표시 (여기서는 5개로 제한)
    const displayList = globalData.news.slice(0, 5); 

    displayList.forEach(item => {
        // 기존 createNewsElement 함수 재사용 (스타일 통일)
        const el = createNewsElement(item);
        
        // harts.html 스타일과 어울리도록 약간의 커스텀 스타일 추가 (선택사항)
        el.style.borderBottom = '1px dashed #444'; 
        el.style.backgroundColor = 'transparent'; // 투명 배경
        
        container.appendChild(el);
    });
}

// 클립보드 복사 함수
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`코드 [${text}] 가 복사되었습니다!`);
    }).catch(err => {
        alert('복사에 실패했습니다. 직접 복사해주세요.');
    });
}

// =========================================
// (나머지 함수들은 이전과 동일)
// =========================================

// 뉴스 관련 로직
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

// 퀘스트 관련 로직
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

// 족보 관련 로직
// script.js 파일의 renderQuizTable 함수 전체를 이 코드로 대체합니다.
function renderQuizTable(data, keyword = '') {
    const tbody = document.getElementById('quiz-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        // 컬럼 개수를 3개(단서, 정답, 제보)로 변경
        tbody.innerHTML = `<tr><td colspan="3" style="padding:20px; color:#888;">결과가 없습니다.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        let hint = item.hint;
        let answer = item.answer;
        
        // 제보자 이름은 user 필드에서 가져오고, 없으면 비워둡니다.
        const user = item.user || '-';

        if (keyword) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            hint = hint.replace(regex, '<span class="highlight">$1</span>');
            answer = answer.replace(regex, '<span class="highlight">$1</span>');
        }

        // 제보 (user) 열 추가
        tr.innerHTML = `
            <td>${hint}</td>
            <td>${answer}</td>
            <td class="user-cell">${user}</td>
        `;
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
