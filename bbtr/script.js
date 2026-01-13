let siteData = null;
let heroData = null;
let dbData = null;
let currentLang = localStorage.getItem('bpb_wiki_lang') || 'en';
let currentTab = 'home';
let activePatchId = null;

/**
 * 초기화: 모든 JSON 데이터를 불러옵니다.
 */
async function init() {
    try {
        const [resSite, resHero, resDb] = await Promise.all([
            fetch('json/data.json'),
            fetch('json/hero.json'),
            fetch('json/db.json')
        ]);

        siteData = await resSite.json();
        heroData = await resHero.json();
        dbData = await resDb.json();

        if (!siteData.i18n.en.nav_heroes) siteData.i18n.en.nav_heroes = "Heroes";
        if (!siteData.i18n.ko.nav_heroes) siteData.i18n.ko.nav_heroes = "영웅들";

        // ★ [추가] 빌더 가이드 문구 번역 등록
        siteData.i18n.en.builder_guide = "Drag & Drop to move items. Tap an item in the list to rotate it.";
        siteData.i18n.ko.builder_guide = "아이템을 드래그하여 배치하거나 이동하세요. 리스트에서 탭을 하면 아이템이 회전합니다.";

        updateLangButtons();
        setupFilters();
        render();
        switchTab('home');

        // ★ [수정] PC 화면에서 유령 다이얼로그가 뜨는 문제 해결 (초기 숨김)
        document.getElementById('bottom-sheet').classList.add('hidden');

    } catch (e) {
        console.error("Data loading failed:", e);
    }
}

/**
 * 탭 전환 (Home <-> DB <-> Builder)
 */
/**
 * 탭 전환 (Home <-> DB <-> Builder)
 */
function switchTab(tabId) {
    currentTab = tabId;

    // 1. 모든 페이지 숨기기
    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-db').classList.add('hidden');
    document.getElementById('page-hero-detail').classList.add('hidden');
    const pageBuilder = document.getElementById('page-builder');
    if (pageBuilder) pageBuilder.classList.add('hidden');

    // 2. 선택한 페이지 보이기
    if (tabId === 'home') {
        document.getElementById('page-home').classList.remove('hidden');
    } else if (tabId === 'db') {
        document.getElementById('page-db').classList.remove('hidden');
        filterItems(); // DB 탭 진입 시 리스트 로드
    } else if (tabId === 'builder') {
        if (pageBuilder) {
            pageBuilder.classList.remove('hidden');
            // 빌더가 초기화되지 않았으면 초기화
            if (!gridState || gridState.length === 0) {
                initBuilder();
            } else {
                // ★ [수정] renderBuilderItems() -> filterBuilderItems()
                // 그냥 렌더링하면 목록이 없으므로, 필터 함수를 호출해 현재 상태에 맞는 리스트를 다시 가져옵니다.
                if (typeof filterBuilderItems === 'function') {
                    filterBuilderItems();
                }
            }
        }
    }

    // 3. 하단 내비게이션 스타일 업데이트
    document.querySelectorAll('.nav-item').forEach(btn => {
        const isMatch = btn.id === `nav-${tabId}`;
        btn.classList.toggle('active', isMatch);
        btn.classList.toggle('text-gray-400', !isMatch);
        btn.classList.toggle('text-blue-600', isMatch);
    });

    // 스크롤 초기화 (빌더는 내부 스크롤이므로 제외)
    if (tabId !== 'builder') {
        window.scrollTo(0, 0);
    }
}

/**
 * 언어 변경
 */
function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('bpb_wiki_lang', lang);
    
    updateLangButtons();
    setupFilters(); // 필터 옵션 언어 갱신
    render();       // 전체 텍스트 갱신
    
    if (currentTab === 'db') filterItems(); // DB 리스트 갱신
}

function updateLangButtons() {
    const btnEn = document.getElementById('lang-en');
    const btnKo = document.getElementById('lang-ko');
    
    if (btnEn && btnKo) {
        if (currentLang === 'en') {
            btnEn.classList.add('text-gray-900', 'font-black');
            btnEn.classList.remove('text-gray-400');
            btnKo.classList.add('text-gray-400');
            btnKo.classList.remove('text-gray-900', 'font-black');
        } else {
            btnKo.classList.add('text-gray-900', 'font-black');
            btnKo.classList.remove('text-gray-400');
            btnEn.classList.add('text-gray-400');
            btnEn.classList.remove('text-gray-900', 'font-black');
        }
    }
}

/**
 * 화면 렌더링 (텍스트, 영웅 목록, 패치노트)
 */
function render() {
    if (!siteData || !heroData) return;

    // 다국어 텍스트 적용
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        if (siteData.i18n[currentLang] && siteData.i18n[currentLang][key]) {
            const text = siteData.i18n[currentLang][key];
            if (el.getAttribute('data-i18n-target') === 'placeholder') el.placeholder = text;
            else el.innerText = text;
        }
    });

    // 영웅 목록 (Home)
    const heroBox = document.getElementById('hero-container');
    if (heroBox) {
        heroBox.innerHTML = heroData.heroes.map(hero => `
            <div onclick="openHeroDetail('${hero.id}')" class="flex flex-col items-center gap-2 cursor-pointer group">
                <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-blue-500 transition-all bg-gray-50 shadow-sm">
                    <img src="heroes/${hero.id}.png" alt="${hero.id}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='logo.png';">
                </div>
                <span class="text-[11px] font-bold text-gray-600 group-hover:text-blue-600 text-center leading-tight">${hero.name[currentLang]}</span>
            </div>
        `).join('');
    }

    // 패치노트 목록 (Home)
    const patchBox = document.getElementById('patch-container');
    if (patchBox && siteData.content && siteData.content.patches) {
        patchBox.innerHTML = siteData.content.patches.map(p => `
            <div onclick="openPatch('${p.id}')" class="py-4 flex justify-between items-center cursor-pointer border-b border-gray-50 last:border-none group hover:bg-gray-50 px-2 rounded-lg transition-colors">
                <span class="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate mr-4">${p.title[currentLang]}</span>
                <span class="text-gray-400 font-mono text-[10px] flex-none bg-gray-100 px-2 py-1 rounded-md">${p.date}</span>
            </div>
        `).join('');
    }
}

