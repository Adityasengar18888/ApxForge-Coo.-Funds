const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    // Relative URL in browser uses Next.js rewrite proxy - avoids IPv6 refusal and CORS
    return "/api/v1";
  }
  return "http://127.0.0.1:8000/api/v1";
};

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = baseUrl.endsWith("/api/v1") && cleanEndpoint.startsWith("/api/v1")
    ? `${baseUrl.slice(0, -7)}${cleanEndpoint}`
    : `${baseUrl}${cleanEndpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Check stored auth token if not explicitly provided
  let token = options.token;
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("access_token") || undefined;
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    const err: any = new Error(errorDetail);
    err.response = { status: response.status, data: { detail: errorDetail } };
    throw err;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: async <T = any>(url: string) => {
    const data = await apiClient<T>(url);
    return { data };
  },
  post: async <T = any>(url: string, body?: any) => {
    const data = await apiClient<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  put: async <T = any>(url: string, body?: any) => {
    const data = await apiClient<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  delete: async <T = any>(url: string) => {
    const data = await apiClient<T>(url, {
      method: "DELETE",
    });
    return { data };
  },
};

export default api;
