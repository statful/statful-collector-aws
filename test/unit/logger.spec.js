import expect from 'expect';
import Logger from '../../src/logger';

describe('Logger module tests', () => {
    let mockedConfig;

    beforeEach( () => {
        mockedConfig = {
            bunyan: {
                name: 'testLogger',
                level: 'debug',
                streams: []
            }
        };
    });

    it('should return a singleton logger instance', () => {
        let logger = Logger.sharedInstance(mockedConfig);
        let anotherLogger = Logger.sharedInstance();
        let isInstanceOfLogger = logger.constructor.name === "Logger";

        expect(isInstanceOfLogger).toBeTruthy();
        expect(logger).toEqual(anotherLogger);
    });

    it('should have a stream configured', () => {
        let logger = Logger.sharedInstance(mockedConfig);

        expect(logger.streams.length).toBe(1);
    });

    it('should have debug level', () => {
        let logger = Logger.sharedInstance(mockedConfig);

        expect(logger.streams[0].level).toBe(20);
    });
});