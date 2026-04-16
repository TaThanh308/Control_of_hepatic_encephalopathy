let chartInst = null;

/* ── Storage ── */
function getData() {
  try { return JSON.parse(localStorage.getItem('gnm_data') || '[]'); }
  catch (e) { return []; }
}
function setData(d) {
  try { localStorage.setItem('gnm_data', JSON.stringify(d)); }
  catch (e) {}
}

/* ── Navigation ── */
function goPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  btn.classList.add('active');
  // scroll page to top
  document.querySelector('.pages').scrollTop = 0;
}

/* ── BMI helper ── */
function getBMIInfo(bmi) {
  if (bmi < 18.5) return { text: 'Thiếu cân',   color: '#1d4ed8', bg: '#dbeafe' };
  if (bmi < 23)   return { text: 'Bình thường', color: '#15803d', bg: '#dcfce7' };
  if (bmi < 25)   return { text: 'Thừa cân',    color: '#b45309', bg: '#fef9c3' };
  return               { text: 'Béo phì',    color: '#dc2626', bg: '#fee2e2' };
}

/* ── Save health ── */
function saveHealth() {
  const w = parseFloat(document.getElementById('weight').value);
  const h = parseFloat(document.getElementById('height').value);
  if (!w || !h || h < 50 || w < 10) {
    alert('Vui lòng nhập cân nặng và chiều cao hợp lệ');
    return;
  }
  const bmi = +(w / ((h / 100) ** 2)).toFixed(1);
  const info = getBMIInfo(bmi);

  const el = document.getElementById('bmiResult');
  document.getElementById('bmiText').textContent = bmi;
  const badge = document.getElementById('bmiBadge');
  badge.textContent = info.text;
  badge.style.background = info.bg;
  badge.style.color = info.color;
  el.classList.add('show');

  const data = getData();
  data.push({ type: 'weight', value: w, date: new Date().toLocaleDateString('vi-VN') });
  setData(data);
  updateStats();
  loadHistory();
  drawChart();
}

/* ── Save food ── */
function saveFood() {
  const f = document.getElementById('food').value.trim();
  if (!f) return;

  const badFoods = ['bia', 'rượu', 'chiên', 'xào', 'mỡ', 'nội tạng', 'fast food', 'thức ăn nhanh', 'nước ngọt', 'kfc', 'mcdo'];
  const isBad = badFoods.some(b => f.toLowerCase().includes(b));
  document.getElementById('foodWarning').classList.toggle('show', isBad);

  const data = getData();
  data.push({ type: 'food', value: f, date: new Date().toLocaleString('vi-VN') });
  setData(data);
  document.getElementById('food').value = '';
  updateStats();
  loadHistory();
}

/* ── Save exercise ── */
function saveExercise() {
  const e = document.getElementById('exercise').value.trim();
  if (!e) return;

  const data = getData();
  data.push({ type: 'exercise', value: e, date: new Date().toLocaleString('vi-VN') });
  setData(data);
  document.getElementById('exercise').value = '';
  loadHistory();
}

/* ── Fill exercise from suggestion ── */
function fillExercise(text) {
  document.getElementById('exercise').value = text;
  document.getElementById('exercise').focus();
}

/* ── Update stats ── */
function updateStats() {
  const data = getData();
  const weights = data.filter(d => d.type === 'weight');
  const last = weights[weights.length - 1];

  if (last) {
    document.getElementById('s-weight').textContent = last.value;
    const bmi = +(last.value / ((170 / 100) ** 2)).toFixed(1);
    document.getElementById('s-bmi').textContent = bmi;
  }
  document.getElementById('s-meals').textContent = data.filter(d => d.type === 'food').length;
}

/* ── Load history ── */
function loadHistory() {
  const data = getData();
  const list = document.getElementById('historyList');
  if (!data.length) {
    list.innerHTML = '<li class="empty">Chưa có dữ liệu</li>';
    return;
  }
  const typeMap = {
    weight:   { label: 'Cân nặng',  cls: 'badge-weight' },
    food:     { label: 'Bữa ăn',    cls: 'badge-food' },
    exercise: { label: 'Tập luyện', cls: 'badge-exercise' }
  };
  list.innerHTML = data.slice(-30).reverse().map(item => {
    const t = typeMap[item.type] || { label: item.type, cls: 'badge-weight' };
    const val = item.type === 'weight' ? item.value + ' kg' : item.value;
    return `<li>
      <span class="badge ${t.cls}">${t.label}</span>
      <span class="history-val">${val}</span>
      <span class="history-date">${item.date}</span>
    </li>`;
  }).join('');
}

/* ── Draw chart ── */
function drawChart() {
  const data = getData().filter(d => d.type === 'weight');
  const ctx = document.getElementById('weightChart');
  if (chartInst) chartInst.destroy();
  chartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Cân nặng (kg)',
        data: data.map(d => parseFloat(d.value)),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { titleFont: { size: 12 }, bodyFont: { size: 12 } }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { color: '#9ca3af', font: { size: 10 }, maxTicksLimit: 5 }
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { color: '#9ca3af', font: { size: 10 } },
          beginAtZero: false
        }
      }
    }
  });
}

/* ── Init ── */
updateStats();
loadHistory();
drawChart();

/* ── Notification nhắc nhở ── */
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}
setInterval(() => {
  if (Notification.permission === 'granted') {
    new Notification('Gan Nhiễm Mỡ Tracker', {
      body: 'Nhắc nhở: Uống đủ nước và vận động nhẹ nhé!'
    });
  }
}, 3600000);