import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Router } from './Router';
import { RouteToUrl } from './Route';

export interface LinkProps extends React.HTMLAttributes<{}> {
    tag?: string;
    to: RouteToUrl;
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
    static contextTypes = { router: PropTypes.object };
    router: Router = this.context.router;

    state = {
        isLoading: false,
        isActive: false,
    };

    isMount = true;

    afterUpdateDisposer = this.context.router.afterUpdate.listen(() => {
        this.update(false);
    });

    componentWillMount() {
        this.state.isActive = this.isActive();
    }

    componentWillUnmount() {
        this.isMount = false;
        this.afterUpdateDisposer();
    }

    getUrl() {
        const { to } = this.props;
        return this.router.toUrl(to.route, to.params, to.options);
    }

    onClick = (e: React.MouseEvent<{}>) => {
        if (e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const { stopPropagation, onEnd } = this.props;
            if (stopPropagation) {
                e.stopPropagation();
            }
            e.preventDefault();
            const url = this.getUrl();
            if (url === void 0) return;
            let isLoading = true;
            this.router.redirect(url).then(
                () => {
                    isLoading = false;
                    this.update(false);
                },
                err => {
                    isLoading = false;
                    this.update(false);
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
        const { to, exact } = this.props;
        const activeRoute = this.router.getState().route;
        const currentRoute = to.route._route;
        return (
            (exact === true ? activeRoute === currentRoute : activeRoute.hasParent(currentRoute)) &&
            this.router.isCurrentRouteHasSameParams(currentRoute, to.params)
        );
    }

    update(isLoading: boolean) {
        if (this.isMount) {
            const { onEnd } = this.props;
            const isActive = this.isActive();
            this.setState({
                isLoading,
                isActive,
            });
            if (!isLoading) {
                onEnd && onEnd();
            }
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
