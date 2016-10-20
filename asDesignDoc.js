'use strict'

function asDesignDoc(designDoc, arg, xform_cb) {
  if ('function' === typeof arg)
    return asDesignDoc.transform(designDoc, arg, xform_cb)

  if (null === arg)
    return asDesignDoc.basic(designDoc, xform_cb)

  if (asDesignDoc.babel)
    return asDesignDoc.babel(designDoc, arg, xform_cb)
  else
    throw new Error("Unable to require 'babel-core'; cannot proceed with design doc function transforms")
}
module.exports = exports = asDesignDoc

asDesignDoc.basic = (designDoc, xform_cb) =>
  asDesignDoc.transform(designDoc, null, xform_cb)

try {
  const babel = require('babel-core')

  let babel_options = {
    babelrc: false, compact: true, minified: true, comments: false,
    presets: ["es2015"], }

  asDesignDoc.babel = (designDoc, options, xform_cb) =>
    transformDesignDoc(designDoc, 
      fn_entry => {
        let code = babel.transform(
          fn_entry.src, options || babel_options).code
        return fn_entry.as_module ? code
          : code.replace(/^['"]use strict["'];?\s*/, '')
      }, xform_cb)
} catch (err) {
  asDesignDoc.babel = null
}

asDesignDoc.transform = transformDesignDoc
function transformDesignDoc(designDoc, es5_transform, xform_cb) {
  return transformFunctions(designDoc, designdoc_fn_xform, xform_cb)

  function designdoc_fn_xform(fn_src, obj_path) {
    const path = obj_path.join('.')
    const as_module = path.match(/^views\.lib\./) && !path.match(/\.map$|\.reduce$/)
    const src = as_module 
      ? `(${fn_src})(exports, module)` 
      : `(${fn_src})`

    return es5_transform 
      ? es5_transform({as_module, fn_src, src}) 
      : src }
}

asDesignDoc.transformFunctions = transformFunctions
function transformFunctions(obj, fn_transform, xform_cb) {
  const path_lut = new Map()
  let result = []
  JSON.stringify(obj, _visitor)
  return obj

  function _visitor(key, value) {
    const base_path = path_lut.get(this)
    const obj_path = base_path ? base_path.concat([key]) : []
    const value_type = typeof value

    if ('object' === value_type) {
      path_lut.set(value, obj_path)
      return value
    }

    if ('function' === value_type) {
      let fn_src = value.toString().trim()
      // check for new hash functions syntax
      if (fn_src.match(/^\w+\s*\(/))
        fn_src = 'function '+fn_src

      const xform = fn_transform(fn_src, obj_path)
      if (xform_cb)
        xform_cb(Object.defineProperties(
          {fn: value, xform, obj_path, key},
          {host: {value: this}, assign: {value: _assign_host_xform}}))
      else this[key] = xform
    }
  }
}
function _assign_host_xform() { this.host[this.key] = this.xform }


