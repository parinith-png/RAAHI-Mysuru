import os
import csv
import json

CSV_PATH = r"C:\Users\parin\OneDrive\Desktop\react\shark\AccidentReports_UTF8.csv"
OUTPUT_DIR = r"c:\Users\parin\.gemini\antigravity\playground\volatile-kuiper\data\processed"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Bounding box config
MYSURU_CITY_BBOX = {
    "min_lat": 12.25,
    "max_lat": 12.38,
    "min_lng": 76.60,
    "max_lng": 76.72
}

MYSURU_DIST_BBOX = {
    "min_lat": 11.75,
    "max_lat": 12.75,
    "min_lng": 75.80,
    "max_lng": 77.20
}

KARNATAKA_BBOX = {
    "min_lat": 11.0,
    "max_lat": 19.0,
    "min_lng": 74.0,
    "max_lng": 79.0
}

VALID_SEVERITIES = {"Fatal", "Grievous Injury", "Simple Injury", "Damage Only", "Not Applicable"}

# Shifted rows identified during audit
SHIFTED_ROW_INDICES = {10180, 12149, 67978, 144934, 151242, 230453, 259718, 279490, 300195}

def get_severity_weight(severity):
    if severity == "Fatal":
        return 5
    elif severity == "Grievous Injury":
        return 3
    elif severity == "Simple Injury":
        return 2
    else:
        return 1

