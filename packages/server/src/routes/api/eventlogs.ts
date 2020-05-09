import EventLog, { eventLogDocumentToEventLog } from "../../models/EventLog";

import { requireAdmin } from "../../utility/authHelpers";

/**
 * API endpoint to get a list of Event Logs. Ordered from newest to oldest.
 * {
 *   limit: number, // default 20
 *   offset: number, // default 0
 *   resourceId?: string, // if provided, returns events with the given resource ID in the detail
 * }
 *
 * The response has the shape of:
 * {
 *   estimatedTotal: number, // An estimate of the total number of Event Logs (ignores entire query)
 *   eventLogs: TEventLog[], // Event Logs which match the query
 * }
 */
export async function post(req, res, _next) {
  try {
    requireAdmin(req);
  } catch {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });
    return res.end(
      JSON.stringify({
        message: `You are not authorized to view the list of Event Logs`,
      })
    );
  }

  const limit = req.body.limit || 20;
  const offset = req.body.offset || 0;

  try {
    const query = req.body.resourceId
      ? {
          "detail.resourceId": req.body.resourceId,
        }
      : {};
    const issues = await EventLog.find(query)
      .populate("actor")
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 });

    const estimatedTotal = await EventLog.find().estimatedDocumentCount();

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    return res.end(
      JSON.stringify({
        estimatedTotal,
        eventLogs: issues.map(eventLogDocumentToEventLog),
      })
    );
  } catch (e) {
    res.writeHead(500, {
      "Content-Type": "application/json",
    });
    return res.end(
      JSON.stringify({
        message: `Error getting Event Logs: ${e.message}`,
      })
    );
  }
}
