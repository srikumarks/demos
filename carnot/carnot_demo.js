
window.requestAnimationFrame =  window.requestAnimationFrame || 
                                window.webkitRequestAnimationFrame || 
                                window.mozRequestAnimationFrame ||
                                function (fn) { setTimeout(fn, 15); };


function Diacritics(cm, panel_id) {
    var Suffix = {
        normal: "",
        overline: String.fromCharCode(parseInt("0304", 16)),
        underline: String.fromCharCode(parseInt("0331", 16)),
        overdot: String.fromCharCode(parseInt("0307", 16)),
        overddot: String.fromCharCode(parseInt("0308", 16)),
        breve: String.fromCharCode(parseInt("0301", 16)),
        tilde: String.fromCharCode(parseInt("0303", 16)),
        underdot: String.fromCharCode(parseInt("0323", 16)),
        underddot: String.fromCharCode(parseInt("0324", 16))
    };

    var Ids = Object.keys(Suffix);

    var elements = {};
    Ids.forEach(function (k) {
        elements[k] = document.getElementById(k);
    });
    
    // A single string containing all the suffixes.
    var Suffixes = Ids.map(function (k) { return Suffix[k]; }).join('');
    var SuffixedRE = new RegExp('^[A-Za-z][' + Suffixes + ']?$');
     
    function accentableSelection(cm) {
        if (!cm.doc.somethingSelected()) {
            return false;
        }

        return SuffixedRE.test(cm.doc.getSelection());
    }

    // Displays the accented characters.
    function showChars(c) {
        if (c && !/\s/.test(c)) {
            Ids.forEach(function (id) {
                elements[id].innerText = c + Suffix[id];
            });
        }
    }
    
    // Changes the diacritic for the current selection character.
    // The diacritic is identified by its id name.
    function setAccent(cm, id) {
        var str = cm.doc.getSelection();

        // Edit the string.
        cm.doc.replaceSelection(str.charAt(0) + Suffix[id]);

        flash(id);
    }

    function flash(id) {
        elements[id].style.backgroundColor = '#8f8f8f';
        setTimeout(function () {
            elements[id].style.backgroundColor = '#cfcfcf';
        }, 90);
    }
        
    function init(cm, panel_id) {
       var panel = document.getElementById(panel_id);
        
        var accentKeyMap = Object.create(CodeMirror.keyMap.default);
        function makeAccentKeyHandler(key, id) {
            return function (cm) {
                if (!panel.hidden) {
                    setAccent(cm, id);
                } else {
                    return CodeMirror.Pass;
                }
            };
        }

        accentKeyMap['1'] = makeAccentKeyHandler('1', 'normal');
        accentKeyMap['2'] = makeAccentKeyHandler('2', 'overline');
        accentKeyMap['3'] = makeAccentKeyHandler('3', 'underline');
        accentKeyMap['4'] = makeAccentKeyHandler('4', 'breve');
        accentKeyMap['5'] = makeAccentKeyHandler('5', 'tilde');
        accentKeyMap['6'] = makeAccentKeyHandler('6', 'overdot');
        accentKeyMap['7'] = makeAccentKeyHandler('7', 'overddot');
        accentKeyMap['8'] = makeAccentKeyHandler('8', 'underdot');
        accentKeyMap['9'] = makeAccentKeyHandler('9', 'underddot');

        CodeMirror.keyMap['diacritics'] = accentKeyMap;
        cm.setOption('keyMap', 'diacritics');

        cm.on('cursorActivity', function (cm) {
            if (accentableSelection(cm)) {
                var xy = cm.cursorCoords();
                panel.hidden = false;
                panel.style.left = Math.max(0, Math.min(400, xy.left)) + 'px';
                panel.style.bottom = (window.innerHeight - xy.top + 8) + 'px';
                showChars(cm.doc.getSelection().charAt(0));
            } else {
                panel.hidden = true;
            }
        });

        return Diacritics;
    }
    
    init(cm, panel_id);

    return Diacritics;
}

(function () {
    var Carnot = org.sriku.Carnot;

    function getElements() {
        var q = document.querySelectorAll('[id]');
        var obj = {}, i, N;
        for (i = 0, N = q.length; i < N; ++i) {
            obj[q[i].getAttribute('id')] = q[i];
        }
        return obj;
    }

    var elements = getElements();
    var key = 'sriku.org/demos/carnot_demo/notation';
    
    elements.newdoc.onclick = function () {
        store(notation.getValue());
        notation.doc.setValue('');
    };

    elements.print.onclick = function () {
        var w = window.open(null, 'print', 'width=640,height=480');
        w.document.body.innerHTML = elements.render_area.innerHTML;
        w.print();
    };

    // Setup the code editor.
    var notation = CodeMirror.fromTextArea(elements.code, {
        theme: 'solarized dark', 
        continueComments: true
    });
    function autoResizeCodeArea(event) {
        notation.setSize('420pt', (window.innerHeight - 24) + 'px');
    }
    window.addEventListener('load', autoResizeCodeArea);
    window.addEventListener('resize', autoResizeCodeArea);
    notation.setOption('lineNumbers', false);

    Diacritics(notation, 'diacritics_panel');

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
    var ShowdownConverter = new Showdown.converter();

    function run(cm) {
        try {
            // Previously I had the changed block evaluate automatically,
            // but this is in general problematic and it is better for
            // the user to initiate evaluate using Alt-Enter, in which case
            // the code block is determined automatically.
            //
            //recordCodeRun(codeBlockAtCursor(cm));
            var n = notation.getValue();
            var html = ShowdownConverter.makeHtml(n);
            var div = document.createElement('div');
            div.innerHTML = html;
            debugger;
            Carnot.renderSections(Carnot.findSections(div), Carnot.scanStyle(div));
            elements.render_area.innerHTML = '';
            elements.render_area.insertBefore(div, null);
            codeIsValid = true;
            store(n);
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

