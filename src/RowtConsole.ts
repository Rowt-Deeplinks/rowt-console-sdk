import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import {
  AnalyticsFilters,
  AnalyticsResponse,
  CreateLinkDTO,
  CreateProjectDTO,
  RowtGetProjectOptions,
  RowtLoginDTO,
  RowtLoginResponseDTO,
  RowtProject,
  RowtTokens,
  RowtUpdatePasswordDTO,
  RowtUser,
  TierStats,
  UpdateProjectDTO,
  UsageStats,
} from "./types";

interface RefreshSubscriber {
  onSuccess: (token: string) => void;
  onError: (error: Error) => void;
}

class RowtConsole {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: RefreshSubscriber[] = [];

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to attach token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;
        if (response && response.status === 401 && !config._retry) {
          console.log("401 detected, initiating token refresh...");
          config._retry = true;

          if (!this.isRefreshing) {
            this.isRefreshing = true;
            console.log("Refreshing token...");
            this.refreshToken()
              .then((newToken) => {
                console.log("Token refresh successful.");
                this.onRefreshed(newToken);
              })
              .catch((err) => {
                console.log("Token refresh failed, clearing tokens.", err);
                this.clearTokens();
                this.onRefreshFailed(err);
              })
              .finally(() => {
                this.isRefreshing = false;
              });
          }

          return new Promise((resolve, reject) => {
            this.subscribeTokenRefresh(
              (token: string) => {
                console.log("Retrying request with new token...");
                config.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(config));
              },
              (error: Error) => {
                console.log("Request failed due to refresh failure");
                reject(error);
              }
            );
          });
        }

        return Promise.reject(error);
      },
    );
  }

  private subscribeTokenRefresh(
    onSuccess: (token: string) => void,
    onError: (error: Error) => void
  ) {
    this.refreshSubscribers.push({ onSuccess, onError });
  }

  private onRefreshed(newToken: string) {
    this.refreshSubscribers.forEach(({ onSuccess }) => onSuccess(newToken));
    this.refreshSubscribers = [];
  }

  private onRefreshFailed(error: Error) {
    this.refreshSubscribers.forEach(({ onError }) => onError(error));
    this.refreshSubscribers = [];
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await this.client.post<RowtTokens>(
      "/auth/refresh",
      { refresh_token: refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: undefined,
        },
      },
    );

    const { access_token, refresh_token } = response.data;
    if (!access_token || !refresh_token) {
      throw new Error("Invalid token response");
    }

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    return access_token;
  }

  private clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  async login(credentials: RowtLoginDTO): Promise<RowtUser> {
    const response: AxiosResponse<RowtLoginResponseDTO> =
      await this.client.post("/auth/login", credentials);
    this.storeTokens(response.data.tokens);
    return response.data.user;
  }

  async logout(): Promise<string> {
    try {
      const tokens = {
        access_token: localStorage.getItem("access_token"),
        refresh_token: localStorage.getItem("refresh_token"),
      };

      await this.client.post("/auth/logout", tokens, {
        headers: {
          "Content-Type": "application/json",
          Authorization: undefined,
        },
      });
    } finally {
      this.clearTokens();
      return "Logout successful";
    }
  }

  async validateUser(RowtLoginDTO: RowtLoginDTO): Promise<boolean> {
    console.log("Validating user with credentials:", RowtLoginDTO);
    const response: AxiosResponse<{ isValid: boolean }> =
      await this.client.post("/auth/validate", RowtLoginDTO);
    console.log("Validation response:", response.data);
    const { isValid } = response.data;

    console.log("User validation result:", isValid);

    return isValid;
  }

  async createUser(email: string, password: string): Promise<RowtUser> {
    const response: AxiosResponse<RowtUser> = await this.client.post(
      "/users/create",
      {
        email,
        password,
      },
    );
    return response.data;
  }

  async getProfile(): Promise<RowtUser> {
    const response: AxiosResponse<RowtUser> =
      await this.client.get("/auth/profile");
    return response.data;
  }

  async getCurrentUser(): Promise<RowtUser> {
    const response: AxiosResponse<RowtUser> =
      await this.client.get("/users/currentUser");
    return response.data;
  }

  async updatePassword(
    updatePasswordDTO: RowtUpdatePasswordDTO,
  ): Promise<RowtUser> {
    const response: AxiosResponse<RowtUser> = await this.client.post(
      "/auth/updatepassword",
      updatePasswordDTO,
    );
    return response.data;
  }

  async getLinksByProjectId(
    projectId: string,
    includeInteractions: boolean = false,
  ): Promise<any> {
    if (!projectId) {
      throw new Error("Missing projectId");
    }

    const payload = { projectId, includeInteractions };
    const response: AxiosResponse = await this.client.post(
      "/link/byProjectId",
      payload,
    );
    return response.data;
  }

  async getProjectById(
    projectId: string,
    options?: RowtGetProjectOptions,
  ): Promise<RowtProject> {
    if (!projectId) {
      throw new Error("Missing projectId");
    }

    const defaultOptions: RowtGetProjectOptions = {
      includeLinks: false,
      includeInteractions: false,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const payload = { id: projectId, options: mergedOptions };
    const response: AxiosResponse<RowtProject> = await this.client.post(
      `/projects/getById`,
      payload,
    );
    return response.data;
  }

  async getAnalytics(
    projectId: string,
    startDate: Date,
    endDate: Date,
    filters?: AnalyticsFilters,
  ): Promise<AnalyticsResponse> {
    if (!projectId) {
      throw new Error("Missing projectId");
    }

    const params = new URLSearchParams({
      projectId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Add filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.client.get(`/analytics?${params.toString()}`);

    // Parse dates
    const data = response.data;
    return {
      query: {
        ...data.query,
        startDate: new Date(data.query.startDate),
        endDate: new Date(data.query.endDate),
        executedAt: new Date(data.query.executedAt),
      },
      summary: data.summary,
      timeSeries: {
        ...data.timeSeries,
        data: data.timeSeries.data.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp),
        })),
      },
      aggregations: data.aggregations,
    };
  }

  private storeTokens(tokens: RowtTokens) {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }

  async getUserProjects(): Promise<RowtProject[]> {
    const response: AxiosResponse<RowtProject[]> = await this.client.post(
      "/projects/getUserProjects",
    );
    return response.data;
  }

  async updateProject(project: UpdateProjectDTO): Promise<RowtProject> {
    console.log("Updating project:", project);
    const response: AxiosResponse<RowtProject> = await this.client.post(
      `/projects/update`,
      project,
    );
    return response.data;
  }

  async createProject(project: CreateProjectDTO): Promise<RowtProject> {
    const response: AxiosResponse<RowtProject> = await this.client.post(
      `/projects/create`,
      project,
    );
    return response.data;
  }

  async regenerateApiKey(projectId: string): Promise<string> {
    if (!projectId) {
      throw new Error("Missing projectId");
    }

    const response: AxiosResponse<{ apiKey: string }> = await this.client.post(
      "/projects/generateApiKey",
      { projectId },
    );

    return response.data.apiKey;
  }

  async getUserUsage(userId: string): Promise<UsageStats> {
    const response = await this.client.post("/users/usage", { userId });
    return response.data;
  }

  async getUserTier(userId: string): Promise<TierStats> {
    const response = await this.client.post("/users/tier", { userId });
    return response.data;
  }

  async createLink(link: CreateLinkDTO): Promise<string> {
    const response: AxiosResponse<string> = await this.client.post(
      "/link",
      link,
    );
    return response.data;
  }

  // Validate current tokens by attempting to fetch user profile
  async validateTokens(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Manually trigger token refresh
  async manualRefreshToken(): Promise<boolean> {
    try {
      await this.refreshToken();
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }
}

export default RowtConsole;
