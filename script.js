
// 전역 변수
let globalData = { items: [], quiz: [], quests: [] };

document.addEventListener("DOMContentLoaded", () => {
    loadData(); // 데이터 가져오기

    // 헤더 통합 검색 이벤트 연결
    const headerSearch = document.getElementById("header-search-input");
    if (headerSearch) {
        headerSearch.addEventListener("input", handleGlobalSearch);
        headerSearch.addEventListener("blur", () => {
            setTimeout(() => {
                document.getElementById("global-search-results").style.display = 'none';
            }, 200);
        });
    }

    // 족보 내부 필터링 이벤트 연결
    const quizLocalSearch = document.getElementById("quiz-local-search");
    if (quizLocalSearch) {
        quizLocalSearch.addEventListener("input", (e) => {
            renderQuizTable(filterQuizData(e.target.value));
        });
    }
});

// 1. JSON 데이터 로드
function loadData() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            globalData = data;
            
            // 데이터 로드 후 초기 렌더링
            renderQuizTable(globalData.quiz);
            document.getElementById('quiz-counter-area').innerText = `총 ${globalData.quiz.length}개의 족보가 등록되었습니다.`;
            
            // (추후 아이템 목록 렌더링 함수도 여기에 추가)
        })
        .catch(error => console.error("데이터 로드 실패:", error));
}

// 2. 탭 전환 (View Switching)
function switchTab(tabName) {
    // 모든 뷰 숨기기
    document.getElementById('view-home').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'none';
    document.getElementById('view-quest').style.display = 'none';

    // 네비게이션 활성 클래스 초기화
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-quest').classList.remove('active');
    document.getElementById('nav-quiz').classList.remove('active');

    // 선택된 탭 활성화
    if (tabName === 'home') {
        document.getElementById('view-home').style.display = 'block';
        document.getElementById('nav-home').classList.add('active');
    } else if (tabName === 'quiz') {
        document.getElementById('view-quiz').style.display = 'block';
        document.getElementById('nav-quiz').classList.add('active');
    } else if (tabName === 'quest') {
        document.getElementById('view-quest').style.display = 'block';
        document.getElementById('nav-quest').classList.add('active');
    }
}

// 3. 족보 테이블 렌더링
function renderQuizTable(data, keyword = '') {
    const tbody = document.getElementById('quiz-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding:20px; color:#888;">검색 결과가 없습니다.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        let hint = item.hint;
        let answer = item.answer;

        // 검색어 하이라이트
        if (keyword) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            hint = hint.replace(regex, '<span class="highlight">$1</span>');
            answer = answer.replace(regex, '<span class="highlight">$1</span>');
        }

        tr.innerHTML = `<td>${hint}</td><td>${answer}</td>`;
        tbody.appendChild(tr);
    });
}

// 4. 족보 데이터 필터링 (내부 검색용)
function filterQuizData(keyword) {
    keyword = keyword.trim().toLowerCase();
    if (!keyword) return globalData.quiz;
    return globalData.quiz.filter(item => 
        item.hint.toLowerCase().includes(keyword) || 
        item.answer.toLowerCase().includes(keyword)
    );
}

// 5. 통합 검색 핸들러 (헤더 검색창)
function handleGlobalSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    const resultContainer = document.getElementById("global-search-results");
    
    if (!keyword) {
        resultContainer.style.display = 'none';
        return;
    }

    let resultsHTML = '';

    // [족보 검색]
    const quizResults = globalData.quiz.filter(q => 
        q.hint.toLowerCase().includes(keyword) || q.answer.toLowerCase().includes(keyword)
    );
    
    if (quizResults.length > 0) {
        resultsHTML += `<div class="search-category-title">족보 (클릭 시 이동)</div>`;
        // 최대 5개만 노출
        quizResults.slice(0, 5).forEach(item => {
            // 클릭 시 1) 족보 탭으로 이동 2) 내부 검색창에 값 입력 3) 테이블 필터링
            resultsHTML += `
                <div class="search-result-item" onclick="selectGlobalResult('${item.hint}')">
                    <span class="badge quiz">족보</span>
                    <span class="result-text">${item.hint} - ${item.answer}</span>
                </div>
            `;
        });
    }

    // [아이템 검색] (데이터가 있다면)
    if (globalData.items && globalData.items.length > 0) {
        const itemResults = globalData.items.filter(i => i.name.toLowerCase().includes(keyword));
        if (itemResults.length > 0) {
            resultsHTML += `<div class="search-category-title">아이템</div>`;
            itemResults.slice(0, 3).forEach(item => {
                resultsHTML += `
                    <div class="search-result-item">
                        <span class="badge item">아이템</span>
                        <span class="result-text">${item.name}</span>
                    </div>
                `;
            });
        }
    }

    if (resultsHTML) {
        resultContainer.innerHTML = resultsHTML;
        resultContainer.style.display = 'block';
    } else {
        resultContainer.innerHTML = `<div class="no-result">결과 없음</div>`;
        resultContainer.style.display = 'block';
    }
}

// 6. 통합 검색 결과 클릭 시 동작
function selectGlobalResult(keyword) {
    // 1. 족보 탭으로 전환
    switchTab('quiz');
    
    // 2. 족보 내부 검색창에 값 입력
    const localInput = document.getElementById("quiz-local-search");
    localInput.value = keyword;
    
    // 3. 테이블 필터링 실행
    renderQuizTable(filterQuizData(keyword), keyword);
    
    // 4. 드롭다운 닫기
    document.getElementById("global-search-results").style.display = 'none';
}