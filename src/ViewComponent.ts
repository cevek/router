import * as React from 'react';
import * as PropTypes from 'prop-types';
import { InnerRoute, PublicRoute } from './Route';
import { PublicRouter } from './PublicRouter';
import { Router } from './Router';
import { Any } from './Helpers';

export class ViewComponent extends React.Component {}

export function createViewComponent(
    route: InnerRoute,
    component?: () => React.ComponentType<PublicRouter>
): Any {
    return class View extends React.PureComponent<
        { component: React.ComponentType<PublicRouter<Any>> } | { children: React.ComponentType<PublicRouter<Any>> }
    > {
        router: Router = this.context.router;
        static contextTypes = { router: PropTypes.object };
        isActive = this.router.state.isRouteActive(route);
        dispose = this.router.afterUpdate.listen(r => {
            const isActive = this.router.state.isRouteActive(route);
            if (this.isActive !== isActive) {
                this.isActive = isActive;
                this.forceUpdate();
            }
        });
        componentWillUnmount() {
            this.dispose();
        }
        render() {
            console.log(this);
            if (!this.isActive) return null;
            const publicRouter = this.router.state.publicRouter;
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
            // const Component = component === void 0 ? this.props.component : component();
            return React.createElement(Component, publicRouter);
        }
    };
}
