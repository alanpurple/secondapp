const router = require('express').Router();
const passport = require('passport');

/**
 * authenticate using username, password, and domain_id
 */
router.post('/login',
    passport.authenticate('keystone', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
);

/**
 * for frontend routing hook
 */
router.get('/checkLogin', function (req, res) {
    if (req.isAuthenticated())
        res.sendStatus(200);
    else res.sendStatus(401);
});

/**
 * for frontend routing hook
 */
router.get('/notLoggedIn', function (req, res) {
    if (req.isUnauthenticated())
        res.sendStatus(200);
    else res.sendStatus(400);
});

/**
 * user information retrieval
 */
router.get('/info', (req, res) => {
    if (req.isAuthenticated()) {
        const user = req.user;
        const userinfo = {
            domain_id: user.domain,
            id: user.id,
            name: user.name,
            roles: user.roles,
            primary_namespace_id: user.default_project_id,
            primary_namespace_name: user.default_project_name,
            projects:user.projects
        };
        res.send(userinfo);

    }
    else res.sendStatus(401);
});

/**
 * user logout
 */
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/');
});

/**
 * check authenticated
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Function} next
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        next();
    else res.sendStatus(401);
}

module.exports=router;
