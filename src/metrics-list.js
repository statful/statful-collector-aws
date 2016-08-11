import Promise from 'bluebird';
import series from 'async/series';
import each from 'async/each';
import eachOf from 'async/eachOf';
import doWhilst from 'async/doWhilst';
import filter from 'async/filter';
import AWS from 'aws-sdk';
import {Util} from './util';

const _config = Symbol('config');
const _metricsPerRegion = Symbol('metricsPerRegion');

class MetricsList {
    constructor(config) {
        this[_config] = config;
        this[_metricsPerRegion] = null;
    }

    clearMetricsPerRegion() {
        this[_metricsPerRegion] = null;
    }

    buildMetricsPerRegion() {
        // TODO - Move all that code below into separated functions
        return new Promise( (resolve) => {
            if (this[_config].statfulAwsCollector.metricsList.type === 'white') {
                this[_metricsPerRegion] = this[_config].statfulAwsCollector.metricsList;
                resolve();
            } else {
                let availableAWSRegions = Util.getAWSAvailableRegions();
                let blacklistedRegions = Object.keys(this[_config].statfulAwsCollector.metricsList);
                let auxMetricsPerRegion = {};

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
                    this[_metricsPerRegion] = auxMetricsPerRegion;
                    resolve();
                });
            }
        });
    }

    getMetricsPerRegion() {
        return new Promise( (resolve) => {
            if (!this[_metricsPerRegion]) {
                this.buildMetricsPerRegion().then( () => {
                    resolve(this[_metricsPerRegion]);
                });
            } else {
                resolve(this[_metricsPerRegion]);
            }
        });
    }
}

export default MetricsList;
