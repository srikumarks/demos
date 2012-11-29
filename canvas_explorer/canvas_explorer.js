
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
//
// DESIGN: Whenever anim.loop(10, 20, 60) is called within the
// render function, a new animation instance is spawned off and
// kept in the anim.loop.instances array. On each call to anim.loop
// within a single render() invocation, the instance identified by
// the index "anim.loop.instance" is run and the index incremented.
// This gives us a very simple mechanism to instantiate multiple
// animations in the render loop without fuss, though at some
// computational expense. For this project, I don't care much
// about computational cost since it is about experimentation.
//
// Upon entry into the render() function, anim._reset() needs to
// be called and every time the code changes, anim._clear() needs
// to be called. The former will reset the instance index for the
// next animation run and the latter will remove all instances
// and prepare for a fresh run.
var anim = (function () {
    var motions = {
        linear: function () {
            var t = 0.0;
            return function (v1, v2, dt) {
                var mt = t % 1;
                var v = v1 + mt * (v2 - v1);
                t += 1.0 / dt;
                animate = true;
                return v;
            };
        },

        loop: function () {
            var t = 0.0;
            return function (v1, v2, dt, phase) {
                var mt = (t + 2.0 - 2.0 * (phase || 0.0)) % 2.0;
                var v = v1 + (mt < 1.0 ? mt : 2.0 - mt) * (v2 - v1);
                t += 1.0 / dt;
                animate = true;
                return v;
            };
        },

        sine: function () {
            var t = 0.0;
            return function (v1, v2, dt, phase) {
                var mt = t % 1.0;
                var v = v1 + 0.5 * (v2 - v1) * (1.0 + Math.sin(2.0 * Math.PI * (mt - 0.25 - (phase || 0.0))));
                t += 1.0 / (2.0 * dt);
                animate = true;
                return v;
            };
        },

        cos: function () {
            var t = 0.0;
            return function (v1, v2, dt, phase) {
                var mt = t % 1.0;
                var v = v1 + 0.5 * (v2 - v1) * (1.0 + Math.cos(2.0 * Math.PI * (mt - 0.25 - (phase || 0.0))));
                t += 1.0 / (2.0 * dt);
                animate = true;
                return v;
            };
        },

        easein: function () {
            var t = 0.0;
            return function (v1, v2, dt) {
                var mt = Math.min(1.0, t);
                var v = v1 + (v2 - v1) * (4.0 * mt * (1.0 - mt));
                t += 0.5 / dt;
                animate = true;
                return v;
            };
        },

        easeout: function () {
            var t = 0.0;
            return function (v1, v2, dt) {
                var v = v1 + (v2 - v1) * Math.min(1.0, t * t);
                t += 1.0 / dt;
                animate = true;
                return v;
            };
        },

        easeinout: function () {
            var t = 0.0;
            return function (v1, v2, dt) {
                var mt = Math.min(0.5, t);
                var v = v1 + 0.5 * (v2 - v1) * (1.0 + Math.sin(2.0 * Math.PI * (mt - 0.25)));
                t += 0.5 / dt;
                animate = true;
                return v;
            };
        },

        bounce: function () {
            var t = 0.0;
            return function (v1, v2, dt, phase) {
                var mt = (t + 1.0 - (phase || 0.0)) % 1.0;
                var v = v1 + (v2 - v1) * (4.0 * mt * (1.0 - mt));
                t += 0.5 / dt;
                animate = true;
                return v;
            };
        },
    };

    var motionTypes = Object.keys(motions);

    // Turn the animation generator functions into functions that
    // can handle multiple animation instances in call form.
    function setup() {
        motionTypes.forEach(function (k) {
            var m = motions[k];
            var wrapm = function fn(v1, v2, dt, phase) {
                var f = fn.instances[fn.instance];
                if (!f) {
                    f = m();
                    fn.instances[fn.instance] = f;
                }
                fn.instance++;
                return f(v1, v2, dt, phase);
            };
            wrapm.instances = [];
            wrapm.instance = 0;
            motions[k] = wrapm;
        });
    }

    motions._clear = function () {
        motionTypes.forEach(function (k) {
            var wm = motions[k];
            wm.instances = [];
            wm.instance = 0;
        });
    }

    motions._reset = function () {
        motionTypes.forEach(function (k) {
            // Needs to be reset on every render loop entry.
            motions[k].instance = 0;
        });
    };

    setup();

    // Aliases.
    motions.sin = motions.sine;
    motions.lin = motions.linear;
    motions.ease = motions.easeinout;

    return motions;
}());

// Evaluate the user code inside a with clause that introduces
// canvas 2d's context object. This lets the user write code
// like "fillRect(0, 0, 20, 20)" instead of "context.fillRect(0, 0, 20, 20)".
function evalCode(code) {
    anim._clear();

    // Enable some state that the render function can use
    // to keep data that is shared between render() calls.
    // This is better than accessing the global window
    // context every time ... and likely more efficient
    // (accessing window.X is relatively expensive under V8).
    //
    // Any initialization can be performed within the render
    // code inside an "if (t === 0) {...}" block.
    var state = {};

    with (state) {
        with (context) {
            with (Math) {
                clearRect(0, 0, canvas.width, canvas.height);
                save();
                try {
                    t = -1;
                    render = eval('(function () {'
                        + 'if (render === arguments.callee) {'
                            + '++t; animate = false; anim._reset();\n' 
//                            + 'clearRect(0, 0, canvas.width, canvas.height);\n'
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

    var elements = getElements(['rendered', 'canvas', 'code', 'export', 'example_buttons', 'example_code']);
    var key = 'srikumarks.github.com/demos/canvas_explorer/code';

    // Setup the code editor.
    elements.code.innerText = document.querySelector('#example_code pre').innerText; // Load instructions example.
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

    elements.export.onclick = function () {
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

    function setupExamples() {
        function setupExample(name, code) {
            var b = document.createElement('button');
            b.onclick = function () {
                elements.export.onclick();
                canvasCode.setValue(code);
            };
            b.innerText = name;
            elements.example_buttons.insertAdjacentElement('beforeend', b);
        }

        var exs = elements.example_code.getElementsByTagName('pre');
        var N = exs.length;
        var i, ex;
        for (i = 0; i < N; ++i) {
            ex = exs[i];
            setupExample(ex.dataset.name, ex.innerText);
        }
    }

    setupExamples();
}());

