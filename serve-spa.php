<?php
$nonce = base64_encode(random_bytes(16));
$html  = file_get_contents(__DIR__ . '/dist/index.html');
$html  = str_replace('CSP_NONCE_PLACEHOLDER', $nonce, $html);

$csp = "default-src 'self'; "
     . "script-src 'self'; "
     . "style-src 'self' https://fonts.googleapis.com; "
     . "style-src-elem 'self' https://fonts.googleapis.com 'nonce-{$nonce}'; "
     . "font-src 'self' data: https://fonts.gstatic.com; "
     . "img-src 'self' data: blob: https://picsum.photos https://fastly.picsum.photos https://www.google.com; "
     . "connect-src 'self' https://www.google.com https://sockjs-ap2.pusher.com https://pusher.com wss://ws-ap2.pusher.com; "
     . "frame-ancestors 'none'; "
     . "form-action 'self';";

header('Content-Type: text/html; charset=UTF-8');
header("Content-Security-Policy: {$csp}");
echo $html;
