const { Application } = require('probot')
// Requiring our app implementation
const myProbotApp = require('..')

const issuesOpenedPayload = require('./fixtures/issues.opened.json')
const checkSuiteRequestedPayload = require('./fixtures/check_suite.requested.json')
const checkRunCompletedPayload = require('./fixtures/check_run.completed.json')

test('that we can run tests', () => {
  // your real tests go here
  expect(1 + 2 + 3).toBe(6)
})

describe('My Probot app', () => {
  let app, github

  beforeEach(() => {
    app = new Application()
    // Initialize the app based on the code from index.js
    app.load(myProbotApp)
    // This is an easy way to mock out the GitHub API
    github = {
      issues: {
        createComment: jest.fn().mockReturnValue(Promise.resolve({}))
      }
    }
    // Passes the mocked out GitHub API into out app instance
    app.auth = () => Promise.resolve(github)
  })

  test('creates a comment when an issue is opened', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'issues.opened',
      payload: issuesOpenedPayload
    })

    // This test passes if the code in your index.js file calls `context.github.issues.createComment`
    expect(github.issues.createComment).toHaveBeenCalled()
    app.log(app)
    app.log('done with issue test')
  })

  test('process check_suite requested event', async () => {
    // Simulates delivery of a check_suite.requested webhook
    await app.receive({
      name: 'check_suite.requested',
      payload: checkSuiteRequestedPayload
    })

    // expect(res.action).toEqual('created')
    // expect(result).toBe(true)
  })

  test('process check_run completed event', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'check_run.completed',
      payload: checkRunCompletedPayload
    })

    // expect(result.action).toEqual('completed')
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
