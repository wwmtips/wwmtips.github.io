/* =========================================
   script.js (스무고개 중심 개편 - 랭킹 기능 추가)
   ========================================= */

// 전역 변수
let globalData = { items: [], quiz: [], quests: [], chunji: [] };
let currentQuestData = [];
let currentChunjiData = [];
let currentPage = 1;
let currentChunjiPage = 1;
let itemsPerPage = 12;
let isGuideLoaded = false;

// 화면 크기에 따른 페이지당 아이템 수
function updateItemsPerPage() {
    itemsPerPage = window.innerWidth >= 1024 ? 18 : 12;
}

// ----------------------------------------------------
// 1. 초기화 (DOMContentLoaded)
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupQuizSearch();
    checkUrlParams();
    updateItemsPerPage();
    window.addEventListener('popstate', handleHistoryChange);
});

// ----------------------------------------------------
// 2. 데이터 로드
// ----------------------------------------------------
function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    
    Promise.all([
        fetch('json/datas.json').then(res => res.json()).catch(err => ({})),
        fetch('json/quests.json').then(res => res.json()).catch(err => []),
        fetch('json/chunji.json').then(res => res.json()).catch(err => ({ chunji: [] })),
    ])
    .then(([mainData, questData, chunjiResult]) => {
        let quests = Array.isArray(questData) ? questData : (questData.quests || []);
        let chunji = Array.isArray(chunjiResult) ? chunjiResult : (chunjiResult.chunji || []);

        globalData = {
            quiz: mainData.quiz || [],
            quests: quests,
            chunji: chunji
        };
        
        currentQuestData = globalData.quests;
        currentChunjiData = globalData.chunji;

        // ★ 스무고개 랭킹 및 테이블 렌더링
        renderQuizRanking();
        renderQuizTable(globalData.quiz);
        updateQuizCounter();

        // 필터 옵션 초기화
        if (typeof updateLocationOptions === 'function') updateLocationOptions();
        if (typeof updateChunjiSubtypeOptions === 'function') updateChunjiSubtypeOptions();

        // 탭별 리스트 렌더링
        renderQuestList();
        renderChunjiList();

        const targetId = urlParams.get('id') || urlParams.get('q') || urlParams.get('c');
        if (targetTab === 'quest' && targetId) {
             const fullId = targetId.startsWith('q') ? targetId : 'q' + targetId;
             const fq = globalData.quests.find(q => q.id === fullId);
             if (fq) { switchTab('quest'); loadQuestDetail(fq.filepath, fullId); }
        } else if (targetTab === 'chunji' && targetId) {
             const fc = globalData.chunji.find(c => c.id === targetId);
             if (fc) { switchTab('chunji'); loadChunjiDetail(fc); }
        }
    })
    .catch(error => console.error("데이터 로드 실패:", error));
}

// ----------------------------------------------------
// 3. 탭 및 URL 관리
// ----------------------------------------------------
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const qPage = urlParams.get('qp');
    const cPage = urlParams.get('cp');

    if (tab === 'quest') {
        if (qPage) currentPage = parseInt(qPage);
        switchTab('quest');
    } else if (tab === 'chunji') {
        if (cPage) currentChunjiPage = parseInt(cPage);
        switchTab('chunji');
    } else if (tab === 'hw' || tab === 'todo') {
        switchTab('todo');
    } else {
        switchTab('home');
    }
}

function updateUrlQuery(tab, id) {
    const url = new URL(window.location);
    url.searchParams.delete('tab');
    url.searchParams.delete('id');
    url.searchParams.delete('q');
    url.searchParams.delete('c');
    url.searchParams.delete('qp');
    url.searchParams.delete('cp');

    if (tab === 'quest') {
        if (id) {
            url.searchParams.set('q', id.replace('q', ''));
        } else {
            url.searchParams.set('tab', 'quest');
            if (currentPage > 1) url.searchParams.set('qp', currentPage);
        }
    } else if (tab === 'chunji') {
        if (id) {
            url.searchParams.set('c', id);
        } else {
            url.searchParams.set('tab', 'chunji');
            if (currentChunjiPage > 1) url.searchParams.set('cp', currentChunjiPage);
        }
    } else if (tab === 'todo' || tab === 'hw') {
        url.searchParams.set('tab', 'hw');
    }

    if (url.toString() !== window.location.href) history.pushState(null, '', url);
}

