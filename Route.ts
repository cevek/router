import FastPromise from 'fast-promise';
import {Router} from './Router';

export interface Props<P = any, S = any> {
    urlParams?: P;
    search?: S;
}

export interface ComponentClass<P = any, S = any> {
    new (props: Props<P, S>): Component<Props<P, S>>;
    onEnter?: (params: RouteProps, router: Router) => FastPromise<any>;
    onLeave?: (nextUrl: string, router: Router) => FastPromise<any>;
}

export interface Component<P = any> {
    props: P;
}

export interface RouteProps<P = any, S = any> {
    params: P;
    paramValues: string[];
    search: S,
    url: string;
    key?: string | number;
}

export class Route<P = any, S = any> {
    router: Router;
    children: Route<P, S>[] = [];
    regexp: RegExp;
    names: string[] = [];
    regexpNames: RegExp[] = [];

    selfUrl: string;
    url: string;
    component: ComponentClass<P, S>;
    onEnter?: (params: RouteProps<P, S>, router: Router) => FastPromise<any>;
    onLeave?: (nextUrl: string, router: Router) => FastPromise<any>;

    parent: Route;

    constructor(route: string, ComponentClass: ComponentClass<P, S>) {
        this.selfUrl = route;
        this.component = ComponentClass;
        this.onEnter = ComponentClass.onEnter;
        this.onLeave = ComponentClass.onLeave;
    }

    goto(params: P, search?: S, replace = false) {
        return this.router.changeUrl(this.toUrl(params, search), false, replace);
    }

    toUrl(params: P, search?: S) {
        let url = this.url;
        for (let i = 0; i < this.names.length; i++) {
            const name = this.names[i];
            const regexp = this.regexpNames[i];
            const value = (params as any)[name];
            if (value == null) {
                throw new Error(`Url parameter "${name}" is null`);
            }
            url = url.replace(regexp, encodeURIComponent(value) + '$1');
        }
        return makeUrl(url, search);
    }

    addChild<PP extends P, SS extends S>(path: string, component: ComponentClass<PP, SS>) {
        const route = new Route<PP, SS>(path, component);
        route.parent = this;
        this.children.push(route);
        return route;
    }

    addIndex(component: ComponentClass<P, S>) {
        return this.addChild('#', component);
    }

    addAny(component: ComponentClass<P, S>) {
        return this.addChild('*', component);
    }

    init() {
        this.makeRegexp();
    }

    makeRegexp() {
        this.names = [];
        let url = '/' + this.selfUrl.replace(/(^\/+|\/+$)/g, '');
        url = url === '/' ? url : url + '/';
        if (this.parent) {
            url = this.parent.url + url.substr(1);
        }
        const reg = /:([^\/]+)/g;
        while (true) {
            const v = reg.exec(url);
            if (!v) {
                break;
            }
            this.names.push(v[1]);
            this.regexpNames.push(new RegExp(':' + v[1] + '(/|$)'));
        }
        this.url = url;
        this.regexp = new RegExp('^' + url.replace(/(:([^\/]+))/g, '([^\/]+)').replace(/\*\//g, '.+').replace(/#\//g, '') + '?');
    }

    enter(enterData: RouteProps<P, S>) {
        if (this.onEnter) {
            return this.onEnter(enterData, this.router).then(() => enterData);
        }
        return FastPromise.resolve(enterData);
    }

    leave(nextUrl: string) {
        if (this.onLeave) {
            return this.onLeave(nextUrl, this.router);
        }
        return FastPromise.resolve();
    }

    getValues(url: string) {
        // todo: check query values
        return (this.regexp.exec(url) || []).slice(1);
    }

    getParams(m: string[]) {
        if (m) {
            const params = {} as P;
            for (let j = 0; j < this.names.length; j++) {
                (params as any)[this.names[j]] = m[j];
            }
            return params;
        }
        return {} as P;
    }

    getParents() {
        let route = this as Route;
        const parents: Route[] = [];
        while (route) {
            parents.unshift(route);
            route = route.parent;
        }
        return parents;
    }

    check(url: string) {
        //todo: check query values
        return this.regexp.test(url);
    }

    static redirect<P, S>(callback: (props: RouteProps<P, S>) => FastPromise<string>) {
        return {
            onEnter(props: RouteProps<P, S>, router: Router) {
                return callback(props).then(url => {
                    router.changeUrl(url, false, true);
                    return {};
                });
            }
        } as ComponentClass<P, S>;
    }
}

function makeUrl(path: string, searchParams?: {}) {
    const search = searchParams ? Object.keys(searchParams).filter(k => k && (searchParams as any)[k]).map(k => `${k}=${(searchParams as any)[k]}`).join('&') : '';
    return path + (search ? '?' + search : '');
}
