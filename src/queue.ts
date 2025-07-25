export class Queue<T> {
    data: T[] = [];

    push(frame: T) {
        this.data.push(frame);
    }

    pop() {
        return this.data.splice(0, 1);
    }
}