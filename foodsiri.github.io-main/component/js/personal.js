// ===================== 全域初始化 =====================
window.savedFavorites = window.savedFavorites || [
    { place_id: "1", name: "麥當勞" },
    { place_id: "2", name: "星巴克" },
    { place_id: "3", name: "全聯福利中心" }
];

window.savedPosts = window.savedPosts || [
    {
        id: "p1",
        timestamp: Date.now() - 100000000,
        name: "貼文 A",
        content: "今天吃了早餐三明治，還不錯",
        rating: 3,
        photos: []
    },
    {
        id: "p2",
        timestamp: Date.now() - 200000000,
        name: "貼文 B",
        content: "午餐便當很好吃",
        rating: 4,
        photos: []
    }
];

// ===================== 最愛餐廳 =====================
async function renderFavoriteRestaurants() {
    const container = document.getElementById('favorites-content');

    if (window.savedFavorites.length === 0) {
        container.innerHTML = `<p class="placeholder-text">
            您還沒有加入任何最愛餐廳。<br>
            可以從地圖上點擊餐廳的<i class="fa-regular fa-heart" style="color:#ddd"></i>來加入喔！
        </p>`;
        return;
    }

    container.innerHTML = '<h3>我的最愛餐廳</h3>' + window.savedFavorites.map(f => `
        <div class="record-card" id="favorite-${f.name}">
            <div class="card-actions">
                <button class="action-btn btn-delete" onclick="removeFavoriteByName('${f.name}')">取消收藏</button>
            </div>
            <div class="title">
                <i class="fa-solid fa-utensils" style="margin-right:8px; color: var(--primary-color)"></i>${f.name}
            </div>
        </div>`).join('');
}

// 移除最愛餐廳（依名稱刪除）
function removeFavoriteByName(name) {
    const idx = window.savedFavorites.findIndex(f => f.name === name);
    if (idx !== -1) {
        const removed = window.savedFavorites.splice(idx, 1)[0];
        renderFavoriteRestaurants();
        console.log(`${removed.name} 已從最愛餐廳移除`);
    }
}

// 新增最愛餐廳 (地圖收藏同步)
function addFavorite(place) {
    if (!window.savedFavorites.some(f => f.name === place.name)) {
        window.savedFavorites.push(place);
        renderFavoriteRestaurants();
        console.log(`${place.name} 已加入最愛餐廳`);
    }
}