/**
 * DB 필터 설정
 */
/**
 * DB 필터 드롭다운 설정 (데이터 기반 동적 생성)
 */
function setupFilters() {
    const heroSelect = document.getElementById('filter-hero');
    const raritySelect = document.getElementById('filter-rarity');
    const typeSelect = document.getElementById('filter-type');
    const craftedSelect = document.getElementById('filter-crafted');

    if (!heroSelect || !heroData || !dbData) return;

    // 1. 영웅 필터
    heroSelect.innerHTML = `<option value="">${currentLang === 'ko' ? '영웅 (전체)' : 'Hero (All)'}</option>` +
        heroData.heroes.map(h => `<option value="${h.id}">${h.name[currentLang]}</option>`).join('');

    // 2. 등급 필터
    const rarities = { en: ["Rarity", "Common", "Rare", "Epic", "Legendary", "Mythic", "Unique", "Relic"], ko: ["등급", "일반", "희귀", "에픽", "전설", "신화", "고유", "유물"] };
    raritySelect.innerHTML = rarities[currentLang].map((r, i) => `<option value="${i === 0 ? '' : rarities.en[i]}">${r}</option>`).join('');

    // 3. ★ [변경] 타입 필터 (DB 데이터 스캔 및 쉼표 분리)
    const typeMap = new Map(); // Key: 영문타입, Value: 현재언어타입

    dbData.items.forEach(item => {
        if (!item.type) return;

        // 영문과 한글 타입을 각각 콤마로 분리 및 공백 제거
        const enTypes = item.type.en.split(',').map(t => t.trim());
        const langTypes = item.type[currentLang].split(',').map(t => t.trim());

        // 분리된 타입들을 맵에 등록
        enTypes.forEach((enT, index) => {
            if (!typeMap.has(enT)) {
                // 매칭되는 번역어가 없으면 영문 그대로 사용
                const label = langTypes[index] || enT; 
                typeMap.set(enT, label);
            }
        });
    });

    // 알파벳 순 정렬
    const sortedTypes = Array.from(typeMap.keys()).sort();

    // 옵션 생성
    let typeOptions = `<option value="">${currentLang === 'ko' ? '종류 (전체)' : 'Type (All)'}</option>`;
    sortedTypes.forEach(enKey => {
        typeOptions += `<option value="${enKey}">${typeMap.get(enKey)}</option>`;
    });
    typeSelect.innerHTML = typeOptions;


    // 4. 조합 필터
    const crafted = { en: ["Crafted", "Yes", "No"], ko: ["조합여부", "예", "아니오"] };
    craftedSelect.innerHTML = crafted[currentLang].map((c, i) => `<option value="${i === 0 ? '' : (i === 1 ? 'true' : 'false')}">${c}</option>`).join('');
}

/**
 * DB 아이템 필터링 및 렌더링
 */
/**
 * DB 아이템 필터링 및 렌더링
 */
function filterItems() {
    if (!dbData) return;
    const searchTerm = document.getElementById('db-search').value.toLowerCase();
    const heroFilter = document.getElementById('filter-hero').value;
    const rarityFilter = document.getElementById('filter-rarity').value;
    const typeFilter = document.getElementById('filter-type').value;
    const craftedFilter = document.getElementById('filter-crafted').value;

    const filtered = dbData.items.filter(item => {
        // 검색어 (한글/영문 둘 다 검색)
        const matchesSearch = item.name[currentLang].toLowerCase().includes(searchTerm) ||
            item.name.en.toLowerCase().includes(searchTerm);
        
        // 필터 조건들
        const matchesHero = !heroFilter || item.hero === heroFilter;
        const matchesRarity = !rarityFilter || item.rarity === rarityFilter;
        
        // ★ [변경] 타입 필터: 콤마로 구분된 여러 타입 중 하나라도 일치하면 통과
        // 예: 아이템이 "Pet, Rat"일 때, 필터가 "Pet"이어도 True, "Rat"이어도 True
        let matchesType = true;
        if (typeFilter) {
            const itemTypes = item.type.en.split(',').map(t => t.trim());
            matchesType = itemTypes.includes(typeFilter);
        }
        
        const matchesCrafted = !craftedFilter || String(item.isCrafted) === craftedFilter;
        
        return matchesSearch && matchesHero && matchesRarity && matchesType && matchesCrafted;
    });

    renderDbList(filtered);
}

/**
 * 패치노트 바텀시트 열기
 */function openPatch(id) {
    activePatchId = id;
    const p = siteData.content.patches.find(x => x.id === id);
    if (!p) return;

    const contentHtml = `
        <div class="px-6 pb-8">
            <div class="text-center mb-6">
                <span class="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black mb-2">${p.date}</span>
                <h2 class="text-xl font-black text-gray-900 leading-tight">${p.title[currentLang]}</h2>
            </div>
            <div class="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-6 rounded-2xl border border-gray-100">
                ${p.content ? p.content[currentLang] : p.body[currentLang]}
            </div>
        </div>
    `;

    const sheet = document.getElementById('bottom-sheet');
    document.getElementById('sheet-content').innerHTML = contentHtml;
    document.getElementById('sheet-overlay').classList.remove('hidden');

    // ★ [수정] 열기 애니메이션 로직
    sheet.classList.remove('hidden');
    void sheet.offsetWidth; // Reflow
    sheet.classList.add('show');
    
    document.body.style.overflow = 'hidden';
}

/**
 * 바텀시트 닫기 (JS 애니메이션 수정)
 */
function closeSheet() {
    activePatchId = null;
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('sheet-overlay');

    overlay.classList.add('hidden');
    sheet.classList.remove('show'); // 애니메이션 시작 (내려가기)

    // ★ [수정] 애니메이션(0.3s)이 끝난 후 완전히 숨김(hidden) 처리
    setTimeout(() => {
        sheet.classList.add('hidden');
    }, 300); // CSS duration-300과 일치

    document.body.style.overflow = '';
}

