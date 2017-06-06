export type Callback<T> = (value: T) => void;
export class Listeners<T> {
    protected listeners = new Set<Callback<T>>();
    protected value: T;

    addListener(callback: Callback<T>) {
        this.listeners.add(callback);
    }

    removeListener(callback: Callback<T>) {
        this.listeners.delete(callback);
    }

    protected call(callback: Callback<T>) {
        callback(this.value);
    }

    emit(value: T) {
        this.value = value;
        this.listeners.forEach(this.call, this);
    }

    constructor() {}
}