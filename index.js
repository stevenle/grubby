#!/usr/bin/env node

// Copyright 2016 Steven Le (stevenle08@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A command-line tool for calling grpc endpoints.
 * @author stevenle08@gmail.com (Steven Le)
 */

var app = require('commander');
var fs = require('fs');
var grpc = require('grpc');


app.version('0.0.1')
    .arguments('<request>')
    .option('--endpoint <value>', 'grpc host/port')
    .option('--proto <value>', 'path to proto file')
    .option('--rpc <value>', 'rpc to call, e.g. HelloService.SayHello')
    .action(grubby)


function grubby(request) {
  if (!fs.existsSync(app.proto)) {
    console.error('error: ' + app.proto + ' does not exist');
    process.exit(1);
    return;
  }

  var proto = grpc.load(app.proto);
  var rpc = parseRpc(app.rpc);
  var data = JSON.parse(request);

  var serviceCls = getService(proto, rpc.service);
  if (!serviceCls) {
    console.error('error: could not find ' + app.rpc);
    process.exit(1);
    return;
  }

  var client = new serviceCls(app.endpoint, grpc.credentials.createInsecure());
  var fn = client[rpc.rpc];
  if (!fn) {
    console.error('error: could not find ' + app.rpc);
    process.exit(1);
    return;
  }

  fn.call(client, data, function(err, response) {
    if (err) {
      console.error('error: ' + err);
      process.exit(1);
      return;
    }

    console.log(JSON.stringify(response, null, 2));
  });
}


function parseRpc(name) {
  var parts = name.split('.');
  return {
    service: parts[0],
    rpc: lowerFirstChar(parts[1])
  };
}


function lowerFirstChar(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}


function getService(proto, serviceName) {
  for (packageName in proto) {
    var service = proto[packageName][serviceName];
    if (service) {
      return service;
    }
  }
  return null;
}


function main(argv) {
  app.parse(argv);
}


if (require.main == module) {
  main(process.argv);
}
