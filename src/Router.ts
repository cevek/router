import * as React from 'react';
import { Diff, Any } from './Helpers';
import { Listeners } from './Listeners';
import { UrlHistory } from './History';
import { UrlParams } from './Path';
import { RouterState } from './RouterState';
import { InnerRoute, PublicRoute } from './Route';
import { PromiseBox } from './PromiseUtils';

export interface PublicRouter<T = {}> {
    beforeUpdate: Listeners<PublicRouter<T>>;
    afterUpdate: Listeners<PublicRouter<T>>;
    params: T;
    hash: string;
    redirect<SubParams extends undefined>(route: PublicRoute<SubParams>, options?: {}): Promise<void>;
    redirect<SubParams>(route: PublicRoute<SubParams>, params: Diff<T, SubParams & {}>, options?: {}): Promise<void>;
    redirect(route: string, options?: {}): Promise<void>;
}

export class Router<T = {}> implements PublicRouter<T> {
    beforeUpdate = new Listeners<PublicRouter<T>>();
    beforeCommit = new Listeners<PublicRouter<T>>();
    afterUpdate = new Listeners<PublicRouter<T>>();

    private routes: InnerRoute[] = [];
    private indexRoute: InnerRoute;
    private urlHistory: UrlHistory;
    private inited = false;
    private promiseBox = new PromiseBox<void>();
    private state = new RouterState({
        url: undefined!,
        route: undefined!,
        urlParams: undefined!,
    });

    get params() {
        return (this.state.urlParams.params as {}) as T;
    }

    get hash() {
        return this.state.urlParams.hash;
    }

    redirect<SubParams extends undefined>(route: PublicRoute<SubParams>, options?: {}): Promise<void>;
    redirect<SubParams>(route: PublicRoute<SubParams>, params: Diff<T, SubParams & {}>, options?: {}): Promise<void>;
    redirect(route: string, options?: {}): Promise<void>;
    redirect(route: string | PublicRoute, params?: {}, options?: {}) {
        return this.changeUrl(
            typeof route === 'string' ? route : route.toUrl({ ...this.state.urlParams.params, ...params })
        );
    }

    constructor(indexRoute: PublicRoute, urlHistory: UrlHistory) {
        this.urlHistory = urlHistory;
        this.urlHistory.urlChanged.listen(url => {
            this.changeUrl(url);
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
        return this.changeUrl(this.urlHistory.getCurrentUrl());
    }

    private changeUrl = (url: string, startFromRouteIdx = 0): Promise<void> => {
        this.promiseBox.createIfEmpty();
        const { state, offset } = this.makeStateFromUrl(url, startFromRouteIdx);
        if (state === void 0) {
            this.urlHistory.setUrl(this.state.url, true);
            this.promiseBox.resolve();
            return Promise.resolve();
        }
        this.beforeUpdate.call(this);
        state.resolveStack(this).then(
            notFoundSignal => {
                if (state.isActual()) {
                    if (notFoundSignal) {
                        this.changeUrl(url, offset + 1);
                        return;
                    }
                    this.setState(state);
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
        return this.changeUrl(this.state.url);
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
        this.afterUpdate.call(this);
    }

    private setState(state: RouterState) {
        this.beforeCommit.call(this);
        this.urlHistory.setUrl(state.url, false);
        this.state = state;
        this.afterUpdate.call(this);
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
