/*
 * pkgcloud.js: Top-level include for the pkgcloud module
 *
 * (C) 2011 Charlie Robbins, Ken Perkins, Ross Kukulinski & the Contributors.
 *
 */

const path = require('path');

let pkgcloud = {};

const components = [
  './core/base',
  './common',
  //'./pkgcloud/core/compute',
  //'./pkgcloud/core/storage'
];

const services = [
  'compute',
  'database',
  'orchestration',
  'network',
  'storage'
];

//
// Setup lazy-loaded exports for faster loading
//
components.forEach(component=> {
  const name = path.basename(component),
      hidden = '_' + name;

  pkgcloud.__defineGetter__(name, function () {
    if (!pkgcloud[hidden]) {
      pkgcloud[hidden] = require(component);
    }

    return pkgcloud[hidden];
  });
});

//
// Initialize our providers
//
pkgcloud.providers = {};

//
// Setup empty exports to be populated later
//
services.forEach(key => {
    pkgcloud[key] = {};
});

//
// Setup core `pkgcloud.*.createClient` methods for all
// provider functionality.
//
services.forEach(function (service) {
  pkgcloud[service].createClient = function (options) {
    if (!options.provider) {
      throw new Error('options.provider is required to create a new pkgcloud client.');
    }

    var provider = pkgcloud.providers[options.provider];

    if (!provider) {
      throw new Error(options.provider + ' is not a supported provider');
    }

    if (!provider[service]) {
      throw new Error(options.provider + ' does not expose a ' + service + ' service');
    }

    return new provider[service].createClient(options);
  };
});

//
// Setup all providers as lazy-loaded getters
//

pkgcloud.providers.openstack = require('./openstack');

module.exports = pkgcloud;
