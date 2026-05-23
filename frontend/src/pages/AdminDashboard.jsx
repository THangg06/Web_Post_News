import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

import { getAdminDashboard, moderatePost, updateAdminUserRole, recomputeAdminPredictions } from "../services/api";

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
  const navigate = useNavigate();
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

  const [activeSection, setActiveSection] = useState('posts');
  const [predLoading, setPredLoading] = useState(false);

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

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.36fr_1.24fr_0.9fr]">
          {/* Sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-3xl bg-white p-4 shadow-sm border border-gray-100">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Admin Sections</h3>
              <nav className="flex flex-col gap-2">
                <button onClick={() => setActiveSection('overview')} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${activeSection==='overview' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                  Overview
                </button>
                <button onClick={() => setActiveSection('posts')} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${activeSection==='posts' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                  Posts
                </button>
                <button onClick={() => setActiveSection('users')} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${activeSection==='users' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                  Users
                </button>
                <button onClick={() => setActiveSection('stats')} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${activeSection==='stats' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                  Statistics
                </button>
                <button onClick={() => setActiveSection('predictions')} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${activeSection==='predictions' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                  Model Predictions
                </button>
              </nav>
            </div>
          </aside>

          <div className="rounded-3xl bg-white p-6 shadow-lg">
            {activeSection === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                <p className="mt-2 text-sm text-slate-600">Quick summary of site activity and moderation status.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Total Users" value={loading ? "..." : stats.total_users ?? 0} tone="gray" />
                  <StatCard label="Active Users" value={loading ? "..." : stats.active_users ?? 0} tone="gray" />
                  <StatCard label="Total Posts" value={loading ? "..." : stats.total_posts ?? 0} tone="gray" />
                  <StatCard label="Hidden / Blocked" value={loading ? "..." : `${stats.hidden_posts ?? 0} / ${stats.blocked_posts ?? 0}`} tone="gray" />
                </div>
              </div>
            )}

            {activeSection === 'posts' && (
              <div>
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
                              <h3
          className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer"
          onClick={() => navigate(`/post/${post.id}`)}
        >
          {post.title}
        </h3>
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

                          <div className="flex flex-col items-end gap-3 lg:min-w-[260px]">
                            <div className="text-sm text-slate-600">Prediction: <span className={`font-semibold ${post.predicted_tag === 'fake' ? 'text-rose-600' : 'text-emerald-600'}`}>{post.predicted_tag ?? 'N/A'}</span></div>
                            <div className="text-xs text-slate-500">Fake: {post.fake_probability ? `${Math.round(post.fake_probability*100)}%` : '—'}</div>
                            <div className="flex flex-wrap gap-2">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Users</h2>
                <p className="text-sm text-slate-500">Manage user roles and activity.</p>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-auto pr-1">
                  {(dashboard.users || []).map((user) => (
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
            )}

            {activeSection === 'stats' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Post Statistics</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Published</span><span className="font-semibold">{stats.published_posts ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span>Hidden</span><span className="font-semibold">{stats.hidden_posts ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span>Blocked</span><span className="font-semibold">{stats.blocked_posts ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span>Comments</span><span className="font-semibold">{stats.total_comments ?? 0}</span></div>
                  <div className="flex items-center justify-between"><span>Admins</span><span className="font-semibold">{stats.admin_users ?? 0}</span></div>
                </div>
              </div>
            )}

            {activeSection === 'predictions' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Model Predictions</h2>
                <p className="text-sm text-slate-500">Summary of ML predictions attached to posts.</p>
                <div className="mt-4">
                  {/* Summary counts */}
                  {loading ? (
                    <div className="text-sm text-slate-500">Loading…</div>
                  ) : (
                    (() => {
                      const posts = dashboard.posts || [];
                      const total = posts.length;
                      const fake = posts.filter(p => p.predicted_tag === 'fake').length;
                      const real = posts.filter(p => p.predicted_tag === 'real').length;
                      return (
                        <div className="grid gap-4 md:grid-cols-3">
                          <StatCard label="Total Scanned" value={total} tone="gray" />
                          <StatCard label="Predicted Fake" value={fake} tone="rose" />
                          <StatCard label="Predicted Real" value={real} tone="emerald" />
                        </div>
                      );
                    })()
                  )}

                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Top Suspicious Posts</h3>
                      <div>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Recompute predictions for all posts? This may take some time.')) return;
                            setPredLoading(true);
                            try {
                              await recomputeAdminPredictions();
                              await loadDashboard();
                              alert('Recompute finished. Dashboard refreshed.');
                            } catch (err) {
                              alert(err.message || 'Failed to recompute predictions');
                            } finally {
                              setPredLoading(false);
                            }
                          }}
                          className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          {predLoading ? 'Running…' : 'Recompute All'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {(dashboard.posts || []).filter(p => p.predicted_tag === 'fake').slice(0,8).map(p => (
                        <div key={p.id} className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-rose-700">{p.title}</div>
                              <div className="text-xs text-rose-600">{p.author?.username || 'Anonymous'} • {p.category?.name || '—'}</div>
                            </div>
                            <div className="text-sm font-bold text-rose-700">{p.fake_probability ? `${Math.round(p.fake_probability*100)}%` : '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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