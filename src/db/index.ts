type ColumnRef = any;
type Condition = any;
type OrderSpec = any;
type TableLike = any;

const TABLE_STATE: Record<string, Record<string, unknown>[]> = {};

function getTableName(table: unknown): string {
  if (!table || typeof table !== "object") return "";

  const symbols = Object.getOwnPropertySymbols(table as object);
  for (const symbol of symbols) {
    const label = String(symbol);
    if (label.includes("drizzle:Name") || label.includes("drizzle:OriginalName")) {
      const value = (table as Record<PropertyKey, unknown>)[symbol];
      if (typeof value === "string") return value;
    }
  }

  return (table as { name?: string }).name ?? "";
}

function getTableRows(table: TableLike): Record<string, unknown>[] {
  const tableName = getTableName(table);
  if (!tableName) throw new Error("Invalid table reference");
  if (!TABLE_STATE[tableName]) TABLE_STATE[tableName] = [];
  return TABLE_STATE[tableName];
}

function isColumn(value: unknown): value is ColumnRef {
  return !!value && typeof value === "object" && "table" in (value as object) && "name" in (value as object);
}

function isTableReference(value: unknown): boolean {
  return !!value && typeof value === "object" && !!getTableName(value);
}

function getColumnKey(column: ColumnRef): string {
  const table = column.table as Record<string, unknown> | undefined;
  if (table) {
    const entry = Object.entries(table).find(([, value]) => value === column);
    if (entry) return entry[0];
  }
  return column.name;
}

function readColumn(row: Record<string, unknown>, column: ColumnRef): unknown {
  return row[getColumnKey(column)];
}

function readValue(row: Record<string, unknown>, value: unknown): unknown {
  if (isColumn(value)) return readColumn(row, value);
  return value;
}

function matchesCondition(row: Record<string, unknown>, condition?: Condition | null): boolean {
  if (!condition) return true;

  if (condition.op === "and") {
    return (condition.conditions ?? []).every((sub: Condition) => matchesCondition(row, sub));
  }

  if (condition.op === "eq") {
    return readValue(row, condition.left) === readValue(row, condition.right);
  }

  if (condition.op === "gt") {
    return Number(readValue(row, condition.left)) > Number(readValue(row, condition.right));
  }

  if (condition.op === "gte") {
    return Number(readValue(row, condition.left)) >= Number(readValue(row, condition.right));
  }

  if (condition.op === "lt") {
    return Number(readValue(row, condition.left)) < Number(readValue(row, condition.right));
  }

  if (condition.op === "lte") {
    return Number(readValue(row, condition.left)) <= Number(readValue(row, condition.right));
  }

  return true;
}

function matchesJoinCondition(leftRow: Record<string, unknown>, rightRow: Record<string, unknown>, condition?: Condition | null): boolean {
  if (!condition) return true;

  if (condition.op === "and") {
    return (condition.conditions ?? []).every((sub: Condition) => matchesJoinCondition(leftRow, rightRow, sub));
  }

  const valueForJoin = (value: unknown): unknown => {
    if (!isColumn(value)) return value;
    const columnTableName = getTableName(value.table);
    if (columnTableName === getTableName(leftRow.__table as TableLike)) return readColumn(leftRow, value);
    return readColumn(rightRow, value);
  };

  if (condition.op === "eq") {
    return valueForJoin(condition.left) === valueForJoin(condition.right);
  }

  if (condition.op === "gt") {
    return Number(valueForJoin(condition.left)) > Number(valueForJoin(condition.right));
  }

  if (condition.op === "gte") {
    return Number(valueForJoin(condition.left)) >= Number(valueForJoin(condition.right));
  }

  if (condition.op === "lt") {
    return Number(valueForJoin(condition.left)) < Number(valueForJoin(condition.right));
  }

  if (condition.op === "lte") {
    return Number(valueForJoin(condition.left)) <= Number(valueForJoin(condition.right));
  }

  return true;
}

