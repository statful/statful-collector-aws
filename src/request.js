import Promise from 'bluebird';
import series from 'async/series';
import each from 'async/each';
import eachOf from 'async/eachOf';
import AWS from 'aws-sdk';

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

            eachOf(this[_metricsPerRegion], (metrics, region, eachOfRegionsCallback) => {
                let cloudWatch = new AWS.CloudWatch({
                    accessKeyId: this[_config].statfulAwsCollector.credentials.accessKeyId,
                    secretAccessKey: this[_config].statfulAwsCollector.credentials.secretAccessKey,
                    region: region
                });

                each(metrics, (metric, eachMetricCallback) => {
                    let requestParams = {
                        StartTime: this[_startTime],
                        EndTime: this[_endTime],
                        Period: this[_period],
                        Statistics: this[_statistics],
                        MetricName: metric.MetricName,
                        Namespace: metric.Namespace,
                        Dimensions: metric.Dimensions
                    };

                    cloudWatch.getMetricStatistics(requestParams,  (err, data) => {
                        eachMetricCallback(null);
                    });
                }, (err) => {
                    eachOfRegionsCallback(null);
                });
            }, (err) => {
                resolve();
            });
        });
    }

    [_sendAWSMetricsData]() {
        return new Promise( (resolve) => {
            resolve();
        });
    }
}

export default Request;
