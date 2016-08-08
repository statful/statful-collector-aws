import bunyan from 'bunyan';

const _getBunyanStreams = Symbol('getBunyanStreams');
const _instance = Symbol('instance');
const _instanceEnforcer = Symbol('instanceEnforcer');

class Logger {
    constructor(instanceEnforcer, config) {
        if(_instanceEnforcer !== instanceEnforcer) {
            throw 'Cannot construct singleton.';
        }

        return bunyan.createLogger({
                name: config.bunyan.name,
                streams: this[_getBunyanStreams](config.bunyan.streams)
            });
    }

    static sharedInstance(config) {
        if(!this[_instance]) {
            try {
                this[_instance] = new Logger(_instanceEnforcer, config);
            } catch (ex) {
                console.error('Failed to config Logger instance' + ex);
                process.exit(1);
            }
        }
        return this[_instance];
    }

    load() {
        return new Promise( (resolve) => {
            this[_processConfig]().then(function(config){
                resolve(config);
            });
        });
    }

    [_getBunyanStreams](streams) {
        if (streams.length === 0) {
            streams.push({
                level: 'info',
                stream: process.stdout
            });
        }
        return streams;
    }
}

export default Logger;
