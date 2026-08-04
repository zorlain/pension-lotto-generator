const POSITION_LABELS = ["1번째", "2번째", "3번째", "4번째", "5번째", "6번째"];

function makeGroupBadge(group, extraClass) {
  const span = document.createElement("span");
  span.className = `group-badge ${extraClass || ""}`;
  span.textContent = `${group}조`;
  return span;
}

function makeDigitTile(digit, extraClass) {
  const span = document.createElement("span");
  span.className = `digit-tile ${extraClass || ""}`;
  span.textContent = digit;
  return span;
}

function makeGroupMiniItem(group, countLabel) {
  const wrap = document.createElement("div");
  wrap.className = "mini-item";
  wrap.appendChild(makeGroupBadge(group));
  const c = document.createElement("span");
  c.className = "mini-count";
  c.textContent = countLabel;
  wrap.appendChild(c);
  return wrap;
}

/* ---------- 클립보드 복사 ---------- */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

function flashCopied(btn, tempLabel) {
  if (btn.dataset.flashing) return;
  btn.dataset.flashing = "1";
  const original = btn.textContent;
  btn.textContent = tempLabel;
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("copied");
    delete btn.dataset.flashing;
  }, 1200);
}

/* ---------- 다크/라이트 모드 토글 ---------- */
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const getTheme = () => document.documentElement.getAttribute("data-theme") || "dark";
  const applyIcon = () => {
    btn.textContent = getTheme() === "light" ? "🌙" : "☀️";
  };

  applyIcon();
  btn.addEventListener("click", () => {
    const next = getTheme() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    applyIcon();
  });
}

/* ---------- 헤더 햄버거 메뉴 ---------- */
function initMenu() {
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("menu-toggle");
  if (!menu || !toggle) return;
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });
  document.addEventListener("click", () => menu.classList.remove("open"));
}

/* ---------- 탭 전환 ---------- */
function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      panels.forEach((p) => {
        p.hidden = p.dataset.tabPanel !== target;
      });
    });
  });
}

/* ---------- 설명 아이콘 툴팁 (PC 호버 + 모바일 탭) ---------- */
function initInfoTooltips() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".info-btn");
    document.querySelectorAll(".info-btn.open").forEach((el) => {
      if (el !== btn) el.classList.remove("open");
    });
    if (btn) {
      btn.classList.toggle("open");
      e.stopPropagation();
    }
  });
}

/* ---------- 번호 생성 (탭1, 탭2 공용) ---------- */
const SET_LABELS = ["A", "B", "C", "D", "E"];

function renderSetsInto(containerId, sets) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  sets.forEach((set, i) => {
    const row = document.createElement("div");
    row.className = "set-row";

    const label = document.createElement("div");
    label.className = "set-label";
    label.textContent = SET_LABELS[i] || i + 1;
    row.appendChild(label);

    const balls = document.createElement("div");
    balls.className = "set-balls";
    balls.appendChild(makeGroupBadge(set.group));
    set.num.split("").forEach((d, pos) => balls.appendChild(makeDigitTile(d, `pos-${pos}`)));
    row.appendChild(balls);

    const actions = document.createElement("div");
    actions.className = "set-actions";

    const meta = document.createElement("span");
    meta.className = "set-meta";
    meta.textContent = `홀${set.odd} 짝${6 - set.odd} · 합계 ${set.sum}`;
    actions.appendChild(meta);

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "📋 복사";
    copyBtn.addEventListener("click", () => {
      copyToClipboard(`${set.group}조 ${set.num}`);
      flashCopied(copyBtn, "✅ 복사됨");
    });
    actions.appendChild(copyBtn);

    row.appendChild(actions);
    container.appendChild(row);
  });
}

const SETS_PER_GENERATE = 5;

