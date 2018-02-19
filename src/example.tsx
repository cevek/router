import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link } from './Link';
import { RouteProps, ResolveProps } from './Helpers';
import { RouterProvider } from './RouterProvider';
import { BrowserHistory } from './History';
import { Router, PublicRouter } from './Router';
import { createRoute, PublicRoute, RouteToUrl } from './Route';
import { View } from './ViewComponent';

class Store {
    foo = 1;
}
class LocalStore {
    bar = 1;
}

const route = createRoute(
    {
        url: '/',
        children: {
            lang: {
                url: ':lang',
                resolve: resolveLang,
                params: { lang: 1, sort: '' },
                children: {
                    sport: {
                        url: 'sport/:sport',
                        resolve: resolveSport,
                        redirect: ():RouteToUrl => route.lang.sport.player.toUrl<typeof route.lang.sport>({ player: '' }),
                        params: { sport: 1 },
                        children: {
                            player: {
                                url: ':player',
                                params: { player: 1 },
                                children: {
                                    teams: {
                                        params: { team: 1 },
                                        url: ':team',
                                    },
                                },
                            },
                        },
                    },
                    profile: {
                        url: 'profile',
                    },
                    login: {
                        url: 'login',
                        resolve: resolveAuth,
                    },
                },
                // any: {},
            },
            any: {},
        },
    },
    {
        store: {} as Store,
        localStore: {} as LocalStore,
    }
);

route
route.lang.toUrl({lang: ''})
// route.lang.sport.player.teams;

// interface R {
//     url: string;
//     children?: { [key: string]: R };
// }
// interface RChildren {
//     // children: { [key: string]: R };
// }
// var x = {
//     url: '',
//     children: {
//         lang: {
//             url: '',
//             children: {
//                 sport: {
//                     url: '',
//                 },
//             },
//         },
//     },
// };

// type X<T> = { [P in keyof T]: RR<T[P]> } & {toUrl():void};
// type RR<T> = T extends {children: infer C} ? X<C> : {toUrl():void};

// var y!: RR<typeof x>;

// abc(x).lang.sport.toUrl()

// function abc<T extends R>(json: T): RR<T> {
//     return null!;
// }

console.log(route);

console.log(
    route.lang.sport.player.teams.toUrl({ lang: 'ru', team: 'spartak', player: 'zarechney', sport: 'football' })
);

// var Foo = route.lang.sport.player.bindImportComponent(() => import('./TestComponent'));

class SportView extends React.Component<RouteProps<typeof route.lang.sport>> {
    doo() {
        // rPlayer.toRelativeUrl(this.props.route, { player: '' });
        const { redirect, params } = this.props;
        redirect(route.lang.sport.player, { player: 'zaharov' });
    }
    render() {
        return <div>Sport! {this.props.params.sport}</div>;
    }
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function resolveLang(p: ResolveProps<typeof route.lang>) {
    await wait(1000);
    return { foo: 1, baR: 2 };
    // return false;
    // p.params.lang;
    // p.redirect(route.lang.sport.player, { sport: 'fooball', player: 'zaharov' });
}


route.lang.sport.resolver
async function resolveSport(p: ResolveProps<typeof route.lang.sport>) {
    await wait(1000);
    p.store.foo;
    p.localStore.bar;
    var parentResult = await p.parentResult;
    parentResult.baR;
    console.log(parentResult);

    // route.lang.sport.ddd
    // p.params.lang;
    // p.redirect(route.lang.sport.player, { sport: 'fooball', player: 'zaharov' });
    // return false;
}

function resolveAuth(p: ResolveProps<typeof route.lang.login>) {
    // p.router.redirect(route.lang, {});
    // p.params.lang;
    // p.redirect(route.lang.sport.player, { sport: 'fooball', player: 'zaharov' });
    // return false;
}

var history = new BrowserHistory();
var router = new Router(route, history);
var root = document.body.appendChild(document.createElement('div'));
var loading = document.body.appendChild(document.createElement('div'));
loading.innerHTML = 'Loading...';
router.beforeUpdate.listen(() => {
    document.body.classList.add('loading');
});
router.afterUpdate.listen(() => {
    document.body.classList.remove('loading');
});
SportView;

var x = { sport: '' };

router
    .init()
    .then(() => {
        loading.innerHTML = '';
        ReactDOM.render(
            <RouterProvider router={router}>
                <View route={route.lang.sport} children={SportView} />
                <View route={route.lang} children={Sport} />
                {/* <Link to={route.lang.sport.player.teams.toUrlUsing(route.lang.sport.player, { team: 'spartak' })}>
                Spartak
            </Link> */}
                <div>
                    <Link to={route.lang.toUrl({ lang: 'en' })}>English</Link>
                </div>
                <div>
                    <Link exact to={route.lang.toUrl({ lang: 'ru', hash: 'foo' })}>
                        Ru exact
                    </Link>
                </div>
                <div>
                    <Link to={route.lang.toUrl({ lang: 'ru', sort: 'bar' })}>Ru</Link>
                </div>
                <div>
                    <Link exact to={route.lang.sport.toUrl({ lang: 'ru', sport: 'football' })}>
                        Russian
                    </Link>
                </div>
                <View route={route.lang.login} children={Sport} />
                <View route={route.any} children={() => <div>Not Found</div>} />
                {/* <route.lang.any.component.View component={() => <div>Any sport</div>} /> */}
            </RouterProvider>,
            root
        );
    })
    .catch(err => {
        loading.innerHTML = 'Error: ' + err;
    });

class Sport extends React.Component<RouteProps<typeof route.lang>> {
    foo() {
        this.props.params;
    }
}
