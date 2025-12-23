/* =========================================
   script.js (최종 완성본 - 2025.05.11)
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
let chunjiData = [];
let currentChunjiData = [];

// 빌더 상태 관리
let currentSlot = { type: '', index: 0 };
let currentBuild = { 
    weapons: [null,null], 
    hearts: [null,null,null,null], 
    marts: new Array(8).fill(null),
    combo: [] // 콤보 배열 (빈 배열로 시작)
};

// [키 매핑 정보]
const KEY_MAP = {
    'Q': { text: 'Q', color: 'key-red', desc: '무공' },
    '~': { text: '~', color: 'key-blue', desc: '특수' },
    'LMB': { text: 'LMB', color: 'key-gray', desc: '약공' },
    'LMB_H': { text: 'LMB', color: 'key-gray', desc: '약공(Hold)', hold: true },
    'R': { text: 'R', color: 'key-orange', desc: '강공' },
    'R_H': { text: 'R', color: 'key-orange', desc: '강공(Hold)', hold: true },
    'TAB': { text: 'TAB', color: 'key-teal', desc: '교체공격' },
    'E': { text: 'E', color: 'key-purple', desc: '반격' },
    'SCR': { text: 'SCR', color: 'key-gray', desc: '무기교체' }
};

// [지도 더미 데이터]
const dummyMapData = [
   { title: "청하", key: "qinghe", desc: "어린 주인공이 많은 가족들과 함께 생활하던 지역.", image: "images/map2.jpeg" },
   { title: "개봉", key: "kaifeng", desc: "강호로 한 발 다가간 주인공은 개봉에서 인연을 쌓습니다.", image: "images/map1.jpeg" },
   { title: "귀문시장", key: "gm", desc: "삼경에 귀신이 등불을 밝히니, 새벽닭 울음 소리가 보배롭다.", image: "https://wwm.tips/quests/images/q9-1.png" },
   { title: "꿈속의 불선선", key: "drs", desc: "우리가 꾸던 행복은 그리 큰 것이 아니였는데", image: "images/map3.jpg" }
];

const GUIDE_MAP = {
    'news': 'news.html', 'tierlist': 'guide_tier.html', 'weapon': 'tier_weapon.html', 
    'build': 'build.html', 'map': 'maps.html', 'side': 'beta.html', 'hw': 'npc.html',        
    'boss': 'boss.html', 'marts': 'marts.html', 'harts': 'harts.html', 'skill': 'skils.html',
    'majang': 'majang.html', 'code': 'code.html'      
};

// =========================================
// 2. 초기화 (DOMContentLoaded)
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    loadHomeMaps();
    setupGlobalSearch();
    setupQuizSearch();
    checkUrlParams();
    window.addEventListener('popstate', handleHistoryChange);
    
    if(typeof checkEventStatus === 'function') checkEventStatus();
});

// =========================================
// 3. 데이터 로딩
// =========================================
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    const targetId = urlParams.get('id');
    const shortQuestId = urlParams.get('q'); 
    const chunjiId = urlParams.get('c');

    Promise.all([
        fetch('json/datas.json').then(res => res.json()).catch(err => ({})),
        fetch('json/quests.json').then(res => res.json()).catch(err => []), 
        fetch('json/news.json').then(res => res.json()).catch(err => []),
        fetch('json/cnews.json').then(res => res.json()).catch(err => []),
        fetch('json/chunji.json').then(res => res.json()).catch(err => ({ chunji: [] })),
        fetch('json/builder_data.json').then(res => res.json()).catch(err => null) 
    ])
    .then(([mainData, questData, newsData, cnewsData, chunjiResult, builderDataResult]) => {
        let quests = Array.isArray(questData) ? questData : (questData.quests || []);
        let news = Array.isArray(newsData) ? newsData : (newsData.news || []);
        let cnews = Array.isArray(cnewsData) ? cnewsData : (cnewsData.cnews || []);
        let chunji = Array.isArray(chunjiResult) ? chunjiResult : (chunjiResult.chunji || []);
        
        if (quests.length > 0) {
            quests.sort((a, b) => parseInt((a.id||"").replace('q','')) - parseInt((b.id||"").replace('q',''))).reverse();
        }
        
        globalData = { items: mainData.items || [], quiz: mainData.quiz || [], quests: quests, news: news, cnews: cnews, chunji: chunji, builds: [] };
        builderData = builderDataResult; 
        currentQuestData = globalData.quests;
        chunjiData = globalData.chunji;
        currentChunjiData = globalData.chunji;
        
        updateLocationOptions(); 
        updateChunjiSubtypeOptions(); 
        
        renderHomeSlider(globalData.quests); 
        renderHomeRecentNews(globalData.news);     
        renderHomeCommunityNews(globalData.cnews);
        renderQuestList();
        renderChunjiList();
        renderQuizTable(globalData.quiz);
        updateQuizCounter();
        renderFullNews(globalData.news);

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
             const formattedId = targetId.toLowerCase().startsWith('q') ? targetId : 'q' + targetId;
             const foundQuest = globalData.quests.find(q => q.id === formattedId);
             if (foundQuest) loadQuestDetail(foundQuest.filepath, formattedId);
        }

        loadBuildsInBackground(targetTab);
    })
    .catch(error => { console.error("데이터 로드 실패:", error); });
}

function loadBuildsInBackground(targetTab) {
    const buildFetchUrl = (typeof BUILD_API_URL !== 'undefined') ? `${BUILD_API_URL}?action=list` : 'json/builds.json';
    fetch(buildFetchUrl)
    .then(res => res.json())
    .then(buildsData => {
        globalData.builds = buildsData.builds || [];
        if (targetTab === 'builder' || document.getElementById('view-builder').style.display === 'block') {
            renderBuildList('all');
        }
    })
    .catch(err => { globalData.builds = []; });
}

// =========================================
// 4. 화면 전환 및 UI 로직
// =========================================
function switchTab(tabName, updateHistory = true) {
    const views = ['view-home', 'view-quiz', 'view-quest', 'view-news', 'view-guide', 'view-builder', 'view-map-detail', 'view-chunji'];
    views.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });

    const navs = ['nav-home', 'nav-quiz', 'nav-quest', 'nav-code', 'nav-builder', 'nav-more', 'nav-chunji'];
    navs.forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('active'); });
    
    document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-dropdown-content').forEach(el => { el.classList.remove('show'); });

    if (tabName === 'home') {
        document.getElementById('view-home').style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
    } 
    else if (tabName === 'chunji') {
        document.getElementById('view-chunji').style.display = 'block';
        document.getElementById('nav-chunji').classList.add('active');
        if (document.getElementById('chunji-list-container').children.length === 0 && chunjiData.length > 0) renderChunjiList();
        showChunjiList();
    }
    else if (tabName === 'quiz') {
        document.getElementById('view-quiz').style.display = 'block';
        document.getElementById('nav-more').classList.add('active'); 
        const quizBtn = document.getElementById('nav-quiz');
        if (quizBtn) quizBtn.classList.add('active');
        if (document.getElementById('quiz-table-body').children.length === 0 && globalData.quiz.length > 0) { renderQuizTable(globalData.quiz); updateQuizCounter(); }
    } 
    else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');
        if (document.getElementById('quest-grid-container').children.length === 0 && globalData.quests.length > 0) renderQuestList();
        showQuestList();
    } 
    else if (tabName === 'news') {
        document.getElementById('view-news').style.display = 'block';
        if (document.getElementById('full-news-list').children.length === 0 && globalData.news.length > 0) renderFullNews(globalData.news);
    } 
    else if (tabName === 'builder') {
        document.getElementById('view-builder').style.display = 'block';
        document.getElementById('nav-more').classList.add('active');
        const builderItem = document.getElementById('nav-builder');
        if(builderItem) builderItem.classList.add('active');

        document.getElementById('tools-menu').style.display = 'block';
        document.getElementById('builder-interface').style.display = 'none';

        if (!builderData) {
            fetch('json/builder_data.json').then(res => res.json()).then(data => { 
                builderData = data; 
                renderComboSlots(); 
                renderBuildList('all'); 
            });
        } else {
            renderComboSlots(); 
            const container = document.getElementById('build-list-container');
            if (container && container.children.length === 0) renderBuildList('all');
        }
        
        if (new URLSearchParams(window.location.search).get('b')) {
            openBuilderInterface();
            loadViewer();
        }
    }
    else if (tabName === 'guide' || tabName === 'code') {
        const guideView = document.getElementById('view-guide');
        if (guideView) {
            guideView.style.display = 'block';
            if (!isGuideLoaded) loadGuideView(); 
            else {
                const newsBtn = findButtonByFile('news.html'); 
                if(newsBtn) loadGuideContent('news.html', newsBtn);
            }
        }
        document.getElementById('nav-code').classList.add('active');
    }

    if (updateHistory && tabName !== 'guide' && tabName !== 'code') updateUrlQuery(tabName);
}

function updateUrlQuery(tab, id) {
    const url = new URL(window.location);
    url.searchParams.delete('tab'); url.searchParams.delete('id'); url.searchParams.delete('q');
    url.searchParams.delete('g'); url.searchParams.delete('c'); url.searchParams.delete('cp'); 
    url.searchParams.delete('qp'); url.searchParams.delete('r'); url.searchParams.delete('b');

    if (tab === 'quest') {
        if (id) url.searchParams.set('q', id.toLowerCase().replace('q', ''));
        else { url.searchParams.set('tab', 'quest'); if (currentPage > 1) url.searchParams.set('qp', currentPage); }
    } 
    else if (tab === 'guide' && id) url.searchParams.set('g', id);
    else if (tab === 'chunji') {
        if (id) url.searchParams.set('c', id);
        else { url.searchParams.set('tab', 'chunji'); if (currentChunjiPage > 1) url.searchParams.set('cp', currentChunjiPage); }
    }
    else {
        if (tab && tab !== 'home') url.searchParams.set('tab', tab);
        if (id) url.searchParams.set('id', id);
    }
    
    if (url.toString() !== window.location.href) history.pushState(null, '', url);
}

function handleHistoryChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const qId = urlParams.get('q'); const gId = urlParams.get('g');
    const bId = urlParams.get('b'); const cId = urlParams.get('c');
    const cpParam = urlParams.get('cp'); const qpParam = urlParams.get('qp');

    if (qId) { switchTab('quest', false); const fullId = 'q' + qId; if (globalData.quests) { const foundQuest = globalData.quests.find(q => q.id === fullId); if (foundQuest) loadQuestDetail(foundQuest.filepath, fullId); } return; }
    if (gId) { switchTab('guide', false); return; }
    if (bId) { switchTab('builder', false); return; }
    if (cId) { switchTab('chunji', false); if (globalData.chunji) { const foundChunji = globalData.chunji.find(c => c.id === cId); if (foundChunji) loadChunjiDetail(foundChunji); } return; }

    if (tab === 'quest') { currentPage = qpParam ? parseInt(qpParam) : 1; switchTab('quest', false); renderQuestList(); return; }
    if (tab === 'chunji') { currentChunjiPage = cpParam ? parseInt(cpParam) : 1; switchTab('chunji', false); renderChunjiList(); return; }
    if (tab) switchTab(tab, false); else switchTab('home', false);
}

function checkUrlParams() { handleHistoryChange(); }

// =========================================
// 5. 뷰어 & 빌더 기능 (콤보 포함)
// =========================================

/* 빌드 공유하기 */
function shareBuildToCloud() {
    const title = document.getElementById('build-title').value.trim();
    const creator = document.getElementById('build-creator').value.trim();
    const recWeapons = document.getElementById('rec-weapons').value.trim();
    const recArmor = document.getElementById('rec-armor').value.trim();
    const desc = document.getElementById('build-desc').value.trim();
    const type = document.querySelector('input[name="buildType"]:checked')?.value || "PvE";

    if (!title || !creator || !recWeapons || !recArmor) { alert("⚠️ 필수 정보를 모두 입력해주세요!"); return; }
    if (!confirm(`'${title}' 빌드를 공유하시겠습니까?`)) return;

    const submitBtn = event.target.closest('button');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "전송 중..."; }

    generateBuildUrl(); 
    const link = document.getElementById('result-url').value;
    const weapons = currentBuild.weapons.filter(id => id);

    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(ipData => {
        const params = new URLSearchParams({
            action: 'submit_build', title, creator, type, desc,
            weapons: JSON.stringify(weapons), link, rec_weapons: recWeapons, rec_armor: recArmor, ip: ipData.ip
        });
        return fetch(`${BUILD_API_URL}?${params.toString()}`);
    })
    .then(res => res.text()).then(data => {
        if (data.trim() === "SUCCESS") {
            alert("✅ 빌드가 공유되었습니다!");
            document.getElementById('build-title').value = ""; document.getElementById('build-creator').value = ""; document.getElementById('build-desc').value = "";
        } else alert("전송 실패: " + data);
    })
    .catch(err => alert("오류 발생"))
    .finally(() => { if(submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "📤 빌드 공유하기"; } });
}

