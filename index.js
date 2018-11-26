/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  // Get an express router to expose new HTTP endpoints
  const router = app.route('/probot')

  // https://github.com/siimon/prom-client
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
  const histogram = new client.Histogram({
    name: 'builds',
    help: 'The number of builds that have executed',
    labelNames: [
                 'action',  // action
                 'check_run_name',
                 'check_run_id',
                 'check_run_external_id', // the travis build id
                 'check_run_details_url',
                 'check_run_status',
                 'check_run_conclusion',
                 'check_run_started_at',
                 'check_run_completed_at',
                 'sender_login',
                 'repository_full_name',
                 'repository_name'
               ],
    registers: [register]
  });

  // Lets test incrementing the build count
  router.get('/test_count', (req, res) => {
    app.log('GET -> /test_count.')
    histogram.observe({
        action:                 'completed', // .action
        check_run_name:         'Travis CI - Pull Request', // check_run.name
        check_run_id:           34719534,
        check_run_external_id:  92495945,
        check_run_details_url:  'https://api.github.com/repos/LeoPoppy/WEB1066-probot-hello/check-runs/34719534',
        check_run_status:       'completed',
        check_run_conclusion:   'success',
        check_run_started_at:   '2018-11-26T04:54:18Z',
        check_run_completed_at: '2018-11-26T04:56:08Z',
        sender_login:           'wenlock', // sender.login
        repository_full_name:   'LeoPoppy/WEB1066-probot-hello', // repository.full_name
        repository_name:        'WEB1066-probot-hello'
      },
      new Date('2018-11-26T04:56:08Z') - new Date('2018-11-26T04:54:18Z') // micro seconds
    );
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
    app.log('check_suite.requested -> %o ', context)
  })

  app.on('check_suite.completed', async context => {
    app.log('check_suite.completed -> %o ', context)
    histogram.observe({
        action:                 context.action, // .action
        check_run_name:         context.check_run.name, // check_run.name
        check_run_id:           context.check_run.id,
        check_run_external_id:  context.check_run.external_id,
        check_run_details_url:  context.check_run.details_url,
        check_run_status:       context.check_run.status,
        check_run_conclusion:   context.check_run.conclusion,
        check_run_started_at:   context.check_run.started_at,
        check_run_completed_at: context.check_run.completed_at,
        sender_login:           context.sender.login, // sender.login
        repository_full_name:   context.repository.full_name, // repository.full_name
        repository_name:        context.repository.name
      },
      new Date(context.check_run.completed_at) - new Date(context.check_run.started_at) // micro seconds
    );
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
