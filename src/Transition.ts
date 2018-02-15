import { UrlParams } from './Path';
import { PublicRoute, InnerRoute } from './Route';
import { PublicRouter, PublicRouterOpened } from './PublicRouter';

export type Params = { [key: string]: string };

export interface P1ublicData {
    route: PublicRoute;
    params: Params;
    hash: string;
}

export class Transition {
    static id = 0;
    id = Transition.id++;
    // onCommit = new Listeners<void>();
    // type: Type;
    url: string;
    topRoute: InnerRoute;
    publicRouter: PublicRouterOpened;
    urlParams: UrlParams;
    routeStack: { route: InnerRoute; isInit: boolean }[] = [];
    removeRouteStack: InnerRoute[] = [];
    constructor({
        url,
        topRoute,
        publicRouter,
        prevTransition,
        urlParams,
        fullRemakeStack,
    }: {
        url: string;
        publicRouter: PublicRouterOpened;
        topRoute: InnerRoute;
        urlParams: UrlParams;
        fullRemakeStack: boolean;
        prevTransition?: Transition;
    }) {
        this.url = url;
        this.topRoute = topRoute;
        this.publicRouter = publicRouter;
        this.urlParams = urlParams;
        if (prevTransition !== void 0) {
            this.makeNewRouteStack(prevTransition, topRoute, urlParams.params, urlParams.values, fullRemakeStack);
        }
    }

    done() {
        for (let i = 0; i < this.routeStack.length; i++) {
            const { route } = this.routeStack[i];
            this.publicRouter.onCommitListener.call({});
        }
    }

    isActual() {
        return this.id === Transition.id - 1;
    }

    isRouteActive(r: InnerRoute) {
        const { routeStack } = this;
        for (let i = 0; i < routeStack.length; i++) {
            const { route } = routeStack[i];
            if (r === route) {
                return true;
            }
        }
        return false;
    }

    makeNewRouteStack(
        prevTransition: Transition,
        nextRoute: InnerRoute,
        nextParams: Params,
        nextParamsValues: string[],
        fullRemakeStack: boolean
    ) {
        const removeRouteStack = [];
        const newRouteStack = [];
        const nextParents = nextRoute.getParents();
        let start = 0;
        if (fullRemakeStack === false) {
            for (let i = 0; i < prevTransition.routeStack.length; i++) {
                const routeBinding = prevTransition.routeStack[i];
                // last route must always be uninited
                if (
                    i + 1 < nextParents.length &&
                    routeBinding.route === nextParents[i] &&
                    arraysEqual(
                        prevTransition.urlParams.values,
                        nextParamsValues,
                        routeBinding.route.path.getAllParamsCount()
                    )
                ) {
                    start = i + 1;
                    newRouteStack.push(routeBinding);
                } else {
                    start = i;
                    break;
                }
            }
        }
        for (let j = start; j < prevTransition.routeStack.length; j++) {
            const { route } = prevTransition.routeStack[j];
            removeRouteStack.push(route);
        }
        for (let j = start; j < nextParents.length; j++) {
            const route = nextParents[j];
            newRouteStack.push({
                route,
                isInit: false,
            });
        }
        this.routeStack = newRouteStack;
        this.removeRouteStack = removeRouteStack;
    }

    resolveStack(): Promise<{}> {
        const paralellPromises = [];
        for (let i = 0; i < this.routeStack.length; i++) {
            const routeItem = this.routeStack[i];
            if (!routeItem.isInit) {
                const promise = Promise.resolve(routeItem.route.resolve(this.publicRouter)).then(data => {
                    routeItem.isInit = true;
                    return data;
                });
                paralellPromises.push(promise);
                paralellPromises.push(routeItem.route.resolveComponents());
            }
        }
        return Promise.all(paralellPromises);
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
