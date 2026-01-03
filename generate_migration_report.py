#!/usr/bin/env python3
"""
Data Migration Report Generator
Analyzes backend schema and JSON files to generate comprehensive migration mapping report
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple
from collections import defaultdict
from datetime import datetime

# Configuration
SCHEMA_FILE = "backend/src/schema/schema.sql"
JSON_DIR = Path("apex")
OUTPUT_REPORT = "MIGRATION_REPORT.md"

# PostgreSQL type mappings
PG_TYPE_MAPPINGS = {
    'SERIAL': 'INTEGER',
    'BIGINT': 'INTEGER',
    'INT': 'INTEGER',
    'SMALLINT': 'INTEGER',
    'DECIMAL': 'NUMBER',
    'NUMERIC': 'NUMBER',
    'REAL': 'NUMBER',
    'DOUBLE PRECISION': 'NUMBER',
    'VARCHAR': 'STRING',
    'TEXT': 'STRING',
    'CHAR': 'STRING',
    'BOOLEAN': 'BOOLEAN',
    'DATE': 'DATE',
    'TIMESTAMP': 'DATETIME',
    'TIMESTAMPTZ': 'DATETIME',
    'BYTEA': 'BINARY',
    'UUID': 'STRING'
}

# Common column name mappings
COLUMN_NAME_MAPPINGS = {
    'id': ['id', 'ID', '_id', 'ID'],
    'name': ['name', 'Name', 'NAME'],
    'created_by': ['created_by', 'created_by', 'Created_By', 'CREATED_BY', 'createdBy'],
    'created_at': ['created_at', 'Created_At', 'CREATED_AT', 'date_created', 'Date_Created', 'created_on', 'Created_On'],
    'updated_by': ['updated_by', 'Updated_By', 'UPDATED_BY', 'updatedBy'],
    'updated_at': ['updated_at', 'Updated_At', 'UPDATED_AT', 'updated_on', 'Updated_On'],
}


def normalize_name(name: str) -> str:
    """Normalize name for comparison (lowercase, remove special chars)"""
    return re.sub(r'[_\s-]', '', name.lower())


def extract_table_definitions(schema_file: str) -> Dict[str, Dict]:
    """Extract table definitions from schema.sql"""
    tables = {}
    
    try:
        with open(schema_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match CREATE TABLE statements (handles multi-line)
        pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\((.*?)\);'
        
        matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
        
        for table_name, table_body in matches:
            columns = {}
            constraints = []
            
            # Split by commas, but be careful with nested parentheses
            parts = []
            current_part = ''
            paren_depth = 0
            
            for char in table_body:
                if char == '(':
                    paren_depth += 1
                    current_part += char
                elif char == ')':
                    paren_depth -= 1
                    current_part += char
                elif char == ',' and paren_depth == 0:
                    parts.append(current_part.strip())
                    current_part = ''
                else:
                    current_part += char
            
            if current_part.strip():
                parts.append(current_part.strip())
            
            # Process each part
            for part in parts:
                part = part.strip()
                if not part or part.startswith('--'):
                    continue
                
                # Skip CONSTRAINT definitions for now
                if part.upper().startswith('CONSTRAINT'):
                    constraints.append(part)
                    continue
                
                # Match column definition: NAME TYPE [constraints]
                col_match = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$', part, re.IGNORECASE)
                if col_match:
                    col_name = col_match.group(1)
                    col_def = col_match.group(2).strip()
                    
                    # Extract data type (handle VARCHAR(255), DECIMAL(12,2), etc.)
                    type_match = re.match(r'([A-Za-z_][A-Za-z0-9_\s]*?)(?:\([^)]+\))?', col_def, re.IGNORECASE)
                    if type_match:
                        col_type = type_match.group(1).strip().upper()
                        
                        # Handle type with parameters
                        if '(' in col_def:
                            param_match = re.search(r'\(([^)]+)\)', col_def)
                            if param_match:
                                col_type += f"({param_match.group(1)})"
                        
                        # Check for constraints
                        is_nullable = 'NOT NULL' not in col_def.upper()
                        is_primary = 'PRIMARY KEY' in col_def.upper()
                        has_default = 'DEFAULT' in col_def.upper()
                        is_unique = 'UNIQUE' in col_def.upper()
                        
                        columns[col_name] = {
                            'type': col_type,
                            'nullable': is_nullable,
                            'primary_key': is_primary,
                            'has_default': has_default,
                            'unique': is_unique,
                            'full_definition': col_def
                        }
            
            tables[table_name] = {
                'columns': columns,
                'constraints': constraints
            }
        
        print(f"[+] Extracted {len(tables)} table definitions from schema")
        return tables
    
    except Exception as e:
        print(f"[!] Error reading schema: {e}")
        import traceback
        traceback.print_exc()
        return {}


def analyze_json_file(json_path: Path) -> Optional[Dict]:
    """Analyze JSON file structure and extract keys/types"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if it's the ORDS format with "items" array
        if 'items' in data and isinstance(data['items'], list):
            items = data['items']
            if not items:
                return {
                    'keys': [],
                    'sample_count': 0,
                    'structure': 'empty'
                }
            
            # Analyze first few items to determine structure
            sample_size = min(10, len(items)) if items else 0
            all_keys = set()
            key_types = {}
            
            for item in items[:sample_size]:
                if isinstance(item, dict):
                    all_keys.update(item.keys())
                    for key, value in item.items():
                        if key not in key_types:
                            key_types[key] = type(value).__name__
                        elif key_types[key] != type(value).__name__:
                            key_types[key] = 'mixed'
            
            return {
                'keys': sorted(all_keys),
                'key_types': key_types,
                'sample_count': sample_size,
                'total_count': len(items),
                'structure': 'items_array'
            }
        else:
            # Direct object or array
            if isinstance(data, list):
                if data:
                    all_keys = set()
                    for item in data[:10]:
                        if isinstance(item, dict):
                            all_keys.update(item.keys())
                    return {
                        'keys': sorted(all_keys),
                        'key_types': {},
                        'sample_count': min(10, len(data)),
                        'total_count': len(data),
                        'structure': 'direct_array'
                    }
                else:
                    return {
                        'keys': [],
                        'key_types': {},
                        'sample_count': 0,
                        'total_count': 0,
                        'structure': 'empty_array'
                    }
            elif isinstance(data, dict):
                return {
                    'keys': sorted(data.keys()),
                    'key_types': {k: type(v).__name__ for k, v in data.items()},
                    'sample_count': 1,
                    'total_count': 1,
                    'structure': 'direct_object'
                }
        
        return {
            'keys': [],
            'key_types': {},
            'sample_count': 0,
            'total_count': 0,
            'structure': 'unknown'
        }
    
    except Exception as e:
        print(f"  [!] Error reading {json_path.name}: {e}")
        return None


