'use strict';

const spawn = require('child_process').spawn;
const fs = require('fs');
const underscore = require('underscore');

const Pool = require('./pool');

class Runner {

  constructor(paths, config) {
    this.paths = paths;
    this.config = underscore.extend(
      {
        bin: ['./node_modules/.bin/mocha']
        , processes: 2
      }
      , config
    );
    this.mocha = null;
  }

  run(callback) {
    let pool = new Pool(this.paths, this.config.processes);
    let exitCodes = [];

    pool.on('ready', (path, callback) => {
      var args = {
        path: path,
        timeout: this.config.timeout,
        slow: this.config.slow,
        env: this.config.env
      };

      this.spawn(args, (code)=> {
        exitCodes.push(code);
        callback();
      });
    });

    pool.on('done', () => {
      var success = underscore.every(exitCodes, code=>code === 0);
      var error = success ? null : new Error('Not all tests passed');
      return callback(error);
    });

    pool.start();
  }

  spawn(args, callback) {
    let mocha = this.findMocha();
    let child = spawn(mocha, [
        '--timeout', args.timeout,
        '--slow', args.timeout,
        args.path
      ],
      {stdio: "inherit", env: underscore.extend(process.env, {NODE_ENV: args.env})}
    );

    child.on('exit', callback);
  }

  findMocha() {
    if (!this.mocha) {
      this.mocha = underscore.find(this.config.bin, bin =>fs.existsSync(bin));
      this.mocha = this.mocha || 'mocha';
    }
    return this.mocha;
  }
}

module.exports = Runner;
