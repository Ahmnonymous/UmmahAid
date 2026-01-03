#!/usr/bin/env python3
"""
Oracle APEX ORDS API Data Fetcher
Fetches data from Oracle APEX API for all tables defined in schema.sql
"""

import os
import re
import json
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import time

# Configuration
SCHEMA_FILE = "backend/src/schema/schema.sql"
MAPPING_FILE = "table_mapping.json"
APEX_TABLES_API = "https://gd67d9561edf887-lunaxstudio.adb.af-johannesburg-1.oraclecloudapps.com/ords/sanzaf/apex_to_pg/all_tab"
API_BASE_URL = "https://gd67d9561edf887-lunaxstudio.adb.af-johannesburg-1.oraclecloudapps.com/ords/sanzaf/apex_to_pg"
OUTPUT_DIR = Path(r"D:\WORK\LUQMAN\WelfareApp_react\UmmahAid\apex")
REQUEST_TIMEOUT = 30
REQUEST_DELAY = 0.5  # Delay between requests to avoid overwhelming the API




def fetch_all_apex_tables(api_url: str) -> List[str]:
    """Fetch all table names from Oracle APEX all_tab API (handles pagination)"""
    all_tables = []
    offset = 0
    limit = 25  # Default ORDS limit per page
    page = 1
    
    try:
        # Fetch all pages using offset pagination
        while True:
            if page == 1:
                # First page: fetch without offset to get default behavior
                url = api_url
                print(f"  [*] Fetching page {page} (default)...")
            else:
                # Subsequent pages: use offset
                url = f"{api_url}?offset={offset}"
                print(f"  [*] Fetching page {page} (offset={offset})...")
            
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                
                if not items:
                    # No more items, we're done
                    break
                
                page_tables = [item['tname'] for item in items]
                all_tables.extend(page_tables)
                
                print(f"      Found {len(page_tables)} tables on page {page} (total so far: {len(all_tables)})")
                
                # If we got fewer items than the limit, we're on the last page
                if len(items) < limit:
                    break
                
                # Move to next page
                offset += len(items)
                page += 1
            else:
                print(f"[!] API returned status {response.status_code} on page {page}")
                break
                
    except Exception as e:
        print(f"[!] Error fetching APEX tables: {e}")
        import traceback
        traceback.print_exc()
    
    # Filter out views (_VW suffix) and bin tables (recycle bin)
    filtered_tables = [t for t in all_tables if not t.endswith('_VW') and not t.startswith('BIN$')]
    
    print(f"  [+] Total tables fetched: {len(all_tables)}")
    print(f"  [+] After filtering (excluding views and bin): {len(filtered_tables)}")
    
    return sorted(filtered_tables)


