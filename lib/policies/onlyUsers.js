import { Unauthorized } from '../errors.js';

export default (req) => {
  if (!req.user) {
    throw new Unauthorized();
  }
}