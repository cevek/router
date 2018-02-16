import { Listeners } from './Listeners';
import { UrlHistory } from './History';
import { UrlParams } from './Path';
import { RouterState } from './RouterState';
import { InnerRoute, PublicRoute } from './Route';
import { PublicRouter } from './PublicRouter';
import * as React from 'react';

export class PromiseHandle<T = {}> {
    resolve: (value?: T) => void = undefined!;
    reject: (err: any) => void = undefined!;

    promise = new Promise<T>((_resolve, _reject) => {
        this.resolve = _resolve;
        this.reject = _reject;
    });
}

export class PromiseBox<T> {
    private promiseHandle?: PromiseHandle<T>;
    getPromise() {
        return this.promiseHandle !== void 0 ? this.promiseHandle.promise : Promise.resolve();
    }
    createIfEmpty() {
        if (this.promiseHandle === void 0) {
            this.promiseHandle = new PromiseHandle();
        }
    }
    resolve(value?: T) {
        if (this.promiseHandle !== void 0) {
            this.promiseHandle.resolve(value);
        }
        this.promiseHandle = undefined;
    }
    reject(err?: T) {
        if (this.promiseHandle !== void 0) {
            this.promiseHandle.reject(err);
        }
        this.promiseHandle = undefined;
    }
}

export class Router {
    routes: InnerRoute[] = [];
    indexRoute: InnerRoute;
    beforeUpdate = new Listeners<PublicRouter>();
    afterUpdate = new Listeners<PublicRouter>();
    urlHistory: UrlHistory;
    inited = false;
    promiseBox = new PromiseBox<void>();
    // publicRouter: PublicRouter;

    state = new RouterState({
        publicRouter: undefined!,
        topRoute: undefined!,
        url: undefined!,
        urlParams: undefined!,
        fullRemakeStack: false,
        prevState: undefined!,
    });
    constructor(indexRoute: PublicRoute, urlHistory: UrlHistory) {
        // this.publicRouter = new PublicRouter(undefined!, this.changeUrl);
        this.urlHistory = urlHistory;
        this.urlHistory.urlChanged.listen(url => {
            this.changeUrl(url, true);
        });
        this.indexRoute = indexRoute._route;
        this.routes = this.flatChildren([this.indexRoute], this.indexRoute);
        this.routes.sort((a, b) => {
            /* istanbul ignore if */
            if (a.path.pattern > b.path.pattern) return -1;
            if (a.path.pattern < b.path.pattern) return 1;
            return a.isIndex ? -1 : 1;
        });
    }

    init() {
        this.inited = true;
        return this.changeUrl(this.urlHistory.getCurrentUrl());
    }

    flatChildren(list: InnerRoute[], route: InnerRoute) {
        for (let i = 0; i < route.children.length; i++) {
            const child = route.children[i];
            list.push(child);
            this.flatChildren(list, child);
        }
        return list;
    }

    getState() {
        return this.state;
    }

    softReload() {
        return this.changeUrl(this.state.url, true);
    }

    changeUrl = (url: string, fullRemakeStack = false, startFromRouteIdx = 0): Promise<void> => {
        this.promiseBox.createIfEmpty();
        const { route, urlParams, routeIdx } = this.findRoute(url, startFromRouteIdx);
        if (route === void 0 || urlParams === void 0) {
            this.urlHistory.setUrl(this.state.url, true);
            this.promiseBox.resolve();
            return Promise.resolve();
        }
        // const promiseHandle = new PromiseHandle<void>();
        const state = new RouterState({
            url,
            topRoute: route,
            fullRemakeStack,
            urlParams,
            publicRouter: new PublicRouter(route, urlParams, this.changeUrl),
            prevState: this.state,
        });
        this.beforeUpdate.call(this.state.publicRouter);
        // const startPromise = Promise.resolve({});
        state.resolveStack().then(
            notFoundSignal => {
                if (state.isActual()) {
                    if (notFoundSignal) {
                        this.changeUrl(url, false, routeIdx + 1);
                        return;
                    }
                    this.applyState(state);
                }
            },
            (err: {}) => {
                this.urlHistory.setUrl(this.state.url, true);
                this.promiseBox.reject();
            }
        );
        return this.promiseBox.getPromise();
    };

    applyState(state: RouterState) {
        this.urlHistory.setUrl(state.url, false);
        this.state = state;
        for (let i = 0; i < state.routeStack.length; i++) {
            const { route } = state.routeStack[i];
            // this.publicRouter.onCommitListener.call({});
        }
        this.promiseBox.resolve();
        this.afterUpdate.call(this.state.publicRouter);
    }

    protected findRoute(url: string, startFromIdx = 0) {
        for (let i = startFromIdx; i < this.routes.length; i++) {
            const route = this.routes[i];
            const urlParams = route.path.parse(url);
            if (urlParams !== void 0) return { route, urlParams, routeIdx: i };
        }
        return { route: void 0, urlParams: void 0, routeIdx: -1 };
    }
}
