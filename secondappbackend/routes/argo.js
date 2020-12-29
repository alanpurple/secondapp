const router = require('express').Router();
const axios = require('axios');
const http=require('http');

const KsInfo = require('../ksinfo.json');

const KsUrl = KsInfo.KS_AUTH_URL + 'v' + KsInfo.KS_IDENTITY_API_VERSION + '/';

const endurl = require('../ksinfo.json').ARGO_API_URL;

router.all('*', ensureAuthenticated);

// this is temporary medication, not available for non-admin
router.get('/checkname/:name',async (req,res)=>{
    try{
        // this is temporary medication, not available for non-admin
        const response=await axios.get(KsUrl+'projects',{
            headers: {
                'x-auth-token': req.user.tokenId2
            }
        });
        if(!('projects' in response.data))
            throw new Error('projects property missing');
        if(!response.data.projects){
            res.send('available');
            return;
        }
        const names=response.data.projects.map(elem=>elem.name);
        if(names.includes(req.params.name))
            res.send(406);
        else
            res.send('available');
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.get('/archived-workflows', async (req, res) => {
    const url = Object.keys(req.query).length > 0 ? endurl + req.url : endurl + '/archived-workflows';
    try {
        //const response = await axios.get(url, {
        const response = await axios.get(url, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        const items = response.data.items;
        if (items?.length > 0)
            res.send(response.data);
        else
            res.sendStatus(204);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/archived-workflows/:uid', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/archived-workflows/' + req.params.uid, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.delete('/archived-workflows/:uid', async (req, res) => {
    try {
        const response = await axios.delete(endurl + '/archived-workflows/' + req.params.uid, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/cluster-workflow-templates', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/cluster-workflow-templates', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        const items = response.data.items;
        if (items?.length > 0)
            res.send(response.data);
        else
            res.sendStatus(204);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/cluster-workflow-templates', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/cluster-workflow-templates', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/cluster-workflow-templates/lint', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/cluster-workflow-templates/lint', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/cluster-workflow-templates/:name', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/cluster-workflow-templates/' + req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/cluster-workflow-templates/:name', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/cluster-workflow-templates/' + req.params.name, req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.delete('/cluster-workflow-templates/:name', async (req, res) => {
    try {
        const response = await axios.delete(endurl + '/cluster-workflow-templates/' + req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/cron-workflows', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/cron-workflows/', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        const items = response.data.items;
        if (items?.length > 0)
            res.send(response.data);
        else
            res.sendStatus(204);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/cron-workflows/:namespace', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/cron-workflows/' + req.params.namespace, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/cron-workflows/:namespace', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/cron-workflows/' + req.params.namespace, req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/cron-workflows/:namespace/lint', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/cron-workflows/' + req.params.namespace + '/lint', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/cron-workflows/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/cron-workflows/' + req.params.namespace + '/' +
            req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/cron-workflows/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/cron-workflows/' + req.params.namespace + '/' +
            req.params.name, req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.delete('/cron-workflows/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.delete(endurl + '/cron-workflows/' + req.params.namespace + '/' +
            req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/cron-workflows/:namespace/:name/resume', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/cron-workflows/' + req.params.namespace + '/' +
            req.params.name + '/resume', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/cron-workflows/:namespace/:name/suspend', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/cron-workflows/' + req.params.namespace + '/' +
            req.params.name + '/suspend', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/events/:namespace/:discriminator', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/events/' + req.params.namespace + '/'
            + req.params.discriminator, req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/info', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/info', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/userinfo', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/userinfo', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/version', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/version', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/stream/events/:namespace', async (req, res) => {
    res.sendStatus(501);
});

router.get('/workflow-events', async (req, res) => {
    //const requestUrl = Object.keys(req.query).length > 0 ? endurl + req.url : endurl + '/workflow-events/';

    res.sendStatus(501);
});

router.get('/workflow-events/:namespace', async (req, res) => {
    res.sendStatus(501);
});

router.get('/workflows/:namespace', async (req, res) => {
    const requestUrl =
        Object.keys(req.query).length > 0 ?
            endurl + req.url : endurl + '/workflows/' + req.params.namespace;
    try {
        const response = await axios.get(requestUrl, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        const items = response.data.items;
        if (items?.length > 0)
            res.send(response.data);
        else
            res.sendStatus(204);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/workflows', async (req, res) => {
    const requestUrl = Object.keys(req.query).length > 0 ? endurl + req.url : endurl + '/workflows/';
    try {
        const response = await axios.get(requestUrl, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        const items = response.data.items;
        if (items?.length > 0)
            res.send(response.data);
        else
            res.sendStatus(204);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/workflows/:namespace', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/workflows/' + req.params.namespace, req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send('created successfully');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/workflows/:namespace/lint', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/workflows/' + req.params.namespace +'/lint',
            req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/workflows/:namespace/submit', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/workflows/' + req.params.namespace + '/submit',
            req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/workflows/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/workflows/'
            + req.params.namespace + '/' + req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.delete('/workflows/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.delete(endurl + '/workflows/'
            + req.params.namespace + '/' + req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/workflows/:namespace/:name/log', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/workflows/'
            + req.params.namespace + '/' + req.params.name + '/log', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflows/:namespace/:name/resubmit', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflows' + req.params.namespace + '/'
            + req.params.name + '/resubmit', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflows/:namespace/:name/resume', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflows' + req.params.namespace + '/'
            + req.params.name + '/resume', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflows/:namespace/:name/retry', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflows' + req.params.namespace + '/'
            + req.params.name + '/retry', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflows/:namespace/:name/set', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflows' + req.params.namespace + '/'
            + req.params.name + '/set', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflows/:namespace/:name/stop', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflows' + req.params.namespace + '/'
            + req.params.name + '/stop', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflows/:namespace/:name/suspend', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflows' + req.params.namespace + '/'
            + req.params.name + '/suspend', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflows/:namespace/:name/terminate', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflows' + req.params.namespace + '/'
            + req.params.name + '/terminate', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/workflows/:namespace/:name/:podname/log', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/workflows/'
            + req.params.namespace + '/' + req.params.name + '/' + req.params.podname + '/log', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/workflow-templates', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/workflow-templates/', {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/workflow-templates/:namespace', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/workflow-templates/' + req.params.namespace, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/workflow-templates/:namespace', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/workflow-templates/' + req.params.namespace,
            req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send('created successfully');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/workflow-templates/:namespace/lint', async (req, res) => {
    try {
        const response = await axios.post(endurl + '/workflow-templates/'
            + req.params.namespace + '/lint', req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send('created successfully');
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/workflow-templates/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.get(endurl + '/workflow-templates/'
            + req.params.namespace + '/' + req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.put('/workflow-templates/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.put(endurl + '/workflow-templates/'
            + req.params.namespace + '/'+req.params.name, req.body, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.delete('/workflow-templates/:namespace/:name', async (req, res) => {
    try {
        const response = await axios.delete(endurl + '/workflow-templates/'
            + req.params.namespace + '/' + req.params.name, {
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        res.send(response.data);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/metering', async (req, res) => {
    if(!('minStartedAt' in req.query)||!('maxStartedAt' in req.query)){
        res.status(400).send('mindate or maxdate missing in query');
        return;
    }
    //get the workflows
    try {
        let response = await axios.get(endurl + '/workflows/',
        { headers: { Authorization: req.user.k8s_token } });
        if (!('items' in response.data))
            throw new Error('no items in response');
        let items = response.data.items;
        const tempWorkflows = (Array.isArray(items)) ? items.map(refinedWfItem) : [];

        //get archived-workflows      
        const requestAWfUrl = endurl + '/archived-workflows?listOptions.fieldSelector=spec.startedAt%3E' + req.query.minStartedAt
            + ',spec.startedAt%3C' + req.query.maxStartedAt;

        response = await axios.get(requestAWfUrl, { headers: { Authorization: req.user.k8s_token } });
        if (!('items' in response.data))
            throw new Error('no items in response');
        items = response.data.items;
        const wfs = (Array.isArray(items)) ? response.data.items : [];
        let tempArchivedWorkflows = [];
        if (wfs.length > 0)
            for (let i = 0; i < wfs.length; i++){
                const elem = wfs[i];
                let awfResponse = await axios.get(endurl + '/archived-workflows/' + elem.metadata.uid, { headers: { Authorization: req.user.k8s_token } });
                tempArchivedWorkflows.push(refinedWfItem(awfResponse.data));
            }
        const concatData = uniqueArray(tempWorkflows.concat(tempArchivedWorkflows));
        res.send(concatData);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.get('/metering/:namespace', async (req, res) => {
    if(!('minStartedAt' in req.query)||!('maxStartedAt' in req.query)){
        res.status(400).send('mindate or maxdate missing in query');
        return;
    }
    try{
        let response = await axios.get(endurl + '/workflows/' + req.params.namespace,
        { headers: {Authorization: req.user.k8s_token}});
        if (!('items' in response.data))
            throw new Error('no items in response');
        let items = response.data.items;
        const tempWorkflows = (Array.isArray(items)) ? items.map(refinedWfItem) : [];

        const requestAWfUrl = endurl + '/archived-workflows?listOptions.fieldSelector=metadata.namespace=' + req.params.namespace
                        + ',spec.startedAt%3E' + req.query.minStartedAt 
                        + ',spec.startedAt%3C' + req.query.maxStartedAt;
        response = await axios.get(requestAWfUrl,
            { headers: { Authorization: req.user.k8s_token}});
        if (!('items' in response.data))
            throw new Error('no items in response');
        items = response.data.items;
        const wfs = (Array.isArray(items)) ? response.data.items : [];
        const tempArchivedWorkflows = await Promise.all(wfs.map(async elem => {
            let tawResponse = await axios.get(endurl + '/archived-workflows/' + elem.metadata.uid,
                { headers: { Authorization: req.user.k8s_token } });
            return refinedWfItem(tawResponse.data);
        }));
        const concatData=uniqueArray(tempWorkflows.concat(tempArchivedWorkflows));
        res.send(concatData);
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.get('/overview-data', async (req,res)=>{
    let overviewData={
        workflowsNum:0,
        workflowTemplatesNum:0,
        clusterWorkflowTemplatesNum:0,
        cronWorkflowsNum:0
    };
    try{
        let response = await axios.get(endurl + '/workflows/' + '?fields=items.metadata.uid', {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        let items = response.data.items;
        overviewData.workflowsNum = Array.isArray(items) ? response.data.items.length : 0;
        response = await axios.get(endurl + '/workflow-templates/', {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        items = response.data.items;
        overviewData.workflowTemplatesNum = Array.isArray(items) ? response.data.items.length : 0;
        response = await axios.get(endurl + '/cluster-workflow-templates', {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        items = response.data.items;
        overviewData.clusterWorkflowTemplatesNum = Array.isArray(items) ? response.data.items.length : 0;
        response = await axios.get(endurl + '/cron-workflows/', {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        overviewData.cronWorkflowsNum = Array.isArray(items) ? response.data.items.length : 0;
        res.send(overviewData);
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.get('/overview-data/:namespace', async (req, res) => {
    let overviewData={
        workflowsNum:0,
        workflowTemplatesNum:0,
        clusterWorkflowTemplatesNum:0,
        cronWorkflowsNum:0
    };
    try{
        let response=await axios.get(endurl + '/workflows/' + req.params.namespace + '?fields=items.metadata.uid', {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        let items = response.data.items;
        overviewData.workflowsNum = Array.isArray(items) ? response.data.items.length : 0;
        response = await axios.get(endurl + '/workflow-templates/' + req.params.namespace, {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        items = response.data.items;
        overviewData.workflowTemplatesNum = Array.isArray(items) ? response.data.items.length : 0;
        response = await axios.get(endurl + '/cluster-workflow-templates', {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        items = response.data.items;
        overviewData.clusterWorkflowTemplatesNum = Array.isArray(items) ? response.data.items.length : 0;
        response = await axios.get(endurl + '/cron-workflows/' + req.params.namespace, {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!('items' in response.data))
            throw new Error('no items in response');
        items = response.data.items;
        overviewData.cronWorkflowsNum = Array.isArray(items) ? response.data.items.length : 0;
        res.send(overviewData);
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.get('/overview-workflows', async (req,res)=>{
    try{
        const response = await axios.get(endurl + '/workflows/', {  
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if(!response.data.items){
            res.status(404).send('no overview data');
            return;
        }
        const items=response.data.items;
        let totalNodeDuration = 0;
        let totalEstimatedDuration = 0;
        let totalResourceDurationCPU = 0;
        let totalResourceDurationMem = 0;
        const workflows=items.map(refinedWfItem);
        workflows.forEach(item=>{
            totalNodeDuration += item.nodeDuration;
            totalEstimatedDuration += item.estimatedDuration;
            totalResourceDurationCPU += item.resourceDurationCPU;
            totalResourceDurationMem += item.resourceDurationMem; 
        });
        res.send({
            totalNodeDuration:totalNodeDuration,
            totalEstimatedDuration:totalEstimatedDuration,
            totalResourceDurationCPU:totalResourceDurationCPU,
            totalResourceDurationMem:totalResourceDurationMem,
            workflows:workflows
        });
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.get('/overview-workflows/:namespace', async (req, res) => {
    try{
        const response = await axios.get(endurl + '/workflows/' + req.params.namespace, {            
            headers: {
                Authorization: req.user.k8s_token
            }
        });
        if (!response.data.items) {
            res.status(404).send('no overview data');
            return;
        }
        const items=response.data.items;
        let totalNodeDuration = 0;
        let totalEstimatedDuration = 0;
        let totalResourceDurationCPU = 0;
        let totalResourceDurationMem = 0;
        const workflows=items.map(refinedWfItem);
        workflows.forEach(item=>{
            totalNodeDuration += item.nodeDuration;
            totalEstimatedDuration += item.estimatedDuration;
            totalResourceDurationCPU += item.resourceDurationCPU;
            totalResourceDurationMem += item.resourceDurationMem; 
        });
        res.send({
            totalNodeDuration:totalNodeDuration,
            totalEstimatedDuration:totalEstimatedDuration,
            totalResourceDurationCPU:totalResourceDurationCPU,
            totalResourceDurationMem:totalResourceDurationMem,
            workflows:workflows
        });
    }
    catch(err){
        res.status(400).send(err);
    }
});

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

// refine the workflow-items for overview, metering
function refinedWfItem(item) {
    if (!('metadata' in item) || !('status' in item)) {
        console.error('invalid item data');
        return;
    }
    const calledAt = new Date(); // set sametime
    const metadata = item.metadata;
    const status = item.status;
    let wfItem = {
        uid: metadata.uid,
        name:metadata.name,
        namespace: metadata.namespace,
        phase: status.phase,
        finishedAt: status.finishedAt,
        startedAt: status.startedAt
    };

    if (['Error', 'Running'].includes(status.phase)) {
        wfItem.progress = 'None';
        wfItem.nodeDuration = 0;
        wfItem.nodeDurationFormatted = '0s';
        wfItem.estimatedDuration = 0;
        wfItem.estimatedDurationFormatted = '0s';
        wfItem.clusterName = 'None';
        wfItem.resourceDurationCPU = 0;
        wfItem.resourceDurationMem = 0;
    }
    else {
        wfItem.progress = status.progress;
        node = status.nodes[metadata.name];
        if (!('startedAt' in node)) {
            console.error('no start time in node');
            return;
        }
        const nodeStartedAt = new Date(node.startedAt);
        const nodeFinishedDate = !node.finishedAt ? calledAt : new Date(node.finishedAt);
        wfItem.nodeDuration = (nodeFinishedDate.getTime() - nodeStartedAt.getTime()) / 1000;
        wfItem.nodeDurationFormatted = secondsToTime(wfItem.nodeDuration);
        const startedDate = new Date(status.startedAt);
        const finishedDate = !item.status.finishedAt ? calledAt : new Date(status.finishedAt);
        wfItem.estimatedDuration = (finishedDate.getTime() - startedDate.getTime()) / 1000;
        wfItem.estimatedDurationFormatted = secondsToTime(wfItem["estimatedDuration"]);
        wfItem.clusterName = (("spec" in item) && ("nodeSelector" in item.spec)) ? item.spec.nodeSelector.clusterName : 'default';
        wfItem.resourceDurationCPU = ("resourcesDuration" in status) ? status.resourcesDuration.cpu : 0;
        wfItem.resourceDurationMem = ("resourcesDuration" in status) ? status.resourcesDuration.memory : 0;
    }

    return wfItem;
}

function secondsToTime(e) {
    let forTime = e;

    const d = Math.floor(e / (3600 * 24)).toString(),
        h = Math.floor((e - d * 3600 * 24) / 3600).toString(),
        m = Math.floor(e % 3600 / 60).toString(),
        s = Math.floor(e % 60).toString();

    if (d > 0)
        forTime = d + 'd ' + h + 'h ' + m + 'm ' + s + 's';
    else if (h > 0)
        forTime = h + 'h ' + m + 'm ' + s + 's';
    else if (m > 0)
        forTime = m + 'm ' + s + 's';
    else
        forTime = e + 's';

    return forTime;
}

// duplicate check
function uniqueArray(array) {
    let a = array.concat();
    for (let i = 0; i < a.length; i++)
        for (let j = i + 1; j < a.length; j++)
            if (a[i].uid === a[j].uid)
                a.splice(j--, 1);
    return a;
}


module.exports = router;