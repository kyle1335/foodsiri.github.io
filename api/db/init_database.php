<?php
/**
 * Database Initialization Script
 * 美食天地 - Food Paradise Website
 */

// Include database configuration
require_once '../../config/db_config.php';

// Create tables if they don't exist
function initDatabase() {
    $conn = getDbConnection();
    
    if (!$conn) {
        die("Database connection failed. Please check your configuration.");
    }
    
    try {
        // Users table
        $conn->exec("CREATE TABLE IF NOT EXISTS `users` (
            `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL,
            `email` VARCHAR(100) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `phone` VARCHAR(20),
            `avatar` VARCHAR(255) DEFAULT 'default_avatar.jpg',
            `role` ENUM('user', 'admin', 'restaurant_owner') DEFAULT 'user',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Restaurants table
        $conn->exec("CREATE TABLE IF NOT EXISTS `restaurants` (
            `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `description` TEXT,
            `address` VARCHAR(255) NOT NULL,
            `city` VARCHAR(50) NOT NULL,
            `district` VARCHAR(50) NOT NULL,
            `phone` VARCHAR(20),
            `website` VARCHAR(255),
            `opening_hours` TEXT,
            `price_range` ENUM('$', '$$', '$$$', '$$$$') DEFAULT '$$',
            `latitude` DECIMAL(10, 8),
            `longitude` DECIMAL(11, 8),
            `cover_image` VARCHAR(255) DEFAULT 'default_restaurant.jpg',
            `owner_id` INT(11) UNSIGNED,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Categories table
        $conn->exec("CREATE TABLE IF NOT EXISTS `categories` (
            `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(50) NOT NULL,
            `name_en` VARCHAR(50) NOT NULL,
            `icon` VARCHAR(50),
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Restaurant-Category relationship
        $conn->exec("CREATE TABLE IF NOT EXISTS `restaurant_categories` (
            `restaurant_id` INT(11) UNSIGNED,
            `category_id` INT(11) UNSIGNED,
            PRIMARY KEY (`restaurant_id`, `category_id`),
            FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Photos table
        $conn->exec("CREATE TABLE IF NOT EXISTS `photos` (
            `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `restaurant_id` INT(11) UNSIGNED NOT NULL,
            `user_id` INT(11) UNSIGNED,
            `filename` VARCHAR(255) NOT NULL,
            `caption` TEXT,
            `is_primary` TINYINT(1) DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Reviews table
        $conn->exec("CREATE TABLE IF NOT EXISTS `reviews` (
            `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `restaurant_id` INT(11) UNSIGNED NOT NULL,
            `user_id` INT(11) UNSIGNED NOT NULL,
            `rating` DECIMAL(2, 1) NOT NULL,
            `title` VARCHAR(100),
            `content` TEXT,
            `visit_date` DATE,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Articles table
        $conn->exec("CREATE TABLE IF NOT EXISTS `articles` (
            `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `content` TEXT NOT NULL,
            `excerpt` VARCHAR(255),
            `cover_image` VARCHAR(255) DEFAULT 'default_article.jpg',
            `author_id` INT(11) UNSIGNED,
            `published_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `status` ENUM('draft', 'published', 'archived') DEFAULT 'published',
            FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Article-Restaurant relationship
        $conn->exec("CREATE TABLE IF NOT EXISTS `article_restaurants` (
            `article_id` INT(11) UNSIGNED,
            `restaurant_id` INT(11) UNSIGNED,
            PRIMARY KEY (`article_id`, `restaurant_id`),
            FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Favorites table
        $conn->exec("CREATE TABLE IF NOT EXISTS `favorites` (
            `user_id` INT(11) UNSIGNED,
            `restaurant_id` INT(11) UNSIGNED,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`user_id`, `restaurant_id`),
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        // Insert default categories
        insertDefaultCategories($conn);
        
        echo "Database initialization completed successfully!";
        return true;
    } catch (PDOException $e) {
        echo "Database Error: " . $e->getMessage();
        return false;
    }
}

// Insert default categories
function insertDefaultCategories($conn) {
    $categories = [
        ['日式料理', 'Japanese', 'fa-bowl-rice'],
        ['中式料理', 'Chinese', 'fa-pepper-hot'],
        ['鍋類', 'Hot Pot', 'fa-fire'],
        ['甜點類', 'Dessert', 'fa-ice-cream'],
        ['早午餐', 'Brunch', 'fa-mug-hot'],
        ['韓式', 'Korean', 'fa-utensils'],
        ['義式料理', 'Italian', 'fa-pizza-slice'],
        ['餐酒館/酒吧', 'Bar', 'fa-wine-glass'],
        ['居酒屋', 'Izakaya', 'fa-beer-mug-empty'],
        ['精緻高級', 'Fine Dining', 'fa-champagne-glasses'],
        ['素食', 'Vegetarian', 'fa-seedling'],
        ['小吃', 'Street Food', 'fa-burger']
    ];
    
    // Check if categories already exist
    $stmt = $conn->query("SELECT COUNT(*) FROM `categories`");
    $count = $stmt->fetchColumn();
    
    if ($count == 0) {
        $stmt = $conn->prepare("INSERT INTO `categories` (`name`, `name_en`, `icon`) VALUES (?, ?, ?)");
        
        foreach ($categories as $category) {
            $stmt->execute($category);
        }
        
        echo "Default categories inserted successfully!";
    }
}

// Run the initialization
initDatabase();
