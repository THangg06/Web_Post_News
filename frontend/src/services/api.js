const API_BASE_URL = "http://127.0.0.1:8000/api";

function getCookie(name) {
	const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
	return match ? decodeURIComponent(match[2]) : null;
}

async function request(path, options = {}) {
	const method = (options.method || 'GET').toUpperCase();
	const headers = {
		"Content-Type": "application/json",
		...(options.headers || {}),
	};

	// Add CSRF token for unsafe methods (Django SessionAuthentication)
	if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
		const csrf = getCookie('csrftoken');
		if (csrf) headers['X-CSRFToken'] = csrf;
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers,
		credentials: 'include', // include cookies for session auth
		...options,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(errorText || `Request failed with status ${response.status}`);
	}

	return response.json();
}

function toQueryString(params = {}) {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			searchParams.append(key, String(value));
		}
	});
	const query = searchParams.toString();
	return query ? `?${query}` : "";
}

export async function getPosts(params = {}) {
	const query = toQueryString(params);
	const fullPath = `/posts/${query}`;
	console.log("🌐 getPosts calling API:", fullPath, "with params:", params);
	const data = await request(fullPath);
	console.log("🌐 getPosts response data:", data);
	return Array.isArray(data) ? data : data.results || [];
}

export async function getFeaturedPosts(limit = 3) {
	const data = await request(`/posts/${toQueryString({ latest: 1, limit })}`);
	return Array.isArray(data) ? data : data.results || [];
}

export async function getPostDetail(id) {
	const data = await request(`/posts/${id}/`);
	return data;
}

export async function getUserPosts(authorId) {
	return getPosts({ author_id: authorId });
}

export async function createPost(payload) {
	return request("/posts/", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function getCategories() {
	const data = await request("/categories/");
	return Array.isArray(data) ? data : data.results || [];
}

export async function loginUser(payload) {
	return request("/auth/login/", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function registerUser(payload) {
	return request("/auth/register/", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function logoutUser() {
	return request("/auth/logout/", {
		method: "POST",
	});
}

export async function getCurrentUserFromServer() {
	const response = await request("/auth/me/");
	return response.user || null;
}

export async function updateProfile(payload) {
	return request("/auth/profile/update/", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function changePassword(payload) {
	return request("/auth/password/change/", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function forgotPassword(payload) {
	return request("/auth/password/forgot/", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}
