<?php
/**
 * Login API
 * 美食天地 - Food Paradise Website
 */

// Include database configuration
require_once '../config/db_config.php';

// Set header for JSON response
header('Content-Type: application/json');

// Process only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);
if (!$postData) {
    $postData = $_POST;
}

// Validate input
if (empty($postData['email']) || empty($postData['password'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => '請填寫電子郵件和密碼']);
    exit;
}

$email = trim($postData['email']);
$password = $postData['password'];
$remember = isset($postData['remember']) ? (bool)$postData['remember'] : false;

// Connect to database
$conn = getDbConnection();
if (!$conn) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫連接失敗']);
    exit;
}

try {
    // Check if user exists
    $stmt = $conn->prepare("SELECT id, username, email, password, role, avatar FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => '電子郵件或密碼錯誤']);
        exit;
    }
    
    // Start session
    session_start();
    
    // Set session variables
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['avatar'] = $user['avatar'];
    
    // Set cookie if remember me is checked
    if ($remember) {
        $token = bin2hex(random_bytes(32));
        
        // Store token in database
        $stmt = $conn->prepare("UPDATE users SET remember_token = ? WHERE id = ?");
        $stmt->execute([$token, $user['id']]);
        
        // Set cookie for 30 days
        setcookie('remember_token', $token, time() + 60 * 60 * 24 * 30, '/', '', false, true);
    }
    
    // Return success response
    echo json_encode([
        'status' => 'success', 
        'message' => '登入成功', 
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'avatar' => $user['avatar']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫錯誤：' . $e->getMessage()]);
}