function setupGeneratePanel({ btnId, containerId, copyAllBtnId, warningId, stats, config }) {
  const state = { sets: [] };
  const btn = document.getElementById(btnId);
  const copyAllBtn = document.getElementById(copyAllBtnId);
  const warningEl = warningId ? document.getElementById(warningId) : null;

  const doGenerate = () => {
    state.sets = generateSets(stats, config, SETS_PER_GENERATE);
    renderSetsInto(containerId, state.sets);

    if (warningEl) {
      if (state.sets.length < SETS_PER_GENERATE) {
        warningEl.textContent = `⚠️ 설정한 조건이 너무 까다로워서 ${SETS_PER_GENERATE}개 중 ${state.sets.length}개만 생성됐습니다. 필터 조건을 조금 완화해보세요.`;
        warningEl.hidden = false;
      } else {
        warningEl.hidden = true;
      }
    }
  };

  btn.addEventListener("click", doGenerate);
  copyAllBtn.addEventListener("click", () => {
    if (!state.sets.length) return;
    const text = state.sets
      .map((set, i) => `${SET_LABELS[i] || i + 1}: ${set.group}조 ${set.num}`)
      .join("\n");
    copyToClipboard(text);
    flashCopied(copyAllBtn, "✅ 전체 복사 완료");
  });

  return doGenerate;
}

/* ---------- 탭 2: 심화 설정 펼치기/접기 ---------- */
function initAdvancedToggle() {
  const toggleBtn = document.getElementById("advanced-toggle");
  const section = document.getElementById("advanced-section");

  toggleBtn.addEventListener("click", () => {
    const willShow = section.hidden;
    section.hidden = !willShow;
    toggleBtn.textContent = willShow
      ? "🔬 심화 설정 접기"
      : "🔬 심화 설정 펼쳐보기 (3개)";
  });
}

function renderActiveConfigSummary(config) {
  const active = [];

  if (config.group.mode === "perRow") {
    const specified = config.group.perRow.filter((v) => v !== "auto").length;
    if (specified > 0) active.push(`조 지정(줄마다 다르게, ${specified}줄)`);
  } else if (config.group.value !== "auto") {
    active.push(`${config.group.value}조 고정`);
  }
  if (config.sumRange.enabled) {
    active.push(`합계 ${config.sumRange.manualMin}~${config.sumRange.manualMax}`);
  }
  if (config.includeDigits.enabled) {
    const template = config.includeDigits.positions.map((v) => (v === null ? "_" : v)).join("");
    if (template !== "______") active.push(`${template} 자리 고정`);
  }
  if (config.digitFreq.enabled) {
    active.push(`자리별 ${config.digitFreq.direction === "hot" ? "HOT" : "COLD"} 숫자 우대`);
  }
  if (config.gapDigit.enabled) active.push(`${config.gapDigit.threshold}회+ 미출현 숫자 우대`);
  if (config.duplicateDigit.enabled) {
    active.push(`중복 ${config.duplicateDigit.manualMin}~${config.duplicateDigit.manualMax}개`);
  }
  if (config.oddDigit.enabled) {
    active.push(`홀수 ${config.oddDigit.manualMin}~${config.oddDigit.manualMax}개`);
  }
  if (config.prevRepeat.enabled) {
    active.push(`직전회차 일치 최대${config.prevRepeat.maxOverlap}개`);
  }

  const el = document.getElementById("active-config-summary");
  el.textContent = active.length ? active.join(" · ") : "완전 무작위 (모든 조건 미반영)";
}

// 두 개의 <input type="range">를 겹쳐서 최소~최대 범위를 고르는 슬라이더로 동작시킨다.
function bindDualSlider({ minEl, maxEl, fillEl, labelEl, format, getRange, setRange, onChange }) {
  const bounds = { min: Number(minEl.min), max: Number(minEl.max) };

  const render = () => {
    const { min, max } = getRange();
    minEl.value = min;
    maxEl.value = max;
    const span = bounds.max - bounds.min || 1;
    const pctA = ((min - bounds.min) / span) * 100;
    const pctB = ((max - bounds.min) / span) * 100;
    fillEl.style.left = `${pctA}%`;
    fillEl.style.width = `${pctB - pctA}%`;
    labelEl.textContent = format(min, max);
  };

  minEl.addEventListener("input", () => {
    let a = Number(minEl.value);
    const { max } = getRange();
    if (a > max) a = max;
    setRange(a, max);
    render();
    onChange();
  });
  maxEl.addEventListener("input", () => {
    let b = Number(maxEl.value);
    const { min } = getRange();
    if (b < min) b = min;
    setRange(min, b);
    render();
    onChange();
  });

  render();
  return render;
}

