<?php
/**
 * Popular Restaurants API
 * 美食天地 - Food Paradise Website
 */

// Include database configuration
require_once '../config/db_config.php';

// Set header for JSON response
header('Content-Type: application/json');

// Process GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Get parameters
$type = isset($_GET['type']) ? trim($_GET['type']) : 'top_rated';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 6;

// Validate parameters
if ($limit < 1 || $limit > 20) $limit = 6;
if (!in_array($type, ['top_rated', 'most_reviewed', 'new_additions'])) {
    $type = 'top_rated';
}

// Connect to database
$conn = getDbConnection();
if (!$conn) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫連接失敗']);
    exit;
}

try {
    $query = "";
    
    // Different queries based on type
    switch ($type) {
        case 'top_rated':
            $query = "SELECT r.id, r.name, r.description, r.address, r.city, r.district, 
                    r.phone, r.price_range, r.cover_image, 
                    AVG(rv.rating) as average_rating, 
                    COUNT(DISTINCT rv.id) as review_count,
                    GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categories
                    FROM restaurants r
                    LEFT JOIN reviews rv ON r.id = rv.restaurant_id
                    LEFT JOIN restaurant_categories rc ON r.id = rc.restaurant_id
                    LEFT JOIN categories c ON rc.category_id = c.id
                    GROUP BY r.id
                    HAVING review_count >= 3
                    ORDER BY average_rating DESC, review_count DESC
                    LIMIT ?";
            break;
            
        case 'most_reviewed':
            $query = "SELECT r.id, r.name, r.description, r.address, r.city, r.district, 
                    r.phone, r.price_range, r.cover_image, 
                    AVG(rv.rating) as average_rating, 
                    COUNT(DISTINCT rv.id) as review_count,
                    GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categories
                    FROM restaurants r
                    LEFT JOIN reviews rv ON r.id = rv.restaurant_id
                    LEFT JOIN restaurant_categories rc ON r.id = rc.restaurant_id
                    LEFT JOIN categories c ON rc.category_id = c.id
                    GROUP BY r.id
                    ORDER BY review_count DESC, average_rating DESC
                    LIMIT ?";
            break;
            
        case 'new_additions':
            $query = "SELECT r.id, r.name, r.description, r.address, r.city, r.district, 
                    r.phone, r.price_range, r.cover_image, 
                    AVG(rv.rating) as average_rating, 
                    COUNT(DISTINCT rv.id) as review_count,
                    GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categories
                    FROM restaurants r
                    LEFT JOIN reviews rv ON r.id = rv.restaurant_id
                    LEFT JOIN restaurant_categories rc ON r.id = rc.restaurant_id
                    LEFT JOIN categories c ON rc.category_id = c.id
                    GROUP BY r.id
                    ORDER BY r.created_at DESC, average_rating DESC
                    LIMIT ?";
            break;
    }
    
    // Execute query
    $stmt = $conn->prepare($query);
    $stmt->execute([$limit]);
    $restaurants = $stmt->fetchAll();
    
    // Process results
    $results = [];
    foreach ($restaurants as $restaurant) {
        // Get first photo if cover_image is not set
        if (empty($restaurant['cover_image']) || $restaurant['cover_image'] == 'default_restaurant.jpg') {
            $photoStmt = $conn->prepare("SELECT filename FROM photos WHERE restaurant_id = ? AND is_primary = 1 LIMIT 1");
            $photoStmt->execute([$restaurant['id']]);
            $photo = $photoStmt->fetch();
            if ($photo) {
                $restaurant['cover_image'] = $photo['filename'];
            }
        }
        
        // Format categories as array
        $restaurant['categories'] = !empty($restaurant['categories']) ? explode(', ', $restaurant['categories']) : [];
        
        // Format rating
        $restaurant['average_rating'] = $restaurant['average_rating'] ? round($restaurant['average_rating'], 1) : 0;
        
        $results[] = $restaurant;
    }
    
    // Return response
    echo json_encode([
        'status' => 'success',
        'type' => $type,
        'restaurants' => $results
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫錯誤：' . $e->getMessage()]);
}
