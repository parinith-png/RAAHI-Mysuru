import csv
from collections import Counter

CSV_PATH = r"C:\Users\parin\OneDrive\Desktop\react\shark\AccidentReports_UTF8.csv"

# Mysuru District Bbox
MYSURU_DIST_BBOX = {
    "min_lat": 11.75,
    "max_lat": 12.75,
    "min_lng": 75.80,
    "max_lng": 77.20
}

def main():
    raw_matches = []
    
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            district = row.get("DISTRICTNAME", "").strip()
            lat_str = row.get("Latitude", "0").strip()
            lng_str = row.get("Longitude", "0").strip()
            
            try:
                lat = float(lat_str)
                lng = float(lng_str)
                valid = (lat != 0.0 and lng != 0.0)
            except ValueError:
                valid = False
                
            if not valid:
                continue
                
            is_city = district.lower() == "mysuru city"
            is_dist = district.lower() == "mysuru dist"
            in_bbox = MYSURU_DIST_BBOX["min_lat"] <= lat <= MYSURU_DIST_BBOX["max_lat"] and MYSURU_DIST_BBOX["min_lng"] <= lng <= MYSURU_DIST_BBOX["max_lng"]
            
            if is_city or is_dist or in_bbox:
                raw_matches.append(row)
                
    print(f"Total raw Mysuru matches: {len(raw_matches)}")
    
    # 1. Outlier removal test on raw matches
    in_bounds_matches = []
    outliers_count = 0
    for r in raw_matches:
        lat = float(r["Latitude"])
        lng = float(r["Longitude"])
        # strict containment in Mysuru District Bounding Box
        in_bbox = MYSURU_DIST_BBOX["min_lat"] <= lat <= MYSURU_DIST_BBOX["max_lat"] and MYSURU_DIST_BBOX["min_lng"] <= lng <= MYSURU_DIST_BBOX["max_lng"]
        if in_bbox:
            in_bounds_matches.append(r)
        else:
            outliers_count += 1
            
    print(f"Outliers outside Mysuru District BBox: {outliers_count}")
    print(f"Remaining in-bounds matches: {len(in_bounds_matches)}")
    
    # 2. Check Crime_No representations
    crime_nos = [r["Crime_No"] for r in in_bounds_matches]
    crime_format = Counter(
        "scientific" if "e+" in val.lower() else "normal" for val in crime_nos
    )
    print(f"Crime_No representation formats: {crime_format}")
    
    # Let's inspect uniqueness
    # Rule A: Duplication by raw Crime_No + Unit + District + Year
    seen_ids = set()
    dup_ids = 0
    for r in in_bounds_matches:
        key = (r["DISTRICTNAME"], r["UNITNAME"], r["Crime_No"], r["Year"])
        if key in seen_ids:
            dup_ids += 1
        else:
            seen_ids.add(key)
    print(f"Duplicates by Crime_No key: {dup_ids} (Leaves {len(in_bounds_matches) - dup_ids} unique rows)")
    
    # Rule B: Duplication by exact Latitude + Longitude + Year + Severity
    seen_coords = set()
    dup_coords = 0
    for r in in_bounds_matches:
        key = (round(float(r["Latitude"]), 5), round(float(r["Longitude"]), 5), r["Year"], r["Severity"])
        if key in seen_coords:
            dup_coords += 1
        else:
            seen_coords.add(key)
    print(f"Duplicates by Coord+Year+Sev: {dup_coords} (Leaves {len(in_bounds_matches) - dup_coords} unique rows)")

    # Rule C: Duplication by exact full row content (all fields identical)
    seen_rows = set()
    dup_rows = 0
    for r in in_bounds_matches:
        # serialize key fields
        key = (
            r["DISTRICTNAME"], r["UNITNAME"], r["Crime_No"], r["Year"], r["RI"],
            r["Noofvehicle_involved"], r["Accident_Classification"], r["Accident_Spot"],
            r["Accident_Location"], r["Accident_SubLocation"], r["Main_Cause"],
            r["Hit_Run"], r["Severity"], r["Collision_Type"], r["Road_Character"],
            r["Road_Type"], r["Surface_Type"], r["Surface_Condition"], r["Road_Condition"],
            r["Weather"], r["Accident_Road"], r["Accident_Description"], r["Latitude"], r["Longitude"]
        )
        if key in seen_rows:
            dup_rows += 1
        else:
            seen_rows.add(key)
    print(f"Duplicates by Full Row Fields: {dup_rows} (Leaves {len(in_bounds_matches) - dup_rows} unique rows)")

if __name__ == "__main__":
    main()
