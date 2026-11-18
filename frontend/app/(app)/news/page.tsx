"use client";

import React, { useState, useEffect } from "react";
import { 
  Newspaper, ExternalLink, TrendingUp, TrendingDown, 
  Minus, RefreshCw, Search, ShieldCheck 
} from "lucide-react";
import { Card, Button, Input, Skeleton } from "@/components/ios";
import { GaugeChart } from "@/components/charts/2d";
import api from "@/lib/api";

interface Article {
  id: string;
  title: string;
  publisher: string;
  link: string;
  published: string;
  related_tickers: string[];
  sentiment: {
    score: number;
    label: string;
    positive_signals: number;
    negative_signals: number;
  };
}

interface SentimentSummary {
  average_score: number;
  overall_mood: string;
  total_articles: number;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
}

export default function NewsPage() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  const fetchNews = async (searchSym: string = "") => {
    setLoading(true);
    try {
      const endpoint = searchSym ? `/news/?symbol=${encodeURIComponent(searchSym)}` : "/news/";
      const res = await api.get(endpoint);
      setSentiment(res.data.market_sentiment);
      setArticles(res.data.articles);
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(symbol);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-[#007AFF]" />
            Financial Intelligence & Sentiment
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time multi-source financial news feed analyzed with NLP sentiment lexicon
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Search ticker (e.g. AAPL)..."
            className="w-48"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
          <Button type="button" variant="plain" onClick={() => { setSymbol(""); fetchNews(""); }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </form>
      </div>

      {/* Sentiment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Overall Sentiment</p>
            <h3 className={`text-2xl font-bold mt-2 ${
              sentiment?.overall_mood.includes("Bullish") 
                ? "text-[#34C759]" 
                : sentiment?.overall_mood.includes("Bearish") 
                ? "text-[#FF3B30]" 
                : "text-neutral-700 dark:text-neutral-300"
            }`}>
              {sentiment ? sentiment.overall_mood : <Skeleton className="h-8 w-32" />}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Index Score: {sentiment ? sentiment.average_score : 0} (-1.0 to +1.0)
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {sentiment?.total_articles ?? 0} Stories Analyzed
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> Bullish Headlines
          </p>
          <h3 className="text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {sentiment ? sentiment.bullish_count : <Skeleton className="h-9 w-12" />}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {sentiment && sentiment.total_articles > 0
              ? `${Math.round((sentiment.bullish_count / sentiment.total_articles) * 100)}% of coverage`
              : "..."}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4" /> Bearish Headlines
          </p>
          <h3 className="text-3xl font-bold mt-2 text-rose-600 dark:text-rose-400">
            {sentiment ? sentiment.bearish_count : <Skeleton className="h-9 w-12" />}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {sentiment && sentiment.total_articles > 0
              ? `${Math.round((sentiment.bearish_count / sentiment.total_articles) * 100)}% of coverage`
              : "..."}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
            <Minus className="h-4 w-4" /> Neutral / Balanced
          </p>
          <h3 className="text-3xl font-bold mt-2 text-neutral-700 dark:text-neutral-300">
            {sentiment ? sentiment.neutral_count : <Skeleton className="h-9 w-12" />}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {sentiment && sentiment.total_articles > 0
              ? `${Math.round((sentiment.neutral_count / sentiment.total_articles) * 100)}% of coverage`
              : "..."}
          </p>
        </Card>
      </div>

      {/* Articles Feed */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Latest Media Releases & News Sentiment
          </h2>
          <span className="text-xs text-neutral-400">Auto-Refreshed Hourly</span>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {articles.map((art) => (
            <div key={art.id} className="p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    art.sentiment.label === "Bullish"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : art.sentiment.label === "Bearish"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  }`}>
                    {art.sentiment.label} ({art.sentiment.score > 0 ? "+" : ""}{art.sentiment.score})
                  </span>
                  <span className="text-xs text-neutral-400">• {art.publisher}</span>
                  <span className="text-xs text-neutral-400">• {art.published}</span>
                </div>
                <a
                  href={art.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-neutral-900 dark:text-neutral-100 hover:text-[#007AFF] transition-colors block group"
                >
                  {art.title}
                  <ExternalLink className="inline h-3.5 w-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                {art.related_tickers.map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs font-mono rounded bg-blue-50 dark:bg-blue-950/50 text-[#007AFF]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