/* ---------- 탭 2: 맞춤 설정 ---------- */
function initConfigPanel(stats, config, onChange) {
  const resyncFns = [];

  // 조 선택 (공통 적용 / 줄마다 다르게 설정)
  const groupModeRadios = document.querySelectorAll('input[name="opt-group-mode"]');
  const groupCommonRow = document.getElementById("opt-group-common-row");
  const groupCommonSelect = document.getElementById("opt-group-common-select");
  const groupPerRowGrid = document.getElementById("opt-group-perrow-grid");
  const groupPerRowSelects = [];

  const groupOptionsHtml = () => {
    let html = '<option value="auto">자동</option>';
    for (let g = 1; g <= 5; g++) html += `<option value="${g}">${g}조</option>`;
    return html;
  };

  SET_LABELS.forEach((label, i) => {
    const field = document.createElement("div");
    field.className = "digit-position-field";

    const labelEl = document.createElement("label");
    labelEl.textContent = `${label}줄`;

    const select = document.createElement("select");
    select.dataset.row = String(i);
    select.innerHTML = groupOptionsHtml();

    field.appendChild(labelEl);
    field.appendChild(select);
    groupPerRowGrid.appendChild(field);
    groupPerRowSelects.push(select);
  });

  const syncGroup = () => {
    const isPerRow = config.group.mode === "perRow";
    groupCommonRow.hidden = isPerRow;
    groupPerRowGrid.hidden = !isPerRow;
  };

  const resyncGroup = () => {
    groupModeRadios.forEach((radio) => {
      radio.checked = radio.value === config.group.mode;
    });
    groupCommonSelect.value = config.group.value;
    groupPerRowSelects.forEach((select, i) => {
      select.value = config.group.perRow[i];
    });
    syncGroup();
  };
  resyncGroup();
  resyncFns.push(resyncGroup);

  groupModeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      config.group.mode = radio.value;
      syncGroup();
      onChange();
    });
  });
  groupCommonSelect.addEventListener("change", () => {
    config.group.value = groupCommonSelect.value;
    onChange();
  });
  groupPerRowSelects.forEach((select) => {
    select.addEventListener("change", () => {
      const i = Number(select.dataset.row);
      config.group.perRow[i] = select.value;
      onChange();
    });
  });

  // 자릿수 합계 구간
  const sumEnabled = document.getElementById("opt-sumrange-enabled");
  const sumManualWrap = document.getElementById("opt-sumrange-manual-wrap");

  const renderSumSlider = bindDualSlider({
    minEl: document.getElementById("opt-sumrange-min"),
    maxEl: document.getElementById("opt-sumrange-max"),
    fillEl: document.getElementById("opt-sumrange-fill"),
    labelEl: document.getElementById("opt-sumrange-labels"),
    format: (a, b) => `합계 ${a} ~ ${b}`,
    getRange: () => ({ min: config.sumRange.manualMin, max: config.sumRange.manualMax }),
    setRange: (a, b) => {
      config.sumRange.manualMin = a;
      config.sumRange.manualMax = b;
    },
    onChange,
  });

  const syncSumRange = () => {
    sumManualWrap.classList.toggle("disabled-field", !config.sumRange.enabled);
  };
  const resyncSumRange = () => {
    sumEnabled.checked = config.sumRange.enabled;
    renderSumSlider();
    syncSumRange();
  };
  resyncSumRange();
  resyncFns.push(resyncSumRange);

  sumEnabled.addEventListener("change", () => {
    config.sumRange.enabled = sumEnabled.checked;
    syncSumRange();
    onChange();
  });

  // 원하는 숫자 포함 (자리별 고정)
  const includeEnabled = document.getElementById("opt-include-enabled");
  const includeGrid = document.getElementById("opt-include-grid");
  const includeHint = document.getElementById("opt-include-hint");
  const includeSelects = [];

  POSITION_LABELS.forEach((label, pos) => {
    const field = document.createElement("div");
    field.className = "digit-position-field";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;

    const select = document.createElement("select");
    select.dataset.pos = String(pos);
    const autoOpt = document.createElement("option");
    autoOpt.value = "auto";
    autoOpt.textContent = "자동";
    select.appendChild(autoOpt);
    for (let d = 0; d <= 9; d++) {
      const opt = document.createElement("option");
      opt.value = String(d);
      opt.textContent = String(d);
      select.appendChild(opt);
    }

    field.appendChild(labelEl);
    field.appendChild(select);
    includeGrid.appendChild(field);
    includeSelects.push(select);
  });

  const syncInclude = () => {
    includeSelects.forEach((s) => (s.disabled = !config.includeDigits.enabled));
    const picked = config.includeDigits.positions
      .map((v, i) => (v === null ? null : `${POSITION_LABELS[i]} 자리 = ${v}`))
      .filter(Boolean);
    if (!config.includeDigits.enabled) {
      includeHint.textContent = "";
    } else if (picked.length === 0) {
      includeHint.textContent = "지정한 자리가 없습니다.";
    } else {
      includeHint.textContent = picked.join(" · ");
    }
  };

  const resyncInclude = () => {
    includeEnabled.checked = config.includeDigits.enabled;
    includeSelects.forEach((select, pos) => {
      const v = config.includeDigits.positions[pos];
      select.value = v === null ? "auto" : String(v);
    });
    syncInclude();
  };
  resyncInclude();
  resyncFns.push(resyncInclude);

  includeEnabled.addEventListener("change", () => {
    config.includeDigits.enabled = includeEnabled.checked;
    syncInclude();
    onChange();
  });
  includeSelects.forEach((select) => {
    select.addEventListener("change", () => {
      const pos = Number(select.dataset.pos);
      config.includeDigits.positions[pos] = select.value === "auto" ? null : Number(select.value);
      syncInclude();
      onChange();
    });
  });

  // 자릿수별 누적 출현 빈도 가중치
  const digitFreqEnabled = document.getElementById("opt-digitfreq-enabled");
  const digitFreqRadios = document.querySelectorAll('input[name="opt-digitfreq-direction"]');

  const syncDigitFreq = () => {
    digitFreqRadios.forEach((r) => (r.disabled = !config.digitFreq.enabled));
  };
  const resyncDigitFreq = () => {
    digitFreqEnabled.checked = config.digitFreq.enabled;
    digitFreqRadios.forEach((radio) => {
      radio.checked = radio.value === config.digitFreq.direction;
    });
    syncDigitFreq();
  };
  resyncDigitFreq();
  resyncFns.push(resyncDigitFreq);

  digitFreqEnabled.addEventListener("change", () => {
    config.digitFreq.enabled = digitFreqEnabled.checked;
    syncDigitFreq();
    onChange();
  });
  digitFreqRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        config.digitFreq.direction = radio.value;
        onChange();
      }
    });
  });

  // 자릿수별 최근 미출현 가중치
  const gapDigitEnabled = document.getElementById("opt-gapdigit-enabled");
  const gapDigitThreshold = document.getElementById("opt-gapdigit-threshold");

  const syncGapDigit = () => {
    gapDigitThreshold.disabled = !config.gapDigit.enabled;
  };
  const resyncGapDigit = () => {
    gapDigitEnabled.checked = config.gapDigit.enabled;
    gapDigitThreshold.value = config.gapDigit.threshold;
    syncGapDigit();
  };
  resyncGapDigit();
  resyncFns.push(resyncGapDigit);

  gapDigitEnabled.addEventListener("change", () => {
    config.gapDigit.enabled = gapDigitEnabled.checked;
    syncGapDigit();
    onChange();
  });
  gapDigitThreshold.addEventListener("input", () => {
    config.gapDigit.threshold = Math.max(1, Number(gapDigitThreshold.value) || 1);
    onChange();
  });

  // 자릿수 중복 개수 제한
  const duplicateEnabled = document.getElementById("opt-duplicatedigit-enabled");
  const duplicateManualWrap = document.getElementById("opt-duplicatedigit-manual-wrap");

  const renderDuplicateSlider = bindDualSlider({
    minEl: document.getElementById("opt-duplicatedigit-min"),
    maxEl: document.getElementById("opt-duplicatedigit-max"),
    fillEl: document.getElementById("opt-duplicatedigit-fill"),
    labelEl: document.getElementById("opt-duplicatedigit-labels"),
    format: (a, b) => (a === b ? `중복 ${a}개` : `중복 ${a}~${b}개`),
    getRange: () => ({ min: config.duplicateDigit.manualMin, max: config.duplicateDigit.manualMax }),
    setRange: (a, b) => {
      config.duplicateDigit.manualMin = a;
      config.duplicateDigit.manualMax = b;
    },
    onChange,
  });

  const syncDuplicate = () => {
    duplicateManualWrap.classList.toggle("disabled-field", !config.duplicateDigit.enabled);
  };
  const resyncDuplicate = () => {
    duplicateEnabled.checked = config.duplicateDigit.enabled;
    renderDuplicateSlider();
    syncDuplicate();
  };
  resyncDuplicate();
  resyncFns.push(resyncDuplicate);

  duplicateEnabled.addEventListener("change", () => {
    config.duplicateDigit.enabled = duplicateEnabled.checked;
    syncDuplicate();
    onChange();
  });

  // 홀수 자릿수 개수
  const oddEnabled = document.getElementById("opt-odddigit-enabled");
  const oddManualWrap = document.getElementById("opt-odddigit-manual-wrap");

  const renderOddSlider = bindDualSlider({
    minEl: document.getElementById("opt-odddigit-min"),
    maxEl: document.getElementById("opt-odddigit-max"),
    fillEl: document.getElementById("opt-odddigit-fill"),
    labelEl: document.getElementById("opt-odddigit-labels"),
    format: (a, b) => (a === b ? `홀수 ${a}개` : `홀수 ${a}~${b}개`),
    getRange: () => ({ min: config.oddDigit.manualMin, max: config.oddDigit.manualMax }),
    setRange: (a, b) => {
      config.oddDigit.manualMin = a;
      config.oddDigit.manualMax = b;
    },
    onChange,
  });

  const syncOdd = () => {
    oddManualWrap.classList.toggle("disabled-field", !config.oddDigit.enabled);
  };
  const resyncOdd = () => {
    oddEnabled.checked = config.oddDigit.enabled;
    renderOddSlider();
    syncOdd();
  };
  resyncOdd();
  resyncFns.push(resyncOdd);

  oddEnabled.addEventListener("change", () => {
    config.oddDigit.enabled = oddEnabled.checked;
    syncOdd();
    onChange();
  });

  // 직전 회차와 자릿수 일치 제한
  const prevRepeatEnabled = document.getElementById("opt-prevrepeat-enabled");
  const prevRepeatMax = document.getElementById("opt-prevrepeat-max");
  document.getElementById("opt-prevrepeat-drawno").textContent = stats.lastDraw.no;

  const syncPrevRepeat = () => {
    prevRepeatMax.disabled = !config.prevRepeat.enabled;
  };
  const resyncPrevRepeat = () => {
    prevRepeatEnabled.checked = config.prevRepeat.enabled;
    prevRepeatMax.value = String(config.prevRepeat.maxOverlap);
    syncPrevRepeat();
  };
  resyncPrevRepeat();
  resyncFns.push(resyncPrevRepeat);

  prevRepeatEnabled.addEventListener("change", () => {
    config.prevRepeat.enabled = prevRepeatEnabled.checked;
    syncPrevRepeat();
    onChange();
  });
  prevRepeatMax.addEventListener("change", () => {
    config.prevRepeat.maxOverlap = Number(prevRepeatMax.value);
    onChange();
  });

  document.getElementById("reset-config-btn").addEventListener("click", () => {
    const fresh = defaultConfig();
    Object.keys(fresh).forEach((key) => Object.assign(config[key], fresh[key]));
    resyncFns.forEach((fn) => fn());
    onChange();
  });
}

