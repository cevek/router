import { Route, RouteParams, Router, BrowserHistory, NodeHistory } from '../dist/Router';
import test from 'ava';


let calls: {type: string, name: string}[] = [];

function clearCalls() {
    calls = [];
}

function sleep() {
    return new Promise((resolve) => {
        setTimeout(resolve);
    });
}

class A {
    static onEnter(params: RouteParams) {
        calls.push({type: 'enter', name: 'A'});
        return Promise.resolve({app: 1, parent: params.parentProps});
    }

    static onLeave() {
        calls.push({type: 'leave', name: 'A'});
        return Promise.resolve();
    }
}

class Foo {
    static onEnter(params: RouteParams) {
        calls.push({type: 'enter', name: 'Foo'});
        return sleep().then(() => {
            return {fooo: 2, parent: params.parentProps};
        });
    }

    static onLeave() {
        calls.push({type: 'leave', name: 'Foo'});
        return Promise.resolve();
    }
}

class Bar {
    static onEnter(params: RouteParams) {
        calls.push({type: 'enter', name: 'Bar'});
        return Promise.resolve({barr: 3, parent: params.parentProps});
    }

    static onLeave() {
        calls.push({type: 'leave', name: 'Bar'});
        return Promise.resolve();
    }
}


class Baz {
    static onEnter(params: RouteParams) {
        calls.push({type: 'enter', name: 'Baz'});
        return params.router.changeUrl('/f-foo/');
    }

    static onLeave() {
        calls.push({type: 'leave', name: 'Baz'});
        return Promise.resolve();
    }
}


class Profile {
    static onEnter(params: RouteParams) {
        calls.push({type: 'enter', name: 'Profile'});
        return Promise.resolve({profile: 4, parent: params.parentProps});
    }

    static onLeave() {
        calls.push({type: 'leave', name: 'Profile'});
        return Promise.resolve();
    }
}

class ProfileSettings {
    static onEnter(params: RouteParams) {
        calls.push({type: 'enter', name: 'ProfileSettings'});
        return Promise.resolve({profileSettings: 4});
    }

    static onLeave() {
        calls.push({type: 'leave', name: 'ProfileSettings'});
        return Promise.resolve();
    }
}

class ProfileSettingsPages {
}

class ProfileSettingsPwd {
    static onLeave(params: RouteParams) {
        calls.push({type: 'leave', name: 'ProfileSettingsPwd'});
        return params.router.changeUrl('/f-foo/BAR');
    }
}


var index = new Route('/', A);
var indexFoo = index.addChild('/f-:foo', Foo);
var indexFooBar = indexFoo.addChild(':bar', Bar);
var indexFooBarBaz = indexFooBar.addChild('/baz/', Baz);

var indexProfile = index.addChild('/profile/:user_id', Profile);
var indexProfileSettings = indexProfile.addChild('/settings/', ProfileSettings);
var indexProfileSettingsPages = indexProfileSettings.addChild('/p-:page', ProfileSettingsPages);
var indexProfileSettingsPwd = indexProfileSettings.addChild('/pwd', ProfileSettingsPwd);


function appParams() {
    return [
        {
            route: index,
            props: {app: 1, parent: {}},
            urlValues: [],
            usedSearchParams: [],
            isInit: true
        }
    ];
}

function fooParams() {
    return [
        ...appParams(),
        {
            route: indexFoo,
            props: {fooo: 2, parent: appParams().pop()!.props},
            urlValues: ["foo"],
            usedSearchParams: [],
            isInit: true
        },
    ];
}

function fooBarParams() {
    return [
        ...fooParams(),
        {
            route: (indexFooBar),
            props: {barr: 3, parent: fooParams().pop()!.props},
            urlValues: ['foo', 'BAR'],
            usedSearchParams: [],
            isInit: true
        },
    ];
}

function profileParams() {
    return [
        ...appParams(),
        {
            route: indexProfile,
            props: {profile: 4, parent: appParams().pop()!.props},
            urlValues: ["user"],
            usedSearchParams: [],
            isInit: true
        },
    ];
}

function profileSettingsParams() {
    return [
        ...profileParams(),
        {
            route: indexProfileSettings,
            props: {profileSettings: 4},
            urlValues: ["user"],
            usedSearchParams: [],
            isInit: true
        },
    ];
}

function profileSettingsPageParams() {
    return [
        ...profileSettingsParams(),
        {
            route: indexProfileSettingsPages,
            props: {},
            urlValues: ["user", "1"],
            usedSearchParams: [],
            isInit: true
        },
    ];
}