/**
 * 영웅 상세 페이지
 */
function openHeroDetail(heroId) {
    const hero = heroData.heroes.find(h => h.id === heroId);
    if (!hero) return;

    document.getElementById('detail-hero-name').innerText = hero.name[currentLang];
    document.getElementById('detail-hero-quote').innerText = hero.quote ? `"${hero.quote[currentLang]}"` : "";
    document.getElementById('detail-hero-img').src = `heroes/${hero.id}.png`;

    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-db').classList.add('hidden');
    document.getElementById('page-hero-detail').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function goBack() { switchTab('home'); }

// -----------------------------------------------------------
// 아이템 상세 (openItemDetail) 및 뱃지 생성 함수들은 기존과 동일
// (아래에 기존 완성된 openItemDetail, createSideBadge, createVerticalBadge 함수 붙여넣기)
// -----------------------------------------------------------

function createSideBadge(count) {
    if (count === 1) return `<div class="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm"><span class="text-[10px] text-gray-400">★</span></div>`;
    return `<div class="flex items-center gap-1 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm"><span class="text-[9px] text-gray-300">★</span><span class="text-[10px] font-black text-gray-500">x${count}</span></div>`;
}

function createVerticalBadge(count, dir) {
    const line = dir==='down' ? 'mt-0.5' : 'mb-0.5';
    let badgeContent;
    if (count === 1) badgeContent = `<div class="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm z-10"><span class="text-[10px] text-gray-400">★</span></div>`;
    else badgeContent = `<div class="flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-lg shadow-sm z-10"><span class="text-[10px] text-gray-300">★</span><span class="text-xs font-black text-gray-500">x${count}</span></div>`;
    return `<div class="flex flex-col items-center ${dir==='down'?'mb-1':'mt-1'}">${dir==='up' ? `<div class="w-px h-2 bg-gray-300 ${line}"></div>` : ''}${badgeContent}${dir==='down' ? `<div class="w-px h-2 bg-gray-300 ${line}"></div>` : ''}</div>`;
}

window.onload = init;

/**
 * DB 아이템 리스트 렌더링 (WebP 적용)
 */
/**
 * DB 아이템 리스트 렌더링 (WebP + 언더바 치환 적용)
 */
/**
 * 등급(Rarity) 다국어 변환 헬퍼
 */
/**
 * 등급(Rarity) 다국어 변환 헬퍼 (사용자 정의 사전 반영)
 */
function getLocalizedRarity(rarityKey) {
    const map = {
        "Common":    { en: "Common",    ko: "일반" },
        "Rare":      { en: "Rare",      ko: "희귀" },
        "Epic":      { en: "Epic",      ko: "에픽" },
        "Legendary": { en: "Legendary", ko: "전설" },
        "Mythic":    { en: "Mythic",    ko: "신화" },
        "Unique":    { en: "Unique",    ko: "고유" },
        "Relic":     { en: "Relic",     ko: "유물" }
    };
    
    // 데이터가 없거나 매칭되지 않는 경우 원본(영어) 반환
    return (map[rarityKey] && map[rarityKey][currentLang]) ? map[rarityKey][currentLang] : rarityKey;
}

/**
 * DB 아이템 리스트 렌더링
 */
function renderDbList(list) {
    const listContainer = document.getElementById('db-list');
    if (!listContainer) return;

    listContainer.innerHTML = list.map(item => {
        // 이미지 파일명: 공백 -> 언더바
        const imgFileName = item.name.en.replace(/ /g, '_');
        
        // 등급 번역
        const localizedRarity = getLocalizedRarity(item.rarity);

        return `
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 cursor-pointer active:scale-95 transition-transform h-full min-h-[190px] hover:border-blue-200" onclick="openItemDetail('${item.id}')">
            <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full overflow-hidden flex-none border border-gray-100 bg-gray-50 shadow-sm">
                    <img src="heroes/${item.hero}.png" class="w-full h-full object-cover" onerror="this.src='logo.png'">
                </div>
                <h4 class="text-[13px] font-black text-gray-900 leading-tight flex-1 break-words line-clamp-2">${item.name[currentLang]}</h4>
            </div>
            <div class="flex flex-wrap gap-1.5 items-center">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-100 uppercase">${localizedRarity}</span>
                
               
                <div class="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 flex-none">
                    <span class="text-[10px]">💰</span><span class="text-[10px] font-black text-amber-600">${item.cost}</span>
                </div>
            </div>
            <div class="flex-1 flex items-center justify-center py-2">
                <div class="w-16 h-16 flex items-center justify-center">
                    <img src="items/${imgFileName}.webp" class="max-w-full max-h-full object-contain filter drop-shadow-sm" onerror="this.src='logo.png'">
                </div>
            </div>
        </div>
        `;
    }).join('');
}


/**
 * 아이템 상세 정보 (타입 번역 + 레벨 보너스 + WebP + 언더바)
 */
/**
 * 아이템 상세 정보 열기 (최종 통합 버전)
 * - WebP 이미지 적용
 * - 파일명 공백 -> 언더바(_) 치환
 * - 레벨별 보너스 섹션 추가
 * - 등급/타입 한글화 적용
 * - 별 1개는 뱃지 대신 격자 아이콘으로 표시
 * - PC 화면 유령 다이얼로그 버그 수정 (hidden 제어)
 */
function openItemDetail(itemId) {
    const item = dbData.items.find(i => i.id === itemId);
    if (!item) return;

    const hero = heroData.heroes.find(h => h.id === item.hero);
    const shape = item.layout.shape || [[1]];

    // [1] 데이터 가공: 이미지 파일명, 등급 번역
    const imgFileName = item.name.en.replace(/ /g, '_');
    const localizedRarity = getLocalizedRarity(item.rarity);

    const totalRows = shape.length;
    const totalCols = shape[0].length;

    // [2] Content Bounding Box (내용물이 있는 영역 계산)
    let minR = totalRows, maxR = -1, minC = totalCols, maxC = -1;
    let imgMinR = totalRows, imgMaxR = -1, imgMinC = totalCols, imgMaxC = -1;

    for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
            const cell = shape[r][c];
            if (cell === 0 || cell === 1) {
                minR = Math.min(minR, r); maxR = Math.max(maxR, r);
                minC = Math.min(minC, c); maxC = Math.max(maxC, c);
            }
            if (cell === 1) {
                imgMinR = Math.min(imgMinR, r); imgMaxR = Math.max(imgMaxR, r);
                imgMinC = Math.min(imgMinC, c); imgMaxC = Math.max(imgMaxC, c);
            }
        }
    }

    if (minR === totalRows) { minR=0; maxR=0; minC=0; maxC=0; }
    if (imgMinR === totalRows) { imgMinR=0; imgMaxR=0; imgMinC=0; imgMaxC=0; }

    const imgW_Cells = (imgMaxC - imgMinC + 1);
    const imgH_Cells = (imgMaxR - imgMinR + 1);
    const contentWidth = maxC - minC + 1;
    const isSingleColumnStack = (contentWidth === 1);

    // [3] 수직 병합 (Vertical Merge) - 폭이 1칸일 때만
    let topBadgeHtml = '';
    let bottomBadgeHtml = '';
    let startRenderRow = minR;
    let endRenderRow = maxR;

    if (isSingleColumnStack) {
        let topCount = 0;
        for (let r = minR; r < imgMinR; r++) { if (shape[r][minC] === 0) topCount++; else break; }
        if (topCount > 0) {
            topBadgeHtml = createVerticalBadge(topCount, 'down');
            startRenderRow = imgMinR;
        }
        let bottomCount = 0;
        for (let r = maxR; r > imgMaxR; r--) { if (shape[r][minC] === 0) bottomCount++; else break; }
        if (bottomCount > 0) {
            bottomBadgeHtml = createVerticalBadge(bottomCount, 'up');
            endRenderRow = imgMaxR;
        }
    }

    // [4] 격자 렌더링 (Row Loop)
    const tileSize = 40;
    const gap = 2;
    const fullImgWidth = imgW_Cells * tileSize + (imgW_Cells - 1) * gap;
    const fullImgHeight = imgH_Cells * tileSize + (imgH_Cells - 1) * gap;
    let centerRowsHtml = '';

    for (let r = startRenderRow; r <= endRenderRow; r++) {
        let leftStars = 0;
        let rightStars = 0;
        let innerStart = minC; 
        let innerEnd = maxC;

        // 좌우 별 개수 확인
        for (let c = minC; c <= maxC; c++) { if (shape[r][c] === 0) leftStars++; else break; }
        for (let c = maxC; c >= minC; c--) { if (shape[r][c] === 0) rightStars++; else break; }

        // 중복 방지 및 1개짜리 별 예외처리 (격자로 표시)
        if (leftStars + rightStars > (maxC - minC + 1)) { leftStars = 0; rightStars = 0; }
        if (leftStars === 1) leftStars = 0;
        if (rightStars === 1) rightStars = 0;

        innerStart += leftStars;
        innerEnd -= rightStars;

        let rowCellsHtml = '';
        for (let c = innerStart; c <= innerEnd; c++) {
            const cell = shape[r][c];
            if (cell === 1) {
                // 이미지 (WebP + 언더바 파일명)
                const leftPos = -((c - imgMinC) * (tileSize + gap));
                const topPos = -((r - imgMinR) * (tileSize + gap));
                rowCellsHtml += `
                    <div class="relative overflow-hidden bg-white rounded-md shadow-sm border border-blue-100 flex-none" 
                         style="width: ${tileSize}px; height: ${tileSize}px;">
                        <img src="items/${imgFileName}.webp" 
                             style="position: absolute; width: ${fullImgWidth}px; height: ${fullImgHeight}px; left: ${leftPos}px; top: ${topPos}px; max-width: none;"
                             onerror="this.src='logo.png';">
                    </div>`;
            } else if (cell === 0) {
                // 내부 별 (아이콘만 표시)
                rowCellsHtml += `
                    <div class="flex items-center justify-center bg-white rounded-md border border-gray-200 shadow-sm flex-none" 
                         style="width: ${tileSize}px; height: ${tileSize}px;">
                        <span class="text-[10px] text-gray-400">★</span>
                    </div>`;
            } else if (cell === 3) {
                // 빈칸 (투명)
                rowCellsHtml += `<div class="flex-none" style="width: ${tileSize}px; height: ${tileSize}px;"></div>`;
            }
        }

        centerRowsHtml += `
            <div class="flex items-center justify-center gap-2">
                <div class="w-8 flex justify-end">${leftStars > 0 ? createSideBadge(leftStars) : ''}</div>
                <div class="flex" style="gap: ${gap}px;">${rowCellsHtml}</div>
                <div class="w-8 flex justify-start">${rightStars > 0 ? createSideBadge(rightStars) : ''}</div>
            </div>
            ${r < endRenderRow ? `<div style="height: ${gap}px;"></div>` : ''}
        `;
    }

    // [5] 레벨 보너스 HTML 생성
    let levelBonusHtml = '';
    if (item.stats.levels && item.stats.levels.length > 0) {
        levelBonusHtml = `
            <div class="px-6 mb-8">
                <h5 class="text-[10px] font-black text-gray-300 uppercase mb-2 tracking-widest text-center">Level Bonuses</h5>
                <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-200/50 shadow-sm">
                    ${item.stats.levels.map(lvl => `
                        <div class="flex items-start gap-3 p-3 text-xs">
                            <span class="font-black text-blue-600 whitespace-nowrap pt-0.5">Lv.${lvl.level}</span>
                            <span class="font-medium text-gray-700 leading-relaxed">${lvl.bonus[currentLang]}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // [6] 최종 HTML 조립
    let html = `
        <div class="px-6 pt-5 pb-2 text-center">
            <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                ${localizedRarity} | ${item.type[currentLang]} | 💰 ${item.cost}
            </p>
            <h2 class="text-2xl font-black text-blue-600 tracking-tight">${item.name[currentLang]}</h2>
        </div>

        <div class="px-6 py-4 bg-gray-50/50 border-y border-gray-100/50 my-3 flex flex-col items-center justify-center min-h-[120px]">
            ${topBadgeHtml}
            <div class="flex flex-col">${centerRowsHtml}</div>
            ${bottomBadgeHtml}
        </div>

        <div class="px-6 mb-6">
            <h5 class="text-[10px] font-black text-gray-300 uppercase mb-2 tracking-widest text-center">Base Stats</h5>
            <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-200/30 shadow-sm">
                ${item.stats.base.map(s => `
                    <div class="flex justify-between items-center p-3 text-xs">
                        <span class="text-gray-400 font-bold">${s.label[currentLang]}</span>
                        <span class="text-gray-900 font-black">${s.value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="px-6 pb-6 text-center">
            <div class="text-[13px] leading-relaxed text-gray-700 font-medium italic bg-blue-50/20 rounded-2xl p-4 border border-blue-50 shadow-sm">
                "${item.stats.bonus[currentLang]}"
            </div>
        </div>

        ${levelBonusHtml}
        
        <div class="pb-10"></div>
    `;

    // [7] DOM 삽입 및 열기 애니메이션 (PC 버그 수정 적용)
    const sheetContent = document.getElementById('sheet-content');
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('sheet-overlay');

    sheetContent.innerHTML = html;
    
    // 숨김 해제 후 애니메이션 시작
    overlay.classList.remove('hidden');
    sheet.classList.remove('hidden');
    void sheet.offsetWidth; // Force Reflow
    sheet.classList.add('show');
}
// =========================================
// [Builder Logic] 빌더 (안정성 강화 + 3 빈칸 무시 + 회전 기능)
// =========================================

const GRID_COLS = 9;
const GRID_ROWS = 6;
const CELL_SIZE = 40; 
let gridState = []; 
let placedItems = []; 
let draggedItemInfo = null;
let lastDragOverCell = null;
let listRotations = {}; // 리스트 아이템 회전 상태
let isRotationKeySetup = false; // 키보드 이벤트 중복 방지

/**
 * 빌더 초기화
 */
function initBuilder() {
    const gridEl = document.getElementById('builder-grid');
    const layerEl = document.getElementById('builder-layer');
    
    // DB 데이터나 그리드 요소가 없으면 중단 (에러 방지)
    if (!gridEl || !layerEl || !dbData) {
        console.warn("Builder init failed: Elements or DB missing");
        return;
    }

    gridEl.innerHTML = '';
    layerEl.innerHTML = '';
    
    gridState = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    placedItems = [];
    listRotations = {}; 

    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${GRID_COLS}, ${CELL_SIZE}px)`;
    gridEl.style.gridTemplateRows = `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`;
    gridEl.style.gap = '1px';

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'bg-[#6d4c41] border border-[#8d6e63]/30 rounded-sm transition-colors duration-150';
            cell.style.width = `${CELL_SIZE}px`;
            cell.style.height = `${CELL_SIZE}px`;
            cell.id = `cell-${r}-${c}`;
            
            cell.ondragover = (e) => handleDragOver(e, r, c);
            cell.ondrop = (e) => handleDrop(e, r, c);
            cell.ondragleave = () => handleDragLeave(); 

            gridEl.appendChild(cell);
        }
    }
    
    setupBuilderFilters();
    filterBuilderItems(); // 리스트 렌더링 시작
    setupRotationHotkey(); // 단축키 등록
}

