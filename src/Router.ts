import { Listeners } from './Listeners';
import { UrlHistory } from './History';
import { UrlParams } from './Path';
import { Transition } from './Transition';
import { InnerRoute, PublicRoute, PublicRouteOpened } from './Route';
import { PublicRouter, PublicRouterOpened } from './PublicRouter';
import * as React from 'react';

class PromiseHandle<T = {}> {
    resolve: (value?: T) => void = undefined!;
    reject: (err: any) => void = undefined!;
    promise = new Promise<T>((_resolve, _reject) => {
        this.resolve = _resolve;
        this.reject = _reject;
    });
}

class DefaultNotFound extends React.Component {
    render() {
        return React.createElement('div', {}, 'Not found');
    }
}

export class Router {
    routes: InnerRoute[] = [];
    indexRoute: InnerRoute;
    beforeUpdate = new Listeners<PublicRouter>();
    afterUpdate = new Listeners<PublicRouter>();
    urlHistory: UrlHistory;
    inited = false;
    // publicRouter: PublicRouter;

    transition = new Transition({
        publicRouter: undefined!,
        topRoute: undefined!,
        url: undefined!,
        urlParams: undefined!,
        fullRemakeStack: false,
        prevTransition: undefined!,
    });
    constructor(indexRoute: PublicRoute, urlHistory: UrlHistory) {
        // this.publicRouter = new PublicRouter(undefined!, this.changeUrl);
        this.urlHistory = urlHistory;
        this.urlHistory.urlChanged.listen(url => {
            this.changeUrl(url, true);
        });
        this.indexRoute = (indexRoute as PublicRouteOpened)._route;
        const defaultNotFound = new InnerRoute(
            { url: '', component: { NotFound: () => DefaultNotFound } },
            this.indexRoute,
            false,
            true
        );
        this.routes = this.flatChildren([this.indexRoute, defaultNotFound], this.indexRoute);
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

    getLastTransition() {
        return this.transition;
    }

    softReload() {
        return this.changeUrl(this.transition.url, true);
    }

    changeUrl = (url: string, fullRemakeStack = false): Promise<{}> => {
        const { route, urlParams } = this.findRoute(url);
        if (route === void 0 || urlParams === void 0) {
            this.urlHistory.setUrl(this.transition.url, true);
            return Promise.resolve(this.transition);
        }
        const promiseHandle = new PromiseHandle<Transition>();
        const transition = new Transition({
            url,
            topRoute: route,
            fullRemakeStack,
            urlParams,
            publicRouter: new PublicRouter(route, urlParams, this.changeUrl) as PublicRouterOpened,
            prevTransition: this.transition,
        });
        this.beforeUpdate.call(this.transition.publicRouter);
        // const startPromise = Promise.resolve({});
        transition.resolveStack().then(
            () => {
                if (transition.isActual()) {
                    this.urlHistory.setUrl(transition.url, false);
                    this.transition = transition;
                    transition.done();
                    promiseHandle.resolve();
                    this.afterUpdate.call(this.transition.publicRouter);
                } else {
                    promiseHandle.resolve();
                }
            },
            (err: {}) => {
                this.urlHistory.setUrl(this.transition.url, true);
                promiseHandle.reject(err);
            }
        );
        return promiseHandle.promise;
    };

    protected findRoute(url: string) {
        for (let i = 0; i < this.routes.length; i++) {
            const route = this.routes[i];
            const urlParams = route.path.parse(url);
            if (urlParams !== void 0) return { route, urlParams };
        }
        return { route: void 0, urlParams: void 0 };
    }
}
