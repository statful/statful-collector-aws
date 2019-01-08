import bunyan from 'bunyan';

const _getBunyanStreams = Symbol('getBunyanStreams');
const _instance = Symbol('instance');
const _instanceEnforcer = Symbol('instanceEnforcer');

class Logger {
    constructor(instanceEnforcer, config) {
        if (_instanceEnforcer !== instanceEnforcer) {
            throw 'Cannot construct singleton.';
        }

        config.bunyan.streams = this[_getBunyanStreams](config.bunyan);

        return bunyan.createLogger(config.bunyan);
    }

    static sharedInstance(config) {
        if (!this[_instance]) {
            try {
                this[_instance] = new Logger(_instanceEnforcer, config);
            } catch (ex) {
                console.error('Failed to config Logger instance' + ex);
                process.exit(1);
            }
        }
        return this[_instance];
    }

    [_getBunyanStreams](bunyanConfig) {
        let streams = bunyanConfig.streams;
        let streamsLevel = bunyanConfig.level ? bunyanConfig.level : 'info';
        if (streams.length === 0) {
            streams.push({
                level: streamsLevel,
                stream: process.stdout
            });
        }
        return streams;
    }
}

export default Logger;