/**
 * 드래그 중 'R'키 회전 (중복 등록 방지)
 */
function setupRotationHotkey() {
    if (isRotationKeySetup) return;
    
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'r' || e.key === 'R') && draggedItemInfo) {
            rotateDraggedItem();
        }
    });
    isRotationKeySetup = true;
}

/**
 * 드래그 아이템 회전 처리
 */
function rotateDraggedItem() {
    if (!draggedItemInfo) return;
    
    // Shape 회전
    draggedItemInfo.shape = rotateMatrixCW(draggedItemInfo.shape);
    draggedItemInfo.rotation = (draggedItemInfo.rotation + 90) % 360;
    
    // 중심점 재계산
    draggedItemInfo.offset = getShapeCenterOffset(draggedItemInfo.shape);

    // 현재 마우스 위치에서 하이라이트 즉시 갱신
    if (lastDragOverCell) {
        const { r, c } = lastDragOverCell;
        const startR = r - draggedItemInfo.offset.rOff;
        const startC = c - draggedItemInfo.offset.cOff;
        
        const isValid = canPlaceItem(startR, startC, draggedItemInfo.shape, draggedItemInfo.uniqueId);
        highlightCells(startR, startC, draggedItemInfo.shape, isValid);
    }
}

/**
 * 리스트 아이템 회전 토글
 */
