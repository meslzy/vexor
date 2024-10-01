class Factory<T> {
  store: T[] = [];

  get offset() {
    return this.store.length;
  }

  get empty() {
    return this.store.length === 0;
  }

  has = (index: number) => {
    return this.store[index] !== undefined;
  };

  at = (index: number) => {
    return this.store[index];
  };

  extend = (item: T) => {
    if (!item) {
      return this;
    }

    const factory = new Factory<T>();
    factory.store = [...this.store, item];
    return factory;
  };

  upextend = (item: T) => {
    if (!item) {
      return this;
    }

    const factory = new Factory<T>();
    factory.store = [item, ...this.store];
    return factory;
  };

  resolve = (offset: number, start = 0) => {
    return this.store.slice(start, offset);
  };
}

class FactoryManager<T> {
  factory: Factory<T>;
  lastOffset = 0;

  constructor(factory: Factory<T>) {
    this.factory = factory;
  }

  apply = (offset: number, applyer: (values: T[]) => Promise<any>) => {
    const slice = this.factory.resolve(offset, this.lastOffset);

    this.lastOffset = offset;

    return applyer(slice);
  };

  canApply = (newOffset: number) => {
    if (this.factory.empty) {
      return false;
    }

    return newOffset > this.lastOffset;
  };
}

export {
  Factory,
  FactoryManager,
};
