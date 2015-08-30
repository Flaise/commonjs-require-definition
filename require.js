(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/') === 0) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };
  
  var expand = function(name) {
    var results = [];
    var parts = name.split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      var part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      return globals.require(name, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };
  
  var isRelative = /^\.\.?(\/|$)/;

  var require = function(name, loaderPath) {
    if (loaderPath)
      loaderPath = expand(loaderPath);
    else
      loaderPath = '.';
    
    if (isRelative.test(name)) {
      var result = requirePath(loaderPath + '/' + name, loaderPath);
      if(result)
        return result;
    }
    else {
      var loaderPathSegments = loaderPath.split('/');
      while (loaderPathSegments.length) {
        loaderPathSegments.pop();
        var result = requirePath(loaderPathSegments.join('/') + '/node_modules/' + name);
        if(result)
          return result;
      }
    }

    throw new Error('Cannot find module "' + name + '" from "' + loaderPath + '"');
  };
  
  var requirePath = function(path, loaderPath) {
    path = expand(path);
    path = unalias(path, loaderPath);
    
    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);
    
    var dirIndex = path + '/index';
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);
    
    return undefined;
  }

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
