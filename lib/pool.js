'use strict';

const EventEmitter = require('events').EventEmitter;
const DoneCriteria = require('done-criteria');
const underscore = require('underscore');

class Pool extends EventEmitter {

  constructor(paths, workers) {
    super(Pool);
    this.paths = paths;
    this.workers = workers;
  }

  start() {
    let doneCriteria = new DoneCriteria(this.paths, () => {
      this.emit('done');
    });

    this.on('next', ()=> {
      this.next((path)=> {
        doneCriteria.done(path);
      });
    });

    underscore.range(this.workers).forEach(()=> {
      this.next((path)=> {
        doneCriteria.done(path);
        this.emit('next');
      });
    });
  };

  next(callback) {
    let path = this.paths.shift();
    if (path) {
      this.emit('ready', path, ()=> {
        return callback(path);
      });
    }
  }
}

module.exports = Pool;
