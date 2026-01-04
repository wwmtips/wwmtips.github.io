/* =========================================
   script.js (최종 수정본 - 문법 오류 해결 및 비결 기능 통합)
   ========================================= */

// =========================================
// 1. 전역 변수 및 데이터 저장소
// =========================================
let currentQuestData = [];
let currentPage = 1;// [수정] 고정 상수에서 가변 변수로 변경
let itemsPerPage = 12;
let isGuideLoaded = false;
let currentUserIp = null; // 전역 변수로 IP 저장
let globalLikes = {}; // 전체 좋아요 캐시 저장소
let likeSystemPromise = null; // 초기화 상태를 추적하는 Promise

// 슬라이더 관련 변수
let currentSlideIndex = 0;
let slideInterval;

// 데이터 저장소
let globalData = { items: [], quiz: [], quests: [], news: [], cnews: [], builds: [] };
let builderData = null;
let chunjiData = []; // 천지록 데이터 전역 변수
let currentChunjiData = [];
let globalBossData = []; // 데이터를 담아둘 전역 변수
let characterData = [];

let currentSlot = { type: '', index: 0 };
// [수정] 빌드 상태 관리 객체 (combo 배열 추가)
// [수정] 콤보를 빈 배열([])로 초기화해야 + 버튼으로 늘어납니다.
let currentBuild = {
    weapons: [null, null],
    hearts: [null, null, null, null],
    marts: new Array(8).fill(null),
    combo: [] // <--- 여기를 이렇게 빈 배열로 바꿔주세요!
};

const KEY_MAP = {
    'Q': { text: 'Q', color: 'key-red', desc: '무공' },
    '~': { text: '~', color: 'key-blue', desc: '특수' },
    'LMB': { text: 'LMB', color: 'key-gray', desc: '약공' },
    'LMB_H': { text: 'LMB', color: 'key-gray', desc: '약공', hold: true },
    'R': { text: 'R', color: 'key-orange', desc: '강공' },
    'R_H': { text: 'R', color: 'key-orange', desc: '강공', hold: true },
    'TAB': { text: 'TAB', color: 'key-teal', desc: '교체공격' },
    'E': { text: 'E', color: 'key-purple', desc: '반격' },
    'SCR': { text: 'SCR', color: 'key-gray', desc: '무기교체' },
    'G': { text: 'G', color: 'key-yellow', desc: '막기' }
};

// [지도 더미 데이터]
const dummyMapData = [
    {
        title: "대나무 숲",
        key: "bamboo", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/bm.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "신선나루",
        key: "sn", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        desc: "강호로 한 발 다가간 주인공은 개봉에서 수많은 강호인들과 인연을 쌓습니다.",
        image: "images/maps/sn.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "장군사당",
        key: "gesh", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        desc: "삼경에 귀신이 등불을 밝히니, 새벽닭 울음 소리가 보배롭다.",
        image: "images/maps/gs.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "완석포",
        key: "stw", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/sp.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "칠벌고개",
        key: "sg", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/sg.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "불선선",
        key: "bs", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/bs.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "망천평원",
        key: "mang", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/mang.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "소자령",
        key: "sj", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/sj.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "약수안",
        key: "yak", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/yak.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "침식의 숲",
        key: "cf", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/cf.jpg" // (썸네일 이미지가 있다면 유지)
    },
    {
        title: "형연",
        key: "hy", // ★ 이 키값이 map/?id=qinghe 로 들어갑니다
        image: "images/maps/hy.jpg" // (썸네일 이미지가 있다면 유지)
    }
];

// [신규] 화면 크기에 따라 페이지당 아이템 개수 설정
function updateItemsPerPage() {
    if (window.innerWidth >= 1024) {
        itemsPerPage = 18; // PC 버전
    } else {
        itemsPerPage = 12; // 모바일/태블릿 버전
    }
}
// =========================================
// 2. 초기화 (DOMContentLoaded)
// =========================================
// 4. 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadMansarokMenu);
// 만사록 데이터를 불러와 상단에 배치하는 함수 (최종 수정본)// 만사록 데이터 로드 및 분배 (무림록 / 지과)
async function loadMansarokMenu() {
    try {
        const response = await fetch('json/quests.json');
        if (!response.ok) throw new Error('데이터 로드 실패');

        const data = await response.json();

        // ----------------------------------------------------
        // 1. 기존 무림록 (지과 제외, 6개만 표시)
        // ----------------------------------------------------
        const mansarokContainer = document.getElementById('mansarok-list');
        if (mansarokContainer) {
            const mansarokList = data
                .filter(item => !['지과', '보스 공략'].includes(item.type))
                .slice(0, 6);

            mansarokContainer.innerHTML = '';

            mansarokList.forEach(item => {
                const btn = document.createElement('a');
                btn.className = 'mansarok-btn';
                btn.href = "javascript:void(0);";
                btn.onclick = () => {
                    switchTab('quest');
                    loadQuestDetail(item.filepath, item.id);
                };
                btn.innerHTML = `<span>${item.name}</span>`;
                mansarokContainer.appendChild(btn);
            });
        }

        // ----------------------------------------------------
        // 2. [추가] 지과 섹션 (지과만 표시)
        // ----------------------------------------------------
        // #pvp-container 안에 있는 .common-slim-grid를 찾습니다.
        const pvpContainer = document.querySelector('#pvp-container .common-slim-grid');
        
        if (pvpContainer) {
            const pvpList = data.filter(item => item.type === '지과'); // '지과'만 필터링

            pvpContainer.innerHTML = ''; // 초기화

            pvpList.forEach(item => {
                // 디자인 통일성을 위해 'slim-btn' 클래스 사용
                const btn = document.createElement('a');
                btn.className = 'slim-btn'; 
                btn.href = "javascript:void(0);";
                
                btn.onclick = () => {
                    switchTab('quest');
                    loadQuestDetail(item.filepath, item.id);
                };

                // slim-btn 구조에 맞춰 span으로 감싸줌
                btn.innerHTML = `<span>${item.name}</span>`;
                pvpContainer.appendChild(btn);
            });
        }

    } catch (error) {
        console.error('만사록/지과 로드 에러:', error);
    }
}

// 3. 만사록 렌더링 함수 (내부 함수 호출 방식 유지)
function renderMansarok(data) {
    const listContainer = document.getElementById('mansarok-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    // 만사록 타입만 필터링
    const filtered = data.filter(item => item.type === "만사록");

    filtered.forEach(item => {
        const numericId = item.id.replace(/[^0-9]/g, "");

        const btn = document.createElement('a');
        btn.className = 'mansarok-btn';
        btn.href = "javascript:void(0);"; // 주소 이동 방지

        // [핵심] 내부 상세 보기 함수 호출
        btn.onclick = () => {
            if (typeof switchTab === 'function' && typeof loadQuestDetail === 'function') {
                switchTab('quest');
                loadQuestDetail(item.filepath, item.id);
            } else {
                console.warn('탭 전환 또는 상세 로드 함수가 없습니다.');
            }
        };

        btn.innerHTML = `<span>${item.name}</span>`;
        listContainer.appendChild(btn);
    });
}
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
    const oldLimit = itemsPerPage;
    updateItemsPerPage();

    // 개수가 바뀌었을 때만 리스트를 새로 그림
    if (oldLimit !== itemsPerPage) {
        if (document.getElementById('view-quest').style.display === 'block') {
            renderQuestList();
        }
        if (document.getElementById('view-chunji').style.display === 'block') {
            renderChunjiList();
        }
    }

    const listContainer = document.getElementById('mansarok-list');

    function renderMansarok(data) {
        const listContainer = document.getElementById('mansarok-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        // 1. 만사록 타입만 필터링
        const filtered = data.filter(item => item.type === "만사록");

        filtered.forEach(item => {
            // 버튼 엘리먼트 생성 (a 태그 대신 div나 button 권장, a 사용 시 href="javascript:void(0)" 처리)
            const btn = document.createElement('a');
            btn.className = 'mansarok-btn';
            btn.href = "javascript:void(0);"; // 페이지 이동 방지

            // 2. [핵심] 클릭 시 내부 함수 호출 설정
            // 기존에 정의된 switchTab과 loadQuestDetail 함수를 사용합니다.
            btn.onclick = () => {
                switchTab('quest');
                loadQuestDetail(item.filepath, item.id);
            };

            // 버튼 내용 삽입
            btn.innerHTML = `<span>${item.name}</span>`;

            listContainer.appendChild(btn);
        });
    }

    // 로컬 더미 데이터로 실행
    renderMansarok(dummyQuests);
    handleHistoryChange();
});

/**
 * 퀘스트 진행도 시스템 (SPA 완전 대응판)
 * HTML 내부에 스크립트를 넣을 필요가 없습니다.
 */

