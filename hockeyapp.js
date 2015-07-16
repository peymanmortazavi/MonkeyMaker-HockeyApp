var exec = require('sync-exec');          // Exec utilities
var format = require('string-format');
var path = require('path');
var configUtil = require('config-util');

format.extend(String.prototype);

var hockeyAppConfigTemplate = {
  apiKey: 'string',
  releaseNotes: 'string.default("RELEASE-NOTES.txt")',
  notify: 'boolean.default(false)'
}

module.exports = function () {

}

module.exports.prototype.supports = function(platform) {
  return platform == 'ios' || platform == 'android';
}

module.exports.prototype.name = "HockeyApp";

module.exports.prototype.process = function (args) {

  // Step1: Make sure hockeyapp stuff is provided.
  var monkey = args.monkey;
  var evalResults = configUtil.evaluate(hockeyAppConfigTemplate, monkey.options.hockeyApp);
  if(!evalResults.isValid) throw { message: "HockeyApp is not setup properly in monkey project settings.", errors: evalResults.errors }

  var globalHockeyAppConfig = evalResults.compile();

  if(args.config.config.hockeyApp) {
    evalResults = configUtil.evaluate({appId: 'string'}, args.config.config.hockeyApp, 'config.hockeyApp');
  } else{
    evalResults = configUtil.evaluate({appId: 'string'}, args.config.hockeyApp, 'hockeyApp');
  }
  if(!evalResults.isValid) throw { message: "HockeyApp is not setup properly in config settings.", errors: evalResults.errors };

  var hockeyAppConfig = evalResults.compile();

  var releaseNotesPath = '';

  var solutionPath = path.dirname(monkey.options.project.solutionPath);
  if(!path.isAbsolute(solutionPath)) {
    solutionPath = path.resolve(solutionPath);
  }
  releaseNotesPath = path.join(solutionPath, monkey.options[args.platform.toLowerCase()]['projectName'], globalHockeyAppConfig.releaseNotes);

  var execResult = exec('puck -api_token={0} -app_id={1} -submit=auto -download=true -open=notify -notify={4} -notes_path={2} {3}'.format(globalHockeyAppConfig.apiKey, hockeyAppConfig.appId, releaseNotesPath, args.outputUrl, globalHockeyAppConfig.notify));

  if(execResult.status != 0) {
    throw { message: "Could not upload to HockeyApp.", stdout: execResult.stdout};
  }

  return { success: true };
}