def find_best_column_match(json_key: str, table_columns: Dict[str, Dict], table_name: str = "") -> Optional[Tuple[str, float]]:
    """Find best matching column name for a JSON key"""
    json_normalized = normalize_name(json_key)
    table_normalized = normalize_name(table_name)
    
    best_match = None
    best_score = 0.0
    
    for col_name, col_info in table_columns.items():
        col_normalized = normalize_name(col_name)
        
        # Exact match
        if json_normalized == col_normalized:
            return (col_name, 1.0)
        
        # Check common mappings
        for standard, variants in COLUMN_NAME_MAPPINGS.items():
            if json_key in variants and col_name in variants:
                return (col_name, 0.95)
        
        # Check for ID fields first (before table name matching)
        if json_normalized.endswith('_id') or json_normalized.endswith('id'):
            base = json_normalized.replace('_id', '').replace('id', '')
            if col_normalized == 'id':
                return (col_name, 0.95)
            elif col_normalized.endswith(base) or base in col_normalized:
                score = 0.85
                if score > best_score:
                    best_score = score
                    best_match = col_name
        
        # Special case: JSON key matches table name -> likely maps to "Name" column
        # e.g., "nationality" in Nationality table -> "Name"
        # But only if it's not an ID field
        if table_normalized and json_normalized == table_normalized and not (json_normalized.endswith('_id') or json_normalized.endswith('id')):
            if col_normalized == 'name':
                return (col_name, 0.9)
        
        # Partial match (contains)
        if json_normalized in col_normalized or col_normalized in json_normalized:
            score = min(len(json_normalized), len(col_normalized)) / max(len(json_normalized), len(col_normalized))
            if score > best_score:
                best_score = score
                best_match = col_name
        
        # Check for common patterns
        # e.g., "file_id" -> "File_ID", "comment_id" -> "ID" (if table is Comments)
        if json_normalized.endswith('_id') or json_normalized.endswith('id'):
            base = json_normalized.replace('_id', '').replace('id', '')
            if col_normalized == 'id' or col_normalized.endswith(base):
                score = 0.8
                if score > best_score:
                    best_score = score
                    best_match = col_name
    
    if best_score > 0.5:
        return (best_match, best_score)
    
    return None


