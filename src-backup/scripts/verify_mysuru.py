import csv

CSV_PATH = r"C:\Users\parin\OneDrive\Desktop\react\shark\AccidentReports_UTF8.csv"

# Bounding boxes
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

def main():
    direct_city = 0
    direct_dist = 0
    spatial_only = 0
    records_in_export = []
    
    seen_crime_nos = set()
    duplicates_crime_no = 0
    
    seen_coords_time = set()
    duplicates_coords_time = 0

    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            district = row.get("DISTRICTNAME", "").strip()
            unit = row.get("UNITNAME", "").strip()
            lat_str = row.get("Latitude", "0").strip()
            lng_str = row.get("Longitude", "0").strip()
            crime_no = row.get("Crime_No", "").strip()
            year = row.get("Year", "").strip()
            timestamp = row.get("timestamp", "").strip() # if any
            
            is_city_match = district.lower() == "mysuru city"
            is_dist_match = district.lower() == "mysuru dist"
            
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
                continue
                
            in_city_bbox = MYSURU_CITY_BBOX["min_lat"] <= lat <= MYSURU_CITY_BBOX["max_lat"] and MYSURU_CITY_BBOX["min_lng"] <= lng <= MYSURU_CITY_BBOX["max_lng"]
            in_dist_bbox = MYSURU_DIST_BBOX["min_lat"] <= lat <= MYSURU_DIST_BBOX["max_lat"] and MYSURU_DIST_BBOX["min_lng"] <= lng <= MYSURU_DIST_BBOX["max_lng"]
            
            is_mysuru_related = is_city_match or is_dist_match or in_dist_bbox
            
            if is_mysuru_related:
                # Classify match origin
                type_label = ""
                if is_city_match:
                    direct_city += 1
                    type_label = "direct_city"
                elif is_dist_match:
                    direct_dist += 1
                    type_label = "direct_dist"
                elif in_dist_bbox:
                    spatial_only += 1
                    type_label = "spatial_only"
                
                # Check duplicates by crime no
                crime_key = f"{district}_{unit}_{crime_no}_{year}"
                is_dup_crime = False
                if crime_key in seen_crime_nos:
                    duplicates_crime_no += 1
                    is_dup_crime = True
                else:
                    seen_crime_nos.add(crime_key)
                    
                # Check duplicates by exact coordinates & attributes
                coord_key = f"{lat}_{lng}_{year}"
                is_dup_coord = False
                if coord_key in seen_coords_time:
                    duplicates_coords_time += 1
                    is_dup_coord = True
                else:
                    seen_coords_time.add(coord_key)
                    
                records_in_export.append({
                    "lat": lat,
                    "lng": lng,
                    "district": district,
                    "unit": unit,
                    "crime_no": crime_no,
                    "year": year,
                    "type": type_label,
                    "is_duplicate": is_dup_crime or is_dup_coord
                })
                
    # Deduplicate records by crime_key or coordinate_key
    # We will deduplicate by unique crime_key if crime_no is present
    unique_records = []
    seen_unique = set()
    for r in records_in_export:
        k = f"{r['district']}_{r['unit']}_{r['crime_no']}_{r['year']}"
        if k not in seen_unique:
            seen_unique.add(k)
            unique_records.append(r)
            
    # Min/max boundaries
    if unique_records:
        min_lat = min(r["lat"] for r in unique_records)
        max_lat = max(r["lat"] for r in unique_records)
        min_lng = min(r["lng"] for r in unique_records)
        max_lng = max(r["lng"] for r in unique_records)
    else:
        min_lat = max_lat = min_lng = max_lng = 0.0

    print("--- MYSURU AUDIT RESULTS ---")
    print(f"Direct Mysuru City Matches: {direct_city}")
    print(f"Direct Mysuru District Matches: {direct_dist}")
    print(f"Spatial-Only Matches (coords fall in bounding box but district is not Mysuru): {spatial_only}")
    print(f"Total Raw Matches: {len(records_in_export)}")
    print(f"Duplicates by Crime No Key: {duplicates_crime_no}")
    print(f"Duplicates by Coordinates + Year: {duplicates_coords_time}")
    print(f"Final Mapped Unique Records: {len(unique_records)}")
    print(f"Bounding limits of Unique Mapped Records:")
    print(f"  Min Latitude: {min_lat}")
    print(f"  Max Latitude: {max_lat}")
    print(f"  Min Longitude: {min_lng}")
    print(f"  Max Longitude: {max_lng}")
    print(f"Bounding Box Config used:")
    print(f"  Mysuru City Bounding Box: {MYSURU_CITY_BBOX}")
    print(f"  Mysuru District Bounding Box: {MYSURU_DIST_BBOX}")

if __name__ == "__main__":
    main()
