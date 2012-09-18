
nishabdam.provide('nishabdam.audio.tanpura');

// A simple looping tanpura.
//
// var t = nishabdam.audio.tanpura(sh);
// t.connect(sh.audioContext.destination);
// sh.play(t.start);
// 
// tanpura.tuning is a MIDI note number parameter.
// tanpura.level is a linear gain parameter.
//
// To stop a tanpura, use -
//  sh.play(t.stop);
nishabdam.audio.tanpura = function (sh) {
    var steller = org.anclab.steller;
    var models = steller.Models(sh);
    var AC = sh.audioContext;
    
    var output = AC.createGainNode();
    output.gain.value = 0.25;
    var tanpura = steller.SoundModel({}, [], [output]);

    // Boolean that indicates the tanpur is ready to play.
    tanpura.ready = steller.Param({min: 0, max: 1, value: 0});

    // Output level linear gain.
    tanpura.level = steller.Param({min: 1/16, max: 1, audioParam: output.gain, mapping: 'log'});

    var f0 = 52.62; // The recorded pitch expressed as MIDI note pitch number.

    // The tanpura's tuning, expressed as standard MIDI note value.
    tanpura.tuning = steller.Param({min: 40, max: 64, value: f0});

    // A parameter alias for tanpura.tuning which reads off the value as a 
    // frequency scaling factor relative to the f0 tuning value.
    var factor = steller.Param({min: 0.125, max: 4, value: 1});
    tanpura.tuning.watch(function (v) {
        factor.value = Math.pow(2, (v - f0) / 12);
    });

    // Load the tanpura loop sample.
    var sample = models.sample('vina/tanpura.wav');
    sample.connect(output);

    var stopper;

    // Expose the loader
    tanpura.load = sh.track([
            sample.load,
            sh.fire(function () {
                // Indicate that the sample is ready. 
                // Users of tanpura can watch() the "ready" parameter for changes.
                tanpura.ready.value = 1;
            })
            ]);

    // Instantaneous start action. Automatically loads sample if not loaded already.
    tanpura.start = sh.dynamic(function (clock) {
        if (stopper) {
            // Always keep only one loop running.
            stopper.close();
        }
        stopper = sh.gate();
        return sh.spawn(sh.track([
                tanpura.load, 
                sh.rate(factor),
                sh.loop(sh.track([
                        sh.spawn(sample.play),
                        sh.delay(5),
                        stopper
                        ]))
                ]));
    });

    // Instantaneous stop action.
    tanpura.stop = sh.fire(function (clock) {
        if (stopper) {
            stopper.close();
            stopper = undefined;
        }
    });

    return tanpura;
};

