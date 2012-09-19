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

    setupMenu('div#nadai', nadai);

    var nadaiTypes = [2, 4, 3/2, 3, 6, 5/2, 5, 7/2, 7, 9/2, 9];

    var chimeMain = models.chime();
    chimeMain.connect(AC.destination);
    chimeMain.halfLife.value *= 1;
    chimeMain.attackTime.value = 0;
    
    var chimeSub = models.chime();
    chimeSub.connect(AC.destination);
    chimeSub.halfLife.value *= 0.2;
    chimeSub.attackTime.value = 0;

    var svg = document.querySelector('svg#anim');
    var baton = document.querySelector('svg#anim circle#baton');
    console.assert(baton);
    var pulseBaton = document.querySelector('svg#anim circle#pulse');
    console.assert(pulseBaton);

    var change = {sync: sh.sync(), gate: sh.gate()};

    function makeTala(change) {

        var count = nadaiTypes[nadai.value];
        var base = parseFloat(svg.attributes.height.value) - 10;
        var h = base * 0.5;
        var mainBatonAnimLR = bounce(baton, 1, -50, 50, base-2-5, h, 0.25);
        var mainBatonAnimRL = bounce(baton, 1, 50, -50, base-2-5, h, 0.25);
        var pulseBatonAnim = bounce(pulseBaton, 1/count, 0, 0, base-2-5, 0.75 * h, 1);
        
        var main = sh.track([
                change.sync,
                change.gate,
                chimeMain.play(60+36, 0.25),
                mainBatonAnimLR,
                chimeMain.play(60+43, 0.25),
                mainBatonAnimRL
                ]);

        var sub = sh.track(gen(0, count * 2, function (i) {
            return sh.track([
                (i === 0 ? change.gate : sh.cont),
                chimeSub.play(60+24, 0.25),
                pulseBatonAnim
                ]);
        }));
        
        return sh.spawn([sh.loop(main), sh.loop(sub)]);
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
        for (i = m; i < n; ++i) {
            r.push(f(i));
        }
        return r;
    }

    function sum(a) {
        return a.reduce(function (x, y) { return x + y; });
    }

}(org.anclab.steller));
