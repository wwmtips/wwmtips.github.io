let db = {}; // JSON 데이터 담을 곳
let currentBuild = {
    weapons: [null, null],
    hearts: [null, null, null, null],
    marts: [null, null, null, null, null, null, null, null]
};
let selectingTarget = null; // 현재 선택 중인 슬롯 정보 {type, index}

// 1. 데이터 로드
fetch('../json/builder_data.json')
    .then(res => res.json())
    .then(data => {
        db = data;
        initBuilder(); // 빌더 페이지 초기화
    });

// 2. 빌더 초기화 (이벤트 리스너 등)
function initBuilder() {
    const slots = document.querySelectorAll('.item-slot');
    slots.forEach(slot => {
        slot.addEventListener('click', () => {
            // 뷰어 모드면 클릭 무시
            if(document.body.classList.contains('viewer-mode')) return;
            
            const type = slot.dataset.type;
            const index = slot.dataset.index;
            openModal(type, index);
        });
    });
}

// 3. 모달 열기
function openModal(type, index) {
    selectingTarget = { type, index };
    const modal = document.getElementById('selection-modal');
    const listContainer = document.getElementById('modal-list');
    const title = document.getElementById('modal-title');
    
    // 타이틀 설정
    const typeName = type === 'weapons' ? '무기' : (type === 'hearts' ? '심법' : '비결');
    title.innerText = `${typeName} 선택`;

    // 리스트 렌더링
    listContainer.innerHTML = '';
    
    // '선택 해제' 버튼 추가
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'select-item';
    emptyDiv.innerHTML = '<div style="width:50px;height:50px;background:#eee;line-height:50px;">X</div><p>해제</p>';
    emptyDiv.onclick = () => selectItem(null);
    listContainer.appendChild(emptyDiv);

    // DB 아이템 뿌리기
    if (db[type]) {
        db[type].forEach(item => {
            const div = document.createElement('div');
            div.className = 'select-item';
            div.innerHTML = `<img src="${item.img}" onerror="this.src='../images/logo.png'"><p>${item.name}</p>`;
            div.onclick = () => selectItem(item.id);
            listContainer.appendChild(div);
        });
    }

    modal.style.display = 'flex';
}

// 4. 아이템 선택 시 처리
function selectItem(itemId) {
    if (!selectingTarget) return;
    const { type, index } = selectingTarget;

    // 데이터 저장
    currentBuild[type][index] = itemId;

    // UI 업데이트
    const slot = document.querySelector(`.item-slot[data-type="${type}"][data-index="${index}"]`);
    const img = slot.querySelector('img');
    
    if (itemId) {
        // ID로 이미지 경로 찾기
        const itemData = db[type].find(i => i.id === itemId);
        if (itemData) {
            img.src = itemData.img;
            slot.classList.add('filled');
        }
    } else {
        slot.classList.remove('filled');
    }

    closeModal();
}

function closeModal(e) {
    // 배경 클릭 시에만 닫기 (e가 없으면 강제 닫기)
    if (!e || e.target.classList.contains('modal-overlay')) {
        document.getElementById('selection-modal').style.display = 'none';
    }
}

// 5. URL 생성 및 복사
function generateUrl() {
    // 1) 데이터를 쿼리 문자열로 변환 (예: ?w=w1,w2&h=h1,h2...&m=m1,m2...)
    const params = new URLSearchParams();
    
    // 배열을 쉼표로 합침 (빈 값은 빈칸)
    params.set('w', currentBuild.weapons.join(','));
    params.set('h', currentBuild.hearts.join(','));
    params.set('m', currentBuild.marts.join(','));

    // 2) 최종 URL 생성
    // 현재 경로에서 index.html을 viewer.html로 교체
    const baseUrl = window.location.href.replace('index.html', 'viewer.html').split('?')[0]; 
    // 만약 폴더 경로라면 viewer.html을 붙임
    const finalUrl = (baseUrl.endsWith('/') ? baseUrl + 'viewer.html' : baseUrl) + '?' + params.toString();

    // 3) 클립보드 복사
    navigator.clipboard.writeText(finalUrl).then(() => {
        alert('주소가 복사되었습니다! 공유하세요.');
    });
    
    // (선택) 화면에 보여주기
    const input = document.getElementById('result-url');
    input.value = finalUrl;
    input.style.display = 'block';
}

// 6. 뷰어 로드 (viewer.html 에서만 실행됨)
function loadViewer() {
    // DB가 로드될 때까지 대기해야 할 수도 있음 (간단 처리를 위해 setTimeout 사용 가능하나, fetch 안에서 호출하는게 정석)
    // 여기서는 fetch 안에서 initBuilder 호출하듯, 데이터가 있을때 실행되도록 체크
    if (Object.keys(db).length === 0) {
        setTimeout(loadViewer, 100); // DB 로딩 대기
        return;
    }

    const params = new URLSearchParams(window.location.search);
    
    // 파라미터 파싱
    const w = (params.get('w') || ',').split(',');
    const h = (params.get('h') || ',,,').split(',');
    const m = (params.get('m') || ',,,,,,,').split(',');

    // UI 렌더링 함수
    const renderSlot = (type, ids, prefix) => {
        ids.forEach((id, idx) => {
            if (!id) return;
            const itemData = db[type].find(i => i.id === id);
            if (itemData) {
                const slotId = `${prefix}-${idx}`; // ex: v-weapons-0
                const slotEl = document.getElementById(slotId);
                if (slotEl) {
                    const img = slotEl.querySelector('img');
                    img.src = itemData.img;
                    img.style.display = 'block';
                    slotEl.style.border = '1px solid var(--wuxia-accent-gold)';
                }
            }
        });
    };

    renderSlot('weapons', w, 'v-weapons');
    renderSlot('hearts', h, 'v-hearts');
    renderSlot('marts', m, 'v-marts');
}
