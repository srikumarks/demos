(function (steller) {
    var AC = new webkitAudioContext();
    AC.createGainNode(); // Starts the time running.

    var sh = new steller.Scheduler(AC);
    var models = steller.Models(sh);
    var storageKey = "nishabdam.utilities.nadai";

    var defaults = {
        version: 1,
        tempo: 1,
        nadai: 0
    };

    var settings = load(defaults);

    var stage, background, ballsLayer;
    var baton, pulseBaton, contpulseBaton;

    function setupStage() {
        stage = new Kinetic.Stage({
            container: 'bouncingBalls',
            width: 240,
            height: 240
        });
        background = new Kinetic.Layer({name: 'background'});
        background.add(new Kinetic.Line({points: [0, 230, 360, 230], stroke: 'black', strokeWidth: 4}));
        stage.add(background);
        ballsLayer = new Kinetic.Layer({name: 'balls'});
        ballsLayer.add(baton = new Kinetic.Circle({x: 60, y: 290, radius: 5, fill: 'black'}));
        ballsLayer.add(pulseBaton = new Kinetic.Circle({x: 60, y: 290, radius: 5, fill: 'red'}));
        ballsLayer.add(contpulseBaton = new Kinetic.Circle({x: 5, y: 290, radius: 5, fill: 'gray'}));

        stage.add(ballsLayer);
    }

    setupStage();

    function setupMenu(selector, param) {
        var options = nodeArr(document.querySelectorAll(selector + ' span'));
        var selected = options[param.value];
        selected.style.fontWeight = 'bold';
        selected.style.textDecoration = 'underline';
        options.forEach(function (n, i) {
            n.onclick = function (e) {
                n.style.fontWeight = 'bold';
                n.style.textDecoration = 'underline';
                for (var j = 0, jN = options.length; j < jN; ++j) {
                    if (j !== i) {
                        options[j].style.fontWeight = 'normal';
                        options[j].style.textDecoration = 'none';
                    }
                }

                param.value = i;
            };
        });

        param.watch(function (v) {
            options[v].onclick();
            settings[param.spec.key] = v;
            store(settings);
        });
    }

    var nadai = steller.Param({min: 0, max: 6, key: 'nadai', value: settings.nadai});
    var rate = steller.Param({min: 1/4, max: 4, key: 'tempo', mapping: 'log', value: settings.tempo});
    rate.bind('#tempo');
    var tempo_display = document.querySelector('#tempo_display');
    rate.watch(function (v) {
        tempo_display.innerText = Math.round(v * 60);
        settings.tempo = v;
        store(settings);
    });
    tempo_display.innerText = Math.round(rate.value * 60);
    var randomnad = document.getElementById('randomnad');
    var randompat = document.getElementById('randompat');

    setupMenu('div#nadai', nadai);

    var nadaiTypes = [
    { div: 2, patterns: ['xx', '-x'] },
    { div: 4, patterns: ['xxxx', '-x-x', '-x--', '--x-', '---x'] },
    { div: 3/2, patterns: ['xxx', 'xx-', 'x-x', '-xx', '-x-', '--x'] },
    { div: 3, patterns: ['xxx', 'xx-', 'x-x', '-xx', '-x-', '--x'] },
    { div: 6, patterns: ['xxx', 'x-', '-x', 'xx-', 'x-x', '-xx', '-x-', '--x'] },
    { div: 5/2, patterns: ['xxxxx','x-x--', 'x--x-', 'x---x', 'xx---'] },
    { div: 5, patterns: ['xxxxx','x-x--', 'x--x-', 'x---x', 'xx---'] },
    { div: 7/2, patterns: ['xxxxxxx', 'x--x-x-', 'x--x---', 'x---x--', 'x-x-x--'] },
    { div: 7, patterns: ['xxxxxxx', 'x--x-x-', 'x--x---', 'x---x--', 'x-x-x--'] },
    { div: 9/2, patterns: ['xxxxxxxxx','x---x-x--', 'x---x--x-', 'x-x--x-x-', 'x--x-x-x-', 'x--x--x--'] },
    { div: 9, patterns: ['xxxxxxxxx','x---x-x--', 'x---x--x-', 'x-x--x-x-', 'x--x-x-x-', 'x--x--x--'] }
    ];

    var patternNumbers = [0,0,0,0,0,0,0,0,0,0,0];
    var patternNode = document.getElementById('patternText');
    
    function pattern() {
        return nadaiTypes[nadai.value].patterns[patternNumbers[nadai.value]];
    }
    function displayPattern() {
        patternNode.innerHTML = document.querySelectorAll('div#nadai span')[nadai.value].innerHTML + '<br/><br/>' + pattern();
    }
    nadai.watch(displayPattern);
    document.getElementById('nextPattern').onclick = function () {
        patternNumbers[nadai.value] = (patternNumbers[nadai.value] + 1) % nadaiTypes[nadai.value].patterns.length;
        displayPattern();
    };
    displayPattern();


    var chimeMain = models.chime();
    chimeMain.connect(AC.destination);
    chimeMain.halfLife.value *= 1;
    chimeMain.attackTime.value = 0;
    
    var chimeSub = models.chime();
    chimeSub.connect(AC.destination);
    chimeSub.halfLife.value *= 0.2;
    chimeSub.attackTime.value = 0;

    var change = {sync: sh.sync(), gate: sh.gate()};

    var randomNadaiChanger = (function () {

        var randomNadaiChangeCounter = 0;

        return sh.fire(function () {
            if ((randomNadaiChangeCounter % 4) === 0) {
                if (randomnad.checked) {
                    change.sync.play(sh.fire(function () {
                        var n = rand(nadaiTypes.length, nadai.value);
                        if (randompat.checked) {
                            patternNumbers[n] = rand(nadaiTypes[n].patterns.length, patternNumbers[n]);
                        } else {
                            patternNumbers[n] = 0;
                        }
                        nadai.value = n;
                    }));
                } else if (randompat.checked) {
                    change.sync.play(sh.fire(function () {
                        patternNumbers[nadai.value] = rand(nadaiTypes[nadai.value].patterns.length, patternNumbers[nadai.value]);
                        displayPattern();
                    }));
                }
            }
            randomNadaiChangeCounter++;
        });
    }());

    function makeTala(change) {

        var count = nadaiTypes[nadai.value].div;
        var base = stage.getHeight() - 10;
        var h = 0.8 * base;
        var mainBatonAnimLR = sh.frames(1, bounce(baton, -50, 50, base-2-5, h));
        var mainBatonAnimRL = sh.frames(1, bounce(baton, 50, -50, base-2-5, h));
        var pulseBatonAnim = bounce(pulseBaton, 0, 0, base-2-5, h);
        
        var main = sh.track([
                change.sync,
                change.gate,
                randomNadaiChanger,
                chimeMain.play(60+36, 0.25),
                mainBatonAnimLR,
                chimeMain.play(60+43, 0.25),
                mainBatonAnimRL
                ]);

        var pulseChime = chimeSub.play(60+24, 0.25);
        var pulseDelay = sh.delay(1/count);

        var pulse = function (i) {
            // Respond to pattern changes immediately. We need
            // to determine the bounce duration depending on
            // the pattern chosen though.
            return sh.dynamic(function () {
                var p = pattern();
                var n = 1;
                var j = i % p.length;
                switch (p.charAt(j)) {
                    case 'X':
                    case 'x':
                        // Determine the duration of the bounce based on
                        // the number of hyphens following the X or x.
                        // The loop is guaranteed to terminate because
                        // we already know that p has an 'X' or 'x' in it.
                        while (p.charAt((j + n) % p.length) === '-') {
                            ++n;
                        }
                        return sh.track([pulseChime, sh.spawn(sh.frames(n/count, pulseBatonAnim)), pulseDelay]);
                    default:
                        return pulseDelay;
                }
            });
        };

        var sub = sh.track(gen(0, count * 2, function (i) {
            return sh.track([
                (i === 0 ? change.gate : sh.cont),
                pulse(i)
                ]);
        }));

        var contsub = sh.frames(1/count, bounce(contpulseBaton, -100, -100, base-2-5, 0.5 * h));
        var cp = sh.track(gen(0, count * 2, function (i) {
            return sh.track([
                (i === 0 ? change.gate : sh.cont),
                chimeSub.play(60+48, 0.1), 
                contsub
                ]);
        }));
        
        return sh.spawn([sh.loop(main), sh.loop(sub), sh.loop(cp)]);
    }

    // Bounces the given baton (or conductor) for the given duration
    // over the given height. 
    function bounce(baton, x1, x2, y0, height) {
        var midx = 0.5 * stage.getWidth();
        return function (clock, tStart, tEnd) {
            //tEnd = Math.max(clock.t2r, tEnd);
            var dt = Math.min(clock.t2r, tEnd) - clock.t1r;
            var f = Math.max(0, Math.min(1, (clock.t1r - tStart) / (tEnd - tStart - dt)));
            var r = clock.rate.valueOf();
            var hfrac = 4 * f * (1 - f);
            var y = hfrac * height * Math.atan((tEnd - tStart - dt) / r) / (Math.PI / 2);
            var x = (x1 + f * (x2 - x1)) * Math.atan(1/r) / (Math.PI/2);
            baton.setX(midx + x);
            baton.setY(y0 - y);
        };
    }

    // Start the draw loop.
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
    requestAnimationFrame(function draw() {
        stage.draw();
        requestAnimationFrame(draw);
    });

    function onchange() {
        var newChange = {sync: sh.sync(), gate: sh.gate()};
        change.sync.play(sh.track(change.gate.close, makeTala(newChange)));
        change = newChange;
    }

    nadai.watch(onchange);

    // Seems to avoid a major loud burst of sound at the start.
    setTimeout(function () {
        sh.play(sh.track(sh.rate(rate), sh.delay(0.1), makeTala(change)));
    }, 100);

    function nodeArr(nodes) {
        return Array.prototype.slice.call(nodes, 0);
    }
    

    function store(settings) {
        localStorage[storageKey] = JSON.stringify(settings);
    }
    
    function copy(src, dest) {
        for (var k in src) {
            dest[k] = src[k];
        }
    }

    function load(defaults) {
        var settings = {}
        copy(defaults, settings);
        if (localStorage[storageKey]) {
            var vals = JSON.parse(localStorage[storageKey]);
            copy(vals, settings);
        }
        return settings;
    }

    function gen(m, n, f) {
        var i, r = [];
        if (arguments.length < 3) {
            for (i = m; i < n; ++i) {
                r.push(i);
            }
        } else if (typeof f === 'function') {
            for (i = m; i < n; ++i) {
                r.push(f(i));
            }
        } else {
            for (i = m; i < n; ++i) {
                r.push(f);
            }
        }

        return r;
    }

    function sum(a) {
        return a.reduce(function (x, y) { return x + y; });
    }

    function chars(s) {
        return Array.prototype.slice.call(s, 0);
    }

    function rand(n, v) {
        if (arguments.length > 1 && n > 1) {
            return (v + 1 + Math.floor(0.9999 * Math.random() * (n - 1))) % n;
        } else {
            return Math.floor(0.9999 * Math.random() * n);
        }
    }

}(org.anclab.steller));
