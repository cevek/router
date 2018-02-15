import * as React from 'react';
import { Omit } from './Omit';

interface Options {
    exact?: boolean;
    status?: number;
    hash?: string;
}
type RouteOptions<Params, Store> = {
    exact?: boolean;
    resolve?: ResolveFn<Params, Store>;
};

class SimpleRouteEditable<Params, Store> {
    // private params: Params;
    constructor(private options: RouteOptions<Params, Store>) {}
    resolveComponent<C extends { [name: string]: Cmp<Params, Store> }>(
        component: C
    ): Route<Params, Store> & Record<keyof C, React.ComponentClass<{}>> {
        return;
    }
    resolve(fn: ResolveFn<Params, Store>) {
        return this;
    }
    redirectTo<SubParams>(to: Route<SubParams, Store>, params: Diff<Params, SubParams & {}>, options?: Options) {
        return this;
    }
}

class RouteEditable<Params, Store> extends SimpleRouteEditable<Params, Store> {
    constructor(private url: string, options?: RouteOptions<Params, Store>) {
        super(options);
    }
    sub<SubParams = undefined>(
        url: string,
        options?: RouteOptions<Params & SubParams, Store>,
        ...resolvers: ResolveFn<Params & SubParams, Store>[]
    ) {
        return new Route<Params & SubParams, Store>(url, options);
    }
    index<SubParams = undefined>(
        options?: RouteOptions<Params & SubParams, Store>,
        ...resolvers: ResolveFn<Params & SubParams, Store>[]
    ) {
        return new SimpleRoute<Params & Partial<SubParams>, Store>({});
    }
    notFound<SubParams = undefined>(
        options?: RouteOptions<Params & SubParams, Store>,
        ...resolvers: ResolveFn<Params & SubParams, Store>[]
    ) {
        return new SimpleRoute<Params & Partial<SubParams>, Store>({});
    }

    redirectFrom<SubParams>(
        from: string,
        to: RouteEditable<SubParams, Store>,
        params: Diff<Params, SubParams & {}>,
        options?: Options
    ) {
        return this;
    }
}

class SimpleRoute<Params, Store> extends SimpleRouteEditable<Params, Store> {
    Render: RouteComponent<Params, Store>;
}

class Route<Params, Store> extends RouteEditable<Params, Store> {
    Render: RouteComponent<Params, Store>;
    props: Transition<Params, Store>;
    toUrl(params: Params, options?: Options) {
        return '';
    }
    toUrlFromRelative<SubParams>(
        route: Route<SubParams, Store>,
        params: Diff<SubParams, Params & {}>,
        options?: Options
    ) {
        return '';
    }
}

type Cmp<Params, Store> =
    | React.ComponentClass<Partial<Transition<Params, Store>>>
    | (() => Promise<React.ComponentClass<Partial<Transition<Params, Store>>>>)
    | (() => Promise<{ default: React.ComponentClass<Partial<Transition<Params, Store>>> }>);

type RouteComponent<Params, Store> = React.ComponentClass<{
    component: Cmp<Params, Store>;
}>;

interface ResolveFn<P, Store> {
    // (data: any): Promise<{} | void>;
    // (data: ResolveParam<P, Q, Store>): Promise<{} | void>;
    (data: Transition<P, Store>): void | {}; //Promise<{} | void>;
}

type Diff<A, B> = { [P in Extract<keyof A, keyof B>]?: string } & { [P in Exclude<keyof B, keyof A>]: string };
interface Transition<Params = {}, Store = {}> {
    url: string;
    isExact: boolean;
    urlSubPart: string;
    params: Params;
    redirect<SubParams extends undefined>(route: Route<SubParams, Store>, options?: Options): void;
    redirect<SubParams>(route: Route<SubParams, Store>, params: Diff<Params, SubParams & {}>, options?: Options): void;
    redirectPush<SubParams>(
        route: Route<SubParams, Store>,
        params: Diff<Params, SubParams & {}>,
        options?: Options
    ): void;
    store: Store;
    done: Promise<{} | void>;
    parent: Promise<{} | void>;
}

function root<Store = {}, Params = undefined>() {
    return new Route<Params, Store>('', {});
}

async function checkAuth(p: Transition) {
    if (p.isExact) {
        p.redirect(Player, { lang: '', sport: '', player: '' });
    }
}

