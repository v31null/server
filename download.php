<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/ratelimit.php';
rl_enforce('download', 30);

$id = isset($_GET['id']) ? $_GET['id'] : '';

if (!preg_match('/^[a-f0-9]{8}$/', $id)) {
    http_response_code(404);
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        showErrorPage("File could not be finden", "Given \u{2018}yper\u{2011}link exists not in Our storage , pray ; do turn whence You kame back.");
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
        showErrorPage("File could not be finden", "Given \u{2018}yper\u{2011}link exists not in Our storage , pray ; do turn whence You kame.");
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
    <title>v31nfiles</title>
    <link rel="stylesheet" href="/assets/css/style.css" integrity="sha384-I5BMPe0ktzGjaqQYJ19HI1oB3RSwRyOXnmDe5KskEjfaTpuABzvRv4N5r2VvKswI">
</head>
<body>
    <div class="container">
        <main>
            <div class="encrypted-notice">
                <p class="encrypted-text">Please enter þͤ Paſs‑word.</p>
            </div>

            <div class="form-group">
                <input type="password" id="download-password-input"
                       placeholder="Enter decryption password" autocomplete="off">
            </div>

            <button id="download-btn" class="btn">Akseſs þͤ file</button>

            <div id="download-progress-container" class="progress-container" style="display:none">
                <div class="progress-bar-wrapper">
                    <div id="download-progress-fill" class="progress-fill" style="width:0%"></div>
                </div>
                <p id="download-progress-text" class="progress-text">Requesting þͤ file…</p>
            </div>

            <div id="download-error" class="error-container" style="display:none">
                <p id="download-error-text"></p>
            </div>
        </main>
    </div>

    <script>
        window.V31N_MODE = 'download';
        window.V31N_FILE_ID = '<?php echo htmlspecialchars($id, ENT_QUOTES, 'UTF-8'); ?>';
    </script>
    <script src="../assets/js/crypto.js" integrity="sha384-w9GiC6ltG0puiUuhr/G608/S9HJf5ZfAAxan3zEu36iH4Ceo0wklSd9cfxfP3riU"></script>
    <script src="../assets/js/app.js" integrity="sha384-b4R7uUfxHZLQ5d9Ks2owhTSN33X+h6vO1og3K+EWviEIboeubolabEiYnraVJBen"></script>
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


function showErrorPage($title, $message) {
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>v31nfiles</title>
    <link rel="stylesheet" href="../assets/css/style.css" integrity="sha384-I5BMPe0ktzGjaqQYJ19HI1oB3RSwRyOXnmDe5KskEjfaTpuABzvRv4N5r2VvKswI">
</head>
<body>
    <div class="container">
        <main>
            <div class="encrypted-notice">
                <p class="encrypted-text">Attention !</p>
                <p class="encrypted-subtext"><?php echo htmlspecialchars($title); ?></p>
                <p class="encrypted-subtext"><?php echo htmlspecialchars($message); ?></p>
                <br>
                <a href="/index.php" rel="noopener noreferrer"><p>Shall We ?</p></a>
            </div>
        </main>
    </div>
</body>
</html>
<?php
}
