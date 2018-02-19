import * as React from 'react';
import { Diff, Any } from './Helpers';
import { Listeners } from './Listeners';
import { UrlHistory } from './History';
import { UrlParams } from './Path';
import { RouterState, Params } from './RouterState';
import { InnerRoute, PublicRoute } from './Route';
import { PromiseBox } from './PromiseUtils';

export interface RedirectOptions {
    replace?: boolean;
}

export interface PublicRouter<Params = {}> {
    beforeUpdate: Listeners<void>;
    afterUpdate: Listeners<void>;
    params: Params;
    redirect<SubParams extends undefined>(route: PublicRoute<SubParams>, options?: {}): Promise<{}>;
    redirect<SubParams>(
        route: PublicRoute<SubParams>,
        params: Diff<Params, SubParams & {}>,
        options?: {}
    ): Promise<{}>;
    redirect(route: string, options?: {}): Promise<{}>;
}

export class Router<T = {}> implements PublicRouter<T> {
    beforeUpdate = new Listeners<void>();
    beforeCommit = new Listeners<void>();
    afterUpdate = new Listeners<void>();

    externalState: {} = {};
    private routes: InnerRoute[] = [];
    private indexRoute: InnerRoute;
    private urlHistory: UrlHistory;
    private inited = false;
    private promiseBox = new PromiseBox<{}>();
    private state = new RouterState({
        url: undefined!,
        route: undefined!,
        urlParams: undefined!,
    });

    get params(): T {
        return (this.state.urlParams.params as {}) as T;
    }

    get hash() {
        return this.state.urlParams.hash;
    }

    redirect(route: string | PublicRoute, params?: {}, options: RedirectOptions = {}): Promise<{}> {
        return this.changeUrl(
            typeof route === 'string' ? route : this.toUrl(route, params as Params, options),
            !!options.replace
        );
    }

    toUrl(route: PublicRoute, params: Params, options: RedirectOptions = {}) {
        return route._route.path.toUrl({ ...this.state.urlParams.pathParams, ...params });
    }

    constructor(indexRoute: PublicRoute, urlHistory: UrlHistory) {
        this.urlHistory = urlHistory;
        this.urlHistory.urlChanged.listen(url => {
            this.changeUrl(url, false);
        });
        this.indexRoute = indexRoute._route;
        this.routes = this.flatRouteChildren([this.indexRoute], this.indexRoute);
        this.routes.sort((a, b) => {
            /* istanbul ignore if */
            if (a.path.pattern > b.path.pattern) return -1;
            if (a.path.pattern < b.path.pattern) return 1;
            return a.isIndex ? -1 : 1;
        });
        this.redirect = this.redirect.bind(this);
    }

    init() {
        this.inited = true;
        return this.changeUrl(this.urlHistory.getCurrentUrl(), false);
    }

    private changeUrl = (url: string, replace: boolean, startFromRouteIdx = 0): Promise<{}> => {
        this.promiseBox.createIfEmpty();
        const { state, offset } = this.makeStateFromUrl(url, startFromRouteIdx);
        if (state === void 0) {
            this.urlHistory.setUrl(this.state.url, true);
            this.promiseBox.resolve();
            return Promise.resolve({});
        }
        this.beforeUpdate.call(void 0);
        state.resolveStack(this).then(
            notFoundSignal => {
                if (state.isActual()) {
                    if (notFoundSignal) {
                        this.changeUrl(url, replace, offset + 1);
                        return;
                    }
                    this.setState(state, replace);
                }
            },
            err => {
                this.urlHistory.setUrl(this.state.url, true);
                this.promiseBox.reject(err);
            }
        );
        return this.promiseBox.getPromise();
    };

    getState() {
        return this.state;
    }

    softReload() {
        return this.changeUrl(this.state.url, false);
    }

    isCurrentRouteHasSameParams(route: InnerRoute, params: Any) {
        const parts = route.path.paramsKeys;
        for (let i = 0; i < parts.length; i++) {
            const paramName = parts[i];
            if (params[paramName] !== this.state.urlParams.pathValues[i]) {
                return false;
            }
        }
        return true;
    }

    private flatRouteChildren(list: InnerRoute[], route: InnerRoute) {
        for (let i = 0; i < route.children.length; i++) {
            const child = route.children[i];
            list.push(child);
            this.flatRouteChildren(list, child);
        }
        return list;
    }

    private makeStateFromUrl(url: string, offset = 0) {
        const { route, urlParams, routeIdx } = this.findRoute(url, offset);
        return route === void 0 || urlParams === void 0
            ? { state: void 0, offset: -1 }
            : {
                  state: new RouterState({
                      url,
                      route,
                      urlParams,
                  }),
                  offset,
              };
    }

    forceSetUrl(url: string) {
        this.urlHistory.setUrl(url, true);
        const { state } = this.makeStateFromUrl(url);
        if (state !== void 0) {
            this.state = state;
        }
        this.afterUpdate.call(void 0);
    }

    private setState(state: RouterState, replace: boolean) {
        this.beforeCommit.call(void 0);
        this.urlHistory.setUrl(state.url, replace);
        this.state = state;
        this.afterUpdate.call(void 0);
        this.promiseBox.resolve();
    }

    private findRoute(url: string, offset = 0) {
        for (let i = offset; i < this.routes.length; i++) {
            const route = this.routes[i];
            const urlParams = route.path.parse(url);
            if (urlParams !== void 0) return { route, urlParams, routeIdx: i };
        }
        return { route: void 0, urlParams: void 0, routeIdx: -1 };
    }
}
