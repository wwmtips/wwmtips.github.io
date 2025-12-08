  
/* =========================================
   script.js (최종 수정본 - 커뮤니티 알림 추가)
   ========================================= */

// =========================================
// 1. 전역 변수 및 데이터 저장소
// =========================================
let currentQuestData = [];
let currentPage = 1;
const itemsPerPage = 12;
let isGuideLoaded = false;

// 슬라이더 관련 변수
let currentSlideIndex = 0;
let slideInterval;

// 데이터 저장소 (cnews 추가됨)
let globalData = { items: [], quiz: [], quests: [], news: [], cnews: [] };
let builderData = null; 

// 빌더 상태 관리
let currentBuild = { weapons: [null,null], hearts: [null,null,null,null], marts: new Array(8).fill(null) };
let currentSlot = { type: '', index: 0 };

// [지도 더미 데이터]
const dummyMapData = [
    {
        title: "청하",
        desc: "어린 주인공이 많은 가족들과 함께 생활하던 지역으로 이야기의 시작지입니다.",
        link: "https://yhellos3327-eng.github.io/wwmkoreamap/",
        image: "images/map2.jpeg" 
    },
    {
        title: "개봉",
        desc: "강호로 한 발 다가간 주인공은 개봉에서 수많은 강호인들과 인연을 쌓습니다.",
        link: "https://yhellos3327-eng.github.io/wwmkoreamap/",
        image: "images/map1.jpeg"
     }
];

// =========================================
// 2. 초기화 (DOMContentLoaded)
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    // A. 데이터 로드
    loadData();
    loadHomeMaps();   // 지도 섹션 로드

    // B. 통합 검색창 설정
    setupGlobalSearch();

    // C. 족보 탭 로컬 검색 설정
    setupQuizSearch();

    // D. URL 파라미터 체크 및 탭 이동
    checkUrlParams();
});

// =========================================
// 3. 데이터 로딩 및 처리
// =========================================
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    const targetId = urlParams.get('id');
    const shortQuestId = urlParams.get('q'); 

    // [수정됨] cnews.json 추가 로드
    Promise.all([
        fetch('json/data.json').then(res => res.json()).catch(err => { console.warn('data.json 로드 실패', err); return {}; }),
        fetch('json/quests.json').then(res => res.json()).catch(err => { console.warn('quests.json 로드 실패', err); return []; }), 
        fetch('json/news.json').then(res => res.json()).catch(err => { console.warn('news.json 로드 실패', err); return []; }),
        fetch('json/cnews.json').then(res => res.json()).catch(err => { console.warn('cnews.json 로드 실패', err); return []; })
    ])
    .then(([mainData, questData, newsData, cnewsData]) => {
        console.log("데이터 로드 완료");

        // 1. 퀘스트 데이터 파싱
        let quests = Array.isArray(questData) ? questData : (questData.quests || []);
        
        // 2. 뉴스 데이터 파싱
        let news = Array.isArray(newsData) ? newsData : (newsData.news || []);

        // 3. 커뮤니티 뉴스 데이터 파싱
        let cnews = Array.isArray(cnewsData) ? cnewsData : (cnewsData.cnews || []);

        // 4. 정렬 (ID 기준 역순: q26 -> q1)
        if (quests.length > 0) {
            quests.sort((a, b) => {
                const numA = parseInt((a.id || "").replace('q', '')) || 0;
                const numB = parseInt((b.id || "").replace('q', '')) || 0;
                return numB - numA; 
            });
        }
        
        // 5. 전역 변수 저장
        globalData = {
            items: mainData.items || [],
            quiz: mainData.quiz || [],
            quests: quests, 
            news: news,
            cnews: cnews // 저장
        };

        currentQuestData = globalData.quests;

        // 6. 화면 렌더링
        renderQuizTable(globalData.quiz);
        updateQuizCounter();
        renderQuestList();                
        
        // [홈 화면 렌더링]
        renderHomeSlider(globalData.quests); 
        renderHomeRecentNews(globalData.news);     
        renderHomeCommunityNews(globalData.cnews); // [신규] 커뮤니티 알림 렌더링
        
        renderFullNews(globalData.news);

        // 7. 딥링크 처리
        if (shortQuestId) {
            const fullId = 'q' + shortQuestId;
            const foundQuest = globalData.quests.find(q => q.id === fullId);
            if (foundQuest) loadQuestDetail(foundQuest.filepath, fullId); 
        }
        else if (targetTab === 'quest' && targetId) {
            const formattedId = targetId.toLowerCase().startsWith('q') ? targetId : 'q' + targetId;
            const foundQuest = globalData.quests.find(q => q.id === formattedId);
            if (foundQuest) loadQuestDetail(foundQuest.filepath, formattedId);
        }
    })
    .catch(error => {
        console.error("데이터 처리 중 오류 발생:", error);
    });
}

// =========================================
// 4. 홈 화면 로직 (슬라이더 & 뉴스 & 커뮤니티 & 지도)
// =========================================

