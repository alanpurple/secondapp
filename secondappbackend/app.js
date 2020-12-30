'use strict';
const debug = require('debug');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const axios = require('axios');
const session = require('express-session');
const SqlStore = require('express-mysql-session')(session);
const passport = require('passport');
//const fernet = require('fernet');

const KsInfo = require('./ksinfo.json');

const KsIdentityURL = KsInfo.KS_AUTH_URL + 'v' + KsInfo.KS_IDENTITY_API_VERSION + '/';

const KeystoneStrategy = require('./passport-keystone');

//const rootPath = path.join(__dirname, 'uidist');
const rootPath = path.join(__dirname, '../ClientApp/dist/ClientApp');

//const tempdb_session = require('./connect-db');

const sqlOptions = {
    host: '20.194.32.137',
    port: 3306,
    user: 'argo',
    password: 'devstack',
    database: 'tempdb',
    expiration: 3000000
};

/*tempdb_session.getSession().then(
    session => session.sql(`CREATE TABLE IF NOT EXISTS 'tempdb'.'tenant_session' (
        'id' int(4),
        'token' varchar(255) NOT NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8;`)
);*/

const app = express();

// uncomment after placing your favicon in /public
app.use(favicon('favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.static(path.join(__dirname, 'public')));

const sessionStore = new SqlStore(sqlOptions);

app.use(session({
    key: 'argo_cookie',
    secret: 'do not need to know',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

passport.serializeUser((user, done) => done(null, user));

passport.deserializeUser((obj, done) => done(null, obj));

async function getAdminToken() {
    try {
        const response1 = await axios.post(KsIdentityURL + 'auth/tokens', {
            auth: {
                identity: {
                    methods: ['password'],
                    password: {
                        user: {
                            name: 'admin',
                            domain: { id: 'default' }
                        },
                        password: 'devstack'
                    }
                }
            }
        });
        //////////////////////////
        const adminResponse = await axios.get(KsIdentityURL + 'users/' + response1.data.token.user.id, {
            headers: {
                'x-auth-token': response1.headers['x-subject-token']
            }
        });
        const adminInfo = adminResponse.data.user;
        if (!adminInfo.is_wf || adminInfo.is_cluster)
            throw new Error('admin information is invalid');
        let default_project_id = '';
        if ('default_project_id' in adminInfo)
            default_project_id = adminInfo.default_project_id;
        else {
            const projectres = await axios.get(KsIdentityURL + 'auth/projects', {
                headers: {
                    'x-auth-token': response1.headers['x-subject-token']
                }
            });
            if (projectres.data.projects?.length < 1)
                throw new Error('no project id');
            else {
                const validProjects = projectres.data.projects.filter(elem => elem.is_wf && !elem.is_cluster);
                if (validProjects?.length < 1)
                    throw new Error('no valid project, no primary workspace');
                else
                    default_project_id = projectres.data.projects[0].id;
            }
        }
        const tokenres = await axios.post(KsIdentityURL + 'auth/tokens',
            {
                auth: {
                    identity: {
                        methods: ['token'],
                        token: {
                            id: response1.headers['x-subject-token']
                        }
                    },
                    scope: {
                        project: {
                            id: default_project_id
                        }
                    }
                }
            }, {
            headers: {
                    'x-auth-token': response1.headers['x-subject-token']
            }
        });
        return tokenres.headers['x-subject-token'];
    }
    catch (err) {
        console.error(err);
    }
}

passport.use(new KeystoneStrategy({
    authUrl: KsIdentityURL+'auth/tokens'
}, async (req, done) => {
    req.user.tokenId = req.token.id;
    try {
        /*const projectres = await axios.get(KsIdentityURL + 'auth/projects', {
            headers: {
                'x-auth-token': req.user.tokenId
            }
        });
        if (projectres.data.projects?.length < 1)
            throw new Error('project property error');
        const first_project_id = projectres.data.projects[0].id;*/
        let response = await axios.get(KsIdentityURL + 'users/' + req.user.id, {
            headers: {
                'x-auth-token': req.user.tokenId
            }
        });
        const userInfo = response.data.user;
        if (!userInfo.is_wf || userInfo.is_cluster)
            throw new Error('account information is invalid');
        let default_project_id = '';
        if ('default_project_id' in userInfo) {
            default_project_id = userInfo.default_project_id;
        }
        else {
            response = await axios.get(KsIdentityURL + 'auth/projects', {
                headers: {
                    'x-auth-token': req.user.tokenId
                }
            });
            if (response.data.projects?.length < 1)
                throw new Error('no project id');
            else {
                const validProjects = response.data.projects.filter(elem => elem.is_wf && !elem.is_cluster);
                if (validProjects?.length < 1)
                    throw new Error('no valid project, no primary workspace');
                else
                    default_project_id = response.data.projects[0].id;
            }
        }
        response = await axios.post(KsIdentityURL + 'auth/tokens',
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
                            id: default_project_id
                        }
                    }
                }
            }, {
            headers: {
                'x-auth-token': req.user.tokenId
            }
        });
        req.user.tokenId2 = response.headers['x-subject-token'];
        const tokenresdata = response.data.token;
        req.user.roles = tokenresdata.roles.map(elem => elem.name).filter(elem => /^wf\-/.test(elem));
        // grant access to admin token to tadmin
        if (req.user.roles.includes('wf-tenant-admin'))
            res.user.admin_token = getAdminToken();
        req.user.default_project_id = tokenresdata.project.id;
        req.user.default_project_name = tokenresdata.project.name;
        //const k8sadmin_session = await tempdb_session.getSession();
        //const result = await k8sadmin_session.sql(`SELECT * FROM tempdb.cluster_infos WHERE name='admin'`).execute()
        //const data = result.fetchOne();
        //req.user.k8s_endpoint = data[3];
        const k8users = require('./kube.config.json').users;
        const adminuser = k8users.find(elem => elem.name == 'kubernetes-admin');
        req.user.k8s_token = 'Bearer ' + adminuser.user.token;
        response=await axios.get(KsIdentityURL+'role_assignments?user.id='+req.user.id,{
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        const roles=response.data.role_assignments;
        response = await axios.get(KsIdentityURL + 'users/' + req.user.id + '/projects', {
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        const UserProjects=response.data.projects;
        const projectData=roles.map(elem=>{
            const name=UserProjects.find(elem2=>elem2.id==elem.scope.project.id).name;
            return {
                id:elem.scope.project.id,
                name:name,
                roleId:elem.role.id
            }
        });
        req.user.projects=projectData;
        done(null, req.user);
    }
    catch (err) {
        console.error(err);
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get(['/', '/overview/?', '/admin/?', '/workflows/?', '/workflow-templates/?',
    '/cron-workflows/?', '/archived-workflows/?', '/notfound', '/metering/?',
    '/monitoring/?','/reports','/userinfo',
    '/cluster-workflow-templates/?', '/login','/user-manager/?'],
    (req, res)=> res.sendFile(path.join(rootPath, 'index.html')));
// End of front-end routing
///////////////////////////
app.use(express.static(rootPath, { index: false }));

app.use('/account', require('./routes/account'));
app.use('/project', require('./routes/project'));
app.use('/cluster', require('./routes/cluster'));
app.use('/user', require('./routes/user'));
app.use('/namespace', require('./routes/namespace'));
app.use('/argo', require('./routes/argo'));
app.use('/role', require('./routes/role'));

// security flaw
/*app.get('/kubetoken', (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    else if (!req.user.tokenId2) {
        res.status(401).send('second token needed');
        return;
    }
    else {
        if (k8s_token in req.user)
            res.send(req.user.k8s_token);
        else {
            console.error('somethings wrong, authenticated but no k8s token');
            res.sendStatus(500);
        }

    }
})*/

// catch 404 and forward to error handler
/*app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
*/
app.use((req, res) => {
    res.redirect('/notfound');
});
// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        console.error(err);
        res.status(err.status || 500);
        res.send(err.message);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(err.status || 500);
    res.send('sorry');
});

app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), ()=>
    debug('Express server listening on port ' + server.address().port));