def map_json_to_table(json_keys: List[str], table_columns: Dict[str, Dict], table_name: str = "") -> Dict:
    """Map JSON keys to table columns"""
    mapping = {}
    unmapped_json = []
    unmapped_columns = set(table_columns.keys())
    
    for json_key in json_keys:
        match = find_best_column_match(json_key, table_columns, table_name)
        if match:
            col_name, score = match
            mapping[json_key] = {
                'column': col_name,
                'confidence': score,
                'column_info': table_columns[col_name]
            }
            unmapped_columns.discard(col_name)
        else:
            unmapped_json.append(json_key)
    
    return {
        'mapping': mapping,
        'unmapped_json_keys': unmapped_json,
        'unmapped_columns': sorted(unmapped_columns)
    }


def determine_migration_strategy(mapping_result: Dict, table_columns: Dict, json_info: Dict) -> Dict:
    """Determine migration strategy for a table"""
    mapped_count = len(mapping_result['mapping'])
    total_json_keys = len(json_info['keys'])
    total_columns = len(table_columns)
    required_columns = [col for col, info in table_columns.items() 
                       if not info['nullable'] and not info['has_default'] and not info['primary_key']]
    
    # Check if required columns are mapped
    required_mapped = all(col in [m['column'] for m in mapping_result['mapping'].values()] 
                         for col in required_columns)
    
    # Determine category
    if json_info['total_count'] == 0:
        category = 'empty'
    elif mapped_count == 0:
        category = 'skip'
    elif mapped_count == total_json_keys and len(mapping_result['unmapped_columns']) == 0:
        category = 'safe'
    elif required_mapped and mapped_count >= total_json_keys * 0.7:
        category = 'partial'
    else:
        category = 'skip'
    
    # Determine insert strategy
    has_primary_key = any(info['primary_key'] for info in table_columns.values())
    
    if category == 'safe' or category == 'partial':
        if has_primary_key:
            strategy = 'UPSERT'
        else:
            strategy = 'INSERT'
    else:
        strategy = 'SKIP'
    
    return {
        'category': category,
        'strategy': strategy,
        'mapped_ratio': mapped_count / total_json_keys if total_json_keys > 0 else 0,
        'required_columns_mapped': required_mapped
    }


