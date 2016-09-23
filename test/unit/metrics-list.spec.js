let proxyquire =  require('proxyquire');
let MetricsList = proxyquire('../../src/metrics-list', {
    'aws-sdk': {
        CloudWatch: function () {
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
}).default;

describe('Metrics list module tests', () => {
    let mockedConfig;

    beforeEach( () => {
        mockedConfig = {
            statfulAwsCollector: {
                credentials: {
                    accessKeyId: 'ACCESS_KEY_ID',
                    secretAccessKey: 'SECRET_ACCESS_KEY'
                },
                period: 60,
                statistics: ['SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum'],
                metricsList: {
                    type: 'white',
                    metricsPerRegion: {
                        'us-west-2': [
                            {
                                Namespace: 'AWS/ELB'
                            }
                        ]
                    }
                }
            }
        };
    });

    it('should create a metrics-list', () => {
        let metricsList = new MetricsList(mockedConfig);

        expect(metricsList instanceof MetricsList).toBe(true);
    });

    it('should retrieve and build metrics list correctly', (done) => {
        let metricsList = new MetricsList(mockedConfig);

        spyOn(metricsList, 'buildMetricsPerRegion').and.callThrough();

        metricsList.buildMetricsPerRegion().then(
            () => {
                metricsList.getMetricsPerRegion().then(
                    (metricsPerRegion) => {
                        let expectedResults = {
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
                        expect(metricsPerRegion).toEqual(expectedResults);
                        expect(metricsList.buildMetricsPerRegion.calls.count()).toBe(1);
                        done();
                    }
                );
            }
        );
    });

    it('should clear metrics per region', (done) => {
        let metricsList = new MetricsList(mockedConfig);

        spyOn(metricsList, 'buildMetricsPerRegion').and.callThrough();

        metricsList.buildMetricsPerRegion().then(
            () => {
                metricsList.clearMetricsPerRegion();
                metricsList.getMetricsPerRegion().then(
                    () => {
                        expect(metricsList.buildMetricsPerRegion.calls.count()).toBe(2);
                        done();
                    }
                );
            }
        );
    });
});