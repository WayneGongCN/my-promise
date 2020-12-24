class Promise {
  constructor(executor) {
    this._status = 'pending'
    this._value = undefined
    this._fulfilledCallbacks = []
    this._rejectedCallbacks = []

    const resolvePromise = val => {
      if (this._status !== 'pending') return    // 2.1.2.1
      this._status = 'fulfilled'
      this._value = val
      this._fulfilledCallbacks.forEach(x => x())
    }

    const rejectPromise = val => {
      if (this._status !== 'pending') return    // 2.1.3.1
      this._status = 'rejected'
      this._value = val
      this._rejectedCallbacks.forEach(x => x())
    }

    try {
      executor(resolvePromise, rejectPromise)
    } catch (e) {
      rejectPromise(e)
    }
  }


  then(onFulfilled, onRejected) {
    const promise2 = new Promise((resolvePromise, rejectPromise) => {
      onFulfilled = typeof onFulfilled === 'function' ? tryCall(onFulfilled, rejectPromise) : value => value
      onRejected = typeof onRejected === 'function' ? tryCall(onRejected, rejectPromise) : value => { throw value }   // 2.2.7.4

      let cb = () => {
        const x = (this._status === 'fulfilled' ? onFulfilled : onRejected)(this._value)
        promiseResolution(promise2, x, resolvePromise, rejectPromise)
      }
      cb = tryCall(cb, rejectPromise)

      if (this._status === 'pending') {
        this._fulfilledCallbacks.push(() => setTimeout(cb))
        this._rejectedCallbacks.push(() => setTimeout(cb))
      } else {
        setTimeout(cb)
      }
    })

    return promise2
  }


  catch(onRejected) {
    return this.then(undefined, onRejected)
  }


  static defer() {
    let dfd = {};
    dfd.promise = new Promise((resolvePromise, rejectPromise) => {
      dfd.resolve = resolvePromise;
      dfd.reject = rejectPromise;
    });
    return dfd;
  }


  static deferred() {
    return Promise.defer()
  }
}


function promiseResolution(promise, x, resolvePromise, rejectPromise) {
  if (promise === x) return rejectPromise(new TypeError("2.3.1: If `promise` and `x` refer to the same object, reject `promise` with a `TypeError' as the reason."))  // 2.3.1

  if (x && (typeof x === 'object' || typeof x === 'function')) {
    let use = false
    try {
      let then = x.then   // 2.3.3.1
      // 2.3.3.3
      if (typeof then === 'function') {
        then.call(
          x,
          // 2.3.3.3.1
          y => {
            if (use) return
            use = true
            promiseResolution(promise, y, resolvePromise, rejectPromise)
          },
          // 2.3.3.3.2
          r => {
            if (use) return
            use = true
            rejectPromise(r)
          }
        )
      } else {
        resolvePromise(x)   // 2.3.3.4
      }
    } catch (e) {
      if (use) return
      use = true
      rejectPromise(e)
    }
  } else {
    resolvePromise(x)   // 2.3.4
  }
}


function tryCall(fn, handler) {
  return function (...args) {
    try {
      return fn(...args)
    } catch (e) {
      return handler(e)
    }
  }
}

module.exports = Promise;
