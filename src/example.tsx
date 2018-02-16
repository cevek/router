import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Path } from './Path';
import { PublicRoute, RouteJson, createRoute } from './Route';
import { Link } from './Link';
import { RouteProps } from './Helpers';
import { RouterProvider } from './RouterProvider';
import { BrowserHistory } from './History';
import { Router } from './Router';

const route = createRoute({
    url: '/',
    lang: {
        url: ':lang',
        resolve: resolveLang,
        params: { lang: '' },
        component: { Foo: () => import('./TestComponent') },
        sport: {
            url: 'sport/:sport',
            resolve: resolveSport,
            redirectToIfExact: () => route.lang.sport.player.toUrlUsing(route.lang.sport, { player: '' }),
            params: { sport: '' },
            player: {
                url: ':player',
                params: { player: '' },
                teams: {
                    params: { team: '' },
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
        any: {},
    },
    any: {},
});

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

async function resolveLang(p: RouteProps<typeof route.lang>) {
    p.onCommit(() => {
        
    });
    await wait(1000);
    // return false;
    // p.params.lang;
    // p.redirect(route.lang.sport.player, { sport: 'fooball', player: 'zaharov' });
}

async function resolveSport(p: RouteProps<typeof route.lang.sport>) {
    await wait(1000);
    // p.params.lang;
    // p.redirect(route.lang.sport.player, { sport: 'fooball', player: 'zaharov' });
    // return false;
}

function resolveAuth(p: RouteProps<typeof route.lang.login>) {
    // p.params.lang;
    // p.redirect(route.lang.sport.player, { sport: 'fooball', player: 'zaharov' });
    // return false;
}

var history = new BrowserHistory();
var router = new Router(route, history);
var root = document.body.appendChild(document.createElement('div'));
var loading = document.body.appendChild(document.createElement('div'));
loading.innerHTML = 'Loading...';
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
                <route.any.component.View component={() => <div>Not Found</div>} />
                <route.lang.any.component.View component={() => <div>Lang not found</div>} />
            </RouterProvider>,
            root
        );
    })
    .catch(err => {
        loading.innerHTML = 'Error: ' + err;
    });
