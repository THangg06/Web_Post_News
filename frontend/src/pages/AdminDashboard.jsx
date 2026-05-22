import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { getAdminDashboard, moderatePost, updateAdminUserRole } from "../services/api";

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-900 text-white",
    blue: "bg-blue-600 text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-600 text-white",
    emerald: "bg-emerald-600 text-white",
    gray: "bg-gray-100/60 border border-gray-200 text-gray-700",
  };

  return (
    <div className={`rounded-2xl p-5 shadow-md ${tones[tone] || tones.slate}`}>
      <p className="text-sm uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Badge({ status }) {
  const styles = {
    published: "bg-emerald-100 text-emerald-700",
    hidden: "bg-amber-100 text-amber-700",
    blocked: "bg-rose-100 text-rose-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function AdminDashboard() {
  const [dashboard, setDashboard] = useState({ stats: {}, posts: [], recent_users: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    author_id: "",
    status: "all",
    from: "",
    to: "",
    user_search: "",
  });
  const [userRoleLoading, setUserRoleLoading] = useState("");

  const loadDashboard = useCallback(async (overrideFilters) => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminDashboard(overrideFilters || filters);
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Không tải được dashboard admin");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const userRoleOptions = useMemo(() => ([
    { value: "user", label: "User" },
    { value: "staff", label: "Staff" },
    { value: "superuser", label: "Superuser" },
  ]), []);

  const handleModerate = async (postId, action) => {
    setActionLoading(`${postId}-${action}`);
    setError("");
    try {
      await moderatePost(postId, action);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Không thể cập nhật bài viết");
    } finally {
      setActionLoading("");
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadDashboard();
  };

  const handleResetFilters = async () => {
    const nextFilters = {
      search: "",
      author_id: "",
      status: "all",
      from: "",
      to: "",
      user_search: "",
    };
    setFilters(nextFilters);
    setError("");
    try {
      await loadDashboard(nextFilters);
    } catch (err) {
      setError(err.message || "Không tải được dashboard admin");
    }
  };

  const handleRoleChange = async (userId, role) => {
    setUserRoleLoading(String(userId));
    setError("");
    try {
      await updateAdminUserRole(userId, { role });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Không thể cập nhật vai trò người dùng");
    } finally {
      setUserRoleLoading("");
    }
  };

  const stats = dashboard.stats || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
<div className="mb-8 rounded-3xl bg-gray-100 border border-gray-200 px-6 py-8 shadow-sm">
  <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
    Moderation center
  </p>

  <h1 className="mt-2 text-3xl font-black text-gray-900">
    Post and User Management Panel
  </h1>

  <p className="mt-3 max-w-3xl text-gray-600">
    View all posts from every author, hide or block violations, and monitor user counts and current activity metrics.
  </p>
</div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={loading ? "..." : stats.total_users ?? 0} tone="gray" />
          <StatCard label="Active Users" value={loading ? "..." : stats.active_users ?? 0} tone="gray" />
          <StatCard label="Total Posts" value={loading ? "..." : stats.total_posts ?? 0} tone="gray" />
          <StatCard label="Hidden / Blocked Posts" value={loading ? "..." : `${stats.hidden_posts ?? 0} / ${stats.blocked_posts ?? 0}`} tone="gray" />
        </div>

        <form onSubmit={handleFilterSubmit} className="mt-6 rounded-3xl bg-white p-5 shadow-lg">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Search Posts / Authors</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
                placeholder="Post title, content, username..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Author ID</label>
              <input
                type="text"
                name="author_id"
                value={filters.author_id}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">From Date</label>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">To Date</label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800">
              Filter Data
            </button>
            <button type="button" onClick={handleResetFilters} className="rounded-xl bg-slate-100 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-200">
              Reset
            </button>
          </div>
        </form>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">All Posts</h2>
                <p className="text-sm text-slate-500">Posts displayed with full status for administration.</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500">Loading data...</div>
            ) : dashboard.posts.length === 0 ? (
              <div className="py-16 text-center text-slate-500">No posts available.</div>
            ) : (
              <div className="space-y-4">
                {dashboard.posts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-slate-200 p-5 hover:border-slate-300">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{post.title}</h3>
                          <Badge status={post.status} />
                        </div>
                        <p className="text-sm text-slate-600">
                          Author: <span className="font-semibold">{post.author?.username || "Anonymous"}</span>
                          {post.category?.name ? <span> • Category: {post.category.name}</span> : null}
                          <span> • Views: {post.views ?? 0}</span>
                        </p>
                        <p className="line-clamp-3 text-sm leading-6 text-slate-700">{post.content}</p>
                        {post.moderation_note ? (
                          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            Moderation Note: {post.moderation_note}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 lg:min-w-[260px] lg:justify-end">
                        <button
                          type="button"
                          onClick={() => handleModerate(post.id, "publish")}
                          disabled={actionLoading === `${post.id}-publish`}
                          className="rounded-xl bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === `${post.id}-publish` ? "Processing..." : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerate(post.id, "hide")}
                          disabled={actionLoading === `${post.id}-hide`}
                          className="rounded-xl bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === `${post.id}-hide` ? "Processing..." : "Hide"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerate(post.id, "block")}
                          disabled={actionLoading === `${post.id}-block`}
                          className="rounded-xl bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === `${post.id}-block` ? "Processing..." : "Block"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900">Post Statistics</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>Published</span><span className="font-semibold">{stats.published_posts ?? 0}</span></div>
                <div className="flex items-center justify-between"><span>Hidden</span><span className="font-semibold">{stats.hidden_posts ?? 0}</span></div>
                <div className="flex items-center justify-between"><span>Blocked</span><span className="font-semibold">{stats.blocked_posts ?? 0}</span></div>
                <div className="flex items-center justify-between"><span>Comments</span><span className="font-semibold">{stats.total_comments ?? 0}</span></div>
                <div className="flex items-center justify-between"><span>Admins</span><span className="font-semibold">{stats.admin_users ?? 0}</span></div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900">Recent Users</h2>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Search User</label>
                <input
                  type="text"
                  name="user_search"
                  value={filters.user_search}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
                  placeholder="username, email, tên..."
                />
                <button
                  type="button"
                  onClick={handleFilterSubmit}
                  className="mt-3 rounded-xl bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Search User
                </button>
              </div>
              <div className="mt-4 space-y-3 max-h-[28rem] overflow-auto pr-1">
                {(dashboard.users || dashboard.recent_users || []).map((user) => (
                  <div key={user.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{user.username}</p>
                        <p className="text-xs text-slate-500">{user.email || "No email"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_superuser ? "bg-rose-100 text-rose-700" : user.is_staff ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
                          {user.is_superuser ? "superuser" : user.is_staff ? "staff" : "user"}
                        </span>
                        <select
                          defaultValue={user.is_superuser ? "superuser" : user.is_staff ? "staff" : "user"}
                          onChange={(event) => handleRoleChange(user.id, event.target.value)}
                          disabled={userRoleLoading === String(user.id)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none"
                        >
                          {userRoleOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;