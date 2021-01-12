const router = require('express').Router();
const axios = require('axios');
//const spawn = require('child_process');

const KsInfo = require('../ksinfo.json');

const KsUrl = KsInfo.KS_AUTH_URL + '/v' + KsInfo.KS_IDENTITY_API_VERSION + '/';

router.all('*', ensureAuthenticated);

router.get('/', async (req, res) => {
    try {
        let response = null;
        if (req.user.roles.includes('wf-app-admin')) {
            // send all project for wf-app-admin
            response = await axios.get(KsUrl + 'projects', {
                headers: {
                    'x-auth-token': req.user.tokenId2
                }
            });
        }
        else {
            response = await axios.get(KsUrl + 'users/' + req.user.id + '/projects', {
                headers: {
                    'x-auth-token': req.user.tokenId2
                }
            });
        }
        projects = response.data.projects.filter(elem => elem.is_wf && elem.is_cluster);
        projects.forEach(elem => {
            delete elem.is_wf;
            delete elem.is_cluster;
            delete elem.tags;
            delete elem.options;
            delete elem.links;
        });
        res.send(projects);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/:id', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin')) && !(req.user.roles?.includes('wf-tenant-admin'))) {
        res.sendStatus(401);
        return;
    }
    try {
        const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
        const response = await axios.get(KsUrl + 'projects/' + req.params.id, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        let project = response.data.project;
        if (!(project?.is_wf)) {
            res.status(400).send('requested cluster is not properly set.(is_wf)');
            return;
        }
        if (!project.is_cluster)
            res.sendStatus(404);
        else {
            delete project.is_wf, delete project.is_cluster;
            delete project.tags, delete project.options, delete project.links;
            res.send(project);
        }
    }
    catch (err) {
        res.status(400).send(err);
    }
});

/**
 * get cluster by id
 */
router.get('/:id', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin')) && !(req.user.roles?.includes('wf-tenant-admin'))) {
        res.sendStatus(401);
        return;
    }
    try {
        const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
        const response = await axios.get(KsUrl + 'projects/' + req.params.id, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        let project = response.data.project;
        if (!(project.is_wf)) {
            res.status(400).send('requested cluster is not properly set.(is_wf)');
            return;
        }
        delete project.tags, delete project.options, delete project.links;
        if (project.is_cluster)
            res.send(project);
        else
            res.sendStatus(404);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin')) && !(req.user.roles?.includes('wf-tenant-admin'))) {
        res.sendStatus(401);
        return;
    }
    let project = req.body;
    project.is_wf = true;
    project.is_cluster = true;
    project.parent_id = 'default';
    try {
        const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
        const ksResponse = await axios.post(KsUrl + 'projects', { project: project }, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        
        //const k8sRes = await k8sClient.createNamespace(req.body);

        res.send(ksResponse.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

/**
 * delete using id
 */
router.delete('/:id', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin')) && !(req.user.roles?.includes('wf-tenant-admin'))) {
        res.sendStatus(401);
        return;
    }
    try {
        const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
        const response = await axios.get(KsUrl + 'projects/' + req.params.id, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        const project = reponse.data.project;
        if (!project.is_wf || !project.is_cluster) {
            res.status(400).send('required id is not a valid cluster id');
            return;
        }
        const projectName = project.name;
        const ksResponse = await axios.delete(KsUrl + 'projects/' + req.params.id, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        const k8sResponse = await k8sClient.deleteNamespace(projectName);
        res.send('namespace deleted');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

/**
 * hook for check authenticated
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Function} next
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (('tokenId' in req.user) && ('tokenId2' in req.user) && ('k8s_token' in req.user))
            next();
        else {
            console.error('authenticated but some tokens are missing');
            res.sendStatus(500);
        }
    }
    else res.sendStatus(401);
}
module.exports = router;