(function () {
    // 1. 데이터 저장 로직 (이벤트 위임)
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('item-checkbox')) {
            const wrapper = e.target.closest('.check-wrapper');
            const container = e.target.closest('.quest-detail-container');
            if (!wrapper || !container) return;

            const questId = container.id.replace('-container', '');
            const storageKey = `wwm_exploration_${questId}`;
            const itemId = wrapper.getAttribute('data-id');

            let savedData = JSON.parse(localStorage.getItem(storageKey)) || {};
            savedData[itemId] = e.target.checked;
            localStorage.setItem(storageKey, JSON.stringify(savedData));

            e.target.checked ? wrapper.classList.add('completed') : wrapper.classList.remove('completed');
            console.log(`[저장됨] ${questId} - ${itemId}`);
        }
    });

    // 2. 화면에 데이터를 입히는 핵심 함수
    function applyQuestData() {
        const containers = document.querySelectorAll('.quest-detail-container');
        containers.forEach(container => {
            const questId = container.id.replace('-container', '');
            const storageKey = `wwm_exploration_${questId}`;
            const savedData = JSON.parse(localStorage.getItem(storageKey)) || {};
            const wrappers = container.querySelectorAll('.check-wrapper');

            wrappers.forEach(wrapper => {
                const itemId = wrapper.getAttribute('data-id');
                const checkbox = wrapper.querySelector('.item-checkbox');
                if (savedData[itemId]) {
                    if (checkbox) checkbox.checked = true;
                    wrapper.classList.add('completed');
                } else {
                    if (checkbox) checkbox.checked = false;
                    wrapper.classList.remove('completed');
                }
            });
        });
    }

    // 3. SPA 대응: DOM 변화 감지 (핵심)
    // 새로운 HTML 조각이 삽입되면 자동으로 applyQuestData를 실행합니다.
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length) {
                applyQuestData();
                break;
            }
        }
    });

    // 초기 실행 및 관찰 시작
    document.addEventListener('DOMContentLoaded', () => {
        applyQuestData();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // 만약 이미 로드가 끝난 상태라면 즉시 실행
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        applyQuestData();
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
// =========================================
// [수정] 데이터 로딩 함수 (보스 데이터 로드 추가됨)
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    const targetId = urlParams.get('id');
    const shortQuestId = urlParams.get('q');
    const chunjiId = urlParams.get('c');

    // 1단계: 로컬 JSON 데이터 모두 가져오기
    Promise.all([
        fetch('json/datas.json').then(res => res.json()).catch(err => ({})),
        fetch('json/quests.json').then(res => res.json()).catch(err => []),
        fetch('json/news.json').then(res => res.json()).catch(err => []),
        fetch('json/cnews.json').then(res => res.json()).catch(err => []),
        fetch('json/chunji.json').then(res => res.json()).catch(err => ({ chunji: [] })),
        fetch('json/builder_data.json').then(res => res.json()).catch(err => null),
        // ★ [추가] 보스 데이터 불러오기
        fetch('json/boss.json').then(res => res.json()).catch(err => []),
        fetch('json/archive.json').then(res => res.json()).catch(err => []),
        fetch('json/person.json').then(res => res.json()).catch(err => [])

    ])
        .then(([mainData, questData, newsData, cnewsData, chunjiResult, builderDataResult, bossDataResult, archiveData, personResult]) => {
            console.log("기본 데이터 로드 완료");

            // 데이터 정제
            let quests = Array.isArray(questData) ? questData : (questData.quests || []);
            let news = Array.isArray(newsData) ? newsData : (newsData.news || []);
            let cnews = Array.isArray(cnewsData) ? cnewsData : (cnewsData.cnews || []);
            let chunji = Array.isArray(chunjiResult) ? chunjiResult : (chunjiResult.chunji || []);

            // ★ 보스 데이터 전역 변수에 저장
            globalBossData = Array.isArray(bossDataResult) ? bossDataResult : [];
            characterData = personResult;
            // 로컬 테스트용 캐릭터 데이터 배열


            if (quests.length > 0) {
                quests.sort((a, b) => {
                    const numA = parseInt((a.id || "").replace('q', '')) || 0;
                    const numB = parseInt((b.id || "").replace('q', '')) || 0;
                    return numB - numA;
                });
            }

            globalData = {
                items: mainData.items || [], quiz: mainData.quiz || [], quests: quests, news: news, cnews: cnews, chunji: chunji, builds: [],
                archive: Array.isArray(archiveData) ? archiveData : (archiveData.archive || [])
            };
            builderData = builderDataResult;
            currentQuestData = globalData.quests;
            chunjiData = globalData.chunji;
            currentChunjiData = globalData.chunji;

            // 필터 초기화
            updateLocationOptions();
            updateChunjiSubtypeOptions();

            // 화면 그리기
            renderHomeSlider(globalData.quests);
            renderHomeRecentNews(globalData.news);
            renderHomeCommunityNews(globalData.cnews);

            renderQuestList();
            renderChunjiList();
            renderQuizTable(globalData.quiz);
            updateQuizCounter();
            renderFullNews(globalData.news);
            renderComboSlots();
            renderHomeChunji(); // ★ 메인 화면용 리스트 추가 호출 ★
            // ★ 생일 체크 호출 추가
            checkCharacterBirthday();

            if (typeof renderHomeCharacters === 'function') {
                renderHomeCharacters();
            }
            if (typeof renderAchievements === 'function') {
                renderAchievements(archiveData);
            }
            //★ [추가] 보스 목록 그리기 (보스 페이지 or 홈 화면)
            if (document.getElementById('bossGrid')) {
                renderBossList('bossGrid', 'all');
            }
            // 홈 화면에 보스 섹션이 있다면 (예: id="home-boss-list")
            /*   if (document.getElementById('home-boss-list')) {
                   renderBossList('home-boss-list', 'all', 2);
               }*/

            // 상세 페이지 진입 처리
            if (shortQuestId) {
                const fullId = 'q' + shortQuestId;
                const foundQuest = globalData.quests.find(q => q.id === fullId);
                if (foundQuest) loadQuestDetail(foundQuest.filepath, fullId);
            }
            else if (chunjiId) {
                const foundChunji = globalData.chunji.find(c => c.id === chunjiId);
                if (foundChunji) { switchTab('chunji'); loadChunjiDetail(foundChunji); }
            }
           else if (targetTab === 'quest' && targetId) {
                // [수정] 필터 단축 코드 매핑 (원하는 약어와 실제 select value를 연결)
                const filterMap = {
                    'm': '만사록',
                    'g': '가이드',
                    'in': '인연의 궤적',
                    'pvp': '지과',
                    't': '탐색',
                    'h': '화간집',
                    'e': '이벤트',
                    'etc': '기타'
                };

                // 1. 만약 id가 필터 코드(m, g 등)라면 -> 필터링 실행
                if (filterMap[targetId]) {
                    const typeName = filterMap[targetId];
                    const selectEl = document.getElementById('quest-type-select');
                    
                    if (selectEl) {
                        selectEl.value = typeName; // 드롭다운 값 변경
                        // 필터 변경 함수 호출 (지역 목록 갱신 + 리스트 다시 그리기)
                        if (typeof onQuestTypeChange === 'function') {
                            onQuestTypeChange();
                        }
                    }
                } 
                // 2. 필터 코드가 아니라면 -> 기존처럼 퀘스트 상세 보기 실행
                else {
                    const formattedId = targetId.toLowerCase().startsWith('q') ? targetId : 'q' + targetId;
                    const foundQuest = globalData.quests.find(q => q.id === formattedId);
                    if (foundQuest) loadQuestDetail(foundQuest.filepath, formattedId);
                }
            }

            if (typeof checkEventStatus === 'function') checkEventStatus();
            loadBuildsInBackground(targetTab);
            initializeLikeSystem();
        })
        .catch(error => { console.error("데이터 로드 실패:", error); });
}

// 빌드 데이터 로드 함수 (그대로 유지)
function loadBuildsInBackground(targetTab) {
    const buildFetchUrl = (typeof BUILD_API_URL !== 'undefined')
        ? `${BUILD_API_URL}?action=list`
        : 'json/builds.json';

    fetch(buildFetchUrl)
        .then(res => res.json())
        .then(buildsData => {
            console.log("빌드 데이터 로드 완료");
            globalData.builds = buildsData.builds || [];
            // 빌드 목록은 데이터가 늦게 오므로 도착하면 그리기
            renderBuildList('all');
        })
        .catch(err => {
            globalData.builds = [];
        });
}

// [추가된 함수] 빌드 데이터만 따로 불러와서 채워넣는 역할
function loadBuildsInBackground(targetTab) {
    const buildFetchUrl = (typeof BUILD_API_URL !== 'undefined')
        ? `${BUILD_API_URL}?action=list`
        : 'json/builds.json';

    fetch(buildFetchUrl)
        .then(res => res.json())
        .then(buildsData => {
            console.log("2단계: 빌드 데이터 로드 완료");
            globalData.builds = buildsData.builds || [];

            // 만약 사용자가 이미 '빌드' 탭을 보고 있다면 화면 갱신
            if (targetTab === 'builder' || document.getElementById('view-builder').style.display === 'block') {
                renderBuildList('all');
            }
        })
        .catch(err => {
            console.warn('빌드 데이터 로드 실패', err);
            globalData.builds = [];
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
        const bgImage = quest.bgimg ? `quests/images/${quest.bgimg}` : `quests/explore/${quest.bgimg}`;

        // 1. 우선 기본 경로(images)를 설정합니다.
        const primaryPath = `quests/images/${quest.bgimg}`;
        const fallbackPath = `quests/explore/${quest.bgimg}`;

        const slideDiv = document.createElement('div');
        slideDiv.className = 'hero-slide';

        // 2. 일단 기본 경로로 배경 이미지를 입힙니다.
        slideDiv.style.backgroundImage = `url('${primaryPath}')`;

        // 3. 이미지 객체를 생성해 실제 존재 여부를 테스트합니다.
        const imgTester = new Image();
        imgTester.src = primaryPath;

        // 4. 만약 images 폴더에 이미지가 없다면(에러 발생 시) explore 폴더로 교체합니다.
        imgTester.onerror = () => {
            slideDiv.style.backgroundImage = `url('${fallbackPath}')`;
        };

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
        // itemDiv.onclick = () => { if (item.link) window.open(item.link, '_blank'); };
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

// [수정] 홈 화면 지역 정보 로드 (가로 스크롤 + URL 이동)
function loadHomeMaps() {
    const mapList = document.getElementById('home-map-list');
    if (!mapList) return;
    mapList.innerHTML = '';

    // dummyMapData를 순회하며 카드 생성
    dummyMapData.forEach(map => {
        const div = document.createElement('div');
        div.className = 'map-card-horizontal'; // 새로 만든 CSS 클래스 적용

        // ★ 클릭 시 해당 지역 URL로 이동
        // 예: 현재주소/map/?id=qinghe 로 이동합니다.
        div.onclick = () => {
            window.location.href = `map/?path=${map.key}`;
        };

        div.innerHTML = `
            <img src="${map.image}" class="map-h-img" onerror="this.src='images/logo.png'">
            <div class="map-h-title">${map.title}</div>
        `;

        mapList.appendChild(div);
    });
}

// script.js 파일의 switchTab 함수 교체

function switchTab(tabName, updateHistory = true) {
    // 1. 화면 전환 (기존 로직)
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder', 'view-map-detail', 'view-chunji', , 'view-archive'];
    views.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    const navs = ['nav-home', 'nav-quiz', 'nav-quest', 'nav-code', 'nav-builder', 'nav-more', 'nav-chunji'];
    navs.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active'); });

    document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-dropdown-content').forEach(el => { el.classList.remove('show'); });

    // 2. [최적화 핵심] 탭을 눌렀을 때, 내용이 비어있으면 그때 그리기 (Lazy Rendering)
    if (tabName === 'home') {
        document.getElementById('view-home').style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
    }
    else if (tabName === 'chunji') {
        document.getElementById('view-chunji').style.display = 'block';
        document.getElementById('nav-chunji').classList.add('active');
        // 데이터가 있는데 화면이 비어있으면 렌더링
        const container = document.getElementById('chunji-list-container');
        if (container && container.children.length === 0 && chunjiData.length > 0) {
            renderChunjiList();
        }
        showChunjiList();
    }
    else if (tabName === 'quiz') {
        document.getElementById('view-quiz').style.display = 'block';
        document.getElementById('nav-more').classList.add('active');
        const quizBtn = document.getElementById('nav-quiz');
        if (quizBtn) quizBtn.classList.add('active');

        // 렌더링 체크
        const tbody = document.getElementById('quiz-table-body');
        if (tbody && tbody.children.length === 0 && globalData.quiz.length > 0) {
            renderQuizTable(globalData.quiz);
            updateQuizCounter();
        }
    }
    else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');

        // 렌더링 체크
        const container = document.getElementById('quest-grid-container');
        if (container && container.children.length === 0 && globalData.quests.length > 0) {
            renderQuestList();
        }
        showQuestList();
    }
    else if (tabName === 'news') {
        document.getElementById('view-news').style.display = 'block';

        // 렌더링 체크
        const container = document.getElementById('full-news-list');
        if (container && container.children.length === 0 && globalData.news.length > 0) {
            renderFullNews(globalData.news);
        }
    }
    // [추가] 업적 전체보기 탭 전환
    else if (tabName === 'archive') {
        document.getElementById('view-archive').style.display = 'block';
        // 전체 목록 그리기 함수 호출
        renderFullAchievementList();
    }

    else if (tabName === 'builder') {
        document.getElementById('view-builder').style.display = 'block';
        document.getElementById('nav-more').classList.add('active');
        const builderItem = document.getElementById('nav-builder');
        if (builderItem) builderItem.classList.add('active');

        document.getElementById('tools-menu').style.display = 'block';
        document.getElementById('builder-interface').style.display = 'none';

        // 데이터 체크 및 렌더링
        if (!builderData) {
            fetch('json/builder_data.json')
                .then(res => res.json())
                .then(data => { builderData = data; renderBuildList('all'); })
                .catch(err => console.error(err));
        } else {
            const container = document.getElementById('build-list-container');
            // 로딩 문구만 있거나 비어있으면 렌더링
            if (container && (container.children.length === 0 || container.innerText.includes('불러오는 중'))) {
                renderBuildList('all');
            }
        }

        if (new URLSearchParams(window.location.search).get('b')) {
            openBuilderInterface();
            loadViewer();
        }
    }
    else if (tabName === 'guide' || tabName === 'code') {
        // 가이드는 기존 로직 유지 (이미 동적 로딩임)
        const guideView = document.getElementById('view-guide');
        if (guideView) {
            guideView.style.display = 'block';
            if (!isGuideLoaded) {
                loadGuideView();
            } else {
                const newsBtn = findButtonByFile('news.html');
                if (newsBtn) loadGuideContent('news.html', newsBtn);
            }
        }
        document.getElementById('nav-code').classList.add('active');
    }

    // 3. URL 업데이트
    if (updateHistory) {
        // 가이드는 내부에서 처리하므로 제외
        if (tabName !== 'guide' && tabName !== 'code') {
            updateUrlQuery(tabName);
        }
    }
}

// [수정] URL 파라미터 관리 함수 (r 파라미터 초기화 포함)
function updateUrlQuery(tab, id) {
    const url = new URL(window.location);
    // 모든 파라미터 초기화
    url.searchParams.delete('tab');
    url.searchParams.delete('id');
    url.searchParams.delete('q');
    url.searchParams.delete('g');
    url.searchParams.delete('c');
    url.searchParams.delete('cp');
    url.searchParams.delete('qp');

    // ▼▼▼ [추가] 보스 상세(r), 빌더(b) 파라미터도 초기화 ▼▼▼
    url.searchParams.delete('r');
    url.searchParams.delete('b');
    // ▲▲▲ 추가 끝 ▲▲▲

    if (tab === 'quest') {
        if (id) {
            url.searchParams.set('q', id.toLowerCase().replace('q', ''));
        } else {
            url.searchParams.set('tab', 'quest');
            if (currentPage > 1) {
                url.searchParams.set('qp', currentPage);
            }
        }
    }
    else if (tab === 'guide' && id) {
        url.searchParams.set('g', id);
        // 여기서 r 파라미터는 설정하지 않습니다. (목록으로 돌아갈 때 r을 지우기 위함)
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
// [수정] 가이드 콘텐츠 로드 함수 (r 파라미터 보존 로직 추가)
function loadGuideContent(filename, btnElement) {
    const innerContainer = document.getElementById('guide-dynamic-content');
    if (!innerContainer) return;

    // ★ [핵심 1] 주소가 바뀌기 전에 r 파라미터를 미리 가져옵니다!
    const currentParams = new URLSearchParams(window.location.search);
    const savedRaidId = currentParams.get('r');

    const foundId = Object.keys(GUIDE_MAP).find(key => GUIDE_MAP[key] === filename);

    // 여기서 updateUrlQuery가 실행되면서 주소창의 ?r=... 이 지워집니다.
    if (foundId) updateUrlQuery('guide', foundId);

    if (btnElement) {
        document.querySelectorAll('#view-guide .guide-item-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const codeView = document.querySelector('.code-page-container');
    if (codeView) codeView.style.display = 'none';

    innerContainer.style.display = 'block';

    if (filename !== 'boss.html') {
        innerContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#888;">비급을 펼치는 중...</div>';
    }

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

            // ★ [핵심 2] 아까 저장해둔 savedRaidId를 사용합니다.
            if (filename === 'boss.html' && savedRaidId) {
                // 1) 지워진 주소를 다시 복구 (보기 좋게)
                const newUrl = '?g=boss&r=' + savedRaidId;
                window.history.replaceState({ path: newUrl }, '', newUrl);

                // 2) 상세 페이지 로드
                setTimeout(() => {
                    loadContent('boss/' + savedRaidId + '.html');
                }, 50);
            }
        })
        .catch(err => {
            innerContainer.innerHTML = `<div style="text-align:center; padding:50px; color:#b71c1c;">내용을 불러올 수 없습니다.<br></div>`;
        });
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
    'majang': 'majang.html', 'code': 'code.html', 'moon': 'moon.html', 'b1': 'boss/b1.html', 'b2': 'boss/b2.html', 'b3': 'boss/b3.html', 'b4': 'boss/b4.html', 'b5': 'boss/b5.html',
    'w1': 'world1.html', 'nb': 'newb.html', 'wp': 'guide/weapon.html', 'up': 'guide/up.html', 'w2': 'world2.html',
    'outfit1': 'outfit/outfit1.html',
    'outfit2': 'outfit/outfit2.html',
    'outfit3': 'outfit/outfit3.html',
    'outfit4': 'outfit/outfit4.html',
    'outfit5': 'outfit/outfit5.html',
    'outfit6': 'outfit/outfit6.html',
    'outfit7': 'outfit/outfit7.html',
    'outfit8': 'outfit/outfit8.html',
    'outfit9': 'outfit/outfit9.html',
    'outfit10': 'outfit/outfit10.html',
    'outfit11': 'outfit/outfit11.html',
    'outfit12': 'outfit/outfit12.html',
    'outfit13': 'outfit/outfit13.html',
    'outfit14': 'outfit/outfit14.html',
    'outfit15': 'outfit/outfit15.html',
    'outfit16': 'outfit/outfit16.html',
    'outfit17': 'outfit/outfit17.html',
    'outfit18': 'outfit/outfit18.html',
    'outfit19': 'outfit/outfit19.html',
    'outfit20': 'outfit/outfit20.html',
    'outfit21': 'outfit/outfit21.html',
    'ar1':'arena/g1.html'
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
        quizLocalSearch.addEventListener("focus", () => { if (statusBar) statusBar.classList.add("hidden"); });
        quizLocalSearch.addEventListener("blur", () => { if (statusBar) statusBar.classList.remove("hidden"); });
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
    if (localInput) { localInput.value = keyword; renderQuizTable(filterQuizData(keyword), keyword); }
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
        const rankParts = sortedUsers.map((u, i) => i === 0 ? `<span class="rainbow-text">${i + 1}위 ${u[0]}(${u[1]})</span>` : `<span style="color: #888;">${i + 1}위 ${u[0]}(${u[1]})</span>`);
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
    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';
    if (contentBox) contentBox.innerHTML = '<div style="text-align:center; padding:50px;">로딩 중...</div>';
    fetch(filepath).then(res => res.text()).then(html => {
        if (contentBox) contentBox.innerHTML = html;
        window.scrollTo(0, 0);


        fetchLikeStatus(id);


    });
}
function showQuestList() {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');

    // 이미 다 그려져 있으므로 보여주기만 하면 됨
    if (listView && detailView) {
        listView.style.display = 'block';
        detailView.style.display = 'none';
    }
    updateUrlQuery('quest');
}

function showChunjiList() {
    const listView = document.getElementById('chunji-list-view');
    const detailView = document.getElementById('chunji-detail-view');

    // 이미 다 그려져 있으므로 보여주기만 하면 됨
    if (listView && detailView) {
        listView.style.display = 'block';
        detailView.style.display = 'none';
    }
    updateUrlQuery('chunji');
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
    div.onclick = function () { this.classList.toggle('active'); };
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
        fetch('json/builder_data.json').then(res => res.json()).then(data => {
            builderData = data;
            renderComboSlots();

        });
    } else {
        renderComboSlots();
    }
}

function closeBuilderInterface() {
    document.getElementById('builder-interface').style.display = 'none';
    document.getElementById('tools-menu').style.display = 'block';
}


// [수정] 모달 열기 (비결 리스트 표시 기능 추가)
function openBuilderModal(type, index) {
    if (!builderData) return alert("데이터를 불러오는 중입니다...");
    currentSlot = { type, index };

    const modal = document.getElementById('builder-modal');
    const list = document.getElementById('builder-modal-list');
    const title = document.getElementById('builder-modal-title');

    list.innerHTML = '';

    // 취소 버튼
    const closeDiv = document.createElement('div');
    closeDiv.className = 'select-item';
    closeDiv.innerHTML = '<div style="width:48px;height:48px;background:#eee;line-height:48px;margin:0 auto;font-weight:bold;color:#888;">✕</div><p>취소</p>';
    closeDiv.onclick = () => closeBuilderModal(null);
    list.appendChild(closeDiv);

    // ★ 콤보 선택일 때
    if (type === 'combo') {
        title.innerText = `콤보 ${parseInt(index) + 1}단계 선택`;

        // 1) 기본 조작키
        Object.keys(KEY_MAP).forEach(key => {
            const k = KEY_MAP[key];
            const div = document.createElement('div');
            div.className = 'select-item';
            div.innerHTML = `<div class="key-cap ${k.color} ${k.hold ? 'hold' : ''}" style="margin:0 auto;"><span>${k.text}</span></div><p>${k.desc}</p>`;
            div.onclick = () => selectBuilderItem(key, null, k.desc);
            list.appendChild(div);
        });

        // 2) 장착한 비결 리스트 (여기가 중요!)
        const activeMarts = currentBuild.marts.filter(id => id);
        if (activeMarts.length > 0) {
            const sep = document.createElement('div');
            sep.style.cssText = "width:100%; border-top:1px dashed #ddd; margin:10px 0; grid-column: 1 / -1; text-align:center; font-size:0.8em; color:#999; padding-top:5px;";
            sep.innerText = "▼ 장착한 비결 ▼";
            list.appendChild(sep);

            activeMarts.forEach(id => {
                const item = builderData.marts.find(m => m.id === id);
                if (item) {
                    const div = document.createElement('div');
                    div.className = 'select-item';
                    div.innerHTML = `<img src="${item.img}" onerror="this.src='images/logo.png'"><p>${item.name}</p>`;
                    div.onclick = () => selectBuilderItem(item.id, item.img, item.name);
                    list.appendChild(div);
                }
            });
        }
    }
    // ★ 일반 아이템 선택일 때 (기존 유지)
    else {
        title.innerText = `${type === 'weapons' ? '무기' : type === 'hearts' ? '심법' : '비결'} 선택`;
        const currentList = currentBuild[type];
        const usedIds = currentList.filter((id, idx) => id !== null && idx !== parseInt(index));
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
    }
    modal.style.display = 'flex';
}

// [수정] 아이템 선택 처리 (콤보 배열 push 기능 추가)
function selectBuilderItem(itemId, imgSrc, itemName) {
    const { type, index } = currentSlot;

    // ★ 콤보인 경우
    if (type === 'combo') {
        // 인덱스가 현재 길이와 같으면 '추가' (push)
        if (index === currentBuild.combo.length) {
            currentBuild.combo.push(itemId);
        } else {
            // 아니면 '수정'
            currentBuild.combo[index] = itemId;
        }
        renderComboSlots();
        closeBuilderModal(null);
        return;
    }


    // ★ 일반 아이템인 경우 (기존 로직)
    currentBuild[type][index] = itemId;
    const imgEl = document.getElementById(`slot-${type}-${index}`);
    const nameEl = document.getElementById(`name-${type}-${index}`);
    const slotEl = imgEl.parentElement;
    const plusSpan = slotEl.querySelector('span');

    if (itemId) {
        imgEl.src = imgSrc;
        imgEl.style.display = 'block';
        if (plusSpan) plusSpan.style.display = 'none';
        slotEl.style.borderStyle = 'solid';
        if (nameEl) nameEl.innerText = itemName;
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
        if (plusSpan) plusSpan.style.display = 'block';
        slotEl.style.borderStyle = 'dashed';
        if (nameEl) nameEl.innerText = '';
    }
    closeBuilderModal(null);
}


function closeBuilderModal(e) {
    if (e === null || e.target.classList.contains('modal-overlay')) {
        document.getElementById('builder-modal').style.display = 'none';
    }
}
// 1. 링크 생성 함수 (닉네임 ID 변경 적용)
// [수정] 링크 생성 함수 (추천 장비 정보 포함)

/* [수정] 링크 생성 함수 (빌드 제목, 추천 장비 포함) */
function generateBuildUrl() {
    // 1. 입력된 정보 가져오기
    const title = document.getElementById('build-title').value.trim(); // [추가] 빌드 이름
    const creatorName = document.getElementById('build-creator').value.trim();
    const recWeapons = document.getElementById('rec-weapons').value.trim();
    const recArmor = document.getElementById('rec-armor').value.trim();

    // 2. 제목이 없으면 경고
    if (!title) {
        alert("빌드 이름을 입력해주세요!");
        document.getElementById('build-title').focus();
        return;
    }

    // 3. 데이터 객체 생성 (t: 제목 추가)
    const buildData = {
        t: title,
        c: creatorName,
        w: currentBuild.weapons,
        h: currentBuild.hearts,
        m: currentBuild.marts,
        rw: recWeapons,
        ra: recArmor,
        k: currentBuild.combo // [수정] 콤보 배열 저장
    };

    // 4. 인코딩 및 URL 생성
    const encodedString = btoa(unescape(encodeURIComponent(JSON.stringify(buildData))));
    const origin = window.location.origin;
    let basePath = window.location.pathname.replace('index.html', '');
    if (!basePath.endsWith('/')) basePath += '/';

    const viewerUrl = `${origin}${basePath}viewer.html?b=${encodedString}`;

    // 5. 결과창 표시
    const urlInput = document.getElementById('result-url');
    urlInput.value = viewerUrl;
    urlInput.style.display = 'block';

    // 알림 (선택 사항)
    // alert("링크가 생성되었습니다. 복사해서 사용하세요!");
}

/* [수정] 뷰어 로드 함수 (제목/작성자/장비 표시 로직 추가) */
/* [수정] 뷰어 로드 함수 (추천 장비 복구 + 팝업 연결) */
function loadViewer() {
    if (!builderData) {
        fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; loadViewer(); });
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('b');
    let w = [], h = [], m = [], title = "무제", creator = "익명", rw = "", ra = "";

    if (encodedData) {
        try {
            const decoded = decodeURIComponent(escape(atob(encodedData)));
            const parsed = JSON.parse(decoded);
            w = parsed.w || []; h = parsed.h || []; m = parsed.m || [];
            title = parsed.t || "무제"; creator = parsed.c || "익명";
            rw = parsed.rw || ""; ra = parsed.ra || "";
        } catch (e) {
            try { const parsed = JSON.parse(atob(encodedData)); w = parsed.w || []; h = parsed.h || []; m = parsed.m || []; creator = parsed.c || ""; } catch (e2) { }
        }
    }

    // 텍스트 정보 표시
    const titleEl = document.getElementById('build-main-title');
    const creatorEl = document.getElementById('build-creator-info');
    if (titleEl) titleEl.innerText = title;
    if (creatorEl) creatorEl.innerText = "작성자: " + creator;

    // [복구됨] 추천 장비 표시
    const rwEl = document.getElementById('view-rec-weapon');
    const raEl = document.getElementById('view-rec-armor');
    const recContainer = document.getElementById('viewer-rec-container');
    if (rw || ra) {
        if (recContainer) recContainer.style.display = 'flex';
        if (rwEl) rwEl.innerText = rw || '-';
        if (raEl) raEl.innerText = ra || '-';
    } else {
        if (recContainer) recContainer.style.display = 'none';
    }

    // 아이콘 슬롯 렌더링 + 클릭 이벤트 연결
    const renderSlot = (type, ids, prefix) => {
        ids.forEach((id, idx) => {
            if (!id) return;
            const itemData = builderData[type].find(i => i.id === id);
            if (itemData) {
                const slotEl = document.getElementById(`${prefix}-${type}-${idx}`);
                if (slotEl) {
                    const img = slotEl.querySelector('img');
                    if (img) { img.src = itemData.img; img.style.display = 'block'; }

                    // 클릭하면 정보창 열기
                    slotEl.style.cursor = "pointer";
                    slotEl.onclick = () => openInfoModal(itemData);
                }
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
        container.innerHTML = '<div style="padding:30px; text-align:center; color:#666;">불러오는 중...</div>';
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
    if (btn) btn.classList.add('active');
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
// [script.js] /* [수정] 빌드 상세 바텀시트 (아이콘 클릭 시 팝업 연결) */
// [상수 정의] 키 매핑 정보 (함수 밖에 두거나 openBuildDetailSheet 안에 둬도 됨)


/* [수정] 빌드 상세 바텀시트 (콤보 기능 추가) */
/* [수정] 빌드 상세 뷰어 (정사각형 + 번호 오버레이) */
function openBuildDetailSheet(build) {
    const sheet = document.getElementById('build-detail-sheet');
    const contentArea = sheet.querySelector('.sheet-content');

    // 1. 데이터 디코딩
    let encodedData = null;
    if (build.link && build.link.includes('?b=')) encodedData = build.link.split('?b=')[1];

    if (!encodedData || !builderData) {
        contentArea.innerHTML = `<div style="padding: 50px; text-align: center;">🚨 정보를 불러올 수 없습니다.</div>`;
        openBuildDetailSheetView(); return;
    }

    let parsedData = null;
    try {
        const decoded = decodeURIComponent(escape(atob(encodedData.replace(/ /g, '+'))));
        parsedData = JSON.parse(decoded);
    } catch (e) {
        try { parsedData = JSON.parse(atob(encodedData)); } catch (e2) { contentArea.innerHTML = "데이터 오류"; return; }
    }

    // 아이템 정보 찾기 헬퍼
    const getItemDetail = (type, id) => builderData[type] ? builderData[type].find(i => i.id === id) || { name: '?', img: '' } : { name: '?', img: '' };

    // 2. 설명문
    let html = `<div style="border-bottom: 1px dashed #ccc; padding-bottom: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #555; font-size: 0.95em; line-height:1.6; font-family: 'Noto Serif KR', serif;">${build.description || '작성된 설명이 없습니다.'}</p>
                </div>`;

    // 3. 추천 장비
    if (parsedData.rw || parsedData.ra) {
        html += `<div style="background: #fffcf5; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.95em; color: #444; border-left: 3px solid #d4af37; padding-left: 8px;">⚔️ 추천 장비</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="background: #fff; padding: 10px; border: 1px solid #eee; border-radius: 4px; text-align: center;">
                    <span style="display:block; font-size:0.8em; color:#999; margin-bottom:4px;">무기</span>
                    <span style="color: #333; font-weight: bold;">${parsedData.rw || '-'}</span>
                </div>
                <div style="background: #fff; padding: 10px; border: 1px solid #eee; border-radius: 4px; text-align: center;">
                    <span style="display:block; font-size:0.8em; color:#999; margin-bottom:4px;">방어구</span>
                    <span style="color: #333; font-weight: bold;">${parsedData.ra || '-'}</span>
                </div>
            </div>
        </div>`;
    }

    // 4. 무기 & 심법 아이콘 섹션
    html += `<div style="display: flex; justify-content: space-evenly; align-items: center; gap: 10px; padding: 15px 10px; background: #fffcf5; border-radius: 12px; border: 1px solid #e0e0e0; margin-bottom: 15px;">`;

    html += `<div style="display: flex; gap: 8px;">`;
    (parsedData.w || [null, null]).forEach(id => {
        if (!id) return;
        const item = getItemDetail('weapons', id);
        html += `<div onclick="openInfoModalById('weapons', '${id}')" style="cursor: pointer; width: 55px; height: 55px; background: #fff; border-radius: 50%; border: 2px solid #d32f2f; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
                 </div>`;
    });
    html += `</div>`;

    html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">`;
    (parsedData.h || [null, null, null, null]).forEach(id => {
        if (!id) return;
        const item = getItemDetail('hearts', id);
        html += `<div onclick="openInfoModalById('hearts', '${id}')" style="cursor: pointer; width: 34px; height: 34px; background: #fff; border-radius: 50%; border: 1.5px solid #1976d2; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
                 </div>`;
    });
    html += `</div></div>`;

    // 5. 비결 아이콘 섹션
    const validMarts = (parsedData.m || []).filter(id => id);
    if (validMarts.length > 0) {
        html += `<div style="padding: 15px 10px; background: #fffcf5; border-radius: 12px; border: 1px solid #e0e0e0; display: flex; justify-content: center; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: repeat(4, auto); gap: 8px;">`;
        validMarts.forEach(id => {
            const item = getItemDetail('marts', id);
            html += `<div onclick="openInfoModalById('marts', '${id}')" style="cursor: pointer; width: 34px; height: 34px; background: #fff; border-radius: 50%; border: 1.5px solid #fbc02d; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/logo.png'">
                     </div>`;
        });
        html += `</div></div>`;
    }

    // 6. ★★★ [콤보 섹션 수정] 정사각형 그리드 + 번호 오버레이 ★★★
    const comboData = parsedData.k || [];
    if (comboData && comboData.length > 0) {
        html += `<h4 style="margin: 25px 0 10px 0; font-size: 0.95em; color: #444; border-left: 3px solid #d4af37; padding-left: 8px;">🔥 추천 콤보</h4>`;

        // 화살표 없이 깔끔한 그리드 컨테이너
        html += `<div class="combo-viewer-grid">`;

        comboData.forEach((key, index) => {
            // 박스 시작
            html += `<div class="combo-item-box">`;

            // ★ 번호를 박스 안으로 넣음 (Overlay)
            html += `<span class="combo-step-num">${index + 1}</span>`;

            if (KEY_MAP[key]) {
                const k = KEY_MAP[key];
                // 키캡 (배경색 꽉 채우기)
                html += `<div class="key-cap-viewer ${k.color} ${k.hold ? 'hold' : ''}"><span>${k.text}</span></div>`;
            } else {
                let item = builderData.marts ? builderData.marts.find(m => m.id === key) : null;
                if (!item && builderData.weapons) item = builderData.weapons.find(w => w.id === key);

                if (item) {
                    html += `<img src="${item.img}" class="combo-mart-img" onclick="openInfoModalById('marts', '${key}')" onerror="this.src='images/logo.png'">`;
                } else {
                    html += `<span style="font-size:0.8em; color:#999;">?</span>`;
                }
            }
            html += `</div>`; // 박스 끝
        });

        html += `</div>`; // 그리드 끝
    }

    // 7. 하단 버튼
    html += `<div style="margin-top: 30px; margin-bottom: 20px; text-align: center;">
                <button onclick="copyToClipboard('${build.link}', this)" 
                        style="width: 100%; padding: 12px; background-color: #333; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-family: 'Noto Serif KR', serif;">
                    🔗 이 빌드 링크 복사
                </button>
            </div>`;

    document.getElementById('build-sheet-title').innerText = build.title;
    contentArea.innerHTML = html;
    openBuildDetailSheetView();
}


function openBuildDetailSheetView() { document.body.classList.add('build-sheet-open'); }
/* [추가] 시트 열고 닫기 강제 제어 (PC 버그 수정용) */

// 1. 닫기 기능 (확실하게 숨김)
function closeBuildDetailSheet(event) {
    if (event) event.stopPropagation();
    const sheet = document.getElementById('build-detail-sheet');
    const overlay = document.getElementById('build-detail-overlay');

    if (sheet) {
        sheet.style.display = 'none'; // 강제로 숨김
        sheet.classList.remove('active'); // 애니메이션 클래스 제거
    }
    if (overlay) {
        overlay.style.display = 'none'; // 배경 어두운 것도 숨김
        overlay.style.opacity = '0';
    }
}

// 2. 열기 기능 보강 (기존 openBuildDetailSheetView 덮어쓰기 or 보조)
// 기존 함수가 있다면 덮어씌워지고, 없다면 새로 작동합니다.
const originalOpenView = typeof openBuildDetailSheetView !== 'undefined' ? openBuildDetailSheetView : null;

openBuildDetailSheetView = function () {
    const sheet = document.getElementById('build-detail-sheet');
    const overlay = document.getElementById('build-detail-overlay');

    if (sheet) {
        sheet.style.display = 'flex'; // ★ 핵심: PC에서 보이게 강제 설정
        sheet.style.flexDirection = 'column';

        // 약간의 딜레이 후 애니메이션 효과 (모바일용)
        setTimeout(() => {
            sheet.classList.add('active');
        }, 10);
    }

    if (overlay) {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }

    // 원래 있던 로직이 있다면 실행
    if (originalOpenView) originalOpenView();
};
// 13. 지도 상세 뷰 기능
function openMapDetail(mapName, mapKey) {
    // 다른 뷰 숨기기
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder', 'view-map-detail', 'view-chunji'];
    views.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    const mapDiv = document.getElementById('view-map-detail');
    if (mapDiv) {
        mapDiv.style.display = 'block';
        document.getElementById('map-detail-title').innerText = mapName;

        // ★ [핵심 변경] 우리가 만든 map 폴더의 index.html을 불러옵니다.
        // 주소 형식: map/?id=키값 (예: map/?id=qinghe)
        const targetUrl = `map/?id=${mapKey}`;

        const iframe = document.getElementById('map-iframe');
        // 불필요한 리로딩 방지 (이미 같은 주소면 새로고침 안 함)
        if (iframe && !iframe.src.includes(targetUrl)) {
            iframe.src = targetUrl;
        }
    }
    window.scrollTo(0, 0);
}

function closeMapDetail() {
    const mapDiv = document.getElementById('view-map-detail');
    if (mapDiv) mapDiv.style.display = 'none';
    const iframe = document.getElementById('map-iframe');
    if (iframe) iframe.src = 'about:blank';
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
window.addEventListener('click', function (event) {
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
    const listView = document.getElementById('chunji-list-view');
    const detailView = document.getElementById('chunji-detail-view');

    // ★ [핵심 추가] 천지록 목록도 비어있으면 그리기
    const container = document.getElementById('chunji-list-container');
    if (container && container.children.length === 0) {
        renderChunjiList();
    }

    if (listView && detailView) {
        listView.style.display = 'block';
        detailView.style.display = 'none';
    }

    // URL 정리
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

    if (reportTab) reportTab.style.display = (tabName === 'report') ? 'block' : 'none';
    if (giftTab) giftTab.style.display = (tabName === 'gift') ? 'block' : 'none';

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

    if (statusTab) statusTab.style.display = (tabName === 'status') ? 'block' : 'none';
    if (cheerTab) cheerTab.style.display = (tabName === 'cheer') ? 'block' : 'none';

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

// ▼▼▼ script.js 맨 아래에 추가하세요 ▼▼▼

// [추가] SPA 콘텐츠 로드 함수 (보스 상세 페이지 이동용)
function loadContent(url) {
    // 1. 콘텐츠를 넣을 컨테이너 찾기
    // (우선순위: 가이드 내용 영역 -> 보스 전용 영역 -> 메인 콘텐츠 영역)
    const container = document.getElementById('guide-dynamic-content') ||
        document.getElementById('view-boss') ||
        document.querySelector('.boss-page-container')?.parentElement;

    if (!container) {
        console.error("콘텐츠를 표시할 영역을 찾을 수 없습니다.");
        return;
    }

    // 로딩 표시
    container.style.opacity = '0.5';

    // 2. HTML 파일 불러오기
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('페이지를 찾을 수 없습니다.');
            return response.text();
        })
        .then(html => {
            // 내용 교체
            container.innerHTML = html;
            container.style.opacity = '1';

            // 화면 맨 위로 스크롤
            window.scrollTo(0, 0);
        })
        .catch(error => {
            console.error('로딩 실패:', error);
            container.innerHTML = `<div style="text-align:center; padding:50px;">페이지를 불러올 수 없습니다.<br>(${url})</div>`;
            container.style.opacity = '1';
        });
}
// ▼▼▼ script.js 맨 아래에 추가하세요 ▼▼▼

// [추가] 보스 상세 페이지 탭 전환 기능
function openBossTab(tabName, btnElement) {
    // 1. 현재 페이지 내의 모든 탭 내용 숨기기
    // (범위를 document 전체가 아닌, 버튼이 있는 컨테이너 주변으로 한정하면 더 안전하지만, 지금은 전체로 해도 무방합니다)
    const container = btnElement.closest('.quest-detail-container') || document;

    container.querySelectorAll('.boss-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 2. 모든 탭 버튼 비활성화
    container.querySelectorAll('.boss-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 3. 선택한 탭 활성화
    const targetTab = container.querySelector('#tab-' + tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    btnElement.classList.add('active');
}
// ▼▼▼ script.js 맨 아래에 추가하세요 ▼▼▼

// [추가] 보스 페이지 필터링 기능 (드롭다운)
function filterBoss(selectElement) {
    // 1. 드롭다운 요소 찾기 (이벤트로 넘어온 요소가 없으면 ID로 찾음)
    const select = selectElement || document.getElementById('boss-filter-select');
    if (!select) return;

    const type = select.value;

    // 2. 보스 그리드 찾기
    const grid = document.getElementById('bossGrid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.boss-card');

    // 3. 필터링 로직 수행
    cards.forEach(card => {
        const cardType = card.getAttribute('data-type');

        // 'all'이거나 타입이 일치하면 보여줌
        if (type === 'all' || cardType === type) {
            card.style.display = 'block';
            // 깜빡이는 애니메이션 효과 재실행
            card.style.animation = 'none';
            card.offsetHeight; /* 리플로우 강제 트리거 */
            card.style.animation = 'fadeIn 0.4s ease-in-out';
        } else {
            card.style.display = 'none';
        }
    });
}
// ▼▼▼ script.js 맨 아래에 수정하여 덮어쓰기 ▼▼▼

// [수정] 보스 상세 페이지 이동 (?g=boss&r=ID)
function goBoss(id) {
    // 1. 주소창 URL 변경 (기존 ?g=boss 유지하면서 &r=id 추가)
    const newUrl = '?g=boss&r=' + id;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // 2. 내용 로드 (깜빡임 없이)
    loadContent('boss/' + id + '.html');
}

// [수정] 보스 목록으로 돌아가기 (?g=boss)
function goBossList() {
    // 1. URL에서 파라미터 제거 (?g=boss 상태로 복귀)
    const newUrl = '?g=boss';
    window.history.pushState({ path: newUrl }, '', newUrl);

    // 2. 보스 목록(boss.html) 다시 로드
    // loadContent는 단순히 파일 내용을 innerHTML로 넣는 함수이므로 boss.html을 다시 부르면 됨
    loadContent('boss.html');
}

/* [추가] 상세 정보 모달 열기 */
function openInfoModal(item) {
    const modal = document.getElementById('info-modal');
    const img = document.getElementById('modal-img');
    const name = document.getElementById('modal-name');
    const desc = document.getElementById('modal-desc');

    if (modal) {
        if (img) img.src = item.img || 'images/logo.png';
        if (name) name.innerText = item.name;
        // 설명이 있으면 설명, 없으면 획득처, 둘 다 없으면 기본 메시지
        if (desc) desc.innerHTML = item.desc || item.acquire || "상세 정보가 없습니다.";

        modal.style.display = 'flex';
    }
}

/* [추가] 상세 정보 모달 닫기 */
function closeInfoModal() {
    const modal = document.getElementById('info-modal');
    if (modal) modal.style.display = 'none';
}
/* [추가] ID로 아이템을 찾아 상세 정보 모달을 여는 함수 (바텀시트용) */
function openInfoModalById(type, id) {
    if (!builderData || !builderData[type]) return;
    const item = builderData[type].find(i => i.id === id);
    if (item) openInfoModal(item);
}


/* =========================================
   [신규] 콤보 슬롯 시스템 (모달 선택 방식)
   ========================================= */



// 3. [중요] 모달 열기 함수 수정 (기존 openBuilderModal 함수를 덮어쓰세요)
function openBuilderModal(type, index) {
    if (!builderData) return alert("데이터를 불러오는 중입니다...");
    currentSlot = { type, index }; // 현재 선택한 슬롯 저장

    const modal = document.getElementById('builder-modal');
    const list = document.getElementById('builder-modal-list');
    const title = document.getElementById('builder-modal-title');

    list.innerHTML = '';

    // [해제] 버튼 추가
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'select-item';
    emptyDiv.innerHTML = '<div style="width:48px;height:48px;background:#eee;line-height:48px;margin:0 auto;font-weight:bold;color:#888;">X</div><p>해제</p>';
    emptyDiv.onclick = () => selectBuilderItem(null, '', '');
    list.appendChild(emptyDiv);

    // ★ 콤보 선택 모달일 경우
    if (type === 'combo') {
        title.innerText = `콤보 ${parseInt(index) + 1}단계 선택`;

        // 1) 기본 조작키 추가
        Object.keys(KEY_MAP).forEach(key => {
            const k = KEY_MAP[key];
            const div = document.createElement('div');
            div.className = 'select-item';
            // 키캡 모양 미리보기
            div.innerHTML = `
                <div class="key-cap ${k.color} ${k.hold ? 'hold' : ''}" style="margin:0 auto;"><span>${k.text}</span></div>
                <p>${k.desc}</p>
            `;
            div.onclick = () => selectBuilderItem(key, null, k.desc); // 이미지는 없음
            list.appendChild(div);
        });

        // 2) 장착한 비결 추가 (현재 슬롯에 장착된 비결만)
        const activeMarts = currentBuild.marts.filter(id => id);
        if (activeMarts.length > 0) {
            // 구분선
            const sep = document.createElement('div');
            sep.style.cssText = "width:100%; border-top:1px dashed #ddd; margin:10px 0; grid-column: 1 / -1; text-align:center; font-size:0.8em; color:#999; padding-top:5px;";
            sep.innerText = "▼ 장착한 비결 ▼";
            list.appendChild(sep);

            activeMarts.forEach(id => {
                const item = builderData.marts.find(m => m.id === id);
                if (item) {
                    const div = document.createElement('div');
                    div.className = 'select-item';
                    div.innerHTML = `<img src="${item.img}" onerror="this.src='images/logo.png'"><p>${item.name}</p>`;
                    div.onclick = () => selectBuilderItem(item.id, item.img, item.name);
                    list.appendChild(div);
                }
            });
        }
    }
    // ★ 기존 아이템(무기/심법/비결) 선택 모달일 경우
    else {
        title.innerText = `${type === 'weapons' ? '무기' : type === 'hearts' ? '심법' : '비결'} 선택`;
        const currentList = currentBuild[type];
        const usedIds = currentList.filter((id, idx) => id !== null && idx !== parseInt(index));

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
    }

    modal.style.display = 'flex';
}

// 4. [중요] 아이템 선택 처리 함수 수정 (기존 selectBuilderItem 덮어쓰기)
function selectBuilderItem(itemId, imgSrc, itemName) {
    const { type, index } = currentSlot;

    // 데이터 저장
    currentBuild[type][index] = itemId;

    // ★ 콤보 타입인 경우 렌더링 다시 하고 종료 (DOM 구조가 달라서 별도 처리)
    if (type === 'combo') {
        renderComboSlots();
        closeBuilderModal(null);
        return;
    }

    // 기존 슬롯(무기/심법/비결) 처리 로직
    const imgEl = document.getElementById(`slot-${type}-${index}`);
    const nameEl = document.getElementById(`name-${type}-${index}`);
    const slotEl = imgEl.parentElement;
    const plusSpan = slotEl.querySelector('span');

    if (itemId) {
        imgEl.src = imgSrc;
        imgEl.style.display = 'block';
        if (plusSpan) plusSpan.style.display = 'none';
        slotEl.style.borderStyle = 'solid';
        if (nameEl) nameEl.innerText = itemName;
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
        if (plusSpan) plusSpan.style.display = 'block';
        slotEl.style.borderStyle = 'dashed';
        if (nameEl) nameEl.innerText = '';
    }

    closeBuilderModal(null);
}


/* =========================================
   [업데이트] 콤보 시스템 (+버튼, 삭제, 비결연동)
   ========================================= */

// 1. 콤보 슬롯 렌더링


function removeComboStep(event, index) {
    event.stopPropagation(); // 모달 열림 방지
    currentBuild.combo.splice(index, 1); // 배열에서 삭제
    renderComboSlots(); // 다시 그리기
}

/* [수정] 콤보 슬롯 렌더링 (+버튼 포함 버전) */
// 1. 콤보 슬롯 렌더링 (수정됨: + 버튼 그리기 로직 추가)
function renderComboSlots() {
    const container = document.getElementById('combo-slot-container');
    if (!container) return;
    container.innerHTML = '';

    // A. 현재 입력된 콤보들 그리기
    currentBuild.combo.forEach((val, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'slot-wrapper';
        wrapper.style.position = 'relative';

        let contentHtml = '';
        let borderStyle = 'solid';

        if (val) {
            // 키(Key)인지 확인
            if (typeof KEY_MAP !== 'undefined' && KEY_MAP[val]) {
                const k = KEY_MAP[val];
                contentHtml = `<div class="key-cap ${k.color} ${k.hold ? 'hold' : ''}" style="width:100%; height:100%; border-radius:4px; box-shadow:none; font-size:0.9em;"><span>${k.text}</span></div>`;
            }
            // 아니면 아이템(비결)으로 간주
            else {
                let item = null;
                if (builderData) {
                    item = builderData.marts ? builderData.marts.find(m => m.id === val) : null;
                    if (!item && builderData.weapons) item = builderData.weapons.find(w => w.id === val);
                }

                if (item) contentHtml = `<img src="${item.img}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
                else contentHtml = `<div style="font-size:0.7em; word-break:break-all;">${val}</div>`;
            }
        }

        wrapper.innerHTML = `
            <div class="item-slot" onclick="openBuilderModal('combo', ${index})" style="border-style: ${borderStyle}; padding:0; overflow:visible; cursor:pointer;">
                ${contentHtml}
                <div class="combo-remove-overlay" onclick="removeComboStep(event, ${index})" style="position:absolute; top:-5px; right:-5px; width:18px; height:18px; background:#d32f2f; color:white; border-radius:50%; font-size:12px; display:flex; align-items:center; justify-content:center; z-index:10;">✕</div>
            </div>
            <div class="slot-name" style="font-size:0.7em; margin-top:2px; color:#999;">${index + 1}</div>
        `;
        container.appendChild(wrapper);
    });

    // ▼▼▼ [이 부분이 빠져 있어서 안 나왔던 겁니다!] ▼▼▼
    // B. 마지막에 [+] 버튼 추가 (최대 20개까지만)
    if (currentBuild.combo.length < 20) {
        const addWrapper = document.createElement('div');
        addWrapper.className = 'slot-wrapper';
        addWrapper.innerHTML = `
            <div class="item-slot" onclick="addComboStep()" style="border-style: dashed; border-color:#ccc; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                <div class="combo-add-btn" style="font-size:24px; color:#aaa;">+</div>
            </div>
            <div class="slot-name" style="font-size:0.7em; margin-top:2px; color:#ccc;">추가</div>
        `;
        container.appendChild(addWrapper);
    }
}

/* [수정] 콤보 초기화 (빈 배열로 초기화) */
function resetComboSlots() {
    currentBuild.combo = []; // 12칸이 아니라 빈 배열로!
    renderComboSlots();
}

/* [추가] 콤보 추가/삭제 함수 (없으면 추가하세요) */
function addComboStep() { openBuilderModal('combo', currentBuild.combo.length); }
function removeComboStep(e, idx) { e.stopPropagation(); currentBuild.combo.splice(idx, 1); renderComboSlots(); }


/* =========================================
/* =========================================
   [보스 목록] 클릭 시 탭 이동 기능 추가 (enterBossDetail)
   ========================================= */
function renderBossList(containerId, filterType = 'all', limit = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (globalBossData.length === 0) {
        if (!container.innerHTML.trim()) container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">데이터 로딩 중...</div>';
        return;
    }

    container.innerHTML = '';

    // 필터링
    let targets = globalBossData;
    if (filterType !== 'all') {
        targets = targets.filter(boss => boss.type === filterType);
    }
    if (limit > 0) targets = targets.slice(0, limit);

    if (targets.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">해당하는 보스가 없습니다.</div>';
        return;
    }

    let html = '';
    targets.forEach(boss => {
        const badgeName = boss.type === 'heroic' ? '협경' : '일반';
        const badgeColor = boss.type === 'heroic' ? '#d32f2f' : '#757575';
        const bgImage = boss.img ? boss.img : 'images/logo.png';

        // ★ 핵심 변경: 클릭 시 enterBossDetail 함수 실행
        html += `
        <div class="map-card" onclick="enterBossDetail('${boss.link}')" style="cursor: pointer;">
            <div class="map-hero-bg" style="background-image: url('${bgImage}'); position: relative;">
                <span style="position: absolute; top: 8px; left: 8px; padding: 2px 6px; font-size: 0.7em; font-weight: bold; color: #fff; background-color: ${badgeColor}; border-radius: 3px; z-index: 2; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                    ${badgeName}
                </span>
            </div>
            <div class="map-content">
                <div class="map-title">${boss.name}</div>
                <p class="map-desc">${boss.subtext}</p>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

/* [추가] 홈 화면에서 보스 클릭 시 -> 가이드 탭으로 이동하며 로드 */
function enterBossDetail(link) {
    // 1. 모든 뷰 숨기고 가이드 뷰만 보이기 (강제 전환)
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder', 'view-map-detail', 'view-chunji'];
    views.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    const guideView = document.getElementById('view-guide');
    if (guideView) guideView.style.display = 'block';

    // 네비게이션 활성화
    const navs = ['nav-home', 'nav-quiz', 'nav-quest', 'nav-code', 'nav-builder', 'nav-more', 'nav-chunji'];
    navs.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active'); });
    const navCode = document.getElementById('nav-code');
    if (navCode) navCode.classList.add('active');

    // 2. URL 파라미터 업데이트 (새로고침 대비)
    const parts = link.split('/');
    const id = parts[parts.length - 1].replace('.html', ''); // 'b1'

    const url = new URL(window.location);
    url.searchParams.set('tab', 'guide');
    url.searchParams.set('g', 'boss');
    url.searchParams.set('r', id);
    window.history.pushState(null, '', url);

    // 3. 로딩 처리
    // 가이드 프레임(guide.html)이 이미 로드되어 있다면 -> 바로 콘텐츠 교체
    if (isGuideLoaded) {
        loadContent(link);
    }
    // 로드 안 되어 있다면 -> loadGuideView 실행 (위에서 설정한 URL 파라미터를 보고 알아서 로드함)
    else {
        loadGuideView();
    }
}/* script.js - renderHomeRecentNews 함수 교체 */
/* script.js */

// 유튜브 ID 추출 함수 (없으면 추가하세요)
function getYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}


function renderHomeRecentNews(newsList) {
    const container = document.getElementById('home-recent-news');
    if (!container) return;

    container.innerHTML = '';

    if (!newsList || newsList.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#999; text-align:center; font-size:0.9em;">등록된 소식이 없습니다.</div>';
        return;
    }

    // 5개만 표시
    const listToRender = newsList.slice(0, 5);

    listToRender.forEach(item => {
        const row = document.createElement('div');
        row.className = 'news-list-row';

        // 링크가 없으면 빈 문자열
        const linkText = item.link ? item.link : '';

        // 구조: 왼쪽(제목+설명) / 오른쪽(날짜)
        row.innerHTML = `
            <div class="news-left-col">
                <div class="news-row-title">${item.title}</div>
                <div class="news-row-desc">${linkText}</div>
            </div>
            <div class="news-right-col">
                ${item.date}
            </div>
        `;

        container.appendChild(row);
    });
}
// 브라우저의 뒤로 가기 / 앞으로 가기 버튼 클릭 시 화면 전환 실행
window.addEventListener('popstate', handleHistoryChange);


// script.js에 추가 또는 수정
const LIKE_API_URL = "https://script.google.com/macros/s/AKfycbxqyLOKUrIF5pnoW0tMD97o-x4x3gDv-n5o7eVSYiJElvfgUHkX4xihwYOAhoV6wiuu/exec";


// 1. 시스템 초기화 (Promise를 반환하도록 수정)
async function initializeLikeSystem() {
    // 이미 로딩 중이라면 그 Promise를 반환
    if (likeSystemPromise) return likeSystemPromise;

    likeSystemPromise = (async () => {
        try {
            const [ipRes, likesRes] = await Promise.all([
                fetch('https://api.ipify.org?format=json').then(res => res.json()),
                fetch(`${LIKE_API_URL}?action=get_all`).then(res => res.json())
            ]);

            currentUserIp = ipRes.ip;
            globalLikes = likesRes;
            return true;
        } catch (err) {
            console.warn("초기 로딩 실패:", err);
            return false;
        }
    })();

    return likeSystemPromise;
}
// [개선] 프리로드 데이터를 우선 사용하고, 없을 때만 대기하는 로직
async function fetchLikeStatus(id) {
    if (!id) return;
    const pureId = id.toString().replace('q', '');
    const container = document.querySelector('.like-container');
    const countEl = document.querySelector('.like-count');
    if (!container || !countEl) return;

    // 1. [즉시 표시] 프리로드된 캐시가 이미 있다면 서버 응답을 기다리지 않고 바로 보여줍니다.
    if (globalLikes[pureId] !== undefined) {
        countEl.innerText = globalLikes[pureId];
    } else {
        countEl.innerText = "..."; // 데이터가 아직 없는 극히 짧은 순간만 표시
    }

    // 2. [스마트 대기] 초기화가 아직 안 끝났다면 기다리고, 끝났다면 즉시 통과합니다.
    await initializeLikeSystem();

    // 3. [최종 데이터 확인] 서버의 최신값과 동기화하여 정확한 숫자를 다시 표시합니다.
    countEl.innerText = globalLikes[pureId] || "0";

    // 4. [중복 체크] 내 IP 정보가 있고 이미 눌렀다면 빨간색으로 고정
    if (currentUserIp) {
        try {
            // 서버에 내 IP가 이 ID를 눌렀는지 묻습니다.
            const res = await fetch(`${LIKE_API_URL}?action=get&id=${pureId}&ip=${currentUserIp}`);
            const result = await res.json();

            countEl.innerText = result.count;
            if (result.hasLiked) {
                // 이미 눌렀다면 클릭 차단 및 빨간 버튼 고정
                setLikeButtonActive(container, true);
            } else {
                // 안 눌렀다면 즉시 클릭 가능 상태로 전환
                container.style.pointerEvents = "auto";
                container.style.opacity = "1";
            }
        } catch (err) {
            // 에러 발생 시에도 기본적으로 클릭은 허용 (안전장치)
            container.style.pointerEvents = "auto";
            container.style.opacity = "1";
        }
    }
}

// 2. 좋아요 클릭 처리 (낙관적 업데이트 유지)
async function handleLikeClick() {
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get('q') || urlParams.get('r') || urlParams.get('c');
    if (!contentId || !currentUserIp) return;

    const pureId = contentId.toString().replace('q', '');
    const container = document.querySelector('.like-container');
    const countEl = document.querySelector('.like-count');

    if (container.classList.contains('active')) return;

    // [낙관적 업데이트] 즉시 클릭 막고 UI 변경
    setLikeButtonActive(container, true);
    let currentCount = parseInt(countEl.innerText) || 0;
    countEl.innerText = currentCount + 1;

    try {
        const res = await fetch(`${LIKE_API_URL}?action=like&id=${pureId}&ip=${currentUserIp}`);
        const result = await res.json();

        // 서버 최종값으로 동기화
        countEl.innerText = result.count;
    } catch (err) {
        console.error("좋아요 처리 실패:", err);
    }
}

// 3. 버튼 활성화 스타일 적용 함수
function setLikeButtonActive(container, forceActive) {
    if (!container) return;

    if (forceActive) {
        container.classList.add('active');
        container.style.pointerEvents = "none"; // 더 못 누르게 함
        container.style.opacity = "1";
        container.style.borderColor = "#b71c1c";
        container.style.backgroundColor = "#fff5f5";
        const heartText = container.querySelector('span');
        if (heartText) heartText.style.color = "#b71c1c";
    }
}
// [수정] 업적 리스트 렌더링 함수
function renderAchievements(data) {
    const container = document.getElementById('achievement-list');
    if (!container) return;

    // 원본 전체 리스트 가져오기
    const fullList = Array.isArray(data) ? data : (data.archive || []);

    if (fullList.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#999; padding:15px; font-size:0.9em;">아직 달성된 업적이 없습니다.</div>';
        return;
    }

    container.innerHTML = '';

    // ★ 핵심: 모바일(768px 이하)일 때는 4개, PC일 때는 10개로 제한 ★
    const isMobile = window.innerWidth <= 768;
    const displayLimit = isMobile ? 4 : 10;
    const limitedList = fullList.slice(0, displayLimit);

    limitedList.forEach(item => {
        const iconSrc = item.icon ? item.icon : 'images/logo.png';

        const div = document.createElement('div');
        div.className = 'achievement-card';
        div.innerHTML = `
            <div class="ach-icon">
                <img src="${iconSrc}" alt="아이콘" onerror="this.src='images/logo.png'">
            </div>
            <div class="ach-content">
                <div class="ach-title">${item.displayName}</div>
                <div class="ach-desc">${item.description}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

// [신규] 업적 전체 목록 그리기 (큰 카드 형태)
function renderFullAchievementList() {
    const container = document.getElementById('archive-grid-container');
    if (!container) return;

    // 이미 그려져 있으면 다시 그리지 않음 (최적화)
    if (container.children.length > 0) return;

    const list = globalData.archive || [];
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#888;">데이터가 없습니다.</div>';
        return;
    }

    list.forEach(item => {
        const iconSrc = item.icon ? item.icon : 'images/logo.png';

        const card = document.createElement('div');
        card.className = 'archive-full-card'; // CSS에서 정의한 큰 카드 클래스
        card.innerHTML = `
            <div class="af-icon-wrapper">
                <img src="${iconSrc}" alt="아이콘" onerror="this.src='images/logo.png'">
            </div>
            <div class="af-content">
                <div class="af-title">${item.displayName}</div>
                <div class="af-desc">${item.description}</div>
            </div>
        `;
        container.appendChild(card);
    });
}



// [신규] 업적 전체 목록 그리기 (큰 카드 형태)
function renderFullAchievementList() {
    const container = document.getElementById('archive-grid-container');
    if (!container) return;

    // 이미 그려져 있으면 다시 그리지 않음 (최적화)
    if (container.children.length > 0) return;

    const list = globalData.archive || [];
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#888;">데이터가 없습니다.</div>';
        return;
    }

    list.forEach(item => {
        const iconSrc = item.icon ? item.icon : 'images/logo.png';

        const card = document.createElement('div');
        card.className = 'archive-full-card'; // CSS에서 정의한 큰 카드 클래스
        card.innerHTML = `
            <div class="af-icon-wrapper">
                <img src="${iconSrc}" alt="아이콘" onerror="this.src='images/logo.png'">
            </div>
            <div class="af-content">
                <div class="af-title">${item.displayName}</div>
                <div class="af-desc">${item.description}</div>
            </div>
        `;
        container.appendChild(card);
    });
}
/* =========================================/* =========================================
   [JS 초기화] 링크 없으면 흑백 + 클릭/호버 방지
   ========================================= */
function renderHomeCharacters() {
    const container = document.getElementById('home-char-list');

    if (!container || !Array.isArray(characterData) || characterData.length === 0) {
        return;
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    characterData.forEach(char => {
        const name = char.name || '이름 없음';
        const affil = char.affiliation || '';
        const photo = char.photo || 'images/logo.png';

        const hasLink = char.link && char.link.trim() !== "";

        const div = document.createElement('div');
        div.className = 'char-card-horizontal';

        if (hasLink) {
            div.style.cursor = 'pointer';
        } else {
            div.style.pointerEvents = 'none';
        }

        const imgStyle = hasLink ? "" : "filter: grayscale(100%); opacity: 0.6;";

        // ★ 이 부분을 수정해야 합니다 ★
        div.onclick = () => {
            if (typeof openPersonDetail === 'function') {
                // 특정 필드만 골라 담지 말고, 원본 char 객체를 통째로 전달합니다.
                openPersonDetail(char);
            }
        };

        div.innerHTML = `
            <img src="${photo}" class="char-h-img" alt="${name}" 
                 style="${imgStyle}" 
                 onerror="this.onerror=null; this.src='images/logo.png';">
            <div class="char-overlay-box">
                <div class="char-h-name">${name}</div>
                <div class="char-h-affil">${affil}</div>
            </div>
        `;

        fragment.appendChild(div);
    });

    container.appendChild(fragment);
}

function openPersonDetail(char) {
    const modal = document.getElementById('person-bottom-sheet');
    const contentArea = document.querySelector('#person-bottom-sheet .bottom-sheet-content');

    if (!modal || !contentArea) return;

    // 1. 데이터에서 "story"로 시작하는 키들만 골라내어 <p> 태그 생성
    const storiesHtml = Object.keys(char)
        .filter(key => key.startsWith('story')) // story1, story2 등 필터링
        .sort() // 순서대로 정렬
        .map(key => `<p style="margin-bottom: 8px;">${char[key]}</p>`) // 각 스토리를 <p>로 감쌈
        .join('');
    const displayAffiliation = char.affiliation || char.affil || '알 수 없음';
    // 2. 전체 레이아웃 구성
    contentArea.innerHTML = `
        <div class="sheet-handle-bar"></div>
        
        <div class="person-sheet-header">
            <div class="person-img-container" style="margin-bottom:15px;">
                <img src="${char.photo}" class="person-img-large" 
                     style="width:90px; height:90px; border-radius:12px; border:1px solid #ddd; object-fit:cover;">
            </div>
            <h3>${char.name}</h3>
            <div class="person-sheet-sub">| ${char.link || '무명 협객'} |</div>
        </div>

        <div class="task-list-wrapper">
            <div class="person-info-row">
                <span class="person-label">소속</span>
                <span class="task-title">${displayAffiliation || '알 수 없음'}</span>
               </div>
 
            
            <div class="person-bio-item" style="margin-top:10px;">
                <div style="font-weight:bold; color:var(--wuxia-accent-gold); margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:5px;">
                    전기
                </div>
                <div style="line-height:1.7; color:#555; word-break: break-all;">
                    ${storiesHtml || '<p>기록된 전기가 없습니다.</p>'}
                </div>
            </div>
        </div>

        <button class="browse-button" onclick="closePersonDetail()" style="margin-top:25px;">
            닫기
        </button>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
// 바텀시트 닫기 함수
function closePersonDetail() {
    document.getElementById('person-bottom-sheet').classList.remove('active');
    document.body.style.overflow = '';
}

let deferredPrompt; // 설치 프롬프트를 저장할 변수
const installContainer = document.getElementById('install-container');
const installBtn = document.getElementById('btn-install-app');

// 1. 브라우저가 설치 가능함을 감지했을 때 발생
window.addEventListener('beforeinstallprompt', (e) => {
    // 기본 브라우저 설치 안내가 바로 뜨지 않도록 방지
    e.preventDefault();
    // 이벤트를 보관해둠
    deferredPrompt = e;

    // 숨겨져 있던 버튼 컨테이너를 표시 (이제 설치 가능하니까!)
    if (installContainer) {
        installContainer.style.setProperty('display', 'flex', 'important');
    }
});

// 2. 버튼 클릭 시 설치 프롬프트 띄우기
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        // 보관해둔 설치창 띄우기
        deferredPrompt.prompt();

        // 사용자의 선택 결과 기다리기
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`사용자 설치 선택: ${outcome}`);

        // 결과와 상관없이 프롬프트는 1회용이므로 초기화
        deferredPrompt = null;

        // 설치창이 닫혔으므로 버튼 다시 숨기기
        if (installContainer) installContainer.style.display = 'none';
    });
}

// 3. 앱이 성공적으로 설치되었을 때
window.addEventListener('appinstalled', (evt) => {
    console.log('연운 위키 앱이 설치되었습니다.');
    if (installContainer) installContainer.style.display = 'none';
});

function renderHomeChunji() {
    const container = document.getElementById('home-chunji-list');
    if (!container || !chunjiData) return;

    container.innerHTML = '';

    // 무림록과 균형을 맞추기 위해 6개 또는 9개 출력
    const displayList = chunjiData.slice(0, 6);

    displayList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'chunji-item-card';

        div.onclick = () => {
            if (typeof switchTab === 'function' && typeof loadChunjiDetail === 'function') {
                switchTab('chunji');
                loadChunjiDetail(item);
            }
        };

        // 제목 아래에 서브텍스트(type)를 배치
        div.innerHTML = `
            <div class="chunji-card-title">${item.title}</div>
        `;
        container.appendChild(div);
    });
}

// 생일 체크 함수
function checkCharacterBirthday() {
    if (!characterData || characterData.length === 0) return;

    // 1. 현재 날짜 가져오기 (예: "10월 12일")
    const now = new Date();
    const currentMonthDay = `${now.getMonth() + 1}월 ${now.getDate()}일`;

    // 2. 오늘이 생일인 인물 찾기
    const birthdayChar = characterData.find(char => char.link === currentMonthDay);

    if (birthdayChar) {
        showBirthdayPopup(birthdayChar);
    }
}// 꽃가루 애니메이션 실행 함수
function createConfetti() {
    const container = document.querySelector('.confetti-container');
    if (!container) return;

    const colors = ['#d4af37', '#b71c1c', '#ffffff', '#ffd700'];

    for (let i = 0; i < 60; i++) { // 개수 증가
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';

        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = Math.random() * 100 + '%';

        // 딜레이와 지속시간을 조절해 끊기지 않게 함
        piece.style.animationDelay = Math.random() * 10 + 's';
        piece.style.animationDuration = (Math.random() * 3 + 4) + 's';

        container.appendChild(piece);
    }
}
// 생일 체크 및 팝업 제어 함수
function checkCharacterBirthday(testName = null) {
    if (!characterData || characterData.length === 0) return;

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`; // 오늘 날짜 키 (예: 2026-1-1)
    const currentMonthDay = `${now.getMonth() + 1}월 ${now.getDate()}일`;

    // 1. [핵심] 오늘 이미 팝업을 확인(축하 완료)했는지 체크
    if (!testName && localStorage.getItem('birthday_wishes_done') === todayKey) {
        console.log("오늘의 생일 축하를 이미 완료했습니다.");
        return;
    }

    // 2. 인물 찾기
    const birthdayChar = testName
        ? characterData.find(char => char.name === testName)
        : characterData.find(char => char.link === currentMonthDay);

    if (birthdayChar) {
        showBirthdayPopup(birthdayChar, todayKey);
    }
}

// 축하 완료 처리 함수
function completeBirthdayWish(todayKey) {
    // 로컬 스토리지에 오늘 날짜 저장
    localStorage.setItem('birthday_wishes_done', todayKey);

    // 팝업 제거
    const overlay = document.querySelector('.birthday-overlay');
    if (overlay) overlay.remove();

    console.log("생일 축하 완료 기록 저장됨:", todayKey);
}

function showBirthdayPopup(char, todayKey) {
    const overlay = document.createElement('div');
    overlay.className = 'birthday-overlay';

    overlay.innerHTML = `
        <div class="birthday-card">
            <div class="confetti-container"></div>
            <div style="position: relative; z-index: 10;">
                <div class="birthday-img-wrapper">
                    <img src="${char.photo || 'images/logo.png'}" onerror="this.src='images/logo.png'">
                </div>
                <div class="birthday-text">
                    <p class="b-event-tag">🎂 오늘의 특별한 소식 🎂</p>
                    <h2>오늘은 <span class="b-name">${char.name}</span> 대협의 생일입니다.</h2>
                    <div class="b-quote-box">
                        <p class="b-quote-label">대협의 한 마디</p>
                        <p class="b-desc">"${char.biography}"</p>
                    </div>
                </div>
                <button class="b-close-btn" onclick="completeBirthdayWish('${todayKey}')">
                    인사 올리기
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentElement('afterbegin', overlay);
    createConfetti();
}

const playlist = [
    { title: "Bladestorm Over Jianghu", src: "music/1 - Bladestorm Over Jianghu.mp3" },
    { title: "White Gale Execution", src: "music/2 - White Gale Execution.mp3" },
    { title: "Crimson Cliff Last Stand", src: "music/3 - Crimson Cliff Last Stand.mp3" },
    { title: "Ten Banners, One Field", src: "music/4 - Ten Banners, One Field.mp3" },
    { title: "Lantern Pulse Under Kaifeng", src: "music/5 - Lantern Pulse Under Kaifeng.mp3" },
    { title: "Fuyao Core Ignition", src: "music/6 - Fuyao Core Ignition.mp3" },
    { title: "He Xi Sandstorm Reckoning", src: "music/7 - He Xi Sandstorm Reckoning.mp3" },
    { title: "Crimson Spur Relay", src: "music/8 - Crimson Spur Relay.mp3" },
    { title: "Clockwork Reliquary Collapse", src: "music/9 - Clockwork Reliquary Collapse.mp3" },
    { title: "Wind Over Broken Roofs", src: "music/10 - Wind Over Broken Roofs.mp3" },
    { title: "Snowdrift Vanguard", src: "music/11 - Snowdrift Vanguard.mp3" },
    { title: "Wolfwind Ridge Pursuit", src: "music/12 - Wolfwind Ridge Pursuit.mp3" },
    { title: "Broken Wall Thunderline", src: "music/13 - Broken Wall Thunderline.mp3" },
    { title: "Ashen Gears of Huigu", src: "music/14 - Ashen Gears of Huigu.mp3" },
    { title: "Coffin Wake at Cixin", src: "music/15 - Coffin Wake at Cixin.mp3" },
    { title: "Heavenbreaker Warlord", src: "music/16 - Heavenbreaker Warlord.mp3" },
    { title: "Ghostlight Siege Run", src: "music/17 - Ghostlight Siege Run.mp3" },
    { title: "Riftline Killzone", src: "music/18 - Riftline Killzone.mp3" },
    { title: "Lotus Ash Cataclysm", src: "music/19 - Lotus Ash Cataclysm.mp3" },
    { title: "Rift of the Earth-Fiend", src: "music/20 - Rift of the Earth-Fiend.mp3" }
];

let currentIdx = 0;
const audio = document.getElementById('main-audio');
const audioTitle = document.getElementById('player-title');
const audioBtn = document.getElementById('audio-toggle-btn');
const dropdown = document.getElementById('playlist-dropdown');

function updateStatusText() {
    const statusText = document.getElementById('playlist-status');
    if (statusText) {
        // (현재 인덱스 + 1 / 전체 곡 수) 형식으로 변경
        statusText.innerText = `${currentIdx + 1} / ${playlist.length}`;
    }
}

function initPlayer() {
    const listItems = document.getElementById('playlist-items');
    if (!listItems) return;

    listItems.innerHTML = playlist.map((track, i) => `
        <li class="playlist-item-li ${i === currentIdx ? 'active' : ''}" onclick="selectTrack(${i})">
            <span class="track-num">${i + 1}</span>
            <span class="track-name">${track.title}</span>
        </li>
    `).join('');
    refreshPlayerUI(); // 초기 상태 (1 / 20) 반영
    loadTrack(currentIdx);
    updateStatusText(); // 초기화 시 실행
    updateUI();
}

function selectTrack(i) {
    currentIdx = i;
    loadTrack(i);
    audio.play().then(updateUI);
    updateStatusText(); // 곡 선택 시 실행
    if (dropdown) dropdown.classList.remove('show');
}
function loadTrack(i) {
    if (!playlist[i]) return;
    audio.src = playlist[i].src;
    // HTML 요소에 직접 텍스트 주입
    document.getElementById('player-title').textContent = playlist[i].title;
}

function updateUI() {
    // 재생 중일 때만 버튼 아이콘을 변경하고 제목을 흐르게 함
    if (audio.paused) {
        audioBtn.innerText = '▶';
        audioTitle.classList.remove('running');
    } else {
        audioBtn.innerText = 'Ⅱ';
        audioTitle.classList.add('running');
    }

    // 리스트 내 활성 곡 강조
    document.querySelectorAll('.playlist-item-li').forEach((li, idx) => {
        li.classList.toggle('active', idx === currentIdx);
    });
}

function handlePlayPause(e) {
    e.stopPropagation(); // 드롭다운 토글 방지
    if (audio.paused) {
        audio.play().then(updateUI);
    } else {
        audio.pause();
        updateUI();
    }
}

function togglePlaylist() {
    dropdown.classList.toggle('show');
}

function selectTrack(i) {
    currentIdx = i;
    loadTrack(i);
    audio.play().then(updateUI);

    // [추가] 곡을 선택하면 플레이리스트 드롭다운을 닫음
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// 기존 사이드바 닫기 함수에 리스트 닫기 추가
function closeSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar) sidebar.classList.remove('active');
    if (dropdown) dropdown.classList.remove('show');
}

// 오디오 이벤트 리스너
audio.addEventListener('play', updateUI);
audio.addEventListener('pause', updateUI);
audio.addEventListener('ended', () => selectTrack((currentIdx + 1) % playlist.length));

// 페이지 로드 시 초기화 실행
document.addEventListener('DOMContentLoaded', initPlayer);

// 상태 업데이트 통합 함수
function refreshPlayerUI() {
    const statusText = document.getElementById('playlist-status');
    const audioTitle = document.getElementById('player-title');

    // 1. 상단 상태 텍스트 갱신 (예: 악보 목록 3 / 20)
    if (statusText) {
        statusText.innerText = `${currentIdx + 1} / ${playlist.length}`;
    }

    // 2. 플레이어 바 제목 갱신 및 흐름 제어
    if (audioTitle) {
        audioTitle.textContent = playlist[currentIdx].title;
        // 재생 중일 때만 흐르게 함
        if (!audio.paused) {
            audioTitle.classList.add('running');
        }
    }

    // 3. 리스트 내 'active' 클래스 이동 (하이라이트)
    document.querySelectorAll('.playlist-item-li').forEach((li, idx) => {
        if (idx === currentIdx) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

// 곡 선택 함수
function selectTrack(i) {
    currentIdx = i; // 인덱스 변경
    loadTrack(currentIdx);

    // 리스트 닫기 및 재생
    if (dropdown) dropdown.classList.remove('show');

    audio.play().then(() => {
        refreshPlayerUI(); // 재생 성공 시 UI 전체 갱신
    }).catch(() => {
        refreshPlayerUI(); // 차단되어도 UI는 갱신
    });
}

// 다음 곡 자동 재생 시에도 인덱스 갱신
audio.addEventListener('ended', () => {
    currentIdx = (currentIdx + 1) % playlist.length;
    selectTrack(currentIdx);
});


let pvpFullData = []; // 데이터를 저장할 빈 배열
let currentPvpPage = 0;
const pvpItemsPerPage = 3;
let pvpLastUpdate = ""; // 날짜를 저장할 변수 추가
// ... 상단 변수 선언(pvpFullData 등)은 유지 ...

async function fetchRankingData() {
    try {
        const response = await fetch('json/rank.json');
        const data = await response.json();
        
        // [수정] 데이터를 불러온 즉시 점수(score) 높은 순으로 정렬합니다.
        pvpFullData = data.rankings.sort((a, b) => b.score - a.score);
        pvpLastUpdate = data.update_date;

        updatePvpRanking();
        setInterval(updatePvpRanking, 6000); 
    } catch (error) {
        console.error("데이터 로드 실패:", error);
    }
}

function updatePvpRanking() {
    const listEl = document.getElementById('pvp-list');
    const pageEl = document.getElementById('pvp-page-indicator');
    
    if (!listEl || pvpFullData.length === 0) return;

    const start = currentPvpPage * pvpItemsPerPage;
    const end = start + pvpItemsPerPage;
    const currentList = pvpFullData.slice(start, end);

    // [수정] 맵(map) 함수에서 인덱스(i)를 추가로 받습니다.
    listEl.innerHTML = currentList.map((p, i) => {
        // 실제 순위 계산: 현재 페이지 시작 번호 + 현재 리스트 내 순서 + 1
        const calculatedRank = start + i + 1;
        
        // 계산된 순위를 바탕으로 1~3위 디자인 적용
        const rankClass = calculatedRank <= 3 ? `rank-${calculatedRank} top-3` : '';
        
        return `
            <div class="rank-item ${rankClass}">
                <div class="rank-num-text">${calculatedRank}</div>
                <img src="images/rank/${p.name}.png" class="rank-p-img" onerror="this.src='images/logo.png'">
                <div class="rank-p-name">${p.name}</div>
                <div class="rank-p-score">${p.score.toLocaleString()}</div>
            </div>
        `;
    }).join('');

    // 업데이트 시간 표기
    if (pageEl) {
        pageEl.innerText = `${pvpLastUpdate} 기준`;
    }

    // 다음 페이지 계산
    currentPvpPage = (currentPvpPage + 1) % Math.ceil(pvpFullData.length / pvpItemsPerPage);
}
// 초기 실행: 데이터를 먼저 불러옵니다.
document.addEventListener("DOMContentLoaded", fetchRankingData);