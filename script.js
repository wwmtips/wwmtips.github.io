/* =========================================
   script.js (최종 수정본 - 문법 오류 해결 및 비결 기능 통합)
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

// 데이터 저장소
let globalData = { items: [], quiz: [], quests: [], news: [], cnews: [], builds: [] };
let builderData = null; 
let chunjiData = []; // 천지록 데이터 전역 변수
let currentChunjiData = [];

// 빌더 상태 관리
let currentBuild = { weapons: [null,null], hearts: [null,null,null,null], marts: new Array(8).fill(null) };
let currentSlot = { type: '', index: 0 };

// [지도 더미 데이터]
const dummyMapData = [
   {
        title: "청하",
        key: "qinghe", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        desc: "어린 주인공이 많은 가족들과 함께 생활하던 지역으로 이야기의 시작지입니다.",
        image: "images/map2.jpeg" // (썸네일 이미지가 있다면 유지)
    },
   {
        title: "개봉",
        key: "kaifeng", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        desc: "강호로 한 발 다가간 주인공은 개봉에서 수많은 강호인들과 인연을 쌓습니다.",
      image: "images/map1.jpeg" // (썸네일 이미지가 있다면 유지)
   },
   {
        title: "귀문시장",
        key: "gm", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        desc: "삼경에 귀신이 등불을 밝히니, 새벽닭 울음 소리가 보배롭다.",
      image: "https://wwm.tips/quests/images/q9-1.png" // (썸네일 이미지가 있다면 유지)
   },
   {
        title: "꿈속의 불선선",
        key: "drs", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        desc: "우리가 꾸던 행복은 그리 큰 것이 아니였는데",
       image: "images/map3.jpg" // (썸네일 이미지가 있다면 유지)
   }
];

// =========================================
// 2. 초기화 (DOMContentLoaded)
// =========================================
// =========================================
// 2. 초기화 (DOMContentLoaded)
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    // A. 데이터 로드
    loadData();
    loadHomeMaps();

    // B. 통합 검색창 설정
    setupGlobalSearch();

    // C. 족보 탭 로컬 검색 설정
    setupQuizSearch();

    // D. URL 파라미터 체크 및 탭 이동
    checkUrlParams();

    // ▼▼▼ [추가할 코드] 뒤로 가기 감지 이벤트 리스너 ▼▼▼
    window.addEventListener('popstate', handleHistoryChange);
});


// =========================================
// 3. 데이터 로딩 및 처리 (수정됨)
// =========================================
// =========================================
// 3. 데이터 로딩 및 처리 (수정됨: 빌드 서버 연동)
// =========================================
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    const targetId = urlParams.get('id');
    const shortQuestId = urlParams.get('q'); 
    const chunjiId = urlParams.get('c');

    // ★★★ [핵심 변경] index.html에 선언된 BUILD_API_URL 사용 ★★★
    const buildFetchUrl = (typeof BUILD_API_URL !== 'undefined') 
        ? `${BUILD_API_URL}?action=list` 
        : 'json/builds.json'; // 비상시 로컬 파일 사용

    Promise.all([
        fetch('json/datas.json').then(res => res.json()).catch(err => { console.warn('data.json 로드 실패', err); return {}; }),
        fetch('json/quests.json').then(res => res.json()).catch(err => { console.warn('quests.json 로드 실패', err); return []; }), 
        fetch('json/news.json').then(res => res.json()).catch(err => { console.warn('news.json 로드 실패', err); return []; }),
        fetch('json/cnews.json').then(res => res.json()).catch(err => { console.warn('cnews.json 로드 실패', err); return []; }),
        
        // ★★★ [핵심 변경] 위에서 설정한 URL로 빌드 데이터 로드 ★★★
        fetch(buildFetchUrl).then(res => res.json()).catch(err => { console.warn('빌드 데이터 로드 실패', err); return { builds: [] }; }),
        
        fetch('json/chunji.json').then(res => res.json()).catch(err => { console.warn('chunji.json 로드 실패', err); return { chunji: [] }; }),
        fetch('json/builder_data.json').then(res => res.json()).catch(err => { console.warn('builder_data.json 로드 실패', err); return null; }) 
    ])
    .then(([mainData, questData, newsData, cnewsData, buildsData, chunjiResult, builderDataResult]) => {
        console.log("데이터 로드 완료");

        let quests = Array.isArray(questData) ? questData : (questData.quests || []);
        let news = Array.isArray(newsData) ? newsData : (newsData.news || []);
        let cnews = Array.isArray(cnewsData) ? cnewsData : (cnewsData.cnews || []);
        let chunji = Array.isArray(chunjiResult) ? chunjiResult : (chunjiResult.chunji || []);
        let builds = buildsData.builds || [];

        if (quests.length > 0) {
            quests.sort((a, b) => {
                const numA = parseInt((a.id || "").replace('q', '')) || 0;
                const numB = parseInt((b.id || "").replace('q', '')) || 0;
                return numB - numA; 
            });
        }
        
        globalData = { items: mainData.items || [], quiz: mainData.quiz || [], quests: quests, news: news, cnews: cnews, chunji: chunji, builds: builds };
        builderData = builderDataResult; 
        currentQuestData = globalData.quests;
        chunjiData = globalData.chunji;
        currentChunjiData = globalData.chunji; 
        
        updateLocationOptions(); 
        updateChunjiSubtypeOptions(); 

        renderChunjiList();
        renderQuizTable(globalData.quiz);
        updateQuizCounter();
        renderQuestList();                
        renderHomeSlider(globalData.quests); 
        renderHomeRecentNews(globalData.news);     
        renderHomeCommunityNews(globalData.cnews);
        renderFullNews(globalData.news);

        if (targetTab === 'builder') renderBuildList('all');

        if (shortQuestId) {
            const fullId = 'q' + shortQuestId;
            const foundQuest = globalData.quests.find(q => q.id === fullId);
            if (foundQuest) loadQuestDetail(foundQuest.filepath, fullId); 
        }
        else if (chunjiId) {
            const foundChunji = globalData.chunji.find(c => c.id === chunjiId);
            if (foundChunji) {
                switchTab('chunji');
                loadChunjiDetail(foundChunji);
            }
        }
        else if (targetTab === 'quest' && targetId) {
            const formattedId = targetId.toLowerCase().startsWith('q') ? targetId : 'q' + targetId;
            const foundQuest = globalData.quests.find(q => q.id === formattedId);
            if (foundQuest) loadQuestDetail(foundQuest.filepath, formattedId);
        }
    })
    .catch(error => { console.error("데이터 처리 중 오류 발생:", error); });
}

// =========================================
// 4. 홈 화면 로직 (슬라이더 & 뉴스 등)
// =========================================
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
        dot.onclick = (e) => { e.stopPropagation(); goToSlide(index); };
        indicators.appendChild(dot);
    });
    startSlider();
}

function renderHomeRecentNews(newsList) {
    const container = document.getElementById('home-recent-news') || document.getElementById('home-quest-list');
    if (!container) return;
    renderNewsListGeneric(newsList, container, 'news');
}

function renderHomeCommunityNews(cnewsList) {
    const container = document.getElementById('home-community-news');
    if (!container) return;
    container.innerHTML = '';
    
    if (!cnewsList || cnewsList.length === 0) {
        container.innerHTML = '<div style="padding:15px; color:#888; text-align:center; font-size:0.9em;">진행 중인 작업이 없습니다.</div>';
        return;
    }

    cnewsList.slice(0, 10).forEach((item, index) => {
        const progress = item.progress || 0; 
        const isComplete = progress >= 100;
        const itemDiv = document.createElement('div');
        itemDiv.className = `progress-update-item ${isComplete ? 'completed' : ''}`;
        itemDiv.innerHTML = `
            <span class="progress-title">${item.title}</span>
            <div class="progress-bar-track">
                <div class="progress-bar-fill" id="prog-fill-${index}" style="width: 0%"></div>
            </div>
            <span class="progress-percent-text">${progress}%</span>
        `;
        container.appendChild(itemDiv);
        setTimeout(() => {
            const bar = document.getElementById(`prog-fill-${index}`);
            if (bar) bar.style.width = `${progress}%`;
        }, 100 + (index * 100));
    });
}

function renderNewsListGeneric(dataList, container, type) {
    container.innerHTML = '';
    const listToRender = dataList.slice(0, 2); 
    if (listToRender.length === 0) {
        container.innerHTML = '<div style="padding:15px; color:#888; text-align:center; font-size:0.9em;">등록된 내용이 없습니다.</div>';
        return;
    }
    listToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'recent-news-item';
        itemDiv.onclick = () => { if (item.link) window.open(item.link, '_blank'); };
        itemDiv.innerHTML = `<div class="news-title-text">${item.title}</div><div class="news-date-text">${item.date}</div>`;
        container.appendChild(itemDiv);
    });
}

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
    if (track) track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    indicators.forEach((dot, idx) => {
        if (idx === currentSlideIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function startSlider() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => { moveSlide(1); }, 5000);
}

function resetSliderTimer() {
    if (slideInterval) clearInterval(slideInterval);
    startSlider();
}

function loadHomeMaps() {
    const mapList = document.getElementById('home-map-list');
    if (!mapList) return;
    mapList.innerHTML = '';
    dummyMapData.forEach(map => {
        const card = document.createElement('div');
        card.className = 'map-card';
        card.style.cursor = 'pointer';
        card.onclick = () => { openMapDetail(map.title, map.key); };
        card.innerHTML = `
            <div class="map-hero-bg" style="background-image: url('${map.image}');"></div>
            <div class="map-content">
                <div class="map-title">${map.title}</div>
                <p class="map-desc">${map.desc}</p>
            </div>
        `;
        mapList.appendChild(card);
    });
}// [수정] updateHistory 매개변수 추가 (기본값 true)
function switchTab(tabName, updateHistory = true) {
    // 1. 뷰(화면) 숨기기
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder', 'view-map-detail', 'view-chunji'];
    views.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });

    // 2. 상단 탭 스타일 초기화
    const navs = ['nav-home', 'nav-quiz', 'nav-quest', 'nav-code', 'nav-builder', 'nav-more', 'nav-chunji'];
    navs.forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('active'); });
    
  // 3. 드롭다운 초기화 (모든 메뉴 닫기)
    document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
    
    // [핵심] ID 상관없이 'nav-dropdown-content' 클래스를 가진 모든 메뉴를 닫습니다.
    document.querySelectorAll('.nav-dropdown-content').forEach(el => {
        el.classList.remove('show');
    });

    // 4. 탭 활성화 로직
    if (tabName === 'home') {
        document.getElementById('view-home').style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
        if (updateHistory) updateUrlQuery('home');
    } 
    else if (tabName === 'chunji') {
        document.getElementById('view-chunji').style.display = 'block';
        document.getElementById('nav-chunji').classList.add('active');
        showChunjiList();
        if (updateHistory) updateUrlQuery('chunji');
    }
    else if (tabName === 'quiz') {
       document.getElementById('view-quiz').style.display = 'block';
        
        // [수정] 부모 메뉴인 '족보(nav-more)'에도 언더라인(active) 적용
        document.getElementById('nav-more').classList.add('active'); 
        
        // 드롭다운 내부의 '스무고개' 버튼도 활성화 표시 (선택사항)
        const quizBtn = document.getElementById('nav-quiz');
        if (quizBtn) quizBtn.classList.add('active');
        
        if (updateHistory) updateUrlQuery('quiz');
    } 
    else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');
        showQuestList();
        
        // ▼▼▼ [핵심] 뒤로가기(false)가 아닐 때만 URL 업데이트 실행 ▼▼▼
        if (updateHistory) {
            updateUrlQuery('quest');
        }
    } 
    else if (tabName === 'news') {
        document.getElementById('view-news').style.display = 'block';
        if (updateHistory) updateUrlQuery('news');
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
        if (updateHistory) {
            const params = new URLSearchParams(window.location.search);
            if(!params.get('id') && !params.get('g')) updateUrlQuery('guide');
        }
    }
    else if (tabName === 'builder') {
        document.getElementById('view-builder').style.display = 'block';
        document.getElementById('nav-more').classList.add('active');
        const builderItem = document.getElementById('nav-builder');
        if(builderItem) builderItem.classList.add('active');

        document.getElementById('tools-menu').style.display = 'block';
        document.getElementById('builder-interface').style.display = 'none';

        if (!builderData) {
            fetch('json/builder_data.json')
                .then(res => res.json())
                .then(data => { builderData = data; renderBuildList('all'); })
                .catch(err => console.error(err));
        } else {
            renderBuildList('all'); 
        }
        
        if (new URLSearchParams(window.location.search).get('b')) {
            openBuilderInterface();
            loadViewer();
        }
        if (updateHistory) updateUrlQuery('builder');
    }
}

function updateUrlQuery(tab, id) {
    const url = new URL(window.location);
    // 모든 파라미터 초기화
    url.searchParams.delete('tab');
    url.searchParams.delete('id');
    url.searchParams.delete('q');
    url.searchParams.delete('g');
    url.searchParams.delete('c');
    url.searchParams.delete('cp'); // 천지록 페이지
    url.searchParams.delete('qp'); // [추가] 퀘스트 페이지

    if (tab === 'quest') {
        if (id) {
            // 상세 보기일 때
            url.searchParams.set('q', id.toLowerCase().replace('q', ''));
        } else {
            // 목록 보기일 때
            url.searchParams.set('tab', 'quest');
            // [추가] 1페이지가 아니면 URL에 페이지 번호 저장
            if (currentPage > 1) {
                url.searchParams.set('qp', currentPage);
            }
        }
    } 
    else if (tab === 'guide' && id) {
        url.searchParams.set('g', id);
    }
    else if (tab === 'chunji') {
        if (id) {
            url.searchParams.set('c', id);
        } else {
            url.searchParams.set('tab', 'chunji');
            if (currentChunjiPage > 1) {
                url.searchParams.set('cp', currentChunjiPage);
            }
        }
    }
    else {
        if (tab && tab !== 'home') url.searchParams.set('tab', tab);
        if (id) url.searchParams.set('id', id);
    }
    if (url.toString() !== window.location.href) history.pushState(null, '', url);
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('q')) { switchTab('quest'); return; }
    if (urlParams.get('g')) { switchTab('guide'); return; }
    if (urlParams.get('b')) { switchTab('builder'); return; }
    if (urlParams.get('c')) { switchTab('chunji'); return; }
    
    const tab = urlParams.get('tab'); 
    
    if (tab === 'quest') {
        // [추가] 퀘스트 페이지 번호 복구
        const qPage = urlParams.get('qp');
        if (qPage) currentPage = parseInt(qPage);
        switchTab('quest');
    }
    else if (tab === 'chunji') {
        const cPage = urlParams.get('cp');
        if (cPage) currentChunjiPage = parseInt(cPage);
        switchTab('chunji');
    }
    else if (tab === 'quiz') switchTab('quiz');
    else if (tab === 'news') switchTab('news');
    else if (tab === 'guide') switchTab('guide'); 
    else if (tab === 'builder') switchTab('builder');
    else switchTab('home');
}


// =========================================
// 6. 가이드(Guide) 기능
// =========================================
const GUIDE_MAP = {
    'news': 'news.html', 'tierlist': 'guide_tier.html', 'weapon': 'tier_weapon.html', 
    'build': 'build.html', 'map': 'maps.html', 'side': 'beta.html', 'hw': 'npc.html',        
    'boss': 'boss.html', 'marts': 'marts.html', 'harts': 'harts.html', 'skill': 'skils.html',
    'majang': 'majang.html', 'code': 'code.html'      
};

function loadGuideView() {
    const container = document.getElementById('guide-content-loader');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id') || urlParams.get('g');
    let fileToLoad = 'news.html';
    if (targetId && GUIDE_MAP[targetId]) fileToLoad = GUIDE_MAP[targetId];

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
    if (foundId) updateUrlQuery('guide', foundId);

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
            if (filename === 'harts.html') renderHeartLibrary();
            if (filename === 'marts.html') renderMartLibrary(); 
            if (filename === 'npc.html') initHomeworkChecklist(); 
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
    globalData.news.slice(0, 5).forEach(item => {
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
        quizLocalSearch.addEventListener("focus", () => { if(statusBar) statusBar.classList.add("hidden"); });
        quizLocalSearch.addEventListener("blur", () => { if(statusBar) statusBar.classList.remove("hidden"); });
    }
}

function handleGlobalSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    const resultContainer = document.getElementById("global-search-results");
    
    // 검색창이 없거나 비어있으면 숨김
    if (!resultContainer) return;
    if (!keyword) { 
        resultContainer.style.display = 'none'; 
        return; 
    }

    let resultsHTML = '';
    
    // 1. 뉴스 검색
    if (globalData.news && Array.isArray(globalData.news)) {
        globalData.news.filter(n => {
            const title = n.title ? n.title.toLowerCase() : "";
            const content = n.content ? n.content.toLowerCase() : "";
            return title.includes(keyword) || content.includes(keyword);
        })
        .slice(0, 3).forEach(item => {
            resultsHTML += `
                <div class="search-result-item" onclick="switchTab('news')">
                    <span class="badge info">정보</span> 
                    <span class="result-text">${item.title}</span>
                </div>`;
        });
    }
    // 4. 천지록 검색 (기존 handleGlobalSearch 함수 안에 이 부분을 추가하세요)
    if (globalData.chunji && Array.isArray(globalData.chunji)) {
        globalData.chunji.filter(c => {
            return c.title.toLowerCase().includes(keyword);
        })
        .slice(0, 3).forEach((item, index) => { // index는 실제 데이터에서의 인덱스를 찾아야 정확함
            // 실제 데이터에서의 인덱스를 찾기 위해 indexOf 사용 권장
            const realIndex = globalData.chunji.indexOf(item);
            resultsHTML += `
                <div class="search-result-item" onclick="selectChunjiResult(${realIndex})">
                    <span class="badge item">천지록</span> 
                    <span class="result-text">${item.title}</span>
                </div>`;
        });
    }
    // 2. 족보 검색
    if (globalData.quiz && Array.isArray(globalData.quiz)) {
        globalData.quiz.filter(q => {
            const hint = q.hint ? q.hint.toLowerCase() : "";
            const answer = q.answer ? q.answer.toLowerCase() : "";
            return hint.includes(keyword) || answer.includes(keyword);
        })
        .slice(0, 3).forEach(item => {
            const safeHint = item.hint.replace(/'/g, "\\'");
            resultsHTML += `
                <div class="search-result-item" onclick="selectGlobalResult('${safeHint}')">
                    <span class="badge quiz">족보</span>
                    <span class="result-text">${item.hint} - ${item.answer}</span>
                </div>`;
        });
    }
    
    // 3. 퀘스트/무림록 검색
    if (globalData.quests && Array.isArray(globalData.quests)) {
        globalData.quests.filter(q => {
            const name = q.name ? q.name.toLowerCase() : "";
            const loc = q.location ? q.location.toLowerCase() : "";
            return name.includes(keyword) || loc.includes(keyword);
        })
        .slice(0, 3).forEach(quest => {
            resultsHTML += `
                <div class="search-result-item" onclick="selectQuestResult('${quest.filepath}', '${quest.id}')">
                    <span class="badge item">퀘스트</span> 
                    <span class="result-text">${quest.name}</span>
                </div>`;
        });
    }

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

// =========================================
// 8. 렌더링 서브 함수들
// =========================================
function renderQuizTable(data, keyword = '') {
    const tbody = document.getElementById('quiz-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data && data.length > 0) {
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
    } else {
        const noResultTr = document.createElement('tr');
        noResultTr.innerHTML = `<td colspan="3" style="padding:20px; color:#888; text-align:center;">일치하는 족보가 없습니다.</td>`;
        tbody.appendChild(noResultTr);
    }

    const reportTr = document.createElement('tr');
    reportTr.className = 'quiz-report-row'; 
    reportTr.style.cursor = 'pointer';
    reportTr.style.backgroundColor = '#fff8e1'; 
    reportTr.style.fontWeight = 'bold';
    reportTr.style.color = '#d48806';
    reportTr.onclick = () => { window.open('report/', '_blank'); };
    reportTr.innerHTML = `<td colspan="3" style="text-align: center; padding: 15px;">📢 찾는 족보가 없나요? 여기를 눌러 제보해주세요!</td>`;
    tbody.appendChild(reportTr);
}

function updateQuizCounter() {
    const counter = document.getElementById('quiz-counter-area');
    if (!counter || !globalData.quiz) return;
    const totalCount = globalData.quiz.length;
    const userCounts = {};
    globalData.quiz.forEach(item => {
        if (item.user && item.user.trim() !== '' && item.user !== '-') userCounts[item.user] = (userCounts[item.user] || 0) + 1;
    });
    const sortedUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    let rankHtml = '';
    if (sortedUsers.length > 0) {
        const rankParts = sortedUsers.map((u, i) => i === 0 ? `<span class="rainbow-text">${i+1}위 ${u[0]}(${u[1]})</span>` : `<span style="color: #888;">${i+1}위 ${u[0]}(${u[1]})</span>`);
        rankHtml = `<br><span style="font-size:0.85em; color:#ffd700; margin-top:5px; display:inline-block;">🏆${rankParts.join(' · ')}</span>`;
    }
    counter.innerHTML = `총 <b>${totalCount}</b>개의 족보가 등록되었습니다.${rankHtml}`;
}

function filterQuizData(keyword) {
    keyword = keyword.trim().toLowerCase();
    if (!keyword) return globalData.quiz;
    return globalData.quiz.filter(item => item.hint.toLowerCase().includes(keyword) || item.answer.toLowerCase().includes(keyword));
}

function renderQuestList() {
    const container = document.getElementById('quest-grid-container');
    const paginationContainer = document.getElementById('pagination-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentQuestData || currentQuestData.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:60px 0; color:#888; font-size: 0.95em;"><img src="images/gs.jpg" alt="알림" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 1px solid #eee;"><br>구..구구..구우...스?<br>(큰 거위가 막고 있어서 들어갈 수 없다.)</div>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    currentQuestData.slice(startIndex, endIndex).forEach(quest => createQuestCard(quest, container));
    renderPagination();
}

function createQuestCard(quest, container) {
    const card = document.createElement('div');
    card.className = 'quest-card';
    card.onclick = () => { switchTab('quest'); loadQuestDetail(quest.filepath, quest.id); };
    card.innerHTML = `
        <div class="quest-info"><div class="quest-name">${quest.name}</div><div class="quest-type">${quest.type}</div></div>
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
    if(listView && detailView) { listView.style.display = 'block'; detailView.style.display = 'none'; }
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
    
    // 전체 페이지 수 계산
    const totalPages = Math.ceil(currentQuestData.length / itemsPerPage);
    if (totalPages <= 1) return;

    // 버튼 생성 도우미 함수
    const createBtn = (text, page, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${active ? 'active' : ''}`;
        btn.innerText = text;
        btn.disabled = disabled;
        btn.onclick = () => changePage(page);
        return btn;
    };

    // [이전] 버튼
    container.appendChild(createBtn('<', currentPage - 1, false, currentPage === 1));

    // ▼▼▼ [핵심 수정] 5개씩 끊어서 보여주는 로직 ▼▼▼
    const maxVisibleButtons = 5; // 한 번에 보여줄 숫자 개수
    let startPage = currentPage - Math.floor(maxVisibleButtons / 2);
    let endPage = currentPage + Math.floor(maxVisibleButtons / 2);

    // 1. 시작 페이지 보정 (1보다 작아지지 않게)
    if (startPage < 1) {
        startPage = 1;
        endPage = Math.min(totalPages, maxVisibleButtons);
    }

    // 2. 끝 페이지 보정 (전체 페이지를 넘지 않게)
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, totalPages - maxVisibleButtons + 1);
    }

    // 계산된 범위만큼만 버튼 생성
    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createBtn(i, i, i === currentPage));
    }
    // ▲▲▲ 수정 끝 ▲▲▲

    // [다음] 버튼
    container.appendChild(createBtn('>', currentPage + 1, false, currentPage === totalPages));
}


function changePage(page) {
    currentPage = page;
    renderQuestList();
    
    // [추가] 페이지 변경 시 URL 업데이트
    updateUrlQuery('quest');
    
    document.getElementById('quest-list-view').scrollIntoView({ behavior: 'smooth' });
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

function createNewsElement(item) {
    const div = document.createElement('div');
    div.className = 'news-item';
    div.onclick = function() { this.classList.toggle('active'); };
    let linkHtml = item.link ? `<a href="${item.link}" target="_blank" class="news-link-btn" onclick="event.stopPropagation()">바로가기 →</a>` : '';
    div.innerHTML = `<div class="news-header"><span class="news-title">${item.title}</span><span class="news-date">${item.date}</span></div><div class="news-content">${item.content}<br>${linkHtml}</div>`;
    return div;
}

// =========================================
// 9. 빌더(Builder) 기능
// =========================================
function openBuilderInterface() {
    document.getElementById('tools-menu').style.display = 'none';
    document.getElementById('builder-interface').style.display = 'block';
    if (!builderData) {
         fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; });
    }
}

function closeBuilderInterface() {
    document.getElementById('builder-interface').style.display = 'none';
    document.getElementById('tools-menu').style.display = 'block';
}

function openBuilderModal(type, index) {
    if (!builderData) return alert("데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    currentSlot = { type, index };
    const modal = document.getElementById('builder-modal');
    const list = document.getElementById('builder-modal-list');
    document.getElementById('builder-modal-title').innerText = `${type === 'weapons' ? '무기/무술' : type === 'hearts' ? '심법' : '비결'} 선택`;
    
    list.innerHTML = '';
    const currentList = currentBuild[type];
    const usedIds = currentList.filter((id, idx) => id !== null && idx !== parseInt(index));

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
            if (usedIds.includes(item.id)) div.classList.add('disabled');
            else div.onclick = () => selectBuilderItem(item.id, item.img, item.name);
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
// 1. 링크 생성 함수 (닉네임 ID 변경 적용)
function generateBuildUrl() {
    // [수정] 닉네임 가져오는 ID 변경 (creator-name -> build-creator)
    const creatorName = document.getElementById('build-creator').value.trim();
    
    const buildData = { w: currentBuild.weapons, h: currentBuild.hearts, m: currentBuild.marts, c: creatorName };
    const encodedString = btoa(unescape(encodeURIComponent(JSON.stringify(buildData))));
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
    let w = [], h = [], m = [], creator = "";

    if (encodedData) {
        try {
            const parsedData = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
            w = parsedData.w || []; h = parsedData.h || []; m = parsedData.m || []; creator = parsedData.c || "";
        } catch (e) {
            console.error("잘못된 빌드 주소입니다.", e);
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
                const slotEl = document.getElementById(`${prefix}-${type}-${idx}`);
                const nameEl = document.getElementById(`name-${prefix}-${type}-${idx}`);
                if (slotEl) {
                    const img = slotEl.querySelector('img');
                    if (img) { img.src = itemData.img; img.style.display = 'block'; }
                    slotEl.style.border = '1px solid var(--wuxia-accent-gold)';
                }
                if (nameEl) nameEl.innerText = itemData.name;
            }
        });
    };
    renderSlot('weapons', w, 'v');
    renderSlot('hearts', h, 'v');
    renderSlot('marts', m, 'v');
}

// [script.js] renderBuildList 함수 (작성자 위치 왼쪽으로 이동)
function renderBuildList(filterType) {
    const container = document.getElementById('build-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!globalData.builds || globalData.builds.length === 0) {
        container.innerHTML = '<div style="padding:30px; text-align:center; color:#666;">등록된 비급이 없습니다.</div>';
        return;
    }

    let targetBuilds = globalData.builds;
    if (filterType !== 'all') {
        targetBuilds = globalData.builds.filter(b => b.type.toUpperCase() === filterType.toUpperCase());
    }

    targetBuilds.forEach(build => {
        const w1Id = build.weapons[0];
        const w2Id = build.weapons[1];
        
        // 무기 이미지 가져오는 헬퍼 함수
        const getImg = (id) => {
            if (!builderData || !builderData.weapons) return 'images/logo.png';
            const item = builderData.weapons.find(w => w.id === id);
            return item ? item.img : 'images/logo.png';
        };

        const row = document.createElement('div');
        row.className = 'build-row-card';
        row.onclick = () => { openBuildDetailSheet(build); };
        const typeClass = build.type.toUpperCase() === 'PVP' ? 'type-pvp' : 'type-pve';
        
        // ▼▼▼ HTML 구조 변경 ▼▼▼
        row.innerHTML = `
            <div class="build-icons-area">
                <div class="build-icon-box"><img src="${getImg(w1Id)}" alt="무기1"></div>
                <div class="build-icon-box"><img src="${getImg(w2Id)}" alt="무기2"></div>
            </div>
            <div class="build-info-area">
                <div class="build-header-row">
                    <span class="build-title">${build.title}</span>
                    <span class="build-type-badge ${typeClass}">${build.type}</span>
                </div>

                <div style="font-size: 0.8em; color: #999; margin-top: 2px; margin-bottom: 8px; text-align: left;">
                    작성자: <span style="color: #666; font-weight: bold;">${build.creator || '익명'}</span>
                </div>

                <div class="build-desc">${build.description || "설명이 없는 비급입니다."}</div>
            </div>
        `;
        container.appendChild(row);
    });
}
function filterBuilds(type, btn) {
    const buttons = document.querySelectorAll('#tools-menu .guide-item-btn');
    buttons.forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    renderBuildList(type);
}

// =========================================
// 11. 심법 & 비결 도감 및 바텀시트 기능 (통합)
// =========================================

/* A. 심법(Heart) 리스트 렌더링 */
function renderHeartLibrary() {
    const container = document.getElementById('heart-library-list');
    if (!container) return;

    if (!builderData) {
        fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; renderHeartLibrary(); }).catch(err => { container.innerHTML = "데이터를 불러올 수 없습니다."; });
        return;
    }

    if (!builderData.hearts || builderData.hearts.length === 0) {
        container.innerHTML = "등록된 심법이 없습니다.";
        return;
    }

    container.innerHTML = '';
    builderData.hearts.forEach(heart => {
        const item = document.createElement('div');
        item.className = 'heart-lib-item';
        item.onclick = () => openHeartDetailSheet(heart.id);
        item.innerHTML = `<img src="${heart.img}" class="heart-lib-img" onerror="this.src='images/logo.png'"><div class="heart-lib-name">${heart.name}</div>`;
        container.appendChild(item);
    });
}