function toggleListRotation(itemId, imgElement) {
    let currentRot = listRotations[itemId] || 0;
    currentRot = (currentRot + 90) % 360;
    listRotations[itemId] = currentRot;
    
    if (imgElement) {
        imgElement.style.transform = `rotate(${currentRot}deg)`;
    }
}

/**
 * 빌더 필터 설정 (안전한 접근)
 */
function setupBuilderFilters() {
    const heroSelect = document.getElementById('builder-filter-hero');
    const raritySelect = document.getElementById('builder-filter-rarity');
    const typeSelect = document.getElementById('builder-filter-type');
    const craftedSelect = document.getElementById('builder-filter-crafted');

    if (!heroSelect || !dbData || !heroData) return;

    heroSelect.innerHTML = `<option value="">${currentLang === 'ko' ? '영웅' : 'Hero'}</option>` +
        heroData.heroes.map(h => `<option value="${h.id}">${h.name[currentLang]}</option>`).join('');

    const rarities = { en: ["Rank", "Common", "Rare", "Epic", "Legendary", "Mythic", "Unique", "Relic"], ko: ["등급", "일반", "희귀", "에픽", "전설", "신화", "고유", "유물"] };
    raritySelect.innerHTML = rarities[currentLang].map((r, i) => `<option value="${i === 0 ? '' : rarities.en[i]}">${r}</option>`).join('');

    const typeMap = new Map();
    dbData.items.forEach(item => {
        if (!item.type) return;
        const enTypes = item.type.en.split(',').map(t => t.trim());
        const langTypes = item.type[currentLang].split(',').map(t => t.trim());
        enTypes.forEach((enT, index) => {
            if (!typeMap.has(enT)) {
                typeMap.set(enT, langTypes[index] || enT);
            }
        });
    });
    const sortedTypes = Array.from(typeMap.keys()).sort();
    let typeOptions = `<option value="">${currentLang === 'ko' ? '종류' : 'Type'}</option>`;
    sortedTypes.forEach(enKey => { typeOptions += `<option value="${enKey}">${typeMap.get(enKey)}</option>`; });
    typeSelect.innerHTML = typeOptions;

    const crafted = { en: ["Craft", "Yes", "No"], ko: ["조합", "예", "아니오"] };
    craftedSelect.innerHTML = crafted[currentLang].map((c, i) => `<option value="${i === 0 ? '' : (i === 1 ? 'true' : 'false')}">${c}</option>`).join('');
}

