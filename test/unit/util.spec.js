import expect from 'expect';
import {Util} from '../../src/util';

describe('Util module tests', () => {
    it('should return module name', () => {
        let mockedModule = {
            filename: '/parent/child/source/name.js'
        };
        expect(Util.getCurrentFile(mockedModule)).toEqual('name.js');
    });
});