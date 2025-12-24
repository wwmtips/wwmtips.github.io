/**
 * 강호 시시각각(時時刻刻) - 리스트형 타이머
 * 수정사항: DOMContentLoaded 추가 (로딩 안전장치), 레이아웃 좌우 분할
 */

// ★★★ 데이터 설정 영역 ★★★
const GANGHO_EVENTS = [
    // 1. [매일 반복] type: 'daily'
    {
        id: 'daily_boss',
        type: 'daily',
        name: '필드 보스 출현',
        desc: '강호 곳곳에 보스가 출현합니다. (매일 낮)',
        startTime: '12:00',
        endTime: '14:00'
    },
    {
        id: 'daily_shop',
        type: 'daily',
        name: '비전 상점 (저녁)',
        desc: '희귀 재료 상점이 열립니다. (매일 저녁)',
        startTime: '18:00',
        endTime: '23:59'
    },
    // 2. [기간 한정] type: 'period' (날짜 포함 YYYY-MM-DDTHH:MM:SS)
    {
        id: 'event_winter',
        type: 'period',
        name: '불꽃놀이 축제 (연말)',
        desc: '강호의 밤을 수놓는 불꽃 축제',
        startTime: '2024-12-25T00:00:00',
        endTime: '2025-12-31T23:59:59'
    }
];

// ============================================================
// ▼ 로직 영역 (수정 불필요)
// ============================================================

// 1. DOM이 로드된 후 실행 (오류 방지)
document.addEventListener("DOMContentLoaded", function() {
    updateGanghoTimers(); // 즉시 1회 실행
    setInterval(updateGanghoTimers, 1000); // 1초마다 갱신
});

function updateGanghoTimers() {
    const container = document.getElementById('gangho-timer-list');
    if (!container) return; // 컨테이너가 없으면 중단

    // 기존 "로딩 중" 메시지가 있다면 제거 (첫 실행 시)
    if (container.innerText.includes('시간을 읽는 중')) {
        container.innerHTML = '';
    }

    const now = new Date();

    GANGHO_EVENTS.forEach(event => {
        let row = document.getElementById(`timer-row-${event.id}`);
        
        // 요소가 없으면 새로 생성 (Create)
        if (!row) {
            row = document.createElement('div');
            row.id = `timer-row-${event.id}`;
            row.className = 'timer-row';
            row.onclick = () => openTimerDetailSheet(event); // 클릭 이벤트 연결
            container.appendChild(row);
        }

        // 시간 계산
        const result = (event.type === 'period') 
            ? calculatePeriodTime(event, now) 
            : calculateDailyTime(event, now);

        const { status, timeStr, isUrgent, isEnded } = result;

        // 상태별 스타일 클래스 결정
        let statusClass = 'status-ing';
        if (isUrgent) statusClass = 'status-urgent';
        if (isEnded) statusClass = 'status-end';

        // HTML 갱신 (좌측: 제목+상태 / 우측: 시간)
        row.innerHTML = `
            <div class="timer-left">
                <div class="timer-title" style="${isEnded ? 'color:#aaa;' : ''}">
                    ${event.name}
                </div>
                <div class="timer-status-row">
                    <span class="status-badge ${statusClass}">${status}</span>
                    <span style="color:#ddd;">|</span>
                    <span>${result.subInfo}</span>
                </div>
            </div>
            <div class="timer-right">
                <div class="timer-clock" style="${isEnded ? 'color:#ccc;' : (isUrgent ? 'color:var(--wuxia-accent-red);' : '')}">
                    ${timeStr}
                </div>
            </div>
        `;
    });
}

// [계산 1] 기간 한정 이벤트
function calculatePeriodTime(event, now) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    let diff = 0;
    let status = "";
    let isUrgent = false;
    let isEnded = false;
    let subInfo = `${start.getMonth()+1}.${start.getDate()}~${end.getMonth()+1}.${end.getDate()}`;

    if (now < start) {
        status = "시작 전";
        diff = start - now;
    } else if (now >= start && now <= end) {
        status = "진행 중"; // 또는 '종료까지'
        diff = end - now;
        if (diff < 86400000) { status = "종료 임박"; isUrgent = true; }
    } else {
        status = "종료됨";
        isEnded = true;
    }

    return { 
        status, 
        timeStr: formatDuration(diff, isEnded, true), // true = 일(Day) 단위 표시
        isUrgent, 
        isEnded,
        subInfo
    };
}

// [계산 2] 매일 반복 일정
function calculateDailyTime(event, now) {
    const [sH, sM] = event.startTime.split(':').map(Number);
    const [eH, eM] = event.endTime.split(':').map(Number);
    
    const start = new Date(now); start.setHours(sH, sM, 0, 0);
    const end = new Date(now); end.setHours(eH, eM, 0, 0);
    
    let diff = 0;
    let status = "";
    let isUrgent = false;
    let isEnded = false;
    let subInfo = `${event.startTime}~${event.endTime}`;

    if (now < start) {
        status = "시작 전";
        diff = start - now;
    } else if (now >= start && now <= end) {
        status = "진행 중";
        diff = end - now;
        if (diff < 600000) { status = "마감 임박"; isUrgent = true; }
    } else {
        status = "금일 종료";
        isEnded = true;
    }

    return { 
        status, 
        timeStr: formatDuration(diff, isEnded, false), 
        isUrgent, 
        isEnded,
        subInfo
    };
}

// 공통 시간 포맷터
function formatDuration(ms, isEnded, showDays) {
    if (isEnded) return "00:00:00";
    
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);

    // 기간 한정이면서 1일 이상 남았을 때: "6일 13시간"
    if (showDays && d > 0) {
        return `${d}일 ${h}시간`;
    }
    
    // 그 외 (24시간 미만 or 매일 반복): "HH:MM:SS"
    const hh = String(h + (d*24)).padStart(2,'0'); // 날짜가 0일 경우 시간으로 합산
    return `${hh}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// 바텀시트 열기 (상세 정보)
function openTimerDetailSheet(event) {
    const modal = document.getElementById('timer-sheet-modal');
    // 모달이 HTML에 존재해야 함
    if (modal) {
        // 모달 내부 콘텐츠 영역 찾기 (사용자의 HTML 구조에 맞춤)
        let contentBox = modal.querySelector('#timer-detail-content') || modal.querySelector('.sheet-body-content');
        
        if (contentBox) {
            contentBox.innerHTML = `
                <div style="text-align:center; padding: 20px 0;">
                    <h3 style="color:var(--wuxia-accent-gold); margin:0 0 10px 0;">${event.name}</h3>
                    <p style="font-size:0.9em; color:#666; margin-bottom:20px;">
                        ${event.type === 'period' ? '기간 한정 이벤트' : '매일 반복 콘텐츠'}
                    </p>
                    <div style="background:#f9f9f9; padding:15px; border-radius:8px; text-align:left; border:1px solid #eee;">
                        <p style="font-weight:bold; color:#333; margin-bottom:5px;">⏳ 시간</p>
                        <p style="color:#555; margin-bottom:15px;">
                            ${event.type === 'period' 
                                ? event.startTime.replace('T',' ') + ' ~ ' + event.endTime.replace('T',' ') 
                                : event.startTime + ' ~ ' + event.endTime}
                        </p>
                        <p style="font-weight:bold; color:#333; margin-bottom:5px;">📜 설명</p>
                        <p style="color:#555; line-height:1.5;">${event.desc}</p>
                    </div>
                </div>
            `;
        }
        modal.classList.add('show');
    } else {
        console.error("오류: 'timer-sheet-modal' ID를 가진 요소를 찾을 수 없습니다.");
    }
}
