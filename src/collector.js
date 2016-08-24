import Promise from 'bluebird';
import {Util} from './util';
import Logger from './logger';
import whilst from 'async/whilst';
import queue from 'async/queue';
import StatfulClient from 'statful-client';
import Request from './request';
import MetricsList from './metrics-list';

const _config = Symbol('config');
const _isProcessingRequest = Symbol('isProcessingRequest');
const _processRequest = Symbol('processRequest') ;
const _requests = Symbol('requests');
const _spawnRequest = Symbol('spawnRequest');
const _startCollecting = Symbol('startCollecting');
const _stopCollecting = Symbol('stopCollecting');
const _utcTimeToStopProcessingRequests = Symbol('utcTimeToStopProcessingRequests');
const _metricsList = Symbol('metricsList');
const _startMetricsListUpdate = Symbol('startMetricsListUpdate');
const _stopMetricsListUpdate = Symbol('stopMetricsListUpdate');
const _metricsListUpdateInterval = Symbol('metricsListUpdateInterval');
const _statfulClient = Symbol('statfulClient');
const _handleSignalsAndUncaughtException = Symbol('handleSignalsAndUncaughtException');

class Collector {
    constructor(config) {
        this[_config] = config;
        this.isStopping = false;
        this.started = false;
        this.log = Logger.sharedInstance(this[_config]).child({file: Util.getCurrentFile(module)}, true);
        this[_requests] = queue((request, callback) => {
            this[_processRequest](request, callback);
        }, 3);
        this[_utcTimeToStopProcessingRequests] = -1;
        this[_isProcessingRequest] = false;
        this[_metricsList] = new MetricsList(this[_config]);
        this[_statfulClient] = new StatfulClient(this[_config].statfulClient, this.log);
    }

    start() {
        return new Promise( (resolve) => {
            if (!this.started && !this.isStopping) {
                this.log.info('Collector begins start process.');

                this.started = true;
                this.isStopping = false;
                this[_utcTimeToStopProcessingRequests] = -1;
                this[_isProcessingRequest] = false;
                this[_metricsList].clearMetricsPerRegion();

                let startPromises = [this[_startCollecting](), this[_startMetricsListUpdate]()];
                Promise.all(startPromises).then( () => {
                    this.log.info('Collector was started.');
                    this[_handleSignalsAndUncaughtException]();
                    resolve();
                });


            } else if(this.isStopping) {
                this.log.info('You can\'t start Collector because it\'s still stopping.');
            } else {
                this.log.info('Collector has been already started.');
                resolve();
            }
        });
    }

    stop(signal) {
        return new Promise( (resolve) => {
            if (this.started) {
                signal ? this.log.info('Receive %s - will exit, waiting for in-flight requests to complete.', signal)
                    : this.log.info('will exit, waiting for in-flight requests to complete.', signal);

                this.started = false;
                this.isStopping = true;

                this[_stopCollecting]().then( () => {
                    this.isStopping = false;
                    this.log.info('Collector was stopped.');
                    resolve();
                    process.exit(0);
                });

                let stopPromises = [this[_stopCollecting](), this[_stopMetricsListUpdate]()];
                Promise.all(stopPromises).then( () => {
                    this.isStopping = false;
                    this.log.info('Collector was stopped.');
                    resolve();
                    process.exit(0);
                });

            } else if (this.isStopping) {
                this.log.info('Collector is stopping. Wait please to not loose any in-flight requests.');
            } else {
                this.log.info('Collector has been already stopped.');
                resolve();
            }
        });
    }

    [_handleSignalsAndUncaughtException]() {
        process.on('uncaughtException', (err) => {
            this.log.error(err);
            this.stop();
        });

        this[_config].statfulAwsCollector.signals.forEach( (signal) => {
            process.on(signal, () => {
                this.stop(signal);
            });
        });
    }

    [_processRequest](request, callback) {
        if (request instanceof Request) {
            let requestEndTimeUTC = new Date(request.endTime).getTime();
            if (this[_utcTimeToStopProcessingRequests] === -1 || requestEndTimeUTC <= this[_utcTimeToStopProcessingRequests]) {
                console.log('start processing request');
                console.log(this[_requests].length());

                this[_isProcessingRequest]++;

                request.execute().then(() => {
                    this[_isProcessingRequest]--;
                    console.log('request processed');
                    console.log(this[_requests].length());
                    callback();
                });
            } else {
                this[_requests].kill();
                callback();
            }
        } else {
            callback();
        }
    }

    [_spawnRequest](callback) {
        if (!this.isStopping) {
            let now = new Date();
            let nowMinusPastPeriod = new Date(new Date(now).setSeconds(now.getSeconds() - (this[_config].statfulAwsCollector.period - 1)));
            let startTime = nowMinusPastPeriod.toISOString();
            let endTime = now.toISOString();

            this[_metricsList].getMetricsPerRegion().then( (metricsPerRegion) => {
                console.log('request spawned');
                this[_requests].push(new Request(this[_config], metricsPerRegion, startTime, endTime, this[_statfulClient]));
            });
        }
        // Scheduler to try to spawn another request
        setTimeout(() => {
            callback();
        }, this[_config].statfulAwsCollector.period * 1000);
    }

    [_startCollecting]() {
        return new Promise( (resolve) => {
            whilst(
                () => {
                    return this.started;
                },
                (callback) => {
                    setTimeout(() => {
                        this[_spawnRequest](callback);
                    }, 0);
                }
            );

            if (this.started) {
                resolve();
            }
        });
    }

    [_stopCollecting]() {
        this[_utcTimeToStopProcessingRequests] = new Date().getTime();

        return new Promise( (resolve) => {
            whilst(
                () => {
                    return this[_requests].length() > 0 || this[_isProcessingRequest] > 0;
                },
                (callback) => {
                    setTimeout(() => {
                        callback();
                    }, 0);
                },
                () => {
                    resolve();
                }
            );
        });
    }

    [_startMetricsListUpdate]() {
        return new Promise( (resolve) => {
            this[_metricsListUpdateInterval] = setInterval( () => {
                console.log('requested metrics list update');
                this[_metricsList].buildMetricsPerRegion();
            }, Util.getMetricListUpdateTime() * 1000);
            resolve();
        });
    }

    [_stopMetricsListUpdate]() {
        return new Promise( (resolve) => {
            clearInterval(this[_metricsListUpdateInterval]);
            resolve();
        });
    }
}

export default Collector;


