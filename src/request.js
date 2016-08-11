import Promise from 'bluebird';
import series from 'async/series';

const _config = Symbol('config');
const _endTime = Symbol('endTime');
const _period = Symbol('period');
const _startTime = Symbol('startTime');
const _statistics = Symbol('statistics');

const _sendAWSMetricsData = Symbol('sendAWSMetricsData');
const _getAWSMetricsData = Symbol('getAWSMetricsData');
const _metricsPerRegion = Symbol('metricsPerRegion');

class Request {
    constructor(config, metricsPerRegion, startTime, endTime) {
        this[_config] = config;
        this[_startTime] = startTime;
        this[_endTime] = endTime;
        this[_period] = this[_config].statfulAwsCollector.period;
        this[_statistics] = this[_config].statfulAwsCollector.statistics;
        this[_metricsPerRegion] = metricsPerRegion;
    }

    execute() {
        return new Promise( (resolve) => {
            series([
                (callback) => {
                    this[_getAWSMetricsData]().then( () => {
                        console.log('executing request and get metrics data from aws');
                        callback(null);
                    });
                },
                (callback) => {
                    this[_sendAWSMetricsData]().then( () => {
                        callback(null);
                    });
                }
            ],
            (err, results) => {
                resolve();
            });
        });
    }

    [_getAWSMetricsData]() {
        return new Promise( (resolve) => {
            resolve();
        });
    }

    [_sendAWSMetricsData]() {
        return new Promise( (resolve) => {
            resolve();
        });
    }
}

export default Request;
