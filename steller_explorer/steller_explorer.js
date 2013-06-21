
window.requestAnimationFrame =  window.requestAnimationFrame || 
                                window.webkitRequestAnimationFrame || 
                                window.mozRequestAnimationFrame ||
                                function (fn) { setTimeout(fn, 15); };


var canvas, context, render, t = 0, Animate = false;
var $steller_scheduler = new org.anclab.steller.Scheduler(new org.anclab.steller.AudioContext);

// Exposed function which is better to work with than the string form.
function rgba(r, g, b, a) {
    return 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', ' + a + ')';
}

// The prerender function takes a function that draws something
// into the context set as the "this" parameter and produces
// a prerender maker function that can make pre-rendered objects
// parameterized by whatever the given function accepts.
//
// Damn that's hard to describe in words! So here is some sample
// code you can use in the code box -
//
//  if (t === 0) {
//      var makeBox = prerender(function (w) {
//          this.canvas.width = w;
//          this.canvas.height = w;
//          this.fillStyle = 'red';
//          this.fillRect(0, 0, w, w);
//      });
//
//      state.smallBox = makeBox(10);
//      state.bigBox = makeBox(100);
//  }
//
//  drawImage(smallBox, 100, 100);
//  drawImage(bigBox, 120, 120);
//
function prerender(func) {
    return function () {
        var canv = document.createElement('canvas');
        var ctxt = canv.getContext('2d');
        func.apply(ctxt, arguments);
        return canv;
    };
}

// Enable some state that the render function can use
// to keep data that is shared between render() calls.
// This is better than accessing the global window
// context every time ... and likely more efficient
// (accessing window.X is relatively expensive under V8).
var $ = {};

// Evaluate the user code inside a with clause that introduces
// canvas 2d's context object. This lets the user write code
// like "fillRect(0, 0, 20, 20)" instead of "context.fillRect(0, 0, 20, 20)".
function evalCode(code) {
    with ($) { with (context) { with (org.anclab.steller) { with ($steller_scheduler) { with ($steller_scheduler.models ) { with (Math) {
        save();
        try {
            t = -1;
            eval(code);
        } catch (e) {
            restore();
            throw e;
        }
        restore();
    }}}}}}

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
    var key = 'srikumarks.github.com/demos/steller_explorer/code';

    // Setup the code editor.
    elements.code.innerText = document.querySelector('#example_code pre').innerText; // Load instructions example.
    var canvasCode = CodeMirror.fromTextArea(elements.code);
    var keyMap = Object.create(CodeMirror.keyMap.default);
    var recording = [];
    keyMap['Alt-Enter'] = function (cm) {
        var code = cm.somethingSelected() ? cm.getSelection() : cm.getLine(cm.getCursor().line);
        try {
            evalCode(code);
            recording.push({time: window.performance.now(), code: code});
            localStorage['steller_explorer.recording'] = JSON.stringify(recording);
        } catch (e) {
        }
    };
    CodeMirror.keyMap['steller_explorer'] = keyMap;
    canvasCode.setOption('keyMap', 'steller_explorer');
    canvasCode.setSize(null, 600);
    canvas = elements.canvas;
    context = canvas.getContext('2d');
    canvasCode.setOption('lineNumbers', true);
    var param_control;
    canvasCode.on('cursorActivity', function (cm) {
        var token = cm.getTokenAt(cm.getCursor());
        if (param_control) {
            param_control.hidden = true;
            param_control = undefined;
        }

        if (token.className === 'variable') {
            // Check if it is a Param.
            var p = window[token.string];
            if (p && p instanceof org.anclab.steller.Param) {
                // Yup. Put up the slider.
                if (!p.slider) {
                    var d = document.createElement('div');
                    d.style.position = 'fixed';
                    d.style.background = '#efefef';
                    d.style.border = '2px solid black';
                    d.style.borderRadius = '5px';
                    
                    var slider = document.createElement('input');
                    slider.setAttribute('type', 'range');
                    slider.setAttribute('min', '0.0');
                    slider.setAttribute('max', '1.0');
                    slider.setAttribute('step', '0.01');
                    p.bind(slider);
                    var name = document.createElement('span');
                    name.innerText = token.string + ': ';
                    name.style.fontFamily = 'sans-serif';
                    name.style.fontWeight = 'bold';

                    var t = document.createElement('span');
                    d.insertAdjacentElement('beforeend', name);
                    d.insertAdjacentElement('beforeend', slider);
                    d.insertAdjacentElement('beforeend', t);
                    p.watch(function (val) {
                        t.innerText = ' ' + (Math.round(100 * val)/100);
                    });
                    p.slider = d;
                    t.innerText = ' ' + (Math.round(100 * p.value)/100);
                    document.body.insertAdjacentElement('beforeend', d);
                } else {
                    p.slider.hidden = false;
                }

                var xy = cm.cursorCoords();
                p.slider.style.zIndex = 100;
                p.slider.style.left = xy.left + 'px';
                p.slider.style.top = (xy.top - 24) + 'px';

                param_control = p.slider;
                return;
            }
        }

        if (param_control) {
            param_control.hidden = false;
        }
    });

    var codeChangeTime = Date.now();
    var debounceTime = 300;
    var codeUpdateTimer = setTimeout(run, 0);
    var codeIsValid = true;

    debugger;
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

    function getRecording() {
        return JSON.parse(localStorage['steller_explorer.recording']);
    }

    elements.export.onclick = function () {
        if (codeIsValid) {
            store(saveImage(canvasCode.getValue(), getRecording()));
        } else {
            console.error("Invalid code. Won't save image.");
        }
    };

    load();

    function run() {
        try {
            store(canvasCode.getValue());
            codeIsValid = true;
        } catch (e) {
            // Ignore errors
            codeIsValid = false;
        }
    }

    function saveImage(imgCode, rec) {
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
        img.recording = rec;

        r.insertAdjacentElement('afterbegin', img);
        return imgCode;
    }
    
    function store(code) {
        localStorage[key] = JSON.stringify({code: code, recording: getRecording()});

        var r = elements.rendered;
        var imgs = r.getElementsByTagName('img');
        var i, N = imgs.length;
        var savedImageCode = [];
        for (i = 0; i < N; ++i) {
            savedImageCode.push({code: imgs[i].imageCode, recording: imgs[i].recording});
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
                evalCode(savedImageCode[i].code);
                saveImage(savedImageCode[i].code, savedImageCode[i].recording);
            }
        }
        if (localStorage[key]) {
            // Load the latest code saved.
            var cr = JSON.parse(localStorage[key]);
            canvasCode.setValue(cr.code);
            localStorage['steller_explorer.recording'] = JSON.stringify(cr.recording);
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