function handleHistoryChange() {
    checkUrlParams();
    if (document.getElementById('view-quest').style.display === 'block') renderQuestList();
    if (document.getElementById('view-chunji').style.display === 'block') renderChunjiList();
}

// ----------------------------------------------------
// 4. 스무고개 (메인 기능 & 랭킹)
// ----------------------------------------------------
function renderQuizRanking() {
    const container = document.getElementById('quiz-ranking-container');
    if (!container || !globalData.quiz) return;

    // 1. 유저별 기여도 카운트
    const userCounts = {};
    globalData.quiz.forEach(item => {
        const u = item.user ? item.user.trim() : '-';
        if (u !== '-' && u !== '') {
            userCounts[u] = (userCounts[u] || 0) + 1;
        }
    });

    // 2. 내림차순 정렬 후 상위 5명
    const sortedUsers = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sortedUsers.length === 0) {
        container.innerHTML = '';
        return;
    }

    // 3. HTML 생성
    let html = `
    <div class="flex items-center gap-3 py-2 px-1">
        <span class="text-xs font-bold text-gray-500 flex-none mr-2">🏆 명예의 전당</span>
    `;

    const rankColors = ['bg-yellow-100 text-yellow-700', 'bg-gray-100 text-gray-700', 'bg-orange-100 text-orange-700'];

    sortedUsers.forEach((user, index) => {
        const rank = index + 1;
        const colorClass = index < 3 ? rankColors[index] : 'bg-white text-gray-500 border border-gray-100';
        
        html += `
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full ${colorClass} shadow-sm whitespace-nowrap">
            <span class="text-[10px] font-black">${rank}위</span>
            <span class="text-xs font-bold">${user[0]}</span>
            <span class="text-[10px] opacity-70">(${user[1]}개)</span>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function setupQuizSearch() {
    const quizLocalSearch = document.getElementById("quiz-local-search");
    const statusBar = document.getElementById("quiz-counter-area");

    if (quizLocalSearch) {
        quizLocalSearch.addEventListener("input", (e) => {
            renderQuizTable(filterQuizData(e.target.value), e.target.value);
        });
        
        quizLocalSearch.addEventListener("focus", () => { 
            if (statusBar) statusBar.style.display = 'none'; 
        });
        quizLocalSearch.addEventListener("blur", () => { 
            if (statusBar && e.target.value === '') statusBar.style.display = 'block'; 
        });
    }
}

function filterQuizData(keyword) {
    keyword = keyword.trim().toLowerCase();
    if (!keyword) return globalData.quiz;
    return globalData.quiz.filter(item => 
        (item.hint && item.hint.toLowerCase().includes(keyword)) || 
        (item.answer && item.answer.toLowerCase().includes(keyword))
    );
}

function renderQuizTable(data, keyword = '') {
    const tbody = document.getElementById('quiz-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'quiz-row border-b border-gray-100 last:border-none transition-colors';

            let hint = item.hint || '';
            let answer = item.answer || '';
            
            if (keyword) {
                const regex = new RegExp(`(${keyword})`, 'gi');
                const highlight = '<span class="bg-yellow-200 text-yellow-900 font-bold px-0.5 rounded">$1</span>';
                hint = hint.replace(regex, highlight);
                answer = answer.replace(regex, highlight);
            }
            
            tr.innerHTML = `
                <td class="px-4 py-3 text-gray-600 font-medium break-keep leading-snug">
                    ${hint}
                </td>
                <td class="px-4 py-3 text-blue-600 font-bold break-keep leading-snug">
                    ${answer}
                </td>
                <td class="px-4 py-3 text-right text-xs text-gray-400 break-keep">
                    ${item.user || '-'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        const noResultTr = document.createElement('tr');
        noResultTr.innerHTML = `<td colspan="3" class="py-12 text-center text-gray-400 text-sm">일치하는 족보가 없습니다.</td>`;
        tbody.appendChild(noResultTr);
    }
}

function updateQuizCounter() {
    const counter = document.getElementById('quiz-counter-area');
    if (!counter || !globalData.quiz) return;
    counter.innerHTML = `총 <b class="text-blue-600">${globalData.quiz.length}</b>개의 족보가 등록되었습니다.`;
}

// ----------------------------------------------------
// 5. 무림록 (퀘스트) 로직
// ----------------------------------------------------
function onQuestTypeChange() { updateLocationOptions(); applyQuestFilter(); }

function updateLocationOptions() {
    const typeSelect = document.getElementById('quest-type-select');
    const locationSelect = document.getElementById('quest-location-select');
    if (!typeSelect || !locationSelect || !globalData.quests) return;

    const selectedType = typeSelect.value;
    let filteredData = globalData.quests;
    if (selectedType !== 'all') {
        filteredData = globalData.quests.filter(q => q.type === selectedType);
    }

    const locations = new Set();
    filteredData.forEach(q => { if(q.location) locations.add(q.location); });
    const sortedLocations = Array.from(locations).sort();

    locationSelect.innerHTML = '<option value="all">모든 지역</option>';
    sortedLocations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc; option.innerText = loc;
        locationSelect.appendChild(option);
    });
    locationSelect.value = 'all';
}

