<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/ratelimit.php';
rl_enforce('download', 30);

require_once __DIR__ . '/csp.php';
$nonce = v31n_csp();

$t = require __DIR__ . '/lang.php';

$id = isset($_GET['id']) ? $_GET['id'] : '';

if (!preg_match('/^(?:[a-f0-9]{8}|[a-z2-7]{26})\z/', $id)) {
    http_response_code(404);
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        showErrorPage($t, $t['error.notfound.title'], $t['error.notfound.badid']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'No.']);
    }
    exit;
}

$db = getDb();
$mapStmt = $db->prepare('SELECT encrypted_payload, payload_iv, salt FROM maps WHERE file_id = ?');
$mapStmt->execute([$id]);
$mapData = $mapStmt->fetch(PDO::FETCH_ASSOC);

if (!$mapData) {
    http_response_code(404);
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        showErrorPage($t, $t['error.notfound.title'], $t['error.notfound.missing']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'No.']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $t['title'] ?></title>
    <link rel="stylesheet" href="/assets/css/style.css" integrity="sha384-vkUMYVHo2DIftBUDGjFayMhenL4FQwi/pjSOQleqswVLpuBIVIh3JTj9W/kcULzd">
</head>
<body>
    <div class="container">
        <main>
            <div class="encrypted-notice">
                <p class="encrypted-text"><?= $t['download.prompt'] ?></p>
            </div>

            <div class="form-group">
                <input type="password" id="download-password-input"
                       placeholder="<?= $t['download.password'] ?>" autocomplete="off">
            </div>

            <button id="download-btn" class="btn"><?= $t['download.button'] ?></button>

            <div id="download-progress-container" class="progress-container" style="display:none">
                <div class="progress-bar-wrapper">
                    <div id="download-progress-fill" class="progress-fill" style="width:0%"></div>
                </div>
                <p id="download-progress-text" class="progress-text"><?= $t['download.requesting'] ?></p>
            </div>

            <div id="download-error" class="error-container" style="display:none">
                <p id="download-error-text"></p>
            </div>
        </main>
    </div>

    <script nonce="<?= $nonce ?>">
        window.V31N_MODE = 'download';
        window.V31N_FILE_ID = '<?php echo htmlspecialchars($id, ENT_QUOTES, 'UTF-8'); ?>';
        window.V31N_T = <?= json_encode($t, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
    </script>
    <script src="../assets/js/crypto.js" integrity="sha384-l+bGaCZl9Le11KMI1QeeVvCWDWsQ/k6B0G9hzBOillGfYLl9i6zPgn+/Bn1iYo3v"></script>
    <script src="../assets/js/app.js" integrity="sha384-63WeU4N0HB2qX+4zzzLO4R0fkvOmwq5MCkCKM3eU5DLvyrB9uwT9DVTxh0uhvmKJ"></script>
</body>
</html>
<?php
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');

    echo json_encode([
        'encrypted_payload' => $mapData['encrypted_payload'],
        'payload_iv'        => $mapData['payload_iv'],
        'salt'              => $mapData['salt']
    ]);
    exit;
}

http_response_code(405);
header('Content-Type: application/json');
echo json_encode(['error' => 'No.']);
exit;


function showErrorPage($t, $title, $message) {
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $t['title'] ?></title>
    <link rel="stylesheet" href="../assets/css/style.css" integrity="sha384-vkUMYVHo2DIftBUDGjFayMhenL4FQwi/pjSOQleqswVLpuBIVIh3JTj9W/kcULzd">
</head>
<body>
    <div class="container">
        <main>
            <div class="encrypted-notice">
                <p class="encrypted-text"><?= $t['error.attention'] ?></p>
                <p class="encrypted-subtext"><?php echo htmlspecialchars($title); ?></p>
                <p class="encrypted-subtext"><?php echo htmlspecialchars($message); ?></p>
                <br>
                <a href="/index.php" rel="noopener noreferrer"><p><?= $t['error.back'] ?></p></a>
            </div>
        </main>
    </div>
</body>
</html>
<?php
}
