import ServiceRequest from "../models/ServiceRequest.js";

export async function getDashboard(req, res) {
  const [statistics] = await ServiceRequest.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        pending: [{ $match: { status: "Pending" } }, { $count: "count" }],
        inProgress: [{ $match: { status: "In Progress" } }, { $count: "count" }],
        resolved: [{ $match: { status: "Resolved" } }, { $count: "count" }],
        highPriority: [{ $match: { priority: "High" } }, { $count: "count" }],
        byCategory: [
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  const count = (rows) => rows[0]?.count ?? 0;
  res.json({
    data: {
      totalRequests: count(statistics.total),
      pending: count(statistics.pending),
      inProgress: count(statistics.inProgress),
      resolved: count(statistics.resolved),
      highPriority: count(statistics.highPriority),
      byCategory: statistics.byCategory,
    },
  });
}