function applyQuestFilter() {
    const typeSelect = document.getElementById('quest-type-select');
    const locationSelect = document.getElementById('quest-location-select');
    const sType = typeSelect ? typeSelect.value : 'all';
    const sLoc = locationSelect ? locationSelect.value : 'all';

    currentQuestData = globalData.quests.filter(item => {
        return ((sType === 'all') || (item.type === sType)) &&
               ((sLoc === 'all') || (item.location === sLoc));
    });
    currentPage = 1;
    renderQuestList();
}

function renderQuestList() {
    const container = document.getElementById('quest-grid-container');
    const paginationContainer = document.getElementById('pagination-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentQuestData || currentQuestData.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">퀘스트 정보가 없습니다.</div>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    currentQuestData.slice(start, end).forEach(quest => {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-transform hover:bg-gray-50';
        div.onclick = () => { switchTab('quest'); loadQuestDetail(quest.filepath, quest.id); };
        div.innerHTML = `
            <div class="flex flex-col gap-1 overflow-hidden">
                <div class="font-bold text-gray-900 text-[15px] truncate">${quest.name}</div>
                <div class="text-xs text-gray-400">${quest.type}</div>
            </div>
            <div class="flex-none bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-lg font-medium ml-3">
                ${quest.location || '지역'}
            </div>
        `;
        container.appendChild(div);
    });
    renderPagination(currentQuestData, currentPage, 'quest');
}

function loadQuestDetail(filepath, id) {
    const listView = document.getElementById('quest-list-view');
    const detailView = document.getElementById('quest-detail-view');
    const contentBox = document.getElementById('quest-content-loader');

    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';
    
    updateUrlQuery('quest', id);
    
    if (contentBox) contentBox.innerHTML = '<div class="text-center py-10">로딩 중...</div>';
    fetch(filepath).then(res => res.text()).then(html => {
        if (contentBox) contentBox.innerHTML = html;
        window.scrollTo(0, 0);
    });
}

function showQuestList() {
    document.getElementById('quest-list-view').style.display = 'block';
    document.getElementById('quest-detail-view').style.display = 'none';
    updateUrlQuery('quest');
}

// ----------------------------------------------------
// 6. 천지록 로직
// ----------------------------------------------------
function onChunjiTypeChange() { updateChunjiSubtypeOptions(); applyChunjiFilter(); }

function updateChunjiSubtypeOptions() {
    const typeSelect = document.getElementById('chunji-type-select');
    const subtypeSelect = document.getElementById('chunji-subtype-select');
    if (!typeSelect || !subtypeSelect || !globalData.chunji) return;

    const selectedType = typeSelect.value;
    let filteredData = globalData.chunji;
    if (selectedType !== 'all') {
        filteredData = globalData.chunji.filter(item => item.type === selectedType);
    }

    const subtypes = new Set();
    filteredData.forEach(item => { if(item.subtype) subtypes.add(item.subtype); });
    const sortedSubtypes = Array.from(subtypes).sort();

    subtypeSelect.innerHTML = '<option value="all">모든 항목</option>';
    sortedSubtypes.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub; option.innerText = sub;
        subtypeSelect.appendChild(option);
    });
    subtypeSelect.value = 'all';
}

function applyChunjiFilter() {
    const typeSelect = document.getElementById('chunji-type-select');
    const subtypeSelect = document.getElementById('chunji-subtype-select');
    const sType = typeSelect ? typeSelect.value : 'all';
    const sSub = subtypeSelect ? subtypeSelect.value : 'all';

    currentChunjiData = globalData.chunji.filter(item => {
        return ((sType === 'all') || (item.type === sType)) &&
               ((sSub === 'all') || (item.subtype === sSub));
    });
    currentChunjiPage = 1;
    renderChunjiList();
}

