/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
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

  // Get an express router to expose new HTTP endpoints
  const router = app.route('/metrics')

  // Use any middleware
  router.use(require('express').static('public'))

  // Add a new route
  router.get('/metrics', (req, res) => {
    app.log('GET -> metrics called.')
    res.send('Metrics would go here')
  })
}
