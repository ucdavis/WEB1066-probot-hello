/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
 function objToString(arr,level) {
     var dumped_text = "";
     if(!level) level = 0;

     var level_padding = "";
     for(var j=0;j<level+1;j++) level_padding += "    ";

     if(typeof(arr) == 'object') {
         for(var item in arr) {
             var value = arr[item];

             if(typeof(value) == 'object') {
                 dumped_text += level_padding + "'" + item + "' ...\n";
             //     dumped_text += objToString(value,level+1);
             } else {
                 dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
             }
         }
     } else {
         dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
     }
     return dumped_text;
}

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
                 'check_suite_name',
                 'check_suite_id',
                 'check_suite_external_id', // the travis build id
                 'check_suite_details_url',
                 'check_suite_status',
                 'check_suite_conclusion',
                 'check_suite_started_at',
                 'check_suite_completed_at',
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
        action:                   'completed', // .action
        check_suite_name:         'Travis CI - Pull Request', // check_run.name
        check_suite_id:           34719534,
        check_suite_external_id:  92495945,
        check_suite_details_url:  'https://api.github.com/repos/LeoPoppy/WEB1066-probot-hello/check-runs/34719534',
        check_suite_status:       'completed',
        check_suite_conclusion:   'success',
        check_suite_started_at:   '2018-11-26T04:54:18Z',
        check_suite_completed_at: '2018-11-26T04:56:08Z',
        sender_login:             'wenlock', // sender.login
        repository_full_name:     'LeoPoppy/WEB1066-probot-hello', // repository.full_name
        repository_name:          'WEB1066-probot-hello'
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
    app.log('check_suite.requested -> ' + context)
  })

  app.on('check_suite.completed', async context => {
    app.log('check_suite.completed -> called ')
    app.log(context.payload.action)
    app.log('before payload.check_suite')
    app.log(context.payload.check_suite)
    app.log('after check_suite')
    app.log(context.payload.check_suite.name)
    app.log(context.payload.check_suite.id)
    app.log(context.payload.check_suite.external_id)
    app.log(context.payload.check_suite.details_url)
    app.log(context.payload.check_suite.status)
    app.log(context.payload.check_suite.conclusion)
    app.log(context.payload.check_suite.started_at)
    app.log(context.payload.check_suite.completed_at)
    app.log('after payload.check_suite')
    app.log(context.payload.sender.login)
    app.log(context.payload.repository.full_name)
    app.log(context.payload.repository.name)
    histogram.observe({
        action:                   context.payload.action, // .action
        check_suite_name:         context.payload.check_suite.name, // check_suite.name
        check_suite_id:           context.payload.check_suite.id,
        check_suite_external_id:  context.payload.check_suite.external_id,
        check_suite_details_url:  context.payload.check_suite.details_url,
        check_suite_status:       context.payload.check_suite.status,
        check_suite_conclusion:   context.payload.check_suite.conclusion,
        check_suite_started_at:   context.payload.check_suite.started_at,
        check_suite_completed_at: context.payload.check_suite.completed_at,
        sender_login:             context.payload.sender.login, // sender.login
        repository_full_name:     context.payload.repository.full_name, // repository.full_name
        repository_name:          context.payload.repository.name
      },
      new Date(context.payload.check_suite.completed_at) - new Date(context.payload.check_suite.started_at) // micro seconds
    );
    app.log('check_suite.completed -> done')
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
