import Config from '../../src/config';

describe('Config module tests', () => {
    it('should load default config', (done) => {
        new Config().load().then( (config) => {
            expect(config).toBeDefined();
            done();
        });
    });

    it('should load a valid config', (done) => {
        new Config('conf/defaults.json').load().then( (config) => {
            expect(config).toBeDefined();
            done();
        });
    });

    it('should return an error loading a nonexistent file', (done) => {
        new Config('/error/error/file').load().then(
            () => {

            },
            (error) => {
                expect(error).toBeDefined();
                done();
            }
        );
    });
});