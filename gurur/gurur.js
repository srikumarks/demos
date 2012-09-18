(function (steller) {
    var AC = new webkitAudioContext();
    var sh = new steller.Scheduler(AC);
    sh.running = true;

    var models = steller.Models(sh);
    var gamaka = nishabdam.audio.gamaka;
    var pasr = nishabdam.audio.pasr;
    var ps = pasr.pasr;

    // Disable controls until vina samples are loaded.
    elem('play').disabled = true;
    elem('stop').disabled = true;
    
    // Make a vina model.
    var vina = nishabdam.audio.vina(sh);
    vina.level.value = 0.5;
    vina.connect(AC.destination);
    
    // Bind the vina controls to the UI.
    vina.tonic.bind('#tonic');
    vina.level.bind('#volume');

    // Make long and short chime sounds for the conductor track.
    var chimeLong = models.chime();
    chimeLong.halfLife.value *= 2;
    var chimeShort = models.chime();
    chimeShort.halfLife.value *= 0.5;
    chimeLong.connect(AC.destination);
    chimeShort.connect(AC.destination);

    // The chimeTonic tracks the vina's tonic with an octave offset.
    var chimeTonic = steller.Param({min: 0, max: 128, 
        getter: function () { return vina.tonic.value + 48; },
        setter: function (v) { return vina.tonic.value + 48; }
    });

    // Map the choice of whether you want to bounce *on* the letters
    // instead of merely in sync with them.
    var bounceOnLetters = steller.Param({min: 0, max: 1, value: 1});
    bounceOnLetters.bind('#bounce');
  
    // Bind the tempo slider.
    var rate = steller.Param({min: 1.0, max: 4.0, value: 2.0, mapping: 'log'});
    rate.bind('#tempo');
     
    // Description of melody.
    var tune = [
        [65, 67, 68, 72, 68, 67, 65, 67],
        [68, 67, 65, 64, 61, 60, 60, 60, 60],
        [60, 61, 65, 65, 61, 65, 67, 67],
        // Can also give PASR form of note.
        [65, 67, [[68,0,3,1], [73,1,1,0]], 72, 72, 72, 72, 72, 72]
            ];
    var jalra = [[3, chimeLong], [2, chimeShort], [2, chimeShort]];
    var tune_durs = [
        [1, 2, 2, 2, 1, 2, 2, 2],
        [1, 2, 2, 2, 1, 2, 1, 1, 2],
        [1, 2, 2, 2, 1, 2, 2, 2],
        [2, 2, 2, 1, 1, 2, 1, 1, 2]
            ];
    var stoppages = [
        // Given as fraction of note duration.
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

    var normalFontSize = '16pt';
    var bigFontSize = '20pt';
    var lineHeight = 32;
    var cellWidth = 70;
    var xOffset = 32, yOffset = 80, boxOffset = xOffset - 5;
    var batonX = 5, conductorX = 15;

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
            t.setAttribute('width', cellWidth);
            t.setAttribute('font-size', normalFontSize);
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

        tune.forEach(function (t, i) {
            var y = yOffset + lineHeight + i * lineHeight;
            var x = 0;
            displayText[i].forEach(function (n, j) {
                var w = tune_durs[i][j] * cellWidth;
                textNodes.push(gelem(box(x + boxOffset, y, w, lineHeight), text(n, x + xOffset, y)));
                x += w;
            });
        });

        var width = tune_durs[0].reduce(function (a,b) { return a+b; }) + 0.01;
        var height = lineHeight * tune.length + yOffset + 12;
        var i, l, x, period = 7;
        for (i = 0; i < width; ++i) {
            x = boxOffset + i * cellWidth;
            svg.appendChild(line(x, yOffset, x, height, undefined, (i % 7 === 0 ? 6 : 2)));
        }
        svg.appendChild(line(boxOffset, yOffset, boxOffset + width * cellWidth, yOffset));
        svg.appendChild(line(boxOffset, height, boxOffset + width * cellWidth, height));

        svg.setAttribute('height', height);
        svg.setAttribute('width', xOffset + width * cellWidth);

        baton.setAttribute('cx', batonX);
        baton.setAttribute('cy', height - 11);
        conductor.setAttribute('cx', conductorX);
        conductor.setAttribute('cy', height - 11);
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
    var conductor = svg.querySelector('circle#conductor');    
    var baton = svg.querySelector('circle#baton');    
    var textNodes = makeSVG(document.querySelector('svg#text_table'));
    textToDisplay.watch(function (v) {
        var text = ftextDisplayOptions[v];
        textNodes.forEach(function (n, i) {
            n[2].textContent = text[i];
        });
    });

    // The text display selector elements. These behave like buttons.
    elem('text_svara').onclick = function (e) {
        textToDisplay.value = 0;
        elem('text_svara').style.fontWeight = 'bold';
        elem('text_eng').style.fontWeight = 'normal';
        elem('text_deva').style.fontWeight = 'normal';
        document.querySelector('h1').innerText = 'Gurur Brahma';
    };
    elem('text_eng').onclick = function (e) {
        textToDisplay.value = 1;
        elem('text_svara').style.fontWeight = 'normal';
        elem('text_eng').style.fontWeight = 'bold';
        elem('text_deva').style.fontWeight = 'normal';
        document.querySelector('h1').innerText = 'Gurur Brahma';
    };
    elem('text_deva').onclick = function (e) {
        textToDisplay.value = 2;
        elem('text_svara').style.fontWeight = 'normal';
        elem('text_eng').style.fontWeight = 'normal';
        elem('text_deva').style.fontWeight = 'bold';
        document.querySelector('h1').innerText = 'गुरुर् ब्रह्मा';
    };

    // Select the svara text by default.
    elem('text_svara').onclick();

    var ftune = flatten(tune);
    var ftune_durs = flatten(tune_durs);
    var fstoppages = flatten(stoppages);
    var svgHeight = parseFloat(svg.attributes.height.value);
    var batonBase = svgHeight - 11;

    // Bounces the given baton (or conductor) for the given duration
    // over the given height. If bbox is given, it will bounce it on
    // the box. Otherwise it will bounce it in the corner of the display.
    function bounce(baton, duration, height, bbox) {
        return sh.frames(duration, 
                        function (clock, tStart, tEnd) {
                            //tEnd = Math.max(clock.t2r, tEnd);
                            var dt = Math.min(clock.t2r, tEnd) - clock.t1r;
                            var f = Math.max(0, Math.min(1, (clock.t1r - tStart) / (tEnd - tStart - dt)));
                            var y = (tEnd - tStart - dt) * 3 * height * f * (1 - f) / clock.rate.valueOf();
                            if (bbox && bounceOnLetters.value) {
                                baton.setAttribute('cy', bbox.y - y);
                                baton.setAttribute('cx', bbox.x + 10 + bbox.width * f);
                            } else {
                                baton.setAttribute('cy', batonBase - 1.5 * y);  
                                baton.setAttribute('cx', baton === conductor ? conductorX : batonX);
                            }
                        });
    }

    // Determine the cycle length
    var cycleLength = jalra.reduce(function (a, b) { return a + b[0]; }, 0);
    console.assert(cycleLength === 7);

    // Make sync and gate objects. One for each tick of the cycle.
    var syncs = sh.sync(cycleLength);
    var commas = sh.gate(cycleLength);

    function oneNote(i) {
        var noteSpec = ftune[i];
        var durn = ftune_durs[i];
        var stop = fstoppages[i];
        var text = textNodes[i];
        noteSpec = pasr.pasrs(0.5 * durn, 0.5 * durn * (1 - stop), typeof noteSpec === 'number' ? [noteSpec] : noteSpec);
        var bbox = text[0].getBBox();
        var beat = ftune_durs.slice(0, i).reduce(function (a, b) { return a + b; }, 0) % 7;

        var note = sh.track([
                commas[beat], 
                sh.display(function () {
                    text[1].setAttribute('fill-opacity', 0.15);
                    //text[2].setAttribute('fill', 'white');
                    text[2].setAttribute('font-size', bigFontSize);
                    text[2].setAttribute('font-weight', 'bold');
                }),
                sh.spawn(bounce(baton, noteSpec.duration, yOffset, bbox)),
                vina.note(noteSpec),
                sh.display(function () {
                    text[1].setAttribute('fill-opacity', 0.0);
                    //text[2].setAttribute('fill', 'black');
                    text[2].setAttribute('font-size', normalFontSize);
                    text[2].setAttribute('font-weight', 'normal');
                })
            ]);
        return note;
    }

    // The playing/paused state.
    var playing = 0;
    var paused = false;

    // Turn the given composition so that it will set the playing
    // state depending on whether play is actually happening.
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

    // Make the "notes" of the tune. This includes the animation.
    var notes = sh.track(generate(0, ftune.length, oneNote));

    // Make the sync track. This is an eternal loop.
    var tick = sh.delay(0.5);
    var syncTrack = sh.loop(sh.track(flatten(generate(0, cycleLength, function (i) { return [syncs[i], tick]; }))));

    // The jalra track combines the sync track as well as the chime sounds that
    // keep track of the talam.
    var jalraTrack = sh.track(sh.spawn(syncTrack), sh.loop(sh.track(jalra.map(function (j, i) {
        // j[0] is the duration and j[1] is the chime to use for this beat.
        var d = j[0] * 0.5;
        var bounceBaton = bounce(conductor, d, yOffset);
        return sh.track([sh.spawn(bounceBaton), j[1].play(chimeTonic, 0.15), sh.delay(d)]);
    }))));

    // The main notes track.
    var gurur = trackPlayState(notes);

    if (false) {
        textNodes.forEach(function (n, i) {
            n[0].onmousedown = function (e) {
                if (playing <= 0 && !paused) {
                    var j;
                    for (j = 0; j < commas.length; ++j) {
                        commas[j].cancel();
                        commas[j].open();
                    }
                    sh.play(sh.track(vina.load, sh.rate(rate), sh.slice(notes, i, i+1)));
                }
            };
        });
    }

    //
    // The play/stop/pause/resume button states.
    //
    function playButton(e) {
        if (!playing) {
            var i;

            // Open all the gates.
            for (i = 0; i < commas.length; ++i) {
                commas[i].cancel();
                commas[i].open();
            }

            // Play in sync with the first beat of the tala.
            syncs[0].play(gurur);

            this.value = 'Pause';
            this.onclick = pauseButton;
        }
    }

    function pauseButton(e) {
        if (playing) {
            var i;

            // Close all the gates. The sequence will
            // remember the point at which the playing
            // actually ended.
            for (i = 0; i < commas.length; ++i) {
                commas[i].close();
            }

            paused = true;
            this.value = 'Resume';
            this.onclick = resumeButton;
        } else {
        }
    }

    function resumeButton(e) {
        if (playing) {
            var i;

            // Resume the sequence from where it stopped,
            // in sync with the tala cycle.
            for (i = 0; i < syncs.length; ++i) {
                syncs[i].play(commas[i].open);
            }

            paused = false;
            this.value = 'Pause';
            this.onclick = pauseButton;
        } else {
            playButton.call(this, e);
        }
    }

    function stopButton(e) {
        if (playing) {
            var i;

            // Close all the gates.
            for (i = 0; i < commas.length; ++i) {
                commas[i].close();
            }

            playing--;
            paused = false;
            var play = elem('play');
            play.onclick = playButton;
            play.value = 'Play';
        }
    }

    // Set the play/stop handlers.
    elem('play').onclick = playButton;
    elem('stop').onclick = stopButton;

    // Map the space bar to play/pause.
    window.onkeypress = function (e) {
        var s = String.fromCharCode(e.keyCode);
        if (s === ' ') {
            elem('play').onclick();
        }
    };
    
    // Load the vina samples first, then enable the 
    // controls when that succeeds and then start the
    // jalra track. Once the jalra track starts, you'll
    // be able to play the Guru Brahma sequence in sync
    // with the jalra track.
    sh.play(sh.track([
                vina.load,
                sh.fire(function () {
                    elem('play').disabled = false;
                    elem('stop').disabled = false;
                    var l = elem('loading');
                    l.parentNode.removeChild(l);
                }),
                sh.rate(rate),
                sh.delay(0.1),
                jalraTrack
                ]));

    var statsElem = elem('stats');
    if (statsElem) {
        sh.play(sh.loop(sh.track([
                        sh.delay(1), 
                        sh.fire(function () {
                            statsElem.innerText = JSON.stringify(sh.stats(), null, 4);
                        })
                        ])));
    }

    //////////////////////////
    // Some utilities
    //
    function flatten(aa) {
        return Array.prototype.concat.apply([], aa);
    }

    function elem(n) {
        return document.getElementById(n);
    }

    function svgelem(n) {
        return document.createElementNS('http://www.w3.org/2000/svg', n);
    }

    function generate(l, u, f) {
        var arr = [], i;
        for (i = l; i < u; ++i) {
            arr.push(f(i));
        }
        return arr;
    }

    
}(org.anclab.steller));
