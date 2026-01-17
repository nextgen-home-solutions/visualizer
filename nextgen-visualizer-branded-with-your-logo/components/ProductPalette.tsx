"use client";

import React, { useMemo, useState } from "react";
import type { ProductCatalog, ProductItem, SelectedProduct } from "../lib/types";

type Props = {
  catalog: ProductCatalog;
  selected: SelectedProduct[];
  onChange: (next: SelectedProduct[]) => void;
};

export default function ProductPalette({ catalog, selected, onChange }: Props) {
  const [activeCat, setActiveCat] = useState(catalog.categories[0]?.id ?? "");

  const active = useMemo(() => catalog.categories.find(c => c.id === activeCat), [catalog, activeCat]);

  function add(item: ProductItem) {
    const existing = selected.find(s => s.sku === item.sku);
    if (existing) {
      onChange(selected.map(s => s.sku === item.sku ? { ...s, qty: s.qty + (s.unit === "sqft" ? 20 : 1) } : s));
      return;
    }
    const defaultQty = item.unit === "sqft" ? 20 : 1;
    onChange([...selected, { ...item, qty: defaultQty }]);
  }

  function setQty(sku: string, qty: number) {
    onChange(selected.map(s => s.sku === sku ? { ...s, qty } : s));
  }

  function remove(sku: string) {
    onChange(selected.filter(s => s.sku !== sku));
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        {catalog.categories.map(c => (
          <button
            key={c.id}
            className="btn"
            style={{ opacity: c.id === activeCat ? 1 : 0.72 }}
            onClick={() => setActiveCat(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="productList">
        {(active?.items ?? []).map(item => (
          <div className="product" key={item.sku}>
            <img src={item.image} alt={item.name} />
            <div>
              <div className="name">{item.name}</div>
              <div className="meta">{item.brand} • ${item.price.toFixed(2)} / {item.unit}</div>
            </div>
            <button className="btn primary" onClick={() => add(item)}>Add</button>
          </div>
        ))}
      </div>

      <div className="hr" />

      <div className="label">Selected products</div>
      {selected.length === 0 ? (
        <div className="small">No products selected yet.</div>
      ) : (
        <div className="productList">
          {selected.map(s => (
            <div className="product" key={s.sku}>
              <img src={s.image} alt={s.name} />
              <div>
                <div className="name">{s.name}</div>
                <div className="meta">{s.brand} • ${s.price.toFixed(2)} / {s.unit}</div>
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="pill">Qty</span>
                  <input
                    className="input"
                    style={{ width: 120 }}
                    type="number"
                    min={0}
                    step={s.unit === "sqft" ? 10 : 1}
                    value={s.qty}
                    onChange={(e) => setQty(s.sku, Number(e.target.value))}
                  />
                  <button className="btn" onClick={() => remove(s.sku)}>Remove</button>
                </div>
              </div>
              <div className="pill">${(s.qty * s.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
