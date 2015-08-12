var editPictureButton = document.getElementById('edit-pic');
var userImgOverlay = document.getElementById('user-image-overlay');
var imagePreview = document.getElementById('image-prev');
var inputUrl = document.getElementById('image-url');
var updateImageButton = document.getElementById('update-image');
var userId = document.getElementById('user-id').innerHTML;
var profileImg = document.getElementById('profile-image');
var cancelButton = document.getElementById('cancel-button');

editPictureButton.addEventListener('click', function () {
  userImgOverlay.style.display = 'inline-block';
});

inputUrl.addEventListener('change', function () {
  imagePreview.src = inputUrl.value;
});

cancelButton.addEventListener('click', function () {
  userImgOverlay.style.display = 'none';
});

updateImageButton.addEventListener('click', function () {
  var xhr = new XMLHttpRequest();
  var data = 'url=' + inputUrl.value;
  xhr.open('POST', '/tube/update-pic/' + userId, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(data);
  profileImg.src = inputUrl.value;
  userImgOverlay.style.display = 'none';

});