// [슬라이더] 
function renderHomeSlider(quests) {
    const track = document.getElementById('hero-slider-track');
    const indicators = document.getElementById('slider-indicators');
    
    if (!track) return;

    track.innerHTML = '';
    indicators.innerHTML = '';

    const sliderData = quests.slice(0, 3);

    if (sliderData.length === 0) {
        track.innerHTML = '<div style="color:white; text-align:center; padding-top:100px;">불러올 소식이 없습니다.</div>';
        return;
    }

    sliderData.forEach((quest, index) => {
        const tag = quest.type || "분류 없음";
        const title = quest.name;
        const desc = quest.location || "지역 정보 없음"; 
        
        const bgImage = quest.bgimg ? `quests/images/${quest.bgimg}` : 'images/bg.jpg';
        
        const slideDiv = document.createElement('div');
        slideDiv.className = 'hero-slide';
        slideDiv.style.backgroundImage = `url('${bgImage}')`;
        
        slideDiv.innerHTML = `
            <div class="slide-content">
                <span class="slide-tag">${tag}</span>
                <h2 class="slide-title">${title}</h2>
                <p class="slide-desc">${desc}</p>
                <button class="slide-link-btn">이야기 확인하기 ↗</button>
            </div>
        `;
        
        slideDiv.onclick = () => {
            switchTab('quest');
            loadQuestDetail(quest.filepath, quest.id);
        };
        slideDiv.style.cursor = 'pointer';

        track.appendChild(slideDiv);

        const dot = document.createElement('div');
        dot.className = `indicator ${index === 0 ? 'active' : ''}`;
        dot.onclick = (e) => {
            e.stopPropagation();
            goToSlide(index);
        };
        indicators.appendChild(dot);
    });

    startSlider();
}

// [홈 하단 목록 1] 최근 소식
function renderHomeRecentNews(newsList) {
    const container = document.getElementById('home-recent-news') || document.getElementById('home-quest-list');
    if (!container) return;
    
    renderNewsListGeneric(newsList, container, 'news');
}

// [홈 하단 목록 2] 커뮤니티 알림 (신규)
function renderHomeCommunityNews(cnewsList) {
    const container = document.getElementById('home-community-news');
    if (!container) return;

    renderNewsListGeneric(cnewsList, container, 'cnews');
}

// [공통 함수] 뉴스 리스트 렌더링 로직 (최근 소식 & 커뮤니티 알림 공용)
function renderNewsListGeneric(dataList, container, type) {
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0';

    const listToRender = dataList.slice(0, 3); // 최신 5개

    if (listToRender.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#888; text-align:center;">등록된 내용이 없습니다.</div>';
        return;
    }

    listToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'recent-news-item'; // CSS 클래스 재사용
        itemDiv.style.padding = '10px 5px'; 
        itemDiv.style.borderBottom = '1px solid #eee';
        itemDiv.style.cursor = 'pointer';
        itemDiv.style.display = 'flex';
        itemDiv.style.justifyContent = 'space-between';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.transition = 'background-color 0.2s';

        itemDiv.onmouseover = () => { itemDiv.style.backgroundColor = '#f9f9f9'; };
        itemDiv.onmouseout = () => { itemDiv.style.backgroundColor = 'transparent'; };
        
        // 클릭 이벤트
        itemDiv.onclick = () => { 
            if (item.link && item.link.trim() !== "") {
                window.open(item.link, '_blank'); 
            } else {
                // 링크가 없으면 일단 아무 동작도 안하거나, 
                // type에 따라 분기 가능 (현재는 그냥 둠)
                // alert('준비 중입니다.'); 
            }
        };

        itemDiv.innerHTML = `
            <div class="news-title-text" style="font-size: 16px; color: #333; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 15px; flex: 1;">
                ${item.title}
            </div>
            <div class="news-date-text" style="font-size: 14px; color: #999; min-width: 80px; text-align: right; white-space: nowrap;">
                ${item.date}
            </div>
        `;
        container.appendChild(itemDiv);
    });
}


// 슬라이더 이동 함수
function moveSlide(direction) {
    const track = document.getElementById('hero-slider-track');
    if (!track || track.children.length === 0) return;

    const totalSlides = track.children.length;
    currentSlideIndex = (currentSlideIndex + direction + totalSlides) % totalSlides;
    
    updateSliderPosition();
    resetSliderTimer();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateSliderPosition();
    resetSliderTimer();
}

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

function startSlider() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        moveSlide(1);
    }, 5000);
}

function resetSliderTimer() {
    if (slideInterval) clearInterval(slideInterval);
    startSlider();
}

// [지도]
function loadHomeMaps() {
    const mapList = document.getElementById('home-map-list');
    if (!mapList) return;
    
    mapList.innerHTML = '';

    dummyMapData.forEach(map => {
        const card = document.createElement('a');
        card.className = 'map-card';
        card.href = map.link;
        card.target = "_blank";

        card.innerHTML = `
            <div class="map-hero-bg" style="background-image: url('${map.image}');"></div>
            <div class="map-content">
                <div class="map-title">${map.title}</div>
                <p class="map-desc">${map.desc}</p>
            </div>
        `;
        mapList.appendChild(card);
    });
}


