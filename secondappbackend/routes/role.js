const router = require('express').Router();
const axios = require('axios');

const KsInfo = require('../ksinfo.json');

const KsRoleUrl = KsInfo.KS_AUTH_URL + '/v' + KsInfo.KS_IDENTITY_API_VERSION + '/roles';

router.all('*', ensureAuthenticated);

router.get('/', async (req, res) => {
    const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
    try {
        const response = await axios.get(KsRoleUrl, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        // only workflow role is required
        let roles = response.data.roles.filter(elem => elem.is_wf);
        if (roles.length == 0) {
            res.send(204);
            return;
        }
        roles.forEach(elem => {
            delete elem.is_wf;
            delete elem.options;
            delete elem.links;
        });
        res.send(roles);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/:id', async (req, res) => {
    const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
    try {
        const response = await axios.get(KsRoleUrl + '/' + req.params.id, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        let role = response.data.role;
        delete role.is_wf, delete role.options, delete role.links;
        res.send(role);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// Caution.  different from the one from other api namespace
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (('tokenId' in req.user) && ('tokenId2' in req.user) && ('k8s_token' in req.user)) {
            if (!(req.user.roles?.includes('wf-app-admin')) && !(req.user.roles?.includes('wf-tenant-admin')))
                res.sendStatus(401);
            else
                next();
        }
        else {
            console.error('authenticated but some tokens are missing');
            res.sendStatus(500);
        }
    }   
    else res.sendStatus(401);
}

module.exports = router;