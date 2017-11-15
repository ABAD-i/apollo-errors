import * as assert from 'assert';
import ExtendableError from 'extendable-error';

const isString = d => Object.prototype.toString.call(d) === '[object String]';
const isObject = d => Object.prototype.toString.call(d) === '[object Object]';

interface ErrorConfig {
  message: string;
  code: number;
  field: string;
  time_thrown: string;
  data: any,
  options: any,
}

class ApolloError extends ExtendableError {
  status: string;
  message: string;
  code: number;
  field: string;
  time_thrown: string;
  data: any;
  path: any;
  locations: any;
  _showLocations: boolean=false;

  constructor (status: string, config: ErrorConfig) {
    super((arguments[2] && arguments[2].message) || '');

    const m = (arguments[2] && arguments[2].message) || '';
    const c = (arguments[2] && arguments[2].code) || '';
    const f = (arguments[2] && arguments[2].field) || '';
    const t = (arguments[2] && arguments[2].time_thrown) || (new Date()).toISOString();
    const configData = (arguments[2] && arguments[2].data) || {};
    const d = {...this.data, ...configData}
    const opts = ((arguments[2] && arguments[2].options) || {})

    this.status = status;
    this.message = m;
    this.code = c;
    this.field = f
    this.time_thrown = t;
    this.data = d;
    this._showLocations = !!opts.showLocations;
  }
  serialize () {
    const { status, message, code, field, time_thrown, data, _showLocations, path, locations } = this;

    let error = {
      message,
      status,
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

export const createError = (status: string, config: ErrorConfig) => {
  assert(isObject(config), 'createError requires a config object as the second parameter');
  assert(isString(config.message), 'createError requires a "message" property on the config object passed as the second parameter');
  const e = ApolloError.bind(null, status, config);
  return e;
};

export const formatError = (error, returnNull = false) => {
  const originalError = error ? error.originalError || error : null;

  if (!originalError) return returnNull ? null : error;

  const { status } = originalError;

  if (!status || !isInstance(originalError)) return returnNull ? null : error;

  const { time_thrown, message, field, data, _showLocations } = originalError;

  if (_showLocations) {
    const { locations, path } = error;
    originalError.locations = locations;
    originalError.path = path;
  }

  return originalError.serialize();
};