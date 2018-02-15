import * as React from 'react';
import { Path } from './Path';
import { Params } from './Transition';
import { createViewComponent } from './ViewComponent';
import { ConvertToRoute, RouteType, Diff, Force, Any } from './Helpers';
import { PublicRouter } from './PublicRouter';

export type Component<Params> =
    | (() => React.ComponentClass<Partial<PublicRoute<Params>>>)
    | (() => Promise<React.ComponentClass<Partial<PublicRoute<Params>>>>)
    | (() => Promise<{ default: React.ComponentClass<Partial<PublicRoute<Params>>> }>);

export interface RouteJson<T = {}> {
    url: string;
    params?: T;
    isExact?: boolean;
    resolve?: (publicRouter: PublicRouter) => void;
    redirectTo?(): string;
    redirectToIfExact?(): string;
    index?: RouteJson;
    notFound?: RouteJson;
    component?: { [key: string]: Component<T> };
}
export const routeProps: (keyof RouteJson)[] = [
    'url',
    'params',
    'isExact',
    'resolve',
    'redirectTo',
    'redirectToIfExact',
    'index',
    'notFound',
    'component',
];
export function createRoute<T extends RouteJson>(t: T) {
    const innerRoute = new InnerRoute(t, undefined!, false, false);
    return (innerRoute.publicRoute as {}) as ConvertToRoute<T, RouteType<T>, typeof routeProps>;
}

export class PublicRoute<T = {}> {
    // private $type: PublicRouter<T> = undefined!;
    constructor(protected _route: InnerRoute) {
        this.component = { View: createViewComponent(_route) };
    }
    toUrl(params: T) {
        return this._route.path.toUrl(params as {});
    }
    toUrlUsing<FromParams>(route: PublicRoute<FromParams>, params: Diff<FromParams & {}, T>, options?: {}) {
        return (fromParams: FromParams) => this._route.path.toUrl({ ...(fromParams as {}), ...(params as {}) });
    }

    component: {
        View: React.ComponentClass<{ component: React.ComponentClass<PublicRouter<T>> }>;
    };
}

export class PublicRouteOpened extends PublicRoute {
    _route: InnerRoute = undefined!;
}

export class InnerRoute {
    parent?: InnerRoute;
    path: Path;
    children: InnerRoute[] = [];
    isIndex: boolean;
    isNotFound: boolean;
    publicRoute: PublicRoute;
    resolvedComponents: { [key: string]: React.ComponentClass<PublicRouter> } = {};
    resolve: (publicRouter: PublicRouter) => void;
    constructor(public routeJson: RouteJson, parent: InnerRoute | undefined, isIndex: boolean, isNotFound: boolean) {
        this.parent = parent;
        this.isIndex = isIndex;
        this.isNotFound = isNotFound;
        const parentPath = this.parent === void 0 ? '' : this.parent.path.pattern + '/';
        this.path = new Path(parentPath + routeJson.url, routeJson.params, !!routeJson.isExact);
        if (routeJson.index !== void 0) {
            this.children.push(new InnerRoute(routeJson.index, this, true, false));
        }
        if (routeJson.notFound !== void 0) {
            this.children.push(new InnerRoute(routeJson.notFound, this, false, true));
        }
        this.resolve = routeJson.resolve ? routeJson.resolve : () => true;
        const keys = Object.keys(routeJson);
        this.publicRoute = new PublicRoute(this);
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
}

var s = 1;
