(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DataContainer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = DataContainer

var jsonpointer = require('jsonpointer')
var jsonmergepatch = require('json-merge-patch')
var traverse = require('json-to-ldp').traverse

function DataContainer (data, opts) {
  if (!(this instanceof DataContainer)) return new DataContainer(data, opts)
  opts = opts || {}
  this.data = data || {}
  this.depth = opts.depth
}

DataContainer.prototype.get = function (url, cb) {
  var content = traverse(this.data, url, this.depth)
  cb(null, content)
}

DataContainer.prototype.set = function (url, content, cb) {
  cb(null, jsonpointer.set(this.data, url, content))
}

DataContainer.prototype.update = function (url, patch, cb) {
  var self = this
  this.get(url, function (err, content) {
    if (err) return cb(err)
    var updated = jsonmergepatch.apply(content, patch)
    cb(null, jsonpointer.set(self.data, url, updated))
  })
}

DataContainer.prototype.delete = function (url, cb) {
  cb(new Error('Delete is not implemented'))
}

},{"json-merge-patch":5,"json-to-ldp":9,"jsonpointer":10}],2:[function(require,module,exports){
var pSlice = Array.prototype.slice;
var objectKeys = require('./lib/keys.js');
var isArguments = require('./lib/is_arguments.js');

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}

},{"./lib/is_arguments.js":3,"./lib/keys.js":4}],3:[function(require,module,exports){
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

},{}],4:[function(require,module,exports){
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

},{}],5:[function(require,module,exports){
'use strict';

module.exports.apply = require('./lib/apply');
module.exports.generate = require('./lib/generate');
module.exports.merge = require('./lib/merge');

},{"./lib/apply":6,"./lib/generate":7,"./lib/merge":8}],6:[function(require,module,exports){
'use strict';

module.exports = function apply(target, patch) {
	if(patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
		return patch;
	}
	if(target === null || typeof target !== 'object' || Array.isArray(target)) {
		target = {};
	}
	var keys = Object.keys(patch);
	for(var i=0; i<keys.length; i++) {
		var key = keys[i];
		if(patch[key] === null) {
			if(target.hasOwnProperty(key)) {
				delete target[key];
			}
		} else {
			target[key] = apply(target[key], patch[key]);
		}
	}
	return target;
};

},{}],7:[function(require,module,exports){
'use strict';

var equal = require('deep-equal');

function arrayEquals(before, after) {
  if(before.length !== after.length) {
    return false;
  }
  for(var i=0; i<before.length; i++) {
    if(!equal(after[i], before[i])) {
      return false;
    }
  }
  return true;
}

module.exports = function generate(before, after) {
  if(before === null || after === null ||
    typeof before !== 'object' || typeof after !== 'object' ||
    Array.isArray(before) !== Array.isArray(after)) {
    return after;
  }

  if(Array.isArray(before)) {
    if(!arrayEquals(before, after)) {
      return after;
    }
    return undefined;
  }

  var patch = {};
  var beforeKeys = Object.keys(before);
  var afterKeys = Object.keys(after);

  var key, i;

  // new elements
  var newKeys = {};
  for(i=0; i < afterKeys.length; i++) {
    key = afterKeys[i];
    if(beforeKeys.indexOf(key) === -1) {
      newKeys[key] = true;
      patch[key] = after[key];
    }
  }

  // removed & modified elements
  var removedKeys = {};
  for(i=0; i < beforeKeys.length; i++) {
    key = beforeKeys[i];
    if(afterKeys.indexOf(key) === -1) {
      removedKeys[key] = true;
      patch[key] = null;
    } else {
      if(before[key] !== null && typeof before[key] === 'object') {
        var subPatch = generate(before[key], after[key]);
        if(subPatch !== undefined) {
          patch[key] = subPatch;
        }
      } else if(before[key] !== after[key]) {
        patch[key] = after[key];
      }
    }
  }

  return (Object.keys(patch).length > 0 ? patch : undefined);
};

},{"deep-equal":2}],8:[function(require,module,exports){
'use strict';

module.exports = function merge(patch1, patch2) {
  if(patch1 === null || patch2 === null ||
    typeof patch1 !== 'object' || typeof patch2 !== 'object' ||
    Array.isArray(patch1) !== Array.isArray(patch2)) {
    return patch2;
  }
  var patch = JSON.parse(JSON.stringify(patch1));

	Object.keys(patch2)
  .forEach(function(key) {
		if(patch1[key] !== undefined) {
  		patch[key] = merge(patch1[key], patch2[key]);
		} else {
			patch[key] = patch2[key];
		}
  });
	return patch;
};

},{}],9:[function(require,module,exports){
module.exports = toLdp
module.exports.traverse = traverse

var jsonpointer = require('jsonpointer')

function isLeaf (resource) {
  return ['string', 'number'].indexOf(typeof resource) > -1
}

function toLdp (json, depth, pointers) {
  if (!json) {
    return null
  }
  if (isLeaf(json)) {
    return pointers ? json : null
  }

  if (!depth) depth = 1
  var preds = {'contains': []}

  Object.keys(json)
    .forEach(function (resource) {
      // never skip @ properties
      if (resource.substr(0, 1) === '@') {
        preds[resource] = json[resource]
      } else
      // Add leafs
      if (isLeaf(json[resource])) {
        preds[resource] = json[resource]
      }
      // add containment triple
      else {
        preds['contains'].push(resource)
        // if we are allowed to show more, recurse
        if (depth - 1 > 0) {
          preds[resource] = toLdp(json[resource], depth - 1)
        }
        // otherwise, show whether things are containers
        else {
          // TODO maybe everything is a container?
        }
      }
    })

  if (preds['contains'].length === 0) {
    delete preds['contains']
  }
  // TODO: preds['@type'] = 'https://www.w3.org/ns/ldp#Container'
  return preds
}

function traverse (json, path, depth) {
  if (path === '/') path = ''
  var content = toLdp(jsonpointer.get(json, path), depth)
  return content
}

},{"jsonpointer":10}],10:[function(require,module,exports){
var untilde = function (str) {
  return str.replace(/~./g, function (m) {
    switch (m) {
      case '~0': return '~'
      case '~1': return '/'
    }
    throw new Error('Invalid tilde escape: ' + m)
  })
}

var traverse = function (obj, pointer, value) {
  var part = untilde(pointer.shift())
  var isJustReading = arguments.length === 2

  if (obj[part] == null) {
    if (isJustReading) return null

    // support setting of /-
    if (part === '-' && obj instanceof Array) {
      part = obj.length
    }

    // support nested objects/array when setting values
    var nextPart = pointer[0]
    if (nextPart === '-' || !isNaN(nextPart)) {
      obj[part] = []
    } else if (nextPart) {
      obj[part] = {}
    }
  }

  // keep traversing
  if (pointer.length !== 0) {
    if (isJustReading) {
      return traverse(obj[part], pointer)
    } else {
      return traverse(obj[part], pointer, value)
    }
  }

  // we're done
  if (isJustReading) {
    return obj[part]
  }

  // set new value, return old value
  var oldValue = obj[part]
  if (value === null) {
    delete obj[part]
  } else {
    obj[part] = value
  }
  return oldValue
}

var compilePointer = function (pointer) {
  if (pointer === '') {
    return []
  }

  if (!pointer) {
    throw new Error('Invalid JSON pointer.')
  }

  if (!(pointer instanceof Array)) {
    pointer = pointer.split('/')
    if (pointer.shift() !== '') throw new Error('Invalid JSON pointer.')
  } else {
    // Clone the pointer array
    var newPointer = []
    for (var i = 0; i < pointer.length; i++) newPointer[i] = pointer[i]
    pointer = newPointer
  }

  return pointer
}

var validateInput = function (obj, pointer) {
  if (typeof obj !== 'object') {
    throw new Error('Invalid input object.')
  }

  return compilePointer(pointer)
}

var get = function (obj, pointer) {
  pointer = validateInput(obj, pointer)
  if (pointer.length === 0) {
    return obj
  }
  return traverse(obj, pointer)
}

var set = function (obj, pointer, value) {
  pointer = validateInput(obj, pointer)
  if (pointer.length === 0) {
    throw new Error('Invalid JSON pointer for set.')
  }
  return traverse(obj, pointer, value)
}

var compile = function (pointer) {
  var compiled = compilePointer(pointer)
  return {
    get: function (object) {
      return get(object, compiled)
    },
    set: function (object, value) {
      return set(object, compiled, value)
    }
  }
}

exports.get = get
exports.set = set
exports.compile = compile

},{}],11:[function(require,module,exports){
module.exports = require('datacontainer')
},{"datacontainer":1}]},{},[11])(11)
});