import {Listerners} from '../dist/Router2';

import test from 'ava';

test('simple', t => {
    let calls:number[] = [];
    const listeners = new Listerners();
    const disposer = listeners.listen(val => calls.push(val));
    listeners.call(3);
    disposer();
    listeners.call(5);
    t.deepEqual(calls, [3]);
});

test('several listeners', t => {
    let calls:number[] = [];
    const listeners = new Listerners();
    const disposer1 = listeners.listen(val => calls.push(val));
    const disposer2 = listeners.listen(val => calls.push(val + 10));
    const disposer3 = listeners.listen(val => calls.push(val + 100));
    listeners.call(3);
    disposer1();
    listeners.call(5);
    disposer3();
    listeners.call(7);
    disposer2();
    listeners.call(9);
    t.deepEqual(calls, [3, 13, 103, 15, 105, 17]);
});

test('non unique listeners', t => {
    let calls:number[] = [];
    const listeners = new Listerners();
    function callback(val: number) {
        calls.push(val);
    }
    const disposer1 = listeners.listen(callback);
    const disposer2 = listeners.listen(callback);
    listeners.call(3);
    disposer1();
    listeners.call(5);
    disposer2();
    listeners.call(7);
    t.deepEqual(calls, [3]);
});