/* B. 비결(Mart) 리스트 렌더링 */
function renderMartLibrary() {
    const container = document.getElementById('mart-library-list');
    if (!container) return;

    if (!builderData) {
        fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; renderMartLibrary(); }).catch(err => { container.innerHTML = "데이터를 불러올 수 없습니다."; });
        return;
    }

    if (!builderData.marts || builderData.marts.length === 0) {
        container.innerHTML = "등록된 비결이 없습니다.";
        return;
    }

    container.innerHTML = '';
    builderData.marts.forEach(mart => {
        const item = document.createElement('div');
        item.className = 'heart-lib-item'; // 스타일 공유
        item.onclick = () => openMartDetailSheet(mart.id);
        item.innerHTML = `<img src="${mart.img}" class="heart-lib-img" onerror="this.src='images/logo.png'"><div class="heart-lib-name">${mart.name}</div>`;
        container.appendChild(item);
    });
}

/* [공통] 유튜브 주소 자동 변환 함수 */
function convertYoutubeToEmbed(text) {
    if (!text) return '획득 방법 정보가 없습니다.';
    const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})(?:\S+)?)/g;
    if (ytRegex.test(text)) {
        return text.replace(ytRegex, (match, url, videoId) => {
            return `<div style="margin-top: 10px; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000;">
                    <iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>`;
        });
    }
    return text;
}

