import * as React from 'react';
import { Path } from './Path';
import { Params } from './RouterState';
import { createViewComponent } from './ViewComponent';
import { Route, RouteType, Diff, Any, GetRouteParam } from './Helpers';
import { Router, PublicRouter, RedirectOptions } from './Router';
import { RouteParams } from '../dist/Router';

export type Component<Params> =
    | (() => React.ComponentType<Partial<PublicRoute<Params>>>)
    | (() => Promise<React.ComponentType<Partial<PublicRoute<Params>>>>)
    | (() => Promise<{ default: React.ComponentType<Partial<PublicRoute<Params>>> }>);

export interface ResolveParam<Params = {}, Store = {}, LocalStore = {}, ParentPromiseResult = {}> {
    parentResult: ParentPromiseResult;
    url: string;
    store: Store;
    localStore: LocalStore;
    params: Params;
    hash: string;
    router: PublicRouter<Params>;
}

export interface RouteJson<T = {}> {
    params?: T;
    resolve?: (param: any) => Any;
    redirect?: () => RouteToUrl;
    // component?: { [key: string]: Component<Params> };
    url?: string;
    children?: { [key: string]: RouteJson };
}

export interface RootConfig<Store, LocalStore> {
    store?: Store;
    localStore?: LocalStore;
}

export function createRoute<Json, Store, LocalStore>(t: Json, config?: RootConfig<Store, LocalStore>) {
    const innerRoute = new InnerRoute({
        routeJson: t,
        key: 'root',
        parent: undefined!,
        parentParams: {},
    });
    return (innerRoute.publicRoute as {}) as Route<Json, { hash?: string }, {}, Store, LocalStore>;
}

export interface RouteToUrl {
    route: PublicRoute<Any>;
    params: Any;
    options: RedirectOptions;
    // keys: string[];
    // values: string[];
}
export class PublicRoute<Params = {}, ParentResolve = {}, Store = {}, LocalStore = {}> {
    // prettier-ignore
    resolver!: ParentResolve;
    // prettier-ignore
    private store!: Store;
    // prettier-ignore
    private localStore!: LocalStore;
    constructor(public _route: InnerRoute) {
        // this.component = { View: createViewComponent(_route) };
    }
    toUrl<CurrentRoute extends PublicRoute>(
        params: Diff<GetRouteParam<CurrentRoute>, Params>,
        options?: RedirectOptions
    ): RouteToUrl;
    toUrl<CurrentRoute extends never>(params: Params, options?: RedirectOptions): RouteToUrl;
    toUrl(params: {}, options = {}): RouteToUrl {
        return { route: this, params, options };
    }

    // bindImportComponent(cmp: any): any {}

    // component: {
    //     View: React.ComponentClass<
    //         { component: React.ComponentType<Router<Params>> } | { children: React.ComponentType<Router<Params>> }
    //     >;
    // };
}

export class InnerRoute {
    static id = 1;
    id = InnerRoute.id++;
    parent?: InnerRoute;
    path: Path;
    children: InnerRoute[] = [];
    isIndex: boolean;
    isAny: boolean;
    publicRoute: PublicRoute;
    resolvedComponents: { [key: string]: React.ComponentClass<PublicRouter> } = {};
    resolve: (params: ResolveParam) => Any;
    constructor({
        routeJson,
        key,
        parent,
        parentParams,
    }: {
        routeJson: RouteJson;
        key: string;
        parent: InnerRoute | undefined;
        parentParams: { [key: string]: string | number };
    }) {
        this.parent = parent;
        this.isIndex = key === 'index';
        this.isAny = key === 'any';
        this.publicRoute = new PublicRoute(this);
        const params = { ...parentParams, ...routeJson.params };
        const parentPath = this.parent === void 0 ? '' : this.parent.path.pattern + '/';
        this.path = new Path(parentPath + routeJson.url, params, !this.isAny);

        this.resolve = routeJson.resolve ? routeJson.resolve : () => true;
        if (routeJson.children !== void 0) {
            const keys = Object.keys(routeJson.children);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const subRoute = new InnerRoute({
                    routeJson: routeJson.children[key],
                    key,
                    parent: this,
                    parentParams: params,
                });
                this.children.push(subRoute);
                (this.publicRoute as Any)[key] = subRoute.publicRoute;
            }
        }
    }

    resolveComponents() {
        // const promises: Promise<{}>[] = [];
        // if (this.routeJson.component !== void 0) {
        //     const componentKeys = Object.keys(this.routeJson.component);
        //     for (let i = 0; i < componentKeys.length; i++) {
        //         const key = componentKeys[i];
        //         const result = Promise.resolve(this.routeJson.component[key]() as {});
        //         promises.push(result);
        //     }
        //     return Promise.all(promises).then(res => {
        //         for (let i = 0; i < res.length; i++) {
        //             const item = res[i] as any;
        //             this.resolvedComponents[componentKeys[i]] =
        //                 typeof item === 'function'
        //                     ? item
        //                     : typeof item === 'object' && item !== null && typeof item.default === 'function'
        //                       ? item.default
        //                       : void 0;
        //         }
        //     });
        // }
        return Promise.resolve();
    }

    getParents() {
        let r: InnerRoute | undefined = this;
        const result = [];
        while (r !== void 0) {
            result.unshift(r);
            r = r.parent;
        }
        return result;
    }

    hasParent(route: InnerRoute) {
        let r: InnerRoute | undefined = this;
        while (r !== void 0) {
            if (r === route) {
                return true;
            }
            r = r.parent;
        }
        return false;
    }
}

var s = 1;
