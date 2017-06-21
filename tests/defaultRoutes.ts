import {Route, RouteParams, Router} from '../dist/Router2';
import test from 'ava';

function A() {}

function createRouter() {
    const route = new Route('/', A, {
        index: new Route('', A, {}, {isIndex: true}),
        notFound: new Route('', A, {}, {isNotFound: true}),
        foo: new Route('/foo', A, {
            index: new Route('', A, {}, {isIndex: true}),
            notFound: new Route('', A, {}, {isNotFound: true}),
            bar: new Route('bar', A, {
                index: new Route('', A, {}, {isIndex: true}),
                notFound: new Route('', A, {}, {isNotFound: true}),
                baz: new Route('/baz/', A)
            })
        }),
    });
    const router = new Router(route);
    return {router, route}
}


test('index', async t => {
    const {router, route} = createRouter();
    let params;
    params = await router.changeUrl('/');
    t.is(params.route, route.childrenMap.index);

    params = await router.changeUrl('/foo/');
    t.is(params.route, route.childrenMap.foo.childrenMap.index);

    params = await router.changeUrl('/foo/bar/');
    t.is(params.route, route.childrenMap.foo.childrenMap.bar.childrenMap.index);});

test('not found', async t => {
    const {router, route} = createRouter();
    let params;
    params = await router.changeUrl('/asdfasfas');
    t.is(params.route, route.childrenMap.notFound);

    params = await router.changeUrl('/foo/asdfadsf');
    t.is(params.route, route.childrenMap.foo.childrenMap.notFound);

    params = await router.changeUrl('/foo/bar/asfdaf');
    t.is(params.route, route.childrenMap.foo.childrenMap.bar.childrenMap.notFound);
});
