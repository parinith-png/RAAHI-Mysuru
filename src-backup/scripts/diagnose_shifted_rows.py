import csv
import json

CSV_PATH = r"C:\Users\parin\OneDrive\Desktop\react\shark\AccidentReports_UTF8.csv"
VALID_SEVERITIES = {"Fatal", "Grievous Injury", "Simple Injury", "Damage Only", "Not Applicable"}

def main():
    shifted_rows = []
    print("Scanning CSV for shifted rows...")
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            severity = row.get("Severity", "").strip()
            if severity not in VALID_SEVERITIES:
                shifted_rows.append({
                    "row_index": idx + 2, # Account for header and 0-indexing
                    "district": row.get("DISTRICTNAME", ""),
                    "unit": row.get("UNITNAME", ""),
                    "crime_no": row.get("Crime_No", ""),
                    "year": row.get("Year", ""),
                    "severity": severity,
                    "raw_row_keys_values": {k: v for k, v in row.items() if v != "" and k in ["DISTRICTNAME", "UNITNAME", "Crime_No", "Year", "Severity", "Latitude", "Longitude"]}
                })
                if len(shifted_rows) >= 20: # Cap
                    break
                    
    print(f"Found {len(shifted_rows)} shifted rows:")
    print(json.dumps(shifted_rows, indent=2))

if __name__ == "__main__":
    main()
