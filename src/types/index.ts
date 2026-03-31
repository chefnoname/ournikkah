export interface Item {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