/* [공통] 심법 상세 바텀시트 열기 */
function openHeartDetailSheet(heartId) {
    if (!builderData || !builderData.hearts) return;
    const heart = builderData.hearts.find(h => h.id === heartId);
    if (!heart) return;

    const titleEl = document.getElementById('heart-sheet-title');
    const contentEl = document.getElementById('heart-sheet-content');

    if (titleEl) titleEl.innerText = heart.name;
    
    if (contentEl) {
        const acquireContent = convertYoutubeToEmbed(heart.acquire);
        contentEl.innerHTML = `
            <div style="text-align:center; margin-bottom:20px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                <img src="${heart.img}" style="width:80px; height:80px; object-fit:contain;" onerror="this.src='images/logo.png'">
            </div>
            <div class="detail-chunk" style="margin-bottom: 25px;">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">설명</h4>
                <p style="color: #555; line-height: 1.6; background: #fff; padding: 10px; border: 1px dashed #ddd; border-radius: 4px;">
                    ${heart.desc || '설명 정보가 없습니다.'}
                </p>
            </div>
            <div class="detail-chunk">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">획득 방법</h4>
                <div style="color: #555; line-height: 1.6; background: #fffcf5; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                    ${acquireContent}
                </div>
            </div>
        `;
    }
    document.body.classList.add('heart-sheet-open');
}

