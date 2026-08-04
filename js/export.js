/* ---------- 데이터 통계 엑셀 다운로드 ---------- */
function pushTable(rows, title, header, dataRows) {
  rows.push([title]);
  rows.push(header);
  dataRows.forEach((r) => rows.push(r));
  rows.push([]);
}

function buildPensionDataSheet(data) {
  const rows = [["회차", "추첨일", "조", "번호", "보너스"]];
  data.forEach((d) => rows.push([d.no, d.date, d.group, d.num, d.bonus]));
  return rows;
}

function buildPensionStatsSheet(stats) {
  const rows = [];
  const positionLabels = ["1번째", "2번째", "3번째", "4번째", "5번째", "6번째"];

  pushTable(rows, "요약", ["항목", "값"], [
    ["총 회차 수", stats.totalDraws],
    ["최신 회차", stats.lastDraw.no],
    ["최신 추첨일", stats.lastDraw.date],
    ["자릿수 합계 평균", stats.avgSum.toFixed(2)],
    ["자릿수 합계 표준편차", stats.sumStdDev.toFixed(2)],
    ["완전 동일 번호 재출현 여부", stats.hasExactRepeat ? "있음" : "없음"],
  ]);

  pushTable(
    rows,
    "조별 출현 빈도",
    ["조", "출현 횟수"],
    [1, 2, 3, 4, 5].map((g) => [g, stats.groupFreq[g]])
  );

  const digitRows = [];
  stats.digitFreq.forEach((freqs, pos) => {
    digitRows.push([positionLabels[pos], ...freqs]);
  });
  pushTable(rows, "자릿수별 숫자 분포", ["자리", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], digitRows);

  const bonusDigitRows = [];
  stats.bonusDigitFreq.forEach((freqs, pos) => {
    bonusDigitRows.push([positionLabels[pos], ...freqs]);
  });
  pushTable(rows, "보너스 번호 자릿수별 분포", ["자리", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], bonusDigitRows);

  pushTable(rows, "자릿수 합계 구간 분포", ["구간", "횟수"], stats.sumBins.map((b) => [`${b.min}~${b.max}`, b.count]));

  pushTable(rows, "홀수 자릿수 개수 분포", ["홀수 개수", "횟수"], stats.oddCountDist.map((c, i) => [i, c]));

  pushTable(
    rows,
    "자릿수 중복 개수 분포",
    ["중복 개수", "횟수"],
    stats.duplicateDigitDist.map((c, i) => [i, c])
  );

  pushTable(
    rows,
    "직전 회차 자릿수 일치 분포",
    ["일치 개수", "횟수"],
    stats.prevDrawRepeatDist.map((c, i) => [i, c])
  );

  pushTable(rows, "소수 자릿수 개수 분포", ["소수 개수", "횟수"], stats.primeDigitCountDist.map((c, i) => [i, c]));
  pushTable(rows, "3의 배수 자릿수 개수 분포", ["3의 배수 개수", "횟수"], stats.multiple3DigitDist.map((c, i) => [i, c]));
  pushTable(rows, "5의 배수 자릿수 개수 분포", ["5의 배수 개수", "횟수"], stats.multiple5DigitDist.map((c, i) => [i, c]));

  pushTable(rows, "오름차순 연속 길이 분포", ["구분", "횟수"], [
    ["연속 없음", stats.ascendStreakDist.none],
    ["2연속", stats.ascendStreakDist.two],
    ["3연속 이상", stats.ascendStreakDist.threePlus],
  ]);

  pushTable(rows, "동일 숫자 연속 반복 길이 분포", ["구분", "횟수"], [
    ["반복 없음", stats.repeatStreakDist.none],
    ["2연속 반복", stats.repeatStreakDist.two],
    ["3연속 이상 반복", stats.repeatStreakDist.threePlus],
  ]);

  pushTable(
    rows,
    "재출현 간격 분포",
    ["간격(회차)", "횟수"],
    stats.gapHistogram.map((b) => [`${b.min}~${b.max}`, b.count])
  );

  const seasonalRows = [];
  stats.seasonalGroupRanking.forEach((s) => {
    s.ranking.forEach((x, i) => seasonalRows.push([s.season, i + 1, x.group, x.count]));
  });
  pushTable(rows, "계절별 인기 조 순위", ["계절", "순위", "조", "횟수"], seasonalRows);

  pushTable(
    rows,
    `최근 ${stats.recentWindow}회 조 순위`,
    ["순위", "조", "횟수"],
    stats.recentGroupRanking.map((x, i) => [i + 1, x.group, x.count])
  );

  return rows;
}

function downloadPensionStatsExcel(data, stats) {
  if (typeof XLSX === "undefined") {
    alert("다운로드 기능을 아직 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(buildPensionDataSheet(data));
  const ws2 = XLSX.utils.aoa_to_sheet(buildPensionStatsSheet(stats));
  XLSX.utils.book_append_sheet(wb, ws1, "전체 회차 데이터");
  XLSX.utils.book_append_sheet(wb, ws2, "사이트 통계");
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `연금복권720_데이터_통계_${today}.xlsx`);
}

function initDownloadButton() {
  const btn = document.getElementById("download-stats-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const stats = computeStats(PENSION_DATA);
    downloadPensionStatsExcel(PENSION_DATA, stats);
  });
}

document.addEventListener("DOMContentLoaded", initDownloadButton);
