/* =========================================================
   [테스트용] 더미 데이터 생성기
   - CSS 확인을 위해 데이터를 강제로 많이 채워넣습니다.
   - script.js가 로드된 후에 이 코드가 실행되어야 합니다.
   ========================================================= */

// 1. 지역 정보 더미 데이터 (12개)
// 변수명: script.js에서 사용하는 이름과 동일해야 함
const dummyMapData = [
    { title: "청하", key: "qinghe", desc: "이야기의 시작점", image: "images/map2.jpeg" },
    { title: "개봉", key: "kaifeng", desc: "가장 번화한 도시", image: "images/map1.jpeg" },
    { title: "귀문시장", key: "gm", desc: "어둠의 거래처", image: "images/map3.jpg" },
    { title: "꿈속의 불선선", key: "drs", desc: "환상의 공간", image: "images/map1.jpeg" },
    { title: "티안취안", key: "tianquan", desc: "높은 산봉우리", image: "images/map2.jpeg" },
    { title: "칭시", key: "qingshi", desc: "푸른 물의 계곡", image: "images/map3.jpg" },
    { title: "격렬한 파도", key: "waves", desc: "위험한 해안가", image: "images/map1.jpeg" },
    { title: "모산로", key: "moshan", desc: "오래된 숲길", image: "images/map2.jpeg" },
    { title: "망천 평원", key: "mangcheon", desc: "끝없는 평야", image: "images/map3.jpg" },
    { title: "흑수림", key: "blackforest", desc: "빛이 들지 않는 곳", image: "images/map1.jpeg" },
    { title: "백두산", key: "baekdu", desc: "눈 덮인 영산", image: "images/map2.jpeg" },
    { title: "소림사", key: "shaolin", desc: "무학의 본산", image: "images/map3.jpg" }
];

// 2. 인물 정보 더미 데이터 (20명)
// 변수명: script.js에서 사용하는 이름과 동일해야 함
const characterData = [
    { name: "주인공", photo: "images/char1.jpg", affiliation: "무소속", biography: "강호를 유람하는 자" },
    { name: "연화", photo: "images/char2.jpg", affiliation: "청하 문파", biography: "검술의 달인" },
    { name: "백리", photo: "images/char3.jpg", affiliation: "개봉 상단", biography: "거상" },
    { name: "운무", photo: "images/char4.jpg", affiliation: "귀문", biography: "암살자" },
    { name: "강무랑", photo: "images/logo.png", affiliation: "강호", biography: "테스트 인물 1" },
    { name: "한향심", photo: "images/logo.png", affiliation: "의원", biography: "테스트 인물 2" },
    { name: "왕청", photo: "images/logo.png", affiliation: "관군", biography: "테스트 인물 3" },
    { name: "저청천", photo: "images/logo.png", affiliation: "학자", biography: "테스트 인물 4" },
    { name: "엄기인", photo: "images/logo.png", affiliation: "상인", biography: "테스트 인물 5" },
    { name: "애제", photo: "images/logo.png", affiliation: "황실", biography: "테스트 인물 6" },
    { name: "천야", photo: "images/logo.png", affiliation: "무희", biography: "테스트 인물 7" },
    { name: "전영", photo: "images/logo.png", affiliation: "장군", biography: "테스트 인물 8" },
    { name: "엽만산", photo: "images/logo.png", affiliation: "산적", biography: "테스트 인물 9" },
    { name: "소십칠", photo: "images/logo.png", affiliation: "거지", biography: "테스트 인물 10" },
    { name: "여래", photo: "images/logo.png", affiliation: "승려", biography: "테스트 인물 11" },
    { name: "이도", photo: "images/logo.png", affiliation: "도망자", biography: "테스트 인물 12" },
    { name: "혜약", photo: "images/logo.png", affiliation: "약초꾼", biography: "테스트 인물 13" },
    { name: "고락", photo: "images/logo.png", affiliation: "악사", biography: "테스트 인물 14" },
    { name: "무상황", photo: "images/logo.png", affiliation: "은둔자", biography: "테스트 인물 15" },
    { name: "구월해", photo: "images/logo.png", affiliation: "해적", biography: "테스트 인물 16" }
];

// 3. 강제 렌더링 실행
// 페이지 로드 시 이 함수들이 실행되어 화면을 갱신합니다.
window.onload = function() {
    console.log("🛠️ 테스트용 더미 데이터 로드 완료");

    if (typeof loadHomeMaps === 'function') {
        loadHomeMaps(); // 또는 renderHomeMaps()
    } else if (typeof renderHomeMaps === 'function') {
        renderHomeMaps();
    }

    if (typeof renderHomeCharacters === 'function') {
        renderHomeCharacters();
    }
};