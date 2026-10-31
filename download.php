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
    <link rel="stylesheet" href="/assets/css/style.css?v=de54bf6c4c689c3f" integrity="sha384-cerGnvhsn1F6KpPo9+mLT2AkP8/3PrfIcKGbhHVXkUDooX7Q4EeIjlRvy/d1dNC6">
</head>
<body>
    <div class="container">
        <main>
            <noscript><div class="error-container"><p><?= $t['nojs'] ?></p></div></noscript>
            <div class="encrypted-notice">
                <p class="encrypted-text"><?= $t['download.prompt'] ?></p>
            </div>

            <div class="form-group pw-field">
                <input type="password" id="download-password-input"
                       placeholder="<?= $t['download.password'] ?>" autocomplete="off">
                <button class="eye-toggle" type="button" data-eye="download-password-input" title="<?= $t['password.show'] ?>" aria-label="<?= $t['password.show'] ?>" data-show="<?= $t['password.show'] ?>" data-hide="<?= $t['password.hide'] ?>"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="eye-off" d="M4 20 20 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
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

            <div id="dir" class="dir" style="display:none">
                <div class="dir-head">
                    <svg class="dir-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z"/></svg>
                    <div id="dir-count" class="dir-count"></div>
                    <span></span>
                </div>
                <hr>
                <table id="dir-table"></table>
                <button id="dir-all" class="btn dir-all" type="button"><?= $t['download.all'] ?></button>
            </div>
        </main>
    </div>

    <script nonce="<?= $nonce ?>">
        window.V31N_MODE = 'download';
        window.V31N_FILE_ID = '<?php echo htmlspecialchars($id, ENT_QUOTES, 'UTF-8'); ?>';
        window.V31N_T = <?= json_encode($t, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
    </script>
    <script src="../assets/js/crypto.js?v=acb501462841c48b" integrity="sha384-uVu1ZL0ck5/f0BfamiT8sMyLQIOfVFCTMsbzhCMaWU4bA7vToijEEm3EsOXZ5Vlv"></script>
    <script src="../assets/js/app.js?v=d89067a2b9dd5146" integrity="sha384-axJABUg0y4eIN3dYu9NaAzLmwiIPpbdKASN0Tn/Jm39RQkJ75Vp7voov72U3XQeC"></script>
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
    <link rel="stylesheet" href="../assets/css/style.css?v=de54bf6c4c689c3f" integrity="sha384-cerGnvhsn1F6KpPo9+mLT2AkP8/3PrfIcKGbhHVXkUDooX7Q4EeIjlRvy/d1dNC6">
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
