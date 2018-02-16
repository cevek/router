import { UrlParams } from './Path';
import { PublicRoute, InnerRoute } from './Route';
import { PublicRouter } from './PublicRouter';

export type Params = { [key: string]: string };

export class RouterState {
    static id = 0;
    id = RouterState.id++;
    // onCommit = new Listeners<void>();
    // type: Type;
    url: string;
    // topRoute: InnerRoute;
    publicRouter: PublicRouter;
    urlParams: UrlParams;
    routeStack: { route: InnerRoute; isInit: boolean }[] = [];
    removeRouteStack: InnerRoute[] = [];
    
    constructor({
        url,
        topRoute,
        publicRouter,
        prevState,
        urlParams,
        fullRemakeStack,
    }: {
        url: string;
        publicRouter: PublicRouter;
        topRoute: InnerRoute;
        urlParams: UrlParams;
        fullRemakeStack: boolean;
        prevState?: RouterState;
    }) {
        this.url = url;
        // this.topRoute = topRoute;
        this.publicRouter = publicRouter;
        this.urlParams = urlParams;
        if (prevState !== void 0) {
            this.makeNewRouteStack(prevState, topRoute, urlParams.params, urlParams.values, fullRemakeStack);
        }
    }

    

    isActual() {
        return this.id === RouterState.id - 1;
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
        prevState: RouterState,
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
            for (let i = 0; i < prevState.routeStack.length; i++) {
                const routeBinding = prevState.routeStack[i];
                // last route must always be uninited
                if (
                    i + 1 < nextParents.length &&
                    routeBinding.route === nextParents[i] &&
                    arraysEqual(
                        prevState.urlParams.values,
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
        for (let j = start; j < prevState.routeStack.length; j++) {
            const { route } = prevState.routeStack[j];
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

    resolveStack(): Promise<boolean> {
        const paralellPromises = [];
        let notFoundSignal = false;
        for (let i = 0; i < this.routeStack.length; i++) {
            const routeItem = this.routeStack[i];
            if (!routeItem.isInit) {
                const promise = Promise.resolve(routeItem.route.resolve(this.publicRouter)).then(data => {
                    if (data === false) {
                        notFoundSignal = true;
                    }
                    routeItem.isInit = true;
                    return data;
                });
                paralellPromises.push(promise);
                paralellPromises.push(routeItem.route.resolveComponents());
            }
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