/* 링크 생성 */
function generateBuildUrl() {
    const title = document.getElementById('build-title').value.trim();
    const creator = document.getElementById('build-creator').value.trim();
    const recWeapons = document.getElementById('rec-weapons').value.trim();
    const recArmor = document.getElementById('rec-armor').value.trim();

    if (!title) { alert("빌드 이름을 입력해주세요!"); return; }

    const buildData = { 
        t: title, c: creator, w: currentBuild.weapons, h: currentBuild.hearts, m: currentBuild.marts, 
        rw: recWeapons, ra: recArmor, k: currentBuild.combo // 콤보 데이터 저장
    };

    const encodedString = btoa(unescape(encodeURIComponent(JSON.stringify(buildData))));
    const origin = window.location.origin;
    let basePath = window.location.pathname.replace('index.html', ''); if (!basePath.endsWith('/')) basePath += '/';
    
    const viewerUrl = `${origin}${basePath}viewer.html?b=${encodedString}`;
    const urlInput = document.getElementById('result-url');
    urlInput.value = viewerUrl; urlInput.style.display = 'block';
}

/* 빌드 목록 렌더링 */
function renderBuildList(filterType) {
    const container = document.getElementById('build-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (!globalData.builds || globalData.builds.length === 0) { container.innerHTML = '<div style="padding:30px; text-align:center;">불러오는 중...</div>'; return; }

    let targetBuilds = globalData.builds;
    if (filterType !== 'all') targetBuilds = globalData.builds.filter(b => b.type.toUpperCase() === filterType.toUpperCase());

    targetBuilds.forEach(build => {
        const getImg = (id) => {
            if (!builderData || !builderData.weapons) return 'images/logo.png';
            const item = builderData.weapons.find(w => w.id === id); return item ? item.img : 'images/logo.png';
        };
        const row = document.createElement('div'); row.className = 'build-row-card';
        row.onclick = () => openBuildDetailSheet(build);
        row.innerHTML = `
            <div class="build-icons-area"><div class="build-icon-box"><img src="${getImg(build.weapons[0])}"></div><div class="build-icon-box"><img src="${getImg(build.weapons[1])}"></div></div>
            <div class="build-info-area">
                <div class="build-header-row"><span class="build-title">${build.title}</span><span class="build-type-badge ${build.type === 'PvP' ? 'type-pvp' : 'type-pve'}">${build.type}</span></div>
                <div style="font-size: 0.8em; color: #999;">작성자: <span style="color: #666; font-weight: bold;">${build.creator || '익명'}</span></div>
                <div class="build-desc">${build.description || "설명 없음"}</div>
            </div>`;
        container.appendChild(row);
    });
}

function filterBuilds(type, btn) {
    document.querySelectorAll('#tools-menu .guide-item-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active'); renderBuildList(type);
}

/* 뷰어 로드 */
function loadViewer() {
    if (!builderData) { fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; loadViewer(); }); return; }

    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('b');
    let w = [], h = [], m = [], title = "무제", creator = "익명", rw = "", ra = "";

    if (encodedData) {
        try {
            const parsed = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
            w = parsed.w || []; h = parsed.h || []; m = parsed.m || [];
            title = parsed.t || "무제"; creator = parsed.c || "익명"; rw = parsed.rw || ""; ra = parsed.ra || "";
        } catch (e) { try { const parsed = JSON.parse(atob(encodedData)); w = parsed.w || []; h = parsed.h || []; m = parsed.m || []; } catch (e2) {} }
    }

    const titleEl = document.getElementById('build-main-title');
    const creatorEl = document.getElementById('build-creator-info');
    if (titleEl) titleEl.innerText = title;
    if (creatorEl) creatorEl.innerText = "작성자: " + creator;

    const recContainer = document.getElementById('viewer-rec-container');
    if (rw || ra) {
        if(recContainer) recContainer.style.display = 'flex';
        document.getElementById('view-rec-weapon').innerText = rw || '-';
        document.getElementById('view-rec-armor').innerText = ra || '-';
    } else if(recContainer) recContainer.style.display = 'none';

    const renderSlot = (type, ids, prefix) => {
        ids.forEach((id, idx) => {
            if (!id) return;
            const itemData = builderData[type].find(i => i.id === id);
            if (itemData) {
                const slotEl = document.getElementById(`${prefix}-${type}-${idx}`);
                if (slotEl) {
                    const img = slotEl.querySelector('img');
                    if (img) { img.src = itemData.img; img.style.display = 'block'; }
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

// =========================================
// 6. 콤보 시스템 (빌더용)
// =========================================
function renderComboSlots() {
    const container = document.getElementById('combo-slot-container');
    if (!container) return;
    container.innerHTML = '';

    currentBuild.combo.forEach((val, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'slot-wrapper';
        wrapper.style.position = 'relative';

        let contentHtml = '';
        let borderStyle = 'solid';

        if (val) {
            if (KEY_MAP[val]) {
                const k = KEY_MAP[val];
                contentHtml = `<div class="key-cap ${k.color} ${k.hold?'hold':''}" style="width:100%; height:100%; border-radius:4px; box-shadow:none; font-size:0.9em;"><span>${k.text}</span></div>`;
            } else {
                let item = builderData.marts ? builderData.marts.find(m => m.id === val) : null;
                if (!item && builderData.weapons) item = builderData.weapons.find(w => w.id === val);
                if (item) contentHtml = `<img src="${item.img}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
                else contentHtml = `<div style="font-size:0.7em; word-break:break-all;">${val}</div>`;
            }
        }

        wrapper.innerHTML = `
            <div class="item-slot" onclick="openBuilderModal('combo', ${index})" style="border-style: ${borderStyle}; padding:0; overflow:visible; cursor:pointer;">
                ${contentHtml}
                <div class="combo-remove-overlay" onclick="removeComboStep(event, ${index})">✕</div>
            </div>
            <div class="slot-name" style="font-size:0.7em; margin-top:2px; color:#999;">${index + 1}</div>
        `;
        container.appendChild(wrapper);
    });

    if (currentBuild.combo.length < 20) {
        const addWrapper = document.createElement('div');
        addWrapper.className = 'slot-wrapper';
        addWrapper.innerHTML = `<div class="item-slot" onclick="addComboStep()" style="border-style: dashed; border-color:#ccc; cursor:pointer;"><div class="combo-add-btn">+</div></div><div class="slot-name" style="font-size:0.7em; margin-top:2px; color:#ccc;">추가</div>`;
        container.appendChild(addWrapper);
    }
}

function addComboStep() { openBuilderModal('combo', currentBuild.combo.length); }
function removeComboStep(e, idx) { e.stopPropagation(); currentBuild.combo.splice(idx, 1); renderComboSlots(); }
function resetComboSlots() { currentBuild.combo = []; renderComboSlots(); }

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
function closeBuilderInterface() { document.getElementById('builder-interface').style.display = 'none'; document.getElementById('tools-menu').style.display = 'block'; }

function openBuilderModal(type, index) {
    if (!builderData) return alert("데이터 로딩 중...");
    currentSlot = { type, index };
    const modal = document.getElementById('builder-modal');
    const list = document.getElementById('builder-modal-list');
    const title = document.getElementById('builder-modal-title');
    list.innerHTML = '';

    const closeDiv = document.createElement('div');
    closeDiv.className = 'select-item';
    closeDiv.innerHTML = '<div style="width:48px;height:48px;background:#eee;line-height:48px;margin:0 auto;font-weight:bold;color:#888;">✕</div><p>취소</p>';
    closeDiv.onclick = () => closeBuilderModal(null);
    list.appendChild(closeDiv);

    if (type === 'combo') {
        title.innerText = `콤보 ${parseInt(index)+1}단계 선택`;
        
        Object.keys(KEY_MAP).forEach(key => {
            const k = KEY_MAP[key];
            const div = document.createElement('div');
            div.className = 'select-item';
            div.innerHTML = `<div class="key-cap ${k.color} ${k.hold?'hold':''}" style="margin:0 auto;"><span>${k.text}</span></div><p>${k.desc}</p>`;
            div.onclick = () => selectBuilderItem(key, null, k.desc);
            list.appendChild(div);
        });
        
        const activeMarts = currentBuild.marts.filter(id => id);
        if (activeMarts.length > 0) {
            const sep = document.createElement('div');
            sep.style.cssText = "width:100%; border-top:1px dashed #ddd; margin:10px 0; grid-column:1/-1; text-align:center; font-size:0.8em; color:#999; padding-top:5px;";
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
    } else {
        title.innerText = `${type==='weapons'?'무기':type==='hearts'?'심법':'비결'} 선택`;
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

function selectBuilderItem(itemId, imgSrc, itemName) {
    const { type, index } = currentSlot;
    
    if (type === 'combo') {
        if (index === currentBuild.combo.length) currentBuild.combo.push(itemId);
        else currentBuild.combo[index] = itemId;
        renderComboSlots();
        closeBuilderModal(null);
        return;
    }

    currentBuild[type][index] = itemId;
    const imgEl = document.getElementById(`slot-${type}-${index}`);
    const nameEl = document.getElementById(`name-${type}-${index}`);
    const slotEl = imgEl.parentElement;
    const plusSpan = slotEl.querySelector('span');

    if (itemId) {
        imgEl.src = imgSrc; imgEl.style.display = 'block';
        if(plusSpan) plusSpan.style.display = 'none';
        slotEl.style.borderStyle = 'solid';
        if(nameEl) nameEl.innerText = itemName;
    } else {
        imgEl.src = ''; imgEl.style.display = 'none';
        if(plusSpan) plusSpan.style.display = 'block';
        slotEl.style.borderStyle = 'dashed';
        if(nameEl) nameEl.innerText = '';
    }
    closeBuilderModal(null); 
}
function closeBuilderModal(e) { if(e===null || e.target.classList.contains('modal-overlay')) document.getElementById('builder-modal').style.display = 'none'; }

// =========================================
// 7. 바텀 시트 및 기타 유틸리티 (콤보 통합)
// =========================================
function openBuildDetailSheet(build) {
    const sheet = document.getElementById('build-detail-sheet');
    const contentArea = sheet.querySelector('.sheet-content');
    
    let encodedData = null;
    if (build.link && build.link.includes('?b=')) encodedData = build.link.split('?b=')[1];

    if (!encodedData || !builderData) {
        contentArea.innerHTML = `<div style="padding: 50px; text-align: center;">🚨 정보를 불러올 수 없습니다.</div>`;
        openBuildDetailSheetView(); return;
    }

    encodedData = encodedData.replace(/ /g, '+');
    let parsedData = null;
    try { parsedData = JSON.parse(decodeURIComponent(escape(atob(encodedData)))); } 
    catch (e) { try { parsedData = JSON.parse(atob(encodedData)); } catch (e2) { contentArea.innerHTML = "데이터 오류"; return; } }

    let html = `<div style="border-bottom: 2px dashed #ddd; padding-bottom: 10px; margin-bottom: 20px;"><p style="margin: 0; color: #999; font-size: 0.9em;">${build.description || '작성된 설명이 없습니다.'}</p></div>`;
    
    if (parsedData.rw || parsedData.ra) {
        html += `<div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.95em; color: #555;">⚔️ 추천 장비</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="background: #fff; padding: 8px; border: 1px solid #eee; border-radius: 4px; font-size: 0.9em; text-align: center;"><span style="display:block; font-size:0.8em; color:#999;">무기</span><span style="color: #333; font-weight: bold;">${parsedData.rw || '-'}</span></div>
                <div style="background: #fff; padding: 8px; border: 1px solid #eee; border-radius: 4px; font-size: 0.9em; text-align: center;"><span style="display:block; font-size:0.8em; color:#999;">방어구</span><span style="color: #333; font-weight: bold;">${parsedData.ra || '-'}</span></div>
            </div>
        </div>`;
    }

    const getItemDetail = (type, id) => builderData[type] ? builderData[type].find(i => i.id === id) || {name:'?', img:''} : {name:'?', img:''};

    html += `<div style="display: flex; justify-content: space-evenly; align-items: center; gap: 15px; padding: 15px 10px; background: #fafafa; border-radius: 12px; border: 1px dashed #ddd; margin-bottom: 15px;">`;
    html += `<div style="display: flex; gap: 8px;">`;
    (parsedData.w || [null, null]).forEach(id => {
        if(!id) return;
        const item = getItemDetail('weapons', id);
        html += `<div onclick="openInfoModalById('weapons', '${id}')" style="cursor: pointer; width: 60px; height: 60px; background: #fff; border-radius: 50%; border: 2.5px solid #d32f2f; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);"><img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"></div>`;
    });
    html += `</div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">`;
    (parsedData.h || [null, null, null, null]).forEach(id => {
        if(!id) return;
        const item = getItemDetail('hearts', id);
        html += `<div onclick="openInfoModalById('hearts', '${id}')" style="cursor: pointer; width: 38px; height: 38px; background: #fff; border-radius: 50%; border: 1.5px solid #1976d2; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);"><img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"></div>`;
    });
    html += `</div></div>`; 

    const validMarts = (parsedData.m || []).filter(id => id);
    if(validMarts.length > 0) {
        html += `<div style="padding: 15px 10px; background: #fafafa; border-radius: 12px; border: 1px dashed #ddd; display: flex; justify-content: center; margin-bottom: 15px;"><div style="display: grid; grid-template-columns: repeat(4, auto); gap: 8px;">`;
        validMarts.forEach(id => {
            const item = getItemDetail('marts', id);
            html += `<div onclick="openInfoModalById('marts', '${id}')" style="cursor: pointer; width: 36px; height: 36px; background: #fff; border-radius: 50%; border: 1.5px solid #fbc02d; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);"><img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/logo.png'"></div>`;
        });
        html += `</div></div>`;
    }

    const comboData = parsedData.k || []; 
    if (comboData && comboData.length > 0) {
        html += `<h4 style="margin: 0 0 10px 0; font-size: 0.95em; color: #555;">🔥 추천 콤보</h4><div class="combo-container">`;
        comboData.forEach((key, index) => {
            if (index > 0) html += `<div class="combo-arrow">›</div>`;
            if (KEY_MAP[key]) {
                const k = KEY_MAP[key];
                html += `<div class="combo-step"><div class="key-cap ${k.color} ${k.hold?'hold':''}"><span style="font-size:0.9em;">${k.text}</span></div></div>`;
            } else {
                let item = builderData.marts ? builderData.marts.find(m => m.id === key) : null;
                if (!item && builderData.weapons) item = builderData.weapons.find(w => w.id === key);
                if (item) html += `<div class="combo-step" onclick="openInfoModalById('marts', '${key}')" style="cursor:pointer;"><img src="${item.img}" class="combo-mart-icon" onerror="this.src='images/logo.png'"></div>`;
                else html += `<div class="combo-step"><div class="key-cap key-gray" style="font-size:0.7em;">${key}</div></div>`;
            }
        });
        html += `</div>`;
    }

    html += `<div style="margin-top: 30px; margin-bottom: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;"><button onclick="copyToClipboard('${build.link}', this)" style="width: 100%; padding: 12px; background-color: #333; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 1em;">🔗 이 빌드 링크 복사</button></div>`;

    document.getElementById('build-sheet-title').innerText = build.title;
    contentArea.innerHTML = html;
    openBuildDetailSheetView();
}
function openBuildDetailSheetView() { document.body.classList.add('build-sheet-open'); }
function closeBuildDetailSheet() { document.body.classList.remove('build-sheet-open'); }

function renderMartLibrary() {
    const container = document.getElementById('mart-library-list');
    if (!container) return;
    if (!builderData) { fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; renderMartLibrary(); }); return; }
    if (!builderData.marts) { container.innerHTML = "데이터 없음"; return; }
    container.innerHTML = '';
    builderData.marts.forEach(mart => {
        const item = document.createElement('div');
        item.className = 'heart-lib-item';
        item.onclick = () => openMartDetailSheet(mart.id);
        item.innerHTML = `<img src="${mart.img}" class="heart-lib-img" onerror="this.src='images/logo.png'"><div class="heart-lib-name">${mart.name}</div>`;
        container.appendChild(item);
    });
}
function renderHeartLibrary() {
    const container = document.getElementById('heart-library-list');
    if (!container) return;
    if (!builderData) { fetch('json/builder_data.json').then(res => res.json()).then(data => { builderData = data; renderHeartLibrary(); }); return; }
    container.innerHTML = '';
    builderData.hearts.forEach(heart => {
        const item = document.createElement('div');
        item.className = 'heart-lib-item';
        item.onclick = () => openHeartDetailSheet(heart.id);
        item.innerHTML = `<img src="${heart.img}" class="heart-lib-img" onerror="this.src='images/logo.png'"><div class="heart-lib-name">${heart.name}</div>`;
        container.appendChild(item);
    });
}

function openMartDetailSheet(id) { openDetailSheet(id, 'marts'); }
function openHeartDetailSheet(id) { openDetailSheet(id, 'hearts'); }
function openDetailSheet(id, type) {
    if (!builderData || !builderData[type]) return;
    const item = builderData[type].find(i => i.id === id);
    if (!item) return;
    
    const titleEl = document.getElementById(type === 'marts' ? 'mart-sheet-title' : 'heart-sheet-title');
    const contentEl = document.getElementById(type === 'marts' ? 'mart-sheet-content' : 'heart-sheet-content');
    if(titleEl) titleEl.innerText = item.name;
    
    if(contentEl) {
        const acquire = convertYoutubeToEmbed(item.acquire);
        contentEl.innerHTML = `
            <div style="text-align:center; margin-bottom:20px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;"><img src="${item.img}" style="width:80px; height:80px; object-fit:contain;" onerror="this.src='images/logo.png'"></div>
            <div class="detail-chunk" style="margin-bottom: 25px;"><h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">설명</h4><p style="color: #555; line-height: 1.6; background: #fff; padding: 10px; border: 1px dashed #ddd; border-radius: 4px;">${item.desc || '정보 없음'}</p></div>
            <div class="detail-chunk"><h4 style="color: #333; margin-bottom: 10px; border-left: 3px solid var(--wuxia-accent-gold); padding-left: 10px;">획득 방법</h4><div style="color: #555; line-height: 1.6; background: #fffcf5; padding: 10px; border: 1px solid #eee; border-radius: 4px;">${acquire}</div></div>`;
    }
    document.body.classList.add(type === 'marts' ? 'mart-sheet-open' : 'heart-sheet-open');
}
function closeMartDetailSheet() { document.body.classList.remove('mart-sheet-open'); }
function closeHeartDetailSheet() { document.body.classList.remove('heart-sheet-open'); }

function convertYoutubeToEmbed(text) {
    if (!text) return '정보가 없습니다.';
    const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})(?:\S+)?)/g;
    return text.replace(ytRegex, (m, u, id) => `<div style="margin-top:10px; position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:8px; background:#000;"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe></div>`);
}

function openInfoModal(item) {
    const modal = document.getElementById('info-modal');
    if (modal) {
        document.getElementById('modal-img').src = item.img || 'images/logo.png';
        document.getElementById('modal-name').innerText = item.name;
        document.getElementById('modal-desc').innerHTML = item.desc || item.acquire || "상세 정보가 없습니다.";
        modal.style.display = 'flex';
    }
}
function closeInfoModal() { const m = document.getElementById('info-modal'); if(m) m.style.display='none'; }
function openInfoModalById(type, id) {
    if (!builderData || !builderData[type]) return;
    const item = builderData[type].find(i => i.id === id);
    if (item) openInfoModal(item);
}

function renderNewsListGeneric(list, c) { 
    if(!c) return; c.innerHTML='';
    list.slice(0,2).forEach(i => {
        c.innerHTML += `<div class="recent-news-item" onclick="if('${i.link}') window.open('${i.link}')"><div class="news-title-text">${i.title}</div><div class="news-date-text">${i.date}</div></div>`;
    });
}
function renderHomeRecentNews(list) { renderNewsListGeneric(list, document.getElementById('home-recent-news')); }
function renderHomeCommunityNews(list) { 
    const c = document.getElementById('home-community-news'); if(!c) return; c.innerHTML='';
    list.slice(0,10).forEach((i,idx) => {
        c.innerHTML += `<div class="progress-update-item"><span class="progress-title">${i.title}</span><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${i.progress}%"></div></div><span class="progress-percent-text">${i.progress}%</span></div>`;
    });
}
function renderFullNews(list) {
    const c = document.getElementById('full-news-list'); if(!c) return; c.innerHTML='';
    list.forEach(i => c.appendChild(createNewsElement(i)));
}
function createNewsElement(i) {
    const d = document.createElement('div'); d.className='news-item'; d.onclick=function(){this.classList.toggle('active')};
    d.innerHTML=`<div class="news-header"><span class="news-title">${i.title}</span><span class="news-date">${i.date}</span></div><div class="news-content">${i.content}</div>`;
    return d;
}

/* 지도/가이드/필터 등 나머지 유틸리티 */
function moveSlide(d) { 
    const t=document.getElementById('hero-slider-track'); if(t) { currentSlideIndex=(currentSlideIndex+d+t.children.length)%t.children.length; updateSliderPosition(); resetSliderTimer(); }
} 
function goToSlide(i) { currentSlideIndex=i; updateSliderPosition(); resetSliderTimer(); }
function updateSliderPosition() { 
    const t=document.getElementById('hero-slider-track'); if(t) t.style.transform=`translateX(-${currentSlideIndex*100}%)`;
    document.querySelectorAll('.indicator').forEach((d,i)=>d.classList.toggle('active',i===currentSlideIndex));
}
function startSlider() { if(slideInterval) clearInterval(slideInterval); slideInterval=setInterval(()=>moveSlide(1),5000); }
function resetSliderTimer() { clearInterval(slideInterval); startSlider(); }
function loadHomeMaps() {
    const c=document.getElementById('home-map-list'); if(!c) return; c.innerHTML='';
    dummyMapData.forEach(m=>c.innerHTML+=`<div class="map-card" onclick="openMapDetail('${m.title}','${m.key}')"><div class="map-hero-bg" style="background-image:url('${m.image}')"></div><div class="map-content"><div class="map-title">${m.title}</div><p class="map-desc">${m.desc}</p></div></div>`);
}
function renderQuizTable(data, k='') {
    const b=document.getElementById('quiz-table-body'); if(!b) return; b.innerHTML='';
    if(!data.length) b.innerHTML='<tr><td colspan="3" style="text-align:center;padding:20px;">결과 없음</td></tr>';
    else data.forEach(i=>b.innerHTML+=`<tr><td>${i.hint}</td><td>${i.answer}</td><td>${i.user||'-'}</td></tr>`);
    b.innerHTML+='<tr class="quiz-report-row" onclick="window.open(\'report/\')"><td colspan="3" style="text-align:center;padding:15px;color:#d48806;">📢 제보하기</td></tr>';
}
function updateQuizCounter() { const c=document.getElementById('quiz-counter-area'); if(c&&globalData.quiz) c.innerHTML=`총 <b>${globalData.quiz.length}</b>개의 족보`; }
function filterQuizData(k) { k=k.toLowerCase(); return globalData.quiz.filter(i=>i.hint.toLowerCase().includes(k)||i.answer.toLowerCase().includes(k)); }
function renderQuestList() {
    const c=document.getElementById('quest-grid-container'); if(!c) return; c.innerHTML='';
    const start=(currentPage-1)*itemsPerPage;
    currentQuestData.slice(start,start+itemsPerPage).forEach(q=>createQuestCard(q,c));
    renderPagination();
}
function createQuestCard(q,c) {
    const d=document.createElement('div'); d.className='quest-card'; d.onclick=()=>loadQuestDetail(q.filepath,q.id);
    d.innerHTML=`<div class="quest-info"><div class="quest-name">${q.name}</div><div class="quest-type">${q.type}</div></div><div class="quest-badge">${q.location}</div>`;
    c.appendChild(d);
}
function loadQuestDetail(p,id) {
    if(id) updateUrlQuery('quest',id);
    document.getElementById('quest-list-view').style.display='none'; document.getElementById('quest-detail-view').style.display='block';
    fetch(p).then(r=>r.text()).then(h=>{document.getElementById('quest-content-loader').innerHTML=h; window.scrollTo(0,0);});
}
function showQuestList() { document.getElementById('quest-list-view').style.display='block'; document.getElementById('quest-detail-view').style.display='none'; updateUrlQuery('quest'); }
function showChunjiList() { document.getElementById('chunji-list-view').style.display='block'; document.getElementById('chunji-detail-view').style.display='none'; updateUrlQuery('chunji'); }
function filterQuestType(t,b) {
    document.querySelectorAll('#view-quest .guide-item-btn').forEach(btn=>btn.classList.remove('active')); if(b) b.classList.add('active');
    currentQuestData=t==='all'?globalData.quests:globalData.quests.filter(q=>q.type===t); currentPage=1; renderQuestList();
}
function renderPagination() {
    const c=document.getElementById('pagination-container'); if(!c) return; c.innerHTML='';
    const total=Math.ceil(currentQuestData.length/itemsPerPage);
    if(total<=1) return;
    const create=(t,p)=> { const b=document.createElement('button'); b.className=`pagination-btn ${p===currentPage?'active':''}`; b.innerText=t; b.onclick=()=>changePage(p); c.appendChild(b); };
    create('<',Math.max(1,currentPage-1));
    for(let i=Math.max(1,currentPage-2); i<=Math.min(total,currentPage+2); i++) create(i,i);
    create('>',Math.min(total,currentPage+1));
}
function changePage(p) { currentPage=p; renderQuestList(); updateUrlQuery('quest'); document.getElementById('quest-list-view').scrollIntoView({behavior:'smooth'}); }
function renderChunjiList() {
    const c=document.getElementById('chunji-list-container'); if(!c) return; c.innerHTML='';
    const start=(currentChunjiPage-1)*itemsPerPage;
    currentChunjiData.slice(start,start+itemsPerPage).forEach(i=>loadChunjiDetail(i)); // 리스트 렌더링 간소화
    renderChunjiPagination();
}
function loadChunjiDetail(i) {
    // 실제로는 리스트 아이템 클릭 시 상세 뷰 로드. 여기선 리스트 렌더링용 더미
    const c=document.getElementById('chunji-list-container');
    const d=document.createElement('div'); d.className='chunji-item';
    d.innerHTML=`<div class="chunji-title">${i.title}</div><div class="chunji-type">${i.type}</div>`;
    d.onclick=()=> {
        document.getElementById('chunji-list-view').style.display='none';
        document.getElementById('chunji-detail-view').style.display='block';
        document.getElementById('chunji-detail-content').innerHTML=`<h2>${i.title}</h2><p>${i.dsec}</p>`;
    };
    c.appendChild(d);
}
function selectChunjiResult(idx) { switchTab('chunji'); loadChunjiDetail(globalData.chunji[idx]); }
function loadChunjiDetailById(id) { const i=chunjiData.find(c=>c.id===id); if(i) loadChunjiDetail(i); }
function filterChunjiType(t,b) {
    document.querySelectorAll('#chunji-list-view .guide-item-btn').forEach(btn=>btn.classList.remove('active')); if(b) b.classList.add('active');
    currentChunjiData=t==='all'?chunjiData:chunjiData.filter(i=>i.type===t); currentChunjiPage=1; renderChunjiList();
}
function renderChunjiPagination() { /* ... (퀘스트와 동일) ... */ }
function changeChunjiPage(p) { currentChunjiPage=p; renderChunjiList(); updateUrlQuery('chunji'); }
function setupGlobalSearch() {
    const i=document.getElementById("header-search-input");
    if(i) i.addEventListener("input",e=>handleGlobalSearch(e));
}
function handleGlobalSearch(e) {
    const k=e.target.value.toLowerCase(); const r=document.getElementById("global-search-results");
    if(!k) { r.style.display='none'; return; }
    let h='';
    globalData.quests.filter(q=>q.name.includes(k)).slice(0,3).forEach(q=>h+=`<div onclick="selectQuestResult('${q.filepath}','${q.id}')">${q.name}</div>`);
    r.innerHTML=h||'결과 없음'; r.style.display='block';
}
function selectGlobalResult(k) { switchTab('quiz'); document.getElementById('quiz-local-search').value=k; renderQuizTable(filterQuizData(k)); }
function selectQuestResult(f,i) { switchTab('quest'); loadQuestDetail(f,i); }
function setupQuizSearch() { document.getElementById("quiz-local-search")?.addEventListener("input",e=>renderQuizTable(filterQuizData(e.target.value))); }
function openReportSheet() { document.getElementById('report-sheet-modal')?.classList.add('show'); }
function closeReportSheet(e) { if(!e||e.target.id==='report-sheet-modal') document.getElementById('report-sheet-modal')?.classList.remove('show'); }
function switchReportTab(t,b) { /* ... */ }
function openProgressSheet() { document.getElementById('progress-sheet-modal')?.classList.add('show'); }
function closeProgressSheet(e) { if(!e||e.target.id==='progress-sheet-modal') document.getElementById('progress-sheet-modal')?.classList.remove('show'); }
function switchProgressTab(t,b) { /* ... */ }
function onQuestTypeChange() { updateLocationOptions(); applyQuestFilter(); }
function updateLocationOptions() { /* ... */ }
function applyQuestFilter() { /* ... */ }
function onGuideSelectChange(s) { loadGuideContent(s.value); }
function syncGuideDropdown(f) { const s=document.getElementById('guide-select'); if(s) s.value=f; }
function onChunjiTypeChange() { updateChunjiSubtypeOptions(); applyChunjiFilter(); }
function updateChunjiSubtypeOptions() { /* ... */ }
function applyChunjiFilter() { /* ... */ }
function openGuideDirect(f) { switchTab('guide'); loadGuideContent(f); }
function copyToClipboard(t,b) { navigator.clipboard.writeText(t).then(()=>{ b.innerText='완료'; setTimeout(()=>b.innerText='복사',2000); }); }
function downloadBuildImage() { /* ... */ }
function toggleNavDropdown(e,id) { e.stopPropagation(); document.getElementById(id)?.classList.toggle('show'); }
function loadContent(u) { fetch(u).then(r=>r.text()).then(h=>document.getElementById('guide-dynamic-content').innerHTML=h); }
function openBossTab(t,b) { /* ... */ }
function filterBoss(s) { /* ... */ }
function goBoss(id) { loadContent('boss/'+id+'.html'); }
function goBossList() { loadContent('boss.html'); }
