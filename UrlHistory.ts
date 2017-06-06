
import {Listeners} from './Listeners';
export abstract class UrlHistory {
    abstract history: History;
    urlChanged = new Listeners<string>();

    abstract getCurrentUrl(): string;

    constructor() {
        this.listen();
    }

    abstract listen(): void;

    protected onPopState = () => {
        this.urlChanged.emit(this.getCurrentUrl());
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
        back(){},
        forward(){},
        go(){},
        pushState(){},
        replaceState(){},
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

