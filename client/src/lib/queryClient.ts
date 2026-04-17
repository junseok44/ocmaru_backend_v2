import { QueryClient, QueryFunction } from "@tanstack/react-query";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

type BackendOpinionUser = {
  id?: number | string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type BackendOpinion = {
  id: number | string;
  userId: number | string;
  user?: BackendOpinionUser | null;
  type?: string | null;
  content: string;
  voiceUrl?: string | null;
  likes?: number | null;
  commentCount?: number | null;
  likedByMe?: boolean | null;
  createdAt?: string | null;
};

type BackendAgenda = {
  id: number | string;
  title: string;
  description?: string | null;
  summary?: string | null;
  status?: string | null;
  agendaStatus?: string | null;
  category?: any;
  categoryId?: number | string | null;
  voteCount?: number | null;
  viewCount?: number | null;
  bookmarkCount?: number | null;
  isBookmarked?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  okinewsUrl?: string | null;
  referenceLinks?: string[] | null;
  referenceFiles?: string[] | null;
  regionalCases?: string[] | null;
  response?: unknown;
  imageUrl?: string | null;
};

function normalizeAgendaStatus(status?: string | null) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "created") return "created";
  if (normalized === "voting") return "voting";
  if (normalized === "proposing") return "proposing";
  if (normalized === "answered") return "answered";
  if (normalized === "executing") return "executing";
  if (normalized === "executed") return "executed";
  return "created";
}

function normalizeApiUrl(url: string): string {
  if (url.startsWith("/api/votes")) {
    return url.replace("/api/votes", "/api/agendas/votes");
  }
  return url;
}

function toPath(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

function inferUsername(user?: BackendOpinionUser | null): string {
  if (user?.displayName) {
    return user.displayName;
  }
  if (user?.email) {
    const [id] = user.email.split("@");
    return id || "anonymous";
  }
  return "anonymous";
}

function normalizeOpinion(opinion: BackendOpinion) {
  return {
    id: String(opinion.id),
    userId: String(opinion.userId),
    type: opinion.type ?? "text",
    content: opinion.content,
    voiceUrl: opinion.voiceUrl ?? null,
    likes: opinion.likes ?? 0,
    commentCount: opinion.commentCount ?? 0,
    isLiked: opinion.likedByMe ?? false,
    createdAt: opinion.createdAt ?? new Date().toISOString(),
    username: inferUsername(opinion.user),
    displayName: opinion.user?.displayName ?? null,
    avatarUrl: opinion.user?.avatarUrl ?? null
  };
}

function normalizeOpinionDetail(payload: any) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }
  const clusters = Array.isArray(payload.clusters) ? payload.clusters : [];
  const firstCluster = clusters[0];
  const linkedAgenda = firstCluster?.agenda
    ? {
        id: String(firstCluster.agenda.id),
        title: firstCluster.agenda.title,
        category: "",
        status: "",
        clusterId: String(firstCluster.id ?? ""),
        clusterName: firstCluster.title ?? ""
      }
    : null;

  return {
    ...normalizeOpinion(payload as BackendOpinion),
    linkedAgenda
  };
}

function normalizeOpinionComments(payload: any, path: string) {
  const opinionId = path.split("/")[3] ?? "";
  const comments = Array.isArray(payload?.comments) ? payload.comments : [];
  return comments.map((comment: any, index: number) => {
    const user = comment?.user ?? {};
    return {
      id: `comment-${index}-${user?.id ?? "unknown"}`,
      opinionId,
      userId: String(user?.id ?? ""),
      content: comment?.content ?? "",
      likes: 0,
      createdAt: new Date().toISOString(),
      username: inferUsername(user),
      displayName: user?.displayName ?? null,
      avatarUrl: user?.avatarUrl ?? null
    };
  });
}

function normalizeAgenda(agenda: BackendAgenda) {
  const nowIso = new Date().toISOString();
  return {
    id: String(agenda.id),
    title: agenda.title,
    description: agenda.description ?? agenda.summary ?? "",
    status: normalizeAgendaStatus(agenda.status ?? agenda.agendaStatus),
    categoryId: agenda.categoryId != null ? String(agenda.categoryId) : undefined,
    category: agenda.category ?? undefined,
    voteCount: agenda.voteCount ?? 0,
    viewCount: agenda.viewCount ?? 0,
    bookmarkCount: agenda.bookmarkCount ?? 0,
    isBookmarked: agenda.isBookmarked ?? false,
    createdAt: agenda.createdAt ?? nowIso,
    updatedAt: agenda.updatedAt ?? nowIso,
    okinewsUrl: agenda.okinewsUrl ?? null,
    referenceLinks: Array.isArray(agenda.referenceLinks) ? agenda.referenceLinks : [],
    referenceFiles: Array.isArray(agenda.referenceFiles) ? agenda.referenceFiles : [],
    regionalCases: Array.isArray(agenda.regionalCases) ? agenda.regionalCases : [],
    response: agenda.response ?? null,
    imageUrl: agenda.imageUrl ?? null
  };
}

