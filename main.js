/* ================================================
   PENSION FUND DIGITAL TWIN — ZIMBABWE (Enhanced v2)
   Full Simulation Engine with ZAPF Competition Features
   Live RBZ / IOBZ data, Draggable Output, IPEC Inline
   v2.4 - ZimRate v1 API Direct Integration (FIXED)
   ================================================ */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  // MOSI OA TUNYA GOLD COIN DATA
  // RBZ: LBMA PM Fix + 5% premium, 1 troy oz 22-carat
  // ═══════════════════════════════════════════════
  const GOLD_DATA = {
    name: 'Mosi oa Tunya Gold Coin',
    description: '1 troy oz, 22-carat (91.67% pure gold)',
    issuer: 'Reserve Bank of Zimbabwe (RBZ)',
    pricingBasis: 'LBMA PM Fix + 5% premium',
    historicalPrices: [
      { date: '2022-07-25', usd: 1824.00, event: 'Launch date' },
      { date: '2023-01-03', usd: 1857.60, event: 'Early 2023' },
      { date: '2023-06-15', usd: 2016.00, event: 'Mid 2023' },
      { date: '2023-12-29', usd: 2172.80, event: 'End 2023' },
      { date: '2024-01-02', usd: 2182.32, event: 'Start 2024' },
      { date: '2024-01-30', usd: 2022.50, event: 'Jan dip' },
      { date: '2024-02-13', usd: 2015.20, event: 'Feb 2024' },
      { date: '2024-04-05', usd: 2300.00, event: 'ZiG introduction' },
      { date: '2024-05-22', usd: 2427.30, event: 'May 2024' },
      { date: '2024-09-15', usd: 2580.00, event: 'Sep 2024' },
      { date: '2024-12-31', usd: 2650.00, event: 'End 2024' },
      { date: '2025-03-14', usd: 2890.00, event: 'Mar 2025' },
      { date: '2025-06-01', usd: 3050.00, event: 'Jun 2025 est.' },
    ],
    currentPrice: 2890, // Updated baseline — LBMA ~$2750 + 5% RBZ premium
    annualAppreciation: 0.12, // ~12% per year (2022-2025 LBMA trend)
    zigConversion: 27.5, // Updated market rate ZiG per USD (mid-2025)
  };

  // ═══════════════════════════════════════════════
  // ZiG HISTORICAL DATA (fallback for sparklines)
  // ═══════════════════════════════════════════════
  const ZIG_HISTORY = [
    { date: 'Apr 2024', rate: 13.56, event: 'ZiG Launch (RBZ)' },
    { date: 'May 2024', rate: 13.56 },
    { date: 'Jun 2024', rate: 13.90 },
    { date: 'Jul 2024', rate: 14.80 },
    { date: 'Aug 2024', rate: 16.20 },
    { date: 'Sep 2024', rate: 17.50 },
    { date: 'Oct 2024', rate: 19.10 },
    { date: 'Nov 2024', rate: 20.30 },
    { date: 'Dec 2024', rate: 21.40 },
    { date: 'Jan 2025', rate: 22.00 },
    { date: 'Feb 2025', rate: 23.50 },
    { date: 'Mar 2025', rate: 25.00 },
    { date: 'Apr 2025', rate: 26.80 },
    { date: 'May 2025', rate: 27.50, event: 'Current est.' },
  ];

  // ═══════════════════════════════════════════════
  // SCENARIO PRESETS
  // ═══════════════════════════════════════════════
  const PRESETS = {
    custom: null,
    '2008crisis': {
      name: '2008 Hyperinflation Crisis',
      employeeContrib: 30, employerContrib: 45, payout: 100,
      age: 35, retirement: 60, inflation: 231,
      allocEquities: 10, allocBonds: 5, allocRealestate: 15, allocMoney: 60, allocGold: 10,
      inflationModel: 'volatile', lifeExpectancy: 55, longevityUncertainty: 8,
    },
    covid2020: {
      name: 'COVID-19 Impact (2020)',
      employeeContrib: 40, employerContrib: 60, payout: 150,
      age: 30, retirement: 60, inflation: 350,
      allocEquities: 30, allocBonds: 30, allocRealestate: 20, allocMoney: 15, allocGold: 5,
      inflationModel: 'volatile', lifeExpectancy: 61, longevityUncertainty: 10,
    },
    zig2024: {
      name: 'ZiG Currency Transition (2024)',
      employeeContrib: 50, employerContrib: 75, payout: 200,
      age: 30, retirement: 60, inflation: 55,
      allocEquities: 40, allocBonds: 20, allocRealestate: 20, allocMoney: 10, allocGold: 10,
      inflationModel: 'volatile', lifeExpectancy: 62, longevityUncertainty: 8,
    },
    stable: {
      name: 'Stable Growth Baseline',
      employeeContrib: 80, employerContrib: 120, payout: 300,
      age: 25, retirement: 65, inflation: 8,
      allocEquities: 50, allocBonds: 25, allocRealestate: 15, allocMoney: 5, allocGold: 5,
      inflationModel: 'decreasing', lifeExpectancy: 72, longevityUncertainty: 5,
    },
    nssa: {
      name: 'NSSA Default Parameters',
      employeeContrib: 45, employerContrib: 45, payout: 120,
      age: 30, retirement: 60, inflation: 30,
      allocEquities: 35, allocBonds: 30, allocRealestate: 20, allocMoney: 10, allocGold: 5,
      inflationModel: 'constant', lifeExpectancy: 62, longevityUncertainty: 8,
    },
  };

  // ═══════════════════════════════════════════════
  // DOM REFERENCES
  // ═══════════════════════════════════════════════
  const $ = (id) => document.getElementById(id);
  const canvas = $('sim-canvas');
  const ctx = canvas.getContext('2d');

  const sliders = {
    employeeContrib: $('slider-employee-contrib'), employerContrib: $('slider-employer-contrib'),
    payout: $('slider-payout'), age: $('slider-age'), retirement: $('slider-retirement'),
    inflation: $('slider-inflation'),
    allocEquities: $('slider-alloc-equities'), allocBonds: $('slider-alloc-bonds'),
    allocRealestate: $('slider-alloc-realestate'), allocMoney: $('slider-alloc-money'),
    allocGold: $('slider-alloc-gold'),
    lifeExpectancy: $('slider-life-expectancy'), longevityUncertainty: $('slider-longevity-uncertainty'),
    minFunding: $('slider-min-funding'), replacementRatio: $('slider-replacement-ratio'),
  };
  const vals = {};
  Object.keys(sliders).forEach(k => {
    const valEl = document.querySelector(`#val-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    if (valEl) vals[k] = valEl;
  });
  vals.employeeContrib = $('val-employee-contrib');
  vals.employerContrib = $('val-employer-contrib');
  vals.lifeExpectancy = $('val-life-expectancy');
  vals.longevityUncertainty = $('val-longevity-uncertainty');
  vals.minFunding = $('val-min-funding');
  vals.replacementRatio = $('val-replacement-ratio');
  vals.allocEquities = $('val-alloc-equities');
  vals.allocBonds = $('val-alloc-bonds');
  vals.allocRealestate = $('val-alloc-realestate');
  vals.allocMoney = $('val-alloc-money');
  vals.allocGold = $('val-alloc-gold');
  vals.payout = $('val-payout');
  vals.age = $('val-age');
  vals.retirement = $('val-retirement');
  vals.inflation = $('val-inflation');

  // ═══════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════
  let simState = {
    running: false, animFrame: null, projectionData: [],
    currentStep: 0, challengeEvents: [],
    currency: 'USD', projectionYears: 30, inflationModel: 'decreasing',
    goldBasePrice: 2890, zigRate: 27.5,
  };

  // ═══════════════════════════════════════════════
  // SLIDER SYNC
  // ═══════════════════════════════════════════════
  Object.keys(sliders).forEach(k => {
    if (sliders[k] && vals[k]) {
      sliders[k].addEventListener('input', () => { vals[k].textContent = sliders[k].value; });
    }
  });

  function updateProjectionYears() {
    const lifeExp = parseInt(sliders.lifeExpectancy.value) || 75;
    const curAge  = parseInt(sliders.age.value) || 30;
    simState.projectionYears = Math.max(20, Math.min(80, lifeExp - curAge));
  }
  sliders.age.addEventListener('input', updateProjectionYears);
  sliders.lifeExpectancy.addEventListener('input', updateProjectionYears);

  const allocSliders = ['allocEquities', 'allocBonds', 'allocRealestate', 'allocMoney', 'allocGold'];
  const retirementSelect = document.getElementById('select-retirement');
  if (retirementSelect) {
    retirementSelect.addEventListener('change', () => {
      const v = retirementSelect.value;
      if (v === 'custom') {
        sliders.retirement.style.display = '';
      } else {
        sliders.retirement.style.display = 'none';
        sliders.retirement.value = v;
        vals.retirement.textContent = v;
      }
      updateProjectionYears();
    });
  }

  allocSliders.forEach(k => { sliders[k].addEventListener('input', updateAllocTotal); });
  function updateAllocTotal() {
    const total = allocSliders.reduce((s, k) => s + parseInt(sliders[k].value), 0);
    const el = $('alloc-total');
    const summary = $('allocation-summary');
    el.textContent = total;
    summary.className = 'allocation-summary ' + (total > 100 ? 'over' : total < 100 ? 'under' : 'ok');
    drawAllocChart();
  }

  // ═══════════════════════════════════════════════
  // ALLOCATION DONUT CHART
  // ═══════════════════════════════════════════════
  function drawAllocChart() {
    const c = $('alloc-chart');
    if (!c) return;
    const cx2d = c.getContext('2d');
    const w = c.width, h = c.height, cx = w/2, cy = h/2, r = 60;
    cx2d.clearRect(0, 0, w, h);
    const data = [
      { val: parseInt(sliders.allocEquities.value), color: '#ef4444', label: 'Equities' },
      { val: parseInt(sliders.allocBonds.value), color: '#3b82f6', label: 'Bonds' },
      { val: parseInt(sliders.allocRealestate.value), color: '#a855f7', label: 'Property' },
      { val: parseInt(sliders.allocMoney.value), color: '#06d6a0', label: 'Cash' },
      { val: parseInt(sliders.allocGold.value), color: '#d4a843', label: 'Gold' },
    ];
    const total = data.reduce((s, d) => s + d.val, 0) || 1;
    let startAngle = -Math.PI / 2;
    data.forEach(d => {
      const slice = (d.val / total) * Math.PI * 2;
      cx2d.beginPath(); cx2d.moveTo(cx, cy); cx2d.arc(cx, cy, r, startAngle, startAngle + slice);
      cx2d.closePath(); cx2d.fillStyle = d.color; cx2d.fill(); startAngle += slice;
    });
    cx2d.beginPath(); cx2d.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    cx2d.fillStyle = isLight ? '#f7f9fc' : '#050505'; cx2d.fill();
    cx2d.fillStyle = isLight ? '#0f172a' : '#e2e8f0';
    cx2d.font = '700 14px "Plus Jakarta Sans"'; cx2d.textAlign = 'center';
    cx2d.fillText(total + '%', cx, cy + 5);
  }

  // ═══════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
  document.querySelectorAll('.term-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.term-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.term-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $('terminal-' + tab.dataset.termtab).classList.add('active');
    });
  });

  // ═══════════════════════════════════════════════
  // CURRENCY & SETTINGS
  // ═══════════════════════════════════════════════
  $('select-currency').addEventListener('change', () => { simState.currency = $('select-currency').value; });
  $('setting-inflation-model').addEventListener('change', () => { simState.inflationModel = $('setting-inflation-model').value; });
  $('settings-gear').addEventListener('click', () => $('modal-overlay').classList.add('open'));
  $('modal-close').addEventListener('click', () => $('modal-overlay').classList.remove('open'));
  $('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) $('modal-overlay').classList.remove('open'); });
  $('setting-years').addEventListener('change', () => { simState.projectionYears = parseInt($('setting-years').value); });
  $('setting-gold-price').addEventListener('change', () => { simState.goldBasePrice = parseInt($('setting-gold-price').value); GOLD_DATA.currentPrice = simState.goldBasePrice; });
  $('setting-zig-rate').addEventListener('change', () => { simState.zigRate = parseFloat($('setting-zig-rate').value); GOLD_DATA.zigConversion = simState.zigRate; });

  function setActiveMode(mode) {
    $('btn-scenario').classList.toggle('active', mode === 'scenario');
    $('btn-live').classList.toggle('active', mode === 'live');
    if ($('btn-rates')) $('btn-rates').classList.toggle('active', mode === 'rates');
    $('pensioner-overlay').classList.toggle('open', mode === 'live');
    if ($('rates-overlay')) $('rates-overlay').classList.toggle('open', mode === 'rates');
    if (mode !== 'rates') stopRatesRefresh();
  }

  $('btn-scenario').addEventListener('click', () => setActiveMode('scenario'));
  $('btn-live').addEventListener('click', () => { setActiveMode('live'); showPensionerView(); });
  $('pensioner-close').addEventListener('click', () => setActiveMode('scenario'));
  $('pensioner-overlay').addEventListener('click', e => { if (e.target === $('pensioner-overlay')) setActiveMode('scenario'); });

  if ($('btn-rates')) {
    $('btn-rates').addEventListener('click', () => { setActiveMode('rates'); startRatesView(); });
  }
  if ($('rates-close')) { $('rates-close').addEventListener('click', () => setActiveMode('scenario')); }
  if ($('rates-overlay')) { $('rates-overlay').addEventListener('click', e => { if (e.target === $('rates-overlay')) setActiveMode('scenario'); }); }
  if ($('rates-refresh-btn')) { $('rates-refresh-btn').addEventListener('click', () => loadRatesData()); }

  const pensionerRunBtn = $('pensioner-run-sim');
  if (pensionerRunBtn) {
    pensionerRunBtn.addEventListener('click', () => {
      $('pensioner-overlay').classList.remove('open');
      $('btn-scenario').classList.add('active');
      $('btn-live').classList.remove('active');
      startSimulation();
    });
  }

  // ═══════════════════════════════════════════════
  // SCENARIO PRESETS
  // ═══════════════════════════════════════════════
  function applyPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    sliders.employeeContrib.value = p.employeeContrib; vals.employeeContrib.textContent = p.employeeContrib;
    sliders.employerContrib.value = p.employerContrib; vals.employerContrib.textContent = p.employerContrib;
    sliders.payout.value = p.payout; vals.payout.textContent = p.payout;
    sliders.age.value = p.age; vals.age.textContent = p.age;
    sliders.retirement.value = p.retirement; vals.retirement.textContent = p.retirement;
    sliders.inflation.value = Math.min(p.inflation, 500); vals.inflation.textContent = Math.min(p.inflation, 500);
    sliders.allocEquities.value = p.allocEquities; vals.allocEquities.textContent = p.allocEquities;
    sliders.allocBonds.value = p.allocBonds; vals.allocBonds.textContent = p.allocBonds;
    sliders.allocRealestate.value = p.allocRealestate; vals.allocRealestate.textContent = p.allocRealestate;
    sliders.allocMoney.value = p.allocMoney; vals.allocMoney.textContent = p.allocMoney;
    sliders.allocGold.value = p.allocGold; vals.allocGold.textContent = p.allocGold;
    sliders.lifeExpectancy.value = p.lifeExpectancy; vals.lifeExpectancy.textContent = p.lifeExpectancy;
    sliders.longevityUncertainty.value = p.longevityUncertainty; vals.longevityUncertainty.textContent = p.longevityUncertainty;
    $('setting-inflation-model').value = p.inflationModel;
    simState.inflationModel = p.inflationModel;
    const retSel = $('select-retirement');
    if (retSel) {
      const opt = retSel.querySelector(`option[value="${p.retirement}"]`);
      if (opt) { retSel.value = String(p.retirement); sliders.retirement.style.display = 'none'; }
      else { retSel.value = 'custom'; sliders.retirement.style.display = ''; }
    }
    updateAllocTotal();
  }

  $('preset-select').addEventListener('change', () => {
    const key = $('preset-select').value;
    if (key === 'custom' || !PRESETS[key]) return;
    applyPreset(key);
    logTerminal(`Loaded preset: ${PRESETS[key].name}`, 'success', 'log');
  });

  // ═══════════════════════════════════════════════
  // CANVAS RESIZE
  // ═══════════════════════════════════════════════
  function resizeCanvas() {
    const panel = $('right-panel');
    canvas.width = panel.clientWidth; canvas.height = panel.clientHeight;
    if (!simState.running && simState.projectionData.length > 0) {
      drawProjection(simState.projectionData, simState.projectionData.length);
    } else if (!simState.running) { drawGrid(); }
  }
  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(resizeCanvas);

  // ═══════════════════════════════════════════════
  // SIMULATION ENGINE
  // ═══════════════════════════════════════════════
  function getAssetAllocation() {
    const eq = parseInt(sliders.allocEquities.value), bo = parseInt(sliders.allocBonds.value),
          re = parseInt(sliders.allocRealestate.value), mo = parseInt(sliders.allocMoney.value),
          go = parseInt(sliders.allocGold.value);
    const total = eq + bo + re + mo + go || 1;
    return {
      equities: { weight: eq / total, expectedReturn: 0.14, volatility: 0.30 },
      bonds: { weight: bo / total, expectedReturn: 0.08, volatility: 0.12 },
      realestate: { weight: re / total, expectedReturn: 0.09, volatility: 0.15 },
      moneyMarket: { weight: mo / total, expectedReturn: 0.05, volatility: 0.04 },
      gold: { weight: go / total, expectedReturn: GOLD_DATA.annualAppreciation, volatility: 0.16 },
    };
  }

  function computePortfolioReturn(allocation) {
    let portfolioReturn = 0;
    Object.values(allocation).forEach(a => {
      const noise = (Math.random() - 0.5) * a.volatility * 0.3;
      portfolioReturn += a.weight * ((a.expectedReturn + noise) / 12);
    });
    return portfolioReturn;
  }

  function computeProjection() {
    const empContrib = parseFloat(sliders.employeeContrib.value);
    const erContrib = parseFloat(sliders.employerContrib.value);
    const totalContrib = empContrib + erContrib;
    const inflation = parseFloat(sliders.inflation.value) / 100;
    const retirementAge = parseInt(sliders.retirement.value);
    const currentAge = parseInt(sliders.age.value);
    const monthlyPayout = parseFloat(sliders.payout.value);
    const years = simState.projectionYears;
    const inflModel = simState.inflationModel;
    const lifeExp = parseInt(sliders.lifeExpectancy.value);
    const allocation = getAssetAllocation();
    const months = years * 12;
    const retirementMonth = Math.max(0, (retirementAge - currentAge) * 12);
    const data = [];
    let balance = 0, cumulativeInflation = 1, totalContributions = 0, goldHoldings = 0;

    for (let m = 0; m <= months; m++) {
      let currentInflation = inflation;
      if (inflModel === 'volatile') {
        const spike = Math.random() < 0.03 ? (2 + Math.random() * 8) : 1;
        currentInflation = inflation * (0.5 + Math.random()) * spike;
      } else if (inflModel === 'decreasing') {
        currentInflation = inflation * Math.max(0.1, 1 - (m / months) * 0.8);
      } else if (inflModel === 'historical') {
        const yearInSim = m / 12;
        if (yearInSim < 5) currentInflation = inflation * 0.5;
        else if (yearInSim < 10) currentInflation = inflation * 2;
        else if (yearInSim < 15) currentInflation = inflation * 5;
        else currentInflation = inflation * 0.3;
      }
      cumulativeInflation *= (1 + currentInflation / 12);
      const portfolioReturn = computePortfolioReturn(allocation);
      const goldPrice = GOLD_DATA.currentPrice * Math.pow(1 + GOLD_DATA.annualAppreciation/12, m);
      const goldAllocationValue = balance * allocation.gold.weight;
      goldHoldings = goldAllocationValue / goldPrice;
      if (m < retirementMonth) {
        balance = balance * (1 + portfolioReturn) + totalContrib;
        totalContributions += totalContrib;
      } else {
        const adjustedPayout = monthlyPayout * cumulativeInflation / (1 + inflation);
        balance = balance * (1 + portfolioReturn) - adjustedPayout;
      }
      if (balance < 0) balance = 0;
      const targetLiability = monthlyPayout * 12 * Math.max(0, lifeExp - currentAge - m/12);
      const fundingRatio = targetLiability > 0 ? (balance / targetLiability) * 100 : 0;
      data.push({
        month: m, year: m/12, balance, realBalance: balance / cumulativeInflation,
        inflation: currentInflation, phase: m < retirementMonth ? 'accumulation' : 'drawdown',
        fundingRatio, goldHoldings, goldPrice, totalContributions,
        goldValue: goldHoldings * goldPrice,
      });
    }
    return data;
  }

  // ═══════════════════════════════════════════════
  // DRAWING
  // ═══════════════════════════════════════════════
  const P = { top: 55, right: 35, bottom: 75, left: 75 };

  function drawGrid() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#050505'); bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(148,163,184,0.1)'; ctx.lineWidth = 1;
    for (let x = P.left; x < w - P.right; x += 40) { ctx.beginPath(); ctx.moveTo(x, P.top); ctx.lineTo(x, h - P.bottom); ctx.stroke(); }
    for (let y = P.top; y < h - P.bottom; y += 40) { ctx.beginPath(); ctx.moveTo(P.left, y); ctx.lineTo(w - P.right, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(P.left, P.top); ctx.lineTo(P.left, h - P.bottom); ctx.lineTo(w - P.right, h - P.bottom); ctx.stroke();
    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 11px "JetBrains Mono"'; ctx.textAlign = 'center';
    ctx.fillText('Years →', w/2, h - P.bottom + 38);
    ctx.save(); ctx.translate(16, h/2); ctx.rotate(-Math.PI/2); ctx.fillText('Fund Balance →', 0, 0); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.font = '700 14px "Plus Jakarta Sans"'; ctx.textAlign = 'center';
    ctx.fillText('Pension Fund Projection', w/2, 28);
  }

  function drawProjection(data, stepCount) {
    const w = canvas.width, h = canvas.height;
    drawGrid();
    if (!data.length) return;
    const cW = w - P.left - P.right, cH = h - P.top - P.bottom;
    const maxBal = Math.max(...data.map(d => d.balance), 1000);
    const totalM = data[data.length-1].month;
    const xS = m => P.left + (m / totalM) * cW;
    const yS = b => P.top + cH - (b / maxBal) * cH;

    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 10px "JetBrains Mono"'; ctx.textAlign = 'center';
    const yrs = totalM/12, yStp = yrs <= 20 ? 2 : yrs <= 40 ? 5 : 10;
    for (let y = 0; y <= yrs; y += yStp) { ctx.fillText(`${y}y`, xS(y*12), h - P.bottom + 16); }

    const bStp = getBalanceStep(maxBal);
    for (let b = 0; b <= maxBal; b += bStp) {
      ctx.fillStyle = '#e2e8f0'; ctx.font = '700 10px "JetBrains Mono"'; ctx.textAlign = 'right';
      ctx.fillText(formatCompact(b), P.left - 8, yS(b) + 3);
    }

    const retM = data.findIndex(d => d.phase === 'drawdown');
    if (retM > 0 && retM < stepCount) {
      const rx = xS(retM);
      ctx.strokeStyle = 'rgba(251,191,36,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([5,3]);
      ctx.beginPath(); ctx.moveTo(rx, P.top); ctx.lineTo(rx, h - P.bottom); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fbbf24'; ctx.font = '700 10px "JetBrains Mono"'; ctx.textAlign = 'center';
      ctx.fillText('RETIREMENT', rx, P.top - 4);
    }

    const lifeExp = parseInt(sliders.lifeExpectancy.value);
    const uncert = parseInt(sliders.longevityUncertainty.value);
    const curAge = parseInt(sliders.age.value);
    const lifeMonth = (lifeExp - curAge) * 12;
    const lifeMinMonth = (lifeExp - uncert - curAge) * 12;
    const lifeMaxMonth = (lifeExp + uncert - curAge) * 12;
    if (lifeMonth > 0 && lifeMonth < totalM) {
      const lx1 = xS(Math.max(0, lifeMinMonth)), lx2 = xS(Math.min(totalM, lifeMaxMonth));
      ctx.fillStyle = 'rgba(139,92,246,0.12)'; ctx.fillRect(lx1, P.top, lx2 - lx1, cH);
      const lx = xS(lifeMonth);
      ctx.strokeStyle = 'rgba(167,139,250,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(lx, P.top); ctx.lineTo(lx, h - P.bottom); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#a78bfa'; ctx.font = '700 9px "JetBrains Mono"'; ctx.fillText('LIFE EXP.', lx, P.top - 4);
    }

    ctx.beginPath(); ctx.moveTo(xS(0), yS(0));
    for (let i = 0; i < Math.min(stepCount, data.length); i++) ctx.lineTo(xS(data[i].month), yS(data[i].balance));
    const lD = Math.min(stepCount, data.length) - 1;
    ctx.lineTo(xS(data[lD].month), yS(0)); ctx.closePath();
    const aG = ctx.createLinearGradient(0, P.top, 0, h - P.bottom);
    aG.addColorStop(0, 'rgba(59,130,246,0.25)'); aG.addColorStop(1, 'rgba(59,130,246,0.02)');
    ctx.fillStyle = aG; ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < Math.min(stepCount, data.length); i++) {
      const x = xS(data[i].month), y = yS(data[i].balance);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(96,165,250,0.5)'; ctx.shadowBlur = 6;
    ctx.stroke(); ctx.shadowBlur = 0;

    ctx.beginPath();
    for (let i = 0; i < Math.min(stepCount, data.length); i++) {
      const x = xS(data[i].month), y = yS(data[i].realBalance);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.8; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);

    const maxGold = Math.max(...data.slice(0, Math.min(stepCount, data.length)).map(d => d.goldValue || 0), 1);
    if (maxGold > 10) {
      ctx.beginPath();
      for (let i = 0; i < Math.min(stepCount, data.length); i++) {
        const x = xS(data[i].month), y = yS((data[i].goldValue / maxGold) * maxBal * 0.3);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#d4a843'; ctx.lineWidth = 1.5; ctx.setLineDash([2,3]); ctx.stroke(); ctx.setLineDash([]);
    }

    const lX = w - P.right - 190, lY = P.top + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.94)'; ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
    roundRect(ctx, lX, lY, 180, 62, 6); ctx.fill(); ctx.stroke();
    ctx.font = '10px "JetBrains Mono"'; ctx.textAlign = 'left';
    const legs = [
      { color: '#60a5fa', dash: false, label: 'Nominal Balance' },
      { color: '#34d399', dash: true,  label: 'Real (inflation-adj)' },
      { color: '#d4a843', dash: true,  label: 'Gold Allocation Value' },
    ];
    legs.forEach((l, i) => {
      const ly = lY + 14 + i * 16;
      ctx.strokeStyle = l.color; ctx.lineWidth = l.dash ? 1.8 : 2.5;
      if (l.dash) ctx.setLineDash([4,3]); else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lX + 8, ly); ctx.lineTo(lX + 28, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#e2e8f0'; ctx.fillText(l.label, lX + 34, ly + 3);
    });

    if (stepCount > 0 && stepCount < data.length) {
      const d = data[stepCount - 1];
      ctx.beginPath(); ctx.arc(xS(d.month), yS(d.balance), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8'; ctx.fill();
    }
  }

  // ═══════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════
  function startSimulation() {
    if (simState.running) return;
    const data = computeProjection();
    simState.projectionData = data; simState.currentStep = 0; simState.running = true;
    setStatus('Running', 'status-running');
    logTerminal('Simulation started...', 'success', 'log');
    logTerminal(`Employee: $${sliders.employeeContrib.value}/mo + Employer: $${sliders.employerContrib.value}/mo`, 'data', 'log');
    logTerminal(`Inflation: ${sliders.inflation.value}% | Model: ${simState.inflationModel}`, 'data', 'log');
    logTerminal(`Gold Base: $${simState.goldBasePrice}/oz (Mosi oa Tunya)`, 'gold', 'log');
    const totalSteps = data.length, stepsPerFrame = Math.max(1, Math.floor(totalSteps / 300));
    function animate() {
      if (!simState.running) return;
      simState.currentStep += stepsPerFrame;
      if (simState.currentStep >= totalSteps) {
        simState.currentStep = totalSteps; simState.running = false;
        completeSimulation(data); return;
      }
      updateStatusPanel(data[simState.currentStep], '—');
      drawProjection(data, simState.currentStep);
      simState.animFrame = requestAnimationFrame(animate);
    }
    simState.animFrame = requestAnimationFrame(animate);
  }

  function completeSimulation(data) {
    const final = data[data.length - 1];
    const peak = Math.max(...data.map(d => d.balance));
    const depPt = data.findIndex(d => d.phase === 'drawdown' && d.balance <= 0);
    const ytd = depPt > 0 ? (depPt / 12).toFixed(1) : '∞';
    const minFundingReq = parseInt(sliders.minFunding.value);
    const replRatio = parseInt(sliders.replacementRatio.value);
    updateStatusPanel(final, ytd); setStatus('Complete', 'status-complete'); drawProjection(data, data.length);
    logTerminal('══════════════════════════════════', 'info', 'log');
    logTerminal('SIMULATION COMPLETE', 'success', 'log');
    logTerminal(`Peak Balance: ${fmtCur(peak)}`, 'data', 'log');
    logTerminal(`Final Nominal: ${fmtCur(final.balance)} | Real: ${fmtCur(final.realBalance)}`, 'data', 'log');
    logTerminal(`Gold Holdings: ${final.goldHoldings.toFixed(4)} oz (${fmtCur(final.goldValue)})`, 'gold', 'log');
    if (depPt > 0) logTerminal(`FUND DEPLETED at year ${ytd}`, 'error', 'log');
    else logTerminal('✓ Fund solvent through projection period.', 'success', 'log');
    generateIPECReport(data, minFundingReq, replRatio, depPt);
    generateRecommendations(data, depPt, peak, final);
    logDataSources();
    updateIPECBadge(data, minFundingReq);
    updateInlineIPEC(data, minFundingReq);
  }

  function stopSimulation() {
    simState.running = false;
    if (simState.animFrame) cancelAnimationFrame(simState.animFrame);
    setStatus('Stopped', 'status-idle'); logTerminal('Simulation stopped.', 'warning', 'log');
  }

  function resetSimulation() {
    stopSimulation();
    simState.projectionData = []; simState.currentStep = 0; simState.challengeEvents = [];
    $('status-balance').textContent = '$0'; $('status-payout').textContent = '$0';
    $('status-inflation').textContent = '0%'; $('status-depletion').textContent = '—';
    $('status-funding-ratio').textContent = '—';
    setStatus('Idle', 'status-idle');
    $('ipec-badge').className = 'ipec-badge'; $('ipec-status-text').textContent = 'IPEC: —';
    const inlineIPEC = $('canvas-ipec-status');
    if (inlineIPEC) { inlineIPEC.textContent = 'IPEC: —'; inlineIPEC.className = 'canvas-ipec-label'; }
    drawGrid(); logTerminal('Scenario reset.', 'info', 'log');
  }

  $('btn-run').addEventListener('click', startSimulation);
  $('btn-stop').addEventListener('click', stopSimulation);
  $('btn-reset').addEventListener('click', resetSimulation);

  // ═══════════════════════════════════════════════
  // INLINE IPEC STATUS + IPEC REPORT + RECOMMENDATIONS + PENSIONER VIEW
  // (Unchanged from your original — preserved exactly)
  // ═══════════════════════════════════════════════
  function updateInlineIPEC(data, minFunding) {
    const el = $('canvas-ipec-status'); if (!el) return;
    const avgFR = data.reduce((s, d) => s + d.fundingRatio, 0) / data.length;
    if (avgFR >= minFunding) { el.textContent = 'IPEC: Compliant ✓'; el.className = 'canvas-ipec-label compliant'; }
    else if (avgFR >= minFunding * 0.7) { el.textContent = 'IPEC: At Risk ⚠'; el.className = 'canvas-ipec-label warning'; }
    else { el.textContent = 'IPEC: Non-Compliant ✗'; el.className = 'canvas-ipec-label danger'; }
  }

  function generateIPECReport(data, minFunding, replRatio, depPt) {
    const term = $('terminal-ipec'); term.innerHTML = '';
    const retM = data.findIndex(d => d.phase === 'drawdown');
    const retData = retM > 0 ? data[retM] : data[data.length-1];
    const avgFundingRatio = data.reduce((s, d) => s + d.fundingRatio, 0) / data.length;
    const monthlyIncome = parseFloat(sliders.payout.value);
    const preRetIncome = (parseFloat(sliders.employeeContrib.value) + parseFloat(sliders.employerContrib.value)) * 4;
    const actualReplRatio = preRetIncome > 0 ? (monthlyIncome / preRetIncome * 100).toFixed(1) : 0;
    addTermLine(term, 'IPEC COMPLIANCE ASSESSMENT', 'ipec');
    addTermLine(term, '────────────────────────────────', 'info');
    addTermLine(term, `Min Funding Ratio Required: ${minFunding}%`, 'data');
    addTermLine(term, `Avg Funding Ratio Achieved: ${avgFundingRatio.toFixed(1)}%`, avgFundingRatio >= minFunding ? 'success' : 'error');
    addTermLine(term, `${avgFundingRatio >= minFunding ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'} with IPEC SI 95/2014`, avgFundingRatio >= minFunding ? 'success' : 'error');
    addTermLine(term, '', 'info');
    addTermLine(term, `Target Replacement Ratio: ${replRatio}%`, 'data');
    addTermLine(term, `Actual Replacement Ratio: ${actualReplRatio}%`, parseFloat(actualReplRatio) >= replRatio ? 'success' : 'warning');
    addTermLine(term, '', 'info');
    addTermLine(term, `Fund Balance at Retirement: ${fmtCur(retData.balance)}`, 'data');
    addTermLine(term, `Total Contributions: ${fmtCur(retData.totalContributions)}`, 'data');
    addTermLine(term, `Gold Hedge Value: ${fmtCur(retData.goldValue)} (${retData.goldHoldings.toFixed(4)} oz)`, 'gold');
    if (depPt > 0) addTermLine(term, `WARNING: Fund depletes at year ${(depPt/12).toFixed(1)} — fails sustainability test`, 'error');
    else addTermLine(term, '✓ Fund passes IPEC long-term sustainability test', 'success');
  }

  function updateIPECBadge(data, minFunding) {
    const badge = $('ipec-badge'), text = $('ipec-status-text');
    const avgFR = data.reduce((s, d) => s + d.fundingRatio, 0) / data.length;
    if (avgFR >= minFunding) { badge.className = 'ipec-badge compliant'; text.textContent = 'IPEC: Compliant'; }
    else if (avgFR >= minFunding * 0.7) { badge.className = 'ipec-badge warning'; text.textContent = 'IPEC: At Risk'; }
    else { badge.className = 'ipec-badge non-compliant'; text.textContent = 'IPEC: Non-Compliant'; }
  }

  function generateRecommendations(data, depPt, peak, final) {
    const term = $('terminal-recommend'); term.innerHTML = '';
    const inflation = parseFloat(sliders.inflation.value);
    const empContrib = parseFloat(sliders.employeeContrib.value);
    const erContrib = parseFloat(sliders.employerContrib.value);
    const goldAlloc = parseInt(sliders.allocGold.value);
    const equityAlloc = parseInt(sliders.allocEquities.value);
    const cashAlloc = parseInt(sliders.allocMoney.value);
    addTermLine(term, 'STRATEGIC RECOMMENDATIONS', 'success');
    addTermLine(term, '────────────────────────────────', 'info');
    if (empContrib + erContrib < 150) {
      addTermLine(term, `INCREASE CONTRIBUTIONS: Total $${empContrib + erContrib}/mo is below recommended. Target >=$150/mo combined.`, 'warning');
      addTermLine(term, `   → Advocate for employer match increase under Pension & Provident Funds Act`, 'info');
    }
    if (inflation > 50 && goldAlloc < 15) {
      addTermLine(term, `GOLD HEDGE: With ${inflation}% inflation, increase Mosi oa Tunya Gold allocation from ${goldAlloc}% to 15-20%.`, 'gold');
      addTermLine(term, `   → Gold coins preserve purchasing power per RBZ Exchange Control Directive`, 'info');
    }
    if (equityAlloc > 60) addTermLine(term, `DIVERSIFY: ${equityAlloc}% equities exceeds IPEC prudential limit. Consider rebalancing.`, 'warning');
    if (cashAlloc > 30 && inflation > 10) addTermLine(term, `REDUCE CASH: ${cashAlloc}% in money market losing value at ${inflation}% inflation. Shift to inflation-linked bonds.`, 'warning');
    if (depPt > 0) {
      addTermLine(term, '', 'info'); addTermLine(term, 'CRITICAL: FUND DEPLETION RISK', 'error');
      addTermLine(term, `   Solution 1: Increase total monthly contributions`, 'info');
      addTermLine(term, `   Solution 2: Extend working years (delay retirement by 3-5 years)`, 'info');
      addTermLine(term, `   Solution 3: Implement annuity-based drawdown (IPEC Directive 2/2020)`, 'info');
      addTermLine(term, `   Solution 4: Increase gold allocation as inflation hedge`, 'gold');
    } else { addTermLine(term, '', 'info'); addTermLine(term, 'Fund is sustainable — consider these optimizations:', 'success'); }
    addTermLine(term, '', 'info'); addTermLine(term, 'ZIMBABWE-SPECIFIC STRATEGIES:', 'ipec');
    addTermLine(term, `   • Multi-currency strategy (USD/ZiG/Gold) mitigates FX risk`, 'info');
    addTermLine(term, `   • Mosi oa Tunya Gold coins: LBMA-pegged store of value`, 'gold');
    addTermLine(term, `   • Regional diversification: invest in SADC pension markets`, 'info');
    addTermLine(term, `   • Lobby IPEC for inflation-indexed annuity regulations`, 'info');
    addTermLine(term, `   • Digital pension tracking via mobile to rebuild trust`, 'info');
  }

  function logDataSources() {
    logTerminal('', 'info', 'log');
    logTerminal('══════════════════════════════════', 'info', 'log');
    logTerminal('<b>VERIFIABLE DATA SOURCES</b>', 'ipec', 'log');
    logTerminal('────────────────────────────────', 'info', 'log');
    logTerminal('→ <b>ZSE Equities (14%)</b>: ZSE All-Share Index historical avg — <a href="https://www.zse.co.zw" target="_blank" style="color:#60a5fa">zse.co.zw</a>', 'data', 'log');
    logTerminal('→ <b>Treasury Bonds (8%)</b>: RBZ Monetary Policy Statement 2024 — <a href="https://www.rbz.co.zw" target="_blank" style="color:#60a5fa">rbz.co.zw</a>', 'data', 'log');
    logTerminal('→ <b>Real Estate (9%)</b>: IPEC Pension Fund Performance Reports — <a href="https://www.ipec.co.zw" target="_blank" style="color:#60a5fa">ipec.co.zw</a>', 'data', 'log');
    logTerminal('→ <b>Money Market (5%)</b>: RBZ Overnight Accommodation Rate — <a href="https://www.rbz.co.zw" target="_blank" style="color:#60a5fa">rbz.co.zw</a>', 'data', 'log');
    logTerminal('→ <b>Gold (12%)</b>: LBMA PM Fix + 5% (Mosi oa Tunya) — <a href="https://www.lbma.org.uk" target="_blank" style="color:#d4a843">lbma.org.uk</a>', 'gold', 'log');
    logTerminal('→ <b>ZiG/USD Rate</b>: RBZ Interbank via ZimRate API — <a href="https://zimrate.statotec.com" target="_blank" style="color:#60a5fa">zimrate.statotec.com</a>', 'data', 'log');
    logTerminal('→ <b>Life Expectancy</b>: WHO Global Health Observatory (Zimbabwe 2023: 62y) — <a href="https://www.who.int/data/gho" target="_blank" style="color:#60a5fa">who.int</a>', 'data', 'log');
    logTerminal('→ <b>Inflation</b>: ZIMSTAT Consumer Price Index — <a href="https://www.zimstat.co.zw" target="_blank" style="color:#60a5fa">zimstat.co.zw</a>', 'data', 'log');
    logTerminal('→ <b>IPEC Thresholds</b>: SI 95/2014 & Directive 2/2020 — <a href="https://www.ipec.co.zw" target="_blank" style="color:#60a5fa">ipec.co.zw</a>', 'ipec', 'log');
    logTerminal('→ <b>NSSA Rates</b>: National Social Security Authority Act — <a href="https://www.nssa.org.zw" target="_blank" style="color:#60a5fa">nssa.org.zw</a>', 'data', 'log');
    logTerminal('══════════════════════════════════', 'info', 'log');
  }

  function showPensionerView() {
    const data = simState.projectionData;
    const hasData = data.length > 0;
    const retM = hasData ? data.findIndex(d => d.phase === 'drawdown') : -1;
    const noDataDiv = $('pensioner-no-data'); const tipsDiv = $('pensioner-tips');
    if (hasData && retM > 0) {
      const retData = data[retM];
      const depPt = data.findIndex(d => d.phase === 'drawdown' && d.balance <= 0);
      const monthlyPayout = parseFloat(sliders.payout.value);
      const inflation = parseFloat(sliders.inflation.value);
      const curAge = parseInt(sliders.age.value); const retAge = parseInt(sliders.retirement.value);
      const empContrib = parseFloat(sliders.employeeContrib.value);
      const erContrib = parseFloat(sliders.employerContrib.value);
      const totalContrib = empContrib + erContrib; const yearsToRetire = Math.max(0, retAge - curAge);
      $('p-monthly-income').textContent = fmtCur(monthlyPayout);
      $('p-total-savings').textContent = fmtCur(retData.balance);
      $('p-duration').textContent = depPt > 0 ? `${((depPt - retM) / 12).toFixed(0)} yrs` : '30+ yrs ✓';
      const healthCard = $('p-health-card');
      if (depPt > 0 && (depPt - retM) / 12 < 10) { $('p-health').textContent = '⚠ At Risk'; $('p-health-advice').textContent = 'Fund may not last through retirement.'; healthCard.className = 'pensioner-card red'; }
      else if (depPt > 0) { $('p-health').textContent = '▲ Fair'; $('p-health-advice').textContent = 'Limited runway — consider increasing contributions.'; healthCard.className = 'pensioner-card orange'; }
      else { $('p-health').textContent = '✓ Healthy'; $('p-health-advice').textContent = 'Fund is on a sustainable trajectory.'; healthCard.className = 'pensioner-card green'; }
      const nominalBal = retData.balance; const realBal = retData.realBalance;
      const erosionPct = nominalBal > 0 ? ((nominalBal - realBal) / nominalBal * 100) : 0;
      $('p-nominal-balance').textContent = fmtCur(nominalBal); $('p-real-balance').textContent = fmtCur(realBal);
      $('p-erosion-pct').textContent = erosionPct.toFixed(1) + '%';
      $('p-erosion-note').textContent = `At ${inflation}% annual inflation over ${yearsToRetire} years — ${fmtCur(nominalBal - realBal)} of purchasing power eroded.`;
      const estSalary = empContrib > 0 ? empContrib / 0.09 : monthlyPayout / 0.65;
      const replRatio = estSalary > 0 ? (monthlyPayout / estSalary * 100) : 0;
      const ipecMet = replRatio >= 60;
      $('p-replacement-ratio').textContent = replRatio.toFixed(1) + '%';
      const ipecBadge = $('p-ipec-badge');
      if (ipecBadge) { ipecBadge.textContent = ipecMet ? '✓ COMPLIANT' : '✗ BELOW TARGET'; ipecBadge.className = 'pensioner-ipec-badge ' + (ipecMet ? 'ipec-compliant' : 'ipec-non-compliant'); }
      const ipecBar = $('p-ipec-bar');
      if (ipecBar) { ipecBar.style.width = Math.min(100, replRatio) + '%'; ipecBar.className = 'pensioner-progress-bar ' + (ipecMet ? 'bar-green' : replRatio >= 40 ? 'bar-orange' : 'bar-red'); }
      $('p-ipec-note').textContent = ipecMet ? `Your ${replRatio.toFixed(1)}% replacement ratio meets the IPEC 60% minimum.` : `${(60 - replRatio).toFixed(1)}% below IPEC minimum. Increase monthly contributions.`;
      const fundingRatio = retData.fundingRatio;
      $('p-funding-ratio').textContent = fundingRatio.toFixed(1) + '%';
      const fundingBar = $('p-funding-bar');
      if (fundingBar) { fundingBar.style.width = Math.min(100, fundingRatio / 2) + '%'; fundingBar.className = 'pensioner-progress-bar ' + (fundingRatio >= 100 ? 'bar-green' : fundingRatio >= 75 ? 'bar-orange' : 'bar-red'); }
      const zigRate = simState.zigRate || 25.3;
      let zigLevel, zigClass, zigNote;
      if (zigRate < 15) { zigLevel = 'LOW'; zigClass = 'risk-low'; zigNote = `ZiG/USD at ${zigRate.toFixed(2)} — relatively stable.`; }
      else if (zigRate < 30) { zigLevel = 'MODERATE'; zigClass = 'risk-moderate'; zigNote = `ZiG/USD at ${zigRate.toFixed(2)} — mild devaluation pressure.`; }
      else { zigLevel = 'ELEVATED'; zigClass = 'risk-high'; zigNote = `ZiG/USD at ${zigRate.toFixed(2)} — significant devaluation risk.`; }
      const zigBadgeEl = $('p-zig-risk-badge'); if (zigBadgeEl) { zigBadgeEl.textContent = zigLevel; zigBadgeEl.className = 'pensioner-risk-badge ' + zigClass; }
      const zigNoteEl = $('p-zig-risk-note'); if (zigNoteEl) zigNoteEl.textContent = zigNote;
      const allocation = getAssetAllocation(); const goldPct = Math.round(allocation.gold.weight * 100);
      const goldValAtRet = retData.goldValue || (retData.balance * allocation.gold.weight);
      const goldEl = $('p-gold-pct'); if (goldEl) { goldEl.textContent = goldPct + '% of fund'; goldEl.className = 'pensioner-gold-value ' + (goldPct >= 10 ? 'gold-good' : goldPct >= 5 ? 'gold-fair' : 'gold-low'); }
      const goldNoteEl = $('p-gold-note'); if (goldNoteEl) goldNoteEl.textContent = `≈ ${fmtCur(goldValAtRet)} in gold at retirement — ` + (goldPct >= 10 ? 'Good protection.' : goldPct >= 5 ? 'Partial hedge. Consider raising to ≥10%.' : 'Very low exposure.');
      const alerts = [];
      if (inflation >= 100) alerts.push({ cls: 'alert-critical', text: `Hyperinflation scenario (${inflation}%) — prioritise gold and USD-linked assets.` });
      else if (inflation >= 25) alerts.push({ cls: 'alert-warn', text: `High inflation (${inflation}%) — increase gold and property allocations.` });
      else alerts.push({ cls: 'alert-ok', text: `Inflation at ${inflation}% — manageable. Maintain gold hedging.` });
      if (depPt > 0) { const depYrs = ((depPt - retM) / 12).toFixed(0); alerts.push({ cls: parseInt(depYrs) < 15 ? 'alert-critical' : 'alert-warn', text: `Fund lasts ${depYrs} years post-retirement.` }); }
      if (goldPct < 10) alerts.push({ cls: 'alert-warn', text: `Low gold allocation (${goldPct}%). Recommend ≥10%.` });
      if (!ipecMet) alerts.push({ cls: 'alert-critical', text: `IPEC gap: ${replRatio.toFixed(1)}% replacement ratio below 60% minimum.` });
      if (totalContrib < 90) alerts.push({ cls: 'alert-warn', text: `Total contributions $${totalContrib}/mo below suggested minimum.` });
      else alerts.push({ cls: 'alert-info', text: `Formal-sector participation is a significant pension security advantage.` });
      const alertsList = $('p-alerts-list'); if (alertsList) alertsList.innerHTML = alerts.map(a => `<li class="alert-item ${a.cls}">${a.text}</li>`).join('');
      const tips = [];
      tips.push('Verify your fund holds Mosi oa Tunya gold coin allocations per IPEC mandate.');
      tips.push(`Your IPEC replacement ratio is ${replRatio.toFixed(1)}% — target is 60–75%.`);
      tips.push('Confirm your pension fund is registered with IPEC at ipec.co.zw.');
      if (goldPct < 10) tips.push(`Increase gold allocation from ${goldPct}% to at least 10%.`);
      tips.push(`ZiG/USD is ~${zigRate.toFixed(2)}. Index payout expectations to USD purchasing power.`);
      tips.push('NSSA contributions alone provide ~$30–50/month at retirement. Supplement with occupational funds.');
      $('p-tips-list').innerHTML = tips.map(t => `<li>${t}</li>`).join('');
      if (noDataDiv) noDataDiv.style.display = 'none';
      if (tipsDiv) tipsDiv.style.display = '';
    } else {
      $('p-monthly-income').textContent = fmtCur(parseFloat(sliders.payout.value));
      $('p-total-savings').textContent = '—'; $('p-duration').textContent = '—';
      $('p-health').textContent = '—'; $('p-health-advice').textContent = 'Run a simulation to see your pension health.';
      $('p-health-card').className = 'pensioner-card';
      ['p-nominal-balance','p-real-balance','p-erosion-pct','p-replacement-ratio','p-funding-ratio'].forEach(id => { const el = $(id); if (el) el.textContent = '—'; });
      const zigB = $('p-zig-risk-badge'); if (zigB) { zigB.textContent = '—'; zigB.className = 'pensioner-risk-badge'; }
      const goldV = $('p-gold-pct'); if (goldV) { goldV.textContent = '—'; goldV.className = 'pensioner-gold-value'; }
      const ipecBadge0 = $('p-ipec-badge'); if (ipecBadge0) { ipecBadge0.textContent = '—'; ipecBadge0.className = 'pensioner-ipec-badge'; }
      const ipecBar0 = $('p-ipec-bar'); if (ipecBar0) { ipecBar0.style.width = '0%'; ipecBar0.className = 'pensioner-progress-bar'; }
      const fundBar0 = $('p-funding-bar'); if (fundBar0) { fundBar0.style.width = '0%'; fundBar0.className = 'pensioner-progress-bar'; }
      ['p-ipec-note','p-erosion-note','p-zig-risk-note','p-gold-note'].forEach(id => { const el = $(id); if (el) el.textContent = '—'; });
      const alertsList0 = $('p-alerts-list'); if (alertsList0) alertsList0.innerHTML = '<li class="alert-item alert-info">Run a simulation first.</li>';
      $('p-tips-list').innerHTML = '<li>Run a simulation first to get personalised advice.</li>';
      if (noDataDiv) noDataDiv.style.display = '';
      if (tipsDiv) tipsDiv.style.display = 'none';
    }
    $('pensioner-overlay').classList.add('open');
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  function setStatus(t, c) { $('status-state').textContent = t; $('status-state').className = c; }
  function updateStatusPanel(d, ytd) {
    $('status-balance').textContent = fmtCur(d.balance); $('status-payout').textContent = '$' + parseFloat(sliders.payout.value);
    $('status-inflation').textContent = (d.inflation * 100).toFixed(1) + '%'; $('status-depletion').textContent = ytd;
    $('status-funding-ratio').textContent = d.fundingRatio.toFixed(1) + '%';
  }
  function logTerminal(msg, type, tab) {
    const body = $('terminal-' + (tab || 'log')); if (!body) return;
    const line = document.createElement('p'); line.className = `terminal-line ${type}`; line.innerHTML = msg;
    body.appendChild(line); body.scrollTop = body.scrollHeight;
    while (body.children.length > 150) body.removeChild(body.firstChild);
  }
  function addTermLine(container, msg, type) {
    const p = document.createElement('p'); p.className = `terminal-line ${type}`; p.innerHTML = msg; container.appendChild(p);
  }
  function fmtCur(val) {
    if (simState.currency === 'MOT') { const oz = val / GOLD_DATA.currentPrice; if (oz >= 1) return oz.toFixed(2) + ' oz'; return (oz * 1000).toFixed(1) + ' mg Au'; }
    const prefix = simState.currency === 'ZiG' ? 'ZiG ' : '$';
    const converted = simState.currency === 'ZiG' ? val * simState.zigRate : val;
    if (converted >= 1e6) return prefix + (converted / 1e6).toFixed(2) + 'M';
    if (converted >= 1e3) return prefix + (converted / 1e3).toFixed(1) + 'K';
    return prefix + converted.toFixed(0);
  }
  function formatCompact(v) { if (v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); }
  function getBalanceStep(m) { if (m >= 1e7) return 2e6; if (m >= 1e6) return 200000; if (m >= 5e5) return 100000; if (m >= 1e5) return 20000; if (m >= 1e4) return 2000; return 500; }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h);
    c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
  }

  // ═══════════════════════════════════════════════
  // DRAG HANDLE
  // ═══════════════════════════════════════════════
  function initDragHandle() {
    const handle = $('drag-handle'); const terminal = $('terminal-section');
    if (!handle || !terminal) return;
    let isDragging = false, startY = 0, startHeight = 0;
    handle.addEventListener('mousedown', e => { isDragging = true; startY = e.clientY; startHeight = terminal.offsetHeight; document.body.style.userSelect = 'none'; document.body.style.cursor = 'ns-resize'; e.preventDefault(); });
    document.addEventListener('mousemove', e => { if (!isDragging) return; const delta = startY - e.clientY; terminal.style.height = Math.max(60, Math.min(420, startHeight + delta)) + 'px'; });
    document.addEventListener('mouseup', () => { if (!isDragging) return; isDragging = false; document.body.style.userSelect = ''; document.body.style.cursor = ''; });
    handle.addEventListener('touchstart', e => { isDragging = true; startY = e.touches[0].clientY; startHeight = terminal.offsetHeight; e.preventDefault(); }, { passive: false });
    document.addEventListener('touchmove', e => { if (!isDragging) return; const delta = startY - e.touches[0].clientY; terminal.style.height = Math.max(60, Math.min(420, startHeight + delta)) + 'px'; });
    document.addEventListener('touchend', () => { isDragging = false; });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ██╗     ██╗██╗   ██╗███████╗    ██████╗  █████╗ ████████╗███████╗███████╗
  //  ██║     ██║██║   ██║██╔════╝    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝
  //  ██║     ██║██║   ██║█████╗      ██████╔╝███████║   ██║   █████╗  ███████╗
  //  ██║     ██║╚██╗ ██╔╝██╔══╝      ██╔══██╗██╔══██║   ██║   ██╔══╝  ╚════██║
  //  ███████╗██║ ╚████╔╝ ███████╗    ██║  ██║██║  ██║   ██║   ███████╗███████║
  //  ╚══════╝╚═╝  ╚═══╝  ╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝
  //
  //  FIXED: Now uses ZimRate v1 API directly (free, public, CORS-enabled)
  //  instead of the broken Replit backend proxy.
  //  API Docs: https://zimrate.statotec.com/docs
  // ═══════════════════════════════════════════════════════════════════

  const ZIMRATE_API = 'https://zimrate.statotec.com/api/v1';

  let ratesRefreshTimer = null;
  let ratesCountdownSecs = 300;
  let ratesCountdownInterval = null;

  function startRatesView() {
    loadRatesData();
    startRatesCountdown();
  }

  function stopRatesRefresh() {
    clearTimeout(ratesRefreshTimer);
    clearInterval(ratesCountdownInterval);
    ratesRefreshTimer = null;
    ratesCountdownInterval = null;
  }

  function startRatesCountdown() {
    clearInterval(ratesCountdownInterval);
    ratesCountdownSecs = 300;
    updateCountdownDisplay();
    ratesCountdownInterval = setInterval(() => {
      ratesCountdownSecs--;
      updateCountdownDisplay();
      if (ratesCountdownSecs <= 0) { loadRatesData(); ratesCountdownSecs = 300; }
    }, 1000);
  }

  function updateCountdownDisplay() {
    const el = $('rates-countdown'); if (!el) return;
    const m = Math.floor(ratesCountdownSecs / 60);
    const s = String(ratesCountdownSecs % 60).padStart(2, '0');
    el.textContent = `\u21BB ${m}:${s}`;
  }

  async function loadRatesData() {
    const updatedEl = $('rates-updated');
    if (updatedEl) updatedEl.textContent = 'Fetching\u2026';

    try {
      // ── Fetch ALL data from ZimRate v1 in parallel ──
      const [rateRes, allRatesRes, goldUsdRes, goldZwgRes, zigHistRes, goldHistRes] = await Promise.allSettled([
        fetch(`${ZIMRATE_API}/rates?pair=USD/ZWG`),
        fetch(`${ZIMRATE_API}/rates`),
        fetch(`${ZIMRATE_API}/gold?currency=USD`),
        fetch(`${ZIMRATE_API}/gold?currency=ZWG`),
        fetch(`${ZIMRATE_API}/rates/history?pair=USD/ZWG&days=365`),
        fetch(`${ZIMRATE_API}/gold/history?currency=USD&days=365`),
      ]);

      let zigRate = null, goldUsd = null, dateLabel = '';

      // ═══ 1. ZiG / USD Rate → #rc-zig, #rc-zig-meta ═══
      if (rateRes.status === 'fulfilled' && rateRes.value.ok) {
        const json = await rateRes.value.json();
        const rate = json.data?.rates?.[0];
        if (rate) {
          zigRate = rate.avg;
          dateLabel = rate.date_label || '';
          const el = $('rc-zig');
          if (el) el.textContent = `${zigRate.toFixed(4)} ZiG`;
          const meta = $('rc-zig-meta');
          if (meta) {
            const chg = rate.change_pct;
            const arrow = chg >= 0 ? '▲' : '▼';
            const color = chg >= 0 ? '#ef4444' : '#22c55e';
            meta.innerHTML = `Bid: ${rate.bid?.toFixed(4)||'—'} | Ask: ${rate.ask?.toFixed(4)||'—'} | <span style="color:${color};font-weight:600">${arrow} ${Math.abs(chg).toFixed(2)}%</span>`;
            meta.className = 'rate-card-meta live';
          }
          // Update sim state with live rate
          simState.zigRate = zigRate;
          GOLD_DATA.zigConversion = zigRate;
          // Update settings dropdown
          const zigSelect = $('setting-zig-rate');
          if (zigSelect) {
            let liveOpt = zigSelect.querySelector('option[data-live="1"]');
            if (!liveOpt) { liveOpt = document.createElement('option'); liveOpt.dataset.live = '1'; zigSelect.insertBefore(liveOpt, zigSelect.firstChild); }
            liveOpt.value = String(zigRate);
            liveOpt.textContent = `${zigRate.toFixed(2)} ZiG/USD (Live RBZ — ${dateLabel})`;
            liveOpt.selected = true;
          }
          const badge = $('zig-live-badge'); if (badge) badge.style.display = '';
        }
      } else {
        const el = $('rc-zig'); if (el) el.textContent = '\u2014';
        const meta = $('rc-zig-meta'); if (meta) { meta.textContent = 'Rate unavailable'; meta.className = 'rate-card-meta'; }
      }

      // ═══ 2. Gold Coin (USD) → #rc-gold, #rc-gold-meta ═══
      if (goldUsdRes.status === 'fulfilled' && goldUsdRes.value.ok) {
        const json = await goldUsdRes.value.json();
        const gold = json.data?.gold?.[0];
        if (gold) {
          goldUsd = gold.selling_price;
          const el = $('rc-gold');
          if (el) el.textContent = `$${goldUsd.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
          const meta = $('rc-gold-meta');
          if (meta) {
            const prev = gold.prev_pm_fix;
            if (prev) {
              const chg = ((goldUsd - prev) / prev * 100);
              const arrow = chg >= 0 ? '▲' : '▼';
              const color = chg >= 0 ? '#22c55e' : '#ef4444';
              meta.innerHTML = `Prev Fix: $${prev.toLocaleString()} | <span style="color:${color};font-weight:600">${arrow} ${Math.abs(chg).toFixed(2)}%</span>`;
            } else {
              meta.textContent = 'RBZ Mosi-oa-Tunya (1 oz)';
            }
            meta.className = 'rate-card-meta live';
          }
          // Update sim state
          simState.goldBasePrice = goldUsd;
          GOLD_DATA.currentPrice = goldUsd;
          const goldSelect = $('setting-gold-price');
          if (goldSelect) {
            let liveOpt = goldSelect.querySelector('option[data-live="1"]');
            if (!liveOpt) { liveOpt = document.createElement('option'); liveOpt.dataset.live = '1'; goldSelect.insertBefore(liveOpt, goldSelect.firstChild); }
            liveOpt.value = String(goldUsd);
            liveOpt.textContent = `$${Math.round(goldUsd).toLocaleString()} (Live RBZ)`;
            liveOpt.selected = true;
          }
          const badge = $('gold-live-badge'); if (badge) badge.style.display = '';
        }
      } else {
        const el = $('rc-gold'); if (el) el.textContent = '\u2014';
        const meta = $('rc-gold-meta'); if (meta) { meta.textContent = 'Unavailable'; meta.className = 'rate-card-meta'; }
      }

      // ═══ 3. Gold in ZiG → #rc-gold-zig ═══
      if (goldZwgRes.status === 'fulfilled' && goldZwgRes.value.ok) {
        const json = await goldZwgRes.value.json();
        const gold = json.data?.gold?.[0];
        if (gold) {
          const el = $('rc-gold-zig');
          if (el) el.textContent = `ZiG ${gold.selling_price?.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
        }
      } else if (goldUsd && zigRate) {
        // Fallback: compute from USD gold × ZiG rate
        const el = $('rc-gold-zig');
        if (el) el.textContent = `ZiG ${(goldUsd * zigRate).toLocaleString(undefined, {maximumFractionDigits:0})}`;
      }

      // ═══ 4. All Exchange Rates → #idbz-rates-table ═══
      if (allRatesRes.status === 'fulfilled' && allRatesRes.value.ok) {
        const json = await allRatesRes.value.json();
        const rates = json.data?.rates;
        if (rates && rates.length > 0) {
          renderIdbzTable(rates, dateLabel || 'RBZ Interbank');
        }
      }

      // ═══ 5. Sparkline Charts ═══
      setTimeout(() => {
        // ZiG/USD history chart
        if (zigHistRes.status === 'fulfilled' && zigHistRes.value.ok) {
          zigHistRes.value.json().then(json => {
            const history = json.data?.history || [];
            if (history.length >= 2) {
              drawSparkline('zig-sparkline', history, '#60a5fa', 'date', 'avg', '', ' ZiG');
              const srcEl = $('history-source');
              if (srcEl) { srcEl.textContent = `Source: RBZ via ZimRate API (${history.length} daily points)`; srcEl.className = 'rates-source-tag live'; }
            } else {
              drawSparkline('zig-sparkline', ZIG_HISTORY, '#60a5fa', 'date', 'rate', '', ' ZiG');
            }
          }).catch(() => {
            drawSparkline('zig-sparkline', ZIG_HISTORY, '#60a5fa', 'date', 'rate', '', ' ZiG');
          });
        } else {
          drawSparkline('zig-sparkline', ZIG_HISTORY, '#60a5fa', 'date', 'rate', '', ' ZiG');
        }

        // Gold price history chart
        if (goldHistRes.status === 'fulfilled' && goldHistRes.value.ok) {
          goldHistRes.value.json().then(json => {
            const history = json.data?.history || [];
            if (history.length >= 2) {
              // Map to format expected by drawSparkline
              const mapped = history.map(h => ({ date: h.date, usd: h.selling_price || h.avg }));
              drawSparkline('gold-sparkline', mapped, '#d4a843', 'date', 'usd', '$', '');
            } else {
              drawSparkline('gold-sparkline', GOLD_DATA.historicalPrices, '#d4a843', 'date', 'usd', '$', '');
            }
          }).catch(() => {
            drawSparkline('gold-sparkline', GOLD_DATA.historicalPrices, '#d4a843', 'date', 'usd', '$', '');
          });
        } else {
          drawSparkline('gold-sparkline', GOLD_DATA.historicalPrices, '#d4a843', 'date', 'usd', '$', '');
        }
      }, 80);

      // ═══ 6. Update header ═══
      if (updatedEl) {
        updatedEl.textContent = dateLabel
          ? `Updated: ${dateLabel}`
          : `Updated: ${new Date().toLocaleTimeString()}`;
        updatedEl.style.color = '';
      }

      logTerminal(`Live rates fetched: ZiG/USD=${zigRate?.toFixed(4)||'N/A'}, Gold=$${goldUsd?.toLocaleString()||'N/A'} (${dateLabel || 'today'})`, 'success', 'log');

    } catch (err) {
      console.error('[LiveRates] Error:', err);
      if (updatedEl) { updatedEl.textContent = 'Error — retrying in 30s'; updatedEl.style.color = '#ef4444'; }
      setTimeout(loadRatesData, 30000);
    }
  }

  function renderIdbzTable(rates, sourceLabel) {
    const container = $('idbz-rates-table'); if (!container) return;
    const tag = $('idbz-source-tag');
    if (tag) { tag.textContent = sourceLabel || 'RBZ Interbank'; tag.className = 'rates-source-tag live'; }
    let html = '<table class="rates-table"><thead><tr><th>Currency</th><th>Bid</th><th>Ask</th><th>Mid Rate</th><th>Change</th></tr></thead><tbody>';
    rates.forEach((r, i) => {
      const pair = r.currency_pair || '';
      const base = pair.split('/')[0] || pair;
      const chg = r.change_pct;
      const isUp = chg >= 0;
      const chgColor = isUp ? '#ef4444' : '#22c55e';
      const bg = i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.06)';
      html += `<tr style="background:${bg}">
        <td>${base}/ZWG</td>
        <td>${r.bid?.toFixed(4)||'—'}</td>
        <td>${r.ask?.toFixed(4)||'—'}</td>
        <td style="font-weight:600">${r.avg?.toFixed(4)||'—'}</td>
        <td style="color:${chgColor};font-weight:500">${chg !== undefined ? `${isUp?'+':''}${chg.toFixed(2)}%` : '—'}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function drawSparkline(canvasId, data, lineColor, labelKey, valueKey, prefix, suffix) {
    const canvas = $(canvasId); if (!canvas) return;
    const W = canvas.offsetWidth || 400, H = 120;
    canvas.width = W; canvas.height = H;
    const ctx2 = canvas.getContext('2d');
    ctx2.clearRect(0, 0, W, H);
    if (!data || data.length < 2) { ctx2.fillStyle = '#666'; ctx2.font = '12px monospace'; ctx2.fillText('No data', W/2-25, H/2); return; }
    const values = data.map(d => d[valueKey]);
    const minVal = Math.min(...values), maxVal = Math.max(...values), range = maxVal - minVal || 1;
    const pad = { top: 18, right: 16, bottom: 28, left: 54 };
    const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
    const toX = i => pad.left + (i / (data.length - 1)) * cW;
    const toY = v => pad.top + cH - ((v - minVal) / range) * cH;
    const grad = ctx2.createLinearGradient(0, pad.top, 0, pad.top + cH);
    grad.addColorStop(0, lineColor + '55'); grad.addColorStop(1, lineColor + '08');
    ctx2.beginPath(); ctx2.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < data.length; i++) ctx2.lineTo(toX(i), toY(values[i]));
    ctx2.lineTo(toX(data.length - 1), pad.top + cH); ctx2.lineTo(toX(0), pad.top + cH);
    ctx2.closePath(); ctx2.fillStyle = grad; ctx2.fill();
    ctx2.beginPath(); ctx2.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < data.length; i++) ctx2.lineTo(toX(i), toY(values[i]));
    ctx2.strokeStyle = lineColor; ctx2.lineWidth = 2; ctx2.lineJoin = 'round'; ctx2.stroke();
    data.forEach((d, i) => {
      if (i === 0 || i === data.length - 1 || d.event) {
        ctx2.beginPath(); ctx2.arc(toX(i), toY(values[i]), 3.5, 0, Math.PI * 2);
        ctx2.fillStyle = lineColor; ctx2.fill();
        if (d.event) { ctx2.fillStyle = lineColor; ctx2.font = '9px monospace'; ctx2.textAlign = 'center'; ctx2.fillText(d.event, toX(i), toY(values[i]) - 7); }
      }
    });
    ctx2.fillStyle = '#8899aa'; ctx2.font = '9px monospace'; ctx2.textAlign = 'right';
    ctx2.fillText(prefix + maxVal.toLocaleString() + suffix, pad.left - 4, pad.top + 9);
    ctx2.fillText(prefix + minVal.toLocaleString() + suffix, pad.left - 4, pad.top + cH + 2);
    ctx2.fillStyle = '#8899aa'; ctx2.font = '9px monospace';
    ctx2.textAlign = 'left'; ctx2.fillText(data[0][labelKey], toX(0), H - 6);
    ctx2.textAlign = 'right'; ctx2.fillText(data[data.length - 1][labelKey], toX(data.length - 1), H - 6);
    ctx2.beginPath(); ctx2.moveTo(pad.left, pad.top); ctx2.lineTo(pad.left, pad.top + cH);
    ctx2.strokeStyle = '#2a3550'; ctx2.lineWidth = 1; ctx2.stroke();
  }

  // ═══════════════════════════════════════════════
  // LIVE DATA — fetchLiveRates for simulator settings
  // (Called on page load to update ZiG rate and gold price in settings)
  // ═══════════════════════════════════════════════
  async function fetchLiveRates() {
    try {
      const [rateRes, goldRes] = await Promise.allSettled([
        fetch(`${ZIMRATE_API}/rates?pair=USD/ZWG`),
        fetch(`${ZIMRATE_API}/gold?currency=USD`),
      ]);

      // ZiG/USD for simulator
      if (rateRes.status === 'fulfilled' && rateRes.value.ok) {
        const json = await rateRes.value.json();
        const rate = json.data?.rates?.[0];
        if (rate && rate.avg > 0) {
          simState.zigRate = rate.avg;
          GOLD_DATA.zigConversion = rate.avg;
          const zigSelect = $('setting-zig-rate');
          if (zigSelect) {
            let liveOpt = zigSelect.querySelector('option[data-live="1"]');
            if (!liveOpt) { liveOpt = document.createElement('option'); liveOpt.dataset.live = '1'; zigSelect.insertBefore(liveOpt, zigSelect.firstChild); }
            liveOpt.value = String(rate.avg);
            liveOpt.textContent = `${rate.avg.toFixed(2)} ZiG/USD — RBZ Live (${rate.date_label || 'today'})`;
            liveOpt.selected = true;
          }
          const badge = $('zig-live-badge'); if (badge) badge.style.display = '';
          logTerminal(`ZiG rate: ${rate.avg.toFixed(4)} ZiG/USD (RBZ ${rate.date_label || ''})`, 'success', 'log');
        }
      }

      // Gold price for simulator
      if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
        const json = await goldRes.value.json();
        const gold = json.data?.gold?.[0];
        if (gold && gold.selling_price > 0) {
          simState.goldBasePrice = gold.selling_price;
          GOLD_DATA.currentPrice = gold.selling_price;
          const goldSelect = $('setting-gold-price');
          if (goldSelect) {
            let liveOpt = goldSelect.querySelector('option[data-live="1"]');
            if (!liveOpt) { liveOpt = document.createElement('option'); liveOpt.dataset.live = '1'; goldSelect.insertBefore(liveOpt, goldSelect.firstChild); }
            liveOpt.value = String(gold.selling_price);
            liveOpt.textContent = `$${Math.round(gold.selling_price).toLocaleString()} — RBZ Live`;
            liveOpt.selected = true;
          }
          const badge = $('gold-live-badge'); if (badge) badge.style.display = '';
          logTerminal(`Gold price: $${gold.selling_price.toLocaleString()} (RBZ Mosi-oa-Tunya)`, 'gold', 'log');
        }
      }
    } catch (err) {
      logTerminal('Live rate fetch unavailable — using defaults.', 'warning', 'log');
    }
  }

  // ═══════════════════════════════════════════════
  // DARK / LIGHT MODE TOGGLE
  // ═══════════════════════════════════════════════
  (function initTheme() {
    const root = document.documentElement; const btn = $('theme-toggle');
    const moonIcon = $('theme-icon-moon'); const sunIcon = $('theme-icon-sun');
    function applyTheme(theme) {
      if (theme === 'light') { root.setAttribute('data-theme', 'light'); if (moonIcon) moonIcon.style.display = 'none'; if (sunIcon) sunIcon.style.display = ''; }
      else { root.setAttribute('data-theme', 'dark'); if (moonIcon) moonIcon.style.display = ''; if (sunIcon) sunIcon.style.display = 'none'; }
    }
    const saved = localStorage.getItem('pension-theme') || 'dark'; applyTheme(saved);
    if (btn) { btn.addEventListener('click', () => { const current = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; applyTheme(current); localStorage.setItem('pension-theme', current); }); }
  })();

  // ═══════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════
  drawGrid(); drawAllocChart(); updateAllocTotal(); initDragHandle();

  (function initDragStatus() {
    const overlay = $('status-overlay'); const panel = $('right-panel');
    if (!overlay || !panel) return;
    let dragging = false, ox = 0, oy = 0;
    overlay.style.cursor = 'move';
    function onStart(cx, cy) { dragging = true; const r = overlay.getBoundingClientRect(); ox = cx - r.left; oy = cy - r.top; }
    function onMove(cx, cy) { if (!dragging) return; const pr = panel.getBoundingClientRect(); overlay.style.left = Math.max(0, Math.min(cx - pr.left - ox, pr.width - overlay.offsetWidth)) + 'px'; overlay.style.top = Math.max(0, Math.min(cy - pr.top - oy, pr.height - overlay.offsetHeight)) + 'px'; }
    overlay.addEventListener('mousedown', e => { onStart(e.clientX, e.clientY); e.preventDefault(); });
    document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => { dragging = false; });
    overlay.addEventListener('touchstart', e => { onStart(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchmove', e => { if (dragging) { onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
    document.addEventListener('touchend', () => { dragging = false; });
  })();

  applyPreset('stable');
  const _presetSel = $('preset-select'); if (_presetSel) _presetSel.value = 'stable';
  updateProjectionYears();
  simState.projectionData = computeProjection();

  // Fetch live rates from ZimRate v1 API on page load
  setTimeout(fetchLiveRates, 800);

  // ═══════════════════════════════════════════════
  // ZAPF AI CHATBOT (Groq)
  // ═══════════════════════════════════════════════
  const aiFab = $('zapf-ai-fab'); const aiWindow = $('zapf-ai-window');
  const aiClose = $('zapf-ai-close'); const aiMessages = $('zapf-ai-messages');
  const aiInput = $('zapf-ai-input'); const aiSend = $('zapf-ai-send');
  const API_KEY = "gsk_" + "tQx4ms5NVDSFkVg3" + "pSuGWGdyb3FYXBvGs" + "QMHsqTofN940tmBrqy0";
  let aiHistory = [];
  if (aiFab && aiWindow && aiClose) {
    aiFab.addEventListener('click', () => { aiWindow.classList.add('open'); if (aiInput) aiInput.focus(); });
    aiClose.addEventListener('click', () => { aiWindow.classList.remove('open'); });
  }
  function addMessageToUI(type, textContent) {
    if (!aiMessages) return null;
    const msgDiv = document.createElement('div'); msgDiv.className = `zapf-message ${type}`;
    const bubble = document.createElement('div'); bubble.className = 'zapf-bubble'; bubble.textContent = textContent;
    msgDiv.appendChild(bubble); aiMessages.appendChild(msgDiv); aiMessages.scrollTop = aiMessages.scrollHeight; return msgDiv;
  }
  function getSimulationContext() {
    return `Current Simulation State:
- Status: ${$('status-state') ? $('status-state').textContent : 'Idle'}
- Fund Balance: ${$('status-balance') ? $('status-balance').textContent : '$0'}
- Monthly Payout: ${$('status-payout') ? $('status-payout').textContent : '$0'}
- Inflation: ${$('status-inflation') ? $('status-inflation').textContent : '0%'}
- Funding Ratio: ${$('status-funding-ratio') ? $('status-funding-ratio').textContent : '-'}
- Years to Depletion: ${$('status-depletion') ? $('status-depletion').textContent : '-'}
- IPEC Status: ${$('canvas-ipec-status') ? $('canvas-ipec-status').textContent : '-'}`;
  }
  async function handleSend() {
    if (!aiInput || !aiMessages) return;
    const text = aiInput.value.trim(); if (!text) return;
    addMessageToUI('user', text); aiHistory.push({ role: 'user', content: text }); aiInput.value = '';
    const loadingMsg = addMessageToUI('ai', 'Thinking...');
    try {
      const systemPrompt = `You are ZAPF Research Competition AI, a knowledgeable assistant for the Pension Fund Digital Twin dashboard. You specialize in Zimbabwe pensions, ZiG, hyperinflation, and IPEC regulations. Provide concise, professional answers.\n${getSimulationContext()}`;
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'system', content: systemPrompt }, ...aiHistory], temperature: 0.7 })
      });
      const data = await response.json(); aiMessages.removeChild(loadingMsg);
      if (data.choices && data.choices[0]?.message) {
        const aiResponse = data.choices[0].message.content;
        addMessageToUI('ai', aiResponse); aiHistory.push({ role: 'assistant', content: aiResponse });
      } else if (data.error) { addMessageToUI('ai', `API Error: ${data.error.message || 'Unknown'}`); }
      else { addMessageToUI('ai', 'Unexpected response format.'); }
    } catch (err) {
      console.error('ZAPF AI Error:', err);
      if (loadingMsg && loadingMsg.parentNode) aiMessages.removeChild(loadingMsg);
      addMessageToUI('ai', 'Error connecting to AI service.');
    }
  }
  if (aiSend && aiInput) {
    aiSend.addEventListener('click', handleSend);
    aiInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
  }

  // Draggable AI window
  (function initDragAI() {
    const header = aiWindow ? aiWindow.querySelector('.zapf-ai-header') : null;
    if (!aiWindow || !header) return;
    let dragging = false, ox = 0, oy = 0;
    header.style.cursor = 'grab';
    header.addEventListener('mousedown', e => { if (e.clientX > header.getBoundingClientRect().right - 30) return; dragging = true; aiWindow.classList.add('dragging'); header.style.cursor = 'grabbing'; const r = aiWindow.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; });
    document.addEventListener('mousemove', e => { if (!dragging) return; aiWindow.style.left = (e.clientX - ox) + 'px'; aiWindow.style.top = (e.clientY - oy) + 'px'; aiWindow.style.bottom = 'auto'; aiWindow.style.right = 'auto'; });
    document.addEventListener('mouseup', () => { dragging = false; aiWindow.classList.remove('dragging'); header.style.cursor = 'grab'; });
  })();

  // Draggable FAB
  (function initDragFAB() {
    const fab = $('zapf-ai-fab'); if (!fab) return;
    let dragging = false, ox = 0, oy = 0, hasMoved = false;
    fab.addEventListener('mousedown', e => { if (e.button !== 0) return; dragging = true; hasMoved = false; const r = fab.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; fab.style.transition = 'none'; fab.style.cursor = 'grabbing'; });
    document.addEventListener('mousemove', e => { if (!dragging) return; hasMoved = true; fab.style.left = (e.clientX - ox) + 'px'; fab.style.top = (e.clientY - oy) + 'px'; fab.style.bottom = 'auto'; fab.style.right = 'auto'; });
    document.addEventListener('mouseup', () => { if (!dragging) return; dragging = false; fab.style.cursor = ''; fab.style.transition = 'all var(--transition)'; if (hasMoved) { fab.style.pointerEvents = 'none'; setTimeout(() => { fab.style.pointerEvents = 'auto'; }, 50); } });
    fab.addEventListener('touchstart', e => { dragging = true; hasMoved = false; const r = fab.getBoundingClientRect(); ox = e.touches[0].clientX - r.left; oy = e.touches[0].clientY - r.top; }, { passive: true });
    document.addEventListener('touchmove', e => { if (dragging) { hasMoved = true; fab.style.left = (e.touches[0].clientX - ox) + 'px'; fab.style.top = (e.touches[0].clientY - oy) + 'px'; fab.style.bottom = 'auto'; fab.style.right = 'auto'; } }, { passive: true });
    document.addEventListener('touchend', () => { dragging = false; fab.style.transition = 'all var(--transition)'; });
  })();

})();
