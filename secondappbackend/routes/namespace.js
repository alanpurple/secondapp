const router = require('express').Router();
const axios = require('axios');
//const spawn = require('child_process');

const KsInfo = require('../ksinfo.json');

const KsUrl = KsInfo.KS_AUTH_URL + 'v' + KsInfo.KS_IDENTITY_API_VERSION + '/';

const k8sClient = require('../k8s-init');
const k8sCore=k8sClient.core;
const k8sRbac=k8sClient.rbac;

router.all('*', ensureAuthenticated);

/*router.get('/sa/:account/:namespace', (req, res) => {
    const args = ['get', 'serviceaccount',
        req.params.account, '-n', req.params.namespace,
        '-o', 'json'];
    const kbctl = spawn('kubectl', args);
    kbctl.on('data', (data) => {

    })
})*/

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
        projects = response.data.projects.filter(elem => elem.is_wf && !elem.is_cluster);
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
    const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
    try {
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
        delete project.tags, delete project.options, delete project.links;
        if (project.is_cluster)
            res.sendStatus(404);
        else {
            delete project.tags, delete project.options, delete project.links;
            delete project.is_wf, delete project.is_cluster;
            res.send(project);
        }
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/:id/member', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin')) && !(req.user.roles?.includes('wf-tenant-admin'))) {
        res.sendStatus(401);
        return;
    }
    const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
    try {
        const response = await axios.get(KsUrl + 'users', {
            headers: {
                'x-auth-token': tokenId
            }
        });
        if (!response.data.users) {
            res.status(404).send('no user list found');
            return;
        }
        const users = response.data.users.filter(user => user.is_wf);
        const results = await Promise.all(users.map(async elem => {
            const nsRes = await axios.get(KsUrl + 'projects/' + req.params.id + '/users/' + elem.id + '/roles', {
                headers: {
                    'x-auth-token': req.user.tokenId2
                }
            });
            let result = { id: elem.id, name: elem.name };
            if (!nsRes.data.roles)
                result.roles = [];
            else {
                result.roles = nsRes.data.roles.filter(elem => elem.is_wf).map(elem => {
                    return {
                        id: elem.id,
                        name: elem.name
                    };
                });
            }
            return result;
        }));
        res.send(results);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.patch('/:id/member', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin')) && !(req.user.roles?.includes('wf-tenant-admin'))) {
        res.sendStatus(401);
        return;
    }
    if (!Array.isArray(req.body.add) || !Array.isArray(req.body.remove)) {
        res.status(400).send('add or remove should be at least an empty array');
        return;
    }
    const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
    try {
        req.body.add.forEach(user =>
            user.roles.forEach(async id =>
                await axios.put(KsUrl + 'projects/' + req.params.id + '/users/' + user.id + '/roles/' + id,
                    {}, {
                    headers: {
                        'x-auth-token': tokenId
                    }
                })));
        req.body.remove.forEach(user =>
            user.roles.forEach(async id =>
                await axios.delete(KsUrl + 'projects/' + req.params.id + '/users/' + user.id + '/roles/' + id,
                    {
                    headers: {
                        'x-auth-token': tokenId
                    }
                })));
        res.send('patch successful');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/switch/:name', async (req, res) => {
    try {
        const response = await axios.post(KsUrl + 'auth/tokens', {
            auth: {
                identity: {
                    methods: ['token'],
                    token: { id: req.user.tokenId2 }
                },
                scope: {
                    project: {
                        domain: { id: 'default' },
                        name: req.params.name
                    }
                }
            }
        });
        const data = response.data.token;
        req.user.default_project_id = data.project.id;
        req.user.default_project_name = data.project.name;
        req.user.roles = data.roles.map(elem => elem.name).filter(elem => /^wf\-/.test(elem));
        res.send({
            id: data.project.id,
            name: data.project.name,
            roles: req.user.roles
        });
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
    /*if (!('parent_id' in req.body)) {
        res.status(400).send('parent_id is missing.');
        return;
    }*/
    let project = req.body;
    project.is_wf = true;
    project.is_cluster = false;
    project.quota_cpu = project.quota.cpu;
    project.quota_mem = project.quota.memory;
    try {
        const tokenId = req.user.roles?.includes('wf-tenant-admin') ? req.user.admin_token : req.user.tokenId2;
        /*const clResponse = await axios.get(KsUrl + 'projects/' + project.parent_id, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        const parent = clResponse.data.project;
        if (!parent.is_wf || !parent.is_cluster) {
            res.status(400).send('invalid parent id');
            return;
        }*/
        const ksResponse = await axios.post(KsUrl + 'projects', {project:project}, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        let k8sRes = await k8sCore.createNamespace({ metadata: { name: project.name } });
        /*const quotaData = {
            apiVersion: "v1", kind: "ResourceQuota",
            metadata: { name: "compute-resources" },
            spec: {
                hard: {
                    "requests.cpu": project.quota_cpu+"Gi", "requests.memory": project.quota_mem+"G",
                    "limits.cpu": project.quota_cpu+"Gi",
                    "limits.memory": project.quota_mem+"G"
                }
            }   
        };
        k8sRes = await k8sCore.createNamespacedResourceQuota(project.name, quotaData);
        k8sRes = await k8sCore.createNamespacedLimitRange(project.name,{
            apiVersion:"v1",kind:"LimitRange",
            metadata:{
                name:'cpu-limit-range'
            },spec:{
                limits:[{
                        default:{cpu:1},
                        defaultRequest:{cpu:0.5},
                        type: 'Container'
                    }]
            }
        });
        k8sRes = await k8sCore.createNamespacedLimitRange(project.name,{
            apiVersion: 'v1', kind:'LimitRange',
            metadata:{
                name: 'cpu-limit-range'
            },spec:{
                limits:[{
                    default: { memory: '512Mi' },
                    defaultRequest: { memory:'256Mi' },
                    type: 'Container'
                    }]
            }
        });*/
        k8sRes = await k8sRbac.createNamespacedRoleBinding(project.name,{
            apiVersion: 'rbac.authorization.k8s.io/v1', 
            kind: 'RoleBinding',
            metadata: { 
                name: project.name + 'default_admin',
                namespace: project.name
            },
            subjects: [
                {
                    kind: 'ServiceAccount',
                    name: 'default', 
                    apiGroup: ''
                }
            ],
            roleRef: { 
                kind: 'ClusterRole',
                name: 'admin',
                apiGroup: 'rbac.authorization.k8s.io'
            }
        });
        k8sRes=await k8sCore.readNamespacedSecret('argo-artifacts','argo');
        let secretData = k8sRes.body.data;
        if (!('accesskey' in secretData) || !('secretkey' in secretData))
            throw new Error('not enough key');
        k8sRes = await k8sCore.createNamespacedSecret(project.name, {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: 'argo-artifacts'
            },
            type: 'Opaque',
            data: {
                accesskey: secretData.accesskey,
                secretkey: secretData.secretkey
            } 
        });
        res.send('namespace created successfully');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

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
        const project = response.data.project;
        if (!project.is_wf || project.is_cluster) {
            res.status(400).send('required id is not a valid namespace id');
            return;
        }
        const projectName = project.name;
        const ksResponse = await axios.delete(KsUrl + 'projects/' + req.params.id, {
            headers: {
                'x-auth-token': tokenId
            }
        });
        const k8sResponse = await k8sCore.deleteNamespace(projectName);
        res.send('namespace deleted');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/:id/users/:userid/roles', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin'))) {
        res.sendStatus(401);
        return;
    }
    try {
        const response = await axios.get(KsUrl + 'projects/' + req.params.id + '/users/' + req.params.userid+'/roles', {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        const roles = response.data.roles;
        if (!roles)
            res.sendStatus(204);
        else
            res.send(roles);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/:id/users/:userid/roles/:roleid', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin'))) {
        res.sendStatus(401);
        return;
    }
    try {
        const response = await axios.put(KsUrl + 'projects/' + req.params.id + '/users/' + req.params.userid + '/roles/' + req.params.roleid,
            {}, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        res.send('role added');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.delete('/:id/users/:userid/roles/:roleid', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin'))) {
        res.sendStatus(401);
        return;
    }
    try {
        const response = await axios.delete(KsUrl + 'projects/' + req.params.id + '/users/' + req.params.userid + '/roles/' + req.params.roleid, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        res.send('role deleted');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.head('/:id/users/:userid/roles/:roleid', async (req, res) => {
    if (!(req.user.roles?.includes('wf-app-admin'))) {
        res.sendStatus(401);
        return;
    }
    try {
        const response = await axios.head(KsUrl + 'projects/' + req.params.id + '/users/' + req.params.userid + '/roles/' + req.params.roleid, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        res.send(response.data.roles);
    }
    catch (err) {
        res.status(400).send(err);
    }
})


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