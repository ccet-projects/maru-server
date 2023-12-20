export default {
  $id: 'APIError',
  type: 'object',
  properties: {
    code: { type: 'string' },
    detail: { type: 'string' }
  },
  required: ['code'],
  assitionalProperties: true,
};
