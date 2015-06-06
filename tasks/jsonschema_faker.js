/**
 * grunt-jsonschema-faker is a Grunt task generating fake data according to JSON schema
 *
 * @see https://github.com/ducin/grunt-jsonschema-faker
 *
 * @author Tomasz Ducin <tomasz.ducin@gmail.com> (https://github.com/ducin)
 * @copyright © 2015 Tomasz Ducin
 * @license MIT https://raw.github.com/ducin/grunt-jsonschema-faker/blob/master/LICENSE
 */

'use strict';


module.exports = function(grunt) {
  var path = require('path');
  var _ = require('lodash');
  var jsf = require('json-schema-faker');
  var externalGenerators = require('../generators');

  grunt.registerMultiTask('jsonschema_faker', 'generating fake data', function(){
    var options = this.options();
    if (options.extend) {
        options.extend(jsf);
    }
    this.files.forEach(function (f) {
      var cwd = path.normalize(f.orig.cwd || ''),
          cwdAbs = path.resolve(cwd || '.'),
          expand = !!f.orig.expand;
      f.src.map(function (file) {
          file = path.normalize(file);
          return path.resolve(cwdAbs, (expand && cwd.length && (file.indexOf(cwd + path.sep) === 0)) ? file.substr(cwd.length + path.sep.length) : file);
      }).filter(function (file) {
          if (!grunt.file.exists(file)) {
              grunt.log.warn('Source file "' + file + '" not found.');
              return false;
          } else {
              grunt.log.ok('Reading file ' + file + '.');
              return true;
          }
      }).map(function(file){
        _.each(options.external, function(externalOptions){
            var externalContent = grunt.file.readJSON(externalOptions.src);
            var collection = _.map(externalContent, externalOptions.map);
            var generator = externalGenerators[externalOptions.generator];
            jsf.formats(externalOptions.name, generator(collection));
        });
        var schema = grunt.file.readJSON(file);
        var result = !options.size ? jsf(schema) :
            _.map(_.range(options.size), function(){
              return jsf(schema);
            });
        var destination = path.normalize(f.orig.dest);
        grunt.log.ok('Writing file ' + destination + '.\n');
        grunt.file.write(destination, JSON.stringify(result, null, options.indent));
      });
    });
  });
};
