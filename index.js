class Promise {
  constructor(executor) {
    this._status = 'pending'
    this._value = undefined
    this._fulfilledCallbacks = []
    this._rejectedCallbacks = []

    const resolvePromise = val => {
      // 2.1.2.1
      if (this._status !== 'pending') return
      this._status = 'fulfilled'
      this._value = val
      this._fulfilledCallbacks.forEach(x => x())
    }

    const rejectPromise = val => {
      // 2.1.3.1
      if (this._status !== 'pending') return
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
      // 2.2.7.4
      onRejected = typeof onRejected === 'function' ? tryCall(onRejected, rejectPromise) : value => { throw value }

      switch (this._status) {
        case 'pending':
          this._fulfilledCallbacks.push(() => {
            setTimeout(() => {
              // 2.2.7.4
              try {
                const x = (this._status === 'fulfilled' ? onFulfilled : onRejected)(this._value)
                promiseResolution(promise2, x, resolvePromise, rejectPromise)
              } catch (e) {
                rejectPromise(e)
              }
            })
          })
          this._rejectedCallbacks.push(() => {
            setTimeout(() => {
              try {
                const x = (this._status === 'fulfilled' ? onFulfilled : onRejected)(this._value)
                promiseResolution(promise2, x, resolvePromise, rejectPromise)
              } catch (e) {
                rejectPromise(e)
              }
            })
          })
          break
        case 'fulfilled':
        case 'rejected':
          setTimeout(() => {
            // 2.2.1.1
            try {
              const x = (this._status === 'fulfilled' ? onFulfilled : onRejected)(this._value)
              promiseResolution(promise2, x, resolvePromise, rejectPromise)
            } catch (e) {
              rejectPromise(e)
            }
          })
          break
      }
    })
    return promise2
  }


  catch(onRejected) {
    return this.then(null, onRejected)
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


function tryCall(fn, handler) {
  return function (...args) {
    try {
      return fn(...args)
    } catch (e) {
      handler(e)
    }
  }
}

function promiseResolution(promise, x, resolvePromise, rejectPromise) {
  // 2.3.1
  if (promise === x) {
    rejectPromise(new TypeError("2.3.1: If `promise` and `x` refer to the same object, reject `promise` with a `TypeError' as the reason."))
  }

  // 2.3.2
  if (x instanceof Promise) {
    x.then(resolvePromise)
    x.catch(rejectPromise)
  }

  // 2.3.3
  else if (x && (typeof x === 'object' || typeof x === 'function')) {
    // 2.3.3.1
    let then = x.then

    // 2.3.3.3
    if (typeof then === 'function') {
      try {
        then.call(
          x,
          // TODO: 2.3.3.3.1
          y => {
            promiseResolution(promise, y, resolvePromise, rejectPromise)
          },
          // 2.3.3.3.2
          r => {
            rejectPromise(r)
          }
        )
      } catch (e) {
        rejectPromise(x)
      }
    }

    // 2.3.3.4
    else {
      resolvePromise(x)
    }
  }

  // 2.3.4
  else {
    resolvePromise(x)
  }
}


// const promise = new Promise((r, j) => {
//     setTimeout(() => {
//         // r('value')
//         j('reason')
//     })
// })

// promise.then(console.log).then(null, console.error)

// console.log(promise)
module.exports = Promise;
