import {Route, RouteParams, Router} from '../dist/Router2';
import test from 'ava';


let calls:{type: string, name: string}[] = [];
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
            return {fooo: 2, parent: params.parentProps}
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

const route = new Route('/', A, {
    foo: new Route('/f-:foo', Foo, {
        bar: new Route(':bar?', Bar, {
            baz: new Route('/baz/', Baz)
        })
    }),
    profile: new Route('/profile/:user_id', Profile, {
        settings: new Route('/settings/', ProfileSettings, {
            pages: new Route('/p-:page', ProfileSettingsPages),
            pwd: new Route('/pwd', ProfileSettingsPwd)
        })
    })
});

function appParams() {
    return [
        {
            route: route,
            props: {app: 1, parent: {}},
            usedUrlParams: [],
            usedSearchParams: [],
            isInit: true
        }
    ]
}

function fooParams() {
    return [
        ...appParams(),
        {
            route: route.childrenMap.foo,
            props: {fooo: 2, parent: appParams().pop()!.props},
            usedUrlParams: [],
            usedSearchParams: [],
            isInit: true
        },
    ]
}
function fooBarParams() {
    return [
        ...fooParams(),
        {
            route: route.childrenMap.foo.childrenMap.bar,
            props: {barr: 3, parent: fooParams().pop()!.props},
            usedUrlParams: [],
            usedSearchParams: [],
            isInit: true
        },
    ]
}

function profileParams() {
    return [
        ...appParams(),
        {
            route: route.childrenMap.profile,
            props: {profile: 4, parent: appParams().pop()!.props},
            usedUrlParams: [],
            usedSearchParams: [],
            isInit: true
        },
    ]
}
function profileSettingsParams() {
    return [
        ...profileParams(),
        {
            route: route.childrenMap.profile.childrenMap.settings,
            props: {profileSettings: 4},
            usedUrlParams: [],
            usedSearchParams: [],
            isInit: true
        },
    ]
}
function profileSettingsPageParams() {
    return [
        ...profileSettingsParams(),
        {
            route: route.childrenMap.profile.childrenMap.settings.childrenMap.pages,
            props: {},
            usedUrlParams: [],
            usedSearchParams: [],
            isInit: true
        },
    ]
}

// console.log(route.childrenMap.foo.childrenMap.bar);

test.beforeEach(() => {
    clearCalls();
});

test.serial('simple', async t => {
    const router = new Router(route);
    const params = await router.changeUrl('/f-foo/BAR');
    t.deepEqual(params.urlParams, {foo: 'foo', bar: 'BAR'} as {});
    t.deepEqual(params.bindings as any, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},
    ]);
});

test.serial('transitions', async t => {
    const router = new Router(route);
    let params;
    params = await router.changeUrl('/');
    t.deepEqual(params.bindings as any, appParams());

    clearCalls();
    params = await router.changeUrl('/f-foo/BAR');
    // console.log(params.bindings);
    t.deepEqual(params.bindings as any, fooBarParams());

    clearCalls();
    params = await router.changeUrl('/profile/user/settings/');
    t.deepEqual(params.bindings as any, profileSettingsParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Profile'},
        {type: 'enter', name: 'ProfileSettings'},

        {type: 'leave', name: 'Bar'},
        {type: 'leave', name: 'Foo'},
    ]);

    clearCalls();
    params = await router.changeUrl('/f-foo/BAR');
    t.deepEqual(params.bindings as any, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},

        {type: 'leave', name: 'ProfileSettings'},
        {type: 'leave', name: 'Profile'},
    ]);

    clearCalls();
    params = await router.changeUrl('/');
    t.deepEqual(params.bindings as any, appParams());
    t.deepEqual(calls, [
        {type: 'leave', name: 'Bar'},
        {type: 'leave', name: 'Foo'},
    ]);


    clearCalls();
    params = await router.changeUrl('/profile/user');
    t.deepEqual(params.bindings as any, profileParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Profile'},
    ]);


    clearCalls();
    params = await router.changeUrl('/profile/user/settings/');
    t.deepEqual(params.bindings as any, profileSettingsParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'ProfileSettings'},
    ]);

    clearCalls();
    params = await router.changeUrl('/f-foo/');
    t.deepEqual(params.bindings as any, fooParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Foo'},

        {type: 'leave', name: 'ProfileSettings'},
        {type: 'leave', name: 'Profile'},
    ]);


    clearCalls();
    params = await router.changeUrl('/f-foo/BAR');
    t.deepEqual(params.bindings as any, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'Bar'},
    ]);


    clearCalls();
    params = await router.changeUrl('/f-foo/');
    t.deepEqual(params.bindings as any, fooParams());
    t.deepEqual(calls, [
        {type: 'leave', name: 'Bar'},
    ]);

});

test.serial('not found', async t => {
    const router = new Router(route);
    const params = await router.changeUrl('/not-found');
    t.deepEqual(params.urlParams, {} as {});
    t.deepEqual(params.bindings as any, []);

    params = await router.changeUrl('/f-foo/');

    const params = await router.changeUrl('/not-found');
    t.deepEqual(params.bindings as any, fooParams());
});

test.serial('check no onEnter no onLeave', async t => {
    const router = new Router(route);
    const params = await router.changeUrl('/profile/user/settings/p-1');
    t.deepEqual(params.bindings as any, profileSettingsPageParams());
    await router.changeUrl('/');
});

test.serial('break transition', async t => {
    const router = new Router(route);
    router.changeUrl('/profile/user/settings/p-1');
    const params = await router.changeUrl('/f-foo/BAR/');
    t.deepEqual(params.bindings as any, fooBarParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},
    ]);
});


test.serial('redirect in onEnter', async t => {
    const router = new Router(route);
    const params = await router.changeUrl('/f-foo/BAR/baz');
    t.deepEqual(params.bindings as any, fooParams());
    t.deepEqual(calls, [
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
        {type: 'enter', name: 'Bar'},
        {type: 'enter', name: 'Baz'},
        {type: 'enter', name: 'A'},
        {type: 'enter', name: 'Foo'},
    ]);
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
