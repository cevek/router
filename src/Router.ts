import * as React from 'react';
import * as PropTypes from 'prop-types';

class P<T = {}> {
    resolve: (value?: T) => void;
    reject: (err: any) => void;
    promise = new Promise<T>((_resolve, _reject) => {
        this.resolve = _resolve;
        this.reject = _reject;
    });
}

export class Listeners<T> {
    protected listeners: ((value: T) => void)[] = [];

    listen(callback: (value: T) => void) {
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
    props: Props;
    urlValues: string[];
    searchParams: UrlSearchParams;
    isInit: boolean;
}

export interface Transition {
    id: number;
    route: Route;
    onEnd: Listeners<void>;
    replaceUrl: boolean;
    url: string;
    urlParams: {},
    searchParams: {},
    bindings: RouteBinding[];
}

export interface Props {

}

export class Router {
    protected routes: Route[];
    protected transitionIdx = 0;
    protected transition: Transition = {
        route: (void 0)!,
        id: ++this.transitionIdx,
        onEnd: new Listeners(),
        replaceUrl: false,
        url: '',
        bindings: [],
        urlParams: {},
        searchParams: {}
    };
    indexRoute: Route;
    beforeUpdate = new Listeners();
    afterUpdate = new Listeners();
    urlHistory: UrlHistory;

    constructor(indexRoute: Route, urlHistory: UrlHistory) {
        this.urlHistory = urlHistory;
        this.urlHistory.urlChanged.listen(url => {
            this.changeUrl(url, true);
        });
        this.setIndexRoute(indexRoute);
    }

    init() {
        return this.changeUrl(this.urlHistory.getCurrentUrl(), true);
    }

    setIndexRoute(indexRoute: Route) {
        this.indexRoute = indexRoute;
        this.routes = this.indexRoute.flatChildren();
        for (let i = 0; i < this.routes.length; i++) {
            const route = this.routes[i];
        }
        this.routes.sort((a, b) => {
            /* istanbul ignore if */
            if (a.path.pattern > b.path.pattern) return -1;
            if (a.path.pattern < b.path.pattern) return 1;
            return a.isIndex ? -1 : 1;
        });
    }

    getLastTransition() {
        return this.transition;
    }

    softReload() {
        return this.changeUrl(this.transition.url, false, true);
    }

    changeUrl(url: string, replaceUrl = false, fullRemakeStack = false): Promise<Transition> {
        const r = this.findRoute(url);
        if (r === void 0) {
            this.setUrl(this.transition.url, true);
            return Promise.resolve(this.transition);
        }
        const { route, urlParams, urlValues, searchQuery } = r;
        const { removeRouteStack, newRouteStack } = this.makeNewRouteStack(route, urlValues, searchQuery, fullRemakeStack);
        const promise = new P<Transition>();
        const transition: Transition = {
            id: ++this.transitionIdx,
            route,
            onEnd: new Listeners(),
            replaceUrl,
            url,
            bindings: newRouteStack,
            urlParams,
            searchParams: searchQuery,
        };
        this.beforeUpdate.call(transition);
        const startPromise = Promise.resolve({});
        this.resolveStack(startPromise, transition).then(() => {
            if (!this.isActualTransition(transition)) return;
            return this.leaveStack(transition, removeRouteStack);
        }).then(() => {
            if (this.isActualTransition(transition)) {
                this.setUrl(transition.url, false);
                this.transition = transition;
                transition.onEnd.call(void 0);
                promise.resolve(transition);
                this.afterUpdate.call(transition);
            } else {
                promise.resolve(this.transition);
            }
        }, err => {
            this.setUrl(this.transition.url, true);
            promise.reject(err);
        });
        return promise.promise;
    }

    protected setUrl(url: string, replace: boolean) {
        if (this.urlHistory.getCurrentUrl() !== url) {
            if (replace) {
                this.urlHistory.replace(url);
            } else {
                this.urlHistory.push(url);
            }
        }
    }

