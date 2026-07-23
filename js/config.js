// 탭2("맞춤 설정")에서 사용자가 켜고 끄고, 직접 값으로 지정하는 생성 설정.
const CONFIG_STORAGE_KEY = "pension-gen-config-v1";
const DIGIT_POSITIONS = 6; // 6자리 숫자

function defaultConfig() {
  return {
    // mode: "auto"(무작위) | "1".."5"(해당 조로 고정)
    group: { mode: "auto" },
    sumRange: { enabled: true, manualMin: 15, manualMax: 35 },
    // positions[i]: i번째 자리(0~5)에 고정할 숫자(0~9). null이면 자동.
    includeDigits: { enabled: false, positions: [null, null, null, null, null, null] },
    // 아래는 전부 "심화 설정" — 초기값은 모두 꺼짐(체크 해제) 상태로 시작한다.
    digitFreq: { enabled: false, direction: "hot" },
    oddDigit: { enabled: false, manualMin: 2, manualMax: 4 },
    prevRepeat: { enabled: false, maxOverlap: 2 },
  };
}

function loadConfig() {
  const base = defaultConfig();
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    for (const key of Object.keys(base)) {
      if (saved[key]) Object.assign(base[key], saved[key]);
    }
    return base;
  } catch (e) {
    return base;
  }
}

function saveConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}
