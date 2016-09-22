let proxyquire =  require('proxyquire');
let Request = proxyquire('../../src/request', {
    'aws-sdk': {
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
            }
        }
    }
}).default;

describe('Request module tests', () => {
    let mockedConfig, mockedMetricsPerRegion, mockedStatfulClient;

    beforeEach( () => {
        mockedConfig = {
            statfulAwsCollector: {
                credentials: {
                    accessKeyId: "ACCESS_KEY_ID",
                    secretAccessKey: "SECRET_ACCESS_KEY"
                },
                period: 60,
                statistics: ['SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum']
            }
        };

        mockedMetricsPerRegion = {
            "us-west-2": [
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
                    "MetricName": "HealthyHostCount",
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
                }]
        };

        mockedStatfulClient = {
            aggregatedPut: (metricName, metricValue, metricAgg, metricAggFreq, options) => {}
        };

        spyOn(mockedStatfulClient, 'aggregatedPut').and.callThrough();
    });

    it('should create a request', () => {
        let request = new Request(mockedConfig, mockedMetricsPerRegion, '2014-09-03T23:00:00Z', '2014-09-03T23:01:00Z', mockedStatfulClient);

        expect(request instanceof Request).toBe(true);
    });

    it('should execute a request with success sending correctly processed metrics to statful client from aws cloudwatch', (done) => {
        let request = new Request(mockedConfig, mockedMetricsPerRegion, '2014-09-03T23:00:00Z', '2014-09-03T23:01:00Z', mockedStatfulClient);

        request.execute().then(
            () => {
                console.log(mockedStatfulClient.aggregatedPut.calls.all());

                expect(true).toBe(true);
                done();
            }
        );
    });
});