/* ---------- 탭 3: 데이터 통계 ---------- */
function renderTrustLine(stats) {
  document.getElementById("stats-trust-line").textContent =
    `1회 ~ ${stats.lastDraw.no}회 (${stats.lastDraw.date}) · 총 ${stats.totalDraws.toLocaleString()}개 회차 전수 분석`;
}

function renderGroupFreqChart(stats) {
  const container = document.getElementById("group-freq-chart");
  container.innerHTML = "";
  const max = Math.max(...stats.groupFreq.slice(1));
  const min = Math.min(...stats.groupFreq.slice(1));

  for (let g = 1; g <= 5; g++) {
    const col = document.createElement("div");
    col.className = "freq-col";

    const bar = document.createElement("div");
    bar.className = "freq-bar";
    if (stats.groupFreq[g] === max) bar.classList.add("freq-hot");
    if (stats.groupFreq[g] === min) bar.classList.add("freq-cold");
    const pct = (stats.groupFreq[g] / max) * 100;
    bar.style.height = `${Math.max(pct, 3)}%`;
    bar.title = `${g}조: ${stats.groupFreq[g]}회 출현`;

    const countLabel = document.createElement("div");
    countLabel.className = "freq-count";
    countLabel.textContent = stats.groupFreq[g];

    const numLabel = document.createElement("div");
    numLabel.className = "freq-num";
    numLabel.textContent = `${g}조`;

    col.appendChild(countLabel);
    col.appendChild(bar);
    col.appendChild(numLabel);
    container.appendChild(col);
  }
}

