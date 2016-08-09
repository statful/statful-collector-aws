import Promise from 'bluebird';
import {Util} from './util';
import Logger from './logger';
import whilst from 'async/whilst';
import queue from 'async/queue';

let _config = Symbol('config');
const processRequest = Symbol('processRequest') ;
let _requests = Symbol('requests');
const spawnRequest = Symbol('spawnRequest');
const startCollecting = Symbol('startCollecting');
const stopCollecting = Symbol('stopCollecting');
let _utcTimeToStopProcessingRequests = Symbol('utcTimeToStopProcessingRequests');

class Collector {
    constructor(config) {
        this[_config] = config;
        this.started = false;
        this.log = Logger.sharedInstance().child({file: Util.getCurrentFile(module)}, true);
        this[_requests] = queue((request, callback) => {
            this[processRequest](request, callback);
        });
        this[_utcTimeToStopProcessingRequests] = null;
    }

    start() {
        return new Promise( (resolve) => {
            if (!this.started) {
                this.log.info('Collector begins start process.');

                this.started = true;
                this[startCollecting]();

                this.log.info('Collector was started.');
                resolve();
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

                this[stopCollecting]().then( () => {

                    this.log.info('Collector was stopped.');
                    resolve();
                    process.exit(0);
                });

            } else {
                this.log.info('Collector has been already stopped.');
                resolve();
            }
        });
    }

    [processRequest](request, callback) {
        if (!this[_utcTimeToStopProcessingRequests] || request.endTime >= this[_utcTimeToStopProcessingRequests]) {
            setTimeout(() => {
                callback();
            }, 3000);
        } else {
            this[_requests].kill();
            callback();
        }
    }

    [spawnRequest](callback) {
        this[_requests].push({endTime: new Date().getTime()});
        setTimeout(() => {
            callback();
        }, 1000);
    }

    [startCollecting]() {
        whilst(
            () => {
                return this.started;
            },
            (callback) => {
                this[spawnRequest](callback);
            }
        );
    }

    [stopCollecting]() {
        this[_utcTimeToStopProcessingRequests] = new Date().getTime();

        return new Promise( (resolve) => {
            whilst(
                () => {
                    return this[_requests].length > 0;
                },
                (callback) => {
                    callback();
                },
                () => {
                    resolve();
                }
            );
        });
    }
}

export default Collector;


