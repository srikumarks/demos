
function elements(ids) {
    var obj = {};
    ids.forEach(function (id) { 
        obj[id] = document.getElementById(id);
    });
    return obj;
}

var E = elements(["raga", "svaras", "raga_match", "input_match", "shift", "graha_bhedam", "sruti_bhedam", , "graha_match", "sruti_match", "raga_info"]);

function findRagaMatch(svaras) {
    return "none";
}

var svarasthanas = {
    S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6, P: 7, d: 8, D: 9, n: 10, N: 11,
    'Ṡ': 12, 'ṙ': 13, 'Ṙ': 14, 'ġ': 15, 'Ġ': 16, 'ṁ': 17, 'Ṁ': 18, 'Ṗ': 19, 'ḋ': 20, 'Ḋ': 21, 'ṅ': 22, 'Ṅ': 23
};

var sthanaNames = {
    0: 'S', 1: 'r', 2: 'R', 3: 'g', 4: 'G', 5: 'm', 6: 'M', 7: 'P', 8: 'd', 9: 'D', 10: 'n', 11: 'N',
    12: 'Ṡ', 13: 'ṙ', 14: 'Ṙ', 15: 'ġ', 16: 'Ġ', 17: 'ṁ', 18: 'Ṁ', 19: 'Ṗ', 20: 'ḋ', 21: 'Ḋ', 22: 'ṅ', 23: 'Ṅ'
};


var svarasPat = /[SrRgGmMPdDnN]/g;

function fold(c, n) {
    if (c < 0) {
        return (c + 12) % n;
    } else {
        return c % n;
    }
}

var RagaDBKV = {};
RagaDB.forEach(function (r) {
    RagaDBKV[r[0]] = r;
});

function grahaBhedam(input, shift) {
    var inSvaras = input.match(svarasPat);
    var refSvara = shift.match(svarasPat)[0];

    var steps = inSvaras.join('').indexOf(refSvara);

    if (steps < 0) {
        return {bhedam: "{Svara not found}", match: []};
    }

    steps = steps % inSvaras.length;

    if (inSvaras[0] === inSvaras[inSvaras.length - 1]) {
        // We don't need the last one.
        inSvaras.pop();
    }

    var classes = inSvaras.map(function (s) { return svarasthanas[s]; });
    var cycle = classes.concat(classes.map(function (c) { return c + 12; }));
    var intervals = cycle.slice(1).map(function (c, i) {
        return (c - cycle[i]);
    });

    var shifted = intervals.slice(steps, steps + inSvaras.length);
    var shiftedClasses = shifted.reduce(function (acc, s) {
        acc.push(acc[acc.length - 1] + s);
        return acc;
    }, [0]);
    var shiftedSvaras = shiftedClasses.map(function (c) {
        return sthanaNames[fold(c, 24)];
    });

    var b = shiftedSvaras.join('');
    return {bhedam: b, match: identify(RagaDB, b)};
}

function srutiBhedam(input, shift) {
    var inSvaras = input.match(svarasPat);
    var refSvara = shift.match(svarasPat)[0];

    var shiftST = svarasthanas[refSvara];

    if (inSvaras[0] === inSvaras[inSvaras.length - 1]) {
        // We don't need the last one.
        inSvaras.pop();
    }

    var classes = inSvaras.map(function (s) { return svarasthanas[s]; });
    var cycle = classes.concat(classes.map(function (c) { return c + 12; }));
    var intervals = cycle.slice(1).map(function (c, i) {
        return (c - cycle[i]);
    });
    var bhedam = intervals.reduce(function (acc, d) {
        acc.push(acc[acc.length - 1] + d);
        return acc;
    }, [shiftST - 12]);
    var bhedamSvaras = bhedam.map(function (c) {
        return sthanaNames[fold(c, 24)];
    });

    var offset = bhedamSvaras.join('').indexOf('S');
    if (offset < 0) {
        return {bhedam: "{Invalid}", match: []};
    }

    var b = bhedamSvaras.slice(offset, offset + inSvaras.length + 1).join('');
    return {bhedam: b, match: identify(RagaDB, b)};
}

function identify(db, svaras) {
    svaras = Array.prototype.slice.call(svaras, 0).map(function (s) {
        return sthanaNames[(12 + svarasthanas[s]) % 12];
    }).join('');

    var candidates = db.filter(function (r) {
        return r[1].some(function (s) {
            return s.indexOf(svaras) >= 0;
        }) || r[2].some(function (s) {
            return s.indexOf(svaras) >= 0;
        });
    });

    return candidates.map(function (c) {
        return c[0];
    });
}

function showRaga(name) {
    var r = RagaDBKV[name];
    E.raga.value = r[0];
    E.raga_info.innerHTML = '<h3>' + r[0] + '</h3> arohanam: ' + r[1].join(', ') + '<br/>avarohanam: ' + r[2].join(', ');
}

function format(ragas, func) {
    func = func || 'showRaga';
    var suffix = '';
    if (ragas.length > 10) {
        var n = ragas.length - 10;
        ragas = ragas.slice(0, 10);
        suffix = ', ... ' + n + ' more';
    } 

    ragas = ragas.map(function (r) {
        return '<a href=\'javascript:' + func + '("' + r + '")\'>' + r + '</a>';
    });

    return ragas.join(', ') + suffix;
}

var inputs = {raga: '', svaras: '', shift: ''};

function search(ragaName) {
    ragaName = ragaName.toLowerCase();
    return RagaDB.filter(function (r) {
        return r[0].toLowerCase().indexOf(ragaName) >= 0;
    });
}

function setRaga(ragaName) {
    var r = RagaDBKV[ragaName];
    E.svaras.value = r[1][0];
    showRaga(ragaName);
}

function onchange() {
    var ragaVal = E.raga.value;
    var inputVal = E.svaras.value;
    var shiftVal = E.shift.value;

    if (inputs.raga !== ragaVal) {
        inputs.raga = ragaVal;
        var result = search(ragaVal);
        if (result.length > 0) {
            E.svaras.value = inputVal = result[0][1][0];
            E.raga_match.innerHTML = format(result.map(function (r) { return r[0]; }), 'setRaga');
        }
    }

    if (inputs.svaras !== inputVal || inputs.shift !== shiftVal) {
        // Need to update.
        inputs.svaras = inputVal;
        inputs.shift = shiftVal;

        try {
            E.input_match.innerHTML = inputVal.length > 0 ? format(identify(RagaDB, inputVal)) : '';
            var gb = grahaBhedam(inputVal, shiftVal);
            E.graha_bhedam.innerText = gb.bhedam;
            E.graha_match.innerHTML = format(gb.match);
            var sb = srutiBhedam(inputVal, shiftVal);
            E.sruti_bhedam.innerText = sb.bhedam;
            E.sruti_match.innerHTML = format(sb.match);
        } catch (e) {
        }
    }
}

setInterval(onchange, 100);

