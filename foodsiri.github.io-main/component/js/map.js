// ===== categoryKeywords =====
const categoryKeywords = {
  '日式料理': { color: '#e57373', keywords: ['一風堂', '拉麵小路', '藏壽司', '和民居酒屋', '築地銀だこ'] },
  '火鍋': { color: '#ff9800', keywords: ['鼎王麻辣鍋', '小蒙牛', '老四川', '涮乃葉', '無老鍋'] },
  '咖啡廳': { color: '#795548', keywords: ['星巴克', '路易莎', '咖啡弄', '伯朗咖啡館', 'Cama咖啡'] },
  '義大利麵': { color: '#66bb6a', keywords: ['莫凡彼義式餐廳', '帕帕義大利麵', 'Osteria義式料理', '薄多義', 'W Pizza'] },
  '早午餐': { color: '#ffee58', keywords: ['Eggs’n Things', '布魯斯早午餐', '班尼頓早午餐', '陽光早餐店', 'Bistro Cafe'] },
  '小吃': { color: '#78909c', keywords: ['阿宗麵線', '黑輪伯', '老王水餃', '大腸包小腸', '小李滷味'] }
};

const defaultMarkerColor = '#EA4335';
let userLocation = null;
let userMarkerLayer;
let restaurantLayer;
let map;

// 模擬好友名單
const allFriends = ['Alice', 'Bob', '小明', 'Lily', '志強', '小美', 'Andy'];

// 全域收藏最愛
window.savedFavorites = window.savedFavorites || [];

document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
});

// ===== 初始化地圖 =====
function initializeMap() {
  userMarkerLayer = new ol.layer.Vector({ source: new ol.source.Vector() });
  restaurantLayer = new ol.layer.Vector({ source: new ol.source.Vector() });

  map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({ source: new ol.source.OSM() }),
      userMarkerLayer,
      restaurantLayer,
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([121.5654, 25.0330]),
      zoom: 14,
    }),
  });

  centerOnUserGPS();
}

// ===== 定位使用者位置 =====
function centerOnUserGPS() {
  if (!navigator.geolocation) {
    alert('無法使用 GPS 功能');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = [position.coords.longitude, position.coords.latitude];
      userLocation = coords;
      const projectedCoords = ol.proj.fromLonLat(coords);

      map.getView().animate({ center: projectedCoords, zoom: 16 });

      userMarkerLayer.getSource().clear();

      const userFeature = new ol.Feature({ geometry: new ol.geom.Point(projectedCoords) });
      userFeature.setStyle(
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({ color: '#1976D2' }),
            stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
          }),
        })
      );
      userMarkerLayer.getSource().addFeature(userFeature);

      searchNearbyRestaurants(coords);
    },
    (error) => {
      console.error('GPS 定位錯誤:', error);
      alert('無法取得定位資訊');
    }
  );
}

// ===== 模擬餐廳資料（生成 40 筆） =====
function searchNearbyRestaurants(centerLonLat) {
  const listContainer = document.getElementById('list-content-area');
  listContainer.innerHTML = '<p class="list-status-text">載入附近餐廳中...</p>';

  restaurantLayer.getSource().clear();

  const categories = Object.keys(categoryKeywords);
  const dummyRestaurants = [];

  for (let i = 1; i <= 40; i++) {
    const lonOffset = (Math.random() - 0.5) * 0.02;
    const latOffset = (Math.random() - 0.5) * 0.02;

    const category = categories[Math.floor(Math.random() * categories.length)];
    const keywords = categoryKeywords[category].keywords;
    const name = `${keywords[Math.floor(Math.random() * keywords.length)]} ${randomSuffix()}`;

    const initialRec = Math.floor(Math.random() * 4) + 2; // 2~5
    const initialFriends = [];
    while (initialFriends.length < initialRec) {
      const f = getRandomFriend(initialFriends);
      if (!initialFriends.includes(f)) initialFriends.push(f);
    }

    dummyRestaurants.push({
      name,
      location: [centerLonLat[0] + lonOffset, centerLonLat[1] + latOffset],
      friendsRecommended: initialRec,
      friendNames: initialFriends,
    });
  }

  listContainer.innerHTML = '';

  dummyRestaurants.forEach((rest) => {
    const coord = ol.proj.fromLonLat(rest.location);
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(coord),
      name: rest.name,
      friendsRecommended: rest.friendsRecommended,
    });

    // 存完整餐廳資料方便過濾
    feature.set('restData', rest);

    feature.setStyle(
      new ol.style.Style({
        image: new ol.style.Icon({ src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', scale: 0.05 }),
        text: new ol.style.Text({
          text: `推${rest.friendsRecommended}`,
          offsetY: -25,
          fill: new ol.style.Fill({ color: '#000' }),
          stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
          font: 'bold 12px sans-serif',
        }),
      })
    );

    restaurantLayer.getSource().addFeature(feature);

    renderListItem(rest, coord, feature);
  });
}

