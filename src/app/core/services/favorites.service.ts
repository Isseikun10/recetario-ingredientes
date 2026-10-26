import { Injectable, computed, signal } from '@angular/core';

import { RecipeSummary } from '../models/recipe.model';

const STORAGE_KEY = 'recetario.favorites.v1';

/** Favoritos persistidos en localStorage. */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly _items = signal<readonly RecipeSummary[]>(this.load());

  /** Lista completa de favoritos. */
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);
  /** Set de IDs para consultas O(1) desde plantillas o computed. */
  readonly ids = computed(() => new Set(this._items().map((r) => r.id)));

  // Atajo estable para usar en templates: `favorites.has()`
  has = (id: string): boolean => this.ids().has(id);

  toggle(recipe: RecipeSummary): boolean {
    const wasFavorite = this.ids().has(recipe.id);
    const next = wasFavorite
      ? this._items().filter((r) => r.id !== recipe.id)
      : [...this._items(), this.toSummary(recipe)];

    this._items.set(next);
    this.persist(next);
    // Devuelve el nuevo estado: útil para feedback (toast, animación…).
    return !wasFavorite;
  }

  /** Elimina un favorito por ID (idempotente). */
  remove(id: string): void {
    if (!this.ids().has(id)) return;
    const next = this._items().filter((r) => r.id !== id);
    this._items.set(next);
    this.persist(next);
  }

  clear(): void {
    if (this._items().length === 0) return;
    this._items.set([]);
    this.persist([]);
  }

  /** Normaliza a los campos que realmente persistimos. */
  private toSummary(r: RecipeSummary): RecipeSummary {
    return { id: r.id, name: r.name, thumb: r.thumb };
  }

  private load(): readonly RecipeSummary[] {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return []; // Acceso a localStorage bloqueado (modo privado estricto, SSR…).
    }
    if (!raw) return [];

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Deduplicar por id y descartar entradas inválidas en una pasada.
      const seen = new Set<string>();
      const result: RecipeSummary[] = [];
      for (const r of parsed) {
        if (
          typeof r?.id === 'string' &&
          typeof r?.name === 'string' &&
          typeof r?.thumb === 'string' &&
          !seen.has(r.id)
        ) {
          seen.add(r.id);
          result.push({ id: r.id, name: r.name, thumb: r.thumb });
        }
      }
      return result;
    } catch {
      return [];
    }
  }

    private persist(items: readonly RecipeSummary[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
        // Modo privado o almacenamiento lleno: la app sigue funcionando sin persistir.
        }
  }
}