function renderChunjiList() {
    const container = document.getElementById('chunji-list-container');
    const paginationContainer = document.getElementById('chunji-pagination-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentChunjiData || currentChunjiData.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">데이터가 없습니다.</div>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const start = (currentChunjiPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    currentChunjiData.slice(start, end).forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-transform hover:bg-gray-50';
        div.onclick = () => { switchTab('chunji'); loadChunjiDetail(item); };
        div.innerHTML = `
            <div class="flex flex-col gap-1 overflow-hidden">
                <div class="font-bold text-gray-900 text-[15px] truncate">${item.title}</div>
                <div class="text-xs text-gray-400">${item.type || '분류 없음'}</div>
            </div>
            <div class="text-gray-300 text-lg">›</div>
        `;
        container.appendChild(div);
    });
    renderPagination(currentChunjiData, currentChunjiPage, 'chunji');
}

function loadChunjiDetail(item) {
    const listView = document.getElementById('chunji-list-view');
    const detailView = document.getElementById('chunji-detail-view');
    const contentBox = document.getElementById('chunji-detail-content');

    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';
    
    updateUrlQuery('chunji', item.id);

    const typeBadge = (item.type || item.subtype) ? `<span class="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg mb-4">${item.type || item.subtype}</span>` : '';
    const getText = item.get ? item.get.replace(/\n/g, '<br>') : "";
    const dsecText = item.dsec ? item.dsec.replace(/\n/g, '<br>') : (item.desc || "").replace(/\n/g, '<br>');

    const images = [item.getimg1, item.getimg2, item.dsecimg1, item.dsecimg2, item.image].filter(img => img && img.trim() !== "");
    let imagesHtml = '';
    if (images.length > 0) {
        imagesHtml = `<div class="grid grid-cols-1 gap-4 mt-8">`;
        images.forEach(img => {
            imagesHtml += `<img src="${img}" class="w-full rounded-2xl border border-gray-100 shadow-md" onerror="this.style.display='none'">`;
        });
        imagesHtml += `</div>`;
    }

    contentBox.innerHTML = `
        <div class="flex flex-col">
            <div class="border-b border-gray-100 pb-6 mb-6">
                ${typeBadge}
                <h2 class="text-2xl lg:text-3xl font-black text-gray-900 leading-tight">${item.title}</h2>
            </div>
            ${getText ? `<div class="mb-8"><h4 class="text-sm font-bold text-blue-500 mb-3">🔍 획득 방법</h4><div class="text-[16px] text-gray-700 leading-relaxed font-medium bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">${getText}</div></div>` : ''}
            ${dsecText ? `<div class="mb-8"><h4 class="text-sm font-bold text-gray-400 mb-3">📝 상세 정보</h4><div class="text-[15px] text-gray-600 leading-relaxed">${dsecText}</div></div>` : ''}
            ${imagesHtml}
            ${item.coords ? `<div class="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3"><span class="text-xl">📍</span><span class="text-sm font-bold text-gray-900">${item.coords}</span></div>` : ''}
        </div>
    `;
    window.scrollTo(0, 0);
}

function showChunjiList() {
    document.getElementById('chunji-list-view').style.display = 'block';
    document.getElementById('chunji-detail-view').style.display = 'none';
    updateUrlQuery('chunji');
}

// ----------------------------------------------------
// 7. 공통 페이지네이션
// ----------------------------------------------------
function renderPagination(dataList, currPage, tabName) {
    const containerId = tabName === 'quest' ? 'pagination-container' : 'chunji-pagination-container';
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(dataList.length / itemsPerPage);
    if (totalPages <= 1) return;

    const createBtn = (text, page, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.className = `w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`;
        btn.innerText = text;
        btn.disabled = disabled;
        if(disabled) btn.classList.add('opacity-50', 'cursor-not-allowed');
        else btn.onclick = () => {
            if (tabName === 'quest') { currentPage = page; renderQuestList(); updateUrlQuery('quest'); }
            else { currentChunjiPage = page; renderChunjiList(); updateUrlQuery('chunji'); }
            document.getElementById(`${tabName}-list-view`).scrollIntoView({ behavior: 'smooth' });
        };
        return btn;
    };

    container.appendChild(createBtn('<', currPage - 1, false, currPage === 1));
    
    const maxVisible = 5;
    let start = Math.max(1, currPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
        container.appendChild(createBtn(i, i, i === currPage));
    }
    container.appendChild(createBtn('>', currPage + 1, false, currPage === totalPages));
}