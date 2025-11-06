// ===================== 挑戰榜系統 =====================
let challengeBoards = [];
let friends = JSON.parse(localStorage.getItem('friendsList')) || [];
let selectedFriendEmails = []; // ✅ 改成用 Email 記錄勾選好友

// --- 切換好友選取狀態 ---
function toggleFriendSelection(friendEmail, btn) {
    const index = selectedFriendEmails.indexOf(friendEmail);
    if (index === -1) {
        selectedFriendEmails.push(friendEmail);
        btn.style.backgroundColor = 'var(--primary-color)';
        btn.style.color = '#fff';
    } else {
        selectedFriendEmails.splice(index, 1);
        btn.style.backgroundColor = '';
        btn.style.color = '';
    }
}

// --- 建立挑戰榜（支援按鈕選好友） ---
window.createChallengeBoard = function () {
    const titleInput = document.getElementById('new-challenge-title');
    const subtitleInput = document.getElementById('new-challenge-subtitle');
    const title = titleInput.value.trim();
    const subtitle = subtitleInput.value.trim();

    if (!title) {
        alert('請務必輸入挑戰主標題！');
        return;
    }
    if (!currentUser) {
        alert('請先登入！');
        return;
    }

    const newBoard = {
        id: 'cb_' + Date.now(),
        creatorEmail: currentUser.email,
        title,
        subtitle,
        participantEmails: [currentUser.email, ...selectedFriendEmails],
    };

    challengeBoards.push(newBoard);
    titleInput.value = '';
    subtitleInput.value = '';
    selectedFriendEmails = []; // 建立後清空
    renderChallengePage();
};

// --- 顯示挑戰詳細 ---
window.viewChallengeBoard = function (boardId) {
    viewingChallengeId = boardId;
    renderChallengePage();
};

window.goBackToBoardList = function () {
    viewingChallengeId = null;
    renderChallengePage();
};

// --- 計算排行榜分數 ---
function getParticipantScores(board) {
    const posts = window.savedPosts || [];
    const friends = JSON.parse(localStorage.getItem('friendsList')) || [];
    const scoreMap = {};

    // 走訪每一篇貼文
    posts.forEach(post => {
        const userEmail = 'test@example.com'; // ✅ 每篇貼文的作者
        if (!userEmail) return; // 沒有 email 就略過

        if (!scoreMap[userEmail]) {
            scoreMap[userEmail] = { count: 0, totalRating: 0, totalCost: 0 };
        }

        scoreMap[userEmail].count++;
        scoreMap[userEmail].totalRating += parseFloat(post.rating || 0);
        scoreMap[userEmail].totalCost += parseFloat(post.cost || 0);
        console.log(scoreMap[userEmail])
    });

    // --- 設定三位好友的固定假資料 ---
    const fakeData = {
        'lily@gmail.com': { postCount: 5, avgRating: 4.5, avgCost: 180 },
        'kevin@gmail.com': { postCount: 3, avgRating: 4.0, avgCost: 220 },
        'lisa@gmail.com': { postCount: 4, avgRating: 3.8, avgCost: 200 },
    };

    return board.participantEmails.map(email => {
        let user =
            email === currentUser.email
                ? { name: currentUser.displayName || '我' }
                : friends.find(f => f.email === email);

        // ✅ 如果是三個好友，用假資料
        if (fakeData[email]) {
            const fd = fakeData[email];
            return {
                email,
                name: user ? user.name : '未知用戶',
                postCount: fd.postCount,
                avgRating: fd.avgRating.toFixed(1),
                avgCost: fd.avgCost,
                totalScore: fd.postCount * 0.5 + fd.avgRating * 0.3 + (fd.avgCost / 100) * 0.2
            };
        }

        const data = scoreMap[email] || { count: 0, totalRating: 0, totalCost: 0 };
        const avgRating = data.count ? (data.totalRating / data.count).toFixed(1) : '0.0';
        const avgCost = data.count ? Math.round(data.totalCost / data.count) : 0;
        const totalScore =
            data.count * 0.5 +
            parseFloat(avgRating) * 0.3 +
            (avgCost / 100) * 0.2;

        return {
            email,
            name: user ? user.name : '未知用戶',
            postCount: data.count,
            avgRating,
            avgCost,
            totalScore,
        };
    });
}



// --- 邀請好友 ---
window.inviteFriendToChallenge = function (boardId) {
    const board = challengeBoards.find(b => b.id === boardId);
    if (!board) return;

    if (friends.length === 0) {
        alert('目前沒有好友可邀請！');
        return;
    }

    const availableFriends = friends.filter(f => !board.participantEmails.includes(f.email));
    if (availableFriends.length === 0) {
        alert('所有好友都已參加此挑戰！');
        return;
    }

    const friendOptions = availableFriends.map(f => f.name).join(', ');
    const friendName = prompt(`請輸入要邀請的好友名稱（可選：${friendOptions}）`);
    if (!friendName) return;

    const friend = friends.find(f => f.name === friendName.trim());
    if (!friend) {
        alert('找不到該好友。');
        return;
    }

    board.participantEmails.push(friend.email);
    renderChallengeBoardDetail(boardId);
};

// --- 刪除挑戰榜 ---
window.deleteChallengeBoard = function (boardId) {
    if (confirm('確定要刪除此挑戰榜嗎？')) {
        challengeBoards = challengeBoards.filter(b => b.id !== boardId);
        goBackToBoardList();
    }
};

