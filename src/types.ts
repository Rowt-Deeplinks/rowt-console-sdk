export interface RowtLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  fallbackUrlOverride?: string;
  additionalMetadata?: Record<string, any>;
  properties: Record<string, any>;
  lifetimeClicks: number;
  interactions?: RowtInteraction[];
  createdAt: Date;
}

export interface RowtInteraction {
  id: string;
  link: RowtLink;
  referer?: string;
  country?: string;
  city?: string;
  ip?: string;
  device?: string;
  os?: string;
  browser?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  timestamp: Date;
}

export interface RowtLoginDTO {
  email: string;
  password: string;
}

export interface RowtTokens {
  access_token: string;
  refresh_token: string;
}

export interface RowtUpdatePasswordDTO {
  email: string;
  password: string;
}

export interface RowtUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  customerId: string;
}

export interface RowtLoginResponseDTO {
  tokens: RowtTokens;
  user: RowtUser;
}

export interface RowtGetProjectOptions {
  includeLinks?: boolean;
  includeInteractions?: boolean;
  startDate?: Date;
  endDate?: Date;
  getPreviousPeriod?: boolean;
}

export interface RowtProject {
  id: string;
  apiKey: string;
  userId: string;
  name: string;
  baseUrl: string;
  fallbackUrl: string;
  appstoreId?: string;
  playstoreId?: string;
  iosScheme?: string;
  androidScheme?: string;
  links?: RowtLink[];
  previousPeriodInteractionCount?: number;
  interactions?: RowtInteraction[];
}

export interface UpdateProjectDTO {
  id: string;
  apiKey: string;
  userId: string;
  name: string;
  baseUrl: string;
  fallbackUrl: string;
  appstoreId?: string;
  playstoreId?: string;
  iosScheme?: string;
  androidScheme?: string;
}
export interface CreateProjectDTO {
  userId: string;
  name: string;
  baseUrl: string;
  fallbackUrl: string;
}

export interface UsageStats {
  links: number;
  interactions: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface TierStats {
  tier: number;
  allowances: {
    links: number;
    interactions: number;
  };
}

export interface CreateLinkDTO {
  projectId: string;
  apiKey: string;
  url: string;
  customShortcode?: string;
  expiration?: Date;
  title?: string;
  description?: string;
  imageUrl?: string;
  fallbackUrlOverride?: string;
  additionalMetadata?: Record<string, any>;
  properties?: Record<string, any>;
}

export interface AnalyticsQuery {
  projectId: string;
  startDate: Date;
  endDate: Date;
  executedAt: Date;
  appliedFilters?: Record<string, any>;
}

export interface AnalyticsSummary {
  totalInteractions: number;
  uniqueVisitors: number;
  timeRange: string;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  count: number;
  label: string;
}

export interface TimeSeries {
  granularity: 'hour' | 'day';
  data: TimeSeriesDataPoint[];
}

export interface AggregationItem {
  value: string;
  count: number;
  percentage: number;
}

export interface LinkAggregationItem extends AggregationItem {
  linkTitle: string | null;
  linkUrl: string;
}

export interface AggregationData {
  items: AggregationItem[];
  hasMore: boolean;
}

export interface LinkAggregationData {
  items: LinkAggregationItem[];
  hasMore: boolean;
}

export interface Aggregations {
  topDestinations: AggregationData;
  topLinks: LinkAggregationData;
  topReferrers: AggregationData;
  topCountries: AggregationData;
  topCities: AggregationData;
  linkTypes: AggregationData;
  topOS: AggregationData;
  topBrowsers: AggregationData;
  topDevices: AggregationData;
  topUtmSources: AggregationData;
  topUtmMediums: AggregationData;
  topUtmCampaigns: AggregationData;
  topUtmTerms: AggregationData;
  topUtmContents: AggregationData;
  topResolvedUrls: AggregationData;
}

export interface AnalyticsResponse {
  query: AnalyticsQuery;
  summary: AnalyticsSummary;
  timeSeries: TimeSeries;
  aggregations: Aggregations;
}

export interface AnalyticsFilters {
  linkId?: string;
  country?: string;
  city?: string;
  device?: string;
  os?: string;
  browser?: string;
  referer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  resolvedUrl?: string;
  topN?: number;
  timezone?: string;
}

export interface AnalyticsBreakdownRequest {
  projectId: string;
  dimension: string;
  startDate: Date;
  endDate: Date;
  timezone?: string;
  limit?: number;
  offset?: number;
  filters?: AnalyticsFilters;
}

export interface AnalyticsBreakdownResponse {
  query: {
    projectId: string;
    dimension: string;
    startDate: Date;
    endDate: Date;
    executedAt: Date;
    appliedFilters?: Record<string, any>;
  };
  dimension: string;
  items: AggregationItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ObservabilityActor {
  type: string;
  id?: string;
  email?: string;
}

export interface ObservabilityResource {
  type: string;
  id: string;
  attributes: {
    url?: string;
    title?: string;
    projectId?: string;
    projectName?: string;
    [key: string]: any;
  };
}

export interface ObservabilityEvent {
  id: string;
  type: string;
  timestamp: Date;
  actor: ObservabilityActor;
  resource: ObservabilityResource;
  metadata: Record<string, any>;
}

export interface ObservabilityEventsRequest {
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  eventTypes?: string[];
  search?: string;
  linkId?: string;
  limit?: number;
  offset?: number;
  sortDirection?: 'ASC' | 'DESC';
}

export interface ObservabilityEventsResponse {
  events: ObservabilityEvent[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}
