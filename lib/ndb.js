

nishabdam.provide('nishabdam.db');

nishabdam.db = function () {
    var self = this === window ? {} : this;
    var id = 1;

    // The database is a simple array of "atoms".
    // Each atom is an object with three fields -
    //      atom.time = {real: [t1, t2], metric: [t1, t2], ...other time types...}
    //      atom.tags = {key1: true || value1, key2: true || value2, ...}
    //      atom.content = {...any JSON-able object...}
    var atoms = [];

    function copyAtom(atom) {
        return {
            time: atom.time,
            tags: atom.tags,
            content: atom.content
        };
    }

    // Adds new atoms to the database.
    function ingest(newAtoms) {
        // The simplest form of ingestion is to append the
        // new atoms to the existing atoms array. We work
        // with the atoms array using map/filter/reduce/insert/delete
        newAtoms = newAtoms.map(copyAtom);
        Array.prototype.push.apply(atoms, newAtoms);

        newAtoms.forEach(function (a) {
            a.id = id++;
        });

        return self;
    }

    // Given a test function, finds all atoms that satisfy the 
    // test.
    function find(test, timeType) {
        timeType = timeType || self.defaults.time_type;
        return atoms.filter(function (atom) { return test(atom, timeType); });
    }

    // Keeps only atoms that satisfy the given test.
    function keep(test, timeType) {
        return atoms = find(test, timeType);
    }
   
    // Removes atoms that satisfy the test. Returns
    // an array of the removed atoms.
    function remove(test, timeType) {
        var result = find(test, timeType);
        keep(not(test), timeType);
        return result;
    }

    // Tests for the given tag name.
    // The return value is a test function that can be
    // passed to `find`.
    function tag(name, value) {
        if (arguments.length < 2) {
            return function (atom) {
                return name in atom.tags;
            };
        } else {
            return function (atom) {
                return atom.tags[name] === value;
            };
        }
    }

    // Tests for the given time type.
    function time(timeType) {
        return function (atom) {
            return timeType in atom.time;
        };
    }

    function flatten(arrs) {
        return Array.prototype.concat.apply([], arrs);
    }

    // Selects from the database based on an array of filtering instructions.
    // Each instruction in the "path" argument (which must be an array) is expected
    // to be a function that takes two arguments - i.e. of the form 
    //
    //      function (atom, timeType) {...}
    //
    // The return value can be one of two types -
    //      1. boolean -> In this case, the function is taken to be filter to be 
    //         applied to a running set of atoms. Consecutive filters therefore
    //         reduce the set of atoms under consideration.
    //      2. array of atoms -> In this case, the operation is taken to be a
    //         "map and join". The function is applied to each atom in the running
    //         set, the resulting arrays are all concatenated and de-duplicated. The
    //         resulting array of atoms becomes the running set for processing the
    //         next operation.
    //
    // `select` together with the predicates and combinators forms a small query
    // language for atoms. You can write query scripts like this -
    //  
    //      function textChildrenOfSections(db) {
    //          with (db) {
    //              return select([tag('section'), children, tag('text')]);
    //          }
    //      }
    //
    //      function sectionsWithTextChildren(db) {
    //          with (db) {
    //              return select([tag('section'), has(children, tag('text'))]);
    //          }
    //      }
    //
    //      function sectionsWithGivenDepth(db, depth) {
    //          with (db) {
    //              return select([tag('section'), tag('depth', depth)]);
    //          }
    //      }
    //
    //      function lyricsWhichHaveBeenSplitIntoLinesOrWords(db) {
    //          with (db) {
    //              return select([tag('lyrics'), has(children, or(tag('line'), tag('word')))]);
    //          }
    //      }
    //
    // When you call such a script on a db, you get an array of atoms.
    //
    function select(path, timeType, givenAtoms) {
        var result = givenAtoms || atoms;
        if (result.length > 0) {
            path.forEach(function (predicate) {
                var test, a, temp, i, N;
                if (result.length > 0) {
                    temp = [];
                    a = result[0];
                    test = predicate(a, timeType);
                    if (typeof test === 'boolean') {
                        if (test) {
                            temp.push(a);
                        }
                        for (i = 1, N = result.length; i < N; ++i) {
                            if (predicate(result[i], timeType)) {
                                temp.push(result[i]);
                            }
                        }
                        result = temp;
                    } else if (typeof test === 'object' && 'length' in test) {
                        temp.push(test);
                        for (i = 1, N = result.length; i < N; ++i) {
                            temp.push(predicate(result[i], timeType));
                        }
                        result = dedup(flatten(temp));
                    } else {
                        throw new Error('Invalid predicate');
                    }
                    result
                }
            });
            return result;
        } else {
            return [];
        }
    }


    // Turns a select into a map-join that can be embedded within
    // another select.
    function whose() {
        var path = Array.prototype.slice.call(arguments, 0);
        return function (atom, timeType) {
            return select(path, timeType, [atom]);
        };
    }

    // Turns a select into a predicate that tests whether the resulting 
    // selection yields a non-empty result. The result itself is discarded.
    function has() {
        var path = Array.prototype.slice.call(arguments, 0);
        return function (atom, timeType) {
            var result = select(path, timeType, [atom]);
            return result.length > 0;
        };
    }

    // Tests for overlap with the given interval.
    // The type is 'metric' if left unspecified, but
    // can be anything available in the database.
    // The test will filter those atoms that intersect
    // with the given time interval (including those
    // that touch).
    function near(interval) {
        var t1 = interval[0] || 0;
        var t2 = interval[1] || t1;

        return function (atom, timeType) {
            if (!(timeType in atom.time)) {
                return false;
            }

            var dt = atom.time[timeType];
            var t1a = dt[0] || 0;
            var t2a = dt[1] || t1a;

            var t1b = Math.max(t1a, t1);
            var t2b = Math.min(t2a, t2);

            return t2b > t1b;
        };
    }

    // Similar to `at` but the atom must be strictly contained
    // in the given interval. Exact interval match is also permitted.
    function strictlyWithin(interval) {
        var t1 = interval[0] || 0;
        var t2 = interval[1] || 1e16;

        return function (atom, timeType) {
            if (!(timeType in atom.time)) {
                return false;
            }

            var dt = atom.time[timeType];
            var t1a = dt[0] || 0;
            var t2a = dt[1] || 1e16;

            return t1a >= t1 && t2a <= t2 && (t2a - t1a < t2 - t1);
        };
    }

    // Similar to `at` but the atom must be strictly contained
    // in the given interval. Exact interval match is also permitted.
    function within(interval) {
        var t1 = interval[0] || 0;
        var t2 = interval[1] || 1e16;

        return function (atom, timeType) {
            if (!(timeType in atom.time)) {
                return false;
            }

            var dt = atom.time[timeType];
            var t1a = dt[0] || 0;
            var t2a = dt[1] || 1e16;

            return t1a >= t1 && t2a <= t2;
        };
    }

    // Opposite of `within`. Returns a test for atoms
    // that contain the given interval.
    function strictlyContaining(interval) {
        var t1 = interval[0] || 0;
        var t2 = interval[1] || 1e16;

        return function (atom, timeType) {
            if (!(timeType in atom.time)) {
                return false;
            }

            var dt = atom.time[timeType];
            var t1a = dt[0] || 0;
            var t2a = dt[1] || 1e16;

            return t1a <= t1 && t2a >= t2 && (t2a - t1a > t2 - t1);
        };
    }

    // Opposite of `within`. Returns a test for atoms
    // that contain the given interval.
    function containing(interval) {
        var t1 = interval[0] || 0;
        var t2 = interval[1] || 1e16;

        return function (atom, timeType) {
            if (!(timeType in atom.time)) {
                return false;
            }

            var dt = atom.time[timeType];
            var t1a = dt[0] || 0;
            var t2a = dt[1] || 1e16;

            return t1a <= t1 && t2a >= t2;
        };
    }

    function hierarchy(predicate) {
        return function (atom) {
            return find(or.apply(null, Object.keys(atom.time).map(function (timeType) {
                return and(time(timeType), bindTimeType(predicate(atom.time[timeType]), timeType));
            })));
        };
    }

    function bindTimeType(predicate, timeType) {
        return function (atom) {
            return predicate(atom, timeType);
        };
    }

    // Finds temporal children of the given atom. The result is an
    // array of atoms.
    function children(includeSiblings) {
        return hierarchy(includeSiblings ? within : strictlyWithin);
    }

    // Finds temporal parents of the given atom. The result is an
    // array of atoms.
    function parents(includeSiblings) {
        return hierarchy(includeSiblings ? containing : strictlyContaining);
    }

    // `and` higher order filter combinator.
    // Returns a test function that will succeed
    // on an atom if all the given test functions
    // succeed.
    function and() {
        var filts = Array.prototype.slice.call(arguments, 0);
        return function (atom, timeType) {
            var i, N, f = filts;
            for (i = 0, N = f.length; i < N; ++i) {
                if (!(f[i](atom, timeType))) {
                    return false;
                }
            }
            return true;
        };
    }

    // `or` higher order filter combinator.
    // Returns a test function that will succeed on
    // an atom if any one of the given tests succeeds.
    function or() {
        var filts = Array.prototype.slice.call(arguments, 0);
        return function (atom, timeType) {
            var i, N, f = filts;
            for (i = 0, N = f.length; i < N; ++i) {
                if (f[i](atom, timeType)) {
                    return true;
                }
            }
            return false;
        };
    }

    // `not` higher order filter combinator.
    // Returns a test function that will suceed wherever
    // the given `filt` will fail.
    function not(filt) {
        return function (atom, timeType) {
            return !filt(atom, timeType);
        };
    }

    // Returns an array of the smallest atoms w.r.t the given time type.
    function smallest(atoms, timeType) {
        timeType = timeType || self.defaults.time_type;
        var incorder = atoms.filter(time(timeType)).sort(function (a, b) {
            return (a.time[timeType][1] - a.time[timeType][0]) - (b.time[timeType][1] - b.time[timeType][0]);
        });

        if (incorder.length > 0) {
            var refix = 0;
            var refdur = incorder[refix].time[timeType][1] - incorder[refix].time[timeType][0];
            for (var i = 1; i < incorder.length; ++i) {
                if (incorder[i].time[timeType][1] - incorder[i].time[timeType][0] > refdur) {
                    return incorder.slice(0, refix + 1);
                } else {
                    refix = i;
                }
            }
        }

        return incorder;
    }

    function toJSON() {
        return JSON.stringify(atoms.map(copyAtom));
    }

    function timeOrder(arr, timeType) {
        timeType = timeType || self.defaults.time_type;
        return arr.slice(0).sort(function (a, b) {
            return a.time[timeType][0] - b.time[timeType][0];
        });
    }

    function dedup(atoms) {
        var resultHash = {};
        atoms.forEach(function (a) {
            resultHash[a.id] = a;
        });

        var result = [];
        for (var k in resultHash) {
            result.push(resultHash[k]);
        }

        return result;
    }

    function inherit(obj, base) {
        var result = base || {};
        for (var k in obj) {
            result[k] = obj[k];
        }
        return result;
    }

    // Exports
    self.defaults = { time_type: 'metric' };
    self.ingest = ingest;
    self.find = find;
    self.keep = keep;
    self.remove = remove;
    self.select = select;
    self.whose = whose;
    self.has = has;
    self.tag = tag;
    self.time = time;
    self.near = near;
    self.within = within;
    self.smallest = smallest;
    self.containing = containing;
    self.strictly_within = strictlyWithin;
    self.strictly_containing = strictlyContaining;
    self.children = children();
    self.parents = parents();
    self.children_and_siblings = children(true);
    self.parents_and_siblings = parents(true);
    self.around = hierarchy(near);
    self.and = and;
    self.or = or;
    self.not = not;
    self.toJSON = toJSON;
    self.order = timeOrder;
    self.inherit = inherit;

    return self;
};
