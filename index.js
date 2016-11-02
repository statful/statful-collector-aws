require('babel-polyfill');

var Config = require('./lib/config.js').default;
var StatfulCollectorAws = require('./lib/collector.js').default;
var fs = require('fs-extra');
var path = require('path');
var pm2 = require('pm2');

var generateConfig = function(configPath) {
    var normalizedPath = path.normalize(configPath);
    var source = path.normalize(__dirname + '/conf/defaults.json');
    var target = path.join(normalizedPath, 'statful-collector-aws-conf.json');

    return new Promise(function(resolve, reject) {
        fs.copy(source, target, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(normalizedPath);
            }
        });
    });
};

var start = function(configPath) {
    var configToTry = new Config(configPath);

    return new Promise(function(resolve, reject) {
        configToTry.load().then(
            function(loadedConfig) {
                var collector = new StatfulCollectorAws(loadedConfig);
                if (collector) {
                    collector.start().then(function() {
                        resolve(path.normalize(configPath));
                    });
                } else {
                    reject('Error starting Statful Collector AWS with given configuration.');
                }
            },
            function(error) {
                reject(error);
            }
        );
    });
};

var startManaged = function(configPath) {
    return new Promise(function(resolve, reject) {
        pm2.connect(function(err) {
            if (err) {
                reject(err);
            } else {
                pm2.start({
                    name: 'statful-collector-aws',
                    script: 'statful-collector-aws',
                    args: 'start ' + configPath
                }, function(err) {
                    pm2.disconnect();

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });


    });
};

var stopManaged = function() {
    return new Promise(function(resolve, reject) {
        pm2.connect(function(err) {
            if (err) {
                reject(err);
            } else {
                pm2.stop('statful-collector-aws',
                    function(err) {
                        pm2.disconnect();

                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
            }
        });
    });
};

var restartManaged = function() {
    return new Promise(function(resolve, reject) {
        pm2.connect(function(err) {
            if (err) {
                reject(err);
            } else {
                pm2.restart('statful-collector-aws',
                    function(err) {
                        pm2.disconnect();

                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
            }
        });
    });
};

var cli = function() {
    var yargs = require('yargs')
        .usage('Usage: $0 [command] <path>')
        .command('generate-config <path>', 'Generate a default config for Statful Collector AWS on given path.')
        .command('start <path>', 'Start the Statful Collector AWS with a config on the given path.')
        .command('start-managed <path>', 'Start the Statful Collector AWS, managed by pm2, with a config on the given path.')
        .command('stop-managed', 'Stop the Statful Collector AWS, managed by pm2.')
        .command('restart-managed', 'Restart the Statful Collector AWS, managed by pm2.')
        .demand(1)
        .strict()
        .example('$0 generate-config /etc/statful-collector-aws/conf', 'Generates a default Statful Collector AWS ' +
        'config file on /etc/statful-collector-aws/conf/ with name statful-collector-aws-conf.json')
        .example('$0 start /etc/statful-collector-aws/conf/statful-collector-aws-conf.json', 'Starts the Statful Collector AWS with the given config.')
        .example('$0 start-managed /etc/statful-collector-aws/conf/statful-collector-aws-conf.json', 'Starts the Statful Collector AWS, managed by pm2, with the given config.')
        .example('$0 stop-managed', 'Stop the Statful Collector AWS, managed by pm2.')
        .example('$0 restart-managed', 'Restart the Statful Collector AWS, managed by pm2.')
        .help('help')
        .alias('h', 'help')
        .epilog('Copyright 2016 Statful.');
    var argv = yargs.argv;
    var path = argv.path;

    if (path) {
        if (argv._[0] === "start") {
            start(path).then(
                function(returnedPath) {
                    return console.log('Statful Collector AWS successfully loaded with configuration file at \'' + returnedPath + '\'');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === "start-managed") {
            startManaged(path).then(
                function() {
                    return console.log('Pm2 successfully request a spawn for Statful Collector AWS process.');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === "stop-managed") {
            stopManaged().then(
                function() {
                    return console.log('Pm2 successfully stopped for Statful Collector AWS process.');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === "restart-managed") {
            restartManaged().then(
                function() {
                    return console.log('Pm2 successfully restarted for Statful Collector AWS process.');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === "generate-config") {
            generateConfig(path).then(
                function(returnedPath) {
                    return console.log('Configuration file \'statful-collector-aws-conf.json\' successfully created at \'' + returnedPath + '\'');
                },
                function(error) {
                    return console.error(error);
                }
            );
        }
    }
};

exports.generateConfig = generateConfig;
exports.start = start;
exports.startManaged = startManaged;
exports.cli = cli;