/**
 * 필터링 (옵셔널 체이닝으로 안전하게 값 가져오기)
 */
function filterBuilderItems() {
    // 요소가 없을 경우 빈 문자열 처리하여 에러 방지
    const searchTerm = document.getElementById('builder-search')?.value.toLowerCase() || '';
    const heroFilter = document.getElementById('builder-filter-hero')?.value || '';
    const rarityFilter = document.getElementById('builder-filter-rarity')?.value || '';
    const typeFilter = document.getElementById('builder-filter-type')?.value || '';
    const craftedFilter = document.getElementById('builder-filter-crafted')?.value || '';

    if (!dbData) return;

    const filtered = dbData.items.filter(item => {
        const matchesSearch = item.name[currentLang].toLowerCase().includes(searchTerm) ||
            item.name.en.toLowerCase().includes(searchTerm);
        const matchesHero = !heroFilter || item.hero === heroFilter;
        const matchesRarity = !rarityFilter || item.rarity === rarityFilter;
        let matchesType = true;
        if (typeFilter) {
            const itemTypes = item.type.en.split(',').map(t => t.trim());
            matchesType = itemTypes.includes(typeFilter);
        }
        const matchesCrafted = !craftedFilter || String(item.isCrafted) === craftedFilter;
        
        return matchesSearch && matchesHero && matchesRarity && matchesType && matchesCrafted;
    });

    renderBuilderItems(filtered);
}

/**
 * 리스트 렌더링
 */
function renderBuilderItems(items) {
    const listEl = document.getElementById('builder-item-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'relative bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-all active:scale-95 cursor-grab group h-36 select-none';
        el.draggable = true;
        
        const imgFileName = item.name.en.replace(/ /g, '_');
        const rarityText = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1);
        const rotation = listRotations[item.id] || 0;

        el.innerHTML = `
            <div class="absolute top-2 left-2 w-6 h-6 rounded-full overflow-hidden border border-gray-100 bg-gray-50 pointer-events-none">
                <img src="heroes/${item.hero}.png" class="w-full h-full object-cover" onerror="this.src='logo.png';">
            </div>
            <button class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-blue-500 transition-colors z-30 pointer-events-auto"
                    onclick="event.stopPropagation(); openItemDetail('${item.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="12" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            </button>
            <div class="w-16 h-16 flex items-center justify-center mt-2 pointer-events-none">
                <img src="items/${imgFileName}.webp" 
                     class="item-main-img max-w-full max-h-full object-contain filter drop-shadow-sm transition-transform duration-200" 
                     style="transform: rotate(${rotation}deg)"
                     onerror="this.src='logo.png'">
            </div>
            <div class="mt-2 text-center pointer-events-none w-full">
                <div class="text-[10px] font-bold text-gray-700 leading-tight truncate px-1 mx-auto w-24">${item.name[currentLang]}</div>
                <div class="text-[9px] text-gray-400 mt-0.5 font-medium">${rarityText} <span class="mx-0.5 text-gray-200"></div>
            </div>
        `;
        
        // 더블클릭/더블탭 회전 (PC/Mobile)
        el.onclick = () => toggleListRotation(item.id, el.querySelector('.item-main-img'));
        let lastTap = 0;
        el.ontouchend = (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                toggleListRotation(item.id, el.querySelector('.item-main-img'));
            }
            lastTap = currentTime;
        };

        el.ondragstart = (e) => {
            const currentRot = listRotations[item.id] || 0;
            let rotatedShape = item.layout.shape;
            
            // 리스트 상태에 맞춰 Shape 회전
            const rotateCount = (currentRot / 90) % 4;
            for(let i=0; i<rotateCount; i++) rotatedShape = rotateMatrixCW(rotatedShape);

            const offset = getShapeCenterOffset(rotatedShape);
            
            draggedItemInfo = { 
                source: 'list', 
                itemId: item.id, 
                offset: offset, 
                shape: rotatedShape, 
                rotation: currentRot 
            };
            
            e.dataTransfer.effectAllowed = 'copy';
            clearHighlights();

            const img = el.querySelector('.item-main-img');
            if (img) e.dataTransfer.setDragImage(img, img.offsetWidth / 2, img.offsetHeight / 2);
        };

        el.ondragend = () => { draggedItemInfo = null; clearHighlights(); };
        listEl.appendChild(el);
    });
}

/**
 * 드래그 오버
 */
function handleDragOver(e, r, c) {
    e.preventDefault();
    lastDragOverCell = { r, c };
    if (!draggedItemInfo) return;

    const startR = r - draggedItemInfo.offset.rOff;
    const startC = c - draggedItemInfo.offset.cOff;
    const isValid = canPlaceItem(startR, startC, draggedItemInfo.shape, 
                                 draggedItemInfo.source === 'grid' ? draggedItemInfo.uniqueId : null);
    
    highlightCells(startR, startC, draggedItemInfo.shape, isValid);
}

function handleDragLeave() {
    lastDragOverCell = null;
    clearHighlights();
}

/**
 * 드롭
 */
