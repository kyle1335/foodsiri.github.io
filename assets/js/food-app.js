/**
 * Food Paradise Website - Main JavaScript
 * 美食天地 - Core functionalities
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
    
    // Load popular restaurants
    loadPopularRestaurants();
    
    // Load recent articles
    loadRecentArticles();
    
    // Add event listeners
    setupEventListeners();
});

/**
 * Initialize application
 */
function initApp() {
    // Check if user is logged in (from session)
    checkLoginStatus();
    
    // Initialize any UI components
    initUIComponents();
}

/**
 * Check user login status
 */
function checkLoginStatus() {
    fetch('/api/check_login.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.logged_in) {
                // User is logged in
                updateUIForLoggedInUser(data.user);
            } else {
                // User is not logged in
                updateUIForGuest();
            }
        })
        .catch(error => {
            console.error('Error checking login status:', error);
            updateUIForGuest();
        });
}

/**
 * Update UI for logged in user
 */
function updateUIForLoggedInUser(user) {
    const loginNavItem = document.querySelector('nav ul li a[href="#login"]');
    if (loginNavItem) {
        loginNavItem.textContent = user.username;
        loginNavItem.href = '#profile';
    }
    
    const loginSection = document.getElementById('login');
    if (loginSection) {
        loginSection.innerHTML = `
            <h2 class="major">用戶資料</h2>
            <div class="user-profile">
                <img src="${user.avatar}" alt="${user.username}" class="avatar">
                <h3>${user.username}</h3>
                <p>${user.email}</p>
                <div class="user-actions">
                    <button id="view-favorites" class="button primary">我的收藏</button>
                    <button id="view-reviews" class="button">我的評論</button>
                    <button id="logout-btn" class="button secondary">登出</button>
                </div>
            </div>
        `;
        
        // Add logout event listener
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        
        // Add other profile-related event listeners
        const favoritesBtn = document.getElementById('view-favorites');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => loadUserFavorites(user.id));
        }
        
        const reviewsBtn = document.getElementById('view-reviews');
        if (reviewsBtn) {
            reviewsBtn.addEventListener('click', () => loadUserReviews(user.id));
        }
    }
}

/**
 * Update UI for guest (not logged in)
 */
function updateUIForGuest() {
    const loginNavItem = document.querySelector('nav ul li a[href="#profile"]');
    if (loginNavItem) {
        loginNavItem.textContent = '登入/註冊';
        loginNavItem.href = '#login';
    }
    
    // Ensure login form is displayed in login section
    const loginSection = document.getElementById('login');
    if (loginSection && !loginSection.querySelector('form.login-form')) {
        // Leave default login/register HTML as set in index.html
    }
}

/**
 * Initialize UI components
 */
function initUIComponents() {
    // Initialize any third-party components or custom UI elements
}

/**
 * Set up event listeners for the application
 */
function setupEventListeners() {
    // Login form submission
    const loginForm = document.querySelector('form.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form submission
    const registerForm = document.querySelector('form.register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Search form submission
    const searchForm = document.querySelector('form.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Register/Login toggle
    const loginToggle = document.getElementById('login-toggle');
    const registerToggle = document.getElementById('register-toggle');
    
    if (loginToggle && registerToggle) {
        loginToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.login-form').style.display = 'block';
            document.querySelector('.register-form').style.display = 'none';
        });
        
        registerToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.login-form').style.display = 'none';
            document.querySelector('.register-form').style.display = 'block';
        });
    }
}

/**
 * Handle login form submission
 */
function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    fetch('/api/login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Login successful
            showNotification('登入成功', 'success');
            updateUIForLoggedInUser(data.user);
            
            // Redirect to home or requested page
            setTimeout(() => {
                window.location.hash = '#discover';
            }, 1000);
        } else {
            // Login failed
            showNotification(data.message || '登入失敗，請檢查您的憑證', 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('發生錯誤，請稍後再試', 'error');
    });
}

/**
 * Handle register form submission
 */
function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Validate password match
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');
    
    if (password !== confirmPassword) {
        showNotification('密碼不匹配', 'error');
        return;
    }
    
    fetch('/api/register.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Registration successful
            showNotification('註冊成功！', 'success');
            updateUIForLoggedInUser(data.user);
            
            // Redirect to home
            setTimeout(() => {
                window.location.hash = '#discover';
            }, 1000);
        } else {
            // Registration failed
            showNotification(data.message || '註冊失敗', 'error');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showNotification('發生錯誤，請稍後再試', 'error');
    });
}

/**
 * Handle logout
 */
