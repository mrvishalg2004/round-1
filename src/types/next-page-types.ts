import { Metadata } from 'next';

export type PageParams = {
  id: string;
};

export interface PageProps<T = Record<string, string>> {
  params: T;
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface LayoutProps<T = Record<string, string>> {
  children: React.ReactNode;
  params: T;
}

export interface MetadataProps<T = Record<string, string>> {
  params: T;
  searchParams: { [key: string]: string | string[] | undefined };
} 