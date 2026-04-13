type AbortMap = Record<string, AbortController>;

const createAbortSignalManager = () => {
  let controllers: AbortMap = {};

  const create = (key: string): AbortSignal => {
    if (has(key)) {
      controllers[key].abort();
    }
    const controller = new AbortController();
    controllers[key] = controller;
    return controller.signal;
  };

  const abort = (key?: string) => {
    if (key) {
      if (has(key)) {
        controllers[key].abort();
        delete controllers[key];
      }
      return;
    }
    for (const k in controllers) {
      controllers[k].abort();
    }
    reset();
  };

  const has = (key: string): boolean => {
    return key in controllers;
  };

  const reset = () => {
    controllers = {};
  };

  return {
    create,
    abort,
    has,
    reset,
  };
};

export const abortSignalManager = createAbortSignalManager();
