/**
 * Google Maps Integration for Food Paradise Website
 * 美食天地 - 整合 Google Maps Places API
 */

// 全局變量
let map;
let placesService;
let markers = [];
let infoWindow;
let mapInitialized = false; // 追蹤地圖是否已初始化

// 當文檔加載完成時初始化事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    // 為搜索表單添加事件監聽器
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
    
    // 如果 Google Maps API 早於此腳本載入，則直接初始化地圖
    if (typeof google !== 'undefined' && google.maps) {
        initializeMap();
    }
    
    // 打印 API Key 到控制台檢查是否正確
    console.log('Maps config loaded with API Key:', GOOGLE_MAPS_API_KEY);
});

// Google Maps API 回調函數 - 從 API 腳本載入後調用
function initMapFromCallback() {
    console.log('Google Maps API loaded successfully');
    initializeMap();
}

// 初始化地圖和相關服務
function initializeMap() {
    if (mapInitialized) return; // 防止重複初始化
    
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        try {
            initMap(mapContainer);
            mapInitialized = true;
        } catch (error) {
            console.error('Failed to initialize map:', error);
            mapContainer.innerHTML = '<div style="text-align: center; padding: 50px 20px;"><h3 style="color:#f44336;">地圖初始化失敗</h3><p>錯誤詳情：' + error.message + '</p></div>';
        }
    }
}

// 初始化 Google Maps
function initMap(container) {
    // 使用配置文件中的設定
    const defaultCenter = MAPS_CONFIG.defaultCenter || { lat: 25.033, lng: 121.565 };
    const defaultZoom = MAPS_CONFIG.defaultZoom || 14;
    
    // 創建地圖
    map = new google.maps.Map(container, {
        center: defaultCenter,
        zoom: defaultZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: MAPS_CONFIG.mapStyles || []
    });
    
    // 創建信息窗口
    infoWindow = new google.maps.InfoWindow();
    
    // 初始化 Places 服務
    placesService = new google.maps.places.PlacesService(map);
    
    // 顯示加載中提示
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.innerHTML = '<p>地圖已準備好！請輸入關鍵字搜尋餐廳。</p>';
    }
}

// 處理搜索表單提交
function handleSearchSubmit(e) {
    e.preventDefault();
    
    // 獲取搜索參數
    const keyword = document.getElementById('keyword').value;
    const location = document.getElementById('location').value;
    const category = document.getElementById('category').value;
    const openNow = document.getElementById('open_now').checked;
    const delivery = document.getElementById('delivery').checked;
    const reservation = document.getElementById('reservation').checked;
    
    // 組合搜索關鍵字
    let searchKeyword = keyword || '';
    
    // 添加類別到搜索關鍵字
    if (category) {
        const categoryText = document.getElementById('category').options[document.getElementById('category').selectedIndex].text;
        searchKeyword += ' ' + categoryText;
    }
    
    // 添加地點
    let searchLocation = '';
    if (location) {
        searchLocation = document.getElementById('location').options[document.getElementById('location').selectedIndex].text;
    }
    
    // 顯示加載中提示
    document.getElementById('search-results').innerHTML = '<p class="loading">正在搜尋餐廳，請稍候...</p>';
    
    // 清除現有標記
    clearMarkers();
    
    // 執行搜索
    searchRestaurants(searchKeyword, searchLocation, openNow);
}

// 搜索餐廳
function searchRestaurants(keyword, location, openNow) {
    // 如果提供了位置，使用地理編碼服務獲取座標
    if (location) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: location + ' 台灣' }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                const locationCoords = results[0].geometry.location;
                map.setCenter(locationCoords);
                performNearbySearch(keyword, locationCoords, openNow);
            } else {
                // 地理編碼失敗，使用文本搜索
                performTextSearch(keyword, openNow);
                console.error('無法確定位置坐標：', status);
            }
        });
    } else {
        // 無位置，使用文本搜索
        performTextSearch(keyword, openNow);
    }
}

// 執行附近搜索
function performNearbySearch(keyword, location, openNow) {
    // 構建請求
    const request = {
        location: location,
        radius: 5000, // 5 公里半徑
        type: ['restaurant', 'cafe', 'food'],
        keyword: keyword
    };
    
    if (openNow) {
        request.openNow = true;
    }
    
    // 執行附近搜索
    placesService.nearbySearch(request, processSearchResults);
}

// 執行文本搜索
function performTextSearch(keyword, openNow) {
    // 構建請求
    const request = {
        query: `${keyword} 餐廳 台灣`,
        type: ['restaurant', 'cafe', 'food']
    };
    
    if (openNow) {
        request.openNow = true;
    }
    
    // 執行文本搜索
    placesService.textSearch(request, processSearchResults);
}

