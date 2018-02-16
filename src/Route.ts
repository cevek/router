import * as React from 'react';
import { Path } from './Path';
import { Params } from './RouterState';
import { createViewComponent } from './ViewComponent';
import { ConvertToRoute, RouteType, Diff, Force, Any } from './Helpers';
import { Router, PublicRouter } from './Router';

export type Component<Params> =
    | (() => React.ComponentType<Partial<PublicRoute<Params>>>)
    | (() => Promise<React.ComponentType<Partial<PublicRoute<Params>>>>)
    | (() => Promise<{ default: React.ComponentType<Partial<PublicRoute<Params>>> }>);

export interface BaseRouteJson<T = {}> {
    params?: T;
    resolve?: (router: Router) => void;
    redirectTo?(): string;
    component?: { [key: string]: Component<T> };
}
export interface RouteJson<T = {}> extends BaseRouteJson<T> {
    url: string;
    redirectToIfExact?(): string;
    index?: BaseRouteJson;
    any?: BaseRouteJson;
    component?: { [key: string]: Component<T> };
}
export const routeProps: (keyof RouteJson)[] = [
    'url',
    'params',
    'resolve',
    'redirectTo',
    'redirectToIfExact',
    'index',
    'any',
    'component',
];
export function createRoute<T extends RouteJson>(t: T) {
    const innerRoute = new InnerRoute(t, undefined!, false, false);
    return (innerRoute.publicRoute as {}) as ConvertToRoute<T, RouteType<T>, typeof routeProps>;
}

export class PublicRoute<T = {}> {
    // private $type: PublicRouter<T> = undefined!;
    constructor(public _route: InnerRoute) {
        this.component = { View: createViewComponent(_route) };
    }
    toUrl(params: T) {
        return this._route.path.toUrl(params as {});
    }
    toUrlUsing<FromParams>(route: PublicRoute<FromParams>, params: Diff<FromParams & {}, T>, options?: {}) {
        return (fromParams: FromParams) => this._route.path.toUrl({ ...(fromParams as {}), ...(params as {}) });
    }

    component: {
        View: React.ComponentClass<
            { component: React.ComponentType<Router<T>> } | { children: React.ComponentType<Router<T>> }
        >;
    };
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
    resolve: (router: Router) => void | boolean;
    constructor(public routeJson: RouteJson, parent: InnerRoute | undefined, isIndex: boolean, isAny: boolean) {
        this.parent = parent;
        this.isIndex = isIndex;
        this.isAny = isAny;
        this.publicRoute = new PublicRoute(this);
        const parentPath = this.parent === void 0 ? '' : this.parent.path.pattern + '/';
        this.path = new Path(parentPath + routeJson.url, routeJson.params, !isAny);
        if (routeJson.index !== void 0) {
            (routeJson.index as RouteJson).url = '/';
            const route = new InnerRoute(routeJson.index as RouteJson, this, true, false);
            this.children.push(route);
            (this.publicRoute as Any).index = route.publicRoute;
        }

        if (routeJson.any !== void 0) {
            (routeJson.any as RouteJson).url = '/';
            const route = new InnerRoute(routeJson.any as RouteJson, this, false, true);
            this.children.push(route);
            (this.publicRoute as Any).any = route.publicRoute;
        }

        this.resolve = routeJson.resolve ? routeJson.resolve : () => true;
        const keys = Object.keys(routeJson);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i] as keyof RouteJson;
            if (routeProps.indexOf(key) > -1) continue;
            const subRoute = new InnerRoute(routeJson[key] as RouteJson, this, false, false);
            this.children.push(subRoute);
            (this.publicRoute as Any)[key] = subRoute.publicRoute;
        }
        if (routeJson.component !== void 0) {
            const componentKeys = Object.keys(routeJson.component);
            for (let i = 0; i < componentKeys.length; i++) {
                const key = componentKeys[i];
                (this.publicRoute.component as Any)[key] = createViewComponent(
                    this,
                    () => this.resolvedComponents[key]
                );
            }
        }
    }

    resolveComponents() {
        const promises: Promise<{}>[] = [];
        if (this.routeJson.component !== void 0) {
            const componentKeys = Object.keys(this.routeJson.component);
            for (let i = 0; i < componentKeys.length; i++) {
                const key = componentKeys[i];
                const result = Promise.resolve(this.routeJson.component[key]() as {});
                promises.push(result);
            }
            return Promise.all(promises).then(res => {
                for (let i = 0; i < res.length; i++) {
                    const item = res[i] as any;
                    this.resolvedComponents[componentKeys[i]] =
                        typeof item === 'function'
                            ? item
                            : typeof item === 'object' && item !== null && typeof item.default === 'function'
                              ? item.default
                              : void 0;
                }
            });
        }
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