    protected findRoute(url: string) {
        for (let i = 0; i < this.routes.length; i++) {
            const route = this.routes[i];
            const res = route.match(url);
            if (res !== void 0) {
                const { urlParams, urlValues, searchQuery } = res;
                return { route, urlParams, urlValues, searchQuery };
            }
        }
        return void 0;
    }

    protected createOnEnterParams(parentProps: {}, transition: Transition, currentRoute: Route): RouteParams {
        const isDestination = transition.bindings[transition.bindings.length - 1].route === currentRoute;
        return {
            router: this,
            isDestination,
            onEnd: transition.onEnd,
            url: transition.url,
            urlParams: transition.urlParams,
            searchParams: transition.searchParams,
            parentProps,
        };
    }

    protected resolveStack(promise: Promise<{}>, transition: Transition): Promise<{}> {
        for (let i = 0; i < transition.bindings.length; i++) {
            const routeBinding = transition.bindings[i];
            if (routeBinding.isInit) {
                promise = promise.then(() => routeBinding.props);
            } else {
                promise = promise.then(parentProps => {
                    if (!this.isActualTransition(transition)) return {};
                    return routeBinding.route.onEnter(this.createOnEnterParams(parentProps, transition, routeBinding.route)).then((props: Props) => {
                        if (!this.isActualTransition(transition)) return;
                        routeBinding.isInit = true;
                        routeBinding.props = props;
                        return props;
                    });
                });
            }
        }
        return promise;
    }

    protected leaveStack(transition: Transition, leaveRouteStack: RouteBinding[]) {
        let promise: Promise<void | false | Transition> = Promise.resolve();
        for (let i = leaveRouteStack.length - 1; i >= 0; i--) {
            const routeBinding = leaveRouteStack[i];
            promise = promise.then(() => {
                // if (!this.isActualTransition(transition)) return;
                return routeBinding.route.onLeave(this.createOnEnterParams({}, transition, routeBinding.route));
            });
        }

        return promise;
    }

    protected isActualTransition(transition: Transition) {
        return transition.id === this.transitionIdx;
    }

    protected makeNewRouteStack(nextRoute: Route, nextUrlValues: string[], nextSearchParams: UrlSearchParams, fullRemakeStack: boolean): { removeRouteStack: RouteBinding[], newRouteStack: RouteBinding[] } {
        const remove: RouteBinding[] = [];
        const newRouteStack: RouteBinding[] = [];
        const nextParents = nextRoute.getParents();
        let start = 0;
        if (fullRemakeStack === false) {
            for (let i = 0; i < this.transition.bindings.length; i++) {
                const routeBinding = this.transition.bindings[i];
                // last route must always be uninited
                if (i + 1 < nextParents.length &&
                    routeBinding.route === nextParents[i]
                    && this.isUrlParamsEqual(routeBinding.urlValues, nextUrlValues, routeBinding.route.getUrlParamsCount())
                    && this.isUrlSearchParamsEqual(routeBinding.searchParams, nextSearchParams, routeBinding.route.watchSearchParams)
                ) {
                    start = i + 1;
                    newRouteStack.push(routeBinding);
                } else {
                    start = i;
                    break;
                }
            }
        }
        for (let j = start; j < this.transition.bindings.length; j++) {
            const routeBinding = this.transition.bindings[j];
            remove.push(routeBinding);
        }
        for (let j = start; j < nextParents.length; j++) {
            const route = nextParents[j];
            newRouteStack.push({
                route,
                props: {},
                urlValues: nextUrlValues.slice(0, route.getUrlParamsCount()),
                searchParams: nextSearchParams,
                isInit: false,
            });
        }
        return { removeRouteStack: remove, newRouteStack };
    }

    protected isUrlSearchParamsEqual(searchParams: UrlSearchParams, nextSearchParams: UrlSearchParams, usedKeys: string[]) {
        for (let i = 0; i < usedKeys.length; i++) {
            var key = usedKeys[i];
            if (searchParams[key] !== nextSearchParams[key]) {
                return false;
            }
        }
        return true;
    }