def generate_report(tables: Dict, json_files: List[Path]) -> str:
    """Generate comprehensive migration report"""
    report = []
    report.append("# Data Migration Report")
    report.append(f"\n**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    report.append("---\n")
    
    # Summary statistics
    total_tables = len(tables)
    total_json_files = len(json_files)
    
    report.append("## Executive Summary\n")
    report.append(f"- **Total Backend Tables:** {total_tables}")
    report.append(f"- **Total JSON Files:** {total_json_files}\n")
    
    # Process each JSON file
    json_by_table = {}
    for json_file in json_files:
        # Extract table name from filename (remove timestamp)
        table_match = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)_\d{8}_\d{6}\.json$', json_file.name)
        if table_match:
            table_name = table_match.group(1)
            json_by_table[table_name] = json_file
    
    # Mapping for applicant-related tables (backend table -> possible JSON file names)
    # These tables should look for JSON files with APPLICANT_ prefix
    applicant_table_mapping = {
        'Attachments': ['APPLICANT_ATTACHMENT', 'APPLICANT_ATTACHMENTS'],
        'Food_Assistance': ['APPLICANT_FOOD_ASSISTANCE'],
        'Home_Visit': ['APPLICANT_HOME_VISIT', 'APPLICANT_HOME_VISITS'],
        'Relationships': ['APPLICANT_RELATIONSHIP', 'APPLICANT_RELATIONSHIPS'],
        'Tasks': ['APPLICANT_TASK', 'APPLICANT_TASKS'],
        'Comments': ['APPLICANT_COMMENT', 'APPLICANT_COMMENTS'],
        'Programs': ['APPLICANT_PROGRAM', 'APPLICANT_PROGRAMS'],
        'Financial_Assistance': ['APPLICANT_FINANCIAL_ASSISTANCE', 'APPLICANT_TRANSACTION'],
        'Applicant_Details': ['APPLICANT_REGISTRATION', 'APPLICANT_DETAILS'],
        'Applicant_Income': ['APPLICANT_INCOME'],
        'Applicant_Expense': ['APPLICANT_EXPENSE'],
    }
    
    categories = defaultdict(list)
    
    for table_name in sorted(tables.keys()):
        json_file = json_by_table.get(table_name)
        
        if not json_file:
            # Try to find by normalized name
            table_normalized = normalize_name(table_name)
            for json_name, json_path in json_by_table.items():
                if normalize_name(json_name) == table_normalized:
                    json_file = json_path
                    break
        
        # Try APPLICANT_ prefix mapping for applicant-related tables
        if not json_file and table_name in applicant_table_mapping:
            for applicant_name in applicant_table_mapping[table_name]:
                json_file = json_by_table.get(applicant_name)
                if json_file:
                    break
        
        # Also try reverse: if JSON has APPLICANT_ prefix, try matching without it
        if not json_file:
            for json_name, json_path in json_by_table.items():
                # Check if JSON name starts with APPLICANT_ and table name matches the suffix
                if json_name.startswith('APPLICANT_'):
                    suffix = json_name.replace('APPLICANT_', '')
                    # Try various transformations
                    suffix_normalized = normalize_name(suffix)
                    # Direct match
                    if suffix_normalized == table_normalized:
                        json_file = json_path
                        break
                    # Try matching with common variations
                    # e.g., APPLICANT_ATTACHMENT -> Attachments
                    if suffix_normalized.endswith('s') and normalize_name(table_name + 's') == suffix_normalized:
                        json_file = json_path
                        break
                    if table_normalized.endswith('s') and normalize_name(table_name[:-1]) == suffix_normalized:
                        json_file = json_path
                        break
                    # Try with underscores removed
                    suffix_underscore = suffix.replace('_', '').lower()
                    table_underscore = table_name.replace('_', '').lower()
                    if suffix_underscore == table_underscore:
                        json_file = json_path
                        break
        
        table_info = tables[table_name]
        table_columns = table_info['columns']
        
        if json_file:
            json_info = analyze_json_file(json_file)
            if json_info and 'total_count' in json_info:
                mapping_result = map_json_to_table(json_info['keys'], table_columns, table_name)
                strategy_info = determine_migration_strategy(mapping_result, table_columns, json_info)
                
                categories[strategy_info['category']].append(table_name)
                
                # Generate table section
                report.append(f"\n## Table: `{table_name}`\n")
                report.append(f"**Status:** {strategy_info['category'].upper()} | **Strategy:** {strategy_info['strategy']}\n")
                
                # JSON Info
                report.append("### JSON Structure\n")
                report.append(f"- **Source File:** `{json_file.name}`")
                report.append(f"- **Structure:** {json_info['structure']}")
                report.append(f"- **Total Records:** {json_info['total_count']}")
                report.append(f"- **JSON Keys:** {len(json_info['keys'])}\n")
                
                if json_info['keys']:
                    report.append("**Keys Found:**\n")
                    for key in json_info['keys']:
                        key_type = json_info.get('key_types', {}).get(key, 'unknown')
                        report.append(f"- `{key}` ({key_type})")
                    report.append("")
                
                # Backend Schema
                report.append("### Backend Schema\n")
                report.append(f"- **Total Columns:** {len(table_columns)}")
                report.append(f"- **Required Columns:** {len([c for c, i in table_columns.items() if not i['nullable'] and not i['has_default']])}\n")
                
                # Column Mapping
                report.append("### Column Mapping\n")
                report.append("| JSON Key | Backend Column | Confidence | Type Match | Notes |\n")
                report.append("|----------|----------------|------------|------------|-------|\n")
                
                for json_key, map_info in sorted(mapping_result['mapping'].items()):
                    col_info = map_info['column_info']
                    confidence = map_info['confidence']
                    json_type = json_info.get('key_types', {}).get(json_key, 'unknown')
                    pg_type = col_info['type']
                    
                    # Type compatibility check
                    type_match = "✓" if are_types_compatible(json_type, pg_type) else "⚠"
                    
                    notes = []
                    if not col_info['nullable']:
                        notes.append("Required")
                    if col_info['primary_key']:
                        notes.append("PK")
                    if confidence < 0.9:
                        notes.append(f"Low confidence ({confidence:.2f})")
                    
                    notes_str = ", ".join(notes) if notes else "-"
                    report.append(f"| `{json_key}` | `{map_info['column']}` | {confidence:.2f} | {type_match} | {notes_str} |\n")
                
                # Unmapped JSON keys
                if mapping_result['unmapped_json_keys']:
                    report.append("\n**⚠ Unmapped JSON Keys:**\n")
                    for key in mapping_result['unmapped_json_keys']:
                        report.append(f"- `{key}`")
                    report.append("")
                
                # Unmapped columns
                if mapping_result['unmapped_columns']:
                    report.append("\n**⚠ Unmapped Backend Columns:**\n")
                    for col in mapping_result['unmapped_columns']:
                        col_info = table_columns[col]
                        required = " (Required)" if not col_info['nullable'] and not col_info['has_default'] else ""
                        report.append(f"- `{col}` ({col_info['type']}){required}")
                    report.append("")
                
                # Migration Strategy
                report.append("### Migration Strategy\n")
                report.append(f"- **Category:** {strategy_info['category'].upper()}")
                report.append(f"- **Insert Strategy:** {strategy_info['strategy']}")
                report.append(f"- **Mapping Coverage:** {strategy_info['mapped_ratio']:.1%}")
                report.append(f"- **Required Columns Mapped:** {'✓' if strategy_info['required_columns_mapped'] else '✗'}\n")
                
                # Transformation requirements
                transformations = []
                for json_key, map_info in mapping_result['mapping'].items():
                    json_type = json_info.get('key_types', {}).get(json_key, 'unknown')
                    pg_type = map_info['column_info']['type']
                    
                    if not are_types_compatible(json_type, pg_type):
                        transformations.append(f"- `{json_key}` → `{map_info['column']}`: Convert {json_type} to {pg_type}")
                    
                    if json_key != map_info['column']:
                        transformations.append(f"- `{json_key}` → `{map_info['column']}`: Rename field")
                
                if transformations:
                    report.append("**Required Transformations:**\n")
                    for trans in transformations:
                        report.append(trans)
                    report.append("")
                else:
                    report.append("**No transformations required.**\n")
                
                # Warnings
                warnings = []
                
                # Check if this is an applicant-related table that might need APPLICANT_ prefix
                is_applicant_related = table_name in applicant_table_mapping
                if is_applicant_related and strategy_info['category'] == 'skip':
                    warnings.append(f"💡 **NOTE:** This is an applicant-related table. Try fetching with APPLICANT_ prefix: {', '.join(applicant_table_mapping[table_name])}")
                elif strategy_info['category'] == 'skip':
                    warnings.append("⚠️ **CRITICAL:** This table should be skipped - insufficient mapping coverage")
                elif strategy_info['category'] == 'partial':
                    warnings.append("⚠️ **WARNING:** Partial mapping - some columns may need manual handling")
                if not strategy_info['required_columns_mapped']:
                    warnings.append("⚠️ **WARNING:** Not all required columns are mapped - data may be incomplete")
                if mapping_result['unmapped_json_keys']:
                    warnings.append(f"⚠️ **INFO:** {len(mapping_result['unmapped_json_keys'])} JSON keys not mapped (may be ignored)")
                if mapping_result['unmapped_columns']:
                    required_unmapped = [c for c in mapping_result['unmapped_columns'] 
                                       if not table_columns[c]['nullable'] and not table_columns[c]['has_default']]
                    if required_unmapped:
                        warnings.append(f"⚠️ **WARNING:** {len(required_unmapped)} required columns not mapped - may cause insert failures")
                
                if warnings:
                    report.append("### Warnings & Notes\n")
                    for warning in warnings:
                        report.append(warning)
                    report.append("")
                
                report.append("---\n")
        else:
            report.append(f"\n## Table: `{table_name}`\n")
            report.append("**Status:** NO JSON FILE FOUND\n")
            report.append("⚠️ No corresponding JSON file found for this table.\n")
            report.append("---\n")
    
    # Category Summary
    report.append("\n## Migration Summary by Category\n\n")
    report.append("| Category | Count | Tables |\n")
    report.append("|----------|-------|--------|\n")
    report.append(f"| **SAFE** | {len(categories['safe'])} | {', '.join(categories['safe']) if categories['safe'] else 'None'} |\n")
    report.append(f"| **PARTIAL** | {len(categories['partial'])} | {', '.join(categories['partial']) if categories['partial'] else 'None'} |\n")
    report.append(f"| **SKIP** | {len(categories['skip'])} | {', '.join(categories['skip']) if categories['skip'] else 'None'} |\n")
    report.append(f"| **EMPTY** | {len(categories['empty'])} | {', '.join(categories['empty']) if categories['empty'] else 'None'} |\n")
    
    # Applicant-related tables summary
    applicant_skip_tables = [t for t in categories['skip'] if t in applicant_table_mapping]
    if applicant_skip_tables:
        report.append("\n## Applicant-Related Tables (Need APPLICANT_ Prefix)\n\n")
        report.append("The following tables are applicant-related and should be re-fetched with the `APPLICANT_` prefix:\n\n")
        report.append("| Backend Table | Suggested API Endpoint(s) |\n")
        report.append("|---------------|--------------------------|\n")
        for table in sorted(applicant_skip_tables):
            endpoints = ', '.join([f"`{e}`" for e in applicant_table_mapping[table]])
            report.append(f"| `{table}` | {endpoints} |\n")
        report.append("\n**Note:** Re-run the fetch script (`fetch_apex_data.py`) - it has been updated to automatically try APPLICANT_ prefix variations for these tables.\n")
    
    return "\n".join(report)


