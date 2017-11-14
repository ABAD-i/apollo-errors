import * as assert from 'assert';
import ExtendableError from 'extendable-error';

const isString = d => Object.prototype.toString.call(d) === '[object String]';
const isObject = d => Object.prototype.toString.call(d) === '[object Object]';

interface ErrorConfig {
  message: string;
  field: string;
  time_thrown: string;
  data: any,
  options: any,
}

class ApolloError extends ExtendableError {
  code: number;
  message: string;
  field: string;
  time_thrown: string;
  data: any;
  path: any;
  locations: any;
  _showLocations: boolean=false;

  constructor (code:number, config: ErrorConfig) {
    super((arguments[2] && arguments[2].message) || '');

    const t = (arguments[2] && arguments[2].time_thrown) || (new Date()).toISOString();
    const m = (arguments[2] && arguments[2].message) || '';
    const f = (arguments[2] && arguments[2].field) || '';
    const configData = (arguments[2] && arguments[2].data) || {};
    const d = {...this.data, ...configData}
    const opts = ((arguments[2] && arguments[2].options) || {})

    this.code = code;
    this.message = m;
    this.field = f
    this.time_thrown = t;
    this.data = d;
    this._showLocations = !!opts.showLocations;
  }
  serialize () {
    const { code, message, field, time_thrown, data, _showLocations, path, locations } = this;

    let error = {
      message,
      code,
      field,
      time_thrown,
      data,
      path,
      locations
    };
    if (_showLocations) {
      error.locations = locations;
      error.path = path;
    }
    return error;
  }
}

export const isInstance = e => e instanceof ApolloError;

export const createError = (code:number, config: ErrorConfig) => {
  assert(isObject(config), 'createError requires a config object as the second parameter');
  assert(isString(config.message), 'createError requires a "message" property on the config object passed as the second parameter');
  const e = ApolloError.bind(null, code, config);
  return e;
};

export const formatError = (error, returnNull = false) => {
  const originalError = error ? error.originalError || error : null;

  if (!originalError) return returnNull ? null : error;

  const { code } = originalError;

  if (!code || !isInstance(originalError)) return returnNull ? null : error;

  const { time_thrown, message, field, data, _showLocations } = originalError;

  if (_showLocations) {
    const { locations, path } = error;
    originalError.locations = locations;
    originalError.path = path;
  }

  return originalError.serialize();
};