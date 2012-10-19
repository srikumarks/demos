console.assert(org.anclab.steller);
console.assert(srikumarks.audio.pitch);

(function (Scheduler, AudioContext, pitch) {
    var sh = new Scheduler(new AudioContext());
    console.assert(sh.models);

    var display = elements(['frequency', 'pitch', 'note', 'sig']);

    var mic = sh.models.mic();
    var spec = sh.models.spectrum(1024, 0.25);
    mic.connect(spec);

    var options = {significance: 12};

    spec.time.watch(function (t) {
        var p = pitch(spec, options);
        if (p) {
            display.frequency.innerText = p.frequency;
            display.pitch.innerText = p.pitch;
            display.note.innerText = p.note.name + (p.error < 0 ? ' +' : ' ') + (-p.error) + ' cents';
            display.sig.innerText = p.sig;
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
}(org.anclab.steller.Scheduler, org.anclab.steller.AudioContext, srikumarks.audio.pitch));
