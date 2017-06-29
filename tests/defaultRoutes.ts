import { Router, Route, NodeHistory } from '../dist/Router';
import test from 'ava';

function A() { }

function createRouter() {

    var index = new Route('/', A).addIndex(A).addAny(A);
    var indexFoo = index.addChild('/foo', A).addIndex(A).addAny(A);
    var indexFooBar = indexFoo.addChild('/bar', A).addIndex(A).addAny(A);
    var indexFooBarBaz = indexFoo.addChild('/baz', A).addIndex(A).addAny(A);

    const router = new Router(index, new NodeHistory());
    return { router, index, indexFoo, indexFooBar, indexFooBarBaz }
}


test('index', async t => {
    const { router, index, indexFoo, indexFooBar } = createRouter();
    let params;
    params = await router.changeUrl('/');
    t.is(params.route, index.children.find(r => r.isIndex));

    params = await router.changeUrl('/foo/');
    t.is(params.route, indexFoo.children.find(r => r.isIndex));

    params = await router.changeUrl('/foo/bar/');
    t.is(params.route, indexFooBar.children.find(r => r.isIndex));
});

test('not found', async t => {
    const { router, index, indexFoo, indexFooBar } = createRouter();
    let params;
    params = await router.changeUrl('/asdfasfas');
    t.is(params.route, index.children.find(r => r.isAny));

    params = await router.changeUrl('/foo/asdfadsf');
    t.is(params.route, indexFoo.children.find(r => r.isAny));

    params = await router.changeUrl('/foo/bar/asfdaf');
    t.is(params.route, indexFooBar.children.find(r => r.isAny));
});
