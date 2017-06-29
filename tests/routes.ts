import {Route} from '../dist/Router';

import test from 'ava';

class A {

}

test('simple', t => {
    const route = new Route('/hello/:foo/:bar?', A);
    t.is(route.toUrl({foo: '1'}), '/hello/1');
    t.is(route.toUrl({foo: '1', bar: '2'}), '/hello/1/2');
});

var r = new Route('/:foo', {});

test('slashes', t => {
    let route;
    route = new Route('hello//:foo//:bar?/', A)
    t.is(route.path.pattern, '/hello/:foo/:bar?')

    route = new Route('', A)
    t.is(route.path.pattern, '')

    route = new Route('/foo/', A)
    t.is(route.path.pattern, '/foo')
});


test('to str', t => {
    let route;
    route = new Route('hello//:foo//:bar?/', A)
    t.is(route.path.pattern, '/hello/:foo/:bar?')

    route = new Route('', A)
    t.is(route.path.pattern, '')

    route = new Route('/foo/', A)
    t.is(route.path.pattern, '/foo')
});

