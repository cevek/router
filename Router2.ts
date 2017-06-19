class P<T = {}> {
    resolve: (value?: T) => void;
    reject: (err: any) => void;
    promise = new Promise((_resolve, _reject) => {
        this.resolve = _resolve;
        this.reject = _reject;
    });
}

export class Listerners<T> {
    protected listeners: ((value: T) => void)[];

    listen(callback: () => void) {
        if (this.listeners.indexOf(callback) === -1) {
            this.listeners.push(callback);
        }
        return () => {
            const pos = this.listeners.indexOf(callback);
            if (pos > -1) {
                this.listeners.splice(pos, 1);
            }
        };
    }

    call(value: T) {
        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](value);
        }
    }
}

export interface RouteBinding {
    route: Route;
    props: {};
    usedUrlParams: string[];
    usedSearchParams: string[];
    isInit: boolean;
}

export interface Transition {
    id: number;
    url: string;
    urlParams: {},
    searchParams: {},
    bindings: RouteBinding[];
}

export class Router {
    protected routes: Route[];
    protected transition: Transition = {id: 1, url: '', bindings: [], urlParams: {}, searchParams: {}};
    onUpdate = new Listerners();

    changeUrl(url: string) {
        const r = this.findRoute(url);
        if (r === void 0) {return Promise.resolve()}
        const {route, urlParams} = r;
        const searchParams = {}; //todo:
        const {removeRouteStack, newRouteStack} = this.makeNewRouteStack(route);
        const promise = new P<void>();
        const transition:Transition = {
            id: this.transition.id + 1,
            url,
            bindings: newRouteStack,
            urlParams,
            searchParams,
        }
        this.resolveStack(Promise.resolve(), transition).then(() => {
            return this.leaveStack(transition, removeRouteStack);
        }).then(() => {
            if (transition.id === this.transition.id) {
                this.transition = transition;
                promise.resolve();
                this.onUpdate.call(transition);
            }
        }).catch(promise.reject);
        return promise.promise;
    }

    protected findRoute(url: string): {route: Route, urlParams: {}} | undefined {
        for (let i = 0; i < this.routes.length; i++) {
            const route = this.routes[i];
            const urlParams = route.match(url);
            if (urlParams !== void 0) {
                return {route, urlParams};
            }
        }
        return void 0;
    }

    protected resolveStack(promise: Promise<void>, transition: Transition): Promise<void> {
        for (let i = 0; i < transition.bindings.length; i++) {
            const routeBinding = transition.bindings[i];
            if (routeBinding.isInit) {

            } else {
                promise = promise.then(() => {
                    if (transition.id !== this.transition.id) return;
                    return routeBinding.route.onEnter({
                        router: this,
                        urlParams: transition.urlParams,
                        searchParams: transition.searchParams,
                    }).then(props => {
                        if (transition.id !== this.transition.id) return;
                        routeBinding.isInit = true;
                        routeBinding.props = props;
                    });
                });
            }
        }
        return promise;
    }

    protected leaveStack(transition: Transition, leaveRouteStack: RouteBinding[]) {
        let promise = Promise.resolve();
        for (let i = leaveRouteStack.length - 1; i >= 0; i--) {
            const routeBinding = leaveRouteStack[i];
            promise = promise.then(() => {
                if (transition.id !== this.transition.id) return;
                return routeBinding.route.onLeave({
                    router: this,
                    urlParams: transition.urlParams,
                    searchParams: transition.searchParams,
                });
            });
        }
        return promise;
    }

    protected makeNewRouteStack(nextRoute: Route): {removeRouteStack: RouteBinding[], newRouteStack: RouteBinding[]} {
        const remove: RouteBinding[] = [];
        const newRouteStack: RouteBinding[] = [];
        const nextParents = nextRoute.getParents();
        for (let i = 0; i < this.transition.bindings.length; i++) {
            const routeBinding = this.transition.bindings[i];
            if (routeBinding.route === nextParents[i]) {
                newRouteStack.push(routeBinding);
            } else {
                for (let j = i; j < this.transition.bindings.length; j++) {
                    const routeBinding = this.transition.bindings[j];
                    remove.push(routeBinding);
                }
                for (let j = i; j < nextParents.length; j++) {
                    const route = nextParents[j];
                    newRouteStack.push({
                        route,
                        props: {},
                        usedUrlParams: [],
                        usedSearchParams: [],
                        isInit: false,
                    });
                }
            }
        }
        return {removeRouteStack: remove, newRouteStack};
    }
}

export interface RouteParams {
    router: Router;
    urlParams: {};
    searchParams: {};
}

export interface PathPart {
    paramName: string | undefined;
    value: string;
    prefix: string;
    isOptional: boolean;
}

export class Path {
    regexp: RegExp;
    parts: PathPart[];
    regexpGroupNames: string[];

    parse(path: string) {
        const m = path.match(this.regexp);
        if (m === null) return void 0;
        const params:{[name: string]: string} = {};
        for (let i = 1; i < m.length; i++) {
            params[this.regexpGroupNames[i]] = m[i];
        }
        return params;
    }

    compile(pattern: string) {
        const groupNames = ['all'];
        const re = /(\/?:[\w\d_]+(?:\\\?)?)/;
        const splitParts = escapeRegExp(pattern).split(re);
        const pathParts: PathPart[] = [];
        let regexpStr = '';
        for (let i = 0; i < splitParts.length; i++) {
            const part = splitParts[i];
            if (re.test(part)) {
                const isOptional = part.substr(-1) === '?';
                const hasPrefix = part.substr(0, 1) === '/';
                const groupName = part.substr(hasPrefix ? 2 : 1, isOptional ? part.length - 2 : part.length);

                groupNames.push(groupName);
                regexpStr += '(.*?)' + (isOptional ? '?' : '');
                pathParts.push({
                    paramName: groupName,
                    value: '',
                    prefix: hasPrefix ? '/' : '',
                    isOptional,
                });
            } else {
                pathParts.push({
                    paramName: void 0,
                    value: part,
                    prefix: '',
                    isOptional: false,
                });
                regexpStr += part;
            }
        }
        this.parts = pathParts;
        this.regexp = new RegExp(regexpStr);
        this.regexpGroupNames = groupNames;
    }

    toString(params: {[name: string]: string | number}) {
        let url = '';
        for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            if (part.paramName !== void 0) {
                const paramValue = params[part.paramName];
                if (paramValue === void 0) {
                    if (!part.isOptional) {
                        throw new Error(`Empty url param value for ${part.paramName}`);
                    }
                } else {
                    url += part.prefix + paramValue;
                }
            } else {
                url += part.value;
            }
        }
        return url;
    }
}

function escapeRegExp(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class Route<T = {}> {
    parent: Route;
    path: Path;
    onEnter: (params: RouteParams) => Promise<T>;
    onLeave: (params: RouteParams) => Promise<void>;

    getParents(): Route[] {
        let r: Route = this;
        const result = [];
        while (r !== void 0) {
            result.push(r);
            r = r.parent;
        }
        return result;
    }

    match(url: string) {
        return this.path.parse(url);
    }
}
