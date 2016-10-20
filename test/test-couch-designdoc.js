'use strict'
const assert = require('assert')
const inspect = obj => require('util').inspect(obj, {colors: true, depth: null})
const tap = require('tap-lite-tester')
const asDesignDoc = require('../asDesignDoc')

function default_template(designDoc, expected, debug) {
  return () => {
    const actual = {}
    asDesignDoc(designDoc, undefined,
      fn_entry => { actual[fn_entry.obj_path] = fn_entry.xform })
    if (debug) console.log(inspect(actual))
    assert.deepEqual(actual, expected) } }

function babel_template(designDoc, expected, debug) {
  return () => {
    const actual = {}
    asDesignDoc.babel(designDoc, undefined,
      fn_entry => { actual[fn_entry.obj_path] = fn_entry.xform })
    if (debug) console.log(inspect(actual))
    assert.deepEqual(actual, expected) } }

function basic_template(designDoc, expected, debug) {
  return () => {
    const actual = {}
    asDesignDoc.basic(designDoc,
      fn_entry => { actual[fn_entry.obj_path] = fn_entry.xform })
    if (debug) console.log(inspect(actual))
    assert.deepEqual(actual, expected) } }



{ // test ES6 new function in object syntax
  let designDoc = {views: {simple: {map(doc) { emit(doc.date, doc.title) }} }}
  let expected_basic = {'views,simple,map': `(function ${designDoc.views.simple.map.toString()})`}
  let expected_babel = {'views,simple,map': `(function map(doc){emit(doc.date,doc.title)});`}

  tap.test('simple view function (basic)',
    basic_template(designDoc, expected_basic))

  tap.test('simple view function (default)', 
    default_template(designDoc, expected_babel))

  tap.test('simple view function (babel)',
    babel_template(designDoc, expected_babel))
}


{ // test fat-arrow from ES6

  let designDoc = {views: {simple: {map: (doc) => emit(doc.date, doc.title) } }}
  let expected_basic = {'views,simple,map': `(${designDoc.views.simple.map.toString()})`}
  let expected_babel = {'views,simple,map': `(function(doc){return emit(doc.date,doc.title)});`}

  tap.test('fat arrow view function (basic)',
    basic_template(designDoc, expected_basic))

  tap.test('fat arrow view function (default)', 
    default_template(designDoc, expected_babel))

  tap.test('fat arrow view function (babel)',
    babel_template(designDoc, expected_babel))
}


{ // test CouchDB CommonJS library detection
  let designDoc = {views: {lib: {
    baz(exports, module) { exports.baz = function() { return 'bam' } },
    foo: { zoom(exports, module) { exports.zoom = () => 'yeah' } }}}}
    
  let expected_basic = {
    'views,lib,baz': '(function baz(exports, module) { exports.baz = function() { return \'bam\' } })(exports, module)',
    'views,lib,foo,zoom': '(function zoom(exports, module) { exports.zoom = () => \'yeah\' })(exports, module)',
  }
  let expected_babel = {
    'views,lib,baz': '\'use strict\';(function baz(exports,module){exports.baz=function(){return\'bam\'}})(exports,module);',
    'views,lib,foo,zoom': '\'use strict\';(function zoom(exports,module){exports.zoom=function(){return\'yeah\'}})(exports,module);',
  }

  tap.test('simple view function (basic)',
    basic_template(designDoc, expected_basic))

  tap.test('simple view function (default)', 
    default_template(designDoc, expected_babel))

  tap.test('simple view function (babel)',
    babel_template(designDoc, expected_babel))
}



