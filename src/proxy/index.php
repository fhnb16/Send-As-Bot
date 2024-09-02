<?php
// proxy index.php

// Отладка
define('DEBUG', false);

require_once('apiKey.php');

// Базовый URL API Telegram
define('TELEGRAM_API_URL', 'https://api.telegram.org/' . BOT_API_KEY . '/');

// Отладка запроса
if(DEBUG) file_put_contents('proxy_debug.log', "Request URI: " . $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);

// Функция для выполнения запроса к Telegram API
function forwardRequest($requestUri, $requestMethod, $postData = null) {
    $url = TELEGRAM_API_URL . $requestUri;

    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $requestMethod);
    if(DEBUG) file_put_contents('proxy_debug.log', "Forward URI: " . $url . "\n", FILE_APPEND);

    if ($requestMethod === 'POST') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode >= 400) {
        header("HTTP/1.1 $httpCode Error");
    }

    curl_close($ch);

    return $response;
}

// Обработка GET и POST запросов
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Извлечение мнимой директории и строки запроса
$parsedUrl = parse_url($requestUri);
$path = isset($parsedUrl['path']) ? $parsedUrl['path'] : '';
$queryString = isset($parsedUrl['query']) ? $parsedUrl['query'] : '';

// Преобразование пути из вида /proxy/endpoint в endpoint
$uriParts = explode('/', trim($path, '/'));
if (count($uriParts) > 1 && $uriParts[0] === 'proxy') {
    $endpoint = implode('/', array_slice($uriParts, 1)); // Получаем endpoint, например, sendMessage
    $fullUri = $endpoint;

    // Обработка GET и POST запросов
    if ($requestMethod === 'GET') {
        $response = forwardRequest($fullUri . '?' . $queryString, 'GET');
    } elseif ($requestMethod === 'POST') {
        // Для обработки multipart/form-data
        if (isset($_FILES) && count($_FILES) > 0) {
            // Создаем объект FormData с файлами
            $postData = [];
            foreach ($_POST as $key => $value) {
                $postData[$key] = $value;
            }

            foreach ($_FILES as $key => $file) {
                $postData[$key] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
            }
        } else {
            // Получаем "сырые" данные POST-запроса
            $postData = file_get_contents('php://input');
        }

        $response = forwardRequest($fullUri . '?' . $queryString, 'POST', $postData);
    } else {
        header("HTTP/1.1 405 Method Not Allowed");
        $response = json_encode(['error' => 'Method Not Allowed']);
    }
} else {
    header("HTTP/1.1 404 Not Found");
    $response = json_encode(['error' => 'Not Found']);
}


// Выводим ответ
header('Content-Type: application/json');
echo $response;