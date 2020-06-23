/**
 * @file
 * Handles communication with FBS through SIP2.
 */

'use strict';

const util = require('util');
const eventEmitter = require('events').EventEmitter;
const Q = require('q');
const uniqid = require('uniqid');
const debug = require('debug')('bibbox:FBS:main');
const Request = require('./request.js');

/**
 * Default constructor.
 *
 * @param bus
 *   The event bus.
 * @param config
 *   The FBS configuration.
 *
 * @constructor
 */
var FBS = function FBS(bus, config) {
    this.bus = bus;
    this.config = config;
};

// @TODO: Why is this necessary?
// Extend the object with event emitter.
util.inherits(FBS, eventEmitter);

/**
 * Create new FBS object.
 *
 * Static factory function to create FBS object with loaded config. This pattern
 * used to fix race conditions and to ensure that we have an constructor
 * without side-effects.
 *
 * @param bus
 *   The event bus
 *
 * @returns {*|promise}
 *   Promise that the FBS object is created with configuration.
 */
FBS.create = function create(bus) {
    const deferred = Q.defer();
    const busEvent = 'fbs.config.loaded' + uniqid();
    const errorEvent = 'fbs.config.error' + uniqid();

    bus.once(busEvent, (config) => {
        deferred.resolve(new FBS(bus, config));
    });

    bus.once(errorEvent, (err) => {
        deferred.reject(err);
    });

    bus.emit('ctrl.config.fbs', {
        busEvent: busEvent,
        errorEvent: errorEvent
    });

    return deferred.promise;
};

/**
 * Send status message to FBS.
 */
FBS.prototype.libraryStatus = function libraryStatus() {
    const deferred = Q.defer();

    const req = new Request(this.bus, this.config);
    req.libraryStatus((err, response) => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(response);
        }
    });

    return deferred.promise;
};

/**
 * Login check.
 *
 * @param username
 *   Username for the patron (card or CPR number).
 * @param password
 *   The patrons password.
 *
 * @return {*|promise}
 *   TRUE if valid else FALSE.
 */
FBS.prototype.login = function login(username, password) {
    const deferred = Q.defer();
    const bus = this.bus;

    const req = new Request(this.bus, this.config);
    req.patronStatus(username, password, (err, res) => {
        debug(err, res);
        if (err) {
            deferred.reject(err);
        } else {
            // Check that the user is valid.
            const valid = res.validPatron === 'Y' && res.validPatronPassword === 'Y';

            // If user is valid check for blocking codes.
            if (valid) {
                if (res.patronStatus.chargePrivDenied && res.patronStatus.renewalPrivDenied &&
                    res.patronStatus.recallPrivDenied && res.patronStatus.holdPrivDenied) {
                    deferred.reject(new Error('login.invalid_login_blocked'));
                } else {
                    deferred.resolve();
                }
            } else {
                deferred.reject(new Error('login.invalid_login_error'));
            }
        }
        bus.emit('fbs.action.result', 'Login', !!err);
    });

    return deferred.promise;
};

/**
 * Get all available information about a patron.
 *
 * @param username
 *   Username for the patron (card or CPR number).
 * @param password
 *   The patrons password.
 *
 * @return {*|promise}
 *   JSON object with information or FALSE on failure.
 */
FBS.prototype.patronInformation = function patronInformation(username, password) {
    const deferred = Q.defer();
    const bus = this.bus;

    const req = new Request(this.bus, this.config);
    req.patronInformation(username, password, (err, res) => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
        bus.emit('fbs.action.result', 'Patron Information', !!err);
    });

    return deferred.promise;
};

/**
 * Checkout (loan) item.
 *
 * @param username
 *   Username for the patron (card or CPR number).
 * @param password
 *   The patrons password.
 * @param itemIdentifier
 *   The item to checkout.
 * @param noBlockDueDate
 *   Timestamp for the time the book should be returned (when noBlock is true).
 * @param {bool} noBlock
 *   If true the request can not be blocked by the library system.
 * @param {number} transactionDate
 *   Timestamp for when the user preformed the action.
 *
 * @return {*|promise}
 *   JSON object with information or error message on failure.
 */