function closeHeartDetailSheet() {
    document.body.classList.remove('heart-sheet-open');
}

/* [추가] 비결 상세 바텀시트 열기 */
function openMartDetailSheet(martId) {
    if (!builderData || !builderData.marts) return;
    const mart = builderData.marts.find(m => m.id === martId);
    if (!mart) return;

    const titleEl = document.getElementById('mart-sheet-title');
    const contentEl = document.getElementById('mart-sheet-content');

    if (titleEl) titleEl.innerText = mart.name;
    
    if (contentEl) {
        const acquireContent = convertYoutubeToEmbed(mart.acquire);
        contentEl.innerHTML = `
            <div style="text-align:center; margin-bottom:20px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                <img src="${mart.img}" style="width:80px; height:80px; object-fit:contain;" onerror="this.src='images/logo.png'">
            </div>
            <div class="detail-chunk" style="margin-bottom: 25px;">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">효과</h4>
                <p style="color: #555; line-height: 1.6; background: #fff; padding: 10px; border: 1px dashed #ddd; border-radius: 4px;">
                    ${mart.desc || '효과 정보가 없습니다.'}
                </p>
            </div>
            <div class="detail-chunk">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">획득 방법</h4>
                <div style="color: #555; line-height: 1.6; background: #fffcf5; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                    ${acquireContent}
                </div>
            </div>
        `;
    }
    document.body.classList.add('mart-sheet-open');
}

function closeMartDetailSheet() {
    document.body.classList.remove('mart-sheet-open');
}

// 12. 빌드 상세 보기 바텀시트 기능
// [script.js] openBuildDetailSheet 함수 (링크 복사 버튼 추가됨)
function openBuildDetailSheet(build) {
    const sheet = document.getElementById('build-detail-sheet');
    const contentArea = sheet.querySelector('.sheet-content');
    
    // 1. 링크에서 코드 추출 (기존 로직)
    let encodedData = null;
    if (build.link && build.link.includes('?b=')) {
        encodedData = build.link.split('?b=')[1];
    }

    if (!encodedData || !builderData) {
        contentArea.innerHTML = `<div style="padding: 50px; text-align: center; color: var(--wuxia-accent-red);">🚨 상세 빌드 정보를 불러올 수 없습니다.</div>`;
        openBuildDetailSheetView();
        return;
    }

    encodedData = encodedData.replace(/ /g, '+');
    let parsedData = null;

    try {
        const decodedString = decodeURIComponent(escape(atob(encodedData)));
        parsedData = JSON.parse(decodedString);
    } catch (e1) {
        try {
            parsedData = JSON.parse(atob(encodedData));
        } catch (e2) {
            contentArea.innerHTML = `<div style="padding: 50px; text-align: center; color: var(--wuxia-accent-red);">🚨 잘못된 빌드 코드 형식입니다.</div>`;
            openBuildDetailSheetView();
            return;
        }
    }

    // 2. 화면 그리기
    let html = `<div style="border-bottom: 2px dashed #ddd; padding-bottom: 10px; margin-bottom: 20px;"><p style="margin: 0; color: #999; font-size: 0.9em;">${build.description || '작성된 설명이 없습니다.'}</p></div>`;
    
    const getItemDetail = (type, id) => builderData[type] ? builderData[type].find(i => i.id === id) || {name:'?', img:''} : {name:'?', img:''};

    const renderSection = (typeKey, title, slots) => {
        html += `<h4 style="color: #333; margin-top: 20px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 8px;">${title}</h4><div class="slot-group" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 15px;">`;
        slots.forEach(id => {
            const item = getItemDetail(typeKey, id);
            html += `<div style="width: 80px; text-align: center;"><img src="${item.img}" style="width: 60px; height: 60px; border: 1px solid #ddd; border-radius: 4px; object-fit: cover;" onerror="this.src='images/logo.png'"><p style="font-size: 0.75em; color: #333; margin: 5px 0 0 0; line-height: 1.2;">${item.name}</p></div>`;
        });
        html += `</div>`;
    };

    if (parsedData.w && parsedData.w.filter(id => id).length > 0) renderSection('weapons', '무기 및 무술', parsedData.w);
    if (parsedData.h && parsedData.h.filter(id => id).length > 0) renderSection('hearts', '심법', parsedData.h);
    if (parsedData.m && parsedData.m.filter(id => id).length > 0) renderSection('marts', '비결', parsedData.m);
    
    // ▼▼▼ [추가됨] 맨 하단 링크 복사 버튼 ▼▼▼
    // build.link 값을 그대로 copyToClipboard 함수에 전달합니다.
    html += `
        <div style="margin-top: 40px; margin-bottom: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <button onclick="copyToClipboard('${build.link}', this)" 
                    style="width: 100%; padding: 12px; background-color: #333; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 1em;">
                🔗 이 빌드 링크 복사
            </button>
        </div>
    `;
    // ▲▲▲ 추가 끝 ▲▲▲

    document.getElementById('build-sheet-title').innerText = build.title;
    contentArea.innerHTML = html;
    openBuildDetailSheetView();
}

