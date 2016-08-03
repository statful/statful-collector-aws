import Promise from 'bluebird';

const bar = () => {
    let {
        msg
    } = {
        msg: 'Hello World !!!',
        something: 'something else'
    };

    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(msg), 1000);
    });
};

async function foo () {
    console.log(`before async call`);
    let msg = await bar();
    console.log(`after async call, msg = ${msg}, this was a template string`);
    Promise.resolve('babel stage-0 !!!').delay(100).then(::console.log);
}

foo();



