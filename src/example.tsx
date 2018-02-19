import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link } from './Link';
import { RouteProps, ResolveProps } from './Helpers';
import { RouterProvider } from './RouterProvider';
import { BrowserHistory } from './History';
import { Router } from './Router';
import { createRoute } from './Route';

class Store {
    foo = 1;
}
class LocalStore {
    bar = 1;
}

const route = createRoute(
    {
        url: '/',
        lang: {
            url: ':lang',
            resolve: resolveLang,
            params: { lang: 1, langFoo: '' },
            component: { Foo: () => import('./TestComponent') },
            sport: {
                url: 'sport/:sport',
                resolve: resolveSport,
                redirectToIfExact: () => route.lang.sport.player.toUrlUsing(route.lang.sport, { player: '' }),
                params: { sport: 1 },
                player: {
                    url: ':player',
                    params: { player: 1 },
                    teams: {
                        params: { team: 1 },
                        url: ':team',
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
            // any: {},
        },
        any: {},
    },
    {
        store: {} as Store,
        localStore: {} as LocalStore,
    }
);

console.log(route);

console.log(
    route.lang.sport.player.teams.toUrl({ lang: 'ru', team: 'spartak', player: 'zarechney', sport: 'football' })
);

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
router
    .init()
    .then(() => {
        loading.innerHTML = '';
        ReactDOM.render(
            <RouterProvider router={router}>
                <route.lang.component.Foo />
                <route.lang.sport.component.View component={SportView} />
                {/* <Link to={route.lang.sport.player.teams.toUrlUsing(route.lang.sport.player, { team: 'spartak' })}>
                Spartak
            </Link> */}
                <div>
                    <Link to={route.lang.toUrl({ lang: 'en' })}>English</Link>
                </div>
                <div>
                    <Link exact to={route.lang.toUrl({ lang: 'ru' }, { hash: 'foo' })}>
                        Ru exact
                    </Link>
                </div>
                <div>
                    <Link to={route.lang.toUrl({ lang: 'ru', langFoo: 'bar' })}>Ru</Link>
                </div>
                <div>
                    <Link exact to={route.lang.sport.toUrl({ lang: 'ru', sport: 'football' })}>
                        Russian
                    </Link>
                </div>
                <route.any.component.View component={() => <div>Not Found</div>} />
                {/* <route.lang.any.component.View component={() => <div>Any sport</div>} /> */}
            </RouterProvider>,
            root
        );
    })
    .catch(err => {
        loading.innerHTML = 'Error: ' + err;
    });
