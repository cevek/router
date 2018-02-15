import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Router } from './Router';
import { PublicRoute, PublicRouteOpened } from './Route';
import { UrlHistory } from './History';

export interface RouterProviderProps {
    router: Router;
    isServerSide?: boolean;
}

export class RouterProvider extends React.PureComponent<RouterProviderProps, {}> {
    getChildContext() {
        return { router: this.props.router };
    }

    static childContextTypes = { router: PropTypes.object };

    render() {
        return React.createElement(React.Fragment, {}, this.props.children);
    }
}

