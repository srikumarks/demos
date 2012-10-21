(function (steller) {
    var AC = new webkitAudioContext();
    var sh = new steller.Scheduler(AC, {diagnostics: true});
    var models = steller.Models(sh);
    var storageKey = "nishabdam.utilities.tala";

    var defaults = {
        version: 2,
        tempo: 1,
        tala: 4,
        jati: 0,
        nadai: 0,
        kalai: 0,
        speed: 0,
        tuning: 60
    };

    var settings = load(defaults);

    var stage, baton, pulseBaton;

    function setupStage() {
        stage = new Kinetic.Stage({
            container: 'anim',
            width: 240,
            height: 240
        });

        var bkg = new Kinetic.Layer({name: 'bkg'});
        bkg.add(new Kinetic.Line({points: [0, 230, 360, 230], stroke: 'black', strokeWidth: 4}));
        stage.add(bkg);

        var ballsLayer = new Kinetic.Layer({name: 'balls'});
        ballsLayer.add(baton = new Kinetic.Circle({x: 60, y: 290, radius: 5, fill: 'black'}));
        ballsLayer.add(pulseBaton = new Kinetic.Circle({x: 60, y: 290, radius: 5, fill: 'black'}));
        stage.add(ballsLayer);

        sh.ontick = function () { stage.draw(); };
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

    var tala = steller.Param({min: 0, max: 6, key: 'tala', value: settings.tala});
    var jati = steller.Param({min: 0, max: 4, key: 'jati', value: settings.jati});
    var nadai = steller.Param({min: 0, max: 4, key: 'nadai', value: settings.nadai});
    var kalai = steller.Param({min: 0, max: 3, key: 'kalai', value: settings.kalai});
    var speed = steller.Param({min: 0, max: 2, key: 'speed', value: settings.speed});
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
    var tuning = steller.Param({min: 36, max: 84, value: settings.tuning});
    var tuningElem = document.querySelector('#tuning');
    var tuningNameElem = document.querySelector('#tuning_display');
    tuningElem.addEventListener('change', function (e) {
        tuning.value = Math.round(parseFloat(this.value));
        displayTuning();
        settings.tuning = tuning.value;
        store(settings);
    });
    tuningElem.value = tuning.value;
    var tuningMainPa = steller.Param({min: 60, max: 108, getter: function () { return tuning.value + 43; }});
    var tuningMainSa = steller.Param({min: 60, max: 108, getter: function () { return tuning.value + 36; }});
    var tuningMainSa2 = steller.Param({min: 60, max: 108, getter: function () { return tuning.value + 48; }});
    var tuningAksh = steller.Param({min: 60, max: 108, getter: function () { return tuning.value + 36; }});
    var tuningSub = steller.Param({min: 60, max: 108, getter: function () { return tuning.value + 24; }});
    var tuningGong = steller.Param({min: 60, max: 108, getter: function () { return tuning.value + 12; }});
    var tuningNames = {
        60: 'C', 61: 'C#', 62: 'D', 63: 'D#', 64: 'E', 65: 'F', 66: 'F#', 67: 'G', 68: 'G#', 69: 'A', 70: 'A#', 71: 'B'
    };
    function displayTuning() {
        tuningNameElem.innerText = tuningNames[60 + tuning.value % 12] + (5 + Math.floor((tuning.value - 60) / 12));        
    }
    displayTuning();
    
    setupMenu('div#tala', tala);
    setupMenu('div#jati', jati);
    setupMenu('div#nadai', nadai);
    setupMenu('div#speed', speed);
    setupMenu('div#kalai', kalai);

    //////////////////////////////////////////////
    // Buttons for setting common talas.
    // They only touch the tala type and jati, leaving
    // other settings intact.

    $('com_adi').onclick = function () {
        tala.value = 4;
        jati.value = 0;
    };

    $('com_rupaka').onclick = function () {
        tala.value = 2;
        jati.value = 0;
    };

    $('com_mcapu').onclick = function () {
        tala.value = 4;
        jati.value = 1;
    };

    $('com_ata').onclick = function () {
        tala.value = 5;
        jati.value = 3;
    };

    var talaTypes = ['ldll', 'ldl', 'dl', 'lad', 'ldd', 'lldd', 'l'];
    var jatiTypes = [4, 3, 7, 5, 9];
    var nadaiTypes = [4, 3, 7, 5, 9];
    var kalaiTypes = [1, 2, 4, 8];
    var speedTypes = [1, 2, 4];

    var chimeMain = models.chime();
    chimeMain.connect(AC.destination);
    chimeMain.halfLife.value *= 3;
    chimeMain.attackTime.value = 0;
    
    var chimeAksh = models.chime();
    chimeAksh.connect(AC.destination);
    chimeAksh.halfLife.value *= 0.5;
    chimeAksh.attackTime.value = 0;
    
    var chimeSub = models.chime();
    chimeSub.connect(AC.destination);
    chimeSub.halfLife.value *= 0.1;
    chimeSub.attackTime.value = 0;

    var change = {sync: sh.sync(), gate: sh.gate()};

    function makeTala(change) {
        var pattern = Array.prototype.slice.call(talaTypes[tala.value], 0).map(function (ang) {
            switch (ang) {
                case 'l': return jatiTypes[jati.value];
                case 'd': return 2;
                case 'a': return 1;
            }
        });

        var ticksPerAksh = nadaiTypes[nadai.value];
        var aksh = sum(pattern);
        var ticksPerAng = pattern.map(function (ang) { return ang * ticksPerAksh; });
        var ticksPerAvrt = sum(ticksPerAng);
        var kalaiFactor = kalaiTypes[kalai.value];
        var speedFactor = speedTypes[speed.value];

        var i, tracks = [];
        var mainTrk = sh.track(pattern.map(function (p, i) {
            return sh.track([
                change.gate, 
//                chimeMain.play(tuningMainPa, 0.25), 
                chimeMain.play(tuningMainSa, 0.25), 
                chimeMain.play(tuningMainSa2, 0.25), 
                (i === 0 ? chimeMain.play(tuningGong, 0.25) : sh.cont),
                sh.delay(p * kalaiFactor)
                ]);
        }));
        var base = stage.getHeight() - 10;
        var h = base * 0.5;
        var left2right = bounce(baton, kalaiFactor, -50, 50, base-2-5, h, 0.25);
        var right2left = bounce(baton, kalaiFactor, 50, -50, base-2-5, h, 0.25);
        var left2left = bounce(baton, kalaiFactor, -50, -50, base-2-5, h, 0.25);
        var right2right = bounce(baton, kalaiFactor, 50, 50, base-2-5, h, 0.25);
        var akshTrk = sh.track(pattern.map(function (p) {
            return sh.track(gen(0, p, function (i) {
                var b = (i === 0 ? (i + 1 < p ? left2right : left2left) : (i + 1 === p ? right2left : right2right));
                return sh.track([change.sync, change.gate, chimeAksh.play(tuningAksh, 0.25), sh.spawn(b), sh.delay(kalaiFactor)]);
            }));
        }));
        var pulseBounce = bounce(pulseBaton, speedFactor / ticksPerAksh, 0, 0, base-2-5, 0.75 * h, 1);
        var pulseTrk = sh.track(gen(0, aksh * ticksPerAksh * kalaiFactor, function (i) {
            return sh.track([
//                change.sync,
                (i % 1 === 0 ? change.gate : sh.cont),
                chimeSub.play(tuningSub, 0.25), 
                sh.spawn(pulseBounce),
                sh.delay(speedFactor / ticksPerAksh)
                ]);
        }));
        tracks.push(sh.track(gen(0, speedFactor, function (i) { return mainTrk; })));
        tracks.push(sh.track(gen(0, speedFactor, function (i) { return akshTrk; })));
//        tracks.push(sh.track(gen(0, speedFactor, function (i) { return kalaiTrk; })));
        tracks.push(pulseTrk);
        
        return sh.loop(sh.fork(tracks));
    }

    // Bounces the given baton (or conductor) for the given duration
    // over the given height. 
    function bounce(baton, duration, x1, x2, y0, height, pow) {
        var midx = 0.5 * stage.getWidth();
        return sh.frames(duration, 
                        function (clock, t1r, t2r, tStart, tEnd, r) {
                            //tEnd = Math.max(clock.t2r, tEnd);
                            var dt = Math.min(t2r, tEnd) - t1r;
                            var f = Math.max(0, Math.min(1, (t1r - tStart) / (tEnd - tStart - dt)));
                            var y = Math.pow(tEnd - tStart - dt, pow || 1) * 3 * height * f * (1 - f) / Math.max(0.7, r);
                            var x = (x1 + f * (x2 - x1)) / Math.max(1, r);
                            baton.setX(midx + x);
                            baton.setY(y0 - y);
                        });
    }


    function onchange() {
        var newChange = {sync: sh.sync(), gate: sh.gate()};
        change.sync.play(sh.track(change.gate.close, sh.rate(rate), makeTala(newChange)));
        change = newChange;
    }

    tala.watch(onchange);
    jati.watch(onchange);
    nadai.watch(onchange);
    kalai.watch(onchange);
    speed.watch(onchange);

    sh.play(sh.track(sh.rate(rate), sh.delay(0.1), makeTala(change)));

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
        for (i = m; i < n; ++i) {
            r.push(f(i));
        }
        return r;
    }

    function sum(a) {
        return a.reduce(function (x, y) { return x + y; });
    }

    function $(id) {
        return document.getElementById(id);
    }

}(org.anclab.steller));
