import {Route, RouteProps} from './Route';
import FastPromise from 'fast-promise';

export class RouteTransition {
    private static id = 0;
    id = RouteTransition.id++;

    stackData: RouteProps[] = [];
    unMountRoutes: Route[];
    toMountRoutes: Route[];
    newRouteStack: Route[];
    urlValues: string[][] = [];
    pos: number;

    prevUrl: string;
    url: string;
    route: Route;
    currentStack: Route[];
    currentData: RouteProps[];
    urlHasChanged: boolean;
    replace: boolean;

    constructor(prevUrl: string, url: string, route: Route, currentStack: Route[], currentData: RouteProps[], urlHasChanged: boolean, replace: boolean) {
        this.prevUrl = prevUrl;
        this.url = url;
        this.route = route;
        this.currentData = currentData;
        this.currentStack = currentStack;
        this.urlHasChanged = urlHasChanged;
        this.replace = replace;

        const routeWithParents = route.getParents();
        for (let i = 0; i < routeWithParents.length; i++) {
            const route = routeWithParents[i];
            this.urlValues[i] = route.getValues(this.url);
        }
        const pos = this.getChangedRoutesPos(routeWithParents);
        this.pos = pos;
        this.unMountRoutes = currentStack.slice(pos) as Route[];
        this.toMountRoutes = routeWithParents.slice(pos) as Route[];
        this.newRouteStack = currentStack.slice(0, pos).concat(this.toMountRoutes);
        /* console.log({
         router: this,
         routeStack: this.routeStack,
         unMountRoutes,
         toMountRoutes,
         pos,
         route,
         routeWithParents,
         url
         });*/
    }

    create() {
        return this.enterToAll().then(this.leaveFromAll, null, this).then(this.returnSelf, null, this);
    }

    getChangedRoutesPos(newRoutes: Route[]) {
        for (let i = 0; i < this.currentStack.length; i++) {
            const route = this.currentStack[i];
            const newRoute = newRoutes[i];
            const routeData = this.currentData[i];
            if (route !== newRoute || !this.isSameRouteProps(routeData.paramValues, this.urlValues[i])) {
                return i;
            }
        }
        return this.currentStack.length;
    }

    private isSameRouteProps(a: string[], b: string[]) {
        for (let i = 0; i < a.length; i++) {
            if (b[i] !== a[i]) {
                return false;
            }
        }
        return true;
    }

    returnSelf() {
        return this;
    }

    enterToAll() {
        let init: RouteProps;
        if (this.pos > 0) {
            for (let i = 0; i < this.pos; i++) {
                const currUrl = this.currentData[i];
                this.stackData[i] = currUrl;
                currUrl.params = this.route.getParams(this.urlValues[i]);
                currUrl.paramValues = this.urlValues[i];
                currUrl.url = this.url;
                currUrl.search = this.url.search;
            }
            init = this.currentData[this.pos - 1];
        } else {
            init = {
                params: this.route.getParams(this.urlValues[0]),
                paramValues: this.urlValues[0],
                search: this.url.search,
                url: this.url,
                key: this.id,
            };
        }
        let promise = FastPromise.resolve(init);
        for (let i = 0; i < this.toMountRoutes.length; i++) {
            promise = promise.then(RouteTransition.enterToAllMap, null, {thisArg: this, pos: i});
        }
        return promise;
    }

    cloneObj(obj: RouteProps) {
        const keys = Object.keys(obj);
        let i = keys.length;
        const newObj = {};
        while (i--) {
            const key = keys[i];
            (newObj as any)[key] = (obj as any)[key];
        }
        return newObj as RouteProps;
    }

    static enterToAllMap(this: { thisArg: RouteTransition, pos: number }, val: RouteProps) {
        const transition = this.thisArg;
        const pos = this.pos;
        const newVal = transition.cloneObj(val);
        const i = pos + transition.pos;
        transition.stackData[i] = newVal;
        let urlValue = transition.urlValues[i];
        newVal.params = transition.route.getParams(urlValue);
        newVal.url = transition.url;
        newVal.search = transition.url.search;
        newVal.paramValues = urlValue;
        newVal.key = transition.id;
        return transition.toMountRoutes[pos].enter(newVal);
    }

    leaveFromAll() {
        let promise = FastPromise.resolve(null);
        for (let i = this.unMountRoutes.length - 1; i >= 0; i--) {
            promise = promise.then(RouteTransition.leaveFromAllMap, null, {thisArg: this, pos: i});
        }
        return promise;
    }

    static leaveFromAllMap(this: { thisArg: RouteTransition, pos: number }, val: {} | null) {
        const transition = this.thisArg;
        const pos = this.pos;
        return transition.unMountRoutes[pos].leave(transition.url);
    }
}