function handleDrop(e, r, c) {
    e.preventDefault();
    clearHighlights();
    lastDragOverCell = null;
    if (!draggedItemInfo) return;

    const item = dbData.items.find(i => i.id === draggedItemInfo.itemId);
    const startR = r - draggedItemInfo.offset.rOff;
    const startC = c - draggedItemInfo.offset.cOff;

    if (canPlaceItem(startR, startC, draggedItemInfo.shape, draggedItemInfo.source === 'grid' ? draggedItemInfo.uniqueId : null)) {
        if (draggedItemInfo.source === 'grid') removeItem(draggedItemInfo.uniqueId);
        placeItemOnGrid(item, startR, startC, draggedItemInfo.shape, draggedItemInfo.rotation);
    }
    draggedItemInfo = null;
}

/**
 * 충돌 검사 (★ '3'은 무시)
 */
function canPlaceItem(r, c, shape, ignoreId = null) {
    const rows = shape.length;
    const cols = shape[0].length;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cellType = shape[i][j];
            if (cellType === 3) continue; // 3은 무시

            const targetR = r + i;
            const targetC = c + j;

            // 격자 범위 검사 (1과 0만)
            if (targetR < 0 || targetR >= GRID_ROWS || targetC < 0 || targetC >= GRID_COLS) return false;

            // 충돌 검사 (1만)
            if (cellType === 1) {
                const occupant = gridState[targetR][targetC];
                if (occupant !== null && occupant !== ignoreId) return false;
            }
        }
    }
    return true;
}

/**
 * 하이라이트 ('3'은 무시)
 */
function highlightCells(startR, startC, shape, isValid) {
    clearHighlights(); 
    const rows = shape.length;
    const cols = shape[0].length;
    const bodyRingClass = isValid ? 'ring-green-400' : 'ring-red-400';
    const buffRingClass = 'ring-yellow-300';

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cellType = shape[i][j];
            if (cellType === 3) continue;

            const r = startR + i;
            const c = startC + j;
            const cell = document.getElementById(`cell-${r}-${c}`);
            
            if (cell) {
                if (cellType == 1) {
                    cell.classList.add('ring-2', bodyRingClass, 'z-10');
                    cell.style.backgroundColor = isValid ? 'rgba(74, 222, 128, 0.6)' : 'rgba(248, 113, 113, 0.6)';
                } else if (cellType == 0) {
                    cell.classList.add('ring-2', buffRingClass, 'z-0');
                    cell.style.backgroundColor = 'rgba(253, 224, 71, 0.4)';
                }
            }
        }
    }
}

/**
 * 아이템 배치 (휠/더블탭 회전 포함)
 */
// =========================================
// [Fix] 이미지 회전 시 축소 문제 해결을 위한 스타일 생성 함수
// =========================================
function getImageStyle(w, h, rotation) {
    const deg = rotation % 360;
    const isSideways = Math.abs(deg) === 90 || Math.abs(deg) === 270;

    // 90도나 270도 회전 시:
    // 이미지가 담길 '그릇'은 가로가 길지만, 이미지 자체는 세로로 길게 잡아야
    // 회전했을 때 딱 맞게 들어갑니다. 따라서 w와 h를 바꿔서 적용합니다.
    if (isSideways) {
        return `
            width: ${h}px; 
            height: ${w}px; 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%) rotate(${deg}deg);
        `;
    } else {
        // 0도나 180도 (정방향): 그냥 꽉 채우면 됩니다.
        return `
            width: ${w}px; 
            height: ${h}px; 
            transform: rotate(${deg}deg);
        `;
    }
}

/**
 * 아이템 배치 (CSS 수정됨)
 */
function placeItemOnGrid(item, r, c, shape = null, rotation = 0) {
    const currentShape = shape || item.layout.shape;
    const uniqueId = Date.now().toString() + Math.random().toString(36).substr(2, 5);

    // 격자 점유 (3 제외)
    const rows = currentShape.length;
    const cols = currentShape[0].length;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (currentShape[i][j] == 1) gridState[r + i][c + j] = uniqueId;
        }
    }

    // Bounding Box 계산
    let minR = rows, maxR = -1, minC = cols, maxC = -1, hasOne = false;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (currentShape[i][j] !== 3) { 
                hasOne = true;
                minR = Math.min(minR, i); maxR = Math.max(maxR, i);
                minC = Math.min(minC, j); maxC = Math.max(maxC, j);
            }
        }
    }
    if (!hasOne) { minR = 0; maxR = rows - 1; minC = 0; maxC = cols - 1; }
    
    const realRows = maxR - minR + 1;
    const realCols = maxC - minC + 1;

    // 컨테이너의 실제 픽셀 크기
    const containerW = realCols * (CELL_SIZE + 1) - 1;
    const containerH = realRows * (CELL_SIZE + 1) - 1;

    const layer = document.getElementById('builder-layer');
    const imgFileName = item.name.en.replace(/ /g, '_');
    
    // ★ [수정] 이미지 스타일 계산 (회전 시 w, h 스왑 적용)
    const imgStyle = getImageStyle(containerW, containerH, rotation);

    const el = document.createElement('div');
    el.className = 'absolute cursor-grab active:cursor-grabbing group hover:z-20 transition-all duration-200 pointer-events-auto flex items-center justify-center'; 
    el.style.top = `${(r + minR) * (CELL_SIZE + 1)}px`;
    el.style.left = `${(c + minC) * (CELL_SIZE + 1)}px`;
    el.style.width = `${containerW}px`;
    el.style.height = `${containerH}px`;

    // ★ [수정] img 태그에 w-full h-full 제거하고 계산된 style 적용
    el.innerHTML = `
        <img src="items/${imgFileName}.webp" 
             style="${imgStyle}" 
             class="object-contain filter drop-shadow-md select-none pointer-events-none transition-transform duration-200" 
             onerror="this.src='logo.png'">
             
        <button onmousedown="event.stopPropagation()" onclick="removeItem('${uniqueId}')" 
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-pointer hover:scale-110 border border-white/30">
            <span class="font-bold text-[10px] leading-none pointer-events-none">X</span>
        </button>
    `;
    
    el.draggable = true;
    el.ondragstart = (e) => {
        const offset = getShapeCenterOffset(currentShape);
        draggedItemInfo = { source: 'grid', itemId: item.id, uniqueId: uniqueId, r: r, c: c, offset: offset, shape: currentShape, rotation: rotation };
        e.dataTransfer.effectAllowed = 'move';
        const img = el.querySelector('img');
        if (img) e.dataTransfer.setDragImage(img, img.offsetWidth / 2, img.offsetHeight / 2);
        setTimeout(() => el.classList.add('opacity-50'), 0);
    };
    el.ondragend = () => {
        el.classList.remove('opacity-50');
        if (draggedItemInfo && draggedItemInfo.source === 'grid') removeItem(draggedItemInfo.uniqueId);
        draggedItemInfo = null;
        clearHighlights();
    };

    // 휠/더블탭 이벤트
    el.onwheel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dir = e.deltaY > 0 ? 'cw' : 'ccw';
        rotateItem(uniqueId, dir);
    };
    let lastTap = 0;
    el.ontouchend = (e) => {
        const currentTime = new Date().getTime();
        if (currentTime - lastTap < 300) { e.preventDefault(); rotateItem(uniqueId, 'cw'); }
        lastTap = currentTime;
    };
    el.onclick = (e) => { rotateItem(uniqueId, 'cw'); }; // 원클릭 회전

    el.id = `item-${uniqueId}`;
    layer.appendChild(el);
    placedItems.push({ id: uniqueId, itemId: item.id, r, c, shape: currentShape, rotation: rotation });
}

