/**
 * TypeScript mirror of backend/app/schemas/erd_schema.py
 *
 * Keep these in sync with the Pydantic models. If you add a field to the
 * Python side, add it here too — the React Flow canvas and Monaco editor
 * both consume these types directly.
 */

// ============================================================================
// Enums
// ============================================================================

export enum DBTarget {
  POSTGRESQL = "postgresql",
  MYSQL      = "mysql",
  SQLITE     = "sqlite",
}

export enum DataType {
  // Numeric
  SMALLINT   = "SMALLINT",
  INTEGER    = "INTEGER",
  BIGINT     = "BIGINT",
  REAL       = "REAL",
  FLOAT      = "FLOAT",
  DOUBLE     = "DOUBLE",
  DECIMAL    = "DECIMAL",
  NUMERIC    = "NUMERIC",
  SERIAL     = "SERIAL",
  BIGSERIAL  = "BIGSERIAL",
  // String
  CHAR       = "CHAR",
  VARCHAR    = "VARCHAR",
  TEXT       = "TEXT",
  // Date / Time
  DATE       = "DATE",
  TIME       = "TIME",
  TIMESTAMP  = "TIMESTAMP",
  TIMESTAMPTZ = "TIMESTAMPTZ",
  INTERVAL   = "INTERVAL",
  // Boolean
  BOOLEAN    = "BOOLEAN",
  // Binary / Document
  BYTEA      = "BYTEA",
  BLOB       = "BLOB",
  JSON       = "JSON",
  JSONB      = "JSONB",
  // Identity
  UUID       = "UUID",
  // User-defined
  ENUM       = "ENUM",
}

export enum RelationshipType {
  ONE_TO_ONE   = "one_to_one",
  ONE_TO_MANY  = "one_to_many",
  MANY_TO_MANY = "many_to_many",
}

export enum FKAction {
  CASCADE     = "CASCADE",
  SET_NULL    = "SET_NULL",
  SET_DEFAULT = "SET_DEFAULT",
  RESTRICT    = "RESTRICT",
  NO_ACTION   = "NO_ACTION",
}

export enum IndexType {
  BTREE    = "BTREE",
  HASH     = "HASH",
  GIN      = "GIN",
  GIST     = "GIST",
  FULLTEXT = "FULLTEXT",
}

// ============================================================================
// Schema models
// ============================================================================

export interface Column {
  name:              string;
  data_type:         DataType;
  type_params?:      Record<string, number>;
  is_primary_key:    boolean;
  is_nullable:       boolean;
  is_unique:         boolean;
  is_auto_increment: boolean;
  default_value?:    string;
  check_constraint?: string;
  enum_values?:      string[];
  comment?:          string;
}

export interface ForeignKey {
  constraint_name?:    string;
  columns:             string[];
  referenced_table:    string;
  referenced_columns:  string[];
  on_delete:           FKAction;
  on_update:           FKAction;
}

export interface Index {
  name:         string;
  columns:      string[];
  index_type:   IndexType;
  is_unique:    boolean;
  where_clause?: string;
}

export interface Table {
  name:         string;
  columns:      Column[];
  foreign_keys: ForeignKey[];
  indexes:      Index[];
  comment?:     string;
}

export interface Relationship {
  name?:              string;
  from_table:         string;
  from_column:        string;
  to_table:           string;
  to_column:          string;
  relationship_type:  RelationshipType;
  label?:             string;
  junction_table?:    string;  // required for MANY_TO_MANY
}

export interface EnumDefinition {
  name:     string;
  values:   string[];
  comment?: string;
}

export interface ERDSchema {
  schema_version: string;
  db_target:      DBTarget;
  schema_name:    string;
  title?:         string;
  description?:   string;
  tables:         Table[];
  relationships:  Relationship[];
  enums:          EnumDefinition[];
}

// ============================================================================
// React Flow canvas types (Phase 3)
// ============================================================================

/** Data attached to each table node in the React Flow graph. */
export interface TableNodeData {
  table:       Table;
  isSelected?: boolean;
}

/** Data attached to each relationship edge in the React Flow graph. */
export interface RelationshipEdgeData {
  relationship: Relationship;
}

// ============================================================================
// API request / response shapes (Phase 2)
// ============================================================================

export interface GenerateRequest {
  prompt:    string;
  db_target: DBTarget;
}

export interface GenerateResponse {
  schema:     ERDSchema;
  sql:        string;
  migration:  string;
  prisma:     string;
  dbml:       string;
  cached:     boolean;  // true if result was served from Redis
}

export interface RefineRequest {
  schema:        ERDSchema;
  follow_up:     string;
}
