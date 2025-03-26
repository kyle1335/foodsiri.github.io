<?php
/**
 * Restaurant Search API
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

// Get search parameters
$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$location = isset($_GET['location']) ? trim($_GET['location']) : '';
$category = isset($_GET['category']) ? intval($_GET['category']) : 0;
$openNow = isset($_GET['open_now']) ? (bool)$_GET['open_now'] : false;
$delivery = isset($_GET['delivery']) ? (bool)$_GET['delivery'] : false;
$reservation = isset($_GET['reservation']) ? (bool)$_GET['reservation'] : false;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$perPage = isset($_GET['per_page']) ? intval($_GET['per_page']) : 10;

// Validate page parameters
if ($page < 1) $page = 1;
if ($perPage < 1 || $perPage > 50) $perPage = 10;

// Calculate offset
$offset = ($page - 1) * $perPage;

// Connect to database
$conn = getDbConnection();
if (!$conn) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫連接失敗']);
    exit;
}

try {
    // Build the query
    $query = "SELECT r.id, r.name, r.description, r.address, r.city, r.district, 
              r.phone, r.price_range, r.cover_image, 
              AVG(rv.rating) as average_rating, 
              COUNT(DISTINCT rv.id) as review_count,
              GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categories
              FROM restaurants r
              LEFT JOIN reviews rv ON r.id = rv.restaurant_id
              LEFT JOIN restaurant_categories rc ON r.id = rc.restaurant_id
              LEFT JOIN categories c ON rc.category_id = c.id
              WHERE 1=1";
    
    $params = [];
    
    // Add search conditions
    if (!empty($keyword)) {
        $query .= " AND (r.name LIKE ? OR r.description LIKE ?)";
        $params[] = "%{$keyword}%";
        $params[] = "%{$keyword}%";
    }
    
    if (!empty($location)) {
        $query .= " AND (r.city LIKE ? OR r.district LIKE ? OR r.address LIKE ?)";
        $params[] = "%{$location}%";
        $params[] = "%{$location}%";
        $params[] = "%{$location}%";
    }
    
    if ($category > 0) {
        $query .= " AND rc.category_id = ?";
        $params[] = $category;
    }
    
    // Additional filters would require extra fields in the database
    // For demonstration purposes, we'll comment these out
    /*
    if ($openNow) {
        // Would need opening_hours data and logic to check if currently open
    }
    
    if ($delivery) {
        $query .= " AND r.offers_delivery = 1";
    }
    
    if ($reservation) {
        $query .= " AND r.accepts_reservations = 1";
    }
    */
    
    // Group by restaurant to handle multiple categories/reviews
    $query .= " GROUP BY r.id";
    
    // Total count query (for pagination)
    $countQuery = "SELECT COUNT(DISTINCT r.id) FROM restaurants r
                  LEFT JOIN restaurant_categories rc ON r.id = rc.restaurant_id
                  WHERE 1=1";
    
    // Apply the same conditions to count query
    if (!empty($keyword)) {
        $countQuery .= " AND (r.name LIKE ? OR r.description LIKE ?)";
    }
    
    if (!empty($location)) {
        $countQuery .= " AND (r.city LIKE ? OR r.district LIKE ? OR r.address LIKE ?)";
    }
    
    if ($category > 0) {
        $countQuery .= " AND rc.category_id = ?";
    }
    
    // Order by rating (highest first)
    $query .= " ORDER BY average_rating DESC, review_count DESC";
    
    // Add pagination
    $query .= " LIMIT ? OFFSET ?";
    $params[] = $perPage;
    $params[] = $offset;
    
    // Execute count query
    $stmt = $conn->prepare($countQuery);
    $countParams = array_slice($params, 0, count($params) - 2); // Remove pagination params
    $stmt->execute($countParams);
    $totalResults = $stmt->fetchColumn();
    
    // Calculate total pages
    $totalPages = ceil($totalResults / $perPage);
    
    // Execute main query
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
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
        'total_results' => $totalResults,
        'total_pages' => $totalPages,
        'current_page' => $page,
        'per_page' => $perPage,
        'restaurants' => $results
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫錯誤：' . $e->getMessage()]);
}
