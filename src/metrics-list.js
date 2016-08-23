import Promise from 'bluebird';
import each from 'async/each';
import eachOf from 'async/eachOf';
import doWhilst from 'async/doWhilst';
import AWS from 'aws-sdk';
import {Util} from './util';

const _config = Symbol('config');
const _cloudWatchListMetrics = Symbol('cloudWatchListMetrics');
const _metricsPerRegion = Symbol('metricsPerRegion');
const _dimensionsValidatorPerRegionAndMetric = Symbol('dimensionsValidatorPerRegionAndMetric');

const _dimensionsElementContainsAnother = Symbol('dimensionsElementContainsAnother');
const _addDimensionsElement = Symbol('addDimensionsElement');
const _getDimensionsNames = Symbol('getDimensionsNames');
const _isAValidDimension = Symbol('isAValidDimension');

class MetricsList {
    constructor(config) {
        this[_config] = config;
        this[_metricsPerRegion] = null;
        this[_dimensionsValidatorPerRegionAndMetric] = null;
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
                                let metricRegion = requestData.region;

                                if (!this[_dimensionsValidatorPerRegionAndMetric]) {
                                    this[_dimensionsValidatorPerRegionAndMetric] = {};
                                }
                                if (!this[_dimensionsValidatorPerRegionAndMetric].hasOwnProperty(metricRegion)) {
                                    this[_dimensionsValidatorPerRegionAndMetric][metricRegion] = {};
                                }

                                // Process dimensions information
                                each(requestData.data, (metric, eachMetricCallback) => {
                                    if (!this[_dimensionsValidatorPerRegionAndMetric][metricRegion][metric.MetricName]) {
                                        this[_dimensionsValidatorPerRegionAndMetric][metricRegion][metric.MetricName] = [];
                                    }

                                    let validMetricDimensions = this[_dimensionsValidatorPerRegionAndMetric][metricRegion][metric.MetricName];
                                    let dimensionsToInsert = this[_getDimensionsNames](metric.Dimensions);

                                    this[_dimensionsValidatorPerRegionAndMetric][metricRegion][metric.MetricName] = this[_addDimensionsElement](dimensionsToInsert, validMetricDimensions);

                                    eachMetricCallback(null);
                                }, (err) => {
                                    eachCallback(null);
                                });
                            } else {
                                eachCallback(null);
                            }
                        }, (err) => {
                            let auxMetricsPerRegion = {};

                            each(allRequestsData, (requestData, eachCallback) => {
                                if (requestData.data.length > 0) {
                                    let metricRegion = requestData.region;
                                    let validMetrics = [];

                                    if (!auxMetricsPerRegion.hasOwnProperty(metricRegion)) {
                                        auxMetricsPerRegion[metricRegion] = [];
                                    }

                                    // Validate dimensions to use
                                    each(requestData.data, (metric, eachMetricCallback) => {
                                        let validDimensions = this[_dimensionsValidatorPerRegionAndMetric][metricRegion][metric.MetricName];
                                        let dimensionsToVerify = this[_getDimensionsNames](metric.Dimensions);

                                        if (this[_isAValidDimension](validDimensions, dimensionsToVerify)) {
                                            validMetrics.push(metric);
                                        }

                                        eachMetricCallback(null);

                                    }, (err) => {
                                        auxMetricsPerRegion[metricRegion] = auxMetricsPerRegion[metricRegion].concat(validMetrics);
                                        eachCallback(null);
                                    });
                                } else {
                                    eachCallback(null);
                                }
                            }, (err) => {
                                this[_metricsPerRegion] = auxMetricsPerRegion;
                                resolve();
                            });
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


    [_dimensionsElementContainsAnother](dimElem, anotherDimElem) {
        let contains = true;
        for (var i=0; i<anotherDimElem.length; i++) {
            if (dimElem.indexOf(anotherDimElem[i]) === -1) {
                contains = false;
                break;
            }
        }
        return contains;
    }

    [_addDimensionsElement](dimensionsToInsert, validDimensions) {
        let newValidDimensions = [];
        let wasNewDimensionAlreadyInserted = false;

        for (let i = 0; i<validDimensions.length; i++) {
            let oldDimensionsElement = validDimensions[i];

            if (this[_dimensionsElementContainsAnother](dimensionsToInsert, oldDimensionsElement)) {
                if (!wasNewDimensionAlreadyInserted) {
                    wasNewDimensionAlreadyInserted = true;
                    newValidDimensions.push(dimensionsToInsert);
                }
            } else {
                if (this[_dimensionsElementContainsAnother](oldDimensionsElement, dimensionsToInsert)) {
                    wasNewDimensionAlreadyInserted = true;
                }
                newValidDimensions.push(oldDimensionsElement);
            }
        }

        if (!wasNewDimensionAlreadyInserted) {
            newValidDimensions.push(dimensionsToInsert);
        }
        return newValidDimensions;
    }

    [_getDimensionsNames](dimensions) {
        var dimensionsNames = [];

        for (let i=0; i<dimensions.length; i++) {
            dimensionsNames.push(dimensions[i].Name);
        }

        return dimensionsNames;
    }

    [_isAValidDimension](validDimensions, dimension) {
        let valid = false;

        for (let i=0; i<validDimensions.length; i++) {
            if (validDimensions[i].length !== dimension.length) {
                break;
            }

            valid = this[_dimensionsElementContainsAnother](validDimensions[i], dimension);
        }
        return valid;
    }
}

export default MetricsList;
