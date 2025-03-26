<?php
/**
 * Registration API
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
if (empty($postData['name']) || empty($postData['email']) || empty($postData['password']) || empty($postData['confirm-password'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => '請填寫所有必填欄位']);
    exit;
}

$username = trim($postData['name']);
$email = trim($postData['email']);
$password = $postData['password'];
$confirmPassword = $postData['confirm-password'];
$phone = isset($postData['phone']) ? trim($postData['phone']) : null;

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => '請輸入有效的電子郵件']);
    exit;
}

// Validate password
if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => '兩次輸入的密碼不一致']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => '密碼長度必須至少為8個字符']);
    exit;
}

// Connect to database
$conn = getDbConnection();
if (!$conn) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫連接失敗']);
    exit;
}

try {
    // Check if email already exists
    $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $count = $stmt->fetchColumn();
    
    if ($count > 0) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => '此電子郵件已被註冊']);
        exit;
    }
    
    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')");
    $stmt->execute([$username, $email, $hashedPassword, $phone]);
    
    $userId = $conn->lastInsertId();
    
    // Start session
    session_start();
    
    // Set session variables
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['email'] = $email;
    $_SESSION['role'] = 'user';
    $_SESSION['avatar'] = 'default_avatar.jpg';
    
    // Return success response
    echo json_encode([
        'status' => 'success', 
        'message' => '註冊成功', 
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'role' => 'user',
            'avatar' => 'default_avatar.jpg'
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '資料庫錯誤：' . $e->getMessage()]);
}