function x(a: any): any {}
// var actions = {
//     async checkAuth(p: ResolveParam) {
//         if ()
//     },
// };

var langs: { [key: string]: boolean } = { ru: true };

var Index = root<Store>();
{
    var Lang = Index.sub<{ lang }>(':lang')
        .resolve(p => !!langs[p.params.lang])
        .resolve(p => loadI18n(p.params.lang));
    {
        var Sport = Lang.sub<{ sport }>(':sport');
        {
            var SportNotFound = Sport.notFound();
            var SportIndex = Sport.index();
            var Player = Sport.sub<{ player }>(':player')
                .resolve(p => p.store.checkAuth(p))
                .resolveComponent({
                    My: () => import('./TestComponent'),
                });
            var Team = Sport.sub<{ team }>(':team').resolve(p => p.store.checkAuth(p));
            var TeamP = Sport.sub<{ team }>(':team')
                .resolve(p => p.store.checkAuth(p))
                .resolve(p => p.store.checkNonAuth(p))
                // .resolve(p => p.store.checkAuth(p))
                .resolveComponent({
                    Name: () => import('./TestComponent'),
                });
        }
        var Page = Lang.sub<{ page }>(':page');
        var Profile = Lang.sub<{ foo }>('/profile/');
        {
            var xy = Profile.sub('/boom')
                .resolve(p => p.store.checkNonAuth(p))
                .resolve(p => p.store.checkAuth(p));
        }
        var Login = Lang.sub('/login/', {});
        var Register = Lang.sub('/register/');
        var Restore = Lang.sub('/restore/');
    }
    var NotFound = Index.notFound();
}

var xfd = {
    url: ':lang',
    params: {lang: ''},
    children: {
        sport: {
            url: ':sport',
            params: {sport: ''},
        }        
    }
}

interface DG<T = {}> {
    url: string;
    params?: T;
    children?: {[kj: string]: DG}
}
interface DFH<T, C> {
    params: T;
    children: C;
}

interface RR<T> {
    ppp: T;
}

type DGType<T> = T extends DG<infer R> ? R : {};

type Deep<T extends DG> = {[P in keyof T]?: Deep<T["children"][P]> & RR<DGType<T> & DGType<T["children"][P]>>}

// type FFH<PP> = {[X in keyof PP]: DFH<RType<FFH<PP[X]>>>};

function adfs<PP extends DG>(obj: PP): Deep<PP> {
    return null!;
}

// adfs(xfd).children.sport.ppp;
// var Index = root<Store>();
// {
//     var Lang = Index.sub<{ lang }>(':lang')
//         .resolve(p => !!langs[p.params.lang])
//         .resolve(p => loadI18n(p.params.lang));
//     {
//         var Sport = Lang.sub<{ sport }>(':sport');
//         {
//             var SportNotFound = Sport.notFound();
//             var SportIndex = Sport.index();
//             var Player = Sport.sub<{ player }>(':player')
//                 .resolve(p => p.store.checkAuth(p))
//                 .resolveComponent({
//                     My: () => import('./TestComponent'),
//                 });
//             var Team = Sport.sub<{ team }>(':team').resolve(p => p.store.checkAuth(p));
//             var TeamP = Sport.sub<{ team }>(':team')
//                 .resolve(p => p.store.checkAuth(p))
//                 .resolve(p => p.store.checkNonAuth(p))
//                 // .resolve(p => p.store.checkAuth(p))
//                 .resolveComponent({
//                     Name: () => import('./TestComponent'),
//                 });
//         }
//         var Page = Lang.sub<{ page }>(':page');
//         var Profile = Lang.sub<{ foo }>('/profile/');
//         {
//             var xy = Profile.sub('/boom')
//                 .resolve(p => p.store.checkNonAuth(p))
//                 .resolve(p => p.store.checkAuth(p));
//         }
//         var Login = Lang.sub('/login/', {});
//         var Register = Lang.sub('/register/');
//         var Restore = Lang.sub('/restore/');
//     }
//     var NotFound = Index.notFound();
// }

type RType<T> = T extends R<infer R> ? R : any;


class R<P> {
    sub<PP extends { [k: string]: R<{}> }>(obj: PP): this & {[X in keyof PP]: R<RType<PP[X]> & P>} {
        return null!;
    }
    resolve(fn: any) {
        return this;
    }
}

