import Config from './config';
import Logger from './logger';

(() => {
    const config = new Config((process.argv[2] || undefined));
    config.load().then(function(loadedConfig){
        Logger.sharedInstance(loadedConfig);
    });
})();

