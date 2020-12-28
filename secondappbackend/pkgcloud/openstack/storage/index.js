/*
 * index.js: Top-level include for the Openstack Object Storage
 *
 * (C) 2013 Rackspace, Ken Perkins
 * MIT LICENSE
 *
 */

exports.Client = require('./client');
exports.Container = require('./container');
exports.File = require('./file');

exports.createClient = function (options) {
  return new exports.Client(options);
};