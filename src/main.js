import Config from './config';
import Logger from './logger';
import {Util} from './util';
import Collector from './collector';

(() => {
    const config = new Config((process.argv[2] || undefined));
    config.load().then(function(loadedConfig){
        let log = Logger.sharedInstance(loadedConfig).child({file: Util.getCurrentFile(module)}, true);
        let collector = new Collector(loadedConfig);

        handleSignalsAndUncaughtException(loadedConfig, log, collector);
        collector.start();
    });
})();

function handleSignalsAndUncaughtException(loadedConfig, log, collector) {
    process.on('uncaughtException', (err) => {
        log.error(err);
        if (typeof collector !== 'undefined') {
            collector.stop();
        }
    });

    loadedConfig.statfulAwsCollector.signals.forEach( (signal) => {
        process.on(signal, () => {
            if (typeof collector !== 'undefined') {
                collector.stop(signal);
            }
        });
    });
}

