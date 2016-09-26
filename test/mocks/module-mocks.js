import Promise from 'bluebird';

export const ModuleMocks = {
    awsSdk: () => {
        return {
            CloudWatch: function () {
                this.getMetricStatistics = function (reqParams, callback) {
                    let requestCountData = {
                        ResponseMetadata: {RequestId: '86a10c1e-80eb-11e6-aede-4f118cb5732e'},
                        Label: 'RequestCount',
                        Datapoints: [
                            {
                                Timestamp: '2014-09-03T23:00:00Z',
                                SampleCount: 1,
                                Average: 1,
                                Sum: 1,
                                Minimum: 1,
                                Maximum: 1,
                                Unit: 'Count'
                            }
                        ]
                    };

                    let healthyHostCountData = {
                        ResponseMetadata: {RequestId: '86a2938b-80eb-11e6-b4ca-cd7cbce3c3a4'},
                        Label: 'HealthyHostCount',
                        Datapoints: [
                            {
                                Timestamp: '2014-09-03T23:00:00Z',
                                SampleCount: 6,
                                Average: 1,
                                Sum: 6,
                                Minimum: 1,
                                Maximum: 1,
                                Unit: 'Count'
                            }
                        ]
                    };

                    if (reqParams.MetricName === 'RequestCount') {
                        callback(null, requestCountData);
                    } else {
                        callback(null, healthyHostCountData);
                    }
                };

                this.listMetrics = function (request, callback) {
                    let firstReturnData = {
                        "ResponseMetadata": {
                            "RequestId": "78331491-817c-11e6-83bd-814554568c27"
                        },
                        "Metrics": [

                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "Latency",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2b"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "Latency",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2a"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "RequestCount",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2b"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "RequestCount",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "RequestCount",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2a"
                                    }
                                ]
                            }
                        ],
                        "NextToken": "1"
                    };

                    let nextTokenReturnData = {
                        "ResponseMetadata": {
                            "RequestId": "78331491-817c-11e6-83bd-814554568c27"
                        },
                        "Metrics": [
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "HTTPCode_Backend_2XX",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2a"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "HTTPCode_Backend_2XX",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    }
                                ]
                            }
                        ]
                    };


                    if(request.NextToken === "1") {
                        callback(null, nextTokenReturnData);
                    } else {
                        callback(null, firstReturnData);
                    }
                }
            }
        }
    },
    statfulClient: function ()  {
            return function (config) {
                this.aggregatedPut = (metricName, metricValue, metricAgg, metricAggFreq, options) => {};
            };

    },
    request: function ()  {
        return function (config, metricsPerRegion, startTime, endTime, statfulClient) {
            this.execute = () => {
                return new Promise( (resolve) => {
                    resolve();
                });
            };
        };

    },
    metricsList: function ()  {
        return function (config) {
            this.config = config;
            this.mpr = null;

            this.buildMetricsPerRegion = () => {
                return new Promise( (resolve) => {
                    let mprToReturn = {
                        "us-west-2": [
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "Latency",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2b"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "Latency",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2a"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "RequestCount",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2b"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "RequestCount",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2a"
                                    }
                                ]
                            },
                            {
                                "Namespace": "AWS/ELB",
                                "MetricName": "HTTPCode_Backend_2XX",
                                "Dimensions": [
                                    {
                                        "Name": "LoadBalancerName",
                                        "Value": "lb-1"
                                    },
                                    {
                                        "Name": "AvailabilityZone",
                                        "Value": "us-west-2a"
                                    }
                                ]
                            }
                        ]
                    };

                    resolve(mprToReturn);
                });
            };

            this.clearMetricsPerRegion = () => {
                this.mpr = null;
            };

            this.getMetricsPerRegion = () => {
                return new Promise( (resolve) => {
                    if (!this.mpr) {
                        this.buildMetricsPerRegion().then( () => {
                            resolve(this.mpr);
                        });
                    } else {
                        resolve(this.mpr);
                    }
                });

            };
        };

    },
    logger: function() {
        return {
            info: function () {},
            debug: function() {},
            error: function() {}

        };
    }
};