import * as React from 'react';
import * as PropTypes from 'prop-types';
import { InnerRoute, PublicRoute } from './Route';
import { Router, PublicRouter } from './Router';
import { Any, RouteProps } from './Helpers';

export class ViewComponent extends React.Component {}

export function createViewComponent(route: InnerRoute, component?: () => React.ComponentType<PublicRouter<Any>>): Any {
    return class View extends React.PureComponent<
        { component: React.ComponentType<PublicRouter<Any>> } | { children: React.ComponentType<PublicRouter<Any>> }
    > {
        //prettier-ignore
        context!: {router: Router}
        static contextTypes = { router: PropTypes.object };
        isActive = this.context.router.getState().route.hasParent(route);
        dispose = this.context.router.afterUpdate.listen(r => {
            const isActive = this.context.router.getState().route.hasParent(route);
            if (this.isActive !== isActive) {
                this.isActive = isActive;
                this.forceUpdate();
            }
        });
        componentWillUnmount() {
            this.dispose();
        }
        render() {
            if (!this.isActive) return null;
            let Component;
            const props = this.props as
                | { children: void; component: React.ComponentType<PublicRouter<Any>> }
                | { children: React.ComponentType<PublicRouter<Any>>; component: void };
            if (component !== void 0) {
                Component = component();
            } else if (typeof props.children === 'function') {
                Component = props.children;
            } else if (props.component !== void 0) {
                Component = props.component;
            } else {
                return null;
            }
            const { afterUpdate, beforeUpdate, params, redirect } = this.context.router;
            return React.createElement(Component, { afterUpdate, beforeUpdate, params, redirect });
        }
    };
}

export interface ViewProps<Params> {
    route: PublicRoute<Params>;
    children: React.ComponentType<Any>;
}

export class View<Params> extends React.PureComponent<ViewProps<Params>> {
    static contextTypes = { router: PropTypes.object };
    //prettier-ignore
    context!: {router: Router<Params>}
    getIsActive() {
        return this.context.router.getState().route.hasParent(this.props.route._route);
    }
    isActive = this.getIsActive();
    dispose = this.context.router.afterUpdate.listen(r => {
        const isActive = this.getIsActive();
        if (this.isActive !== isActive) {
            this.isActive = isActive;
            this.forceUpdate();
        }
    });
    componentWillUnmount() {
        this.dispose();
    }
    render() {
        if (!this.isActive) return null;
        let Component;
        const { children, route } = this.props;
        if (children === void 0 || children === null) return null;
        const { afterUpdate, beforeUpdate, params, redirect } = this.context.router;
        return React.createElement(children, { afterUpdate, beforeUpdate, params, redirect });
    }
}

// export interface RouteViewProps<Params> {
//     children: React.ComponentType<PublicRouter<Params>>;
// }
// export function RouteView<Params>(route: PublicRoute<Params>) {
//     return (class RouteView extends View<Params> {
//         static defaultProps = { route };
//     } as {}) as React.ComponentClass<RouteViewProps<Params>>;
// }
