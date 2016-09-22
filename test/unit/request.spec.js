import Request from '../../src/request'

describe('Request module tests', () => {
    let mockedConfig, mockedMetricsPerRegion, mockedStatfulClient, mockedAwsSdk;

    beforeEach( () => {
        mockedConfig = {
            statfulAwsCollector: {
                period: 60,
                statistics: ['SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum']
            }
        };

        mockedMetricsPerRegion = {

        };

        mockedStatfulClient = {
            aggregatedPut: (metricName, metricValue, metricAgg, metricAggFreq, options) => {
                return {
                    metricName: metricName,
                    metricValue: metricValue,
                    metricAgg: metricAgg,
                    metricAggFreq: metricAggFreq,
                    options: options
                }
            }
        };

        mockedAwsSdk = {
            CloudWatch: (initOptions) => {},
            getMetricStatistics: (reqParams, callback) => {
                callback(null, null);
            }
        };
    });

    it('should create a request', () => {
        let request = new Request(mockedConfig, mockedMetricsPerRegion, 0, 0, mockedStatfulClient);

        expect(request instanceof Request).toBe(true);
    });

    it('should execute a request with success sending correctly processed metrics to statful client from aws cloudwatch', () => {

    });
});