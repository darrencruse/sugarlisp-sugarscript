// Generated by SugarLisp v0.5
var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

var square = function(x) {
  return (x * x);
};

function mandelbrot(r, i, maxIter) {
  var iter = 0;
  var zr = r;
  var zi = i;
  var zr_sq = square(r);
  var zi_sq = square(i);
  var loop = 1;
  var lr = 0;
  var li = 0;
  while ((!(((iter === maxIter) || ((lr === zr) && (li === zi))) || (4 <= (zr_sq + zi_sq))))) {
    ++iter;
    if ((loop === iter)) {
      lr = zr;
      li = zi;
      (loop += loop);
    };
    zr_sq = square(zr);
    zi_sq = square(zi);
    (zi *= zr);
    (zi += zi);
    (zi += i);
    zr = (zr_sq - zi_sq);
    (zr += r);
  };

  if (((iter === maxIter) || ((lr === zr) && (li === zi)))) {
    return null
  } else {
    return iter
  };
}

function color(n) {
  if (((typeof(n) === "undefined") || (n === null))) {
    return "rgb(0,0,0)"
  } else {
    n = ((32 * n) % 768);
    var rgb = ((n < 256) ? [
        (255 - n),
        n,
        0
      ] :
      ((n < 512) ? [
          0, (511 - n), (n - 256)
        ] :
        (true ? [
          (n - 512),
          0, (767 - n)
        ] : undefined)));
    return ["rgb(", rgb[0], ",", rgb[1], ",", rgb[2], ")"].join('');
  };
}

var params = {
  r: 0,
  i: 0,
  range: 4,
  maxIter: 30
};

var half = function(x) {
  return (x / 2);
};

function draw() {
  for (var r = 0; r < canvas.width; r++) {
    for (var i = 0; i < canvas.height; i++) {
      var calc = mandelbrot(((((params.range * r) / canvas.width) + half(-params.range)) + params.r), ((((params.range * i) / canvas.height) + half(-params.range)) + params.i), params.maxIter);
      ctx.fillStyle = color(calc);
      ctx.fillRect(r, i, 1, 1);
    };
  };
}


draw();
document.addEventListener("keyup", function(e) {
  switch (e.keyCode) {
    case 81:
      (params.range *= (2 / 3));
      ++params.maxIter;
      draw();
      break;
    case 87:
      (params.i -= (params.range / 3));
      draw();
      break;
    case 69:
      (params.range *= (3 / 2));
      --params.maxIter;
      draw();
      break;
    case 65:
      (params.r -= (params.range / 3));
      draw();
      break;
    case 83:
      (params.i += (params.range / 3));
      draw();
      break;
    case 68:
      (params.r += (params.range / 3));
      draw();
      break;
  };
});