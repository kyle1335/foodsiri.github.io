<?php
/**
 * Articles API
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
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$perPage = isset($_GET['per_page']) ? intval($_GET['per_page']) : 6;

// Validate page parameters
if ($page < 1) $page = 1;
if ($perPage < 1 || $perPage > 20) $perPage = 6;

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
    // If ID is provided, get a single article
    if ($id > 0) {
        $query = "SELECT a.id, a.title, a.content, a.excerpt, a.cover_image, a.published_at,
                u.username as author_name, u.avatar as author_avatar,
                (SELECT GROUP_CONCAT(r.id, ':', r.name SEPARATOR '|')
                 FROM article_restaurants ar 
                 JOIN restaurants r ON ar.restaurant_id = r.id 
                 WHERE ar.article_id = a.id) as related_restaurants
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE a.id = ? AND a.status = 'published'";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $article = $stmt->fetch();
        
        if (!$article) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => '找不到該文章']);
            exit;
        }
        
        // Process related restaurants
        $relatedRestaurants = [];
        if (!empty($article['related_restaurants'])) {
            $restaurantItems = explode('|', $article['related_restaurants']);
            foreach ($restaurantItems as $item) {
                list($restId, $restName) = explode(':', $item);
                $relatedRestaurants[] = [
                    'id' => intval($restId),
                    'name' => $restName
                ];
            }
        }
        $article['related_restaurants'] = $relatedRestaurants;
        
        // Format date
        $article['published_at'] = date('Y-m-d', strtotime($article['published_at']));
        
        // Return response
        echo json_encode([
            'status' => 'success',
            'article' => $article
        ]);
    } 
    // Otherwise, get a list of articles
    else {
        $query = "SELECT a.id, a.title, a.excerpt, a.cover_image, a.published_at,
                u.username as author_name,
                COUNT(DISTINCT ar.restaurant_id) as restaurant_count
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                LEFT JOIN article_restaurants ar ON a.id = ar.article_id
                WHERE a.status = 'published'
                GROUP BY a.id
                ORDER BY a.published_at DESC
                LIMIT ? OFFSET ?";
        
        // Count total results for pagination
        $countQuery = "SELECT COUNT(*) FROM articles WHERE status = 'published'";
        $countStmt = $conn->query($countQuery);
        $totalResults = $countStmt->fetchColumn();
        
        // Calculate total pages
        $totalPages = ceil($totalResults / $perPage);
        
        // Execute main query
        $stmt = $conn->prepare($query);
        $stmt->execute([$perPage, $offset]);
        $articles = $stmt->fetchAll();
        
        // Process articles
        foreach ($articles as &$article) {
            // Format date
            $article['published_at'] = date('Y-m-d', strtotime($article['published_at']));
            
            // Format excerpt
            if (empty($article['excerpt']) && !empty($article['content'])) {
                $article['excerpt'] = substr(strip_tags($article['content']), 0, 150) . '...';
            }
        }
        
        // Return response
        echo json_encode([
            'status' => 'success',
            'total_results' => $totalResults,
            'total_pages' => $totalPages,
            'current_page' => $page,
            'per_page' => $perPage,
            'articles' => $articles
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫錯誤：' . $e->getMessage()]);
}
