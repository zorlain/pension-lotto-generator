// 연금복권720+ 전 회차 데이터를 분석해 통계를 계산한다.

function digitsOf(numStr) {
  return numStr.split("").map(Number);
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

  data.forEach((d, idx) => {
    groupFreq[d.group]++;

    const digits = digitsOf(d.num);
    let sum = 0;
    let oddCount = 0;
    digits.forEach((digit, pos) => {
      digitFreq[pos][digit]++;
      sum += digit;
      if (digit % 2 === 1) oddCount++;
    });
    sumCounts[sum]++;
    oddCountDist[oddCount]++;

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
  };
}
