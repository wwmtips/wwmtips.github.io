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

// 빌더 상태 관리
let currentBuild = { weapons: [null,null], hearts: [null,null,null,null], marts: new Array(8).fill(null) };
let currentSlot = { type: '', index: 0 };

// [지도 더미 데이터]
const dummyMapData = [
    {
        title: "청하",
        key:"qinghe",
        desc: "어린 주인공이 많은 가족들과 함께 생활하던 지역으로 이야기의 시작지입니다.",
        link: "https://yhellos3327-eng.github.io/wwmkoreamap/",
        image: "images/map2.jpeg" 
    },
    {
        title: "개봉",
        key: "kaifeng",
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
    loadHomeMaps();

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

    Promise.all([
        fetch('json/datas.json').then(res => res.json()).catch(err => { console.warn('data.json 로드 실패', err); return {}; }),
        fetch('json/quests.json').then(res => res.json()).catch(err => { console.warn('quests.json 로드 실패', err); return []; }), 
        fetch('json/news.json').then(res => res.json()).catch(err => { console.warn('news.json 로드 실패', err); return []; }),
        fetch('json/cnews.json').then(res => res.json()).catch(err => { console.warn('cnews.json 로드 실패', err); return []; }),
        fetch('json/builds.json').then(res => res.json()).catch(err => { console.warn('builds.json 로드 실패', err); return { builds: [] }; }),
        fetch('json/builder_data.json').then(res => res.json()).catch(err => { console.warn('builder_data.json 로드 실패', err); return null; }) 
    ])
    .then(([mainData, questData, newsData, cnewsData, buildsData, builderDataResult]) => {
        console.log("데이터 로드 완료");

        let quests = Array.isArray(questData) ? questData : (questData.quests || []);
        let news = Array.isArray(newsData) ? newsData : (newsData.news || []);
        let cnews = Array.isArray(cnewsData) ? cnewsData : (cnewsData.cnews || []);
        let builds = buildsData.builds || [];

        if (quests.length > 0) {
            quests.sort((a, b) => {
                const numA = parseInt((a.id || "").replace('q', '')) || 0;
                const numB = parseInt((b.id || "").replace('q', '')) || 0;
                return numB - numA; 
            });
        }
        
        globalData = {
            items: mainData.items || [],
            quiz: mainData.quiz || [],
            quests: quests, 
            news: news,
            cnews: cnews,
            builds: builds 
        };

        builderData = builderDataResult; 
        currentQuestData = globalData.quests;

        renderQuizTable(globalData.quiz);
        updateQuizCounter();
        renderQuestList();                
        renderHomeSlider(globalData.quests); 
        renderHomeRecentNews(globalData.news);     
        renderHomeCommunityNews(globalData.cnews);
        renderFullNews(globalData.news);

        if (targetTab === 'builder') {
             renderBuildList('all');
        }

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

    cnewsList.slice(0, 5).forEach((item, index) => {
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
}

// =========================================
// 5. 탭 전환 및 URL 관리
// =========================================
function switchTab(tabName) {
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder', 'view-map-detail'];
    const navs = ['nav-home', 'nav-quiz', 'nav-quest', 'nav-code', 'nav-builder'];

    views.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
    navs.forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('active'); });

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
        if(!params.get('id') && !params.get('g')) updateUrlQuery('guide');
    }
    else if (tabName === 'builder') {
        document.getElementById('view-builder').style.display = 'block';
        document.getElementById('nav-builder').classList.add('active');
        document.getElementById('tools-menu').style.display = 'block';
        document.getElementById('builder-interface').style.display = 'none';

        if (!builderData) {
            fetch('json/builder_data.json')
                .then(res => res.json())
                .then(data => { 
                    builderData = data; 
                    renderBuildList('all'); 
                })
                .catch(err => console.error("빌더 데이터 로드 실패:", err));
        } else {
            renderBuildList('all'); 
        }
        
        if (new URLSearchParams(window.location.search).get('b')) {
            openBuilderInterface();
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
        url.searchParams.set('q', id.toLowerCase().replace('q', ''));
    } 
    else if (tab === 'guide' && id) {
        url.searchParams.set('g', id);
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

    const tab = urlParams.get('tab'); 
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
        <div class="quest-icon-wrapper"><img src="${quest.iconpath}" alt="icon" onerror="this.src='images/logo.png'"></div>
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
    const totalPages = Math.ceil(currentQuestData.length / itemsPerPage);
    if (totalPages <= 1) return;

    const createBtn = (text, page, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${active ? 'active' : ''}`;
        btn.innerText = text;
        btn.disabled = disabled;
        btn.onclick = () => changePage(page);
        return btn;
    };

    container.appendChild(createBtn('<', currentPage - 1, false, currentPage === 1));
    for (let i = 1; i <= totalPages; i++) container.appendChild(createBtn(i, i, i === currentPage));
    container.appendChild(createBtn('>', currentPage + 1, false, currentPage === totalPages));
}

function changePage(page) {
    currentPage = page;
    renderQuestList();
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

function generateBuildUrl() {
    const creatorName = document.getElementById('creator-name').value.trim();
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
        const getImg = (id) => {
            if (!builderData || !builderData.weapons) return 'images/logo.png';
            const item = builderData.weapons.find(w => w.id === id);
            return item ? item.img : 'images/logo.png';
        };

        const row = document.createElement('div');
        row.className = 'build-row-card';
        row.onclick = () => { openBuildDetailSheet(build); };
        const typeClass = build.type.toUpperCase() === 'PVP' ? 'type-pvp' : 'type-pve';
        
        row.innerHTML = `
            <div class="build-icons-area">
                <div class="build-icon-box"><img src="${getImg(w1Id)}" alt="무기1"></div>
                <div class="build-icon-box"><img src="${getImg(w2Id)}" alt="무기2"></div>
            </div>
            <div class="build-info-area">
                <div class="build-header-row"><span class="build-title">${build.title}</span><span class="build-type-badge ${typeClass}">${build.type}</span></div>
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
/* =========================================
   [기능 업그레이드] 텍스트 내 링크 자동 변환 함수
   1. 유튜브 주소 -> 동영상 플레이어 변환
   2. 일반 주소 -> 클릭 가능한 링크(새창) 변환
   ========================================= */
function convertYoutubeToEmbed(text) {
    if (!text) return '획득 방법 정보가 없습니다.';

    // URL 패턴 탐지 (http 또는 https로 시작하는 모든 주소)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.replace(urlRegex, (url) => {
        // 1. 유튜브 링크인지 확인 (youtube.com 또는 youtu.be)
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
        
        if (ytMatch && ytMatch[1]) {
            // 유튜브라면 -> 영상 임베드 (iframe)
            return `
            <div style="margin-top: 10px; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000; margin-bottom: 10px;">
                <iframe src="https://www.youtube.com/embed/${ytMatch[1]}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>`;
        } else {
            // 2. 유튜브가 아닌 일반 링크라면 -> 클릭 가능한 링크 (a tag)
            // 스타일: 굵은 글씨, 밑줄, 금색 테마 적용
            return `<a href="${url}" target="_blank" style="color: #d48806; font-weight: bold; text-decoration: underline; word-break: break-all;">[링크 확인하기 ↗]</a>`;
        }
    });
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
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">📜 설명</h4>
                <p style="color: #555; line-height: 1.6; background: #fff; padding: 10px; border: 1px dashed #ddd; border-radius: 4px;">
                    ${heart.desc || '설명 정보가 없습니다.'}
                </p>
            </div>
            <div class="detail-chunk">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">🗝 획득 방법</h4>
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
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">📜 효과</h4>
                <p style="color: #555; line-height: 1.6; background: #fff; padding: 10px; border: 1px dashed #ddd; border-radius: 4px;">
                    ${mart.desc || '효과 정보가 없습니다.'}
                </p>
            </div>
            <div class="detail-chunk">
                <h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">🗝 획득 방법</h4>
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
function openBuildDetailSheet(build) {
    const sheet = document.getElementById('build-detail-sheet');
    const contentArea = sheet.querySelector('.sheet-content');
    const linkParts = build.link.split('?b=');
    const encodedData = linkParts.length > 1 ? linkParts[1] : null;

    if (!encodedData || !builderData) {
        contentArea.innerHTML = `<div style="padding: 50px; text-align: center; color: var(--wuxia-accent-red);">🚨 상세 빌드 정보를 불러올 수 없습니다.</div>`;
        openBuildDetailSheetView();
        return;
    }

    try {
        const decodedString = decodeURIComponent(escape(atob(encodedData)));
        const parsedData = JSON.parse(decodedString);
        let html = `<div style="border-bottom: 2px dashed #ddd; padding-bottom: 10px; margin-bottom: 20px;"><p style="margin: 0; color: #999; font-size: 0.9em;">${build.description || '작성된 설명이 없습니다.'}</p></div>`;
        
        const renderSection = (typeKey, title, slots) => {
            html += `<h4 style="color: #333; margin-top: 20px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 8px;">${title}</h4><div class="slot-group" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 15px;">`;
            slots.forEach(id => {
                const item = getItemDetail(typeKey, id);
                html += `<div style="width: 80px; text-align: center;"><img src="${item.img}" style="width: 60px; height: 60px; border: 1px solid #ddd; border-radius: 4px; object-fit: cover;"><p style="font-size: 0.75em; color: #333; margin: 5px 0 0 0; line-height: 1.2;">${item.name}</p></div>`;
            });
            html += `</div>`;
        };

        if (parsedData.w && parsedData.w.filter(id => id).length > 0) renderSection('weapons', '무기 및 무술', parsedData.w);
        if (parsedData.h && parsedData.h.filter(id => id).length > 0) renderSection('hearts', '심법', parsedData.h);
        if (parsedData.m && parsedData.m.filter(id => id).length > 0) renderSection('marts', '비결', parsedData.m);
        
        html += `<div style="text-align: center; margin-top: 30px;"></div>`;
        document.getElementById('build-sheet-title').innerText = build.title;
        contentArea.innerHTML = html;
        openBuildDetailSheetView();

    } catch (e) {
        console.error("Decoding error:", e);
        contentArea.innerHTML = `<div style="padding: 50px; text-align: center; color: var(--wuxia-accent-red);">🚨 잘못된 빌드 코드 형식입니다.</div>`;
        openBuildDetailSheetView();
    }
}

function openBuildDetailSheetView() { document.body.classList.add('build-sheet-open'); }
function closeBuildDetailSheet() { document.body.classList.remove('build-sheet-open'); }

// 13. 지도 상세 뷰 기능
function openMapDetail(mapName, mapKey) {
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder'];
    views.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });

    const mapDiv = document.getElementById('view-map-detail');
    if(mapDiv) {
        mapDiv.style.display = 'block';
        document.getElementById('map-detail-title').innerText = mapName;
        const targetUrl = `https://yhellos3327-eng.github.io/wwmkoreamap/?map=${mapKey}&embed=true`;
        const iframe = document.getElementById('map-iframe');
        if(iframe && iframe.src !== targetUrl) iframe.src = targetUrl;
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
