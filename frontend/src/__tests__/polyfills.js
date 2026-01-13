import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill Response and Request for MSW
if (typeof global.Response === 'undefined') {
  global.Response = class Response {};
}
if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}
