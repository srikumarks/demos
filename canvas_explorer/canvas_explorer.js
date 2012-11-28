
var canvas, context;

// Evaluate the user code inside a with clause that introduces
// canvas 2d's context object. This lets the user write code
// like "fillRect(0, 0, 20, 20)" instead of "context.fillRect(0, 0, 20, 20)".
function evalCode(code) {
    with (context) {
        clearRect(0, 0, canvas.width, canvas.height);
        save();
        try {
            eval('(function () {\n' + code + '\n}())');
        } catch (e) {
            restore();
            throw e;
        }
        restore();
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
        try {
            store(saveImage(canvasCode.getValue()));
        } catch (e) {
            console.error("Bad image code. Won't save image snapshot.");
        }
    };

    load();

    function run() {
        try {
            store(evalCode(canvasCode.getValue()));
        } catch (e) {
            // Ignore errors
            console.error("Bad image code. Won't save code.");
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

