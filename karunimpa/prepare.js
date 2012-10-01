
var karunimpa = nishabdam.db();

function getMeta(aType) {
    with (karunimpa) {
        return select([tag('meta'), tag('type', aType)])[0];
    }
}

karunimpa.ingest(nishabdam.performances.karunimpa_sahana);
var metaPerf = getMeta('performance');
karunimpa.ingest(metaPerf.content.notation);
var metaNot = getMeta('notation');

$e('#category').innerText    = metaNot.content.category.name;
$e('#title').innerText       = metaNot.content.title.name;
$e('#raga').innerText        = metaNot.content.raga.name;
$e('#arohana').innerText     = metaNot.content.raga.arohana;
$e('#avarohana').innerText   = metaNot.content.raga.avarohana;
$e('#tala').innerText        = metaNot.content.tala.name;
$e('#composer').innerText    = metaNot.content.composer.name;
$e('#performer').innerText   = metaPerf.content.performer.name;
$e('#album').innerText       = metaPerf.content.album.name;
$e('#audio').innerHTML = [
    '<audio id="recording_normal" controls>',
    '<source src="' + metaPerf.content.audio.normal.url + '" type="' + metaPerf.content.audio.normal.mime_type + '"/>',
    '</audio>',
    '<audio id="recording_slow" controls>',
    '<source src="' + metaPerf.content.audio.slow.url + '" type="' + metaPerf.content.audio.slow.mime_type + '"/>',
    '</audio>'
    ].join('');

	
var tree = $e('#tree');

function getLevel(n) {
    with (karunimpa) {
        return order(select([tag('level', n), time('real')]), 'real');
        return order(select([tag('level', n), time('metric')]));
    }
}

function expandLevel(parentNode, depth) {
    return function (atom) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        var t;
        if (atom.time.real) {
            t = atom.time.real[0];
        } else {
            with (karunimpa) {
                t = children_and_siblings(atom).filter(time('real')).map(function (a) { return a.time.real[0]; }).sort()[0];
            }
        }
        a.setAttribute('href', 'javascript:playFrom(' + t + ')');
        a.innerText = displayAtom(atom);//JSON.stringify(atom);
        li.insertAdjacentElement('beforeend', a);
        parentNode.insertAdjacentElement('beforeend', li);

        var nextLevel;
        with (karunimpa) {
            nextLevel = order(children_and_siblings(atom).filter(and(time('real'), tag('level', depth + 1))), 'real');
        }
        if (nextLevel.length > 0) {
            var nextLevelNode = document.createElement('ul');
            nextLevel.forEach(expandLevel(nextLevelNode, depth + 1));
            li.insertAdjacentElement('beforeend', nextLevelNode);
        }
    };
}

getLevel(1).forEach(expandLevel(tree, 1));


var svg = document.querySelector('svg');
console.assert(svg);

function svgtext(x, y, str, style) {
    var t = svgelem('text', {x: x, y: y, style: style}, str);
    svg.appendChild(t);
    return t;
}

function svgline(x1, y1, x2, y2, thickness) {
    var l = svgelem('line', {x1: x1, y1: y1, x2: x2, y2: y2, "stroke-width": thickness, stroke: 'black'});
    svg.appendChild(l);
    return l;
}

karunimpa.defaults.time_type = 'metric';
var sections;
with (karunimpa) {
    sections = select([tag('section'), tag('level', 1), not(time('real'))]);
}

