import {Route} from '../dist/Router2';

import test from 'ava';

class A {

}

test('simple', t => {
    const route = new Route('/hello/:foo/:bar?', A, {}).compile();
    t.is(route.toUrl({foo: 1}), '/hello/1');
    t.is(route.toUrl({foo: 1, bar: 2}), '/hello/1/2');
});


test('slashes', t => {
    const route = new Route('hello//:foo//:bar?/', A, {}).compile();
    t.is(route.path.pattern, '/hello/:foo/:bar?')

    const route = new Route('', A, {}).compile();
    t.is(route.path.pattern, '')

    const route = new Route('/foo/', A, {}).compile();
    t.is(route.path.pattern, '/foo')
});


test('to str', t => {
    const route = new Route('hello//:foo//:bar?/', A, {}).compile();
    t.is(route.path.pattern, '/hello/:foo/:bar?')

    const route = new Route('', A, {}).compile();
    t.is(route.path.pattern, '')

    const route = new Route('/foo/', A, {}).compile();
    t.is(route.path.pattern, '/foo')
});