function normalizeVoteType(voteType?: string | null) {
  switch ((voteType ?? "").toUpperCase()) {
    case "AGREEMENT":
      return "agree";
    case "DISAGREEMENT":
      return "disagree";
    case "NEUTRAL":
      return "neutral";
    default:
      return undefined;
  }
}

export function normalizeApiResponse(url: string, payload: any) {
  const path = toPath(normalizeApiUrl(url));
  if (
    path === "/api/opinions" ||
    path === "/api/opinions/unclustered" ||
    path === "/api/opinions/my" ||
    path === "/api/opinions/liked"
  ) {
    const opinions = Array.isArray(payload?.opinions) ? payload.opinions : [];
    return opinions.map((opinion: BackendOpinion) => normalizeOpinion(opinion));
  }
  if (/^\/api\/opinions\/[^/]+$/.test(path)) {
    return normalizeOpinionDetail(payload);
  }
  if (/^\/api\/opinions\/[^/]+\/comments$/.test(path)) {
    return normalizeOpinionComments(payload, path);
  }
  if (/^\/api\/opinions\/[^/]+\/like$/.test(path)) {
    if (typeof payload?.isLiked === "boolean") {
      return { liked: payload.isLiked };
    }
  }
  if (/^\/api\/agendas\/[^/]+\/opinions$/.test(path)) {
    const opinions = Array.isArray(payload) ? payload : [];
    return opinions.map((opinion: BackendOpinion) => normalizeOpinion(opinion));
  }
  if (path === "/api/agendas" || path === "/api/agendas/my-opinions" || path === "/api/agendas/bookmarked") {
    const agendas = Array.isArray(payload) ? payload : [];
    return agendas.map((agenda: BackendAgenda) => normalizeAgenda(agenda));
  }
  if (/^\/api\/agendas\/[^/]+$/.test(path)) {
    if (payload && typeof payload === "object") {
      return normalizeAgenda(payload as BackendAgenda);
    }
  }
  if (/^\/api\/agendas\/[^/]+\/execution-timeline$/.test(path)) {
    const items = Array.isArray(payload) ? payload : [];
    return items.map((item: any) => ({
      id: String(item?.id ?? ""),
      authorName: item?.authorName ?? "담당자",
      content: item?.content ?? "",
      imageUrl: item?.imageUrl ?? null,
      createdAt: item?.createdAt ?? new Date().toISOString()
    }));
  }
  if (/^\/api\/agendas\/votes\/user\/[^/]+\/agenda\/[^/]+$/.test(path)) {
    if (!payload || typeof payload !== "object") {
      return null;
    }
    const normalizedVoteType = normalizeVoteType(payload.voteType);
    if (!normalizedVoteType) {
      return null;
    }
    return {
      ...payload,
      voteType: normalizedVoteType
    };
  }
  return payload;
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function initAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("accessToken");
  const refreshToken = params.get("refreshToken");
  const isLoginPath = window.location.pathname === "/login";

  if (accessToken) {
    setAuthTokens({ accessToken, refreshToken: refreshToken ?? undefined });
    params.delete("accessToken");
    if (refreshToken) {
      params.delete("refreshToken");
    }
    const cleanQuery = params.toString();
    const nextPath = isLoginPath ? "/" : window.location.pathname;
    const nextUrl = cleanQuery ? `${nextPath}?${cleanQuery}` : nextPath;
    window.history.replaceState({}, "", nextUrl);
    return;
  }

  // OAuth callback인데 토큰이 없으면 홈으로 보내서 NotFound를 방지한다.
  if (isLoginPath) {
    window.history.replaceState({}, "", "/");
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text: string;
    // 204 No Content는 본문이 없으므로 statusText만 사용
    if (res.status === 204) {
      text = res.statusText;
    } else {
      try {
        text = (await res.text()) || res.statusText;
      } catch {
        text = res.statusText;
      }
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      return false;
    }

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        clearAuthTokens();
        return false;
      }

      const body = await response.json();
      if (!body?.accessToken || !body?.refreshToken) {
        clearAuthTokens();
        return false;
      }

      setAuthTokens({
        accessToken: body.accessToken,
        refreshToken: body.refreshToken
      });
      return true;
    } catch {
      clearAuthTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function withAuthHeader(headers?: HeadersInit): Headers {
  const normalized = new Headers(headers);
  const accessToken = getAccessToken();
  if (accessToken) {
    normalized.set("Authorization", `Bearer ${accessToken}`);
  }
  return normalized;
}

async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOn401 = true
) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: withAuthHeader(init.headers)
  });

  if (response.status === 401 && retryOn401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return fetch(input, {
        ...init,
        credentials: "include",
        headers: withAuthHeader(init.headers)
      });
    }
  }

  return response;
}

