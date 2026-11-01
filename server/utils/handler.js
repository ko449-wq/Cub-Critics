'use strict';
// createHandler(extractInput, controller) keeps controllers free of req/res so they are
// easy to test (same pattern as the SkillSpring server).
//
//   router.get('/:id', createHandler((req) => ({ id: req.params.id }), venueController.getVenue));
//
// extractInput(req) returns a plain object. The controller receives (input, req) and
// returns either nothing (-> 204) or:
//   { statusCode?, data?, headers?, cookies?, clearCookies? }
// `data` is sent as the JSON body as-is. Use `req` only for things like req.session.
// Errors thrown (or rejected promises) go to middleware/errorHandler.js (Express 5).
function createHandler(extractInput, controller) {
  return async (req, res) => {
    const input = extractInput(req);
    const result = await controller(input, req);

    if (!result) {
      res.status(204).end();
      return;
    }

    const { statusCode, data, headers, cookies, clearCookies } = result;
    if (headers) {
      for (const [name, value] of Object.entries(headers)) res.set(name, value);
    }
    for (const { name, value, options } of cookies || []) res.cookie(name, value, options);
    for (const { name, options } of clearCookies || []) res.clearCookie(name, options);

    const status = statusCode ?? (data === undefined ? 204 : 200);
    if (data === undefined) {
      res.status(status).end();
    } else {
      res.status(status).json(data);
    }
  };
}

module.exports = { createHandler };
