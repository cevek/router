# React Static Router

Simple flexible static router for React.

Features:
- Fully Typed
- Transitions only after loading all data required by the component.
- Redux support
- Ready for code splitting

Example: 

```ts
// routes.ts
export const route = createRoute(
    {
        path: '/',
        resolve: resolveRoot,
        lang: {
            path: ':lang',
            resolve: resolveLang,
            params: { lang: 1 },
            component: { Lang: () => import('./components/Lang') },
            redirectIfExact: () => route.lang.sport.toUrlUsing(route.lang, { sport: 'basketball' }),
            sport: {
                path: 'sport/:sport',
                resolve: resolveSport,
                params: { sport: 1 },
                index: {},
                match: {
                    path: 'match/:id',
                    resolve: resolveMatch,
                    params: { id: 1 },
                },
                team: {
                    path: 'team/:team',
                    resolve: resolveTeam,
                    params: { team: 1 },
                    player: {
                       path: 'player/:player',
                       resolve: resolvePlayer,
                       params: { player: 1 }
                    }
                }
            },
            profile: {
                path: 'profile',
                resolve: checkAuth
            },
            logout: {
                path: 'logout',
                resolve: checkAuth
            },
            login: {
                path: 'login',
                resolve: checkNonAuth
            },
            register: {
                path: 'login',
                resolve: checkNonAuth
            },
        },
        any: {},
    }
);

async function baseResolve(p: ResolveProps<typeof route>, url: string) {
   const body = await fetch(url);
   const {status, data} = await body.json();
   if (status === 404) {
      throw p.skip();
   }
   return data;
}


async function resolveRoot(p: ResolveProps<typeof route>) {
   const userData = await baseResolve(p, '/api/userData/');
   p.store.dispatch({ type: 'SET_USER', payload: { data: userData } });
}

async function resolveLang(p: ResolveProps<typeof route.lang>) {
   const { lang } = p.params;
   const langData = await baseResolve(p, '/api/lang/' + lang);
   p.store.dispatch({ type: 'SET_LANG', payload: { lang: lang, data: langData } });
}

async function resolveSport(p: ResolveProps<typeof route.lang.sport>) {
   const { lang, sport } = p.params;
   const sportData = await baseResolve(p, '/api/sport/' + lang + '/' + sport);   
   p.store.dispatch({ type: 'SET_SPORT', payload: { lang, sport, data: sportData } });
}

async function resolveMatch(p: ResolveProps<typeof route.lang.sport.match>) {
   const { lang, id } = p.params;
   const matchData = await baseResolve(p, '/api/match/' + lang + '/' + id);   
   p.store.dispatch({ type: 'SET_MATCH', payload: { lang, id, data: matchData } });
}

async function resolveTeam(p: ResolveProps<typeof route.lang.sport.team>) {
   const { lang, team } = p.params;
   const teamData = await baseResolve(p, '/api/team/' + lang + '/' + id);   
   p.store.dispatch({ type: 'SET_TEAM', payload: { lang, team, data: teamData } });
}

async function resolvePlayer(p: ResolveProps<typeof route.lang.sport.team.player>) {
   const { lang, team, player } = p.params;
   const playerData = await baseResolve(p, '/api/player/' + lang + '/' + team + '/' + player);   
   p.store.dispatch({ type: 'SET_PLAYER', payload: { lang, team, player, data: playerData } });
}

async function checkAuth(p: ResolveProps<typeof route.profile>) {
   if (!p.store.getState().user.auth) {
       return p.redirect(route.login);
   }
}
async function checkNonAuth(p: ResolveProps<typeof route.login>) {
   if (p.store.getState().user.auth) {
       return p.redirect(route.profile);
   }
}



```

```ts
// index.tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link, RouteProps, ResolveProps, RouterProvider, BrowserHistory, Router  } from 'react-static-router';
import { route  } from './routes.ts';

const history = new BrowserHistory();
const router = new Router(route, history);
const root = document.body.appendChild(document.createElement('div'));
const loading = document.body.appendChild(document.createElement('div'));
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
                <div>
                    <Link to={route.lang.toUrl({ lang: 'en' })}>English</Link>
                </div>
                <div>
                    <Link to={route.lang.toUrl({ lang: 'ru' })}>Russian</Link>
                </div>
                <div>
                    <Link exact to={route.lang.sport.toUrl({ lang: 'en', sport: 'basketball' })}>
                        Basketball
                    </Link>
                </div>
                <Sport />
                <route.any.component.View component={() => <div>Not Found</div>} />
            </RouterProvider>,
            root
        );
    })
    .catch(err => {
        loading.innerHTML = '<pre>Error: ' + (err instanceof Error ? err.stack : JSON.stringify(err, null, 2)) + '</pre>';
    });

```

```ts
//components/Sport.tsx
export default route.lang.sport.createComponent('Sport', ({ params }) => (
   <div>{params.sport}</div>
)))
```



