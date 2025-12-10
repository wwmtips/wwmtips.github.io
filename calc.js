// calc.js

// ==========================================
// [설정] 1 포인트 회복에 걸리는 시간 (분 단위)
const MINUTES_PER_POINT = 9; 
const TARGET_POINT = 500;
// ==========================================

function calculateTime() {
    const inputEl = document.getElementById('currentPoint');
    // 입력값이 없으면 0으로 처리하거나 경고
    if (!inputEl.value) {
        alert("숫자를 입력해주세요.");
        return;
    }

    const inputVal = parseInt(inputEl.value);

    // 유효성 검사
    if (isNaN(inputVal)) {
        alert("올바른 숫자를 입력해주세요.");
        return;
    }
    if (inputVal < 0 || inputVal >= TARGET_POINT) {
        alert("0에서 499 사이의 숫자를 입력해주세요.");
        return;
    }

    // 시간 계산
    const pointsNeeded = TARGET_POINT - inputVal;
    const totalMinutesNeeded = pointsNeeded * MINUTES_PER_POINT;

    const hours = Math.floor(totalMinutesNeeded / 60);
    const minutes = totalMinutesNeeded % 60;

    // 완료 시각 계산
    const now = new Date();
    const finishDate = new Date(now.getTime() + (totalMinutesNeeded * 60 * 1000));

    // 화면 표시 텍스트 생성
    let remainStr = "";
    if (hours > 0) {
        remainStr = `${hours}시간 ${minutes}분 뒤`;
    } else {
        remainStr = `${minutes}분 뒤`;
    }

    // 날짜 포맷 (월/일 시:분)
    const year = finishDate.getFullYear();
    const month = finishDate.getMonth() + 1;
    const date = finishDate.getDate();
    const h = finishDate.getHours();
    const m = String(finishDate.getMinutes()).padStart(2, '0');

    const dateStr = `(${year}년 ${month}월 ${date}일 ${h}시 ${m}분)`;

    // DOM 업데이트
    document.getElementById('remainText').innerText = remainStr;
    document.getElementById('dateText').innerText = dateStr;

    // 화면 전환
    document.getElementById('input-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
}

function resetCalculator() {
    // 입력값 초기화
    document.getElementById('currentPoint').value = '';
    
    // 화면 전환 (입력 화면 보이기)
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('input-screen').style.display = 'block';
    
    // 포커스 이동
    document.getElementById('currentPoint').focus();
}
