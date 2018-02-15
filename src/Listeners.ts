
export class Listeners<T> {
    protected listeners: ((value: T) => void)[] = [];

    listen(callback: (value: T) => void) {
        if (this.listeners.indexOf(callback) === -1) {
            this.listeners.push(callback);
        }
        return () => {
            const pos = this.listeners.indexOf(callback);
            if (pos > -1) {
                this.listeners.splice(pos, 1);
            }
        };
    }

    call(value: T) {
        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](value);
        }
    }
}