// ===================== 消費紀錄 =====================
async function renderAccountingRecords() {
    const container = document.getElementById('accounting-content');

    const posts = window.savedPosts || [];

    const validPosts = posts.filter(p => p.cost > 0);
    if (validPosts.length === 0) {
        container.innerHTML = `<p class="placeholder-text">尚無消費紀錄。</p>`;
        return;
    }

    const mealTypeNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', other: '其他' };
    const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'other'];

    // 依日期分組
    const groupedByDate = validPosts.reduce((acc, post) => {
        const date = new Date(post.timestamp).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(post);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

    let html = '';
    sortedDates.forEach(date => {
        const dayPosts = groupedByDate[date];
        const totalCost = dayPosts.reduce((sum, p) => sum + p.cost, 0); // 計算當日總額

        html += `<div class="accounting-date-group">
                    <div class="accounting-date-header">${date} - 總消費：$${totalCost}</div>`;

        mealTypeOrder.forEach(mealType => {
            const mealPosts = dayPosts.filter(p => (p.mealType || 'other') === mealType);
            if (mealPosts.length > 0) {
                html += `<h4 class="accounting-meal-header">${mealTypeNames[mealType]}</h4>`;
                html += mealPosts.map(p => `
                    <div class="record-card">
                        <span class="cost">$${p.cost}</span>
                        <div class="title">${p.items}</div>
                    </div>`).join('');
            }
        });

        html += `</div>`;
    });

    container.innerHTML = html || `<p class="placeholder-text">尚無消費紀錄。</p>`;
}


// ===================== 我的貼文 =====================
async function renderMyPosts() {
    const postsContent = document.getElementById('posts-content');

    if (!postsContent.querySelector('.sort-container')) {
        postsContent.innerHTML = `
            <div class="sort-container" style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 15px; padding: 0;">
                <label for="post-sort-order" style="font-size: 14px; color: var(--text-light); margin-right: 8px;">排序:</label>
                <select id="post-sort-order" onchange="renderMyPosts()" style="border-radius: 15px; border: 1px solid #ddd; padding: 5px 10px; font-size: 14px; background-color: white;">
                    <option value="newest">由新到舊</option>
                    <option value="oldest">由舊到新</option>
                </select>
            </div>
            <div id="posts-list-container"></div>`;
    }

    const listContainer = document.getElementById('posts-list-container');
    const posts = window.savedPosts || [];

    if (posts.length === 0) {
        listContainer.innerHTML = `<p class="placeholder-text">您還沒有發表過貼文。</p>`;
        return;
    }

    const sortOrder = document.getElementById('post-sort-order').value;
    posts.sort((a, b) => sortOrder === 'newest' ? new Date(b.timestamp) - new Date(a.timestamp) : new Date(a.timestamp) - new Date(b.timestamp));

    listContainer.innerHTML = posts.map(p => {
        const ratingHtml = Array(parseInt(p.rating || 0)).fill('<i class="fa-solid fa-heart"></i>').join('');
        const photosHtml = (p.photos && p.photos.length > 0) ? `<div class="post-photos">${p.photos.map(src => `<img src="${src}" alt="Post photo">`).join('')}</div>` : '';
        return `
            <div class="post-card">
                <div class="card-actions">
                    <button class="action-btn btn-edit" onclick="editPost('${p.id}')">編輯</button>
                    <button class="action-btn btn-delete" onclick="deletePost('${p.id}')">刪除</button>
                </div>
                <div class="title">${p.name}</div>
                <div class="details">${new Date(p.timeToday).toLocaleString()}</div>
                <p class="content" style="white-space: pre-wrap;">${p.content || '（無詳細評論）'}</p>
                <div class="post-rating">${ratingHtml}</div>
                ${photosHtml}
            </div>`;
    }).join('');
}

// ===================== 好友列表 =====================
async function renderFriendsList() {
    const friendsContent = document.getElementById('friends-content');

    // 初始化畫面結構（如果還沒建立）
    if (!friendsContent.querySelector('.search-area')) {
        friendsContent.innerHTML = `
            <div class="search-area" style="padding: 0 0 20px 0; border-bottom: none; background: transparent;">
                <p style="font-size: 14px; color: var(--text-light); margin-bottom: 10px;">透過 Email 搜尋好友：</p>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="friend-search-input" class="search-input" placeholder="輸入好友的 Email..." style="border-radius: 8px; padding: 12px 15px; width: auto; flex-grow: 1;">
                    <button class="btn" style="padding: 0; width: 80px; height: 44px; flex-shrink: 0;" onclick="searchFriend()">搜尋</button>
                </div>
            </div>
            <div id="friends-list-container"></div>`;
    }

    // 取得好友資料（從 localStorage）
    let savedFriends = JSON.parse(localStorage.getItem('friendsList')) || [];

    const listContainer = document.getElementById('friends-list-container');

    if (savedFriends.length === 0) {
        listContainer.innerHTML = `<p class="placeholder-text">您還沒有加入任何好友。</p>`;
    } else {
        listContainer.innerHTML = savedFriends.map(f => `
            <div class="record-card">
                <div class="card-actions">
                    <button class="action-btn btn-delete" onclick="deleteFriend('${f.email}')">刪除</button>
                </div>
                <div class="title"><i class="fa-solid fa-user-group" style="margin-right:8px; color: var(--text-light)"></i>${f.name}</div>
                <div class="details">Email: ${f.email}</div>
            </div>`).join('');
    }
}

// ===================== 搜尋好友 =====================
function searchFriend() {
    const input = document.getElementById('friend-search-input');
    const email = input.value.trim();
    if (!email) {
        alert('請輸入 Email！');
        return;
    }

    // 模擬搜尋結果（在實際應用中這裡會呼叫後端 API）
    const foundUser = {
        name: email.split('@')[0],
        email: email
    };

    if (confirm(`找到使用者：${foundUser.name}\n是否加入好友？`)) {
        addFriend(foundUser);
    }

    input.value = '';
}

// ===================== 新增好友 =====================
function addFriend(friend) {
    let savedFriends = JSON.parse(localStorage.getItem('friendsList')) || [];

    if (savedFriends.some(f => f.email === friend.email)) {
        alert('此好友已存在！');
        return;
    }

    savedFriends.push(friend);
    localStorage.setItem('friendsList', JSON.stringify(savedFriends));
    renderFriendsList();
}

// ===================== 刪除好友 =====================
function deleteFriend(email) {
    let savedFriends = JSON.parse(localStorage.getItem('friendsList')) || [];
    savedFriends = savedFriends.filter(f => f.email !== email);
    localStorage.setItem('friendsList', JSON.stringify(savedFriends));
    renderFriendsList();
}
