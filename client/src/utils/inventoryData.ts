import type { CustomField } from '../types';

type GenericObject = Record<string, unknown>;

function isObject(value: unknown): value is GenericObject {
  return typeof value === 'object' && value !== null;
}

function getString(source: GenericObject, keyA: string, keyB: string): string | null {
  const valueA = source[keyA];
  if (typeof valueA === 'string') return valueA;

  const valueB = source[keyB];
  if (typeof valueB === 'string') return valueB;

  return null;
}

function getBoolean(source: GenericObject, keyA: string, keyB: string): boolean {
  const valueA = source[keyA];
  if (typeof valueA === 'boolean') return valueA;

  const valueB = source[keyB];
  if (typeof valueB === 'boolean') return valueB;

  return false;
}

export function parseCustomFields(raw: unknown): CustomField[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(isObject)
    .map((field) => {
      const type = getString(field, 'Type', 'type');
      const title = getString(field, 'Title', 'title');
      const description = getString(field, 'Description', 'description');

      if (!type || !title) return null;

      const result: CustomField = {
        Type: type,
        Title: title,
        Description: description,
        ShowInTable: getBoolean(field, 'ShowInTable', 'showInTable'),
      };

      return result;
    })
    .filter((field): field is CustomField => field !== null);
}

export function parseCustomIdConfig(raw: unknown): GenericObject | null {
  if (!isObject(raw)) return null;
  return raw;
}