function openBuildDetailSheetView() { document.body.classList.add('build-sheet-open'); }
function closeBuildDetailSheet() { document.body.classList.remove('build-sheet-open'); }

// 13. 지도 상세 뷰 기능
function openMapDetail(mapName, mapKey) {
    // 다른 뷰 숨기기
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder', 'view-map-detail', 'view-chunji'];
    views.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });

    const mapDiv = document.getElementById('view-map-detail');
    if(mapDiv) {
        mapDiv.style.display = 'block';
        document.getElementById('map-detail-title').innerText = mapName;
        
        // ★ [핵심 변경] 우리가 만든 map 폴더의 index.html을 불러옵니다.
        // 주소 형식: map/?id=키값 (예: map/?id=qinghe)
        const targetUrl = `map/?id=${mapKey}`; 
        
        const iframe = document.getElementById('map-iframe');
        // 불필요한 리로딩 방지 (이미 같은 주소면 새로고침 안 함)
        if(iframe && !iframe.src.includes(targetUrl)) {
            iframe.src = targetUrl;
        }
    }
    window.scrollTo(0, 0);
}

function closeMapDetail() {
    const mapDiv = document.getElementById('view-map-detail');
    if(mapDiv) mapDiv.style.display = 'none';
    const iframe = document.getElementById('map-iframe');
    if(iframe) iframe.src = 'about:blank';
    switchTab('home'); 
}

function openGuideSheet() { document.body.classList.add('sheet-open'); }
function closeGuideSheet() { document.body.classList.remove('sheet-open'); }


// =========================================
// 14. 비결(Mart) 도감 및 바텀시트 기능 (추가됨)
// =========================================
function renderMartLibrary() {
    const container = document.getElementById('mart-library-list');
    if (!container) return;

    // 데이터가 없으면 로드 시도
    if (!builderData) {
        fetch('json/builder_data.json')
            .then(res => res.json())
            .then(data => { 
                builderData = data; 
                renderMartLibrary(); 
            })
            .catch(err => { container.innerHTML = "데이터를 불러올 수 없습니다."; });
        return;
    }

    if (!builderData.marts || builderData.marts.length === 0) {
        container.innerHTML = "등록된 비결이 없습니다.";
        return;
    }

    container.innerHTML = '';
    builderData.marts.forEach(mart => {
        const item = document.createElement('div');
        item.className = 'heart-lib-item'; // 스타일은 심법과 공유
        item.onclick = () => openMartDetailSheet(mart.id);
        
        // 이미지가 없으면 기본 로고 사용
        const imgPath = mart.img ? mart.img : 'images/logo.png';
        
        item.innerHTML = `
            <img src="${imgPath}" class="heart-lib-img" onerror="this.src='images/logo.png'">
            <div class="heart-lib-name">${mart.name}</div>
        `;
        container.appendChild(item);
    });
}

function openMartDetailSheet(martId) {
    if (!builderData || !builderData.marts) return;
    const mart = builderData.marts.find(m => m.id === martId);
    if (!mart) return;

    const titleEl = document.getElementById('mart-sheet-title');
    const contentEl = document.getElementById('mart-sheet-content');

    if (titleEl) titleEl.innerText = mart.name;
    
    if (contentEl) {
        // 유튜브 변환 기능 재사용 (convertYoutubeToEmbed 함수가 이미 존재해야 함)
        const acquireContent = typeof convertYoutubeToEmbed === 'function' 
            ? convertYoutubeToEmbed(mart.acquire) 
            : (mart.acquire || '획득 방법 정보가 없습니다.');

        const imgPath = mart.img ? mart.img : 'images/logo.png';

        contentEl.innerHTML = `
            <div style="text-align:center; margin-bottom:20px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                <img src="${imgPath}" style="width:80px; height:80px; object-fit:contain;" onerror="this.src='images/logo.png'">
            </div>
            <div class="detail-chunk" style="margin-bottom: 25px;">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">설명</h4>
                <p style="color: #555; line-height: 1.6; background: #fff; padding: 10px; border: 1px dashed #ddd; border-radius: 4px;">
                    ${mart.desc || '설명 정보가 없습니다.'}
                </p>
            </div>
            <div class="detail-chunk">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">획득 방법</h4>
                <div style="color: #555; line-height: 1.6; background: #fffcf5; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                    ${acquireContent}
                </div>
            </div>
        `;
    }
    document.body.classList.add('mart-sheet-open');
}

function closeMartDetailSheet() {
    document.body.classList.remove('mart-sheet-open');
}
// =========================================
// [수정] 브라우저 뒤로 가기/앞으로 가기 처리
// =========================================
function handleHistoryChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    // 파라미터 가져오기
    const qId = urlParams.get('q');
    const gId = urlParams.get('g');
    const bId = urlParams.get('b');
    const cId = urlParams.get('c');
    
    const cpParam = urlParams.get('cp'); // 천지록 페이지
    const qpParam = urlParams.get('qp'); // 퀘스트 페이지

    // 1. 상세 보기 처리 (상세 ID가 있으면 해당 화면 로드)
    if (qId) { 
        switchTab('quest', false); 
        const fullId = 'q' + qId; 
        if (globalData.quests) { 
            const foundQuest = globalData.quests.find(q => q.id === fullId); 
            if (foundQuest) loadQuestDetail(foundQuest.filepath, fullId); 
        } 
        return; 
    }
    if (gId) { switchTab('guide', false); return; }
    if (bId) { switchTab('builder', false); return; }
    if (cId) { 
        switchTab('chunji', false); 
        if (globalData.chunji) { 
            const foundChunji = globalData.chunji.find(c => c.id === cId); 
            if (foundChunji) loadChunjiDetail(foundChunji); 
        } 
        return; 
    }

    // 2. [수정] 퀘스트 목록 뒤로가기
    if (tab === 'quest') {
        // [핵심 1] URL에 있는 페이지 번호(qp)를 currentPage 변수에 먼저 복구합니다.
        // (없으면 1페이지)
        currentPage = qpParam ? parseInt(qpParam) : 1;
        
        // [핵심 2] switchTab을 부를 때 false를 넘겨서 URL을 다시 저장하지 않게 합니다.
        // (이미 브라우저 URL은 ?tab=quest&qp=2 상태이기 때문)
        switchTab('quest', false); 
        
        // [핵심 3] 복구된 페이지 번호로 리스트를 다시 그립니다.
        renderQuestList();
        return;
    }

    // 3. [수정] 천지록 목록 뒤로가기
    if (tab === 'chunji') {
        currentChunjiPage = cpParam ? parseInt(cpParam) : 1;
        switchTab('chunji', false);
        renderChunjiList();
        return;
    }

    // 4. 나머지 탭
    if (tab) {
        switchTab(tab, false); 
    } else {
        switchTab('home', false);
    }
}

// =========================================
// [추가 기능] 쿠폰 코드 복사하기
// =========================================
function copyToClipboard(text, btnElement) {
    // 1. 텍스트 클립보드에 복사
    navigator.clipboard.writeText(text).then(() => {
        // 2. 성공 시 버튼 스타일 변경 (피드백)
        const originalContent = btnElement.innerHTML;
        
        // 버튼 내용을 '완료' 상태로 변경
        btnElement.innerHTML = '<span class="copy-icon">✅</span> 완료';
        btnElement.style.backgroundColor = '#2e7d32'; // 초록색
        btnElement.style.color = '#fff';
        btnElement.style.borderColor = '#2e7d32';
        btnElement.disabled = true; // 중복 클릭 방지

        // 3. 2초 뒤에 원래대로 복구
        setTimeout(() => {
            btnElement.innerHTML = originalContent;
            btnElement.style.backgroundColor = '';
            btnElement.style.color = '';
            btnElement.style.borderColor = '';
            btnElement.disabled = false;
        }, 2000);

    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('복사에 실패했습니다. 수동으로 복사해주세요.');
    });
}

