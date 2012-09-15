(function (steller) {
    var AC = new webkitAudioContext();
    var sh = new steller.Scheduler(AC);
    sh.running = true;

    var models = steller.Models(sh);
    var gamaka = nishabdam.audio.gamaka;
    var pasr = nishabdam.audio.pasr;
    var vina = nishabdam.audio.vina(sh);
    vina.level.value = 0.5;
    vina.connect(AC.destination);
    elem('play').disabled = true;
    elem('stop').disabled = true;
    sh.play(sh.track([
            vina.load,
            sh.fire(function () {
                elem('play').disabled = false;
                elem('stop').disabled = false;
                var l = elem('loading');
                l.parentNode.removeChild(l);
            })
            ]));
    vina.tonic.bind('#tonic');
    vina.level.bind('#volume');
    
    var ps = pasr.pasr;

    function sequence(sel) {
        return Array.prototype.slice.call(document.querySelectorAll(sel), 0);
    }

    function pitch(e) {
        return parseFloat(e.getAttribute('pitch'));
    }

    function dur(e) {
        return parseFloat(e.getAttribute('dur'));
    }

    var sync = sh.sync();
    var comma = sh.gate();

    function flatten(aa) {
        return Array.prototype.concat.apply([], aa);
    }

    function elem(n) {
        return document.getElementById(n);
    }

    var sahityam = models.sample('gururbrahma-malahari-sahityam.mp3');
    var svaram = models.sample('gururbrahma-malahari-svaram.mp3');
    var recitation = models.sample('gururbrahma-recitation.mp3');
    var samplesLoaded = sh.sync();
    if (false) {
        sh.play(sh.track([sh.fork([sahityam.load, svaram.load, recitation.load]), sh.log("all samples loaded"), samplesLoaded]));
        recitation.connect(AC.destination);
        samplesLoaded.play(recitation.play);
    }

    var solfa = {
        "m": 65, "P": 67, "d": 68, "Ṡ": 72, "G": 64, "r": 61, "S": 60, "ṙ": 73
    };

    var tune = [
        [65, 67, 68, 72, 68, 67, 65, 67],
        [68, 67, 65, 64, 61, 60, 60, 60, 60],
        [60, 61, 65, 65, 61, 65, 67, 67],
        [65, 67, [[68,0,3,1], [73,1,1,0]], 72, 72, 72, 72, 72, 72]
            ];
    var tune_durs = [
        [1, 2, 2, 2, 1, 2, 2, 2],
        [1, 2, 2, 2, 1, 2, 1, 1, 2],
        [1, 2, 2, 2, 1, 2, 2, 2],
        [2, 2, 2, 1, 1, 2, 1, 1, 2]
            ];
    var stoppages = [
        [0.8, 0.5, 0.95, 0.95, 0.8, 0.5, 0.5, 0.95],
        [0.8, 0.5, 0.95, 0.95, 0.95, 0.8, 0.95, 0.95, 0.8],
        [0.8, 0.5, 0.8, 0.8, 0.8, 0.5, 0.95, 0.95],
        [0.5, 0.8, 0.98, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95]
            ];
    var lyrics_rom = [
        ["gu", "rur", "brahm", "mā", "gu", "rur", "vish", "ṇu:"],
        ["gu", "rur", "dē", "vō", "ma", "hēsh", "shva", "ra", "ha"],
        ["gu", "rur", "sāk", "kshāt", "pa", "ramb", "brahm", "mā"],
        ["tas", "mai", "shrī", "gu", "ra", "vē", "na", "ma", "ha"]
            ];
    var lyrics_dev = [
        ["गु", "रुर्", "ब्रह्म्", "मा", "गु", "रुर्", "विष्", "णु:"],
        ["गु", "रुर्", "दे", "वो", "म", "हेश्", "श्व", "र", "ह"],
        ["गु", "रुर्", "साक्", "षात्", "प", "रम्ब्", "ब्रह्म्", "मा"],
        ["तस्", "मै", "श्री", "गु", "र", "वे", "न", "म", "ह"]
            ];
    var svaras = [
        ['m', 'P', 'd', 'Ṡ', 'd', 'P', 'm', 'P'],
        ['d', 'P', 'm', 'G', 'r', 'S', 'S', 'S', 'S'],
        ['S', 'r', 'm', 'm', 'r', 'm', 'P', 'P'],
        ['m', 'P', 'dṙ', 'Ṡ', 'Ṡ', 'Ṡ', 'Ṡ', 'Ṡ', 'Ṡ']
            ];

    function svgelem(n) {
        return document.createElementNS('http://www.w3.org/2000/svg', n);
    }

    function makeSVG(svg) {
        function box(x, y, width, height, color) {
            var b = svgelem('rect');
            b.setAttribute('x', x);
            b.setAttribute('y', y - height * 0.75);
            b.setAttribute('width', width);
            b.setAttribute('height', height);
            b.setAttribute('fill', 'black');
            b.setAttribute('fill-opacity', 0.0);
            return b;            
        }

        function text(str, x, y) {
            var t = svgelem('text');
            t.setAttribute('x', x);
            t.setAttribute('y', y);
            t.setAttribute('font-size', '14pt');
            t.textContent = str;
            return t;
        }

        function line(x1, y1, x2, y2, color, width) {
            var l = svgelem('line');
            l.setAttribute('x1', x1);
            l.setAttribute('y1', y1);
            l.setAttribute('x2', x2);
            l.setAttribute('y2', y2);
            l.setAttribute('style', 'stroke:' + (color || 'rgb(0,0,0)') + ';stroke-width:' + (width || 2));
            return l;
        }

        function gelem(b, t) {
            var g = svgelem('g');
            svg.appendChild(g);
            g.appendChild(b);
            g.appendChild(t);
            return [g, b, t];
        }

        var textNodes = [];
        var displayText = textDisplayOptions[textToDisplay.value];
        var lineHeight = 32;
        var cellWidth = 60;
        var xOffset = 32, boxOffset = xOffset - 5;

        tune.forEach(function (t, i) {
            var y = lineHeight + i * lineHeight;
            var x = 0;
            displayText[i].forEach(function (n, j) {
                var w = tune_durs[i][j] * cellWidth;
                textNodes.push(gelem(box(x + boxOffset, y, w, lineHeight), text(n, x + xOffset, y)));
                x += w;
            });
        });

        var width = tune_durs[0].reduce(function (a,b) { return a+b; }) + 0.01;
        var height = lineHeight * tune.length + 12;
        var i, l, x, period = 7;
        for (i = 0; i < width; ++i) {
            x = boxOffset + i * cellWidth;
            svg.appendChild(line(x, 0, x, height, undefined, (i % 7 === 0 ? 6 : 2)));
        }
        svg.appendChild(line(boxOffset, 0, boxOffset + width * cellWidth, 0));
        svg.appendChild(line(boxOffset, height, boxOffset + width * cellWidth, height));

        svg.setAttribute('height', height);
        svg.setAttribute('width', xOffset + width * cellWidth);
        baton.setAttribute('cx', 10);
        baton.setAttribute('cy', height - 11);
        svg.appendChild(line(0, height - 3, boxOffset, height - 3, undefined, 6));
        return textNodes;
    }

    var textToDisplay = steller.Param({min: 0, max: 2, value: 0, 
        getter: function () { return Math.round(this._value); },
        setter: function (v) { return this._value = Math.round(v); }
    });
    var textDisplayOptions = [svaras, lyrics_rom, lyrics_dev];
    var ftextDisplayOptions = textDisplayOptions.map(flatten);
    var svg = document.querySelector('svg#text_table');
    var baton = svg.querySelector('circle');    
    var textNodes = makeSVG(document.querySelector('svg#text_table'));
    textToDisplay.watch(function (v) {
        var text = ftextDisplayOptions[v];
        textNodes.forEach(function (n, i) {
            n[2].textContent = text[i];
        });
    });
    elem('text_svara').onclick = function (e) {
        textToDisplay.value = 0;
        elem('text_svara').style.fontWeight = 'bold';
        elem('text_eng').style.fontWeight = 'normal';
        elem('text_deva').style.fontWeight = 'normal';
    };
    elem('text_eng').onclick = function (e) {
        textToDisplay.value = 1;
        elem('text_svara').style.fontWeight = 'normal';
        elem('text_eng').style.fontWeight = 'bold';
        elem('text_deva').style.fontWeight = 'normal';
    };
    elem('text_deva').onclick = function (e) {
        textToDisplay.value = 2;
        elem('text_svara').style.fontWeight = 'normal';
        elem('text_eng').style.fontWeight = 'normal';
        elem('text_deva').style.fontWeight = 'bold';
    };

    elem('text_svara').onclick();

    var durs = Array.prototype.concat.apply([], tune_durs);

    var ftune = flatten(tune);
    var ftune_durs = flatten(tune_durs);
    var fstoppages = flatten(stoppages);
    var svgHeight = parseFloat(svg.attributes.height.value);
    var batonBase = svgHeight - 11;

    function oneNote(i) {
        var noteSpec = ftune[i];
        var durn = ftune_durs[i];
        var stop = fstoppages[i];
        var text = textNodes[i];
        noteSpec = pasr.pasrs(0.5 * durn, 0.5 * durn * (1 - stop), typeof noteSpec === 'number' ? [noteSpec] : noteSpec);

        var note = sh.track([
                comma, 
                sync, 
                sh.display(function () {
                    text[1].setAttribute('fill-opacity', 1.0);
                    text[2].setAttribute('fill', 'white');
                }),
                sh.spawn(sh.frames(noteSpec.duration, 
                        function (clock, tStart, tEnd) {
                            //tEnd = Math.max(clock.t2r, tEnd);
                            var dt = Math.min(clock.t2r, tEnd) - clock.t1r;
                            var f = Math.max(0, Math.min(1, (clock.t1r - tStart) / (tEnd - tStart - dt)));
                            var y = (tEnd - tStart - dt) * 3 * (svgHeight - 5) * f * (1 - f) / clock.rate.valueOf();
                            baton.setAttribute('cy', batonBase - y);  
                            baton.setAttribute('cx', 10);
                        })),
                vina.note(noteSpec),
                sh.display(function () {
                    text[1].setAttribute('fill-opacity', 0.0);
                    text[2].setAttribute('fill', 'black');
                })
            ]);
        return note;
    }

    function generate(l, u, f) {
        var arr = [], i;
        for (i = l; i < u; ++i) {
            arr.push(f(i));
        }
        return arr;
    }

    var rate = steller.Param({min: 1.0, max: 4.0, value: 2.0, mapping: 'log'});
    rate.bind('#tempo');
    var playing = 0;
    function trackPlayState(comp) {
        return sh.track([
                sh.fire(function () { playing++; }), 
                comp, 
                sh.fire(function () { 
                    playing--; 
                    var play = elem('play');
                    play.value = 'Play';
                    play.onclick = playButton;
                })
                ]);
    }
    var notes = sh.track(generate(0, ftune.length, oneNote));
    var gurur = trackPlayState(sh.track(vina.load, sh.rate(rate), notes));
    textNodes.forEach(function (n, i) {
        n[0].onmousedown = function (e) {
            comma.cancel();
            comma.open();
            sh.play(sh.track(vina.load, sh.rate(rate), sh.slice(notes, i, i+1)));
        };
    });

    function playButton(e) {
        if (!playing) {
            comma.cancel();
            comma.open();
            sh.play(gurur);
            this.value = 'Pause';
            this.onclick = pauseButton;
        }
    }

    function pauseButton(e) {
        if (playing) {
            comma.close();
            this.value = 'Resume';
            this.onclick = resumeButton;
        } else {
        }
    }

    function resumeButton(e) {
        if (playing) {
            comma.open();
            this.value = 'Pause';
            this.onclick = pauseButton;
        } else {
            playButton.call(this, e);
        }
    }

    function stopButton(e) {
        if (playing) {
            comma.close();
            playing--;
            var play = elem('play');
            play.onclick = playButton;
            play.value = 'Play';
        }
    }

    elem('play').onclick = playButton;
    elem('stop').onclick = stopButton;

    var statsElem = elem('stats');
    if (statsElem) {
        sh.play(sh.loop(sh.track([
                        sh.delay(1), 
                        sh.fire(function () {
                            statsElem.innerText = JSON.stringify(sh.stats(), null, 4);
                        })
                        ])));
    }

}(org.anclab.steller));
