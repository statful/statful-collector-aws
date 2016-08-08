import Config from './Config'

(() => {
    const config = new Config((process.argv[2] || undefined));
    config.load().then(function(loadedConfig){
        Logger.sharedLogger(loadedConfig);
    });
})();

