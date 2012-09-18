
nishabdam = {};
nishabdam.provide = (function () {
    var NS = this;

    function higherOrderModule() {
        var parts = [];

        function module() {
            var argv = Array.prototype.slice.call(arguments, 0);
            var m = {};
            parts.forEach(function (p) {
                m = p.apply(m, argv);
            });
            return m;
        }

        module.extend = function (part) {
            module.push(part);
            return module;
        };

        return module;
    }

    return function (pkg, higherOrder) {
        var names = pkg.split('.');
        var i, N, name, path = NS[names[0]];
        for (i = 1, N = names.length; i < N; ++i) {
            name = names[i];
            path[name] = path[name] || ((higherOrder && (i + 1 === N)) ? higherOrderModule() : {});
            path = path[name];
        }

        return path;
    };
}());
