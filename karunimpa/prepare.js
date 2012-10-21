
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

function svgtext(elem, x, y, str, style) {
    return svgelem(elem, 'text', {x: x, y: y, style: style}, str);
}

function svgline(elem, x1, y1, x2, y2, thickness) {
    return svgelem(elem, 'line', {x1: x1, y1: y1, x2: x2, y2: y2, "stroke-width": thickness, stroke: 'black'});
}

karunimpa.defaults.time_type = 'metric';
var sections;
with (karunimpa) {
    sections = select([tag('section'), tag('level', 1), not(time('real'))]);
}

var x0 = 50, y0 = 50, x = x0, y = y0;
sections.forEach(function (sec, seci) {

    y += 20;
    svgtext(svg, x, y, text(sec.tags.section), "font-family: sans-serif; font-weight:bold; font-size:18pt");
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
            svgtext(svg, x, y, '(' + subsec.tags.index + ')');
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
            var g = svgelem(svg, 'g');
            var t = playTime(l);
            if (typeof t === 'number') {
                g.onmousedown = function (e) {
                    console.log('playing from ' + t + ' secs');
                    playFrom(t);
                };
            }

            var rect = svgelem(g, 'rect', {x: x, y: y, width: 0, height: 0, style: "fill-opacity: 0"});
            rect.box = {x1: x, y1: y, x2: x, y2: y};
            g.onmouseover = function (e) {
                rect.setAttribute('style', 'fill-opacity: 0.075');
            };
            g.onmouseout = function (e) {
                rect.setAttribute('style', 'fill-opacity: 0');
            };

            var aksharas = Array.prototype.slice.call(l.content, 0);

            aksharas.forEach(function (a, j) {
                var tpos = (l.time.metric[0] + j) % 32;
                var b = groups[groupIx];
                if (b === '||') {
                    svgline(g, x + 10, y - 20, x + 10, y + 3, 2);
                    svgline(g, x + 15, y - 20, x + 15, y + 3, 2);
                    groupIx = (groupIx + 1) % groups.length;
                    b = groups[groupIx];
                    extendRect(rect, x + 10, y - 20)(rect, x + 10, y + 3)(rect, x + 15, y - 20)(rect, x + 15, y + 3);
                } else if (b === '|') {
                    svgline(g, x + 15, y - 20, x + 15, y + 3, 2);
                    groupIx = (groupIx + 1) % groups.length;
                    b = groups[groupIx];
                    extendRect(rect, x + 15, y - 20)(rect, x + 15, y + 3);
                } else if (akshIx % b.length === b.length - 1 && groupIx + 1 < groups.length && groups[groupIx+1] === '||') {
                    svgline(g, x + 25 + 10, y - 20, x + 25 + 10, y + 3, 2);
                    svgline(g, x + 25 + 15, y - 20, x + 25 + 15, y + 3, 2);
                    groupIx = (groupIx + 1) % groups.length;
                    b = groups[groupIx];
                    extendRect(rect, x + 25 + 10, y - 20)(rect, x + 25 + 10, y + 3)(rect, x + 25 + 15, y - 20)(rect, x + 25 + 15, y + 3);
                }

                if (akshIx === 0) {
                    x += 25;
                    extendRect(rect, x, y);
                }
                var aksh = svgtext(g, x, y, a, "font-size: 14pt");
                x += 25;
                extendRect(rect, x, y);

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
                extendRect(rect, x, y + 5);
                syl.forEach(function (s, j) {
                    if (j % 4 === 0) {
                        x += 25;
                        extendRect(rect, x, y);
                    }
                    if (s !== ',') {
                        svgtext(g, x, y, s, "font-family: serif; font-style:italic; font-size: 14pt");
                    }
                    x += 25;
                    extendRect(rect, x, y);
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

function svgelem(elem, n, attrs, content) {
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
    elem.appendChild(tag);
    return tag;
}

function playTime(atom) {
    var t;
    if (atom.time.real) {
        t = atom.time.real[0];
    } else {
        with (karunimpa) {
            var s0 = select([parents_and_siblings, time('real'), not(tag('meta'))], 'metric', [atom]);
            var s = smallest(s0, 'metric');
            t = s[0] && s[0].time.real[0];
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

function extendRect(rect, x0, y0) {
    var x1a = Math.min(rect.box.x1, x0 - 3);
    var y1a = Math.min(rect.box.y1, y0 - 3);
    var x2a = Math.max(rect.box.x2, x0 + 3);
    var y2a = Math.max(rect.box.y2, y0 + 3);

    rect.box.x1 = x1a;
    rect.box.y1 = y1a;
    rect.box.x2 = x2a;
    rect.box.y2 = y2a;

    rect.setAttribute('x', rect.box.x1);
    rect.setAttribute('y', rect.box.y1);
    rect.setAttribute('width', (rect.box.x2 - rect.box.x1));
    rect.setAttribute('height', (rect.box.y2 - rect.box.y1));
    return extendRect;
}

