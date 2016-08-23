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
const _cloudWatchGetMetricStatistics = Symbol('cloudWatchGetMetricStatistics');
const _sendAWSMetricsData = Symbol('sendAWSMetricsData');
const _getAWSMetricsData = Symbol('getAWSMetricsData');
const _metricsPerRegion = Symbol('metricsPerRegion');
const _receivedDataPerRegion = Symbol('receivedDataPerRegion');
const _statfulClient = Symbol('statfulClient');

class Request {
    constructor(config, metricsPerRegion, startTime, endTime, statfulClient) {
        this[_config] = config;
        this[_startTime] = startTime;
        this[_endTime] = endTime;
        this[_period] = this[_config].statfulAwsCollector.period;
        this[_statistics] = this[_config].statfulAwsCollector.statistics;
        this[_metricsPerRegion] = metricsPerRegion;
        this[_receivedDataPerRegion] = {};
        this[_statfulClient] = statfulClient;
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
                        console.log('request data received and processed');
                        callback(null);
                    });
                }
            ],
            (err, results) => {
                resolve();
            });
        });
    }
    [_cloudWatchGetMetricStatistics](region, metric) {
        return new Promise( (resolve) => {
            let cloudWatch = new AWS.CloudWatch({
                accessKeyId: this[_config].statfulAwsCollector.credentials.accessKeyId,
                secretAccessKey: this[_config].statfulAwsCollector.credentials.secretAccessKey,
                region: region
            });
            let reqParams = {
                StartTime: this[_startTime],
                EndTime: this[_endTime],
                Period: this[_period],
                Statistics: this[_statistics],
                MetricName: metric.MetricName,
                Namespace: metric.Namespace,
                Dimensions: metric.Dimensions
            };

            cloudWatch.getMetricStatistics(reqParams,  (err, data) => {
                if (data) {
                    data.Period = this[_period];
                    data.Statistics = this[_statistics];
                    data.MetricName = metric.MetricName;
                    data.Namespace = metric.Namespace;
                    data.Dimensions = metric.Dimensions;
                }
                resolve({region:region, data:data});
            });
        });
    }

    [_getAWSMetricsData]() {
        return new Promise( (resolve) => {
            let requestsPromises = [];

            eachOf(this[_metricsPerRegion], (metrics, region, eachOfRegionsCallback) => {
                each(metrics, (metric, eachMetricCallback) => {

                    requestsPromises.push(this[_cloudWatchGetMetricStatistics](region, metric));
                    eachMetricCallback(null);
                }, (err) => {
                    eachOfRegionsCallback(null);
                });
            }, (err) => {
                Promise.all(requestsPromises).then( (allRequestsData) => {
                    each(allRequestsData, (requestData, eachCallback) => {
                        if (requestData && requestData.data && requestData.data.Datapoints && requestData.data.Datapoints.length > 0) {
                            if (!this[_receivedDataPerRegion].hasOwnProperty(requestData.region)) {
                                this[_receivedDataPerRegion][requestData.region] = [];
                            }
                            this[_receivedDataPerRegion][requestData.region] = this[_receivedDataPerRegion][requestData.region].concat(requestData.data);
                        }
                        eachCallback(null);
                    }, (err) => {
                        resolve();
                    });
                });
            });
        });
    }

    [_sendAWSMetricsData]() {
        return new Promise( (resolve) => {
            eachOf(this[_receivedDataPerRegion], (metrics, region, eachOfRegionsCallback) => {
                each(metrics, (metric, eachMetricCallback) => {
                    let metricName = metric.MetricName;
                    let metricNamespace = metric.Namespace.replace("/", ".");
                    let metricAggFreq = metric.Period;
                    let metricTags = {
                        region: region
                    };

                    metric.Dimensions.forEach( (dimension) => {
                        metricTags[dimension.Name] = dimension.Value;
                    });

                    each(metric.Datapoints, (dataPoint, eachDataPointCallback) => {
                        let metricTimestamp = Math.round(new Date(dataPoint.Timestamp).getTime() / 1000);

                        metricTags['Unit'] = dataPoint.Unit;

                        this[_config].statfulAwsCollector.statistics.forEach( (statistic) => {
                            let metricValue = dataPoint[statistic];
                            let metricAgg = null;

                            switch (statistic) {
                                case 'SampleCount':
                                    metricAgg = 'count';
                                    break;
                                case 'Average':
                                    metricAgg = 'avg';
                                    break;
                                case 'Sum':
                                    metricAgg = 'sum';
                                    break;
                                case 'Minimum':
                                    metricAgg = 'min';
                                    break;
                                case 'Maximum':
                                    metricAgg = 'max';
                                    break;
                            }

                            if (metricAgg) {
                                this[_statfulClient].aggregatedPut(metricName, metricValue, metricAgg, metricAggFreq, {namespace:metricNamespace, tags:metricTags, timestamp: metricTimestamp});
                            }
                        });

                        eachDataPointCallback(null);
                    }, (err) => {
                        eachMetricCallback(null);
                    });
                }, (err) => {
                    eachOfRegionsCallback(null);
                });
            }, (err) => {
                this[_receivedDataPerRegion] = {};
                resolve();
            });
        });
    }
}

export default Request;
