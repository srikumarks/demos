console.assert(org.anclab.steller);
console.assert(srikumarks.audio.pitch);

(function (Scheduler, AudioContext, pitch) {
    var sh = new Scheduler(new AudioContext());
    console.assert(sh.models);

    var display = elements(['frequency', 'pitch', 'note', 'sig', 'gram']);

    function setupGram(container, octRange) {
        var canvas = display[container];
        var width = canvas.width;
        var height = canvas.height;
        var kMaxTime = 10;
        var prevTime = 1e9, prevPeaks = null;

        var context = canvas.getContext('2d');
        console.assert(canvas && context);

        var bandActivation = new Float32Array(1200);

        
        // Frequency to y. Fold octaves beyond the range.
        var dy = height / (12 * (octRange[1] - octRange[0]));
        function f2y(f) {
            var p = 57 + 12 * Math.log(f/220) / Math.LN2;
            while (p > octRange[1] * 12) {
                p -= 12;
            }
            while (p < octRange[0] * 12) {
                p += 12;
            }
            return gram.height - dy * (p - octRange[0] * 12);
        }


        function clear() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1.0;
            context.fillStyle = 'black';
            context.fillRect(0, 0, canvas.width, canvas.height);

            var p_start = octRange[0] * 12, p_end = octRange[1] * 12;
            var p, py = height / (p_end - p_start), y;
            context.strokeStyle = 'red';
            context.globalAlpha = 0.75;
            context.lineWidth = 0.5;
            context.beginPath();
            for (p = p_start; p < p_end; ++p) {
                y = height - py * (p - p_start);
                context.moveTo(0, y);
                context.lineTo(width, y);
            }
            context.stroke();
        }


        var gram = {};
        gram.width = width;
        gram.height = height;
        gram.octaveRange = octRange;
        gram.activation = bandActivation;
        gram.decayFactor = 0.2;
        gram.maxDecayFactor = 0.99;
        gram.maxLevel = 0;
        gram.activate = function (f, level) {
            var p = Math.round(570 + 120 * Math.log(f/220) / Math.LN2);
            bandActivation[p] += level;
            gram.maxLevel = Math.max(gram.maxLevel, bandActivation[p]);
        };
        gram.updateTime = function (t) {
            t %= kMaxTime;
            if (t < prevTime) {
                clear();
                prevTime = t;
                prevPeaks = null;
            }
        };
        gram.draw = function (t, peaks) {
            t %= kMaxTime;
            var x = Math.round(t * this.width / kMaxTime);
            var prevX = Math.round(prevTime * this.width / kMaxTime);

            if (!prevPeaks || t - prevTime > 0.2) {
                prevPeaks = peaks;
                prevTime = t;
                return;
            }

            var i, j, M, N, pmax1, pmax2, w, y1, y2;
            context.strokeStyle = 'yellow';
            context.lineWidth = 1;
            pmax1 = 0;
            for (i = 0, N = prevPeaks.length; i < N; ++i) {
                pmax1 = Math.max(pmax1, prevPeaks[i].power);
            }
            pmax2 = 0;
            for (i = 0, N = peaks.length; i < N; ++i) {
                pmax2 = Math.max(pmax2, peaks[i].power);
            }


            for (i = 0, M = prevPeaks.length; i < M; ++i) {
                y1 = f2y(prevPeaks[i].frequency);
                for (j = 0, N = peaks.length; j < N; ++j) {
                    if (peaks[j].life + prevPeaks[i].life > 3) {
                        w = Math.exp(- 0.5 * prevPeaks[i].coeff * sq(prevPeaks[i].frequency - peaks[j].frequency));
                        y2 = f2y(peaks[j].frequency);
                        context.globalAlpha = w * peaks[j].power * prevPeaks[i].power / (pmax1 * pmax2);
                        context.beginPath();
                        context.moveTo(prevX, y1);
                        context.lineTo(x, y2);
                        context.stroke();
                    }
                }
            }

            prevTime = t;
            prevPeaks = peaks;
        };
        gram.drawX = function () {
            var t = sh.audioContext.currentTime % kMaxTime;
            var x = Math.round(t * this.width / kMaxTime);

            if (t < prevTime) {
                clear();
                prevTime = t;
            }

            var prevX = Math.round(prevTime * this.width / kMaxTime);

            if (gram.maxLevel > 0) {
                var dy = this.height / (120 * (this.octaveRange[1] - this.octaveRange[0]));
                var lo = this.octaveRange[0] * 120, hi = this.octaveRange[1] * 120;
                var i = 0, N, y = 0;
                context.fillStyle = 'yellow';
                for (i = 0, y = 0; y < this.height; y += dy, ++i) {
                    context.globalAlpha = Math.pow(this.activation[lo + i] / gram.maxLevel, 0.5);
                    context.fillRect(prevX, this.height - y, x - prevX, dy);
                }

                // Indicate the strongest one.
                var strongest = -1,  maxStrength = 0;
                for (i = 0, N = this.activation.length; i < N; ++i) {
                    if (maxStrength < this.activation[i]) {
                        strongest = i;
                        maxStrength = this.activation[i];
                    }
                }

                if (false && strongest > 0) {
                    context.globalAlpha = 1.0;
                    context.fillStyle = 'red';
                    x = dx * (strongest - lo);
                    context.beginPath();
                    context.moveTo(x, this.height);
                    context.lineTo(x + 6, this.height + 6);
                    context.lineTo(x - 6, this.height + 6);
                    context.lineTo(x, this.height);
                    context.fill();
                }

                // Decay the activations
                for (i = 0, N = this.activation.length; i < N; ++i) {
                    this.activation[i] *= this.decayFactor;
                }

                gram.maxLevel *= this.maxDecayFactor;
            }

            prevTime = t;
        };

        return gram;
    }

    var gram = setupGram('gram', [2, 10]);


    var mic = sh.models.mic();
    var spec = sh.models.spectrum(1024, 0.25);
    mic.connect(spec);

    var options = {significance: 20, decayFactor: 0.9, spawnThreshold: 0.1, dieThreshold: 0.3, minVar_st: 0.75};

    spec.time.watch(function (t) {
        var p = pitch(spec, options);
        gram.updateTime(t);
        if (p && p.sig > options.significance) {
            display.frequency.innerText = p.frequency;
            display.pitch.innerText = p.pitch;
            display.note.innerText = p.note.name + (p.error < 0 ? ' +' : ' ') + (-p.error) + ' cents';
            display.sig.innerText = p.sig;
            var f, f_end, i, N, c;
            gram.draw(t, p.peaks);
            if (false) {
                for (i = 0, N = p.peaks.length; i < N; ++i) {
                    if (p.peaks[i].life > 2) {
                        for (f = 0.05 * (Math.pow(2, -1/12) - 1) * p.peaks[i].frequency, f_end = -f; f < f_end; f += 0.2) {
                            c = Math.exp(- 0.5 * p.peaks[i].coeff * f * f);
                            gram.activate(p.peaks[i].frequency + f, c * p.peaks[i].power);
                        }
                    }
                }
            }
        } else {
            display.frequency.innerText = '';
            display.pitch.innerText = '';
            display.note.innerText = '';
            display.sig.innerText = '< ' + options.significance;
        }
    });

    // Start analysis.
    sh.play(spec.start);

    // Gets the DOM elements with the given ids.
    function elements(ids) {
        var nodes = {};
        ids.forEach(function (id) {
            nodes[id] = document.getElementById(id);
        });
        return nodes;
    }

    function sq(x) { return x * x; }

}(org.anclab.steller.Scheduler, org.anclab.steller.AudioContext, srikumarks.audio.pitch()));
