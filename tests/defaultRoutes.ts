import {anyRoute, indexRoute, route, Router} from '../dist/Router';
import test from 'ava';

function A() {}

function createRouter() {
    const index = route('/', A, {
        index: indexRoute(A),
        notFound: anyRoute(A),
        foo: route('/foo', A, {
            index: indexRoute(A),
            notFound: anyRoute(A),
            bar: route('bar', A, {
                index: indexRoute(A),
                notFound: anyRoute(A),
                baz: route('/baz/', A)
            })
        }),
    });
    const router = new Router(index);
    return {router, index}
}


test('index', async t => {
    const {router, index} = createRouter();
    let params;
    params = await router.changeUrl('/');
    t.is(params.route, index.index.route);

    params = await router.changeUrl('/foo/'); 
    t.is(params.route, index.foo.index.route);

    params = await router.changeUrl('/foo/bar/');
    t.is(params.route, index.foo.bar.index.route);
});

test('not found', async t => {
    const {router, index} = createRouter();
    let params;
    params = await router.changeUrl('/asdfasfas');
    t.is(params.route, index.notFound.route);

    params = await router.changeUrl('/foo/asdfadsf');
    t.is(params.route, index.foo.notFound.route);

    params = await router.changeUrl('/foo/bar/asfdaf');
    t.is(params.route, index.foo.bar.notFound.route);
});
