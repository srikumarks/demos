(function (steller) {
    var AC = new webkitAudioContext();
    var sh = new steller.Scheduler(AC);
    var models = steller.Models(sh);
    var storageKey = "nishabdam.utilities.tala";

    var settings = {
        version: 1,
        tempo: 1,
        tala: 4,
        jati: 0,
        nadai: 0,
        kalai: 0,
        speed: 0
    };

    load();

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
            store();
        });
    }

    var tala = steller.Param({min: 0, max: 6, key: 'tala', value: settings.tala});
    var jati = steller.Param({min: 0, max: 4, key: 'jati', value: settings.jati});
    var nadai = steller.Param({min: 0, max: 4, key: 'nadai', value: settings.nadai});
    var kalai = steller.Param({min: 0, max: 3, key: 'kalai', value: settings.kalai});
    var speed = steller.Param({min: 0, max: 2, key: 'speed', value: settings.speed});
    var rate = steller.Param({min: 1/4, max: 4, key: 'tempo', mapping: 'log', value: settings.tempo});
    rate.bind('#tempo');
    var tempo_display = document.querySelector('#tempo_display');
    rate.watch(function (v) {
        tempo_display.innerText = Math.round(v * 60);
        settings.tempo = v;
        store();
    });
    tempo_display.innerText = Math.round(rate.value * 60);

    setupMenu('div#tala', tala);
    setupMenu('div#jati', jati);
    setupMenu('div#nadai', nadai);
    setupMenu('div#speed', speed);
    setupMenu('div#kalai', kalai);

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

    var svg = document.querySelector('svg#anim');
    var baton = document.querySelector('svg#anim circle#baton');
    console.assert(baton);
    var pulseBaton = document.querySelector('svg#anim circle#pulse');
    console.assert(pulseBaton);

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
                chimeMain.play(60+43, 0.25), 
                chimeMain.play(60+48, 0.25), 
                (i === 0 ? chimeMain.play(60+12, 0.25) : sh.cont),
                sh.delay(p * kalaiFactor)
                ]);
        }));
        var base = parseFloat(svg.attributes.height.value) - 10;
        var h = base * 0.5;
        var left2right = bounce(baton, kalaiFactor, -50, 50, base-2-5, h, 0.25);
        var right2left = bounce(baton, kalaiFactor, 50, -50, base-2-5, h, 0.25);
        var left2left = bounce(baton, kalaiFactor, -50, -50, base-2-5, h, 0.25);
        var right2right = bounce(baton, kalaiFactor, 50, 50, base-2-5, h, 0.25);
        var akshTrk = sh.track(pattern.map(function (p) {
            return sh.track(gen(0, p, function (i) {
                var b = (i === 0 ? (i + 1 < p ? left2right : left2left) : (i + 1 === p ? right2left : right2right));
                return sh.track([change.sync, change.gate, chimeAksh.play(60+36, 0.25), sh.spawn(b), sh.delay(kalaiFactor)]);
            }));
        }));
        var pulseBounce = bounce(pulseBaton, speedFactor / ticksPerAksh, 0, 0, base-2-5, 0.75 * h, 1);
        var pulseTrk = sh.track(gen(0, aksh * ticksPerAksh * kalaiFactor, function (i) {
            return sh.track([
//                change.sync,
                (i % 1 === 0 ? change.gate : sh.cont),
                chimeSub.play(60+24, 0.25), 
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
        var midx = 0.5 * parseFloat(svg.attributes.width.value);
        return sh.frames(duration, 
                        function (clock, tStart, tEnd) {
                            //tEnd = Math.max(clock.t2r, tEnd);
                            var dt = Math.min(clock.t2r, tEnd) - clock.t1r;
                            var f = Math.max(0, Math.min(1, (clock.t1r - tStart) / (tEnd - tStart - dt)));
                            var r = clock.rate.valueOf();
                            var y = Math.pow(tEnd - tStart - dt, pow || 1) * 3 * height * f * (1 - f) / Math.max(0.7, r);
                            var x = (x1 + f * (x2 - x1)) / Math.max(1, r);
                            baton.setAttribute('cx', midx + x);
                            baton.setAttribute('cy', y0 - y);
                        });
    }


    function onchange() {
        var newChange = {sync: sh.sync(), gate: sh.gate()};
        change.gate.close();
        change.sync.play(sh.track(sh.rate(rate), makeTala(newChange)));
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
    

    function store() {
        localStorage[storageKey] = JSON.stringify(settings);
    }
    
    function load() {
        if (localStorage[storageKey]) {
            var vals = JSON.parse(localStorage[storageKey]);
            for (var k in vals) {
                settings[k] = vals[k];
            }
        }
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

}(org.anclab.steller));
