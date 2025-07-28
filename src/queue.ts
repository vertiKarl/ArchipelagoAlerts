export class Queue<T> extends EventTarget {
    data: T[] = [];

    push(frame: T) {
        this.data.push(frame);
        this.dispatchEvent(new Event("PushFrame"));
    }

    pop() {
        return this.data.splice(0, 1);
    }

    empty() {
        return this.data.length === 0;
    }
}