export { fetchWithAuth as authFetch };

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const normalizedUrl = normalizeApiUrl(url);
  let normalizedBody = data;

  if (
    normalizedBody &&
    typeof normalizedBody === "object" &&
    normalizedUrl === "/api/agendas" &&
    method.toUpperCase() === "POST"
  ) {
    const body = normalizedBody as Record<string, any>;
    normalizedBody = {
      title: body.title,
      summary: body.summary ?? body.description ?? "",
      status: typeof body.status === "string" ? body.status.toUpperCase() : body.status,
      okinewsUrl: body.okinewsUrl ?? null,
      referenceLinks: Array.isArray(body.referenceLinks) ? body.referenceLinks : [],
      referenceFiles: Array.isArray(body.referenceFiles) ? body.referenceFiles : [],
      regionalCases: Array.isArray(body.regionalCases) ? body.regionalCases : [],
      similarity: body.similarity ?? null,
      opinionIds: Array.isArray(body.opinionIds) ? body.opinionIds : []
    };
  }

  if (
    normalizedBody &&
    typeof normalizedBody === "object" &&
    /^\/api\/agendas\/[^/]+$/.test(normalizedUrl) &&
    method.toUpperCase() === "PATCH"
  ) {
    const body = normalizedBody as Record<string, any>;
    normalizedBody = {
      title: body.title,
      summary:
        Object.prototype.hasOwnProperty.call(body, "summary") ||
        Object.prototype.hasOwnProperty.call(body, "description")
          ? body.summary ?? body.description ?? ""
          : undefined,
      status:
        typeof body.status === "string" ? body.status.toUpperCase() : body.status,
      okinewsUrl: Object.prototype.hasOwnProperty.call(body, "okinewsUrl")
        ? body.okinewsUrl
        : undefined,
      referenceLinks: Object.prototype.hasOwnProperty.call(body, "referenceLinks")
        ? body.referenceLinks
        : undefined,
      referenceFiles: Object.prototype.hasOwnProperty.call(body, "referenceFiles")
        ? body.referenceFiles
        : undefined,
      regionalCases: Object.prototype.hasOwnProperty.call(body, "regionalCases")
        ? body.regionalCases
        : undefined,
      similarity: Object.prototype.hasOwnProperty.call(body, "similarity")
        ? body.similarity
        : undefined,
      opinionIds: Object.prototype.hasOwnProperty.call(body, "opinionIds")
        ? body.opinionIds
        : undefined
    };
  }

  if (
    normalizedBody &&
    typeof normalizedBody === "object" &&
    normalizedUrl === "/api/agendas/votes" &&
    method.toUpperCase() === "POST"
  ) {
    const body = normalizedBody as Record<string, any>;
    const voteType = String(body.voteType ?? "").toLowerCase();
    const normalizedVoteType =
      voteType === "agree"
        ? "AGREEMENT"
        : voteType === "disagree"
          ? "DISAGREEMENT"
          : "NEUTRAL";
    normalizedBody = {
      agendaId: body.agendaId != null ? Number(body.agendaId) : null,
      voteType: normalizedVoteType
    };
  }

  const res = await fetchWithAuth(normalizedUrl, {
    method,
    headers: normalizedBody ? { "Content-Type": "application/json" } : {},
    body: normalizedBody ? JSON.stringify(normalizedBody) : undefined
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const normalizedUrl = normalizeApiUrl(url);
    const res = await fetchWithAuth(normalizedUrl);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 404 && toPath(normalizedUrl) === "/api/agendas") {
      return [] as any;
    }

    await throwIfResNotOk(res);
    const payload = await res.json();
    return normalizeApiResponse(normalizedUrl, payload);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