// 자리(0~5)별 숫자(0~9) 출현 횟수를 히트맵 형태로 그린다. 각 자리에서 가장 많이 나온 숫자에 강조 표시한다.
function renderDigitHeatmap(containerId, digitFreqArray) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  digitFreqArray.forEach((freqs, pos) => {
    const row = document.createElement("div");
    row.className = "digit-heatmap-row";

    const label = document.createElement("div");
    label.className = "digit-heatmap-label";
    label.textContent = `${POSITION_LABELS[pos]} 자리`;

    const cells = document.createElement("div");
    cells.className = "digit-heatmap-cells";

    const max = Math.max(...freqs);
    freqs.forEach((count, digit) => {
      const cell = document.createElement("div");
      cell.className = "digit-heatmap-cell";
      if (count === max) cell.classList.add("hot");

      const digitEl = document.createElement("span");
      digitEl.className = "digit-heatmap-cell-digit";
      digitEl.textContent = digit;

      const countEl = document.createElement("span");
      countEl.className = "digit-heatmap-cell-count";
      countEl.textContent = `${count}회`;

      cell.appendChild(digitEl);
      cell.appendChild(countEl);
      cells.appendChild(cell);
    });

    row.appendChild(label);
    row.appendChild(cells);
    container.appendChild(row);
  });
}