function handleLogout() {
    fetch('/api/logout.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification('已成功登出', 'success');
                updateUIForGuest();
                
                // Redirect to home
                window.location.hash = '#';
            } else {
                showNotification('登出失敗', 'error');
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            showNotification('發生錯誤，請稍後再試', 'error');
        });
}

/**
 * Handle search form submission
 */
function handleSearch(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Build query string from form data
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }
    
    // Redirect to search results page with query parameters
    window.location.href = `search-results.html?${params.toString()}`;
}

/**
 * Load popular restaurants
 */
function loadPopularRestaurants() {
    fetch('/api/popular_restaurants.php?type=top_rated&limit=6')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayPopularRestaurants(data.restaurants);
            } else {
                console.error('Error loading popular restaurants:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching popular restaurants:', error);
        });
}

/**
 * Display popular restaurants in the UI
 */
function displayPopularRestaurants(restaurants) {
    const container = document.querySelector('#popular .popular-grid');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // If no restaurants, show message
    if (!restaurants || restaurants.length === 0) {
        container.innerHTML = '<p class="no-results">目前沒有熱門餐廳</p>';
        return;
    }
    
    // Add restaurants to the grid
    restaurants.forEach(restaurant => {
        const restaurantEl = document.createElement('div');
        restaurantEl.className = 'restaurant-card';
        
        // Calculate average rating display
        const rating = parseFloat(restaurant.average_rating) || 0;
        const stars = generateStarRating(rating);
        
        // Create categories badges
        const categoryBadges = restaurant.categories.map(cat => 
            `<span class="category-badge">${cat}</span>`
        ).join('');
        
        restaurantEl.innerHTML = `
            <div class="restaurant-image">
                <img src="${restaurant.cover_image || 'images/restaurants/default.jpg'}" alt="${restaurant.name}">
            </div>
            <div class="restaurant-details">
                <h3>${restaurant.name}</h3>
                <div class="restaurant-meta">
                    <div class="restaurant-location">${restaurant.district}, ${restaurant.city}</div>
                    <div class="restaurant-rating">${stars} <span class="review-count">(${restaurant.review_count})</span></div>
                </div>
                <div class="restaurant-tags">
                    ${categoryBadges}
                </div>
            </div>
            <a href="restaurant.html?id=${restaurant.id}" class="restaurant-link"></a>
        `;
        
        container.appendChild(restaurantEl);
    });
}

/**
 * Generate HTML for star rating display
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

/**
 * Load recent articles
 */
function loadRecentArticles() {
    fetch('/api/get_articles.php?per_page=4')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayRecentArticles(data.articles);
            } else {
                console.error('Error loading articles:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching articles:', error);
        });
}

/**
 * Display recent articles in the UI
 */
function displayRecentArticles(articles) {
    const container = document.querySelector('#articles .articles-grid');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // If no articles, show message
    if (!articles || articles.length === 0) {
        container.innerHTML = '<p class="no-results">目前沒有文章</p>';
        return;
    }
    
    // Add articles to the grid
    articles.forEach(article => {
        const articleEl = document.createElement('div');
        articleEl.className = 'article-card';
        
        articleEl.innerHTML = `
            <div class="article-image">
                <img src="${article.cover_image || 'images/articles/default.jpg'}" alt="${article.title}">
            </div>
            <div class="article-details">
                <h3>${article.title}</h3>
                <div class="article-meta">
                    <span class="article-author">By ${article.author_name}</span>
                    <span class="article-date">${article.published_at}</span>
                </div>
                <p class="article-excerpt">${article.excerpt}</p>
            </div>
            <a href="article.html?id=${article.id}" class="article-link">閱讀更多</a>
        `;
        
        container.appendChild(articleEl);
    });
}

/**
 * Display notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, 3000);
}

/**
 * Load user favorites
 */
