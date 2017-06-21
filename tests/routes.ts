import {Route, route} from '../dist/Router2';

import test from 'ava';

class A {

}

test('simple', t => {
    const route = new Route('/hello/:foo/:bar?', A).compile();
    t.is(route.toUrl({foo: '1'}), '/hello/1');
    t.is(route.toUrl({foo: '1', bar: '2'}), '/hello/1/2');
});

var r = route('/:foo', {});

test('slashes', t => {
    let route;
    route = new Route('hello//:foo//:bar?/', A).compile();
    t.is(route.path.pattern, '/hello/:foo/:bar?')

    route = new Route('', A).compile();
    t.is(route.path.pattern, '')

    route = new Route('/foo/', A).compile();
    t.is(route.path.pattern, '/foo')
});


test('to str', t => {
    let route;
    route = new Route('hello//:foo//:bar?/', A).compile();
    t.is(route.path.pattern, '/hello/:foo/:bar?')

    route = new Route('', A).compile();
    t.is(route.path.pattern, '')

    route = new Route('/foo/', A).compile();
    t.is(route.path.pattern, '/foo')
});

