let proxyquire =  require('proxyquire');
let ModuleMocks = require('../mocks/module-mocks').ModuleMocks;
let Collector = proxyquire('../../src/collector', {
    'statful-client': ModuleMocks.statfulClient(),
    'Request': ModuleMocks.request(),
    'MetricsList': ModuleMocks.metricsList()
}).default;

describe('Collector module tests', () => {
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
                },
                signals: [
                    "SIGTERM",
                    "SIGINT",
                    "SIGABRT",
                    "SIGUSR2"
                ]
            },
            bunyan: {
                name: "statfulAwsCollector",
                level: "debug",
                streams: []
            },
            statfulClient: {
                transport: "api",
                api: {
                    "token": "STATFUL_API_TOKEN"
                },
                app: "statful-aws-collector"
            }
        };
    });

    it('should create a collector', () => {
        let collector = new Collector(mockedConfig);

        expect(collector instanceof Collector).toBe(true);
    });

    it('should start and stop the collector', (done) => {
        let collector = new Collector(mockedConfig);
        collector.log = ModuleMocks.logger();

        collector.start().then( () => {

            expect(collector.started).toBe(true);

            collector.stop().then( () => {
                expect(collector.started).toBe(false);
                done();
            });

        });
    });
});
