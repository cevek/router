import FastPromise from 'fast-promise';
import {RouteTransition} from './RouterTransition';
import {UrlHistory} from './UrlHistory';
import {Route, RouteProps} from './Route';
import {Listeners} from './Listeners';

export class Router {
    history: UrlHistory;
    activeFastPromise: FastPromise<{}> = FastPromise.resolve();
    routeStack: Route[] = [];
    routeStackEnterData: RouteProps[] = [];
    registeredRoutes: Route[];
    url = '';
    newUrl = '';
    activeRoute: Route;

    urlReceived = new Listeners<string>();
    urlWillMount = new Listeners<RouteTransition>();
    urlDidMount = new Listeners<RouteTransition>();

    transition: RouteTransition;
    statusCode: number;

    publicFastPromise: FastPromise<{}> = FastPromise.resolve();
    private urlHasBeenChangedDuringTransition = false;
    private cancelledTransitions = 0;

    constructor(route: Route, urlHistory: UrlHistory) {
        this.history = urlHistory;
        this.setRootRoute(route);
    }

    addRoute(route: Route) {
        this.registeredRoutes.push(route);
        route.init();
        route.router = this;
        for (let i = 0; i < route.children.length; i++) {
            this.addRoute(route.children[i]);
        }
    }

    setRootRoute(route: Route) {
        this.registeredRoutes = [];
        this.addRoute(route);
        this.registeredRoutes.sort((a, b) => a.url < b.url ? -1 : 1);
    }

    changeUrl<T>(url: string, urlHasChanged: boolean, replace: boolean) {
        // console.log('changeUrl', url, this.url, this.url.href, url.href, this.url.state, url.state);
        this.statusCode = 200;
        if (urlHasChanged) {
            this.urlHasBeenChangedDuringTransition = true;
        }
        this.activeFastPromise.cancel();
        this.activeFastPromise = FastPromise.resolve();
        if (this.publicFastPromise.isPending()) {
            this.cancelledTransitions++;
        } else {
            this.cancelledTransitions = 0;
            this.publicFastPromise = new FastPromise();
        }
        this.newUrl = url;
        this.urlReceived.emit(url);
        if (this.url === url) {
            // console.log("skip");
            // restore old url
            this.history.replace(this.url);
            this.publicFastPromise.resolve();
        } else {
            const route = this.findRouteByUrl(url);
            if (route) {
                const transition = new RouteTransition(this.url, url, route, this.routeStack, this.routeStackEnterData, urlHasChanged, replace);
                this.activeFastPromise
                    .then(transition.create, null, transition)
                    .then(this.successTransition, this.failTransition, this);
            } else {
                // not found anything
                this.publicFastPromise.reject(new Error('No match routes found for ' + url));
            }
        }
        return this.publicFastPromise;
    }

    successTransition(transition: RouteTransition) {
        // console.log("success transition");
        this.urlWillMount.emit(transition);
        this.url = transition.url;
        if (transition.urlHasChanged) {

        } else {
            if (transition.replace) {
                if (this.cancelledTransitions === 0 || this.urlHasBeenChangedDuringTransition) {
                    this.history.replace(this.url);
                } else {
                    this.history.push(this.url);
                }
            } else {
                if (this.urlHasBeenChangedDuringTransition) {
                    this.history.replace(this.url);
                } else {
                    this.history.push(this.url);
                }
            }
        }
        this.urlHasBeenChangedDuringTransition = false;
        this.cancelledTransitions = 0;
        this.routeStack = transition.newRouteStack;
        this.routeStackEnterData = transition.stackData;
        this.publicFastPromise.resolve();
        this.activeRoute = transition.route;
        this.urlDidMount.emit(transition);
    }

    failTransition(reason: {}) {
        // console.log("fail transition", reason);
        // restore old url
        this.newUrl = this.url;
        this.history.replace(this.url);
        this.urlHasBeenChangedDuringTransition = false;
        this.cancelledTransitions = 0;
        this.publicFastPromise.reject(reason);
    }

    findRouteByUrl(url: string): Route | undefined {
        return this.registeredRoutes.filter(route => route.check(url)).pop();
    }

    onPopState = () => {
        return this.changeUrl(this.history.getCurrentUrl(), true, false);
    };

    init() {
        this.history.urlChanged.addListener(this.onPopState);
        return this.onPopState();
    }

    destroy() {
        this.history.urlChanged.removeListener(this.onPopState);
    }

    setStatusCode(code: number) {
        this.statusCode = code;
    }

    hasParent(route: Route) {
        return this.routeStack.indexOf(route) > -1;
    }
}
