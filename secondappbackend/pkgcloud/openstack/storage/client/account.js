const crypto = require('crypto');

/**
 * client.getTemporaryUrlKey
 *
 * @description get the previously set temporaryUrl key on the current account
 *
 * @param callback
 */
exports.getTemporaryUrlKey = function (callback) {
    const self = this;

    this._request({
        method: 'HEAD'
    }, (err, body, res) => {
        if (err)
            return callback(err);

        const temporaryUrlKey = res.headers[self.ACCOUNT_META_PREFIX + 'temp-url-key'];
        callback(null, temporaryUrlKey);
    });

};

/**
 * client.setTemporaryUrlKey
 *
 * @description set a temporaryUrl key on the current account
 *
 * @param {String}     key     the secret key to be used in hmac signing temporary urls
 * @param callback
 */
exports.setTemporaryUrlKey = function (key, callback) {
    if (!key) {
        return process.nextTick(() =>
            callback(new Error('A temporary URL key must be provided')));
    }

    this._request({
        method: 'POST',
        headers: {
            'x-account-meta-temp-url-key': key
        }
    }, err => callback(err));
};

/**
 * client.generateTempUrl
 *
 * @description create a temporary url for GET/PUT to a cloud files container
 *
 * @param {String|object}     container     the container or container name for the url
 * @param {String|object}     file          the file or fileName for the url
 * @param {String}            method        either GET or PUT
 * @param {Number}            time          expiry for the url in seconds (from now)
 * @param {String}            key           the secret key to be used for signing the url
 * @param callback
 */
exports.generateTempUrl = function (container, file, method, time, key, callback) {
    const containerName = container instanceof this.models.Container ? container.name : container,
        fileName = file instanceof this.models.File ? file.name : file,
        self = this,
        split = '/v1';

    time = typeof time === 'number' ? time : parseInt(time);

    function createUrl() {
        // construct our hmac signature
        const expiry = parseInt(new Date().getTime() / 1000) + time,
            url = self._getUrl({
                container: containerName,
                path: fileName
            }),
            hmac_body = method.toUpperCase() + '\n' + expiry + '\n' + split + url.split(split)[1];

        const hash = crypto.createHmac('sha1', key).update(hmac_body).digest('hex');

        callback(null, url + '?temp_url_sig=' + hash + '&temp_url_expires=' + expiry);
    }

    // We have to be authed to make sure we have the service catalog
    // this is required to validate the service url

    if (!this._isAuthorized()) {
        return this.auth(err => {
            if (err)
                return callback(err);

            createUrl();
        });
    }

    createUrl();
};