// console.log(route.childrenMap.foo.childrenMap.bar);

test.beforeEach(() => {
    clearCalls();
});

test.serial('simple', async t => {
    const router = new Router(index, history);
    const params = await router.changeUrl('/f-foo/BAR');
    t.deepEqual(params.urlParams, {foo: 'foo', bar: 'BAR'} as {});
    t.deepEqual(params.bindings, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},
    ]);
});

var history = new NodeHistory();
test.serial('transitions', async t => {
    const router = new Router(index, history);
    let params;
    params = await router.changeUrl('/');
    t.deepEqual(params.bindings, appParams());

    clearCalls();
    params = await router.changeUrl('/f-foo/BAR');
    // console.log(params.bindings);
    t.deepEqual(params.bindings, fooBarParams());

    clearCalls();
    params = await router.changeUrl('/profile/user/settings/');
    t.deepEqual(params.bindings, profileSettingsParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Profile'},
        {type: 'enter', name: 'ProfileSettings'},

        {type: 'leave', name: 'Bar'},
        {type: 'leave', name: 'Foo'},
    ]);

    clearCalls();
    params = await router.changeUrl('/f-foo/BAR');
    t.deepEqual(params.bindings, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},

        {type: 'leave', name: 'ProfileSettings'},
        {type: 'leave', name: 'Profile'},
    ]);

    clearCalls();
    params = await router.changeUrl('/');
    t.deepEqual(params.bindings, appParams());
    t.deepEqual(calls, [
        {type: 'leave', name: 'Bar'},
        {type: 'leave', name: 'Foo'},
    ]);


    clearCalls();
    params = await router.changeUrl('/profile/user');
    t.deepEqual(params.bindings, profileParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Profile'},
    ]);


    clearCalls();
    params = await router.changeUrl('/profile/user/settings/');
    t.deepEqual(params.bindings, profileSettingsParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'ProfileSettings'},
    ]);

    clearCalls();
    params = await router.changeUrl('/f-foo/');
    t.deepEqual(params.bindings, fooParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Foo'},

        {type: 'leave', name: 'ProfileSettings'},
        {type: 'leave', name: 'Profile'},
    ]);


    clearCalls();
    params = await router.changeUrl('/f-foo/BAR');
    t.deepEqual(params.bindings, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Bar'},
    ]);


    clearCalls();
    params = await router.changeUrl('/f-foo/');
    t.deepEqual(params.bindings, fooParams());
    t.deepEqual(calls, [
        {type: 'leave', name: 'Bar'},
    ]);

});

test.serial('not found', async t => {
    const router = new Router(index, history);
    let params;
    params = await router.changeUrl('/not-found');
    t.deepEqual(params.urlParams, {} as {});
    t.deepEqual(params.bindings, []);

    params = await router.changeUrl('/f-foo/');

    params = await router.changeUrl('/not-found');
    t.deepEqual(params.bindings, fooParams());
});

test.serial('check no onEnter no onLeave', async t => {
    const router = new Router(index, history);
    const params = await router.changeUrl('/profile/user/settings/p-1');
    t.deepEqual(params.bindings, profileSettingsPageParams());
    await router.changeUrl('/');
});

test.serial('break transition', async t => {
    const router = new Router(index, history);
    router.changeUrl('/profile/user/settings/p-1');
    const params = await router.changeUrl('/f-foo/BAR/');
    t.deepEqual(params.bindings, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},
    ]);
});


test.serial('redirect in onEnter', async t => {
    const router = new Router(index, history);
    const params = await router.changeUrl('/f-foo/BAR/baz');
    t.deepEqual(params.bindings, fooParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},
        {type: 'enter', name: 'Baz'},
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
    ]);
});

test.serial('toUrl', async t => {
    const router = new Router(index, history);
    const params = await router.changeUrl(indexFooBar.toUrl({foo: 'foo', bar: 'BAR'}));
    t.deepEqual(params.bindings, fooBarParams());
});


// test.serial.only('redirect in onLeave', async t => {
//     const router = new Router(route);
//     await router.changeUrl('/profile/user/settings/pwd');
//     clearCalls();
//     await router.changeUrl('/');
//     t.deepEqual(calls, [
//         {type: 'leave', name: 'ProfileSettingsPwd'},
//
//         {type: 'enter', name: 'Foo'},
//         {type: 'enter', name: 'Bar'},
//         {type: 'enter', name: 'Baz'},
//         {type: 'enter', name: 'A'},
//         {type: 'enter', name: 'Foo'},
//     ]);
// });
