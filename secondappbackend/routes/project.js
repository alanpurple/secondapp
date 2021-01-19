const router = require('express').Router();
const axios = require('axios');

const KsInfo = require('../ksinfo.json');

const KsUrl = KsInfo.KS_AUTH_URL + '/v' + KsInfo.KS_IDENTITY_API_VERSION;
const ksAuthUrl = KsUrl + '/auth/';

router.get('/', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    else if (!req.user.tokenId) {
        console.error('somethings wrong, tokenId doesn\'t exist');
        res.sendStatus(500);
        return;
    }
    try {
        const response = await axios.get(KsUrl + '/projects', {
            headers: {
                'x-auth-token': req.user.tokenId
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(500).send(err);
    }
});


/**
 * Get project(namespace or cluster) by id, admin util
 */
router.get('/:id', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    else if (!req.user.roles.includes('wf-app-admin') &&
        !req.user.roles.includes('wf-tenant-admin')){
        res.sendStatus(401);
        return;
    }
    try {
        const response = await axios.get(ksAuthUrl+'tokens',
            {
                auth: {
                    identity: {
                        methods: ['token'],
                        token: {
                            id: req.user.tokenId
                        }
                    },
                    scope: {
                        project: {
                            id: req.params.id
                        }
                    }
                }
            },
            {
                headers: {
                    'x-auth-token': req.user.tokenId
                }
            })
        res.send(response.data);
    }
    catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;