// =========================================
// 5. 탭 전환 및 URL 관리
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
        updateUrlQuery('news'); 
    } 
    else if (tabName === 'guide' || tabName === 'code') {
        const guideView = document.getElementById('view-guide');
        if (guideView) {
            guideView.style.display = 'block';
            if (!isGuideLoaded) {
                loadGuideView(); 
            } else {
                const newsBtn = findButtonByFile('news.html'); 
                if(newsBtn) loadGuideContent('news.html', newsBtn);
            }
        }
        document.getElementById('nav-code').classList.add('active');
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

function updateUrlQuery(tab, id) {
    const url = new URL(window.location);
    url.searchParams.delete('tab');
    url.searchParams.delete('id');
    url.searchParams.delete('q');
    url.searchParams.delete('g');

    if (tab === 'quest' && id) {
        const shortId = id.toLowerCase().replace('q', '');
        url.searchParams.set('q', shortId);
    } 
    else if (tab === 'guide' && id) {
        url.searchParams.set('g', id);
    }
    else {
        if (tab && tab !== 'home') url.searchParams.set('tab', tab);
        if (id) url.searchParams.set('id', id);
    }
    
    if (url.toString() !== window.location.href) {
        history.pushState(null, '', url);
    }
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); 
    const shortQuest = urlParams.get('q');
    const shortGuide = urlParams.get('g');

    if (shortQuest) { switchTab('quest'); return; }
    if (shortGuide) { switchTab('guide'); return; }
    if (urlParams.get('b')) { switchTab('builder'); return; }

    if (tab === 'quiz') switchTab('quiz');
    else if (tab === 'quest') switchTab('quest');
    else if (tab === 'news') switchTab('news');
    else if (tab === 'guide') switchTab('guide'); 
    else if (tab === 'builder') switchTab('builder');
    else switchTab('home');
}


// =========================================
// 6. 가이드(Guide) 기능
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
    const targetId = urlParams.get('id') || urlParams.get('g');
    
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

    const foundId = Object.keys(GUIDE_MAP).find(key => GUIDE_MAP[key] === filename);
    if (foundId) {
        updateUrlQuery('guide', foundId);
    }

    if (btnElement) {
        document.querySelectorAll('#view-guide .guide-item-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const codeView = document.querySelector('.code-page-container');
    if(codeView) codeView.style.display = 'none';
    
    innerContainer.style.display = 'block';
    innerContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#888;">비급을 펼치는 중...</div>';
    
    fetch(filename)
        .then(res => {
            if (!res.ok) throw new Error("파일을 찾을 수 없습니다.");
            return res.text();
        })
        .then(html => {
            innerContainer.innerHTML = html;
            if (filename === 'news.html') renderGuideNewsList(); 
        })
        .catch(err => {
            innerContainer.innerHTML = `<div style="text-align:center; padding:50px; color:#b71c1c;">내용을 불러올 수 없습니다.<br>(${filename})</div>`;
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
// 7. 검색 및 유틸리티 설정
// =========================================
function setupGlobalSearch() {
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
}

function setupQuizSearch() {
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
}

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

function copyToClipboard(text, btnElement) {
    const handleSuccess = () => {
        if (!btnElement) return;
        const originalContent = btnElement.innerHTML;
        const originalBg = btnElement.style.backgroundColor;

        btnElement.innerHTML = '<span class="copy-icon">✓</span> 완료';
        btnElement.style.backgroundColor = '#b08d55';
        btnElement.style.color = '#fff';

        setTimeout(() => {
            btnElement.innerHTML = originalContent;
            btnElement.style.backgroundColor = originalBg;
            btnElement.style.color = '';
        }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(handleSuccess).catch(() => prompt("복사하세요:", text));
    } else {
        prompt("복사하세요:", text);
    }
}


// =========================================
// 8. 퀘스트, 족보, 뉴스 렌더링 (서브 함수들)
// =========================================

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

function updateQuizCounter() {
    const counter = document.getElementById('quiz-counter-area');
    if (counter && globalData.quiz.length > 0) {
        counter.innerHTML = `총 ${globalData.quiz.length}개의 족보가 등록되었습니다.`;
    }
}

function filterQuizData(keyword) {
    keyword = keyword.trim().toLowerCase();
    if (!keyword) return globalData.quiz;
    return globalData.quiz.filter(item => 
        item.hint.toLowerCase().includes(keyword) || 
        item.answer.toLowerCase().includes(keyword)
    );
}

// 퀘스트 리스트 & 상세
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

function createQuestCard(quest, container) {
    const card = document.createElement('div');
    card.className = 'quest-card';
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

function loadQuestDetail(filepath, id) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    if (id) updateUrlQuery('quest', id);

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

// 뉴스 렌더링 (전체 목록)
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


// =========================================
// 9. 빌더(Builder) 기능
// =========================================
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
    if (titleEl) titleEl.innerText = creator ? `${creator}` : "익명의 협객의 빌드";

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
