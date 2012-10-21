// Copyright (c) 2012 Srikumar K. S. (http://github.com/srikumarks)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// This is a naive pitch detector that looks at the tallest peak in
// the power spectrum.
//
// Call like this -
//      var p = srikumarks.audio.pitch(spectrumModel, {significance: 12});
// where 
//      spectrumModel.bins = array of frequency bin powers (power spectrum)
//      spectrumModel.freqs = array of bin centre frequencies
//
// An instance of sh.models.spectrum fits the bill for spectrumModel.
// (sh = instance of org.anclab.steller.Scheduler)
// 
// The result will have the following information -
//      p.frequency = The measured pitch's frequency
//      p.pitch     = Frequency expressed as MIDI note number, up to cents precision (2 dec places).
//      p.note      = {midi: <MIDI note number as integer>, name: <Pitch name such as D#5>}
//      p.error     = The error between the approximate MIDI note and the measured pitch, expressed in cents.
//      p.sig       = The relative signal strength of the measured pitch. Higher the better.
//
// If the signal is not considered to have a pitch, then the return value will be null.
//
try { srikumarks = srikumarks || {}; } catch (e) { srikumarks = {}; }
srikumarks.audio = srikumarks.audio || {};

srikumarks.audio.PitchTracker = function PitchTracker(options) {

    // Process options
    var kDecayFactor        = options && options.hasOwnProperty('decayFactor') ? options.decayFactor : 0.9;
    var kSignificance       = options && options.hasOwnProperty('significance') ? options.significance : 15;
    var kDieThreshold       = options && options.hasOwnProperty('dieThreshold') ? options.dieThreshold : 0.2;
    var kSpawnThreshold     = options && options.hasOwnProperty('spawnThreshold') ? options.spawnThreshold : 1.0;
    var kMinVar_st          = options && options.hasOwnProperty('minVar_st') ? options.minVar_st : 1.0;
    var kMinLife            = options && options.hasOwnProperty('minLife') ? options.minLife : 2.0;
    var kSubharmonics       = options && options.hasOwnProperty('subharmonics') ? options.subharmonics : 5;
    var kTrackingCoeff      = options && options.hasOwnProperty('trackingCoeff') ? options.trackingCoeff : 0.5;
    var kLifeDecayFactor    = options && options.hasOwnProperty('lifeDecayFactor') ? options.lifeDecayFactor : 0.9;
    var kMinOctave          = (options && options.hasOwnProperty('octaveRange') ? options.octaveRange[0] : 1) * 12;
    var kMaxOctave          = (options && options.hasOwnProperty('octaveRange') ? options.octaveRange[1] : 10) * 12;

    // The gaussians that track pitch.
    var gaussians = [];

    // The top level function. Call with the spectrum object as argument 
    // and it will return an object with info about the frequencies in the spectrum.
    // If the spectrum isn't considered "pitchy", then the return will be null.
    function pitch(spec) {
        var stats = specStats(spec.bins, spec.freqs);
        var peaks = filterPeaks(findPeaks(spec.bins, spec.freqs), stats, 0.4 * kSignificance);
        if (peaks.length > 0) {
            var i, N;
            for (i = 0, N = peaks.length; i < N; ++i) {
                peaks[i].sig = (peaks[i].power - stats.power.mean) / stats.power.sigma;
                considerPeak(gaussians, peaks[i]);
            }

            // The "tallest peak" heuristic is rather naive actually and can result in
            // harmonic and octave jumps. You can improve on this by looking at multiple
            // peaks in the above peaks array.
            var tallest = findTallest(gaussians);
            if (tallest) {
                var sig = tallest.power; // (tallest.power - stats.power.mean) / stats.power.sigma;
                if (true || sig > kSignificance) {
                    return {
                        frequency: prec(tallest.frequency, 100),
                        pitch: midic(tallest.frequency),
                        note: {midi: midi(tallest.frequency), name: pitchName(midi(tallest.frequency))},
                        error: Math.round(1200 * Math.log(hz(midi(tallest.frequency)) / tallest.frequency) / Math.LN2),
                        sig: prec(sig, 100),
                        peaks: copyGaussians(gaussians)
                    };
                }
            }
        }

        return null;
    }

    function considerPeak(gaussians, peak) {
        // First try to fit the peak within one of the gaussians.
        var i, N, p, presp, g, pmax = 0, maxpower = 0, f, factor;
        var minVar = Math.pow(2, kMinVar_st / 12) - 1, life = 1;
        for (i = 0, N = gaussians.length; i < N; ++i) {
            g = gaussians[i];
            for (factor = 1; factor <= kSubharmonics; ++factor) {
                // Consider sub harmonics too.
                f = peak.frequency / factor;
                p = Math.exp(- 0.5 * g.coeff * sq(f - g.frequency));
                presp = p * kTrackingCoeff;
                g.frequency += presp * (f - g.frequency);
                g.frequency2 += presp * (sq(f) - g.frequency2);
                g.life += p;
                g.coeff = 1 / Math.max(sq(minVar * g.frequency), g.frequency2 - sq(g.frequency));
                g.power += p * Math.pow(2, 0 * g.life) * peak.sig / Math.pow(factor, 2);
                maxpower = Math.max(maxpower, g.power);
                pmax += p * g.power;
            }
            life += g.life;
            g.life *= kLifeDecayFactor;
        }

        // The peak didn't belong to any gaussian. Add a new gaussian for it
        // and decay the rest of the gaussians.
        for (i = 0, N = gaussians.length; i < N; ++i) {
            gaussians[i].power *= kDecayFactor;
        }

        if (pmax < kSpawnThreshold * peak.power * Math.max(0.5, life)) {
            // Less than 10% chance of matching any of the gaussians.
            // Make a new one for this.
            gaussians.push({
                frequency: peak.frequency,
                frequency2: sq(peak.frequency),
                coeff: 1 / sq(minVar * peak.frequency),
                power: peak.sig,
                life: 1,
                octaveOffset: octaveOffset(peak.frequency),
                func: gaussianFunc
            });

            maxpower = Math.max(maxpower, 0.1 * peak.sig);
        }

       // Remove all gaussians below 1/10 of maxpower.
        var filtered = gaussians.filter(function (g) {
            //return g.life * g.power > kDieThreshold * (maxpower * life);
            return g.life > kDieThreshold * Math.max(0.1, life);
            //return g.power > dieThreshold * maxpower;
        });

        gaussians.splice(0, gaussians.length);
        gaussians.push.apply(gaussians, filtered);
        return gaussians;
    }

    function octaveOffset(f) {
        var st = midi(f);
        var offset = 0;
        while (st + offset > kMaxOctave) {
            offset -= 12;
        }
        while (st + offset < kMinOctave) {
            offset += 12;
        }
        return offset;
    }

    function gaussianFunc(f) {
        return Math.exp( - 0.5 * this.coeff * sq(f - this.frequency) );
    }

    function copyGaussians(gaussians) {
        var gs = [];
        var i, N;
        for (i = 0, N = gaussians.length; i < N; ++i) {
            gs.push({
                frequency:      gaussians[i].frequency,
                frequency2:     gaussians[i].frequency2,
                coeff:          gaussians[i].coeff,
                power:          gaussians[i].power,
                life:           gaussians[i].life,
                octaveOffset:   gaussians[i].octaveOffset,
                func:           gaussians[i].func
            });
        }

        return gs;
    }


    // Whole spectrum statistics. Gives you mean and variance of frequency and bin power.
    function specStats(bins, freqs) {
        var i, N, hsum = 0, h2sum = 0, fsum = 0, f2sum = 0;
        for (i = 0, N = bins.length; i < N; ++i) {
            hsum += bins[i];
            h2sum += bins[i] * bins[i];
            fsum += bins[i] * freqs[i];
            f2sum += bins[i] * freqs[i] * freqs[i];
        }

        fsum /= hsum;
        f2sum /= hsum;
        h2sum /= bins.length;
        hsum /= bins.length;

        return {
            frequency: {mean: prec(fsum, 100), sigma: prec(Math.sqrt(f2sum - fsum * fsum), 1000)},
            power: {mean: hsum, sigma: Math.sqrt(h2sum - hsum * hsum)}
        };
    }

    // Given an array of peaks, find the tallest one.
    // This is a naive heuristic to get at the pitch of a signal.
    function findTallest(peaks) {
        var i, N, tallest_ix, power = 0;
        for (i = 0, N = peaks.length; i < N; ++i) {
            if (peaks[i].life > kMinLife && peaks[i].power > power) {
                tallest_ix = i;
                power = peaks[i].power;
            }
        }

        if (tallest_ix !== undefined) {
            return peaks[tallest_ix];
        }

        return undefined;
    }

    // Pares down the given list of peaks based on whole spectrum
    // stats and the given significance.
    function filterPeaks(peaks, stats, significance) {
        if (peaks.length === 0) {
            return peaks;
        }

        return peaks.filter(function (p) {
            return p.power > stats.power.mean + stats.power.sigma * significance;
        });
    }

    // Scans the bins and finds local maxima in the power spectrum.
    // The return value is an array of {index:, frequency:, sigma:, power:} objects.
    function findPeaks(bins, freqs) {
        var i, N, f, f2, sum, mean, sigma, peaks = [];
        for (i = 2, N = bins.length - 2; i < N; ++i) {
            if (bins[i] > 0.25 * (bins[i-2] + bins[i-1] + bins[i+1] + bins[i+2])) {
                sum = bins[i-2] + bins[i-1] + bins[i] + bins[i+1] + bins[i+2];
                f = bins[i-2] * freqs[i-2] + bins[i-1] * freqs[i-1] + bins[i] * freqs[i] + bins[i+1] * freqs[i+1] + bins[i+2] * freqs[i+2];
                f2 = bins[i-2] * sq(freqs[i-2]) + bins[i-1] * sq(freqs[i-1]) + bins[i] * sq(freqs[i]) + bins[i+1] * sq(freqs[i+1]) + bins[i+2] * sq(freqs[i+2]);
                mean = f/sum;
                sigma = Math.sqrt(f2/sum - mean*mean);
                peaks.push({
                    index: i,
                    frequency: mean,
                    sigma: sigma,
                    power: bins[i]
                });
            }
        }

        return peaks;
    }

    function sq(x) { return x * x; }

    // Hz to midi, up to cents precision.
    function midic(hz) {
        return Math.round(100 * (57 + 12 * Math.log(hz / 220) / Math.LN2)) / 100;
    }

    // Hz to midi up to semitone precision.
    function midi(hz) {
        return Math.round(57 + 12 * Math.log(hz / 220) / Math.LN2);
    }

    // midi to Hz, up to 0.01Hz precision.
    function hz(midi) {
        return prec(220 * Math.pow(2, (midi - 57) / 12), 100);
    }

    var pitchClasses = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    function pitchName(p) {
        var pclass = pitchClasses[Math.round(p % 12)];
        var octave = Math.floor(p/12);
        return pclass + octave;
    }

    // Reduces precision of n up to a factor of p.
    // If you want up to 2 decimal places, for example,
    // you call prec(n, 100).
    function prec(n, p) {
        return Math.round(p * n) / p;
    }

    return pitch;
};
