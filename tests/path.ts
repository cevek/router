import {Path} from '../dist/Router';

import test from 'ava';

test('simple', t => {
    const path = new Path('/a/b/c').compile();
    const {urlParams} = path.parse('/a/b/c');
    t.deepEqual(urlParams, {});
});

test('param', t => {
    const path = new Path('/a/:b/c').compile();
    const {urlParams} = path.parse('/a/wow/c');
    t.deepEqual(urlParams, {b: 'wow'});
    t.is(path.toString({b: 'boom'}), '/a/boom/c');
});

test('empty param', t => {
    t.throws(() => {
        const path = new Path('/a/:b/c').compile();
        path.toString({d: 'boom'});
    })
});

test('optional exist', t => {
    const path = new Path('/a/:b?/c').compile();
    const {urlParams} = path.parse('/a/wow/c');
    t.deepEqual(urlParams, {b: 'wow'});
    t.is(path.toString({b: 'boom'}), '/a/boom/c');
});

test('optional non exist', t => {
    const path = new Path('/a/:b?/c').compile();
    const {urlParams} = path.parse('/a/c');
    t.deepEqual(urlParams, {b: ''});
    t.is(path.toString({}), '/a/c');
});

test('empty prefix', t => {
    const path = new Path(':foo').compile();
    const {urlParams} = path.parse('abc');
    t.deepEqual(urlParams, {foo: 'abc'});
    t.is(path.toString({foo: 'abc'}), 'abc');
});

test('custom prefix', t => {
    const path = new Path('/a/he$ll.o-:b/c').compile();
    const {urlParams} = path.parse('/a/he$ll.o-boom/c');
    t.deepEqual(urlParams, {b: 'boom'});
    t.is(path.toString({b: 'foo'}), '/a/he$ll.o-foo/c');
});

test('custom prefix optional exist', t => {
    const path = new Path('/a/hello-:b?/c').compile();
    const {urlParams} = path.parse('/a/hello-boom/c');
    t.deepEqual(urlParams, {b: 'boom'});
    t.is(path.toString({b: 'foo'}), '/a/hello-foo/c');
});

test('custom prefix optional non exist', t => {
    const path = new Path('/a/hello-:b?/c').compile();
    const {urlParams} = path.parse('/a/c');
    t.deepEqual(urlParams, {b: ''});
    t.is(path.toString({}), '/a/c');
});

test('without slash optional exist with prefix', t => {
    const path = new Path('hello-:b?').compile();
    const {urlParams} = path.parse('hello-boom');
    t.deepEqual(urlParams, {b: 'boom'});
    t.is(path.toString({b: 'boom'}), 'hello-boom');
});

test('empty', t => {
    const path = new Path('hello-:b?').compile();
    const {urlParams} = path.parse('');
    t.deepEqual(urlParams, {b: ''});
    t.is(path.toString({}), '');
});

test('toString non compiled path', t => {
    t.throws(() => {
        const path = new Path('/foo');
        path.toString({});
    })
});

test('parse non compiled path', t => {
    t.throws(() => {
        const path = new Path('/foo');
        path.parse('/foo')
    })
});

test('symbols test', t => {
    const path = new Path('/:aa/!-{}?()[]*&%1345#"\'\\+=^$@;:foo/:Az_45').compile();
    const {urlParams} = path.parse('/xxx/!-{}?()[]*&%1345#"\'\\+=^$@;PPP/yyy');
    t.deepEqual(urlParams, {aa: 'xxx', foo: 'PPP', Az_45: 'yyy'});
    t.is(path.toString({aa: 'fff', foo: 'yyy', Az_45: 'uuu'}), '/fff/!-{}?()[]*&%1345#"\'\\+=^$@;yyy/uuu');
});

test('value symbols test', t => {
    const path = new Path('/:aa/').compile();
    let {urlParams} = path.parse('/!-{}?()[]*&1345#"\'\\+=^$@;/');
    t.deepEqual(urlParams, {aa: '!-{}?()[]*&1345#"\'\\+=^$@;'});
    t.is(path.toString({aa: '!-{}?()[]*&1345#"\'\\+=^$@;'}), '/!-%7B%7D%3F()%5B%5D*%261345%23%22\'%5C%2B%3D%5E%24%40%3B/');

    const str = path.toString({aa: '!-{}?()[]*&1345#"\'\\+=^$@;'});
    let {urlParams: urlParams2} = path.parse(str);
    t.deepEqual(urlParams2, {aa: '!-{}?()[]*&1345#"\'\\+=^$@;'});
});

test('exact test', t => {
    const path = new Path('/foo').compile();
    const res = path.parse('/foo/bar');
    t.deepEqual(res, void 0);
});

test('non exact test', t => {
    const path = new Path('/foo', false).compile();
    const {urlParams} = path.parse('/foo/bar');
    t.deepEqual(urlParams, {});
});