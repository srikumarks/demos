
window.requestAnimationFrame =  window.requestAnimationFrame || 
                                window.webkitRequestAnimationFrame || 
                                window.mozRequestAnimationFrame ||
                                function (fn) { setTimeout(fn, 15); };


var canvas, context, render, t = 0, Animate = false;
if (!org.anclab.steller.AudioContext) {
    alert("This browser doesn't support the Web Audio API yet.");
    throw new Error('No Web Audio API support');
}
var $steller_scheduler = null;

function initialize_steller() {
    $steller_scheduler = new org.anclab.steller.Scheduler(new org.anclab.steller.AudioContext);
}

var $recording_in_progress = false;
var $recording = [];

// These globals are acessible from the live coding env.
function startRecording() {
    $recording_in_progress = true;
}

function stopRecording() {
    $recording_in_progress = false;
    localStorage['steller_explorer.recording'] = JSON.stringify($recording);
}

function clearRecording() {
    $recording.splice(0);
}

function theRecording() {
    return $steller_scheduler.track($recording.map(function (code, i) {
        if (i > 0) {
            return $steller_scheduler.track([
                    $steller_scheduler.delay(0.001 * (code.time - $recording[i-1].time)),
                    $steller_scheduler.fire(function () {
                        evalCode(code.code);
                    })
                ]);
        } else {
            return $steller_scheduler.fire(function () {
                evalCode(code.code);
            });
        }
    }));
}

// Map the cancel button to the scheduler's cancel method.
document.getElementById('cancel').onclick = function () { 
    $steller_scheduler.cancel(); 
};

// Exposed function which is better to work with than the string form.
function rgba(r, g, b, a) {
    return 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', ' + a + ')';
}

// A "currying" function that can be used to fix some arguments of a
// function while letting others vary freely.
function fix(func) {
    if (arguments.length <= 1) {
        return func;
    }

    var freeIndices = [];
    var args = [];
    var i, N;
    for (i = 1, N = arguments.length; i < N; ++i) {
        if (arguments[i] === undefined) {
            freeIndices.push(i-1);
        }
        args.push(arguments[i]);
    }

    return function () {
        for (var i = 0, N = freeIndices.length; i < N; ++i) {
            args[freeIndices[i]] = arguments[i];
        }
        return func.apply(null, args);
    };
}

