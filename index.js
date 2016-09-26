require('babel-polyfill');

var Config = require('./lib/config.js').default;
var StatfulAwsCollector = require('./lib/collector.js').default;
var fs = require('fs-extra');
var path = require('path');

var generateConfig = function(configPath) {
    var normalizedPath = path.normalize(configPath);
    var source = path.normalize(__dirname + '/conf/defaults.json');
    var target = path.join(normalizedPath, 'statful-aws-collector-conf.json');

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
                var collector = new StatfulAwsCollector(loadedConfig);
                if (collector) {
                    collector.start().then(function() {
                        resolve(path.normalize(configPath));
                    });
                } else {
                    reject('Error starting Statful AWS Collector with given configuration.');
                }
            },
            function(error) {
                reject(error);
            }
        );
    });
};

var cli = function() {
    var yargs = require('yargs')
        .usage('Usage: $0 [command] <path>')
        .command('generate-config <path>', 'Generate a default config for Statful AWS Collector on given path.')
        .command('start <path>', 'Start the Statful AWS Collector with a config on the given path.')
        .demand(1)
        .strict()
        .example('$0 generate-config /etc/statful-aws-collector/conf', 'Generates a default Statful AWS Collector ' +
            'config file on /etc/statful-aws-collector/conf/ with name statful-aws-collector-conf.json')
        .example('$0 start /etc/statful-aws-collector/conf/statful-aws-collector-conf.json', 'Starts the Statful AWS Collector with given config.')
        .help('help')
        .alias('h', 'help')
        .epilog('Copyright 2016 Statful.');
    var argv = yargs.argv;
    var path = argv.path;

    if (path) {
        if (argv._[0] === "start") {
            start(path).then(
                function(returnedPath) {
                    return console.log('Statful AWS Collector successfully loaded with configuration file at \'' + returnedPath + '\'');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === "generate-config") {
            generateConfig(path).then(
                function(returnedPath) {
                    return console.log('Configuration file \'statful-aws-collector-conf.json\' successfully created at \'' + returnedPath + '\'');
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
exports.cli = cli;