// --- 主畫面切換 ---
function renderChallengePage() {
    const pageContent = document.getElementById('challenge-page-content');
    if (!pageContent) return;

    if (!pageContent.querySelector('#challenge-list-view')) {
        // 🔹 改成按鈕選取好友（以 Email 為識別）
        const friendButtons = friends.map(f => `
            <button type="button" class="friend-select-btn" 
                onclick="toggleFriendSelection('${f.email}', this)" 
                style="margin:3px; padding:6px 10px; border:1px solid #ccc; border-radius:5px; cursor:pointer;">
                ${f.name}
            </button>
        `).join('');

        pageContent.innerHTML = `
            <div id="challenge-list-view">
                <div class="form-group" style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h4><i class="fa-solid fa-plus-circle" style="margin-right: 8px;"></i>建立新的挑戰</h4>
                    <input type="text" id="new-challenge-title" placeholder="挑戰主標題，例如：拉麵制霸戰" style="margin-bottom: 10px;">
                    <input type="text" id="new-challenge-subtitle" placeholder="次標題，例如：一個月內誰吃最多家！" style="margin-bottom: 10px;">
                    <div style="margin-bottom:10px;">
                        <strong>選擇參賽好友：</strong>
                        <div style="display:flex; flex-wrap:wrap; max-height:150px; overflow-y:auto; border:1px solid #eee; padding:5px; border-radius:5px;">
                            ${friendButtons || '<div style="color:#999;">目前沒有好友可選</div>'}
                        </div>
                    </div>
                    <button class="btn" style="margin-top: 10px;" onclick="createChallengeBoard()">建立挑戰榜</button>
                </div>
                <div id="challenge-boards-container" style="margin-top: 20px;"></div>
            </div>
            <div id="challenge-detail-view" style="display: none;"></div>
        `;
    }

    if (viewingChallengeId === null) {
        renderChallengeBoardList();
    } else {
        renderChallengeBoardDetail(viewingChallengeId);
    }
}

// --- 顯示挑戰榜清單 ---
function renderChallengeBoardList() {
    const listView = document.getElementById('challenge-list-view');
    const detailView = document.getElementById('challenge-detail-view');
    if (!listView || !detailView) return;

    listView.style.display = 'block';
    detailView.style.display = 'none';

    const container = document.getElementById('challenge-boards-container');

    if (challengeBoards.length === 0) {
        container.innerHTML = '<p class="placeholder-text">您還沒有建立任何挑戰榜。</p>';
        return;
    }

    container.innerHTML = challengeBoards.map(board => `
        <div class="record-card" style="cursor: pointer;" onclick="viewChallengeBoard('${board.id}')">
            <div class="title">${board.title}</div>
            <div class="details">${board.subtitle || '點此查看詳情'}</div>
            <div class="details" style="margin-top: 8px; color: var(--primary-color);">
                <i class="fa-solid fa-users"></i> ${board.participantEmails.length} 位參賽者
            </div>
        </div>
    `).join('');
}

// --- 顯示挑戰榜詳情 ---
function renderChallengeBoardDetail(boardId) {
    const listView = document.getElementById('challenge-list-view');
    const detailView = document.getElementById('challenge-detail-view');
    if (!listView || !detailView) return;

    listView.style.display = 'none';
    detailView.style.display = 'block';

    const board = challengeBoards.find(b => b.id === boardId);
    if (!board) {
        detailView.innerHTML = '<p class="placeholder-text">找不到此挑戰榜。</p><button class="btn" onclick="goBackToBoardList()">返回列表</button>';
        return;
    }

    const participants = getParticipantScores(board)
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((p, i) => {
            const rankIcon = i === 0 ? 'fa-trophy' : i === 1 ? 'fa-medal' : i === 2 ? 'fa-award' : 'fa-user';
            const rankColor = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-light)';

            return `
                <div class="challenge-item" style="padding: 12px 15px; border-bottom: 1px solid #eee;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid ${rankIcon}" style="color:${rankColor};"></i>
                            <span style="font-weight: 600;">${p.name}</span>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: center; font-size: 14px; color: var(--text-light);">
                            <div>📸 ${p.postCount}</div>
                            <div>⭐ ${p.avgRating}</div>
                            <div>💰 \$${p.avgCost}</div>
                            <div style="font-weight:bold; color:var(--primary-color);">🏆 ${p.totalScore.toFixed(2)}</div>
                        </div>
                    </div>
                </div>`;
        }).join('');

    const isCreator = board.creatorEmail === currentUser.email;
    const adminActionsHtml = isCreator
        ? `<button class="btn" style="background-color: var(--primary-color); margin-bottom: 10px;" onclick="inviteFriendToChallenge('${board.id}')"><i class="fa-solid fa-user-plus"></i> 邀請好友</button>
           <button class="btn" style="background-color: var(--danger-color);" onclick="deleteChallengeBoard('${board.id}')"><i class="fa-solid fa-trash"></i> 刪除挑戰榜</button>`
        : '';

    detailView.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button class="btn" style="background-color: #6c757d; margin-bottom: 20px;" onclick="goBackToBoardList()">
                <i class="fa-solid fa-chevron-left"></i> 返回挑戰列表
            </button>
            <div class="post-card" style="padding: 20px;">
                <h3>${board.title}</h3>
                <p style="color: var(--text-light);">${board.subtitle || ''}</p>
            </div>
        </div>

        <h4><i class="fa-solid fa-ranking-star"></i> 綜合排行榜</h4>
        <div id="leaderboard-container">${participants}</div>

        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            ${adminActionsHtml}
        </div>
    `;
}


// --- 🔹 整合 savedPosts：新增/刪除貼文時自動更新挑戰榜 ---
const originalSaveReview = window.saveReview;
window.saveReview = async function (...args) {
    await originalSaveReview(...args);
    renderChallengePage();
};

const originalDeletePost = window.deletePost;
window.deletePost = async function (...args) {
    await originalDeletePost(...args);
    renderChallengePage();
}; 