import Promise from 'bluebird';
import path from 'path';
import {schema} from './schema';
import {validate} from 'jsonschema';
import defaultConfig from '../conf/defaults.json';

const _file = Symbol('file');
const _processConfig = Symbol('processConfig');

class Config {
    constructor(file) {
        this[_file] = file;
    }

    load() {
        return new Promise( (resolve) => {
            this[_processConfig]().then(function(config){
                resolve(config);
            });
        });
    }

    [_processConfig]() {
        return new Promise((resolve) => {
            let config;

            if (this[_file]) {
                try {
                    config = require(path.resolve(this[_file]));
                } catch (ex) {
                    console.error('Failed to load config file ' + this[_file] + ' with: ' + ex);
                    process.exit(1);
                }
            } else {
                config = defaultConfig;
            }

            try {
                validate(config, schema, {throwError: true});
            } catch (ex) {
                console.error('Failed to validate config with: ' + ex);
                process.exit(1);
            }

            resolve(config);
        });
    }
}

export default Config;


