import each from 'async/each';
import eachOf from 'async/eachOf';
import eachSeries from 'async/eachSeries';
import series from 'async/series';
import AWS from 'aws-sdk';
import Promise from 'bluebird';

const _buildAndSendDatapoints = Symbol('buildAndSendDatapoints');
const _calculateTimeoutPerBatch = Symbol('calculateTimeoutPerBatch');
const _cloudWatchClientPerRegion = Symbol('cloudWatchClientPerRegion');
const _cloudWatchGetMetricStatistics = Symbol('cloudWatchGetMetricStatistics');
const _config = Symbol('config');
const _endTime = Symbol('endTime');
const _getAWSMetricsData = Symbol('getAWSMetricsData');
const _metricsPerRegion = Symbol('metricsPerRegion');
const _period = Symbol('period');
const _receivedDataPerRegion = Symbol('receivedDataPerRegion');
const _requestsPerBatch = Symbol('requestsPerBatch');
const _sendAWSMetricsData = Symbol('sendAWSMetricsData');
const _startTime = Symbol('startTime');
const _statfulClient = Symbol('statfulClient');
const _statistics = Symbol('statistics');
const _timeoutPerBatch = Symbol('timeoutPerBatch');
const _totalNumberOfRequests = Symbol('totalNumberOfRequests');

class Request {
    constructor(config, metricsPerRegion, startTime, endTime, statfulClient) {
        this[_config] = config;
        this[_startTime] = startTime;
        this[_endTime] = endTime;
        this[_period] = this[_config].statfulCollectorAws.period;
        this[_statistics] = this[_config].statfulCollectorAws.statistics;
        this[_metricsPerRegion] = metricsPerRegion;
        this[_receivedDataPerRegion] = {};
        this[_statfulClient] = statfulClient;
        this[_totalNumberOfRequests] = this[_metricsPerRegion].totalMetrics;
        this[_requestsPerBatch] = 50;
        this[_timeoutPerBatch] = this[_calculateTimeoutPerBatch]();
        // TODO: If timeout per batch was < 100 throw an exception and don't execute the request.
        this[_cloudWatchClientPerRegion] = {};

        eachOf(
            this[_metricsPerRegion],
            (metrics, region, eachOfRegionsCallback) => {
                this[_cloudWatchClientPerRegion][region] = new AWS.CloudWatch({
                    accessKeyId: this[_config].statfulCollectorAws.credentials
                        .accessKeyId,
                    secretAccessKey: this[_config].statfulCollectorAws
                        .credentials.secretAccessKey,
                    region: region
                });
                eachOfRegionsCallback(null);
            },
            () => {}
        );
    }

    execute() {
        return new Promise(resolve => {
            series(
                [
                    callback => {
                        this[_getAWSMetricsData]().then(() => {
                            callback(null);
                        });
                    },
                    callback => {
                        this[_sendAWSMetricsData]().then(() => {
                            callback(null);
                        });
                    }
                ],
                () => {
                    resolve();
                }
            );
        });
    }

