'use string';

var _ = require('lodash');
var glob = require('glob');

var modules = {};

module.exports = {
    get: get,
    declare: declare,
    load: load
};

function get(name) {
    var module = modules[name];
    if (!module.instance) {
        module.instance = instantiate(module);
    }

    return module.instance;
}

function declare(name, func) {
    modules[name] = {
        name: name,
        func: func
    }
}

function load(patterns, patterns_to_ignore) {
    if (!_.isArray(patterns)) {
        patterns = [patterns];
    }

    patterns.forEach(function(pattern) {
        var files = glob.sync(pattern, {
            nodir: true,
            ignore: patterns_to_ignore
        });
        files.forEach(function(file) {
            require(file);
        });
    });
}

function instantiate(module) {
    var text = module.func.toString();
    var open = text.indexOf('(');
    var close = text.indexOf(')');
    var params_text = text.substring(open + 1, close);
    var params = params_text.split(',');
    params = _(params)
        .map(function(param) {
            param = param.trim();
            return param === "" ? null : get(param);
        })
        .compact()
        .value();

    function injector(args) {
        return module.func.apply(this, args);
    }

    injector.prototype = module.func.prototype;

    return new injector(params);
}