var x0 = 50, y0 = 50, x = x0, y = y0;
sections.forEach(function (sec, seci) {

    y += 20;
    svgtext(x, y, text(sec.tags.section), "font-family: sans-serif; font-weight:bold; font-size:18pt");
    y += 35;

    var subsecs, tala;
    with (karunimpa) {
        tala = order(select([around, tag('tala'), not(time('real'))], 'metric', [sec]))[0];
        subsecs = select([children_and_siblings, tag('level', 2), not(time('real'))], 'metric', [sec]);
    }
    var groups = tala.content.divisions.split(/[\s]+/).filter(nonEmptyStr);
    var groupIx = 0, akshIx = 0;

    if (subsecs.length > 0) {
        subsecs.forEach(function (subsec, ssi) {
            svgtext(x, y, '(' + subsec.tags.index + ')');
            x0 += 30;
            x += 30;
            renderSec(subsec);
            x0 -= 30;
            x = x0;
            y += 15;
        });
    } else {
        renderSec(sec);
    }

    function renderSec(sec) {
        var lines;
        with (karunimpa) {
            lines = select([children_and_siblings, tag('prescription', 'svarasthana')], 'metric', [sec])
        }

        lines.forEach(function (l, i) {
            var aksharas = Array.prototype.slice.call(l.content, 0);

            aksharas.forEach(function (a, j) {
                var tpos = (l.time.metric[0] + j) % 32;
                var b = groups[groupIx];
                if (b === '||') {
                    svgline(x + 10, y - 20, x + 10, y + 3, 2);
                    svgline(x + 15, y - 20, x + 15, y + 3, 2);
                    groupIx = (groupIx + 1) % groups.length;
                    b = groups[groupIx];
                } else if (b === '|') {
                    svgline(x + 15, y - 20, x + 15, y + 3, 2);
                    groupIx = (groupIx + 1) % groups.length;
                    b = groups[groupIx];
                } else if (akshIx % b.length === b.length - 1 && groupIx + 1 < groups.length && groups[groupIx+1] === '||') {
                    svgline(x + 25 + 10, y - 20, x + 25 + 10, y + 3, 2);
                    svgline(x + 25 + 15, y - 20, x + 25 + 15, y + 3, 2);
                    groupIx = (groupIx + 1) % groups.length;
                    b = groups[groupIx];
                }

                if (akshIx === 0) {
                    x += 25;
                }
                var aksh = svgtext(x, y, a, "font-size: 14pt");
                var t = playTime(l);
                if (typeof t === 'number') {
                    aksh.onmousedown = function (e) {
                        console.log('playing from ' + t + ' secs');
                        playFrom(t);
                    };
                }
                x += 25;

                if (akshIx % b.length === b.length - 1) {
                    groupIx = (groupIx + 1) % groups.length;
                }

                akshIx = (akshIx + 1) % b.length;
            });
            x = x0;

            var lyrics;
            with (karunimpa) {
                lyrics = select([around, tag('lyrics', 'roman')], 'metric', [l]);
            }

            if (lyrics.length > 0) {
                lyrics = lyrics[0];
                var syl = lyrics.content.split(/\s+/).filter(function (s) { return s.length > 0; });
                y += 20;
                syl.forEach(function (s, j) {
                    if (j % 4 === 0) {
                        x += 25;
                    }
                    if (s !== ',') {
                        svgtext(x, y, s, "font-family: serif; font-style:italic; font-size: 14pt");
                    }
                    x += 25;
                });
                x = x0;
                y += 10;
            }

            y += 30;
        });
    }
});

svg.setAttribute('height', y + 50);

function displayAtom(atom) {
    var part = '', temp;
    if (atom.tags.section) {
        part += text(atom.tags.section);
    }

    if (atom.tags.sangati) {
        part += ' Sangati ' + atom.tags.sangati;
    }

    if (atom.tags.inter) {
        part += text(atom.tags.inter);
    }

    if (atom.tags.index) {
        part += ' (' + atom.tags.index + ')';

        if (atom.tags.section) {
            temp = textOrPrescription(atom, 1);
            if (temp.length > 0) {
                part += ' -- ' + temp;
            }
        }
    }

    if (atom.tags.line) {
        part += ' Line ' + atom.tags.line;
        temp = textOrPrescription(atom);
        if (temp.length > 0) {
            part += ' -- ' + temp;
        }
    }

    return part;
}

function textOrPrescription(atom, n) {
    var temp;
    with (karunimpa) {
        temp = order(select([children_and_siblings, tag('text')], 'metric', [atom]), 'metric');
        if (temp.length > 0) {
            return '"' + temp[0].content + '"';
        }

        temp = order(select([children_and_siblings, tag('prescription', 'svarasthana')], 'metric', [atom]), 'metric');
        if (temp.length > 0) {
            return temp.slice(0, n || temp.length).map(function (a) { return a.content; }).join(' | ');
        }
    }

    return '';
}

function text(key, lang) {
    lang = lang || 'roman';
    var def = {};
    def[lang] = key;
    var result = (metaNot.content.text[key] || metaPerf.content.text[key] || def)[lang];
    return result.charAt(0).toLocaleUpperCase() + result.substr(1);
}

function $e(sel) {
    return document.querySelector(sel);
}

function svgelem(n, attrs, content) {
    var tag = document.createElementNS('http://www.w3.org/2000/svg', n);
    if (attrs) {
        for (var k in attrs) {
            if (attrs[k]) {
                tag.setAttribute(k, attrs[k]);
            }
        }
    }
    if (content) {
        tag.textContent = content;
    }
    return tag;
}

function playTime(atom) {
    var t;
    if (atom.time.real) {
        t = atom.time.real[0];
    } else {
        with (karunimpa) {
            var s = smallest(select([around, time('real'), or(tag('level', (atom.tags.level || 3)), tag('level', (atom.tags.level || 2))), not(tag('meta'))], 'metric', [atom]), 'real');
            t = s[0].time.real[0];
        }
    }
    return t;
}

function nonEmptyStr(s) {
    return s.length > 0;
}

function flatten(arr) {
    return Array.prototype.concat.apply([], arr);
}
