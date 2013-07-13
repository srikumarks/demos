
window.requestAnimationFrame =  window.requestAnimationFrame || 
                                window.webkitRequestAnimationFrame || 
                                window.mozRequestAnimationFrame ||
                                function (fn) { setTimeout(fn, 15); };


(function () {
    var Carnot = org.sriku.Carnot;

    function getElements(array) {
        var obj = {};
        array.forEach(function (id) {
            obj[id] = document.getElementById(id);
        });
        return obj;
    }

    var elements = getElements(['render_area', 'code', 'toolbar']);
    var key = 'sriku.org/demos/carnot_demo/notation';

    // Setup the code editor.
    var notation = CodeMirror.fromTextArea(elements.code, {theme: 'solarized dark', continueComments: true});
    function autoResizeCodeArea(event) {
        notation.setSize('420pt', (window.innerHeight - 24) + 'px');
    }
    window.addEventListener('load', autoResizeCodeArea);
    window.addEventListener('resize', autoResizeCodeArea);
    notation.setOption('lineNumbers', false);

    notation.on('cursorActivity', function (cm) {
    });

    var codeChangeTime = Date.now();
    var debounceTime = 300;
    var codeUpdateTimer = setTimeout(run, 0);
    var codeIsValid = true;

    notation.on('change', function (cm) {
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
            var n = store(notation.getValue());
            var svg = render(n);
            elements.render_area.innerHTML = '';
            elements.render_area.insertBefore(svg, null);
            codeIsValid = true;
        } catch (e) {
            // Ignore errors
            codeIsValid = false;
        }
    }

    function store(code) {
        localStorage[key] = code;
        return code;
    }

    function load() {
        loadLastSavedCode();
    }

    function render(code) {
        return Carnot.renderNotation(code);
    }

    function loadLastSavedCode() {
        if (key in localStorage) {
            // Load the latest code saved.
            notation.doc.setValue(localStorage[key]);
        }
    }
}());