// 處理搜索結果
function processSearchResults(results, status) {
    const resultsContainer = document.getElementById('search-results');
    
    // 清空結果容器
    resultsContainer.innerHTML = '';
    
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        // 創建結果計數
        const countElement = document.createElement('div');
        countElement.className = 'result-count';
        countElement.innerHTML = `<p>找到 ${results.length} 個結果</p>`;
        resultsContainer.appendChild(countElement);
        
        // 創建結果列表
        const resultList = document.createElement('div');
        resultList.className = 'result-list';
        
        // 迭代處理結果
        results.forEach((place, index) => {
            // 添加標記到地圖
            addMarker(place);
            
            // 創建結果項目
            const resultItem = createResultItem(place, index);
            resultList.appendChild(resultItem);
        });
        
        // 將結果列表添加到容器
        resultsContainer.appendChild(resultList);
        
        // 如果沒有搜索數據，調整地圖視圖
        if (markers.length > 0) {
            adjustMapToMarkers();
        }
    } else {
        // 顯示無結果信息
        resultsContainer.innerHTML = '<p>未找到符合條件的餐廳。請嘗試不同的關鍵字或地區。</p>';
    }
}

// 添加標記到地圖
function addMarker(place) {
    // 創建標記
    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
        animation: google.maps.Animation.DROP
    });
    
    // 添加點擊事件監聽器
    marker.addListener('click', function() {
        // 獲取餐廳詳細信息
        getPlaceDetails(place.place_id, marker);
    });
    
    // 將標記添加到標記數組
    markers.push(marker);
}

// 獲取餐廳詳細信息
function getPlaceDetails(placeId, marker) {
    const request = {
        placeId: placeId,
        fields: [
            'name', 'rating', 'formatted_address', 'formatted_phone_number', 
            'website', 'opening_hours', 'photos', 'price_level', 'reviews',
            'user_ratings_total'
        ]
    };
    
    placesService.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // 顯示詳細信息窗口
            showInfoWindow(place, marker);
        }
    });
}

