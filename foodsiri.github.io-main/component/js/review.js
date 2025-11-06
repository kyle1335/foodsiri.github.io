// === LocalStorage-based save/edit/delete (frontend-only 測試用) ===

// 測試用假登入（若你已經有 currentUser，這段不會覆蓋）
if (typeof window.currentUser === 'undefined' || !window.currentUser) {
  window.currentUser = {
    uid: 'testUser123',
    displayName: '測試用戶',
    email: 'test@test.com'
  };
}

// 紀錄正在編輯的 postId（確保變數存在）
window.editingPostId = window.editingPostId || null;

window.savedPosts = window.savedPosts || [];

// localStorage helper
function getStoredPosts() {
  try {
    const raw = localStorage.getItem('mock_posts');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('讀取 localStorage 失敗', e);
    return [];
  }
}
function saveStoredPosts(posts) {
  try {
    localStorage.setItem('mock_posts', JSON.stringify(posts));
  } catch (e) {
    console.error('寫入 localStorage 失敗', e);
  }
}

// 方便的 async wrapper（若程式其他地方呼叫 getPosts())
async function getPosts() {
  return getStoredPosts();
}

// --- 儲存評論（新增/編輯）---
window.saveReview = async function() {
  if (!currentUser) { 
    alert('請先登入！'); 
    if (typeof window.showPage === 'function') window.showPage('login-page'); 
    return; 
  }

  const nameEl = document.getElementById('review-restaurant-name');
  const ratingEl = document.getElementById('review-rating');
  if (!nameEl || !ratingEl) { alert('表單元素讀取失敗，無法儲存。'); return; }

  const name = nameEl.value.trim();
  const rating = ratingEl.dataset.rating;
  if (!name || rating === "0") { alert("請務必填寫「餐廳名稱」和「喜愛程度」！"); return; }

  const photos = Array.from(document.querySelectorAll('#photo-preview-container .photo-preview-item img'))
                      .map(img => img.src);

  const dateInput = document.getElementById('review-date');
  let dateValue = dateInput?.value || ''; // 若沒選，會是空字串
  if (!dateValue) {
    // 若沒選擇，預設今天
    const today = new Date();
    dateValue = today.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  const postData = {
    id: window.editingPostId || `post_${Date.now()}`,
    name,
    items: (document.getElementById('review-meal-items')?.value || '').trim(),
    cost: Number(document.getElementById('review-cost')?.value) || 0,
    mealType: document.getElementById('review-meal-type')?.value || 'other',
    rating,
    content: (document.getElementById('review-content')?.value || '').trim(),
    photos,
    timeToday:new Date().toISOString(),
    timestamp: dateValue,
    userId: currentUser.uid, // 🔹 加上 userId
    user: currentUser.displayName || currentUser.uid || '匿名'
  };

  if (window.editingPostId) {
    const idx = window.savedPosts.findIndex(p => p.id === window.editingPostId);
    if (idx !== -1) window.savedPosts[idx] = postData;
    else window.savedPosts.push(postData);
    alert("評論已成功更新！");
  } else {
    window.savedPosts.push(postData);
    alert("評論已成功儲存！");
  }

  // 🔹 打印目前的變數內容
  console.log("=== 當前 savedPosts 內容 ===");
  console.log(window.savedPosts);

  // 🔹 同步到 localStorage
  saveStoredPosts(window.savedPosts);

  window.editingPostId = null;
  if (typeof resetReviewForm === 'function') resetReviewForm();
  if (typeof renderMyPosts === 'function') renderMyPosts();
};



// === 切換 Profile 分頁（安全檢查版） ===
window.showProfileTab = async function(tabId, tabElement) {
  try {
    document.querySelectorAll('#profile-page .tab-btn').forEach(btn => btn.classList.remove('active'));
    if (tabElement) tabElement.classList.add('active');

    document.querySelectorAll('#profile-page .tab-content').forEach(content => content.classList.remove('active'));
    const tabContent = document.getElementById(`${tabId}-content`);
    if (tabContent) tabContent.classList.add('active');

    if (tabId === 'accounting' && typeof renderAccountingRecords === 'function') await renderAccountingRecords();
    if (tabId === 'posts' && typeof renderMyPosts === 'function') await renderMyPosts();
    if (tabId === 'favorites' && typeof renderFavoriteRestaurants === 'function') await renderFavoriteRestaurants();
    if (tabId === 'friends' && typeof renderFriendsList === 'function') await renderFriendsList();
  } catch (e) {
    console.error('showProfileTab 執行錯誤：', e);
  }
};

// === 從地圖跳到新增評論頁（安全版） ===
window.goToReviewPageFromMap = function() {
  try {
    if (typeof infoWindow !== 'undefined' && infoWindow && typeof infoWindow.close === 'function') {
      infoWindow.close();
    }
  } catch (e) {
    // ignore
  }

  if (!currentUser) { alert('請先登入才能新增評論！'); if (typeof window.showPage === 'function') window.showPage('login-page'); return; }
  if (!selectedPlaceForReview) {
    alert('未選擇任何地點，無法新增評論。');
    return;
  }

  const addReviewNavButton = document.querySelector('.nav-item[onclick*="add-review-page"]');
  if (typeof window.showPage === 'function') {
    window.showPage('add-review-page', addReviewNavButton);
  }
  const nameInput = document.getElementById('review-restaurant-name');
  if (nameInput && selectedPlaceForReview.name) nameInput.value = selectedPlaceForReview.name;
};

// === QR Scanner 開關（有檢查 DOM 與 API） ===
window._qrStream = window._qrStream || null;
window._qrAnimationFrameId = window._qrAnimationFrameId || null;

window.openQrScanner = function() {
  const qrModal = document.getElementById('qr-modal') || document.querySelector('.qr-modal');
  const qrStatusText = document.getElementById('qr-status-text') || document.querySelector('.qr-status-text');
  const scanBox = document.getElementById('scan-box') || document.querySelector('.scan-box');
  const video = document.getElementById('qr-video') || document.querySelector('video#qr-video') || document.querySelector('video');

  if (!qrModal || !qrStatusText || !scanBox || !video) {
    alert('QR 掃描器的元素未找到，請確認頁面上是否有對應的元素 ID（qr-modal, qr-status-text, scan-box, qr-video）。');
    return;
  }

  qrModal.style.display = 'flex';
  qrStatusText.textContent = '請將發票左方(總金額)或右方(明細) QR Code 對準掃描框';
  scanBox.style.borderColor = 'rgba(255, 255, 255, 0.7)';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    qrStatusText.textContent = '此裝置不支援相機或未授權。';
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(function(s) {
      window._qrStream = s;
      video.srcObject = s;
      video.setAttribute("playsinline", true);
      video.play();
      if (typeof tick === 'function') {
        window._qrAnimationFrameId = requestAnimationFrame(tick);
      } else {
        // 沒有 tick 函式的話仍可顯示影片，但不會處理掃描
        console.warn('tick 函式不存在，QR 掃描影格更新（requestAnimationFrame）已略過。');
      }
    })
    .catch(function(err) {
      qrStatusText.textContent = '無法啟動相機。請確認已授權。';
      console.error("相機錯誤:", err);
    });
};

window.closeQrScanner = function() {
  const qrModal = document.getElementById('qr-modal') || document.querySelector('.qr-modal');
  if (qrModal) qrModal.style.display = 'none';

  if (window._qrStream) {
    try {
      window._qrStream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.warn('停止相機時發生錯誤', e);
    }
    window._qrStream = null;
  }

  if (window._qrAnimationFrameId) {
    cancelAnimationFrame(window._qrAnimationFrameId);
    window._qrAnimationFrameId = null;
  }
};

// --- 編輯貼文 ---
window.editPost = async function(postId) {
  const postToEdit = window.savedPosts.find(p => p.id === postId);
  if (!postToEdit) return;

  window.editingPostId = postId;

  const mappings = {
    'review-restaurant-name': postToEdit.name,
    'review-meal-items': postToEdit.items || '',
    'review-cost': postToEdit.cost || '',
    'review-meal-type': postToEdit.mealType || 'other',
    'review-content': postToEdit.content || ''
  };

  for (const id in mappings) {
    const el = document.getElementById(id);
    if (el) el.value = mappings[id];
  }

  const ratingEl = document.getElementById('review-rating');
  if (ratingEl) ratingEl.dataset.rating = postToEdit.rating || 0;
  if (typeof updateHeartDisplay === 'function') updateHeartDisplay(postToEdit.rating || 0);

  const previewContainer = document.getElementById('photo-preview-container');
  if (previewContainer) {
    previewContainer.innerHTML = '';
    (postToEdit.photos || []).forEach(src => {
      const wrapper = document.createElement('div');
      wrapper.className = 'photo-preview-item';
      const img = document.createElement('img');
      img.src = src;
      img.style.maxWidth = '100px';
      wrapper.appendChild(img);
      previewContainer.appendChild(wrapper);
    });
  }

  const header = document.getElementById('add-review-header');
  if (header) header.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>編輯美食評論`;
  const saveBtn = document.getElementById('save-review-btn');
  if (saveBtn) saveBtn.textContent = "更新評論";

  if (typeof window.showPage === 'function') window.showPage('add-review-page');
};

// --- 刪除貼文 ---
window.deletePost = async function(postId) {
  if (!confirm('確定要刪除這筆紀錄嗎？')) return;

  window.savedPosts = window.savedPosts.filter(p => p.id !== postId);
  alert("評論已刪除！");

  if (typeof renderProfilePage === 'function') await renderProfilePage();
  else if (typeof renderMyPosts === 'function') await renderMyPosts();
  else if (typeof window.showPage === 'function') {
    const navBtn = document.querySelector('.nav-item[onclick*="profile-page"]');
    window.showPage('profile-page', navBtn);
  }
};


// --- 重設表單 ---
function resetReviewForm() {
  window.editingPostId = null;
  const header = document.getElementById('add-review-header');
  if (header) header.innerHTML = `<i class="fa-solid fa-pencil"></i>新增美食評論`;
  const saveBtn = document.getElementById('save-review-btn');
  if (saveBtn) saveBtn.textContent = "儲存評論與貼文";

  ['review-restaurant-name', 'review-meal-items', 'review-cost', 'review-content'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  const mealType = document.getElementById('review-meal-type');
  if (mealType) mealType.value = 'breakfast';

  const ratingEl = document.getElementById('review-rating');
  if (ratingEl) ratingEl.dataset.rating = 0;
  if (typeof updateHeartDisplay === 'function') updateHeartDisplay(0);

  const preview = document.getElementById('photo-preview-container');
  if (preview) preview.innerHTML = '';
}
