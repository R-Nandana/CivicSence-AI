import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("=== LIVE API SMOKE TEST ===")
    
    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    print(f"1. Health Check: {res.status_code}")
    assert res.status_code == 200, res.text

    # 1b. Authenticate as officer
    login_res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "officer@civicsense.org", "password": "officer123"}
    )
    print(f"1b. Officer Login: {login_res.status_code}")
    assert login_res.status_code == 200, login_res.text
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. QA Grounded Query
    res = requests.post(
        f"{BASE_URL}/api/nlp/db-qa",
        json={"question": "How many unresolved streetlight complaints are there?"},
        headers=headers
    )
    print(f"2. QA Grounded Query: {res.status_code}")
    data = res.json()
    print(f"   Answer: {data.get('answer')}")
    print(f"   Supporting records: {len(data.get('supporting_records', []))}")
    print(f"   Filters: {data.get('applied_filters')}")
    assert res.status_code == 200
    
    # 3. Vision check endpoint
    res = requests.get(f"{BASE_URL}/api/evidence/all", headers=headers)
    print(f"3. Evidence All: {res.status_code}")
    assert res.status_code == 200
    
    # 4. Related issues
    res = requests.get(f"{BASE_URL}/api/related/groups", headers=headers)
    print(f"4. Related Groups: {res.status_code}")
    assert res.status_code == 200
    
    # 5. Resolution alerts
    res = requests.get(f"{BASE_URL}/api/resolution/alerts", headers=headers)
    print(f"5. Resolution Alerts: {res.status_code}")
    assert res.status_code == 200
    
    # 7. Citizen Complaint Submission & End-to-End Pipeline
    citizen_login = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "citizen@civicsense.org", "password": "citizen123"}
    )
    assert citizen_login.status_code == 200
    c_headers = {"Authorization": f"Bearer {citizen_login.json()['access_token']}"}

    new_complaint = {
        "complaint_text": "Broken streetlights along Mount Road near Guindy Metro causing complete darkness and security risk for pedestrians for 5 days.",
        "location": "Guindy Metro, Mount Road",
        "category_override": None
    }
    submit_res = requests.post(f"{BASE_URL}/api/complaints/", json=new_complaint, headers=c_headers)
    print(f"7. Complaint Submission: {submit_res.status_code}")
    assert submit_res.status_code == 200, submit_res.text
    c_data = submit_res.json()
    cid = c_data["complaint_id"]
    print(f"   Created Complaint ID: {cid}")
    print(f"   Response keys: {list(c_data.keys())}")
    score = c_data.get('confidence_score') or (c_data.get('prediction', {}).get('confidence_score')) or 0.0
    print(f"   Predicted Category: {c_data.get('predicted_category')} ({score*100:.1f}%)")
    print(f"   Extracted Entities: {[e.get('text', '') + ' (' + e.get('entity_type', '') + ')' for e in c_data.get('extracted_entities', [])]}")
    print(f"   Issue Group ID: {c_data.get('issue_group_id')}")

    # 8. Full complaint details with timeline
    full_res = requests.get(f"{BASE_URL}/api/complaints/{cid}/full", headers=c_headers)
    print(f"8. Full Complaint with Timeline: {full_res.status_code}")
    assert full_res.status_code == 200
    timeline = full_res.json().get("timeline", [])
    print(f"   Timeline Events: {len(timeline)} events recorded")
    for evt in timeline:
        print(f"     - [{evt.get('event_type')}] {evt.get('title')}")

    print("\nALL LIVE API SMOKE TESTS & WORKFLOWS PASSED!")

if __name__ == "__main__":
    test_api()