// {min, max, count} 구간 목록을 세로 막대 히스토그램으로 그린다.
function renderBinBarChart(containerId, bins) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const max = Math.max(...bins.map((b) => b.count));
  const total = bins.reduce((a, b) => a + b.count, 0);

  bins.forEach((bin) => {
    const col = document.createElement("div");
    col.className = "sum-col";

    const count = document.createElement("div");
    count.className = "sum-count";
    count.textContent = bin.count;

    const pctLabel = document.createElement("div");
    pctLabel.className = "sum-pct";
    pctLabel.textContent = `${((bin.count / total) * 100).toFixed(1)}%`;

    const bar = document.createElement("div");
    bar.className = "sum-bar";
    if (bin.count === max) bar.classList.add("sum-peak");
    const pct = (bin.count / max) * 100;
    bar.style.height = `${Math.max(pct, 2)}%`;
    bar.title = `${bin.min}~${bin.max}: ${bin.count}회 (${((bin.count / total) * 100).toFixed(1)}%)`;

    const label = document.createElement("div");
    label.className = "sum-label";
    label.textContent = `${bin.min}`;

    col.appendChild(count);
    col.appendChild(pctLabel);
    col.appendChild(bar);
    col.appendChild(label);
    container.appendChild(col);
  });
}

// 개수 배열(counts[i] = i에 해당하는 값의 발생 횟수)을 가로 막대 목록으로 그린다.
function renderHBarDist(containerId, counts, labelFn) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const max = Math.max(...counts);
  const total = counts.reduce((a, b) => a + b, 0);

  counts.forEach((count, i) => {
    const row = document.createElement("div");
    row.className = "hbar-row";

    const label = document.createElement("div");
    label.className = "hbar-label";
    label.textContent = labelFn(i);

    const track = document.createElement("div");
    track.className = "hbar-track";
    const bar = document.createElement("div");
    bar.className = "hbar-fill";
    const pct = (count / max) * 100;
    bar.style.width = `${Math.max(pct, 2)}%`;
    track.appendChild(bar);

    const value = document.createElement("div");
    value.className = "hbar-value";
    const pctOfTotal = ((count / total) * 100).toFixed(1);
    value.textContent = `${count}회 (${pctOfTotal}%)`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    container.appendChild(row);
  });
}

