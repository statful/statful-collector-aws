import Promise from 'bluebird';
import series from 'async/series';
import each from 'async/each';
import eachOf from 'async/eachOf';
import doWhilst from 'async/doWhilst';
import filter from 'async/filter';
import AWS from 'aws-sdk';
import {Util} from './util';

const _config = Symbol('config');
const _cloudWatchListMetrics = Symbol('cloudWatchListMetrics');
const _metricsPerRegion = Symbol('metricsPerRegion');

class MetricsList {
    constructor(config) {
        this[_config] = config;
        this[_metricsPerRegion] = null;
    }

    buildMetricsPerRegion() {
        return new Promise( (resolve) => {
            if (this[_config].statfulAwsCollector.metricsList.type === 'white') {
                let whiteListConfig = this[_config].statfulAwsCollector.metricsList.metricsPerRegion;
                let requestsPromises = [];

                eachOf(whiteListConfig, (metrics, region, eachOfCallback) => {
                    each(metrics, (metric, eachCallback) => {
                        requestsPromises.push(this[_cloudWatchListMetrics](region, metric));
                        eachCallback(null);
                    }, (err) => {
                        eachOfCallback(null);
                    });
                }, (err) => {
                    Promise.all(requestsPromises).then( (allRequestsData) => {
                        each(allRequestsData, (requestData, eachCallback) => {
                            if (requestData.data.length > 0) {
                                if (!this[_metricsPerRegion]) {
                                    this[_metricsPerRegion] = {};
                                }
                                if (!this[_metricsPerRegion].hasOwnProperty(requestData.region)) {
                                    this[_metricsPerRegion][requestData.region] = [];
                                }
                                this[_metricsPerRegion][requestData.region] = this[_metricsPerRegion][requestData.region].concat(requestData.data);
                            }
                            eachCallback(null);
                        }, (err) => {
                            resolve();
                        });
                    });
                });
            } else {
                // TODO - Refactor the black list method or remove if it still takes too long to end
                let availableAWSRegions = Util.getAWSAvailableRegions();
                let blacklistedRegions = Object.keys(this[_config].statfulAwsCollector.metricsList);
                let auxMetricsPerRegion = {};
                let requestsPromises = [];

                series([
                    (taskCallback) => {
                        // Apply blacklist filter to regions
                        each(availableAWSRegions, (region, callback) => {
                            if (blacklistedRegions.indexOf(region) === -1) {
                                auxMetricsPerRegion[region] = [];
                            }
                            callback();
                        }, (err) => {
                            taskCallback(null);
                        });
                    },
                    (taskCallback) => {
                        // Get available metrics and filter it by blacklist
                        eachOf(auxMetricsPerRegion, (metrics, region, eachOfCallback) => {
                            requestsPromises.push(this[_cloudWatchListMetrics](region, {}));
                            eachOfCallback(null);
                        }, (err) => {
                            taskCallback(null);
                        });
                    }
                ],
                (err, results) => {
                    console.log(requestsPromises.length);
                    Promise.all(requestsPromises).then( (allRequestsData) => {
                        each(allRequestsData, (requestData, eachCallback) => {
                            if (requestData.data.length > 0) {
                                let metricsToFilterByBlacklist = requestData.data;
                                let region = requestData.region;

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
                                                            if (metricDimension.Name && blackListedMetricDimension.Name && metricDimension.Name === blackListedMetricDimension.Name) {
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
                                        auxMetricsPerRegion[region] = auxMetricsPerRegion[region].concat(filteredMetrics);
                                    }
                                });
                            }
                            eachCallback(null);
                        }, (err) => {
                            this[_metricsPerRegion] =  auxMetricsPerRegion;
                            resolve();
                        });
                    });
                });
            }
        });
    }

    clearMetricsPerRegion() {
        this[_metricsPerRegion] = null;
    }

    [_cloudWatchListMetrics](region, reqParams) {
        return new Promise( (resolve) => {
            let cloudWatch = new AWS.CloudWatch({
                accessKeyId: this[_config].statfulAwsCollector.credentials.accessKeyId,
                secretAccessKey: this[_config].statfulAwsCollector.credentials.secretAccessKey,
                region: region
            });
            let completedRequests = 0;
            let pendingRequests = [];
            let receivedData = [];
            let requestedRequests = 0;
            let reqParamsCopy = Util.deepCopy(reqParams);

            doWhilst(
                (doDuringCallback) => {
                    // Handle first request
                    if (requestedRequests === 0) {
                        pendingRequests.push(reqParamsCopy);
                        requestedRequests++;
                    }

                    if (pendingRequests.length > 0) {
                        let request = pendingRequests.shift();


                        cloudWatch.listMetrics(request, (err, data) => {
                            if (data && data.Metrics && data.Metrics.length > 0) {
                                receivedData = receivedData.concat(data.Metrics);
                                console.log('received metrics list with data');
                            }

                            if (data && data.NextToken) {
                                reqParamsCopy.NextToken = data.NextToken;
                                pendingRequests.push(reqParamsCopy);
                                requestedRequests++;
                                console.log('received metrics list with next token');
                            }

                            completedRequests++;
                        });
                    }
                    setTimeout( () => {
                        doDuringCallback(null);
                    }, 0);
                },
                () => {
                    return (pendingRequests.length > 0 || requestedRequests > completedRequests);
                },
                (err) => {
                    resolve({region: region, data:receivedData});
                }
            );
        });
    }

    getMetricsPerRegion() {
        return new Promise( (resolve) => {
            if (!this[_metricsPerRegion]) {
                this.buildMetricsPerRegion().then( () => {
                    console.log("MUHA: " + Object.keys(this[_metricsPerRegion]));
                    resolve(this[_metricsPerRegion]);
                });
            } else {
                resolve(this[_metricsPerRegion]);
            }
        });
    }
}

export default MetricsList;
