
function elements(ids) {
    var obj = {};
    ids.forEach(function (id) { 
        obj[id] = document.getElementById(id);
    });
    obj.ids = ids;
    return obj;
}

var E = elements(["raga", "svaras", "raga_match", "input_match", "raga_info"]);

var G = elements(["gr1", "gr2", "gg1", "gg2", "gm1", "gm2", "gp", "gd1", "gd2", "gn1", "gn2"]);
var S = elements(["sr1", "sr2", "sg1", "sg2", "sm1", "sm2", "sp", "sd1", "sd2", "sn1", "sn2"]);
var bhedamSvaras = "rRgGmMPdDnN";

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

function findMelaKartas(db) {
    var result = {};

    db.forEach(function (r) {
        // Only one arohana and one avarohana
        if (r[1].length !== 1 || r[2].length !== 1) {
            return;
        }

        if (r[1][0].match(/^S(rR|rg|rG|Rg|RG|gG)[mM]P(dD|dn|dN|Dn|DN|nN)S$/) 
            && Array.prototype.slice.call(r[1][0]).reverse().join('') === r[2][0]) {
            result[r[0]] = true;
        }
    });

    return result;
}

var Melakartas = findMelaKartas(RagaDB);

function grahaBhedam(input, shift) {
    var inSvaras = input.match(svarasPat);
    var refSvara = shift.match(svarasPat)[0];

    var steps = inSvaras.join('').indexOf(refSvara);

    if (steps < 0) {
        return {bhedam: "N/A", match: []};
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
        return {bhedam: "N/A", match: []};
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

function taggedRaga(r) {
    return (Melakartas[r] ? '*' : '') + r;
}

function showRaga(name) {
    var r = RagaDBKV[name];
    E.raga.value = r[0];
    E.raga_info.innerHTML = '<h3>' + r[0] + (Melakartas[r[0]] ? ' <small>(mela)</small>' : '') + '</h3> arohanam: ' + r[1].join(', ') + '<br/>avarohanam: ' + r[2].join(', ');
}

function format(ragas, func) {
    func = func || 'showRaga';
    var suffix = '';
    if (ragas.length > 13) {
        var n = ragas.length - 8;
        ragas = ragas.slice(0, 8);
        suffix = ', ... ' + n + ' more';
    } 

    ragas = ragas.map(function (r) {
        return '<a href=\'javascript:' + func + '("' + r + '")\'>' + taggedRaga(r) + '</a>';
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
    var svarasChanged = false;

    if (inputs.svaras !== inputVal) {
        // Need to update.
        svarasChanged = true;
        inputs.svaras = inputVal;

        E.input_match.innerHTML = inputVal.length > 0 ? format(identify(RagaDB, inputVal)) : '';
        
        var i, N, gb, sb;
        for (i = 0, N = bhedamSvaras.length; i < N; ++i) {
            try {
                gb = grahaBhedam(inputVal, bhedamSvaras[i]);
                G[G.ids[i]].innerHTML = '<b>' + gb.bhedam + '</b> ' + format(gb.match);
                sb = srutiBhedam(inputVal, bhedamSvaras[i]);
                S[S.ids[i]].innerHTML = '<b>' + sb.bhedam + '</b> ' + format(sb.match);
            } catch (e) {
            }
        }
    }

    if (inputs.raga !== ragaVal) {
        inputs.raga = ragaVal;
        var result = search(ragaVal);
        if (result.length > 0) {
            if (!svarasChanged) {
                E.svaras.value = inputVal = result[0][1][0];
            }
            E.raga_match.innerHTML = format(result.map(function (r) { return r[0]; }), 'setRaga');
        }
    }

    
}


setInterval(onchange, 100);

