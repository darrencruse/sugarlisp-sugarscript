// Generated by SugarLisp v0.6.5




var canvas = null;
var context = null;
var bricksNumX = 7;
var bricksNumY = 5;
var brickWidth = null;
var brickHeight = 20;
var brickMargin = 4;
var paddleWidth = 80;
var paddleHeight = 12;
var paddleX = 0;
var ballX = 0;
var ballY = 0;
var ballVx = 0;
var ballVy = 0;

var bricks = (function(i, j, o) {
  var ret = [];
  for (var n = 0; n < i; n++) {
    var inn = [];
    for (var m = 0; m < j; m++) inn.push(o);
    ret.push(inn);
  }
  return ret;
})(5, 7, null);

function init() {
  paddleX = (canvas.width / 2);
  ballX = 40;
  ballY = 150;
  ballVx = 7;
  ballVy = 12;
  return bricks.forEach(function(___elem, ___i, ___oa) {
    return ___elem.forEach(function(___val, ___j, ___ia) {
      return (function(val, i, j, arr) {
        return arr[i] = true;
      })(___val, ___j, ___i, ___ia, ___oa);
    });
  });
}

function clear() {
  return context.clearRect(0, 0, canvas.width, canvas.height);
}

function circle(x, y) {
  context.beginPath();
  context.arc(x, y, 10, 0, (2 * Math.PI));
  return context.fill();
}

function drawPaddle() {
  var x = (paddleX - (paddleWidth / 2));
  var y = (canvas.height - paddleHeight);
  return context.fillRect(x, y, paddleWidth, paddleHeight);
}

function drawBricks() {
  return bricks.forEach(function(___elem, ___i, ___oa) {
    return ___elem.forEach(function(___val, ___j, ___ia) {
      return (function(val, x, y, arr) {
        if (val) {
          var xpos = ((x * brickWidth) + (brickMargin / 2));
          var ypos = ((y * brickHeight) + (brickMargin / 2));
          var width = (brickWidth - brickMargin);
          var height = (brickHeight - brickMargin);
          context.fillRect(xpos, ypos, width, height);
        };
      })(___val, ___j, ___i, ___ia, ___oa);
    });
  });
}

function hitHorizontal() {
  return ballVx = (((ballX < 0) || (ballX > canvas.width)) ?
    -ballVx :
    ballVx);
}

function hitVertical() {
  if ((ballY < 0)) {
    ballVy = -ballVy;
  } else {
    if ((ballY < (brickHeight * bricksNumY))) {
      var bx = Math.floor((ballX / brickWidth));
      var by = Math.floor((ballY / brickHeight));

      if (((bx >= 0) && (bx < bricksNumX))) {
        if (bricks[by][bx]) {
          bricks[by][bx] = false;
          ballVy = -ballVy;
        };
      };
    } else {
      if ((ballY >= (canvas.height - paddleHeight))) {
        var paddleLeft = (paddleX - (paddleWidth / 2));
        var paddleRight = (paddleX + (paddleWidth / 2));
        if (((ballX >= paddleLeft) && (ballX <= paddleRight))) {
          ballVy = -ballVy;
        } else {
          init();
          return false;
        };
      };
    };
  };
  return true;
}

function tick() {
  clear();
  drawPaddle();
  ballX = (ballX + ballVx);
  ballY = (ballY + ballVy);
  hitHorizontal();
  if (hitVertical()) {
    circle(ballX, ballY);
    drawBricks();
  } else {
    clear();
  };
}
window.onload = function(event) {
  canvas = document.getElementById("breakout");
  context = canvas.getContext("2d");
  brickWidth = (canvas.width / bricksNumX);
  canvas.addEventListener("mousemove", function(event) {
    return paddleX = (event.offsetX || (event.pageX - canvas.offsetLeft));
  });
  init();
  return window.setInterval(tick, 30);
};