// ===== 隨機挑選還沒推薦過的好友 =====
function getRandomFriend(excluded) {
  const available = allFriends.filter(f => !excluded.includes(f));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : '新朋友';
}

// ===== 隨機生成餐廳後綴 =====
function randomSuffix() {
  const suffixes = ['屋', '館', '坊', '角落', '餐廳', '食堂', '小館', '咖啡館'];
  return suffixes[Math.floor(Math.random() * suffixes.length)];
}

// ===== 過濾餐廳 =====
function applyFilter(btn) {
  const filterValue = btn.dataset.filterValue;

  // 更新 active 樣式
  document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const allFeatures = restaurantLayer.getSource().getFeatures();

  let filteredFeatures = [];

  if (filterValue === '全部') {
    filteredFeatures = allFeatures;
  } else {
    const keywords = categoryKeywords[filterValue]?.keywords || [];
    filteredFeatures = allFeatures.filter(f => {
      const rest = f.get('restData');
      return keywords.some(k => rest.name.includes(k));
    });
  }

  // 更新地圖 Marker 顯示
  allFeatures.forEach(f => {
    f.setStyle(filteredFeatures.includes(f) ? 
      new ol.style.Style({
        image: new ol.style.Icon({ src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', scale: 0.05 }),
        text: new ol.style.Text({
          text: `推${f.get('restData').friendsRecommended}`,
          offsetY: -25,
          fill: new ol.style.Fill({ color: '#000' }),
          stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
          font: 'bold 12px sans-serif',
        }),
      })
      : null
    );
  });

  renderListFromFeatures(filteredFeatures);
}

// ===== 渲染列表 =====
function renderListFromFeatures(features) {
  const listContainer = document.getElementById('list-content-area');
  listContainer.innerHTML = '';
  features.forEach(f => {
    const rest = f.get('restData');
    const coord = ol.proj.fromLonLat(rest.location);

    renderListItem(rest, coord, f);
  });
}

// ===== 渲染單個 list-item =====
function renderListItem(rest, coord, feature) {
  const listContainer = document.getElementById('list-content-area');

  const div = document.createElement('div');
  div.className = 'list-item';
  div.innerHTML = `
    <strong>${rest.name}</strong><br>
    <span class="friend-rec">好友推薦：${rest.friendsRecommended}</span><br>
    <small>(${rest.friendNames.join(', ')})</small><br>
    <button class="recommend-btn">👍 推薦</button>
    <button class="favorite-btn">❤️ ${window.savedFavorites.find(fav=>fav.name===rest.name)?'已收藏':'收藏'}</button>
  `;

  div.onclick = () => { map.getView().animate({ center: coord, zoom: 17 }); };

  const recBtn = div.querySelector('.recommend-btn');
  const favBtn = div.querySelector('.favorite-btn');

  // 推薦邏輯
  if (rest.friendsRecommended >= 5) {
    recBtn.disabled = true;
    recBtn.style.opacity = '0.6';
    recBtn.textContent = '⭐ 已滿';
  }

  recBtn.onclick = (e) => {
    e.stopPropagation();
    if (rest.friendsRecommended >= 5) return alert('此餐廳好友推薦已達上限（5）');
    const newFriend = getRandomFriend(rest.friendNames);
    rest.friendNames.push(newFriend);
    rest.friendsRecommended++;
    div.querySelector('.friend-rec').textContent = `好友推薦：${rest.friendsRecommended}`;
    div.querySelector('small').textContent = `(${rest.friendNames.join(', ')})`;
    feature.getStyle().getText().setText(`推${rest.friendsRecommended}`);
    restaurantLayer.changed();
    if (rest.friendsRecommended >= 5) {
      recBtn.disabled = true;
      recBtn.style.opacity = '0.6';
      recBtn.textContent = '⭐ 已滿';
    }
  };

  // 收藏邏輯
  favBtn.onclick = (e) => {
    e.stopPropagation();
    const idx = window.savedFavorites.findIndex(fav => fav.name === rest.name);
    if (idx === -1) {
      window.savedFavorites.push({ name: rest.name, recommenders: [...rest.friendNames] });
      favBtn.textContent = '❤️ 已收藏';
      alert(`${rest.name} 已加入最愛，推薦人數：${rest.friendsRecommended}`);
    } else {
      window.savedFavorites.splice(idx, 1);
      rest.friendNames = [];
      rest.friendsRecommended = 0;
      favBtn.textContent = '❤️ 收藏';
      alert(`${rest.name} 已從最愛移除`);
    }
  };

  listContainer.appendChild(div);
}