// =========================================
// [수정됨] 뷰어 이미지 저장 (출처 워터마크 자동 추가)
// =========================================
function downloadBuildImage() {
    const element = document.getElementById('capture-area');

    // index.html의 빌더에서 호출된 경우 처리
    if (!element) {
        if (typeof saveBuildImage === 'function') {
            saveBuildImage();
            return;
        }
        return alert("캡쳐할 영역을 찾을 수 없습니다.");
    }

    // 1. 출처(워터마크) 요소 생성
    const watermark = document.createElement('div');
    watermark.innerHTML = `
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #ddd; text-align: center; color: #888; font-family: 'Noto Serif KR', serif; background-color: #fff;">
            <p style="margin: 0; font-weight: bold; font-size: 0.95em; color: var(--wuxia-accent-gold);">연운 한국 위키</p>
            <p style="margin: 5px 0 0 0; font-size: 0.8em; color: #999;">https://wwm.tips</p>
        </div>
    `;

    // 2. 캡쳐 영역 맨 아래에 출처 붙이기
    element.appendChild(watermark);

    // 3. 이미지 생성 실행
    html2canvas(element, {
        useCORS: true,
        scale: 2, // 고해상도
        backgroundColor: "#ffffff",
        logging: false
    }).then(canvas => {
        // 4. 다운로드
        const link = document.createElement('a');
        link.download = 'wwm-build.png';
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 5. [중요] 캡쳐 끝났으니 출처 문구 제거 (화면에서 안 보이게)
        if (watermark.parentNode) {
            watermark.parentNode.removeChild(watermark);
        }
    }).catch(err => {
        console.error("이미지 저장 실패:", err);
        alert("이미지 저장 중 오류가 발생했습니다.");
        // 에러가 나더라도 출처 문구는 지워줌
        if (watermark.parentNode) {
            watermark.parentNode.removeChild(watermark);
        }
    });
}

// =========================================
// [추가] 네비게이션 더보기 드롭다운 기능
// =========================================

// [수정] 드롭다운 토글 함수 (어떤 메뉴를 열지 ID를 받아서 처리)
function toggleNavDropdown(event, menuId) {
    event.stopPropagation(); // 이벤트 전파 중단

    // 1. 열려있는 다른 모든 드롭다운 닫기
    const allDropdowns = document.querySelectorAll('.nav-dropdown-content');
    allDropdowns.forEach(d => {
        if (d.id !== menuId) {
            d.classList.remove('show');
        }
    });

    // 2. 클릭한 메뉴만 열기/닫기 토글
    const dropdown = document.getElementById(menuId);
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
}

// [수정] 화면의 빈 곳을 클릭하면 모든 드롭다운 닫기
window.addEventListener('click', function(event) {
    if (!event.target.closest('.nav-dropdown-wrapper')) {
        const dropdowns = document.querySelectorAll(".nav-dropdown-content");
        dropdowns.forEach(d => d.classList.remove('show'));
    }
});

// =========================================
// [추가] 천지록(Chunji) 기능
// =========================================

// 목록 렌더링
function renderChunjiList() {
    const container = document.getElementById('chunji-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!chunjiData || chunjiData.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">데이터가 없습니다.</div>';
        return;
    }

    chunjiData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'chunji-item';
        div.onclick = () => loadChunjiDetail(item, index);
        // 썸네일 없이 텍스트만 표시
        div.innerHTML = `<div class="chunji-title">${item.title}</div>`;
        container.appendChild(div);
    });
}

// 상세 보기 로드
function loadChunjiDetail(item, index) {
    const listView = document.getElementById('chunji-list-view');
    const detailView = document.getElementById('chunji-detail-view');
    const content = document.getElementById('chunji-detail-content');

    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    // URL 업데이트 (선택 사항)
    // updateUrlQuery('chunji', index); 

    // 이미지 HTML 생성 헬퍼
    const createImgHtml = (src) => src ? `<img src="${src}" class="detail-img" onerror="this.style.display='none'">` : '';

    content.innerHTML = `
        <div class="chunji-detail-header">
            <span class="badge item">유물</span>
            <h2 class="chunji-detail-title">${item.title}</h2>
        </div>

        <div class="detail-section">
            <h3 class="detail-subtitle">획득 방법</h3>
            <p class="detail-text">${item.get || '정보 없음'}</p>
            <div class="detail-images">
                ${createImgHtml(item.getimg1)}
                ${createImgHtml(item.getimg2)}
            </div>
        </div>

        <div class="detail-section">
            <h3 class="detail-subtitle">해독 방법</h3>
            <p class="detail-text">${item.dsec || '정보 없음'}</p> <div class="detail-images">
                ${createImgHtml(item.dsecimg1)}
                ${createImgHtml(item.dsecimg2)}
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

// =========================================
// [수정/통합] 천지록(Chunji) 기능 로직
// =========================================

// 목록 렌더링
// 목록 렌더링 (수정됨: 타입 정보 추가)
function renderChunjiList() {
    const container = document.getElementById('chunji-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!chunjiData || chunjiData.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">데이터가 없습니다.</div>';
        return;
    }

    chunjiData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'chunji-item';
        div.onclick = () => loadChunjiDetail(item, index);
        
        // ▼▼▼ [수정] 제목과 타입(type)을 감싸는 래퍼 추가 ▼▼▼
        div.innerHTML = `
            <div class="chunji-text-group">
                <div class="chunji-title">${item.title}</div>
                <div class="chunji-type">${item.type || '분류 없음'}</div>
            </div>
            <div class="arrow-icon">›</div>
        `;
        
        container.appendChild(div);
    });
}

// =========================================
// [최종 완료] 천지록(Chunji) 기능 (페이징 + 필터 포함)
// =========================================

// 전역 변수 (상단 변수 선언부에 없으면 여기서 선언)
let currentChunjiPage = 1; // 현재 천지록 페이지

// 1. 카테고리 필터 함수
function filterChunjiType(type, btnElement) {
    // 버튼 스타일 활성화
    const buttons = document.querySelectorAll('#chunji-list-view .guide-item-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    // 데이터 필터링
    if (!chunjiData) return;

    if (type === 'all') {
        currentChunjiData = chunjiData;
    } else {
        currentChunjiData = chunjiData.filter(item => item.type === type);
    }

    // [중요] 필터 변경 시 1페이지로 초기화
    currentChunjiPage = 1;
    renderChunjiList();
}

// 2. 목록 렌더링 (페이징 적용됨)
function renderChunjiList() {
    const container = document.getElementById('chunji-list-container');
    const paginationContainer = document.getElementById('chunji-pagination-container');
    
    if (!container) return;
    container.innerHTML = '';

    // 데이터가 없을 때
    if (!currentChunjiData || currentChunjiData.length === 0) {
        container.innerHTML = '<div style="padding:40px 0; text-align:center; color:#888;">해당하는 기록이 없습니다.</div>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // [페이징 계산]
    const startIndex = (currentChunjiPage - 1) * itemsPerPage; // itemsPerPage는 전역변수(12) 사용
    const endIndex = startIndex + itemsPerPage;
    
    // 현재 페이지에 해당하는 데이터만 자르기
    const pageData = currentChunjiData.slice(startIndex, endIndex);

    pageData.forEach((item) => {
        // 주의: 필터링/페이징 된 상태이므로 index 대신 item 자체를 넘김
        const div = document.createElement('div');
        div.className = 'chunji-item';
        div.onclick = () => loadChunjiDetail(item);
        
        div.innerHTML = `
            <div class="chunji-text-group">
                <div class="chunji-title">${item.title}</div>
                <div class="chunji-type">${item.type || '기타'}</div>
            </div>
        `;
        
        container.appendChild(div);
    });

    // 페이지네이션 버튼 렌더링 호출
    renderChunjiPagination();
}

// 3. 페이지네이션 렌더링 (퀘스트와 동일한 로직)
function renderChunjiPagination() {
    const container = document.getElementById('chunji-pagination-container');
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(currentChunjiData.length / itemsPerPage);
    if (totalPages <= 1) return; // 1페이지뿐이면 버튼 숨김

    const createBtn = (text, page, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${active ? 'active' : ''}`;
        btn.innerText = text;
        btn.disabled = disabled;
        btn.onclick = () => changeChunjiPage(page);
        return btn;
    };

    // [이전] 버튼
    container.appendChild(createBtn('<', currentChunjiPage - 1, false, currentChunjiPage === 1));

    // [번호] 버튼 (최대 5개 표시 로직)
    const maxVisibleButtons = 5;
    let startPage = currentChunjiPage - Math.floor(maxVisibleButtons / 2);
    let endPage = currentChunjiPage + Math.floor(maxVisibleButtons / 2);

    if (startPage < 1) {
        startPage = 1;
        endPage = Math.min(totalPages, maxVisibleButtons);
    }
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, totalPages - maxVisibleButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createBtn(i, i, i === currentChunjiPage));
    }

    // [다음] 버튼
    container.appendChild(createBtn('>', currentChunjiPage + 1, false, currentChunjiPage === totalPages));
}

