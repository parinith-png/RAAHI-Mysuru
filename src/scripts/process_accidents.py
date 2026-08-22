import os
import csv
import json
import random

CSV_PATH = r"C:\Users\parin\OneDrive\Desktop\react\shark\AccidentReports_UTF8.csv"
OUTPUT_DIR = r"c:\Users\parin\.gemini\antigravity\playground\volatile-kuiper\data\processed"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Bounding box bounds
MYSURU_CITY_BOUNDS = {
    "min_lat": 12.25,
    "max_lat": 12.38,
    "min_lng": 76.60,
    "max_lng": 76.72
}

MYSURU_DIST_BOUNDS = {
    "min_lat": 11.75,
    "max_lat": 12.75,
    "min_lng": 75.80,
    "max_lng": 77.20
}

KARNATAKA_BOUNDS = {
    "min_lat": 11.0,
    "max_lat": 19.0,
    "min_lng": 74.0,
    "max_lng": 79.0
}

VALID_SEVERITIES = {"Fatal", "Grievous Injury", "Simple Injury", "Damage Only", "Not Applicable"}

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
    valid_coords = 0
    invalid_or_missing_coords = 0
    
    severity_counter = {}
    district_counter = {}
    
    mysuru_city_records = 0
    mysuru_dist_records = 0
    mysuru_city_valid_coords = 0
    mysuru_dist_valid_coords = 0
    
    mysuru_features = []
    karnataka_features_pool = []
    
    columns = []

    print("Opening raw accident dataset...")
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames if reader.fieldnames else []
        
        for row in reader:
            total_records += 1
            if total_records % 50000 == 0:
                print(f"Processed {total_records} records...")
                
            district = row.get("DISTRICTNAME", "").strip()
            unit = row.get("UNITNAME", "").strip()
            severity = row.get("Severity", "").strip()
            lat_str = row.get("Latitude", "0").strip()
            lng_str = row.get("Longitude", "0").strip()
            road_name = row.get("Accident_Road", "").strip()
            year = row.get("Year", "").strip()
            
            # Count districts & severities
            district_counter[district] = district_counter.get(district, 0) + 1
            severity_counter[severity] = severity_counter.get(severity, 0) + 1
            
            is_mysuru_city = district.lower() == "mysuru city"
            is_mysuru_dist = district.lower() == "mysuru dist"
            
            if is_mysuru_city:
                mysuru_city_records += 1
            elif is_mysuru_dist:
                mysuru_dist_records += 1
                
            # Coordinate validation
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
                KARNATAKA_BOUNDS["min_lat"] <= lat <= KARNATAKA_BOUNDS["max_lat"] and 
                KARNATAKA_BOUNDS["min_lng"] <= lng <= KARNATAKA_BOUNDS["max_lng"]
            )
            
            if valid_lat_lng:
                valid_coords += 1
                
                # Check for shifted/garbage rows by ensuring severity is valid
                clean_severity = severity if severity in VALID_SEVERITIES else "Simple Injury"
                weight = get_severity_weight(clean_severity)
                
                feature = {
                    "type": "Feature",
                    "properties": {
                        "severity": weight,
                        "label": clean_severity,
                        "road": road_name or "Unknown Road",
                        "year": int(year) if year.isdigit() else 2020,
                        "district": district
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    }
                }
                
                # Filter to Mysuru City / Dist bounds
                in_mysuru_city_bbox = (
                    MYSURU_CITY_BOUNDS["min_lat"] <= lat <= MYSURU_CITY_BOUNDS["max_lat"] and
                    MYSURU_CITY_BOUNDS["min_lng"] <= lng <= MYSURU_CITY_BOUNDS["max_lng"]
                )
                
                in_mysuru_dist_bbox = (
                    MYSURU_DIST_BOUNDS["min_lat"] <= lat <= MYSURU_DIST_BOUNDS["max_lat"] and
                    MYSURU_DIST_BOUNDS["min_lng"] <= lng <= MYSURU_DIST_BOUNDS["max_lng"]
                )
                
                # Direct check or spatial check
                if is_mysuru_city or (in_mysuru_city_bbox and (is_mysuru_city or is_mysuru_dist)):
                    mysuru_features.append(feature)
                    if is_mysuru_city:
                        mysuru_city_valid_coords += 1
                elif is_mysuru_dist or in_mysuru_dist_bbox:
                    mysuru_features.append(feature)
                    if is_mysuru_dist:
                        mysuru_dist_valid_coords += 1
                        
                # Karnataka-wide pool (excluding Mysuru to keep files distinct)
                if not (is_mysuru_city or is_mysuru_dist or in_mysuru_dist_bbox):
                    karnataka_features_pool.append(feature)
            else:
                invalid_or_missing_coords += 1

    print("\n--- Data Quality Checks Complete ---")
    print(f"Total Records: {total_records}")
    print(f"Valid Coordinates (In Karnataka Bounds): {valid_coords}")
    print(f"Invalid/Missing: {invalid_or_missing_coords}")
    print(f"Mysuru City: {mysuru_city_records} total, {mysuru_city_valid_coords} with valid coords")
    print(f"Mysuru Dist: {mysuru_dist_records} total, {mysuru_dist_valid_coords} with valid coords")
    
    # 1. Output Mysuru GeoJSON (100% of Mysuru matches)
    mysuru_geojson = {
        "type": "FeatureCollection",
        "features": mysuru_features
    }
    mysuru_out_path = os.path.join(OUTPUT_DIR, "mysuru_accidents.geojson")
    with open(mysuru_out_path, "w", encoding="utf-8") as f:
        json.dump(mysuru_geojson, f, indent=2)
    print(f"Exported {len(mysuru_features)} Mysuru accident spots to {mysuru_out_path}")
    
    # 2. Output Karnataka GeoJSON
    # To avoid crashing browser page loads with 200,000+ coordinates, 
    # we take a highly optimized random sample of 8,000 points.
    sampled_karnataka = random.sample(karnataka_features_pool, min(8000, len(karnataka_features_pool)))
    karnataka_geojson = {
        "type": "FeatureCollection",
        "features": sampled_karnataka
    }
    karnataka_out_path = os.path.join(OUTPUT_DIR, "karnataka_accidents.geojson")
    with open(karnataka_out_path, "w", encoding="utf-8") as f:
        json.dump(karnataka_geojson, f, indent=2)
    print(f"Exported {len(sampled_karnataka)} sampled Karnataka accident spots to {karnataka_out_path}")
    
    # 3. Output stats report file
    stats = {
        "total_records": total_records,
        "columns": columns,
        "valid_coordinates": valid_coords,
        "invalid_or_missing_coordinates": invalid_or_missing_coords,
        "unique_severity_values": severity_counter,
        "unique_district_values": district_counter,
        "mysuru_city_records": mysuru_city_records,
        "mysuru_district_records": mysuru_dist_records,
        "mysuru_city_valid_coordinates": mysuru_city_valid_coords,
        "mysuru_district_valid_coordinates": mysuru_dist_valid_coords,
        "exported_mysuru_features": len(mysuru_features),
        "exported_karnataka_features_sampled": len(sampled_karnataka)
    }
    
    stats_out_path = os.path.join(OUTPUT_DIR, "accident_stats.json")
    with open(stats_out_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print(f"Exported quality statistics report to {stats_out_path}")

if __name__ == "__main__":
    main()
