const router = require('express').Router();
const axios = require('axios');

const KsInfo = require('../ksinfo.json');

const KsUrl = KsInfo.KS_AUTH_URL + 'v' + KsInfo.KS_IDENTITY_API_VERSION + '/';
const ksUserUrl = KsUrl+ 'users';

router.all('*',ensureAuthenticated);

router.get('/checkname/:name',async (req,res)=>{
    try{
        const response=await axios.get(ksUserUrl, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        if (!response.data.users)
            // error in any case, there should be at least 1 user(admin)
            throw new Error('users not exist in response');
        const names=response.data.users.map(elem=>elem.name);
        if(names.includes(req.params.name))
            res.send(406);
        else
            res.send('available');
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.get('/', async (req, res) => {
    try {
        const response = await axios.get(ksUserUrl, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        if (!response.data.users)
            // error in any case, there should be at least 1 user(admin)
            throw new Error('users not exist in response');
        const usersData = response.data.users;
        if (usersData.length < 1) {
            res.sendStatus(204);
            return;
        }
        let users = usersData.filter(elem => elem.is_wf //&& ('default_project_id' in elem)
            && ('domain_id' in elem));
        if (users.length < 1) {
            res.sendStatus(204);
            return;
        }
        const users2 = users.map(elem => {
            return {
                id: elem.id,
                name: elem.name,
                description: elem.description,
                email: elem.email,
                primary_namespace_id: elem.default_project_id
            }
        });
        res.send(users2);
    }
    catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.get('/rolelist',(req,res)=>res.send(
    ['wf-app-admin','wf-app-viewer','wf-app-executor','wf-tenant-admin']
));

router.get('/admin', (req, res) => {
    /* if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    else if (!req.user.tokenId2) {
        res.status(401).send('second token needed');
        return;
    }
    else if (req.user.roles.includes('wf-app-admin'))
        res.send('admin ok');
    else
        res.status(401).send('not admin'); */
    res.send('yes, admin');
});

router.get('/:id', async (req, res) => {
    try {
        const response = await axios.get(ksUserUrl + '/' + req.params.id, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        if (!response.data.user) {
            res.sendStatus(404);
            return;
        }
        const userData = response.data.user;
        res.send({
            id: userData.id,
            name: userData.name,
            description: userData.description,
            enabled:userData.enabled,
            email: userData.email,
            primary_namespace_id: userData.default_project_id
        });
    }
    catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.post('/', async (req, res) => {
    if(!req.body.name||!req.body.email||!Array.isArray(req.body.role_ids)){
        res.status(400).send('some properties are missing.');
        return;
    }
    let user = {
        name:req.body.name,
        email:req.body.email,
        enabled:req.body.enabled,
        password: req.body.password,
        default_project_id:req.body.primary_namespace_id,
        is_wf:true
    };
    if(req.body.description)
        user.description=req.body.description;
    try {
        let response = await axios.post(ksUserUrl, { user: user }, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        const id=response.data.user.id;
        if(!response.data.user)
            throw new Error('somethings wrong, creation successful but no user data?');
        response=await axios.put(KsUrl + 'projects/' + req.body.primary_namespace_id + '/users/' + id + '/roles/' + req.body.role_ids[0],
            {}, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        res.send({id:id});
    }
    catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

router.get('/:id/namespace', async (req, res) => {
    try {
        const response = await axios.get(ksUserUrl + '/' + req.params.id + '/projects', {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        res.send(response.data);
    }
    catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const response = await axios.patch(ksUserUrl + '/' + req.params.id, { user: req.body }, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        res.send('user info updated');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const reponse = await axios.delete(ksUserUrl + '/' + req.params.id, {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        res.send('user deleted');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

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