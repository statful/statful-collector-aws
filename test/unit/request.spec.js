let proxyquire =  require('proxyquire');
let ModuleMocks = require('../mocks/module-mocks').ModuleMocks;
let Request = proxyquire('../../src/request', {
    'aws-sdk': ModuleMocks.awsSdk()
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
                expect(mockedStatfulClient.aggregatedPut.calls.count()).toBe(10);

                //Put 1
                let argsForCall1 = mockedStatfulClient.aggregatedPut.calls.argsFor(0);
                expect(argsForCall1[0]).toBe('RequestCount');
                expect(argsForCall1[1]).toBe(1);
                expect(argsForCall1[2]).toBe('count');
                expect(argsForCall1[3]).toBe(60);
                expect(argsForCall1[4].namespace).toBe('AWS.ELB');
                expect(argsForCall1[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall1[4].timestamp).toBe(1409785200);

                //Put 2
                let argsForCall2 = mockedStatfulClient.aggregatedPut.calls.argsFor(1);
                expect(argsForCall2[0]).toBe('RequestCount');
                expect(argsForCall2[1]).toBe(1);
                expect(argsForCall2[2]).toBe('avg');
                expect(argsForCall2[3]).toBe(60);
                expect(argsForCall2[4].namespace).toBe('AWS.ELB');
                expect(argsForCall2[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall2[4].timestamp).toBe(1409785200);

                //Put 3
                let argsForCall3 = mockedStatfulClient.aggregatedPut.calls.argsFor(2);
                expect(argsForCall3[0]).toBe('RequestCount');
                expect(argsForCall3[1]).toBe(1);
                expect(argsForCall3[2]).toBe('sum');
                expect(argsForCall3[3]).toBe(60);
                expect(argsForCall3[4].namespace).toBe('AWS.ELB');
                expect(argsForCall3[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall2[4].timestamp).toBe(1409785200);

                //Put 4
                let argsForCall4 = mockedStatfulClient.aggregatedPut.calls.argsFor(3);
                expect(argsForCall4[0]).toBe('RequestCount');
                expect(argsForCall4[1]).toBe(1);
                expect(argsForCall4[2]).toBe('min');
                expect(argsForCall4[3]).toBe(60);
                expect(argsForCall4[4].namespace).toBe('AWS.ELB');
                expect(argsForCall4[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall4[4].timestamp).toBe(1409785200);

                //Put 5
                let argsForCall5 = mockedStatfulClient.aggregatedPut.calls.argsFor(4);
                expect(argsForCall5[0]).toBe('RequestCount');
                expect(argsForCall5[1]).toBe(1);
                expect(argsForCall5[2]).toBe('max');
                expect(argsForCall5[3]).toBe(60);
                expect(argsForCall5[4].namespace).toBe('AWS.ELB');
                expect(argsForCall5[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall5[4].timestamp).toBe(1409785200);

                //Put 6
                let argsForCall6 = mockedStatfulClient.aggregatedPut.calls.argsFor(5);
                expect(argsForCall6[0]).toBe('HealthyHostCount');
                expect(argsForCall6[1]).toBe(6);
                expect(argsForCall6[2]).toBe('count');
                expect(argsForCall6[3]).toBe(60);
                expect(argsForCall6[4].namespace).toBe('AWS.ELB');
                expect(argsForCall6[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall6[4].timestamp).toBe(1409785200);

                //Put 7
                let argsForCall7 = mockedStatfulClient.aggregatedPut.calls.argsFor(6);
                expect(argsForCall7[0]).toBe('HealthyHostCount');
                expect(argsForCall7[1]).toBe(1);
                expect(argsForCall7[2]).toBe('avg');
                expect(argsForCall7[3]).toBe(60);
                expect(argsForCall7[4].namespace).toBe('AWS.ELB');
                expect(argsForCall7[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall7[4].timestamp).toBe(1409785200);

                //Put 8
                let argsForCall8 = mockedStatfulClient.aggregatedPut.calls.argsFor(7);
                expect(argsForCall8[0]).toBe('HealthyHostCount');
                expect(argsForCall8[1]).toBe(6);
                expect(argsForCall8[2]).toBe('sum');
                expect(argsForCall8[3]).toBe(60);
                expect(argsForCall8[4].namespace).toBe('AWS.ELB');
                expect(argsForCall8[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall8[4].timestamp).toBe(1409785200);

                //Put 9
                let argsForCall9 = mockedStatfulClient.aggregatedPut.calls.argsFor(8);
                expect(argsForCall9[0]).toBe('HealthyHostCount');
                expect(argsForCall9[1]).toBe(1);
                expect(argsForCall9[2]).toBe('min');
                expect(argsForCall9[3]).toBe(60);
                expect(argsForCall9[4].namespace).toBe('AWS.ELB');
                expect(argsForCall9[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall9[4].timestamp).toBe(1409785200);

                //Put 10
                let argsForCall10 = mockedStatfulClient.aggregatedPut.calls.argsFor(9);
                expect(argsForCall10[0]).toBe('HealthyHostCount');
                expect(argsForCall10[1]).toBe(1);
                expect(argsForCall10[2]).toBe('max');
                expect(argsForCall10[3]).toBe(60);
                expect(argsForCall10[4].namespace).toBe('AWS.ELB');
                expect(argsForCall10[4].tags).toEqual({
                    region: 'us-west-2',
                    LoadBalancerName: 'lb-1',
                    AvailabilityZone: 'us-west-2a',
                    Unit: 'Count'
                });
                expect(argsForCall10[4].timestamp).toBe(1409785200);

                done();
            }
        );
    });
});