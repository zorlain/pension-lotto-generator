// 연금복권720+ 전 회차 데이터를 분석해 통계를 계산한다.
const PENSION_PRIME_DIGITS = new Set([2, 3, 5, 7]);
const PENSION_SEASON_NAMES = ["겨울", "봄", "여름", "가을"];

function digitsOf(numStr) {
  return numStr.split("").map(Number);
}

function pensionSeasonOfMonth(month) {
  if (month === 12 || month === 1 || month === 2) return 0;
  if (month >= 3 && month <= 5) return 1;
  if (month >= 6 && month <= 8) return 2;
  return 3;
}

function computeStats(data) {
  const total = data.length;

  const groupFreq = [0, 0, 0, 0, 0, 0]; // index 1~5 사용
  const digitFreq = Array.from({ length: DIGIT_POSITIONS }, () => new Array(10).fill(0));
  const bonusDigitFreq = Array.from({ length: DIGIT_POSITIONS }, () => new Array(10).fill(0));
  const sumCounts = new Array(55).fill(0); // 자릿수 합계 0~54
  const oddCountDist = new Array(7).fill(0); // 홀수 자릿수 개수 0~6
  const duplicateDigitDist = new Array(6).fill(0); // 한 회차 안에서 중복되는 자릿수 개수 0~5
  const prevDrawRepeatDist = new Array(7).fill(0); // 직전 회차와 같은 자리에서 일치하는 개수 0~6
  const primeDigitCountDist = new Array(7).fill(0); // 소수 자릿수(2,3,5,7) 개수 0~6
  const multiple3DigitDist = new Array(7).fill(0); // 3의 배수 자릿수(0,3,6,9) 개수 0~6
  const multiple5DigitDist = new Array(7).fill(0); // 5의 배수 자릿수(0,5) 개수 0~6
  const ascendStreakDist = { none: 0, two: 0, threePlus: 0 }; // 자릿수 사이 최장 연속(오름차순) 길이
  const repeatStreakDist = { none: 0, two: 0, threePlus: 0 }; // 동일 숫자 연속 반복 최장 길이 (예: 77, 777)
  const digitLastSeenIndex = Array.from({ length: DIGIT_POSITIONS }, () => new Array(10).fill(-1));
  const reappearIntervals = [];
  const seasonGroupFreq = [
    [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0],
  ];
  const numSeen = new Set();
  let hasExactRepeat = false;
  let sumOfSums = 0;

  data.forEach((d, idx) => {
    groupFreq[d.group]++;

    const digits = digitsOf(d.num);
    let sum = 0;
    let oddCount = 0;
    let primeCount = 0;
    let multiple3Count = 0;
    let multiple5Count = 0;
    digits.forEach((digit, pos) => {
      digitFreq[pos][digit]++;
      sum += digit;
      if (digit % 2 === 1) oddCount++;
      if (PENSION_PRIME_DIGITS.has(digit)) primeCount++;
      if (digit % 3 === 0) multiple3Count++;
      if (digit % 5 === 0) multiple5Count++;
    });
    sumCounts[sum]++;
    sumOfSums += sum;
    oddCountDist[oddCount]++;
    primeDigitCountDist[primeCount]++;
    multiple3DigitDist[multiple3Count]++;
    multiple5DigitDist[multiple5Count]++;

    let curAscend = 1;
    let maxAscend = 1;
    let curRepeat = 1;
    let maxRepeat = 1;
    for (let pos = 0; pos < digits.length - 1; pos++) {
      if (digits[pos + 1] - digits[pos] === 1) {
        curAscend++;
        if (curAscend > maxAscend) maxAscend = curAscend;
      } else {
        curAscend = 1;
      }
      if (digits[pos + 1] === digits[pos]) {
        curRepeat++;
        if (curRepeat > maxRepeat) maxRepeat = curRepeat;
      } else {
        curRepeat = 1;
      }
    }
    if (maxAscend === 1) ascendStreakDist.none++;
    else if (maxAscend === 2) ascendStreakDist.two++;
    else ascendStreakDist.threePlus++;

    if (maxRepeat === 1) repeatStreakDist.none++;
    else if (maxRepeat === 2) repeatStreakDist.two++;
    else repeatStreakDist.threePlus++;

    digits.forEach((digit, pos) => {
      const seenAt = digitLastSeenIndex[pos][digit];
      if (seenAt !== -1) reappearIntervals.push(idx - seenAt);
      digitLastSeenIndex[pos][digit] = idx;
    });

    if (numSeen.has(d.num)) hasExactRepeat = true;
    numSeen.add(d.num);

    if (d.date) {
      const month = Number(d.date.split("-")[1]);
      const season = pensionSeasonOfMonth(month);
      seasonGroupFreq[season][d.group]++;
    }

    const uniqueDigitCount = new Set(digits).size;
    duplicateDigitDist[6 - uniqueDigitCount]++;

    if (idx > 0) {
      const prevDigits = digitsOf(data[idx - 1].num);
      let matched = 0;
      for (let pos = 0; pos < DIGIT_POSITIONS; pos++) {
        if (digits[pos] === prevDigits[pos]) matched++;
      }
      prevDrawRepeatDist[matched]++;
    }

    digitsOf(d.bonus).forEach((digit, pos) => bonusDigitFreq[pos][digit]++);
  });

  const avgSum = sumOfSums / total;
  const sumVariance = data.reduce((a, d) => {
    const s = digitsOf(d.num).reduce((x, y) => x + y, 0);
    return a + (s - avgSum) ** 2;
  }, 0) / total;
  const sumStdDev = Math.sqrt(sumVariance);

  const seasonalGroupRanking = PENSION_SEASON_NAMES.map((name, si) => ({
    season: name,
    ranking: [1, 2, 3, 4, 5]
      .map((g) => ({ group: g, count: seasonGroupFreq[si][g] }))
      .sort((a, b) => b.count - a.count),
  }));

  // 재출현 간격(같은 자리에 같은 숫자가 다시 나오기까지 걸린 회차) 히스토그램
  const gapBinWidth = 5;
  const maxInterval = reappearIntervals.length ? Math.max(...reappearIntervals) : 0;
  const gapBinEnd = Math.ceil((maxInterval + 1) / gapBinWidth) * gapBinWidth;
  const gapHistogram = [];
  for (let b = 0; b < gapBinEnd; b += gapBinWidth) {
    gapHistogram.push({ min: b + 1, max: b + gapBinWidth, count: 0 });
  }
  for (const interval of reappearIntervals) {
    const idx = Math.floor((interval - 1) / gapBinWidth);
    gapHistogram[idx].count++;
  }

  // 자릿수 합계 구간을 5단위로 묶어서 히스토그램 bin을 만든다.
  const sumBins = [];
  for (let start = 0; start <= 50; start += 5) {
    const end = Math.min(start + 4, 54);
    let count = 0;
    for (let s = start; s <= end; s++) count += sumCounts[s];
    sumBins.push({ min: start, max: end, count });
  }

  // digitGapNow[pos][digit]: 그 자리에 그 숫자가 마지막으로 나온 뒤 몇 회차가 지났는지(0이면 바로 최근 회차).
  // 한 번도 안 나온 숫자는 total로 취급한다.
  const digitGapNow = Array.from({ length: DIGIT_POSITIONS }, () => new Array(10).fill(total));
  const lastSeenIndex = Array.from({ length: DIGIT_POSITIONS }, () => new Array(10).fill(-1));
  data.forEach((d, idx) => {
    digitsOf(d.num).forEach((digit, pos) => { lastSeenIndex[pos][digit] = idx; });
  });
  for (let pos = 0; pos < DIGIT_POSITIONS; pos++) {
    for (let digit = 0; digit <= 9; digit++) {
      const seenAt = lastSeenIndex[pos][digit];
      if (seenAt !== -1) digitGapNow[pos][digit] = total - 1 - seenAt;
    }
  }

  const hotDigitPerPosition = digitFreq.map((freqs) => {
    let maxIdx = 0;
    freqs.forEach((c, i) => { if (c > freqs[maxIdx]) maxIdx = i; });
    return maxIdx;
  });

  const groupRanking = [1, 2, 3, 4, 5]
    .map((g) => ({ group: g, count: groupFreq[g] }))
    .sort((a, b) => b.count - a.count);

  const recentWindow = Math.min(50, total);
  const recentData = data.slice(-recentWindow);
  const recentGroupFreq = [0, 0, 0, 0, 0, 0];
  recentData.forEach((d) => recentGroupFreq[d.group]++);
  const recentGroupRanking = [1, 2, 3, 4, 5]
    .map((g) => ({ group: g, count: recentGroupFreq[g] }))
    .sort((a, b) => b.count - a.count);

  const lastDraw = data[data.length - 1];

  return {
    totalDraws: total,
    lastDraw,
    groupFreq,
    groupRanking,
    digitFreq,
    hotDigitPerPosition,
    digitGapNow,
    bonusDigitFreq,
    sumBins,
    oddCountDist,
    duplicateDigitDist,
    prevDrawRepeatDist,
    recentWindow,
    recentGroupRanking,
    avgSum,
    sumStdDev,
    primeDigitCountDist,
    multiple3DigitDist,
    multiple5DigitDist,
    ascendStreakDist,
    repeatStreakDist,
    seasonalGroupRanking,
    hasExactRepeat,
    gapHistogram,
  };
}
