// Generated by SugarLisp v0.5




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
        return (val ?
          (function() {
            var xpos = (((x * brickWidth)) + ((brickMargin / 2)));
            var ypos = ((y * brickHeight) + (brickMargin / 2));
            var width = (brickWidth - brickMargin);
            var height = (brickHeight - brickMargin);
            return context.fillRect(xpos, ypos, width, height);
          })() : undefined);
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
  return (((ballY < 0)) ?
    (function() {
      ballVy = -ballVy;
      return true;
    })() :
    (((ballY < ((brickHeight * bricksNumY)))) ?
      (function() {
        var bx = Math.floor((ballX / brickWidth));
        var by = Math.floor((ballY / brickHeight));
        return (((bx >= 0) && (bx < bricksNumX)) ?
          (function() {
            return (bricks[by][bx] ?
              (function() {
                bricks[by][bx] = false;
                return ballVy = -ballVy;
              })() : undefined);
          })() :
          true);
      })() :
      (((ballY >= ((canvas.height - paddleHeight)))) ?
        (function() {
          var paddleLeft = (paddleX - ((paddleWidth / 2)));
          var paddleRight = (paddleX + ((paddleWidth / 2)));
          return ((((ballX >= paddleLeft)) && ((ballX <= paddleRight))) ?
            (function() {
              ballVy = -ballVy;
              return true;
            })() :
            (function() {
              init();
              return false;
            })());
        })() :
        (true ?
          (function() {
            return true;
          })() : undefined))));
}

function tick() {
  clear();
  drawPaddle();
  ballX = (ballX + ballVx);
  ballY = (ballY + ballVy);
  hitHorizontal();
  return (hitVertical() ?
    (function() {
      circle(ballX, ballY);
      return drawBricks();
    })() :
    (function() {
      return clear();
    })());
}
window.onload = function(event) {
  canvas = document.getElementById("breakout");
  context = canvas.getContext("2d");
  brickWidth = (canvas.width / bricksNumX);
  canvas.addEventListener("mousemove", function(event) {
    return (function() {
      return paddleX = ((event.offsetX || ((event.pageX - canvas.offsetLeft))));
    })();
  });
  init();
  return window.setInterval(tick, 30);
};