var commentBox = document.getElementById('comment-input');
var commentSubmit = document.getElementById('comment-submit');
var commentsDiv = document.getElementById('new-comments');
var poster = document.getElementById('posted-by').innerHTML;
var vidId = document.getElementById('video-id').innerHTML;
var likeButton = document.getElementById('like-button');
var dislikeButton = document.getElementById('dislike-button');
var likeCount = document.getElementById('like-count');
var dislikeCount = document.getElementById('dislike-count');
var likedButton = document.getElementById('liked-button');
var dislikedButton = document.getElementById('disliked-button');

if (likeButton) {
  likeButton.addEventListener('click', function () {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tube/like/' + vidId + '/' + poster, true);
    xhr.send(null);
    likeCount.innerHTML = Number(likeCount.innerHTML) + 1;
    likeButton.style.display = 'none';
    likedButton.style.display = 'block';
    dislikeButton.style.display = 'none';
  });
}

if (dislikeButton) {
  dislikeButton.addEventListener('click', function () {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tube/dislike/' + vidId + '/' + poster, true);
    xhr.send(null);
    dislikeCount.innerHTML = Number(dislikeCount.innerHTML) + 1;
    dislikeButton.style.display = 'none';
    dislikedButton.style.display = 'block';
    likeButton.style.display = 'none';
  });
}

commentBox.addEventListener('click', function () {
  commentBox.innerHTML = '';
  commentBox.placeholder = 'Feed Me Your Comment';
  commentBox.className = 'comment-cursor';
  commentBox.style.height = '70px'
  commentSubmit.style.display = 'inline-block';
  commentBoxSubmit = document.getElementById('comment-cursor');
  commentBox.addEventListener('focusout', function () {
    if (commentBox.value === '') {
      commentBox.className = '';
      commentBox.style.height = '35px'
      commentBox.innerHTML = "What's on Your Brain Noodle?"
      commentSubmit.style.display = 'none';
    }
  });
});

commentSubmit.addEventListener('click', function () {
  var commentObj = {};
  var commentDiv = document.createElement('div');
  var comment = document.createElement('p');
  var postedBy = document.createElement('p');
  commentDiv.className = 'new-single-comment';
  comment.innerHTML = commentBox.value;
  postedBy.innerHTML = poster + ' said:';
  commentsDiv.appendChild(commentDiv);
  commentDiv.appendChild(postedBy);
  commentDiv.appendChild(comment);
  commentBox.value = '';
  commentObj.comment = comment.innerHTML;
  commentObj.videoId = vidId;
  commentObj.user = poster;
  commentObj.timePosted = Date();
  var data = 'userComment=' + JSON.stringify(commentObj);
  // var data = JSON.stringify(commentObj);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/tube/vid-comment', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(data);
  xhr.onreadystatechange=function() {
    if (xhr.readyState==4 && xhr.status==200) {
      console.log(xhr.responseText);
    }
  }
  commentBox.className = '';
  commentBox.style.height = '35px'
  commentBox.innerHTML = "What's on Your Brain Noodle?"
  commentSubmit.style.display = 'none';
});
