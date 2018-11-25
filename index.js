/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  // Get an express router to expose new HTTP endpoints
  const router = app.route('/probot')

  // prometheus metrics
  const client = require('prom-client');
  const Registry = client.Registry;
  const register = new Registry();
  const collectDefaultMetrics = client.collectDefaultMetrics;


  // Use any middleware
  // router.use(require('express').static('public'))
  // router.use(require('express').static(__dirname + '/public'));
  // Probe every 5th second.

  collectDefaultMetrics({register,
    timeout: 5000,
    prefix: 'default_'
  });

  // register metrics on startup
  const counter = new client.Counter({
    name: 'builds',
    help: 'The number of builds that have executed',
    labelNames: ['build_name', 'result'],
    registers: [register]
  });

  // Lets test incrementing the build count
  router.get('/test_count', (req, res) => {
    app.log('GET -> /test_count.')
    counter.inc({build_name:'mybuildproject',result:1}, 1, new Date());
    counter.inc({build_name:'mybuildproject2',result:0}, 1, new Date());
    res.send('Counter incremented ' + new Date());
  })

  // Add a new route
  router.get('/metrics', (req, res) => {
    app.log('GET -> metrics called.')
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
    // res.send('Metrics would go here')
  })

  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue! It worked.' })
    return context.github.issues.createComment(issueComment)
  })

  app.on('check_suite.requested', async context => {
    app.log('check_suite.requested -> ' + context)
  })

  app.on('check_suite.completed', async context => {
    app.log('check_suite.completed -> ' + context)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
