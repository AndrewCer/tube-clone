var signInButton = document.getElementById('sign-in');
var signInOverlay = document.getElementById('sign-in-overlay');
var cancelButton = document.getElementById('cancel-button');
var loginBox = document.getElementsByClassName('login-box')[0];

if (signInButton) {
  signInButton.addEventListener('click', function () {
    signInOverlay.style.display = 'inline-block';
    unfade(loginBox);
    cancelButton.addEventListener('click', function () {
      signInOverlay.style.display = 'none';
    });
  });
}

function unfade(element) {
    var op = 0.1;  // initial opacity
    element.style.display = 'block';
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 20);
}
