    // --- 全域可呼叫函式 (掛載到 window) ---
    window.showPage = async function(pageId, navElement = null) {
        if (pageId === 'add-review-page' && !editingPostId) {
            resetReviewForm();
        }
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            if (!['login-page', 'register-page'].includes(activePage.id) || !['login-page', 'register-page'].includes(pageId)) {
                pageHistory.push(activePage.id);
            }
        }
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        if (navElement) {
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            navElement.classList.add('active');
            pageHistory = [];
        }
        if (pageId === 'random-page') await updateRandomPageStatus();
        if (pageId === 'challenge-page') { viewingChallengeId = null; await renderChallengePage(); }
        if (pageId === 'profile-page') await renderProfilePage();
    };


window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');

  if (page) {
    // 找到對應的 nav-item
    const navItems = document.querySelectorAll('.nav-item');
    let matchedItem = null;

    navItems.forEach(item => {
      const onclickAttr = item.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes(`'${page}'`)) {
        matchedItem = item;
      }
    });

    if (matchedItem) {
      showPage(page, matchedItem);
    } else {
      console.warn(`No nav-item matches page: ${page}`);
    }
  }
});



  window.goBack = function() {
        editingPostId = null;
        resetReviewForm();
        if (pageHistory.length > 0) {
            const lastPageId = pageHistory.pop();
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(lastPageId).classList.add('active');
        } else {
            window.showPage('map-page', document.querySelector('.nav-item[onclick*="map-page"]'));
        }
    };
