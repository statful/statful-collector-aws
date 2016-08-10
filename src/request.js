import Promise from 'bluebird';
import {AWS} from 'aws-sdk';

const _config = Symbol('config');
const _endTime = Symbol('endTime');
const _period = Symbol('period');
const _startTime = Symbol('startTime');
const _statistics = Symbol('statistics');

class Request {
    constructor(config, startTime, endTime) {
        this[_config] = config;
        this[_startTime] = startTime;
        this[_endTime] = endTime;
        this[_period] = this[_config].statfulAwsCollector.period;
        this[_statistics] = this[_config].statfulAwsCollector.statistics;
    }

    execute() {
        return new Promise( (resolve) => {
           resolve();
        });
    }
}

export default Request;


