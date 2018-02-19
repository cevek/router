import { UrlParams } from './Path';
import { PublicRoute, InnerRoute } from './Route';
import { Router } from './Router';
import { Any } from './Helpers';

export type Params = { [key: string]: string; hash: string; };

export class RouterState {
    static id = 0;
    id = RouterState.id++;
    url: string;
    urlParams: UrlParams;
    route: InnerRoute;
    removeRouteStack: InnerRoute[] = [];

    constructor({ url, route, urlParams }: { url: string; route: InnerRoute; urlParams: UrlParams }) {
        this.url = url;
        this.route = route;
        this.urlParams = urlParams;
    }

    isActual() {
        return this.id === RouterState.id - 1;
    }

    resolveStack(router: Router<Any>): Promise<boolean> {
        const { route } = this;
        const paralellPromises: Promise<Any>[] = [];
        let notFoundSignal = false;
        let localStore = {};
        const stack = route.getParents();
        let promise = Promise.resolve({});
        for (let i = 0; i < stack.length; i++) {
            const route = stack[i];
            promise = Promise.resolve(
                route.resolve({
                    url: this.url,
                    params: this.urlParams.params,
                    hash: this.urlParams.hash,
                    store: router.externalState,
                    localStore: localStore,
                    parentResult: promise,
                    router,
                })
            ).then(data => {
                if (data === false) {
                    notFoundSignal = true;
                }
                return data;
            });
            paralellPromises.push(promise);
            paralellPromises.push(route.resolveComponents());
        }
        return Promise.all(paralellPromises).then(() => notFoundSignal);
    }
}

function arraysEqual(a: string[], b: string[], checkCount: number) {
    if (a.length < checkCount || b.length < checkCount) return false;
    for (let i = 0; i < checkCount; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
