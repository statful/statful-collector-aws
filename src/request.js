import Promise from 'bluebird';
import series from 'async/series';
import each from 'async/each';
import eachOf from 'async/eachOf';
import doWhilst from 'async/doWhilst';
import filter from 'async/filter';
import AWS from 'aws-sdk';
import {Util} from './util';

const _config = Symbol('config');
const _endTime = Symbol('endTime');
const _period = Symbol('period');
const _startTime = Symbol('startTime');
const _statistics = Symbol('statistics');

const _buildRequestMetaData = Symbol('buildRequestMetaData');
const _sendAWSMetricsData = Symbol('sendAWSMetricsData');
const _getAWSMetricsData = Symbol('getAWSMetricsData');
const _metricsPerRegion = Symbol('metricsPerRegion');
const _receivedMetrics = Symbol('receivedMetrics');

class Request {
    constructor(config, startTime, endTime) {
        this[_config] = config;
        this[_startTime] = startTime;
        this[_endTime] = endTime;
        this[_period] = this[_config].statfulAwsCollector.period;
        this[_statistics] = this[_config].statfulAwsCollector.statistics;
        this[_metricsPerRegion] = {};
    }

    execute() {
        return new Promise( (resolve) => {
            series([
                (callback) => {
                    this[_buildRequestMetaData]().then( () => {
                        callback(null);
                    });
                },
                (callback) => {
                    this[_getAWSMetricsData]().then( () => {
                        console.log(this[_metricsPerRegion]);
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

    [_buildRequestMetaData]() {
        return new Promise( (resolve) => {
            if (this[_config].statfulAwsCollector.metricsList.type === 'white') {
                if (Util.isObjectEmpty(this[_metricsPerRegion])) {
                    this[_metricsPerRegion] = this[_config].statfulAwsCollector.metricsList;
                }
                resolve();
            } else {
                if (Util.isObjectEmpty(this[_metricsPerRegion])) {
                    let availableAWSRegions = Util.getAWSAvailableRegions();
                    let blacklistedRegions = Object.keys(this[_config].statfulAwsCollector.metricsList);

                    series([
                        (taskCallback) => {
                            // Apply blacklist filter to regions
                            each(availableAWSRegions, (region, callback) => {
                                if (blacklistedRegions.indexOf(region) === -1) {
                                    this[_metricsPerRegion][region] = [];
                                }
                                callback();
                            }, (err) => {
                                taskCallback(null);
                            });
                        },
                        (taskCallback) => {
                            // Get available metrics and filter it by blacklist
                            eachOf(this[_metricsPerRegion], (metrics, region, eachOfCallback) => {
                                let cloudWatch = new AWS.CloudWatch({
                                    accessKeyId: this[_config].statfulAwsCollector.credentials.accessKeyId,
                                    secretAccessKey: this[_config].statfulAwsCollector.credentials.secretAccessKey,
                                    region: region
                                });
                                let hasNextToken = null;

                                doWhilst(
                                    (doDuringCallback)=> {
                                        let reqParams = {};

                                        if (hasNextToken) {
                                            reqParams.NextToken = hasNextToken;
                                        }

                                        cloudWatch.listMetrics(reqParams, (err, data) => {
                                            if (err === null) {
                                                hasNextToken = data.NextToken;

                                                if (data.Metrics && data.Metrics.length > 0) {
                                                    let metricsToFilterByBlacklist = data.Metrics;

                                                    filter(metricsToFilterByBlacklist, (metric, filterCallback) => {
                                                        // Test if metric is to filter
                                                        let includeMetricInResults = true;
                                                        let blacklistedMetricsForCurrentRegion = this[_config].statfulAwsCollector.metricsList[region];

                                                        if (blacklistedMetricsForCurrentRegion && blacklistedMetricsForCurrentRegion.length > 0) {
                                                            each(blacklistedMetricsForCurrentRegion, (blackListedMetric, eachCallback) => {
                                                                // Test for name and namespace
                                                                if ((metric.MetricName && blackListedMetric.MetricName && metric.MetricName === blackListedMetric.MetricName) ||
                                                                    (metric.Namespace && blackListedMetric.Namespace && metric.Namespace === blackListedMetric.Namespace)) {
                                                                    includeMetricInResults = false;
                                                                }

                                                                if (includeMetricInResults) {
                                                                    // Test by dimensions and remove blacklisted dimensions
                                                                    let dimensionsToRemove = [];
                                                                    for (let i = 0; i < metric.Dimensions; i++) {
                                                                        for (let j = 0; j < blackListedMetric.Dimensions; j++) {
                                                                            let metricDimension = metric.Dimensions[i];
                                                                            let blackListedMetricDimension = blackListedMetric.Dimensions[j];

                                                                            if (blackListedMetricDimension.Name && blackListedMetricDimension.Value) {
                                                                                if (metricDimension.Name === blackListedMetricDimension.Name &&
                                                                                    metricDimension.Value === blackListedMetricDimension.Value) {
                                                                                    // Remove metric.Dimensions[i]
                                                                                    dimensionsToRemove.push(i);
                                                                                }
                                                                            } else {
                                                                                if ((metricDimension.Name && blackListedMetricDimension.Name && metricDimension.Name === blackListedMetricDimension.Name) ||
                                                                                    (metricDimension.Value && blackListedMetricDimension.Value && metricDimension.Value === blackListedMetricDimension.Value)) {
                                                                                    // Remove metric.Dimensions[i]
                                                                                    dimensionsToRemove.push(i);
                                                                                }
                                                                            }
                                                                        }
                                                                    }

                                                                    // Remove found blacklisted dimensions
                                                                    for (let i = dimensionsToRemove.length - 1; i >= 0; i--) {
                                                                        metric.Dimensions.splice(dimensionsToRemove[i], 1);
                                                                    }
                                                                }

                                                                eachCallback(null);
                                                            }, (err) => {
                                                                filterCallback(null, includeMetricInResults);
                                                            });
                                                        } else {
                                                            filterCallback(null, includeMetricInResults);
                                                        }
                                                    }, (err, filteredMetrics) => {
                                                        if (filteredMetrics && filteredMetrics.length > 0) {
                                                            this[_metricsPerRegion][region] = this[_metricsPerRegion][region].concat(filteredMetrics);
                                                        }
                                                        doDuringCallback(null);
                                                    });
                                                } else {
                                                    doDuringCallback(null);
                                                }
                                            } else {
                                                doDuringCallback(null);
                                            }
                                        });
                                    },
                                    () => {
                                        return hasNextToken;
                                    },
                                    (err) => {
                                        eachOfCallback(null);
                                    });

                            }, (err) => {
                                taskCallback(null);
                            });
                        }
                    ],
                    (err, results) => {
                        resolve();
                    });

                    // TODO - Move all that code above to functions and put it inside an interval
                    // TODO - to re-update metrics from X and X time

                    // TODO - Add schema for metricsList config
                }
            }
        });
    }

    [_getAWSMetricsData]() {
        return new Promise( (resolve) => {
            /*let cloudWatch = new AWS.CloudWatch(this[_config].statfulAwsCollector.credentials);

             cloudWatch.listMetrics({}, function (err, data) {
             if (err !== null) {
             console.log(err);
             } else {
             console.log(data);
             }
             });*/
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
