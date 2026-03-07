export interface Inventory {
  Id: string;
  Title: string;
  Description?: string | null;
  IsPublic: boolean;
  OwnerId: string;
  InventoryTypeId: number;
  LastSequence: number;
  RowVersion?: string | null;
  CanWrite?: boolean;
  Tags?: string[];
  CustomIdConfig?: unknown;
  CustomFields?: unknown;
}

export interface Item {
  Id: string;
  InventoryId: string;
  CustomId: string;
  Data: Record<string, unknown>;
  CreatedById: string;
  CreatedAt: string; // ISO date string
  RowVersion?: string | null;
  CanWrite?: boolean;
}

export interface User {
  Id: string;
  UserName: string;
  Email: string;
}

export interface CustomField {
  Title: string
  Type: string
  Description?: string | null
}

export interface InventoryComment {
  Id: string;
  InventoryId: string;
  UserId: string;
  UserName: string;
  Content: string;
  CreatedAt: string;
}
