export class PromiseHandle<T = {}> {
    resolve: (value?: T) => void = undefined!;
    reject: (err: any) => void = undefined!;

    promise = new Promise<T>((_resolve, _reject) => {
        this.resolve = _resolve;
        this.reject = _reject;
    });
}

export class PromiseBox<T> {
    private promiseHandle?: PromiseHandle<T>;
    getPromise() {
        return this.promiseHandle !== void 0 ? this.promiseHandle.promise : Promise.resolve();
    }
    createIfEmpty() {
        if (this.promiseHandle === void 0) {
            this.promiseHandle = new PromiseHandle();
        }
    }
    resolve(value?: T) {
        if (this.promiseHandle !== void 0) {
            this.promiseHandle.resolve(value);
        }
        this.promiseHandle = undefined;
    }
    reject(err?: {}) {
        if (this.promiseHandle !== void 0) {
            this.promiseHandle.reject(err);
        }
        this.promiseHandle = undefined;
    }
}