function renderSumChart(stats) {
  renderBinBarChart("sum-chart", stats.sumBins);
}

function renderOddDigitChart(stats) {
  renderHBarDist("odd-digit-chart", stats.oddCountDist, (i) => `홀${i}개`);
}

function renderDuplicateDigitChart(stats) {
  renderHBarDist("duplicate-digit-chart", stats.duplicateDigitDist, (i) => (i === 0 ? "전부 다름" : `중복 ${i}개`));
}

function renderPrevRepeatChart(stats) {
  renderHBarDist("prevrepeat-chart", stats.prevDrawRepeatDist, (i) => `${i}자리 일치`);
}

function renderTrendComparison(stats) {
  document.getElementById("trend-desc").textContent =
    `최근 ${stats.recentWindow}회와 전체 ${stats.totalDraws.toLocaleString()}회 기준 조 출현 순위를 비교합니다.`;
  document.getElementById("trend-recent-title").textContent = `최근 ${stats.recentWindow}회 조 순위`;

  const allList = document.getElementById("trend-all-list");
  const recentList = document.getElementById("trend-recent-list");
  allList.innerHTML = "";
  recentList.innerHTML = "";
  stats.groupRanking.forEach((x) => allList.appendChild(makeGroupMiniItem(x.group, `${x.count}회`)));
  stats.recentGroupRanking.forEach((x) => recentList.appendChild(makeGroupMiniItem(x.group, `${x.count}회`)));
}

function renderSumStdDev(stats) {
  document.getElementById("sum-stddev-stat").textContent =
    `평균 합계 ${stats.avgSum.toFixed(1)} · 표준편차 ${stats.sumStdDev.toFixed(1)} (숫자가 작을수록 합계가 평균 근처에 몰려있다는 뜻)`;
}

function renderPrimeMultipleCharts(stats) {
  renderHBarDist("prime-digit-chart", stats.primeDigitCountDist, (i) => `소수 ${i}개`);
  renderHBarDist("multiple3-digit-chart", stats.multiple3DigitDist, (i) => `${i}개`);
  renderHBarDist("multiple5-digit-chart", stats.multiple5DigitDist, (i) => `${i}개`);
}