def main():
    total_records = 0
    valid_coords_count = 0
    invalid_or_missing_count = 0
    
    # Audit tracking for Mysuru
    direct_city_count = 0
    direct_dist_count = 0
    spatial_only_count = 0
    
    mysuru_records_pool = []
    karnataka_records_pool = []
    
    # Grid cell spatial aggregation for Karnataka (0.02 degree resolution approx 2.2km)
    GRID_RESOLUTION = 0.02
    karnataka_grid = {}

    print("Executing dataset validation and processing...")
    
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames if reader.fieldnames else []
        
        for idx, row in enumerate(reader):
            total_records += 1
            row_idx = idx + 2 # Header offsets
            
            # Explicitly exclude the 9 shifted rows
            if row_idx in SHIFTED_ROW_INDICES:
                continue
                
            district = row.get("DISTRICTNAME", "").strip()
            unit = row.get("UNITNAME", "").strip()
            severity = row.get("Severity", "").strip()
            lat_str = row.get("Latitude", "0").strip()
            lng_str = row.get("Longitude", "0").strip()
            road_name = row.get("Accident_Road", "").strip()
            year = row.get("Year", "").strip()
            crime_no = row.get("Crime_No", "").strip()
            
            # Parse coordinates
            try:
                lat = float(lat_str)
                lng = float(lng_str)
                has_coords = True
            except ValueError:
                lat = 0.0
                lng = 0.0
                has_coords = False
                
            valid_lat_lng = (
                has_coords and 
                lat != 0.0 and 
                lng != 0.0 and 
                KARNATAKA_BBOX["min_lat"] <= lat <= KARNATAKA_BBOX["max_lat"] and 
                KARNATAKA_BBOX["min_lng"] <= lng <= KARNATAKA_BBOX["max_lng"]
            )
            
            if not valid_lat_lng:
                invalid_or_missing_count += 1
                continue
                
            valid_coords_count += 1
            
            # Keep severity normalized and labeled as historical weight
            clean_severity = severity if severity in VALID_SEVERITIES else "Simple Injury"
            weight = get_severity_weight(clean_severity)
            
            record_obj = {
                "lat": lat,
                "lng": lng,
                "severity": clean_severity,
                "weight": weight,
                "road": road_name or "Unknown Road",
                "year": int(year) if year.isdigit() else 2020,
                "district": district,
                "unit": unit,
                "crime_no": crime_no
            }
            
            # Bounding box checks
            in_city_bbox = MYSURU_CITY_BBOX["min_lat"] <= lat <= MYSURU_CITY_BBOX["max_lat"] and MYSURU_CITY_BBOX["min_lng"] <= lng <= MYSURU_CITY_BBOX["max_lng"]
            in_dist_bbox = MYSURU_DIST_BBOX["min_lat"] <= lat <= MYSURU_DIST_BBOX["max_lat"] and MYSURU_DIST_BBOX["min_lng"] <= lng <= MYSURU_DIST_BBOX["max_lng"]
            
            is_city_match = district.lower() == "mysuru city"
            is_dist_match = district.lower() == "mysuru dist"
            
            is_mysuru_related = is_city_match or is_dist_match or in_dist_bbox
            
            if is_mysuru_related:
                if is_city_match:
                    direct_city_count += 1
                    record_obj["origin"] = "direct_city"
                elif is_dist_match:
                    direct_dist_count += 1
                    record_obj["origin"] = "direct_dist"
                else:
                    spatial_only_count += 1
                    record_obj["origin"] = "spatial_only"
                mysuru_records_pool.append(record_obj)
            else:
                # Add to general Karnataka pool
                karnataka_records_pool.append(record_obj)

    # 1. Deduplicate Mysuru Records using Coordinates + Year (avoiding scientific notation Crime_No collisions)
    seen_mysuru_keys = set()
    unique_mysuru_records = []
    mysuru_duplicates_count = 0
    
    for r in mysuru_records_pool:
        # Deduplication key is combination of rounded coordinates (to 5 decimals ~1 meter) + year + severity
        key = (round(r["lat"], 5), round(r["lng"], 5), r["year"], r["severity"])
        if key in seen_mysuru_keys:
            mysuru_duplicates_count += 1
        else:
            seen_mysuru_keys.add(key)
            unique_mysuru_records.append(r)
            
    # Calculate unique Mysuru box limits
    if unique_mysuru_records:
        min_lat_mys = min(r["lat"] for r in unique_mysuru_records)
        max_lat_mys = max(r["lat"] for r in unique_mysuru_records)
        min_lng_mys = min(r["lng"] for r in unique_mysuru_records)
        max_lng_mys = max(r["lng"] for r in unique_mysuru_records)
    else:
        min_lat_mys = max_lat_mys = min_lng_mys = max_lng_mys = 0.0

    # Write Mysuru GeoJSON (Detailed Points retained for precise routing checks, ~7,800 records)
    mysuru_features = []
    for r in unique_mysuru_records:
        mysuru_features.append({
            "type": "Feature",
            "properties": {
                "severity_label": r["severity"],
                "historical_severity_weight": r["weight"],
                "road": r["road"],
                "year": r["year"],
                "origin": r["origin"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [r["lng"], r["lat"]]
            }
        })
        
    mysuru_geojson = {
        "type": "FeatureCollection",
        "features": mysuru_features
    }
    
    mysuru_out = os.path.join(OUTPUT_DIR, "mysuru_accidents.geojson")
    with open(mysuru_out, "w", encoding="utf-8") as f:
        json.dump(mysuru_geojson, f, indent=2)
    print(f"Verified {len(unique_mysuru_records)} unique Mysuru records exported to {mysuru_out}")

    # 2. Grid spatial aggregation for all 95,723 valid Karnataka records
    # We aggregate all valid spots across Karnataka (excluding Mysuru list to avoid double indicators)
    for r in karnataka_records_pool:
        grid_x = round(r["lng"] / GRID_RESOLUTION) * GRID_RESOLUTION
        grid_y = round(r["lat"] / GRID_RESOLUTION) * GRID_RESOLUTION
        cell_id = (round(grid_x, 4), round(grid_y, 4))
        
        if cell_id not in karnataka_grid:
            karnataka_grid[cell_id] = {
                "sum_lat": 0.0,
                "sum_lng": 0.0,
                "count": 0,
                "risk_score": 0,
                "fatal": 0,
                "grievous": 0,
                "simple": 0,
                "damage": 0
            }
        
        cell = karnataka_grid[cell_id]
        cell["sum_lat"] += r["lat"]
        cell["sum_lng"] += r["lng"]
        cell["count"] += 1
        cell["risk_score"] += r["weight"]
        
        sev = r["severity"]
        if sev == "Fatal":
            cell["fatal"] += 1
        elif sev == "Grievous Injury":
            cell["grievous"] += 1
        elif sev == "Simple Injury":
            cell["simple"] += 1
        else:
            cell["damage"] += 1

    # Convert Grid cells to GeoJSON Features
    karnataka_features = []
    for cell_id, d in karnataka_grid.items():
        avg_lat = d["sum_lat"] / d["count"]
        avg_lng = d["sum_lng"] / d["count"]
        
        karnataka_features.append({
            "type": "Feature",
            "properties": {
                "accident_count": d["count"],
                "historical_risk_score": d["risk_score"],
                "fatal_count": d["fatal"],
                "grievous_count": d["grievous"],
                "simple_count": d["simple"],
                "damage_count": d["damage"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [avg_lng, avg_lat]
            }
        })
        
    karnataka_geojson = {
        "type": "FeatureCollection",
        "features": karnataka_features
    }
    
    karnataka_out = os.path.join(OUTPUT_DIR, "karnataka_risk_cells.geojson")
    with open(karnataka_out, "w", encoding="utf-8") as f:
        json.dump(karnataka_geojson, f, indent=2)
    print(f"Exported {len(karnataka_features)} aggregated Karnataka cells (from {len(karnataka_records_pool)} records) to {karnataka_out}")

    # 3. Export detailed stats JSON
    stats = {
        "total_records_read": total_records,
        "valid_coordinates": valid_coords_count,
        "invalid_or_missing_coordinates": invalid_or_missing_count,
        "excluded_shifted_rows_count": len(SHIFTED_ROW_INDICES),
        "columns": columns,
        "mysuru_audit": {
            "direct_mysuru_city_matches": direct_city_count,
            "direct_mysuru_district_matches": direct_dist_count,
            "spatial_only_matches_in_bbox": spatial_only_count,
            "total_mysuru_raw_matches": len(mysuru_records_pool),
            "duplicates_removed_by_spatial_year": mysuru_duplicates_count,
            "final_unique_mysuru_records": len(unique_mysuru_records),
            "geographic_limits": {
                "min_latitude": min_lat_mys,
                "max_latitude": max_lat_mys,
                "min_longitude": min_lng_mys,
                "max_longitude": max_lng_mys
            },
            "bounding_boxes_used": {
                "mysuru_city": MYSURU_CITY_BBOX,
                "mysuru_district": MYSURU_DIST_BBOX
            }
        },
        "karnataka_grid": {
            "grid_resolution_degrees": GRID_RESOLUTION,
            "total_pre_aggregated_records": len(karnataka_records_pool),
            "aggregated_risk_cells_count": len(karnataka_features)
        }
    }
    
    stats_out = os.path.join(OUTPUT_DIR, "accident_stats.json")
    with open(stats_out, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print(f"Exported final stats JSON database registry to {stats_out}")

if __name__ == "__main__":
    main()
