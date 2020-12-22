class Promise {
    constructor(executor) {
        this._status = 'pending'
        this._value = undefined
        this._fulfilledCallbacks = []
        this._rejectedCallbacks = []

        try {
            executor(resolve, reject)
        } catch (e) {
            reject(e)
        }

        let self = this
        function resolve(val) {
            self._status = 'fulfilled'
            self._value = val
            self._fulfilledCallbacks.forEach(x => x())
        }

        function reject(val) {
            self._status = 'rejected'
            self._value = val
            self._rejectedCallbacks.forEach(x => x())
        }
    }

    then(onResolve, onReject) {
        onResolve = typeof onResolve === 'function' ? onResolve : value => value
        onReject = typeof onReject === 'function' ? onReject : value => value

        return new Promise((resolve, reject) => {
            switch (this._status) {
                case 'pending':
                    this._fulfilledCallbacks.push(asyncGenerator(this, resolve, reject, onResolve, onReject))
                    this._rejectedCallbacks.push(asyncGenerator(this, resolve, reject, onResolve, onReject))
                    break
                case 'fulfilled':
                case 'rejected':
                    asyncGenerator(this, resolve, reject, onResolve, onReject)()
                    break
            }
        })
    }

    catch(onReject) {
        this.then(null, onReject)
    }

    static defer() {
        let dfd = {};
        dfd.promise = new Promise((resolve, reject) => {
            dfd.resolve = resolve;
            dfd.reject = reject;
        });
        return dfd;
    }

    static deferred() {
        return Promise.defer()
    }
}


function asyncGenerator(prePromise, resolve, reject, onResolve, onReject) {
    return () => {
        setTimeout(() => {
            try {
                const cb = prePromise._status === 'fulfilled' ? onResolve : reject
                const res = cb(prePromise._value)

                if (res instanceof Promise) {
                    res.then(resolve).catch(reject)
                } else {
                    resolve(res)
                }
            } catch (e) {
                reject(e)
            }
        })
    }
}

module.exports = Promise;
