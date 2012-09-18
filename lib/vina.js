
nishabdam.provide('nishabdam.audio.vina');

nishabdam.audio.vina = function (sh) {
    var steller = org.anclab.steller;
    var pasr = nishabdam.audio.pasr;
    var AC = sh.audioContext;
    var models = steller.Models(sh);

    var output = AC.createGainNode();
    output.gain.value = 0.25;
    var vina = steller.SoundModel({}, [], [output]);
    vina.ready = steller.Param({min: 0, max: 1, value: 0});
    vina.level = steller.Param({min: 1/16, max: 1, audioParam: output.gain, mapping: 'log'});
    vina.tonic = steller.Param({min: 36, max: 72, value: 51});

    var sampleSpecs = [
    {url: "vina/string1-da.mp3", freq: 286.1},
    {url: "vina/string1-dk.mp3", freq: 269.7},
    {url: "vina/string1-ga.mp3", freq: 211.5},
    {url: "vina/string1-gk-2.mp3", freq: 199.7},
    {url: "vina/string1-gk.mp3", freq: 199.8},
    {url: "vina/string1-hi-ga.mp3", freq: 428.8},
    {url: "vina/string1-hi-gk.mp3", freq: 403.7},
    {url: "vina/string1-hi-ma.mp3", freq: 454.1},
    {url: "vina/string1-hi-mt.mp3", freq: 481.2},
    {url: "vina/string1-hi-ri.mp3", freq: 380.6},
    {url: "vina/string1-hi-rk.mp3", freq: 359.5},
    {url: "vina/string1-hi-sa.mp3", freq: 343},
    {url: "vina/string1-ma.mp3", freq: 224.4},
    {url: "vina/string1-mt.mp3", freq: 239},
    {url: "vina/string1-ni.mp3", freq: 322},
    {url: "vina/string1-nk.mp3", freq: 302.9},
    {url: "vina/string1-pa.mp3", freq: 254.4},
    {url: "vina/string1-ri.mp3", freq: 189},
    {url: "vina/string1-rk.mp3", freq: 178.9},
    {url: "vina/string1-sa.mp3", freq: 169},
    {url: "vina/string2-ga.mp3", freq: 159.9},
    {url: "vina/string2-gk.mp3", freq: 150.9},
    {url: "vina/string2-ma.mp3", freq: 169.7},
    {url: "vina/string2-ri.mp3", freq: 142.7},
    {url: "vina/string2-rk.mp3", freq: 134.9},
    {url: "vina/string2-sa.mp3", freq: 127.7}
    ];

    // Convert to MIDI note numbers.
    sampleSpecs.forEach(function (s) {
        s.pitch = Math.round(100 * (69 + 12 * Math.log(s.freq / 440) / Math.LN2)) / 100;
    });

    // Find best note number to sample mappings.
    var noteMap = {};
    var i, p, closest_i;
    for (p = 0; p < 128; ++p) {
        closest_i = 0;
        for (i = 0; i < sampleSpecs.length; ++i) {
            if (Math.abs(sampleSpecs[closest_i].pitch - p) > Math.abs(sampleSpecs[i].pitch - p)) {
                closest_i = i;
            }
        }
        noteMap[p] = closest_i;
    }

    // Prepare loader for loading samples.
    var samples = sampleSpecs.map(function (s) { 
        return models.sample(s.url); 
    });
    var sampleLoaders = samples.map(function (s) { 
        return sh.track([
            s.load,
            sh.fire(function () { s.connect(output); })
            ]);
    });
    vina.load = sh.track([
            sh.fork(sampleLoaders),
            sh.fire(function () { 
                vina.ready.value = 1; 
                console.log('vina model loaded');
            })
            ]);
    
    vina.note = function (pitch) {
        if (typeof pitch === 'number') {
            pitch = {duration: 1, curve: [pasr.pasr(Math.max(0, Math.min(pitch, 127)), 0, 1, 0)], stoppage: 0.0};
        }

        console.assert(pitch.curve);

        var p0          = pitch.curve[0].pitch;
        var rpitch      = Math.round(p0);
        var sample_i    = noteMap[rpitch];
        var sample      = samples[sample_i];
        var samplePitch = sampleSpecs[sample_i].pitch;
        var dp          = p0 - samplePitch;
        var rate        = steller.Param({min: 0.01, max: 100, value: Math.pow(2, (dp + tonic.value - 60)/12)});
        var offset      = steller.Param({min: -12, max: 12, 
            getter: function () { return samplePitch - vina.tonic.value + 60; },
            setter: function (v) { return samplePitch - vina.tonic.value + 60 }
        });

        var note        = sample.note(rate, 0.04, pitch.duration, pitch.duration - pitch.stoppage);
        var rateAnim    = pasr.gamaka(sh, rate, pitch, offset);
        return sh.track([sh.spawn(rateAnim), note]);
    };

    return vina;
};