{ // test a larger collection of examples pulled from CouchDB docs
  let designDoc =  {_id: '_design/test',
    views: {
      lib: {
        map() { /* I'm a MAP! */},
        reduce() { /* I'm a REDUCE! */},
        baz(exports, module) { exports.baz = 'bam' },
        foo: {
          zoom(exports, module) { exports.zoom = 'yeah' },
          boom(exports, module) { exports.boom = 'ok' },
          foo(exports, module) { exports.foo = 'bar' },
        },
      },
      commonjs: {
        map(doc) {
          emit(null, require('views/lib/foo/boom').boom)
        },
      },
      sum: {
        map: doc => emit(null, 1),
        reduce: (keys, values) => sum(values)
      },
      count: {
        map: doc => emit(null, 1),
        reduce: (keys, values, rereduce) =>
          rereduce ? sum(values) : values.length
      },
    },
    shows: { post(doc, req) { /* I'm a show function */ } },
    lists: { listfn(head, req) { /* I'm a list function */ } },
    updates: { updatefn(doc, req) { /* I'm an update function */ } },
    filters: { filterfn(doc, req) { /* I'm a filter function */ } },
    validate_doc_update(newDoc, oldDoc, userCtx) { /* I'm a doc update validation function */ },
  }

  let expected_basic = {
    'views,lib,map': '(function map() { /* I\'m a MAP! */})',
    'views,lib,reduce': '(function reduce() { /* I\'m a REDUCE! */})',
    'views,lib,baz': '(function baz(exports, module) { exports.baz = \'bam\' })(exports, module)',
    'views,lib,foo,zoom': '(function zoom(exports, module) { exports.zoom = \'yeah\' })(exports, module)',
    'views,lib,foo,boom': '(function boom(exports, module) { exports.boom = \'ok\' })(exports, module)',
    'views,lib,foo,foo': '(function foo(exports, module) { exports.foo = \'bar\' })(exports, module)',
    'views,commonjs,map': '(function map(doc) {\n          emit(null, require(\'views/lib/foo/boom\').boom)\n        })',
    'views,sum,map': '(doc => emit(null, 1))',
    'views,sum,reduce': '((keys, values) => sum(values))',
    'views,count,map': '(doc => emit(null, 1))',
    'views,count,reduce': '((keys, values, rereduce) =>\n          rereduce ? sum(values) : values.length)',
    'shows,post': '(function post(doc, req) { /* I\'m a show function */ })',
    'lists,listfn': '(function listfn(head, req) { /* I\'m a list function */ })',
    'updates,updatefn': '(function updatefn(doc, req) { /* I\'m an update function */ })',
    'filters,filterfn': '(function filterfn(doc, req) { /* I\'m a filter function */ })',
    'validate_doc_update': '(function validate_doc_update(newDoc, oldDoc, userCtx) { /* I\'m a doc update validation function */ })',
  }

  let expected_babel = {
    'views,lib,map': '(function map(){});',
    'views,lib,reduce': '(function reduce(){});',
    'views,lib,baz': '\'use strict\';(function baz(exports,module){exports.baz=\'bam\'})(exports,module);',
    'views,lib,foo,zoom': '\'use strict\';(function zoom(exports,module){exports.zoom=\'yeah\'})(exports,module);',
    'views,lib,foo,boom': '\'use strict\';(function boom(exports,module){exports.boom=\'ok\'})(exports,module);',
    'views,lib,foo,foo': '\'use strict\';(function foo(exports,module){exports.foo=\'bar\'})(exports,module);',
    'views,commonjs,map': '(function map(doc){emit(null,require(\'views/lib/foo/boom\').boom)});',
    'views,sum,map': '(function(doc){return emit(null,1)});',
    'views,sum,reduce': '(function(keys,values){return sum(values)});',
    'views,count,map': '(function(doc){return emit(null,1)});',
    'views,count,reduce': '(function(keys,values,rereduce){return rereduce?sum(values):values.length});',
    'shows,post': '(function post(doc,req){});',
    'lists,listfn': '(function listfn(head,req){});',
    'updates,updatefn': '(function updatefn(doc,req){});',
    'filters,filterfn': '(function filterfn(doc,req){});',
    'validate_doc_update': '(function validate_doc_update(newDoc,oldDoc,userCtx){});',
  }

  tap.test('large example (basic)',
    basic_template(designDoc, expected_basic))

  tap.test('large example (default)', 
    default_template(designDoc, expected_babel))

  tap.test('large example (babel)',
    babel_template(designDoc, expected_babel))
}