FBS.prototype.checkout = function checkout(username, password, itemIdentifier, noBlockDueDate, noBlock, transactionDate) {
    const deferred = Q.defer();
    const bus = this.bus;

    const req = new Request(this.bus, this.config);
    req.checkout(username, password, itemIdentifier, noBlockDueDate, noBlock, transactionDate, (err, res) => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
        bus.emit('fbs.action.result', 'Checkout', !!err);
    });

    return deferred.promise;
};

/**
 * Check-in (return) item.
 *
 * @param itemIdentifier
 *   The item to checkout.
 * @param checkedInDate
 *   Timestamp for the time that the item was returned.
 * @param {bool} noBlock
 *   If true the request can not be blocked by the library system.
 *
 * @return {*|promise}
 *   JSON object with information or error message on failure.
 */
FBS.prototype.checkIn = function checkIn(itemIdentifier, checkedInDate, noBlock) {
    const deferred = Q.defer();
    const bus = this.bus;

    const req = new Request(this.bus, this.config);
    req.checkIn(itemIdentifier, checkedInDate, noBlock, (err, res) => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
        bus.emit('fbs.action.result', 'Checkin', !!err);
    });

    return deferred.promise;
};

/**
 * Renew item.
 *
 * @param username
 *   Username for the patron (card or CPR number).
 * @param password
 *   The patrons password.
 * @param itemIdentifier
 *   The item to renew.
 *
 * @return {*|promise}
 *   JSON object with information or error message on failure.
 */
FBS.prototype.renew = function renew(username, password, itemIdentifier) {
    const deferred = Q.defer();
    const bus = this.bus;

    const req = new Request(this.bus, this.config);
    req.renew(username, password, itemIdentifier, (err, res) => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
        bus.emit('fbs.action.result', 'Renew', !!err);
    });

    return deferred.promise;
};

/**
 * Renew all items.
 *
 * @param username
 *   Username for the patron (card or CPR number).
 * @param password
 *   The patrons password.
 *
 * @return {*|promise}
 *   JSON object with information or error message on failure.
 */
FBS.prototype.renewAll = function renewAll(username, password) {
    const deferred = Q.defer();
    const bus = this.bus;

    const req = new Request(this.bus, this.config);
    req.renewAll(username, password, (err, res) => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
        bus.emit('fbs.action.result', 'Renew All', !!err);
    });

    return deferred.promise;
};

/**
 * Block patron.
 *
 * @param username
 *   Username for the patron (card or CPR number).
 * @param reason
 *   Reason for blocking user.
 *
 * @return {*|promise}
 *   JSON object with information or error message on failure.
 */
FBS.prototype.block = function block(username, reason) {
    const deferred = Q.defer();
    const bus = this.bus;

    const req = new Request(this.bus, this.config);
    req.blockPatron(username, reason, (err, res) => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
        bus.emit('fbs.action.result', 'Block', !!err);
    });

    return deferred.promise;
};

/**
 * Register the plugin with architect.
 *
 * @param {array} options
 *   Options defined in app.js.
 * @param {array} imports
 *   The other plugins available.
 * @param {function} register
 *   Callback function used to register this plugin.
 */
