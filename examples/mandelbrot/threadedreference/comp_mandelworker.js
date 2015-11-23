// from:  http://arachnoid.com/mandelbrot_set/resources/comp_mandelworker.js

function Color(e, a, c, b) {
    this.r = e;
    this.g = a;
    this.b = c;
    this.a = b;
    this.rgba32 = b << 24 | c << 16 | a << 8 | e
}
var mandelworker = null;
mandelworker_setup = function(e) {
    mandelworker = mandelworker || {};
    mandelworker.maxcolors = e;
    mandelworker.running = false;
    mandelworker.ntrp = function(a, c, b, f, h) {
        return (a - c) * (h - f) / (b - c) + f
    };
    mandelworker.hsv_to_rgb = function(a, c, b) {
        var f = [b, b, b];
        if (c != 0) {
            a = a * 6 % 6;
            c = c * b;
            b = c * (1 - Math.abs(a % 2 - 1));
            f = [
                [c, b, 0],
                [b, c, 0],
                [0, c, b],
                [0, b, c],
                [b, 0, c],
                [c, 0, b]
            ][Math.floor(a)]
        }
        return new Color(f[0] * 255, f[1] * 255, f[2] * 255, 255)
    };
    mandelworker.generate_colors = function() {
        mandelworker.colors = Array(mandelworker.maxcolors);
        for (var a = 0; a < mandelworker.maxcolors; a++) mandelworker.colors[a] =
            mandelworker.hsv_to_rgb(1 - (a / mandelworker.maxcolors + 0.3333) % 1, 1, 1);
        mandelworker.colors[mandelworker.maxcolors - 1] = new Color(0, 0, 0, 255)
    };
    mandelworker.compute = function(a) {
        mandelworker.running = true;
        for (var c = new Uint32Array(a.buf), b = mandelworker.maxcolors - 1, f, h, k, g, d, j, m, i, l = a.a; l < a.b && mandelworker.running; l++) {
            k = a.yp + mandelworker.ntrp(l, 0, a.height, 0.5 / a.scale, -0.5 / a.scale);
            h = a.xp - 0.5 * (a.width / a.height) / a.scale;
            xstep = 1 / (a.scale * a.height);
            f = (l - a.a) * a.width;
            for (var n = 0; n < a.width; n++) {
                i = k * k;
                d = h - 0.25;
                g = d *
                    d + i;
                g = g * (g + d);
                d = 0.25 * i;
                if (g < d) j = b;
                else {
                    d = h + 1;
                    d = d * d + i;
                    if (d < 0.0625) j = b;
                    else {
                        d = g = j = 0;
                        do {
                            m = g * g;
                            i = d * d;
                            d = 2 * g * d + k;
                            g = m - i + h;
                            j++
                        } while (m + i < 5 && j < b)
                    }
                }
                c[f++] = mandelworker.colors[j].rgba32;
                h += xstep
            }
        }
        mandelworker.running && a.worker && postMessage(a, [a.buf]);
        mandelworker.running = false;
        return {
            data: a
        }
    };
    mandelworker.generate_colors();
    return mandelworker
};
self.addEventListener("message", function(e) {
    if ("buflen" in e.data) {
        e = e.data;
        if (mandelworker == null || e.colors != mandelworker.maxcolors) mandelworker_setup(e.colors);
        mandelworker.running = false;
        mandelworker.compute(e)
    }
}, false);
