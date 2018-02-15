import * as React from 'react';
import * as PropTypes from 'prop-types';
import { InnerRoute, PublicRoute } from './Route';
import { PublicRouter } from './PublicRouter';
import { Router } from './Router';

export class ViewComponent extends React.Component {}

export function createViewComponent(route: InnerRoute, component?: () => React.ComponentClass<PublicRouter>) {
    return class View extends React.PureComponent<{ component: React.ComponentClass<PublicRouter<any>> }, {}> {
        router: Router = this.context.router;
        static contextTypes = { router: PropTypes.object };
        isActive = this.router.transition.isRouteActive(route);
        dispose = this.router.afterUpdate.listen(r => {
            const isActive = this.router.transition.isRouteActive(route);
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
            const publicRouter = this.router.transition.publicRouter;
            const Component = component === void 0 ? this.props.component : component();
            return React.createElement(Component, publicRouter);
        }
    };
}