function loadUserFavorites(userId) {
    fetch(`/api/user_favorites.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayUserFavorites(data.favorites);
            } else {
                console.error('Error loading favorites:', data.message);
                showNotification('無法載入收藏', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching favorites:', error);
            showNotification('發生錯誤，請稍後再試', 'error');
        });
}

/**
 * Display user favorites in profile section
 */
function displayUserFavorites(favorites) {
    const profileSection = document.getElementById('login');
    if (!profileSection) return;
    
    // Create favorites container
    const favoritesContainer = document.createElement('div');
    favoritesContainer.className = 'user-favorites';
    favoritesContainer.innerHTML = '<h3>我的收藏</h3>';
    
    // If no favorites, show message
    if (!favorites || favorites.length === 0) {
        favoritesContainer.innerHTML += '<p class="no-results">您尚未收藏任何餐廳</p>';
    } else {
        // Create list of favorites
        const favoritesList = document.createElement('div');
        favoritesList.className = 'favorites-list';
        
        // Add favorites to list
        favorites.forEach(favorite => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';
            favoriteItem.innerHTML = `
                <div class="favorite-image">
                    <img src="${favorite.cover_image || 'images/restaurants/default.jpg'}" alt="${favorite.name}">
                </div>
                <div class="favorite-details">
                    <h4>${favorite.name}</h4>
                    <div class="favorite-meta">
                        <div class="favorite-location">${favorite.district}, ${favorite.city}</div>
                        <div class="favorite-rating">${generateStarRating(favorite.average_rating)}</div>
                    </div>
                </div>
                <a href="restaurant.html?id=${favorite.id}" class="favorite-link">查看詳情</a>
                <button class="remove-favorite" data-id="${favorite.id}">移除</button>
            `;
            
            favoritesList.appendChild(favoriteItem);
        });
        
        favoritesContainer.appendChild(favoritesList);
    }
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.className = 'button';
    backButton.textContent = '返回資料';
    backButton.addEventListener('click', () => {
        // Remove favorites container
        favoritesContainer.remove();
        
        // Show profile information again
        document.querySelector('.user-profile').style.display = 'block';
    });
    
    favoritesContainer.appendChild(backButton);
    
    // Hide profile information
    document.querySelector('.user-profile').style.display = 'none';
    
    // Add favorites container to profile section
    profileSection.appendChild(favoritesContainer);
    
    // Add event listeners to remove buttons
    const removeButtons = document.querySelectorAll('.remove-favorite');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const restaurantId = this.getAttribute('data-id');
            removeFromFavorites(restaurantId);
        });
    });
}

/**
 * Remove restaurant from favorites
 */
function removeFromFavorites(restaurantId) {
    fetch('/api/toggle_favorite.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurant_id: restaurantId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('已從收藏中移除', 'success');
            
            // Reload favorites
            loadUserFavorites(data.user_id);
        } else {
            showNotification(data.message || '無法移除收藏', 'error');
        }
    })
    .catch(error => {
        console.error('Error removing favorite:', error);
        showNotification('發生錯誤，請稍後再試', 'error');
    });
}

/**
 * Load user reviews
 */
function loadUserReviews(userId) {
    fetch(`/api/user_reviews.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayUserReviews(data.reviews);
            } else {
                console.error('Error loading reviews:', data.message);
                showNotification('無法載入評論', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching reviews:', error);
            showNotification('發生錯誤，請稍後再試', 'error');
        });
}

/**
 * Display user reviews in profile section
 */
function displayUserReviews(reviews) {
    const profileSection = document.getElementById('login');
    if (!profileSection) return;
    
    // Create reviews container
    const reviewsContainer = document.createElement('div');
    reviewsContainer.className = 'user-reviews';
    reviewsContainer.innerHTML = '<h3>我的評論</h3>';
    
    // If no reviews, show message
    if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML += '<p class="no-results">您尚未發表任何評論</p>';
    } else {
        // Create list of reviews
        const reviewsList = document.createElement('div');
        reviewsList.className = 'reviews-list';
        
        // Add reviews to list
        reviews.forEach(review => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `
                <div class="review-header">
                    <h4>${review.restaurant_name}</h4>
                    <div class="review-rating">${generateStarRating(review.rating)}</div>
                    <div class="review-date">${review.created_at}</div>
                </div>
                <div class="review-title">${review.title || '無標題'}</div>
                <div class="review-content">${review.content}</div>
                <div class="review-actions">
                    <a href="restaurant.html?id=${review.restaurant_id}" class="button small">查看餐廳</a>
                    <button class="edit-review button small" data-id="${review.id}">編輯</button>
                    <button class="delete-review button small secondary" data-id="${review.id}">刪除</button>
                </div>
            `;
            
            reviewsList.appendChild(reviewItem);
        });
        
        reviewsContainer.appendChild(reviewsList);
    }
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.className = 'button';
    backButton.textContent = '返回資料';
    backButton.addEventListener('click', () => {
        // Remove reviews container
        reviewsContainer.remove();
        
        // Show profile information again
        document.querySelector('.user-profile').style.display = 'block';
    });
    
    reviewsContainer.appendChild(backButton);
    
    // Hide profile information
    document.querySelector('.user-profile').style.display = 'none';
    
    // Add reviews container to profile section
    profileSection.appendChild(reviewsContainer);
    
    // Add event listeners to edit and delete buttons
    const editButtons = document.querySelectorAll('.edit-review');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            editReview(reviewId);
        });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-review');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            deleteReview(reviewId);
        });
    });
}
