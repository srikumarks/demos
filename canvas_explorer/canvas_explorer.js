
window.requestAnimationFrame =  window.requestAnimationFrame || 
                                window.webkitRequestAnimationFrame || 
                                window.mozRequestAnimationFrame ||
                                function (fn) { setTimeout(fn, 15); };


var canvas, context, render, t = 0, animate = false;

// Exposed function which is better to work with than the string form.
function rgba(r, g, b, a) {
    return 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', ' + a + ')';
}

// Exposed function to perform simplistic animations.
//      anim.scheme(v1, v2, dt)
// will generate a value that animates from v1 to v2 over the
// duration of dt, using the scheme named by 'scheme'. 
// Defined scheme names are 'linear', 'loop', 'sine',
// 'cos', 'easein', 'easeout', 'easeinout' and 'bounce'.
var anim = (function () {
    var motions = {
        'linear': function (v1, v2, dt) {
            var mt = Math.min(1.0, (t % dt) / dt);
            var v = v1 + mt * (v2 - v1);
            return v;
        },

        'loop': function (v1, v2, dt, phase) {
            var mt = ((t + (2 * dt * (1.0 - phase || 0.0))) % (2 * dt)) / dt;
            var v = v1 + (mt < 1.0 ? mt : 2.0 - mt) * (v2 - v1);
            return v;
        },

        'sin': function (v1, v2, dt, phase) {
            var mt = (t % (4 * dt)) / (4 * dt);
            return v1 + 0.5 * (v2 - v1) * (1.0 + Math.sin(2 * Math.PI * (mt - 0.25 - (phase || 0.0))));
        },

        'cos': function (v1, v2, dt, phase) {
            var mt = (t % (4 * dt)) / (4 * dt);
            return v1 + 0.5 * (v2 - v1) * (1.0 + Math.cos(2 * Math.PI * (mt - 0.25 - (phase || 0.0))));
        },

        'easein': function (v1, v2, dt) {
            var mt = Math.min(0.5, t / (2.0 * dt));
            return v1 + (v2 - v1) * (4.0 * mt * (1.0 - mt));
        },

        'easeout': function (v1, v2, dt) {
            var mt = Math.min(1.0, t / dt);
            return v1 + (v2 - v1) * (mt * mt);
        },

        'easeinout': function (v1, v2, dt) {
            var mt = Math.min(1.0, (t % (4 * dt)) / (4 * dt));
            return v1 + 0.5 * (v2 - v1) * (1.0 + Math.sin(2 * Math.PI * (mt - 0.25)));
        },

        'bounce': function (v1, v2, dt, phase) {
            var mt = ((t % (2.0 * dt)) / (2.0 * dt) - (phase || 0.0)) % 1.0;
            return v1 + (v2 - v1) * (4.0 * mt * (1.0 - mt));
        }
    };

    Object.keys(motions).forEach(function (k) {
        motions[k] = (function (m) {
            return function (v1, v2, dt) {
                dt = dt || 120;
                var v = m(v1, v2, dt);
                animate = true;
                return v;
            }
        }(motions[k]));
    });

    motions.sine = motions.sin;
    motions.lin = motions.linear;
    motions.ease = motions.easeinout;
    
    return motions;
}());

// Evaluate the user code inside a with clause that introduces
// canvas 2d's context object. This lets the user write code
// like "fillRect(0, 0, 20, 20)" instead of "context.fillRect(0, 0, 20, 20)".
function evalCode(code) {
    with (context) {
        with (Math) {
            clearRect(0, 0, canvas.width, canvas.height);
            save();
            try {
                t = -1;
                render = eval('(function () {'
                    + 'if (render === arguments.callee) {'
                    + '++t; animate = false;\n' 
                    + code 
                    + ';\nif (animate) { requestAnimationFrame(render); }\n'
                    + '}})');
                render();
            } catch (e) {
                restore();
                throw e;
            }
            restore();
        }
    }
    return code;
}

(function () {
    function getElements(array) {
        var obj = {};
        array.forEach(function (id) {
            obj[id] = document.getElementById(id);
        });
        return obj;
    }

    var elements = getElements(['rendered', 'canvas', 'code']);
    var key = 'srikumarks.github.com/demos/canvas_explorer/code';

    // Setup the code editor.
    var canvasCode = CodeMirror.fromTextArea(elements.code);
    canvasCode.setSize(null, 600);
    canvas = elements.canvas;
    context = canvas.getContext('2d');
    canvasCode.setOption('lineNumbers', true);

    var codeChangeTime = Date.now();
    var debounceTime = 300;
    var codeUpdateTimer = setTimeout(run, 0);
    var codeIsValid = true;

    canvasCode.setOption('onChange', function () {
        var now = Date.now();
        if (now - codeChangeTime < debounceTime) {
            clearTimeout(codeUpdateTimer);

            // EXPERIMENTAL:
            //
            // Trying out a kind of adaptive deboucing of edits.
            // If the edits are coming in quickly, reduce the
            // debounce time to improve on realtime feeling.
            // If edits are coming in slowly, increase the debounce 
            // time to adapt to the programmer's pace.
            debounceTime *= Math.pow(2.0, 2.0 * Math.min(1.0, Math.max(-1.0, ((now - codeChangeTime) / debounceTime - 0.5))));
        }

        codeUpdateTimer = setTimeout(run, debounceTime);
        codeChangeTime = now;
    });

    document.getElementById('export').onclick = function () {
        if (codeIsValid) {
            store(saveImage(canvasCode.getValue()));
        } else {
            console.error("Invalid code. Won't save image.");
        }
    };

    load();

    function run() {
        try {
            store(evalCode(canvasCode.getValue()));
            codeIsValid = true;
        } catch (e) {
            // Ignore errors
            codeIsValid = false;
        }
    }

    function saveImage(imgCode) {
        var r = elements.rendered;
        var img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.width = canvas.width * 32 / canvas.height;
        img.height = 32;
        img.onclick = function (event) {
            if (event.shiftKey) {
                setTimeout(function () {
                    r.removeChild(img);
                    store(canvasCode.getValue());
                }, 0);
            } else {
                canvasCode.setValue(imgCode);
                clearTimeout(codeUpdateTimer);
                codeUpdateTimer = setTimeout(run, 0);
            }
        };
        img.imageCode = imgCode;

        r.insertAdjacentElement('afterbegin', img);
        return imgCode;
    }
    
    function store(code) {
        localStorage[key] = code;

        var r = elements.rendered;
        var imgs = r.getElementsByTagName('img');
        var i, N = imgs.length;
        var savedImageCode = [];
        for (i = 0; i < N; ++i) {
            savedImageCode.push(imgs[i].imageCode);
        }
        localStorage[key+'/saved_code'] = JSON.stringify(savedImageCode);

        return code;
    }

    function load() {
        var savedImageCode, i;
        if (localStorage[key + '/saved_code']) {
            savedImageCode = JSON.parse(localStorage[key + '/saved_code']);
            elements.rendered.innerHTML = '';
            for (i = savedImageCode.length - 1; i >= 0; --i) {
                evalCode(savedImageCode[i]);
                saveImage(savedImageCode[i]);
            }
        }
        if (localStorage[key]) {
            // Load the latest code saved.
            canvasCode.setValue(localStorage[key]);
        }
    }
}());

