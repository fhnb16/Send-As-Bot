<?php
session_start();

// Заранее определенные пользователи (должны быть в более безопасном месте, например в базе данных)
require_once('users.php');

// Обработка формы
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $hashedPassword = md5($password);

    // Проверка данных
    if (isset($validUsers[$username]) && $validUsers[$username] === $hashedPassword) {
        $_SESSION['loggedin'] = true;
        $_SESSION['username'] = $username;

        // Установка куки для дополнительной проверки (по желанию)
        setcookie('user', $username, time() + (86400 * 30), "/"); // 30 дней

        // Переадресация на основную страницу
        header('Location: index.html');
        exit();
    } else {
        $loginError = 'Invalid username or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <!-- Tailwind CSS CDN -->
    <link href="https://dev.fhnb.ru/assets/view/tailwind.css/2.2.19/f/tailwind.min.css" rel="stylesheet">
    <style>
        /* Custom styles for dark theme */
        body {
            color: #eaeaea; /* Light gray text */
            background-color: #1a1a1a; /* Dark gray background */
        }
        .tg-background {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background: rgb(219, 221, 187);
        background: linear-gradient(115deg, rgb(28 112 167) 0%, rgb(66 124 185) 34%, rgb(52 193 205) 70%, rgb(4 21 51) 100%);
        /* Градиент */
        mask-image: url('img/pattern.svg');
        opacity: .32;
        /* SVG-маска */
        mask-size: auto;
        mask-repeat: repeat;
        mask-position: center;
        /* Для кроссбраузерной поддержки */
        -webkit-mask-image: url('img/pattern.svg');
        -webkit-mask-size: auto;
        -webkit-mask-repeat: repeat;
        -webkit-mask-position: center;
        pointer-events: none;
    }
    .login__container {
        backdrop-filter: blur(6px);
    }
    </style>
</head>
<body class="dark-background flex items-center justify-center min-h-screen">
    <div class="login__container bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 class="text-2xl mb-4">Login</h1>
        <form action="login.php" method="post">
            <div class="mb-4">
                <label for="username" class="block text-sm">Username:</label>
                <input type="text" id="username" name="username" class="w-full p-2 rounded-md border border-gray-700 bg-gray-900 text-gray-100" required>
            </div>
            <div class="mb-4">
                <label for="password" class="block text-sm">Password:</label>
                <input type="password" id="password" name="password" class="w-full p-2 rounded-md border border-gray-700 bg-gray-900 text-gray-100" required>
            </div>
            <button type="submit" class="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">Login</button>
        </form>
        <?php if (isset($loginError)) { ?>
            <p class="mt-4 text-red-500"><?php echo $loginError; ?></p>
        <?php } ?>
    </div>
    <canvas class="tg-background"></canvas>
</body>
</html>