    protected isUrlParamsEqual(a: string[], b: string[], checkCount: number) {
        if (a.length < checkCount || b.length < checkCount) return false;
        for (var i = 0; i < checkCount; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
}



export interface RouteParams<UrlParams = {}, SearchParams = {}, ParentProps = {}> {
    url: string;
    router: Router;
    onEnd: Listeners<void>;
    urlParams: UrlParams;
    searchParams: SearchParams;
    parentProps: ParentProps;
    isDestination: boolean;
}

export interface PathPart {
    paramName: string | undefined;
    value: string;
    prefix: string;
    isOptional: boolean;
}

export class Path {
    protected regexp: RegExp;
    protected parts: PathPart[];
    protected regexpGroupNames: string[];
    protected isExact: boolean;
    originalPattern: string;
    pattern: string;
    isCompiled = false;

    constructor(pattern: string, isExact = true) {
        this.pattern = pattern;
        this.isExact = isExact;
        this.originalPattern = pattern;
    }

    parse(path: string) {
        if (!this.isCompiled) {
            throw new Error('Path not compiled yet');
        }
        const m = path.match(this.regexp);
        if (m === null) return void 0;
        const urlParams: { [name: string]: string } = {};
        const urlValues: string[] = [];
        for (let i = 1; i < m.length; i++) {
            const value = decodeURIComponent(m[i] || '');;
            urlParams[this.regexpGroupNames[i]] = value;
            urlValues.push(value);
        }
        return { urlParams, urlValues };
    }

    compile() {
        const groupNames = ['all'];
        const re = /((?:\/?[^/:]*)?:[\w\d_]+(?:\\\?)?)/;
        const splitParts = escapeRegExp(this.pattern).split(re);
        const pathParts: PathPart[] = [];
        let regexpStr = '^';
        for (let i = 0; i < splitParts.length; i++) {
            const part = splitParts[i];
            const m = part.match(/^(\/?[^/:]*)?:([\w\d_]+)(\\\?)?$/);
            if (m) {
                const isOptional = !!m[3];
                const prefix = m[1] || '';
                const groupName = unEscapeRegExp(m[2]);

                groupNames.push(groupName);
                regexpStr += `(?:${prefix}([^/]+))` + (isOptional ? '?' : '');
                pathParts.push({
                    paramName: groupName,
                    value: '',
                    prefix: unEscapeRegExp(prefix),
                    isOptional,
                });
            } else if (part !== '') {
                pathParts.push({
                    paramName: void 0,
                    value: unEscapeRegExp(part),
                    prefix: '',
                    isOptional: false,
                });
                regexpStr += part;
            }
        }
        regexpStr += '/?';
        if (this.isExact) {
            regexpStr += '$';
        }
        this.parts = pathParts;
        this.regexp = new RegExp(regexpStr);
        this.regexpGroupNames = groupNames;
        this.isCompiled = true;
        return this;
    }

    toString(params: { [name: string]: string | number }) {
        if (!this.isCompiled) {
            throw new Error('Path not compiled yet');
        }
        let url = '';
        for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            if (part.paramName !== void 0) {
                const paramValue = params[part.paramName];
                if ((typeof paramValue !== 'string' && typeof paramValue !== 'number') || paramValue === '') {
                    if (!part.isOptional) {
                        throw new Error(`Empty url param value for ${part.paramName}`);
                    }
                } else {
                    url += part.prefix + encodeURIComponent(paramValue + '');
                }
            } else {
                url += part.value;
            }
        }
        return url;
    }

    getParamsCount() {
        return this.regexpGroupNames.length - 1;
    }
}

function escapeRegExp(text: string) {
    return text.replace(/[\-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function unEscapeRegExp(text: string) {
    return text.replace(/\\([\-\[\]{}()*+?.,\\^$|#\s])/g, '$1');
}


export interface ComponentClass<UrlParams, SearchParams, Props> {
    [key: string]: any;

    onEnter?: (params: RouteParams<UrlParams, SearchParams>) => Promise<Props | Transition>;
    onLeave?: (params: RouteParams<UrlParams, SearchParams>) => Promise<void | false | Transition>;
}

export interface UrlSearchParams {
    [name: string]: string;
}

export interface RouteOptions<SearchParams> {
    watchSearchParams?: (keyof SearchParams)[];
}

export class Route<UrlParams extends UrlSearchParams = {}, SearchParams extends UrlSearchParams = {}, Props = {}> {
    parent: Route | undefined = void 0;
    component: ComponentClass<UrlParams, SearchParams, Props>;
    children: Route[] = [];
    path: Path;

    onEnter: (params: RouteParams<UrlParams, SearchParams>) => Promise<Props | Transition>;
    onLeave: (params: RouteParams<UrlParams, SearchParams>) => Promise<void | false | Transition>;

    isIndex: boolean;
    isAny: boolean;
    watchSearchParams: string[];

    constructor(pathString: string, component: ComponentClass<UrlParams, SearchParams, Props>, options: RouteOptions<SearchParams> = {}, isAny = false, isIndex = false) {
        this.isIndex = isIndex;
        this.isAny = isAny;
        this.watchSearchParams = options.watchSearchParams || [];

        this.path = new Path(this.normalizePathString(pathString), !this.isAny).compile();
        this.component = component;
        this.onEnter = component.onEnter || (() => Promise.resolve({} as Props));
        this.onLeave = component.onLeave || (() => Promise.resolve());
    }

    addChild<ChildUrlParams extends UrlParams = UrlParams, ChildSearchParams extends SearchParams = SearchParams>(pathString: string, component: ComponentClass<ChildUrlParams, ChildSearchParams, {}>, options: RouteOptions<ChildSearchParams> = {}) {
        var route = new Route<ChildUrlParams, ChildSearchParams>(this.path.pattern + '/' + pathString, component, options);
        this.addChildRoute(route);
        return route;
    }

    addIndex<ChildUrlParams extends UrlParams = UrlParams, ChildSearchParams extends SearchParams = SearchParams>(component: ComponentClass<ChildUrlParams, ChildSearchParams, {}>, options: RouteOptions<ChildSearchParams> = {}) {
        var route = new Route<ChildUrlParams, ChildSearchParams>(this.path.pattern, component, options, void 0, true);
        this.addChildRoute(route);
        return this;
    }

    addAny<ChildUrlParams extends UrlParams = UrlParams, ChildSearchParams extends SearchParams = SearchParams>(component: ComponentClass<ChildUrlParams, ChildSearchParams, {}>, options: RouteOptions<ChildSearchParams> = {}) {
        var route = new Route<ChildUrlParams, ChildSearchParams>(this.path.pattern, component, options, true);
        this.addChildRoute(route);
        return this;
    }

    protected addChildRoute(route: Route) {
        this.children.push(route);
        route.parent = this;
        return this;
    }

    getParents(): Route[] {
        let r: Route | undefined = this;
        const result = [];
        while (r !== void 0) {
            result.unshift(r);
            r = r.parent;
        }
        return result;
    }

    match(url: string) {
        var [url, query] = url.split('?');
        var res = this.path.parse(url);
        if (res === void 0) {
            return void 0;
        }
        var newRes = res as any;
        newRes.searchQuery = {};
        if (query !== void 0) {
            var re = /(.*?)=(.*?)(&|$)/g
            let m;
            while (m = re.exec(query)) {
                newRes.searchQuery[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }
        }
        return newRes as typeof res & { searchQuery: { [key: string]: string } };
    }

    normalizePathString(pathStr: string) {
        return ('/' + pathStr).replace(/\/+/g, '/').replace(/\/+$/, '');
    }

    toUrl(params: UrlParams, searchParams?: SearchParams) {
        return this.path.toString(params) + (searchParams === void 0 ? '' : this.buildSearchQuery(searchParams));
    }

    private buildSearchQuery(searchParams: SearchParams) {
        let search = '';
        var keys = Object.keys(searchParams);
        let count = 0;
        for (let i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = searchParams[key];
            if (value !== void 0 && value !== null && value !== '') {
                search += `${count === 0 ? '?' : '&'}${key}=${value}`;
                count++;
            }
        }
        return search;
    }

    flatChildren() {
        const children: Route[] = [this];
        for (let i = 0; i < this.children.length; i++) {
            const childRoute = this.children[i];
            children.push(...childRoute.flatChildren());
        }
        return children;
    }

    getUrlParamsCount() {
        return this.path.getParamsCount();
    }
}


export abstract class UrlHistory {
    abstract history: History;
    urlChanged = new Listeners<string>();

    abstract getCurrentUrl(): string;

    constructor() {
        this.listen();
    }

    abstract listen(): void;

    protected onPopState = () => {
        this.urlChanged.call(this.getCurrentUrl());
    };

    get length() {
        return this.history.length;
    }

    canBack() {
        //todo: add referrer, check firefox, ie, open from other domain link
        // || document.referrer.length > 0
        return this.length > 2;
    }

    push(url: string) {
        this.history.pushState(undefined, '', url);
    }

    replace(url: string) {
        this.history.replaceState(undefined, '', url);
    }

    replaceState(state: {}) {
        this.history.replaceState(state, '');
    }

    back() {
        this.history.back();
    }

    forward() {
        this.history.forward();
    }
}


export class BrowserHistory extends UrlHistory {
    history = window.history;

    getCurrentUrl() {
        return window.location.pathname + window.location.search;
        //todo: state?
        // return new Url({url: window.location.pathname + window.location.search, state: this.history.state});
    }

    listen() {
        window.addEventListener('popstate', this.onPopState);
    }
}

export class BrowserHashHistory extends BrowserHistory {
    getCurrentUrl() {
        return window.location.hash.substr(1);
        //todo: state?
        // return new Url({url: window.location.hash.substr(1), state: this.history.state});
    }

    push(url: string) {
        this.history.pushState(undefined, '', '#' + url);
    }

    replace(url: string) {
        this.history.replaceState(undefined, '', '#' + url);
    }
}

export class NodeHistory extends UrlHistory {
    history = {
        length: 0,
        state: null as any,
        back() { },
        forward() { },
        go() { },
        pushState() { },
        replaceState() { },
        scrollRestoration: null as any
    };

    currentHref: string;

    setCurrentHref(href: string) {
        this.currentHref = href;
        this.onPopState();
    }

    getCurrentUrl() {
        return this.currentHref;
        //todo: state?
        // return new Url({url: this.currentHref, state: this.history.state});
    }

    listen() {

    }
}


export interface RouterViewProps {
    router: Router;
    isServerSide?: boolean;
    scrollRestoration?: typeof browserScrollRestorator;
}

export class RouterView extends React.Component<RouterViewProps, {}> {
    scrollPositions = new Map<string, number>();
    constructor(props: RouterViewProps) {
        super(props);
        if (!props.isServerSide) {
            props.router.beforeUpdate.listen(() => {
                if (props.scrollRestoration !== void 0) {
                    var transition = props.router.getLastTransition();
                    this.scrollPositions.set(transition.url, props.scrollRestoration.get());
                }
            });
            props.router.afterUpdate.listen(() => {
                this.forceUpdate();
                if (props.scrollRestoration !== void 0) {
                    var transition = props.router.getLastTransition();
                    props.scrollRestoration.set(transition.replaceUrl ? (this.scrollPositions.get(transition.url) || 0) : 0);
                }
            });
        }
    }

    componentDidMount() {
        if (this.props.scrollRestoration) {
            this.props.scrollRestoration.init();
        }
    }

    getChildContext() {
        return { router: this.props.router };
    }

    static childContextTypes = { router: PropTypes.object };

    render() {
        const { bindings } = this.props.router.getLastTransition();
        let Component: React.ReactElement<{}> | null = null;
        for (let i = bindings.length - 1; i >= 0; i--) {
            const { route: { component }, props } = bindings[i];
            Component = React.createElement(component as React.ComponentClass<{}>, props, Component!);
        }
        return Component!;
    }
}



export interface LinkProps {
    url: string;
    className?: string;
    loadingClassName?: string;
    activeClassName?: string;
    exact?: boolean;
    disabled?: boolean;
    stopPropagation?: boolean;
    htmlProps?: React.HTMLAttributes<{}>;
    onEnd?: () => void;
}

export interface LinkState {
    isLoading: boolean;
    isActive: boolean;
}

export class Link extends React.Component<LinkProps, LinkState> {
    context: { router: Router };
    static contextTypes = { router: PropTypes.object };
    state = {
        isLoading: false,
        isActive: false,
    }
    constructor(props: LinkProps, { router }: { router: Router }) {
        super(props);
        this.state.isActive = this.isActive(router, props);
    }
    isMount = false;
    afterUpdateDisposer: () => void;

    componentDidMount() {
        this.isMount = true;
        this.afterUpdateDisposer = this.context.router.afterUpdate.listen(() => {
            this.update(false);
        });
    }

    componentWillUnmount() {
        this.isMount = false;
        this.afterUpdateDisposer();
    }

    // shouldComponentUpdate(nextProps: LinkProps, nextState: LinkState) {
    // return this.state.isLoading !== nextState.isLoading || this.state.isActive !== nextState.isActive;
    // }

    onClick = (e: React.MouseEvent<{}>) => {
        if (e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !this.state.isLoading) {
            const { url, stopPropagation, onEnd } = this.props;
            var isLoading = true;
            this.context.router.changeUrl(url).then(() => {
                isLoading = false;
                if (this.isMount) {
                    this.update(false);
                    onEnd && onEnd();
                }
            }, err => {
                isLoading = false;
                if (this.isMount) {
                    this.update(false);
                }
                return Promise.reject(err);
            })
            setTimeout(() => {
                if (isLoading && this.isMount) {
                    this.update(true);
                }
            }, 70);
            if (stopPropagation) {
                e.stopPropagation();
            }
            e.preventDefault();
        }
    }

    isActive(router: Router, props: LinkProps) {
        const { url, exact = false } = props;
        const routeUrl = url;
        const currentUrl = router.getLastTransition().url;
        if (exact) {
            return currentUrl === routeUrl;
        }
        var routeUrlWithoutQuery = routeUrl.split('?')[0];
        return currentUrl.substring(0, routeUrlWithoutQuery.length) === routeUrlWithoutQuery;
    }

    update(isLoading: boolean) {
        if (this.isMount) {
            const { url, exact = false } = this.props;
            const routeUrl = url + '/';
            const isActive = this.isActive(this.context.router, this.props);
            this.setState({
                isLoading,
                isActive
            });
        }
    }

    render() {
        const { url, className = '', activeClassName = 'link--active', loadingClassName = 'link--loading', htmlProps, children } = this.props;
        const { isLoading, isActive } = this.state;
        const cls = 'link' + (isActive ? ` ${activeClassName}` : '') + (isLoading ? ` ${loadingClassName}` : '') + (className === '' ? '' : ' ' + className);
        const baseProps = { href: url, className: cls, onClick: this.onClick };
        const props = htmlProps === void 0 ? baseProps : { ...baseProps, ...htmlProps } as any;
        return React.createElement('a', props, children);
    }
}

export const browserScrollRestorator = {
    init() { history.scrollRestoration = 'manual' },
    get() { return window.scrollY; },
    set(pos: number) { window.scrollTo(0, pos); }
};
