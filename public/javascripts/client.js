var commentBox = document.getElementById('comment-input');
var commentSubmit = document.getElementById('comment-submit');
var commentsDiv = document.getElementById('user-comments');
var poster = document.getElementById('posted-by').innerHTML;
var vidId = document.getElementById('video-id').innerHTML;

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
  commentDiv.className = 'single-comment';
  comment.innerHTML = commentBox.value;
  postedBy.innerHTML = poster + ' says:';
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
});
