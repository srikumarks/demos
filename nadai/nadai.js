(function (steller) {
    var AC = new webkitAudioContext();
    AC.createGainNode(); // Starts the time running.

    var sh = new steller.Scheduler(AC);
    var models = steller.Models(sh);
    var storageKey = "nishabdam.utilities.nadai";

    var defaults = {
        version: 2,
        tempo: 1,
        nadai: 0,
        tuning: 60
    };

    var settings = load(defaults);

    // Design:
    //
    // The display stage consists of a background layer containing the floor
    // on which three balls bounce. These balls are called "batons" since they
    // bounce to musical time. The 'baton' is the main baton, the 'pulseBaton'
    // indicates nadai subdivisions using patterns and the 'contpulseBaton' 
    // bounces on all nadai subdivisions and not just those indicated by the
    // pattern being played.
    //
    var stage, background, ballsLayer;
    var baton, pulseBaton, contpulseBaton;

    function setupStage() {
        stage = new Kinetic.Stage({
            container: 'bouncingBalls',
            width: 240,
            height: 240
        });
        background = new Kinetic.Layer({name: 'background'});

        // The "floor" on which the batons bounce.
        background.add(new Kinetic.Line({points: [0, 230, 360, 230], stroke: 'black', strokeWidth: 4}));
        stage.add(background);

        // A layer for the bouncing balls .. a.k.a. "batons".
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

                // Update param
                param.value = i;
            };
        });

        // Also update UI when a param changes.
        param.watch(function (v) {
            options[v].onclick();
            settings[param.spec.key] = v;
            store(settings);
        });
    }

    // The main nadai parameter controlled by the Nadai selector menu.
    var nadai = steller.Param({min: 0, max: 6, key: 'nadai', value: settings.nadai});

    // Setup the tempo GUI. This involves binding the tempo slider to the 'rate'
    // parameter and also updating the displayed tempo vlaue.
    var rate = steller.Param({min: 1/4, max: 4, key: 'tempo', mapping: 'log', value: settings.tempo});
    rate.bind('#tempo', sh);
    var tempo_display = document.querySelector('#tempo_display');
    rate.watch(function (v) {
        tempo_display.innerText = Math.round(v * 60);
        settings.tempo = v;
        store(settings);
    });
    tempo_display.innerText = Math.round(rate.value * 60);
    
    // Setup the tuning.
    var tuning = steller.Param({min: 48, max: 72, value: settings.tuning});
    var tuningElem = document.querySelector('#tuning');
    var tuningNameElem = document.querySelector('#tuning_display');
    tuningElem.addEventListener('change', function (e) {
        tuning.value = Math.round(parseFloat(this.value));
        tuningMainL.value = tuning.value + 36;
        tuningMainR.value = tuning.value + 43;
        tuningPulse.value = tuning.value + 24;
        tuningContPulse.value = tuning.value + 48;
        tuningNameElem.innerText = tuningNames[60 + tuning.value % 12] + (5 + Math.floor((tuning.value - 60) / 12));
        settings.tuning = tuning.value;
        store(settings);
    });
    var tuningMainL = steller.Param({min: 60, max: 108, value: settings.tuning+36});
    var tuningMainR = steller.Param({min: 60, max: 108, value: settings.tuning+43});
    var tuningPulse = steller.Param({min: 60, max: 108, value: settings.tuning+24});
    var tuningContPulse = steller.Param({min: 60, max: 108, value: settings.tuning+48});
    var tuningNames = {
        60: 'C', 61: 'C#', 62: 'D', 63: 'D#', 64: 'E', 65: 'F', 66: 'F#', 67: 'G', 68: 'G#', 69: 'A', 70: 'A#', 71: 'B'
    };
    tuningNameElem.innerText = tuningNames[60 + tuning.value % 12] + (5 + Math.floor((tuning.value - 60) / 12));

    var randomnad = document.getElementById('randomnad');
    var randompat = document.getElementById('randompat');

    setupMenu('div#nadai', nadai);

    // A nadai can be shown using various rhythmic patterns.
    // These patterns are represented as sequences of stress
    // and non-stress. The pulseBaton will bounce on the stress
    // parts and travel during the non-stress parts. The patterns
    // are all considered as looping.
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
        // Array of numbers indicating which pattern was the last chosen one
        // for each nadai. patternNumbers[nadai] = index of chosen pattern.

    var patternNode = document.getElementById('patternText');
    
    function pattern(n,p) {
        if (arguments.length < 1) {
            n = nadai.value;
        }
        if (arguments.length < 2) {
            p = patternNumbers[n];
        }
        return nadaiTypes[n].patterns[p];
    }

    function displayPattern(n,p) {
        if (arguments.length < 1) {
            n = nadai.value;
        }
        if (arguments.length < 2) {
            p = patternNumbers[n];
        }
        patternNode.innerHTML = document.querySelectorAll('div#nadai span')[n].innerHTML + '<br/><br/>' + pattern(n,p);
    }
    
    // Display the current pattern whenever the nadai changes.
    nadai.watch(function () { displayPattern(); });

    // Upon change of pattern using the "Next pattern" button, cycle
    // through the list of patterns available for the current nadai.
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

    // Synchronization objects. 
    //
    // The 'sync' object placed at a point where we allow nadai change
    // to happen and the 'gate' object is placed at a point we can
    // terminate one composition in order to transition to another.
    // In this case though, their use is trivial and the sync and gate
    // objects occur in sequence at the beginning of every nadai cycle.
    var change = {sync: sh.sync(), gate: sh.gate()};

    // Prepare an action - the "randomNadaiChange" - which when
    // fired will result in the nadai changing to some other one
    // randomly. This change has to happen one cycle in advance
    // of the point at which the nadai actually changes, so that
    // the viewer is given some indication of the next nadai to
    // prepare for it. This is useful for practice purposes.
    var randomNadaiChanger = (function () {

        var randomNadaiChangeCounter = 0;

        return sh.fire(function () {
            var currNadai, newNadai, newPat;
            if ((randomNadaiChangeCounter % 4) === 0) {
                if (randomnad.checked) {
                    // Choose a new nadai and pattern.
                    currNadai = nadai.value;
                    newNadai = rand(nadaiTypes.length, nadai.value);
                    newPat = rand(nadaiTypes[newNadai].patterns.length, patternNumbers[newNadai]);
                    patternNumbers[newNadai] = randompat.checked ? newPat : 0;
                    nadai.value = newNadai;
                } else if (randompat.checked) {
                    // Compute a new pattern to switch to.
                    currNadai = nadai.value;
                    newPat = rand(nadaiTypes[currNadai].patterns.length, patternNumbers[currNadai]);

                    // Display the new choice.
                    displayPattern(currNadai, newPat);

                    // Schedule a pattern change.
                    change.sync.play(sh.fire(function () {
                        // Make sure the nadai didn't change in the interval
                        // between the random pattern change and when the 
                        // scheduled change runs.
                        if (nadai.value === currNadai) {
                            patternNumbers[currNadai] = newPat;
                        }
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

        // Make the left->right bounce animation over a duration of
        // 1 second. We use 1 second as the base time unit for the cycle.
        // This will automatically scale depending on the clock rate 
        // value decided by the tempo slider.
        var mainBatonAnimLR = sh.frames(1, bounce(baton, -50, 50, base-2-5, h));

        // Make the right->left bounce animation.
        var mainBatonAnimRL = sh.frames(1, bounce(baton, 50, -50, base-2-5, h));

        // Compute the pulse baton animation. This baton doesn't move left
        // or right and just bounces in the same place. However, at this point
        // in the code, we don't yet know the duration of its bounce, which will
        // be decided in the pulse(i) function.
        var pulseBatonAnim = bounce(pulseBaton, 0, 0, base-2-5, h);
        
        // The overall structure of the nadai cycle is described by this
        // "main" track, which consists of a left->right bounce followed
        // by a right->left bounce and hence is 2 seconds long at 60bpm.
        var main = sh.track([
                chimeMain.play(tuningMainL, 0.25),
                mainBatonAnimLR,
                chimeMain.play(tuningMainR, 0.25),
                mainBatonAnimRL
                ]);

        var pulseChime = chimeSub.play(tuningPulse, 0.25);
        var pulseDelay = sh.delay(1/count);

        function pulse(i) {
            // Save the nadai and don't let it change for the pattern
            // only.
            var currNadai = nadai.value;

            // Respond to pattern changes immediately. We need
            // to determine the bounce duration depending on
            // the pattern chosen though.
            return sh.dynamic(function () {
                var p = pattern(currNadai);
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
        }

        // The pulse that bounces according to the current pattern.
        var pulseTrk = sh.track(gen(0, count * 2, pulse));

        // The continuous pulse baton. This bounces on every 1/count interval.
        var contPulse = sh.repeat(count * 2,
                sh.track([
                    chimeSub.play(tuningContPulse, 0.1), 
                    sh.frames(1/count, bounce(contpulseBaton, -100, -100, base-2-5, 0.5 * h))
                    ]));

        return sh.loop(sh.track([
                    change.sync,
                    change.gate,
                    randomNadaiChanger,
                    sh.spawn([main, pulseTrk, contPulse]),
                    sh.delay(2)
                    ]));
    }

    // Bounces the given baton for the given duration from x1 to x2, 
    // over the given height relative to the base position given by y0.
    function bounce(baton, x1, x2, y0, height) {
        var midx = 0.5 * stage.getWidth();
        return function (clock, t1r, t2r, tStart, tEnd, r) {
            var dt = Math.min(t2r, tEnd) - t1r;
            var f = Math.max(0, Math.min(1, (t1r - tStart) / (tEnd - tStart - dt)));
            var hfrac = 4 * f * (1 - f);
            var y = hfrac * height * Math.atan((tEnd - tStart - dt) / r) / (Math.PI / 2);
            var x = (x1 + f * (x2 - x1)) * Math.atan(1/r) / (Math.PI/2);
            baton.setX(midx + x);
            baton.setY(y0 - y);
        };
    }

    // Start the draw loop.
    steller.requestAnimationFrame(function draw() {
        stage.draw();
        steller.requestAnimationFrame(draw);
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
        settings.version = defaults.version;
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
