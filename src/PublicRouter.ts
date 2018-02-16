import { PublicRoute, InnerRoute } from './Route';
import { Listeners } from './Listeners';
import { UrlParams } from './Path';
import { Diff } from './Helpers';

export class PublicRouter<T = {}> {
    params: T;
    hash: string;
    url: string;
    route: InnerRoute;
    onCommitListener = new Listeners();
    constructor(route: InnerRoute, urlParams: UrlParams, private changeUrl: (url: string) => void) {
        this.route = route;
        this.url = urlParams.url;
        this.params = (urlParams.params as {}) as T;
        this.hash = urlParams.hash;
        this.redirect = this.redirect.bind(this);
    }
    onCommit(callback: () => void) {
        this.onCommitListener.listen(callback);
    }

    redirect<SubParams extends undefined>(route: PublicRoute<SubParams>, options?: {}): void;
    redirect<SubParams>(route: PublicRoute<SubParams>, params: Diff<T, SubParams & {}>, options?: {}): void;
    redirect(route: PublicRoute<any>, params: {}, options?: {}) {
        this.changeUrl(route.toUrl(params));
    }
}