function orderRows(rows: Record<string, unknown>[], orders: OrderSpec[] = []): Record<string, unknown>[] {
  if (!orders.length) return rows;

  const sorted = [...rows];
  for (const order of [...orders].reverse()) {
    sorted.sort((a, b) => {
      const key = getColumnKey(order.column);
      const aValue = a[key];
      const bValue = b[key];
      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      const left = aValue instanceof Date ? aValue.getTime() : Number(aValue ?? 0);
      const right = bValue instanceof Date ? bValue.getTime() : Number(bValue ?? 0);
      if (order.dir === "desc") return right > left ? 1 : -1;
      return left > right ? 1 : -1;
    });
  }
  return sorted;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emitSelectedRow(
  row: Record<string, unknown>,
  mapping: Record<string, unknown> | undefined,
  fallbackRow: Record<string, unknown> = row,
): Record<string, unknown> {
  if (!mapping) return row;

  const next: Record<string, unknown> = {};
  for (const [alias, source] of Object.entries(mapping)) {
    if (isColumn(source)) {
      next[alias] = readColumn(row, source);
      continue;
    }
    if (isTableReference(source)) {
      next[alias] = fallbackRow;
      continue;
    }
    next[alias] = row[alias] ?? row;
  }
  return next;
}

export function eq(left: unknown, right: unknown): Condition {
  return { op: "eq", left, right };
}

export function and(...conditions: Condition[]): Condition {
  return { op: "and", conditions };
}

export function gt(left: unknown, right: unknown): Condition {
  return { op: "gt", left, right };
}

export function gte(left: unknown, right: unknown): Condition {
  return { op: "gte", left, right };
}

export function lt(left: unknown, right: unknown): Condition {
  return { op: "lt", left, right };
}

export function lte(left: unknown, right: unknown): Condition {
  return { op: "lte", left, right };
}

export function asc(column: ColumnRef): OrderSpec {
  return { column, dir: "asc" };
}

export function desc(column: ColumnRef): OrderSpec {
  return { column, dir: "desc" };
}

export function sql(strings: TemplateStringsArray, ..._values: unknown[]) {
  return String.raw(strings, ..._values);
}

class QueryBuilder {
  table?: TableLike;
  selectSpec?: Record<string, unknown>;
  condition?: Condition | null;
  join?: { table: TableLike; on: Condition };
  orders: OrderSpec[] = [];
  limitValue?: number;
  mutation?: { type: "insert" | "update" | "delete"; values?: Record<string, unknown> | Record<string, unknown>[]; patch?: Record<string, unknown> };
  returningSpec?: Record<string, unknown>;

  select(columns?: Record<string, unknown>) {
    this.selectSpec = columns ?? undefined;
    return this;
  }

  from(table: TableLike) {
    this.table = table;
    return this;
  }

  where(condition: Condition | null) {
    this.condition = condition;
    return this;
  }

  innerJoin(table: TableLike, on: Condition) {
    this.join = { table, on };
    return this;
  }

  orderBy(...orders: OrderSpec[]) {
    this.orders = orders;
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  values(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutation = { type: "insert", values };
    return this;
  }

  set(patch: Record<string, unknown>) {
    this.mutation = { type: "update", patch };
    return this;
  }

  returning(spec?: Record<string, unknown>) {
    this.returningSpec = spec;
    return this;
  }

  private async executeInsert(): Promise<Record<string, unknown>[]> {
    if (!this.table || !this.mutation || this.mutation.type !== "insert") return [];
    const rows = getTableRows(this.table);
    const source = Array.isArray(this.mutation.values) ? this.mutation.values : [this.mutation.values ?? {}];

    const inserted: Record<string, unknown>[] = [];
    for (const entry of source) {
      const record = { ...(entry ?? {}) } as Record<string, unknown>;
      const columns = Object.entries(this.table as Record<string, unknown>)
        .filter(([, column]) => isColumn(column));
      for (const [key, column] of columns) {
        if (record[key] !== undefined) continue;
        if (key === "id") record[key] = createId();
        else if (key === "createdAt") record[key] = new Date();
        else if ((column as ColumnRef).default !== undefined && typeof (column as ColumnRef).default !== "object") {
          record[key] = (column as ColumnRef).default;
        }
      }
      rows.push(record);
      inserted.push(record);
    }
    return inserted;
  }

  private async executeUpdate(): Promise<Record<string, unknown>[]> {
    if (!this.table || !this.mutation || this.mutation.type !== "update") return [];
    const rows = getTableRows(this.table);
    const updated: Record<string, unknown>[] = [];

    for (const row of rows) {
      if (!matchesCondition(row, this.condition ?? null)) continue;
      Object.assign(row, this.mutation.patch ?? {});
      updated.push(row);
    }
    return updated;
  }

  private async executeDelete(): Promise<Record<string, unknown>[]> {
    if (!this.table || !this.mutation || this.mutation.type !== "delete") return [];
    const rows = getTableRows(this.table);
    const removed: Record<string, unknown>[] = [];
    const remaining: Record<string, unknown>[] = [];

    for (const row of rows) {
      if (matchesCondition(row, this.condition ?? null)) {
        removed.push(row);
      } else {
        remaining.push(row);
      }
    }

    TABLE_STATE[getTableName(this.table)] = remaining;
    return removed;
  }

  private async executeSelect(): Promise<Record<string, unknown>[]> {
    if (!this.table) return [];

    const rows = getTableRows(this.table);
    let result = rows.filter((row) => matchesCondition(row, this.condition ?? null));

    if (this.join) {
      const joined: Record<string, unknown>[] = [];
      const joinRows = getTableRows(this.join.table);
      for (const leftRow of result) {
        for (const rightRow of joinRows) {
          if (!matchesJoinCondition(
            { ...leftRow, __table: this.table },
            { ...rightRow, __table: this.join.table },
            this.join.on,
          )) continue;
          const merged = { ...leftRow, ...rightRow };
          joined.push(this.selectSpec ? emitSelectedRow(merged, this.selectSpec, rightRow) : merged);
        }
      }
      result = joined;
    } else if (this.selectSpec) {
      result = result.map((row) => emitSelectedRow(row, this.selectSpec));
    }

    result = orderRows(result, this.orders);
    if (typeof this.limitValue === "number") result = result.slice(0, this.limitValue);
    return result;
  }

  private async execute(): Promise<Record<string, unknown>[]> {
    if (this.mutation?.type === "insert") return this.executeInsert();
    if (this.mutation?.type === "update") return this.executeUpdate();
    if (this.mutation?.type === "delete") return this.executeDelete();
    return this.executeSelect();
  }

  private async applyReturning(rows: Record<string, unknown>[]) {
    if (!this.returningSpec) return rows;
    const output: Record<string, unknown>[] = [];
    for (const row of rows) {
      const item: Record<string, unknown> = {};
      for (const [alias, source] of Object.entries(this.returningSpec)) {
        if (isColumn(source)) item[alias] = readColumn(row, source);
        else if (isTableReference(source)) item[alias] = row;
        else item[alias] = row[alias] ?? row;
      }
      output.push(item);
    }
    return output;
  }

  then(onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
    return Promise.resolve(this.execute()).then(async (rows) => {
      const finalRows = this.returningSpec ? await this.applyReturning(rows) : rows;
      return onFulfilled ? onFulfilled(finalRows) : finalRows;
    }, onRejected);
  }

  catch(handler: (reason: unknown) => unknown) {
    return Promise.resolve(this.execute()).catch(handler);
  }

  finally(callback: () => void) {
    return Promise.resolve(this.execute()).finally(callback);
  }
}

const db: any = {
  select(columns?: Record<string, unknown>) {
    return new QueryBuilder().select(columns);
  },
  insert(table: TableLike) {
    const builder = new QueryBuilder();
    builder.from(table);
    builder.mutation = { type: "insert" };
    return builder;
  },
  update(table: TableLike) {
    const builder = new QueryBuilder();
    builder.from(table);
    builder.mutation = { type: "update" };
    return builder;
  },
  delete(table: TableLike) {
    const builder = new QueryBuilder();
    builder.from(table);
    builder.mutation = { type: "delete" };
    builder.where(null);
    return builder;
  },
  execute(..._args: any[]) {
    return Promise.resolve([]);
  },
};

export { db };
export const pool = null;