function renderStreakCharts(stats) {
  document.getElementById("exact-repeat-stat").textContent = stats.hasExactRepeat
    ? "전 회차 중 완전히 동일한 6자리 번호가 나온 적이 있습니다."
    : "전 회차 중 완전히 동일한 6자리 번호가 나온 적은 없습니다.";

  const ascendCounts = [stats.ascendStreakDist.none, stats.ascendStreakDist.two, stats.ascendStreakDist.threePlus];
  renderHBarDist("ascend-streak-chart", ascendCounts, (i) => ["연속 없음", "2연속", "3연속 이상"][i]);

  const repeatCounts = [stats.repeatStreakDist.none, stats.repeatStreakDist.two, stats.repeatStreakDist.threePlus];
  renderHBarDist("repeat-streak-chart", repeatCounts, (i) => ["반복 없음", "2연속 반복", "3연속 이상 반복"][i]);
}

function renderReappearChart(stats) {
  renderBinBarChart("reappear-chart", stats.gapHistogram);
}

function renderSeasonalGroupLists(stats) {
  const container = document.getElementById("seasonal-group-lists");
  container.innerHTML = "";

  stats.seasonalGroupRanking.forEach((s) => {
    const wrap = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = `${s.season} 조 순위`;
    const list = document.createElement("div");
    list.className = "top-list";
    s.ranking.forEach((x) => list.appendChild(makeGroupMiniItem(x.group, `${x.count}회`)));
    wrap.appendChild(heading);
    wrap.appendChild(list);
    container.appendChild(wrap);
  });
}

/* ---------- 검색결과 클릭률(SERP CTR) 개선용 최신 회차 반영 title/meta ---------- */
function renderSeoMeta(stats) {
  const no = stats.lastDraw.no;
  const date = stats.lastDraw.date;

  const title = `무료 연금복권 번호 생성기 - 연금복권720+ ${no}회 당첨결과 반영 통계 분석`;
  const description =
    `연금복권720+ ${no}회(${date}) 당첨번호까지 반영한 전 회차 데이터를 분석해 조·자릿수 통계 기반으로 번호를 추천합니다. ` +
    `조 선택, 자릿수 합계, 자릿수별 출현빈도까지 직접 설정 가능. 회원가입 없이 무료로 이용하세요.`;

  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
}

/* ---------- 초기화 ---------- */
function init() {
  const stats = computeStats(PENSION_DATA);
  const config = loadConfig();

  renderSeoMeta(stats);
  initThemeToggle();
  initMenu();
  initTabs();
  initAdvancedToggle();
  initInfoTooltips();

  renderTrustLine(stats);
  renderGroupFreqChart(stats);
  renderDigitHeatmap("digit-heatmap", stats.digitFreq);
  renderDigitHeatmap("bonus-digit-heatmap", stats.bonusDigitFreq);
  renderSumChart(stats);
  renderSumStdDev(stats);
  renderPrimeMultipleCharts(stats);
  renderOddDigitChart(stats);
  renderDuplicateDigitChart(stats);
  renderStreakCharts(stats);
  renderPrevRepeatChart(stats);
  renderTrendComparison(stats);
  renderReappearChart(stats);
  renderSeasonalGroupLists(stats);

  const onConfigChange = () => {
    saveConfig(config);
    renderActiveConfigSummary(config);
  };

  initConfigPanel(stats, config, onConfigChange);
  renderActiveConfigSummary(config);

  const doGenerate1 = setupGeneratePanel({
    btnId: "generate-btn",
    containerId: "generated-sets",
    copyAllBtnId: "copy-all-btn",
    warningId: "generate-warning",
    stats,
    config,
  });
  setupGeneratePanel({
    btnId: "generate-btn-2",
    containerId: "generated-sets-2",
    copyAllBtnId: "copy-all-btn-2",
    warningId: "generate-warning-2",
    stats,
    config,
  });

  doGenerate1();
}

document.addEventListener("DOMContentLoaded", init);
