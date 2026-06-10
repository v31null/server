<?php require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
    <title>v31nfiles</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/assets/css/style.css">
  
		<link rel="stylesheet" href="/assets/css/katex.css" />
		<script defer src="/assets/js/katex.js" integrity="sha384-tMzugJpfLv7v0f+KXzNMqNCC6sVzLMM3sCnZDgzy0lcO/0h3sAkEBg/URFcV0JpE"></script>
		<script defer src="/assets/js/auto-render.js" integrity="sha384-xPmXPBvcxK/y8ReZ6Bqqc2xLa3i/2NHkhfeKYWS2sIfCbizZU2B2AsusEWhU1yOV"></script>
		<script defer src="/assets/js/copy-tex.min.js" integrity="sha384-HORx6nWi8j5/mYA+y57/9/CZc5z8HnEw4WUZWy5yOn9ToKBv1l58vJaufFAn9Zzi"></script>

		<script>
			window.onload = function () {
				renderMathInElement(document.body, {
					delimiters: [
						{ left: "$$", right: "$$", display: true },
						{ left: "$", right: "$", display: false },
					],
					throwOnError: false,
					trust: true,
					preProcess: function (math) {
						return math.replace(/Ș̈/g, "\\ddot{S}\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/Ț̈/g, "\\ddot{T}\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ș̈/g, "\\ddot{s}\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ț̈/g, "\\ddot{t}\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ș/g, "s\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/Ș/g, "S\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/Ț/g, "T\\rlap{\\hspace{-1em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/ț/g, "t\\rlap{\\hspace{-0.5em}\\raisebox{-0.4ex}{\\textit{,}}}").replace(/í̈/g, "\\ddot{\\acute{\\imath}}").replace(/Í̈/g, "\\ddot{\\acute{I}}").replace(/í/g, "\\acute{\\imath}").replace(/Í/g, "\\acute{I}").replace(/ï/g, "\\ddot{\\imath}");
					},
				});
			};
		</script>
</head>
<body>
  <div class="container">

    <!-- Branding -->
    <header class="header">
      <h1>$$\underline{\raisebox{-0.74ex}{V}\kern{-0.15em}31\raisebox{-0.74ex}{\kern{-0.08em}$n$}}$$</h1>
    </header>

    <main>

      <div id="drop-zone" class="drop-zone">
        <p class="drop-zone-text">Drag ‘iþer for to Up‑load</p>
        <input type="file" id="file-input" hidden>
      </div>

      <div id="file-info" class="file-info" style="display:none">
        <span id="file-name"></span> at <span id="file-size"></span>
      </div>

      <div class="form-group">
        <input type="password" id="password-input" placeholder="Paſs‑word ‘iðer" autocomplete="off">
      </div>

      <button id="upload-btn" class="btn" disabled>Up‑load</button>

      <div id="progress-container" class="progress-container" style="display:none">
        <div class="progress-bar-wrapper">
          <div id="progress-fill" class="progress-fill" style="width:0%"></div>
        </div>
        <p id="progress-text" class="progress-text">En‑crypting…</p>
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
              <span id="copy-feedback-secure" class="copy-feedback" style="display:none">Kopieren.</span>
            </td>
            <td style="width: 50%; padding: 10px; vertical-align: top;">
              <div class="result-link-wrapper" style="justify-content: center; margin-bottom: 5px;">
                <span class="result-link-parts">
                  <a id="result-embed-link" class="result-link" href="#" target="_blank"></a>
                </span>
              </div>
              <span id="copy-feedback-embed" class="copy-feedback" style="display:none">Kopieren.</span>
            </td>
          </tr>
        </table>
      </div>

      <div id="error-container" class="error-container" style="display:none">
        <p id="error-text"></p>
      </div>

    </main>

    <footer>
      <p><a href="/links.txt">Click ‘iðer for to be Re‑direkten to see keys Publik fileses.</a></p>
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
          <p class="acta-sigillum-titulus">Certificatio authenticitatis huius actae, sigillo nostro <?php echo htmlspecialchars(isset($sig['alg']) ? $sig['alg'] : 'sigillum', ENT_QUOTES, 'UTF-8'); ?> munita.</p>
          <p class="acta-sigillum-valor"><?php echo htmlspecialchars($sig['value'], ENT_QUOTES, 'UTF-8'); ?></p>
        </div>
<?php endif; ?>

      </div>
<?php endforeach; ?>
    </div>
<?php endif; ?>

  </div>

  <script>window.V31N_MODE = 'upload';</script>
  <script src="assets/js/crypto.js" integrity="sha384-w9GiC6ltG0puiUuhr/G608/S9HJf5ZfAAxan3zEu36iH4Ceo0wklSd9cfxfP3riU"></script>
  <script src="assets/js/app.js" integrity="sha384-YcMKdvMlLsWJpN9YzB0unYhDIkp2JSkRlQto05iwmvPyvzDx/IPRrjx1ckpUKsZs"></script>
</body>
</html>
