// I scarfed this from:
//   http://arachnoid.com/mandelbrot_set/
// specifically:
//   http://arachnoid.com/mandelbrot_set/resources/comp_mandelbrot.js

function addEvent(a, b, c) {
    if (a.addEventListener) {
        a.addEventListener(b, c, false);
        return true
    } else return a.attachEvent ? a.attachEvent("on" + b, c) : false
}

function MWorker(a, b, c) {
    this.buf = new ArrayBuffer(a);
    this.worker = new Worker(b);
    this.worker.addEventListener("message", function(d) {
        c(d)
    }, false)
}
var mandelbrot = mandelbrot || {};
mandelbrot.setup = function() {
    mandelbrot.old_user_debug = false;
    mandelbrot.dplaces = 6;
    mandelbrot.old_colors = -1;
    mandelbrot.colors = 256;
    document.getElementById("select_colors").value = mandelbrot.colors;
    mandelbrot.busy_disp = document.getElementById("busy_disp");
    mandelbrot.worker_script = "resources/comp_mandelworker.js";
    mandelbrot.static_worker = null;
    mandelbrot.have_worker = typeof Worker !== "undefined";
    mandelbrot.workcounter = 0;
    mandelbrot.canvas = document.getElementById("graph_canvas");
    mandelbrot.ctx = mandelbrot.canvas.getContext("2d");
    mandelbrot.old_height = -1;
    mandelbrot.reconfigure(true);
    mandelbrot.ctx.scale(1, 1);
    mandelbrot.ctx.translate(0, 0);
    mandelbrot.scale = 0.4;
    mandelbrot.xp = -0.65;
    mandelbrot.yp = 0;
    mandelbrot.oscale = -1;
    mandelbrot.oxp = -1;
    mandelbrot.oyp = -1;
    mandelbrot.mousedown = false;
    mandelbrot.canvas.onclick = mandelbrot.onmouseclick;
    if (mandelbrot.canvas.addEventListener) {
        mandelbrot.canvas.addEventListener("mousewheel", mandelbrot.wheel_handler, false);
        mandelbrot.canvas.addEventListener("DOMMouseScroll", mandelbrot.wheel_handler, false)
    } else mandelbrot.canvas.attachEvent("onmousewheel",
        mandelbrot.wheel_handler);
    window.setInterval(function() {
        mandelbrot.draw()
    }, 50);
    return true
};
mandelbrot.reconfigure = function(a) {
    mandelbrot.colors = parseFloat(document.getElementById("select_colors").value);
    mandelbrot.user_debug = document.getElementById("debug").checked;
    var b = parseFloat(document.getElementById("select_size").value);
    if (b != mandelbrot.height || a) {
        mandelbrot.height = b;
        mandelbrot.width = b;
        mandelbrot.canvas.height = b;
        mandelbrot.canvas.width = b;
        a = document.getElementById("canvas_wrapper");
        a.setAttribute("style", "width:" + b + "px");
        a.setAttribute("style", "height:" + (b + 140) + "px");
        mandelbrot.build_worker_array()
    }
};
mandelbrot.build_worker_array = function() {
    mandelbrot.workcounter = 0;
    mandelbrot.workarray = [];
    if (mandelbrot.have_worker) {
        mandelbrot.workers = 8;
        mandelbrot.length = mandelbrot.width * mandelbrot.height * 4 / mandelbrot.workers;
        for (var a = 0; a < mandelbrot.workers; a++) mandelbrot.workarray.push(new MWorker(mandelbrot.length, mandelbrot.worker_script, mandelbrot.worker_callback))
    } else {
        mandelbrot.workers = 1;
        a = document.getElementsByTagName("head")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";
        b.src = mandelbrot.worker_script;
        a.appendChild(b);
        b.onload = function() {
            mandelbrot.static_worker = mandelworker_setup(mandelbrot.colors);
            mandelbrot.static_buf = new ArrayBuffer(mandelbrot.width * mandelbrot.height * 4);
            mandelbrot.workarray.push(mandelbrot.static_worker)
        }
    }
};
mandelbrot.onmouseclick = function(a) {
    a = window.event || a;
    a = mandelbrot.getMousePos(mandelbrot.canvas, a);
    var b = ((a.y - 2) / mandelbrot.height - 0.5) / mandelbrot.scale;
    mandelbrot.xp += ((a.x - 2) / mandelbrot.height - 0.5) / mandelbrot.scale;
    mandelbrot.yp -= b;
    return false
};
mandelbrot.onmousemove = function(a) {
    a = window.event || a;
    mandelbrot.getMousePos(mandelbrot.canvas, a);
    return false
};
mandelbrot.onmousedown = function(a) {
    a = window.event || a;
    a = mandelbrot.getMousePos(mandelbrot.canvas, a);
    mandelbrot.xl = (a.x / mandelbrot.height - 0.5) / mandelbrot.scale;
    mandelbrot.yl = (a.y / mandelbrot.height - 0.5) / mandelbrot.scale;
    mandelbrot.canvas.onmousemove = mandelbrot.onmousemove;
    return false
};
mandelbrot.onmouseup = function() {
    mandelbrot.canvas.onmousemove = null;
    return false
};
mandelbrot.onmouseout = function() {
    mandelbrot.canvas.onmousemove = null;
    return false
};
mandelbrot.wheel_handler = function(a) {
    a = window.event || a;
    mandelbrot.scale = Math.max(-1, Math.min(1, a.wheelDelta || -a.detail)) > 0 ? mandelbrot.scale * 1.2 : mandelbrot.scale / 1.2;
    a = a || window.event;
    a.preventDefault && a.preventDefault();
    a.returnValue = false
};
mandelbrot.magnification = function(a) {
    mandelbrot.scale *= 1 + a / 5;
    return false
};
mandelbrot.getMousePos = function(a, b) {
    var c = a.getBoundingClientRect();
    return {
        x: b.clientX - c.left,
        y: b.clientY - c.top
    }
};
mandelbrot.ntrp = function(a, b, c, d, e) {
    return (a - b) * (e - d) / (c - b) + d
};
mandelbrot.wrap_tag = function(a, b, c) {
    c = c ? c.length > 0 ? " " + c : c : "";
    return "<" + a + c + ">" + b + "</" + a + ">"
};
mandelbrot.show_data = function() {
    var a = document.getElementById("data_disp");
    s = mandelbrot.wrap_tag("b", "m") + ": " + mandelbrot.scale.toExponential(mandelbrot.dplaces);
    s += " " + mandelbrot.wrap_tag("b", "x") + ": " + mandelbrot.xp.toExponential(mandelbrot.dplaces);
    s += " " + mandelbrot.wrap_tag("b", "y") + ": " + mandelbrot.yp.toExponential(mandelbrot.dplaces);
    a.innerHTML = s;
    mandelbrot.debug_disp()
};
mandelbrot.debug_disp = function() {
    var a = document.getElementById("debug_disp");
    s = "";
    if (mandelbrot.user_debug) {
        var b = mandelbrot.end_time - mandelbrot.start_time;
        s = "worker threads: " + mandelbrot.workers;
        s += ", pixels " + (mandelbrot.width * mandelbrot.height).toExponential(2);
        s += ", drawing time " + b + " ms"
    }
    a.innerHTML = s
};
mandelbrot.worker_callback = function(a) {
    if ("buf" in a.data) {
        a = a.data;
        var b = mandelbrot.ctx.getImageData(0, a.a, mandelbrot.width, a.b - a.a),
            c = new Uint8ClampedArray(a.buf);
        b.data.set(c);
        mandelbrot.ctx.putImageData(b, 0, a.a);
        mandelbrot.workcounter--;
        if (mandelbrot.workcounter == 0) {
            mandelbrot.busy_disp.innerHTML = "(idle)";
            mandelbrot.end_time = (new Date).getTime();
            mandelbrot.show_data()
        }
        if (mandelbrot.have_worker) mandelbrot.workarray[a.n].buf = a.buf
    }
    return false
};
mandelbrot.dispatch_worker = function(a, b, c) {
    a = {
        n: c,
        buflen: mandelbrot.length,
        a: a,
        b: b,
        xp: mandelbrot.xp,
        yp: mandelbrot.yp,
        width: mandelbrot.width,
        height: mandelbrot.height,
        scale: mandelbrot.scale,
        colors: mandelbrot.colors,
        worker: mandelbrot.have_worker
    };
    mandelbrot.workcounter++;
    if (mandelbrot.have_worker) {
        c = mandelbrot.workarray[c];
        a.buf = c.buf;
        c.worker.postMessage(a, [a.buf])
    } else {
        a.buf = mandelbrot.static_buf;
        a = mandelbrot.static_worker.compute(a);
        mandelbrot.worker_callback(a)
    }
};
mandelbrot.draw = function() {
    if (mandelbrot.workcounter == 0 && (mandelbrot.scale != mandelbrot.oscale || mandelbrot.xp != mandelbrot.oxp || mandelbrot.yp != mandelbrot.oyp || mandelbrot.colors != mandelbrot.old_colors || mandelbrot.height != mandelbrot.old_height || mandelbrot.user_debug != mandelbrot.old_user_debug)) {
        mandelbrot.start_time = (new Date).getTime();
        mandelbrot.oscale = mandelbrot.scale;
        mandelbrot.oxp = mandelbrot.xp;
        mandelbrot.oyp = mandelbrot.yp;
        mandelbrot.old_colors = mandelbrot.colors;
        mandelbrot.old_height = mandelbrot.height;
        mandelbrot.old_user_debug = mandelbrot.user_debug;
        mandelbrot.busy_disp.innerHTML = "(<b>drawing</b>)";
        for (var a = 0; a < mandelbrot.workers; a++) mandelbrot.dispatch_worker(Math.floor(mandelbrot.height * a / mandelbrot.workers), Math.floor(mandelbrot.height * (a + 1) / mandelbrot.workers), a)
    }
};
mandelbrot.generate_graphic = function() {
    var a = mandelbrot.canvas.toDataURL("image/png");
    window.open(a, "Mandelbrot Image")
};
addEvent(window, "load", mandelbrot.setup);

