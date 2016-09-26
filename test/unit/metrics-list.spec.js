let proxyquire =  require('proxyquire');
let ModuleMocks = require('../mocks/module-mocks').ModuleMocks;
let MetricsList = proxyquire('../../src/metrics-list', {
    'aws-sdk': ModuleMocks.awsSdk()
}).default;

describe('Metrics list module tests', () => {
    let mockedConfig;

    beforeEach( () => {
        mockedConfig = {
            statfulCollectorAws: {
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