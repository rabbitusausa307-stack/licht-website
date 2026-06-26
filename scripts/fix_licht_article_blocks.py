import json
import os
import urllib.request


service_domain = os.environ["MICROCMS_SERVICE_DOMAIN"]
api_key = os.environ["MICROCMS_API_KEY"]
endpoint = "article"
base_url = f"https://{service_domain}.microcms.io/api/v1/{endpoint}"

headers = {
    "X-MICROCMS-API-KEY": api_key,
    "Content-Type": "application/json; charset=utf-8",
}

LICHT_BLOCK = '<h2>LICHTについて</h2><p>LICHTは、地方国公立大学を目指す高校生のための受験専門塾です。志望校合格から逆算して、今やるべき勉強を明確にし、一人ひとりに合わせた学習計画と面談で合格まで伴走します。</p><p>LICHTの大きな特徴は、ただ先生の説明を聞くだけの授業ではなく、生徒自身が「なぜそうなるのか」を説明する逆授業を取り入れていることです。問題の解き方を聞いて終わるのではなく、自分の言葉で説明することで、理解の浅い部分や曖昧な知識がはっきりします。</p><p>受験勉強では、「わかったつもり」が一番危険です。LICHTでは、逆授業を通して本当に理解できているかを確認しながら、共通テスト・二次試験・推薦入試に必要な力を着実に伸ばしていきます。</p><p>勉強のやり方がわからない人、頑張っているのに成績が伸びない人、地方国公立大学に本気で合格したい人に向けて、LICHTは戦略と対話で受験をサポートします。</p><p><a href="https://licht-juku.com/">LICHT公式サイト</a></p>'


def request_json(url, method="GET", payload=None):
    data = None
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as response:
        body = response.read().decode("utf-8")
        return response.status, json.loads(body) if body else {}


def find_licht_footer_start(body):
    markers = [
        ">LICHTについて</h2>",
        ">LICHT????</h2>",
        ">LICHT?????</h2>",
    ]
    positions = [body.find(marker) for marker in markers]
    positions = [position for position in positions if position >= 0]
    if not positions:
        return -1
    marker_position = min(positions)
    return body.rfind("<h2", 0, marker_position)


_, data = request_json(f"{base_url}?limit=100&fields=id,title,slug,body")
results = []

for article in data.get("contents", []):
    body = article.get("body") or ""
    footer_start = find_licht_footer_start(body)
    cleaned_body = body[:footer_start].rstrip() if footer_start >= 0 else body.rstrip()
    next_body = cleaned_body + LICHT_BLOCK
    status, _ = request_json(f"{base_url}/{article['id']}", method="PATCH", payload={"body": next_body})
    results.append({
        "slug": article["slug"],
        "status": "updated",
        "removedFooter": footer_start >= 0,
        "http": status,
    })

print(json.dumps(results, ensure_ascii=False, indent=2))
