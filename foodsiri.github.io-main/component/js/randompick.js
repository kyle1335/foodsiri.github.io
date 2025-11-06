// 假設 window.savedFavorites 已經有資料
function drawPickerWheel() {
  const wheel = document.getElementById('picker-wheel');
  const favorites = window.savedFavorites || [];

  wheel.innerHTML = '<div id="picker-result">?</div>';

  if (favorites.length === 0) {
    wheel.style.background = '#f0f0f0';
    return;
  }

  const numOptions = favorites.length;
  const sliceAngle = 360 / numOptions;
  const colors = ['#667eea','#f6d365','#fda085','#764ba2','#84fab0','#8fd3f4','#fccb90','#d4c4fb'];

  let gradientString = 'conic-gradient(';
  let currentAngle = 0;

  favorites.forEach((fav, i) => {
    const color = colors[i % colors.length];
    gradientString += `${color} ${currentAngle}deg ${currentAngle + sliceAngle}deg`;
    if (i < numOptions - 1) gradientString += ', ';

    const textEl = document.createElement('div');
    textEl.className = 'slice-text';
    textEl.textContent = fav.name;

    const textAngle = currentAngle + sliceAngle / 2;
    textEl.style.transform = `rotate(${textAngle}deg) translateY(-80px) rotate(-${textAngle}deg)`;

    wheel.appendChild(textEl);
    currentAngle += sliceAngle;
  });

  gradientString += ')';
  wheel.style.background = gradientString;
}

async function startRandomPick() {
  const favorites = window.savedFavorites || [];
  if (favorites.length < 2) {
    alert("最愛餐廳少於2家，無法抽籤！");
    return;
  }

  const wheel = document.getElementById('picker-wheel');
  const resultDiv = document.getElementById('picker-result');
  const statusText = document.getElementById('random-status-text');
  const pickButton = document.getElementById('random-pick-btn');

  pickButton.disabled = true;
  resultDiv.textContent = '...';
  statusText.style.visibility = 'hidden';

  const numOptions = favorites.length;
  const sliceAngle = 360 / numOptions;

  const winnerIndex = Math.floor(Math.random() * numOptions);
  const winner = favorites[winnerIndex];

  const targetSliceCenter = (sliceAngle * winnerIndex) + (sliceAngle / 2);
  const randomSpins = Math.floor(Math.random() * 4) + 4; // 旋轉圈數
  const finalAngle = 360 * randomSpins - targetSliceCenter + 90; // 90度對齊箭頭上方

  // 開始旋轉
  wheel.style.transition = 'transform 4s cubic-bezier(0.25,1,0.5,1)';
  wheel.style.transform = `rotate(${finalAngle}deg)`;

  setTimeout(() => {
    resultDiv.textContent = '🎉';
    statusText.innerHTML = `您抽中「<strong>${winner.name}</strong>」！（推薦人：${winner.recommenders.join(', ') || "無"}）`;
    statusText.style.visibility = 'visible';
    pickButton.disabled = false;
  }, 4100);
}
