<?php
// proxy index.php

// Отладка
define('DEBUG', true);

error_reporting(E_ALL & ~E_NOTICE);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.txt');

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

    setJsonLog($response);

    return $response;
}

/*function setJsonLog($data) {

    // Имя файла для логов
    $logFile = CFG_JSON_LOGS;
    
    // Получаем текущие логи из файла
    $currentLogs = file_get_contents($logFile);
    
    // Если файл не пустой, декодируем данные из JSON в массив
    $logs = [];
    if (!empty($currentLogs)) {
        $logs = json_decode($currentLogs, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            if(DEBUG) file_put_contents('proxy_debug.log', "json error: " . $currentLogs . "\n", FILE_APPEND);
            // Если ошибка в декодировании JSON, инициализируем пустой массив
            $logs = [];
        }
    }

    // Добавляем новые данные в массив
    $tempLog = json_decode($data, true);
        if(DEBUG) file_put_contents('proxy_debug.log', "Temp log: " . ($tempLog["result"] != true) . "\n", FILE_APPEND);
        if(isset($tempLog["ok"]) && is_array($tempLog["result"]) && !isset($tempLog["result"]["file_path"])) {
            $logs[] = $tempLog;
        }
    // Если количество логов превышает 100, удаляем старые
    if (count($logs) > 120) {
        $logs = array_slice($logs, 40);
    }

    // Кодируем обновленный массив логов обратно в JSON
    $newLogs = json_encode($logs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    // Записываем обновленные логи обратно в файл
    file_put_contents($logFile, $newLogs);
}*/

function setJsonLog($data) {
    // Имя файла для логов
    $logFile = CFG_JSON_LOGS;
    
    //$data = file_get_contents($data);

    // Открываем файл для чтения и записи
    $fileHandle = fopen($logFile, 'c+'); // 'c+' открывает файл для чтения и записи, создавая его, если он не существует

    if ($fileHandle) {
        // Блокируем файл
        if (flock($fileHandle, LOCK_EX)) {
            // Читаем текущее содержимое файла
            $currentLogs = stream_get_contents($fileHandle);

            // Если файл не пустой, декодируем данные из JSON в массив
            $logs = [];
            if (!empty($currentLogs)) {
                $logs = json_decode($currentLogs, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    // Если ошибка в декодировании JSON, инициализируем пустой массив
                    if(DEBUG) file_put_contents('proxy_debug.log', "Temp log: " . $currentLogs . "\n", FILE_APPEND);
                    throw new Exception('Файл логов поврежден:' . $currentLogs);
                    $logs = [];
                }
            }

            // Если количество логов превышает 100, удаляем старые
            if (count($logs) > 120) {
                $logs = array_slice($logs, 40);
            }

            $tempLog = json_decode($data, true);

            // Проверяем наличие сообщения или результата
            $resultExists = isset($tempLog['result']);
            $okExists = isset($tempLog['ok']);

            // Проверяем, что тип чата не является приватным
            $resultNotBool = !is_bool($tempLog['result']);

            // Проверяем что это не запрос изображения
            $resultNotImage = !isset($tempLog['result']['file_path']);

            // Если условия выполняются, добавляем элемент в массив логов
            if ($resultExists && $okExists && $resultNotBool && $resultNotImage) {
                $logs[] = $tempLog;
            }

            // Кодируем обновленный массив логов обратно в JSON
            $newLogs = json_encode($logs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

            // Очищаем файл и перемещаем указатель в начало файла
            ftruncate($fileHandle, 0);
            rewind($fileHandle);

            // Записываем обновленные логи обратно в файл
            fwrite($fileHandle, $newLogs);

            // Снимаем блокировку и закрываем файл
            flock($fileHandle, LOCK_UN);
        } else {
            // Если не удалось установить блокировку
            throw new Exception('Не удалось установить блокировку на файл.');
        }

        fclose($fileHandle);
    } else {
        // Если не удалось открыть файл
        throw new Exception('Не удалось открыть файл для записи логов.');
    }
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

// Добавляем новую логику для обработки файлов
if (count($uriParts) > 1 && $uriParts[1] === 'file') {
    $file_path = implode('/', array_slice($uriParts, 2));
    $url = 'https://api.telegram.org/file/' . BOT_API_KEY . '/' . $file_path;
    // Отладка запроса
    //if(DEBUG) file_put_contents('proxy_debug.log', "Request URI: " . $url . "\n", FILE_APPEND);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);

    // Получение данных
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpCode >= 400) {
        header("HTTP/1.1 $httpCode Error");
    }

    // Передача Content-Type из ответа
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    header("Content-Type: $contentType");

    curl_close($ch);

    echo $response;

    //return $response;
}

// Основная логика обработки остальных запросов
if (count($uriParts) > 1 && $uriParts[0] === 'proxy' && $uriParts[1] !== 'file') {
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
        if (!headers_sent()) header("HTTP/1.1 405 Method Not Allowed");
        $response = json_encode(['error' => 'Method Not Allowed']);
    }
} else {
    if (!headers_sent()) header("HTTP/1.1 404 Not Found");
    $response = json_encode(['error' => 'Not Found']);
}

// Выводим ответ
if (!headers_sent()) header('Content-Type: application/json');
echo $response;
