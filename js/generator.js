// 통계와, 사용자가 탭2에서 직접 지정한 값(config)을 함께 반영해 연금복권 번호를 생성한다.
// 로또 6/45와 달리 자리마다 숫자가 독립적이고 중복도 허용되므로(예: 000000도 가능),
// "6개 중 distinct 선택" 같은 제약 없이 자리별로 각각 뽑으면 된다.

const WEIGHT_BOOST = 3; // 우대 대상 숫자에 곱해주는 가중치 배수
const TOTAL_ATTEMPT_BUDGET = 20000;

// 자리(0~5)별 숫자(0~9) 가중치를 계산한다. 기본은 전부 동일(1)이고,
// "자릿수별 출현 빈도 가중치"가 켜져 있으면 자리마다 HOT/COLD 상위 3개 숫자에 가중치를 준다.
function computeDigitWeights(stats, config) {
  const weights = Array.from({ length: DIGIT_POSITIONS }, () => new Array(10).fill(1));

  if (config.digitFreq.enabled) {
    for (let pos = 0; pos < DIGIT_POSITIONS; pos++) {
      const ranked = stats.digitFreq[pos]
        .map((count, digit) => ({ digit, count }))
        .sort((a, b) => b.count - a.count);
      const pool = config.digitFreq.direction === "hot" ? ranked.slice(0, 3) : ranked.slice().reverse().slice(0, 3);
      pool.forEach((x) => { weights[pos][x.digit] *= WEIGHT_BOOST; });
    }
  }

  return weights;
}

function weightedDigit(digitWeights) {
  const total = digitWeights.reduce((a, w) => a + w, 0);
  let r = Math.random() * total;
  for (let d = 0; d < digitWeights.length; d++) {
    r -= digitWeights[d];
    if (r <= 0) return d;
  }
  return digitWeights.length - 1;
}

function pickGroup(config) {
  if (config.group.mode !== "auto") return Number(config.group.mode);
  return 1 + Math.floor(Math.random() * 5);
}

function sumOfDigits(digits) {
  return digits.reduce((a, b) => a + b, 0);
}

function oddDigitCountOf(digits) {
  return digits.filter((d) => d % 2 === 1).length;
}

function overlapWithPrev(digits, prevDigits) {
  let count = 0;
  for (let i = 0; i < DIGIT_POSITIONS; i++) {
    if (digits[i] === prevDigits[i]) count++;
  }
  return count;
}

function generateSets(stats, config, count) {
  const weights = computeDigitWeights(stats, config);
  const sumRange = config.sumRange.enabled
    ? { min: config.sumRange.manualMin, max: config.sumRange.manualMax }
    : null;
  const oddRange = config.oddDigit.enabled
    ? { min: config.oddDigit.manualMin, max: config.oddDigit.manualMax }
    : null;
  const maxOverlap = config.prevRepeat.enabled ? config.prevRepeat.maxOverlap : null;
  const prevDigits = digitsOf(stats.lastDraw.num);
  const forcedPositions = config.includeDigits.enabled ? config.includeDigits.positions : null;

  const results = [];
  const seen = new Set();

  for (let attempt = 0; attempt < TOTAL_ATTEMPT_BUDGET && results.length < count; attempt++) {
    const digits = [];
    for (let pos = 0; pos < DIGIT_POSITIONS; pos++) {
      const forced = forcedPositions ? forcedPositions[pos] : null;
      digits.push(forced !== null && forced !== undefined ? forced : weightedDigit(weights[pos]));
    }

    const numStr = digits.join("");
    if (seen.has(numStr)) continue;

    const sum = sumOfDigits(digits);
    if (sumRange && (sum < sumRange.min || sum > sumRange.max)) continue;

    const odd = oddDigitCountOf(digits);
    if (oddRange && (odd < oddRange.min || odd > oddRange.max)) continue;

    if (maxOverlap !== null && overlapWithPrev(digits, prevDigits) > maxOverlap) continue;

    seen.add(numStr);
    results.push({ group: pickGroup(config), num: numStr, sum, odd });
  }

  return results;
}
