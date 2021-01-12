const k8s = require('@kubernetes/client-node');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const kc = new k8s.KubeConfig();
kc.loadFromOptions(require('./kube.config.json'));
const coreClient = kc.makeApiClient(k8s.CoreV1Api);
const rbacClient = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

module.exports = {core:coreClient,rbac:rbacClient};