def load_apex_tables_from_mapping(mapping_file: str) -> List[str]:
    """Load APEX table names from mapping file"""
    try:
        with open(mapping_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('apex_tables', [])
    except FileNotFoundError:
        return []
    except Exception as e:
        print(f"[!] Error loading mapping: {e}")
        return []




def try_api_endpoint(apex_table_name: str) -> bool:
    """
    Try to access API endpoint for a specific APEX table name.
    Returns True if endpoint exists and is accessible.
    Note: Returns True even for 5xx errors, as the endpoint exists but may have server issues.
    """
    url = f"{API_BASE_URL}/{apex_table_name}"
    
    try:
        # Try a HEAD request first (lighter) to check if endpoint exists
        response = requests.head(url, timeout=REQUEST_TIMEOUT)
        # Accept 200, 405 (Method Not Allowed), and 5xx (server errors but endpoint exists)
        if response.status_code in [200, 405] or (500 <= response.status_code < 600):
            return True
        
        # Try GET as fallback
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        # Accept 200 or 5xx (endpoint exists, even if server error)
        if response.status_code == 200 or (500 <= response.status_code < 600):
            return True
            
    except requests.exceptions.RequestException:
        pass
    
    return False


def fetch_table_data(apex_table_name: str, max_retries: int = 3) -> Optional[Dict]:
    """
    Fetch data from API for a given table using exact APEX table name.
    Sends POST first (ignoring errors), then GET to fetch data.
    Includes retry logic for server errors.
    """
    # Use exact APEX table name for the endpoint
    url = f"{API_BASE_URL}/{apex_table_name}"
    
    for attempt in range(max_retries):
        try:
            # Step 1: Send POST request (ignore errors)
            try:
                post_response = requests.post(
                    url,
                    json={},
                    headers={'Content-Type': 'application/json'},
                    timeout=REQUEST_TIMEOUT
                )
                # Ignore POST response - we just need to trigger it
            except requests.exceptions.RequestException as e:
                # Ignore POST errors as per requirements
                pass
            
            # Small delay between POST and GET
            time.sleep(REQUEST_DELAY)
            
            # Step 2: Send GET request to fetch data
            get_response = requests.get(url, timeout=REQUEST_TIMEOUT)
            
            if get_response.status_code == 200:
                try:
                    data = get_response.json()
                    return data
                except json.JSONDecodeError:
                    # If response is not JSON, return as text
                    return {"raw_response": get_response.text}
            else:
                # Log detailed error information
                error_msg = f"  [!] GET request returned status {get_response.status_code}"
                
                # Try to extract error details from response
                try:
                    error_data = get_response.json()
                    if isinstance(error_data, dict):
                        error_detail = error_data.get('message') or error_data.get('error') or error_data.get('detail')
                        if error_detail:
                            error_msg += f": {error_detail}"
                except (json.JSONDecodeError, AttributeError):
                    # If not JSON, try to get text response (first 200 chars)
                    try:
                        error_text = get_response.text[:200]
                        if error_text:
                            error_msg += f": {error_text}"
                    except:
                        pass
                
                print(error_msg)
                
                # Retry on server errors (5xx) except on last attempt
                if get_response.status_code >= 500 and attempt < max_retries - 1:
                    retry_delay = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                    print(f"  [*] Retrying in {retry_delay}s (attempt {attempt + 2}/{max_retries})...")
                    time.sleep(retry_delay)
                    continue
                
                return None
        
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                retry_delay = (attempt + 1) * 2
                print(f"  [!] Request timeout for {apex_table_name}, retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                continue
            else:
                print(f"  [!] Request timeout for {apex_table_name} after {max_retries} attempts")
                return None
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                retry_delay = (attempt + 1) * 2
                print(f"  [!] Request error: {str(e)}, retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                continue
            else:
                print(f"  [!] Request error after {max_retries} attempts: {str(e)}")
                return None
    
    return None


def save_json_response(table_name: str, data: Dict, output_dir: Path):
    """Save JSON response to file with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{table_name}_{timestamp}.json"
    filepath = output_dir / filename
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"    [+] Saved: {filename}")
        return True
    except Exception as e:
        print(f"    [!] Error saving file: {e}")
        return False


def main():
    """Main execution function"""
    print("=" * 70)
    print("Oracle APEX ORDS API Data Fetcher")
    print("=" * 70)
    print()
    
    # Create output directory if it doesn't exist
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        print(f"[+] Output directory: {OUTPUT_DIR}")
    except Exception as e:
        print(f"[!] Error creating output directory: {e}")
        return
    
    # Fetch all APEX tables from API
    print(f"\n[*] Fetching all APEX tables from API...")
    apex_tables = fetch_all_apex_tables(APEX_TABLES_API)
    
    if not apex_tables:
        # Try loading from mapping file as fallback
        print(f"[*] API failed, trying to load from mapping file: {MAPPING_FILE}")
        apex_tables = load_apex_tables_from_mapping(MAPPING_FILE)
    
    if not apex_tables:
        print("[!] No APEX tables found. Exiting.")
        return
    
    print(f"[+] Found {len(apex_tables)} APEX tables to fetch")
    print(f"[*] Fetching data for ALL APEX tables...")
    print(f"[*] Files will be saved with APEX table names")
    print("-" * 70)
    
    # Process each APEX table
    successful = 0
    failed = 0
    skipped = 0
    
    for idx, apex_table_name in enumerate(apex_tables, 1):
        print(f"\n[{idx}/{len(apex_tables)}] Processing APEX table: {apex_table_name}")
        
        # Check if endpoint exists
        if not try_api_endpoint(apex_table_name):
            print(f"  [!] Endpoint not accessible, skipping")
            skipped += 1
            continue
        
        # Fetch data using exact APEX table name
        data = fetch_table_data(apex_table_name)
        
        if data is not None:
            # Save response using APEX table name as filename
            if save_json_response(apex_table_name, data, OUTPUT_DIR):
                print(f"  [+] Successfully fetched and saved")
                successful += 1
            else:
                failed += 1
        else:
            print(f"  [!] No data retrieved")
            failed += 1
        
        # Small delay between tables
        time.sleep(REQUEST_DELAY)
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"[+] Successful: {successful}")
    print(f"[-] Failed: {failed}")
    print(f"[!] Skipped: {skipped}")
    print(f"[*] Output directory: {OUTPUT_DIR}")
    print("=" * 70)


if __name__ == "__main__":
    main()