/**
 * 아이템 DOM 업데이트 (회전 시 스타일 재계산)
 */
function updateItemDOM(uniqueId, r, c, shape, rotation) {
    const el = document.getElementById(`item-${uniqueId}`);
    const imgEl = el.querySelector('img');
    if (!el || !imgEl) return;
    
    // Bounding Box 재계산
    const rows = shape.length;
    const cols = shape[0].length;
    let minR = rows, maxR = -1, minC = cols, maxC = -1, hasOne = false;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (shape[i][j] !== 3) { 
                hasOne = true;
                minR = Math.min(minR, i); maxR = Math.max(maxR, i);
                minC = Math.min(minC, j); maxC = Math.max(maxC, j);
            }
        }
    }
    if (!hasOne) { minR = 0; maxR = rows - 1; minC = 0; maxC = cols - 1; }
    
    const containerW = (maxC - minC + 1) * (CELL_SIZE + 1) - 1;
    const containerH = (maxR - minR + 1) * (CELL_SIZE + 1) - 1;

    // 컨테이너 위치/크기 업데이트
    el.style.width = `${containerW}px`;
    el.style.height = `${containerH}px`;
    el.style.top = `${(r + minR) * (CELL_SIZE + 1)}px`;
    el.style.left = `${(c + minC) * (CELL_SIZE + 1)}px`;
    
    // ★ [수정] 이미지 스타일 재계산 (Swap 적용)
    // 기존 transform만 바꾸는 방식에서 style 전체를 덮어쓰는 방식으로 변경
    imgEl.style.cssText = getImageStyle(containerW, containerH, rotation);
}

function rotateItem(uniqueId, dir) {
    const itemData = placedItems.find(p => p.id === uniqueId);
    if (!itemData) return;
    const newShape = dir === 'cw' ? rotateMatrixCW(itemData.shape) : rotateMatrixCCW(itemData.shape);
    const newRotation = itemData.rotation + (dir === 'cw' ? 90 : -90);

    // 기존 점유 해제
    for(let i=0; i<GRID_ROWS; i++) {
        for(let j=0; j<GRID_COLS; j++) {
            if(gridState[i][j] === uniqueId) gridState[i][j] = null;
        }
    }

    if (canPlaceItem(itemData.r, itemData.c, newShape)) {
        itemData.shape = newShape;
        itemData.rotation = newRotation;
        
        const rows = newShape.length;
        const cols = newShape[0].length;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (newShape[i][j] == 1) gridState[itemData.r + i][itemData.c + j] = uniqueId;
            }
        }
        updateItemDOM(uniqueId, itemData.r, itemData.c, newShape, newRotation);
    } else {
        // 복구
        const oldShape = itemData.shape;
        for (let i = 0; i < oldShape.length; i++) {
            for (let j = 0; j < oldShape[0].length; j++) {
                if (oldShape[i][j] == 1) gridState[itemData.r + i][itemData.c + j] = uniqueId;
            }
        }
    }
}

function removeItem(uniqueId) {
    for(let i=0; i<GRID_ROWS; i++){
        for(let j=0; j<GRID_COLS; j++){
            if(gridState[i][j] === uniqueId) gridState[i][j] = null;
        }
    }
    const el = document.getElementById(`item-${uniqueId}`);
    if (el) el.remove();
    placedItems = placedItems.filter(p => p.id !== uniqueId);
}

function clearHighlights() {
    document.querySelectorAll('[id^="cell-"]').forEach(cell => {
        cell.classList.remove('ring-2', 'ring-green-400', 'ring-red-400', 'ring-yellow-300', 'z-10', 'z-0');
        cell.style.backgroundColor = '';
    });
}

function getShapeCenterOffset(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    let minR = rows, maxR = -1, minC = cols, maxC = -1, hasOne = false;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (shape[i][j] !== 3) { 
                hasOne = true;
                minR = Math.min(minR, i); maxR = Math.max(maxR, i);
                minC = Math.min(minC, j); maxC = Math.max(maxC, j);
            }
        }
    }
    if (!hasOne) return { rOff: 0, cOff: 0 };
    return { rOff: Math.round((minR + maxR) / 2), cOff: Math.round((minC + maxC) / 2) };
}

function rotateMatrixCW(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) newMatrix[c][rows - 1 - r] = matrix[r][c];
    return newMatrix;
}

function rotateMatrixCCW(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) newMatrix[cols - 1 - c][r] = matrix[r][c];
    return newMatrix;
}