def are_types_compatible(json_type: str, pg_type: str) -> bool:
    """Check if JSON type is compatible with PostgreSQL type"""
    json_type_lower = json_type.lower()
    pg_type_upper = pg_type.upper()
    
    # Map JSON types
    if json_type_lower in ['int', 'integer', 'long']:
        json_pg_type = 'INTEGER'
    elif json_type_lower in ['float', 'double', 'number']:
        json_pg_type = 'NUMBER'
    elif json_type_lower in ['str', 'string', 'unicode']:
        json_pg_type = 'STRING'
    elif json_type_lower == 'bool' or json_type_lower == 'boolean':
        json_pg_type = 'BOOLEAN'
    elif json_type_lower in ['none', 'null']:
        return True  # NULL is compatible with any nullable column
    else:
        json_pg_type = 'UNKNOWN'
    
    # Check compatibility
    if 'INT' in pg_type_upper or 'SERIAL' in pg_type_upper:
        return json_pg_type in ['INTEGER', 'NUMBER']
    elif 'DECIMAL' in pg_type_upper or 'NUMERIC' in pg_type_upper or 'REAL' in pg_type_upper:
        return json_pg_type in ['INTEGER', 'NUMBER']
    elif 'VARCHAR' in pg_type_upper or 'TEXT' in pg_type_upper or 'CHAR' in pg_type_upper:
        return json_pg_type == 'STRING'
    elif 'BOOLEAN' in pg_type_upper:
        return json_pg_type == 'BOOLEAN'
    elif 'DATE' in pg_type_upper or 'TIMESTAMP' in pg_type_upper:
        return json_pg_type == 'STRING'  # Dates come as strings in JSON
    elif 'BYTEA' in pg_type_upper:
        return json_pg_type == 'STRING'  # Base64 encoded
    
    return True  # Default to compatible if unsure


def main():
    """Main execution"""
    print("=" * 70)
    print("Data Migration Report Generator")
    print("=" * 70)
    print()
    
    # Extract table definitions
    print(f"[*] Reading schema file: {SCHEMA_FILE}")
    tables = extract_table_definitions(SCHEMA_FILE)
    
    if not tables:
        print("[!] No tables found. Exiting.")
        return
    
    # Find JSON files
    print(f"\n[*] Scanning JSON directory: {JSON_DIR}")
    if not JSON_DIR.exists():
        print(f"[!] JSON directory not found: {JSON_DIR}")
        return
    
    json_files = sorted(JSON_DIR.glob("*.json"))
    print(f"[+] Found {len(json_files)} JSON files")
    
    # Generate report
    print("\n[*] Generating migration report...")
    report = generate_report(tables, json_files)
    
    # Save report
    output_path = Path(OUTPUT_REPORT)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n[+] Report saved to: {output_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()