function r<T>() {
    return new R<T>();
}


function xddf(x: typeof ddf.lang.sport.index) {}


var ddf = r().sub({
    lang: r<{A}>().sub({
        sport: r().sub({
            index: r().sub({}).resolve(xddf),
        }),
    }),
});
ddf.lang.sport.index;

Index.redirectTo(Lang, { lang: '' }, { exact: true });
Lang.redirectTo(Sport, { sport: '' }, { exact: true });
// extends { [key: string]: SimpleRoute<{}, {}> }
type Rec<V> = Record<Exclude<keyof V, 'X'>, {}>;

function strip<T>(key: T): { [P in keyof T]: Omit<T[P], keyof RouteEditable<{}, {}>> } {
    return key;
}
var routesOriginal = { Index, Lang, Sport, Player, Team, TeamP, Page, SportNotFound, SportIndex, Profile, xy };
var routes = strip(routesOriginal);

var xg = {
    check(p: typeof routes.Lang.props) {
        // p.foo;
    },
};

class Store {
    foo: number;
    async loadLang(lang: string) {
        return {};
    }
    auth: boolean;

    checkAuth(p: typeof Lang.props) {
        if (!this.auth) {
            p.redirect(Login, { lang: '' });
        }
    }
    checkNonAuth(p: typeof Lang.props) {
        if (this.auth) {
            p.redirect(Index);
        }
    }
}

class SportView extends React.Component<typeof Sport.props> {
    doo() {
        // rPlayer.toRelativeUrl(this.props.route, { player: '' });
        var { redirect, params } = this.props;
        redirect(Player, { player: 'sdf' });
    }
}

// function xx<T>(t: T extends { a: infer U, b: infer U } ? U : never): P {return}
// xx<{}>({ component: 1 }).component;

class Link extends React.Component<{ to: string }> {}
// routes4.lang.sport.toUrl({ sport: '' });
var ddf = <Sport.Render component={SportView} />;
var ddf1 = <SportNotFound.Render component={SportView} />;
var ddf2 = <SportIndex.Render component={SportView} />;
// var ddf2 = <routes.Player.View component={() => import('./TestComponent')} />;
var ddf2 = <Player.My />;
var ddf2 = <TeamP.Name />;
var dsd = <Link to={Team.toUrlFromRelative(Sport, { team: '' })} />;

// type A = { a: number } & { a?: number };
// type B = { a: number; b: string };
// type X = Pick<A, keyof A>;

// type Omit<T, K> = Record<T, Exclude<keyof T, K>>
type A = { a: number };
type B = { a: number; b: number; c: number };
type X = Partial<Exclude<A, B>> & Record<Exclude<keyof B, keyof A>, string>;
type G = Record<Extract<keyof A, keyof B>, string | undefined>;
type GG = { [P in Extract<keyof A, keyof B>]?: string } & { [P in Exclude<keyof B, keyof A>]: string };
type GA = { [P in Exclude<keyof B, keyof A>]: string };

class DX {}

class MyView {}

class CounterStore {
    foo: 1;
    z: 1;
}

interface Props {
    foo: 1;
}
type State = Narrow<{ foo: number }, CounterStore>;

type Keyof<T> = keyof T;

type Narrow<T, Store extends T> = T;

function d<P, S>(f: (p: P, s: S) => any) {}

var Counter = (props: Props, state: State, state2: State) => <div>{state.foo}</div>;

var dfd = <Counter foo={1} />;

export function Counter2(props: Props, state: State) {
    return (
        <div>
            {state.foo}
            <I18n>Foo {state.foo}</I18n>
            <I18n count={1} one={'One player'}>
                Foo {state.foo}
            </I18n>
        </div>
    );
}

// class I18nStore {
//     data = {
//         Foo: 'Foo',
//         Bar: 'Bar',
//         Names: {
//             MyValues: {
//                 one: 'Hello $1!',
//                 two: 'Hello guys!',
//             },
//             Title: (name: string) => `Title ${name}`,
//             Player: (name: string) => plural({ one: `Title ${name}` }),
//             name: plural({ one: '' }),
//         },
//     };
// }
export function I18n(props: { children: React.ReactNode; count?: number; one?: string; two?: string }) {
    return <>{props.children}</>;
}

function loadI18n(lang: string) {}
