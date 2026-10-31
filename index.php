<?php require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__); $t = require __DIR__ . '/lang.php'; require_once __DIR__ . '/csp.php'; $nonce = v31n_csp(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
    <title><?= $t['title'] ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/assets/css/style.css?v=7c4ecc7e193cad7e" integrity="sha384-P7qHbO6s19f6tejEweyYhU4xaEIzn+vTiNMJcqf6FxN1bLMDreqQC5sHOn5GK64P">

		<link rel="stylesheet" href="/assets/css/katex.css?v=042b367bf8d89aef" integrity="sha384-dyEuTchRIWTUUS5esbTCpMfx+B+xfO8EoTt5SiUbKmafuP0Gilzcq4YNJuy9EkCC" />
		<script defer src="/assets/js/katex.min.js?v=fa140498b8cfc830" integrity="sha384-a1WQdjRj162i159OYq041X6I4K8NenkrI09LlPmiHg0YOb7CR+wJOraXwK9abpnE"></script>
		<script defer src="/assets/js/auto-render.js?v=4cfb141d56e2c564" integrity="sha384-n4X0EO8umJELS25kX2SIST9zVstnnEkI8qCfzN4c4+fmWRTNE8fA+MCgssTBDI9g"></script>
		<script defer src="/assets/js/copy-tex.min.js?v=c571c49b520cb8e9" integrity="sha384-Pe2JWbaShhSRT0SESJ9XLPeAsi4yrNi7r/CiH0Coq7giBjK5a6Ae7XcybE8rNlQP"></script>
    <link rel="shortcut icon" href="/assets/img/logomonochrome.ico" type="image/x-icon">
		<script nonce="<?= $nonce ?>">
			window.onload = function () {
				renderMathInElement(document.body, {
					delimiters: [
						{ left: "$$", right: "$$", display: true },
						{ left: "$", right: "$", display: false },
					],
					throwOnError: false,
					trust: true,
					preProcess: function (math) {
						return math.replace(/Ș̈/g, "\\ddot{S}\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/Ț̈/g, "\\ddot{T}\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ș̈/g, "\\ddot{s}\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ț̈/g, "\\ddot{t}\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ș/g, "s\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/Ș/g, "S\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/Ț/g, "T\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ț/g, "t\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/í̈/g, "\\ddot{\\acute{\\imath}}").replace(/Í̈/g, "\\ddot{\\acute{I}}").replace(/í/g, "\\acute{\\imath}").replace(/Í/g, "\\acute{I}").replace(/ï/g, "\\ddot{\\imath}");
					},
				});
			};
		</script>
</head>
<body>
      <img src="/assets/img/Services for þe General populace Ministeria custodiae filaciorum ( Secura ) , aßervatio.2cm.png" alt="" style="height: 2cm;margin: 0.5cm;float:left;z-index: 9999;position: absolute;">
  <div class="container">

    <header class="header">
      <h1>$$\underline{\raisebox{-0.74ex}{V}\kern{-0.15em}31\raisebox{-0.74ex}{\kern{-0.08em}$n$}}$$</h1>
    </header>
    
    <main>
      <noscript><div class="error-container"><p><?= $t['nojs'] ?></p></div></noscript>

      <div id="drop-zone" class="drop-zone">
        <p class="drop-zone-text"><?= $t['upload.drop'] ?></p>
        <input type="file" id="file-input" multiple hidden>
      </div>

      <div id="file-info" class="file-info" style="display:none"></div>

      <div class="form-group pw-field">
        <input type="password" id="password-input" placeholder="<?= $t['upload.password'] ?>" autocomplete="off">
        <button class="eye-toggle" type="button" data-eye="password-input" title="<?= $t['password.show'] ?>" aria-label="<?= $t['password.show'] ?>" data-show="<?= $t['password.show'] ?>" data-hide="<?= $t['password.hide'] ?>"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="eye-off" d="M4 20 20 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>

      <button id="upload-btn" class="btn" disabled><?= $t['upload.button'] ?></button>
      <button id="cancel-btn" class="btn btn-secondary cancel-btn" type="button" style="display:none"><?= $t['upload.cancel'] ?></button>

      <div id="progress-container" class="progress-container" style="display:none">
        <div class="progress-bar-wrapper">
          <div id="progress-fill" class="progress-fill" style="width:0%"></div>
        </div>
        <p id="progress-text" class="progress-text"><?= $t['upload.encrypting'] ?></p>
      </div>

      <div id="result-container" class="result-container" style="display:none; text-align:center;">
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="width: 50%; padding: 10px; border-right: 1px solid #444; vertical-align: top;">
              <div class="result-link-wrapper" style="justify-content: center; margin-bottom: 5px;">
                <span class="result-link-parts">
                  <a id="result-link" class="result-link" href="#" target="_blank"></a>
                </span>
              </div>
              <span id="copy-feedback-secure" class="copy-feedback" style="display:none"><?= $t['upload.copied'] ?></span>
              <div id="result-qr" class="qr"></div>
            </td>
            <td style="width: 50%; padding: 10px; vertical-align: top;">
              <div class="result-link-wrapper" style="justify-content: center; margin-bottom: 5px;">
                <span class="result-link-parts">
                  <a id="result-embed-link" class="result-link" href="#" target="_blank"></a>
                </span>
              </div>
              <span id="copy-feedback-embed" class="copy-feedback" style="display:none"><?= $t['upload.copied'] ?></span>
            </td>
          </tr>
        </table>
      </div>

      <div id="error-container" class="error-container" style="display:none">
        <p id="error-text"></p>
      </div>

    </main>

    <footer>
      <p><a href="/links.txt"><?= $t['footer.links'] ?></a></p>
      <p><a href="https://stats.uptimerobot.com/Y1UqdausP4/803270927" rel="noopener noreferrer"><?= $t['footer.alive'] ?></a></p>
    </footer>

<?php
    $acta = @json_decode(@file_get_contents(__DIR__ . '/indexd.json'), true);
    if (is_array($acta) && count($acta)) :
?>
    <div class="acta-container">
<?php foreach ($acta as $a) :
        $l = isset($a['latin']) ? $a['latin'] : array();
        $sig = isset($a['sig']) ? $a['sig'] : array();
        $header = array('invocatio', 'intitulatio');
        $body = array('arenga', 'promulgatio', 'narratio', 'dispositio', 'additio', 'corroboratio', 'datatio');
?>
      <div class="acta-card">

        <div class="acta-header">
<?php if (!empty($l['invocatio'])) : ?>
          <p class="acta-invocatio"><?php echo htmlspecialchars($l['invocatio'], ENT_QUOTES, 'UTF-8'); ?></p>
<?php endif; ?>
<?php if (!empty($l['intitulatio'])) : ?>
          <p class="acta-intitulatio"><?php echo htmlspecialchars($l['intitulatio'], ENT_QUOTES, 'UTF-8'); ?></p>
<?php endif; ?>
        </div>

<?php if (!empty($l['inscriptio'])) : ?>
        <p class="acta-inscriptio"><?php echo htmlspecialchars($l['inscriptio'], ENT_QUOTES, 'UTF-8'); ?></p>
<?php endif; ?>

        <p class="acta-body">
<?php
        $lines = array();
        foreach ($body as $k) {
            if (!empty($l[$k])) {
                $lines[] = htmlspecialchars($l[$k], ENT_QUOTES, 'UTF-8');
            }
        }
        echo implode("<br><br>\n", $lines);
?>
        </p>

<?php if (!empty($l['subscriptio'])) : ?>
        <p class="acta-subscriptio"><?php echo htmlspecialchars($l['subscriptio'], ENT_QUOTES, 'UTF-8'); ?></p>
<?php endif; ?>

<?php if (!empty($sig['value'])) : ?>
        <div class="acta-sigillum">
          <p class="acta-sigillum-titulus"><?= str_replace('{alg}', htmlspecialchars(isset($sig['alg']) ? $sig['alg'] : $t['acta.sigillum.alg'], ENT_QUOTES, 'UTF-8'), $t['acta.sigillum']) ?></p>
          <p class="acta-sigillum-valor"><?php echo htmlspecialchars($sig['value'], ENT_QUOTES, 'UTF-8'); ?></p>
        </div>
<?php endif; ?>

      </div>
<?php endforeach; ?>
    </div>
<?php endif; ?>

  </div>

  <script nonce="<?= $nonce ?>">
  (function () {
    document.querySelectorAll('.acta-intitulatio').forEach(function (el) {
      el.innerHTML = el.innerHTML.replace(
        'V, triginta et uno nihilis cinctus,',
        '<span class="acta-sigil">V, triginta et uno nihilis cinctus,</span>'
      );
    });
    document.querySelectorAll('.acta-body').forEach(function (el) {
      var parts = el.innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/i);
      el.innerHTML = parts.map(function (p, i) {
        p = p.trim();
        if (i > 0) {
          p = p.replace(/^(\S)/, '<span class="acta-initial">$1</span>');
        }
        return p;
      }).join('<br>');
    });
  })();
  </script>

  <script nonce="<?= $nonce ?>">window.V31N_MODE = 'upload'; window.V31N_T = <?= json_encode($t, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
  <script src="assets/js/qrcode.min.js?v=164fc2c1c9eaf0a0" integrity="sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1"></script>
  <script src="assets/js/crypto.js?v=e13ab2e41bfe1570" integrity="sha384-XWvQhE2PfMlXJrsu8PjfOMaycm+iN9GgSl0Xw8AU3oX6Co2rCwy8sj9bDcILI8JC"></script>
  <script src="assets/js/app.js?v=6dc2b04c2e18fdd1" integrity="sha384-tbBdPOcdqI4Lb+2UtcQgxl3OTsR5zYiJ+OnMpNSeSvNzeupowfeGvJiEiIH4Jin6"></script>
</body>
</html>
