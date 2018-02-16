import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Router } from './Router';

export interface LinkProps extends React.HTMLAttributes<{}> {
    tag?: string;
    to: string | ((fromParams: {}) => string);
    className?: string;
    loadingClassName?: string;
    activeClassName?: string;
    exact?: boolean;
    disabled?: boolean;
    stopPropagation?: boolean;
    onEnd?: () => void;
}

export interface LinkState {
    isLoading: boolean;
    isActive: boolean;
}

export class Link extends React.PureComponent<LinkProps, LinkState> {
    context: { router: Router };
    static contextTypes = { router: PropTypes.object };
    state = {
        isLoading: false,
        isActive: false,
    };
    constructor(props: LinkProps, { router }: { router: Router }) {
        super(props);
    }
    isMount = false;
    afterUpdateDisposer: () => void;

    componentWillMount() {
        this.state.isActive = this.context.router.state.publicRouter !== void 0 && this.isActive();
    }

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

    getUrl() {
        const { to } = this.props;
        if (typeof to === 'function') {
            if (this.context.router.state.publicRouter === void 0) {
                return void 0;
            }
            return to(this.context.router.state.publicRouter.params);
        }
        return to;
    }

    onClick = (e: React.MouseEvent<{}>) => {
        if (e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !this.state.isLoading) {
            const { stopPropagation, onEnd } = this.props;
            if (stopPropagation) {
                e.stopPropagation();
            }
            e.preventDefault();
            const url = this.getUrl();
            if (url === void 0) return;
            let isLoading = true;
            this.context.router.changeUrl(url).then(
                () => {
                    isLoading = false;
                    if (this.isMount) {
                        this.update(false);
                        onEnd && onEnd();
                    }
                },
                err => {
                    isLoading = false;
                    if (this.isMount) {
                        this.update(false);
                    }
                    return Promise.reject(err);
                }
            );
            setTimeout(() => {
                if (isLoading && this.isMount) {
                    this.update(true);
                }
            }, 70);
        }
    };

    isActive() {
        const { exact = false } = this.props;
        const routeUrl = this.getUrl();
        const currentUrl = this.context.router.getState().url;
        if (exact) {
            return currentUrl === routeUrl;
        }
        const routeUrlWithoutQuery = routeUrl.split('?')[0];
        return currentUrl.substring(0, routeUrlWithoutQuery.length) === routeUrlWithoutQuery;
    }

    update(isLoading: boolean) {
        if (this.isMount) {
            const { exact = false } = this.props;
            const routeUrl = this.getUrl() + '/';
            const isActive = this.isActive();
            this.setState({
                isLoading,
                isActive,
            });
        }
    }

    render() {
        const {
            to,
            tag = 'a',
            className = '',
            activeClassName = 'link--active',
            loadingClassName = 'link--loading',
            children,
            onEnd,
            exact,
            stopPropagation,
            ...other
        } = this.props;
        const { isLoading, isActive } = this.state;
        const cls =
            'link' +
            (isActive ? ` ${activeClassName}` : '') +
            (isLoading ? ` ${loadingClassName}` : '') +
            (className === '' ? '' : ' ' + className);
        const url = this.getUrl();
        const props = { ...other, className: cls, onClick: this.onClick, href: tag === 'a' ? url : void 0 };
        return React.createElement(tag, props, children);
    }
}
