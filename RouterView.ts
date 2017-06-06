import * as React from 'react';
import * as PropTypes from 'prop-types';
import {Router} from './Router';
import {RouteTransition} from './RouterTransition';
export interface RouterViewProps {
    router: Router;
    isServerSide?: boolean
}

export class RouterView extends React.Component<RouterViewProps, {}> {
    componentWillMount() {
        if (!this.props.isServerSide) {
            this.props.router.urlDidMount.addListener(this.onUrlDidMount);
        }
    }

    componentDidMount() {
        if ('scrollRestoration' in window.history) {
            (window.history as any).scrollRestoration = 'manual';
        }
        this.props.router.urlWillMount.addListener(this.onUrlWillMount);
    }

    onUrlWillMount = (transition: RouteTransition) => {
        // transition.prevUrl.localState.set('scrollPos', window.scrollY);
    };

    onUrlDidMount = (transition: RouteTransition) => {
        // const scrollPos = transition.url.localState.get('scrollPos') || 0;
        // todo:
        const scrollPos = 0;
        window.scrollTo(window.scrollX, scrollPos);
        this.forceUpdate();
    };

    getChildContext() {
        return {router: this.props.router};
    }

    static childContextTypes = {router: PropTypes.object};

    render() {
        const routes = this.props.router.routeStack;
        let Component: React.ReactElement<{}> | null = null;
        for (let i = routes.length - 1; i >= 0; i--) {
            const route = routes[i];
            const enterData = this.props.router.routeStackEnterData[i];
            Component = React.createElement(route.component as React.ComponentClass<{}>, enterData, Component!);
        }
        return Component!;
    }
}
