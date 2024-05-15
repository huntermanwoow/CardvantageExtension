// popup.js
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('loginButton').addEventListener('click', function () {
    chrome.runtime.sendMessage({ action: 'loginToTCGplayer' }, function (response) {
    });
  });
});

