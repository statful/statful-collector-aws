import expect from 'expect';
import {Util} from '../../src/util';

describe('Util module tests', () => {
    it('should return a deep clone object', () => {
        let originalObject = {
            a: 1,
            b: {
                a: 10
            }
        };
        let clonedObject = Util.deepCopy(originalObject);

        expect(clonedObject.a).toEqual(1);
        expect(clonedObject.b.a).toEqual(10);
        expect(originalObject == clonedObject).toBeFalsy();
    });

    it('should return module name', () => {
        let mockedModule = {
            filename: '/parent/child/source/name.js'
        };
        expect(Util.getCurrentFile(mockedModule)).toEqual('name.js');
    });

    it('should return list update time (as a multiple of 60)', () => {
        let listUpdateTime = Util.getMetricListUpdateTime();
        let remainder = listUpdateTime % 60;

        expect(listUpdateTime > 0 && remainder === 0).toBeTruthy();
    });
});