module.exports = function(options, imports, register) {
    const bus = imports.bus;

    // Defines the configuration for the online checker below.
    const onlineState = {
        online: true,
        threshold: 5,
        successfulOnlineChecks: 5,
        onlineTimeout: 5000,
        offlineTimeout: 30000,
        ensureOnlineCheckTimeout: 300000
    };

    let checkOnlineStateTimeout = null;
    let ensureCheckOnlineStateTimeout = null;

    /**
     * Online checker.
     *
     * State machine that handles the FBS online/offline state.
     */
    const checkOnlineState = () => {
        // Clear extra timeout, to make sure only one is running.
        if (ensureCheckOnlineStateTimeout != null) {
            clearTimeout(ensureCheckOnlineStateTimeout);
        }

        // Start extra timeout.
        ensureCheckOnlineStateTimeout = setTimeout(checkOnlineState, onlineState.onlineTimeout + onlineState.ensureOnlineCheckTimeout);

        // Make sure only one checkOnlineStateTimeout is running.
        if (checkOnlineStateTimeout != null) {
            clearTimeout(checkOnlineStateTimeout);
            checkOnlineStateTimeout = null;
        }

        // Start online checker for FBS servers.
        FBS.create(bus).then(function(fbs) {
            // Update configuration - It's done here to ensure it reflects updated
            // configuration from the admin UI.
            onlineState.threshold = Object.prototype.hasOwnProperty.call(fbs, 'onlineState') ? fbs.config.onlineState.threshold : onlineState.threshold;
            onlineState.onlineTimeout = Object.prototype.hasOwnProperty.call(fbs, 'onlineState') ? fbs.config.onlineState.onlineTimeout : onlineState.onlineTimeout;
            onlineState.offlineTimeout = Object.prototype.hasOwnProperty.call(fbs, 'onlineState') ? fbs.config.onlineState.offlineTimeout : onlineState.offlineTimeout;

            // Check that config exists.
            if (fbs.config && Object.prototype.hasOwnProperty.call(fbs, 'endpoint')) {
                fbs.libraryStatus().then(
                    res => {
                        // Listen to online check event send below.
                        if (Object.prototype.hasOwnProperty.call(res, 'onlineState') && res.onlineStatus) {
                            if (onlineState.successfulOnlineChecks >= onlineState.threshold) {
                                // FBS is online and threshold has been reached, so state online.
                                checkOnlineStateTimeout = setTimeout(checkOnlineState, onlineState.onlineTimeout);
                                onlineState.online = true;
                            } else {
                                // FBS online but threshold _not_ reached, so state offline.
                                onlineState.successfulOnlineChecks++;
                                onlineState.online = false;
                                checkOnlineStateTimeout = setTimeout(checkOnlineState, onlineState.offlineTimeout);
                            }
                        } else {
                            // FBS is offline, so it the state.
                            onlineState.successfulOnlineChecks = 0;
                            onlineState.online = false;
                            checkOnlineStateTimeout = setTimeout(checkOnlineState, onlineState.offlineTimeout);
                        }

                        // Send state event into the bus.
                        const eventName = onlineState.online ? 'fbs.online' : 'fbs.offline';
                        bus.emit(eventName, {
                            timestamp: new Date().getTime(),
                            online: onlineState
                        });
                    },
                    () => {
                        // Error connecting to FBS.
                        onlineState.online = false;
                        onlineState.successfulOnlineChecks = 0;
                        checkOnlineStateTimeout = setTimeout(checkOnlineState, onlineState.offlineTimeout);
                        bus.emit('fbs.offline', {
                            timestamp: new Date().getTime(),
                            online: onlineState
                        });
                    }
                );
            } else {
                // FBS not configured, so state offline.
                onlineState.online = false;
                onlineState.successfulOnlineChecks = 0;
                checkOnlineStateTimeout = setTimeout(checkOnlineState, onlineState.offlineTimeout);
                bus.emit('fbs.offline', {
                    timestamp: new Date().getTime(),
                    online: onlineState
                });
            }
        },
        () => {
            bus.emit('logger.info', 'checkOnlineState: FBS.create(bus) promise failed. Retrying.');

            // Retry check.
            checkOnlineStateTimeout = setTimeout(checkOnlineState, onlineState.offlineTimeout);
        });
    };

    /**
     * Listen to login requests.
     */
    bus.on('fbs.login', data => {
        FBS.create(bus).then(
            fbs => {
                fbs.login(data.username, data.password).then(
                    () => {
                        bus.emit(data.busEvent, {
                            timestamp: new Date().getTime()
                        });
                    },
                    err => {
                        bus.emit(data.errorEvent, err);
                    }
                );
            },
            err => {
                bus.emit(data.errorEvent, err);
            }
        );
    });

    /**
     * Listen to library status requests.
     */
    bus.on('fbs.library.status', data => {
        FBS.create(bus).then(fbs => {
            fbs.libraryStatus().then(res => {
                bus.emit(data.busEvent, {
                    timestamp: new Date().getTime(),
                    results: res
                });
            },
            err => {
                bus.emit(data.errorEvent, err);
            }
            );
        },
        err => {
            bus.emit(data.errorEvent, err);
        });
    });

    /**
     * Listen to patron status requests.
     */
    bus.on('fbs.patron', data => {
        FBS.create(bus).then(fbs => {
            fbs.patronInformation(data.username, data.password).then(status => {
                bus.emit(data.busEvent, {
                    timestamp: new Date().getTime(),
                    patron: status
                });
            },
            err => {
                bus.emit(data.errorEvent, err);
            }
            );
        },
        err => {
            bus.emit(data.errorEvent, err);
        });
    });

    /**
     * Listen to checkout requests.
     */
    bus.on('fbs.checkout', data => {
        // Check if this is a processing of offline queue.
        data.queued = data.queued || false;

        // Set noBlock due date if not set. This due data is ignored if the noBlock
        // field is false. So we set it to expire in 31 days into the future, so if
        // this gets into the offline queue and gets noBlocked the date is set.
        if (!Object.prototype.hasOwnProperty.call(data, 'noBlockDueDate')) {
            data.noBlockDueDate = new Date().getTime() + 2678400000;
        }

        // Ensure that the noBlock parameter to FBS is set to 'N' as default.
        // NoBlock have been added in a later release an may not be in all
        // request.
        const noBlock = Object.prototype.hasOwnProperty.call(data, 'noBlock') ? data.noBlock : false;

        // Set transaction date if not set already (offline queued item will have
        // the date already).
        data.transactionDate = data.transactionDate || new Date().getTime();

        // Create FBS object and send checkout request.
        FBS.create(bus).then(fbs => {
            fbs.checkout(
                data.username,
                data.password,
                data.itemIdentifier,
                data.noBlockDueDate,
                noBlock,
                data.transactionDate
            ).then(res => {
                bus.emit(data.busEvent, {
                    timestamp: new Date().getTime(),
                    result: res
                });
            },
            err => {
                if (err.message === 'FBS is offline' && data.queued === false) {
                    const material = {
                        itemIdentifier: data.itemIdentifier,
                        offline: true,
                        ok: '1',
                        itemProperties: {
                            id: data.itemIdentifier,
                            title: 'fbs.offline.title'
                        },
                        dueDate: data.noBlockDueDate
                    };

                    bus.once('fbs.checkout.offline.stored' + data.itemIdentifier, () => {
                        bus.emit(data.busEvent, {
                            timestamp: new Date().getTime(),
                            result: material
                        });
                    });

                    bus.once('fbs.checkout.offline.error' + data.itemIdentifier, err => {
                        bus.emit(data.errorEvent, err);
                    });

                    // Store for later processing.
                    const file = data.username;
                    bus.emit('storage.append', {
                        type: 'offline',
                        name: file,
                        obj: {
                            date: data.checkedInDate,
                            action: 'checkout',
                            username: data.username,
                            password: data.password,
                            itemIdentifier: data.itemIdentifier
                        },
                        lockFile: true,
                        busEvent: 'fbs.checkout.offline.stored' + data.itemIdentifier,
                        errorEvent: 'fbs.checkout.offline.error' + data.itemIdentifier
                    });

                    // Add to job queue.
                    data.file = file;
                    bus.emit('offline.add.checkout', data);
                } else {
                    debug(err);
                    bus.emit(data.errorEvent, err);
                }
            }
            );
        },
        err => {
            debug(err);
            bus.emit(data.errorEvent, err);
        });
    });

    /**
     * Listen to checkIn requests.
     */
    bus.on('fbs.checkin', data => {
        // Check if this is a processing of offline queue.
        data.queued = data.queued || false;

        // Set checked-in date if not set.
        data.checkedInDate = data.checkedInDate || new Date().getTime();

        // Create FBS object and send check-in request.
        FBS.create(bus).then(fbs => {
            // Ensure that the noBlock parameter to FBS is set to 'N' as default.
            // NoBlock have been added in a later release an may not the be in all
            // request.
            const noBlock = Object.prototype.hasOwnProperty.call(data, 'noBlock') ? data.noBlock : false;

            // Perform the checking request.
            fbs.checkIn(
                data.itemIdentifier,
                data.checkedInDate,
                noBlock
            ).then(res => {
                bus.emit(data.busEvent, {
                    timestamp: new Date().getTime(),
                    result: res
                });
            },
            err => {
                if (err.message === 'FBS is offline' && data.queued === false) {
                    const material = {
                        itemIdentifier: data.itemIdentifier,
                        offline: true,
                        ok: '1',
                        itemProperties: {
                            id: data.itemIdentifier,
                            title: 'fbs.offline.title'
                        }
                    };

                    bus.once('fbs.checkin.offline.stored' + data.itemIdentifier, res => {
                        bus.emit(data.busEvent, {
                            timestamp: new Date().getTime(),
                            result: material
                        });
                    });

                    bus.once('fbs.checkin.offline.error' + data.itemIdentifier, err => {
                        bus.emit(data.errorEvent, err);
                    });

                    // Store for later processing.
                    const file = data.transaction;
                    bus.emit('storage.append', {
                        type: 'offline',
                        name: file,
                        obj: {
                            action: 'checkin',
                            date: data.checkedInDate,
                            itemIdentifier: data.itemIdentifier
                        },
                        lockFile: true,
                        busEvent: 'fbs.checkin.offline.stored' + data.itemIdentifier,
                        errorEvent: 'fbs.checkin.offline.error' + data.itemIdentifier
                    });

                    // Add to job queue.
                    data.file = file;
                    bus.emit('offline.add.checkin', data);
                } else {
                    debug(err);
                    bus.emit(data.errorEvent, err);
                }
            }
            );
        },
        err => {
            debug(err);
            bus.emit(data.errorEvent, err);
        });
    });

    /**
     * Listen to renew requests.
     */
    bus.on('fbs.renew', data => {
        FBS.create(bus).then(fbs => {
            fbs.renew(data.username, data.password, data.itemIdentifier)
                .then(res => {
                    bus.emit(data.busEvent, {
                        timestamp: new Date().getTime(),
                        result: res
                    });
                },
                err => {
                    bus.emit(data.errorEvent, err);
                });
        },
        err => {
            bus.emit(data.errorEvent, err);
        }
        );
    });

    /**
     * Listen to renew all requests.
     */
    bus.on('fbs.renew.all', data => {
        FBS.create(bus).then(fbs => {
            fbs.renewAll(data.username, data.password).then(res => {
                bus.emit(data.busEvent, {
                    timestamp: new Date().getTime(),
                    result: res
                });
            },
            err => {
                bus.emit(data.errorEvent, err);
            });
        },
        err => {
            bus.emit(data.errorEvent, err);
        }
        );
    });

    /**
     * Listen to block patron requests.
     */
    bus.on('fbs.block', data => {
        FBS.create(bus).then(fbs => {
            fbs.block(data.username, data.reason).then(res => {
                bus.emit(data.busEvent, {
                    timestamp: new Date().getTime(),
                    result: res
                });
            },
            err => {
                bus.emit(data.errorEvent, err);
            });
        },
        err => {
            bus.emit(data.errorEvent, err);
        }
        );
    });

    // Create FBS object to use in tests.
    FBS.create(bus).then(
        fbs => {
            if (fbs.config.enableOnlineChecks) {
                // Start the online checker.
                checkOnlineState();
            }

            register(null, {
                fbs: fbs
            });
        },
        err => {
            if (err instanceof Error) {
                err = err.toString();
            }
            bus.emit('logger.err', { type: 'FBS', message: err });
            register(null, {
                fbs: null
            });
        }
    );

    debug('Registered plugin');
};