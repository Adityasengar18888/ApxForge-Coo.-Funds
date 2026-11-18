"use client";

import React, { useState } from "react";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ios/Card";
import { Button } from "@/components/ios/Button";
import { Input } from "@/components/ios/Input";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([
    { symbol: "AAPL", name: "Apple Inc.", price: 232.5, change: "+1.25%" },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 144.8, change: "+3.10%" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 428.2, change: "+0.65%" },
    { symbol: "TSLA", name: "Tesla Inc.", price: 218.4, change: "-1.15%" },
  ]);
  const [newSym, setNewSym] = useState("");

  const addItem = () => {
    if (newSym.trim()) {
      setWatchlist([
        ...watchlist,
        {
          symbol: newSym.trim().toUpperCase(),
          name: `${newSym.trim().toUpperCase()} Asset`,
          price: 150.0,
          change: "+0.00%",
        },
      ]);
      setNewSym("");
    }
  };

  const removeItem = (sym: string) => {
    setWatchlist(watchlist.filter((i) => i.symbol !== sym));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-text">Watchlist</h1>
          <p className="text-[15px] text-ios-secondaryText">
            Personal tracked securities and price alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Add symbol..."
            value={newSym}
            onChange={(e) => setNewSym(e.target.value)}
            className="w-40 py-1.5 text-[13px]"
          />
          <Button variant="primary" size="md" onClick={addItem} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {watchlist.map((item) => (
          <Card key={item.symbol} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[20px] font-bold text-ios-blue">{item.symbol}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.symbol)}
                  className="text-ios-secondaryText hover:text-ios-red transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[13px] text-ios-secondaryText mt-0.5">{item.name}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-ios-hairline flex items-baseline justify-between">
              <span className="text-[22px] font-bold text-ios-text">${item.price}</span>
              <span
                className={`text-[13px] font-semibold ${
                  item.change.startsWith("+") ? "text-ios-green" : "text-ios-red"
                }`}
              >
                {item.change}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