// 顯示信息窗口
function showInfoWindow(place, marker) {
    // 創建評分星級
    const starsHtml = getStarsHtml(place.rating || 0);
    
    // 獲取照片 URL (如果存在)
    let photoHtml = '';
    if (place.photos && place.photos.length > 0) {
        const photoUrl = place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
        photoHtml = `<div class="place-photo"><img src="${photoUrl}" alt="${place.name}"></div>`;
    }
    
    // 創建營業時間 HTML
    let hoursHtml = '';
    if (place.opening_hours) {
        hoursHtml = '<div class="hours"><strong>營業時間:</strong><br>';
        if (place.opening_hours.isOpen()) {
            hoursHtml += '<span class="open-now">目前營業中</span><br>';
        } else {
            hoursHtml += '<span class="closed-now">目前休息中</span><br>';
        }
        
        if (place.opening_hours.weekday_text) {
            hoursHtml += '<div class="weekday-hours">';
            place.opening_hours.weekday_text.forEach(day => {
                hoursHtml += `<div>${day}</div>`;
            });
            hoursHtml += '</div>';
        }
        hoursHtml += '</div>';
    }
    
    // 創建電話和網站 HTML
    let contactHtml = '';
    if (place.formatted_phone_number) {
        contactHtml += `<div><strong>電話:</strong> <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a></div>`;
    }
    if (place.website) {
        contactHtml += `<div><strong>網站:</strong> <a href="${place.website}" target="_blank">前往網站</a></div>`;
    }
    
    // 創建價格級別
    let priceHtml = '';
    if (place.price_level) {
        priceHtml = '<div class="price-level"><strong>價格:</strong> ';
        for (let i = 0; i < place.price_level; i++) {
            priceHtml += '$';
        }
        priceHtml += '</div>';
    }
    
    // 創建評論計數
    let reviewCountHtml = '';
    if (place.user_ratings_total) {
        reviewCountHtml = `<span class="review-count">(${place.user_ratings_total} 則評論)</span>`;
    }
    
    // 構建信息窗口內容
    const content = `
        <div class="info-window">
            <h3>${place.name}</h3>
            ${photoHtml}
            <div class="rating-container">
                ${starsHtml} ${reviewCountHtml}
            </div>
            ${priceHtml}
            <div class="address"><strong>地址:</strong> ${place.formatted_address}</div>
            ${contactHtml}
            ${hoursHtml}
            <div class="actions">
                <button class="action-button favorite" onclick="addToFavorites('${place.place_id}')">
                    <i class="fas fa-heart"></i> 加入最愛
                </button>
                <button class="action-button share" onclick="sharePlace('${place.place_id}', '${place.name}')">
                    <i class="fas fa-share-alt"></i> 分享
                </button>
            </div>
        </div>
    `;
    
    // 打開信息窗口
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// 創建餐廳項目
function createResultItem(place, index) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.setAttribute('data-place-id', place.place_id);
    
    // 獲取評分星級
    const starsHtml = getStarsHtml(place.rating || 0);
    
    // 獲取照片 URL (如果存在)
    let photoHtml = '';
    if (place.photos && place.photos.length > 0) {
        const photoUrl = place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 });
        photoHtml = `<div class="result-photo"><img src="${photoUrl}" alt="${place.name}"></div>`;
    }
    
    // 創建價格級別
    let priceHtml = '';
    if (place.price_level) {
        priceHtml = '<span class="price-level">';
        for (let i = 0; i < place.price_level; i++) {
            priceHtml += '$';
        }
        priceHtml += '</span>';
    }
    
    // 構建結果項目內容
    resultItem.innerHTML = `
        ${photoHtml}
        <div class="result-info">
            <div class="result-name">${index + 1}. ${place.name} ${priceHtml}</div>
            <div class="result-rating">${starsHtml} ${place.user_ratings_total ? `(${place.user_ratings_total})` : ''}</div>
            <div class="result-address">${place.vicinity || place.formatted_address}</div>
        </div>
    `;
    
    // 添加點擊事件監聽器
    resultItem.addEventListener('click', function() {
        // 找到對應的標記
        const marker = markers.find(m => m.getPosition().equals(place.geometry.location));
        
        if (marker) {
            // 居中到標記
            map.panTo(marker.getPosition());
            
            // 獲取餐廳詳細信息並顯示
            getPlaceDetails(place.place_id, marker);
            
            // 添加高亮樣式到結果項目
            document.querySelectorAll('.result-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
    
    return resultItem;
}

// 獲取星級評分 HTML
function getStarsHtml(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);
    
    let starsHtml = '';
    
    // 全星
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // 半星
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // 空星
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return `<div class="stars" data-rating="${rating}">${starsHtml} <span class="rating-value">${rating.toFixed(1)}</span></div>`;
}

// 調整地圖視圖以包含所有標記
function adjustMapToMarkers() {
    const bounds = new google.maps.LatLngBounds();
    
    // 將所有標記添加到邊界
    markers.forEach(marker => {
        bounds.extend(marker.getPosition());
    });
    
    // 調整地圖以適應邊界
    map.fitBounds(bounds);
    
    // 如果只有一個標記，調整縮放級別
    if (markers.length === 1) {
        map.setZoom(16);
    }
}

// 清除所有標記
function clearMarkers() {
    // 從地圖上刪除所有標記
    markers.forEach(marker => {
        marker.setMap(null);
    });
    
    // 清空標記數組
    markers = [];
    
    // 關閉信息窗口
    infoWindow.close();
}

// 添加到收藏夾
function addToFavorites(placeId) {
    // 檢查用戶是否已登錄
    const isLoggedIn = checkUserLoggedIn();
    
    if (isLoggedIn) {
        // 向服務器發送請求以保存到收藏夾
        fetch('/api/favorites.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                placeId: placeId,
                action: 'add'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('已加入收藏！');
            } else {
                alert('無法加入收藏: ' + data.message);
            }
        })
        .catch(error => {
            console.error('加入收藏時出錯: ', error);
            alert('無法加入收藏，請稍後再試。');
        });
    } else {
        // 提示用戶登錄
        alert('請先登錄以便添加餐廳到收藏夾。');
        window.location.href = '#login';
    }
}

// 檢查用戶是否已登錄
function checkUserLoggedIn() {
    // 這裡應該檢查用戶的登錄狀態
    // 簡單的模擬實現，實際應用中，您需要檢查 cookie、session 或其他身份驗證標記
    const userCookie = getCookie('user_logged_in');
    return userCookie === 'true';
}

// 獲取 cookie 值
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// 分享餐廳信息
function sharePlace(placeId, placeName) {
    // 創建分享 URL
    const shareUrl = window.location.origin + window.location.pathname + `?place=${placeId}`;
    
    // 檢查是否支持網絡分享 API
    if (navigator.share) {
        navigator.share({
            title: `美食天地 - ${placeName}`,
            text: `查看 ${placeName} 的詳細信息`,
            url: shareUrl
        })
        .then(() => console.log('分享成功'))
        .catch((error) => console.log('分享失敗', error));
    } else {
        // 簡單的分享方法 - 複製連結
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = shareUrl;
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('連結已複製！您現在可以將其分享給朋友。');
    }
}
