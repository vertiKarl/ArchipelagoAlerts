export enum Priority {
  LOW,
  CRITICAL,
}

type PriorityMap<T> = Record<Priority, T[]>;

export class Queue<T> extends EventTarget {
  private data: PriorityMap<T> = {
    [Priority.LOW]: [],
    [Priority.CRITICAL]: [],
  };
  private locked = false;

  /**
   * Adds an element to the queue
   * @param element The element to be added to the queue
   * @param priority The element's priority
   */
  push(element: T, priority: Priority) {
    this.data[priority].push(element);
    this.dispatchEvent(new Event("PushFrame"));
  }

  /**
   * Removes the first element from the queue.
   * @returns The first element pushed with the highest priority.
   */
  pop() {
    if (this.data[Priority.CRITICAL].length > 0) {
      return this.data[Priority.CRITICAL].splice(0, 1);
    } else if (!this.locked) {
      return this.data[Priority.LOW].splice(0, 1);
    }
  }

  /**
   * Locks the queue for pop() operations unless of critical priority
   * NOTE: This does not stop push() operations.
   */
  lock() {
    this.locked = true;
  }

  /**
   * Unlocks the queue for pop() operations of all priorities.
   */
  unlock() {
    this.locked = false;
  }

  /**
   * Checks if the queue is empty
   * @returns true if the queue is empty
   */
  empty() {
    return (
      this.data[Priority.CRITICAL].length === 0 &&
      this.data[Priority.LOW].length === 0
    );
  }
}