    [_buildAndSendDatapoints](region, metric) {
        return new Promise(resolve => {
            setTimeout(() => {
                let metricName = metric.MetricName;
                let metricNamespace = metric.Namespace.replace('/', '.');
                let metricAggFreq = metric.Period;
                let metricTags = {
                    region: region
                };

                metric.Dimensions.forEach(dimension => {
                    metricTags[dimension.Name] = dimension.Value;
                });

                each(
                    metric.Datapoints,
                    (dataPoint, eachDataPointCallback) => {
                        let metricTimestamp = Math.round(
                            new Date(dataPoint.Timestamp).getTime() / 1000
                        );

                        metricTags.Unit = dataPoint.Unit;

                        this[_config].statfulCollectorAws.statistics.forEach(
                            statistic => {
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
                                    this[_statfulClient].aggregatedPut(
                                        metricName,
                                        metricValue,
                                        metricAgg,
                                        metricAggFreq,
                                        {
                                            namespace: metricNamespace,
                                            tags: metricTags,
                                            timestamp: metricTimestamp
                                        }
                                    );
                                }
                            }
                        );
                        eachDataPointCallback(null);
                    },
                    () => {
                        resolve();
                    }
                );
            }, 0);
        });
    }

    [_calculateTimeoutPerBatch]() {
        let timeout =
            (this[_requestsPerBatch] * 0.4 * this[_period] * 1000) /
            this[_totalNumberOfRequests];
        return Math.round(timeout);
    }

    [_cloudWatchGetMetricStatistics](region, metric) {
        return new Promise(resolve => {
            setTimeout(() => {
                let reqParams = {
                    StartTime: this[_startTime],
                    EndTime: this[_endTime],
                    Period: this[_period],
                    Statistics: this[_statistics],
                    MetricName: metric.MetricName,
                    Namespace: metric.Namespace,
                    Dimensions: metric.Dimensions
                };

                this[_cloudWatchClientPerRegion][region].getMetricStatistics(
                    reqParams,
                    (err, data) => {
                        if (data) {
                            data.Period = this[_period];
                            data.Statistics = this[_statistics];
                            data.MetricName = metric.MetricName;
                            data.Namespace = metric.Namespace;
                            data.Dimensions = metric.Dimensions;
                        }
                        resolve({ region: region, data: data });
                    }
                );
            }, 0);
        });
    }

    [_getAWSMetricsData]() {
        return new Promise(resolve => {
            let requestsPromises = [];

            eachOf(
                this[_metricsPerRegion],
                (metrics, region, eachOfRegionsCallback) => {
                    let requestsCount = 0;

                    eachSeries(
                        metrics,
                        (metric, eachMetricCallback) => {
                            requestsPromises.push(
                                this[_cloudWatchGetMetricStatistics](
                                    region,
                                    metric
                                )
                            );

                            if (requestsCount >= this[_requestsPerBatch]) {
                                setTimeout(() => {
                                    requestsCount = 0;
                                    eachMetricCallback(null);
                                }, this[_timeoutPerBatch]);
                            } else {
                                requestsCount++;
                                eachMetricCallback(null);
                            }
                        },
                        () => {
                            eachOfRegionsCallback(null);
                        }
                    );
                },
                () => {
                    Promise.all(requestsPromises).then(allRequestsData => {
                        each(
                            allRequestsData,
                            (requestData, eachCallback) => {
                                if (
                                    requestData &&
                                    requestData.data &&
                                    requestData.data.Datapoints &&
                                    requestData.data.Datapoints.length > 0
                                ) {
                                    if (
                                        !this[
                                            _receivedDataPerRegion
                                        ].hasOwnProperty(requestData.region)
                                    ) {
                                        this[_receivedDataPerRegion][
                                            requestData.region
                                        ] = [];
                                    }
                                    this[_receivedDataPerRegion][
                                        requestData.region
                                    ] = this[_receivedDataPerRegion][
                                        requestData.region
                                    ].concat(requestData.data);
                                }
                                eachCallback(null);
                            },
                            () => {
                                resolve();
                            }
                        );
                    });
                }
            );
        });
    }

    [_sendAWSMetricsData]() {
        return new Promise(resolve => {
            eachOf(
                this[_receivedDataPerRegion],
                (metrics, region, eachOfRegionsCallback) => {
                    let requestsCount = 0;

                    eachSeries(
                        metrics,
                        (metric, eachMetricCallback) => {
                            this[_buildAndSendDatapoints](region, metric);

                            if (requestsCount >= this[_requestsPerBatch]) {
                                setTimeout(() => {
                                    requestsCount = 0;
                                    eachMetricCallback(null);
                                }, this[_timeoutPerBatch]);
                            } else {
                                requestsCount++;
                                eachMetricCallback(null);
                            }
                        },
                        () => {
                            eachOfRegionsCallback(null);
                        }
                    );
                },
                () => {
                    this[_receivedDataPerRegion] = {};
                    resolve();
                }
            );
        });
    }
}

export default Request;
