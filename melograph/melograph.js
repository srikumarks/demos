console.assert(org.anclab.steller);
console.assert(srikumarks.audio.PitchTracker);

(function (Scheduler, AudioContext, PitchTracker) {
    var sh = new Scheduler(new AudioContext());
    console.assert(sh.models);

    var display = elements(['frequency', 'pitch', 'note', 'sig', 'gram', 'gcount']);

    function setupGram(container, octRange) {
        var canvas = display[container];
        var width = canvas.width;
        var height = canvas.height;
        var kMaxTime = 10;
        var prevTime = 1e9, prevPeaks = null;

        var context = canvas.getContext('2d');
        console.assert(canvas && context);

        // Frequency to y. Fold octaves beyond the range.
        var dy = height / (12 * (octRange[1] - octRange[0]));
        function f2y(peak) {
            var f = peak.frequency;
            var p = peak.octaveOffset + 57 + 12 * Math.log(f/220) / Math.LN2;
            return gram.height - dy * (p - octRange[0] * 12);
        }

        var kPitchSteps = [1, 3, 1, 2, 1, 3, 1]; // Mayamalavagaula scale.

        function clear() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1.0;
            context.fillStyle = 'black';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // draw pitch lines.
            var p_start = octRange[0] * 12, p_end = octRange[1] * 12;
            var p, py = height / (p_end - p_start), y, i;
            context.strokeStyle = 'rgb(128, 0, 0)';
            context.globalAlpha = 1;
            context.lineWidth = 1;
            context.beginPath();
            for (p = p_start, i = 0; p < p_end; p += kPitchSteps[i], i = (i + 1) % kPitchSteps.length) {
                y = height - py * (p - p_start);
                context.moveTo(0, y);
                context.lineTo(width, y);
            }
            context.stroke();

            // draw octave lines.
            context.lineWidth = 2;
            context.strokeStyle = 'rgb(255,0,0)';
            context.beginPath();
            for (p = p_start; p < p_end; p += 12) {
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
        gram.decayFactor = 0.2;
        gram.maxDecayFactor = 0.99;
        gram.maxLevel = 0;
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

            var i, j, M, N, pmax1, pmax2, pmax, w, y1, y2;
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

            pmax = Math.max(pmax1, pmax2);

            for (i = 0, M = prevPeaks.length; i < M; ++i) {
                y1 = f2y(prevPeaks[i]);
                for (j = 0, N = peaks.length; j < N; ++j) {
                    if (true || peaks[j].life + prevPeaks[i].life > 1) {
                        w = prevPeaks[i].func(peaks[j].frequency);
                        y2 = f2y(peaks[j]);
                        context.globalAlpha = w * peaks[j].power / pmax;// * prevPeaks[i].power / (pmax * pmax);
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

        return gram;
    }

    var gram = setupGram('gram', [3, 6]);


    var mic = sh.models.mic();
    var spec = sh.models.spectrum(1024, 0.25);
    mic.connect(spec);

    var options = {significance: 15, decayFactor: 0.9, spawnThreshold: 1, dieThreshold: 0.4, 
        minVar_st: 1, octaveRange: gram.octaveRange, lifeDecayFactor: 0.75, trackingCoeff: 0.3};
    var pitch = PitchTracker(options);

    spec.time.watch(function (t) {
        var p = pitch(spec);
        gram.updateTime(t);
        display.gcount.innerText = (p ? p.peaks.length : '');
        if (p && p.sig > options.significance) {
            display.frequency.innerText = p.frequency;
            display.pitch.innerText = p.pitch;
            display.note.innerText = p.note.name + (p.error < 0 ? ' +' : ' ') + (-p.error) + ' cents';
            display.sig.innerText = p.sig;
            gram.draw(t, p.peaks);
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

}(org.anclab.steller.Scheduler, org.anclab.steller.AudioContext, srikumarks.audio.PitchTracker));
