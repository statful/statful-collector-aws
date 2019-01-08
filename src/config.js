import Promise from 'bluebird';
import { validate } from 'jsonschema';
import path from 'path';
import defaultConfig from '../conf/defaults.json';
import { schema } from './schema';

const _file = Symbol('file');
const _processConfig = Symbol('processConfig');

class Config {
    constructor (file) {
        this[_file] = file;
    }

    load () {
        return new Promise((resolve, reject) => {
            this[_processConfig]().then(
                config => {
                    resolve(config);
                },
                error => {
                    reject(error);
                }
            );
        });
    }

    [_processConfig] () {
        return new Promise((resolve, reject) => {
            let config;

            if (this[_file]) {
                try {
                    config = require(path.resolve(this[_file]));
                } catch (ex) {
                    reject('Failed to load config file ' + this[_file] + ' with: ' + ex);
                }
            } else {
                config = defaultConfig;
            }

            try {
                validate(config, schema, { throwError: true });
            } catch (ex) {
                reject('Failed to validate config with: ' + ex);
            }

            resolve(config);
        });
    }
}

export default Config;