nishabdam.audio.pasr = (function (pasr) {
    function linearInterp(t) {
        return t;
    }

    function sineInterp(t) {
        return 0.5 * (1.0 + Math.sin(Math.PI * (t - 0.5)));
    };

    var interpolations = {
        'linear': function (p1, dt1, dt2, p2) {
            return linearInterp;
        },
        'sine': function (p1, dt1, dt2, p2) {
            return sineInterp;
        },
        'skew_sine': function (p1, dt1, dt2, p2) {
            var skewPoint = dt1 / (dt1 + dt2);
            return function (t) {
                if (t <= 0.0) {
                    return 0.0;
                } else if (t >= 1.0) {
                    return 1.0;
                } else if (t < skewPoint) {
                    return 2.0 * skewPoint * sineInterp(0.5 * t / skewPoint);
                } else {
                    return 1.0 - 2.0 * (1.0 - skewPoint) * sineInterp(0.5 * (1.0 - t) / (1.0 - skewPoint));
                }
            };
        }
    };

    function st2f(st) {
        return Math.pow(2, st/12);
    }

    function gamaka(sh, param, pasrs, offset, interp) {
        var interpFn = interpolations[interp || 'skew_sine'];
        console.assert(interpFn);

        var normDur = pasr.dur(pasrs);
        var scale = 1.0;
        var duration = pasrs.duration;
        if (duration) {
            scale = duration / normDur;
        }
        var dur = scale * normDur;

        var p1, p2;
        var t;

        function konst_pitch(p) {
            return function (t) {
                return st2f(p - offset.valueOf());
            };
        }

        if (pasrs.curve.length === 1) {
            return sh.anim(param, dur, konst_pitch(pasrs.curve[0].pitch));
        }

        var anims = [];
        pasrs.curve.forEach(function (pasr, i) {
            if (i === 0) {
                anims.push(sh.anim(param, scale * (pasr.attack + pasr.sustain), konst_pitch(pasr.pitch)));
            } else {
                var p1 = pasrs.curve[i-1].pitch;
                var p2 = pasr.pitch;
                var d1 = scale * pasrs.curve[i-1].release;
                var d2 = scale * pasr.attack;
                var interp = interpFn(p1, d1, d2, p2);
                anims.push(sh.anim(param, d1 + d2,  function (t) {
                    return st2f(p1 + (p2 - p1) * interp(t) - offset.valueOf());
                }));
                if (i + 1 === pasrs.curve.length) {
                    if (pasr.sustain + pasr.release > 0) {
                        anims.push(sh.anim(param, scale * (pasr.sustain + pasr.release), konst_pitch(p2)));
                    }
                } else if (pasr.sustain > 0) {
                    anims.push(sh.anim(param, scale * pasr.sustain, konst_pitch(p2)));
                }
            }
        });

        return sh.track(anims);
    }

    pasr.pasr = function (p, a, s, r) {
        if (arguments.length === 1) {
            if (p instanceof Array) {
                return {pitch: p[0], attack: p[1], sustain: p[2], release: p[3]};
            } else {
                return {pitch: p, attack: 0, sustain: 1, release: 0};
            }
        } else {
            return {pitch: p, attack: a, sustain: s, release: r};
        }
    };

    pasr.pasrs = function (dur, stop, pasrs) {
        return {
            duration: dur,
            curve: pasrs.map(function (p) { return pasr.pasr(p); }),
            stoppage: stop
        };
    };

    pasr.gamaka = gamaka;
    pasr.interpolations = interpolations;
    pasr.dur = function (pasrs) {
        var dur = 0;
        pasrs.curve.forEach(function (pasr) {
            dur += pasr.attack + pasr.sustain + pasr.release;
        });
        return dur;
    };

    
    return pasr;
}({}));

