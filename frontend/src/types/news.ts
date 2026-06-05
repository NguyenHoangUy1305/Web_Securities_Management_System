export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content?: string;
  source: string;
  source_url?: string;
  image_url?: string;
  related_symbols?: string[];
  category: string;
  published_at: string;
  created_at: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
}

export interface MarketDashboard {
  market_status: 'open' | 'closed';
  indices: Array<{
    name: string;
    value: number;
    change: number;
    change_percent: number;
  }>;
  top_news: NewsItem[];
  market_summary: string;
}
