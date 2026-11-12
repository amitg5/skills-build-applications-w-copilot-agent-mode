import type { ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  items: readonly T[];
  emptyMessage: string;
  renderItem: (item: T, index: number) => ReactNode;
};

export function CapabilityCard<T>({ title, description, loading, error, items, emptyMessage, renderItem }: Props<T>) {
  let content: ReactNode;

  if (loading) {
    content = <p role="status">Loading...</p>;
  } else if (error) {
    content = <p role="alert">{error}</p>;
  } else if (items.length === 0) {
    content = <p>{emptyMessage}</p>;
  } else {
    content = <ul className="list-unstyled mb-0">{items.map((item, index) => <li key={index}>{renderItem(item, index)}</li>)}</ul>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{content}</div></section>;
}
