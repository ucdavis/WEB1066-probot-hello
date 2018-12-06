/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */

module.exports = app => {
  // Get an express router to expose new HTTP endpoints
  const router = app.route('/probot')

  // https://github.com/siimon/prom-client
  // prometheus metrics
  const client = require('prom-client')
  const Registry = client.Registry
  const register = new Registry()
  const collectDefaultMetrics = client.collectDefaultMetrics

  // Use any middleware
  // router.use(require('express').static('public'))
  // router.use(require('express').static(__dirname + '/public'));
  // Probe every 5th second.

  collectDefaultMetrics({register,
    timeout: 5000,
    prefix: 'default_'
  })

  // register metrics on startup
  const prom = new client.Summary({
    name: 'builds_duration_ms',
    help: 'The number of builds that have executed',
    maxAgeSeconds: 60, // 1 minute sliding window
    ageBuckets: 100,   // for 100 builds
    labelNames: [
      'action',  // action
      'name',
      'check_run_status',
      'check_run_conclusion',
      'repository_full_name',
      'repository_name'
    ],
    registers: [register]
  })

  // Ping router
  router.get('/ping', (req, res) => {
    res.send('pong')
    app.log('pong response')
  })

  // keep alive with Interval
  // Lets keep the prometheus and this app alive
  // Not this will use up all 540 hours in one month within about 14 days
  // and will not allow for troubleshooting unless you upgrade your account
  var http = require('http')
  if (process.env.APP_URL) {
    app.log('setting up timer for this app -> ' + process.env.APP_URL)
    setInterval(() => {
      app.log('requesting ping on -> ' + process.env.APP_URL + '/probot/ping')
      http.get(process.env.APP_URL + '/probot/ping')
    }, 300000) // every 5 minutes (300000)
  }

  if (process.env.PROM_URL) {
    app.log('setting up timer for prometheus -> ' + process.env.PROM_URL)
    setInterval(() => {
      app.log('requesting GET on -> ' + process.env.PROM_URL)
      http.get(process.env.PROM_URL)
    }, 300000) // every 5 minutes (300000)
  }

  // Lets test incrementing the build count
  router.get('/test_count', (req, res) => {
    app.log('GET -> /test_count.')
    prom.reset()
    prom.observe({
      action: 'completed', // .action
      name: 'Travis CI - Pull Request',
      check_run_status: 'completed',
      check_run_conclusion: 'success',
      repository_full_name: 'LeoPoppy/WEB1066-probot-hello', // repository.full_name
      repository_name: 'WEB1066-probot-hello'
    },
      new Date('2018-11-26T04:56:08Z') - new Date('2018-11-26T04:54:18Z') // micro seconds
    )
    res.send('Counter incremented ' + new Date())
  })

  // Add a new route
  router.get('/metrics', (req, res) => {
    app.log('GET -> metrics called.')
    res.set('Content-Type', register.contentType)
    res.end(register.metrics())
  })

  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue! It worked.' })
    return context.github.issues.createComment(issueComment)
  })

  app.on('check_run.created', async context => {
    app.log('check_run.created ')
    // app.log(JSON.stringify(context))
  })

  app.on('check_run.completed', async context => {
    app.log('check_run.completed -> called ')
    // app.log(JSON.stringify(context))

    const observation = {
      action: context.payload.action, // .action
      name: context.payload.check_run.name,
      check_run_status: context.payload.check_run.status,
      check_run_conclusion: context.payload.check_run.conclusion,
      repository_full_name: context.payload.repository.full_name, // repository.full_name
      repository_name: context.payload.repository.name
    }
    const duration = new Date(context.payload.check_run.completed_at) - new Date(context.payload.check_run.started_at)
    app.log('observation.action -> ' + observation.action)
    app.log('observation.name -> ' + observation.name)
    app.log('observation.check_run_status -> ' + observation.check_run_status)
    app.log('observation.check_run_conclusion -> ' + observation.check_run_conclusion)
    app.log('observation.repository_full_name -> ' + observation.repository_full_name)
    app.log('observation.repository_name -> ' + observation.repository_name)
    app.log('duration -> ' + duration)

    prom.observe(observation, duration)
    app.log('check_run.created -> done')
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