// 4. 페이지 변경 함수
function changeChunjiPage(page) {
    currentChunjiPage = page;
    renderChunjiList();
    
    // [추가] 페이지 변경 시 URL 업데이트 (브라우저 기록에 남김)
    updateUrlQuery('chunji');
    
    document.getElementById('chunji-list-view').scrollIntoView({ behavior: 'smooth' });
}

// 5. 상세 보기
function loadChunjiDetail(item) {
    const listView = document.getElementById('chunji-list-view');
    const detailView = document.getElementById('chunji-detail-view');
    const content = document.getElementById('chunji-detail-content');

    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    if (item.id) updateUrlQuery('chunji', item.id);

    const imgTag = (src) => src ? `<div class="detail-img-wrapper"><img src="${src}" alt="참고 이미지"></div>` : '';

    content.innerHTML = `
        <div class="chunji-header-area">
            <span class="chunji-badge">천지록</span>
            <h2 class="chunji-main-title">${item.title}</h2>
        </div>

        <div class="chunji-section">
            <h3 class="chunji-sub-title">획득 방법</h3>
            <p class="chunji-text">${item.get || '정보가 없습니다.'}</p>
            <div class="chunji-img-grid">
                ${imgTag(item.getimg1)}
                ${imgTag(item.getimg2)}
            </div>
        </div>

        <div class="chunji-section">
            <h3 class="chunji-sub-title">해독 방법</h3>
            <p class="chunji-text">${item.dsec || '정보가 없습니다.'}</p>
            <div class="chunji-img-grid">
                ${imgTag(item.dsecimg1)}
                ${imgTag(item.dsecimg2)}
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

// 6. 목록으로 돌아가기
function showChunjiList() {
    document.getElementById('chunji-list-view').style.display = 'block';
    document.getElementById('chunji-detail-view').style.display = 'none';
    updateUrlQuery('chunji');
}

// 7. 검색 결과 선택
function selectChunjiResult(index) {
    switchTab('chunji');
    loadChunjiDetail(globalData.chunji[index]);
    document.getElementById("global-search-results").style.display = 'none';
}

// 8. ID로 상세 로드
function loadChunjiDetailById(id) {
    const item = chunjiData.find(c => c.id == id);
    if (item) {
        loadChunjiDetail(item);
    }
}

// =========================================
// [통합] 바텀 시트 공통 기능 및 탭 설정
// =========================================

/**
 * 1. 윤쫑 (인게임 제보) 시트 관련
 */
function openReportSheet() {
    const modal = document.getElementById('report-sheet-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // [옵션] 열 때마다 무조건 '제보' 탭으로 초기화하고 싶다면 주석 해제
        // const defaultBtn = modal.querySelector('.sheet-tab-btn:nth-child(1)');
        // switchReportTab('report', defaultBtn);
    }
}

function closeReportSheet(e) {
    // X버튼 클릭(e 없음) 또는 배경 클릭(e.target 확인) 시 닫기
    if (!e || e.target.id === 'report-sheet-modal') {
        const modal = document.getElementById('report-sheet-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';

            // ▼▼▼ [핵심] 닫힐 때 탭 초기화 (애니메이션 후 실행) ▼▼▼
            setTimeout(() => {
                const defaultBtn = modal.querySelector('.sheet-tab-btn:nth-child(1)'); // 첫 번째 버튼
                switchReportTab('report', defaultBtn);
            }, 300);
        }
    }
}

function switchReportTab(tabName, btnElement) {
    const modal = document.getElementById('report-sheet-modal');
    if (!modal) return;

    // A. 컨텐츠 전환
    const reportTab = document.getElementById('tab-content-report');
    const giftTab = document.getElementById('tab-content-gift');
    
    if(reportTab) reportTab.style.display = (tabName === 'report') ? 'block' : 'none';
    if(giftTab) giftTab.style.display = (tabName === 'gift') ? 'block' : 'none';

    // B. 버튼 스타일 변경 ([중요] 이 모달 안의 버튼만 찾도록 범위 한정)
    const buttons = modal.querySelectorAll('.sheet-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (btnElement) {
        btnElement.classList.add('active');
    }
}


/**
 * 2. 문진관 제자 (진행 현황) 시트 관련
 */
function openProgressSheet() {
    const modal = document.getElementById('progress-sheet-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeProgressSheet(e) {
    if (!e || e.target.id === 'progress-sheet-modal') {
        const modal = document.getElementById('progress-sheet-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';

            // ▼▼▼ [핵심] 닫힐 때 탭 초기화 ▼▼▼
            setTimeout(() => {
                const defaultBtn = modal.querySelector('.sheet-tab-btn:nth-child(1)'); // 첫 번째 버튼
                switchProgressTab('status', defaultBtn);
            }, 300);
        }
    }
}

function switchProgressTab(tabName, btnElement) {
    const modal = document.getElementById('progress-sheet-modal');
    if (!modal) return;

    // A. 컨텐츠 전환
    const statusTab = document.getElementById('tab-p-status');
    const cheerTab = document.getElementById('tab-p-cheer');

    if(statusTab) statusTab.style.display = (tabName === 'status') ? 'block' : 'none';
    if(cheerTab) cheerTab.style.display = (tabName === 'cheer') ? 'block' : 'none';

    // B. 버튼 스타일 변경 ([중요] 이 모달 안의 버튼만 찾도록 범위 한정)
    const buttons = modal.querySelectorAll('.sheet-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (btnElement) {
        btnElement.classList.add('active');
    }
}

// =========================================
// [수정/추가] 동적 필터링 로직 (분류 선택 시 지역 목록 갱신)
// =========================================

// 1. 분류(Type) 변경 시 호출되는 함수
function onQuestTypeChange() {
    // 1단계: 선택된 분류에 맞는 지역 목록만 다시 생성
    updateLocationOptions(); 
    
    // 2단계: 필터 적용하여 그리드 다시 그리기
    applyQuestFilter();
}

// 2. 현재 선택된 분류에 따라 지역(Location) 옵션을 새로고침하는 함수
function updateLocationOptions() {
    const typeSelect = document.getElementById('quest-type-select');
    const locationSelect = document.getElementById('quest-location-select');
    
    if (!typeSelect || !locationSelect || !globalData.quests) return;

    const selectedType = typeSelect.value; // 현재 선택된 분류 (예: '만사록')

    // A. 현재 분류에 해당하는 퀘스트만 추리기
    let filteredData = globalData.quests;
    if (selectedType !== 'all') {
        filteredData = globalData.quests.filter(q => q.type === selectedType);
    }

    // B. 추려진 퀘스트에서 지역(Location)만 뽑아서 중복 제거
    const locations = new Set();
    filteredData.forEach(q => {
        if (q.location && q.location.trim() !== "") {
            locations.add(q.location);
        }
    });

    // C. 가나다 순 정렬
    const sortedLocations = Array.from(locations).sort();

    // D. 드롭다운 초기화 및 다시 채우기
    locationSelect.innerHTML = '<option value="all">모든 지역</option>'; // 기본값 복구
    
    sortedLocations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.innerText = loc;
        locationSelect.appendChild(option);
    });

    // E. 분류가 바뀌었으므로 지역 선택은 '모든 지역'으로 리셋
    locationSelect.value = 'all'; 
}

// 3. 실제 필터링 적용 및 렌더링 함수 (기존 로직 유지/보완)
function applyQuestFilter() {
    const typeSelect = document.getElementById('quest-type-select');
    const locationSelect = document.getElementById('quest-location-select');
    
    const selectedType = typeSelect ? typeSelect.value : 'all';
    const selectedLocation = locationSelect ? locationSelect.value : 'all';

    // 데이터 필터링 (AND 조건)
    currentQuestData = globalData.quests.filter(item => {
        const typeMatch = (selectedType === 'all') || (item.type === selectedType);
        const locationMatch = (selectedLocation === 'all') || (item.location === selectedLocation);
        return typeMatch && locationMatch;
    });

    // 1페이지로 초기화 후 렌더링
    currentPage = 1;
    renderQuestList();
}

// =========================================
// [추가] 가이드(비급) 드롭다운 기능
// =========================================

// 1. 드롭다운 선택 시 콘텐츠 로드
function onGuideSelectChange(selectElement) {
    const filename = selectElement.value;
    // 기존 loadGuideContent 함수 재사용 (두 번째 인자는 버튼이 없으므로 null)
    loadGuideContent(filename, null);
}

// 2. loadGuideView 수정 (기존 함수 업데이트)
// 가이드 탭을 처음 눌렀을 때나 URL로 접근했을 때 드롭다운 상태를 동기화합니다.
function loadGuideView() {
    const container = document.getElementById('guide-content-loader');
    if (!container) return;

    // URL 파라미터 확인 (예: ?g=code)
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id') || urlParams.get('g');
    
    // 기본값은 뉴스
    let fileToLoad = 'news.html';
    if (targetId && GUIDE_MAP[targetId]) fileToLoad = GUIDE_MAP[targetId];

    if (isGuideLoaded) {
        // 이미 로드된 상태라면 드롭다운 값만 맞추고 콘텐츠 로드
        syncGuideDropdown(fileToLoad);
        loadGuideContent(fileToLoad, null);
        return; 
    }
    
    // HTML 파일 불러오기
    fetch('guide.html') 
        .then(res => res.text())
        .then(html => {
            container.innerHTML = html;
            container.style.marginTop = '0';
            isGuideLoaded = true;

            // [추가] 로드 직후 드롭다운 상태 동기화
            syncGuideDropdown(fileToLoad);
            
            loadGuideContent(fileToLoad, null); 
        });
}

// [헬퍼 함수] 드롭다운의 선택값을 현재 보고 있는 파일로 변경
function syncGuideDropdown(filename) {
    const select = document.getElementById('guide-select');
    if (select) {
        select.value = filename;
    }
}

// =========================================
// [수정] 천지록 동적 필터링 (Type + Subtype 연동)
// =========================================

// 1. 메인 분류(Type) 변경 시 호출
function onChunjiTypeChange() {
    // 1단계: 선택된 분류에 맞는 세부 분류(Subtype) 목록 갱신
    updateChunjiSubtypeOptions(); 
    
    // 2단계: 필터 적용하여 리스트 다시 그리기
    applyChunjiFilter();
}

// 2. 세부 분류(Subtype) 옵션 업데이트 함수
function updateChunjiSubtypeOptions() {
    const typeSelect = document.getElementById('chunji-type-select');
    const subtypeSelect = document.getElementById('chunji-subtype-select');
    
    if (!typeSelect || !subtypeSelect || !globalData.chunji) return;

    const selectedType = typeSelect.value; // 현재 선택된 메인 분류

    // A. 현재 메인 분류에 해당하는 아이템만 추리기
    let filteredData = globalData.chunji;
    if (selectedType !== 'all') {
        filteredData = globalData.chunji.filter(item => item.type === selectedType);
    }

    // B. 세부 분류(subtype) 추출 및 중복 제거
    const subtypes = new Set();
    filteredData.forEach(item => {
        // subtype이 있고, 비어있지 않은 경우만 추가
        if (item.subtype && item.subtype.trim() !== "") {
            subtypes.add(item.subtype);
        }
    });

    // C. 가나다 순 정렬
    const sortedSubtypes = Array.from(subtypes).sort();

    // D. 드롭다운 초기화 및 다시 채우기
    subtypeSelect.innerHTML = '<option value="all">모든 항목</option>'; // 기본값
    
    sortedSubtypes.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.innerText = sub;
        subtypeSelect.appendChild(option);
    });

    // E. 메인 분류가 바뀌었으므로 세부 분류는 '전체'로 리셋
    subtypeSelect.value = 'all'; 
}

// 3. 필터 적용 및 렌더링 함수
function applyChunjiFilter() {
    const typeSelect = document.getElementById('chunji-type-select');
    const subtypeSelect = document.getElementById('chunji-subtype-select');
    
    const selectedType = typeSelect ? typeSelect.value : 'all';
    const selectedSubtype = subtypeSelect ? subtypeSelect.value : 'all';

    // 데이터 필터링 (AND 조건)
    currentChunjiData = globalData.chunji.filter(item => {
        // 1. 메인 분류 체크
        const typeMatch = (selectedType === 'all') || (item.type === selectedType);
        
        // 2. 세부 분류 체크
        // (데이터에 subtype이 아예 없는 경우도 고려하여 안전하게 처리)
        const itemSubtype = item.subtype || "";
        const subtypeMatch = (selectedSubtype === 'all') || (itemSubtype === selectedSubtype);

        return typeMatch && subtypeMatch;
    });

    // 1페이지로 초기화 후 렌더링
    currentChunjiPage = 1;
    renderChunjiList();
}
// [추가] 드롭다운 메뉴 클릭 시 해당 비급 파일 바로 열기
function openGuideDirect(filename) {
    // 1. 해당 파일에 매칭되는 ID 찾기 (예: 'boss.html' -> 'boss')
    const foundId = Object.keys(GUIDE_MAP).find(key => GUIDE_MAP[key] === filename);
    
    // 2. 가이드 데이터가 아직 안 불려와졌을 때 (새로고침 직후 등)
    if (!isGuideLoaded) {
        // URL에 ID를 미리 박아두고 switchTab을 부르면, loadGuideView가 알아서 처리함
        if (foundId) updateUrlQuery('guide', foundId);
        switchTab('guide', false); 
    } 
    // 3. 이미 로드되어 있을 때
    else {
        // 탭 전환 후 강제로 콘텐츠 교체
        switchTab('guide', false);
        if (foundId) updateUrlQuery('guide', foundId);
        loadGuideContent(filename, null);
    }
}

// ★★★ 구글 앱스 스크립트 배포 URL (이벤트 페이지와 동일한 주소) ★★★// [script.js] shareBuildToCloud 함수 (최종 완성본)
function shareBuildToCloud() {
    // 1. 입력값 가져오기
    const title = document.getElementById('build-title').value.trim();
    const creator = document.getElementById('build-creator').value.trim();
    const recWeapons = document.getElementById('rec-weapons').value.trim();
    const recArmor = document.getElementById('rec-armor').value.trim();
    const desc = document.getElementById('build-desc').value.trim();
    
    const typeRadio = document.querySelector('input[name="buildType"]:checked');
    const type = typeRadio ? typeRadio.value : "PvE";

    // 2. ★★★ [필수 입력 체크] 하나라도 비어있으면 차단 ★★★
    if (!title) {
        alert("⚠️ 빌드 이름을 입력해주세요!");
        document.getElementById('build-title').focus();
        return;
    }
    if (!creator) {
        alert("⚠️ 닉네임을 입력해주세요!");
        document.getElementById('build-creator').focus();
        return;
    }
    if (!recWeapons) {
        alert("⚠️ 추천 무기 세트를 입력해주세요! (예: 흑룡)");
        document.getElementById('rec-weapons').focus();
        return;
    }
    if (!recArmor) {
        alert("⚠️ 추천 방어구 세트를 입력해주세요! (예: 광전사)");
        document.getElementById('rec-armor').focus();
        return;
    }

    // 최종 확인
    if (!confirm(`'${title}' 빌드를 공유하시겠습니까?`)) return;

    // 3. 버튼 잠금 (전송 시작)
    // 클릭된 버튼 요소를 안전하게 찾기 (아이콘 클릭 시 부모 버튼 찾기)
    const btnTarget = event.target; 
    const submitBtn = btnTarget.closest('button') || btnTarget; 
    const originalText = submitBtn.innerText;
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "IP 확인 중...";
    }

    // 4. 링크 생성
    generateBuildUrl(); 
    const link = document.getElementById('result-url').value;

    if (!link) {
        alert("빌드 데이터를 생성하지 못했습니다. 아이템을 선택했는지 확인해주세요.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = originalText; }
        return;
    }

    // 5. 무기 데이터 추출
    let weapons = [];
    if (currentBuild && currentBuild.weapons) {
        weapons = currentBuild.weapons.filter(id => id !== null && id !== "");
    }

    // 6. ★★★ [핵심] IP 조회 후 서버로 데이터 전송 ★★★
    fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(ipData => {
        const userIp = ipData.ip;
        
        if (submitBtn) submitBtn.innerText = "전송 중...";

        // 서버로 보낼 데이터 묶음
        const params = new URLSearchParams({
            action: 'submit_build',
            title: title,
            creator: creator,
            type: type,
            desc: desc,
            weapons: JSON.stringify(weapons),
            link: link,
            rec_weapons: recWeapons,
            rec_armor: recArmor,
            ip: userIp // 차단 확인용 IP
        });

        if (typeof BUILD_API_URL === 'undefined') { throw new Error("서버 주소(BUILD_API_URL)가 설정되지 않았습니다."); }

        // 구글 Apps Script로 전송
        return fetch(`${BUILD_API_URL}?${params.toString()}`);
    })
    .then(res => res.text())
    .then(data => {
        data = data.trim();
        
        // 결과에 따른 처리
        if (data === "SUCCESS") {
            alert("✅ 빌드가 성공적으로 공유되었습니다!");
            // 입력창 초기화
            document.getElementById('build-title').value = "";
            document.getElementById('build-creator').value = "";
            document.getElementById('build-desc').value = "";
            document.getElementById('rec-weapons').value = ""; 
            document.getElementById('rec-armor').value = "";   
        } 
        else if (data === "FAIL:BAD_WORD_BANNED") {
            alert("🚫 [경고] 금칙어(욕설/비하/정치 등) 사용이 감지되었습니다.\n\n해당 IP는 블랙리스트에 등록되어\n앞으로 빌드 공유 기능을 사용할 수 없습니다.");
        } 
        else if (data === "FAIL:BLOCKED_USER") {
            alert("⛔ [차단됨] 귀하의 IP는 운영 정책 위반으로 인해\n빌드 공유 기능이 영구 차단되었습니다.");
        }
        else if (data === "FAIL:TOO_LONG") {
            alert("🚫 입력한 내용이 너무 깁니다. 조금만 줄여주세요.");
        } 
        else if (data === "FAIL:MISSING_DATA") {
            alert("⚠️ 필수 데이터가 누락되었습니다.");
        }
        else {
            alert("전송 실패: " + data);
        }
    })
    .catch(err => {
        console.error(err);
        alert("서버 통신 중 오류가 발생했습니다.\n(AdBlock 등이 켜져있다면 꺼주세요)");
    })
    .finally(() => {
        // 전송이 끝나면 버튼 원래대로 복구
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });
}