// A variation of "fix" above where we're fixing arguments
// to a method of an object, so the object needs to be
// the context of the fixed function's invocation.
function fixm(object, methodName) {
    if (arguments.length < 2) {
        throw new Error('Insufficient number of arguments to fixb');
    }

    var method = object[methodName];

    if (arguments.length === 2) {
        return function () {
            return method.apply(object, arguments);
        };
    }

    var freeIndices = [];
    var args = [];
    var i, N;
    for (i = 2, N = arguments.length; i < N; ++i) {
        if (arguments[i] === undefined) {
            freeIndices.push(i-2);
        }
        args.push(arguments[i]);
    }

    return function () {
        for (var i = 0, N = freeIndices.length; i < N; ++i) {
            args[freeIndices[i]] = arguments[i];
        }
        return method.apply(object, args);
    };
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

var $canvas_container = document.querySelector('.canvas_area');

setInterval((function () {
    var lastWidth = $canvas_container.offsetWidth;
    var lastHeight = $canvas_container.offsetHeight;
    return function () {
        if (lastWidth !== $canvas_container.offsetWidth
                || lastHeight !== $canvas_container.offsetHeight) {
            canvas.width = lastWidth = $canvas_container.offsetWidth;
            canvas.height = lastHeight = $canvas_container.offsetHeight;
        }
    };
}()), 500);

// Evaluate the user code inside a with clause that introduces
// canvas 2d's context object. This lets the user write code
// like "fillRect(0, 0, 20, 20)" instead of "context.fillRect(0, 0, 20, 20)".
function evalCode(code) {
    with ($) { with (context) { with (org.anclab.steller) { with ($steller_scheduler) { with ($steller_scheduler.models ) { with (Math) {
        canvas.width = $canvas_container.offsetWidth;
        canvas.height = $canvas_container.offsetHeight;
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

    var elements = getElements(['rendered', 'canvas', 'code', 'export', 'example_buttons', 'example_code', 'toolbar']);
    var key = 'srikumarks.github.com/demos/steller_explorer/code';

    function matches(str, re) {
        var m = str.match(re);
        return (m && m.length) || 0;
    }

    function clearMarksAt(cm, c) {
        cm.doc.findMarksAt(c).forEach(function (tm) { tm.clear(); });
    }

    function clearAllMarks(cm) {
        cm.doc.getAllMarks().forEach(function (tm) { tm.clear(); });
    }

    function markRange(cm, from, to, evalSucc) {
        cm.doc.markText(from, to, {className: evalSucc ? 'last_succ_eval' : 'last_fail_eval'});
    }

    function parenState() {
        return { paren: 0, sq: 0, brace: 0};
    }

    function parenDet(code, state) {
        state.paren += matches(code, /[\(]/g);
        state.paren -= matches(code, /[\)]/g);
        state.sq += matches(code, /[\[]/g);
        state.sq -= matches(code, /[\]]/g);
        state.brace += matches(code, /[\{]/g);
        state.brace -= matches(code, /[\}]/g);
        return state;
    }

    function codeBlockAtCursor(cm) {
        // Find out the smallest complete code block around
        // the current cursor. I approximate this by taking
        // the smallest code block where the first line and 
        // the last line do not start with white space, but
        // the rest of the lines do. Given properly indented
        // code, this is a reasonable bet, but beware in the
        // case of code that reassigns a variable but the value
        // of the variable has already been captured in closures.
        // In such cases, the change may appear to not have any
        // effect.
        var c = cm.getCursor();

        var codeContext = cm.doc.getLine(c.line);
        var startLine = c.line, endLine = c.line;
        var indentedRE = /^\s/;

        if (!indentedRE.test(codeContext)) {
            // Potentially at end or start of block.
            var brackets = parenDet(codeContext, parenState());
            if (brackets.paren > 0 || brackets.brace > 0 || brackets.sq > 0) {
                endLine = startLine + 1;
            }

            if (brackets.paren < 0 || brackets.brace < 0 || brackets.sq < 0) {
                startLine = startLine - 1;
            }
        }


        // Start from the closest line above that isn't indented.
        while (indentedRE.test(cm.doc.getLine(startLine))) {
            startLine--;
        }

        // Step each line from the starting line and count brackets.
        // Stop when you reach a line that matches enough brackets.
        // TODO: Ignore comments in the code that contain brackets.
        brackets = parenDet(cm.doc.getLine(startLine), parenState());
        endLine = startLine;
        while (brackets.paren > 0 || brackets.sq > 0 || brackets.brace > 0) {
            endLine++;
            parenDet(cm.doc.getLine(endLine), brackets);
        }

        var rangeL = {line: startLine, ch: 0};
        var rangeR = cm.doc.posFromIndex(cm.doc.indexFromPos({line: endLine + 1, ch: 0}) - 1);
        clearAllMarks(cm);
        markRange(cm, rangeL, rangeR, true);
        return cm.doc.getRange(rangeL, rangeR);
    }

    // A "code run" is a chunk of code that needs to be evaluated
    // "now". A code run is recorded along with a time stamp so
    // that such runs can be replayed (in the future).
    function recordCodeRun(cm, code) {
        try {
            var rec = $recording_in_progress;
            evalCode(code);
            if (rec && rec === $recording_in_progress) {
                $recording.push({time: window.performance.now(), code: code});
                localStorage['steller_explorer.recording'] = JSON.stringify($recording);
            }
        } catch (e) {
            var m = cm.findMarksAt(cm.getCursor());
            if (m.length > 0) {
                var range = m[0].find();
                clearAllMarks(cm);
                markRange(cm, range.from, range.to, false);
            }
            console.log(e);
        }
    }

    // Setup the code editor.
    elements.code.value = document.querySelector('#example_code textarea').value; // Load instructions example.
    var canvasCode = CodeMirror.fromTextArea(elements.code, {theme: 'solarized dark', continueComments: true});
    function autoResizeCodeArea(event) {
        canvasCode.setSize('420pt', (window.innerHeight - 24) + 'px');
    }
    window.addEventListener('load', autoResizeCodeArea);
    window.addEventListener('resize', autoResizeCodeArea);
//    canvasCode.addWidget(CodeMirror.Pos(0,0), elements.toolbar, false);
//    canvasCode.addLineWidget(0, elements.toolbar, {above: true});
    var keyMap = Object.create(CodeMirror.keyMap.default);
    keyMap['Alt-Enter'] = function (cm) {
        var code = cm.somethingSelected() ? cm.getSelection() : codeBlockAtCursor(cm);
        recordCodeRun(cm, code);
    };
    CodeMirror.keyMap['steller_explorer'] = keyMap;
    canvasCode.setOption('keyMap', 'steller_explorer');
//    canvasCode.setSize(null, 600);
    canvas = elements.canvas;
    context = canvas.getContext('2d');
    canvasCode.setOption('lineNumbers', true);

    function paramsAtPos(cm, pos) {
        var token = cm.getTokenAt(pos);
        var path = [];
        while (token.className === 'property') {
            path.unshift(token.string);
            pos.ch = token.start;
            token = cm.getTokenAt(pos);
            if (token.string === '.') {
                pos.ch = token.start;
                token = cm.getTokenAt(pos);
            }
        }

        if (token.className === 'variable') {
            path.unshift(token.string);
        }
        
        var params = [];

        if (path.length == 0) {
            return params;
        }

        var obj = path.reduce(function (acc, key) { return acc && acc[key]; }, window);


        if (obj && obj instanceof org.anclab.steller.Param) {
            // This is itself a param. So only one param to display.
            params.push({label: path.join('.'), param: obj});
            return params;
        }

        if (obj) {
            // Find all members of this object that are Param instances.
            var key, param;
            for (key in obj) {
                param = obj[key];
                if (param && param instanceof org.anclab.steller.Param) {
                    params.push({label: key, param: param});
                }
            }
        }

        return params;
    }

    var sliderPanelElement = (function () {
        var e = document.createElement('div');
        e.style.position = 'fixed';
        e.style.background = '#608b96';
        e.style.borderRadius = '5px';
        e.style.zIndex = 100;
        e.style.display = 'table';
        e.style.padding = '3pt';
        e.hidden = true;
        document.body.appendChild(e);
        return e;
    }());

    function hideAllSliders() {
        var sliders = sliderPanelElement.querySelectorAll('div');
        var i, N;
        for (i = 0, N = sliders.length; i < N; ++i) {
            sliders[i].style.display = 'none';
        }
    }

    function showSliderForParam(p, dispName) {
        if (!p.slider) {
            var d = document.createElement('div');
            var slider = document.createElement('input');
            slider.setAttribute('type', 'range');
            slider.setAttribute('min', '0.0');
            slider.setAttribute('max', '1.0');
            slider.setAttribute('step', '0.01');
            slider.style.display = 'table-cell';
            slider.style.marginLeft = '5pt';
            slider.style.marginRight = '5pt';
            p.bind(slider, $steller_scheduler);
            var name = document.createElement('span');
            name.innerHTML = dispName + ': ';
            name.style.fontFamily = 'sans-serif';
            name.style.fontWeight = 'bold';
            name.style.display = 'table-cell';
            name.style.textAlign = 'right';

            var t = document.createElement('span');
            d.appendChild(name);
            d.appendChild(slider);
            d.appendChild(t);
            p.watch(function (val) {
                t.innerHTML = ' ' + (Math.round(100 * val)/100);
            });
            p.slider = d;
            t.innerHTML = ' ' + (Math.round(100 * p.value)/100);
            t.style.display = 'table-cell';
            
            sliderPanelElement.appendChild(d);
        }

        p.slider.style.display = 'table-row';
    }

    canvasCode.on('cursorActivity', function (cm) {
        var token = cm.getTokenAt(cm.getCursor());

        var ps = paramsAtPos(cm, cm.getCursor());
        if (ps && ps.length > 0) {
            hideAllSliders();
            for (var i = 0, N = ps.length; i < N; ++i) {
                showSliderForParam(ps[i].param, ps[i].label);
            }
            xy = cm.cursorCoords();
            sliderPanelElement.style.display = 'table';
            sliderPanelElement.style.left = xy.left + 'px';
            sliderPanelElement.style.bottom = (window.innerHeight - xy.top + 8) + 'px';
            return;
        }

        sliderPanelElement.style.display = 'none';
    });

    var codeChangeTime = Date.now();
    var debounceTime = 300;
    var codeUpdateTimer = setTimeout(run, 0);
    var codeIsValid = true;

    canvasCode.on('change', function (cm) {
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

        codeUpdateTimer = setTimeout(run, debounceTime, cm);
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


    // Delay the load operation till everything is ready.
    loadLastSavedCode();
    window.addEventListener('load', load);

    function run(cm) {
        try {
            // Previously I had the changed block evaluate automatically,
            // but this is in general problematic and it is better for
            // the user to initiate evaluate using Alt-Enter, in which case
            // the code block is determined automatically.
            //
            //recordCodeRun(codeBlockAtCursor(cm));
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
                canvasCode.doc.setValue(imgCode);
                clearTimeout(codeUpdateTimer);
                codeUpdateTimer = setTimeout(run, 0);
            }
        };
        img.imageCode = imgCode;
        img.recording = rec;

        r.insertBefore(img, r.childNodes.length > 0 ? r.childNodes[0] : null);
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
            $steller_scheduler.running = false;
            for (i = savedImageCode.length - 1; i >= 0; --i) {
                evalCode(savedImageCode[i].code);
                saveImage(savedImageCode[i].code, savedImageCode[i].recording);
            }
            $steller_scheduler.cancel();
            $steller_scheduler.running = true;
        }
        loadLastSavedCode();
    }

    function loadLastSavedCode() {
        if (localStorage[key]) {
            // Load the latest code saved.
            var cr = JSON.parse(localStorage[key]);
            canvasCode.doc.setValue(cr.code);
            localStorage['steller_explorer.recording'] = JSON.stringify(cr.recording);
        }
    }

    function setupExamples() {
        function setupExample(name, code) {
            var o = document.createElement('option');
            o.setAttribute('value', code);
            o.innerHTML = name;
            elements.example_buttons.appendChild(o);
        }

        var exs = elements.example_code.getElementsByTagName('textarea');
        var N = exs.length;
        var i, ex;
        for (i = 0; i < N; ++i) {
            ex = exs[i];
            setupExample(ex.dataset.name, ex.value);
        }
        elements.example_buttons.addEventListener('change', function (event) {
            canvasCode.doc.setValue(event.target[event.target.selectedIndex].getAttribute('value'));
        });
    }

    setupExamples();
}());

