#!/usr/bin/env node

'use strict';

// This file is run during the "postbump" lifecyle of standard-version
// We need to be able to update the metadata.label.verion of the resource objects in the openshift template in the .openshiftio folder

const {promisify} = require('util');
const fs = require('fs');
const jsyaml = require('js-yaml');
const packagejson = require('./package.json');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

(async function () {
  const applicationyaml = jsyaml.safeLoad(await readFile(`${__dirname}/.openshiftio/application.yaml`, {encoding: 'utf8'}));

  // We just need to update the RELEASE_VERSION parameter
  applicationyaml.parameters = applicationyaml.parameters.map(param => {
    if (param.name === 'RELEASE_VERSION') {
      param.value = packagejson.version;
    }

    return param;
  });

  // Now write the file back out
  await writeFile(`${__dirname}/.openshiftio/application.yaml`, jsyaml.safeDump(applicationyaml, {skipInvalid: true}), {encoding: 'utf8'});
})();
