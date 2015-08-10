var commentBox = document.getElementById('comment-input');
var commentSubmit = document.getElementById('comment-submit');
var commentsDiv = document.getElementById('user-comments');
var poster = document.getElementById('posted-by');

commentBox.addEventListener('click', function () {
  commentBox.innerHTML = '';
  commentBox.placeholder = 'Feed Me Your Comment';
  commentBox.id = 'comment-cursor';
  commentSubmit.style.display = 'inline-block';
  commentBoxSubmit = document.getElementById('comment-cursor');
  commentBox.addEventListener('focusout', function () {
    commentBox.id = 'comment-input';
    commentBox.innerHTML = "What's on Your Brain Noodle?"
    commentSubmit.style.display = 'none';
  });
});

commentSubmit.addEventListener('click', function () {
  var commentDiv = document.createElement('div');
  var comment = document.createElement('p');
  var postedBy = document.createElement('p');
  commentDiv.className = 'single-comment';
  comment.innerHTML = commentBox.value;
  postedBy.innerHTML = '- Posted By: ' + poster;
  commentsDiv.appendChild(commentDiv);
  commentDiv.appendChild(comment);
  commentDiv.appendChild(postedBy);
  commentBox.value = '';
});
